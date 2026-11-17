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

**Owner ke final decisions (17 Nov 2026):**

| Sawaal | Decision |
|---|---|
| Naam | **Sirf naam** — koi nickname concept nahi |
| Naam | **Har user ka alag** — ek naam sirf ek user ka |
| Leaderboard | **Topic-wise alag-alag** — taaki pata chale kis topic mein kaun aage hai |

### Leaderboard ke scopes — FINAL (26 sub-categories)

Owner ne **Option 1** chuna: **sub-category level**, 32 nahi — **26**.

**Kyun 26 aur 32 nahi:** `articles` ke 6 sub-categories (gk, math, science,
english, reasoning, computer) **practice sets nahi hain** — wo study pages
hain. `mock-test/` mein `articles` ka koi folder nahi hai. Isliye unka
leaderboard nahi banega. **Sirf wahi sub-category jahan mock/practice set hai.**

| # | Subject | Sub-category id | Naam (en) | Naam (as) | Qs |
|---|---|---|---|---|---|
| 1 | GK | `gk/assam-history` | Assam History | অসমৰ ইতিহাস | 2,775 |
| 2 | GK | `gk/indian-history` | Indian History | ভাৰতীয় ইতিহাস | 2,531 |
| 3 | GK | `gk/geography` | Geography | ভূগোল | 1,716 |
| 4 | GK | `gk/economics` | Economics | অৰ্থনীতি | 1,190 |
| 5 | GK | `gk/art-culture` | Art & Culture | কলা আৰু সংস্কৃতি | 784 |
| 6 | GK | `gk/assam-literature` | Assam Literature | অসমীয়া সাহিত্য | 454 |
| 7 | GK | `gk/polity` | Political Science | ৰাজনীতি বিজ্ঞান | 450 |
| 8 | Maths | `math/arithmetic` | Arithmetic | পাটিগণিত | 766 |
| 9 | Maths | `math/advanced-math` | Advanced Math | উচ্চ গণিত | 477 |
| 10 | Maths | `math/statistics-and-data-interpretation` | Statistics & DI | পৰিসংখ্যা আৰু তথ্য বিশ্লেষণ | 106 |
| 11 | Science | `science/biology` | Biology | জীৱ বিজ্ঞান | 2,405 |
| 12 | Science | `science/physics` | Physics | পদাৰ্থ বিজ্ঞান | 2,000 |
| 13 | Science | `science/chemistry` | Chemistry | ৰসায়ন বিজ্ঞান | 1,750 |
| 14 | Reasoning | `reasoning/verbal-reasoning` | Verbal Reasoning | মৌখিক যুক্তি | 583 |
| 15 | Reasoning | `reasoning/analytical-critical-reasoning` | Analytical & Critical | বিশ্লেষণাত্মক যুক্তি | 524 |
| 16 | Reasoning | `reasoning/non-verbal-reasoning` | Non-Verbal Reasoning | অবাচ্য যুক্তি | 374 |
| 17 | English | `english/vocabulary` | Vocabulary | শব্দভাণ্ডাৰ | 769 |
| 18 | English | `english/grammar` | Grammar | ব্যাকৰণ | 321 |
| 19 | English | `english/parts-of-speech` | Parts of Speech | পদ | 211 |
| 20 | English | `english/sentence-structure` | Sentence Structure | বাক্য গঠন | 124 |
| 21 | Computer | `computer/ms-office-suite` | MS Office Suite | MS Office ছুট | 99 |
| 22 | Computer | `computer/networking-internet` | Networking & Internet | নেটৱৰ্কিং | 92 |
| 23 | Computer | `computer/cyber-security` | Cyber Security | চাইবাৰ নিৰাপত্তা | 75 |
| 24 | Computer | `computer/software-os` | Software & OS | চফ্টৱেৰ আৰু OS | 70 |
| 25 | Computer | `computer/fundamentals-hardware` | Fundamentals & Hardware | মৌলিক ধাৰণা | 69 |
| 26 | Computer | `computer/dbms-number-shortcuts` | DBMS & Shortcuts | DBMS | 68 |

**Total: 26 leaderboards** — har ek mein 68 se 2,775 sawaal tak, isliye
har leaderboard mein **kaafi log** honge (khaali nahi lagega).

**Exam-wise leaderboard:** abhi **nahi** (owner ne sirf sub-category chuna).
Baad mein add kiya ja sakta hai — data model wahi rahega, bas scope badlega.

**Data model (ek document per device per sub-category):**

```
lb_scores/{deviceId}__{scope}   →   {
    name:      "Rahul Das",       // jo user ne likha
    deviceId:  "d_ab12…",         // anonymous, koi login nahi
    scope:     "gk/assam-history",// sub-category id (jaise mock-test path)
    bestPct:   85,                // us sub-category ka best %
    attempts:  12,
    updatedAt: <server time>
}
```

`scope` field **wahi id** hai jo site already use karti hai
(`mock-test/gk/assam-history`), isliye koi naya mapping nahi banana padega.

### Screen ka design

**Subject → Sub-category chuno, phir leaderboard (jaise owner ne chaha):**

