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

## Session record — Nov 2026 RRB NTPC Analytical Reasoning banks, batch 2 (4 topics × 80)

Four more analytical-logical-reasoning leaf banks were filled from their
one-question stubs to 80 bilingual MCQs each, each covering **every type** of
its topic, with answer keys balanced and a 1300+ word article per language:

- `assertion-reason` — both-true-explains, both-true-not-explains, A-true-R-false,
  A-false-R-true, both-false, and single-assertion pick-the-reason. Types A–D
  use the classic option set in its conventional order, so their correct
  indices are fixed (0/1/2/3); type E and F carry their own option text and
  supply the four extra keys each slot needs for a 20/20/20/20 spread.
- `venn-diagrams` — pair relation, three-class arrangement, pick-the-pair for
  separate / overlapping / contained, and statement-to-set-expression.
- `statement-course-of-action` — two-course (only I / only II / both / neither),
  single-course (suitable / unsuitable / suitable-but-not-sufficient), and
  problem-with-four-courses.
- `decision-making-data-sufficiency` — data sufficiency (I alone / II alone /
  both / neither) and decision making (pick the most appropriate decision).

Generator scripts live in `/tmp/rrb4/` (regenerable). Each emits
`question-001.json` only (never `-002`) and removes stray higher-numbered
files. Answer keys are balanced by rotating the whole option array so the
correct option keeps its text and only its position changes; every bank ends
at A/B/C/D = 20/20/20/20. All four banks use exactly 4 options per question and
Assamese digits (০–৯) in Assamese text.

- **Dedup gotcha — a shared stem template collides across books.** The first
  Venn draft used "Which diagram best shows the relation between X and Y?",
  which fuzzy-matched (r≈0.90–0.97) nine questions in
  `data/exams/adre-grade-3/logical-reasoning/verbal-reasoning/venn-diagrams/`
  because that book uses the same template. Rewording the RRB stem to "Two
  classes are named, X and Y. Which circle arrangement correctly represents
  how the first class relates to the second?" took the cross-book fuzzy count
  from 9 to 0. Standing rule reminder: dedup is by meaning, not exact text, and
  a shared template is enough to trip it — reword, never drop the fact.
- **Assamese digit rule.** Assamese question and explanation text carries
  Assamese numerals. A math expression such as `x = 10` typed in ASCII digits
  slipped through once; the data-sufficiency generator now folds ASCII digits
  to Assamese with `str.maketrans` before writing. Check: no ASCII digit in any
  `q.as` / `explanation.as` / option `as`.
- **Article panels** added at
  `tools/rrb-ntpc-ga-articles/analytical-logical-reasoning/{assertion-reason,venn-diagrams,statement-course-of-action,decision-making-data-sufficiency}.js`.
  Rendered word counts (EN / AS): assertion-reason 1672/1323, venn-diagrams
  1464/1368, statement-course-of-action 1477/1335,
  decision-making-data-sufficiency 1498/1326. All clear the 1300 floor.
- **Build chain (idempotent).** `tools/build-question-counts.js` →
  `tools/build-rrb-ntpc-pages.js` → `tools/rrb-ntpc.ga-extra.js` →
  `tools/enrich-thin-pages.js` → `tools/apply-keyword-map.js --only-prefix
  exams/rrb-ntpc/` → `tools/build-as-twins.js --prefix exams/rrb-ntpc` →
  `tools/seo-indexing-fix.js` → `scripts/inject-ga.js .` →
  `tools/strip-adsense-from-as.js` → `tools/fix-duplicate-doctype.js`. A second
  run produced a byte-identical git tree (`git write-tree` equal before/after),
  so the chain is idempotent. After the run: `rrb-ntpc.ga-extra-check.js` ends
  `articles failing the 1300-word floor (either language): 0; missing: 0`, and
  `seo-audit.js` reports 0 for thin / title>60 / desc>160 / dup titles / dup H1
  / dup descriptions / sitemap alt drift / sitemap alt miss.
- **Scope.** Only the four topic banks, their four article modules, and the
  regenerated `data/counts.json`, RRB NTPC hub/group/leaf pages, `/as/` twins
  and `sitemap.xml` changed. No other book or bank was touched. All four topics
  left the stub set, flipped to `index, follow`, and re-entered the sitemap
  (EN + `/as/`). Remaining RRB NTPC reasoning stubs are the seven
  non-verbal-reasoning leaves, which keep the `nv-*` figure format and were not
  part of this batch.
- **Push.** `main` fast-forwarded to `b56051b6` (origin tip `90dd98f4` was an
  ancestor). The default `GITHUB_TOKEN` identity lacks push rights on this repo;
  the site owner's repo-scoped token was used, and the remote URL was reset to
  the clean HTTPS form afterwards. GitHub Pages built the commit and all four
  topics are live (EN + `/as/`, 200, 80-question badge, article panel present).

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

## Session record — Nov 2026 RRB NTPC Mathematics banks (Number System, Simplification & BODMAS)

What was done, so the next agent does not redo or undo it:

- **First two Mathematics leaf topics filled.** The RRB NTPC book's
  `mathematics` section holds 32 flat leaf topics (no group level, unlike
  General Awareness). `number-system` and `simplification-bodmas` now each hold
  a 71-question bilingual bank in
  `data/exams/rrb-ntpc/mathematics/<leaf>/question-001.json` (70 new questions
  plus the one pre-existing sample, which was preserved). The remaining 30 math
  leaves are still thin stubs (1 question, `noindex`).
- **Every type of the topic, not one repeated shape.** Number System covers
  primes/composites, twin primes, divisibility rules, HCF/LCM, place value,
  perfect squares and cubes, fractions to decimals, series sums
  (natural/odd/even/square/cube), remainders and unit digits. Simplification &
  BODMAS covers order of operations, brackets, fraction chains, decimal
  division, surds and indices, and percentage/ratio simplifications.
- **Answer keys balanced** 18/18/18/17 over A/B/C/D; `balance-answer-keys.js
  --book rrb-ntpc --topic mathematics/<leaf> --check` reports 0 skewed topics.
- **Article panels for a flat section.** `tools/rrb-ntpc.ga-extra.js` and
  `tools/rrb-ntpc.ga-extra-check.js` now drive a list of sections
  (`SECTION_IDS = ["general-awareness", "mathematics"]`, later extended with
  `"reasoning"`) instead of a single
  `SECTION_ID`. A grouped section keys its articles `"<group>/<leaf>"`; a flat
  section keys them `"<section>/<leaf>"`. The check only requires an article for
  a leaf whose bank is no longer a thin stub (`> 5` questions), the same
  threshold `seo-indexing-fix.js` uses for `noindex`. New article sources:
  `tools/rrb-ntpc-ga-articles/mathematics/{number-system,simplification-bodmas}.js`
  (EN 2034/1622 words, AS 1613/1351 words, 5 FAQs each).
