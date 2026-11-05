const fs = require("fs");
const path = require("path");
const batch = process.argv[2];
const file = path.join(__dirname, "_batch-results", "pending-run", `mcp-batch-${batch}.json`);
const j = JSON.parse(fs.readFileSync(file, "utf8"));
process.stdout.write(JSON.stringify({ query: j.query, variables: j.variables, handles: j.handles }));
