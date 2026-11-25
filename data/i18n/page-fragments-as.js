"use strict";

const fs = require("fs");
const path = require("path");

/*
 * Assamese for the Current Affairs hub page.
 *
 * The hub was the one page in the section still mostly English on its Assamese
 * URL: the study panel written by tools/enrich-hub-study.js and the editorial
 * block written by scripts/build-current-affairs-content.js are both English
 * only, so /as/current-affairs/ read 82% English. The fifteen category pages
 * were already fine at 18-30%, which is the English half of bilingual questions.
 *
 * Keys are whole sentences as they appear in the page; values are their
 * Assamese. tools/translate-twin-phrases.js applies them to the committed page
 * and tools/build-as-twins.js applies them to a rebuilt twin, so the two stay
 * in step. Whole sentences only, so a sentence that quotes English inside a
 * question is never touched.
 */

const ROUTES = {
  "current-affairs":   [
    [
      "Current affairs for Assam competitive exams",
      "অসমৰ প্ৰতিযোগিতামূলক পৰীক্ষাৰ বাবে চলিত ঘটনাৱলী"
    ],
    [
      "axomexam keeps a question bank of exam-relevant current affairs for ADRE, Assam Police, APSC, SSC and Railway papers: 15 areas and 2,640 questions in all. The bank covers events from 2024 and 2025, the period most state recruitment papers currently draw on. Each item is bilingual and written the way it is asked in the exam rather than as a news summary.",
      "axomexam য়ে ADRE, অসম আৰক্ষী, APSC, SSC আৰু ৰে'লৱে প্ৰশ্নকাকতৰ বাবে পৰীক্ষা-সংশ্লিষ্ট চলিত ঘটনাৱলীৰ প্ৰশ্ন-ভঁৰাল ৰাখে: মুঠ ১৫ টা শাখা আৰু ২,৬৪০ টা প্ৰশ্ন। এই ভঁৰালত ২০২৪ আৰু ২০২৫ চনৰ ঘটনা সন্নিবিষ্ট, যিটো সময়সীমাৰ পৰাই ৰাজ্যিক নিযুক্তি পৰীক্ষাৰ বেছিভাগ প্ৰশ্নকাকত প্ৰশ্ন লয়। প্ৰতিটো প্ৰশ্ন দ্বিভাষিক আৰু বাতৰিৰ সাৰাংশ হিচাপে নহয়, পৰীক্ষাত যেনেকৈ সোধা হয় তেনেকৈয়ে লিখা হৈছে।"
    ],
    [
      "Read the monthly notes once, then attempt the questions on the same page.",
      "মাহেকীয়া টোকা এবাৰ পঢ়ক, তাৰ পিছত একেই পৃষ্ঠাৰ প্ৰশ্নবোৰৰ উত্তৰ দিয়ক।"
    ],
    [
      "Focus on awards, appointments, schemes and Assam-specific events, which repeat every year.",
      "বঁটা, নিযুক্তি, আঁচনি আৰু অসম-নিৰ্দিষ্ট ঘটনাবোৰত গুৰুত্ব দিয়ক, কাৰণ এইবোৰ প্ৰতি বছৰে পুনৰাবৃত্তি হয়।"
    ],
    [
      "Revise the last six months before the exam rather than the whole year.",
      "পৰীক্ষাৰ আগতে গোটেই বছৰৰ পৰিৱৰ্তে শেষ ছমাহ পুনৰালোচনা কৰক।"
    ],
    [
      "Link each event to the static topic it belongs to, so it is easier to remember.",
      "প্ৰতিটো ঘটনা সেইটোৱে অন্তৰ্গত স্থিৰ বিষয়টোৰ সৈতে সংযোগ কৰক, তেতিয়া মনত ৰখা সহজ হয়।"
    ],
    [
      "It covers 15 areas, including Sports, Awards &amp; Honours, Important Days &amp; Themes, Books &amp; Authors, Appointments &amp; Resignations, Science &amp; Technology and more, with 2,640 bilingual questions.",
      "ইয়াত ক্ৰীড়া, বঁটা আৰু সন্মান, গুৰুত্বপূৰ্ণ দিৱস আৰু থিম, গ্ৰন্থ আৰু লেখক, নিযুক্তি আৰু পদত্যাগ, বিজ্ঞান আৰু প্ৰযুক্তি আদি মুঠ ১৫ টা শাখা আছে, ২,৬৪০ টা দ্বিভাষিক প্ৰশ্নৰ সৈতে।"
    ],
    [
      "How far back should I revise current affairs?",
      "চলিত ঘটনাৱলী কিমান পুৰণিলৈকে পুনৰালোচনা কৰিব লাগে?"
    ],
    [
      "Most papers draw on the last six to twelve months, so a six-month revision with regular updates works well.",
      "বেছিভাগ প্ৰশ্নকাকতে শেষ ছমাহৰ পৰা বাৰ মাহলৈকে ঘটনাৰ পৰা প্ৰশ্ন লয়, গতিকে নিয়মীয়া আপডেটৰ সৈতে ছমাহৰ পুনৰালোচনা ভাল ফল দিয়ে।"
    ],
    [
      "Yes. Every note and question on axomexam.in is free, with no login.",
      "হয়। axomexam.in ৰ প্ৰতিটো টোকা আৰু প্ৰশ্ন বিনামূলীয়া, লগইনৰ প্ৰয়োজন নাই।"
    ],
    [
      "Free Current Affairs for Assam and Central Government Exams",
      "অসম আৰু কেন্দ্ৰীয় চৰকাৰৰ পৰীক্ষাৰ বাবে বিনামূলীয়া চলিত ঘটনাৱলী"
    ],
    [
      "Current affairs is the section that separates an average score from a competitive one in almost every Assam recruitment examination. ADRE Grade 3 and Grade 4, Assam Police Constable and Sub-Inspector, APSC CCE, Gauhati High Court, DHS, DME, SSC and Railway papers all include a current affairs or general awareness block, and the questions are drawn from the events of the last twelve to eighteen months.",
      "চলিত ঘটনাৱলী হৈছে অসমৰ প্ৰায় প্ৰতিখন নিযুক্তি পৰীক্ষাত সাধাৰণ স্ক'ৰ আৰু প্ৰতিযোগিতামূলক স্ক'ৰৰ মাজৰ পাৰ্থক্য গঢ়ি তোলা শাখা। ADRE গ্ৰেড ৩ আৰু গ্ৰেড ৪, অসম আৰক্ষী কনিষ্টবল আৰু উপ-পৰিদৰ্শক, APSC CCE, গুৱাহাটী উচ্চ ন্যায়ালয়, DHS, DME, SSC আৰু ৰে'লৱেৰ প্ৰশ্নকাকত — সকলোতে চলিত ঘটনাৱলী বা সাধাৰণ জ্ঞানৰ এটা অংশ থাকে, আৰু প্ৰশ্নবোৰ শেষ বাৰৰ পৰা আঠাৰ মাহৰ ভিতৰৰ ঘটনাৰ পৰা লোৱা হয়।"
    ],
    [
      "Axomexam keeps this library organised into focused sections such as sports, awards and honours, important days and themes, appointments and resignations, science and technology, state current affairs, national affairs, defence and security, economy and banking, international affairs, environment and ecology, summits and conferences, books and authors, rankings and reports, and obituaries. Every question is bilingual, carries the correct answer and a short explanation, and is refreshed as new events take place.",
      "axomexam য়ে এই পুথিভঁৰালখন ক্ৰীড়া, বঁটা আৰু সন্মান, গুৰুত্বপূৰ্ণ দিৱস আৰু থিম, নিযুক্তি আৰু পদত্যাগ, বিজ্ঞান আৰু প্ৰযুক্তি, ৰাজ্যিক পৰিক্ৰমা, ৰাষ্ট্ৰীয় পৰিক্ৰমা, প্ৰতিৰক্ষা আৰু নিৰাপত্তা, অৰ্থনীতি আৰু বেংকিং, আন্তঃৰাষ্ট্ৰীয় পৰিক্ৰমা, পৰিৱেশ আৰু জৈৱ-বৈচিত্ৰ্য, শীৰ্ষ সন্মিলন আৰু বৈঠক, গ্ৰন্থ আৰু লেখক, সূচক আৰু প্ৰতিবেদন, আৰু শোকবাৰ্তাৰ দৰে নিৰ্দিষ্ট শাখাত সংগঠিত কৰি ৰাখে। প্ৰতিটো প্ৰশ্ন দ্বিভাষিক, শুদ্ধ উত্তৰ আৰু চমু ব্যাখ্যাৰ সৈতে, আৰু নতুন ঘটনাৰ সৈতে আপডেট কৰা হয়।"
    ],
    [
      "How current affairs is asked in Assam exams",
      "অসমৰ পৰীক্ষাত চলিত ঘটনাৱলী কেনেকৈ সোধা হয়"
    ],
    [
      "Most papers ask direct, factual questions rather than opinion-based ones. A typical question names an event, a person, a place, a scheme or a rank and expects a single correct answer. Because the examiners rarely go beyond the headlines of the year, a candidate who revises the major events systematically can attempt almost the entire section with confidence. Static portions such as books and authors, important days and themes, and appointments overlap heavily with the current affairs paper, so revising them serves double duty.",
      "বেছিভাগ প্ৰশ্নকাকতে মতামতভিত্তিক নহয়, পোনপটীয়া তথ্যভিত্তিক প্ৰশ্ন সোধা হয়। সাধাৰণ প্ৰশ্নত এটা ঘটনা, এজন ব্যক্তি, এখন ঠাই, এটা আঁচনি বা এটা স্থানৰ নাম দিয়া হয় আৰু এটাই শুদ্ধ উত্তৰ বিচৰা হয়। পৰীক্ষকে বছৰটোৰ শিৰোনামৰ বাহিৰলৈ বিৰলেহে যায়, গতিকে প্ৰধান ঘটনাবোৰ ক্ৰমাগতভাৱে পুনৰালোচনা কৰা প্ৰাৰ্থীয়ে আত্মবিশ্বাসেৰে প্ৰায় গোটেই শাখাটোৰ উত্তৰ দিব পাৰে। গ্ৰন্থ আৰু লেখক, গুৰুত্বপূৰ্ণ দিৱস আৰু থিম, আৰু নিযুক্তিৰ দৰে স্থিৰ অংশই চলিত ঘটনাৱলীৰ প্ৰশ্নকাকতৰ সৈতে যথেষ্ট ওপৰত পৰে, গতিকে সেইবোৰ পুনৰালোচনা কৰিলে দুটা কাম একেলগে হয়।"
    ],
    [
      "Sports and Awards and Honours — tournaments, winners, records and national and international honours.",
      "ক্ৰীড়া, আৰু বঁটা আৰু সন্মান — প্ৰতিযোগিতা, বিজেতা, অভিলেখ আৰু ৰাষ্ট্ৰীয়-আন্তঃৰাষ্ট্ৰীয় সন্মান।"
    ],
    [
      "Important Days and Themes — the day, its date and the official theme of the year.",
      "গুৰুত্বপূৰ্ণ দিৱস আৰু থিম — দিৱস, তাৰ তাৰিখ আৰু বছৰটোৰ চৰকাৰী থিম।"
    ],
    [
      "Books and Authors and Obituaries — newly released books, their writers, and the contributions of noted personalities who passed away.",
      "গ্ৰন্থ আৰু লেখক, আৰু শোকবাৰ্তা — শেহতীয়াকৈ প্ৰকাশিত গ্ৰন্থ, তেওঁলোকৰ লেখক, আৰু প্ৰয়াত বিশিষ্ট ব্যক্তিৰ অৱদান।"
    ],
    [
      "Appointments and Resignations — who holds which constitutional, government, corporate and international post.",
      "নিযুক্তি আৰু পদত্যাগ — কোনে কোনটো সাংবিধানিক, চৰকাৰী, নিগমৰ আৰু আন্তঃৰাষ্ট্ৰীয় পদত আছে।"
    ],
    [
      "National, State and International Affairs — governance, schemes, Assam and North-East developments, and world events.",
      "ৰাষ্ট্ৰীয়, ৰাজ্যিক আৰু আন্তঃৰাষ্ট্ৰীয় পৰিক্ৰমা — শাসন, আঁচনি, অসম আৰু উত্তৰ-পূৰ্বাঞ্চলৰ উন্নয়ন, আৰু বিশ্বৰ ঘটনা।"
    ],
    [
      "Science and Technology, Defence and Security, Economy and Banking, Environment and Ecology, and Summits and Conferences.",
      "বিজ্ঞান আৰু প্ৰযুক্তি, প্ৰতিৰক্ষা আৰু নিৰাপত্তা, অৰ্থনীতি আৰু বেংকিং, পৰিৱেশ আৰু জৈৱ-বৈচিত্ৰ্য, আৰু শীৰ্ষ সন্মিলন আৰু বৈঠক।"
    ],
    [
      "Rankings, Reports and Indices — country and state positions in global reports and indices.",
      "সূচক আৰু প্ৰতিবেদন — বিশ্বৰ প্ৰতিবেদন আৰু সূচকত দেশ আৰু ৰাজ্যৰ স্থান।"
    ],
    [
      "How to prepare current affairs without wasting time",
      "সময় নষ্ট নকৰাকৈ চলিত ঘটনাৱলীৰ প্ৰস্তুতি কেনেকৈ ল'ব"
    ],
    [
      "Fix one revision slot every day and read only the day's major headlines, not everything.",
      "প্ৰতিদিনে পুনৰালোচনাৰ বাবে এটা নিৰ্দিষ্ট সময় নিৰ্ধাৰণ কৰক আৰু দিনটোৰ প্ৰধান শিৰোনামহে পঢ়ক, সকলো নহয়।"
    ],
    [
      "Note the fact in one line with the who, what, where and when, and revise your notes weekly.",
      "তথ্যটো কোনে, কি, ক'ত আৰু কেতিয়া — এই চাৰিটাৰ সৈতে এশাৰীত টুকি লওক, আৰু সপ্তাহে সপ্তাহে টোকা পুনৰালোচনা কৰক।"
    ],
    [
      "Practise the question sets section by section instead of reading passively.",
      "নিষ্ক্ৰিয়ভাৱে পঢ়াৰ পৰিৱৰ্তে শাখা অনুসৰি প্ৰশ্ন-সংহতিত অনুশীলন কৰক।"
    ],
    [
      "Pay extra attention to Assam and North-East news, because state exams give it heavy weight.",
      "অসম আৰু উত্তৰ-পূৰ্বাঞ্চলৰ বাতৰিত বিশেষ গুৰুত্ব দিয়ক, কাৰণ ৰাজ্যিক পৰীক্ষাত ইয়াৰ ওজন বেছি।"
    ],
    [
      "Revise important days and themes, awards and appointments in the final month as they are pure memory questions.",
      "শেষ মাহত গুৰুত্বপূৰ্ণ দিৱস আৰু থিম, বঁটা আৰু নিযুক্তি পুনৰালোচনা কৰক, কাৰণ এইবোৰ সম্পূৰ্ণ স্মৃতি-ভিত্তিক প্ৰশ্ন।"
    ],
    [
      "Attempt a monthly current affairs mock test to check what you have actually retained.",
      "প্ৰকৃততে কিমান মনত ৰৈছে পৰীক্ষা কৰিবলৈ মাহেকীয়া চলিত ঘটনাৱলীৰ মক টেষ্ট এটা দিয়ক।"
    ],
    [
      "Unlike mathematics or reasoning, current affairs cannot be mastered in a single week. It grows with you. Fifteen focused minutes a day across a few months is far more effective than trying to memorise a year of events in the last ten days. The sections on axomexam are built to support exactly this habit: short sets, clear answers and explanations that tell you why a fact is important, so that revision stays quick and regular.",
      "গণিত বা যুক্তিৰ দৰে চলিত ঘটনাৱলী এক সপ্তাহতে আয়ত্ত কৰিব নোৱাৰি। ই আপোনাৰ সৈতে বাঢ়ি যায়। কেইমাহমান ধৰি দিনে পোন্ধৰ মিনিট মনোযোগেৰে পঢ়া — শেষৰ দহ দিনত বছৰটোৰ ঘটনা মুখস্থ কৰাতকৈ বহু বেছি ফলপ্ৰসূ। axomexam ৰ শাখাবোৰ ঠিক এই অভ্যাসটোকে সহায় কৰিবলৈ সজা: চুটি সংহতি, স্পষ্ট উত্তৰ, আৰু এটা তথ্য কিয় গুৰুত্বপূৰ্ণ তাক কোৱা ব্যাখ্যা — যাতে পুনৰালোচনা দ্ৰুত আৰু নিয়মীয়া থাকে।"
    ],
    [
      "Which current affairs sections are most important for ADRE and Assam Police?",
      "ADRE আৰু অসম আৰক্ষীৰ বাবে কোনবোৰ চলিত ঘটনাৱলীৰ শাখা আটাইতকৈ গুৰুত্বপূৰ্ণ?"
    ],
    [
      "Sports, awards and honours, appointments and resignations, important days and themes, national affairs and Assam state current affairs carry the most questions. They are also the fastest to revise because the questions are direct and factual.",
      "ক্ৰীড়া, বঁটা আৰু সন্মান, নিযুক্তি আৰু পদত্যাগ, গুৰুত্বপূৰ্ণ দিৱস আৰু থিম, ৰাষ্ট্ৰীয় পৰিক্ৰমা আৰু অসম ৰাজ্যিক পৰিক্ৰমাত সৰ্বাধিক প্ৰশ্ন থাকে। এইবোৰ পুনৰালোচনা কৰাও আটাইতকৈ দ্ৰুত, কাৰণ প্ৰশ্নবোৰ পোনপটীয়া আৰু তথ্যভিত্তিক।"
    ],
    [
      "How old should current affairs be for the exam?",
      "পৰীক্ষাৰ বাবে চলিত ঘটনাৱলী কিমান পুৰণি হ'ব লাগে?"
    ],
    [
      "Prepare the last twelve to eighteen months thoroughly, with extra focus on the six months immediately before the exam. Older events matter mainly if they are linked to a scheme, an award or a continuing policy.",
      "শেষ বাৰৰ পৰা আঠাৰ মাহ ভালদৰে প্ৰস্তুতি কৰক, পৰীক্ষাৰ ঠিক আগৰ ছমাহত বিশেষ গুৰুত্ব দি। পুৰণি ঘটনা মূলতঃ তেতিয়াহে গুৰুত্বপূৰ্ণ যেতিয়া সেয়া কোনো আঁচনি, বঁটা বা চলি থকা নীতিৰ সৈতে জড়িত।"
    ],
    [
      "Are the current affairs questions free on axomexam?",
      "axomexam ত চলিত ঘটনাৱলীৰ প্ৰশ্নবোৰ বিনামূলীয়া নেকি?"
    ],
    [
      "Yes. Every question, answer and explanation in the current affairs library is free. There is no login, subscription or payment of any kind.",
      "হয়। চলিত ঘটনাৱলীৰ পুথিভঁৰালৰ প্ৰতিটো প্ৰশ্ন, উত্তৰ আৰু ব্যাখ্যা বিনামূলীয়া। কোনো লগইন, ছাবস্ক্ৰিপশ্বন বা পেমেন্ট নাই।"
    ],
    [
      "Yes. All questions and explanations are bilingual. You can switch between Assamese and English at any time so the same fact is reinforced in both languages.",
      "হয়। সকলো প্ৰশ্ন আৰু ব্যাখ্যা দ্বিভাষিক। আপুনি যিকোনো সময়ত অসমীয়া আৰু ইংৰাজীৰ মাজত সলনি কৰিব পাৰে, যাতে একেই তথ্য দুয়ো ভাষাত দৃঢ় হয়।"
    ],
    [
      "How often is the current affairs library updated?",
      "চলিত ঘটনাৱলীৰ পুথিভঁৰাল কিমান সঘনে আপডেট হয়?"
    ],
    [
      "New questions are added as important events take place, and each section carries the date it was last updated so you always know how fresh the material is.",
      "গুৰুত্বপূৰ্ণ ঘটনা সংঘটিত হ'লে নতুন প্ৰশ্ন যোগ কৰা হয়। এই পুথিভঁৰালখন দৈনিক বাতৰিৰ প্ৰবাহ নহয়, ২০২৪ আৰু ২০২৫ চনৰ ঘটনাৰ পুনৰালোচনাৰ সংগ্ৰহ — গতিকে ঘটনাটো কেতিয়া ঘটিছিল জানিবলৈ প্ৰতিটো প্ৰশ্নৰ ব্যাখ্যাত চাওক।"
    ],
    [
      "Is one month enough to prepare current affairs?",
      "চলিত ঘটনাৱলীৰ প্ৰস্তুতিৰ বাবে এটা মাহ যথেষ্ট নেকি?"
    ],
    [
      "One month is enough for a focused revision if you already follow the news, but for a first-time preparation three to four months of daily short revision works much better.",
      "যদি আপুনি ইতিমধ্যে বাতৰি অনুসৰণ কৰে, তেন্তে কেন্দ্ৰীভূত পুনৰালোচনাৰ বাবে এটা মাহ যথেষ্ট; কিন্তু প্ৰথমবাৰ প্ৰস্তুতি ল'লে তিনি-চাৰি মাহ দৈনিক চুটি পুনৰালোচনা কৰিলে বহু ভাল ফল দিয়ে।"
    ],
    [
      "What the current affairs section covers",
      "চলিত ঘটনাৱলী শাখাই কি সামৰি লয়"
    ],
    [
      "How to revise current affairs",
      "চলিত ঘটনাৱলী কেনেকৈ পুনৰালোচনা কৰিব"
    ],
    [
      "Explore other current affairs sections",
      "আন চলিত ঘটনাৱলীৰ শাখাসমূহ চাওক"
    ],
    [
      "Frequently Asked Questions",
      "অধিক সোধা প্ৰশ্ন"
    ],
    [
      "Can I read current affairs in Assamese?",
      "চলিত ঘটনাৱলী অসমীয়াত পঢ়িব পাৰিনে?"
    ],
    [
      "the current affairs section ত কি কি সামৰি লোৱা হৈছে?",
      "চলিত ঘটনাৱলী শাখাত কি কি সামৰি লোৱা হৈছে?"
    ],
    [
      "current affairs ৰ সমল বিনামূলীয়া নেকি?",
      "চলিত ঘটনাৱলীৰ সমল বিনামূলীয়া নেকি?"
    ]
  ],
};


