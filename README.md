# Embedding Explorer

A web page for school students to explore **embeddings**: the lists of numbers an AI model uses to represent the meaning of words, pictures, sounds and videos.

**Try it:** https://toontalk.github.io/embedding-explorer/ · [Student guide](https://toontalk.github.io/embedding-explorer/student-guide.html) · [Teacher guide](https://toontalk.github.io/embedding-explorer/teacher-guide.html) · [How it was made](https://toontalk.github.io/embedding-explorer/making-of.html) · [Ken Kahn's post](https://docs.google.com/document/d/1YS4ML1H348kTH3ecGvalBJJfJr2AW6BQHYi-T4qDrIE/edit?usp=sharing)

It runs Google's [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2) entirely in the browser with [Transformers.js](https://huggingface.co/docs/transformers.js), so whatever students add stays on their computer. Words, pictures, sounds and videos all land in one shared space of 768 numbers.

Students can:

1. Add words, sentences, photos (including from the webcam), sound recordings and videos, or whole sets of examples (animals, food, places, questions, feelings, kings and queens, dogs, cats, men and women, opposites, emoji, speech and music, videos, then and now). The dogs, cats, men and women set comes with a challenge: test Geoffrey Hinton's remark that "man" is closer to "dog" and "woman" closer to "cat", pair by pair, on a dog ↔ cat line. The then and now set shows sentences the older model in Ken Kahn's 2023 essay got wrong, with its numbers next to this model's ([study/then-and-now](study/then-and-now/README.md)). Several things can be removed at once.
2. See any embedding as a **star**: one ray per number, green for positive and red for negative. They can also see the difference between two embeddings as a star. Pointing at a ray shows which everyday words are unusually high and low for that number (see below).
3. Compare everything with everything in a similarity grid.
4. Do **embedding arithmetic** (A − B + C) and see what is nearest the result.
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

## Requirements

- **A browser with WebGPU** (recent Chrome or Edge) is strongly recommended. With WebGPU the first visit downloads about 473 MB, which the browser keeps for later visits.
- **Without WebGPU**, the page falls back to the main processor. This needs a larger 16-bit download, and in testing it was only practical for words: about 0.2 s each. A single picture didn't finish in five minutes.

Measured on a desktop with an NVIDIA GPU: about 0.1 s per word, 0.5 s per picture, 0.2 s per sound and 3–4 s per short video.

## The Claude artifact edition

The same `index.html` also runs as a Claude artifact: https://claude.ai/artifact/41qaoHhWfC87k5AShT1un5. An artifact can't download from other sites, so everything it needs is kept in the artifact's own storage:

- The 4-bit model, its tokenizer and the onnxruntime engine are split into pieces of 15 MB or less, 532 MB in all. They're stored as `video/mp4`, the store's catch-all for binary data.
- The example pictures, sounds and videos are stored there too.

`tools/build-artifact.mjs` reads `tools/artifact-assets.txt`, the list of stored pieces, and writes the artifact page with that list injected. The page then serves Transformers.js's downloads from the pieces.

How the artifact differs from the web edition:

- **Guide:** it uses Claude through the viewer's claude.ai account, with no key needed. Gemini Nano isn't available inside an artifact.
- **No camera or microphone:** the artifact frame refuses them.
- **Graphics chip needed:** only the 4-bit files are stored, and they need WebGPU.

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
