const fs = require("fs");
const path = require("path");
const file = process.argv[2];
const call = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_calls", file), "utf8")
);
process.stdout.write(JSON.stringify({ query: call.query, variables: call.variables }));
