// Turn the study into a compact table the page can carry: for each of the 768 positions,
// the everyday words that are unusually high and low there, and any category that leans one way.
import fs from "node:fs";
const { words, cats } = JSON.parse(fs.readFileSync("words.json", "utf8"));
const buf = fs.readFileSync("vecs.bin");
const raw = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const media = JSON.parse(fs.readFileSync("media.json", "utf8"));
const D = 768, N = words.length;
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const tn = (v) => { const n = Math.sqrt(dot(v, v)); return Array.from(v, (x) => x / n); };
const V = words.map((w, i) => tn(raw.subarray(i * D, i * D + D)));
const mean = new Float64Array(D), sd = new Float64Array(D);
for (const v of V) for (let i = 0; i < D; i++) mean[i] += v[i] / N;
for (const v of V) for (let i = 0; i < D; i++) sd[i] += (v[i] - mean[i]) ** 2 / N;
for (let i = 0; i < D; i++) sd[i] = Math.sqrt(sd[i]);

const CAT_NAME = { animals: "animals", food: "food", body: "the body", places: "places", objects: "everyday objects", vehicles: "vehicles",
  nature: "nature and weather", colors: "colors", numbers: "numbers", time: "times and dates", people: "people", feelings: "feelings",
  abstract: "big ideas", actions: "actions", describing: "describing words", music: "music", sports: "sports",
  "science and tech": "science and technology", "function words": "little words like “the” and “of”", sentences: "whole sentences" };
// Only everyday words are shown (the common-word list is full of web words); all of them set the average.
const show = [...new Set(Object.values(cats).flat())].filter((w) => !["the", "and", "of", "to", "in", "is", "that", "it", "for", "on", "with", "as", "at", "by", "from", "but", "not", "or", "if", "so"].includes(w));
const vocab = show;
const idx = new Map(words.map((w, i) => [w, i]));
const K = 6;
const rays = [];
for (let i = 0; i < D; i++) {
  const z = (w) => (V[idx.get(w)][i] - mean[i]) / sd[i];
  const order = vocab.map((w, k) => [k, z(w)]).sort((a, b) => b[1] - a[1]);
  const cz = Object.entries(cats).map(([c, ws]) => [c, ws.reduce((a, w) => a + z(w), 0) / ws.length]).sort((a, b) => b[1] - a[1]);
  const hi = cz[0][1] >= 1 ? CAT_NAME[cz[0][0]] : "", lo = cz.at(-1)[1] <= -1 ? CAT_NAME[cz.at(-1)[0]] : "";
  rays.push([order.slice(0, K).map(([k]) => k), order.slice(-K).reverse().map(([k]) => k), hi, lo]);
}
// The positions that are big for everything: the shared part.
const avg = (kind) => { const ms = media.filter((m) => m.kind === kind).map((m) => tn(m.vec)); return Array.from({ length: D }, (_, i) => ms.reduce((a, v) => a + v[i], 0) / ms.length); };
const pic = avg("image"), snd = avg("audio");
const shared = {};
for (let i = 0; i < D; i++) if (Math.abs(mean[i]) > 0.08 && Math.abs(mean[i]) > 4 * sd[i]) shared[i] = [+mean[i].toFixed(2), +pic[i].toFixed(2), +snd[i].toFixed(2)];
const js = `const RAYS = ${JSON.stringify({ vocab, rays, shared, n: N })};`;
fs.writeFileSync("rays.js", js);
console.log("bytes", js.length, "shared", JSON.stringify(shared));
const themed = rays.filter((r) => r[2] || r[3]).length;
console.log(`positions with a leaning category: ${themed}/768; first 256: ${rays.slice(0, 256).filter((r) => r[2] || r[3]).length}`);
for (const i of [0, 3, 10, 27, 112, 617]) console.log(i, rays[i][2], "/", rays[i][3], "| +", rays[i][0].map((k) => vocab[k]).join(", "), "| -", rays[i][1].map((k) => vocab[k]).join(", "));
