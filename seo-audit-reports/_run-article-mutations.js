/**
 * Reads payload files and prints one JSON line per file for articleUpdate variables.
 * Used with external Shopify Admin API caller.
 */
const fs = require("fs");
const path = require("path");
const payloadDir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(payloadDir).filter((f) => f.endsWith(".json")).sort();
const mutation = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

async function main() {
  const results = { attempted: files.length, succeeded: 0, failed: 0, failures: [] };
  for (const file of files) {
    const variables = JSON.parse(fs.readFileSync(path.join(payloadDir, file), "utf8"));
    const handle = file.replace(/^\d+-/, "").replace(/\.json$/, "");
    process.stdout.write(JSON.stringify({ file, handle, mutation, variables }) + "\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
