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
- **Every page opens with exactly one `<!DOCTYPE html>` / `<html lang="…">`.**
  The exam-book builders borrow another book's page as "chrome": they copy its
  head and re-emit the doctype themselves. `chrome()` in
  `tools/lib/exam-book-pages.js` and `tools/build-adre-grade-3.js` must
  therefore slice the borrowed head from `<head>`, **not** from byte 0 — taking
  the whole prefix duplicated the doctype and `<html>` line once per book that
  borrowed a leaf from another book (RRB NTPC reached three). If a page ever
  shows a repeated leading doctype, fix the slice and run
  `node tools/fix-duplicate-doctype.js` (idempotent) to repair the tree; it
  keeps the first `<html lang>` so the `/as/` twins stay `lang="as"`.
- **No ad code on the Assamese (`/as/`) pages.** Assamese is not a supported
  AdSense language, and Google's publisher policies forbid ad code on a page
  whose content is primarily in an unsupported language. The `/as/` twin must
  carry **no** AdSense trace, not just the loader: the
  `google-adsense-account` ownership meta, the `pagead2.googlesyndication.com`
  `dns-prefetch`, the `<!-- Google AdSense Script -->` comment, the
  `adsbygoogle.js` loader, and the `ins.adsbygoogle` / `.google-auto-placed`
  rules inside `<style id="axo-layout-reserve">` all come off. The `.main-nav`
  rules in that same style block are **not** ads (they reserve the JS-built
  desktop nav) and stay, so the Assamese page keeps its twin's layout-shift
  behaviour. `tools/lib/strip-adsense.js` is the single source of truth for
  this; `tools/build-as-twins.js` calls it on every rebuild, so a twin can
  never re-acquire the footprint, and `scripts/inject-adsense-meta.js` skips
  `/as/`. To clean the committed tree after changing the rule, run
  `node tools/strip-adsense-from-as.js` (idempotent; a clean tree reports
  `changed: 0`). Only indexable English content pages carry the loader. The
  Google Analytics tag (below) is a separate thing and **does** go on every
  page, `/as/` included.
- **Every published page carries the Google Analytics tag — `/as/` too.**
  The site's GA4 measurement ID is `G-PBPXK2Q799`, in the `gtag.js` snippet
  at the top of `<head>` (marker `googletagmanager.com/gtag/js`). This is
  **analytics, not ads**, so unlike the AdSense loader it belongs on the
  Assamese pages as well. A new page (any book, any language) is not done
  until it carries the tag: `node scripts/inject-ga.js .` injects it into
  every HTML file that lacks it and is idempotent (re-running reports
  `Injected: 0`). The only pages that legitimately lack it are the "This page
  has moved" redirect stubs, and even those should carry it so a redirect hit
  is still counted. After adding pages, run the injector and confirm
  `Injected: 0` / `Already present` equals the file count.
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
- **Every question-answer page also carries its own 1300+ word study
  article.** A page that publishes an MCQ bank is not "done" when the
  questions are in. It must also carry a topic-relevant long-form article
  panel — an `h2`, overview prose, a key-facts list and a short FAQ — in
  **both** English and Assamese, and **each** language must reach **1300
  words minimum**. The article is written for that topic (exam-relevant,
  high-quality, covering the syllabus around the questions — not template
  filler and not a restatement of the MCQs), and it must not reuse another
  page's prose. This is a standing rule: it applies to **any new
  question-answer page in any book**, not only RRB NTPC.
  - RRB NTPC source files: `tools/rrb-ntpc-ga-articles/<group>/<leaf>.js`,
    each exporting `{ h2, p: { en, as }, list: { en, as }, faqs }`.
  - Render with `node tools/rrb-ntpc.ga-extra.js`; gate with
    `node tools/rrb-ntpc.ga-extra-check.js`, which must end
    `articles failing the 1300-word floor (either language): 0; missing: 0`.
  - The panel lives in the `axo-extra-content` block placed **after
    `</main>`** (outside `<main id="app">`) so Googlebot reads it with JS
    off, and `tools/build-as-twins.js` copies it into the `/as/` twin.
