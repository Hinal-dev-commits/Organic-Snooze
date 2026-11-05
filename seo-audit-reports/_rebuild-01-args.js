const fs = require("fs");
const path = require("path");
const j = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "pending-13-mutations/01-what-is-the-gary-brecka-sleep-optimizati.json"),
    "utf8"
  )
);
const query =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {\n  articleUpdate(id: $id, article: $article) {\n    article { id handle updatedAt }\n    userErrors { field message }\n  }\n}";
fs.writeFileSync(
  path.join(__dirname, "_mcp-call-args.json"),
  JSON.stringify({ query, variables: { id: j.id, article: j.article } })
);
console.log("bodyLen", j.article.body.length);
fs.writeFileSync(
  path.join(__dirname, "_mcp-01-invoke.json"),
  JSON.stringify({
    query,
    variables: { id: j.id, article: j.article },
  })
);
