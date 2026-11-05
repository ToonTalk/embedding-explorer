// Embed the test texts with the old essay's model (TF.js Universal Sentence Encoder lite, 512 numbers)
// and with EmbeddingGemma 2 (via the real app page), in headless Chrome. Writes out.json.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const STUDY = path.join(HERE, "..");
const PROFILE = path.join(STUDY, "chrome-profile");
const PORT = 9342;
const tests = JSON.parse(fs.readFileSync(path.join(HERE, "tests.json"), "utf8"));
const vocab = JSON.parse(fs.readFileSync(path.join(STUDY, "words.json"), "utf8")).words;
const tripTexts = [...new Set(tests.triplets.flatMap((t) => t.slice(1)))];
const extra = [...new Set(tests.analogies.flat())].filter((w) => !vocab.includes(w));
const allWords = [...vocab, ...extra];
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
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails));
    return r.result?.result?.value;
  };
  await send("Page.navigate", { url: "http://localhost:8455/?v=use" + Date.now() });
  await new Promise((r) => setTimeout(r, 3000));
  await evaluate(`document.getElementById("loadBtn").click(), 1`);
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await evaluate(`(() => { const E = window.explorer; return document.getElementById("status").textContent + " | " + E.items.filter(i => i.vec || i.err).length + "/" + E.items.length; })()`);
    if (/failed/.test(s)) throw new Error(s);
    if (/Ready/.test(s) && /\| (\d+)\/\1$/.test(s) && !/\| 0\//.test(s)) { log(s); break; }
  }

  // Load the Universal Sentence Encoder exactly as the old essay's star app did (latest packages from jsdelivr).
  log("USE:", await evaluate(`(async () => {
    const add = (src) => new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => bad(new Error("load " + src)); document.head.appendChild(s); });
    await add("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
    await add("https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder");
    window.__use = await use.load();
    return tf.getBackend() + " " + tf.version.tfjs;
  })()`));

  const round = (a) => a.map((x) => Math.round(x * 1e5) / 1e5);
  const useEmbed = async (texts) => {
    const out = [];
    for (let i = 0; i < texts.length; i += 200) {
      const v = await evaluate(`(async () => { const t = await window.__use.embed(${JSON.stringify(texts.slice(i, i + 200))}); const a = await t.array(); t.dispose(); return a; })()`);
      out.push(...v.map(round));
    }
    return out;
  };
  const gemmaEmbed = async (texts, prefix) => {
    await evaluate(`document.getElementById("prefix").value = ${JSON.stringify(prefix)}, 1`);
    const out = [];
    for (let i = 0; i < texts.length; i += 100) {
      const v = await evaluate(`(async () => { const r = []; for (const t of ${JSON.stringify(texts.slice(i, i + 100))}) r.push(Array.from(await window.explorer.embedText(t))); return r; })()`);
      out.push(...v.map(round));
      log("gemma", prefix.slice(6, 12), i + v.length, "/", texts.length);
    }
    return out;
  };

  const out = { allWords, tripTexts };
  out.useWords = await useEmbed(allWords); log("USE words done");
  out.useTrip = await useEmbed(tripTexts);
  out.gemmaTripS = await gemmaEmbed(tripTexts, "task: search result | query: ");
  out.gemmaTripQ = await gemmaEmbed(tripTexts, "task: sentence similarity | query: ");
  out.gemmaExtra = await gemmaEmbed(extra, "task: search result | query: ");
  fs.writeFileSync(path.join(HERE, "out.json"), JSON.stringify(out));
  log("wrote out.json", allWords.length, "words,", tripTexts.length, "test texts,", extra.length, "extra words:", extra.join(" "));
} finally {
  chrome.kill();
}
