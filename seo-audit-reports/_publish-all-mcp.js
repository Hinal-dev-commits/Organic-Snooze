const fs = require("fs");
const path = require("path");

const callsDir = path.join(__dirname, "_calls");
const donePath = path.join(__dirname, "_publish-done.json");
const logPath = path.join(__dirname, "_publish-log.jsonl");

const done = JSON.parse(fs.readFileSync(donePath, "utf8"));
const files = fs.readdirSync(callsDir).filter((f) => f.endsWith(".json")).sort();
const remaining = files.filter((f) => !done.succeeded.includes(f));

if (remaining.length === 0) {
  console.log(JSON.stringify({ done: true }));
  process.exit(0);
}

const next = remaining[0];
const call = JSON.parse(fs.readFileSync(path.join(callsDir, next), "utf8"));
fs.writeFileSync(
  path.join(__dirname, "_emit-out.json"),
  JSON.stringify({ query: call.query, variables: call.variables })
);
console.log(JSON.stringify({ next, handle: next.replace(/^\d+-/, "").replace(/\.json$/, "") }));
