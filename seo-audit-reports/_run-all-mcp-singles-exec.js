/**
 * Execute all pending mcp-single/*.json via Shopify Admin GraphQL.
 * Requires SHOPIFY_STORE + SHOPIFY_ADMIN_TOKEN (same as MCP).
 * On success/failure, writes session-results.json and bulk-update-results.json.
 */
const fs = require("fs");
const path = require("path");

const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP;
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
if (!store || !token) {
  console.error(JSON.stringify({ error: "Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN" }));
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;

const singleOk = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_batch-results/single-ok.json"), "utf8")
).handles;
const sessionExtra = [
  "the-best-organic-mattress-you-wont-find-in-amazons-prime-sale",
  "do-cooling-sheets-actually-work-heres-what-to-look-for",
  "you-spend-one-third-of-your-life-asleep-heres-why-that-changes-everything",
  "dust-mites-mattress-organic-latex-wool",
  "gary-breckas-take-on-organic-pillows-and-every-option-we-carry",
];
const okSet = new Set([...singleOk, ...sessionExtra]);
const batch8Path = path.join(__dirname, "_batch-results/batch-8.json");
if (fs.existsSync(batch8Path)) {
  for (const h of JSON.parse(fs.readFileSync(batch8Path, "utf8")).handles || []) {
    okSet.add(h);
  }
}

const dir = path.join(__dirname, "_batch-results/pending-run/mcp-single");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const session = { ok: [], fail: [] };

async function runFile(file) {
  const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const { query, variables, handle } = payload;
  if (okSet.has(handle)) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) {
      session.fail.push({
        handle,
        message: json.errors.map((e) => e.message).join("; "),
      });
      return;
    }
    const ue = json.data?.articleUpdate?.userErrors || [];
    if (ue.length) {
      session.fail.push({
        handle,
        message: ue.map((e) => e.message).join("; "),
      });
      return;
    }
    if (!json.data?.articleUpdate?.article) {
      session.fail.push({ handle, message: "No article in response" });
      return;
    }
    session.ok.push({ handle, updatedAt: json.data.articleUpdate.article.updatedAt });
    okSet.add(handle);
  } catch (err) {
    session.fail.push({ handle, message: String(err.message || err) });
  }
}

(async () => {
  for (const file of files) {
    await runFile(file);
  }
  const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
  let prev = { ok: [], fail: [] };
  if (fs.existsSync(sessionPath)) {
    prev = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  }
  const merged = {
    ok: [...prev.ok, ...session.ok],
    fail: [...prev.fail, ...session.fail],
  };
  fs.writeFileSync(sessionPath, JSON.stringify(merged, null, 2));

  require("./_write-final-results.js");
})();
