/** Print {query,variables,handle} for split index NN (agent → graphql_mutation). */
const fs = require("fs");
const path = require("path");
const n = process.argv[2];
if (!n) {
  console.error("Usage: node _run-one-split-mcp.js <03|23|...>");
  process.exit(1);
}
const dir = path.join(__dirname, "_batch-results/pending-run");
const j = JSON.parse(fs.readFileSync(path.join(dir, "_split", `${n}-vars.json`), "utf8"));
const mcpSingle = path.join(dir, "mcp-single", `${n}.json`);
let handle = n;
if (fs.existsSync(mcpSingle)) {
  handle = JSON.parse(fs.readFileSync(mcpSingle, "utf8")).handle;
}
process.stdout.write(JSON.stringify({ query: j.query, variables: j.variables, handle, n }));