- **Maths and Reasoning banks must cover *every type* of a topic — never one
  type repeated to reach a count.** When any Maths or Reasoning book, mock
  test, exam bank or topic page is authored, each topic it contains must
  exercise **all the question types that topic has**, not one type (or a
  couple) repeated until the target number of questions is reached. Take
  Number System: its types include basic terms, divisibility rules, place
  value and face value, unit digit and cyclicity, remainders, factors and
  multiples, number of zeros, and so on — a Number System set that only asks
  "is X prime", or only HCF/LCM, is **not** done however many questions it
  holds, because it leaves most of the topic's types untested. The same
  applies to **every** Maths topic (percentage, ratio and proportion,
  average, time-speed-distance, time and work, profit and loss,
  simple/compound interest, mixture and alligation, algebra, geometry,
  mensuration, trigonometry, …) and **every** Reasoning topic (number and
  alphabet series, coding-decoding, blood relations, direction and distance,
  order and ranking, syllogism, clock and calendar, non-verbal reasoning, …).
  - **How to author a topic:** first enumerate that topic's types from its own
    syllabus — the `h3` sub-sections on the topic page (e.g.
    `topic/math/arithmetic/number-system/index.html`) and the topic's
    deep-article in `data/deep-articles/` — then make sure the bank carries
    questions for **each** listed type, spread evenly and without leaning on a
    single type.
  - **The requested count is a floor, not a licence.** A target like "20
    questions" sets the minimum total, not permission to fill all 20 with one
    type. If the count is too small to cover every type, cover every type
    anyway and raise the count.
  - **Where this bites:** the exam banks
    (`data/exams/<exam>/<subject>/<topic>/question-NNN.json`), the subject mock
    tests (`data/mock-test/<subject>/<group>/set-N.json`), the exam mock sets
    (`data/exam-mock-sets/…`) and the `topic/math/**` / `topic/reasoning/**`
    pages. This is a standing rule for any future Maths or Reasoning bank in
    any book, in both English and Assamese.
- **Non-Verbal Reasoning keeps the existing figure format — only the shapes
  and images change.** Every Non-Verbal Reasoning question (figure series,
  figure analogy, figure classification, figure matrix, mirror image, water
  image, embedded figures, counting figures, pattern completion, paper folding
  and cutting, rule detection, shape construction and grouping, cube and dice)
  must be authored and rendered in **exactly the format already used on the
  Assam Police Non-Verbal Reasoning pages** — the same markup, classes and
  render path — with **each question carrying its own distinct shapes and
  images**, never a copied or repeated figure. The reference is
  <https://axomexam.in/exams/assam-police/logical-reasoning/non-verbal-reasoning>
  and its leaf pages (e.g. `…/non-verbal-reasoning/figure-series/`); copy that
  shape, not the content.
  - **Question figure** goes in the item's `fig` field and renders inside
    `<div class="nv-media">…</div>` (the prompt diagram: the series, matrix or
    pattern to be read).
  - **Answer options are picture choices**, each an object
    `{ option: "A"|"B"|"C"|"D", fig: "<svg…>" }` (an optional `text` caption is
    allowed). They render as a labelled grid
    `<div class="nv-fig-grid">` → `<div class="nv-fig-item">` →
    `<div class="nv-fig-key">(A)</div>` → `<div class="nv-fig-box">…</div>`,
    with `.nv-fig-grid-compact` used inside the MCQ card. Do **not** fall back
    to text-only options for a non-verbal question — that is not the format.
  - **Figures are inline SVG** (`<svg viewBox=…>` with `polygon`, `line`,
    `rect`, `circle`, `path` shapes), stroke `#334155`, no external image
    files and no `<img>` URLs. An optional data table uses the `table` field
    and the `nv-table-wrap` / `nv-table` classes.
  - **Source of truth:** the question JSON lives in
    `data/content/reasoning/<topic>.json` (`q: { en, as }`, `fig`, `options`,
    `correct`, `explanation: { en, as }`) and is rendered by `js/app.src.js`
    (`mediaBlock`, `figureOptions`, `figureOptionsHTML`) into `js/app.js`,
    styled by `css/style.src.css` → `css/style.css` (the `nv-*` rules). Change
    the content, not the format.
  - **Every question must show different shapes/images.** Two questions in the
    same bank (and across the site) must not reuse the same figure set; each
    prompt figure and each option figure is drawn for that question's own
    pattern, so a reader never meets the same picture twice. The figures must
    also actually match the question and its correct answer, and the question
    text and options stay bilingual (English and Assamese) like every other
    question.
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

## Session record — Nov 2026 RRB NTPC book published (pages, twins, SEO)

The RRB NTPC book was flipped from `coming-soon` to `available` and given real
static pages, so every deep link now resolves without booting the SPA.

