import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'seo-audit-reports', 'bulk-redirect-update-manifest.json'),
    'utf8'
  )
);
const dir = path.join(process.cwd(), 'seo-audit-reports', 'bulk-update-items');
fs.mkdirSync(dir, { recursive: true });

manifest.updates.forEach((u, i) => {
  const safe = `${String(i + 1).padStart(3, '0')}-${u.kind}-${u.handle}`.replace(/[^a-z0-9.-]/gi, '_');
  fs.writeFileSync(path.join(dir, `${safe}.json`), JSON.stringify(u));
});
console.log(`Split ${manifest.updates.length} items into ${dir}`);
