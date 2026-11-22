/* ============================================================
   Copy guard
   ------------------------------------------------------------
   The rule block at the end of css/style.src.css already makes the
   page content unselectable. This file adds what CSS cannot cancel:
   the gestures that still reach the content (Ctrl+C on a selection
   made before the stylesheet applied, the context menu, dragging an
   image out of a question) and a short toast explaining why.

   Only #app and the reading modal are guarded. The header search,
   form fields, code inputs and the Share buttons keep working, and
   nothing here touches what a crawler reads.
   ============================================================ */
(function () {
  "use strict";

  if (window.__axoCopyGuard) return;
  window.__axoCopyGuard = true;

  var GUARDED = "#app, #read-modal";
  var ALLOW =
    "input, textarea, select, option, " +
    "[contenteditable]:not([contenteditable='false']), [data-axo-copy-allow]";

  var MESSAGES = {
    en: "Copying is turned off on this site. Please read the question here.",
    as: "এই ছাইটত কপি কৰাটো বন্ধ আছে। অনুগ্ৰহ কৰি ইয়াতে প্ৰশ্নটো পঢ়ক।",
  };

  function lang() {
    var value =
      (document.body && document.body.getAttribute("data-lang")) ||
      document.documentElement.lang ||
      "en";
    return String(value).toLowerCase().indexOf("as") === 0 ? "as" : "en";
  }

  function elementOf(node) {
    if (!node) return null;
    return node.nodeType === 1 ? node : node.parentElement;
  }

  function selectionNode() {
    var sel = window.getSelection && window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    return sel.getRangeAt(0).commonAncestorContainer;
  }

  function isGuarded(node) {
    var el = elementOf(node);
    if (!el || !el.closest) return false;
    var root = el.closest(GUARDED);
    if (!root) return false;
    var allowed = el.closest(ALLOW);
    return !(allowed && root.contains(allowed));
  }

  var toastTimer = 0;
  var lastToastAt = 0;

  function toast() {
    var now = Date.now();
    if (now - lastToastAt < 1200) return;
    lastToastAt = now;

    var el = document.getElementById("axo-copy-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "axo-copy-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.style.zIndex = "1200";
      document.body.appendChild(el);
    }
    el.textContent = MESSAGES[lang()];
    el.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2600);
  }

  function onCopy(event) {
    var target = event.target;
    if (target === document || target === document.body || target === document.documentElement) {
      target = selectionNode();
    }
    if (!isGuarded(target) && !isGuarded(selectionNode())) return;
    event.preventDefault();
    toast();
  }

  document.addEventListener("copy", onCopy, true);
  document.addEventListener("cut", onCopy, true);

  document.addEventListener(
    "contextmenu",
    function (event) {
      if (!isGuarded(event.target)) return;
      var el = elementOf(event.target);
      /* Links keep the native menu so "open in new tab" still works. */
      if (el && el.closest("a[href]")) return;
      event.preventDefault();
      toast();
    },
    true
  );

  document.addEventListener(
    "selectstart",
    function (event) {
      if (isGuarded(event.target)) event.preventDefault();
    },
    true
  );

  document.addEventListener(
    "dragstart",
    function (event) {
      if (isGuarded(event.target)) event.preventDefault();
    },
    true
  );
})();
