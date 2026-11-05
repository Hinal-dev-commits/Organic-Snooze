const fs = require("fs");
const path = require("path");

const callsDir = path.join(__dirname, "_calls");
const donePath = path.join(__dirname, "_publish-done.json");
const mutation = fs
  .readdirSync(callsDir)
  .filter((f) => f.endsWith(".json"))
  .sort()[0];
const sample = JSON.parse(fs.readFileSync(path.join(callsDir, mutation), "utf8"));
const query = sample.query;

const store = "the-ultimate-snooze.myshopify.com";
const token =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyGraphql(variables) {
  const res = await fetch(`https://${store}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function main() {
  const done = JSON.parse(fs.readFileSync(donePath, "utf8"));
  const files = fs.readdirSync(callsDir).filter((f) => f.endsWith(".json")).sort();
  const results = { attempted: files.length, succeeded: 0, failed: 0, failures: [] };

  if (!token) {
    console.log(JSON.stringify({ error: "NO_TOKEN", remaining: files.filter((f) => !done.succeeded.includes(f)) }));
    process.exit(2);
  }

  for (const file of files) {
    if (done.succeeded.includes(file)) {
      results.succeeded++;
      continue;
    }
    const call = JSON.parse(fs.readFileSync(path.join(callsDir, file), "utf8"));
    try {
      const json = await shopifyGraphql(call.variables);
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
    }
  }
  fs.writeFileSync(donePath, JSON.stringify(done, null, 2));
  console.log(JSON.stringify(results));
}

main();
