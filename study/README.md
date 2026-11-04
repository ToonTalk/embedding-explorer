# The ray study

How the page's ray meanings (`const RAYS` in `index.html`) were made.

1. Download the common-word list from https://github.com/first20hours/google-10000-english (`google-10000-english-usa-no-swears.txt`) into this folder.
2. Serve the app on port 8455 (`python -m http.server 8455` in the folder above), then run `node collect.mjs`. It drives headless Chrome with WebGPU, loads the page, and saves the raw 768-number embeddings of 2,834 words to `vecs.bin` (plus `words.json`, and `media.json` for the page's example pictures, sounds and video). The first run downloads the model into `chrome-profile/`.
3. `node build-rays.mjs` writes `rays.js`, which is pasted into `index.html`.

`node analyze.mjs dims` compares how well 768, 512, 256, 128 and 64 numbers keep words near their own group. `node analyze.mjs house` reproduces the "tiger − cat + dog lands on house" puzzle. `node arith.mjs` runs arithmetic against the whole vocabulary.

Words use the page's default instruction, `task: search result | query: `, with the 4-bit model on WebGPU.
