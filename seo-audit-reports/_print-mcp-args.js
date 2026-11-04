const fs = require("fs");
const path = require("path");
const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const dir = path.join(__dirname, "_payloads");
const out = [];
for (let i = start; i <= end; i++) {
  const file = path.join(dir, `${String(i).padStart(2, "0")}.json`);
  const p = JSON.parse(fs.readFileSync(file, "utf8"));
  out.push({
    handle: p.handle,
    query: p.query,
    variables: p.variables,
  });
}
process.stdout.write(JSON.stringify(out));
