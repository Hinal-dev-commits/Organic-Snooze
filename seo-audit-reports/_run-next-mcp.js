const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const callsDir = path.join(__dirname, "_calls");
const donePath = path.join(__dirname, "_publish-done.json");
const emitPath = path.join(__dirname, "_emit-out.json");
const resultsPath = path.join(__dirname, "_publish-results.json");

const MUTATION = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

const done = JSON.parse(fs.readFileSync(donePath, "utf8"));
const files = fs.readdirSync(callsDir).filter((f) => f.endsWith(".json")).sort();
const remaining = files.filter((f) => !done.succeeded.includes(f));

const results = {
  attempted: 13,
  succeeded: done.succeeded.length,
  failed: (done.failures || []).length,
  failures: done.failures || [],
};

if (remaining.length === 0) {
  results.succeeded = done.succeeded.length;
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ complete: true, results }));
  process.exit(0);
}

console.log(
  JSON.stringify({
    complete: false,
    remaining: remaining.length,
    next: remaining[0],
    emitPath,
    results,
  })
);
