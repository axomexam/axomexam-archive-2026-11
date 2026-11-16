#!/usr/bin/env node
"use strict";

/* Reports the rendered word count of every GA article (English and Assamese)
   so the 1300-word floor can be checked before the pages are written.
   Usage: node tools/rrb-ntpc.ga-extra-check.js */

const fs = require("fs");
const path = require("path");
const { EXAM } = require("./rrb-ntpc.structure.js");

const base = path.join(__dirname, "rrb-ntpc-ga-articles");
/* Sections whose leaves carry article panels: General Awareness is grouped,
   Mathematics is flat. Keys are "<section>/<leaf>" for a flat section. */
const SECTION_IDS = ["general-awareness", "mathematics"];

function words(s) {
  return String(s).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
}

/* A leaf only needs an article once its bank stops being a thin stub (>5
   questions), the same threshold tools/seo-indexing-fix.js uses for noindex. */
const STUB_MAX_QUESTIONS = 5;
function bankCount(sectionId, parts) {
  const dir = path.join(__dirname, "..", "data", "exams", "rrb-ntpc", sectionId, ...parts);
  let n = 0;
  let names = [];
  try { names = fs.readdirSync(dir).filter((f) => /^question-\d+\.json$/.test(f)); } catch (e) { return 0; }
  for (const name of names) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      n += Array.isArray(data) ? data.length : 1;
    } catch (e) {}
  }
  return n;
}

let fail = 0, missing = 0;
const leaves = [];
for (const sectionId of SECTION_IDS) {
  const sec = EXAM.sections.find((s) => s.id === sectionId);
  if (!sec) continue;
  for (const g of sec.subcategories) {
    const children = Array.isArray(g.subcategories) ? g.subcategories : [];
    if (children.length) {
      for (const leaf of children) leaves.push({ key: `${g.id}/${leaf.id}`, file: path.join(base, g.id, leaf.id + ".js") });
    } else {
      /* Flat section (Mathematics): only require an article for a filled bank. */
      if (bankCount(sectionId, [g.id]) <= STUB_MAX_QUESTIONS) continue;
      leaves.push({ key: `${sectionId}/${g.id}`, file: path.join(base, sectionId, g.id + ".js") });
    }
  }
}
for (const leaf of leaves) {
  const f = leaf.file;
  if (!fs.existsSync(f)) { console.log(`  MISSING  ${leaf.key}`); missing++; continue; }
  delete require.cache[require.resolve(f)];
  const a = require(f);
  const count = (lang) =>
    words(a.h2[lang]) +
    a.p[lang].reduce((n, t) => n + words(t), 0) +
    a.list[lang].reduce((n, t) => n + words(t), 0) +
    a.faqs.reduce((n, x) => n + words(x.q[lang]) + words(x.a[lang]), 0);
  const en = count("en"), as = count("as");
  const ok = en >= 1300 && as >= 1300;
  if (!ok) fail++;
  console.log(`  ${ok ? "OK  " : "LOW "} ${leaf.key}  en=${en} as=${as} faqs=${a.faqs.length}`);
}
console.log(`\narticles failing the 1300-word floor (either language): ${fail}; missing: ${missing}`);
if (fail || missing) process.exitCode = 1;
