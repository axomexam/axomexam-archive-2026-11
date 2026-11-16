#!/usr/bin/env node
"use strict";

/* Reports the rendered word count of every topic article (English and
   Assamese) so the 1300-word floor can be checked before the pages are
   written. Covers the General Awareness articles (rrb-ntpc-ga-articles) and
   the Reasoning articles (rrb-ntpc-reasoning-articles).
   Usage: node tools/rrb-ntpc.ga-extra-check.js */

const fs = require("fs");
const path = require("path");
const { EXAM } = require("./rrb-ntpc.structure.js");

const ROOTS = [
  { dir: "rrb-ntpc-ga-articles", section: "general-awareness", required: true },
  { dir: "rrb-ntpc-reasoning-articles", section: "reasoning", required: false },
];

function words(s) {
  return String(s).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
}

let fail = 0, missing = 0, pending = 0;
for (const { dir, section, required } of ROOTS) {
  const base = path.join(__dirname, dir);
  const sec = EXAM.sections.find((s) => s.id === section);
  for (const g of sec.subcategories) {
    for (const leaf of g.subcategories || []) {
      const f = path.join(base, g.id, leaf.id + ".js");
      /* A leaf with no module yet is only a gate failure where the section is
         meant to be complete; elsewhere it is reported as pending. */
      if (!fs.existsSync(f)) {
        if (required) { console.log(`  MISSING  ${g.id}/${leaf.id}`); missing++; }
        else pending++;
        continue;
      }
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
}
console.log(`\narticles failing the 1300-word floor (either language): ${fail}; missing: ${missing}`);
if (pending) console.log(`articles not yet authored (no module): ${pending}`);
if (fail || missing) process.exitCode = 1;
