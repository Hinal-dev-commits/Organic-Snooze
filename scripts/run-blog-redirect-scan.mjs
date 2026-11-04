import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const agentTools = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'd-NW-Organic-Snooze',
  'agent-tools'
);

const dumps = [
  '4e35322b-b53d-4e2e-9b3c-d31d6b14679a.txt',
  '4a0001d4-1fe5-47e8-aa60-e6d791ead7e6.txt',
  '0e328080-a1fe-4039-a723-993c34b59621.txt',
].map((f) => path.join(agentTools, f));

const outDir = path.join(process.cwd(), 'seo-audit-reports', '_live-scan');
fs.mkdirSync(outDir, { recursive: true });

const jsonPaths = [];
for (let i = 0; i < dumps.length; i++) {
  const raw = fs.readFileSync(dumps[i], 'utf8');
  const line = raw.split(/\r?\n/).find((l) => l.startsWith('{'));
  const out = path.join(outDir, `articles-page-${i + 1}.json`);
  fs.writeFileSync(out, line);
  jsonPaths.push(out);
}

const scan = spawnSync(
  'node',
  ['scripts/scan-blog-redirect-links.mjs', ...jsonPaths],
  { cwd: process.cwd(), encoding: 'utf8' }
);
process.stdout.write(scan.stdout);
process.stderr.write(scan.stderr);
process.exit(scan.status ?? 1);
