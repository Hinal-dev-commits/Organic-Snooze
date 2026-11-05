const fs = require("fs");
const path = require("path");

const singleOk = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_batch-results/single-ok.json"), "utf8")
).handles;
const extra = [
  "the-best-organic-mattress-you-wont-find-in-amazons-prime-sale",
  "do-cooling-sheets-actually-work-heres-what-to-look-for",
  "you-spend-one-third-of-your-life-asleep-heres-why-that-changes-everything",
  "dust-mites-mattress-organic-latex-wool",
  "gary-breckas-take-on-organic-pillows-and-every-option-we-carry",
];
const ok = new Set([...singleOk, ...extra]);

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const pending = [];
for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (!ok.has(p.handle)) pending.push(p);
}

const varDecls = [];
const fields = [];
const variables = {};
pending.forEach((p, i) => {
  varDecls.push(`$id${i}: ID!`, `$article${i}: ArticleUpdateInput!`);
  fields.push(
    `u${i}: articleUpdate(id: $id${i}, article: $article${i}) { article { id handle updatedAt } userErrors { field message } }`
  );
  variables[`id${i}`] = p.variables.id;
  variables[`article${i}`] = p.variables.article;
});

const query = `mutation MegaArticleUpdate(${varDecls.join(", ")}) { ${fields.join(" ")} }`;
const out = {
  query,
  variables,
  handles: pending.map((p) => p.handle),
  count: pending.length,
};
const outPath = path.join(__dirname, "_batch-results/pending-run/mega-mcp.json");
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(JSON.stringify({ count: out.count, bytes: fs.statSync(outPath).size, outPath }));
