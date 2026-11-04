/**
 * Reads mcp-batch-{n}-full.json and pending-{n}.json.
 * Writes MCP-ready args to _batch-results/mcp-args-{n}.json (if missing).
 * Prints batch number and handle list for logging.
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "_batch-results");
const batches = process.argv.slice(2).map(Number);
if (!batches.length) {
  for (let b = 0; b <= 8; b++) batches.push(b);
}
for (const b of batches) {
  const full = path.join(dir, `mcp-batch-${b}-full.json`);
  const argsPath = path.join(dir, `mcp-args-${b}.json`);
  if (!fs.existsSync(full)) {
    console.error("Missing", full);
    continue;
  }
  const payload = JSON.parse(fs.readFileSync(full, "utf8"));
  fs.writeFileSync(argsPath, JSON.stringify({ query: payload.query, variables: payload.variables }));
  const pending = JSON.parse(fs.readFileSync(path.join(dir, `pending-${b}.json`), "utf8"));
  console.log(JSON.stringify({ batch: b, handles: pending.handles, argsPath }));
}
