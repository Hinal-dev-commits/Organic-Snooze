const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const record = path.join(__dirname, "_record-mcp-single.js");
for (const handle of process.argv.slice(2)) {
  execFileSync("node", [record, handle, "ok"], { stdio: "inherit" });
}
