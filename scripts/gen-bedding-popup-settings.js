const fs = require('fs');
const path = require('path');

const tabs = [
  {
    key: 'twin',
    label: 'Twin',
    summary: 'In the Twin set: 1 flat sheet, 1 fitted sheet, 2 pillow shams',
    flatDim: '70" × 107"',
    fittedDim: '38" × 75"',
    sham: 'queen',
    shamName: 'Queen Pillow Shams',
    shamDim: '20" × 32"',
    shamNote: 'Fits standard & queen pillows',
    g: '<ul><li><strong>Best for:</strong> Ideal for kids, teens, or single adults in smaller rooms.</li><li><strong>Mattress fit:</strong> 38" × 75" mattresses up to 15" tall, including any topper.</li><li><strong>Shams:</strong> Queen size, fits standard & queen pillows.</li></ul>',
  },
  {
    key: 'twin_xl',
    label: 'Twin XL',
    summary: 'In the Twin XL set: 1 flat sheet, 1 fitted sheet, 2 pillow shams',
    flatDim: '70" × 112"',
    fittedDim: '38" × 80"',
    sham: 'queen',
    shamName: 'Queen Pillow Shams',
    shamDim: '20" × 32"',
    shamNote: 'Fits standard & queen pillows',
    g: '<ul><li><strong>Best for:</strong> Extra length for taller single sleepers and dorm beds.</li><li><strong>Mattress fit:</strong> 38" × 80" mattresses up to 15" tall, including any topper.</li><li><strong>Shams:</strong> Queen size, fits standard & queen pillows.</li></ul>',
  },
  {
    key: 'full',
    label: 'Full',
    summary: 'In the Full set: 1 flat sheet, 1 fitted sheet, 2 pillow shams',
    flatDim: '86" × 107"',
    fittedDim: '54" × 75"',
    sham: 'queen',
    shamName: 'Queen Pillow Shams',
    shamDim: '20" × 32"',
    shamNote: 'Fits standard & queen pillows',
    g: '<ul><li><strong>Best for:</strong> Great for single adults who want more room to stretch.</li><li><strong>Mattress fit:</strong> 54" × 75" mattresses up to 15" tall, including any topper.</li><li><strong>Shams:</strong> Queen size, fits standard & queen pillows.</li></ul>',
  },
  {
    key: 'queen',
    label: 'Queen',
    summary: 'In the Queen set: 1 flat sheet, 1 fitted sheet, 2 pillow shams',
    flatDim: '92" × 112"',
    fittedDim: '60" × 80"',
    sham: 'queen',
    shamName: 'Queen Pillow Shams',
    shamDim: '20" × 32"',
    shamNote: 'Fits standard & queen pillows',
    g: '<ul><li><strong>Best for:</strong> Perfect for most couples and spacious enough for single sleepers.</li><li><strong>Mattress fit:</strong> 60" × 80" mattresses up to 15" tall, including any topper.</li><li><strong>Shams:</strong> Queen size, fits standard & queen pillows.</li></ul>',
  },
  {
    key: 'king',
    label: 'King',
    summary: 'In the King set: 1 flat sheet, 1 fitted sheet, 2 pillow shams',
    flatDim: '108" × 112"',
    fittedDim: '76" × 80"',
    sham: 'king',
    shamName: 'King Pillow Shams',
    shamDim: '20" × 40"',
    shamNote: 'Fits king pillows',
    g: '<ul><li><strong>Best for:</strong> Best for couples who want maximum personal space.</li><li><strong>Mattress fit:</strong> 76" × 80" mattresses up to 15" tall, including any topper.</li><li><strong>Shams:</strong> King size, fits king pillows.</li></ul>',
  },
  {
    key: 'cal_king',
    label: 'Cal King',
    summary: 'In the Cal King set: 1 flat sheet, 1 fitted sheet, 2 pillow shams',
    flatDim: '104" × 116"',
    fittedDim: '72" × 84"',
    sham: 'king',
    shamName: 'King Pillow Shams',
    shamDim: '20" × 40"',
    shamNote: 'Fits king pillows',
    g: '<ul><li><strong>Best for:</strong> Designed for taller sleepers who need extra length.</li><li><strong>Mattress fit:</strong> 72" × 84" mattresses up to 15" tall, including any topper.</li><li><strong>Shams:</strong> King size, fits king pillows.</li></ul>',
  },
];

