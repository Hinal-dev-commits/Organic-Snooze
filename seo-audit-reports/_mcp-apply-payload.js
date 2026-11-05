/** Print {query, variables, handle} for _payloads/XX.json */
const fs = require("fs");
const path = require("path");
const idx = process.argv[2];
const p = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_payloads", `${idx}.json`), "utf8")
);
process.stdout.write(
  JSON.stringify({
    query: p.query,
    variables: p.variables,
    handle: p.handle,
  })
);
