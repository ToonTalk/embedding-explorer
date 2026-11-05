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
const words=out.allWords, wi=new Map(words.map((w,i)=>[w,i]));
const group=new Map(); for(const [c,ws] of Object.entries(W.cats)) for(const w of ws) if(wi.has(w)) group.set(w,c);
const S={USE:out.useWords.map(norm), Gemma:g.map(norm)};
const gw=[...group.keys()];
for (const [m,V] of Object.entries(S)) {
  let same=0,tot=0;
  for (const w of gw){const i=wi.get(w); const nn=gw.filter(x=>x!==w).map(x=>[dot(V[i],V[wi.get(x)]),x]).sort((a,b)=>b[0]-a[0]).slice(0,5); for(const [,x] of nn){tot++; if(group.get(x)===group.get(w)) same++;}}
  console.log(m,"grouped words only:",(100*same/tot).toFixed(0)+"%");
}
for (const w of ["dog","apple","happy","guitar","doctor","red","run","tuesday","beautiful","because"]) for (const [m,V] of Object.entries(S)) {
  const i=wi.get(w); console.log(w.padEnd(10),m.padEnd(6),V.map((v,j)=>[dot(V[i],v),j]).filter(([,j])=>j!==i).sort((a,b)=>b[0]-a[0]).slice(0,7).map(([s,j])=>words[j]).join(", "));
}
