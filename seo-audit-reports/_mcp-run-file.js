/** Print {query,variables,handle} for argv[2] path (agent passes to graphql_mutation). */
const fs = require("fs");
const p = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
process.stdout.write(JSON.stringify({ query: p.query, variables: p.variables, handle: p.handle }));
