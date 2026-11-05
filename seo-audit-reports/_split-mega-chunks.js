const fs = require("fs");
const path = require("path");
const mega = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "_batch-results/pending-run/mega-mcp.json"),
    "utf8"
  )
);
const chunkSize = 8;
const handles = mega.handles;
const chunks = [];
for (let start = 0; start < handles.length; start += chunkSize) {
  chunks.push(handles.slice(start, start + chunkSize));
}

chunks.forEach((chunkHandles, ci) => {
  const indices = chunkHandles.map((h) => mega.handles.indexOf(h));
  const varDecls = [];
  const fields = [];
  const variables = {};
  indices.forEach((origIdx, i) => {
    varDecls.push(`$id${i}: ID!`, `$article${i}: ArticleUpdateInput!`);
    fields.push(
      `u${i}: articleUpdate(id: $id${i}, article: $article${i}) { article { id handle updatedAt } userErrors { field message } }`
    );
    variables[`id${i}`] = mega.variables[`id${origIdx}`];
    variables[`article${i}`] = mega.variables[`article${origIdx}`];
  });
  const query = `mutation MegaChunk${ci}(${varDecls.join(", ")}) { ${fields.join(" ")} }`;
  const out = { query, variables, handles: chunkHandles, chunk: ci };
  fs.writeFileSync(
    path.join(__dirname, "_batch-results/pending-run", `mega-chunk-${ci}.json`),
    JSON.stringify(out)
  );
  console.log(ci, chunkHandles.length, fs.statSync(path.join(__dirname, "_batch-results/pending-run", `mega-chunk-${ci}.json`)).size);
});
