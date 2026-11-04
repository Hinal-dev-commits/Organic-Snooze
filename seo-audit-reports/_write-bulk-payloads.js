const fs = require("fs");
const path = require("path");
const manifestPath = path.join(__dirname, "bulk-redirect-update-manifest.json");
const m = require(manifestPath);
const query =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";
const out = m.updates
  .map((u) =>
    JSON.stringify({
      id: u.id,
      handle: u.handle,
      query,
      variables: { id: u.id, article: { body: u.body } },
    })
  )
  .join("\n");
fs.writeFileSync(path.join(__dirname, "_bulk-mutation-payloads.jsonl"), out);
console.log("written", m.updates.length, "lines");
