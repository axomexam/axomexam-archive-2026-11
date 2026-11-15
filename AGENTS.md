# AGENTS.md

Static bilingual (English + Assamese) exam-prep site served from the repository
root by GitHub Pages at https://axomexam.in. There is no build step at deploy
time: the committed `index.html` files are what GitHub Pages serves.

## Pushing to `main` — never overwrite anyone's work

This repository is shared and other people push to `main` while an agent is
working. Before every push, confirm the remote tip is an ancestor of `HEAD`;
if it is not, someone pushed in the meantime and the push must be stopped and
rebased instead of forced.

Use the helper, which enforces this and refuses unsafe pushes:

```bash
tools/safe-push.sh origin main
```

It fetches, checks that `origin/main` is reachable from `HEAD` (a pure
fast-forward), and only then pushes. If the remote has commits that `HEAD`
lacks, it prints `BLOCKED` and exits without pushing, so nothing is lost. On
a block, rebase and re-run:

```bash
git rebase origin/main        # resolve conflicts, keep both sides' work
tools/safe-push.sh origin main
```

Never use `git push --force` or `--force-with-lease` to `main`, and never
push directly with `git push` without this check. A manual equivalent of the
guard is:

```bash
git fetch origin main
git merge-base --is-ancestor origin/main HEAD || { echo BLOCKED; exit 1; }
git push origin HEAD:main
```

## Standing rules — do not lose content, do not change the UI

These apply to every change in this repo. They come from the site owner and
they outrank any cleanup, refactor or "nice to have" an agent might want to do.

- **Never lose content.** No sentence, question, answer, note or FAQ item may
  be dropped, shortened or reworded to make a tool's job easier. If a
  generator wants to rewrite a body, diff it against `HEAD` first and revert
  anything that is not the change you were asked to make.
- **Never change the UI.** Markup, CSS classes, layout, spacing and the
  client-side render path stay as they are. A content or SEO fix must be
  invisible to a reader looking at the page.
- **No ad code on the Assamese (`/as/`) pages.** Assamese is not a supported
  AdSense language. `tools/build-as-twins.js` strips the loader; never add it
  back to a `/as/` page. Only indexable English content pages carry the loader
  (see the loader policy below).
- **Every page gets its own accurate, topic-wise SEO head.** Title,
  description, canonical, hreflang and JSON-LD must describe *that* page's
  actual topic, in the reader's language, with no clamping (`…`), no template
  filler and no duplicate across pages. `tools/seo-audit.js` must stay at
  `dup titles: 0`, `dup descriptions: 0`, `title >60 chars: 0` and
  `desc >160 chars: 0`.
- **All content must be readable by Googlebot with JavaScript off.** The
  crawler copy is the static block *outside* `<main id="app">`; do not move it
  inside `<main>` and do not hide it behind JS. Verify with a Googlebot user
  agent that the URL returns 200, is not `noindex`, and has real words.
- **No broken hreflang.** Every `hreflang="as"` target must exist, and the
  pair must be reciprocal. `tools/seo-audit.js` reports a miss as
  `sitemap alt miss`; it must stay at 0.
