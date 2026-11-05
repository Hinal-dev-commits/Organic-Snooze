/**
 * Run pending mcp-single updates via Admin GraphQL when credentials exist.
 * Otherwise emit one JSON object per line: {query,variables,handle} for agent MCP.
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

const sessionPath = path.join(__dirname, "_batch-results/pending-run/session-results.json");
let session = { ok: [], fail: [] };
if (fs.existsSync(sessionPath)) {
  session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
}
const okSet = new Set(session.ok.map((x) => x.handle));

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;

async function main() {
  if (!token) {
    for (const item of lines) {
      if (okSet.has(item.handle)) continue;
      process.stdout.write(JSON.stringify(item) + "\n");
    }
    process.exit(0);
  }
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
      session.ok.push({
        handle: item.handle,
        updatedAt: json.data.articleUpdate.article.updatedAt,
      });
      okSet.add(item.handle);
    } catch (err) {
      session.fail.push({ handle: item.handle, message: String(err.message || err) });
    }
  }
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  require("./_write-final-results.js");
}

main();
