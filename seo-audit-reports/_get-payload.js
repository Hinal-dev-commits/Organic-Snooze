const fs = require("fs");
const path = require("path");
const idx = parseInt(process.argv[2], 10);
const lines = fs
  .readFileSync(path.join(__dirname, "_bulk-mutation-payloads.jsonl"), "utf8")
  .trim()
  .split("\n");
if (idx < 0 || idx >= lines.length) {
  console.error("index out of range", idx, lines.length);
  process.exit(1);
}
process.stdout.write(lines[idx]);