```
        ┌───────────────────────────────────────┐
        │  🏆  Leaderboard                       │
        │      [ GK ▾ ]  →  [ Assam History ▾ ]  │
        │                                       │
        │  1.  Rahul_99         ⭐ 92%           │
        │  2.  Priya_B          ⭐ 88%           │
        │  3.  Mukesh_K         ⭐ 85%           │
        │  4.  Anjali_S         ⭐ 81%           │
        │  5.  Bikash_N         ⭐ 79%           │
        │                                       │
        │  ─────────────────────────────────    │
        │  📍 Aapka rank: #47  (320 mein se)     │
        │     Mukesh_K — 72%                    │
        │  ─────────────────────────────────    │
        └───────────────────────────────────────┘
```

Dono dropdown **bilingual** honge (en + as), jaise baaki site hai.

**Graph (topic-wise accuracy — 26 sub-categories):**

```
   Aapki accuracy — sub-category wise
   ┌──────────────────────────────────────────┐
   │ Assam History  ████████████████░░  82%   │
   │ Indian History ██████████████░░░░  74%   │
   │ Arithmetic     ███████████░░░░░░░  58% ← │
   │ Biology        █████████████████░  88%   │
   │ Grammar        █████████████░░░░░  66%   │
   └──────────────────────────────────────────┘
   Sabse kamzor: Arithmetic (58%) — yahan practice karo
```

### Naam box — ek box, ek naam

Owner ne kaha: *"nickname chhodo, direct naam hi rakho, koi jhamela nahi."*

**Isliye design aisa hai — ek hi box, sirf "naam":**

```
        ┌─────────────────────────────────────────┐
        │  🏆  Leaderboard join karein?      [✕]  │
        │                                         │
        │  Apna naam likhein.                     │
        │  Ye leaderboard par dikhega.            │
        │                                         │
        │  ┌───────────────────────────────────┐  │
        │  │                                   │  │  ← SIRF EK BOX
        │  └───────────────────────────────────┘  │
        │                                         │
        │  [ Skip ]          [ Haan, join karo ]  │
        └─────────────────────────────────────────┘
```

User jo likhega, **wahi** leaderboard par dikhega:

| User ne likha | Leaderboard par |
|---|---|
| `Rahul Das` | **Rahul Das** ✅ |
| `Rahul` | **Rahul** ✅ |
| `ৰাহুল` | **ৰাহুল** ✅ |

**Bas. Koi nickname nahi, koi do-box nahi, koi jhamela nahi.**

### Rules kya honge (simple)

| Rule | Kyun |
|---|---|
| 2 se 20 character | Bahut chhota ya bahut lamba naam na ho |
| Letters, numbers, space, `_` allowed | "Rahul Das" bhi, "Rahul_99" bhi |
| Pehle-aakhir ke space hata dena | " Rahul " → "Rahul" |
| **Assamese/Devanagari bhi allowed** | "ৰাহুল" ya "রাহুল" likh sake |
| Gaali filter | Public page par gaali na dikhe |
| **Unique** (chhote-bade ek hi) | `Rahul` = `rahul` = `RAHUL` |
| Trim + double space hata do | "Rahul  Das" → "Rahul Das" |

### Naam unique kaise hoga

- Naam **unique** hoga (ek jaisa do user nahi)
- Agar already le liya gaya → **"Ye naam le liya gaya hai, doosra chuno"**
- Chhote-bade akshar ek hi maane jayenge (`Rahul` = `rahul`)
- Max **20 character**, letters / numbers / `_` / space / Assamese

### Naam reserve karna (free, backend par)

Ek choti collection:

```
lb_names/{name_lowercase}  →  { deviceId, createdAt }
```

- Naam lene se pehle check: is document mein **mera hi deviceId** hai?
  - Haan → mera hi naam hai, aage badho
  - Khaali / kisi aur ka → **"le liya gaya"** dikhao
- **Atomic** rakhna zaroori hai (do log ek saath same naam na le lein) —
  Firestore transaction ya rules se handle hoga
- Isse ek extra read/write lagta hai — total abhi bhi free limit ke andar

### Anti-abuse (naam ke saath)

1. **Gaali filter** — abusive words block, warna public page par gaali dikhegi
2. **Rate limit** — 20 leaderboard posts per din per device (mock test unlimited)
3. **Duplicate device** — ek device ek naam; device clear kare to naya
4. **Fake score** — "practice ranking" hi bolna hai, "official" nahi
5. **Report/delete** — owner ke paas kisi bhi entry ko hatane ka tarika ho
   (Firebase console se manual chalega)

### ⚠️ 4 badi warnings (ye ignore mat karo)

**1. Naam dikhana = personal data (PII) — aur ye log bachche hain**

Assam competitive exam aspirants mein **bahut se 18 se kam** honge. India ka
**DPDP Act 2023** 18 se kam umar ke user ka data "child data" maanta hai aur
uske liye **verifiable parental consent** maangta hai. Public leaderboard par
minor ka naam dikhana = badi legal risk + Google policy risk (AdSense ke liye
bhi).

👉 **Solution:** user **khud choose** kare ki join karna hai ya nahi, aur
public page par sirf wo **naam** dikhe jo usne khud diya. Ya sirf initials +
district dikhao.

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
user sirf apna naam de. Login ki zaroorat nahi.

**4. Free tier ki limit**

Firebase Firestore free tier (approx): **50,000 reads/day, 20,000 writes/day,
1 GiB storage**. Chhote scale par theek, par agar traffic tez badha to limit
aur cost ka dhyan rakhna. (Live numbers deploy se pehle verify karo.)

