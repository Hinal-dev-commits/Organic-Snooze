const fs = require("fs");
const path = require("path");
const b = Number(process.argv[2]);
const p = path.join(__dirname, "_batch-results", `call-${b}.json`);
process.stdout.write(fs.readFileSync(p, "utf8"));
