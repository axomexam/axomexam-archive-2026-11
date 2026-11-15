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
