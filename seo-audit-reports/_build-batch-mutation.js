const fs = require("fs");
const path = require("path");

const batchSize = parseInt(process.argv[2] || "5", 10);
const batchIndex = parseInt(process.argv[3] || "0", 10);

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const start = batchIndex * batchSize;
const slice = files.slice(start, start + batchSize);
if (!slice.length) {
  process.stderr.write("empty batch\n");
  process.exit(1);
}

const payloads = slice.map((f) =>
  JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
);

const varDefs = [];
const fields = [];
const variables = {};
const handles = [];

payloads.forEach((p, i) => {
  handles.push(p.handle);
  varDefs.push(`$id${i}: ID!, $article${i}: ArticleUpdateInput!`);
  fields.push(
    `u${i}: articleUpdate(id: $id${i}, article: $article${i}) { article { id handle updatedAt } userErrors { field message } }`
  );
  variables[`id${i}`] = p.variables.id;
  variables[`article${i}`] = p.variables.article;
});

const query = `mutation BatchArticleUpdate(${varDefs.join(", ")}) { ${fields.join(" ")} }`;

process.stdout.write(
  JSON.stringify({ batchIndex, handles, query, variables, count: payloads.length })
);
