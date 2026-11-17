/* ============================================================
   axomexam — leaderboard-ui.js

   The UI half of the social leaderboard: the opt-in popup that
   appears before a mock test is graded, and the /leaderboard page
   with the subject → sub-category picker, the top five, the
   visitor's own rank and the topic-wise accuracy graph.

   Data and network calls live in js/leaderboard.js, exposed as
   window.AXOLeaderboard. This file only touches the DOM.
   ============================================================ */
(function () {
  "use strict";

  const LB = window.AXOLeaderboard;

  /* ---------- helpers ---------- */

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* The leaderboard is page content, so its copy follows the content
     language of the URL (/as/... = Assamese) exactly like the headings the
     app renders with tc() and localized(). Falling back to the interface
     language keeps the popup readable if the bridge is ever unavailable. */
  function tx(key, fallback) {
    try {
      const app = window.AXOApp;
      const lookup = (app && app.tc) || (app && app.t);
      if (typeof lookup === "function") {
        const v = lookup(key);
        if (v && v !== key) return v;
      }
    } catch (e) { /* ignore */ }
    return fallback || key;
  }

  function uiLang() {
    try {
      const app = window.AXOApp;
      if (app && typeof app.contentLang === "function") {
        return app.contentLang() === "as" ? "as" : "en";
      }
      return app && app.uiLang() === "as" ? "as" : "en";
    } catch (e) { return "en"; }
  }

  /* ---------- pre-submit opt-in popup ---------- */

  let popupBusy = false;

  /* Called just before the final score screen is shown. It never blocks
     the result: whatever the visitor chooses, `done` runs. */
  function beforeFinalSubmit(done) {
    let scope = null;
    let pct = 0;
    try {
      const m = window.AXOApp && window.AXOApp.mock();
      if (m && LB && LB.resolveScope && LB.resolveScope(m.cat && m.cat.id, m.subId)) {
        scope = LB.resolveScope(m.cat.id, m.subId);
        let correct = 0;
        m.pool.forEach((q, i) => { if (m.answers[i] === q.correct) correct++; });
        pct = m.pool.length ? Math.round((correct / m.pool.length) * 100) : 0;
      }
    } catch (e) { scope = null; }

    /* No leaderboard for this scope, or the module is unavailable: just
       show the result. */
    if (!scope || !LB || !LB.enabled()) { done(); return; }

    /* Record the attempt locally either way; the graph is private. */
    try { LB.recordAttempt(scope, pct); } catch (e) { /* ignore */ }

    /* Already has a name: update quietly in the background, show result now. */
    const name = LB.storedName();
    if (name) {
      LB.submitScore(scope, pct, name).catch(() => {});
      done();
      return;
    }

    /* No name of their own yet, so ask again after every mock test until
       they type one. Skipping still puts the score on the board, under a
       placeholder identity, and leaves `storedName()` empty. */
    askToJoin(scope, pct, done);
  }

  /* Skipping (or cancelling the name step) submits under a placeholder
     name such as "Unknown user 4821" and then shows the result. The write
     is best-effort: a failure must never hold up the score screen. */
  function submitAnonymously(scope, pct, then) {
    let settled = false;
    const once = () => { if (settled) return; settled = true; then(); };
    try {
      LB.anonymousName()
        .then((nick) => (nick ? LB.submitScore(scope, pct, nick) : null))
        .catch(() => {})
        .then(once, once);
    } catch (e) { once(); }
  }

  function askToJoin(scope, pct, done) {
    const box = document.createElement("div");
    box.className = "lb-modal";
    box.id = "lb-join-modal";
    box.innerHTML = `
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-join-title">
        <div class="lb-modal-ico">🏆</div>
        <h3 id="lb-join-title">${esc(tx("lb.join.title", "Join the leaderboard?"))}</h3>
        <p>${esc(tx("lb.join.body", "Your name will be shown on the leaderboard with your best score. You can skip this — your mock test will still run normally."))}</p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-join-skip" type="button">${esc(tx("lb.join.skip", "Skip"))}</button>
          <button class="btn btn-primary" id="lb-join-yes" type="button">${esc(tx("lb.join.yes", "Yes, add me"))}</button>
        </div>
      </div>`;
    document.body.appendChild(box);

    let finished = false;
    const close = () => box.remove();
    const finish = () => { if (finished) return; finished = true; close(); done(); };

    /* The popup deliberately has no close button and no backdrop dismissal:
       the visitor must choose Skip or Yes, so the choice is never made by a
       stray tap on the dimmed background. */
    el("lb-join-skip").addEventListener("click", () => {
      if (finished) return;
      close();
      submitAnonymously(scope, pct, finish);
    });
    el("lb-join-yes").addEventListener("click", () => {
      if (finished) return;
      close();
      askName(scope, pct, done);
    });
  }

  function askName(scope, pct, done) {
    const box = document.createElement("div");
    box.className = "lb-modal";
    box.id = "lb-name-modal";
    box.innerHTML = `
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-name-title">
        <div class="lb-modal-ico">✍️</div>
        <h3 id="lb-name-title">${esc(tx("lb.name.title", "Enter your name"))}</h3>
        <p>${esc(tx("lb.name.body", "This name will appear on the leaderboard."))}</p>
        <input class="lb-name-input" id="lb-name-input" type="text" maxlength="20"
               autocomplete="off" spellcheck="false" placeholder="${esc(tx("lb.name.ph", "Your name"))}">
        <p class="lb-name-err" id="lb-name-err" role="alert"></p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-name-cancel" type="button">${esc(tx("lb.name.cancel", "Cancel"))}</button>
          <button class="btn btn-primary" id="lb-name-save" type="button">${esc(tx("lb.name.save", "Save and submit"))}</button>
        </div>
      </div>`;
    document.body.appendChild(box);

    const input = el("lb-name-input");
    const err = el("lb-name-err");
    const save = el("lb-name-save");
    setTimeout(() => input.focus(), 30);

    let finished = false;
    const close = () => box.remove();
    const finish = () => { if (finished) return; finished = true; close(); done(); };

    /* No backdrop dismissal here either. Cancel means "no name after all",
       which is the same outcome as Skip: an anonymous entry. */
    el("lb-name-cancel").addEventListener("click", () => {
      if (finished) return;
      close();
      submitAnonymously(scope, pct, finish);
    });

    const showErr = (key, fallback) => { err.textContent = tx(key, fallback); };

    const attemptSave = async () => {
      if (popupBusy) return;
      const check = LB.validateName(input.value);
      if (!check.ok) {
        if (check.code === "short") showErr("lb.name.short", "Please enter at least 2 characters.");
        else if (check.code === "long") showErr("lb.name.long", "Please keep the name within 20 characters.");
        else if (check.code === "chars") showErr("lb.name.chars", "Only letters, numbers, spaces and underscore are allowed.");
        else showErr("lb.name.bad", "This name is not allowed. Please choose another.");
        input.focus();
        return;
      }

      popupBusy = true;
      save.disabled = true;
      err.textContent = "";

      /* A dropped connection rejects instead of resolving, so the reset has
         to live in `finally`: otherwise the button stays disabled and the
         visitor is left with no explanation. */
      try {
        const reserved = await LB.reserveName(check.name);
        if (!reserved.ok) {
          showErr("lb.name.taken", "This name is already taken. Please choose another.");
          return;
        }

        const saved = await LB.submitScore(scope, pct, check.name);
        if (saved.ok) {
          LB.storeName(check.name);
          finish();
          return;
        }
        if (saved.code === "rate") { showErr("lb.name.rate", "Daily leaderboard limit reached."); return; }
        showErr("lb.name.err", "Could not save right now. Please try again.");
      } catch (e) {
        showErr("lb.name.err", "Could not save right now. Please try again.");
      } finally {
        popupBusy = false;
        save.disabled = false;
      }
    };

    save.addEventListener("click", attemptSave);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptSave(); });
  }

  /* ---------- /leaderboard page ---------- */

  const page = {
    subject: null,
    scope: null,
    requestId: 0,
  };

  function defaultSubject() {
    return (LB.SUBJECTS[0] && LB.SUBJECTS[0].id) || "gk";
  }

  function subjectName(id, lang) {
    const s = LB.SUBJECTS.find((x) => x.id === id);
    if (!s) return id;
    return lang === "as" ? s.name.as : s.name.en;
  }

  function subsOf(subject) {
    return (LB.SUBS[subject] || []).map((r) => ({ id: r[0], en: r[1], as: r[2] }));
  }

  function renderPage(container) {
    const lang = uiLang();
    const subject = page.subject || defaultSubject();
    /* Remember the subject: the sub-category handler builds the next scope
       from it, so leaving it null here produced a "null/<sub>" scope. */
    page.subject = subject;
    const subs = subsOf(subject);
    const scope = page.scope && subs.some((s) => s.id === scopeId(page.scope)) ? page.scope
      : (subs[0] ? subject + "/" + subs[0].id : null);

    container.innerHTML = `
      <div class="page-head">
        <nav class="breadcrumb">
          <a href="/">${esc(tx("breadcrumb.home", "Home"))}</a><span class="bc-sep">/</span><span>${esc(tx("lb.title", "Leaderboard"))}</span>
        </nav>
        <h1>🏆 ${esc(tx("lb.title", "Leaderboard"))}</h1>
        <p class="page-desc">${esc(tx("lb.sub", ""))}</p>
      </div>

      <section class="lb-wrap">
        <div class="lb-picker">
          <label class="lb-field">
            <span>${esc(tx("lb.subject", "Subject"))}</span>
            <select id="lb-subject-select">
              ${LB.SUBJECTS.map((s) => `<option value="${esc(s.id)}"${s.id === subject ? " selected" : ""}>${esc(lang === "as" ? s.name.as : s.name.en)}</option>`).join("")}
            </select>
          </label>
          <label class="lb-field">
            <span>${esc(tx("lb.subcategory", "Sub-category"))}</span>
            <select id="lb-sub-select">
              ${subs.map((s) => `<option value="${esc(s.id)}"${scope && s.id === scopeId(scope) ? " selected" : ""}>${esc(lang === "as" ? s.as : s.en)}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="lb-grid">
          <div class="lb-card">
            <div class="lb-card-head">
              <h2>${esc(tx("lb.title", "Leaderboard"))}</h2>
              <span class="lb-scope-name" id="lb-scope-name"></span>
            </div>
            <div id="lb-board" class="lb-board">
              <div class="lb-skel">${esc(tx("lb.loading", "Loading leaderboard…"))}</div>
            </div>
          </div>

          <div class="lb-card lb-mycard">
            <div class="lb-card-head"><h2>${esc(tx("lb.you", "Your rank"))}</h2></div>
            <div id="lb-myrank" class="lb-myrank"><div class="lb-skel">${esc(tx("lb.loading", "Loading leaderboard…"))}</div></div>
          </div>

          <div class="lb-card lb-graphcard">
            <div class="lb-card-head">
              <h2>${esc(tx("lb.graphTitle", "Your accuracy by sub-category"))}</h2>
            </div>
            <div id="lb-graph" class="lb-graph"></div>
          </div>
        </div>
      </section>`;

    if (!scope) {
      el("lb-board").innerHTML = `<div class="lb-empty">${esc(tx("lb.empty", "No scores here yet."))}</div>`;
      el("lb-myrank").innerHTML = "";
      return;
    }

    el("lb-subject-select").addEventListener("change", (e) => {
      page.subject = e.target.value;
      page.scope = null;
      renderPage(container);
    });
    el("lb-sub-select").addEventListener("change", (e) => {
      page.scope = page.subject + "/" + e.target.value;
      renderPage(container);
    });

    el("lb-scope-name").textContent = subjectName(subject, lang) + " • " + LB.subName(scope, lang);
    loadBoard(scope, lang);
    renderGraph();
  }

  function scopeId(scope) { return String(scope).split("/")[1]; }

  async function loadBoard(scope, lang) {
    const req = ++page.requestId;
    const boardEl = el("lb-board");
    const rankEl = el("lb-myrank");

    try {
      const top = await LB.fetchTop(scope, 5);
      if (req !== page.requestId) return;

      if (!top.ok) {
        boardEl.innerHTML = errorBlock();
        rankEl.innerHTML = errorBlock();
        return;
      }

      boardEl.innerHTML = top.rows.length
        ? top.rows.map((row, i) => rowHTML(row, i + 1, lang)).join("")
        : `<div class="lb-empty">${esc(tx("lb.empty", "No scores here yet. Be the first to join!"))}</div>`;

      rankEl.innerHTML = `<div class="lb-skel">${esc(tx("lb.loading", "Loading…"))}</div>`;
      const mine = await LB.fetchMyRank(scope);
      if (req !== page.requestId) return;

      if (!mine.ok) { rankEl.innerHTML = errorBlock(); return; }

      if (mine.rank > 0) {
        rankEl.innerHTML = `
          <div class="lb-rank-big">
            <span class="lb-rank-num">#${mine.rank}</span>
            <span class="lb-rank-of">${esc(tx("lb.of", "of"))} ${mine.total != null ? mine.total : "?"} ${esc(tx("lb.entries", "entries"))}</span>
          </div>
          ${rowHTML(mine.mine, mine.rank, lang, true)}`;
      } else {
        rankEl.innerHTML = `
          <p class="lb-none">${esc(tx("lb.notOnBoard", "You are not on this leaderboard yet."))}</p>
          <a class="btn btn-primary" href="/mock-test">${esc(tx("lb.takeTest", "Take a mock test"))}</a>`;
      }
    } catch (e) {
      if (req !== page.requestId) return;
      boardEl.innerHTML = errorBlock();
      rankEl.innerHTML = errorBlock();
    }
  }

  function errorBlock() {
    return `<div class="lb-empty">${esc(tx("lb.error", "Could not load the leaderboard right now."))}
      <button class="lb-retry" type="button" onclick="location.reload()">${esc(tx("lb.retry", "Retry"))}</button></div>`;
  }

  function rowHTML(row, rank, lang, highlight) {
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
    return `
      <div class="lb-row${highlight ? " lb-row-me" : ""}">
        <span class="lb-row-rank">${medal || "#" + rank}</span>
        <span class="lb-row-name">${esc(row.name)}</span>
        <span class="lb-row-score">${row.bestPct}%</span>
      </div>`;
  }

  /* Topic-wise accuracy graph, drawn from the private local history. */
  function renderGraph() {
    const host = el("lb-graph");
    if (!host) return;
    const lang = uiLang();

    const best = LB.bestByScope();
    const rows = [];
    LB.SUBJECTS.forEach((s) => {
      subsOf(s.id).forEach((sub) => {
        const scope = s.id + "/" + sub.id;
        if (scope in best) {
          rows.push({ scope: scope, label: subjectName(s.id, lang) + " • " + (lang === "as" ? sub.as : sub.en), pct: best[scope] });
        }
      });
    });

    if (!rows.length) {
      host.innerHTML = `<div class="lb-empty">${esc(tx("lb.graphEmpty", "Attempt a few practice sets to see your accuracy graph."))}</div>`;
      return;
    }

    rows.sort((a, b) => b.pct - a.pct);
    const weakest = rows[rows.length - 1];

    host.innerHTML = `
      <div class="lb-bars">
        ${rows.map((r) => `
          <div class="lb-bar-row">
            <span class="lb-bar-label" title="${esc(r.label)}">${esc(r.label)}</span>
            <span class="lb-bar-track">
              <span class="lb-bar-fill" style="width:${Math.max(2, r.pct)}%;--v:${r.pct}"></span>
            </span>
            <span class="lb-bar-val">${r.pct}%</span>
          </div>`).join("")}
      </div>
      <p class="lb-weak">${esc(tx("lb.graphWeak", "Weakest"))}: <b>${esc(weakest.label)}</b> — ${weakest.pct}%</p>`;
  }

  window.AXOLeaderboardUI = {
    beforeFinalSubmit: beforeFinalSubmit,
    renderPage: renderPage,
  };
})();
