const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "_batch-results/pending-run");
const outPath = path.join(dir, "session-results.json");
let session = { ok: [], fail: [] };
if (fs.existsSync(outPath)) {
  session = JSON.parse(fs.readFileSync(outPath, "utf8"));
}

const batch = Number(process.argv[2]);
const resultRaw = fs.readFileSync(process.argv[3], "utf8");
const result = JSON.parse(resultRaw);
const data = result.data || result;

const meta = JSON.parse(
  fs.readFileSync(path.join(dir, `mcp-batch-${batch}.json`), "utf8")
);
const handles = meta.handles;
handles.forEach((handle, idx) => {
  const key = `u${idx}`;
  const block = data[key];
  if (!block) {
    session.fail.push({ handle, message: "Missing response block " + key });
    return;
  }
  const errs = block.userErrors || [];
  if (errs.length) {
    session.fail.push({
      handle,
      message: errs.map((e) => e.message).join("; "),
    });
  } else if (block.article) {
    session.ok.push({ handle, updatedAt: block.article.updatedAt });
  } else {
    session.fail.push({ handle, message: "No article returned" });
  }
});

fs.writeFileSync(outPath, JSON.stringify(session, null, 2));
process.stdout.write(JSON.stringify(session));
