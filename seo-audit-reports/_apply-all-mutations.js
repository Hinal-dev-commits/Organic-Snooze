/**
 * Apply all articleUpdate mutations from _payloads/*.json using Shopify Admin GraphQL.
 * Skips handles already listed in bulk-update-progress.json (succeeded or failed).
 * Logs per-handle OK/FAIL to stderr; prints final summary JSON on stdout.
 */
const fs = require("fs");
const path = require("path");

const MUTATION =
  "mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle updatedAt } userErrors { field message } } }";

const store = process.env.SHOPIFY_STORE || "the-ultimate-snooze.myshopify.com";
const token = process.env.SHOPIFY_ADMIN_TOKEN;
if (!token) {
  process.stderr.write("Missing SHOPIFY_ADMIN_TOKEN\n");
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${store.replace(/^https?:\/\//, "")}/admin/api/${apiVersion}/graphql.json`;

const progressPath = path.join(__dirname, "bulk-update-progress.json");
let progress = { succeeded: [], failed: [] };
if (fs.existsSync(progressPath)) {
  progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
}
const done = new Set([
  ...progress.succeeded.map((x) => x.handle),
  ...progress.failed.map((x) => x.handle),
]);

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const summary = {
  attempted: files.length,
  succeeded: progress.succeeded.length,
  failed: progress.failed.length,
  failures: progress.failed.map((x) => ({ handle: x.handle, message: x.message })),
};

async function runOne(payload) {
  const { query, variables, handle } = payload;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query: query || MUTATION, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const ue = json.data?.articleUpdate?.userErrors || [];
  if (ue.length) {
    throw new Error(ue.map((e) => e.message).join("; "));
  }
  if (!json.data?.articleUpdate?.article) {
    throw new Error("No article in response");
  }
  return json.data.articleUpdate.article;
}

(async () => {
  for (const file of files) {
    const payload = JSON.parse(
      fs.readFileSync(path.join(dir, file), "utf8")
    );
    if (done.has(payload.handle)) {
      continue;
    }
    try {
      const article = await runOne(payload);
      progress.succeeded.push({
        handle: payload.handle,
        updatedAt: article.updatedAt,
      });
      summary.succeeded++;
      process.stderr.write(`OK ${payload.handle}\n`);
    } catch (err) {
      const message = String(err.message || err);
      progress.failed.push({ handle: payload.handle, message });
      summary.failed++;
      summary.failures.push({ handle: payload.handle, message });
      process.stderr.write(`FAIL ${payload.handle}: ${message}\n`);
    }
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
    await new Promise((r) => setTimeout(r, 300));
  }
  fs.writeFileSync(
    path.join(__dirname, "bulk-update-results.json"),
    JSON.stringify(summary, null, 2)
  );
  process.stdout.write(JSON.stringify(summary));
})();
