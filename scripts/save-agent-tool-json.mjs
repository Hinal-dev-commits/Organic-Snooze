import fs from 'fs';
import path from 'path';

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Usage: node save-agent-tool-json.mjs <agent-tools-file> <dest.json>');
  process.exit(1);
}
const raw = fs.readFileSync(src, 'utf8');
const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith('{'));
if (!line) {
  console.error('No JSON line found');
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, line);
console.log('Wrote', dest, line.length, 'chars');
