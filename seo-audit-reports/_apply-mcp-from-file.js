/**
 * Usage: node _apply-mcp-from-file.js <path-to-{query,variables,handle}.json>
 * Prints compact result line for agent aggregation.
 * Does NOT call Shopify — agent must CallDynamicTool graphql_mutation with file contents.
 */
const fs = require("fs");
const p = process.argv[2];
const j = JSON.parse(fs.readFileSync(p, "utf8"));
process.stdout.write(
  JSON.stringify({
    handle: j.handle,
    query: j.query,
    variables: j.variables,
    bytes: fs.statSync(p).size,
  })
);