### Recommended plan

1. **Pehle Rasta A** — apna progress dashboard + graph (item 1, 2, 3).
   Isse user ko wapas aane ki wajah mil jaati hai, bina kisi risk ke.
2. **Phir Rasta B** — agar social element chahiye, to **naam-based,
   opt-in** leaderboard banao, Firebase par. Privacy policy update karo
   (DPDP + minors). Public repo mein koi personal data na likho.

### Owner ka UX plan (ye sahi hai — isi tarah banega)

Owner ne decide kiya: **koi login/account nahi.** Mock test ke final submit se
**pehle** ek chhota popup aayega:

```
        ┌─────────────────────────────────────────┐
        │  🏆  Leaderboard join karein?      [✕]  │
        │                                         │
        │  Aapka naam leaderboard par dikhega.    │
        │  Sirf naam chahiye — koi login nahi.    │
        │                                         │
        │  ┌───────────────────────────────────┐  │
        │  │ Aapka naam likhein                │  │
        │  └───────────────────────────────────┘  │
        │                                         │
        │  [ Skip ]          [ Haan, join karo ]  │
        └─────────────────────────────────────────┘
```

- **[✕] / [Skip]** → popup band, submit normal chalu. Koi naam nahi maanga.
- **[Haan, join karo]** → sirf naam poocha jaata hai.
- Submit hone par naam **leaderboard par dikhta hai**.

Ye opt-in + close-able + sirf-naam design **bilkul theek hai** — privacy ke
hisaab se bhi sabse kam risk wala rasta. Login ki zaroorat nahi.

### ⚠️ Par ek gap hai — popup akele kaafi nahi

Ye samajhna zaroori hai:

| Kaam | Backend chahiye? |
|---|---|
| Submit se pehle popup dikhana | ❌ Nahi — aaj ho sakta hai |
| Close / Skip button | ❌ Nahi |
| Naam ka input box | ❌ Nahi |
| Naam `localStorage` mein save karna | ❌ Nahi |
| **Naam doosre users ko dikhana** | ✅ **Haan — backend chahiye** |
| **Top 5 list** | ✅ Haan |
| **Topic-wise rank** | ✅ Haan |
| **Sabka graph** | ✅ Haan |

**Kyun:** popup + naam ka matlab hai "naam **liya** gaya". Leaderboard ka matlab
hai "naam **sabko dikhaya** gaya". Ye do alag cheezein hain.

Naam agar sirf `localStorage` mein rahega to wo **usi ek phone** mein rahega.
Dusre user ko **kabhi nahi dikhega**. Leaderboard ke liye naam ek **common
jagah** bhejna padega — wahi backend hai.

**Analogy:** Popup = ek form jisme aap naam likhte ho. Backend = **postbox**
jahan form daala jaata hai. Postbox nahi hoga to form aapki jeb mein hi rahega.

### Backend ke options (koi ek chuno)

| Option | Free tier | Setup | Kis ke liye |
|---|---|---|---|
| **Firebase Firestore** ⭐ | Haan (~50k reads/day) | ~15 min | Sabse aasan static site ke liye |
| Supabase | Haan (500 MB) | ~20 min | Agar SQL pasand ho |
| Cloudflare Workers + KV | Haan (1 lakh/day) | ~30 min | Technical banda chahiye |
| Google Sheets + Apps Script | Haan | ~20 min | Bilkul simple, par slow |

**Recommendation: Firebase Firestore.** GitHub Pages ke saath seedha chalta
hai, free tier chhote scale ke liye kaafi hai, aur login ki zaroorat nahi.

### Jo kaam owner ka hi hai (agent nahi kar sakta)

- Firebase account banana (**owner ke naam par hona chahiye** — data unka hai)
- Firebase project + Firestore database banana
- Config keys (apiKey, projectId) site mein daalna — ye public keys hain,
  secret nahi, isliye repo mein rakhna theek hai

Agent baaki sab code likh sakta hai.

### 🔒 Anti-abuse — ye zaroori hai (warna leaderboard kharab ho jayega)

Public leaderboard par user ka likha text aata hai, to ye 4 cheezein must hain:

1. **Naam filter** — gaali/abusive words block, max 20 characters, sirf
   letters/numbers/space. Warna koi gaali likh dega.
2. **Duplicate naam** — ek hi naam se koi bhi khel sakta hai; isko accept
   karo par "practice ranking" hi bolo, "official" nahi.
3. **Fake score** — site ka scoring browser mein hota hai, to koi score badha
   sakta hai. Minimum: leaderboard post par 20/din limit (neeche "Rate limit"
   dekho) aur timestamp. Poora fix chahiye to server par verify karna padega
   (kaam zyada).
4. **Rate limit** — ek device se bahut zyada submissions na ho.

### 📜 Privacy policy update (legal — must)

Abhi privacy policy kehti hai ki content ke liye koi personal data nahi liya
jaata. Leaderboard naam add karne par **privacy policy update karna zaroori
hai** — likhna padega: kaunsa data liya, kyun, kitne din rakha, kaise delete
karwayein. DPDP Act 2023 ke hisaab se.

### Rate limit — owner ka decision

**Owner ne kaha: 20 submissions per din per user.**

⚠️ **Zaroori farq — ye limit sirf LEADERBOARD submission par hai, mock test
par NAHI:**

