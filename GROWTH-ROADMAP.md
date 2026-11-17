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
