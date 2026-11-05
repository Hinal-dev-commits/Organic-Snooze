/**
 * Agent helper: prints one JSON line per pending mcp-single file path.
 * Agent calls graphql_mutation for each file (query + variables from file).
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "_batch-results/pending-run/mcp-single");
let okHandles = new Set();
const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
if (fs.existsSync(sessionPath)) {
  const s = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  for (const x of s.ok || []) okHandles.add(x.handle);
}
const extra = [
  "dust-mites-mattress-organic-latex-wool",
  "gary-breckas-take-on-organic-pillows-and-every-option-we-carry",
];
extra.forEach((h) => okHandles.add(h));

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (okHandles.has(p.handle)) continue;
  process.stdout.write(
    JSON.stringify({ file: path.join(dir, f), handle: p.handle }) + "\n"
  );
}
