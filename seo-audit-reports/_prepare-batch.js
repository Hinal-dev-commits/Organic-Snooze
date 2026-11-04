const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "pending-13-mutations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const payloads = files.map((f) => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  return { file: f, id: data.id, article: { body: data.article.body } };
});
fs.writeFileSync(path.join(__dirname, "_batch-payloads.json"), JSON.stringify(payloads));
console.log("wrote", payloads.length, "payloads");