| Cheez | Limit |
|---|---|
| Mock test dena | **UNLIMITED** (site ka wada hai: "free and unlimited") |
| Practice set attempt karna | **UNLIMITED** |
| **Leaderboard par score bhejna** | **20 per din per device** |

Ye farq rakhna **bahut zaroori** hai. Site 20+ jagah likhti hai:
*"All sets are free and unlimited — you can reattempt any set as many times as
you like."* Agar hum mock test par limit laga denge to ye wada toot jayega aur
users chale jayenge.

Isliye: **mock test unlimited rahega**, sirf **leaderboard post** 20/din se
limited hoga. User 50 mock test de sakta hai — par din mein 20 baar leaderboard
par naam nahi bhej sakta.

### 📊 Kya Firebase free mein kaam karega? — Hisaab se jawab

Haan, **shuruat ke liye kaafi hai.** Par limit ka pata hona chahiye.

**Firebase Firestore Spark (free) plan ki limit:**

| Cheez | Free limit |
|---|---|
| Document **writes** | **20,000 / din** |
| Document **reads** | **50,000 / din** |
| Document deletes | 20,000 / din |
| Storage | 1 GiB |
| Network | 10 GiB / mahina |
| Credit card chahiye? | **Nahi** (Spark plan bina card ke) |

**Writes ka hisaab (ye sabse tight limit hai):**

```
20,000 writes/din ÷ 20 submissions = 1,000 users/din (max rate par)
```

Par asli users 20 submission/din nahi karte. Maan lo average 3/din:
```
20,000 ÷ 3 ≈ 6,600 active users/din
```

**Reads ka hisaab:**
```
Leaderboard dekhne par ≈ 11 reads (top 5 + apna rank + topic ranks)
50,000 ÷ 11 ≈ 4,500 leaderboard views/din
```

**Matlab:** free plan **~4,000-6,000 active users/din** tak sambhal lega.
Shuruat ke liye ye kaafi hai. 2 saal mein 10x badhne par dhyan dena.

### 💡 Writes 10-20x kam karne ka tarika (ye zaroor karo)

Har submission par database write karna zaroori **nahi** hai. Do smart tarike:

**Tarika 1 — Sirf best score likho**
```
Agar naya score purane best se kam hai → database write NAHI
Agar zyada hai → tab hi write
```
Isse 20 writes/din ki jagah ~2-3 writes/din. **~7x zyada users free mein.**

**Tarika 2 — Din mein ek baar summary likho**
Har submission par nahi, din ke end mein ek document:
```
{ userId, date, bestScore, avgScore, attempts, topicScores }
```
**1 write/din per user → 20x zyada users free mein.**

**Reads kam karne ke liye:** leaderboard ko `localStorage` mein 5-10 minute
cache karo. Har page view par fresh read nahi hoga.

In dono ke saath, free plan **50,000+ active users/din** tak chal sakta hai.

### 💰 Agar free limit cross ho jaye to?

Do baat:

1. **Spark (free) plan par kuch tootega nahi** — bas us din ka data ruk
   jayega. Paisa apne aap nahi katega (card hi nahi hai).
2. **Blaze (pay-as-you-go)** par upgrade kar sakte ho — usme bhi free
   allowance hai, aur uske baad **bahut sasta** hai:
   - ~$0.06 per 1 lakh reads
   - ~$0.18 per 1 lakh writes
   - Matlab 10x traffic = mahine ke **kuch dollar**
   - Blaze par **budget alert** lag sakta hai (jaise ₹100/mahina), limit par
     notification aa jayega

**Owner ki condition "koi paisa nahi bharna" ke hisaab se:**
Spark plan se shuru karo (card bhi nahi chahiye). Jab limit aane lage, tab
sochna. Tab tak site already chal rahi hogi.

### 🆚 Alternative — Supabase (agar writes ki chinta ho)

Agar writes ki limit tight lage, to **Supabase** better hai:

| Cheez | Firebase Spark | Supabase Free |
|---|---|---|
| Writes | 20,000/din | **Unlimited API requests** |
| Database | 1 GiB | 500 MB |
| Bandwidth | 10 GiB/mahina | 5 GB/mahina |
| Setup | Aasan (~15 min) | Thoda technical (SQL) |

Supabase read/write par limit nahi lagata, sirf storage/bandwidth par. Isliye
agar bahut submissions honge to Supabase zyada dega.

**Mera suggestion:** Firebase se shuru karo (aasan hai). Agar limit aane lage,
Supabase par shift kar sakte hain — code ka dhaancha wahi rahega.

### Apna rank kaise dikhega (owner ka sawaal)

Owner ne poocha: *"top 5 hi dikhe, par submission ke baad mujhe apna rank bhi
dikhe — logon ke muqable main kitne number par hoon?"*

**Jawab: Haan, dikhega. Yahi leaderboard ka sabse zaroori hissa hai.**

Design aisa hoga — top 5 upar, apna rank alag neeche:

```
        ┌───────────────────────────────────────┐
        │  🏆  Leaderboard                       │
        │                                       │
        │  1.  Rahul Das        ⭐ 92%           │
        │  2.  Priya Bora       ⭐ 88%           │
        │  3.  Mukesh Khatm     ⭐ 85%           │
        │  4.  Anjali Saikia    ⭐ 81%           │
        │  5.  Bikash Nath      ⭐ 79%           │
        │                                       │
        │  ─────────────────────────────────    │
        │  📍 Aapka rank: #47  (320 mein se)     │
        │     Mukesh — 72%                      │
        │  ─────────────────────────────────    │
        └───────────────────────────────────────┘
```

