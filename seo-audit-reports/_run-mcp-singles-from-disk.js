/**
 * Agent helper: read mcp-single/*.json and emit one JSON line per pending file
 * {file, handle, query, variables} for graphql_mutation (skip already-ok handles).
 */
const fs = require("fs");
const path = require("path");

const singleOk = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_batch-results/single-ok.json"), "utf8")
).handles;
const sessionExtra = [
  "the-best-organic-mattress-you-wont-find-in-amazons-prime-sale",
  "do-cooling-sheets-actually-work-heres-what-to-look-for",
  "you-spend-one-third-of-your-life-asleep-heres-why-that-changes-everything",
  "dust-mites-mattress-organic-latex-wool",
  "gary-breckas-take-on-organic-pillows-and-every-option-we-carry",
];
const okSet = new Set([...singleOk, ...sessionExtra]);
const batch8Path = path.join(__dirname, "_batch-results/batch-8.json");
if (fs.existsSync(batch8Path)) {
  for (const h of JSON.parse(fs.readFileSync(batch8Path, "utf8")).handles || []) {
    okSet.add(h);
  }
}
const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
if (fs.existsSync(sessionPath)) {
  for (const x of JSON.parse(fs.readFileSync(sessionPath, "utf8")).ok || []) {
    okSet.add(x.handle);
  }
}

const dir = path.join(__dirname, "_batch-results/pending-run/mcp-single");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const start = Number(process.argv[2] || 0);
const count = Number(process.argv[3] || files.length);
const slice = files.slice(start, start + count);

for (const file of slice) {
  const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  if (okSet.has(payload.handle)) continue;
  process.stdout.write(
    JSON.stringify({
      file,
      handle: payload.handle,
      query: payload.query,
      variables: payload.variables,
    }) + "\n"
  );
}