const base = [
  {
    type: 'paragraph',
    content:
      'Sheet set bedding size guide modal with size tabs. Set a Popup link ID below and paste the same value in the Variant picker Bedding Size Guide Popup ID field. If both are blank, the first bedding size popup block in this section is used.',
  },
  {
    type: 'text',
    id: 'link_id',
    label: 'Popup link ID',
    info: 'Optional custom ID (e.g. sheet-set-bedding-size-guide). Must match the Variant picker Bedding Size Guide Popup ID when linking a specific popup.',
  },
  { type: 'header', content: 'Header' },
  { type: 'text', id: 'heading', label: 'Heading', default: 'Size Guide' },
  {
    type: 'text',
    id: 'subtext',
    label: 'Subtext',
    default: 'Select your size to see every piece in the sheet set.',
  },
  {
    type: 'text',
    id: 'guidelines_heading',
    label: 'Guidelines section heading',
    default: 'Understanding Your Size',
  },
  { type: 'header', content: 'Set items' },
  {
    type: 'select',
    id: 'set_items_layout',
    label: 'Set items layout',
    default: 'grid',
    options: [
      { value: 'grid', label: 'Grid' },
      { value: 'slider', label: 'Slider' },
    ],
    info: 'Grid on all screens (default). Slider on mobile only (749px and below); desktop always uses grid.',
  },
];

const settings = [...base];

for (const t of tabs) {
  const p = t.key;
  const title = t.label;
  settings.push({ type: 'header', content: `${title} tab` });
  settings.push({ type: 'text', id: `${p}_tab_label`, label: 'Tab label', default: title });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_set_summary`,
    label: 'Set summary',
    default: t.summary,
  });
  settings.push({ type: 'header', content: `${title} — Flat sheet` });
  settings.push({ type: 'text', id: `${p}_flat_qty`, label: 'Quantity badge', default: 'Qty 1' });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_flat_name`,
    label: 'Name',
    default: 'Flat Sheet',
  });
  settings.push({ type: 'text', id: `${p}_flat_dimensions`, label: 'Dimensions', default: t.flatDim });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_flat_note`,
    label: 'Note',
    default: 'Generous tuck on all sides',
  });
  settings.push({ type: 'header', content: `${title} — Fitted sheet` });
  settings.push({ type: 'text', id: `${p}_fitted_qty`, label: 'Quantity badge', default: 'Qty 1' });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_fitted_name`,
    label: 'Name',
    default: 'Fitted Sheet',
  });
  settings.push({
    type: 'text',
    id: `${p}_fitted_dimensions`,
    label: 'Dimensions',
    default: t.fittedDim,
  });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_fitted_note`,
    label: 'Note',
    default: '15" deep pocket',
  });
  settings.push({ type: 'header', content: `${title} — Pillow shams` });
  settings.push({ type: 'text', id: `${p}_sham_qty`, label: 'Quantity badge', default: 'Qty 2' });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_sham_name`,
    label: 'Name',
    default: t.shamName,
  });
  settings.push({ type: 'text', id: `${p}_sham_dimensions`, label: 'Dimensions', default: t.shamDim });
  settings.push({
    type: 'inline_richtext',
    id: `${p}_sham_note`,
    label: 'Note',
    default: t.shamNote,
  });
  settings.push({
    type: 'select',
    id: `${p}_sham_visual`,
    label: 'Sham illustration size',
    default: t.sham,
    options: [
      { value: 'queen', label: 'Queen' },
      { value: 'king', label: 'King' },
    ],
  });
  settings.push({ type: 'header', content: `${title} — Guidelines` });
  settings.push({ type: 'richtext', id: `${p}_guidelines`, label: 'Guideline bullets', default: t.g });
}

const outPath = path.join(__dirname, '..', '.bedding-popup-settings.json');
fs.writeFileSync(outPath, JSON.stringify(settings, null, 2));
console.log('Wrote', settings.length, 'settings to', outPath);