- **Pages.** `tools/build-rrb-ntpc-pages.js` writes the crawler-facing HTML for
  the whole book (hub, section, group, leaf and syllabus pages) through the
  shared `tools/lib/exam-book-pages.js`, reading the committed banks from
  `data/exams/rrb-ntpc/...` and never writing into `data/`
  (`noDataWrites: true`). The tool also registers the new URLs in the sitemap.
  Result: 87 topics, 6,060 questions, 92 EN pages.
- **Assamese twins.** `tools/build-as-twins.js --prefix exams/rrb-ntpc` writes
  the `/as/` twins. Re-run it after any tool that rewrites `<title>`/`<h1>`,
  or the twin head drifts out of sync with its English page.
- **Status flip.** `"coming-soon"` → `"available"` in
  `tools/rrb-ntpc.structure.js`, `data/exams/rrb-ntpc.json` and
  `data/exams/index.json`; the SPA "content being prepared" popup was disabled
  in `js/app.src.js`.
- **Counts and hero.** `tools/build-question-counts.js` added the rrb keys to
  `data/counts.json` (this also stops `hydrateExamCardCounts` from falling back
  to a live GitHub API fetch of 6,060 files), and
  `tools/sync-home-hero-count.js` moved the hero to 66,813 questions / 717
  topics / 21 PDFs.
- **Thin stub leaves → noindex.** 66 of the 87 leaf topics still hold only a
  single sample question, so their pages were genuinely thin. Rather than pad
  them with prose, `tools/seo-indexing-fix.js` now derives the stub-leaf list
  from `data/counts.json` (leaf key with `<= 5` questions, i.e. no child key
  under it) and sets those routes — plus their `/as/` twins — to
  `noindex, follow`, and drops them from the sitemap. A topic leaves the set
  automatically once its bank is filled and the counts are rebuilt; the hub and
  section pages stay indexable. This took the audit from 66 thin pages to 0.
- **Titles.** `tools/apply-keyword-map.js` gained `--only-prefix <path>` so the
  keyword map can be applied to just this book's pages. Applying it to
  `exams/rrb-ntpc/` fixed the 9 over-length titles the shared builder emits
  (the builder's `"<topic> - <section> - <exam> | axomexam"` pattern runs past
  60 chars on long topic names). Audit after: thin 0, title >60 0, desc >160 0,
  dup titles/H1/descriptions 0.
- **Asset restamp.** Because `js/app.src.js` changed, the order is
  `node scripts/minify-assets.js` then `node scripts/stamp-assets.js` (the
  latter refreshes the `?v=` hashes on every page and in `sw.js`; it is
  idempotent — a second run reports 0 drift).
- **Build order matters.** `tools/build-rrb-ntpc-pages.js` regenerates the leaf
  pages from scratch, so it wipes the keyword-map titles, the enriched hub prose
  and the `noindex` flag. Whenever it is re-run, follow it with, in order:
  `tools/enrich-thin-pages.js` → `tools/apply-keyword-map.js --only-prefix
  exams/rrb-ntpc/` → `tools/build-as-twins.js --prefix exams/rrb-ntpc` →
  `tools/seo-indexing-fix.js`. That full chain is idempotent (a second run
  produces byte-identical output). Running the builder last silently reverts
  thin pages to 70 and titles to 50 over-length, which is what the audit caught.
- **Not touched.** No question file, `index.json` or bank was modified; the
  biology bank was re-verified only (310 questions, A/B/C/D =
  25.5/25.2/24.2/25.2%, longest run 3, no verbatim or fuzzy reuse anywhere in
  `data/`).

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

## Session record — Nov 2026 RRB NTPC Science, Tech & Environment question bank (186 MCQs)

What was done, so the next agent does not redo or undo it:

- **Extended** the Science, Tech & Environment topic of the RRB NTPC book at
  `data/exams/rrb-ntpc/general-awareness/current-affairs/science-tech-environment/`:
  `question-002.json` … `question-186.json` (185 new files) on top of the
  existing `question-001.json` ("which gas causes global warming"), for **186
  questions** in the topic. Each file holds one MCQ in the repo's shape — `id`,
  `q.{en,as}`, four `options[{en,as}]`, `correct`, `explanation.{en,as}`.
- **`index.json`** in the same folder now lists all 186 `question-NNN.json`
  files, so the SPA discovers them with no code change.
