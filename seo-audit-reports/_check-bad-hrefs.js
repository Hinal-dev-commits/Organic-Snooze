const bodies = process.argv.slice(2);
const bad = ["/collections/mattresses", "/collections/accessories"];
for (const b of bodies) {
  const hits = bad.filter((p) => b.includes(`href="${p}`) || b.includes(`href='${p}`));
  console.log(hits.length ? "BAD:" + hits.join(",") : "OK");
}
