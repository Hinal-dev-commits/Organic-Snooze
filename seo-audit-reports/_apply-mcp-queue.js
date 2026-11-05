/**
 * Apply all pending mcp-single/*.json via Shopify Admin GraphQL.
 * Uses SHOPIFY_STORE + SHOPIFY_ADMIN_TOKEN when set; otherwise writes
 * seo-audit-reports/_mcp-queue-remaining.json for agent MCP fallback.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const dir = path.join(__dirname, "_batch-results/pending-run/mcp-single");
const lines = execFileSync("node", [path.join(__dirname, "_run-mcp-singles-from-disk.js")], {
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP;
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;

const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
let session = { ok: [], fail: [] };
if (fs.existsSync(sessionPath)) {
  session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
}

if (!store || !token) {
  fs.writeFileSync(
    path.join(__dirname, "_mcp-queue-remaining.json"),
    JSON.stringify(lines.map((x) => x.file))
  );
  console.log(JSON.stringify({ needMcp: true, pending: lines.length }));
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;

(async () => {
  for (const item of lines) {
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
    } catch (err) {
      session.fail.push({ handle: item.handle, message: String(err.message || err) });
    }
  }
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  require("./_write-final-results.js");
})();
