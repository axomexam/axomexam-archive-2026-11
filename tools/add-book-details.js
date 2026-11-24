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
/* The card lives inside the book hero, so the anchor is that block's own
   closing tag; pages built without a cover hero keep it inside .page-head,
   right under the total-question line. */
const HERO_RE = /<section class="exam-cover-hero"([^>]*)>/;
const HERO_END_RE = /\n[ \t]*<\/section>/;
const TOTAL_RE = /<p class="exam-book-total"[^>]*>[^<]*<\/p>/;
/* The hero's "What you will prepare" label is replaced by the card itself. */
const CHOOSE_RE = /\n[ \t]*<p class="exams-choose">[^<]*<\/p>/;

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

  return `      <!-- axo-book-details:start -->
      <div data-axo-book-details="1" style="flex:1 1 100%; width:100%; margin-top:6px; padding-top:16px; border-top:1px solid var(--border,#e2e8f0); text-align:left;${panelFont}">
        <h2 style="margin:0 0 2px; font-size:1.05rem; color:var(--ink,#0f172a);">${L.heading}</h2>
        <p style="margin:0 0 14px; font-size:.8rem; color:var(--ink-muted,#64748b);${kickerFont}">${L.kicker}</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px 18px;">
${rows.join("\n")}
        </div>
        <p style="margin:14px 0 0; padding-top:12px; border-top:1px solid var(--border,#e2e8f0); font-size:.74rem; color:var(--ink-faint,#94a3b8);">${L.note(esc(authorityName))}</p>
      </div>
      <!-- axo-book-details:end -->`;
}

function apply(file, html, lang, exam, stats, questions) {
  const card = `\n${block({ id: exam.id, lang, exam, stats, questions })}\n`;
  let stripped = html.replace(MARK_RE, "").replace(CHOOSE_RE, "");

  const hero = stripped.match(HERO_RE);
  let at = -1;

  if (hero) {
    /* The hero is a flex row; the details row has to wrap under the cover. */
    if (!/flex-wrap/.test(hero[1])) {
      const tag = hero[1].includes("style=")
        ? hero[0].replace(/style="([^"]*)"/, 'style="$1; flex-wrap:wrap;"')
        : hero[0].replace(/>$/, ' style="flex-wrap:wrap;">');
      stripped = stripped.slice(0, hero.index) + tag + stripped.slice(hero.index + hero[0].length);
    }
    const end = stripped.slice(hero.index).match(HERO_END_RE);
    if (!end) return "no-anchor";
    at = hero.index + end.index;
  } else {
    const total = stripped.match(TOTAL_RE);
    if (!total) return "no-anchor";
    at = total.index + total[0].length;
  }

  const next = stripped.slice(0, at) + card + stripped.slice(at);

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
