# Translating Embedding Explorer into Swedish: rules and glossary

Embedding Explorer is a single-file web app (`index.html`) for school students aged about 10–16. It runs Google's
EmbeddingGemma 2 in the browser and lets students add words, pictures, sounds and videos, see each embedding as a
"star", compare things, do embedding arithmetic, write formulas and build a 3D space. An AI "guide" can be opened.

The Swedish copy lives in `sv/`. The model is multilingual, so Swedish words work just as English ones do.

## The one rule that matters most
Translators work on ONE PART of `index.html` (a slice of lines). The parts are joined afterwards, so
**the translated part must have exactly the same number of lines as the original part**. Never add or remove a
line break. Change only human-readable text.

## What to translate
Everything a student, teacher or AI model reads as language: headings, paragraphs, button labels, hints, `title`,
`placeholder` and `aria-label` attributes, `<option>` display text, status messages, error messages, toasts,
explanations of technical words (values of `TERMS` and the "More detail" texts), labels of example pictures and
sounds, the example sets (names and the words in them), challenge texts, and the guide's instructions and the page
summary it is sent.

Write natural, warm, simple Swedish for 10–16 year olds (du-form). Keep sentences short, like the English.
Use Swedish quotation marks ” ” (both the same) and ’ where the English uses “ ” and ’. Never break JS string quoting:
if a Swedish word needs a ' inside a '…' string, escape it; same for " inside "…".

## What must NOT change (or the page breaks)
- JavaScript identifiers, keywords, object keys, function names, CSS (lines inside `<style>`), class names, element
  ids, `data-*` attribute names and values, URLs (except the guide links listed below), regexes, model ids.
- **`TERMS` keys stay English.** Translate only the values. A `<span class="term">` looks up its explanation by its
  `data-t` attribute, or by its text if it has none. So when you translate the text of a `<span class="term">` that
  has no `data-t`, ADD `data-t="<the English text>"`:
  `<span class="term">model</span>` → `<span class="term" data-t="model">modell</span>`.
  Spans that already have `data-t` keep it unchanged. The same for the helper `term("word", "key")`: translate the
  first argument, and if there was no second argument, add the English word as the key: `term("modell", "model")`.
- **The instruction sent to the model stays English**: `task: search result | query: ` and every other
  `task: … | query: ` value. The model was trained on these. Only the explanatory text around them is translated
  (e.g. `<i>your text</i>` → `<i>din text</i>`).
- Emoji stay as they are. File names of example pictures, sounds and videos stay as they are.
- Code comments (`// …`, `/* … */`) can stay in English.
- Numbers shown by code are formatted by code (`0.76`). In prose, keep the decimal point too (`0.76`), so the text
  matches what the page shows. Write large counts with a space: `2 838`.

## Example words, sets and claims about results
- The words in the example sets become natural Swedish everyday words (lowercase as in the English): animals → djur
  (hund, katt, häst …), food → mat, places → platser, and so on. The Questions set becomes Swedish questions.
  The emoji set stays emoji. Kings and queens → kungar och drottningar (kung, drottning, prins, prinsessa, man,
  kvinna, pojke, flicka …). Opposites → motsatser.
- **The then-and-now set (`THEN_NOW`) keeps its sentences in English**, because the old model's numbers next to them
  were measured on those English sentences (the old model barely read anything but English). Translate everything
  around them, and somewhere it already says what the set is, add a short sentence saying the sentences are in
  English for that reason (without adding a line).
- The dogs/cats/men/women challenge (Geoffrey Hinton's remark that "man" is closer to "dog" and "woman" closer to
  "cat") becomes Swedish words: hund, katt, man, kvinna, and Swedish words for the breeds/pairs used.
- Wherever the text claims a result (e.g. "puppy − dog + cat lands on kitten", "(morning + night) / 2 lands on
  evening", `"morning star" - Venus`, "tiger − cat + dog lands on house", a percentage, a similarity value), write a
  natural Swedish equivalent (valp − hund + katt → kattunge; (morgon + natt) / 2 → kväll; ”morgonstjärna” − Venus),
  and **list every such place in your final report** (line number in your part + the Swedish text), because those
  claims must be re-checked with the model before publishing.

## Links
- The student guide and teacher guide links become `https://toontalk.github.io/embedding-explorer/sv/student-guide.html`
  and `…/sv/teacher-guide.html` (Elevguide, Lärarguide).
- Links to the making-of page, the prompts page and Ken Kahn's post stay as they are; add "(på engelska)" to their
  link text.

## Glossary (use these consistently)
| English | Swedish |
|---|---|
| Embedding Explorer (title) | Inbäddningsutforskaren |
| embedding / embeddings | inbäddning / inbäddningar |
| model | modell |
| load the model | ladda modellen |
| the 768 numbers / number 37 | de 768 talen / tal 37 |
| star / star view | stjärna / stjärnvy |
| ray | stråle |
| similarity / cosine similarity | likhet / cosinuslikhet |
| similarity grid | likhetsrutnät |
| Who is close to whom? | Vem är nära vem? |
| nearest / nearest neighbors | närmast / närmaste grannar |
| embedding arithmetic | räkna med inbäddningar (heading: "5. Räkna med inbäddningar") |
| analogy | analogi |
| formula / your own formula | formel / din egen formel |
| 3D space / axis / direction | 3D-rum / axel / riktning |
| word list (📖) | ordlistan |
| everyday words | vardagsord |
| the shared part (what everything shares) | den gemensamma delen (det som allt har gemensamt) |
| instruction | instruktion |
| set (of examples) | samling (exempelsamling) |
| challenge | utmaning |
| More detail | Mer detaljer |
| picture / photo | bild / foto |
| sound / recording | ljud / inspelning |
| video / webcam / microphone | video / webbkamera / mikrofon |
| graphics chip | grafikkrets |
| 4-bit / 8-bit | 4-bitars / 8-bitars |
| modality gap | modalitetsgapet |
| pieces of words (tokens) | ordbitar |
| guide (the AI) | guiden (🧭 Guide) |
| API key | API-nyckel |
| Remove / Add | Ta bort / Lägg till |
| student / teacher | elev / lärare |
