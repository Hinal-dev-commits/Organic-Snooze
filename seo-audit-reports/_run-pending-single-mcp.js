/**
 * Run one pending payload index via stdin JSON from MCP result aggregator.
 * Usage: node _run-pending-single-mcp.js 03
 * Prints {query, variables, handle} for graphql_mutation.
 */
const fs = require("fs");
const path = require("path");
const idx = process.argv[2];
const file = path.join(__dirname, "_payloads", `${idx.padStart(2, "0")}.json`);
const p = JSON.parse(fs.readFileSync(file, "utf8"));
process.stdout.write(
  JSON.stringify({ query: p.query, variables: p.variables, handle: p.handle })
);
