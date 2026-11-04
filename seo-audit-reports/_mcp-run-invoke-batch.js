/**
 * Run one pending-run batch invoke file through Shopify Admin GraphQL.
 * Token: SHOPIFY_ADMIN_TOKEN + SHOPIFY_STORE (same as _run-all-mcp-style.js).
 * If missing, exits 2 and prints {needMcp:true, batch:N}.
 */
const fs = require("fs");
const path = require("path");

const batch = process.argv[2];
const invokePath = path.join(
  __dirname,
  "_batch-results/pending-run",
  `_invoke-${batch}-utf8.json`
);
const metaPath = path.join(
  __dirname,
  "_batch-results/pending-run",
  `mcp-batch-${batch}.json`
);

const invoke = JSON.parse(fs.readFileSync(invokePath, "utf8"));
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP;
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;

if (!store || !token) {
  console.log(
    JSON.stringify({
      needMcp: true,
      batch: Number(batch),
      handles: meta.handles,
      invokePath,
    })
  );
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
    body: JSON.stringify({
      query: invoke.query,
      variables: invoke.variables,
    }),
  });
  const json = await res.json();
  const outPath = path.join(
    __dirname,
    "_batch-results/pending-run",
    `result-${batch}.json`
  );
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
  console.log(JSON.stringify({ batch: Number(batch), ok: !json.errors?.length }));
})();
