import fs from 'fs';
import path from 'path';

const itemPath = path.join(
  process.cwd(),
  'seo-audit-reports/bulk-update-items/004-article-what-is-the-gary-brecka-sleep-optimization-challenge-by-the-ultimate-human-what-to-expect-official-link.json'
);
const u = JSON.parse(fs.readFileSync(itemPath, 'utf8'));
const query = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;
const payload = { query, variables: { id: u.id, article: { body: u.body } } };
const out = path.join(process.cwd(), 'seo-audit-reports/_mcp-full-call.json');
fs.writeFileSync(out, JSON.stringify(payload));
console.log('ok', u.id, u.body.length);
