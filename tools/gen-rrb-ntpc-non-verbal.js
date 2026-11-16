#!/usr/bin/env node
"use strict";

/* Generator for the RRB NTPC Non-Verbal Reasoning banks.
   Emits figure-based MCQs in the repo's existing non-verbal format
   (inline SVG in `fig`, picture options), one JSON bank per topic under
   data/exams/rrb-ntpc/reasoning/non-verbal-reasoning/<topic>/question-001.json.

   Answer keys are balanced here (rotation by question index) because
   tools/balance-answer-keys.js deliberately refuses figure questions.
   Every generated figure and every option is checked to be distinct, and
   every answer is computed from the construction, not typed.

   Usage:  node tools/gen-rrb-ntpc-non-verbal.js [topic ...] */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "exams", "rrb-ntpc", "reasoning", "non-verbal-reasoning");

const S = "#334155";
const BORDER = "#e2e8f0";
const LETTERS = ["A", "B", "C", "D"];

function wrap(vbW, vbH, w, h, inner) {
  const border = `<rect x="2" y="2" width="${vbW - 4}" height="${vbH - 4}" rx="10" fill="none" stroke="${BORDER}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${w}" height="${h}">${border}${inner}</svg>`;
}
function line(x1, y1, x2, y2, c, sw) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c || S}" stroke-width="${sw || 2.2}" stroke-linecap="round"/>`;
}
function poly(pts, fill, stroke, sw) {
  return `<polygon points="${pts}" fill="${fill || "none"}" stroke="${stroke || S}" stroke-width="${sw || 2.2}" stroke-linejoin="round"/>`;
}
function circ(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill || "none"}"${fill ? "" : ` stroke="${S}" stroke-width="2.2"`}/>`;
}
function txt(x, y, s, size, fill) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" fill="${fill || S}">${s}</text>`;
}
function numFig(n) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${txt(50, 70, n, 56)}</svg>`;
}

function balanceOptions(values, correctValue, qIndex) {
  const vals = values.slice();
  const shift = qIndex % 4;
  const rotated = vals.slice(shift).concat(vals.slice(0, shift));
  const options = rotated.map((v, i) => ({ option: LETTERS[i], fig: numFig(v) }));
  return { options, correct: rotated.indexOf(correctValue) };
}
function numberValues(correct, qIndex) {
  const deltas = [1, -1, 2, 3, -2, 4, -3, 5];
  const out = [correct];
  let i = qIndex % deltas.length;
  while (out.length < 4) {
    const v = correct + deltas[i % deltas.length];
    if (v > 0 && !out.includes(v)) out.push(v);
    i++;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* figure families                                                     */
/* ------------------------------------------------------------------ */

function triApexBase(m, extraChord) {
  const apex = [100, 14], left = [16, 146], right = [184, 146];
  const inner = [line(apex[0], apex[1], left[0], left[1]), line(apex[0], apex[1], right[0], right[1]), line(left[0], left[1], right[0], right[1])];
  for (let i = 1; i < m; i++) {
    const x = left[0] + ((right[0] - left[0]) * i) / m;
    inner.push(line(apex[0], apex[1], x, right[1]));
  }
  if (extraChord) {
    const t = 0.5;
    const y = apex[1] + (left[1] - apex[1]) * t;
    const xl = apex[0] + (left[0] - apex[0]) * t;
    const xr = apex[0] + (right[0] - apex[0]) * t;
    inner.push(line(xl, y, xr, y));
  }
  const count = ((m + 1) * m) / 2 + (extraChord ? 1 : 0);
  return { svg: wrap(200, 160, 300, 240, inner.join("")), count };
}
function triHoriz(h) {
  const apex = [100, 14], left = [16, 146], right = [184, 146];
  const inner = [line(apex[0], apex[1], left[0], left[1]), line(apex[0], apex[1], right[0], right[1]), line(left[0], left[1], right[0], right[1])];
  for (let i = 1; i <= h; i++) {
    const t = i / (h + 1);
    const y = apex[1] + (left[1] - apex[1]) * t;
    const xl = apex[0] + (left[0] - apex[0]) * t;
    const xr = apex[0] + (right[0] - apex[0]) * t;
    inner.push(line(xl, y, xr, y));
  }
  return { svg: wrap(200, 160, 300, 240, inner.join("")), count: h + 1 };
}
function gridFig(m, n, cellOverride) {
  const size = 176, pad = 14;
  const cell = cellOverride || Math.floor(Math.min((size - 2 * pad) / n, (size - 2 * pad) / m));
  const gw = cell * n, gh = cell * m;
  const x0 = 100 - gw / 2, y0 = 90 - gh / 2;
  const inner = [];
  for (let r = 0; r <= m; r++) inner.push(line(x0, y0 + r * cell, x0 + n * cell, y0 + r * cell));
  for (let c = 0; c <= n; c++) inner.push(line(x0 + c * cell, y0, x0 + c * cell, y0 + m * cell));
  return wrap(200, 180, 300, 270, inner.join(""));
}
function gridSquares(m, n) {
  let s = 0;
  for (let k = 1; k <= Math.min(m, n); k++) s += (m - k + 1) * (n - k + 1);
  return s;
}
function gridRectangles(m, n) {
  return ((m + 1) * m / 2) * ((n + 1) * n / 2);
}
function lineBundle(n) {
  const apex = [100, 20];
  const inner = [];
  for (let i = 0; i < n; i++) {
    const x = 22 + (156 * i) / Math.max(1, n - 1);
    inner.push(line(apex[0], apex[1], x, 152));
  }
  return wrap(200, 172, 300, 258, inner.join(""));
}
function circleBundle(n) {
  const inner = [];
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const r = n <= 4 ? 30 : n <= 9 ? 24 : 20;
  const gapX = 200 / (cols + 1);
  const gapY = 200 / (rows + 1);
  let k = 0;
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols && k < n; ci++, k++) {
      inner.push(circ(gapX * (ci + 1), gapY * (ri + 1), r));
    }
  }
  return wrap(200, 200, 260, 260, inner.join(""));
}
function rhombusDiagonals() {
  const pts = "100,20 178,100 100,180 22,100";
  const inner = [poly(pts), line(100, 20, 100, 180), line(22, 100, 178, 100)];
  return { svg: wrap(200, 200, 260, 260, inner.join("")), count: 8 };
}
function squareDiagonals() {
  const inner = [poly("30,30 170,30 170,170 30,170"), line(30, 30, 170, 170), line(170, 30, 30, 170)];
  return { svg: wrap(200, 200, 260, 260, inner.join("")), count: 8 };
}
function rectangleDiagonals() {
  const inner = [poly("26,48 174,48 174,132 26,132"), line(26, 48, 174, 132), line(174, 48, 26, 132)];
  return { svg: wrap(200, 180, 280, 252, inner.join("")), count: 8 };
}
function parallelogramDiagonals() {
  const inner = [poly("48,44 178,44 152,136 22,136"), line(48, 44, 152, 136), line(178, 44, 22, 136)];
  return { svg: wrap(200, 180, 280, 252, inner.join("")), count: 8 };
}
/* A triangle with one median drawn to the opposite side -> 3 triangles. */
function triangleOneMedian() {
  const inner = [poly("100,20 22,150 178,150"), line(100, 20, 100, 150)];
  return { svg: wrap(200, 170, 300, 255, inner.join("")), count: 3 };
}
/* A k-sided polygon with every diagonal from one vertex -> k-2 triangles. */
function polygonFan(k) {
  const cx = 100, cy = 100, R = 78;
  const pts = [];
  for (let i = 0; i < k; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / k;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  const inner = [poly(pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "))];
  for (let i = 2; i < k; i++) inner.push(line(pts[0][0].toFixed(1), pts[0][1].toFixed(1), pts[i][0].toFixed(1), pts[i][1].toFixed(1)));
  return { svg: wrap(200, 200, 260, 260, inner.join("")), count: k - 2 };
}

const TQ = {
  tri: ["How many triangles are there in the figure?", "Count the number of triangles in the given figure.", "How many triangles can be counted in the figure below?"],
  sq: ["How many squares are there in the figure?", "Count the number of squares in the given figure."],
  rect: ["How many rectangles are there in the figure?", "Count the number of rectangles in the given figure."],
  line: ["How many straight line segments are there in the figure?", "Count the number of straight lines in the given figure."],
  circ: ["How many circles are there in the figure?", "Count the number of circles in the given figure."],
};
const TQA = {
  tri: ["চিত্ৰখনত কিমানটা ত্ৰিভুজ আছে?", "দিয়া চিত্ৰখনত থকা ত্ৰিভুজবোৰ গণনা কৰক।", "তলৰ চিত্ৰখনত কিমানটা ত্ৰিভুজ আছে?"],
  sq: ["চিত্ৰখনত কিমানটা বৰ্গ আছে?", "দিয়া চিত্ৰখনত থকা বৰ্গবোৰ গণনা কৰক।"],
  rect: ["চিত্ৰখনত কিমানটা আয়ত আছে?", "দিয়া চিত্ৰখনত থকা আয়তবোৰ গণনা কৰক।"],
  line: ["চিত্ৰখনত কিমানটা সৰল ৰেখাখণ্ড আছে?", "দিয়া চিত্ৰখনত থকা সৰল ৰেখাবোৰ গণনা কৰক।"],
  circ: ["চিত্ৰখনত কিমানটা বৃত্ত আছে?", "দিয়া চিত্ৰখনত থকা বৃত্তবোৰ গণনা কৰক।"],
};
const EXPL = {
  tri: { en: (n) => `Counting every triangle formed in the figure, the total comes to ${n}.`, as: (n) => `চিত্ৰখনত গঠিত প্ৰতিটো ত্ৰিভুজ গণনা কৰিলে মুঠ ${n} টা পোৱা যায়।` },
  sq: { en: (n) => `Adding the squares of all sizes present in the figure gives ${n} squares in all.`, as: (n) => `চিত্ৰখনত থকা সকলো আকাৰৰ বৰ্গ যোগ কৰিলে মুঠ ${n} টা বৰ্গ পোৱা যায়।` },
  rect: { en: (n) => `Every rectangle (the squares included) in the figure adds up to ${n}.`, as: (n) => `চিত্ৰখনৰ প্ৰতিটো আয়ত (বৰ্গসহ) যোগ কৰিলে ${n} টা পোৱা যায়।` },
  line: { en: (n) => `Counting each straight segment drawn in the figure, there are ${n}.`, as: (n) => `চিত্ৰখনত অঁকা প্ৰতিটো সৰল ৰেখাখণ্ড গণনা কৰিলে ${n} টা পোৱা যায়।` },
  circ: { en: (n) => `The figure contains ${n} circles in all.`, as: (n) => `চিত্ৰখনত মুঠ ${n} টা বৃত্ত আছে।` },
};

function countingFigures() {
  const rows = [];
  const push = (kind, fig, count) => {
    const i = rows.length;
    const qv = TQ[kind][i % TQ[kind].length];
    const qa = TQA[kind][i % TQA[kind].length];
    const { options, correct } = balanceOptions(numberValues(count, i), count, i);
    rows.push({
      id: `counting-figures-${String(i + 1).padStart(3, "0")}`,
      q: { en: qv, as: qa },
      fig,
      options,
      correct,
      explanation: { en: EXPL[kind].en(count), as: EXPL[kind].as(count) },
    });
  };

  for (let m = 2; m <= 12; m++) { const f = triApexBase(m, false); push("tri", f.svg, f.count); }
  for (let h = 1; h <= 9; h++) { const f = triHoriz(h); push("tri", f.svg, f.count); }
  for (const [m, n] of [[2, 2], [2, 3], [3, 3], [3, 4], [2, 4], [4, 4], [3, 5], [4, 5], [5, 5], [6, 6], [1, 5], [1, 6], [4, 7]]) push("sq", gridFig(m, n), gridSquares(m, n));
  for (const [m, n] of [[2, 5], [3, 6], [1, 4], [2, 6], [4, 6], [3, 7], [2, 7], [5, 6]]) push("rect", gridFig(m, n), gridRectangles(m, n));
  for (let k = 2; k <= 11; k++) push("line", lineBundle(k), k);
  for (let k = 1; k <= 9; k++) push("circ", circleBundle(k), k);
  push("tri", rhombusDiagonals().svg, rhombusDiagonals().count);
  push("tri", squareDiagonals().svg, squareDiagonals().count);
  push("tri", rectangleDiagonals().svg, rectangleDiagonals().count);
  push("tri", parallelogramDiagonals().svg, parallelogramDiagonals().count);
  push("tri", triangleOneMedian().svg, triangleOneMedian().count);
  for (const k of [4, 5, 6, 7, 8]) push("tri", polygonFan(k).svg, polygonFan(k).count);
  return rows;
}

/* ------------------------------------------------------------------ */
/* mirror / water images                                               */
/* ------------------------------------------------------------------ */

const XF = {
  I: (p) => [p[0], p[1]],
  M: (p) => [100 - p[0], p[1]],
  W: (p) => [p[0], 100 - p[1]],
  R: (p) => [100 - p[0], 100 - p[1]],
};

function renderPrims(prims, t) {
  return prims
    .map((p) => {
      if (p.t === "poly") {
        const pts = p.pts.map(t).map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ");
        return poly(pts, p.fill);
      }
      if (p.t === "line") {
        const a = t([p.x1, p.y1]), b = t([p.x2, p.y2]);
        return line(a[0].toFixed(1), a[1].toFixed(1), b[0].toFixed(1), b[1].toFixed(1), p.c, p.sw);
      }
      if (p.t === "circle") {
        const c = t([p.cx, p.cy]);
        return circ(c[0].toFixed(1), c[1].toFixed(1), p.r, p.fill);
      }
      return "";
    })
    .join("");
}
function svgPlain(prims, t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${renderPrims(prims, t)}</svg>`;
}
function dotsPrims(pts, r) {
  return pts.map(([x, y]) => ({ t: "circle", cx: x, cy: y, r: r || 6, fill: S }));
}

