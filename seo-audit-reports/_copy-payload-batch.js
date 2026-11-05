const fs = require("fs");
const path = require("path");
const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const srcDir = path.join(__dirname, "_payloads");
const dstDir = path.join(__dirname, "_tmp-batch");
fs.mkdirSync(dstDir, { recursive: true });
for (let i = start; i <= end; i++) {
  const name = `${String(i).padStart(2, "0")}.json`;
  fs.copyFileSync(path.join(srcDir, name), path.join(dstDir, name));
}
console.log("copied", end - start + 1);
