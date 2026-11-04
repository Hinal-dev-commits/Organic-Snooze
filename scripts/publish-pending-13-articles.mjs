/**
 * Reads pending article payloads and prints summary.
 * Actual publish uses Shopify MCP graphql_mutation from the agent.
 */
import fs from 'fs';
import path from 'path';

const pending = [
  '004-article-what-is-the-gary-brecka-sleep-optimization-challenge-by-the-ultimate-human-what-to-expect-official-link.json',
  '006-article-how-to-get-your-mattress-covered-by-hsa-or-fsa-step-by-step-guide.json',
  '012-article-blogs-blog-is-melatonin-bad-for-you.json',
  '013-article-blogs-blog-best-sleep-position-hips-back-hurt.json',
  '026-article-how-poor-sleep-disrupts-estrogen-progesterone-and-the-hormones-women-dont-talk-about-enough.json',
  '027-article-why-growth-hormone-only-works-when-youre-asleep-and-whats-getting-in-the-way.json',
  '028-article-how-to-increase-testosterone-naturally-why-sleep-is-more-powerful-than-any-supplement.json',
  '029-article-why-organic-wool-is-the-safer-flame-retardant-and-whats-really-in-your-conventional-mattress.json',
  '030-article-how-often-should-you-clean-your-sheets-the-answer-is-more-unsettling-than-you-think.json',
  '031-article-what-do-my-dreams-mean-the-science-behind-what-your-brain-is-actually-doing-while-you-sleep.json',
  '033-article-do-mattress-toppers-really-work-the-honest-answer-and-when-organic-latex-changes-everything.json',
  '034-article-why-your-body-temperature-is-the-master-key-to-deep-sleep-and-what-your-mattress-has-to-do-with-it.json',
  '035-article-how-poor-sleep-makes-you-gain-weight-and-why-it-has-nothing-to-do-with-willpower.json',
];

const dir = path.join(process.cwd(), 'seo-audit-reports', 'bulk-update-items');
const out = path.join(process.cwd(), 'seo-audit-reports', 'pending-13-payloads.json');

const payloads = pending.map((name) => {
  const u = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  return { id: u.id, handle: u.handle, body: u.body };
});

fs.writeFileSync(out, JSON.stringify(payloads));
console.log('Wrote', payloads.length, 'payloads to', out);
