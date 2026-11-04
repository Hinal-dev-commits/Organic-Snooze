/**
 * Run all pending _one-*.json via Admin GraphQL when SHOPIFY_ADMIN_TOKEN is set.
 * Otherwise prints file paths for agent MCP.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const dir = path.join(__dirname, "_batch-results/pending-run");
const nums = ["25", "26", "27", "28", "29", "30", "32", "33", "34", "03", "05", "11", "12"];
const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP || "the-ultimate-snooze.myshopify.com";
const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${String(store).replace(/^https?:\/\//, "").replace(/\/$/, "")}/admin/api/${apiVersion}/graphql.json`;
const record = path.join(__dirname, "_record-mcp-single.js");

async function main() {
  const failures = [];
  let ok = 0;
  if (!token) {
    for (const n of nums) console.log(path.join(dir, `_one-${n}.json`));
    process.exit(0);
  }
  for (const n of nums) {
    const file = path.join(dir, `_one-${n}.json`);
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query: j.query, variables: j.variables }),
      });
      const json = await res.json();
      if (json.errors?.length) {
        failures.push({ handle: j.handle, message: json.errors.map((e) => e.message).join("; ") });
        continue;
      }
      const ue = json.data?.articleUpdate?.userErrors || [];
      if (ue.length) {
        failures.push({ handle: j.handle, message: ue.map((e) => e.message).join("; ") });
        continue;
      }
      execFileSync("node", [record, j.handle, "ok"], { stdio: "ignore" });
      ok++;
    } catch (e) {
      failures.push({ handle: j.handle, message: String(e.message || e) });
    }
  }
  console.log(JSON.stringify({ ok, failures }));
  require("./_write-final-results.js");
}

main();
