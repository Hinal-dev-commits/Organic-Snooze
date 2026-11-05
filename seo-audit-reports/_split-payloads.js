const fs = require("fs");
const path = require("path");
const payloads = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_batch-payloads.json"), "utf8")
);
const outDir = path.join(__dirname, "_payloads");
fs.mkdirSync(outDir, { recursive: true });
for (const p of payloads) {
  fs.writeFileSync(path.join(outDir, p.file), JSON.stringify({ id: p.id, article: p.article }));
}
console.log("split", payloads.length);