- Top 5 **upar** dikhte hain (jaise owner ne kaha)
- **"Aapka rank: #47 (320 mein se)"** — ye har user ko apna number dikhata hai
- User ko pata chalta hai: kitne log usse aage hain, aur kitne peeche

Ye **exactly wahi** hai jo Google Play, Duolingo, aur har game karta hai — top
list upar, aur "your rank" alag line par. Isse user ko competition ka ehsaas
hota hai, chahe wo top 5 mein na ho.

### Rank kaise niklega (technical)

Do tarike, dono kaam karte hain:

**Tarika A — Count query (recommended, sasta)**
```
"Kitne users ka score mere se zyada hai?" → ginti + 1 = mera rank
```
Firestore mein `count()` query iske liye hai. Ye **1 read per 1,000 users**
leta hai — matlab 10,000 users ki ginti = sirf **10 reads**. Bahut sasta.

**Tarika B — Sab load karke client par ginti**
Poori list download karke browser mein ginti. Aasan, par 10,000 users par
**10,000 reads** = mehnga. Chhote scale (500 users tak) par theek.

**Recommendation:** Tarika A. Rank hamesha sahi rahega aur cost bahut kam.

### Ek zaroori baat — rank tabhi milega jab user join kare

| User ne kya kiya | Rank dikhega? |
|---|---|
| Popup mein naam diya | ✅ Haan — leaderboard mein hai |
| Popup close / Skip kiya | ❌ Nahi — wo list mein hi nahi hai |

Agar user skip karta hai to uska score kisi ko nahi bheja jaata, to usko
compare karne ka data hi nahi hota. **Isko theek rakhne ka tarika:**

- Skip karne par bhi popup ke neeche chhota line dikhao:
  *"Skip karne par aapka rank nahi dikhega. Naam dena chahenge?"*
- Ya baad mein "Join leaderboard" ka button do, taaki wo baad mein join kar sake

Isse user ko pata rahega ki rank chahiye to naam dena padega.

### Firebase setup — step by step (owner ke liye)

Ye poora kaam **15-20 minute** ka hai. **Credit card nahi chahiye**, koi paisa
nahi lagta. Neeche jo bhi likha hai wahi karo, order se.

#### Step 0 — Google account

Ek Google account chahiye (Gmail chalega). **Isi account par project banega**,
matlab data aapka rahega. Agar alag account banana ho to bana lo — warna
aapka personal Gmail bhi chalega.

#### Step 1 — Firebase project banao

> **Note:** Is step mein **left side koi menu nahi aayega** — ye normal hai.
> Left menu project ban jaane ke **baad** dikhta hai. Yahan sirf ek wizard
> chalega, usko follow karo.

1. Kholo 👉 **https://console.firebase.google.com**
2. Usi Google account se login karo
3. **"Create a project"** / **"Add project"** par click karo
   - Agar pehle se koi project hai, to **"Add project"** button upar dikhega
4. Project ka naam likho: `axomexam` (kuch bhi likh sakte ho)
5. **Google Analytics** poochega → **OFF kar do** (band kar do)
   - Kyun: aapki site par GA4 already laga hai (`G-PBPXK2Q799`). Yahan ON
     karne se duplicate ho jayega. **OFF hi rakho.**
6. **"Create project"** → 1 minute wait → **"Continue"**

Ab aap **Project Overview** page par pahunch jaoge. **Yahin se left menu
dikhega.**

#### Step 2 — Firestore database banao

> ⚠️ **Firebase apna UI baar-baar badalta hai.** Isliye Firestore dhundhne ke
> **teen tarike** neeche diye hain. Jo kaam kare wahi use karo.

**Pehle left menu kholo:**

- Agar left menu dikh raha hai → theek hai, aage badho
- Agar left menu **band / chhota** hai → upar-left corner mein **☰ (hamburger)**
  icon par click karo, menu khul jayega
- Agar phone par ho → menu icon tap karo, ya screen landscape karo

**Firestore dhundhne ke 3 tarike (koi ek):**

| Tarika | Kya karo |
|---|---|
| **A. "Build" category se** | Left menu mein **"Build"** par click karo → uske andar **"Firestore Database"** dikhega |
| **B. Seedha naam se** | Left menu mein seedha **"Firestore Database"** likha dikhe — usi par click karo |
| **C. Search se** ⭐ | Upar search bar mein type karo **`Firestore`** → result par click karo |

> **"Build" kahan gaya?** Naye Firebase console mein kuch categories
> ("Build", "Run", "Engage") **collapse** rehti hain. Unke aage **`>`** ya
> **`v`** arrow hoga — us arrow par click karo to andar ki items khulengi.
> Kuch accounts mein ye category hata kar items seedha list kar diye gaye
> hain. Isliye **search (tarika C)** sabse pakka hai.

**Firestore mil gaya? Ab database banao — ye 5 chhote step hain:**

**2a. "Create database" par click karo**

**2b. Edition poochega — ✅ `Standard edition` chuno**

