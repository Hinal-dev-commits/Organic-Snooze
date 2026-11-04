/**
 * Run all pending mcp-single/*.json via Admin GraphQL when env tokens exist.
 * Updates session-results.json and bulk-update-results.json.
 */
const path = require("path");
const { execFileSync } = require("child_process");

const lines = execFileSync("node", [path.join(__dirname, "_run-mcp-singles-from-disk.js")], {
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const exec = path.join(__dirname, "_mcp-execute-json-file.js");
const tmpDir = path.join(__dirname, "_batch-results/pending-run/_exec-tmp");
require("fs").mkdirSync(tmpDir, { recursive: true });

for (const item of lines) {
  const tmp = path.join(tmpDir, item.file);
  require("fs").writeFileSync(
    tmp,
    JSON.stringify({ query: item.query, variables: item.variables })
  );
  try {
    const out = execFileSync("node", [exec, tmp], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    const json = JSON.parse(out);
    const handle = item.handle;
    if (json.errors?.length) {
      execFileSync("node", [
        path.join(__dirname, "_record-mcp-single.js"),
        handle,
        "fail",
        json.errors.map((e) => e.message).join("; "),
      ]);
      continue;
    }
    const ue = json.data?.articleUpdate?.userErrors || [];
    if (ue.length) {
      execFileSync("node", [
        path.join(__dirname, "_record-mcp-single.js"),
        handle,
        "fail",
        ue.map((e) => e.message).join("; "),
      ]);
      continue;
    }
    if (json.data?.articleUpdate?.article) {
      execFileSync("node", [path.join(__dirname, "_record-mcp-single.js"), handle, "ok"]);
    }
  } catch (e) {
    execFileSync("node", [
      path.join(__dirname, "_record-mcp-single.js"),
      item.handle,
      "fail",
      String(e.message || e),
    ]);
  }
}
execFileSync("node", [path.join(__dirname, "_write-final-results.js")], { encoding: "utf8" });
