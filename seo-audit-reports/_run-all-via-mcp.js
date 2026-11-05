const fs = require("fs");
const path = require("path");

const MUTATION =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const progressPath = path.join(__dirname, "bulk-update-progress.json");

let progress = { succeeded: [], failed: [] };
if (fs.existsSync(progressPath)) {
  progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
}

const doneHandles = new Set([
  ...progress.succeeded.map((x) => x.handle),
  ...progress.failed.map((x) => x.handle),
]);

const pending = [];
for (const file of files) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  if (!doneHandles.has(p.handle)) {
    pending.push({
      file,
      handle: p.handle,
      query: p.query || MUTATION,
      variables: p.variables,
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, "_pending-mutations.json"),
  JSON.stringify(pending, null, 2)
);
console.log(
  JSON.stringify({
    total: files.length,
    alreadyDone: doneHandles.size,
    pending: pending.length,
    pendingHandles: pending.map((p) => p.handle),
  })
);
