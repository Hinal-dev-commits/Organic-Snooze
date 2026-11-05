const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "_mcp-01-invoke.json");
const { query, variables } = JSON.parse(fs.readFileSync(p, "utf8"));
process.stdout.write(JSON.stringify({ query, variables }));
