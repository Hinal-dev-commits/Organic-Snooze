const fs = require("fs");
const path = require("path");
const file = process.argv[2];
if (!file) process.exit(1);
const p = path.join(__dirname, "_emit-batch", file);
const j = JSON.parse(fs.readFileSync(p, "utf8"));
fs.writeFileSync(
  path.join(__dirname, "_one-mcp.json"),
  JSON.stringify({ query: j.query, variables: j.variables })
);
console.log(file);
