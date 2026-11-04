const inv = JSON.parse(
  require("fs").readFileSync(require("path").join(__dirname, "_mcp-01-invoke.json"), "utf8")
);
console.log(inv.variables.id, inv.variables.article.body.length);
