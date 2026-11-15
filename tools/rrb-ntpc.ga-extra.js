#!/usr/bin/env node
"use strict";

/*
 * tools/rrb-ntpc.ga-extra.js
 *
 * Gives every RRB NTPC General Awareness topic page the same long-form
 * bilingual study article the other exam books carry.
 *
 * Why this exists
 * ---------------
 * tools/build-rrb-ntpc-pages.js writes each leaf page with the question list
 * and the editorial credit, but no topic article. The ADRE and Assam Police
 * books instead serve an article in a
 *
 *   <section class="section axo-extra-content" data-axo-extra="1"
 *            data-axo-path="/exams/<exam>/<...>/">
 *
 * block placed after </main>, holding an English panel and an Assamese panel
 * (overview paragraphs + key-facts list + a short FAQ). tools/build-as-twins.js
 * copies that block into the /as/ twin, and tools/fix-faq-schema-visibility.js
 * rebuilds the FAQPage node from its visible FAQ.
 *
 * The prose lives in tools/rrb-ntpc-ga-articles/*.js (one module per GA group).
 * This tool renders it into the page's extra-content block. It only writes the
 * General Awareness leaves of the RRB NTPC book; every other page is left
 * untouched.
 *
 * Idempotent: the block is replaced in place when it already exists, so a
 * second run produces byte-identical output.
 *
 * Usage:
 *   node tools/rrb-ntpc.ga-extra.js          # apply
 *   node tools/rrb-ntpc.ga-extra.js --check  # report drift only
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const EXAM_ID = "rrb-ntpc";
const SECTION_ID = "general-awareness";

/* Articles live one file per leaf under tools/rrb-ntpc-ga-articles/<group>/<leaf>.js,
   each exporting the note shape { h2, p, list, faqs }. Keyed "<group>/<leaf>". */
function loadArticles() {
  const base = path.join(__dirname, "rrb-ntpc-ga-articles");
  const out = {};
  for (const group of fs.readdirSync(base)) {
    const gdir = path.join(base, group);
    if (!fs.statSync(gdir).isDirectory()) continue;
    for (const f of fs.readdirSync(gdir)) {
      if (!f.endsWith(".js")) continue;
      out[`${group}/${f.replace(/\.js$/, "")}`] = require(path.join(gdir, f));
    }
  }
  return out;
}

const ARTICLES = loadArticles();

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const PANEL_OPEN =
  '<article lang="%L" data-axo-lang="%L" class="info-panel" style="background:var(--bg,#ffffff); border:1px solid var(--border,#e2e8f0); border-radius:18px; padding:28px 24px; line-height:1.85; color:var(--ink-soft,#475569); max-width:900px; margin:0 auto; text-align:left;">';

function panel(lang, a) {
  const paras = a.p[lang].map((t) => `<p>${esc(t)}</p>`).join("\n");
  const list = a.list[lang].length
    ? `<h3>${lang === "en" ? "Key facts to remember" : "মনত ৰখাৰ যোগ্য মূল তথ্য"}</h3>\n<ul>${a.list[lang].map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
    : "";
  const faqs = a.faqs
    .map(
      (f) =>
        `<details data-axo-faq="1"><summary>${esc(f.q[lang])}</summary><p style="margin:8px 0 0;">${esc(f.a[lang])}</p></details>`
    )
    .join("");
  const faqHeading = lang === "en" ? "Frequently Asked Questions" : "সততে সোধা প্ৰশ্ন";
  return `${PANEL_OPEN.replace(/%L/g, lang)}
<h2>${esc(a.h2[lang])}</h2>
${paras}
${list}
<h3>${faqHeading}</h3>
${faqs}
</article>`;
}

function sectionHTML(route, a) {
  return `  <section class="section axo-extra-content" data-axo-extra="1" data-axo-path="${route}/" style="padding-bottom:48px;">
    <div class="container">
${panel("en", a)}
${panel("as", a)}
    </div>
  </section>`;
}

const SECTION_RE = /[ \t]*<section class="section axo-extra-content"[\s\S]*?<\/section>\n?/;

function main() {
  const { EXAM } = require("./rrb-ntpc.structure.js");
  const examPath = `exams/${EXAM_ID}`;
  const sec = EXAM.sections.find((s) => s.id === SECTION_ID);
  let written = 0, skipped = 0, missing = 0;

  for (const group of sec.subcategories || []) {
    for (const leaf of group.subcategories || []) {
      const key = `${group.id}/${leaf.id}`;
      const rel = `${examPath}/${SECTION_ID}/${group.id}/${leaf.id}/index.html`;
      const abs = path.join(ROOT, rel);
      const a = ARTICLES[key];
      if (!a) { missing++; continue; }
      if (!fs.existsSync(abs)) { missing++; continue; }

      const route = `/${examPath}/${SECTION_ID}/${group.id}/${leaf.id}`;
      const block = sectionHTML(route, a) + "\n";
      const html = fs.readFileSync(abs, "utf8");

      let out;
      if (SECTION_RE.test(html)) {
        out = html.replace(SECTION_RE, block);
      } else {
        /* Insert after </main>, before the editorial-credit section — the
           position the other exam books use. */
        const m = /<\/main>\n/.exec(html);
        if (!m) { missing++; continue; }
        out = html.slice(0, m.index + m[0].length) + block + html.slice(m.index + m[0].length);
      }

      if (out === html) { skipped++; continue; }
      if (!CHECK) fs.writeFileSync(abs, out, "utf8");
      written++;
    }
  }

  console.log(`rrb-ntpc.ga-extra${CHECK ? " (check)" : ""}`);
  console.log(`  panels written : ${written}`);
  console.log(`  unchanged      : ${skipped}`);
  console.log(`  missing article: ${missing}`);
  if (CHECK && written) process.exitCode = 1;
}

main();
