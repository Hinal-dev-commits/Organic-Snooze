import fs from 'fs';
import { replacements } from './redirect-replacement-map.mjs';

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const files = process.argv.slice(2);
const flagged = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const edges =
    data?.data?.articles?.edges ??
    data?.data?.blog?.articles?.edges ??
    [];
  for (const { node } of edges) {
    const body = node.body || '';
    for (const [from] of replacements) {
      const re = new RegExp(
        `href=["']([^"']*${escapeRe(from)}(?:[?"']|$))["']`,
        'i'
      );
      const m = body.match(re);
      if (m) {
        flagged.push({ handle: node.handle, from, href: m[1] });
      }
    }
  }
}

console.log(JSON.stringify({ flaggedCount: flagged.length, flagged }, null, 2));
