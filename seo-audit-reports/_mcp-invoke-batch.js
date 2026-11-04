// Prints JSON {query, variables, handles, batch} for MCP graphql_mutation
const fs = require("fs");
const path = require("path");
const batch = process.argv[2];
if (batch === undefined) {
  console.error("Usage: node _mcp-invoke-batch.js <batchNumber>");
  process.exit(1);
}
const dir = path.join(__dirname, "_batch-results");
const payload = JSON.parse(
  fs.readFileSync(path.join(dir, `mcp-batch-${batch}-full.json`), "utf8")
);
const pending = JSON.parse(
  fs.readFileSync(path.join(dir, `pending-${batch}.json`), "utf8")
);
process.stdout.write(
  JSON.stringify({
    batch: Number(batch),
    handles: pending.handles,
    query: payload.query,
    variables: payload.variables,
  })
);
