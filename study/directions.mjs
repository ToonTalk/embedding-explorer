// Is there one ray for "plural", "past tense", "-er" or "abstract"? Or is each a direction spread over many numbers?
import fs from "node:fs";
const pairs = JSON.parse(fs.readFileSync("pairs.json", "utf8"));
const { words } = JSON.parse(fs.readFileSync("pairs-words.json", "utf8"));
const buf = fs.readFileSync("pairs-vecs.bin");
const raw = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const D0 = 768;
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const tn = (v, d) => { const o = Array.from(v.slice(0, d)); const n = Math.sqrt(dot(o, o)); return o.map((x) => x / n); };
const out = {};
for (const d of [768, 256]) {
  const V = new Map(words.map((w, i) => [w, tn(raw.subarray(i * D0, i * D0 + D0), d)]));
  const groups = { plural: pairs.plural, past: pairs.past, bigger: pairs.bigger,
    abstract: pairs.concrete.map((c, i) => [c, pairs.abstract[i]]) }; // concrete → abstract (unpaired, but same count)
  for (const [name, ps] of Object.entries(groups)) {
    const diffs = ps.map(([a, b]) => V.get(b).map((x, i) => x - V.get(a)[i]));
    const mean = Array.from({ length: d }, (_, i) => diffs.reduce((s, v) => s + v[i], 0) / diffs.length);
    const sd = Array.from({ length: d }, (_, i) => Math.sqrt(diffs.reduce((s, v) => s + (v[i] - mean[i]) ** 2, 0) / diffs.length));
    const energy = mean.map((x) => x * x), tot = energy.reduce((a, b) => a + b, 0);
    const order = [...energy.keys()].sort((p, q) => energy[q] - energy[p]);
    const share = (k) => (100 * order.slice(0, k).reduce((s, i) => s + energy[i], 0) / tot).toFixed(0) + "%";
    // How often does the single best number go the right way, vs the whole direction (leave one out)?
    const best = order[0];
    const oneRay = diffs.filter((v) => Math.sign(v[best]) === Math.sign(mean[best])).length;
    let dirOk = 0;
    diffs.forEach((v, k) => {
      const m = mean.map((x, i) => (x * diffs.length - v[i]) / (diffs.length - 1));
      if (dot(v, m) > 0) dirOk++;
    });
    // How consistent across pairs is each number? (mean / spread)
    const t = mean.map((x, i) => Math.abs(x) / (sd[i] || 1));
    const tOrder = [...t.keys()].sort((p, q) => t[q] - t[p]);
    console.log(`d=${d} ${name}: top 1 number holds ${share(1)} of the direction, top 5 ${share(5)}, top 20 ${share(20)}, top 50 ${share(50)}; ` +
      `best single number (#${best + 1}) goes the right way for ${oneRay}/${diffs.length} pairs; whole direction ${dirOk}/${diffs.length}. ` +
      `Most consistent numbers: ${tOrder.slice(0, 6).map((i) => `#${i + 1} (${mean[i] > 0 ? "+" : "−"}, ${t[i].toFixed(1)})`).join(", ")}`);
    if (d === 768) out[name] = { top: order.slice(0, 8).map((i) => [i, +mean[i].toFixed(3)]), dir: mean.map((x) => +x.toFixed(4)) };
  }
}
// dogs − dog: which of its longest rays are plural numbers?
const V = new Map(words.map((w, i) => [w, tn(raw.subarray(i * D0, i * D0 + D0), 256)]));
const dd = V.get("dogs").map((x, i) => x - V.get("dog")[i]);
const longest = [...dd.keys()].sort((p, q) => Math.abs(dd[q]) - Math.abs(dd[p])).slice(0, 8);
console.log("dogs − dog (256 numbers), longest rays:", longest.map((i) => `#${i + 1} ${dd[i].toFixed(3)}`).join(", "));
fs.writeFileSync("directions.json", JSON.stringify(out));

// For the page: each direction's average change, and for each number how many pairs moved the same way as the average.
{
  const V = new Map(words.map((w, i) => [w, tn(raw.subarray(i * D0, i * D0 + D0), 768)]));
  const defs = {
    plural: { from: "one", to: "more than one", ps: pairs.plural },
    past: { from: "now", to: "in the past", ps: pairs.past },
    bigger: { from: "big", to: "bigger", ps: pairs.bigger },
    abstract: { from: "things you can touch", to: "ideas", ps: pairs.concrete.map((c, i) => [c, pairs.abstract[i]]) },
  };
  const dirs = {};
  for (const [k, { from, to, ps }] of Object.entries(defs)) {
    const diffs = ps.map(([a, b]) => V.get(b).map((x, i) => x - V.get(a)[i]));
    const mean = Array.from({ length: 768 }, (_, i) => diffs.reduce((s, v) => s + v[i], 0) / diffs.length);
    const agree = mean.map((m, i) => diffs.filter((v) => Math.sign(v[i]) === Math.sign(m)).length);
    dirs[k] = { from, to, n: ps.length, ex: ps.slice(0, 3).map((p) => p.join(" → ")), mean: mean.map((x) => +x.toFixed(4)), agree };
  }
  fs.writeFileSync("dirs.js", `const DIRS = ${JSON.stringify(dirs)};`);
  console.log("dirs.js", fs.statSync("dirs.js").size, "bytes");
}
