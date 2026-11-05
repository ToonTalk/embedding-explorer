# The ray study

How the page's ray meanings (`const RAYS` in `index.html`) were made.

1. Download the common-word list from https://github.com/first20hours/google-10000-english (`google-10000-english-usa-no-swears.txt`) into this folder.
2. Serve the app on port 8455 (`python -m http.server 8455` in the folder above), then run `node collect.mjs`. It drives headless Chrome with WebGPU, loads the page, and saves the raw 768-number embeddings of 2,834 words to `vecs.bin` (plus `words.json`, and `media.json` for the page's example pictures, sounds and video). The first run downloads the model into `chrome-profile/`.
3. `node build-rays.mjs` writes `rays.js`, which is pasted into `index.html`.

`node analyze.mjs dims` compares how well 768, 512, 256, 128 and 64 numbers keep words near their own group. `node analyze.mjs house` reproduces the "tiger − cat + dog lands on house" puzzle. `node arith.mjs` runs arithmetic against the whole vocabulary.

Words use the page's default instruction, `task: search result | query: `, with the 4-bit model on WebGPU.

## Then and now

[then-and-now/](then-and-now/README.md) compares the model from Ken Kahn's 2023 essay (the TF.js Universal Sentence Encoder) with EmbeddingGemma 2 on 43 sentence tests, 24 analogies and 2,856 words, and checks Geoffrey Hinton's dogs-and-cats remark.

## Directions: one → many, now → past, plain → -er, thing → idea

`pairs.json` lists 40 singular/plural pairs, 40 present/past pairs, 20 plain/-er pairs, and 30 concrete and 30 abstract nouns. `node collect-pairs.mjs` embeds them (to `pairs-vecs.bin`), and `node directions.mjs` measures each direction and writes `dirs.js` (`const DIRS` in `index.html`).

Result with 768 numbers: each direction separates every one of its pairs, but the biggest single number holds only 1–2% of it, the top 20 numbers about 17–19%, and the top 50 about 35%. With 256 numbers the biggest holds 3–5%. Still, some single numbers move the same way in nearly every pair (for one → many, number 116 in 39 of 40 pairs).
