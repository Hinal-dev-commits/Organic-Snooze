import fs from 'fs';
import path from 'path';
import { applyRedirectFixes, replacements } from './redirect-replacement-map.mjs';

const files = process.argv.slice(2);
const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;

function normalizePath(href) {
  if (!href) return '';
  let p = href.trim();
  try {
    if (p.startsWith('http')) {
      const u = new URL(p);
      p = u.pathname + (u.search || '');
    }
  } catch {
    /* keep */
  }
  if (!p.startsWith('/')) p = '/' + p;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep */
  }
  return p.replace(/\/+$/, '') || '/';
}

const redirectSources = new Map(replacements);

const hits = [];
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith('{')) || raw;
  const json = JSON.parse(line);
  for (const { node } of json?.data?.pages?.edges ?? []) {
    const body = node.body || '';
    const found = new Set();
    let m;
    while ((m = hrefRe.exec(body)) !== null) {
      const norm = normalizePath(m[1]);
      if (redirectSources.has(norm)) found.add(norm);
    }
    if (found.size) {
      hits.push({ handle: node.handle, redirectLinks: [...found] });
    }
  }
}

console.log(
  JSON.stringify({ pagesScanned: files.length, pagesWith301Links: hits.length, pages: hits }, null, 2)
);
