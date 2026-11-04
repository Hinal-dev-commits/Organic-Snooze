const fs = require("fs");
const path = require("path");
const inv = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_mcp-01-invoke.json"), "utf8")
);
process.stdout.write(
  JSON.stringify({ ok: true, query: inv.query, variables: inv.variables })
);