- **Answer keys must stay random.** In every MCQ bank the correct option must
  be spread over A/B/C/D — never a run of one slot and never all answers in the
  same position. A new bank is authored with the answer wherever it belongs,
  then the options are shuffled so the key is balanced; the option that was
  correct stays the same option, only its position changes. Check with
  `node tools/balance-answer-keys.js --book <book> --topic <topic> --check`,
  which must report 0 skewed topics (no slot holding >=50% of a topic's keys).
- **Deduplicate by meaning, not just exact text — and never repeat wording.**
  The same fact is often needed in more than one book: an exam-specific bank
  (say RRB NTPC) and a state or general-knowledge bank may both legitimately
  need "the capital of Assam" or "the first oil well in Asia". Having that fact
  in two books is allowed — but writing it the same way twice is not, because
  the site then carries duplicate content. So whenever a question is reused
  across books, reword (ghuma-phirake) the stem, the options and the
  explanation so each instance reads differently; a reader must never meet two
  identical questions. An exact string match is not enough to check this: the
  repo already holds ~95k stems and explanations, so the same fact is often
  asked with slightly different wording (e.g. a new "In which year was the Food
  Corporation of India established?" against an existing "In which year was the
  Food Corporation of India (FCI) established?"). Before committing a bank, run
  a fuzzy check of every new stem and explanation (English and Assamese, case-
  and punctuation-folded) against all other question text in `data/` —
  `difflib.SequenceMatcher` with a ~0.90 ratio is a good threshold — and reword
  every hit until the count is 0. Do not drop a fact that a book genuinely
  needs; phrase it differently instead. This is a standing rule: do not
  re-introduce near-duplicate stems or explanations in any future bank.
- **Verify before shipping.** Run `node tools/seo-audit.js` and confirm
  `thin (<300w): 0`, `missing H1/desc/canonical/JSON-LD: 0`, and the duplicate
  counts above, then check the live URLs return 200 after the Pages build.
- **Keep internal files out of the published site.** `.nojekyll` (repo root)
  and the `Disallow` list in `robots.txt` are load-bearing. Do not delete
  `.nojekyll`, and when you add or remove a path in `robots.txt`, change
  **both** groups. See the two gotchas below.

## Gotcha: `.nojekyll` is load-bearing — do not remove it

The repo serves from `main:/` with GitHub Pages in **legacy** build mode. With
no `.nojekyll`, GitHub runs Jekyll over the repo, and Jekyll turns every root
`*.md` into a published, indexable page rendered in its own theme:

| URL | What it was |
| --- | --- |
| `/AGENTS.html` | this handbook, ~11k words, indexable, no `robots` meta |
| `/SEO-AUDIT.html`, `/SEO-ACTION-PLAN.html` | the internal SEO notes |
| `/AGENTS.md`, `/SEO-*.md` | the raw markdown, served as `text/markdown` |

Jekyll also served its theme CSS at `/assets/css/style.css` (never in the
repo), so those pages looked like part of the site. Search and the AdSense
review saw a large off-topic page wearing the site's own theme, next to the
keyword research in `keyword-map.csv`.

`.nojekyll` at the repo root switches Jekyll off, so only committed files are
served and no `*.md` becomes a page. Nothing else changed: every real page's
bytes were identical before and after (md5 compared), and the only other
casualty is `/assets/css/style.css`, which nothing in the repo links.

Do not "clean up" `.nojekyll` as an empty file — it is the switch.

## Gotcha: a named `User-agent` group replaces the `*` group

`robots.txt` lists 32 named crawlers (Googlebot, Mediapartners-Google, GPTBot,
Bingbot, …). In robots.txt a group that names a user-agent **replaces** the
`*` group for that crawler — it does not merge with it. While the named groups
carried only `Allow: /`, the `Disallow: /dist/` on the `*` group never applied
to Googlebot or to any named crawler, and the same would have been true of
every internal-path `Disallow` added later.

The file therefore repeats the full `Disallow` list inside the named group.
Change **both** groups together, then check the result against the matching
rules (longest matching path wins; `Allow` wins a tie) for Googlebot,
Mediapartners-Google and `*` before pushing.

`/data/` must stay crawlable and is not blocked: the SPA fetches
`/data/mock-test/*.json` at runtime and the previous-year pages link
`/data/**/*.pdf`.

## Session record — Nov 2026 RRB NTPC Space & Defence question bank (251 MCQs)

What was done, so the next agent does not redo or undo it:

- **Extended** the Space & Defence topic of the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/static-gk-computers/space-defence/`:
  `question-002.json` … `question-251.json` (250 new files) on top of the
  existing `question-001.json`, for **251 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 251 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover ISRO and its centres, launch vehicles (SLV/ASLV/PSLV/GSLV/LVM3/
  SSLV), Indian satellites and missions (Aryabhata, Rohini, INSAT, GSAT,
  Cartosat, Oceansat, Chandrayaan, Mangalyaan, Aditya-L1, AstroSat, XPoSat,
  Gaganyaan, NavIC, GAGAN), world space agencies and firsts, Indian armed
  forces, ranks, commands, academies, service days, gallantry awards, joint
  exercises, missiles (Agni, Prithvi, BrahMos, Akash, Nag, Trishul, Pinaka,
  Astra, Prahaar, K-series), defence PSUs, and India's defence exports.
  Answer keys are spread over A/B/C/D — across all 251 questions the slots
  hold 64/63/62/62; `--book rrb-ntpc --topic
  general-awareness/static-gk-computers/space-defence --check` reports 0
  skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; a fuzzy pass (`difflib.SequenceMatcher`,
  ratio >= 0.90) then reworded 56 items (e.g. "which planet is known as the
  red planet" and the "largest/closest/hottest planet" items against the
  assam-police / dhs-dme banks, "supreme commander of the Indian Armed Forces"
  and the service-day items, the Param Vir / Shaurya / Kirti Chakra
  explanations against the awards banks, and the templated parallel stems for
  the naval/army commands inside this bank). The bank now reports **0**
  near-duplicates cross-bank and 0 internally. The correct option and its
  meaning were never changed, only the wording.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC National & International News bank (151 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual National & International News (current-affairs) bank to
  the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/current-affairs/national-international-news/`:
  `question-002.json` … `question-151.json` (150 new files) beside the existing
  `question-001.json`, giving the topic **151 questions**. Each file holds one
  MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 151 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Written for RRB NTPC (CBT-1 & CBT-2) difficulty and restricted to
  **real news from roughly the last 12 months (Nov 2025 – Nov 2026)** — the
  India–EU FTA (Jan 2026), the 2026 BRICS Summit in New Delhi, the AI Impact
  Summit, the 2026 Winter Olympics (Milan–Cortina), the 2026 FIFA World Cup
  (US–Canada–Mexico, won by Spain), the India–New Zealand FTA, the euro entry of
  Bulgaria, the 2026 Iran war and the Islamabad Memorandum, the Artemis II lunar
  flyby, the 2026 Nobel Prizes, the Bihar/West Bengal/Tamil Nadu/Assam 2026
  state elections, the 2025 Bihar election, ISRO's CMS-03, the NEET leak and the
  Anti Paper Leak Bill, and the year's major disasters and elections worldwide.
  Answer keys are spread over A/B/C/D — across all 151 questions the slots hold
  38/38/38/37; `--book rrb-ntpc --topic
  general-awareness/current-affairs/national-international-news --check`
  reports 0 skewed topics.
- **Note on the balancer.** Because each file holds a *single* question, running
  `tools/balance-answer-keys.js` on this topic drives every file to slot 0 (the
  per-file deterministic sequence targets `0` for the first question), which
  then reads as 100% skewed. The keys were therefore spread by a one-off script
  that reuses the tool's own `balanceKeys` sequence but applies it across the
  *whole topic* (one target per file in sorted order), moving the correct
  option's text and updating `correct` without inventing an answer. Re-run the
  same across-topic logic — not the per-file tool — if this bank is extended.
- **No duplicated content.** Every stem and explanation (English and Assamese,
  case- and punctuation-folded) was compared against all other question text in
  `data/` with `difflib.SequenceMatcher` at a 0.90 ratio. One hit was found —
  the UK Prime Minister question clashed with an ADRE Grade-4 item — and was
  reworded ("Which politician took charge as the head of the UK government in
  July 2026, succeeding Keir Starmer?"). The final count is 0 near-duplicates.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.
## Session record — Nov 2026 RRB NTPC Biology bank compliance fix (310 MCQs)

The 310-question biology bank at
`data/exams/rrb-ntpc/general-awareness/general-science/biology/` was already
present and live, but it failed two of the standing rules. Both are now fixed in
place, with no change to the question count, the file set or `index.json`.

- **Answer-key spread.** The longest run of one slot was 5 (C at questions
  37–40 and 203–206). Options in `question-038.json` and `question-205.json`
  were reordered so the run is now 3. Distribution is A/B/C/D = 79/78/75/78,
  max 25.48%, and `--book rrb-ntpc --topic general-awareness/general-science/biology
  --check` reports 0 skewed topics.
- **Fuzzy duplicates.** A `difflib` check at ratio ≥ 0.90 against all other
  question text in `data/` found 41 near-duplicate stems and explanations —
  e.g. "Which organelle is known as the powerhouse of the cell?" and
  "The full form of DNA is:". Each was reworded (English and Assamese together)
  to ask the same fact in genuinely different words, or, where the fact itself
  was already used elsewhere, replaced by a different fact. The bank now
  reports 0 exact and 0 fuzzy duplicates.
- **Assamese too.** The same fuzzy check was run on the Assamese text, since
  the rule covers both languages. A further 25 Assamese stems and 38 Assamese
  explanations across the Biology and Art & Culture banks were reworded.
- Only the affected question files changed; no page, script, style,
  `index.json` or count file was touched.

## Session record — Nov 2026 RRB NTPC Art & Culture bank (400 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/static-gk-computers/art-culture/`:
  `question-002.json` … `question-400.json` (399 new files) beside the existing
  `question-001.json`, giving the subcategory **400 questions**. Each file holds
  one MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **Topic resolution.** `static-gk-computers` is a topic with five
  subcategories, so the SPA reads the subcategory folder;
  `art-culture/index.json` now lists all 400 files. The topic-level
  `static-gk-computers/index.json` keeps `files: []` on purpose, exactly like
  `geography/index.json` and `polity/index.json`.
- **Content.** RRB NTPC (CBT-1 & CBT-2) level, covering the eight classical
  dances and dance-drama, folk dances of the States, Indian music (Hindustani,
  Carnatic, ragas, talas, instruments, gharanas), painting schools and folk
  painting, cave art, temple architecture and sculpture, monuments, festivals,
  handicrafts and textiles, and art institutions and awards. Answer keys are
  spread over A/B/C/D (101/100/100/99) and the longest run of one slot is 3.
  `--book rrb-ntpc --topic general-awareness/static-gk-computers/art-culture
  --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and explanation was compared (case- and
  punctuation-insensitive) against the 46,643 stems already in `data/`, which
  includes the constitution and governance banks added in the same session. The
  21 colliding items were reworded, so this bank shares no stem or explanation
  with any existing bank or mock set.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the earlier session records.
- **Verified** by serving the repo locally: the subcategory `index.json` and
  every `question-NNN.json` return 200. `node tools/seo-audit.js` still reports
  no missing H1/desc/canonical/JSON-LD and all duplicate counts at 0. No page,
  UI, script or CSS file changed.

## Session record — Nov 2026 RRB NTPC Union & State Governance bank (360 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/polity/governance/`:
  `question-002.json` … `question-360.json` (359 new files) beside the existing
  `question-001.json`, giving the subcategory **360 questions**. Each file holds
  one MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **Topic resolution.** `polity` is a topic with two subcategories, so the SPA
  reads the subcategory folder; `governance/index.json` now lists all 360 files.
  `polity/index.json` keeps `files: []` on purpose, exactly like
  `geography/index.json`. This subcategory now holds both samples and banks, so
  the topic has no empty subcategory left.
- **Content.** RRB NTPC (CBT-1 & CBT-2) level, covering the President (election,
  powers, veto, ordinances, pardons, emergencies), the Vice-President, the Prime
  Minister and Council of Ministers, Parliament (composition, sessions,
  committees, procedure, money bills, lists), the judiciary (Supreme Court, High
  Courts, writs, judicial review), Centre-State relations, emergency provisions
  and Panchayati Raj and municipal governance. Answer keys are spread over
  A/B/C/D (91/90/90/89) and the longest run of one slot is 3.
  `--book rrb-ntpc --topic general-awareness/polity/governance --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and explanation was compared (case- and
  punctuation-insensitive) against the 46,044 stems already in `data/`, which
  now includes the constitution bank added in the same session. The 68 colliding
  items were reworded, so this bank shares no stem or explanation with any
  existing bank or mock set.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the earlier session records.
- **Verified** by serving the repo locally: the subcategory `index.json` and
  every `question-NNN.json` return 200. `node tools/seo-audit.js` still reports
  no missing H1/desc/canonical/JSON-LD and all duplicate counts at 0. No page,
  UI, script or CSS file changed.

## Session record — Nov 2026 RRB NTPC Constitution & Fundamental Rights bank (350 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/polity/constitution/`:
  `question-002.json` … `question-350.json` (349 new files) beside the existing
  `question-001.json`, giving the subcategory **350 questions**. Each file holds
  one MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **Topic resolution.** `polity` is a topic with two subcategories, so the SPA
  reads the subcategory folder; `constitution/index.json` now lists all 350
  files. `polity/index.json` keeps `files: []` on purpose, exactly like
  `geography/index.json`.
- **Content.** RRB NTPC (CBT-1 & CBT-2) level, covering the Constituent Assembly
  and key dates, the Preamble and borrowed features, Parts III to IVA (Articles
  12 to 51A), citizenship, Fundamental Rights, Directive Principles, Fundamental
  Duties, Schedules, amendments (1st, 24th, 25th, 42nd, 44th, 52nd, 61st, 73rd,
  74th, 86th, 92nd, 101st, 103rd), landmark cases, constitutional bodies and
  Union/State institutions. Answer keys are spread over A/B/C/D
  (89/87/87/87) and the longest run of one slot is 3.
  `--book rrb-ntpc --topic general-awareness/polity/constitution --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and explanation was compared (case- and
  punctuation-insensitive) against the 45,695 stems already in `data/`. The 110
  colliding items were reworded, so the bank shares no stem or explanation with
  any existing bank or mock set.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the earlier session records.
- **Verified** by serving the repo locally: the subcategory `index.json` and
  every `question-NNN.json` return 200. `node tools/seo-audit.js` still reports
  no missing H1/desc/canonical/JSON-LD and all duplicate counts at 0. No page,
  UI, script or CSS file changed.

## Session record — Nov 2026 RRB NTPC World Geography question bank (320 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual World Geography bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/geography/world-geography/`:
  `question-002.json` … `question-320.json` (319 new files) on top of the
  existing `question-001.json`, for **320 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **Topic resolution.** `geography` has two subcategories, so the SPA reads the
  subcategory folder. `world-geography/index.json` now lists all 320 files; the
  parent `geography/index.json` keeps `files: []` on purpose.
- **Content.** Questions target RRB NTPC (CBT-1 & CBT-2) difficulty and cover the
  universe and solar system, the Earth's motions, latitudes and longitudes,
  oceans, seas, straits and canals, ocean currents and tides, continents and
  their extremes, atmosphere layers and instruments, winds, pressure and climate
  zones, minerals, industries and crops, grasslands, countries, capitals and
  currencies, and landforms and plate tectonics. Answer keys are spread over
  A/B/C/D (81/80/80/79) and the longest run of one slot is 3.
  `--book rrb-ntpc --topic general-awareness/geography/world-geography --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and explanation was compared (case- and
  punctuation-insensitive) against the 44,976 question stems already in `data/`.
  The 68 colliding items were reworded — most of them the "capital of X" series,
  which now uses five rotating phrasings, so the bank shares no stem or
  explanation with any existing bank or mock set.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the earlier session records.
- **Verified** by serving the repo locally: the topic `index.json` and every
  `question-NNN.json` return 200. `node tools/seo-audit.js` still reports no
  missing H1/desc/canonical/JSON-LD and all duplicate counts at 0. No page, UI,
  script or CSS file changed.

## Session record — Nov 2026 RRB NTPC Indian Geography question bank (290 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Indian Geography bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/geography/indian-geography/`:
  `question-002.json` … `question-290.json` (289 new files) on top of the
  existing `question-001.json`, for **290 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **Topic resolution.** The `geography` section has two subcategories
  (`indian-geography`, `world-geography`), so the SPA fetches questions from the
  subcategory folder, not the parent. `indian-geography/index.json` now lists
  all 290 files. The parent `geography/index.json` keeps `files: []` on purpose —
  it is not used when a section has subcategories.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty and
  cover relief and mountains, rivers and drainage, climate and monsoon, soils and
  natural vegetation, agriculture, minerals and energy, industries, transport,
  population and states, waterfalls, national parks and wildlife, tourist places,
  passes and straits, latitudes and the boundaries of India. Answer keys are
  spread evenly over A/B/C/D (74/72/72/72) and the longest run of the same slot
  is 3, so no answer pattern is exposed.
  `--book rrb-ntpc --topic general-awareness/geography/indian-geography --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive) against all other question text already in
  `data/`; the 31 colliding items (10 stems + 21 explanations) were reworded so
  the bank shares no stem or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the earlier session records.
- **Verified** by serving the repo locally: the topic `index.json` and every
  `question-NNN.json` return 200. `node tools/seo-audit.js` still reports no
  missing H1/desc/canonical/JSON-LD and all duplicate counts at 0. No page, UI,
  script or CSS file changed.

## Session record — Nov 2026 RRB NTPC Chemistry question bank (320 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Chemistry bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/general-science/chemistry/`:
  `question-002.json` … `question-320.json` (319 new files) on top of the
  existing `question-001.json`, for **320 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 320 `question-NNN.json`
  files. The SPA's `listExamQuestions` reads that manifest (and the folder
  listing) and fetches every file, so no code change was needed.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover basic concepts, atomic structure, the periodic table, chemical
  bonding, acids-bases-salts, metals and non-metals, carbon compounds, chemical
  reactions and the mole concept, everyday chemistry, fuels, polymers,
  medicines and food chemistry, and separation techniques. Answer keys are
  spread evenly over A/B/C/D (81/80/80/79), and the longest run of the same
  slot is 3, so no answer pattern is exposed.
  `--book rrb-ntpc --topic general-awareness/general-science/chemistry --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive) against all other question text already
  in `data/`; the 52 colliding items (44 stems + 8 explanations) were reworded
  so the bank shares no stem or explanation with the existing banks or mock
  sets. The most repetitive unit-conversion items were dropped to hold the
  bank at the requested 320.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the earlier session records.
- **Verified** by serving the repo locally: the chemistry `index.json` and every
  `question-NNN.json` return 200. `node tools/seo-audit.js` still reports no
  missing H1/desc/canonical/JSON-LD and all duplicate counts at 0. No page, UI,
  script or CSS file changed.

## Session record — Nov 2026 RRB NTPC Physics question bank (305 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Physics bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/general-science/physics/`:
  `question-002.json` … `question-305.json` (304 new files) on top of the
  existing `question-001.json`, for **305 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 305 `question-NNN.json`
  files. The SPA's `listExamQuestions` reads that manifest (and the folder
  listing) and fetches every file, so no code change was needed.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover units and measurement, motion and laws of motion, work, energy and
  power, gravitation, heat and thermodynamics, properties of matter, waves and
  sound, light and optics, electricity and magnetism, modern physics, and
  applied physics. Answer keys are spread evenly over A/B/C/D (77/76/76/76),
  and the longest run of the same slot is 3, so no answer pattern is exposed.
  `--book rrb-ntpc --topic general-awareness/general-science/physics --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive) against all other question text already
  in `data/`; the 44 colliding items were reworded so the bank shares no stem
  or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged** (the book is still
  `status: "coming-soon"`), as recorded in the Biology session record above.
- **Verified** by serving the repo locally: the physics `index.json` and every
  `question-NNN.json` return 200. `node tools/seo-audit.js` still reports
  `thin (<300w): 0`, no missing H1/desc/canonical/JSON-LD and all duplicate
  counts at 0. No page, UI, script or CSS file changed.

## Session record — Nov 2026 RRB NTPC Assam Economy question bank (100 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Assam Economy bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/economy/assam-economy/`:
  `question-002.json` … `question-100.json` (99 new files) beside the existing
  `question-001.json`, giving the topic **100 questions**. Each file holds one
  MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 100 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty and
  focus on the Assam economy — tea and its industry, agriculture and Joha rice,
  oil and natural gas, the refineries at Digboi, Guwahati, Numaligarh and
  Bongaigaon, coal and minerals, silk (Muga and Eri), industry and
  infrastructure, bridges and waterways, tourism, national parks and Bihu.
  Answer keys are spread over A/B/C/D — across all 100 questions the slots hold
  26/25/25/24; `--book rrb-ntpc --topic
  general-awareness/economy/assam-economy --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Indian Economy question bank (402 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Indian Economy bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/economy/indian-economy/`:
  `question-002.json` … `question-402.json` (401 new files) beside the existing
  `question-001.json`, giving the topic **402 questions**. Each file holds one
  MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 402 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty and
  cover the basics of the economy and national income, planning and the Five
  Year Plans, money and banking, public finance and taxation (including GST),
  agriculture and food security, industry and infrastructure, poverty and human
  development, population and employment, the external sector and international
  institutions, and a mixed set on markets and macro concepts.
  Answer keys are spread over A/B/C/D — across all 402 questions the slots hold
  102/100/100/100; `--book rrb-ntpc --topic
  general-awareness/economy/indian-economy --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

**Follow-up (Nov 2026) — fuzzy dedup pass.** The original "no duplicated
content" claim above held only for exact matches. A later fuzzy check
(`difflib.SequenceMatcher`, ratio >= 0.90, English and Assamese, case- and
punctuation-folded) found 15 near-duplicate stems/explanations against other
`data/` banks (e.g. the Indus-Valley "metal NOT known" item against the mock
`set-*.json`, "first Tirthankara" against `jainism-buddhism.json`, "founder of
the Mauryan empire" against another `question-001.json`), plus 5 pairs of
templated parallel stems inside this bank. Those 19 items were reworded in
place — the correct option and its meaning were never changed, only the
wording — and the topic now reports **0** near-duplicates. When adding to this
bank, re-run a fuzzy check, not just an exact one.

## Session record — Nov 2026 RRB NTPC Modern History question bank (430 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Modern History bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/history/modern-history/`:
  `question-002.json` … `question-430.json` (429 new files) beside the existing
  `question-001.json`, giving the topic **430 questions**. Each file holds one
  MCQ in the repo's shape — `id`, `q.{en,as}`, four `options[{en,as}]`,
  `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 430 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover the advent of the Europeans and British expansion, the revolt of
  1857, the rise of nationalism and the Congress, the Moderates and Extremists,
  the Swadeshi movement, the Gandhian mass movements (Non-Cooperation, Civil
  Disobedience, Quit India), revolutionary nationalism, the Round Table
  Conferences and the Acts of 1909/1919/1935, the socio-religious reform
  movements, peasant and tribal movements, the press and education, the
  Governor Generals and Viceroys, partition and integration, and modern Indian
  science and industry (with a set of Assam-linked items).
  Answer keys are spread over A/B/C/D — across all 430 questions the slots hold
  109/107/107/107; `--book rrb-ntpc --topic
  general-awareness/history/modern-history --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Medieval History question bank (400 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Medieval History bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/history/medieval-history/`:
  `question-002.json` … `question-400.json` (399 new files) on top of the
  existing `question-001.json`, for **400 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 400 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover early medieval India, the Rajputs and the Turkish invasions, the
  Delhi Sultanate (Slave, Khalji, Tughlaq, Sayyid and Lodi dynasties) and its
  administration, the Mughal empire from Babur to Aurangzeb, the Bhakti and
  Sufi movements, Vijayanagara, the Bahmani and Deccan Sultanates, the Marathas
  and Sikhs, the later Mughals and regional powers, and medieval art,
  architecture, literature and culture (with a set of Assam/Ahom questions).
  Answer keys are spread over A/B/C/D — across all 400 questions the slots hold
  101/100/100/99, using the same deterministic sequence
  `tools/balance-answer-keys.js` uses; `--book rrb-ntpc --topic
  general-awareness/history/medieval-history --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Ancient History question bank (360 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a full bilingual Ancient History bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/history/ancient-history/`:
  `question-002.json` … `question-360.json` (359 new files) on top of the
  existing `question-001.json`, for **360 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 360 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover prehistory and the Indus Valley civilisation, the Vedic period,
  Jainism and Buddhism, the Mahajanapadas and the rise of Magadha, the Mauryan
  empire, post-Mauryan India (Shungas, Indo-Greeks, Shakas, Satavahanas,
  Kushanas, art schools), the Gupta empire and its culture, and post-Gupta
  India and the Sangam age. Answer keys are spread over A/B/C/D — across all
  360 questions the slots hold 91/90/90/89, using the same deterministic
  sequence `tools/balance-answer-keys.js` uses; `--book rrb-ntpc --topic
  general-awareness/history/ancient-history --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing banks or mock sets.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

**Follow-up (Nov 2026) — fuzzy dedup pass.** The "no duplicated content" claim
above held only for exact matches. A later fuzzy check
(`difflib.SequenceMatcher`, ratio >= 0.90, English and Assamese, case- and
punctuation-folded) found 13 near-duplicate stems against other `data/` banks
and inside this bank: 8 cross-bank hits (e.g. "which of the four Vedas is the
oldest" against `adre-grade-4/social-studies/indian-history`, "which river is
most mentioned in the Rigveda" against `adre-grade-3/.../indian-history-ancient`
and `adre-grade-4`, "which foreign dynasty ruled north-west India after the
Mauryas", "last great Gupta ruler", "Mehrauli iron pillar", "Brihadeshwara
temple") plus 5 pairs of templated parallel stems inside the bank (Vinaya/
Abhidhamma Pitaka, women/Rajan in the Early Vedic period, Brahman/Atman,
Bimbisara items). Those 13 items were reworded in place — the correct option
and its meaning were never changed, only the wording — and the topic now
reports **0** near-duplicates. Answer keys stayed balanced at 91/90/90/89.
When adding to this bank, re-run a fuzzy check, not just an exact one.

## Session record — Nov 2026 RRB NTPC Appointments & Obituaries question bank (161 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual Appointments & Obituaries bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/current-affairs/appointments-obituaries/`:
  `question-002.json` … `question-161.json` (160 new files) on top of the
  existing `question-001.json`, for **161 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 161 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content rule — nothing older than one year.** The user's standing rule is
  that current-affairs content must stay within roughly the last 12 months, so
  every item here is anchored to events between **November 2025 and November
  2026** (Indian and world appointments, elections, resignations, and the deaths
  of notable personalities). Older appointments are only used in their
  "who holds this post today" form.
- **Answer keys** are spread over A/B/C/D — across all 161 questions the slots
  hold 41/40/40/40, using the same deterministic sequence
  `tools/balance-answer-keys.js` uses; `--book rrb-ntpc --topic
  general-awareness/current-affairs/appointments-obituaries --check` reports 0
  skewed topics. (The tool only audits multi-question files, so this bank was
  balanced with the same sequence applied across the whole topic.)
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing appointments,
  obituaries, awards, books-authors or national-international-news banks.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Government Schemes & Initiatives question bank (161 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual Government Schemes & Initiatives bank to the RRB NTPC book
  at `data/exams/rrb-ntpc/general-awareness/current-affairs/government-schemes-initiatives/`:
  `question-002.json` … `question-161.json` (160 new files) on top of the
  existing `question-001.json`, for **161 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 161 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC difficulty and cover the Union
  Budget 2025-26 announcements (PM Dhan-Dhaanya Krishi Yojana, Makhana Board,
  National Manufacturing Mission, Nuclear Energy Mission, Gyan Bharatam Mission,
  BharatTradeNet, SWAMIH Fund 2) and major central schemes across agriculture,
  health, education, women and child welfare, employment, financial inclusion,
  infrastructure, energy and digital governance. Per the user's standing rule,
  current-affairs content stays within roughly the last 12 months.
- **Answer keys** are spread over A/B/C/D — across all 161 questions the slots
  hold 41/40/40/40, using the same deterministic sequence
  `tools/balance-answer-keys.js` uses; `--book rrb-ntpc --topic
  general-awareness/current-affairs/government-schemes-initiatives --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing ADRE grade-3/4 schemes
  banks, the economy banks or the content pages.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Sports question bank (161 MCQs)

What was done, so the next agent does not redo or undo it:

- **Added** a bilingual Sports bank to the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/current-affairs/sports/`:
  `question-002.json` … `question-161.json` (160 new files) on top of the
  existing `question-001.json`, for **161 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 161 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC difficulty and cover 2025-26
  sports: the ICC Champions Trophy 2025, the ICC Women's Cricket World Cup 2025
  (hosted by India), IPL 2025, the 2025-26 Asia Cup, the 2025 World Test
  Championship final, the 2026 Men's T20 World Cup, the 2026 Winter Olympics
  (Milano Cortina), the 2026 Winter Paralympics, the 2026 Commonwealth Games
  (Glasgow), the 2026 Asian Games and Asian Para Games (Aichi-Nagoya), the 2026
  Summer Youth Olympics (Dakar), the Kho Kho World Cup 2025, the 2025 FIFA Club
  World Cup, the 2026 FIFA World Cup, tennis Grand Slams 2025, Formula One 2025,
  and Indian achievements across badminton, chess, athletics, hockey, wrestling
  and shooting. Per the user's standing rule, content stays within roughly the
  last 12 months.
- **Answer keys** are spread over A/B/C/D — across all 161 questions the slots
  hold 41/40/40/40, using the same deterministic sequence
  `tools/balance-answer-keys.js` uses; `--book rrb-ntpc --topic
  general-awareness/current-affairs/sports --check` reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`; the colliding items were reworded so the
  bank shares no stem or explanation with the existing 2024-focused sports
  banks, the national-international-news bank, or the content pages.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Miscellaneous Static GK question bank (251 MCQs)

What was done, so the next agent does not redo or undo it:

- **Extended** the Miscellaneous Static GK topic of the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/static-gk-computers/miscellaneous-static-gk/`:
  `question-002.json` … `question-251.json` (250 new files) on top of the
  existing `question-001.json`, for **251 questions** in the topic. Each file
  holds one MCQ in the repo's shape — `id`, `q.{en,as}`, four
  `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 251 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover national symbols and their scientific names, Indian firsts and
  superlatives (first President/Prime Minister/Governor-General/Nobel
  laureate/Olympic medallist/Bharat Ratna recipients), world and India
  superlatives (longest river, largest ocean/continent/island/country, deepest
  trench, largest lake/waterfall/state/national park), monuments, city
  nicknames, national and state awards, organisations and their headquarters,
  important days, state symbols of Assam, wildlife projects, books and authors,
  social reformers, inventors and discoveries, currencies, and elementary
  science (human body, blood groups, gases, chemical symbols, vitamins,
  deficiency diseases, acids).
- **Answer keys** are spread over A/B/C/D — across all 251 questions the slots
  hold 64/63/62/62; `--book rrb-ntpc --topic
  general-awareness/static-gk-computers/miscellaneous-static-gk --check`
  reports 0 skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`. This topic is built almost entirely from
  canonical static facts, so the first pass flagged 179 questions (e.g. "the
  national animal/bird/flower", "the first President", "currency of X",
  "largest river/ocean", "headquarters of WHO", the important-days and
  chemical-symbol series) as near-duplicates (difflib ratio >= 0.90) of the
  assam-police, dhs-dme and exam-mock-set banks. A multi-pass fuzzy reword
  brought that to **0** cross-bank and 0 internal near-duplicates. The
  pre-existing `question-001.json` ("national animal") was itself reworded
  because the user explicitly asked that no duplicate content remain on the
  site; its correct option (index 0) and meaning were left unchanged. The
  correct option and its meaning were never changed anywhere, only wording.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Basics of Computers question bank (301 MCQs)

What was done, so the next agent does not redo or undo it:

- **Extended** the Basics of Computers topic of the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/static-gk-computers/basic-computers/`:
  `question-002.json` … `question-301.json` (300 new files) on top of the
  existing `question-001.json` ("which memory is volatile"), for **301
  questions** in the topic. Each file holds one MCQ in the repo's shape —
  `id`, `q.{en,as}`, four `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 301 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty
  and cover the history of computing (abacus, Babbage, Ada Lovelace, ENIAC,
  UNIVAC), the five generations, input/output/storage devices, the CPU and
  its units, memory (RAM/ROM/cache/registers, units from bit to terabyte),
  motherboards and power devices, software types (system vs application,
  firmware, device drivers), operating systems and Windows tools, file
  systems, folders and file extensions, MS Word, MS Excel, MS PowerPoint,
  shortcut keys, networking (LAN/WAN/MAN/PAN, router/switch/hub/modem,
  cables, Wi-Fi), the internet and web (WWW, URL, browser, search engine,
  HTML, HTTP/HTTPS, FTP, IP, DNS, domains, ISP), email (CC/BCC, folders,
  spam, attachments), e-services (e-commerce, e-learning, e-governance,
  internet banking, social media, IoT, cloud), computer security (malware,
  virus, worm, trojan, spyware, antivirus, firewall, encryption, phishing,
  hacking, passwords, two-factor authentication), programming (algorithm,
  machine/assembly/high-level languages, compiler, interpreter, assembler,
  bug, debugging, FORTRAN, COBOL, Java, Python), databases (field, record,
  primary key, DBMS, SQL), AI and machine learning, number systems
  (binary/decimal/octal/hexadecimal) and computer types and peripherals.
- **Answer keys** are spread over A/B/C/D — across all 301 questions the slots
  hold 76/75/75/75; `--book rrb-ntpc --topic
  general-awareness/static-gk-computers/basic-computers --check` reports 0
  skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`. The first pass flagged 61 fields across 42
  questions as near-duplicates (difflib ratio >= 0.90) of the dhs-dme
  computer-fundamentals/ms-office banks, the exam-mock-set computer banks and
  this repo's own space-defence bank (mostly the "what does the abbreviation X
  stand for" and "X stands for Y" templates). A reword pass brought that to
  **0** cross-bank. A second pass cleared the 42 internal self-collisions
  (the parallel Word/Excel shortcut, file-extension, header/footer, MAX/MIN,
  number-system and abbreviation series). The bank now reports **0**
  near-duplicates cross-bank and 0 internally. The correct option and its
  meaning were never changed anywhere, only wording.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

## Session record — Nov 2026 RRB NTPC Awards, Books & Indexes question bank (171 MCQs)

What was done, so the next agent does not redo or undo it:

- **Extended** the Awards, Books & Indexes topic of the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/current-affairs/awards-books-indexes/`:
  `question-002.json` … `question-171.json` (170 new files) on top of the
  existing `question-001.json` ("highest civilian award of India"), for **171
  questions** in the topic. Each file holds one MCQ in the repo's shape — `id`,
  `q.{en,as}`, four `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 171 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty and
  cover: civilian awards (Bharat Ratna, Padma Vibhushan / Bhushan / Shri, their
  order of precedence and announcing month, conferring authority, first
  recipients), gallantry awards (Param Vir Chakra, Ashoka Chakra, Maha Vir
  Chakra, Vir Chakra, Kirti Chakra, Shaurya Chakra — wartime and peacetime
  order), sports awards (Major Dhyan Chand Khel Ratna and its old name, Arjuna,
  Dronacharya, Dhyan Chand Award, National Sports Day), cinema and other awards
  (Dadasaheb Phalke, Swarna Kamal, National Film Awards, Ramon Magsaysay,
  Right Livelihood / Alternative Nobel, Goldman / Green Nobel, Pulitzer,
  Booker, Grammy, Oscar, Fields Medal, Abel Prize, Shanti Swarup Bhatnagar,
  Sangeet Natak / Lalit Kala / Sahitya Akademi, Jnanpith and Saraswati Samman),
  books and authors (national song and anthem, 'Wings of Fire', 'The Discovery
  of India', 'My Experiments with Truth', 'India Wins Freedom', Arthashastra,
  Indica, Mahabharata / Ramayana / Bhagavad Gita, Kalidasa, Tulsidas, the
  Assamese novel tradition — Bhanumati, Manomati, Miri Jiyori, Iyaruingam,
  Mrityunjay, Burhi Aair Sadhu, Homen Borgohain, Mamoni Raisom Goswami, the
  Rupkonwar / Kalaguru / Sahityarathi titles), and the indexes and reports
  (Human Development Index, Global Hunger Index, Ease of Doing Business, Global
  Innovation Index, Global Gender Gap, Environmental Performance, Corruption
  Perceptions, Global Peace, World Happiness, Global Competitiveness, World
  Press Freedom, Global Terrorism, Climate Change Performance, Multidimensional
  Poverty, Global Slavery, Henley Passport, plus the Indian indexes — Ease of
  Living, SDG India, Swachh Survekshan, Export Preparedness, India Justice,
  India State of Forest, Economic Survey, Good Governance — each paired with
  the organisation that publishes it).
- **Answer keys** are spread over A/B/C/D — across all 171 questions the slots
  hold 44/43/42/42; `--book rrb-ntpc --topic
  general-awareness/current-affairs/awards-books-indexes --check` reports 0
  skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`. The first pass flagged 176 fields across 77
  questions as near-duplicates (difflib ratio >= 0.90) — heavily against the
  adre-grade-3/4 awards-honours banks, the assam-police sports-awards bank and
  the current-affairs awards-honours/books-authors banks, which already ask the
  same "highest civilian award / Jnanpith year / which field is X given in"
  stems. A generic-transform reworder cleared most, and handcrafted rewrites
  cleared the rest, bringing **cross-bank to 0**. A second pass cleared the
  internal self-collisions (the parallel "which organisation brings out the
  Global X Index" and "in which year was the X award instituted" series) to
  **0** internally. The correct option and its meaning were never changed
  anywhere, only wording.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.
