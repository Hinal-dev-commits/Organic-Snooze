/**
 * Run pending mcp-single/*.json via Admin GraphQL when SHOPIFY_ADMIN_TOKEN is set.
 * Writes session-results.json and runs _write-final-results.js on success.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const lines = execFileSync("node", [path.join(__dirname, "_run-mcp-singles-from-disk.js")], {
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP || "the-ultimate-snooze.myshopify.com";
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
if (!token) {
  console.error(JSON.stringify({ error: "Missing SHOPIFY_ADMIN_TOKEN", pending: lines.length }));
  process.exit(2);
}

const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
let session = { ok: [], fail: [] };
if (fs.existsSync(sessionPath)) {
  session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
}
const okSet = new Set(session.ok.map((x) => x.handle));

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;

(async () => {
  for (const item of lines) {
    if (okSet.has(item.handle)) continue;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({ query: item.query, variables: item.variables }),
      });
      const json = await res.json();
      if (json.errors?.length) {
        session.fail.push({
          handle: item.handle,
          message: json.errors.map((e) => e.message).join("; "),
        });
        continue;
      }
      const ue = json.data?.articleUpdate?.userErrors || [];
      if (ue.length) {
        session.fail.push({
          handle: item.handle,
          message: ue.map((e) => e.message).join("; "),
        });
        continue;
      }
      if (!json.data?.articleUpdate?.article) {
        session.fail.push({ handle: item.handle, message: "No article in response" });
        continue;
      }
      session.ok.push({
        handle: item.handle,
        updatedAt: json.data.articleUpdate.article.updatedAt,
      });
      okSet.add(item.handle);
      process.stderr.write(`OK ${item.handle}\n`);
    } catch (err) {
      session.fail.push({ handle: item.handle, message: String(err.message || err) });
      process.stderr.write(`FAIL ${item.handle}\n`);
    }
  }
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  execFileSync("node", [path.join(__dirname, "_write-final-results.js")], {
    stdio: "inherit",
    encoding: "utf8",
  });
})();
