const fs = require("fs");
const path = require("path");

const tmpDir = path.join(__dirname, "_tmp");
const pendingDir = path.join(__dirname, "pending-13-mutations");
const outPath = path.join(__dirname, "_mutate-results.json");

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

function handleFromFile(file) {
  return file.replace(/^\d+-/, "").replace(/\.json$/, "");
}

async function shopifyGraphql(variables) {
  const store = "the-ultimate-snooze.myshopify.com";
  const token =
    process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
  if (!token) {
    throw new Error("NO_TOKEN");
  }
  const res = await fetch(`https://${store}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  const results = { attempted: files.length, succeeded: 0, failed: 0, failures: [] };
  for (const file of files) {
    const handle = handleFromFile(file);
    try {
      const variables = JSON.parse(fs.readFileSync(path.join(tmpDir, file), "utf8"));
      const json = await shopifyGraphql(variables);
      if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).join("; "));
      }
      const payload = json.data?.articleUpdate;
      const userErrors = payload?.userErrors || [];
      if (userErrors.length) {
        throw new Error(userErrors.map((e) => e.message).join("; "));
      }
      results.succeeded++;
      console.error(`OK ${handle}`);
    } catch (e) {
      if (e.message === "NO_TOKEN") {
        console.log(JSON.stringify({ needsMcp: true, file }));
        process.exit(2);
      }
      results.failed++;
      results.failures.push({ file, message: e.message });
      console.error(`FAIL ${handle}: ${e.message}`);
    }
  }
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
}

main();
