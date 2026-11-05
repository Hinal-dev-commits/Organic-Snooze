/** Run one batch call-NN.json via Admin GraphQL (needs SHOPIFY_STORE + SHOPIFY_ADMIN_TOKEN). */
const fs = require("fs");
const path = require("path");

const batch = String(process.argv[2] ?? "").padStart(2, "0");
const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
if (!store || !token) {
  process.stderr.write("Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN\n");
  process.exit(2);
}

const callPath = path.join(__dirname, "_batch-results", `call-${batch}.json`);
const pendingPath = path.join(__dirname, "_batch-results", `pending-${batch}.json`);
const { query, variables } = JSON.parse(fs.readFileSync(callPath, "utf8"));
const { handles } = JSON.parse(fs.readFileSync(pendingPath, "utf8"));

const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const url = `https://${store.replace(/^https?:\/\//, "")}/admin/api/${apiVersion}/graphql.json`;

(async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  const outPath = path.join(__dirname, "_batch-results", `response-${batch}.json`);
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));

  const out = { ok: [], fail: [] };
  handles.forEach((handle, i) => {
    const key = `u${i}`;
    const block = json?.data?.[key];
    if (!block) {
      out.fail.push({ handle, message: json.errors?.map((e) => e.message).join("; ") || "Missing response block" });
      return;
    }
    const ue = block.userErrors || [];
    if (ue.length) {
      out.fail.push({ handle, message: ue.map((e) => e.message).join("; ") });
      return;
    }
    if (!block.article) {
      out.fail.push({ handle, message: "No article returned" });
      return;
    }
    out.ok.push({ handle, updatedAt: block.article.updatedAt });
  });

  fs.writeFileSync(
    path.join(__dirname, "_batch-results", `batch-${batch}.json`),
    JSON.stringify(out, null, 2)
  );
  process.stdout.write(JSON.stringify(out));
})();
