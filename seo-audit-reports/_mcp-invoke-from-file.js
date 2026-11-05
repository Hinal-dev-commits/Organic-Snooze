/** Usage: node _mcp-invoke-from-file.js path/to/invoke.json — prints compact status lines */
const fs = require("fs");
const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
process.stdout.write(JSON.stringify({ query: j.query, variables: j.variables }));
