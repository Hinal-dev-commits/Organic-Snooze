/**
 * Build manifest of article/page updates from Shopify GraphQL JSON dumps.
 *
 * node scripts/build-bulk-redirect-manifest.mjs \
 *   articles-page-1.json articles-page-2.json ... \
 *   pages-page-1.json ...
 */

import fs from 'fs';
import path from 'path';
import { applyRedirectFixes } from './redirect-replacement-map.mjs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Pass GraphQL JSON dump files');
  process.exit(1);
}

const updates = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith('{')) || raw;
  const json = JSON.parse(line);

  const articleEdges =
    json?.data?.blog?.articles?.edges ?? json?.data?.articles?.edges;
  if (articleEdges) {
    for (const { node } of articleEdges) {
      if (!node?.id) continue;
      const { body, count } = applyRedirectFixes(node.body);
      if (count > 0) {
        updates.push({
          kind: 'article',
          id: node.id,
          handle: node.handle,
          title: node.title,
          replacements: count,
          body,
        });
      }
    }
    continue;
  }

  const pageEdges = json?.data?.pages?.edges;
  if (pageEdges) {
    for (const { node } of pageEdges) {
      const { body, count } = applyRedirectFixes(node.body);
      if (count > 0) {
        updates.push({
          kind: 'page',
          id: node.id,
          handle: node.handle,
          title: node.title,
          replacements: count,
          body,
        });
      }
    }
  }
}

const outPath = path.join(
  process.cwd(),
  'seo-audit-reports',
  'bulk-redirect-update-manifest.json'
);
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), updates }, null, 2));
console.log(`Wrote ${updates.length} updates to ${outPath}`);
