/* ============================================================
   axomexam — "install the web app" prompt
   ============================================================

   The manifest and the service worker already make the site
   installable; this file gives the reader a way to act on it.

   Three paths:
     - Chromium fires `beforeinstallprompt` -> show a pill that
       opens the real browser install dialog.
     - iOS Safari has no such event -> show a pill that explains
       Share -> Add to Home Screen.
     - Anything else -> stay out of the way.

   Shown at most once every three days, and never again for three
   days after a dismissal. Hidden while a quiz or a dialog is on screen.
   =========================================================== */
(function () {
  "use strict";

  const LANG_KEY = "axomexam-ui-lang";
  const STATE_KEY = "axomexam-install";
  const QUIET_MS = 3 * 24 * 60 * 60 * 1000;
  const SHOW_DELAY_MS = 3500;
  const IOS_DELAY_MS = 6000;

  const TEXT = {
    title: { en: "Install the app", as: "এপ ইনস্টল কৰক" },
    body: { en: "Free, one tap, no store needed.", as: "বিনামূলীয়া, এটা টেপ, ষ্টোৰ নালাগে।" },
    action: { en: "Install", as: "ইনস্টল" },
    close: { en: "Close", as: "বন্ধ কৰক" },
    iosTitle: { en: "Add to Home Screen", as: "হোম স্ক্ৰীনত যোগ কৰক" },
    iosBody: {
      en: "Safari cannot open the install box itself, so add axomexam from the Share menu.",
      as: "Safari-এ নিজে ইনস্টল বাকচ খুলিব নোৱাৰে, গতিকে Share মেনুৰ পৰা axomexam যোগ কৰক।",
    },
    iosStep1: { en: "Tap Share at the bottom of Safari", as: "Safari-ৰ তলত Share টিপক" },
    iosStep2: { en: "Choose Add to Home Screen", as: "Add to Home Screen বাছনি কৰক" },
    iosStep3: { en: "Tap Add — the app icon appears", as: "Add টিপক — এপ আইকন ওলাব" },
    otherTitle: { en: "Install from the browser menu", as: "ব্ৰাউজাৰ মেনুৰ পৰা ইনস্টল কৰক" },
    otherBody: {
      en: "This browser has no install button of its own. Use its menu instead.",
      as: "এই ব্ৰাউজাৰত নিজাকৈ ইনস্টল বুটাম নাই। ইয়াৰ মেনু ব্যৱহাৰ কৰক।",
    },
    otherStep1: { en: "Open the browser menu (⋮ or ≡)", as: "ব্ৰাউজাৰ মেনু খোলক (⋮ বা ≡)" },
    otherStep2: { en: "Choose Install app or Add to Home Screen", as: "Install app বা Add to Home Screen বাছনি কৰক" },
    otherStep3: { en: "Confirm — the axomexam icon appears", as: "নিশ্চিত কৰক — axomexam আইকন ওলাব" },
    gotIt: { en: "Got it", as: "বুজিলো" },
  };

  let deferred = null;
  let pill = null;
  let sheet = null;

  function lang() {
    try {
      return localStorage.getItem(LANG_KEY) === "as" ? "as" : "en";
    } catch (e) {
      return "en";
    }
  }

  function t(key) {
    const entry = TEXT[key];
    return (entry && (entry[lang()] || entry.en)) || "";
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeState(patch) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(Object.assign(readState(), patch)));
    } catch (e) {
      /* private mode — the prompt simply shows again next visit */
    }
  }

  function isStandalone() {
    return (
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true
    );
  }

  function isIos() {
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return ua.includes("Macintosh") && "ontouchend" in document;
  }

  function isBusy() {
    const timer = document.getElementById("quiz-timer");
    if (timer && timer.getClientRects().length > 0) return true;
    const dialogs = document.querySelectorAll('[role="dialog"], .read-modal-box');
    for (let i = 0; i < dialogs.length; i += 1) {
      if (dialogs[i].getClientRects().length > 0) return true;
    }
    return false;
  }

  function canShow() {
    if (isStandalone()) return false;
    const state = readState();
    if (state.installedAt) return false;
    if (state.dismissedAt && Date.now() - state.dismissedAt < QUIET_MS) return false;
    if (state.shownAt && Date.now() - state.shownAt < QUIET_MS) return false;
    return true;
  }

  const ICON =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3v10"/><path d="m8 10 4 4 4-4"/>' +
    '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>';

  function buildPill() {
    const el = document.createElement("div");
    el.className = "axo-install";
    el.setAttribute("role", "complementary");
    el.innerHTML =
      '<span class="axo-install-ico">' + ICON + "</span>" +
      '<span class="axo-install-txt"><b>' + t("title") + "</b><span>" + t("body") + "</span></span>" +
      '<button class="axo-install-go" type="button">' + t("action") + "</button>" +
      '<button class="axo-install-x" type="button" aria-label="' + t("close") + '">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>' +
      "</button>";
    document.body.appendChild(el);
    return el;
  }

  function hidePill() {
    if (!pill) return;
    const el = pill;
    pill = null;
    el.classList.remove("is-in");
    window.setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 220);
  }

  function showPill() {
    if (pill || !canShow() || isBusy()) return;
    pill = buildPill();
    writeState({ shownAt: Date.now() });
    window.requestAnimationFrame(() => pill && pill.classList.add("is-in"));
    pill.addEventListener("click", (event) => {
      const target = event.target;
      if (target.closest && target.closest(".axo-install-x")) {
        writeState({ dismissedAt: Date.now() });
        hidePill();
        return;
      }
      if (target.closest && target.closest(".axo-install-go")) openInstall();
    });
  }

  function openInstall() {
    if (deferred) {
      const event = deferred;
      deferred = null;
      hidePill();
      event.prompt();
      event.userChoice.then((choice) => {
        if (choice && choice.outcome === "accepted") writeState({ installedAt: Date.now() });
        else writeState({ dismissedAt: Date.now() });
      });
      return;
    }
    openInstallSheet();
  }

  function openInstallSheet() {
    if (sheet) return;
    const prefix = isIos() ? "ios" : "other";
    sheet = document.createElement("div");
    sheet.className = "axo-install-sheet";
    sheet.innerHTML =
      '<div class="axo-install-sheet-card" role="dialog" aria-modal="true">' +
      '<div class="axo-install-sheet-ico">' + ICON + "</div>" +
      "<h2>" + t(prefix + "Title") + "</h2>" +
      "<p>" + t(prefix + "Body") + "</p>" +
      '<ol class="axo-install-steps">' +
      "<li>" + t(prefix + "Step1") + "</li>" +
      "<li>" + t(prefix + "Step2") + "</li>" +
      "<li>" + t(prefix + "Step3") + "</li>" +
      "</ol>" +
      '<button class="axo-install-sheet-close" type="button">' + t("gotIt") + "</button>" +
      "</div>";
    document.body.appendChild(sheet);
    window.requestAnimationFrame(() => sheet && sheet.classList.add("is-in"));
    const close = () => {
      writeState({ dismissedAt: Date.now() });
      const el = sheet;
      sheet = null;
      if (!el) return;
      el.classList.remove("is-in");
      window.setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 220);
    };
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) close();
      else if (event.target.closest && event.target.closest(".axo-install-sheet-close")) close();
    });
    document.addEventListener("keydown", function onKey(event) {
      if (event.key === "Escape") {
        close();
        document.removeEventListener("keydown", onKey);
      }
    });
  }

  function scheduleShow() {
    if (!canShow()) return;
    window.setTimeout(() => {
      if (document.visibilityState === "visible") showPill();
    }, isIos() ? IOS_DELAY_MS : SHOW_DELAY_MS);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    scheduleShow();
  });

  window.addEventListener("appinstalled", () => {
    writeState({ installedAt: Date.now() });
    hidePill();
    if (sheet) sheet.remove();
    sheet = null;
  });

  window.AXO_INSTALL = {
    supported: () => !!deferred,
    show: showPill,
    isIos: isIos,
  };

  const boot = () => {
    if (isIos() || deferred) scheduleShow();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
