/** Prints {query, variables} JSON for one pending batch (stdout). */
const fs = require("fs");
const i = Number(process.argv[2]);
const p = require("path").join(
  __dirname,
  "_batch-results",
  `pending-${i}.json`
);
const { query, variables } = JSON.parse(fs.readFileSync(p, "utf8"));
process.stdout.write(JSON.stringify({ query, variables }));
