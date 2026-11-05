/**
 * After MCP updates, record ok/fail from split dir by comparing handles.
 * Usage: node _run-pending-splits-record.js ok 23 24
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dir = path.join(__dirname, "_batch-results/pending-run");
const record = path.join(__dirname, "_record-mcp-single.js");
const mcpSingle = path.join(dir, "mcp-single");

const mode = process.argv[2];
const nums = process.argv.slice(3);
for (const n of nums) {
  const j = JSON.parse(fs.readFileSync(path.join(mcpSingle, `${n}.json`), "utf8"));
  const handle = j.handle;
  if (mode === "ok") {
    execSync(`node "${record}" "${handle}" ok`, { stdio: "inherit" });
  } else if (mode === "fail") {
    const msg = process.argv[4] || "MCP error";
    execSync(`node "${record}" "${handle}" fail "${msg.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
    });
    break;
  }
}
