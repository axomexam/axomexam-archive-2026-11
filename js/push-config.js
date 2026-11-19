/* ============================================================
   axomexam — push-config.js

   Public Web Push settings. The VAPID *public* key is meant to be
   shipped to every browser (it is the "from" address of a push
   message). The matching private key never appears here — it lives
   only in the GitHub Actions secret VAPID_PRIVATE_KEY, used by
   tools/send-push.js when a broadcast is sent.

   The public key below and the VAPID_PRIVATE_KEY secret come from the
   same `npx web-push generate-vapid-keys` run. Changing one without
   the other makes every send fail with 403.

   The Firestore project and API key below belong to axomexam-web-push,
   a project created only for push subscriptions. js/firebase-config.js
   points at axomexam-leaderboard instead; the two must stay separate.
   The push values are repeated here on purpose: firebase-config.js is
   only loaded by pages that also load the leaderboard, and a handful of
   pages (404, some article hubs) do not. Carrying them here means the
   bell's opt-in row works on every page instead of quietly disappearing
   on those few.
   ============================================================ */
window.AXOMEXAM_PUSH_CONFIG = {
  vapidPublicKey:
    "BMS2n1GtHfxhp8WrQJYojKI2bdOSHh-yC_PCbejJCMIBsO1T4gA60S76fDNM1rsyExyBnNG19JIM3_8NP3Tpqus",
  /* Firestore collection holding one document per subscribed browser. */
  collection: "push_subs",
  /* Public Firebase web config for the push-only project.
     Deliberately separate from js/firebase-config.js (the leaderboard
     project) so the two never share a database. */
  projectId: "axomexam-web-push",
  apiKey: "AIzaSyC501rLZyw7kTC5W8DNnyIc7WUPHJ_0zME",
  /* How long a visitor must spend on the site before the opt-in prompt is
     offered. This one value is the whole switch: preview used 15000,
     production ships 90000 (1.5 minutes). */
  promptDelayMs: 90000,
};
