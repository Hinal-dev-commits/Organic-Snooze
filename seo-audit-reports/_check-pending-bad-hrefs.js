const fs = require("fs");
const path = require("path");
const bad = ["/collections/mattresses", "/collections/accessories"];
const dir = path.join(__dirname, "pending-13-mutations");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const body = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).article.body;
  const hits = bad.filter(
    (p) => body.includes(`href="${p}`) || body.includes(`href='${p}`)
  );
  if (hits.length) console.log(f, "BAD", hits);
}
