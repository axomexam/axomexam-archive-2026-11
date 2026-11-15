#!/usr/bin/env node
"use strict";

/* Reports the rendered word count of every GA article (English and Assamese)
   so the 1300-word floor can be checked before the pages are written.
   Usage: node tools/rrb-ntpc.ga-extra-check.js */

const fs = require("fs");
const path = require("path");
const { EXAM } = require("./rrb-ntpc.structure.js");

const base = path.join(__dirname, "rrb-ntpc-ga-articles");
const sec = EXAM.sections.find((s) => s.id === "general-awareness");

function words(s) {
  return String(s).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
}

let fail = 0, missing = 0;
for (const g of sec.subcategories) {
  for (const leaf of g.subcategories || []) {
    const f = path.join(base, g.id, leaf.id + ".js");
    if (!fs.existsSync(f)) { console.log(`  MISSING  ${g.id}/${leaf.id}`); missing++; continue; }
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
    console.log(`  ${ok ? "OK  " : "LOW "} ${g.id}/${leaf.id}  en=${en} as=${as} faqs=${a.faqs.length}`);
  }
}
console.log(`\narticles failing the 1300-word floor (either language): ${fail}; missing: ${missing}`);
if (fail || missing) process.exitCode = 1;
