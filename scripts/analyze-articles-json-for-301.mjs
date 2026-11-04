import fs from 'fs';
import path from 'path';
import { replacements } from './redirect-replacement-map.mjs';

const sourcePaths = replacements.map(([from]) => from);
const sourcePatterns = sourcePaths.flatMap((p) => {
  const decoded = decodeURIComponent(p);
  return [p, decoded].filter((x, i, a) => a.indexOf(x) === i);
});

function findHits(body, handle) {
  const hits = [];
  for (const sp of sourcePatterns) {
    if (body.includes(sp) || body.includes(`theultimatesnooze.com${sp}`)) {
      hits.push(sp);
    }
  }
  return hits;
}

const files = process.argv.slice(2);
const articles = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const edges =
    data?.data?.articles?.edges ??
    data?.data?.blog?.articles?.edges ??
    [];
  for (const { node } of edges) {
    articles.push(node);
  }
}

const flagged = [];
for (const { handle, body } of articles) {
  const hits = findHits(body || '', handle);
  if (hits.length) flagged.push({ handle, hits });
}

console.log(
  JSON.stringify(
    { scanned: articles.length, flaggedCount: flagged.length, flagged },
    null,
    2
  )
);
