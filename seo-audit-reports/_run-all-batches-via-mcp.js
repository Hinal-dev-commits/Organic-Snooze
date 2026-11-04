/**
 * Orchestrator: prints one line per batch with path to {query,variables} for MCP.
 * Agent or wrapper calls graphql_mutation per batch file.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "_batches");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const out = path.join(__dirname, "_batches", f.replace(".json", ".mcp.json"));
  fs.writeFileSync(out, JSON.stringify({ query: b.query, variables: b.variables, handles: b.handles }));
  console.log(out);
}
