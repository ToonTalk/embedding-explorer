import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const at = (f) => path.join(HERE, f);
const out = JSON.parse(fs.readFileSync(at("out.json"),"utf8"));
const W = JSON.parse(fs.readFileSync(at("../words.json"),"utf8"));
const buf = fs.readFileSync(at("../vecs.bin"));
const g = []; for (let i=0;i<W.words.length;i++) g.push(Array.from(new Float32Array(buf.buffer, buf.byteOffset+i*3072, 768)));
g.push(...out.gemmaExtra);
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)}; const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s};
const center=V=>{const m=new Array(V[0].length).fill(0);for(const v of V)for(let i=0;i<v.length;i++)m[i]+=v[i]/V.length;return V.map(v=>norm(v.map((x,i)=>x-m[i])))};
const words=out.allWords, wi=new Map(words.map((w,i)=>[w,i]));
const S={"USE":out.useWords.map(norm),"USE centered":center(out.useWords.map(norm)),"Gemma 768":g.map(norm),"Gemma 256":g.map(v=>norm(v.slice(0,256))),"Gemma 768 centered":center(g.map(norm)),"Gemma 128":g.map(v=>norm(v.slice(0,128)))};
const pairs=[["man","woman"],["men","women"],["boy","girl"],["male","female"],["he","she"],["husband","wife"],["father","mother"],["king","queen"]];
console.log("missing:",pairs.flat().concat(["dog","cat","dogs","cats"]).filter(w=>!wi.has(w)).join(" "));
for (const [m,V] of Object.entries(S)) {
  const s=(a,b)=>dot(V[wi.get(a)],V[wi.get(b)]);
  console.log("\n"+m);
  for (const [a,b] of pairs) { if(!wi.has(a)||!wi.has(b)) continue;
    const da=s(a,"dog")-s(a,"cat"), db=s(b,"dog")-s(b,"cat");
    console.log(`  ${a.padEnd(8)} dog ${s(a,"dog").toFixed(3)} cat ${s(a,"cat").toFixed(3)}  (dog−cat ${da>=0?"+":""}${da.toFixed(3)})   ${b.padEnd(7)} dog ${s(b,"dog").toFixed(3)} cat ${s(b,"cat").toFixed(3)} (dog−cat ${db>=0?"+":""}${db.toFixed(3)})   ${da>db?"fits Hinton":"opposite"}`);
  }
}
console.log("\nHow big is a 0.01–0.03 lean? Spread of (dog − cat) lean over all words, and random pairs:");
for (const m of ["Gemma 768","Gemma 256","USE"]) {
  const V=S[m], d=V[wi.get("dog")], c=V[wi.get("cat")];
  const lean=V.map(v=>dot(v,d)-dot(v,c));
  const mean=lean.reduce((a,b)=>a+b)/lean.length, sd=Math.sqrt(lean.reduce((a,b)=>a+(b-mean)**2,0)/lean.length);
  // random word pairs: how often is |lean(a)-lean(b)| >= the gender gap
  const gaps=[["man","woman"],["men","women"],["boy","girl"],["male","female"],["father","mother"],["king","queen"]].map(([a,b])=>lean[wi.get(a)]-lean[wi.get(b)]);
  const avg=gaps.reduce((a,b)=>a+b)/gaps.length;
  let big=0,N=20000; for(let k=0;k<N;k++){const i=Math.floor(Math.random()*V.length),j=Math.floor(Math.random()*V.length); if(Math.abs(lean[i]-lean[j])>=avg) big++;}
  console.log(`  ${m.padEnd(10)} sd of lean ${sd.toFixed(3)}; mean male−female gap ${avg.toFixed(3)}; random pairs with a gap that big: ${(100*big/N).toFixed(0)}%`);
}
