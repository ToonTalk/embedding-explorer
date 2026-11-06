// Builds vocab.bin: the word list the app can search in sections 5 and 6 ("Also search 2,800 everyday words").
//
//   node tools/build-vocab.mjs
//
// Needs the study's embeddings (see study/README.md): study/words.json + study/vecs.bin, and
// study/then-and-now/out.json for the analogy words added in that study. They were made with
// the 4-bit model on WebGPU and the default instruction "task: search result | query: ".
//
// Format: uint32 header length, header JSON {words, dims, instruction, dtype, device}, padding to
// 4 bytes, then a float32 scale per word, then dims int8 numbers per word (value = int8 * scale).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
// `node tools/build-vocab.mjs sv` builds sv/vocab.bin from study/sv/ (another language: no then-and-now extras).
const lang = process.argv[2] || "";
const study = path.join(root, "study", lang);
const D = 768;
const W = JSON.parse(fs.readFileSync(path.join(study, "words.json"), "utf8")).words;
const buf = fs.readFileSync(path.join(study, "vecs.bin"));
if (buf.length !== W.length * D * 4) throw new Error("vecs.bin doesn't match words.json");
const out = lang ? { allWords: W, gemmaExtra: [] } : JSON.parse(fs.readFileSync(path.join(study, "then-and-now", "out.json"), "utf8"));
const extra = out.allWords.slice(W.length);
if (extra.length !== out.gemmaExtra.length) throw new Error("out.json extras don't line up");

const words = [], vecs = [], seen = new Set();
const take = (w, v) => {
  if (/[.?!]$/.test(w)) return; // full sentences: leave them to the Questions set
  const k = w.toLowerCase();
  if (seen.has(k)) return;
  seen.add(k); words.push(w); vecs.push(v);
};
W.forEach((w, i) => take(w, new Float32Array(buf.buffer, buf.byteOffset + i * D * 4, D)));
extra.forEach((w, i) => take(w, Float32Array.from(out.gemmaExtra[i])));

const n = words.length;
const scales = new Float32Array(n), q = new Int8Array(n * D);
let worst = 1, worst256 = 1;
const cos = (a, b, d) => { let s = 0, x = 0, y = 0; for (let i = 0; i < d; i++) { s += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return s / Math.sqrt(x * y); };
for (let k = 0; k < n; k++) {
  const v = vecs[k];
  const m = v.reduce((a, x) => Math.max(a, Math.abs(x)), 0) || 1;
  scales[k] = m / 127;
  const back = new Float32Array(D);
  for (let i = 0; i < D; i++) { q[k * D + i] = Math.round(v[i] / scales[k]); back[i] = q[k * D + i] * scales[k]; }
  worst = Math.min(worst, cos(v, back, D));
  worst256 = Math.min(worst256, cos(v, back, 256));
}
const header = Buffer.from(JSON.stringify({ words, dims: D, instruction: "task: search result | query: ", dtype: "q4", device: "webgpu" }));
const pad = (4 - ((4 + header.length) % 4)) % 4;
const file = Buffer.concat([Buffer.from(new Uint32Array([header.length]).buffer), header, Buffer.alloc(pad), Buffer.from(scales.buffer), Buffer.from(q.buffer)]);
fs.writeFileSync(path.join(root, lang, "vocab.bin"), file);
console.log(`vocab.bin: ${n} words, ${(file.length / 1e6).toFixed(2)} MB; worst similarity to the original after rounding: ${worst.toFixed(5)} (768 numbers), ${worst256.toFixed(5)} (first 256)`);
