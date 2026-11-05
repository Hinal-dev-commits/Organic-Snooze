/** Read mcp-single or batch request JSON; print {query,variables,handle?} for agent MCP. */
const fs = require("fs");
const p = process.argv[2];
const j = JSON.parse(fs.readFileSync(p, "utf8"));
const out = { query: j.query, variables: j.variables };
if (j.handle) out.handle = j.handle;
process.stdout.write(JSON.stringify(out));
