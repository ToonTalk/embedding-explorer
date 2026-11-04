import fs from "node:fs";
const { words, cats } = JSON.parse(fs.readFileSync("words.json", "utf8"));
const buf = fs.readFileSync("vecs.bin");
const raw = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const D = 768;
const vec = (i) => raw.subarray(i * D, i * D + D);
const W = new Map(words.map((w, i) => [w, vec(i)]));
const media = JSON.parse(fs.readFileSync("media.json", "utf8")).map((m) => ({ ...m, vec: Float32Array.from(m.vec) }));
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const tn = (v, d) => { const o = v.slice(0, d); const n = Math.sqrt(dot(o, o)) || 1; return o.map((x) => x / n); };
const sub = (a, b) => a.map((x, i) => x - b[i]);
const mode = process.argv[2];

if (mode === "house") {
  // Ken's screenshot: the old example set plus "horse", shared part taken away.
  const ex = ["dog", "cat", "tiger", "butterfly", "house", "beach", "turtle", "a speech", "piano music", "apple", "fruit", "horse"];
  const things = [...ex.map((w) => ({ label: w, kind: "text", vec: W.get(w) })), ...media];
  for (const d of [768, 256, 128]) for (const center of [true, false]) {
    const V = things.map((t) => tn(t.vec, d));
    let mean = null;
    if (center) { mean = new Float32Array(d); for (const v of V) for (let i = 0; i < d; i++) mean[i] += v[i] / V.length; }
    const view = (v) => center ? tn(sub(v, mean), d) : v;
    const X = new Map(things.map((t, k) => [t.kind + ":" + t.label, view(V[k])]));
    const g = (l) => X.get("text:" + l);
    for (const C of ["dog", "horse"]) {
      let r = g("tiger").map((x, i) => x - g("cat")[i] + g(C)[i]); const n = Math.sqrt(dot(r, r)); r = r.map((x) => x / n);
      const ranked = [...X].map(([k, v]) => [k, dot(r, v)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
      console.log(`d=${d} center=${center} tiger-cat+${C}: ` + ranked.map(([k, s]) => `${k} ${s.toFixed(2)}`).join(", "));
      for (const t of ["house", "horse", "dog", "turtle"]) if (t !== C) {
        console.log(`   ${t}: ·tiger ${dot(g(t), g("tiger")).toFixed(2)}  ·cat ${dot(g(t), g("cat")).toFixed(2)}  ·${C} ${dot(g(t), g(C)).toFixed(2)}`);
      }
    }
  }
  // house vs horse in the big vocabulary, no centering
  const near = (w, d = 768) => words.filter((x) => x !== w).map((x) => [x, dot(tn(W.get(w), d), tn(W.get(x), d))]).sort((a, b) => b[1] - a[1]);
  for (const w of ["house", "horse", "mouse", "hose"]) if (W.has(w)) {
    const n = near(w);
    console.log(`${w}: rank of house/horse/mouse:`, ["house", "horse", "mouse"].filter((x) => x !== w).map((x) => `${x} #${n.findIndex(([y]) => y === x) + 1} (${n.find(([y]) => y === x)?.[1].toFixed(2)})`).join(", "), " top:", n.slice(0, 8).map(([x, s]) => `${x} ${s.toFixed(2)}`).join(", "));
  }
}

if (mode === "dims") {
  // How well do the first d numbers keep the neighborhoods? Category agreement of the 5 nearest words.
  const catOf = new Map(); for (const [c, ws] of Object.entries(cats)) for (const w of ws) if (!catOf.has(w)) catOf.set(w, c);
  const cw = [...catOf.keys()];
  for (const center of [false, true]) for (const d of [768, 512, 256, 128, 64]) {
    let V = cw.map((w) => tn(W.get(w), d));
    if (center) { const m = new Float32Array(d); for (const v of V) for (let i = 0; i < d; i++) m[i] += v[i] / V.length; V = V.map((v) => tn(sub(v, m), d)); }
    let hits = 0, tot = 0;
    for (let i = 0; i < cw.length; i++) {
      const s = V.map((v, j) => [j, j === i ? -9 : dot(V[i], v)]).sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [j] of s) { tot++; if (catOf.get(cw[j]) === catOf.get(cw[i])) hits++; }
    }
    // media: is the right word nearest among the example words?
    const pairs = { corgi: "dog", cats: "cat", tiger: "tiger", butterfly: "butterfly", house: "house", beach: "beach", "dog barking": "dog", "cat meowing": "cat", "JFK speech": "a speech", piano: "piano music", "sea turtle": "turtle" };
    const ex = ["dog", "cat", "tiger", "butterfly", "house", "beach", "turtle", "a speech", "piano music", "apple", "fruit"];
    let mh = 0;
    for (const m of media) {
      const best = ex.map((w) => [w, dot(tn(m.vec, d), tn(W.get(w), d))]).sort((a, b) => b[1] - a[1])[0][0];
      if (best === pairs[m.label]) mh++;
    }
    console.log(`center=${center} d=${d}: neighbors in same category ${(100 * hits / tot).toFixed(1)}%   media→right word ${mh}/${media.length}`);
  }
}

if (mode === "rays") {
  // For each position: which words are unusually high or low there?
  const N = words.length;
  const V = words.map((w) => tn(W.get(w), D));
  const mean = new Float64Array(D), sd = new Float64Array(D);
  for (const v of V) for (let i = 0; i < D; i++) mean[i] += v[i] / N;
  for (const v of V) for (let i = 0; i < D; i++) sd[i] += (v[i] - mean[i]) ** 2 / N;
  for (let i = 0; i < D; i++) sd[i] = Math.sqrt(sd[i]);
  const catOf = new Map(); for (const [c, ws] of Object.entries(cats)) for (const w of ws) catOf.set(w, c);
  const out = [];
  for (let i = 0; i < D; i++) {
    const z = V.map((v) => (v[i] - mean[i]) / sd[i]);
    const order = z.map((x, k) => [k, x]).sort((a, b) => b[1] - a[1]);
    const catZ = Object.entries(cats).map(([c, ws]) => { const zs = ws.map((w) => z[words.indexOf(w)]); return [c, zs.reduce((a, b) => a + b, 0) / zs.length]; }).sort((a, b) => b[1] - a[1]);
    out.push({ i, mean: mean[i], sd: sd[i], high: order.slice(0, 14).map(([k, x]) => [words[k], +x.toFixed(2)]), low: order.slice(-14).reverse().map(([k, x]) => [words[k], +x.toFixed(2)]),
      catHigh: catZ.slice(0, 3).map(([c, x]) => [c, +x.toFixed(2)]), catLow: catZ.slice(-3).reverse().map(([c, x]) => [c, +x.toFixed(2)]) });
  }
  fs.writeFileSync("rays.json", JSON.stringify(out));
  // biggest average size (the "long rays" every star shares)
  const big = out.map((r) => [r.i, Math.abs(r.mean), r.sd]).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log("biggest average |value| (position, |mean|, spread):", big.map(([i, m, s]) => `${i}:${m.toFixed(3)}/${s.toFixed(3)}`).join("  "));
  // media vs words on those positions
  for (const [i] of big.slice(0, 6)) {
    const wv = V.map((v) => v[i]); const wm = wv.reduce((a, b) => a + b, 0) / N;
    console.log(`#${i}: words avg ${wm.toFixed(3)}; ` + media.map((m) => `${m.kind[0]}:${m.label} ${tn(m.vec, D)[i].toFixed(3)}`).join(" "));
  }
  // positions whose category signal is strongest
  const strong = out.map((r) => [r.i, Math.max(Math.abs(r.catHigh[0][1]), Math.abs(r.catLow[0][1]))]).sort((a, b) => b[1] - a[1]);
  console.log("strongest category signals:", strong.slice(0, 40).map(([i, s]) => `${i}:${s.toFixed(2)}`).join(" "));
  console.log("first 128 with |cat z| > 1:", strong.filter(([i, s]) => i < 128 && s > 1).length, " > 0.8:", strong.filter(([i, s]) => i < 128 && s > 0.8).length);
}
