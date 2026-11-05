/** Usage: node _mcp-call-from-json.js <payload.json> — prints {query,variables} for graphql_mutation */
const fs = require("fs");
const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
process.stdout.write(JSON.stringify({ query: j.query, variables: j.variables }));