```
   ┌──────────────────────────────────────────────┐
   │  Choose an edition                           │
   │                                              │
   │  ◉ Standard edition            ← YE CHUNO ✅ │
   │    Document database. Automatic indexes,     │
   │    simple pricing, free tier.                │
   │                                              │
   │  ○ Enterprise edition                        │
   │    Advanced query engine, MongoDB mode.      │
   │    Manual indexes, per-KiB pricing.          │
   └──────────────────────────────────────────────┘
```

**Kyun Standard?** Hamare leaderboard jaise simple kaam ke liye Standard
**behtar aur sasta** hai:

| Cheez | Standard ✅ | Enterprise |
|---|---|---|
| Free reads/din | 50,000 | 50,000 |
| Free writes/din | 20,000 | 40,000 |
| Index | **Automatic** (rank query ke liye zaroori) | **Manual** (khud banana padega) |
| Price agar limit cross ho | **$0.03** /1 lakh reads | **$0.05** /10 lakh (per-KiB hisaab) |
| Hamare liye | ✅ **Yahi chuno** | Overkill |

Enterprise mein writes 2x milte hain, **par** har write 1 KiB chunks mein
ginta hai aur index khud banane padte hain — hamare chhote kaam ke liye
faaltu complication hai.

**2c. Database ID poochega — ⚠️ KUCH MAT LIKHO**

```
   ┌──────────────────────────────────────────────┐
   │  Database ID                                 │
   │  ┌────────────────────────────────────────┐  │
   │  │ (default)                              │  │ ← YAHI REHNE DO
   │  └────────────────────────────────────────┘  │
   └──────────────────────────────────────────────┘
```

> 🚨 **Ye sabse zaroori step hai!**
>
> Agar aap `(default)` ki jagah koi naam likhoge (jaise `axomexam-db`), to
> wo **"named database"** ban jayega. Google ke docs kehte hain:
> *"To create a named (non-default) database, you must enable billing."*
> Matlab **card daalna padega** — aur free quota bhi nahi milega.
>
> **`(default)` ko waise hi chhodo. Kuch mat likho.**
> Isse free quota milega aur card ki zaroorat nahi padegi.

**2d. Location poochega — `asia-south1` (Mumbai) chuno**

- Kyun: aapke users India mein hain, isse speed tez milegi
- ⚠️ Ye baad mein **badla nahi ja sakta**, isliye dhyan se chuno
- Agar `asia-south1` na dikhe to **`asia-south2` (Delhi)** ya
  **`asia-southeast1` (Singapore)** chuno

**2e. Security rules poochega — `Production mode` chuno**

- Test mode **nahi** — wo 30 din mein expire ho jaata hai
- (Rules hum Step 4 mein apne likhenge)

**2f. "Enable" / "Create" par click karo** → 1 minute wait

> **Firestore ke naam ke variants:** Kuch accounts mein "Firestore Database"
> ki jagah **"Firestore"** ya **"Cloud Firestore"** likha hota hai. Teeno ek
> hi cheez hain — jo bhi dikhe usi par click karo. (Ek aur cheez hoti hai
> **"Realtime Database"** — wo **alag** hai, usko **na** chuno.)

#### Step 3 — Web app register karo (config lene ke liye)

> **Yahan kaam kahan se shuru karna hai?** Left menu mein sabse upar **⚙️ gear**
> ke neeche project ka naam (`axomexam`) likha hoga. Us par click karo — ya
> left menu mein **"Project Overview"** dhundho. Yahi se Step 3 shuru hota hai.

**3a. Web app ka icon dhundho**

Project Overview page par ek chhota **`</>`** icon dikhega (Web platform ka
icon). Ye dhundhne ke 3 tarike:

| Tarika | Kya karo |
|---|---|
| **A. Overview page se** ⭐ | Overview page par neeche scroll karo → **"Get started by setting up a Web app"** → **`</>`** icon par click |
| **B. Project settings se** | ⚙️ **Project settings** → neeche scroll → **"Your apps"** → **`</>`** icon |
| **C. Search se** | Upar search bar mein `web app` type karo |

> **Dikh nahi raha?** Overview page par thoda **neeche scroll** karo — Web
> icon aksar "Add an app to get started" wale box ke andar hota hai.

**3b. App ka nickname likho**

```
   ┌──────────────────────────────────────────────┐
   │  App nickname                                │
   │  ┌────────────────────────────────────────┐  │
   │  │ axomexam-web                           │  │
   │  └────────────────────────────────────────┘  │
   └──────────────────────────────────────────────┘
```

**3c. ⚠️ "Also set up Firebase Hosting" ka checkbox — HATA DO**

- Hum GitHub Pages use karte hain, Firebase Hosting nahi
- Checkbox **tick na ho**, khaali chhodo

**3d. "Register app" par click karo**

**3e. Ab `firebaseConfig` code block dikhega — ye copy karo**

