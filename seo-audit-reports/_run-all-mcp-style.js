/**
 * Process all article updates from _payloads/*.json and write bulk-update-results.json.
 * Uses Shopify Admin GraphQL (same mutation as graphql_mutation MCP).
 * Requires SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN in environment.
 */
const fs = require("fs");
const path = require("path");

const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
if (!store || !token) {
  console.error(
    JSON.stringify({
      error: "Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
    })
  );
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${store.replace(/^https?:\/\//, "")}/admin/api/${apiVersion}/graphql.json`;

const dir = path.join(__dirname, "_payloads");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const summary = {
  attempted: files.length,
  succeeded: 0,
  failed: 0,
  failures: [],
};

async function runOne(file) {
  const payload = JSON.parse(
    fs.readFileSync(path.join(dir, file), "utf8")
  );
  const { query, variables, handle } = payload;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) {
      summary.failed++;
      summary.failures.push({
        handle,
        message: json.errors.map((e) => e.message).join("; "),
      });
      console.error(`FAIL ${handle}: ${summary.failures.at(-1).message}`);
      return;
    }
    const ue = json.data?.articleUpdate?.userErrors || [];
    if (ue.length) {
      summary.failed++;
      summary.failures.push({
        handle,
        message: ue.map((e) => e.message).join("; "),
      });
      console.error(`FAIL ${handle}: ${summary.failures.at(-1).message}`);
      return;
    }
    if (!json.data?.articleUpdate?.article) {
      summary.failed++;
      summary.failures.push({ handle, message: "No article in response" });
      console.error(`FAIL ${handle}: No article in response`);
      return;
    }
    summary.succeeded++;
    console.error(`OK ${handle}`);
  } catch (err) {
    summary.failed++;
    summary.failures.push({ handle, message: String(err.message || err) });
    console.error(`FAIL ${handle}: ${err.message}`);
  }
}

(async () => {
  for (const file of files) {
    await runOne(file);
    await new Promise((r) => setTimeout(r, 250));
  }
  const outPath = path.join(__dirname, "bulk-update-results.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
})();
