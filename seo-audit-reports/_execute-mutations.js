const fs = require("fs");
const path = require("path");

const pendingDir = path.join(__dirname, "pending-13-mutations");
const files = fs.readdirSync(pendingDir).filter((f) => f.endsWith(".json")).sort();

const mutation = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

const store = process.env.SHOPIFY_STORE || "the-ultimate-snooze.myshopify.com";
const token =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyGraphql(variables) {
  if (!token) {
    throw new Error("Missing SHOPIFY_ADMIN_API_ACCESS_TOKEN or SHOPIFY_ACCESS_TOKEN");
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
    const handle = file.replace(/^\d+-/, "").replace(/\.json$/, "");
    try {
      const data = JSON.parse(fs.readFileSync(path.join(pendingDir, file), "utf8"));
      const variables = { id: data.id, article: { body: data.article.body } };
      const json = await shopifyGraphql(variables);
      const payload = json.data?.articleUpdate;
      const userErrors = payload?.userErrors || [];
      if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).join("; "));
      }
      if (userErrors.length) {
        throw new Error(userErrors.map((e) => e.message).join("; "));
      }
      results.succeeded++;
      console.error(`OK ${handle} -> ${payload?.article?.handle}`);
    } catch (e) {
      results.failed++;
      results.failures.push({ file, message: e.message });
      console.error(`FAIL ${handle}: ${e.message}`);
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
