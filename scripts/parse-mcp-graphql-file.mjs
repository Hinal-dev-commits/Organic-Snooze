import fs from 'fs';

const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8');
const start = text.indexOf('{"data"');
if (start < 0) throw new Error('no JSON in file');
const end = text.lastIndexOf('}') + 1;
const out = process.argv[3];
const json = text.slice(start, end);
if (out) fs.writeFileSync(out, json);
else process.stdout.write(json);
