import fs from "node:fs";
const { words } = JSON.parse(fs.readFileSync("words.json", "utf8"));
const buf = fs.readFileSync("vecs.bin"); const raw = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const D = 768, dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const tn = (v, d) => { const o = v.slice(0, d); const n = Math.sqrt(dot(o, o)) || 1; return o.map((x) => x / n); };
for (const d of [768, 256, 128]) {
  let V = words.map((w, i) => tn(raw.subarray(i * D, i * D + D), d));
  const m = new Float32Array(d); for (const v of V) for (let i = 0; i < d; i++) m[i] += v[i] / V.length;
  V = V.map((v) => tn(v.map((x, i) => x - m[i]), d));
  const g = (w) => V[words.indexOf(w)];
  for (const [a, b, c] of [["tiger", "cat", "dog"], ["tiger", "cat", "horse"], ["king", "man", "woman"], ["kitten", "cat", "dog"]]) {
    if (!words.includes(a) || !words.includes(c)) { console.log("missing", a, c); continue; }
    let r = g(a).map((x, i) => x - g(b)[i] + g(c)[i]); r = tn(r, d);
    const top = words.map((w, k) => [w, dot(r, V[k])]).filter(([w]) => ![a, b, c].includes(w)).sort((x, y) => y[1] - x[1]).slice(0, 8);
    const wolf = words.includes("wolf") ? words.map((w, k) => [w, dot(r, V[k])]).sort((x, y) => y[1] - x[1]).findIndex(([w]) => w === "wolf") + 1 : "-";
    console.log(`d=${d} ${a}-${b}+${c}: ${top.map(([w, s]) => w + " " + s.toFixed(2)).join(", ")}  (wolf rank ${wolf})`);
  }
}
