/**
 * For each _batches/batch-XX.mcp.json, emit one JSON line:
 * { batch, handles, query, variables }
 * Parent agent should call graphql_mutation per line (same as 53 individual updates).
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "_batches");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mcp.json")).sort();
const resultsDir = path.join(__dirname, "_batch-results");
fs.mkdirSync(resultsDir, { recursive: true });

for (const f of files) {
  const batch = f.replace(".mcp.json", "").replace("batch-", "");
  const payload = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  process.stdout.write(
    JSON.stringify({
      batch,
      handles: payload.handles,
      query: payload.query,
      variables: payload.variables,
    }) + "\n"
  );
}
