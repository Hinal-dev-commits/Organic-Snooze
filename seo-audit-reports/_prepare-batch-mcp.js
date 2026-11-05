const fs = require("fs");
const path = require("path");
const b = Number(process.argv[2]);
const src = path.join(__dirname, "_batch-results", `call-${b}.json`);
const dst = path.join(__dirname, "_batch-results", `mcp-batch-${b}-full.json`);
const j = JSON.parse(fs.readFileSync(src, "utf8"));
fs.writeFileSync(dst, JSON.stringify({ query: j.query, variables: j.variables }));
console.log(dst);
