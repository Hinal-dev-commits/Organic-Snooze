/**
 * Invokes graphql_mutation for each _payloads/*.json via Cursor dynamic MCP over stdio.
 * Requires CURSOR_MCP_SHOPIFY=1 and running inside Cursor agent context — otherwise no-op.
 *
 * Fallback: prints JSON lines {index, handle, query, variables} for agent replay.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const start = parseInt(process.argv[2] || "0", 10);
const end = parseInt(process.argv[3] || String(files.length - 1), 10);

const summary = { attempted: 0, succeeded: 0, failed: 0, failures: [] };

const MUTATION =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";

for (let i = start; i <= end && i < files.length; i++) {
  const payload = JSON.parse(
    fs.readFileSync(path.join(dir, files[i]), "utf8")
  );
  summary.attempted++;
  // Agent must CallDynamicTool graphql_mutation with payload.query and payload.variables
  process.stdout.write(
    JSON.stringify({
      index: i,
      handle: payload.handle,
      query: payload.query || MUTATION,
      variables: payload.variables,
    }) + "\n"
  );
}

process.stderr.write(JSON.stringify(summary) + "\n");
