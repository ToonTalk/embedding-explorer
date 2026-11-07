# Embedding Explorer

A web page for school students to explore **embeddings**: the lists of numbers an AI model uses to represent the meaning of words, pictures, sounds and videos.

**Try it:** https://toontalk.github.io/embedding-explorer/ · [Student guide](https://toontalk.github.io/embedding-explorer/student-guide.html) · [Teacher guide](https://toontalk.github.io/embedding-explorer/teacher-guide.html) · [How it was made](https://toontalk.github.io/embedding-explorer/making-of.html) · [Prompts and responses](https://toontalk.github.io/embedding-explorer/prompts.html) · [Ken Kahn's post](https://docs.google.com/document/d/1YS4ML1H348kTH3ecGvalBJJfJr2AW6BQHYi-T4qDrIE/edit?usp=sharing)

It runs Google's [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2) entirely in the browser with [Transformers.js](https://huggingface.co/docs/transformers.js), so whatever students add stays on their computer. Words, pictures, sounds and videos all land in one shared space of 768 numbers.

Students can:

1. Add words, sentences, photos (including from the webcam), sound recordings and videos, or whole sets of examples (animals, food, places, questions, feelings, kings and queens, dogs, cats, men and women, opposites, emoji, speech and music, videos, then and now). The dogs, cats, men and women set comes with a challenge: test Geoffrey Hinton's remark that "man" is closer to "dog" and "woman" closer to "cat", pair by pair, on a dog ↔ cat line. The then and now set shows sentences the older model in Ken Kahn's 2023 essay got wrong, with its numbers next to this model's ([study/then-and-now](study/then-and-now/README.md)). Several things can be removed at once.
2. See any embedding as a **star**: one ray per number, green for positive and red for negative. They can also see the difference between two embeddings as a star. Pointing at a ray shows which everyday words are unusually high and low for that number (see below).
3. Compare everything with everything in a similarity grid.
4. Do **embedding arithmetic** (A − B + C) and see what is nearest the result.
   Sections 5 and 6 can also search **2,838 everyday words** that aren't on the page (`vocab.bin`, made by `tools/build-vocab.mjs` from the study's embeddings), so a result isn't limited to what students thought to add.
5. Write their **own formula** with words, numbers, + − × ÷ and brackets, such as `(morning + night) / 2` (lands on "evening") or `puppy - dog + cat` (lands on "kitten"), and see what is nearest.
6. Build their own **3D space** from three word pairs (for example small → big) and see where everything lands.

A 🧭 **Guide** (an AI) can be opened from anywhere on the page. It is given a text summary of the page: what has been added, the nearest neighbors, and the current star, arithmetic and 3D views, plus challenge ideas the page works out from the student's own things. It can't see the pictures or hear the sounds. It suggests experiments, explains surprises and sets challenges the student can check. Its suggestions come with buttons that add words or set up the star or arithmetic view. "What the guide was told" shows exactly what it received.

The guide can use:

- **Gemini Nano**, built into desktop Chrome. It's free, needs no key, and keeps questions on the computer. It's the default when available. It's a small model, so its explanations are sometimes muddled. In testing it took 6–20 s per answer.
- **Claude, Gemini or ChatGPT** with the user's own API key. The key is sent only to that company, straight from the page, and is remembered only if the user asks.

Technical words have a dotted underline and explain themselves on hover or tap, and each short explanation has a "More detail" version.

### What the rays mean

The ray meanings come from a study: the model embedded 2,834 words (the 2,500 most common English words of three or more letters, plus 560 everyday words in 20 groups). For each of the 768 numbers, the page lists the everyday words that are furthest above and below that number's average. It also names a group when its words average at least one standard deviation above or below. About a third of the numbers have such a group, such as music or sports; most mix unrelated words. The longest rays (numbers 116, 392, 112, 555, 733 and 30, counting from 1) are big for every input and differ a little between words, pictures and sounds. The scripts are in [study/](study/README.md).

A bar at the top changes every section at once. It sets how many of the 768 numbers to use (the model is trained so the first ones matter most). The page starts with 256: in our test, the share of each everyday word's five nearest neighbors that came from its own group was 62% with 768 numbers, 59% with 256 and 53% with 128. It can also take away the part that all embeddings share, which otherwise makes every star look alike.

This follows Ken Kahn's earlier [active essay on embeddings](https://toontalk.github.io/AI/apps/embeddings/index.html).

## Svenska (Swedish)

