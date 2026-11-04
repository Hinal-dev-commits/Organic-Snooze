/**
 * Emit one payload per line as JSON {index, handle, query, variables} for MCP ArticleUpdate.
 * Usage: node _run-payload-mcp.js 3 4 5
 *        node _run-payload-mcp.js --pending  (indices not in _batch-results/single-ok.json)
 */
const fs = require("fs");
const path = require("path");
const payloadsDir = path.join(__dirname, "_payloads");
const okPath = path.join(__dirname, "_batch-results", "single-ok.json");
const ok = fs.existsSync(okPath) ? JSON.parse(fs.readFileSync(okPath, "utf8")) : { handles: [] };
const okSet = new Set(ok.handles || []);

function emit(i) {
  const file = path.join(payloadsDir, String(i).padStart(2, "0") + ".json");
  const p = JSON.parse(fs.readFileSync(file, "utf8"));
  if (okSet.has(p.handle)) return;
  process.stdout.write(
    JSON.stringify({
      index: i,
      handle: p.handle,
      query: p.query,
      variables: p.variables,
    }) + "\n"
  );
}

const args = process.argv.slice(2);
if (args[0] === "--pending") {
  for (let i = 0; i < 53; i++) emit(i);
} else if (args.length) {
  for (const a of args) emit(Number(a));
} else {
  console.error("Usage: node _run-payload-mcp.js <index...> | --pending");
  process.exit(1);
}
