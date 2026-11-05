const fs = require("fs");
const path = require("path");
const batch = Number(process.argv[2]);
const resultPath = process.argv[3];
const batchMeta = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "_batch-results", "pending-run", `mcp-batch-${batch}.json`),
    "utf8"
  )
);
const handles = batchMeta.handles;
const raw = JSON.parse(fs.readFileSync(resultPath, "utf8"));
const data = raw.data || raw;
const out = { ok: [], fail: [] };
handles.forEach((handle, idx) => {
  const key = `u${idx}`;
  const block = data[key];
  if (!block) {
    out.fail.push({ handle, message: "Missing response block " + key });
    return;
  }
  const errs = block.userErrors || [];
  if (errs.length) {
    out.fail.push({ handle, message: errs.map((e) => e.message).join("; ") });
  } else if (block.article) {
    out.ok.push({ handle, updatedAt: block.article.updatedAt });
  } else {
    out.fail.push({ handle, message: "No article returned" });
  }
});
process.stdout.write(JSON.stringify(out));
