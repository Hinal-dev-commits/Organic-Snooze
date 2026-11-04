const fs = require("fs");
const path = require("path");

const dir = __dirname;
const ok = new Set(
  JSON.parse(
    fs.readFileSync(path.join(dir, "_batch-results", "single-ok.json"), "utf8")
  ).handles
);
[
  "the-best-organic-mattress-you-wont-find-in-amazons-prime-sale",
  "do-cooling-sheets-actually-work-heres-what-to-look-for",
  "you-spend-one-third-of-your-life-asleep-heres-why-that-changes-everything",
].forEach((h) => ok.add(h));

const pending = [];
for (let i = 0; i < 53; i++) {
  const p = JSON.parse(
    fs.readFileSync(
      path.join(dir, "_payloads", String(i).padStart(2, "0") + ".json"),
      "utf8"
    )
  );
  if (!ok.has(p.handle)) pending.push(p);
}

const batchSize = 5;
const outDir = path.join(dir, "_batch-results", "pending-run");
fs.mkdirSync(outDir, { recursive: true });

for (let b = 0; b * batchSize < pending.length; b++) {
  const chunk = pending.slice(b * batchSize, (b + 1) * batchSize);
  const argParts = [];
  const fieldParts = [];
  const vars = {};
  chunk.forEach((p, idx) => {
    argParts.push(`$id${idx}: ID!, $article${idx}: ArticleUpdateInput!`);
    vars[`id${idx}`] = p.variables.id;
    vars[`article${idx}`] = p.variables.article;
    fieldParts.push(
      `u${idx}: articleUpdate(id: $id${idx}, article: $article${idx}) { article { id handle updatedAt } userErrors { field message } }`
    );
  });
  const query = `mutation BatchArticleUpdate(${argParts.join(", ")}) { ${fieldParts.join(" ")} }`;
  fs.writeFileSync(
    path.join(outDir, `mcp-batch-${b}.json`),
    JSON.stringify({ query, variables: vars, handles: chunk.map((p) => p.handle), batch: b })
  );
}

fs.writeFileSync(
  path.join(outDir, "meta.json"),
  JSON.stringify({ pendingCount: pending.length, batches: Math.ceil(pending.length / batchSize) })
);
console.log(JSON.stringify({ pending: pending.length, batches: Math.ceil(pending.length / batchSize) }));
