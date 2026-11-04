const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const mutation =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";
const items = files.map((file) => ({
  file,
  variables: JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")),
}));
fs.writeFileSync(
  path.join(__dirname, "_mutation-queue.json"),
  JSON.stringify({ mutation, items })
);
console.log("queue", items.length);