/* The seven category hubs already carry a hand-written Assamese description in
   data/categories.json, but the twin builder only ever read the English half, so
   /as/category/math/ and its six siblings opened in English. Both halves have
   the same number of paragraphs, so they pair one to one. */
const CATEGORIES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "data", "categories.json"), "utf8")
);

const escapeHtml = (s) => s.replace(/&(?![a-zA-Z]+;|#\d+;)/g, "&amp;");

const DESCRIPTIONS = {};
for (const cat of CATEGORIES.categories || []) {
  const desc = cat.description || {};
  const split = (v) => String(v || "").split("\n\n").map((p) => p.trim()).filter(Boolean);
  const en = split(desc.en);
  const as = split(desc.as);
  if (!en.length || en.length !== as.length) continue;
  DESCRIPTIONS["category/" + cat.id] = en.map((p, i) => [escapeHtml(p), escapeHtml(as[i])]);
}

function applyRoute(rel, html) {
  const pairs = ROUTES[rel || ""];
  const desc = DESCRIPTIONS[rel || ""] || [];
  if (!pairs && !desc.length) return { html, count: 0 };
  let n = 0;
  for (const [en, as] of (pairs || []).concat(desc)) {
    const parts = html.split(en);
    if (parts.length > 1) {
      n += parts.length - 1;
      html = parts.join(as);
    }
  }
  return { html, count: n };
}


/* The site footer is the same markup on every page and was English on all
   1,492 Assamese pages. Scoped to <footer> so short labels such as "Home" or
   "Disclaimer" cannot be swapped inside a question or a breadcrumb. */
const FOOTER = [
  [
    "<h4 data-i18n=\"footer.quick\">Quick Links</h4>",
    "<h4 data-i18n=\"footer.quick\">তৎক্ষণিক লিংক</h4>"
  ],
  [
    "<a href=\"/as/\" data-i18n=\"footer.home\">Home</a>",
    "<a href=\"/as/\" data-i18n=\"footer.home\">মুখ্য পৃষ্ঠা</a>"
  ],
  [
    "<a href=\"/as/current-affairs/\">Free Current Affairs</a>",
    "<a href=\"/as/current-affairs/\">বিনামূলীয়া চলিত ঘটনাৱলী</a>"
  ],
  [
    "<a href=\"/as/editorial-policy/\" class=\"axo-editorial-link\">Editorial Policy</a>",
    "<a href=\"/as/editorial-policy/\" class=\"axo-editorial-link\">সম্পাদকীয় নীতি</a>"
  ],
  [
    "<a href=\"/as/editorial-team/\" class=\"axo-editorial-link\">Editorial Team</a>",
    "<a href=\"/as/editorial-team/\" class=\"axo-editorial-link\">সম্পাদকীয় দল</a>"
  ],
  [
    "<a href=\"/as/sources/\" class=\"axo-editorial-link\">Official Sources</a>",
    "<a href=\"/as/sources/\" class=\"axo-editorial-link\">চৰকাৰী উৎস</a>"
  ],
  [
    "<a href=\"/as/updates/\" class=\"axo-editorial-link\">Content Updates</a>",
    "<a href=\"/as/updates/\" class=\"axo-editorial-link\">সমল আপডেট</a>"
  ],
  [
    "<a href=\"/as/exams/\" data-i18n=\"nav.exams\">Your Exams</a>",
    "<a href=\"/as/exams/\" data-i18n=\"nav.exams\">আপোনাৰ পৰীক্ষা</a>"
  ],
  [
    "<h4 data-i18n=\"footer.legal\">Legal &amp; Info</h4>",
    "<h4 data-i18n=\"footer.legal\">আইনী আৰু তথ্য</h4>"
  ],
  [
    "<a href=\"/as/about/\" data-i18n=\"footer.about\">About Us</a>",
    "<a href=\"/as/about/\" data-i18n=\"footer.about\">আমাৰ বিষয়ে</a>"
  ],
  [
    "<a href=\"/as/contact/\" data-i18n=\"footer.contact\">Contact Us</a>",
    "<a href=\"/as/contact/\" data-i18n=\"footer.contact\">যোগাযোগ কৰক</a>"
  ],
  [
    "<a href=\"/as/privacy/\">Privacy Policy</a>",
    "<a href=\"/as/privacy/\">গোপনীয়তা নীতি</a>"
  ],
  [
    "<a href=\"/as/terms/\">Terms &amp; Conditions</a>",
    "<a href=\"/as/terms/\">নিয়ম আৰু চৰ্তাৱলী</a>"
  ],
  [
    "<a href=\"/as/disclaimer/\">Disclaimer</a>",
    "<a href=\"/as/disclaimer/\">দায়মুক্তি</a>"
  ],
  [
    "<p id=\"footer-tagline\" class=\"footer-tagline\">Comprehensive Preparation Portal for Assam Competitive Exams</p>",
    "<p id=\"footer-tagline\" class=\"footer-tagline\">অসমৰ প্ৰতিযোগিতামূলক পৰীক্ষাসমূহৰ বাবে সম্পূৰ্ণ প্ৰস্তুতি প'ৰ্টেল</p>"
  ],
  [
    "<p class=\"footer-contact\">Contact: ",
    "<p class=\"footer-contact\">যোগাযোগ: "
  ],
  [
    "<span class=\"fbb-made\">Made for Assam Competitive Aspirants</span>",
    "<span class=\"fbb-made\">অসমৰ প্ৰতিযোগিতামূলক পৰীক্ষাৰ প্ৰাৰ্থীসকলৰ বাবে প্ৰস্তুত</span>"
  ],
  [
    "<span class=\"fbb-contact\">Contact us : ",
    "<span class=\"fbb-contact\">যোগাযোগ : "
  ],
  [
    ". All Rights Reserved.",
    ". সৰ্বস্বত্ব সংৰক্ষিত।"
  ]
];

function translateFooter(html) {
  const start = html.indexOf('<footer class="site-footer">');
  if (start < 0) return { html, count: 0 };
  const end = html.indexOf("</footer>", start);
  if (end < 0) return { html, count: 0 };
  let seg = html.slice(start, end);
  let n = 0;
  for (const [en, as] of FOOTER) {
    const parts = seg.split(en);
    if (parts.length > 1) {
      n += parts.length - 1;
      seg = parts.join(as);
    }
  }
  return { html: html.slice(0, start) + seg + html.slice(end), count: n };
}

/* Everything a twin needs beyond the generic phrase pass. */
function applyAll(rel, html) {
  const footer = translateFooter(html);
  const route = applyRoute(rel, footer.html);
  return { html: route.html, count: footer.count + route.count };
}

module.exports = { applyRoute, applyAll, translateFooter, ROUTES, FOOTER, DESCRIPTIONS };
