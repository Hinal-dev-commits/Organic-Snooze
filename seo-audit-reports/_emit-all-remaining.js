const fs = require("fs");
const path = require("path");

const callsDir = path.join(__dirname, "_calls");
const donePath = path.join(__dirname, "_publish-done.json");
const outDir = path.join(__dirname, "_emit-batch");
fs.mkdirSync(outDir, { recursive: true });

const done = JSON.parse(fs.readFileSync(donePath, "utf8"));
const files = fs.readdirSync(callsDir).filter((f) => f.endsWith(".json")).sort();
const remaining = files.filter((f) => !done.succeeded.includes(f));

for (const file of remaining) {
  const call = JSON.parse(fs.readFileSync(path.join(callsDir, file), "utf8"));
  fs.writeFileSync(
    path.join(outDir, file),
    JSON.stringify({ query: call.query, variables: call.variables })
  );
}
console.log(remaining.join("\n"));
