/** Print {query,variables} JSON for MCP from _one-NN.json */
const fs = require("fs");
const path = require("path");
const n = process.argv[2];
const j = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "_batch-results/pending-run", `_one-${n}.json`),
    "utf8"
  )
);
process.stdout.write(JSON.stringify({ query: j.query, variables: j.variables }));
