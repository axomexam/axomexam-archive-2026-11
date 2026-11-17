# Growth Roadmap — axomexam.in

Ye file site ko **zyada logon tak pahunchane aur unhe wapas laane** ke liye
kaam ki list hai. Owner ek-ek item uthayega aur agent se poochega; agent
us waqt sirf usi item par kaam karega.

## Is file ko kaise use karna hai

- Neeche har item ka apna number hai. Owner bolega "item 3 karo" — agent
  sirf item 3 karega, baaki chhedega nahi.
- Kaam shuru karne se pehle item ka **Status** `todo` se `in_progress` karo,
  khatam hone par `done` karo aur date likho.
- Ek item ek baar mein. Do item ek saath nahi, warna review mushkil ho jata hai.

## Status legend

| Status | Matlab |
|---|---|
| `todo` | Abhi shuru nahi hua |
| `in_progress` | Chal raha hai |
| `done` | Ho gaya (date likho) |
| `blocked` | Owner ke decision ka intezaar |
| `wont-do` | Jaan-boojh kar chhod diya (reason likho) |

---

## Sabse pehle: site ka build samajh lo

Ye static site hai, par **kuch files generated hain**. Seedha output edit karne
se change ud jayega. Rule:

| Source (yahan edit karo) | Output (ye generate hota hai) |
|---|---|
| `js/app.src.js` | `js/app.js` |
| `js/config.src.js` | `js/config.js` |
| `js/i18n.src.js` | `js/i18n.js` |
| `js/api.src.js` | `js/api.js` |
| `css/style.src.css` | `css/style.css` |

Edit ke baad build order:

```bash
node scripts/optimize-render-path.js   # inline critical CSS refresh
node scripts/minify-assets.js          # minified output likhta hai
node scripts/stamp-assets.js           # ?v= hashes + sw.js refresh
```

Push ke liye **`tools/safe-push.sh origin main`** use karo (force push kabhi nahi).

## Standing rules (AGENTS.md se — inhe kabhi na todo)

- **Content kabhi na khoye** — koi sawaal, jawab, note, FAQ delete ya reword nahi.
- **UI kabhi na badle** — markup, CSS class, layout, spacing waisa hi rahe.
- **`/as/` pages par AdSense code nahi** — GA tag haan, ads nahi.
- **Har page par exactly ek `<!DOCTYPE html>`** aur ek `<html lang="…">`.

---

## Priority table (ek nazar mein)

| # | Item | Kyun zaroori | Kaam | Status |
|---|---|---|---|---|
| 1 | Progress dashboard (score save) | Wapas aane ki sabse badi wajah | Medium | `todo` |
| 2 | Daily streak | Daily users 2-3x | Chhota | `todo` |
| 3 | Aaj ka Sawaal (homepage) | Roz aane ki aadat | Chhota | `todo` |
| 4 | Bookmark / "Baad mein dekho" | Data safe lagta hai | Chhota | `todo` |
| 5 | Mock ke baad auto share prompt | Viral loop | Chhota | `todo` |
| 6 | Challenge link (dost ko bhejo) | Ek student = 5 naye | Medium | `todo` |
| 7 | Telegram / WhatsApp channel | Audience wahin hai | Medium | `todo` |
| 8 | Exam countdown (homepage) | Urgency, roz check | Chhota | `todo` |
| 9 | Real web push notification | Bina site khole wapas laao | Medium | `todo` |
| 10 | 17 missing pages banao | 1,931 sawaal pada hai | Medium | `todo` |
| 11 | Daily current affairs | Roz ka sabse bada traffic | Regular | `todo` |
| 12 | SEO fixes (audit se) | Google se zyada log | Medium | `todo` |
| 13 | **Global leaderboard (backend chahiye)** | Social proof | Bada | `blocked` |

Item 13 par `blocked` likha hai kyunki shuru karne se pehle owner ke 4 sawaalon
ka jawab chahiye (neeche "Priority 5" dekho).

---

## Priority 1 — Retention (wapas laao)

### 1. Progress dashboard — mock score save karo

**Problem (verified):** `localStorage` mein sirf 3 keys hain —
`axomexam-theme`, `axomexam-ui-lang`, `axomexam-notif-read`. Mock test ka
score **kahin save nahi hota**. Student result dekh kar chala jata hai aur
kal wapas aane ki koi wajah nahi hoti.

**Kya karna hai:**

- Har mock attempt ka record save karo: `{ set id, date, score, total, time }`
- Key: `axomexam-mock-history` (naya)
- Homepage / ek chhote dashboard par dikhao:
  "Aapne 12 mock diye • Average 68% • Best 84%"
