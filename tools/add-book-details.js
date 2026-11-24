#!/usr/bin/env node
"use strict";

/*
 * tools/add-book-details.js
 *
 * Adds a "Book details" card to every "Your Exams" book page
 * (exams/<id>/index.html and its /as/ twin), between the subject cards and
 * the editorial credit.
 *
 * The card is a library record for the book: publisher axomexam.in, a
 * per-book code, edition, language, the recruiting body, and the real counts
 * for that book (subject sections and chapter folders from data/exams/<id>/,
 * questions from data/counts.json - the same manifest the runtime prints
 * above it). Published / last updated are copied from the page's own
 * editorial block, so the two can never disagree.
 *
 * The block sits outside <main id="app"> on purpose: js/app.src.js rebuilds
 * that element's innerHTML on load, so anything injected inside it would be
 * wiped in the browser and survive only for crawlers.
 *
 * Idempotent: the block is marker-guarded (data-axo-book-details) and is
 * replaced, not appended, on re-run.
 *
 * Usage:
 *   node tools/add-book-details.js           # apply
 *   node tools/add-book-details.js --check   # report only
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const EXAMS_INDEX = path.join(ROOT, "data", "exams", "index.json");
const EXAM_DATA = path.join(ROOT, "data", "exams");
const COUNTS = path.join(ROOT, "data", "counts.json");

/* Per-book facts that are not derivable from the data tree. `authorityUrl`
   is only set for portals already verified on /sources/ (data/sources.json);
   the rest stay plain text, because an unverified link is worse than none. */
const BOOKS = {
  "adre-grade-3": {
    code: "AXO-ADRE-G3",
    authority: "SLRC Assam",
    authorityUrl: "https://slrcassam.in/",
  },
  "adre-grade-4": {
    code: "AXO-ADRE-G4",
    authority: "SLRC Assam",
    authorityUrl: "https://slrcassam.in/",
  },
  "assam-police": {
    code: "AXO-AP-CONST",
    authority: "SLPRB Assam",
    authorityUrl: "https://slprbassam.in/",
  },
  "assam-police-si": {
    code: "AXO-AP-SI",
    authority: "SLPRB Assam",
    authorityUrl: "https://slprbassam.in/",
  },
  "dhs-dme": { code: "AXO-DHSDME-G3", authority: "DHS & DME Assam" },
  "dhs-dme-grade-4": { code: "AXO-DHSDME-G4", authority: "DHS & DME Assam" },
  "dhs-dme-technical": { code: "AXO-DHSDME-TECH", authority: "DHS & DME Assam" },
  "rrb-ntpc": { code: "AXO-RRB-NTPC", authority: "Railway Recruitment Board" },
};

const LABELS = {
  en: {
    heading: "Book details",
    kicker: "পুথিৰ তথ্য",
    publisher: "Publisher",
    code: "Book code",
    edition: "Edition",
    language: "Language",
    exam: "Exam",
    authority: "Conducted by",
    subjects: "Subjects",
    chapters: "Chapters",
    questions: "Practice questions",
    format: "Format",
    published: "Published",
    updated: "Last updated",
    editionValue: "2026 web edition",
    languageValue: "English &amp; Assamese",
    formatValue: "Free online book",
    publisherUrl: "/about/",
  },
  as: {
    heading: "পুথিৰ তথ্য",
    kicker: "Book details",
    publisher: "প্ৰকাশক",
    code: "পুথি ক'ড",
    edition: "সংস্কৰণ",
    language: "ভাষা",
    exam: "পৰীক্ষা",
    authority: "পৰিচালনা কৰে",
    subjects: "বিষয়",
    chapters: "অধ্যায়",
    questions: "অনুশীলন প্ৰশ্ন",
    format: "প্ৰকাৰ",
    published: "প্ৰকাশিত",
    updated: "শেহতীয়া আপডেট",
    editionValue: "২০২৬ ৱেব সংস্কৰণ",
    languageValue: "ইংৰাজী আৰু অসমীয়া",
    formatValue: "বিনামূলীয়া অনলাইন পুথি",
    publisherUrl: "/as/about/",
  },
};

