/** Build single-article MCP args from mcp-single/NN.json */
const fs = require("fs");
const path = require("path");
const file = process.argv[2];
const j = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "_batch-results/pending-run/mcp-single", file),
    "utf8"
  )
);
process.stdout.write(JSON.stringify({ query: j.query, variables: j.variables, handle: j.handle }));
