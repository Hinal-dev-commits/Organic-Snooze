const fs = require("fs");
const path = require("path");

const resultsDir = process.argv[2] || path.join(__dirname, "_batch-results");
const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json")).sort();

const summary = { attempted: 53, succeeded: 0, failed: 0, failures: [] };

for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(resultsDir, f), "utf8"));
  for (const h of r.ok || []) summary.succeeded++;
  for (const fail of r.fail || []) {
    summary.failed++;
    summary.failures.push(fail);
  }
}

process.stdout.write(JSON.stringify(summary, null, 2));