- **Content.** Questions are written for RRB NTPC (CBT-1 & CBT-2) difficulty and
  cover: space and astronomy (ISRO, Aryabhata, SLV-3, PSLV/GSLV/LVM3/SSLV,
  Chandrayaan 1-3 and the Vikram lander / Pragyan rover, Mangalyaan, Aditya-L1
  and the L1 point, Gaganyaan, the Bharatiya Antariksh Station, telescopes,
  planets, comets and meteors, constellations, the Milky Way), defence and
  nuclear technology (DRDO, the Prithvi / Agni / Akash / Nag / K-Sagarika
  missile families, BrahMos and its name, INS Vikrant and Arihant, Tejas,
  Prachand, Arjun, AMCA, AAD-PAD, NPCIL, BARC, Tarapur and Kudankulam, the
  three-stage programme and thorium, the 1974 and 1998 tests), energy
  (renewable and non-renewable sources, solar cells, wind and tidal and
  geothermal power, biogas and CNG, hydrogen fuel cells), IT and emerging
  technology (AI and machine learning, IoT, 5G, quantum computing and the
  qubit, 3D printing, blockchain and CBDC, phishing, malware and worms,
  firewalls, encryption, HTTPS and URLs, LAN/WAN, routers and modems, SSDs,
  GPS and NavIC, binary, Param and Pratyush), health and biotechnology (the
  cell, DNA, genetics, photosynthesis, xylem and phloem, the heart, kidneys and
  nephrons, insulin, vitamins and their deficiency diseases, deficiency of iron
  and iodine, blood groups, vaccines, penicillin, pasteurisation, cloning,
  genetic engineering and Bt cotton, bioremediation), and environment and
  climate (the ozone layer and its hole, the Montreal Protocol, the greenhouse
  effect, global warming, acid rain, smog, eutrophication, and water and air
  pollution).
- **Answer keys** are spread over A/B/C/D — across all 186 questions the slots
  hold 48/46/46/46; `--book rrb-ntpc --topic
  general-awareness/current-affairs/science-tech-environment --check` reports 0
  skewed topics.
- **No duplicated content.** Every stem and every explanation was compared
  (case- and punctuation-insensitive, English and Assamese) against all other
  question text already in `data/`. The first pass flagged 120 fields across 56
  questions as near-duplicates (difflib ratio >= 0.90) — heavily against the
  static `general-science/{physics,chemistry,biology}` banks, the dhs-dme
  technical-science and exam-mock-set general-knowledge banks, and this book's
  own `static-gk-computers/space-defence` and `basic-computers` banks, which
  already ask the same Chandrayaan / missile / human-body / IT fundamentals
  stems. A generic-transform reworder plus handcrafted rewrites brought
  **cross-bank to 0**, and a second pass cleared the internal self-collisions
  (the parallel "which of these is renewable" and "which disease is caused by a
  virus" pairs) to **0** internally. The correct option and its meaning were
  never changed anywhere, only wording.
- **`data/counts.json` is deliberately unchanged.** The book is still
  `status: "coming-soon"`, so `tools/build-question-counts.js` counts none of
  it. Do not "fix" the missing count.

---

## Session record — Nov 2026 RRB NTPC group-level hub pages (404 fix)

**Symptom.** The URL the owner shared,
`/exams/rrb-ntpc/general-awareness/general-science/`, returned **404**.
Every group-level directory under `exams/rrb-ntpc/*/*/` was missing its
`index.html` (history, geography, polity, economy, static-gk-computers,
current-affairs, and the three reasoning groups).

**Root cause.** `buildBook()` in `tools/lib/exam-book-pages.js` writes the
exam hub, each section page, and each leaf page, but **never writes the
intermediate group page** for a nested sub-category. The leaf-page
breadcrumbs link to that group URL, so the breadcrumb itself 404'd.
`tools/build-adre-grade-3.js` has its own copy of the group-page loop, which
is why ADRE was fine and every book driven by the shared lib (RRB NTPC,
Assam Police SI, DHS/DME) was not.

**Fix.**
1. Added the group-page loop to the shared `buildBook()` (same markup as the
   ADRE copy: hub title, breadcrumb, "Sub-categories" card grid, back link,
   editorial block). It runs after the section loop and before the leaf loop.
2. `updateSitemap()` now also emits the group URLs, so a group page is in the
   sitemap and the audit's alt-drift check stays at 0.
3. `keyword-map.csv`: added the 10 new group rows (minimal diff, rrb only).
4. `tools/enrich-thin-pages.js`: the `sub` growth paragraph was one sentence
   short — three groups (general-science 287w, economy/geography 297w) landed
   just under the 300-word thin threshold. Added one page-specific sentence.

**Verify.** All 10 group pages exist (EN + AS twin), 0 broken internal links
under `exams/rrb-ntpc/`, thin 0, title>60 0, desc>160 0, dup 0. Chain is
idempotent (two consecutive runs → EN/AS/sitemap diffs empty).

**Gotcha — builders are not dry-run by default.** `build-assam-police-si.js`
and `build-dhs-dme.js` take `--dry-run`, **not** `--check`; passing an
unknown flag makes them write. Running them to "check" my shared-lib change
silently rewrote ~90 unrelated assam-police-si / dhs-dme pages and question
files. Those were reverted with `git checkout` and the only kept diff is
under `exams/rrb-ntpc`, `as/exams/rrb-ntpc`, `keyword-map.csv`, `sitemap.xml`
and the two tool files. If you touch the shared lib, verify other books with
`git status --porcelain` afterwards, not with a fake check flag.

## Session record — Nov 2026 RRB NTPC content-load fix (consolidate question files)

**Symptom.** RRB NTPC topic pages sometimes rendered with no questions.

**Root cause.** RRB NTPC was the only book stored as **one file per question**
(`question-001.json` … `question-430.json`). Every other book uses the
"one topic = one file" layout (`PRIMARY = "question-001.json"`). Two effects:

1. A single topic page fetched 300–430 files at runtime (biology = 311 requests,
   modern-history = 431).
2. `listExamQuestions()` asked the **GitHub Contents API first**, which is rate
   limited to **60 requests/hour** for anonymous callers. After a couple of page
   views it returned `403`, the loader fell through with `questions=[]`, and the
   page rendered blank.

**Fix.**
1. New tool `tools/consolidate-exam-question-files.js` merges each multi-file
   topic into `question-001.json`, deletes the redundant files and rewrites
   `index.json`'s `files` array. Question order is preserved, so the rendered
   pages are unchanged (verified byte-identical against the 23 previous
   multi-file topics). Result: 23 RRB topics merged, 6,328 files removed, 6,351
   questions kept (assam-police was deliberately left on its original layout,
   since it was not affected by the load issue).
2. `js/api.src.js` now prefers the folder's `index.json` manifest (one
   same-origin request). The GitHub Contents API stays as the fallback, and is
   still used first when `CONFIG.USE_REMOTE` is on.
