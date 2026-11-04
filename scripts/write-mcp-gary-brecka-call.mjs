import fs from 'fs';
import path from 'path';

const v = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'seo-audit-reports', '_mcp-01-vars-min.json'),
    'utf8'
  )
);
const query = `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) {
    article { id handle updatedAt }
    userErrors { field message }
  }
}`;
const payload = { query, variables: v };
const out = path.join(process.cwd(), 'seo-audit-reports', '_mcp-full-call.json');
fs.writeFileSync(out, JSON.stringify(payload));
console.log('wrote', out, 'bytes', JSON.stringify(payload).length);
