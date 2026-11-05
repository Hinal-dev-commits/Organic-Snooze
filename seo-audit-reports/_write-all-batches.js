const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const batchSize = 5;
const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const outDir = path.join(__dirname, "_batches");
fs.mkdirSync(outDir, { recursive: true });

const batchCount = Math.ceil(files.length / batchSize);
for (let b = 0; b < batchCount; b++) {
  const json = execSync(
    `node "${path.join(__dirname, "_build-batch-mutation.js")}" ${batchSize} ${b}`,
    { encoding: "utf8" }
  );
  fs.writeFileSync(path.join(outDir, `batch-${String(b).padStart(2, "0")}.json`), json);
}
console.log("wrote", batchCount, "batches");