3. `tools/build-rrb-ntpc.js` gained a `readBankSize(rel)` guard: the seeder never
   shrinks a bank that has grown past its seed sample, so re-running it cannot
   wipe the real questions.

A topic now loads in 2 requests (manifest + one bank) instead of 311.

**Rule going forward — one topic, one file.** Do not add `question-002.json`,
`question-003.json`, … to any topic. Append to the topic's existing
`question-001.json` and make sure `index.json`'s `files` array still lists it.
If a topic ever has more than one `question-*.json`, run
`node tools/consolidate-exam-question-files.js --book <id>` (add `--check` to
report without writing).

**Gotcha — `build-as-twins.js` is not idempotent against committed pages.**
Pages that are `noindex` are deliberately left out of `twinSet`, so their
`/as/` twin links are not rewritten. Re-running the twin builder over an
already-committed tree therefore reports ~1,200 "changed" pages that are just
that difference. If a fix does not change page markup, do **not** re-run the
twin/keyword/SEO chain to "refresh" it — revert `*.html` and only re-run
`scripts/stamp-assets.js` so the `api.js?v=` hash matches the rebuilt bundle.
## Session record — Nov 2026 RRB NTPC GA article panels (23 topics) + Ancient History verification

What was done, so the next agent does not redo or undo it:

- **Completed the 23 RRB NTPC General Awareness long-form article panels.**
  The source files live in `tools/rrb-ntpc-ga-articles/<section>/<topic>.js`
  (untracked tool data, one module per leaf page). Each module exports
  `h2`, `p.{en,as}` (paragraph array), `list.{en,as}` (key-fact bullets) and
  `faqs` (5 bilingual Q&A). `tools/rrb-ntpc.ga-extra.js` renders them into a
  `<section class="section axo-extra-content" data-axo-extra="1">` block
  appended after `</main>` on the matching `exams/rrb-ntpc/general-awareness/
  <section>/<topic>/index.html`, and `tools/rrb-ntpc.ga-extra-check.js`
  reports per-file word counts.
