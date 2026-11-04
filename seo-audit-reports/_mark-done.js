const fs = require("fs");
const path = require("path");
const file = process.argv[2];
const message = process.argv[3];
const donePath = path.join(__dirname, "_publish-done.json");
const done = JSON.parse(fs.readFileSync(donePath, "utf8"));
done.failures = done.failures || [];
if (message) {
  done.failures.push({ file, message });
} else if (!done.succeeded.includes(file)) {
  done.succeeded.push(file);
}
fs.writeFileSync(donePath, JSON.stringify(done, null, 2));
