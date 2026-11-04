const fs = require("fs");
const path = require("path");

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "bulk-redirect-update-manifest.json"), "utf8")
);
const updates = manifest.updates.filter((u) => u.kind === "article");
const okHandles = new Set();

const singleOk = path.join(__dirname, "_batch-results", "single-ok.json");
if (fs.existsSync(singleOk)) {
  for (const h of JSON.parse(fs.readFileSync(singleOk, "utf8")).handles || []) {
    okHandles.add(h);
  }
}

const resultsDir = path.join(__dirname, "_batch-results");
for (const f of fs.readdirSync(resultsDir)) {
  if (!/^batch-\d+\.json$/.test(f)) continue;
  const r = JSON.parse(fs.readFileSync(path.join(resultsDir, f), "utf8"));
  for (const x of r.ok || []) okHandles.add(x.handle);
}

const extra = process.argv.slice(2);
for (const h of extra) okHandles.add(h);

const failures = [];
let succeeded = 0;
for (const u of updates) {
  if (okHandles.has(u.handle)) succeeded++;
  else failures.push({ handle: u.handle, message: "Not updated in this run" });
}

const summary = {
  attempted: updates.length,
  succeeded,
  failed: failures.length,
  failures,
};
const outPath = path.join(__dirname, "bulk-update-results.json");
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
process.stdout.write(JSON.stringify(summary));