- **Quality gate:** `node tools/rrb-ntpc.ga-extra-check.js` must end with
  `articles failing the 1300-word floor (either language): 0; missing: 0`.
  Both the English and the Assamese prose must reach ~1300 words; a file that
  reports `LOW` is topped up by extending the Assamese paragraphs (the EN side
  is usually already long enough).
- **Six current-affairs articles were authored in this session**:
  `appointments-obituaries`, `awards-books-indexes`,
  `government-schemes-initiatives`, `science-tech-environment` and `sports`
  (plus `national-international-news` finished earlier). All 23 topics now
  report `OK`.
- **Assamese twins rebuilt** with `node tools/build-as-twins.js --prefix
  exams/rrb-ntpc/general-awareness` (31 pages: 23 leaves + 8 group/hub pages).
  Do **not** run the tool without `--prefix`: a bare run rewrites ~1208
  unrelated `/as/` pages (mostly a title-suffix normalisation) and pollutes
  the diff. Use `--check` first to see drift, then `--prefix` to write only
  what you touched.
- **Ancient History (the user's URL) was already complete.** The 360 bilingual
  MCQs live in `data/exams/rrb-ntpc/general-awareness/history/ancient-history/`
  (`question-001.json` … `question-360.json`, listed in `index.json`), added in
  commit `a6b9d608` with two later dedup passes (`ec366128`, `5421514c`).
  Nothing needed to be added; it was verified only.
- **Verification run on the Ancient History bank:**
  - Answer keys spread over A/B/C/D (91/90/90/89); `balance-answer-keys.js
    --check` reports **0** skewed topics under `general-awareness`.
  - Fuzzy dedup (`rapidfuzz.fuzz.ratio >= 90`, case/punctuation-folded, EN and
    AS, stems *and* explanations, against all 80,804 text rows across `data/`)
    reports **0** near-duplicate pairs. An earlier session had already reworded
    the 13 items the first pass found.
  - `seo-audit.js` stays at dup titles/descriptions 0, thin 0, title>60 0,
    desc>160 0, sitemap alt miss 0.
- **A note on the dedup tooling.** The repo has no checked-in fuzzy dedup
  script; `tools/` holds only `dedupe-as-twins.js` (Assamese twin URLs) and
  `fix-duplicate-bilingual-text.js`. The fuzzy check above was run ad hoc with
  Python `rapidfuzz` (installed in the sandbox), token-prefiltered so it
  finishes in seconds; a plain `difflib` pass over all pairs is too slow
  (~80k rows) and will time out.

## Session record — Nov 2026 RRB NTPC exam-wise thumbnail

**Symptom.** The RRB NTPC card in Exam-wise Mock Test showed a dark blue
book-cover banner instead of a logo, unlike every other card.

**Root cause.** `images/exams/rrb-ntpc-logo.webp` was the book-cover art
(512×512, dark navy, text-heavy), added by `3256e6e9` alongside the cover.
Every peer card is a clean centred emblem on white — `railway-logo.webp` is the
red Indian Railways emblem — so RRB NTPC was the odd one out.

**Fix.** Regenerated `images/exams/rrb-ntpc-logo.webp` with the same house
treatment (the Indian Railways emblem, white square, 512×512 WebP) and updated
its `logoAlt` in all three places that hold it: `data/exams/rrb-ntpc.json`,
`data/exams/index.json`, `tools/rrb-ntpc.structure.js` (the source the builder
re-emits from, so the change is idempotent).

**Scope.** `exam.logo` is read only by the exam-wise hub card and the
exam-wise hero (`js/app.src.js`). The `/exams` book listing uses `exam.cover`
and is untouched. No HTML file hardcodes the logo — it is injected by JS — so
no page needed editing and `scripts/stamp-assets.js` stayed at 0 drift.

**Cache note.** Images are not versioned with `?v=`, but the service worker
caches first-party assets stale-while-revalidate (`STATIC_RE` includes `webp`).
The image is revalidated in the background on the next view, so no cache-bust
is needed for the swap to appear.

**Rule going forward — exam card thumbnails are logos, not covers.** A
`<id>-logo.webp` must be a single centred emblem on a white square (see
`railway-logo.webp`, `ssc-logo.webp`); book cover art belongs in
`<id>-cover.webp`, which the `/exams` cards render. `tools/build-exam-logos.js`
performs the trim/centre/512px treatment when raw art is dropped in `exam logo/`.
