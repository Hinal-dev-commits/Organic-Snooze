/** Record batch mutation results from JSON on stdin: { batch, data } */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const record = path.join(__dirname, "_record-mcp-single.js");

const input = JSON.parse(fs.readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
const { data } = input;
const failures = [];
for (const [key, val] of Object.entries(data || {})) {
  if (!key.startsWith("u")) continue;
  const ue = val?.userErrors || [];
  const handle = val?.article?.handle;
  if (ue.length) {
    failures.push({ handle: handle || key, message: ue.map((e) => e.message).join("; ") });
    if (handle) execFileSync("node", [record, handle, "fail", ue[0].message], { stdio: "ignore" });
  } else if (handle) {
    execFileSync("node", [record, handle, "ok"], { stdio: "ignore" });
  }
}
process.stdout.write(JSON.stringify({ failures }));
