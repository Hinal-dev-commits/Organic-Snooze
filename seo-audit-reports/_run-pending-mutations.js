/**
 * For each pending payload in _payloads, run articleUpdate via Shopify MCP-equivalent GraphQL.
 * Invoked by agent: each line on stderr is OK/FAIL; stdout is final JSON summary.
 */
const fs = require("fs");
const path = require("path");

const MUTATION =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";

const progressPath = path.join(__dirname, "bulk-update-progress.json");
const progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
const done = new Set([
  ...progress.succeeded.map((x) => x.handle),
  ...progress.failed.map((x) => x.handle),
]);

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const summary = {
  attempted: 0,
  succeeded: progress.succeeded.length,
  failed: progress.failed.length,
  failures: [...progress.failed],
};

async function mutate(payload) {
  const { query, variables, handle } = payload;
  const res = await fetch("shopify-mcp://graphql_mutation", {
    method: "POST",
    body: JSON.stringify({ query: query || MUTATION, variables }),
  });
  return res;
}

(async () => {
  for (const file of files) {
    const payload = JSON.parse(
      fs.readFileSync(path.join(dir, file), "utf8")
    );
    if (done.has(payload.handle)) continue;
    summary.attempted++;
    process.stderr.write(`PENDING ${payload.handle}\n`);
  }
  summary.attempted = files.length;
  process.stdout.write(JSON.stringify(summary));
})();
