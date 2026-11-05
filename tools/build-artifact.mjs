// Builds the Claude artifact edition of Embedding Explorer from index.html.
//
//   node tools/build-artifact.mjs [assets.txt] [out.html]
//
// assets.txt lists what is stored in the artifact, one per line: "<name> <asset id> <bytes>".
//   - Model and engine files are split into pieces named "<file>.partNN.mp4" (uploaded as video/mp4,
//     which the asset store accepts for any binary data). "<file>" is the Hugging Face path with
//     "/" turned into "_", e.g. onnx_model_q4.onnx_data.part03.mp4.
//   - Example media keep their names (corgi.jpg, sea-turtle.mp4); sounds are stored as "<name>.wav.mp4", and the word list as "vocab.bin.mp4".
// The page gets window.__EMBEX_PACK__ = { files: { name: { size, parts } }, media: { file: url } },
// and index.html serves the model and the examples from it (see PACK in index.html).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const assetsFile = process.argv[2] || path.join(root, "tools", "artifact-assets.txt");
const outFile = process.argv[3] || path.join(root, "dist", "embedding-explorer-artifact.html");

const pack = { files: {}, media: {} };
const pieces = {};
for (const line of fs.readFileSync(assetsFile, "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [name, id, bytes] = line.trim().split(/\s+/);
  if (!/^[0-9a-f]{32}$/.test(id) || !(+bytes > 0)) throw new Error(`Bad line: ${line}`);
  const url = "/_blob/" + id;
  const m = /^(.+)\.part(\d+)\.mp4$/.exec(name);
  if (m) (pieces[m[1]] ||= []).push([+m[2], url, +bytes]);
  else pack.media[name.replace(/\.(wav|bin)\.mp4$/, ".$1")] = url;
}
for (const [file, ps] of Object.entries(pieces)) {
  ps.sort((a, b) => a[0] - b[0]);
  ps.forEach(([k], i) => { if (k !== i) throw new Error(`${file}: piece ${i} is missing`); });
  pack.files[file] = { size: ps.reduce((s, p) => s + p[2], 0), parts: ps.map((p) => p[1]) };
}

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const strip = (re, what) => { if (!re.test(html)) throw new Error(`Couldn't find ${what}`); html = html.replace(re, ""); };
// The artifact host wraps the page in its own document, so drop ours.
strip(/<!doctype html>\s*/i, "doctype");
strip(/<html[^>]*>\s*/i, "<html>");
strip(/<head>\s*/i, "<head>");
strip(/<meta charset[^>]*>\s*/i, "charset meta");
strip(/<meta name="viewport"[^>]*>\s*/i, "viewport meta");
strip(/<link rel="icon"[^>]*>\s*/i, "icon link"); // the artifact gets its own icon
strip(/<\/head>\s*/i, "</head>");
strip(/<body>\s*/i, "<body>");
strip(/<\/body>\s*/i, "</body>");
strip(/<\/html>\s*/i, "</html>");
const first = html.indexOf("<script");
if (first < 0) throw new Error("No script found");
html = html.slice(0, first) + `<script>window.__EMBEX_PACK__ = ${JSON.stringify(pack)};</script>\n` + html.slice(first);
if (!/^<title>/.test(html.trimStart())) throw new Error("The page should start with its <title>");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
const mb = Object.values(pack.files).reduce((s, f) => s + f.size, 0) / 1e6;
console.log(`${outFile}: ${(html.length / 1024).toFixed(0)} KB page; ${Object.keys(pack.files).length} model files (${mb.toFixed(0)} MB), ${Object.keys(pack.media).length} examples`);
