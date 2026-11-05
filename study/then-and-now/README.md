# Then and now: the Universal Sentence Encoder vs EmbeddingGemma 2

Ken Kahn's 2023 [active essay on embeddings](https://toontalk.github.io/AI/apps/embeddings/index.html) used Google's Universal Sentence Encoder: the TF.js version (`@tensorflow-models/universal-sentence-encoder`, 512 numbers per input). This folder compares it with EmbeddingGemma 2 as the app runs it. The full results are in [report.txt](report.txt) and [hinton.txt](hinton.txt).

## The tests

[tests.json](tests.json) has two kinds:

- **43 triplets:** a sentence, one that means the same, and a look-alike that means something different. A model passes if it puts the same-meaning one closer. This doesn't depend on the two models' different number ranges.
- **24 analogies** (a − b + c = d), searched among 2,856 words with the inputs left out.

## Results

| | Old encoder | EmbeddingGemma 2 (768) | EmbeddingGemma 2 (256) |
|---|---|---|---|
| Triplets passed | 23 / 43 | 34 / 43 | 35 / 43 |
| Analogies right first time | 9 / 24 | 15 / 24 | 16 / 24 |

- **Gemma clearly wins on:**
  - **Other languages:** 5 of 5, against 1 of 5.
  - **Emoji:** the old encoder's nearest words to 🐶 are "minimum, dedicated, multi".
  - **Words newer than 2018:** ChatGPT, TikTok, COVID-19.
  - **"Not":** 3 or 4 of 4, against 1 of 4.
  - **Words with two meanings.**
- **About even:** single English words. Of each grouped everyday word's five nearest grouped words, 63% (old) and 62% (Gemma) came from its own group.
- **Both fail:**
  - **Who did what to whom:** "The dog bit the man" is closer to "The man bit the dog" than to "A man was bitten by a dog".
  - **Most idioms.**
  - **Questions whose answer shares few words with them.**

[hinton.txt](hinton.txt) checks Geoffrey Hinton's remark that "man" is closer to "dog" and "woman" closer to "cat". In EmbeddingGemma 2, in all six male/female pairs tested, the female word leans further toward "cat", with both 768 and 256 numbers. The gaps are tiny, between 0.002 and 0.03. The old encoder agrees in four of the six pairs.

## Running it

1. Run [`../collect.mjs`](../collect.mjs) first. It makes `../vecs.bin` and `../words.json` (Gemma's vectors for the word list) and `../chrome-profile/` with the model cached.
2. Serve the app on port 8455.
3. Run `node collect.mjs`. It loads the app in headless Chrome, adds the Universal Sentence Encoder from jsdelivr to the same page, embeds everything with both models, and writes `out.json`.
4. Run `node analyze.mjs > report.txt`, `node hinton.mjs > hinton.txt`, and `node nn.mjs` (nearest-word lists).

Gemma uses the app's default instruction, `task: search result | query: `. The "Gemma sim" column uses `task: sentence similarity | query: `.
