// Packs the files the Claude artifact keeps in its own storage into text parts.
//
//   node tools/pack-artifact.mjs <out dir> <file…>
//
// The artifact's storage takes pictures, videos and text (scripts, JSON) and checks every file
// before an artifact can be shared publicly. The model, the word list and the sounds aren't
// pictures or videos, so each is stored as text: split into slices of 11,000,000 bytes, and each
// slice saved as "<file>.partNN.js" holding one JSON object, {"b64": "<the slice in base64>"}
// (under the 16 MiB limit for scripts). Pictures and videos are stored as they are.
//
// A file given as pieces ("x.part00.mp4", "x.part01.mp4"…, how earlier versions were stored) is
// joined back together first; "x.wav.mp4" and "x.bin.mp4" are read as "x.wav" and "x.bin".
import fs from "node:fs";
import path from "node:path";

const PART_RAW = 11_000_000;
const [out, ...inputs] = process.argv.slice(2);
if (!out || !inputs.length) throw new Error("usage: node tools/pack-artifact.mjs <out dir> <file…>");

const files = new Map(); // name -> [[piece number, path]]
for (const p of inputs) {
  const base = path.basename(p);
  const m = /^(.+)\.part(\d+)\.mp4$/.exec(base);
  const name = m ? m[1] : base.replace(/\.(wav|bin)\.mp4$/, ".$1");
  if (!files.has(name)) files.set(name, []);
  files.get(name).push([m ? +m[2] : 0, p]);
}
fs.mkdirSync(out, { recursive: true });
// parts.txt: "<part> <slice bytes>" per part, ready for the asset ids after the upload
// (tools/artifact-assets.txt wants "<part> <asset id> <slice bytes>").
const list = [];
let n = 0, total = 0;
for (const [name, pieces] of files) {
  pieces.sort((a, b) => a[0] - b[0]);
  pieces.forEach(([k], i) => { if (k !== i) throw new Error(`${name}: piece ${i} is missing`); });
  const bytes = Buffer.concat(pieces.map(([, p]) => fs.readFileSync(p)));
  for (let at = 0, i = 0; at < bytes.length || i === 0; at += PART_RAW, i++) {
    const part = `${name}.part${String(i).padStart(2, "0")}.js`, slice = bytes.subarray(at, at + PART_RAW);
    fs.writeFileSync(path.join(out, part), JSON.stringify({ b64: slice.toString("base64") }));
    list.push(`${part} ${slice.length}`);
    n++;
  }
  total += bytes.length;
}
fs.writeFileSync(path.join(out, "parts.txt"), list.join("\n") + "\n");
console.log(`${files.size} files (${(total / 1e6).toFixed(1)} MB) -> ${n} parts in ${out}`);
