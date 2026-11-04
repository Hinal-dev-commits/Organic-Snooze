/**
 * Build articleUpdate variables for one handle (stdout JSON).
 * Fetches body via Admin API is NOT done here — pass --body-file from a saved query.
 *
 * node scripts/update-single-article-redirect.mjs \
 *   --handle alcohol-and-sleep-why-your-nightcap-may-be-hurting-your-recovery \
 *   --id gid://shopify/Article/566866706497 \
 *   --from /collections/accessories \
 *   --to /collections/bedding \
 *   --body-file path/to/body.txt
 */

import fs from 'fs';

const args = process.argv.slice(2);
function get(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
}

const handle = get('--handle');
const id = get('--id');
const fromPath = get('--from');
const toPath = get('--to');
const bodyFile = get('--body-file');

if (!handle || !id || !fromPath || !toPath || !bodyFile) {
  console.error('Missing required args');
  process.exit(1);
}

let body = fs.readFileSync(bodyFile, 'utf8');

const replacements = [
  [`https://theultimatesnooze.com${fromPath}`, `https://theultimatesnooze.com${toPath}`],
  [`http://theultimatesnooze.com${fromPath}`, `https://theultimatesnooze.com${toPath}`],
  [fromPath, toPath],
];

let count = 0;
for (const [from, to] of replacements) {
  const parts = body.split(from);
  if (parts.length > 1) {
    count += parts.length - 1;
    body = parts.join(to);
  }
}

if (count === 0) {
  console.error('No matches replaced in body');
  process.exit(1);
}

const out = {
  id,
  article: { body },
  _meta: { handle, replacements: count },
};

console.log(JSON.stringify(out));