- Purane attempts list karo (date ke saath)

**Files:** `js/app.src.js` (mock result function — jahan `report-card` banta
hai, uske aas-paas), `js/i18n.src.js` (naye strings en + as).

**Dhyan:** UI change nahi karna — dashboard ek naya chhota block ho, existing
layout ke andar.

---

### 2. Daily streak

**Kya karna hai:**

- `axomexam-last-visit` aur `axomexam-streak` save karo
- Agar aaj practice hui aur kal bhi hui thi → streak +1
- Ek din chhoot gaya → streak 1 se reset
- Header ya homepage par dikhao: "🔥 5 din se lagatar practice"

**Files:** `js/app.src.js`, `js/i18n.src.js`.

**Note:** Ye sabse chhota kaam hai aur daily users par sabse zyada asar karta
hai. Item 1 ke saath hi karna aasan hai.

---

### 3. Aaj ka Sawaal (homepage)

**Kya karna hai:**

- Din ki date se ek deterministic question chuno (apne hi question bank se)
- Homepage par ek card: question + "Jawab dekho"
- Roz badle, par din ke andar same rahe

**Files:** `js/app.src.js`, `index.html` (agar ek placeholder block chahiye),
`js/i18n.src.js`.

**Fayda:** Student roz **sirf ek sawaal** dekhne aayega — wahi aadat ban jaati hai.

---

### 4. Bookmark / "Baad mein dekho"

**Kya karna hai:**

- Har question ke saath bookmark button
- `axomexam-bookmarks` mein save (topic id + question index)
- Ek page/panel jahan saved questions dikhein

**Files:** `js/app.src.js`, `js/i18n.src.js`, CSS agar icon chahiye
(`css/style.src.css`).

---

## Priority 2 — Growth (naye log laao)

### 5. Mock ke baad auto share prompt

**Ab kya hai:** share card feature **already hai** (WhatsApp / FB / Telegram /
Twitter / download / copy) — `js/app.src.js` mein `share-modal` aur
`report-card` ke roop mein. Par ye khud se nahi khulta.

**Kya karna hai:**

- Result screen par ek halka prompt: "Aapne 18/25 kiya! Doston ko challenge karo"
- Click par wahi existing share modal khule (naya share system na banao)

**Files:** `js/app.src.js`, `js/i18n.src.js`.

---

### 6. Challenge link

**Kya karna hai:**

- Share link mein set id daalo, jaise `/mock-test/<set>?challenge=<score>`
- Link kholne par wahi mock test khule aur "X ne Y/25 kiya, tum try karo" dikhe
- Existing share text mein link add karo

**Files:** `js/app.src.js` (routing `Ae()` aur `Ke()` ke paas), `js/i18n.src.js`.

**Fayda:** Assam ke students WhatsApp group par active hain — ye loop viral hota hai.

---

### 7. Telegram / WhatsApp channel

**Kya karna hai:**

- Ek Telegram channel banao (daily question + naya content)
- Site par join button (header ya footer)
- Roz naya content bhejo jisme site ka link ho

**Files:** `index.html` (footer/header), `js/i18n.src.js`.

**Note:** Ye item owner ka kaam hai (channel banana), agent sirf button lagayega.

---

## Priority 3 — Re-engagement (wapas kheencho)

### 8. Exam countdown (homepage)

**Kya karna hai:**

- `js/config.src.js` mein exam dates daalo: `{ name, date }`
- Homepage par: "ADRE 2.0 mein 45 din bache"
- Date guzar jaye to agla exam dikhao

**Files:** `js/config.src.js`, `js/app.src.js`, `js/i18n.src.js`.

---

### 9. Real web push notification

**Ab kya hai:** Notification **page ke andar** hain (`NOTIFICATIONS` array,
`js/app.src.js` line ~9558, `axomexam-notif-read` key). User site khole tab hi
dikhte hain. PWA manifest already hai (`display: standalone`).

**Kya karna hai:**

- Service worker (`sw.js`) mein push event handler add karo
- Notification permission maango (user ke click par, pehle nahi)
- Push bhejne ke liye ek backend/channel chahiye (Firebase ya similar) —
  **ye decision owner ka hai**, kyunki GitHub Pages par server nahi hota

**Files:** `sw.js`, `js/app.src.js`, `js/config.src.js`.

**Note:** Sabse bada kaam isme hai. Pehle item 1-3 karo, ye baad mein.

---

## Priority 4 — Content (Google se traffic)

### 10. 17 missing pages banao

