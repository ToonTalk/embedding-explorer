// Embed a few thousand words (and the example pictures, sounds and video) with the real page
// in headless Chrome, and save the raw 768-number vectors for offline study.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const PROFILE = path.join(HERE, "chrome-profile"); // reused so the model downloads once
const PORT = 9341;
const cats = JSON.parse(fs.readFileSync(path.join(HERE, "categories.json"), "utf8"));
const common = fs.readFileSync(path.join(HERE, "google-10000-english-usa-no-swears.txt"), "utf8").split(/\r?\n/).filter((w) => w.length >= 3).slice(0, 2500);
const words = [...new Set([...Object.values(cats).flat(), ...common, "a speech", "piano music", "fruit", "corgi", "unicorn"])];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  "--enable-unsafe-webgpu", "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: "ignore" });
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "evaluate failed");
    return r.result?.result?.value;
  };
  await send("Page.navigate", { url: "http://localhost:8455/?v=study" + Date.now() });
  await new Promise((r) => setTimeout(r, 3000));
  log("webgpu:", await evaluate(`(async () => !!(navigator.gpu && await navigator.gpu.requestAdapter()))()`));
  await evaluate(`document.getElementById("loadBtn").click(), 1`);
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await evaluate(`(() => { const E = window.explorer; return document.getElementById("status").textContent + " | " + E.items.filter(i => i.vec || i.err).length + "/" + E.items.length; })()`);
    if (i % 5 === 0) log(s);
    if (/failed/.test(s)) throw new Error(s);
    if (/Ready/.test(s) && /\| (\d+)\/\1$/.test(s) && !/\| 0\//.test(s)) { log(s); break; }
  }
  const media = await evaluate(`window.explorer.items.filter(i => i.kind !== "text").map(i => ({ label: i.label, kind: i.kind, err: i.err, vec: i.vec ? Array.from(i.vec) : null }))`);
  fs.writeFileSync(path.join(HERE, "media.json"), JSON.stringify(media));
  log("media:", media.map((m) => m.kind + ":" + m.label + (m.err ? " ERR " + m.err : "")).join(", "));

  const out = fs.openSync(path.join(HERE, "vecs.bin"), "w");
  const B = 100;
  for (let i = 0; i < words.length; i += B) {
    const batch = words.slice(i, i + B);
    const b64 = await evaluate(`(async () => {
      const ws = ${JSON.stringify(batch)}, all = new Float32Array(ws.length * 768);
      for (let k = 0; k < ws.length; k++) all.set(await window.explorer.embedText(ws[k]), k * 768);
      let s = ""; const u = new Uint8Array(all.buffer);
      for (let k = 0; k < u.length; k += 0x8000) s += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000));
      return btoa(s);
    })()`);
    fs.writeSync(out, Buffer.from(b64, "base64"));
    if ((i / B) % 5 === 0) log(`${i + batch.length}/${words.length}`);
  }
  fs.closeSync(out);
  fs.writeFileSync(path.join(HERE, "words.json"), JSON.stringify({ words, cats }));
  log("done", words.length, "words");
} finally {
  chrome.kill();
}
