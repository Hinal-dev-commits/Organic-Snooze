/**
 * Execute graphql_mutation args from a JSON file {query, variables}.
 * Uses SHOPIFY_STORE + SHOPIFY_ADMIN_TOKEN when set.
 */
const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node _mcp-execute-json-file.js <path-to-{query,variables}.json>");
  process.exit(1);
}
const { query, variables } = JSON.parse(fs.readFileSync(file, "utf8"));
const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP;
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
if (!store || !token) {
  console.error(JSON.stringify({ error: "Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN" }));
  process.exit(2);
}
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;

(async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  process.stdout.write(JSON.stringify(json));
})();
