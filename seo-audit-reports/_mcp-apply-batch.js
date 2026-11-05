/** Read call-args for pending-run batch N; print {query, variables, handles} for MCP. */
const fs = require("fs");
const path = require("path");
const n = process.argv[2];
const batchPath = path.join(
  __dirname,
  "_batch-results/pending-run",
  `mcp-batch-${n}.json`
);
const b = JSON.parse(fs.readFileSync(batchPath, "utf8"));
process.stdout.write(
  JSON.stringify({ query: b.query, variables: b.variables, handles: b.handles })
);
