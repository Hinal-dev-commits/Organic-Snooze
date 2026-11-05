/**
 * Reads _bulk-mutation-payloads.jsonl and POSTs each line to Shopify Admin GraphQL.
 * Requires SHOPIFY_STORE (e.g. store.myshopify.com) and SHOPIFY_ADMIN_TOKEN.
 */
const fs = require("fs");
const path = require("path");

const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
if (!store || !token) {
  console.error("Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN");
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${store.replace(/^https?:\/\//, "")}/admin/api/${apiVersion}/graphql.json`;

const lines = fs
  .readFileSync(path.join(__dirname, "_bulk-mutation-payloads.jsonl"), "utf8")
  .trim()
  .split("\n");

const summary = {
  attempted: lines.length,
  succeeded: 0,
  failed: 0,
  failures: [],
};

async function runOne(line) {
  const payload = JSON.parse(line);
  const { query, variables, handle } = payload;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    summary.failed++;
    summary.failures.push({
      handle,
      message: `HTTP ${res.status}: ${text.slice(0, 500)}`,
    });
    return;
  }
  if (json.errors?.length) {
    summary.failed++;
    summary.failures.push({
      handle,
      message: json.errors.map((e) => e.message).join("; "),
    });
    return;
  }
  const ue = json.data?.articleUpdate?.userErrors || [];
  if (ue.length) {
    summary.failed++;
    summary.failures.push({
      handle,
      message: ue.map((e) => e.message).join("; "),
    });
    return;
  }
  if (!json.data?.articleUpdate?.article) {
    summary.failed++;
    summary.failures.push({ handle, message: "No article in response" });
    return;
  }
  summary.succeeded++;
}

(async () => {
  for (const line of lines) {
    await runOne(line);
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(JSON.stringify(summary, null, 2));
})();
