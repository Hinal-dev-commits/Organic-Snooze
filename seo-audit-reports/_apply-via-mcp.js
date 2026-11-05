// Outputs mutation requests as NDJSON for agent processing
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "pending-13-mutations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const mutation =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";
for (const file of files) {
  const variables = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  console.log(JSON.stringify({ file, mutation, variables }));
}
