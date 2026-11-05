/** Map batch mutation result to ok/fail by handles array. */
const fs = require("fs");
const path = require("path");
const batch = Number(process.argv[2]);
const resultPath = process.argv[3];
const meta = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "_batch-results/pending-run", `mcp-batch-${batch}.json`),
    "utf8"
  )
);
const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
const handles = meta.handles;
const ok = [];
const fail = [];
for (let i = 0; i < handles.length; i++) {
  const key = `u${i}`;
  const block = result.data?.[key];
  const ue = block?.userErrors || [];
  if (ue.length) {
    fail.push({ handle: handles[i], message: ue.map((e) => e.message).join("; ") });
  } else if (block?.article?.handle) {
    ok.push({ handle: block.article.handle, updatedAt: block.article.updatedAt });
  } else {
    fail.push({ handle: handles[i], message: "No article in response" });
  }
}
if (result.errors?.length) {
  for (const h of handles) {
    if (!ok.some((x) => x.handle === h) && !fail.some((x) => x.handle === h)) {
      fail.push({
        handle: h,
        message: result.errors.map((e) => e.message).join("; "),
      });
    }
  }
}
process.stdout.write(JSON.stringify({ ok, fail }));
