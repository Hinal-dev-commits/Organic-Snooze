/**
 * Scan blog articles for internal links that match SEO audit redirect sources.
 * Usage: node scripts/scan-blog-redirect-links.mjs [path-to-articles-json...]
 *
 * Articles JSON: saved GraphQL responses with data.blog.articles.edges[].node { handle, title, body }
 */

import fs from 'fs';
import path from 'path';

const csvPath = path.join(
  process.cwd(),
  'seo-audit-reports',
  '4-links-that-go-through-redirects.csv'
);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    rows.push({
      pageType: cols[0],
      pageContaining: cols[1],
      linkUsed: cols[2],
      whatItDoes: cols[3],
      finalUrl: cols[4],
      whatToDo: cols[5],
    });
  }
  return rows;
}

function normalizePath(href) {
  if (!href) return '';
  let p = href.trim();
  try {
    if (p.startsWith('http')) {
      const u = new URL(p);
      p = u.pathname + (u.search || '');
    }
  } catch {
    /* keep as-is */
  }
  if (!p.startsWith('/')) p = '/' + p;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep encoded */
  }
  return p.replace(/\/+$/, '') || '/';
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const auditRows = parseCsv(csvText);
const redirectSources = new Map();
for (const row of auditRows) {
  if (row.pageType !== 'Blog article' || !row.whatItDoes.includes('301')) continue;
  const src = normalizePath(row.linkUsed);
  if (!redirectSources.has(src)) {
    redirectSources.set(src, row.finalUrl);
  }
}

const articleFiles = process.argv.slice(2);
if (articleFiles.length === 0) {
  console.error('Pass one or more GraphQL JSON dump files as arguments.');
  process.exit(1);
}

const articles = [];
for (const file of articleFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(raw);
  const edges =
    json?.data?.blog?.articles?.edges ?? json?.data?.articles?.edges ?? [];
  for (const { node } of edges) {
    if (node?.handle) articles.push(node);
  }
}

const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;

const hits = [];
for (const article of articles) {
  const body = article.body || '';
  const found = new Set();
  let m;
  while ((m = hrefRe.exec(body)) !== null) {
    const norm = normalizePath(m[1]);
    if (redirectSources.has(norm)) {
      found.add(norm);
    }
  }
  if (found.size > 0) {
    hits.push({
      handle: article.handle,
      title: article.title,
      redirectLinks: [...found],
    });
  }
}

console.log(JSON.stringify({
  storeArticlesScanned: articles.length,
  auditRedirectSourcePaths: redirectSources.size,
  auditBlog301Rows: auditRows.filter(
    (r) => r.pageType === 'Blog article' && r.whatItDoes.includes('301')
  ).length,
  articlesWith301RedirectLinks: hits.length,
  articles: hits,
}, null, 2));