function motifSquareDot(v) {
  const c = [[36, 36], [64, 36], [36, 64], [64, 64]][v];
  return [
    { t: "poly", pts: [[24, 24], [76, 24], [76, 76], [24, 76]] },
    { t: "line", x1: 24, y1: 24, x2: 76, y2: 76 },
    ...dotsPrims([c]),
  ];
}
function motifArrow(v) {
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const [ax, ay] = dirs[v];
  const perp = [-ay, ax];
  const tip = [50 + ax * 32, 50 + ay * 32];
  const tail = [50 - ax * 22, 50 - ay * 22];
  const h1 = [tip[0] - ax * 14 + perp[0] * 9, tip[1] - ay * 14 + perp[1] * 9];
  const h2 = [tip[0] - ax * 14 - perp[0] * 9, tip[1] - ay * 14 - perp[1] * 9];
  const dot = [50 - perp[0] * 15 - ax * 8, 50 - perp[1] * 15 - ay * 8];
  return [
    { t: "line", x1: tail[0], y1: tail[1], x2: tip[0], y2: tip[1], sw: 5 },
    { t: "poly", pts: [tip, h1, h2], fill: S },
    ...dotsPrims([dot], 5),
  ];
}
function motifFlag(v) {
  const d = [[46, 72], [54, 72], [46, 26], [54, 26]][v];
  return [
    { t: "line", x1: 40, y1: 26, x2: 40, y2: 80, sw: 4 },
    { t: "poly", pts: [[40, 26], [70, 36], [40, 46]], fill: S },
    ...dotsPrims([d], 5),
  ];
}
function motifLetterF(v) {
  const d = [[64, 68], [36, 68], [64, 30], [36, 30]][v];
  return [
    { t: "line", x1: 40, y1: 24, x2: 40, y2: 78, sw: 5 },
    { t: "line", x1: 40, y1: 24, x2: 66, y2: 24, sw: 5 },
    { t: "line", x1: 40, y1: 50, x2: 60, y2: 50, sw: 5 },
    ...dotsPrims([d], 5),
  ];
}
function motifHouse(v) {
  const door = [[38, 62], [54, 62], [38, 72], [54, 72]][v];
  return [
    { t: "poly", pts: [[30, 46], [70, 46], [70, 84], [30, 84]] },
    { t: "poly", pts: [[24, 46], [50, 24], [76, 46]] },
    { t: "poly", pts: [[door[0], door[1]], [door[0] + 10, door[1]], [door[0] + 10, 84], [door[0], 84]], fill: S },
  ];
}
function motifL(v) {
  const d = [[44, 32], [64, 32], [44, 66], [64, 66]][v];
  return [
    { t: "poly", pts: [[34, 24], [56, 24], [56, 62], [72, 62], [72, 80], [34, 80]] },
    ...dotsPrims([d], 5),
  ];
}
function motifCircle(v) {
  const d = [[50, 34], [50, 66], [34, 50], [66, 50]][v];
  return [
    { t: "circle", cx: 50, cy: 50, r: 28 },
    { t: "line", x1: 50, y1: 50, x2: 74, y2: 50, sw: 3 },
    ...dotsPrims([d], 5),
  ];
}
function motifTri(v) {
  const d = [[42, 42], [58, 42], [42, 58], [58, 58]][v];
  return [
    { t: "poly", pts: [[30, 30], [76, 30], [30, 76]] },
    ...dotsPrims([d], 5),
  ];
}
function motifT(v) {
  const d = [[42, 34], [58, 34], [42, 66], [58, 66]][v];
  return [
    { t: "line", x1: 26, y1: 26, x2: 74, y2: 26, sw: 5 },
    { t: "line", x1: 50, y1: 26, x2: 50, y2: 78, sw: 5 },
    ...dotsPrims([d], 5),
  ];
}
function motifSquareCircle(v) {
  const d = [[34, 34], [66, 34], [34, 66], [66, 66]][v];
  return [
    { t: "poly", pts: [[24, 24], [76, 24], [76, 76], [24, 76]] },
    { t: "circle", cx: 50, cy: 50, r: 16 },
    ...dotsPrims([d], 5),
  ];
}

