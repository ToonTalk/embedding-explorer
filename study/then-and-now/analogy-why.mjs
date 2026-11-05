// Why does puppy − dog + cat land on kitten? Two equivalent views, measured on the app's model.
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const at = (f) => path.join(HERE, f);
const out = JSON.parse(fs.readFileSync(at("out.json"), "utf8"));
const W = JSON.parse(fs.readFileSync(at("../words.json"), "utf8"));
const buf = fs.readFileSync(at("../vecs.bin"));
const g = []; for (let i = 0; i < W.words.length; i++) g.push(Array.from(new Float32Array(buf.buffer, buf.byteOffset + i * 3072, 768)));
g.push(...out.gemmaExtra);
const words = out.allWords, wi = new Map(words.map((w, i) => [w, i]));
const norm = (v) => { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const sub = (a, b) => a.map((x, i) => x - b[i]);
const cos = (a, b) => dot(norm(a), norm(b));
const center = (V) => { const m = new Array(V[0].length).fill(0); for (const v of V) for (let i = 0; i < v.length; i++) m[i] += v[i] / V.length; return V.map((v) => norm(v.map((x, i) => x - m[i]))); };
for (const [name, V] of [["768", g.map(norm)], ["256", g.map((v) => norm(v.slice(0, 256)))], ["256 centered", center(g.map((v) => norm(v.slice(0, 256))))]]) {
  const E = (w) => V[wi.get(w)];
  console.log(`\n== ${name} numbers`);
  for (const [a, b, c, d] of [["puppy", "dog", "cat", "kitten"], ["king", "man", "woman", "queen"], ["tiger", "cat", "dog", "wolf"]]) {
    const arrow1 = sub(E(a), E(b)), arrow2 = sub(E(d), E(c));
    // baseline: arrows between random word pairs
    let base = 0, n = 2000; for (let k = 0; k < n; k++) { const r = () => V[Math.floor(Math.random() * V.length)]; base += Math.abs(cos(sub(r(), r()), arrow1)); } base /= n;
    console.log(`${a}−${b}+${c}: arrow ${a}−${b} vs arrow ${d}−${c}: ${cos(arrow1, arrow2).toFixed(2)} (random arrows: ${base.toFixed(2)} on average)`);
    const r = norm(E(a).map((x, i) => x - E(b)[i] + E(c)[i]));
    const rows = V.map((v, j) => [words[j], dot(v, E(a)), dot(v, E(b)), dot(v, E(c)), dot(v, r)]).sort((x, y) => y[4] - x[4]).slice(0, 6);
    for (const [w, sa, sb, sc, s] of rows) console.log(`   ${w.padEnd(10)} result ${s.toFixed(2)}   ${a} ${sa.toFixed(2)} − ${b} ${sb.toFixed(2)} + ${c} ${sc.toFixed(2)} = ${(sa - sb + sc).toFixed(2)}`);
  }
}
