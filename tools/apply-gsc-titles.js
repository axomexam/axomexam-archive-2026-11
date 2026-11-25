#!/usr/bin/env node
"use strict";

/*
 * tools/apply-gsc-titles.js
 *
 * Applies the Search Console driven titles in tools/gsc-titles.json. Each
 * entry carries the impressions/clicks/position that justify it, so the file
 * doubles as the record of why a title reads the way it does.
 *
 * Usage:
 *   node tools/apply-gsc-titles.js           # write
 *   node tools/apply-gsc-titles.js --check   # report only
 *
 * keyword-map.csv is synced separately with scripts/sync-map-titles.py, because
 * the map has quoted fields that contain commas.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const LIMIT = 60;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function replaceTitle(html, value) {
  const m = html.match(/<title[^>]*>[\s\S]*?<\/title>/i);
  if (!m) return html;
  return html.slice(0, m.index) + `<title>${escapeAttr(value)}</title>` + html.slice(m.index + m[0].length);
}

function replaceMeta(html, marker, value) {
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    if (!tag.toLowerCase().includes(marker)) continue;
    const cm = tag.match(/content="([^"]*)"/i);
    if (!cm) return html;
    return html.slice(0, m.index) + tag.replace(cm[0], `content="${escapeAttr(value)}"`) + html.slice(m.index + tag.length);
  }
  return html;
}

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "gsc-titles.json"), "utf8"));
const entries = Object.entries(config.titles);
const problems = [];
let changed = 0;

for (const [rel, { title, why }] of entries) {
  if (title.length > LIMIT) problems.push(`${rel}: ${title.length} chars`);
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    problems.push(`${rel}: missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const current = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  console.log(`${rel}\n  was: ${current.trim()}\n  now: ${title}  (${title.length})\n  why: ${why.split(". ")[0]}.`);
  if (current.trim() === title) continue;
  changed++;
  if (!CHECK) {
    let out = replaceTitle(html, title);
    out = replaceMeta(out, 'property="og:title"', title);
    out = replaceMeta(out, 'name="twitter:title"', title);
    fs.writeFileSync(file, out);
  }
}

if (problems.length) {
  console.error(`\n${problems.join("\n")}`);
  process.exit(1);
}

console.log(`\napply-gsc-titles: ${changed} of ${entries.length} pages ${CHECK ? "would change" : "changed"}`);
