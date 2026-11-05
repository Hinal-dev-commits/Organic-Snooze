const fs = require("fs");
const path = require("path");
const file = process.argv[2];
if (!file) {
  console.error("usage: node _get-vars.js <filename>");
  process.exit(1);
}
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "pending-13-mutations", file), "utf8")
);
process.stdout.write(JSON.stringify({ id: data.id, article: { body: data.article.body } }));