const MARK_RE =
  /[ \t]*<!-- axo-book-details:start -->[\s\S]*?<!-- axo-book-details:end -->\n/;

const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ENT[c]);
const langOf = (obj, key) => (!obj ? "" : typeof obj === "string" ? obj : obj[key] || obj.en || "");

/* Real counts for one book, straight from its data/ tree. `questions` comes
   from data/counts.json (the manifest the runtime prints in the hero), which
   is deduplicated the same way; the raw file sum is only a fallback. */
function bookStats(id, manifest) {
  const dir = path.join(EXAM_DATA, id);
  let subjects = 0;
  let chapters = 0;
  let raw = 0;

  const countLeaves = (d, isSubjectRoot) => {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      return 0;
    }
    const questionFiles = entries.filter((e) => e.isFile() && /^question-.*\.json$/.test(e.name));
    if (questionFiles.length) {
      chapters += 1;
      for (const f of questionFiles) {
        try {
          const arr = JSON.parse(fs.readFileSync(path.join(d, f.name), "utf8"));
          raw += Array.isArray(arr) ? arr.length : 1;
        } catch (e) {
          raw += 1;
        }
      }
    }
    let found = 0;
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const before = chapters;
      countLeaves(path.join(d, e.name), false);
      if (chapters > before) found += 1;
    }
    if (isSubjectRoot && found) subjects += 1;
    return found;
  };

  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) countLeaves(path.join(dir, e.name), true);
  }

  let questions = 0;
  for (const [key, value] of Object.entries(manifest || {})) {
    if (key.startsWith(`${id}/`) && key.split("/").length === 2) questions += Number(value) || 0;
  }
  return { subjects, chapters, questions: questions || raw };
}

function dateFrom(html, label) {
  const m = html.match(new RegExp(`<strong>${label}:</strong>\\s*([^<]+)<`));
  return m ? m[1].trim() : "";
}

function row(label, value) {
  return `            <div><span style="display:block; font-size:.7rem; letter-spacing:.07em; text-transform:uppercase; font-weight:800; color:var(--ink-faint,#94a3b8); margin-bottom:2px;">${label}</span><span style="display:block; font-size:.92rem; font-weight:600; color:var(--ink,#0f172a);">${value}</span></div>`;
}

