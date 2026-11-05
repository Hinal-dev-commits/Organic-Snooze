const fs = require("fs");
const path = require("path");

const pendingDir = path.join(__dirname, "pending-13-mutations");
const tmpDir = path.join(__dirname, "_tmp");
const resultsPath = path.join(__dirname, "_publish-results.json");

const mutation = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;

const files = fs.readdirSync(pendingDir).filter((f) => f.endsWith(".json")).sort();

function handleFromFile(file) {
  return file.replace(/^\d+-/, "").replace(/\.json$/, "");
}

async function publishOne(file) {
  const variables = JSON.parse(fs.readFileSync(path.join(tmpDir, file), "utf8"));
  const { execFileSync } = require("child_process");
  const payload = JSON.stringify({ mutation, variables });
  const script = `
    const payload = ${JSON.stringify(payload)};
    process.stdout.write(payload);
  `;
  // Placeholder: actual publish done via Shopify MCP in agent loop
  return { file, handle: handleFromFile(file), variables, mutation };
}

async function main() {
  const queue = files.map((file) => ({
    file,
    handle: handleFromFile(file),
    mutation,
    variables: JSON.parse(fs.readFileSync(path.join(tmpDir, file), "utf8")),
  }));
  fs.writeFileSync(resultsPath, JSON.stringify({ queue, pending: true }, null, 2));
  console.log(JSON.stringify({ files: queue.length, resultsPath }));
}

main();
