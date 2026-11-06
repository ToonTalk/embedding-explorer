# What the model does with Swedish

Measured 6 November 2026 with the Swedish page (`sv/index.html`): EmbeddingGemma 2, 4-bit, WebGPU, the default
instruction `task: search result | query: `, the first 256 numbers, nothing taken away, unless a line says otherwise.
The word list and ray study are `study/sv/` (2,600 Swedish words: 563 in 20 everyday groups translated from the English
study, about 2,000 common words translated from the English common-word list, and some extras).
`node study/collect.mjs sv` re-embeds them; `cd study/sv && node ../build-rays.mjs && node ../directions.mjs`;
`node tools/build-vocab.mjs sv` writes `sv/vocab.bin` (2,585 words; sentences are left out).

## The main finding: short Swedish words go by spelling

- Group test: 548 everyday words in 19 groups, the same words in Swedish and English. Share of each word's five
  nearest words that are in its own group:

  | | Swedish | English |
  |---|---|---|
  | 4-bit, default instruction, 256 numbers | 25 % | 60 % |
  | 4-bit, default instruction, 768 | 26 % | 64 % |
  | all three instructions, 4- and 8-bit | 25–33 % | 60–65 % |
  | word list, 768 / 512 / 256 / 128 / 64 numbers | 26 / 25 / 25 / 24 / 19 % | 62 / – / 59 / 53 / 41 % (English study) |

- Spelling beats meaning: "valp" is 0.87 with "val", 0.86 with "väl", 0.81 with "hund". "katt" is 0.85 with
  "kategori", 0.77 with "hund". The words nearest "varm" in the word list are "var", "vart", "vars", "varit".
- But the model knows what Swedish words mean across languages: "katt"–"cat" 0.89, "hund"–"dog" 0.89. For 349 of 523
  (two in three) everyday Swedish words, the right English translation was the nearest of the 523 English words.
- 🐶 nearest words in the Swedish word list: "dog" 0.88 (in the list as the past tense of "dö", but read as English),
  "hund", "husdjur".

## Arithmetic: what works and what doesn't (first answer that isn't an input)

| Formula | Result | Notes |
|---|---|---|
| Stockholm − Sverige + Norge | Oslo 0.85 | then Köpenhamn 0.77; with the word list, "norr" 0.79 comes next |
| (sommar + vinter) / 2 | vår 0.88 | höst 0.86 |
| katt + bebis | kattunge 0.88 | |
| 🐶 − hund + katt | 🐱 0.86 | |
| katt − cat + dog | 🐶 0.87, hund 0.86 | mixing languages works |
| puppy − dog + katt | kattunge 0.84 | mixing languages |
| Berlin − Tyskland + Spanien | Madrid 0.81 | |
| äpple + päron | frukt 0.84 | |
| valp − hund + katt | fails: kalv 0.77; with the word list "väl", "val", "vald" | English puppy − dog + cat → kitten 0.91 |
| kung − man + kvinna | fails: "Kina", "kunglig", "kvinnlig" (word list) | English king − man + woman → queen 0.82 |
| (morgon + natt) / 2 | midnatt, then spelling neighbors | English (morning + night) / 2 → evening 0.93 |
| bröd + ost + tomat, (blå + gul) / 2, 2 * stor − liten | spelling neighbors (brott, röst; blåsa, guld; störst, stol) | |
| tiger − katt + hund | "dog", 🐶, "hundvalp" (word list) | |

Why Stockholm − Sverige + Norge works:

- **Arrows:** Sverige→Stockholm and Norge→Oslo have similarity 0.44, while arrows between random word pairs average 0.00. For hund→valp against katt→kattunge it is −0.08, and for man→kung against kvinna→drottning −0.11.
- **Score sums** (as "Visa hur varje poäng räknas ut" shows them): Oslo 0.87 − 0.79 + 0.84 = 0.91, Köpenhamn 0.85 − 0.80 + 0.78 = 0.82, Norge 0.94, Stockholm 0.91. The list then divides every sum by the result's length, 1.07.

## Other numbers on the page and in the guides

- Shared part: about 70 % of each list (word list average, 768 numbers). The six longest rays (numbers 116, 392, 112,
  555, 733, 30, the same as in English) hold nearly two thirds of it. "idé"–"häst" 0.74; random word pairs
  0.68–0.78 (10th to 90th percentile), median 0.73.
- Starter items (hund, katt, äpple, hus, corgi picture, house picture, barking sound): squares from 0.57 to 0.80.
  "hus"–"hund" 0.80 is higher than "katt"–"hund" 0.77. The barking sound is 0.71 with "katt" and 0.69 with "hund".
- Rays: 140 of the 768 numbers (about one in five) have a group of words leaning high or low; in English about one in three.
- Directions (40/40/20/30 Swedish pairs): the biggest single number holds 1–2 % of a direction with 768 numbers and
  3–4 % with 256; the top 20 hold 17–19 %. The best single number goes the same way in 35/40 (plural), 34/40 (past),
  18/20 (comparative), 24/30 (concrete → abstract) pairs. The whole direction separates 39/40, 40/40, 20/20, 26/30.
- Hinton (does the female word lean further toward "katt" than the male word? difference in that lean):
  man/kvinna +0.037, män/kvinnor +0.003, pojke/flicka −0.009, kung/drottning −0.009, pappa/mamma +0.009,
  manlig/kvinnlig +0.008 (256 numbers): 4 of 6. With 768: +0.020, −0.019, +0.020, −0.004, +0.010, +0.002: 4 of 6.
  The set's four pairs give 2 of 4. In English all six leaned the same way.
- Then and now: the test sentences stay English, so those results (23 vs 34 of 43, etc.) are unchanged.
