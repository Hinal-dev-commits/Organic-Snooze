const fs = require("fs");
const path = require("path");
const batch = process.argv[2];
const responsePath = process.argv[3];
const pending = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "_batch-results", `pending-${batch}.json`),
    "utf8"
  )
);
const data = JSON.parse(fs.readFileSync(responsePath, "utf8"));
const handles = pending.handles;
const out = { ok: [], fail: [] };
handles.forEach((handle, i) => {
  const key = `u${i}`;
  const block = data?.data?.[key];
  if (!block) {
    out.fail.push({ handle, message: "Missing response block" });
    return;
  }
  const ue = block.userErrors || [];
  if (ue.length) {
    out.fail.push({ handle, message: ue.map((e) => e.message).join("; ") });
    return;
  }
  if (!block.article) {
    out.fail.push({ handle, message: "No article returned" });
    return;
  }
  out.ok.push({ handle, updatedAt: block.article.updatedAt });
});
const outPath = path.join(__dirname, "_batch-results", `batch-${batch}.json`);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
