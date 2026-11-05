const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "_batch-results/pending-run");

function loadSplit(n) {
  return JSON.parse(fs.readFileSync(path.join(dir, "_split", `${n}-vars.json`), "utf8"));
}

const batch4 = JSON.parse(fs.readFileSync(path.join(dir, "_cursor-mcp-4.json"), "utf8"));
const v4 = batch4.variables;
const q4 =
  "mutation BatchArticleUpdate($id0: ID!, $article0: ArticleUpdateInput!, $id1: ID!, $article1: ArticleUpdateInput!, $id2: ID!, $article2: ArticleUpdateInput!, $id3: ID!, $article3: ArticleUpdateInput!) { u0: articleUpdate(id: $id0, article: $article0) { article { id handle updatedAt } userErrors { field message } } u1: articleUpdate(id: $id1, article: $article1) { article { id handle updatedAt } userErrors { field message } } u2: articleUpdate(id: $id2, article: $article2) { article { id handle updatedAt } userErrors { field message } } u3: articleUpdate(id: $id3, article: $article3) { article { id handle updatedAt } userErrors { field message } } }";
fs.writeFileSync(
  path.join(dir, "_invoke-batch4-trim.json"),
  JSON.stringify({
    query: q4,
    variables: {
      id0: v4.id0,
      article0: v4.article0,
      id1: v4.id1,
      article1: v4.article1,
      id2: v4.id2,
      article2: v4.article2,
      id3: v4.id3,
      article3: v4.article3,
    },
  })
);

const batch5 = JSON.parse(fs.readFileSync(path.join(dir, "_cursor-mcp-5.json"), "utf8"));
const v5 = batch5.variables;
const q5 =
  "mutation BatchArticleUpdate($id0: ID!, $article0: ArticleUpdateInput!, $id1: ID!, $article1: ArticleUpdateInput!, $id2: ID!, $article2: ArticleUpdateInput!) { u0: articleUpdate(id: $id0, article: $article0) { article { id handle updatedAt } userErrors { field message } } u1: articleUpdate(id: $id1, article: $article1) { article { id handle updatedAt } userErrors { field message } } u2: articleUpdate(id: $id2, article: $article2) { article { id handle updatedAt } userErrors { field message } } }";
fs.writeFileSync(
  path.join(dir, "_invoke-batch5-trim.json"),
  JSON.stringify({
    query: q5,
    variables: {
      id0: v5.id0,
      article0: v5.article0,
      id1: v5.id1,
      article1: v5.article1,
      id2: v5.id2,
      article2: v5.article2,
    },
  })
);

const a11 = loadSplit("11");
const a12 = loadSplit("12");
const q2 =
  "mutation BatchArticleUpdate($id0: ID!, $article0: ArticleUpdateInput!, $id1: ID!, $article1: ArticleUpdateInput!) { u0: articleUpdate(id: $id0, article: $article0) { article { id handle updatedAt } userErrors { field message } } u1: articleUpdate(id: $id1, article: $article1) { article { id handle updatedAt } userErrors { field message } } }";
fs.writeFileSync(
  path.join(dir, "_invoke-batch11-12.json"),
  JSON.stringify({
    query: q2,
    variables: {
      id0: a11.variables.id,
      article0: a11.variables.article,
      id1: a12.variables.id,
      article1: a12.variables.article,
    },
  })
);

const a03 = loadSplit("03");
const a05 = loadSplit("05");
fs.writeFileSync(
  path.join(dir, "_invoke-batch03-05.json"),
  JSON.stringify({
    query: q2,
    variables: {
      id0: a03.variables.id,
      article0: a03.variables.article,
      id1: a05.variables.id,
      article1: a05.variables.article,
    },
  })
);

const a24 = loadSplit("24");
const a25 = loadSplit("25");
const a26 = loadSplit("26");
const q3 =
  "mutation BatchArticleUpdate($id0: ID!, $article0: ArticleUpdateInput!, $id1: ID!, $article1: ArticleUpdateInput!, $id2: ID!, $article2: ArticleUpdateInput!) { u0: articleUpdate(id: $id0, article: $article0) { article { id handle updatedAt } userErrors { field message } } u1: articleUpdate(id: $id1, article: $article1) { article { id handle updatedAt } userErrors { field message } } u2: articleUpdate(id: $id2, article: $article2) { article { id handle updatedAt } userErrors { field message } } }";
fs.writeFileSync(
  path.join(dir, "_invoke-batch24-26.json"),
  JSON.stringify({
    query: q3,
    variables: {
      id0: a24.variables.id,
      article0: a24.variables.article,
      id1: a25.variables.id,
      article1: a25.variables.article,
      id2: a26.variables.id,
      article2: a26.variables.article,
    },
  })
);

for (const f of [
  "_invoke-batch4-trim.json",
  "_invoke-batch5-trim.json",
  "_invoke-batch11-12.json",
  "_invoke-batch03-05.json",
  "_invoke-batch24-26.json",
]) {
  console.log(f, fs.statSync(path.join(dir, f)).size);
}