A Swedish copy is in [sv/](https://toontalk.github.io/embedding-explorer/sv/), with Swedish student and teacher guides. It shows how the app can be adapted to another language:

- **The page:** `sv/index.html` is a translated copy of `index.html`. [sv/GLOSSARY.md](sv/GLOSSARY.md) has the rules and word choices the translators followed. It is a copy, so later changes to the English page have to be made there too.
- **The word lists:** `study/sv/` holds Swedish word lists translated from the English study, and `study/sv/labels.json` names the groups and directions. The scripts take a language folder:

  ```bash
  node study/collect.mjs sv
  node study/collect-pairs.mjs sv
  cd study/sv && node ../build-rays.mjs && node ../directions.mjs && cd ../..
  node tools/build-vocab.mjs sv
  ```

  Paste `study/sv/rays.js` and `study/sv/dirs.js` over the `RAYS` and `DIRS` lines in `sv/index.html`.
- **The Claude version:** https://claude.ai/artifact/XHYQScy5QAseDEGvv1GyDP. It holds copies of the English artifact's stored files plus the Swedish word list, listed in `tools/artifact-assets-sv.txt`. Build it with:

  ```bash
  node tools/build-artifact.mjs tools/artifact-assets-sv.txt dist/embedding-explorer-sv-artifact.html --page sv/index.html --swap 'href="https://toontalk.github.io/embedding-explorer/">English</a>' 'href="https://claude.ai/artifact/WbmX8jzs1p2zAsNM6LGmM4">English</a>'
  ```

  (The English artifact is built with a matching `--swap` that points its "På svenska" link at the Swedish artifact.)
- **What the model does with Swedish:** [sv/RESULTS.md](sv/RESULTS.md) has the measurements. In short, the model compares short Swedish words largely by spelling. Only 25% of a Swedish word's five nearest words are in its own group, against 60% in English, so some English analogies fail in Swedish. The Swedish page says so and uses examples that work.

## Requirements

- **A browser with WebGPU** (recent Chrome or Edge) is strongly recommended. With WebGPU the first visit downloads about 473 MB, which the browser keeps for later visits.
- **Phones and tablets** start with words only, and the page warns before loading pictures, videos and sounds. On a Galaxy tablet and a Pixel 10a those used up the graphics memory: the page stopped (it now says so and asks for a reload) and the phone froze.
- **Without WebGPU**, the page falls back to the main processor. This needs a larger 16-bit download, and in testing it was only practical for words: about 0.2 s each. A single picture didn't finish in five minutes.

Measured on a desktop with an NVIDIA GPU: about 0.1 s per word, 0.5 s per picture, 0.2 s per sound and 3–4 s per short video.

## The Claude artifact edition

The same `index.html` also runs as a Claude artifact: https://claude.ai/artifact/WbmX8jzs1p2zAsNM6LGmM4. An artifact can't download from other sites, so everything it needs is kept in the artifact's own storage:

- The 4-bit model, its tokenizer, the onnxruntime engine, the word list and the example sounds (541 MB in all) are stored as text: `tools/pack-artifact.mjs` cuts each file into 11 MB slices and saves each slice as a `.js` part holding `{"b64": "…"}`, 66 parts in all. The page decodes them as it reads them.
- The example pictures and videos are stored as they are.

Why text: claude.ai checks every stored file before an artifact can be shared publicly. An earlier version stored the binary files as `video/mp4`, which the store accepts but the check can't read, so that artifact couldn't be shared.

`tools/build-artifact.mjs` reads `tools/artifact-assets.txt`, the list of stored parts, and writes the artifact page with that list injected. The page then serves Transformers.js's downloads, the word list and the sounds from the parts.

How the artifact differs from the web edition:

- **Guide:** it uses Claude through the viewer's claude.ai account, with no key needed. Gemini Nano isn't available inside an artifact.
- **No camera or microphone:** the artifact frame refuses them.
- **Graphics chip needed:** only the 4-bit files are stored, and they need WebGPU.

```bash
node tools/pack-artifact.mjs <parts folder> <model files…> <sounds…> vocab.bin
```

Upload the parts and the pictures and videos to the artifact, record their ids in `tools/artifact-assets.txt`, then:

```bash
node tools/build-artifact.mjs
```

## Running it locally

It is a single file, `index.html`. Serve the folder with any static web server, for example:

```bash
python -m http.server 8455
```

## License

MIT. See [LICENSE](LICENSE). The EmbeddingGemma 2 model is licensed separately under Apache 2.0.
