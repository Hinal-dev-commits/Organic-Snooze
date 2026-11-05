const fs = require("fs");
const path = require("path");
const pending = path.join(__dirname, "pending-13-mutations");
const out = path.join(__dirname, "_tmp");
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(pending).filter((f) => f.endsWith(".json")).sort();
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(pending, file), "utf8"));
  fs.writeFileSync(
    path.join(out, file),
    JSON.stringify({ id: data.id, article: { body: data.article.body } })
  );
}
console.log(files.join("\n"));