```js
const firebaseConfig = {
  apiKey: "AIzaSy....................",
  authDomain: "axomexam.firebaseapp.com",
  projectId: "axomexam",
  storageBucket: "axomexam.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

👉 **Ye pura block copy karke mujhe bhej do.** Bas yahi chahiye. (Ye keys
**secret nahi** hain — public hain, isliye repo mein rakhna theek hai.)

**3f. "Continue to console"** par click karo

> **Config baad mein phir se kahan milega?** ⚙️ **Project settings** →
> neeche scroll karo → **"Your apps"** → apni web app ke saamne
> **"SDK setup and configuration"** → **"Config"** radio button. Wahan wahi
> block dobara dikhega. Isliye bhejna bhool jao to chinta mat karo.

> **Nayi Firebase UI mein ye alag dikh sakta hai:** kuch accounts mein
> `firebaseConfig` ki jagah **"npm"** ya **"CDN"** tab pehle khulta hai.
> Tab ke saath-saath **"Config"** wala option bhi hoga — usi par click karo.
> Jo bhi ho, aapko **6 values** chahiye: `apiKey`, `authDomain`, `projectId`,
> `storageBucket`, `messagingSenderId`, `appId`.

#### Step 4 — Security rules lagao

1. Firestore Database kholo (Step 2 ke teen tarike yaad karo — search sabse
   pakka)
2. **"Rules"** tab par click karo (upar **Data | Rules | Indexes | Usage**
   mein se **Rules**)
3. Jo likha hai wo **poora delete** karo, aur ye paste karo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    /* Ek document per device per scope (exam ya subject).
       Document id = deviceId + "__" + scope */
    match /lb_scores/{docId} {
      allow read: if true;

      allow create, update: if
        request.resource.data.keys().hasOnly(
          ['name','deviceId','scope','bestPct','attempts','updatedAt']
        )
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 2
        && request.resource.data.name.size() <= 20
        /* letters, combining marks, numbers, space, underscore.
           \p{M} zaroori hai: Assamese/Devanagari ki matra (jaise "ৰাহুল")
           ek combining mark hai, letter nahi. Sirf \p{L} rakho to
           Assamese naam 403 ho jaata hai (17 Nov 2026 ko live pakda gaya). */
        && request.resource.data.name.matches('^[\\p{L}\\p{M}\\p{N} _]+$')
        && request.resource.data.deviceId is string
        && request.resource.data.deviceId.size() >= 8
        && request.resource.data.scope is string
        && request.resource.data.bestPct is int
        && request.resource.data.bestPct >= 0
        && request.resource.data.bestPct <= 100
        && request.resource.data.attempts is int
        && request.resource.data.attempts > 0
        && request.resource.data.updatedAt == request.time
        /* device apna hi document likhe: docId ka pehla hissa deviceId ho */
        && docId.split('__')[0] == request.resource.data.deviceId;

      allow delete: if false;
    }

    /* Naam reservation — ek naam sirf ek device ka.
       Document id = naam (lowercase) */
    match /lb_names/{nick} {
      allow read: if true;

      /* Sirf khaali document par naya naam claim ho sakta hai,
         ya apna hi purana naam dobara likha ja sake */
      allow create: if
        request.resource.data.keys().hasOnly(['deviceId','createdAt'])
        && request.resource.data.deviceId is string
        && request.resource.data.deviceId.size() >= 8
        && request.resource.data.createdAt == request.time;

      allow update: if
        resource.data.deviceId == request.resource.data.deviceId;

      allow delete: if false;
    }
  }
}
```

4. **"Publish"** par click karo (button upar-right mein hai)

**✅ Rules verify ho gaye (17 Nov 2026).** Live test ke results:

| Test | Result |
|---|---|
| Leaderboard padhna (public read) | ✅ 200 |
| Valid score likhna | ✅ 200 |
| Naam mein galat character (`Bad!!Name`) | ✅ 403 (block) |
| `bestPct` = 150 | ✅ 403 (block) |
| Dusre ka deviceId use karna | ✅ 403 (block) |
| Koi bhi document delete karna | ✅ 403 (block) |
| Top-5 query by scope | ⚠️ **index chahiye** (Step 4b) |

#### Step 4b — Composite index banao (ek baar ka kaam)

Leaderboard ka query `scope` se filter karke `bestPct` par sort karta hai.
Standard edition mein iske liye ek **composite index** chahiye. Ek baar
banao, phir hamesha chalega.

**Sabse aasan tarika:** ye link browser mein kholo:

```
https://console.firebase.google.com/v1/r/project/axomexam-leaderboard/firestore/indexes?create_composite=ClZwcm9qZWN0cy9heG9tZXhhbS1sZWFkZXJib2FyZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbGJfc2NvcmVzL2luZGV4ZXMvXxABGgkKBXNjb3BlEAEaCwoHYmVzdFBjdBACGgwKCF9fbmFtZV9fEAI
```

Firebase khud fields bhar dega — bas **"Create index"** par click karo.

**Ya manually:**

1. Firestore Database → **Indexes** tab → **"Create index"**
2. Collection ID: **`lb_scores`**
3. Pehla field: **`scope`** → Ascending
4. Doosra field: **`bestPct`** → **Descending**
5. Query scope: **Collection**
6. **Create** → 1-2 minute wait (status "Building" → "Enabled")

> Index ban raha hai jab tak, leaderboard khaali dikhega — ye normal hai.

#### Step 4c — Test documents hata do

Rules verify karte waqt maine 3 test documents banaye (device `d_testdevice1234`).
Ye hatane padenge, warna leaderboard par "TestUser" dikhega:

```
lb_scores/d_testdevice1234__gk-assam-history
lb_scores/d_testdevice1234__gk~assam-history
lb_scores/d_testdevice1234__math-arithmetic
```

