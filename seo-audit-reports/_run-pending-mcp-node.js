/**
 * Apply all pending article updates via Shopify Admin GraphQL.
 * Uses same credentials as Shopify MCP (SHOPIFY_STORE + SHOPIFY_ADMIN_TOKEN).
 */
const fs = require("fs");
const path = require("path");

const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP;
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
if (!store || !token) {
  console.error(JSON.stringify({ error: "Missing Shopify credentials in env" }));
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;

const singleOk = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_batch-results/single-ok.json"), "utf8")
).handles;
const sessionExtra = [
  "the-best-organic-mattress-you-wont-find-in-amazons-prime-sale",
  "do-cooling-sheets-actually-work-heres-what-to-look-for",
  "you-spend-one-third-of-your-life-asleep-heres-why-that-changes-everything",
  "dust-mites-mattress-organic-latex-wool",
];
const okSet = new Set([...singleOk, ...sessionExtra]);

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const summary = { attempted: files.length, succeeded: 0, failed: 0, failures: [] };

async function runOne(file) {
  const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const { query, variables, handle } = payload;
  if (okSet.has(handle)) {
    summary.succeeded++;
    return;
  }
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
    okSet.add(handle);
  } catch (err) {
    summary.failed++;
    summary.failures.push({ handle, message: String(err.message || err) });
  }
}

(async () => {
  for (const file of files) {
    await runOne(file);
  }
  fs.writeFileSync(
    path.join(__dirname, "bulk-update-results.json"),
    JSON.stringify(summary, null, 2)
  );
  console.log(JSON.stringify(summary));
})();
