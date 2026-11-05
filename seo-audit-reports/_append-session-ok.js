const fs = require("fs");
const path = require("path");
const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
let session = { ok: [], fail: [] };
if (fs.existsSync(sessionPath)) {
  session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
}
for (let i = 2; i < process.argv.length; i++) {
  session.ok.push({ handle: process.argv[i], updatedAt: new Date().toISOString() });
}
fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
