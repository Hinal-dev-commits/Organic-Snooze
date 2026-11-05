const fs = require("fs");
const path = require("path");

const pendingDir = path.join(__dirname, "pending-13-mutations");
const tmpDir = path.join(__dirname, "_tmp");
const donePath = path.join(__dirname, "_publish-done.json");

const mutation = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

const files = fs
  .readdirSync(pendingDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const done = fs.existsSync(donePath)
  ? JSON.parse(fs.readFileSync(donePath, "utf8"))
  : { succeeded: [] };

const remaining = files.filter((f) => !done.succeeded.includes(f));
if (remaining.length === 0) {
  console.log(JSON.stringify({ done: true }));
  process.exit(0);
}

const file = remaining[0];
const variables = JSON.parse(fs.readFileSync(path.join(tmpDir, file), "utf8"));
console.log(
  JSON.stringify({
    file,
    handle: file.replace(/^\d+-/, "").replace(/\.json$/, ""),
    mutation,
    variables,
  })
);
