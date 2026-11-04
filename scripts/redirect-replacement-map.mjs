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
      linkUsed: cols[2],
      whatItDoes: cols[3],
      finalUrl: cols[4],
    });
  }
  return rows;
}

const STORE_HOSTS = [
  'https://theultimatesnooze.com',
  'http://theultimatesnooze.com',
  'https://www.theultimatesnooze.com',
  'http://www.theultimatesnooze.com',
  'https://the-ultimate-snooze.myshopify.com',
  'http://the-ultimate-snooze.myshopify.com',
];

/** @type {Map<string, string>} from -> to (path only for keys, expanded at apply time) */
const pathMap = new Map();

for (const row of parseCsv(fs.readFileSync(csvPath, 'utf8'))) {
  if (!row.whatItDoes.includes('301')) continue;
  if (!row.finalUrl || row.finalUrl === '(none)') continue;
  let from = row.linkUsed.trim();
  let to = row.finalUrl.trim();
  if (!from.startsWith('/')) from = '/' + from;
  if (!to.startsWith('/')) to = '/' + to;
  pathMap.set(from, to);
}

/** Longest paths first so nested URLs replace correctly */
export const replacements = [...pathMap.entries()].sort(
  (a, b) => b[0].length - a[0].length
);

export function applyRedirectFixes(html) {
  if (!html) return { body: html, count: 0 };
  let body = html;
  let count = 0;

  for (const [fromPath, toPath] of replacements) {
    const variants = new Set([fromPath]);
    try {
      variants.add(encodeURI(fromPath));
    } catch {
      /* ignore */
    }

    for (const from of variants) {
      const to = from === fromPath ? toPath : toPath; // encoded from keeps encoded to if needed
      for (const host of STORE_HOSTS) {
        const fromFull = host + from;
        const toFull = host + toPath;
        const n = body.split(fromFull).length - 1;
        if (n > 0) {
          body = body.split(fromFull).join(toFull);
          count += n;
        }
      }
      const nRel = body.split(from).length - 1;
      if (nRel > 0) {
        body = body.split(from).join(toPath);
        count += nRel;
      }
    }
  }

  return { body, count };
}

if (process.argv[1]?.endsWith('redirect-replacement-map.mjs')) {
  console.log(JSON.stringify({ pairs: replacements.length, replacements }, null, 2));
}
