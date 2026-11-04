/**
 * Reads _tmp-batch/*.json and applies articleUpdate via Shopify Admin GraphQL.
 * Uses same credentials as Shopify MCP (OAuth tokens in Cursor) — NOT available to Node.
 * This script only validates payloads and prints summary shape for dry-run.
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "_tmp-batch");
if (!fs.existsSync(dir)) {
  console.log(JSON.stringify({ error: "no batch dir", attempted: 0, succeeded: 0, failed: 0, failures: [] }));
  process.exit(1);
}
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
console.log(
  JSON.stringify({
    dryRun: true,
    count: files.length,
    handles: files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).handle),
  })
);