**Kaise hatao:** Firestore → **Data** tab → `lb_scores` → teeno documents
par **⋮ → Delete document**. (Rules ki wajah se client se delete nahi hota,
isliye console se karna padega.)

> **Doc ID ka rule (code ke liye):** Firestore doc ID mein `/` allowed nahi
> hota, isliye code `gk/assam-history` ko **`gk-assam-history`** karke likhega
> (bas `/` ko `-` se badalna). `scope` **field** mein pura `gk/assam-history`
> hi rahega.

**Ye rules kya karti hain:**
- Sab log leaderboard **padh** sakte hain
- Koi bhi likh sakta hai, par **sirf sahi shape ka data** (naam 20 character
  se kam, score total se zyada nahi, time server ka)
- Koi delete nahi kar sakta
- Ye cheating ko **kam** karti hain (poora nahi rok sakti — isliye isko
  "practice ranking" bolna hai)

#### Step 5 — App Check (optional, par recommended)

Ye bots ko rokta hai. Baad mein bhi kar sakte ho, pehle sab chal jaane do.

1. Left menu (ya search bar) → **"App Check"**
2. Web app ke liye **reCAPTCHA v3** chuno
3. reCAPTCHA site key lo (Google se) aur daalo
4. Enforce karo

Filhaal **skip kar sakte ho**.

---

### Setup progress (owner tick kare)

| Step | Kaam | Status |
|---|---|---|
| 0 | Google account | ✅ |
| 1 | Firebase project banaya | ✅ |
| 2 | Firestore database (Standard + default + asia-south1) | ✅ |
| 3 | Web app register + `firebaseConfig` bheja | ✅ **ho gaya** |
| 4 | Security rules publish karo | ⏳ **ab yahi karna hai** |
| 5 | App Check | `todo` (optional) |

**Config aa gaya** aur `js/firebase-config.js` mein rakh diya gaya. Verify bhi
ho gaya ki project + Firestore API reachable hain:

- Project: `axomexam-leaderboard`
- Database: `(default)` — free quota wala ✅
- Abhi read `403 Missing or insufficient permissions` de raha hai — **ye
  sahi hai**, kyunki rules abhi default (`allow read: if false`) hain.
  Step 4 mein rules publish karne ke baad ye chalu ho jayega.

Step 4 ke baad agent ko **3 jawab** chahiye (checklist dekho).

### Mujhe kya-kya chahiye (checklist)

Aap ye 3 cheezein bhejo (config aa gaya):

| # | Kya chahiye | Kahan se milega |
|---|---|---|
| 1 | ~~`firebaseConfig`~~ | ✅ **mil gaya** |
| 2 | ~~Naam / nickname~~ | ✅ **sirf naam** (decide ho gaya) |
| 3 | ~~Leaderboard exam-wise ya ek?~~ | ✅ **26 sub-categories** (decide ho gaya) |
| 4 | ~~Graph kis cheez ka?~~ | ✅ **topic-wise accuracy** (decide ho gaya) |

**Sab decide ho gaya.** Ab bas Step 4 (rules publish) baaki hai.

### ⚠️ Ye cheezein mujhe NAHI bhejni (security)

Ye **secret** hote hain — inhe kisi ko na do, chat mein na likho:

- ❌ **Service account JSON** (private key wali file)
- ❌ Koi bhi file jisme `"private_key"` likha ho
- ❌ Database password / admin credentials
- ❌ Firebase ke **"Project settings → Service accounts"** se koi key

Sirf **Step 3 ka `firebaseConfig`** chahiye. Wo public hota hai — usse koi
nuksan nahi ho sakta.

### Kharcha kitna hoga?

- Step 1-5 tak: **₹0**
- Free (Spark) plan: **20,000 writes + 50,000 reads per din**
- Card ki zaroorat **nahi** — to paisa apne aap **nahi** katega
- Limit cross ho jaye to bas us din ka data ruk jayega, site chalti rahegi

### Owner ke decisions (final — 17 Nov 2026)

| Sawaal | Decision |
|---|---|
| Naam | **Sirf naam** — koi nickname nahi |
| Naam unique? | **Haan — har user ka alag** |
| Leaderboard exam-wise ya ek? | **26 sub-categories** (topic-wise) |
| Graph kis cheez ka? | **Topic-wise accuracy** |
| Data kitne din? | **Lifetime** (best score rakha jayega) |
| Rate limit | **20 leaderboard posts/din** (mock test unlimited) |
| Backend | **Firebase Firestore, Standard edition, free plan** |

### Ab kaam ka order (agent ke liye)

1. ✅ Step 1-3: Firebase project + Firestore + config — **ho gaya**
2. ⏳ Step 4: Rules publish — **owner kar raha hai**
3. Phir agent: popup + naam + device-id + leaderboard + rank + graph

### Build rules jo yaad rakhni hain

- Source edit karo: `js/app.src.js`, `js/i18n.src.js`, `js/config.src.js`
- `js/firebase-config.js` **static** rahegi (minify/stamp list mein nahi daalni)
- Build: `optimize-render-path.js` → `minify-assets.js` → `stamp-assets.js`
- Push: `tools/safe-push.sh origin main` (force push kabhi nahi)
- UI change nahi karni; content nahi khona; `/as/` par ads nahi
- `localStorage` keys: `axomexam-device-id`, `axomexam-name`, `axomexam-mock-history`

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