**Problem (verified):** `SEO-ACTION-PLAN.md` ke mutabik `data/content/**` mein
~**1,931 sawaal** pade hain jin ka **page hi nahi hai**. Content ready hai,
page banane hain.

| Content file | Qs | Naya page |
|---|---|---|
| `data/content/gk/ancient-assam.json` | 300 | `/topic/gk/assam-history/ancient-assam/` |
| `data/content/gk/medieval-assam.json` | 300 | `/topic/gk/assam-history/medieval-assam/` |
| `data/content/gk/modern-assam.json` | 300 | `/topic/gk/assam-history/modern-assam/` |
| `data/content/gk/ancient-india.json` | 350 | `/topic/gk/indian-history/ancient-india/` |
| `data/content/gk/medieval-india.json` | 350 | `/topic/gk/indian-history/medieval-india/` |
| `data/content/gk/solar-system.json` | 100 | `/topic/gk/geography/solar-system/` |
| `data/content/gk/national-parks.json` | 60 | `/topic/gk/geography/national-parks/` |
| `data/content/gk/brahmaputra-river.json` | 50 | `/topic/gk/geography/brahmaputra-river/` |
| `data/content/science/human-body.json` | 5 | `/topic/science/human-body/` |
| `data/content/history/freedom-struggle.json` | 4 | `/topic/history/freedom-struggle/` |
| `data/content/gk/bihu-festival.json` | 4 | `/topic/gk/art-culture/bihu-festival/` |
| `data/content/articles/*.json` (6) | 108 | `/category/articles/<subject>/` |

**Kaise:** `tools/prerender.js` already hai. Render karo → sitemap mein daalo
→ category pages se link karo → har naye page par `keyword-map.csv` ke rules lagao.

**Fayda:** Ye sabse bada SEO win hai — content ka already hai, sirf page nahi.

---

### 11. Daily current affairs

**Problem (verified):** `current-affairs/` ka content **October 2026** tak ka
hai, jabki aaj November 2026 hai. Students roz "aaj ka current affairs" search
karte hain — exam sites ke liye ye daily traffic ka sabse bada source hai.

**Kya karna hai:**

- Roz/hafte naya current affairs content daalo (16 categories already hain:
  appointments, awards, sports, economy, environment, etc.)
- `scripts/build-current-affairs-content.js` aur
  `tools/build-current-affairs.js` already hai
- Date visible karo ("November 2026") taaki freshness dikhe

**Fayda:** Roz Google se naye log. Ye continuous kaam hai, ek baar ka nahi.

---

### 12. SEO fixes (audit se)

`SEO-AUDIT.md` mein already likha hai. Sabse bade issues:

| Issue | Pages | Severity |
|---|---|---|
| Meta description > 160 chars | 578 | High |
| Title > 60 chars | 286 | High |
| Generic title `<Topic> \| axomexam` | 526 | High |
| Internal links → noindex stubs | 2,039 links | High |
| Title < 30 chars | 65 | High |
| Duplicate H1 | 99 groups | Medium |
| Canonical ≠ page URL | 21 | Medium |

**Kaise:** `tools/apply-keyword-map.js`, `tools/enhance-meta.js`,
`tools/seo-indexing-fix.js`, `tools/fix-orphan-links.js` already hain.
`keyword-map.csv` (995 pages) mein ready target hai.

**Fayda:** Google se zyada log. UI nahi badlegi, sirf meta.

---

## Priority 5 — Social leaderboard (sabko dikhe kaun kitna score kiya)

Owner ne poocha: kya ek aisa dashboard ho jahan **har visitor** ko dikhe ki
kaun top 5 mein hai, kis topic mein kaun aage hai, aur graph ke saath rank.

### Seedha jawab

Haan, ban sakta hai — **par abhi ke setup se nahi.** Iske liye ek **backend
(database) chahiye**.

### Kyun backend chahiye (verified)

Site **GitHub Pages** par hai. Uska matlab:

| Cheez | Situation |
|---|---|
| Server code chalane ki jagah | **Nahi** (pure static, koi serverless function nahi) |
| Shared database | **Nahi** |
| Login / user account | **Nahi** (site khud kehti hai "no login needed") |
| Data save kahan hota hai | Sirf `localStorage` = **usi ek device** ke andar |
| Repo | **Public** hai, so repo mein likhi file duniya dekh sakti hai |

`localStorage` device ke andar hota hai. Uska matlab: A ke phone ka score B
ke phone par **kabhi nahi pahunchega**. Leaderboard ke liye sabka score ek
**common jagah** jaana chahiye — wahi backend hai.

### Do raste

