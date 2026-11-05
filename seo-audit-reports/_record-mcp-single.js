const fs = require("fs");
const path = require("path");
const handle = process.argv[2];
const ok = process.argv[3] === "ok";
const message = process.argv[4] || "";
const sessionPath = path.join(
  __dirname,
  "_batch-results/pending-run/session-results.json"
);
let session = { ok: [], fail: [] };
if (fs.existsSync(sessionPath)) {
  session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
}
if (ok) {
  session.ok.push({ handle, updatedAt: new Date().toISOString() });
} else {
  session.fail.push({ handle, message });
}
fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
process.stdout.write(JSON.stringify({ handle, ok }));
