import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const STUDY = path.join(HERE, "..");
const tests = JSON.parse(fs.readFileSync(path.join(HERE, "tests.json"), "utf8"));
const out = JSON.parse(fs.readFileSync(path.join(HERE, "out.json"), "utf8"));
const W = JSON.parse(fs.readFileSync(path.join(STUDY, "words.json"), "utf8"));
const buf = fs.readFileSync(path.join(STUDY, "vecs.bin"));
const g768 = [];
for (let i = 0; i < W.words.length; i++) g768.push(Array.from(new Float32Array(buf.buffer, buf.byteOffset + i * 3072, 768)));
g768.push(...out.gemmaExtra);

const norm = (v) => { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
const trunc = (v, d) => norm(v.slice(0, d));
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const cos = (a, b) => dot(norm(a), norm(b));

// ---------- 1. Triplets ----------
const ti = new Map(out.tripTexts.map((t, i) => [t, i]));
const models = {
  USE: (t) => out.useTrip[ti.get(t)],
  "Gemma 768": (t) => out.gemmaTripS[ti.get(t)],
  "Gemma 256": (t) => trunc(out.gemmaTripS[ti.get(t)], 256),
  "Gemma sim-768": (t) => out.gemmaTripQ[ti.get(t)],
};
const rows = [];
for (const [cat, a, c, f] of tests.triplets) {
  const r = { cat, a, c, f };
  for (const [m, E] of Object.entries(models)) r[m] = [cos(E(a), E(c)), cos(E(a), E(f))];
  rows.push(r);
}
const f2 = (x) => x.toFixed(2);
const cats = [...new Set(rows.map((r) => r.cat))];
console.log("TRIPLETS: does the model put the same-meaning one closer than the look-alike?\n");
console.log("category".padEnd(30), Object.keys(models).map((m) => m.padStart(14)).join(""));
for (const c of cats) {
  const rs = rows.filter((r) => r.cat === c);
  console.log(c.padEnd(30), Object.keys(models).map((m) => `${rs.filter((r) => r[m][0] > r[m][1]).length}/${rs.length}`.padStart(14)).join(""));
}
console.log("ALL".padEnd(30), Object.keys(models).map((m) => `${rows.filter((r) => r[m][0] > r[m][1]).length}/${rows.length}`.padStart(14)).join(""));
console.log("\nrow detail: close / far (USE | Gemma 768 | Gemma sim-768)");
for (const r of rows) {
  const s = (m) => `${f2(r[m][0])}/${f2(r[m][1])}${r[m][0] > r[m][1] ? " ✓" : " ✗"}`;
  console.log(`${r.a} → ${r.c} | ${r.f}\n    USE ${s("USE")}   Gemma ${s("Gemma 768")}   Gemma-sim ${s("Gemma sim-768")}`);
}

// ---------- 2. Analogies over the vocabulary ----------
const words = out.allWords;
const wi = new Map(words.map((w, i) => [w, i]));
const center = (V) => { const m = new Array(V[0].length).fill(0); for (const v of V) for (let i = 0; i < v.length; i++) m[i] += v[i] / V.length; return V.map((v) => norm(v.map((x, i) => x - m[i]))); };
const spaces = {
  USE: out.useWords.map(norm),
  "Gemma 768": g768.map(norm),
  "Gemma 256": g768.map((v) => trunc(v, 256)),
  "USE centered": center(out.useWords.map(norm)),
  "Gemma 768 centered": center(g768.map(norm)),
};
console.log(`\nANALOGIES a − b + c among ${words.length} words (inputs excluded): rank of the expected answer`);
console.log("analogy".padEnd(34), Object.keys(spaces).map((m) => m.padStart(19)).join(""));
const hits = Object.fromEntries(Object.keys(spaces).map((k) => [k, 0]));
for (const [a, b, c, d] of tests.analogies) {
  const cells = [];
  for (const [m, V] of Object.entries(spaces)) {
    const q = norm(V[wi.get(a)].map((x, i) => x - V[wi.get(b)][i] + V[wi.get(c)][i]));
    const scored = V.map((v, i) => [dot(q, v), i]).filter(([, i]) => ![a, b, c].includes(words[i])).sort((x, y) => y[0] - x[0]);
    const rank = scored.findIndex(([, i]) => words[i] === d) + 1;
    if (rank === 1) hits[m]++;
    cells.push(`${rank === 1 ? "1 ✓" : rank + " (" + words[scored[0][1]] + ")"}`.padStart(19));
  }
  console.log(`${a}−${b}+${c}=${d}`.padEnd(34), cells.join(""));
}
console.log("TOP-1 HITS".padEnd(34), Object.keys(spaces).map((m) => `${hits[m]}/${tests.analogies.length}`.padStart(19)).join(""));

// ---------- 3. Neighbors in the same group ----------
console.log("\nNEIGHBORS: share of each grouped word's 5 nearest words (of all", words.length, ") from its own group");
const group = new Map();
for (const [c, ws] of Object.entries(W.cats)) for (const w of ws) if (wi.has(w)) group.set(w, c);
for (const [m, V] of Object.entries(spaces)) {
  let same = 0, tot = 0;
  for (const [w, c] of group) {
    const i = wi.get(w);
    const nn = V.map((v, j) => [dot(V[i], v), j]).filter(([, j]) => j !== i).sort((x, y) => y[0] - x[0]).slice(0, 5);
    for (const [, j] of nn) { tot++; if (group.get(words[j]) === c) same++; }
  }
  console.log(m.padEnd(20), (100 * same / tot).toFixed(0) + "%");
}

// ---------- 4. Nearest words for a few probes ----------
const probe = ["🐶", "TikTok", "ChatGPT", "COVID-19", "Je t'aime"];
console.log("\nNEAREST VOCAB WORDS to some test texts");
for (const p of probe) {
  for (const [m, V, E] of [["USE", spaces.USE, out.useTrip], ["Gemma", spaces["Gemma 768"], out.gemmaTripS]]) {
    const q = norm(E[ti.get(p)]);
    const nn = V.map((v, j) => [dot(q, v), j]).sort((x, y) => y[0] - x[0]).slice(0, 6).map(([s, j]) => `${words[j]} ${f2(s)}`);
    console.log(`${p.padEnd(10)} ${m.padEnd(6)} ${nn.join(", ")}`);
  }
}
fs.writeFileSync(path.join(HERE, "triplets.json"), JSON.stringify(rows, null, 1));