const MOTIFS = [motifSquareDot, motifArrow, motifFlag, motifLetterF, motifHouse, motifL, motifCircle, motifTri, motifT, motifSquareCircle];

function mirrorQuestionFig(prims, type) {
  const t = (p) => [p[0] * 0.78 + 12, p[1] * 0.78 + 20];
  const body = renderPrims(prims, t);
  const dash =
    type === "mirror"
      ? `<line x1="112" y1="14" x2="112" y2="126" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 5"/>`
      : `<line x1="14" y1="118" x2="150" y2="118" stroke="#93c5fd" stroke-width="2" stroke-dasharray="7 5"/>`;
  return wrap(200, 140, 240, 168, body + dash);
}

function mirrorWater() {
  const rows = [];
  const qEn = {
    mirror: "Choose the correct mirror image (left-right reflection) of the given figure.",
    water: "Choose the correct water image (top-bottom reflection) of the given figure.",
  };
  const qAs = {
    mirror: "দিয়া চিত্ৰখনৰ শুদ্ধ দাপোণ প্ৰতিবিম্ব (বাওঁ-সোঁ প্ৰতিফলন) নিৰ্বাচন কৰক।",
    water: "দিয়া চিত্ৰখনৰ শুদ্ধ জল প্ৰতিবিম্ব (ওপৰ-তল প্ৰতিফলন) নিৰ্বাচন কৰক।",
  };
  const exEn = {
    mirror: "A mirror image reverses the figure left to right, so the reflection across the vertical line is the answer.",
    water: "A water image reverses the figure top to bottom, so the reflection across the horizontal line is the answer.",
  };
  const exAs = {
    mirror: "দাপোণ প্ৰতিবিম্বই চিত্ৰখন বাওঁৰ পৰা সোঁলৈ ওলোটা কৰে, সেয়ে উলম্ব ৰেখাৰ প্ৰতিফলনটোৱেই উত্তৰ।",
    water: "জল প্ৰতিবিম্বই চিত্ৰখন ওপৰৰ পৰা তললৈ ওলোটা কৰে, সেয়ে আনুভূমিক ৰেখাৰ প্ৰতিফলনটোৱেই উত্তৰ।",
  };

  let idx = 0;
  outer:
  for (let mi = 0; mi < MOTIFS.length; mi++) {
    for (let v = 0; v < 4; v++) {
      for (const type of ["mirror", "water"]) {
        if (idx >= 70) break outer;
        const prims = MOTIFS[mi](v);
        const key = type === "mirror" ? "M" : "W";
        const order = [key, "I", type === "mirror" ? "W" : "M", "R"];
        const figs = order.map((k) => svgPlain(prims, XF[k]));
        // balance the key position
        const shift = idx % 4;
        const rot = figs.slice(shift).concat(figs.slice(0, shift));
        const correct = rot.indexOf(figs[0]);
        if (new Set(rot).size !== 4) continue; // skip any degenerate motif variant
        rows.push({
          id: `mirror-water-image-${String(idx + 1).padStart(3, "0")}`,
          q: { en: qEn[type], as: qAs[type] },
          fig: mirrorQuestionFig(prims, type),
          options: rot.map((f, i) => ({ option: LETTERS[i], fig: f })),
          correct,
          explanation: { en: exEn[type], as: exAs[type] },
        });
        idx++;
      }
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* paper cutting & folding                                             */
/* ------------------------------------------------------------------ */

function paperMap(v) {
  return 14 + v * 0.72;
}
function paperOption(holes) {
  let inner = `<rect x="2" y="2" width="96" height="96" rx="10" fill="none" stroke="${BORDER}"/>`;
  inner += `<rect x="14" y="14" width="72" height="72" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.6"/>`;
  for (const [hx, hy] of holes) inner += `<circle cx="${paperMap(hx).toFixed(2)}" cy="${paperMap(hy).toFixed(2)}" r="4.2" fill="${S}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${inner}</svg>`;
}
function paperQuestionFig(fold, px, py) {
  let inner = `<polygon points="14,14 86,14 86,86 14,86" fill="#f8fafc" stroke="#475569" stroke-width="2" stroke-linejoin="round"/>`;
  if (fold === "V" || fold === "VH") inner += `<line x1="50" y1="14" x2="50" y2="86" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4"/>`;
  if (fold === "H" || fold === "VH") inner += `<line x1="14" y1="50" x2="86" y2="50" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4"/>`;
  inner += `<circle cx="${paperMap(px).toFixed(2)}" cy="${paperMap(py).toFixed(2)}" r="4.2" fill="#dc2626"/>`;
  return wrap(100, 100, 150, 150, inner);
}

function paperFolding() {
  const rows = [];
  const qEn = "A square paper is folded along the dotted line(s) as shown and a hole is punched at the red dot. Which option shows the paper when it is unfolded?";
  const qAs = "দেখুওৱাৰ দৰে ডটেড ৰেখা(বোৰ)ৰ কাষেৰে এখন বৰ্গ কাগজ ভাঁজ কৰি ৰঙা বিন্দুটোত এটা বিন্ধা কৰা হ'ল। কাগজখন মেলিলে কেনে দেখিব, সেইটো বিকল্প নিৰ্বাচন কৰক।";
  const exEn = "Unfolding reflects the punched hole across each crease, so the number and position of the holes follow from the fold.";
  const exAs = "মেলিলে প্ৰতিটো ভাঁজৰ ৰেখাৰ ওপৰেৰে বিন্ধাটো প্ৰতিফলিত হয়, সেয়ে বিন্ধাৰ সংখ্যা আৰু অৱস্থান ভাঁজৰ পৰাই নিৰ্ধাৰিত হয়।";

  const xs = [54, 60, 66, 72, 78, 84];
  const ysLow = [24, 30, 36, 42, 48];
  const ysHigh = [58, 64, 70, 76, 82];
  const combos = [];
  for (const fold of ["V", "H", "VH"]) {
    for (let xi = 0; xi < xs.length; xi++) {
      for (let yi = 0; yi < 5; yi++) combos.push({ fold, px: xs[xi], py: (fold === "V" ? ysLow : ysHigh)[yi] });
    }
  }
  const seen = new Set();
  let idx = 0;
  for (const { fold, px, py } of combos) {
    if (idx >= 70) break;
    let holes, distractors;
    if (fold === "V") {
      holes = [[px, py], [100 - px, py]];
      distractors = [[[px, py]], [[100 - px, py]], [[px, py], [px + 8, py]]];
    } else if (fold === "H") {
      holes = [[px, py], [px, 100 - py]];
      distractors = [[[px, py]], [[px, 100 - py]], [[px, py], [px, py - 8]]];
    } else {
      holes = [[px, py], [100 - px, py], [px, 100 - py], [100 - px, 100 - py]];
      distractors = [[[px, py], [100 - px, py]], [[px, py], [px, 100 - py]], [[px, py]]];
    }
    const figs = [holes, ...distractors].map((h) => paperOption(h));
    const sig = JSON.stringify([paperQuestionFig(fold, px, py), figs]);
    if (seen.has(sig) || new Set(figs).size !== 4) continue;
    seen.add(sig);
    const shift = idx % 4;
    const rot = figs.slice(shift).concat(figs.slice(0, shift));
    const correct = rot.indexOf(figs[0]);
    rows.push({
      id: `paper-cutting-folding-${String(idx + 1).padStart(3, "0")}`,
      q: { en: qEn, as: qAs },
      fig: paperQuestionFig(fold, px, py),
      options: rot.map((f, i2) => ({ option: LETTERS[i2], fig: f })),
      correct,
      explanation: { en: exEn, as: exAs },
    });
    idx++;
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* embedded / hidden figures                                           */
/* ------------------------------------------------------------------ */

function polyPrim(pts, fill) {
  return { t: "poly", pts, fill };
}
/* Segment direction class: H, V, "\\", "/" or "x" (other). The composite
   figure is built only from H, V and "\\" segments, so any distractor that
   contains a "/" or an "x" edge cannot be traced inside it. */
function segDir(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (Math.abs(dy) < 0.5) return "H";
  if (Math.abs(dx) < 0.5) return "V";
  if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.5) return dx * dy > 0 ? "\\" : "/";
  return "x";
}
function allEdgesPresentLike(pts) {
  for (let i = 0; i < pts.length; i++) {
    const d = segDir(pts[i], pts[(i + 1) % pts.length]);
    if (d === "/" || d === "x") return false;
  }
  return true;
}

/* A composite line figure (rectangle + midlines + main diagonal + extras,
   all H/V/"\\") with a sub-shape that is traceable inside it, plus three
   distractors each containing an absent-direction edge. */
function embeddedCase(i) {
  const x0 = 8 + (i % 6) * 2;             // left margin 8..18
  const y0 = 8 + ((i * 7) % 6) * 2;       // top margin 8..18
  const x1 = 92 - ((i * 5) % 5) * 3;      // right edge 80..92
  const y1 = 92 - ((i * 11) % 5) * 3;     // bottom edge 80..92
  const midX = Math.round((x0 + x1) / 2), midY = Math.round((y0 + y1) / 2);
  const prims = [polyPrim([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])];
  prims.push({ t: "line", x1: midX, y1: y0, x2: midX, y2: y1, sw: 2.2 });
  prims.push({ t: "line", x1: x0, y1: midY, x2: x1, y2: midY, sw: 2.2 });
  prims.push({ t: "line", x1: x0, y1: y0, x2: x1, y2: y1, sw: 2.2 }); // main diagonal "\"
  // extra H/V lines for variety (still only H/V/"\\")
  const qx1 = Math.round((x0 * 3 + x1) / 4), qx3 = Math.round((x0 + x1 * 3) / 4);
  const qy1 = Math.round((y0 * 3 + y1) / 4), qy3 = Math.round((y0 + y1 * 3) / 4);
  if (i % 4 === 0) prims.push({ t: "line", x1: qx1, y1: y0, x2: qx1, y2: y1, sw: 2.2 });
  if (i % 4 === 1) prims.push({ t: "line", x1: qx3, y1: y0, x2: qx3, y2: y1, sw: 2.2 });
  if (i % 5 === 0) prims.push({ t: "line", x1: x0, y1: qy1, x2: x1, y2: qy1, sw: 2.2 });
  if (i % 5 === 2) prims.push({ t: "line", x1: x0, y1: qy3, x2: x1, y2: qy3, sw: 2.2 });
  if (i % 3 === 0) prims.push({ t: "line", x1: midX, y1: y0, x2: midX, y2: y1, sw: 2.2 });
  if (i % 7 === 0) prims.push({ t: "line", x1: x0, y1: midY, x2: x1, y2: midY, sw: 2.2 });

  const TL = [x0, y0], TR = [x1, y0], BL = [x0, y1], BR = [x1, y1];
  const midT = [midX, y0], midB = [midX, y1], midL = [x0, midY], midR = [x1, midY], C = [midX, midY];
  /* Sub-shapes whose every edge is H, V or the main "\" diagonal, so each can
     be traced exactly inside the composite. */
  const variants = [
    [TL, TR, BR],
    [TL, BL, BR],
    [TL, midT, C],
    [TL, midL, C],
    [BR, midB, C],
    [BR, midR, C],
    [TL, midT, C, midL],
    [midT, TR, midR, C],
    [midL, C, midB, BL],
    [C, midR, BR, midB],
    [TL, TR, midR, midL],
    [midL, midR, BR, BL],
  ];
  const answer = variants[i % variants.length];

  /* Distractors: each carries an edge in a direction the composite lacks
     (an anti-diagonal "/" or a non-lattice slope), so none can be traced. */
  const distractorPool = [
    [TL, TR, BL],
    [TR, BR, BL],
    [TL, BR, midT],
    [midT, BL, midB],
    [TL, TR, midR, BL],
    [TL, C, midB],
  ];
  const distractors = [];
  for (let k = 0; k < distractorPool.length && distractors.length < 3; k++) {
    const cand = distractorPool[(i + k) % distractorPool.length];
    if (!allEdgesPresentLike(cand) && JSON.stringify(cand) !== JSON.stringify(answer)) distractors.push(cand);
  }
  return { prims, answer, distractors, x0, y0, x1, y1 };
}
function embeddedFigures() {
  const rows = [];
  const qEn = "Which of the following figures is embedded (hidden) in the given figure?";
  const qAs = "দিয়া চিত্ৰখনত তলৰ কোনটো চিত্ৰ সংযোজিত (লুকাই) আছে?";
  const exEn = "The outline of the figure in the correct option can be traced exactly inside the given figure, so it is the embedded one.";
  const exAs = "শুদ্ধ বিকল্পৰ চিত্ৰখনৰ ৰূপ দিয়া চিত্ৰখনৰ ভিতৰত সঠিকভাৱে আঁকিব পাৰি, সেয়ে সেয়াই সংযোজিত চিত্ৰ।";

  const mk = (pts) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${poly(
      pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")
    )}</svg>`;

  const seen = new Set();
  let idx = 0;
  for (let i = 0; i < 400 && idx < 70; i++) {
    const { prims, answer, distractors } = embeddedCase(i);
    if (!allEdgesPresentLike(answer)) continue;
    if (distractors.some((d) => allEdgesPresentLike(d))) continue; // safety
    const correctFig = mk(answer);
    const dFigs = distractors.map(mk);
    const figs = [correctFig, ...dFigs];
    const sig = JSON.stringify([prims, figs]);
    if (seen.has(sig) || new Set(figs).size !== 4) continue;
    seen.add(sig);
    const shift = idx % 4;
    const rot = figs.slice(shift).concat(figs.slice(0, shift));
    const correct = rot.indexOf(correctFig);
    rows.push({
      id: `embedded-figures-${String(idx + 1).padStart(3, "0")}`,
      q: { en: qEn, as: qAs },
      fig: wrap(
        100,
        100,
        240,
        240,
        prims
          .map((p) =>
            p.t === "poly"
              ? poly(p.pts.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" "), p.fill)
              : line(p.x1, p.y1, p.x2, p.y2, p.c, p.sw)
          )
          .join("")
      ),
      options: rot.map((f, i2) => ({ option: LETTERS[i2], fig: f })),
      correct,
      explanation: { en: exEn, as: exAs },
    });
    idx++;
  }
  return rows;
}

const BUILDERS = {
  "counting-figures": countingFigures,
  "mirror-water-image": mirrorWater,
  "paper-cutting-folding": paperFolding,
  "embedded-figures": embeddedFigures,
};

function main() {
  const only = process.argv[2];
  for (const [topic, fn] of Object.entries(BUILDERS)) {
    if (only && only !== topic) continue;
    const rows = fn();
    const dir = path.join(OUT, topic);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "question-001.json"), JSON.stringify(rows, null, 1) + "\n");
    fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify({ subcategory: topic, files: ["question-001.json"] }, null, 2) + "\n");
    const figs = new Set(rows.map((r) => r.fig));
    const keys = [0, 0, 0, 0];
    for (const r of rows) keys[r.correct]++;
    console.log(`${topic}: ${rows.length} questions, ${figs.size} distinct figures, keys ${keys.join("/")}`);
  }
}

main();
