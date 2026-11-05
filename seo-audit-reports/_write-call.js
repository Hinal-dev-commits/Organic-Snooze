const fs = require("fs");
const path = require("path");
const tmpDir = path.join(__dirname, "_tmp");
const outDir = path.join(__dirname, "_calls");
fs.mkdirSync(outDir, { recursive: true });
const query = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;
const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const variables = JSON.parse(fs.readFileSync(path.join(tmpDir, f), "utf8"));
  fs.writeFileSync(
    path.join(outDir, f),
    JSON.stringify({ query, variables, file: f })
  );
}
console.log("wrote", files.length);