**Rasta A — Local dashboard (backend nahi chahiye)**

- Har user ko **apna** progress dikhe: kitne mock, average, best, topic-wise
  kamzori, graph, apna improvement.
- Kisi doosre se **comparison nahi**.
- Aaj hi ban sakta hai. Zero cost. Zero privacy risk.
- **Ye item 1 hai** (upar). Pehle yahi karo.

**Rasta B — Global leaderboard (backend chahiye)**

- Sabka score ek cloud database mein jaye (Firebase Firestore recommended —
  static site ke saath kaam karta hai, free tier hai).
- Har visitor ko dikhe: **Top 5**, **topic-wise rank**, **graph**, apna rank.
- Neeche ke 4 warnings zaroor padho — ye sirf technical nahi, **legal** bhi hain.

### Rasta B kaisa dikhega

| Cheez | Kaise |
|---|---|
| Top 5 (overall) | Sabse zyada average% wale 5 log, naam/nickname ke saath |
| Topic-wise rank | "Maths mein Rahul #1", "GK mein Priya #2" |
| Graph | Har user ka score-over-time line chart |
| Apna rank | "Aap #47 ho, top 5 se 12% peeche" |
| Naya user | Bina naam ke bhi khel sakta hai; leaderboard join **opt-in** |

### ⚠️ 4 badi warnings (ye ignore mat karo)

**1. Naam dikhana = personal data (PII) — aur ye log bachche hain**

Assam competitive exam aspirants mein **bahut se 18 se kam** honge. India ka
**DPDP Act 2023** 18 se kam umar ke user ka data "child data" maanta hai aur
uske liye **verifiable parental consent** maangta hai. Public leaderboard par
minor ka naam dikhana = badi legal risk + Google policy risk (AdSense ke liye
bhi).

👉 **Solution:** asli naam ki jagah **nickname/handle** use karo, aur user
khud choose kare ki join karna hai ya nahi. Ya sirf initials + district dikhao.

**2. Cheating rokna mushkil hai**

Site ka saara scoring browser mein hota hai. Koi bhi technical banda
developer tools kholkar apna score **fake** kar sakta hai. Public leaderboard
par fake top scorers aa jayenge aur **asli students ka bharosa toot jayega**.

👉 **Solution:** leaderboard ko "practice ranking" bolo, "exam ranking" nahi.
Ya server par score verify karo (kaam zyada).

**3. "No login" wada tootega**

Site 20+ jagah likhti hai: *"No account is needed… nothing to sign up for and
no login."* Leaderboard ke liye identity chahiye, to ye wada badalna padega.

👉 **Solution:** anonymous device-id se shuru karo (koi email/password nahi),
user khud ek nickname de. Login optional rakho.

**4. Free tier ki limit**

Firebase Firestore free tier (approx): **50,000 reads/day, 20,000 writes/day,
1 GiB storage**. Chhote scale par theek, par agar traffic tez badha to limit
aur cost ka dhyan rakhna. (Live numbers deploy se pehle verify karo.)

### Recommended plan

1. **Pehle Rasta A** — apna progress dashboard + graph (item 1, 2, 3).
   Isse user ko wapas aane ki wajah mil jaati hai, bina kisi risk ke.
2. **Phir Rasta B** — agar social element chahiye, to **nickname-based,
   opt-in** leaderboard banao, Firebase par. Privacy policy update karo
   (DPDP + minors). Public repo mein koi personal data na likho.

### Rasta B shuru karne se pehle owner se ye poochna hai

- Naam asli dikhana hai ya nickname? (recommend: nickname)
- Exam-wise leaderboard ya poore site ka ek?
- Graph kis cheez ka: score-over-time, ya topic-wise accuracy?
- Kitne din ka data rakhein (30 din / lifetime)?

---

## Chhota extra (jab time mile)

- **URL trailing slash** — link bina `/` ke banta hai par canonical mein `/`
  hai, isliye GA mein ek page 2 baar dikh sakta hai
  (`/category/gk` vs `/category/gk/`). Fix: link banate waqt `/` lagao.

---

## GA ka status (reference)

- GA4 Measurement ID: **`G-PBPXK2Q799`** — saare 2,614 pages par maujood hai
  (`/as/` pages bhi). Tag sahi chal raha hai.
- SPA navigation par pageview **ja raha hai** (Enhanced Measurement ON hai) —
  live browser test se verify kiya gaya.
- Double-counting nahi hai — ek load par 1 pageview.

---

## Progress log

| Date | Item | Kya hua |
|---|---|---|
| — | — | (kaam shuru hone par bharo) |
