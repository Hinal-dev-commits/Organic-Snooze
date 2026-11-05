const fs = require("fs");
const path = require("path");

const batch = String(process.argv[2] ?? "").padStart(2, "0");
const pendingPath = path.join(__dirname, "_batch-results", `pending-${batch}.json`);
const { handles } = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
const responseJson = fs.readFileSync(0, "utf8");
const json = JSON.parse(responseJson);

const out = { ok: [], fail: [] };
handles.forEach((handle, i) => {
  const key = `u${i}`;
  const block = json?.data?.[key];
  if (!block) {
    out.fail.push({
      handle,
      message:
        json.errors?.map((e) => e.message).join("; ") || "Missing response block",
    });
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
fs.writeFileSync(
  path.join(resultsDir, `batch-${batch}.json`),
  JSON.stringify(out, null, 2)
);
fs.writeFileSync(path.join(resultsDir, `response-${batch}.json`), responseJson);
process.stdout.write(JSON.stringify(out));
