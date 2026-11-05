const fs = require("fs");
const path = require("path");

const singleOk = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_batch-results/single-ok.json"), "utf8")
).handles;
const batch8Path = path.join(__dirname, "_batch-results/batch-8.json");
let batch8 = [];
if (fs.existsSync(batch8Path)) {
  batch8 = JSON.parse(fs.readFileSync(batch8Path, "utf8")).handles || [];
}

const sessionExtra = [
  "the-best-organic-mattress-you-wont-find-in-amazons-prime-sale",
  "do-cooling-sheets-actually-work-heres-what-to-look-for",
  "you-spend-one-third-of-your-life-asleep-heres-why-that-changes-everything",
  "dust-mites-mattress-organic-latex-wool",
  "gary-breckas-take-on-organic-pillows-and-every-option-we-carry",
];

const okSet = new Set([...singleOk, ...sessionExtra, ...batch8]);

const sessionPath = path.join(
  __dirname,
  "_batch-results/pending-run/session-results.json"
);
const failures = [];
if (fs.existsSync(sessionPath)) {
  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  for (const x of session.ok || []) okSet.add(x.handle);
  for (const x of session.fail || []) failures.push(x);
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "bulk-redirect-update-manifest.json"), "utf8")
);
const entries =
  manifest.updates?.filter((u) => u.kind === "article") ||
  manifest.articles ||
  manifest.entries ||
  [];
const allHandles = entries.map((e) => e.handle);

for (const h of allHandles) {
  if (!okSet.has(h) && !failures.some((f) => f.handle === h)) {
    failures.push({ handle: h, message: "Not updated" });
  }
}

const attempted = allHandles.length;
const succeeded = allHandles.filter((h) => okSet.has(h)).length;
const failed = attempted - succeeded;

const out = {
  attempted,
  succeeded,
  failed,
  failures: failures.filter((f) => !okSet.has(f.handle)),
};

fs.writeFileSync(
  path.join(__dirname, "bulk-update-results.json"),
  JSON.stringify(out, null, 2)
);
process.stdout.write(JSON.stringify(out));