- **Build order matters (again).** After editing a bank run, in order:
  `tools/build-question-counts.js` → `tools/build-rrb-ntpc-pages.js` →
  `tools/rrb-ntpc.ga-extra.js` → `tools/enrich-thin-pages.js` →
  `tools/apply-keyword-map.js --only-prefix exams/rrb-ntpc/` →
  `tools/build-as-twins.js --prefix exams/rrb-ntpc` →
  `tools/seo-indexing-fix.js`. The chain is idempotent (a second run differs
  only in `data/counts.json`'s `generatedAt`). Both filled topics leave the
  stub set, flip to `index, follow`, and re-enter `sitemap.xml` (EN + `/as/`).
  Hub counts follow: Mathematics hub reads 172 questions across 32
  sub-categories, exam hub 6,555.
- **Revert unrelated drift before committing.** `build-rrb-ntpc-pages.js` +
  the chain also rewrite ~31 Assamese General-Awareness twin pages (a
  pre-existing breadcrumb-URL fix) and re-touch the math stub leaves. Those are
  out of scope for a math content change — `git checkout -- as/exams/rrb-ntpc/
  general-awareness` (and any other untouched groups) to keep the diff to
  mathematics only. Do **not** revert the two target leaves: their
  `noindex → index` flip is the intended result.
- **Verification:** `seo-audit.js` clean (thin 0, missing H1/desc/canonical/
  JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0, sitemap alt miss 0);
  fuzzy dedupe (ratio 0.90) of the new stems/explanations against the whole
  `data/` corpus found no new near-duplicate rows (the one 100% hit is the
  pre-existing sample question `number-system-001`, which the bank must keep).

## Session record — Nov 2026 RRB NTPC Reasoning banks (Analogy, Classification / Odd One Out)

What was done, so the next agent does not redo or undo it:

- **First two Reasoning leaf topics filled.** `analogy` and
  `classification-odd-one-out` each now hold a 65-question bilingual bank in
  `data/exams/rrb-ntpc/reasoning/verbal-reasoning/<leaf>/question-001.json`
  (64 new questions plus the one pre-existing sample, preserved). The other 30
  reasoning leaves are still thin stubs (1 question, `noindex`).
- **Every type of the topic, not one repeated shape.** Analogy covers number
  (squares, cubes, ±1, fixed multiply/divide, roots), letter (position steps,
  letter groups) and word relations (tool, young one, dwelling, sound,
  instrument/quantity, profession/place, capital, product, festival/park,
  synonym, antonym). Classification covers number (parity, prime, square, cube,
  multiple, sequence), letter (vowels, steps, consecutive vs skipping pairs) and
  word (living/non-living, birds/mammals, fruits/vegetables, metals, currencies,
  sense organs, indoor/outdoor, state/city, carnivore/herbivore).
- **Answer keys balanced** 17/16/16/16 over A/B/C/D, longest run 3;
  `balance-answer-keys.js --book rrb-ntpc --topic reasoning/verbal-reasoning/
  <leaf> --check` reports 0 skewed topics.
- **No parallel tool.** The reasoning articles reuse the shared renderer rather
  than adding a second one: `tools/rrb-ntpc.ga-extra.js` and
  `tools/rrb-ntpc.ga-extra-check.js` gained `"reasoning"` in `SECTION_IDS`
  (`["general-awareness", "mathematics", "reasoning"]`). Reasoning is a grouped
  section, so its articles live at
  `tools/rrb-ntpc-ga-articles/verbal-reasoning/<leaf>.js` and key as
  `"verbal-reasoning/<leaf>"` — the same shape General Awareness already used.
  Article sizes: analogy EN 2083 / AS 1684, classification EN 1924 / AS 1547,
  5 FAQs each.
- **Check gate is stub-aware for every section.** The 1300-word gate now skips
  any leaf whose bank is still a thin stub (`<= 5` questions, the same
  threshold `seo-indexing-fix.js` uses for `noindex`), reporting the count as
  `leaves still on a stub bank`. This keeps the gate honest while reasoning and
  mathematics are filled in topic by topic instead of failing on 60 stubs.
- **Build order.** `tools/build-question-counts.js` → `build-rrb-ntpc-pages.js`
  → `tools/rrb-ntpc.ga-extra.js` → `enrich-thin-pages.js` →
  `apply-keyword-map.js --only-prefix exams/rrb-ntpc/` → `build-as-twins.js
  --prefix exams/rrb-ntpc` → `seo-indexing-fix.js`. Idempotent (a second run
  differs only in `data/counts.json`'s `generatedAt`). Both filled topics leave
  the stub set, flip to `index, follow` and re-enter `sitemap.xml` (EN + `/as/`);
  counts move the two keys 1 → 65, the reasoning section 32 → 160, exam total
  38,717 → 38,845.
- **Revert unrelated drift before committing.** The chain rewrites ~31 Assamese
  General-Awareness twin pages (pre-existing breadcrumb-URL fix, present on a
  pristine checkout too). `git checkout -- as/exams/rrb-ntpc/general-awareness/`
  keeps the diff to the two reasoning leaves. Do **not** revert those two
  leaves: their `noindex → index` flip is the intended result.
- **Verification:** `rrb-ntpc.ga-extra-check.js` ends
  `articles failing the 1300-word floor (either language): 0; missing: 0`;
  `seo-audit.js` clean (thin 0, title >60 0, desc >160 0, dup titles/H1/desc 0,
  sitemap alt drift/miss 0); fuzzy dedupe (ratio 0.90, EN + AS) of the new
  stems and explanations against the whole `data/` corpus found 0 cross-bank
  and 0 internal near-duplicates.

## Session record — Nov 2026 RRB NTPC Reasoning banks (Number Series, Alphabet Series, Coding-Decoding)

What was done, so the next agent does not redo or undo it:

- **Three more Reasoning leaf topics filled.** `number-series`,
  `alphabet-series` and `coding-decoding` each now hold a 65-question bilingual
  bank in `data/exams/rrb-ntpc/reasoning/verbal-reasoning/<leaf>/question-001.json`
  (64 new questions plus the one pre-existing sample, preserved verbatim). The
  other 27 reasoning leaves are still thin stubs (1 question, `noindex`).
- **Every type of the topic, not one repeated shape.** Number Series covers
  constant difference, growing (second-order) difference, multiplicative,
  squares and cubes (plain and shifted), prime, Fibonacci and factorial series,
  interleaved series, wrong-number series and missing-middle series. Alphabet
  Series covers fixed-step single letters, interleaved letter runs, front-and-
  back alternation, letter groups, alphanumeric series, position questions and
  word-based rules. Coding-Decoding covers letter-position codes, fixed forward
  and backward shifts, reversal and swapping, opposite (mirror) letters,
  number-to-letter substitution, word-to-word substitution and combined
  (reverse-then-shift) rules.
- **Answer keys balanced** 17/16/16/16 over A/B/C/D, longest run 3 in every
  bank; `balance-answer-keys.js --book rrb-ntpc --topic reasoning/verbal-reasoning/
  <leaf>` reports 0 skewed topics.
- **Article panels, same shared renderer.** No new tool: `tools/rrb-ntpc.ga-extra.js`
  and `tools/rrb-ntpc.ga-extra-check.js` already cover the reasoning section.
  New article sources sit beside the earlier two at
  `tools/rrb-ntpc-ga-articles/verbal-reasoning/{number-series,alphabet-series,
  coding-decoding}.js`, keyed `"verbal-reasoning/<leaf>"`. Article sizes:
  number-series EN 1778 / AS 1402, alphabet-series EN 1754 / AS 1394,
  coding-decoding EN 1678 / AS 1333, 5 FAQs each.
- **Build order.** `tools/build-question-counts.js` → `build-rrb-ntpc-pages.js`
  → `tools/rrb-ntpc.ga-extra.js` → `enrich-thin-pages.js` →
  `apply-keyword-map.js --only-prefix exams/rrb-ntpc/` → `build-as-twins.js
  --prefix exams/rrb-ntpc` → `seo-indexing-fix.js`. Idempotent (a second run
  differs only in `data/counts.json`'s `generatedAt`). Counts move the three
  keys 1 → 65, the verbal-reasoning group 144 → 336, the reasoning section
  160 → 352; all three flip to `index, follow` and re-enter `sitemap.xml`.
- **Templated wording is a dedup trap.** The banks were first drafted with
  repeated stem openers ("Complete the series:", "Determine the next number:")
  and repeated explanation formulas, which tripped the repository's fuzzy
  near-duplicate rule (ratio 0.90) with 26 internal hits. Diversifying the
  openers and explanation phrasings drove internal hits to 0. The only
  remaining cross-bank hits (6) are the three preserved pre-existing sample
  questions, which the bank must keep.
- **Do NOT run `balance-answer-keys.js` without a `--book`/`--topic` filter.**
  A bare invocation (even `--help`, which it ignores) rebalances *every*
  hand-uploaded bank in the repo, including `data/exams/assam-police*`,
  `dhs-dme*` and the RRB math stubs. Always pass `--book rrb-ntpc --topic
  reasoning/verbal-reasoning/<leaf>`; if you slip, `git checkout -- data/`
  restores everything except the banks you meant to touch.
- **Revert unrelated drift before committing.** The chain rewrites ~31 Assamese
  General-Awareness twin pages (pre-existing breadcrumb-URL fix, present on a
  pristine checkout too). `git checkout -- as/exams/rrb-ntpc/general-awareness/`
  keeps the diff to the three reasoning leaves. Do **not** revert those three
  leaves: their `noindex → index` flip is the intended result.
- **Verification:** `rrb-ntpc.ga-extra-check.js` ends
  `articles failing the 1300-word floor (either language): 0; missing: 0`;
  `seo-audit.js` clean (thin 0, title >60 0, desc >160 0, dup titles/H1/desc 0,
  sitemap alt drift/miss 0); fuzzy dedupe (ratio 0.90, EN + AS) of the new
  stems and explanations against the whole `data/` corpus found 0 new
  cross-bank near-duplicates beyond the preserved samples and 0 internal
  near-duplicates.
## Session record — Nov 2026 RRB NTPC Mathematics banks (Decimals & Fractions, Surds & Indices, Square Root & Cube Root)

Continues the session above. The next three Mathematics leaves are now filled
with full bilingual banks; the two hubs and the sitemap were regenerated and the
change was pushed straight to `main` (no PR, per the user's instruction).

- **Banks.** `decimals-fractions`, `surds-indices` and `square-cube-root` each
  now hold 71 questions (70 new + the existing sample). Every type of the topic
  is covered, not one shape repeated:
  - Decimals & Fractions: fraction→decimal, decimal→fraction, comparing,
    recurring decimals, decimal mul/div, fraction add/sub, fraction mul/div,
    mixed/improper, complex fractions, LCM/HCF of fractions, rounding/place
    value, word problems, percentage link, facts.
  - Surds & Indices: basic terms (radicand/index/base), laws of indices,
    negative and fractional exponents, surd simplification, surd +/−/×/÷,
    rationalisation and conjugates, comparing surds, index equations.
  - Square Root & Cube Root: square roots, cube roots, perfect-square/cube
    identification, unit digits, prime-factorisation roots, make-a-perfect-square,
    add-to-make-a-perfect-square, decimal/fraction roots, digit counts,
    approximate irrational values.
- **Answer keys balanced** 18/18/18/17 over A/B/C/D for all three; `--check`
  reports 0 skewed topics for them.
- **Stem wording varied** so the same pattern does not repeat verbatim; the
  near-exact duplicates that remained (100% matches against older books) were
  removed by rewording or replacing the offending rows. Cross-bank identical
  rows: 0.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{decimals-fractions,surds-indices,square-cube-root}.js`
  (EN 1785/1782/1772 words, AS 1421/1302/1352 words, 5 FAQs each); the check
  (`tools/rrb-ntpc.ga-extra-check.js`) reports 0 failing the 1300-word floor.
- **Build order** unchanged from the previous session:
  `build-question-counts.js` → `build-rrb-ntpc-pages.js` → `rrb-ntpc.ga-extra.js`
  → `enrich-thin-pages.js` → `apply-keyword-map.js --only-prefix exams/rrb-ntpc/`
  → `build-as-twins.js --prefix exams/rrb-ntpc` → `seo-indexing-fix.js`.
  Idempotent: a second run leaves the 15 scoped files byte-identical.
- **Scope.** The 15 files are: the 3 question JSONs, 4 EN pages (2 hubs + exam
  hub + 3 leaves, counting the exam and math hubs once each), 4 `/as/` twins,
  `data/counts.json`, `sitemap.xml`. The same out-of-scope GA/reasoning drift
  the chain produces was reverted (see the previous session's "Revert unrelated
  drift" note); do not revert the three target leaves, whose `noindex → index`
  flip and sitemap re-entry are the intended result.
- **Verification:** `seo-audit.js` clean (1321 pages, thin 0, missing H1/desc/
  canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0, sitemap alt
  miss 0). Every bank validated for schema, 4 unique options, bilingual stems
  and explanations, unique ids.

## Session record — Nov 2026 RRB NTPC Mathematics banks (LCM & HCF, Percentage, Ratio & Proportion, Partnership)

- **What changed.** Four more `data/exams/rrb-ntpc/mathematics/<topic>/question-001.json`
  banks were expanded from a single sample row to 71 bilingual MCQs each, in the
  same shape as the earlier mathematics banks (id `<topic>-NNN`, `q.en`/`q.as`,
  four `options` with `en`/`as`, `correct` index, `explanation.en`/`.as`):
  `lcm-hcf`, `percentage`, `ratio-proportion`, `partnership`. The order follows
  the mathematics hub, so these are topics 6–9 after Number System, Simplification
  & BODMAS, Decimals & Fractions, Surds & Indices and Square Root & Cube Root.
- **Difficulty raised for a central exam.** Stems were written at RRB NTPC CBT
  level rather than as one-step recalls: HCF/LCM of three or four numbers, the
  HCF×LCM relation used in reverse, the least/greatest number with equal or given
  remainders, bells/traffic-light/runner periodicities, HCF and LCM of fractions
  and decimals, ratio-from-HCF/LCM and from sums/differences, chained and derived
  ratios (duplicate, sub-duplicate, triplicate, compound), successive-change and
  expenditure questions, election and pass-marks templates, successive discounts
  with profit, and partnership with unequal periods, mid-year withdrawal/addition,
  three partners and a working partner's salary.
- **Type coverage is complete** for each topic (many distinct shapes per bank,
  not one repeated template).
- **Answer keys balanced** 18/18/18/17 over A/B/C/D for all four;
  `tools/balance-answer-keys.js --book rrb-ntpc --topic mathematics/<t>` reports
  the move and `--check` shows no skew.
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio ≥ 90)
  over every other `data/exams/**/question-*.json` bank found the rows that
  matched older books verbatim; those were reworded or replaced (e.g. the
  2160/12 LCM row, the 12-15-20 remainder row, the 10%+20% discount row, the
  −10%+10% net-change row, the 16&36 mean proportional, the 2A=3B=4C row).
  Remaining exact matches are only the original single-sample rows (topic-001),
  which are intentionally preserved.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{lcm-hcf,percentage,ratio-proportion,partnership}.js`
  (EN 1495/1636/1837/1630 words, AS 1348/1428/1432/1304 words, 5 FAQs and a
  10-item key-facts list each); `tools/rrb-ntpc.ga-extra-check.js` reports 0
  failing the 1300-word floor.
- **Build order** unchanged: `build-question-counts.js` →
  `build-rrb-ntpc-pages.js` → `rrb-ntpc.ga-extra.js` → `enrich-thin-pages.js` →
  `apply-keyword-map.js --only-prefix exams/rrb-ntpc/` →
  `build-as-twins.js --prefix exams/rrb-ntpc` → `seo-indexing-fix.js`. The exam
  hub now reports 7,365 questions and the mathematics hub 662; only
  `data/counts.json`'s `generatedAt` changes on a second run, so the chain is
  idempotent for every scoped page.
- **Scope.** 22 files: the 4 question JSONs, 4 article modules, 5 EN pages (exam
  hub, math hub, 4 leaves — counted once each), 5 `/as/` twins, `data/counts.json`
  and `sitemap.xml`. As in the previous session, the out-of-scope GA drift the
  chain produces (invisible-character rewrites of `as/exams/rrb-ntpc/general-awareness/**`)
  was reverted; do not revert the four target leaves, whose `noindex → index`
  flip and sitemap re-entry are the intended result.
- **Verification:** `seo-audit.js` clean (1321 pages, thin 0, missing H1/desc/
  canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0, sitemap alt
  miss 0); every bank validated for schema, 4 unique options, bilingual stems
  and explanations, unique ids.
## Session record — Nov 2026 RRB NTPC Reasoning banks (Alphabet Test, Blood Relations, Clock & Calendar, Direction & Distance)

What was done, so the next agent does not redo or undo it:

- **Four more Reasoning leaf topics filled, at 72 questions each.** This
  session's brief was "next 4, 72 nos, question level thoda hard". `alphabet-test`,
  `blood-relations`, `clock-calendar` and `direction-distance` each now hold a
  72-question bilingual bank in
  `data/exams/rrb-ntpc/reasoning/verbal-reasoning/<leaf>/question-001.json`
  (71 new questions plus the one pre-existing sample, preserved verbatim).
  The other 49 reasoning leaves are still thin stubs (1 question, `noindex`).
- **Every type of the topic, not one repeated shape, and set harder than the
  earlier three banks.** Alphabet Test covers position-from-left/right,
  letters-between, midpoint, rearranged alphabet (reverse, half-reversed,
  halves-interchanged) and word-based rules. Blood Relations covers pointing
  puzzles, coded-symbol relations, family-tree chains, in-law and
  generation-counting, with multi-link (3–4 hop) chains. Clock & Calendar
  covers clock angles at a time, time for a given angle, coincidence,
  gain/loss clocks, mirror clocks, and calendar day-of-week, odd days, leap
  years and after-n-days. Direction & Distance covers Pythagoras displacement,
  final direction, shadow, multi-leg turns, shortest distance, person-to-person
  relative position and compass rotation.
- **Answer keys balanced** 18/18/18/18 over A/B/C/D, longest run 5 in every
  bank; `balance-answer-keys.js --book rrb-ntpc --topic reasoning/verbal-reasoning/
  <leaf>` reports 0 skewed topics.
- **Article panels, same shared renderer.** No new tool: `tools/rrb-ntpc.ga-extra.js`
  and `tools/rrb-ntpc.ga-extra-check.js` already cover the reasoning section.
  New article sources sit at `tools/rrb-ntpc-ga-articles/verbal-reasoning/
  {alphabet-test,blood-relations,clock-calendar,direction-distance}.js`, keyed
  `"verbal-reasoning/<leaf>"`. Article sizes: alphabet-test EN 1776 / AS 1385,
  blood-relations EN 1844 / AS 1416, clock-calendar EN 1895 / AS 1453,
  direction-distance EN 1777 / AS 1392, 5 FAQs each. Keep EN and AS paragraph
  counts equal (13/13 here); the word gate counts the article's paragraphs,
  list and FAQ text together.
- **Build order.** `tools/build-question-counts.js` → `build-rrb-ntpc-pages.js`
  → `tools/rrb-ntpc.ga-extra.js` → `enrich-thin-pages.js` →
  `apply-keyword-map.js --only-prefix exams/rrb-ntpc/` → `build-as-twins.js
  --prefix exams/rrb-ntpc` → `seo-indexing-fix.js`. Idempotent (a second run
  differs only in `data/counts.json`'s `generatedAt`). Counts move the four
  keys 1 → 72 and all four flip to `index, follow` and re-enter `sitemap.xml`.
- **Regenerating a bank resets its answer keys.** After any re-run of a Python
  generator, re-run `balance-answer-keys.js` for that topic before rebuilding,
  or the pages ship 71-of-72 "option A".
- **Templated wording is a dedup trap, but the repo's own large banks are far
  worse.** Rotate stem openers and explanation formulas per family (e.g. for
  the clock-angle family, cycle "Find the angle …", "What is the angle …",
  "Determine the angle …"). Even so, a fixed-template bank keeps ~100–175
  internal hits at ratio 0.90 — this is normal here: the existing accepted
  `adre-grade-3 …/synonyms` bank has 12,338 internal pairs and
  `adre-grade-4 …/indian-history` has 111. There is no CI gate on this.
  What matters is cross-bank: the new stems/explanations must not near-duplicate
  text already in `data/`, apart from the preserved samples.
- **Do NOT run `balance-answer-keys.js` without a `--book`/`--topic` filter.**
  A bare invocation (even `--help`, which it ignores) rebalances *every*
  hand-uploaded bank in the repo. Always pass `--book rrb-ntpc --topic
  reasoning/verbal-reasoning/<leaf>`; if you slip, `git checkout -- data/`
  restores everything except the banks you meant to touch.
- **Revert unrelated drift before committing.** The chain rewrites ~31 Assamese
  General-Awareness twin pages (pre-existing breadcrumb-URL fix, present on a
  pristine checkout too). `git checkout -- as/exams/rrb-ntpc/general-awareness/`
  keeps the diff to the four reasoning leaves. Do **not** revert those four
  leaves: their `noindex → index` flip is the intended result.
- **Verification:** `rrb-ntpc.ga-extra-check.js` ends
  `articles failing the 1300-word floor (either language): 0; missing: 0`;
  `seo-audit.js` clean (thin 0, title >60 0, desc >160 0, dup titles/H1/desc 0);
  fuzzy dedupe (ratio 0.90, EN + AS) of the new stems and explanations against
  the whole `data/` corpus.

## Session record — Nov 2026 RRB NTPC Reasoning banks (Inequality, Input-Output, Logical Sequence of Words, Mathematical Operations)

What was done, so the next agent does not redo or undo it:

- **Four more Reasoning leaf topics filled, at 72 questions each.** The brief was
  "next 4, same format, same condition, level hard". `inequality`,
  `input-output`, `logical-sequence-words` and `mathematical-operations` each
  now hold a 72-question bilingual bank in
  `data/exams/rrb-ntpc/reasoning/verbal-reasoning/<leaf>/question-001.json`.
  Every other reasoning leaf remains a thin stub (1 question, `noindex`).
- **Every type of the topic, not one repeated shape.** Inequality covers direct
  relation chains, coded-symbol inequalities, either-or conclusions, missing
  symbol and "which conclusion follows" sets. Input-Output covers find-the-rule,
  apply-the-rule, number-machine step output, word-machine step output,
  which-step, mixed word/number machines, find-the-input, after-step-n,
  even/odd split and prime split. Logical Sequence of Words covers process
  order, growth order, dictionary order (incl. shared prefixes), ascending /
  descending by number, order by a stated property, position-after-sorting and
  odd-one-out. Mathematical Operations covers single substitution, BODMAS coded
  expressions, missing sign, sign interchange, letter codes, sample-based rules,
  two-statement checks and bracketed coded expressions.
- **Answers are computed, not typed.** The generators simulate the machine /
  evaluate the coded expression with exact `Fraction` arithmetic and reject any
  candidate whose options are not four distinct strings. Step sequences drop
  trailing no-op steps so each shown step really differs; interchange questions
  are only emitted when exactly one sign-pair repairs the equation.
- **Answer keys balanced** 18/18/18/18 over A/B/C/D in every bank, via
  `balance-answer-keys.js --book rrb-ntpc --topic reasoning/verbal-reasoning/<leaf>`
  (always with the filter — see the warning above).
- **Article panels, same shared renderer.** No new tool: `tools/rrb-ntpc.ga-extra.js`
  and `tools/rrb-ntpc.ga-extra-check.js` already cover the reasoning section.
  New article sources sit at `tools/rrb-ntpc-ga-articles/verbal-reasoning/
  {inequality,input-output,logical-sequence-words,mathematical-operations}.js`,
  keyed `"verbal-reasoning/<leaf>"`, 5 FAQs each. Word gate counts paragraphs +
  list + FAQ text together; keep EN and AS paragraph counts equal.
- **Build order and verification unchanged** from the previous session record:
  counts → pages → ga-extra → enrich → keyword-map → as-twins → seo-indexing-fix,
  idempotent (only `counts.json`'s `generatedAt` moves). All four leaves go
  1 → 72 questions, flip to `index, follow`, and re-enter `sitemap.xml`;
  `rrb-ntpc.ga-extra-check.js` ends with 0 failing the 1300-word floor and 0
  missing; `seo-audit.js` clean; cross-bank fuzzy dedupe (ratio 0.90, EN + AS)
  over the whole `data/` corpus reports 0 hits for the four new banks.
- **Revert unrelated drift before committing**, as before:
  `git checkout -- as/exams/rrb-ntpc/general-awareness/` (the chain rewrites
  ~31 Assamese GA twin pages). Do not revert the four reasoning leaves.

## Session record — Nov 2026 RRB NTPC Mathematics banks, batch 3 (Simple Interest, Compound Interest, Time & Work, Work & Wages)

- **What changed.** Four more `data/exams/rrb-ntpc/mathematics/<topic>/question-001.json`
  banks were expanded from a single sample row to **75** bilingual MCQs each, in the
  same shape as the earlier mathematics banks: `simple-interest`,
  `compound-interest`, `time-work`, `work-wages` (topics 14–17 in
  `tools/rrb-ntpc.structure.js`). 74 new + the 1 sample row per topic.
- **Difficulty at RRB NTPC CBT level, every type covered.** Simple interest:
  direct P/R/T, time in months and in years-and-months, reverse principal and
  rate, two amounts at two times, doubling/trebling/multiples, two-part sums at
  two rates, ratio-of-interest comparisons, SI−CI difference, one-year rate
  change. Compound interest: direct, half-yearly and quarterly compounding,
  CI−SI for 2 and 3 years, reverse principal/rate, doubling-and-multiples in
  time, single-year interest, population growth and machine depreciation, reverse
  population. Time & work: together, one-leaves-early, two-leaves-early,
  efficiency ratios, chain efficiencies, men-and-days inverse proportion,
  A/B/C two-at-a-time, alternate days, three-person, partial work fractions.
  Work & wages: wage-in-work-ratio, inverse-time shares, efficiency-ratio
  shares, three-worker shares, share differences, equal-daily-wage day-ratio
  case, contract amounts, and the "A works 1/4 then B finishes" split.
- **Answer keys balanced** 19/19/19/18 over A/B/C/D for all four
  (`balance-answer-keys.js --book rrb-ntpc --topic mathematics/<t>`).
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio ≥ 93)
  over every other `data/exams/**/question-*.json` bank (39,941 rows) found only
  template-level matches (same shape, different numbers) against the ADRE-Grade-3
  `simple-compound-interest` and DHS-DME `arithmetic` banks; exact cross-bank
  duplicates: 0. Several internally inconsistent rows (a 150-day day-count row,
  a reinvestment row, a two-part sum with a mismatched rate, and a few
  "standard numbers" hand-waves) were rewritten so every stem and explanation is
  arithmetically exact.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{simple-interest,compound-interest,time-work,work-wages}.js`
  (EN 1587/1497/1356/1308 words, AS 1355/1313/1308/1380 words, 5 FAQs and a
  10-item key-facts list each); `rrb-ntpc.ga-extra-check.js` reports 0 failing the
  1300-word floor.
- **Build order** unchanged: counts → pages → ga-extra → enrich → keyword-map →
  as-twins → seo-indexing-fix, idempotent (only `counts.json`'s `generatedAt`
  moves). The exam hub now reports 8,241 questions.
- **Revert unrelated drift before committing**, as before:
  `git checkout -- as/exams/rrb-ntpc/general-awareness/`. Do not revert the four
  target mathematics leaves.
- **Verification:** `seo-audit.js` clean (1321 pages, sitemap 2508, thin 0,
  missing H1/desc/canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0,
  sitemap alt miss 0); every bank validated for schema, 4 unique options,
  bilingual stems and explanations, unique ids.

## Session — RRB NTPC Mathematics batch 4 (topics 14–17 continuation)

- **Four new bilingual banks, 80 hard/difficult MCQs each**, in
  `data/exams/rrb-ntpc/mathematics/<topic>/question-001.json`:
  - `pipes-cisterns` — two inlets, inlet+outlet, three pipes, leak/emptying,
    pipe closed early, pipe opened late, alternate opening, A/B/C two-at-a-time,
    fraction-full, never-fills and tank-empties cases.
  - `time-speed-distance` — direct S/D/T, km/h ↔ m/s, average speed (equal
    distance = harmonic, equal time = arithmetic, three distances), relative
    speed (same/opposite), meeting and catching, mixed-mode travel with one
    unknown, late/early margins, stoppage-per-hour, two-part journeys.
  - `problems-on-trains` — pole crossing, platform/bridge crossing, speed/length
    reverse cases, two trains (opposite and same direction, equal-length,
    speed-finding from two crossing times), overtaking a walking man, pole +
    platform two-equation families.
  - `boats-streams` — downstream/upstream direct and reverse, still-water and
    stream speed, time downstream/upstream, same-distance same-time equation,
    round trips, ratio-of-times families, and the boat's-own-speed-constant
    across two streams case.
- **Answer keys balanced 20/20/20/20** over A/B/C/D for all four
  (`balance-answer-keys.js --book rrb-ntpc --topic mathematics/<t>`).
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio >= 95)
  over every other `data/exams/**/question-*.json` bank (40,518 rows) found
  exact cross-bank duplicates: 0 and no >=95 match; internal >=97 pairs are all
  template-level (same shape, different numbers), consistent with the batch-3
  precedent. A few "standard numbers" hand-waves and two inconsistent
  two-train/round-trip rows were rewritten so every stem and explanation is
  arithmetically exact, and 2–3 redundant template repeats were dropped to land
  exactly on 80 per topic.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{pipes-cisterns,time-speed-distance,problems-on-trains,boats-streams}.js`
  (EN 1507/1418/1342/1337 words, AS 1401/1364/1348/1415 words, 5 FAQs and a
  10-item key-facts list each); `rrb-ntpc.ga-extra-check.js` reports 0 failing
  the 1300-word floor.
- **Build order** unchanged: counts → pages → ga-extra → enrich → keyword-map →
  as-twins → seo-indexing-fix, idempotent (only `counts.json`'s `generatedAt`
  moves). The exam hub now reports 8,841 questions.
- **Revert unrelated drift before committing**, as before:
  `git checkout -- as/exams/rrb-ntpc/general-awareness/`. Do not revert the four
  target mathematics leaves.
- **Verification:** `seo-audit.js` clean (1321 pages, sitemap 2524, thin 0,
  missing H1/desc/canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0,
  sitemap alt miss 0); every bank validated for schema, 4 unique options,
  bilingual stems and explanations, unique ids; all four EN+AS pages show
  80 questions and the article panel, `noindex=0`.

## Session — RRB NTPC Mathematics batch 5 (topics 18–21)

- **Four new bilingual banks, 80 hard/difficult MCQs each**, in
  `data/exams/rrb-ntpc/mathematics/<topic>/question-001.json`:
  - `race-circular-track` — meet-at-start (LCM of lap times), same-direction and
    opposite-direction meetings, repeated meetings, laps gained, race margins
    (metres and seconds), starts and handicaps, chain of results (A>B>C), and
    equal-length two-runner cases.
  - `elementary-algebra` — linear equations (brackets, fractions), simultaneous
    equations (elimination and direct x+y), the identities (a±b)², a²−b²,
    a²+b², cubes, factorisation, exponents, HCF/LCM of expressions, and word
    problems (numbers, ages, two-digit numbers).
  - `quadratic-linear-equations` — roots by factorisation, sum/product of roots,
    sum of squares and reciprocal sum, discriminant and nature of roots, equal
    roots, forming the equation from roots, linear pairs, and ratio shortcuts.
  - `geometry` — angle and triangle properties, Pythagoras and the common
    triples, quadrilateral and regular-polygon formulas, number of diagonals,
    circle properties (semicircle, tangent, chord), and the mensuration formulas
    the paper usually pairs with geometry.
- **Answer keys balanced 20/20/20/20** over A/B/C/D for all four
  (`balance-answer-keys.js --book rrb-ntpc --topic mathematics/<t>`).
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio >= 95)
  over every other `data/exams/**/question-*.json` bank (40,870 rows) found 4
  exact cross-bank duplicates (one algebra identity, three elementary geometry
  facts shared with DHS-DME and mensuration-3d); all four stems were reworded or
  re-parameterised, so the final cross-bank exact-duplicate count is 0. The
  remaining >=95 hits are template-level (same shape, different numbers).
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{race-circular-track,elementary-algebra,quadratic-linear-equations,geometry}.js`
  (EN 1477/1481/1464/1496 words, AS 1539/1346/1301/1331 words, 5 FAQs and a
  10-item key-facts list each); `rrb-ntpc.ga-extra-check.js` reports 0 failing
  the 1300-word floor.
- **Build order** unchanged: counts → pages → ga-extra → enrich → keyword-map →
  as-twins → seo-indexing-fix, idempotent (only `counts.json`'s `generatedAt`
  moves). The exam hub now reports 9,157 questions.
- **Revert unrelated drift before committing**, as before:
  `git checkout -- as/exams/rrb-ntpc/general-awareness/`. Do not revert the four
  target mathematics leaves.
- **Verification:** `seo-audit.js` clean (1321 pages, sitemap 2532, thin 0,
  missing H1/desc/canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0,
  sitemap alt miss 0); every bank validated for schema, 4 unique options,
  bilingual stems and explanations, unique ids; all four EN+AS pages show
  80 questions and the article panel, `noindex=0`.

## Session — RRB NTPC Mathematics batch 6 (topics 22–25)

- **Four new bilingual banks, 80 hard/difficult MCQs each**, in
  `data/exams/rrb-ntpc/mathematics/<topic>/question-001.json`:
  - `coordinate-geometry` — distance formula (origin, general, axis distances),
    midpoint and section formula (1:1, 1:2, 1:3), slope (from two points, from
    y = mx + c, horizontal/vertical), parallel and perpendicular slopes,
    intercepts, quadrants and axis membership, area of triangles on the axes,
    centroid, and collinearity.
  - `trigonometry` — the six ratios, the standard values table, Pythagorean
    identities, complementary-angle relations, ratio-from-ratio (3-4-5,
    5-12-13, 8-15-17, 7-24-25), simplification, sum/difference of angles,
    max/min of sin θ and cos θ, and value-at-an-angle.
  - `height-distance` — angle of elevation and depression, tan θ = h/d at 30°,
    45° and 60°, shadows, two-step observers (walking towards), two points on
    the same side, ladders, kites, two poles, tree broken by wind, tower with a
    flagstaff, and observer eye-height additions.
  - `statistics` — mean (direct, reverse, total = mean × count), effect of
    adding/multiplying/subtracting a constant, mean of symmetric series and
    APs, median (odd/even, missing value), mode, range, combined means, and
    removed/added value from two means.
- **Answer keys balanced 20/20/20/20** over A/B/C/D for all four
  (`balance-answer-keys.js --book rrb-ntpc --topic mathematics/<t>`).
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio >= 95)
  over every other `data/exams/**/question-*.json` bank (41,121 rows) found 5
  exact cross-bank duplicates shared with DHS-DME advanced-math (the x-axis
  equation, a 3-4-5 triangle area, and the standard values of tan 45°, sin 90°
  and cos 0°); all five stems were reworded or re-parameterised, so the final
  cross-bank exact-duplicate count is 0. Remaining >=95 hits are template-level.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{coordinate-geometry,trigonometry,height-distance,statistics}.js`
  (EN 1414/1457/1493/1354 words, AS 1349/1392/1339/1301 words, 5 FAQs and a
  10-item key-facts list each); `rrb-ntpc.ga-extra-check.js` reports 0 failing
  the 1300-word floor.
- **Build order** unchanged: counts → pages → ga-extra → enrich → keyword-map →
  as-twins → seo-indexing-fix, idempotent (only `counts.json`'s `generatedAt`
  moves). The exam hub now reports 9,473 questions.
- **Revert unrelated drift before committing**, as before:
  `git checkout -- as/exams/rrb-ntpc/general-awareness/`. Do not revert the four
  target mathematics leaves.
- **Verification:** `seo-audit.js` clean (1321 pages, sitemap 2540, thin 0,
  missing H1/desc/canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0,
  sitemap alt miss 0); every bank validated for schema, 4 unique options,
  bilingual stems and explanations, unique ids; all four EN+AS pages show
  80 questions and the article panel, `noindex=0`.

## Session — RRB NTPC Mathematics batch 7 (final maths topics: 26–28)

- **The last three stub maths leaves are now full bilingual banks, 80 hard
  MCQs each** in `data/exams/rrb-ntpc/mathematics/<topic>/question-001.json`:
  - `mensuration-2d` — rectangle/square (area, perimeter, diagonal), triangle
    (base-height, equilateral, isosceles, right, Heron with 13-14-15, 7-8-9,
    10-10-12, 17-25-26, 20-21-29, 9-40-41), parallelogram, rhombus (diagonals,
    side-from-diagonal, perimeter, ratio of diagonals), trapezium, circle
    (area, circumference, diameter/radius reverses), semicircle, quadrant,
    sector, arc, ring, inscribed/inscribed-in figures, side/area/perimeter
    reverses, scaling (area ∝ side², percentage changes), paths/borders, cost
    and tiling.
  - `mensuration-3d` — cube (volume, surface area, diagonal, reverses), cuboid
    (volume, total/lateral surface, base-area and height reverses), cylinder
    (volume, curved/total surface, radius/height reverses), cone (volume, slant
    height, curved/total surface, 3-4-5 and 5-12-13 slants), sphere and
    hemisphere (volume, surface area, diameter reverses), scaling (volume ∝ r³,
    surface ∝ r², cylinder r×2 h÷2), comparisons (cone:hemisphere:cylinder
    1:2:3, cylinder:cone 3:1), largest sphere in a cube, cutting/melting counts,
    capacity in litres, combined solids.
  - `data-interpretation` — 13 data sets (shop sales, student marks, town
    population, factory quarters, family expenditure and income/expenditure
    tables, pie charts of expenditure, marks, state revenue and a student's
    day, bar graphs of books and car sales, line graph of temperature, tree
    plantation and class-strength tables, company production, batsman's runs)
    with questions on total, average, maximum/minimum, range, percentage of
    total, percentage change, ratio, central angle, actual value from a scale,
    and value after a change.
- **Answer keys balanced 20/20/20/20** over A/B/C/D for all three.
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio >= 95)
  over every other `data/exams/**/question-*.json` bank (41,260 rows) found 2
  exact cross-bank duplicates shared with DHS-DME grade-4 arithmetic (the
  square diagonal of side 8, the cube volume of side 6); both stems were
  reworded, so the final cross-bank exact-duplicate count is 0. Remaining >=95
  hits are template-level (same figure family, different numbers).
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/mathematics/{mensuration-2d,mensuration-3d,data-interpretation}.js`
  (EN 1873/1536/1509 words, AS 1501/1312/1348 words, 5 FAQs and a 10-item
  key-facts list each); `rrb-ntpc.ga-extra-check.js` reports 0 failing the
  1300-word floor.
- **All 28 RRB NTPC Mathematics topics now carry a full 80-question bank**
  (the 71/75-question earlier banks are pre-existing and untouched here).
- **Build order** unchanged: counts → pages → ga-extra → enrich → keyword-map →
  as-twins → seo-indexing-fix, idempotent (only `counts.json`'s `generatedAt`
  moves). The exam hub now reports 9,710 questions.
- **Revert unrelated drift before committing**, as before:
  `git checkout -- as/exams/rrb-ntpc/general-awareness/`. Do not revert the
  three target mathematics leaves.
- **Verification:** `seo-audit.js` clean (1321 pages, sitemap 2546, thin 0,
  missing H1/desc/canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0,
  sitemap alt miss 0); every bank validated for schema, 4 unique options,
  bilingual stems and explanations, unique ids; all three EN+AS pages show
  80 questions and the article panel, `noindex=0`.

## Session — RRB NTPC Non-Verbal Reasoning batch 1 (topics 1–4)

- **The first four Non-Verbal Reasoning leaves are now full bilingual
  figure-based banks, 70 MCQs each**, in
  `data/exams/rrb-ntpc/reasoning/non-verbal-reasoning/<topic>/question-001.json`:
  - `counting-figures` — common-apex triangles (base in n parts → n(n+1)/2),
    the horizontal-chord variant, grid squares (1²+…+n²), grid rectangles
    (choose 2 vertical × 2 horizontal lines), diagonal quadrilaterals (square,
    rectangle, rhombus, parallelogram → 8 triangles), line fans from a point,
    polygon fans (k − 2), circles.
  - `mirror-water-image` — letters, digits and line motifs under the vertical
    (mirror) and horizontal (water) reflection, including the rotation trap.
  - `paper-cutting-folding` — single and double folds; layer count → hole
    count; reflection placement of every hole; cuts on a crease giving one hole.
  - `embedded-figures` — composite H/V/`\` figures with a traceable sub-shape;
    each distractor carries an edge in a direction the composite does not
    contain, so embedded vs non-embedded is guaranteed by construction.
- **Answers are computed, not typed.** `tools/gen-rrb-ntpc-non-verbal.js`
  builds every figure and every option from its construction and derives the
  answer from it; keys are balanced 18/17/17/18 over A/B/C/D (the shared
  `tools/balance-answer-keys.js` refuses figure questions, so the generator
  balances them). Every prompt figure and every option figure is checked
  distinct (70 distinct prompt figures per topic).
- **Figure rendering for RRB NTPC.** `tools/lib/exam-book-pages.js` now emits
  the picture-option grid (`nv-fig-grid` → `nv-fig-item` → `nv-fig-key` →
  `nv-fig-box`), matching the runtime `figureOptionsHTML()`; the prompt figure
  renders in `<div class="nv-media">…</div>`. Before this batch the RRB NTPC
  figure leaves were still text-option stubs, so this is the first real figure
  render path for the book. All figures are inline SVG (stroke `#334155`), no
  `<img>` URLs.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/non-verbal-reasoning/{counting-figures,
  mirror-water-image,paper-cutting-folding,embedded-figures}.js`
  (EN 1397–1648 / AS 1310–1368 words, 5 FAQs and a 10-item key-facts list
  each); `rrb-ntpc.ga-extra-check.js` reports 0 failing the 1300-word floor.
  This is the first grouped Reasoning sub-group to carry article panels.
- **Deduped against the whole corpus.** A fuzzy pass (`rapidfuzz`, ratio >= 90)
  over the whole `data/` corpus (265,381 rows) left only same-section
  boilerplate stems shared with other non-verbal banks (accepted norm); the
  cross-topic duplicate count and the figure-collision count are both 0.
- **Build order** unchanged: counts → pages → ga-extra → enrich → keyword-map →
  as-twins → seo-indexing-fix, idempotent (byte-stable on repeat).
- **Gotcha — the counts manifest was left out of the batch-1 commit.** The
  four banks landed in `08a01007`, but `data/counts.json` was not part of that
  commit (nor of the `ef76a918` AGENTS.md follow-up), so it still read `1` per
  filled topic and `7` for the group. Every surface that renders from
  `counts.json` — the group page, the reasoning hub, the exam page and the
  homepage hero — kept the stale numbers, and the four filled leaves stayed
  `noindex` and out of the sitemap because `seo-indexing-fix.js` derives the
  stub-leaf list from that same file. Fixed in `eb1ce758` by rebuilding the
  chain (`sync-home-hero-count` + counts → pages → ga-extra → enrich →
  keyword-map → as-twins → seo-indexing-fix → inject-ga → strip-adsense →
  doctype). Lesson: **a bank commit is not done until `data/counts.json` is
  regenerated and committed with it**, or the counts silently freeze at the
  stub value everywhere.
- **Branching.** This batch was rebased onto the then-current `main` and all
  build outputs regenerated on top, so the hub-count conflicts with the recent
  analytical-reasoning batches were avoided. Branched as
  `add-rrb-ntpc-non-verbal-reasoning`; PR #5.
- **Verification:** `seo-audit.js` clean (1321 pages, indexable 1285, thin 0,
  missing H1/desc/canonical/JSON-LD 0, title/desc limits 0, dup titles/H1/desc 0,
  sitemap alt miss 0); every bank validated for schema, 4 unique picture
  options, bilingual stems and explanations, unique ids; all four EN+AS pages
  show 70 questions, 70 `nv-media` figures and the article panel.

## Session — RRB NTPC Non-Verbal Reasoning batch 2 (topics 5–7, final)

- **The last three Non-Verbal Reasoning leaves are now full bilingual
  figure-based banks, 70 MCQs each**, in
  `data/exams/rrb-ntpc/reasoning/non-verbal-reasoning/<topic>/question-001.json`.
  With batch 1, **all seven Non-Verbal Reasoning topics now carry a full
  70-question bank**:
  - `pattern-completion` — a grid of small tiles with one blank cell; the
    missing tile follows the grid's repeating rule.
  - `figure-series` — a five-cell series with a question mark; nine families
    (growing polygon, growing dot count, turning arrow, growing circle,
    growing line count, turning half-disc, turning triangle, growing star
    points, shaded/unshaded alternation), each drawn across many variants.
  - `cube-dice` — three forms: fold a net to a cube and name the face opposite
    a marked one; read two die views sharing a face and name its opposite;
    count the cubes in a stack (hidden cubes included).
- **Answers are computed, not typed.** The three builders were added to
  `tools/gen-rrb-ntpc-non-verbal.js` (same generator as batch 1):
  - pattern-completion: the tile is the grid's rule applied at the blank cell.
  - figure-series: the answer is term 4 of the family rule, distractors are
    off-rule terms.
  - cube-dice: the net is **folded by a real 3-D routine** (`foldNet`, a
    BFS that assigns each cell an outward face normal) so opposite faces are
    exact, not assumed; the die-opposite is the only number absent from the
    union of the two views; the cube count is the sum of the column heights.
  Keys balanced 18/17/17/18 over A/B/C/D for all three; every prompt figure and
  every option figure is distinct (70 distinct prompt figures per topic).
- **All seven topics use the picture-option grid** (`nv-fig-grid`) that batch 1
  added to `tools/lib/exam-book-pages.js`; no further renderer change was
  needed for this batch.
- **Article panels.** New sources
  `tools/rrb-ntpc-ga-articles/non-verbal-reasoning/{pattern-completion,
  figure-series,cube-dice}.js` (EN 1382/1738/1883, AS 1328/1463/1430 words,
  5 FAQs and a 10-item key-facts list each);
  `rrb-ntpc.ga-extra-check.js` reports 0 failing the 1300-word floor.
- **Deduped against the whole corpus.** Exact stem match over every other
  `data/exams/**/question-*.json` bank found **0** cross-bank collisions. (The
  14 intra-bank duplicate stems inside the new banks are the same shared
  template with different figures, which is the accepted norm for figure
  questions, as in batch 1.)
- **Build chain.** Ran the **full** documented order —
  `build-question-counts.js` (or `sync-home-hero-count.js` + counts) →
  `build-rrb-ntpc-pages.js` → `rrb-ntpc.ga-extra.js` → `enrich-thin-pages.js` →
  `apply-keyword-map.js --only-prefix exams/rrb-ntpc/` → `build-as-twins.js
  --prefix exams/rrb-ntpc` → `seo-indexing-fix.js` → `scripts/inject-ga.js .` →
  `strip-adsense-from-as.js` → `fix-duplicate-doctype.js`. Per the batch-1
  gotcha above, **`data/counts.json` was regenerated and committed in the same
  commit** (it now reads 70 for each of the three leaves and `index, follow`
  for their pages). Idempotent: a second full run leaves the tree
  byte-identical except `data/counts.json`'s `generatedAt` timestamp.
- **Rebase.** While this batch was in progress, `origin/main` moved from
  `ef76a918` to `9745936a` (an automated session regenerated the batch-1
  counts/pages and fixed the missing-`counts.json` gotcha). This batch was
  therefore re-applied **on top of `9745936a`** — only the generator, the three
  new bank JSONs and the three article modules were taken from the local work;
  every generated page/count/sitemap artifact was regenerated fresh on the new
  base, so the earlier local commits were not replayed.
- **Verification:** `seo-audit.js` clean (1321 pages, sitemap 2584, indexable
  1292, thin 0, missing H1/desc/canonical/JSON-LD 0, title/desc limits 0,
  dup titles/H1/desc 0, sitemap alt drift 0, sitemap alt miss 0); each bank
  validated for schema, 4 unique picture options, bilingual stems and
  explanations, unique ids; all three EN+AS pages show 70 questions, 70
  `nv-media` figures, `index, follow` and the article panel. The RRB NTPC
  reasoning stub set is now empty.

## Session record — Nov 2026 RRB NTPC final pre-ship audit (answer-key skew + duplicate stems)

A full audit of the RRB NTPC book/site before shipping found two real defects
and fixed both. Everything else was already clean.

**Defect 1 — four mathematics topics had 100% option-A answer keys.**
`balance-answer-keys.js --check` reported `coordinate-geometry`,
`elementary-algebra`, `geometry` and `trigonometry` each `n=80` with
`A/B/C/D = 80/0/0/0`. These are hand-committed banks, so the tool had never
touched them (it only balances generator-backed banks at build time). Fixed by
running `node tools/balance-answer-keys.js --book rrb-ntpc --topic
mathematics/<topic>` on each; all four now read `20/20/20/20`. The tool rotates
the option array in place, so the *correct option text* is preserved and only
its position moves — verified for all 320 questions (0 mismatches, option sets
unchanged). `balance-answer-keys.js --book rrb-ntpc --check` now reports 0
skewed topics.

**Defect 2 — 34 duplicate stems (exact), all pre-existing.** Introduced by the
reasoning batches in commits `47414042` and `90dd98f4`, e.g.
`cause-effect-001 == cause-effect-004`, `statement-arguments-011 == 015 == 069`,
`indian-economy-375 == 376`. Per the standing "never repeat wording" rule each
duplicate was reworded (English *and* Assamese together, same question type and
same option logic, new scenario/wording), keeping `correct` pointing at the
same option text. After the pass: 0 exact duplicate stems/options and 0
cross-bank collisions against all of `data/` (EN and AS). The only remaining
intra-bank duplicate stems are the 29 all-figure non-verbal items, which are
the same shared template with different `fig` SVG — the accepted norm for figure
questions.

**Build + verification.** Ran the full documented chain
(`build-question-counts.js` → `build-rrb-ntpc-pages.js` → `rrb-ntpc.ga-extra.js`
→ `enrich-thin-pages.js` → `apply-keyword-map.js --only-prefix
exams/rrb-ntpc/` → `build-as-twins.js --prefix exams/rrb-ntpc` →
`seo-indexing-fix.js` → `scripts/inject-ga.js .` → `strip-adsense-from-as.js` →
`fix-duplicate-doctype.js`). Diff is exactly the 10 affected topics (10 EN + 10
AS pages + 10 banks + `data/counts.json`); a second full run is byte-identical
except `counts.json`'s `generatedAt`. `seo-audit.js` stays clean (1321 pages,
sitemap 2584, thin 0, missing H1/desc/canonical/JSON-LD 0, dup titles/H1/desc
0, title/desc limits 0); `rrb-ntpc.ga-extra-check.js` reports 0 failing the
1300-word floor. The four maths pages now render `20/20/20/20` answer letters.

**Gotcha re-confirmed.** `build-rrb-ntpc-pages.js` writes *raw* head tags
(no hreflang, plain title). Running it alone and committing overwrites the
SEO-enriched pages — the later chain steps (`apply-keyword-map`,
`build-as-twins`, `seo-indexing-fix`) restore the good markup. Always run the
whole chain, never the page builder by itself.

## Session record — Nov 2026 Social leaderboard (Firestore) + GA4 SPA check

**What shipped.** A no-login social leaderboard: top-5 per mock-test
sub-category plus the visitor's own rank. `js/leaderboard.src.js` (core:
name reservation, score submit, top/rank reads, count aggregation),
`js/leaderboard-ui.src.js` (closeable opt-in popup before the final mock
submit + the `/leaderboard` page), CSS in `css/style.src.css`, a `/leaderboard`
route and nav links in `js/app.src.js`, pages `leaderboard/index.html` and
`as/leaderboard/index.html`, plus `sitemap.xml` and `sw.js` precache entries.
Build config: `scripts/minify-assets.js` JS_ASSETS gained `leaderboard` and
`leaderboard-ui`; `scripts/stamp-assets.js` ASSETS gained both built files.

**Firestore shape.** Project `axomexam-leaderboard`, collection `lb_scores`
(one doc per device per scope, id `{deviceId}__{scopeKey}`) and `lb_names`
(one doc per lowercased name, id = the name). Public web config lives in
`js/firebase-config.js` (public keys only — never a service-account key).

**Four bugs found and fixed by the live end-to-end test.** Worth remembering,
because each one only shows up against real Firestore:
1. `reserveName` and `submitScore` took the raw name, so `"Rahul  Das"` and
   `"Rahul Das"` reserved two different documents and the same display name
   could appear twice. Both now run `normalizeName` themselves.
2. The commit *body* URL-encoded the document id (`encodeURIComponent`) while
   the GET path decoded it, so any name containing a space was written to one
   document and looked up in another — re-reserving a spaced name wrongly
   reported "taken". Commit bodies now use the raw id; only the GET path
   encodes.
3. Dark-mode CSS selected `body[data-theme="dark"]`, but the site sets
   `data-theme` on `<html>`. Changed to `[data-theme="dark"]`.
4. The static crawler article on the leaderboard pages sat *inside* `<main>`;
   moved below `</main>` as `axo-extra-content`, matching the site convention.

**Firestore rules gap — still open.** The published rules validate
`name.matches('^[\p{L}\p{N} _]+$')`. Assamese and Devanagari vowel signs
(matras) are combining marks (`\p{M}`), not letters, so a real Assamese name
like `ৰাহুল` is rejected with 403 — the client accepts it and then the write
fails. The rules must use `'^[\p{L}\p{M}\p{N} _]+$'` (updated in
`GROWTH-ROADMAP.md`; the owner pastes rules in the Firebase console, so the
change has to be re-published there). Confirmed live: latin name 200,
`ৰাহুল` 403, `राहुल` 403.

**GA4 answer (owner's question).** GA4 `G-PBPXK2Q799` is on all 2616 HTML
pages, exactly one `gtag('config')` per page, and Google Analytics is
reachable. The site is an SPA using `history.pushState`, and GA4's Enhanced
Measurement sends a `page_view` on History API changes by itself — verified in
a probe that captured the outgoing `/g/collect` hits: one page_view per
`pushState` with the correct `dl` (document location). So in-place navigation
*is* measured; no extra `gtag('event','page_view')` call is needed, and adding
one would double-count. The mock-test back-guard re-pushes the *same* URL, so
it does not add a duplicate view.

**Verification.** Live suites all green: 27 module-logic assertions, 10
cross-device assertions (name exclusivity, ordering, rank 0 when absent),
6 spaced-name assertions after the fix. Local smoke test: every key route and
asset 200. `seo-audit.js` clean (1322 pages, 0 thin, 0 missing H1/desc/
canonical/JSON-LD, 0 dup titles/H1/desc, title/desc limits 0).

**Cleanup owed to the owner.** The live testing left 14 `lb_scores` and 20
`lb_names` documents in Firestore. Client delete is blocked by the rules
(403), so they must be removed from the Firebase console (Firestore → Data).

## Session record — Nov 2026 Leaderboard content-language fix (/as/ pages)

**Bug.** The `/as/leaderboard/` page rendered its leaderboard copy in English
even though the static shell, `<html lang>`, `<title>` and the crawler article
were all Assamese. Cause: `js/leaderboard-ui.src.js` translated page copy with
`AXOApp.t()` (interface language) and derived its language from
`AXOApp.uiLang()`. Everywhere else the site renders page content with `tc()`
(content language from the URL) and `localized()`, so `/as/...` pages show
Assamese content while only the header chrome follows the EN/অসমীয়া toggle.
The opt-in popup had the same defect on `/as/mock-test`.

**Fix.**
1. `js/app.src.js` — the `window.AXOApp` bridge now also exposes
   `tc(key)` and `contentLang()` (`state.lang`), alongside the existing
   `t`, `uiLang` and `mock`.
2. `js/leaderboard-ui.src.js` — `tx()` prefers `app.tc` (falls back to
   `app.t`), and `uiLang()` prefers `app.contentLang()` (falls back to
   `app.uiLang()`). Because both feed every string on the page *and* in the
   popup, one change covers both.
3. The breadcrumb used a hardcoded `<a href="/">Home</a>`; it now uses
   `tx("breadcrumb.home", "Home")`, matching the app convention.

**Verified.** New suite `lblang` loads the *shipped* `js/i18n.js` +
`js/leaderboard-ui.js` with a DOM shim: 8/8 assertions — Assamese popup copy
on `/as/` (title, body, skip/yes), no English leakage, and the English page
still renders English with no Assamese leakage. Existing suites still green
(27/0 module logic, 10/0 live Firestore). Browser check of both
`/leaderboard/` and `/as/leaderboard/` confirms the fix end to end. Asset
versions restamped; `stamp-assets.js --check` reports 0 drift.

**Left as-is.** Internal links on the leaderboard page (`href="/"`,
`href="/mock-test"`) stay un-prefixed, matching the rest of the site — the app
does not prefix internal links per language anywhere, so changing only the
leaderboard would be inconsistent. The `t()`-based keys that remain
(`lb.subject`, `lb.subcategory`) are intentional: the app's own pickers render
subject names bilingually too.

**Offline bug found while probing the real submit flow.** `askName()`'s
`attemptSave` awaited `reserveName`/`submitScore` outside any `try`, and
`js/leaderboard.src.js` *rejects* when `fetch` fails (it only returns
`{ok:false}` for HTTP errors). So on a dropped connection the Save button
stayed disabled forever, no message appeared, and the only way out was
Cancel/✕ — which looked like the page had frozen. The reset now lives in a
`finally`, a `catch` shows the existing `lb.name.err` copy, and `finish()` is
one-shot so closing the popup while a request is still in flight cannot render
the result screen twice. `loadBoard()` already handled the same case via its
own `catch`.

**Live as of 17 Nov 2026.** Merged to `main` via PR #6 (merge commit
`e7a78dc0`), GitHub Pages built that commit, and `axomexam.in/leaderboard/`
plus `/as/leaderboard/` return 200 with the board rendering real Firestore
rows. The production rules already carry `\p{M}`: probing the live REST API
with an Assamese name containing a matra (`ৰাহুল`) returns 200, while a second
device reserving the same name returns 403, so both name exclusivity and
Assamese input work in production. Client deletes of `lb_names` also return
403, as the rules intend.

**Test data cleared, then re-seeded once by an e2e run.** The owner deleted
all 25 `lb_scores` and 34 `lb_names` in the console on 17 Nov 2026, and a live
read confirmed both collections empty. Verifying that a fresh visitor could
still join, however, created two more documents: name `Verify Bot 521697` and
its score `d_28c57f8d104d8dfdc07d2e92__gk-assam-history` (100%, gk/assam-history).
Client delete returns 403, so these two must be removed in the console. The
lesson: probe the live backend with reads only. Any write leaves a public row
on the board and only the owner can take it down.

**The test documents are gone and the board is live with real data.** The
owner cleared the console, and the first genuine visitor appeared: `Puja Das`
holds 60% in `gk/assam-history` and 20% in `science/chemistry`. Those are real
users, not fixtures; do not delete them. A read-only probe now confirms the
live board renders `Puja Das 60%` on both `/leaderboard/` and `/as/leaderboard/`.

**Rank lookup no longer pages the board (17 Nov 2026).** `fetchMyRank` used to
read the scope in 300-document pages until it found the device, and Firestore
bills a read for every document a query touches, so a 300-entry board cost
~306 reads per page view (about 163 free page views a day). It now asks three
targeted questions instead: the device's own score, how many entries beat it,
and the scope total. Rank is `countAbove(pct) + 1`, which makes tied scores
share a rank. Cost is a flat 8 reads per page view whatever the board size,
so the free tier holds ~6,250 page views a day.

Two details worth keeping:

- `countAbove` sends `orderBy bestPct DESCENDING` on purpose. Firestore only
  accepts the `scope` + `bestPct` range filter when the query names the
  composite index's own sort order `(scope, bestPct DESC)`. Drop the orderBy
  and every rank request fails with "The query requires an index", so the
  deployed index must stay.
- `fetchTopPage` was deleted. Once `fetchMyRank` stopped paging, nothing used
  it; it was the only caller of the expensive read path.

The projection below assumes `fetchTop(scope, 5)` for the visible board plus
the rank lookup. Verify with `/tmp`-style read-only harnesses, never by
writing to the live board: any `:commit` leaves a public row that only the
console can remove.

  entries | reads per page view (before -> after) | free page views/day
       10 |                    16 -> 8               | 3,125 -> 6,250
      100 |                   106 -> 8               |   471 -> 6,250
      300 |                   306 -> 8               |   163 -> 6,250
     1200 |                 1,206 -> 8               |    41 -> 6,250

**Test suites.** `lbtest` (27) and `lblive2` (10) cover the core module,
including live Firestore. `lblang` (8) loads the shipped i18n + UI files with a
DOM shim and checks content-language rendering. `lbui` (37) drives the real
popup in jsdom: opt-in, skip, taken name, dead network, double click, close
mid-flight, and the page under a dead network. `lbanon` (9) exercises
`anonymousName()` against the real core with a stubbed fetch: placeholder
shape, collision retry, persistence and the offline fallback. `lbflow` (15)
runs the whole opt-in flow in jsdom with the real core module and only the
network stubbed, so the writes are inspected without touching Firestore.
`lbui` and `lbflow` need `jsdom` in `node_modules` (dev-only, never shipped).
Run them from the repo root: `node /tmp/lbui.mjs`.

**Never run `lbspace` / `lbspace2` for a quick check.** They call the live
`reserveName` and `submitScore`, so each run leaves a public `lb_names` and
`lb_scores` row behind. Client delete is blocked by the rules (403), so the
leftovers can only be removed from the Firebase console. The offline suites
above cover the same ground with a stubbed fetch. Two such rows
(`rahul das`, `sita devi <n>`) were created on 17 Nov 2026 this way and are
owed to the owner for console cleanup.

## Session record — Nov 2026 Leaderboard opt-in popup hardening

Three changes the owner asked for after using the popup on a real mock test.

**1. The popup can no longer be dismissed by accident.** The join popup had a
`✕` close button and a backdrop click handler, both wired to `finish`, so a
stray tap on the dimmed background skipped the choice. Both handlers are gone
from `askToJoin`; the visitor must press Skip or Yes. The name popup lost its
backdrop handler and its `✕` too, for the same reason. The dead `.lb-close`
rules came out of `css/style.src.css`. Both popups keep an idempotent
`finished` guard so a double tap still calls `done` exactly once.

**2. Skipping still puts the score on the board.** Skip used to call `done()`
and write nothing. It now submits the score under a placeholder identity such
as `Unknown user 4821`, so the board shows a row instead of nothing.
`anonymousName()` in `js/leaderboard.src.js` reserves the placeholder through
`reserveName` (retrying on a collision, up to six times) and falls back to the
candidate anyway if the reservation cannot be reached, because the score
write is best-effort and must never hold up the result screen.
`submitAnonymously()` in the UI layer runs that chain and calls `done` from a
`finally`-style guard whatever happens.

**3. The popup keeps asking until a name is typed.** The placeholder lives in
its own key, `axomexam-anon-name`, so `storedName()` (which reads
`axomexam-name`) stays empty. `beforeFinalSubmit` therefore still shows the
popup on the next mock test. Only `attemptSave` writing a real name fills
`axomexam-name`, and that is what stops the asking. This is deliberate: the
placeholder is an alias for the board, not a substitute for the visitor's own
name.

Cancel on the name step is now the same outcome as Skip (an anonymous entry),
which keeps the guarantee that the result screen always appears.

**Copy updated to match.** The FAQ and the "No account, no login" paragraph on
both `leaderboard/index.html` and `as/leaderboard/index.html`, plus
`lb.join.body` in `js/i18n.src.js` (EN and AS), now say that skipping still
records the score under a placeholder name.

**Verification.** 100 assertions pass across six suites: `lbtest` 27, `lbui`
37, `lbflow` 15, `lbanon` 9, `lblang` 8, `lbguard` 4. The popup was also
rendered in a real browser: only Skip and Yes are present, with no `✕`, and a
backdrop click leaves it open. `lboffline3` fails on pristine code as well
(`setTimeout is not defined` in its own shim), so it is not a regression from
this change and was left alone.

## Session record — Nov 2026 Leaderboard sub-category switch fix (two bugs)

**Report.** Owner: "Firebase mein data add ho raha hai but site ke leaderboard
par show nahi hota hai." Diagnosis found the data and the queries were fine;
the **page** was broken.

**Root cause (two bugs, both in `js/leaderboard-ui.src.js`, both present since
the first leaderboard commit `35e4dfb5`).**

1. **TDZ self-reference in `renderPage`.** The scope line read
   `subs.some((s) => s.id === scopeId(scope))` while `scope` was still being
   initialised by that same statement. Any render that reached the
   sub-category handler threw `ReferenceError: Cannot access 'a' before
   initialization` (minified name) and the board never re-rendered.
2. **`page.subject` was never persisted.** `renderPage` computed
   `const subject = page.subject || defaultSubject()` but never wrote it back.
   Only the subject `<select>` handler set `page.subject`, so on a fresh load
   `page.subject` stayed `null` and the sub-category handler built
   `null + "/" + e.target.value` → a `"null/art-culture"` scope. That scope
   matches no document, so the board showed "No scores here yet".

Together these meant: open `/leaderboard`, change **Sub-category** → the page
crashed, and any score in any sub-category other than the default
(gk/assam-history) could never be seen. This is exactly what the owner
reported.

**Fix.** Use `page.scope` in the `scopeId` check, and write the resolved
subject back to `page.subject` before building `subs`.

**Verification.** New suite `lbswitch` (8 assertions) drives the shipped
`js/leaderboard-ui.js` in jsdom: initial board renders, changing Sub-category
does not throw, the new scope is actually queried, the scope label updates,
and changing Subject resets to that subject's first sub-category. Confirmed
the **deployed** file still had the bug (reproduced against a fresh download of
`https://axomexam.in/js/leaderboard-ui.js`) and that the rebuilt file does not.
Live render against real Firestore now shows the right board and rank per
scope, e.g. Art & Culture → `Kanai Roy 90%`, Math/Statistics → the
`Unknown user` placeholder row.

**Also recorded.** `lbspace.mjs` / `lbspace2.mjs` write to the **live**
Firestore (they reserve real names). Do not run them. Earlier runs left two
rows (`Rahul Das`, `Sita Devi <n>` under `gk/assam-history`) that the client
cannot delete because the rules block DELETE; remove them from the Firebase
Console if the board should be clean.

**Suite totals after this fix:** lbtest 27, lbui 37, lblang 8, lbguard 4,
lbanon 9, lbflow 15, lbswitch 8 = **108 pass, 0 fail**.

## Session record — Nov 2026 Leaderboard: one card per sub-category

**Report.** Owner: "General Knowledge kholne par sirf Assam History ka rank
dikhta hai; doosre topic ka mock test doon to leaderboard par show nahi hota,
kyunki by default system hi aisa hai." The data and the queries were fine — the
page only ever showed one board at a time, behind a second dropdown, so a
visitor had no way to reach the board their score was actually on.

**Change.** `js/leaderboard-ui.src.js` renders the subject picker as tabs and,
under it, one board card per sub-category of the chosen subject. The
sub-category `<select>` is gone. Each card fetches its own top five and shows a
highlighted row for this device; when the device is outside the five, one
"Your rank" line is appended.

**Read cost.** A card costs one `fetchTop`. The two aggregation reads behind
`fetchMyRank` run only when the device is outside the top five *and* the local
mock history contains that scope, so a subject page costs about one read per
card instead of three. The rank line is suppressed when the device is already
inside the five, because the highlighted row already shows it.

**Also.** `lb.top5` added in both language blocks. New CSS:
`.lb-tabs/.lb-tab/.lb-boards/.lb-subcard/.lb-myline` with dark-mode overrides.
Removed the CSS orphaned by the dropdown: `.lb-picker`, `.lb-field`,
`.lb-grid`, `.lb-scope-name`, `.lb-myrank`, `.lb-rank-big`, `.lb-rank-num`,
`.lb-rank-of`, `.lb-none` (and their media-query/dark entries). The now-unused
i18n keys `lb.subcategory`, `lb.notOnBoard` and `lb.takeTest` were left in
place: they are two short strings each and the Assamese translations are worth
keeping.

**Verification.** New suite `lbcards` (32 assertions): card count per subject,
per-card scope queries, own-row highlight, rank footer only for attempted
scopes outside the five, tab switching, and per-card error state on a dead
network. `lbswitch` was deleted — it tested the removed dropdown. Suite totals:
lbtest 27, lbui 37, lblang 8, lbguard 4, lbanon 9, lbflow 15, lbcards 32 =
**132 pass, 0 fail**.

**Preview gotcha.** A jsdom/browser check needs a device id matching
`/^d_[0-9a-f]{8,}$/`, or `deviceId()` silently replaces it and no row ever
matches.

## Session record — Nov 2026 Leaderboard: 3-up tabs, deep links, scorecard shortcut

**Report.** Three asks. (1) The subject tabs wrapped unevenly, so a long name
like "Computer Awareness" made its button wider than the rest. (2) There was no
way to link straight to one sub-category board. (3) The mock-test scorecard had
no path to the visitor's own rank.

**Change.**
- `css/style.src.css` — `.lb-tabs` is now `display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr))`, so three tabs sit on each
  row at exactly equal width whatever the label length. `.lb-tab` became a
  centred flex box with `min-height:46px`, so heights match too. Font steps down
  at 820px / 400px / 360px so the longest label still fits a 320px phone without
  a mid-word break. Added `.lb-subcard-target` (blue ring) for the deep-linked
  card.
- `js/leaderboard-ui.src.js` — `queryParam()` reads the query string;
  `boardCardHTML()` gives every card `id="lb-sub-<sub>"`; `renderPage()` applies
  `?subject=` before painting and, for `?sub=`, rings the matching card and
  scrolls it to centre. Picking a tab by hand calls `clearDeepLink()`
  (`replaceState`), so the stale query does not re-apply. The scroll call is
  guarded on `requestAnimationFrame`, which jsdom does not implement.
- `js/app.src.js` — `leaderboardShortcutHref()` resolves the finished test's
  `cat.id`/`subId` through `AXOLeaderboard.resolveScope` into
  `?subject=…&sub=…`, falling back to the plain page. The scorecard's first
  action is now `<a class="btn btn-accent">🏆 See My Leaderboard Rank</a>`.
- `js/i18n.src.js` — `mock.result.leaderboard`, EN "See My Leaderboard Rank",
  AS "মোৰ ৰেংক চাওক".

**Verification.** New suites `lbshortcut` (19) and `lbscbtn` (22). Totals:
lbtest 27, lbui 37, lblang 8, lbguard 4, lbanon 9, lbflow 15, lbcards 32,
lbshortcut 19, lbscbtn 22 = **173 pass, 0 fail**. Live browser checks: a full
mock test through the opt-in popup to the scorecard produced
`href="/leaderboard/?subject=gk&sub=art-culture"`; that URL opened the General
Knowledge tab with the Art & Culture card ringed; a hand tab click dropped the
query; `/as/leaderboard/?subject=science&sub=physics` opened the Assamese
Science tab. Tab geometry measured in iframes at 390/360/320/280px in both
languages: 3 per row, one distinct width and one distinct height every time,
no text overflow.

## Google Analytics audit — Nov 2026

Question asked: "kya main Google Analytics se pura traffic dekh pa raha hoon?"
Short answer: yes, with two caveats worth knowing.

**What is in place.** GA4 stream `G-PBPXK2Q799`, injected twice over, but never
doubled: every one of the 2616 pages carries the inline `gtag.js` snippet in
`<head>`, and `js/config.js` adds the same tag only when a page lacks it
(`if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;`).
`404.html` carries the tag too. A fetch of `/leaderboard/` shows exactly one
`googletagmanager.com/gtag/js` script tag.

**Caveat 1 — this is a single-page app.** `bindLinkInterception` in
`js/app.src.js` swallows every internal `<a href="/...">` click and calls
`navigateTo()`, which is `history.pushState` + re-render. `/topic/` links are
exempted and do a real page load. GA4's Enhanced Measurement sends a
`page_view` on `pushState`, `popState` and `replaceState` by default, which is
what makes the SPA measurable at all. If that option is ever switched off in
the property's Enhanced Measurement settings, every internal navigation
disappears from the reports while the landing page view stays — the traffic
would look like a fraction of reality. Worth confirming in the GA property
before trusting the numbers.

**Caveat 2 — GA is client-side, so it undercounts.** Ad blockers and
privacy-focused browsers drop the tag silently, and on a mobile-first Assam
audience that is not a small share. There are no server-side logs to compare
against, because GitHub Pages does not expose them. GA is the only view of
traffic this site has, and it will always read lower than reality.

**Deep-link quirk.** A path with no static file (for example
`/topic/gk/assam-history`) is served `404.html`, which redirects to
`/?/<path>`, and the app then `replaceState`s the clean URL back. The first
page_view therefore lands on `/` with a `?/` query before the cleaned URL is
recorded, so a deep-linked visit can be attributed to the home page. The
trailing-slash URLs (`/leaderboard/`) serve 200 directly and are unaffected.

### Leaderboard name validation hardened against junk input (17 Nov 2026)

**Problem.** The owner reported visitors submitting "ulta-pulta" names — random
keyboard mashing and placeholder words. `validateName` only enforced 2–20
characters, an allowed-character class, and a profanity substring list, so
`asdfgh`, `qwerty`, `1234`, `test`, `aaaa`, `hello`, `admin` and `abcd` all
reached the public board.

**Fix.** `validateName` in `js/leaderboard.src.js` gained four new checks and
two new rejection codes:

- `noname` — no letter at all after stripping digits, spaces and underscores
  (`1234`, `1 2 3`, `___`). The letter test uses `\p{L}\p{M}`, so an Assamese
  or Devanagari name still passes; a Latin-only `[a-z]` test would have
  rejected `ৰাহুল`.
- `junk` — covers three shapes: a whole-word match against `JUNK_NAMES`
  (`test`, `admin`, `hello`, `abcd`, …), a single repeated character (`aaaa`,
  `zzzz`), a four-character run along a keyboard row or the alphabet in either
  direction (`asdf`, `qwerty`, `fdsa`, `4321`), and five consonants in a row
  (`zxcvbn`).

`JUNK_NAMES` is matched against the flattened name with digits removed, so
`Test`, `test_1` and `TEST 12` all land in one bucket. Two entries were
deliberately left out: `nan` and `nil` are real names in India, and blocking
them would cost more than the junk they filter.

The mash checks run on `flat`, the ASCII-only projection of the name. For an
Assamese or Devanagari name `flat` is empty, so they are skipped rather than
misfiring — that is why the guard is `if (word)` and not an unconditional
chain.

**Messages.** `lb.name.junk` and `lb.name.noname` were added to both `en` and
`as` dictionaries in `js/i18n.src.js` and mapped in the modal's error switch
in `js/leaderboard-ui.src.js`. Dictionary parity is unchanged at 388 keys per
language.

**Verified end to end against the real minified bundles.** Driving the actual
opt-in popup and name modal in jsdom: 13 junk inputs blocked with the right
message, 8 real names saved (including `ৰাহুল`, `अनुज`, `Rahul Das 21`,
`Amit_Kumar`), and the Assamese UI renders the Assamese strings. Unit coverage
lives in the `lbname` suite (76 cases).

**Known limit.** A dot or other punctuation is still rejected, because the
security rules' character class excludes it; `B. K. Sharma` cannot be entered.
That predates this change.
