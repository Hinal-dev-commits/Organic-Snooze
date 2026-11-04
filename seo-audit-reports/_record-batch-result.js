const fs = require("fs");
const path = require("path");

const batch = process.argv[2];
const handles = JSON.parse(process.argv[3]);
const responseJson = fs.readFileSync(0, "utf8");
const data = JSON.parse(responseJson);

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

const resultsDir = path.join(__dirname, "_batch-results");
fs.mkdirSync(resultsDir, { recursive: true });
fs.writeFileSync(
  path.join(resultsDir, `batch-${batch}.json`),
  JSON.stringify(out, null, 2)
);
process.stdout.write(JSON.stringify(out));
