const fs = require("fs");
const path = require("path");
const p = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_current-payload.json"), "utf8").replace(/^\uFEFF/, "")
);
process.stdout.write(
  JSON.stringify({
    query: p.mutation,
    variables: p.variables,
    file: p.file,
    handle: p.handle,
  })
);
