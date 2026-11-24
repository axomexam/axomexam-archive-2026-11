#!/usr/bin/env node
"use strict";

/*
 * tools/add-book-details.js
 *
 * Writes the "Book details" card into every "Your Exams" book page
 * (exams/<id>/index.html and its /as/ twin), at the top of the page: right
 * under the book hero and above the subject cards.
 *
 * This is the crawler copy. js/app.src.js renders the same card from the same
 * data (examBookDetailsHTML) and replaces <main id="app"> on load, so this
 * block is what Googlebot sees with JavaScript off and the runtime card is
 * what the reader sees — identical markup, identical numbers.
 *
 * Every fact comes from data/exams/index.json: exam.book carries the code,
 * the recruiting body, its verified portal and the published / last-updated
 * dates; the subject and chapter counts are the leaf nodes of that exam's
 * section tree (the same tree the subject cards are built from), and the
 * question count is data/counts.json -> examSectionCounts, the manifest the
 * runtime prints in the hero. Nothing is typed in twice.
 *
 * Idempotent: the block is marker-guarded (data-axo-book-details) and is
 * stripped and re-inserted on every run, so a re-run reports 0 changes.
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
const COUNTS = path.join(ROOT, "data", "counts.json");

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
    note: (authority) => `© axomexam.in &middot; Independent study platform &middot; not affiliated with ${authority}.`,
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
    note: (authority) => `© axomexam.in &middot; স্বতন্ত্ৰ অধ্যয়ন মঞ্চ &middot; ${authority}ৰ সৈতে সম্পৰ্ক নাই।`,
  },
};

const MARK_RE =
  /\n?[ \t]*<!-- axo-book-details:start -->[\s\S]*?<!-- axo-book-details:end -->\n?/;
/* The subject-cards section, in either of the two shapes the book builders
   emit: with data-exam-subcats, or the plain 46px-padded grid. */
const ANCHOR_RES = [
  /(\n[ \t]*<section class="section" data-exam-subcats)/,
  /(\n[ \t]*<section class="section" style="padding-bottom:46px;">)/,
];

const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ENT[c]);
const langOf = (obj, key) => (!obj ? "" : typeof obj === "string" ? obj : obj[key] || obj.en || "");

/* Subject sections and chapter leaves for one book, from the same section
   tree the runtime renders its cards from. */
function bookStructure(exam) {
  const countLeaves = (nodes) => (nodes || []).reduce((n, node) => {
    const kids = Array.isArray(node.subcategories) ? node.subcategories : [];
    return n + (kids.length ? countLeaves(kids) : 1);
  }, 0);
  const sections = (exam.sections || []).filter((s) => s.type !== "syllabus");
  return {
    subjects: sections.length,
    chapters: sections.reduce((n, s) => n + countLeaves(s.subcategories), 0),
  };
}

function questionCount(id, manifest) {
  let n = 0;
  for (const [key, value] of Object.entries(manifest || {})) {
    if (key.startsWith(`${id}/`) && key.split("/").length === 2) n += Number(value) || 0;
  }
  return n;
}

function row(label, value) {
  return `          <div><span style="display:block; font-size:.7rem; letter-spacing:.07em; text-transform:uppercase; font-weight:800; color:var(--ink-faint,#94a3b8); margin-bottom:2px;">${label}</span><span style="display:block; font-size:.92rem; font-weight:600; color:var(--ink,#0f172a);">${value}</span></div>`;
}

function block({ id, lang, exam, stats, questions }) {
  const L = LABELS[lang];
  const num = (n) => n.toLocaleString("en-IN");
  const book = exam.book;
  const cover = exam.cover || `/images/exams/${id}-cover.webp`;
  const coverAlt = langOf(exam.coverAlt, lang) || `${langOf(exam.title, lang)} book cover`;
  const title = langOf(exam.title, lang);
  const subtitle = langOf(exam.subtitle, lang);
  const authorityName = langOf(book.authority, lang);

  const authority = book.authorityUrl
    ? `<a href="${book.authorityUrl}" rel="noopener nofollow" target="_blank" style="color:inherit; text-decoration:underline;">${esc(authorityName)}</a>`
    : esc(authorityName);

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
        ? `${num(questions)} টা — উত্তৰ আৰু ব্যাখ্যাৰ সৈতে`
        : `${num(questions)} with answers and explanations`
    ),
    row(L.format, L.formatValue),
    row(L.published, esc(langOf(book.published, lang))),
    row(L.updated, esc(langOf(book.updated, lang))),
  ];

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
        <p style="margin:18px 0 0; padding-top:14px; border-top:1px solid var(--border,#e2e8f0); font-size:.76rem; color:var(--ink-faint,#94a3b8);">${L.note(esc(authorityName))}</p>
      </div>
    </section>
    <!-- axo-book-details:end -->`;
}

function apply(file, html, lang, exam, stats, questions) {
  const card = `\n${block({ id: exam.id, lang, exam, stats, questions })}\n`;
  const stripped = html.replace(MARK_RE, "");

  let anchor = null;
  for (const re of ANCHOR_RES) {
    const m = stripped.match(re);
    if (m && (!anchor || m.index < anchor.index)) anchor = m;
  }
  if (!anchor) return "no-anchor";
  const next = stripped.slice(0, anchor.index) + card + stripped.slice(anchor.index);

  if (next === html) return "unchanged";
  if (!CHECK) fs.writeFileSync(file, next, "utf8");
  return "changed";
}

function main() {
  const index = JSON.parse(fs.readFileSync(EXAMS_INDEX, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(COUNTS, "utf8")).examSectionCounts || {};
  const books = (index.exams || []).filter((e) => e.book && (e.sections || []).length);
  let changed = 0;
  let missingBook = 0;

  for (const exam of books) {
    const stats = bookStructure(exam);
    const questions = questionCount(exam.id, manifest);
    for (const lang of ["en", "as"]) {
      const rel = lang === "as" ? `as/exams/${exam.id}/index.html` : `exams/${exam.id}/index.html`;
      const file = path.join(ROOT, rel);
      if (!fs.existsSync(file)) {
        console.log(`missing   ${rel}`);
        continue;
      }
      const result = apply(file, fs.readFileSync(file, "utf8"), lang, exam, stats, questions);
      if (result === "changed") changed++;
      console.log(
        `${result.padEnd(9)} ${rel}  (${stats.subjects} subjects, ${stats.chapters} chapters, ${questions} questions)`
      );
    }
  }

  for (const exam of index.exams || []) {
    if ((exam.sections || []).length && !exam.book) {
      missingBook++;
      console.log(`no book   data/exams/index.json -> ${exam.id} has no "book" record`);
    }
  }

  console.log(`\n${CHECK ? "Would change" : "Changed"}: ${changed} page(s)`);
  if (missingBook) console.log(`Missing "book" records: ${missingBook}`);
  if (changed && CHECK) process.exitCode = 1;
}

main();
