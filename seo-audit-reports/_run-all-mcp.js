const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const pendingDir = path.join(__dirname, "pending-13-mutations");
const tmpDir = path.join(__dirname, "_tmp");
const donePath = path.join(__dirname, "_publish-done.json");
const resultsPath = path.join(__dirname, "_final-results.json");

const mutation = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

const files = fs
  .readdirSync(pendingDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const done = fs.existsSync(donePath)
  ? JSON.parse(fs.readFileSync(donePath, "utf8"))
  : { succeeded: [], failures: [] };

function handleFromFile(file) {
  return file.replace(/^\d+-/, "").replace(/\.json$/, "");
}

async function shopifyGraphql(variables) {
  const store = "the-ultimate-snooze.myshopify.com";
  const token =
    process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://${store}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });
  return res.json();
}

async function main() {
  const results = { attempted: files.length, succeeded: 0, failed: 0, failures: [] };
  for (const file of files) {
    if (done.succeeded.includes(file)) {
      results.succeeded++;
      continue;
    }
    const variables = JSON.parse(fs.readFileSync(path.join(tmpDir, file), "utf8"));
    const json = await shopifyGraphql(variables);
    if (!json) {
      console.error("NO_TOKEN — use MCP for remaining files");
      process.exit(2);
    }
    try {
      if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).join("; "));
      }
      const userErrors = json.data?.articleUpdate?.userErrors || [];
      if (userErrors.length) {
        throw new Error(userErrors.map((e) => e.message).join("; "));
      }
      done.succeeded.push(file);
      results.succeeded++;
    } catch (e) {
      results.failed++;
      results.failures.push({ file, message: e.message });
      done.failures = done.failures || [];
      done.failures.push({ file, message: e.message });
    }
  }
  fs.writeFileSync(donePath, JSON.stringify(done, null, 2));
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
}

main();
