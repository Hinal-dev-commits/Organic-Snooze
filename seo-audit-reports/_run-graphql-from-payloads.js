/**
 * Reads _payloads/*.json and runs articleUpdate via Shopify Admin GraphQL.
 * Same query/variables as plugin-shopify-plugin-shopify graphql_mutation.
 * Credentials: SHOPIFY_STORE, SHOPIFY_ADMIN_TOKEN (provided by Shopify plugin env).
 */
const fs = require("fs");
const path = require("path");

const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
if (!store || !token) {
  process.stderr.write("Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN\n");
  process.exit(2);
}

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${store.replace(/^https?:\/\//, "")}/admin/api/${apiVersion}/graphql.json`;

const dir = path.join(__dirname, "_payloads");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const summary = { attempted: files.length, succeeded: 0, failed: 0, failures: [] };

async function runOne(file) {
  const { query, variables, handle } = JSON.parse(
    fs.readFileSync(path.join(dir, file), "utf8")
  );
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) {
      summary.failed++;
      const message = json.errors.map((e) => e.message).join("; ");
      summary.failures.push({ handle, message });
      process.stderr.write(`FAIL ${handle}: ${message}\n`);
      return;
    }
    const ue = json.data?.articleUpdate?.userErrors || [];
    if (ue.length) {
      summary.failed++;
      const message = ue.map((e) => e.message).join("; ");
      summary.failures.push({ handle, message });
      process.stderr.write(`FAIL ${handle}: ${message}\n`);
      return;
    }
    if (!json.data?.articleUpdate?.article) {
      summary.failed++;
      summary.failures.push({ handle, message: "No article in response" });
      process.stderr.write(`FAIL ${handle}: No article in response\n`);
      return;
    }
    summary.succeeded++;
    process.stderr.write(`OK ${handle}\n`);
  } catch (err) {
    summary.failed++;
    summary.failures.push({ handle, message: String(err.message || err) });
    process.stderr.write(`FAIL ${handle}: ${err.message}\n`);
  }
}

(async () => {
  for (const file of files) {
    await runOne(file);
    await new Promise((r) => setTimeout(r, 250));
  }
  process.stdout.write(JSON.stringify(summary));
})();
