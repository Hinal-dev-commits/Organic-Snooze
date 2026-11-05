const fs = require("fs");
const p = process.argv[2];
if (!p) process.exit(1);
const j = JSON.parse(fs.readFileSync(p, "utf8"));
const out = { query: j.query, variables: j.variables };
process.stdout.write(JSON.stringify(out));