function block({ id, lang, exam, stats, dates }) {
  const L = LABELS[lang];
  const num = (n) => n.toLocaleString("en-IN");
  const book = BOOKS[id];
  const cover = exam.cover || `/images/exams/${id}-cover.webp`;
  const coverAlt = langOf(exam.coverAlt, lang) || `${langOf(exam.title, lang)} book cover`;
  const title = langOf(exam.title, lang);
  const subtitle = langOf(exam.subtitle, lang);

  const authority = book.authorityUrl
    ? `<a href="${book.authorityUrl}" rel="noopener nofollow" target="_blank" style="color:inherit; text-decoration:underline;">${esc(book.authority)}</a>`
    : esc(book.authority);

  const rows = [
    row(L.publisher, `<a href="${L.publisherUrl}" style="color:inherit; text-decoration:underline;">axomexam.in</a>`),
    row(L.code, esc(book.code)),
    row(L.edition, L.editionValue),
    row(L.language, L.languageValue),
    row(L.exam, esc(subtitle || title)),
    row(L.authority, authority),
    row(L.subjects, lang === "as" ? `${num(stats.subjects)} টা বিভাগ` : `${num(stats.subjects)} subject sections`),
    row(L.chapters, lang === "as" ? `${num(stats.chapters)} টা অধ্যায়` : `${num(stats.chapters)} chapters`),
    row(
      L.questions,
      lang === "as"
        ? `${num(stats.questions)} টা — উত্তৰ আৰু ব্যাখ্যাৰ সৈতে`
        : `${num(stats.questions)} with answers and explanations`
    ),
    row(L.format, L.formatValue),
  ];
  if (dates.published) rows.push(row(L.published, esc(dates.published)));
  if (dates.updated) rows.push(row(L.updated, esc(dates.updated)));

  const note =
    lang === "as"
      ? `© axomexam.in &middot; স্বতন্ত্ৰ অধ্যয়ন মঞ্চ &middot; ${esc(book.authority)}ৰ সৈতে সম্পৰ্ক নাই।`
      : `© axomexam.in &middot; Independent study platform &middot; not affiliated with ${esc(book.authority)}.`;

  /* Inter has no Assamese glyphs, so every Assamese run needs the site's
     Bengali font or it renders as boxes. On the /as/ page the whole card is
     Assamese, so the font goes on the panel; on the English page only the
     kicker is. */
  const AS_FONT = "font-family:var(--font-as, 'Noto Sans Bengali', sans-serif);";
  const panelFont = lang === "as" ? AS_FONT : "";
  const kickerFont = lang === "as" ? "" : AS_FONT;

  return `    <!-- axo-book-details:start -->
    <section class="section" data-axo-book-details="1" style="padding-top:0; padding-bottom:8px;">
      <div class="info-panel" style="max-width:900px; margin:0 auto; padding:24px;${panelFont}">
        <h2 style="margin:0 0 2px; color:var(--ink,#0f172a);">${L.heading}</h2>
        <p style="margin:0 0 18px; font-size:.84rem; color:var(--ink-muted,#64748b);${kickerFont}">${L.kicker}</p>
        <div style="display:flex; flex-wrap:wrap; gap:22px; align-items:flex-start;">
          <img src="${esc(cover)}" alt="${esc(coverAlt)}" width="160" height="228" loading="lazy" decoding="async" style="flex:0 0 160px; width:160px; max-width:100%; height:auto; border-radius:14px; border:1px solid var(--border,#e2e8f0); box-shadow:0 16px 32px -18px rgba(15,23,42,.5);" />
          <div style="flex:1 1 320px; min-width:220px; display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px 20px;">
${rows.join("\n")}
          </div>
        </div>
        <p style="margin:18px 0 0; padding-top:14px; border-top:1px solid var(--border,#e2e8f0); font-size:.76rem; color:var(--ink-faint,#94a3b8);">${note}</p>
      </div>
    </section>
    <!-- axo-book-details:end -->
`;
}

function apply(file, html, lang, exam, stats) {
  const dates = {
    published: dateFrom(html, lang === "as" ? "প্ৰকাশিত" : "Published"),
    updated: dateFrom(html, lang === "as" ? "শেহতীয়া আপডেট" : "Last updated"),
  };
  const card = block({ id: exam.id, lang, exam, stats, dates });

  if (MARK_RE.test(html)) {
    const next = html.replace(MARK_RE, card);
    if (next === html) return "unchanged";
    if (!CHECK) fs.writeFileSync(file, next, "utf8");
    return "replaced";
  }

  const anchor = /(\n[ \t]*<\/main>\n)/;
  if (!anchor.test(html)) return "no-anchor";
  const next = html.replace(anchor, `$1\n${card}`);
  if (!CHECK) fs.writeFileSync(file, next, "utf8");
  return "added";
}

function main() {
  const index = JSON.parse(fs.readFileSync(EXAMS_INDEX, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(COUNTS, "utf8")).examSectionCounts || {};
  const books = (index.exams || []).filter((e) => BOOKS[e.id]);
  let changed = 0;

  for (const exam of books) {
    const stats = bookStats(exam.id, manifest);
    for (const lang of ["en", "as"]) {
      const rel = lang === "as" ? `as/exams/${exam.id}/index.html` : `exams/${exam.id}/index.html`;
      const file = path.join(ROOT, rel);
      if (!fs.existsSync(file)) {
        console.log(`missing  ${rel}`);
        continue;
      }
      const html = fs.readFileSync(file, "utf8");
      const result = apply(file, html, lang, exam, stats);
      if (result !== "unchanged") changed++;
      console.log(
        `${result.padEnd(9)} ${rel}  (${stats.subjects} subjects, ${stats.chapters} chapters, ${stats.questions} questions)`
      );
    }
  }

  console.log(`\n${CHECK ? "Would change" : "Changed"}: ${changed} page(s)`);
  if (changed && CHECK) process.exitCode = 1;
}

main();
