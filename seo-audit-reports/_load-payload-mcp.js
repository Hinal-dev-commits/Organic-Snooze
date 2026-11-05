const fs = require("fs");
const path = require("path");
const i = Number(process.argv[2]);
const file = path.join(__dirname, "_payloads", String(i).padStart(2, "0") + ".json");
const p = JSON.parse(fs.readFileSync(file, "utf8"));
process.stdout.write(JSON.stringify({ query: p.query, variables: p.variables, handle: p.handle }));
