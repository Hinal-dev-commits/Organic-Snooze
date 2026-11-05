const fs = require("fs");
const path = require("path");

const batchDir = path.join(__dirname, "_emit-batch");
const donePath = path.join(__dirname, "_publish-done.json");
const query = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

const done = JSON.parse(fs.readFileSync(donePath, "utf8"));
const files = fs.readdirSync(batchDir).filter((f) => f.endsWith(".json")).sort();

for (const file of files) {
  if (done.succeeded.includes(file)) continue;
  const payload = JSON.parse(fs.readFileSync(path.join(batchDir, file), "utf8"));
  fs.writeFileSync(
    path.join(__dirname, "_one-mcp.json"),
    JSON.stringify({ query: payload.query || query, variables: payload.variables })
  );
  console.log(file);
  process.exit(0);
}
console.log("ALL_DONE");
