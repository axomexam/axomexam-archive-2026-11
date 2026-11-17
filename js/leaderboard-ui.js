(function(){"use strict";const c=window.AXOLeaderboard;function p(e){return document.getElementById(e)}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function i(e,t){try{const s=window.AXOApp,n=s&&s.tc||s&&s.t;if(typeof n=="function"){const a=n(e);if(a&&a!==e)return a}}catch{}return t||e}function g(){try{const e=window.AXOApp;return e&&typeof e.contentLang=="function"?e.contentLang()==="as"?"as":"en":e&&e.uiLang()==="as"?"as":"en"}catch{return"en"}}let y=!1;function E(e){let t=null,s=0;try{const a=window.AXOApp&&window.AXOApp.mock();if(a&&c&&c.resolveScope&&c.resolveScope(a.cat&&a.cat.id,a.subId)){t=c.resolveScope(a.cat.id,a.subId);let o=0;a.pool.forEach((d,r)=>{a.answers[r]===d.correct&&o++}),s=a.pool.length?Math.round(o/a.pool.length*100):0}}catch{t=null}if(!t||!c||!c.enabled()){e();return}try{c.recordAttempt(t,s)}catch{}const n=c.storedName();if(n){c.submitScore(t,s,n).catch(()=>{}),e();return}A(t,s,e)}function $(e,t,s){let n=!1;const a=()=>{n||(n=!0,s())};try{c.anonymousName().then(o=>o?c.submitScore(e,t,o):null).catch(()=>{}).then(a,a)}catch{a()}}function A(e,t,s){const n=document.createElement("div");n.className="lb-modal",n.id="lb-join-modal",n.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-join-title">
        <div class="lb-modal-ico">🏆</div>
        <h3 id="lb-join-title">${l(i("lb.join.title","Join the leaderboard?"))}</h3>
        <p>${l(i("lb.join.body","Your name will be shown on the leaderboard with your best score. You can skip this — your mock test will still run normally."))}</p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-join-skip" type="button">${l(i("lb.join.skip","Skip"))}</button>
          <button class="btn btn-primary" id="lb-join-yes" type="button">${l(i("lb.join.yes","Yes, add me"))}</button>
        </div>
      </div>`,document.body.appendChild(n);let a=!1;const o=()=>n.remove(),d=()=>{a||(a=!0,o(),s())};p("lb-join-skip").addEventListener("click",()=>{a||(o(),$(e,t,d))}),p("lb-join-yes").addEventListener("click",()=>{a||(o(),C(e,t,s))})}function C(e,t,s){const n=document.createElement("div");n.className="lb-modal",n.id="lb-name-modal",n.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-name-title">
        <div class="lb-modal-ico">✍️</div>
        <h3 id="lb-name-title">${l(i("lb.name.title","Enter your name"))}</h3>
        <p>${l(i("lb.name.body","This name will appear on the leaderboard."))}</p>
        <input class="lb-name-input" id="lb-name-input" type="text" maxlength="20"
               autocomplete="off" spellcheck="false" placeholder="${l(i("lb.name.ph","Your name"))}">
        <p class="lb-name-err" id="lb-name-err" role="alert"></p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-name-cancel" type="button">${l(i("lb.name.cancel","Cancel"))}</button>
          <button class="btn btn-primary" id="lb-name-save" type="button">${l(i("lb.name.save","Save and submit"))}</button>
        </div>
      </div>`,document.body.appendChild(n);const a=p("lb-name-input"),o=p("lb-name-err"),d=p("lb-name-save");setTimeout(()=>a.focus(),30);let r=!1;const h=()=>n.remove(),v=()=>{r||(r=!0,h(),s())};p("lb-name-cancel").addEventListener("click",()=>{r||(h(),$(e,t,v))});const f=(u,w)=>{o.textContent=i(u,w)},b=async()=>{if(y)return;const u=c.validateName(a.value);if(!u.ok){u.code==="short"?f("lb.name.short","Please enter at least 2 characters."):u.code==="long"?f("lb.name.long","Please keep the name within 20 characters."):u.code==="chars"?f("lb.name.chars","Only letters, numbers, spaces and underscore are allowed."):f("lb.name.bad","This name is not allowed. Please choose another."),a.focus();return}y=!0,d.disabled=!0,o.textContent="";try{if(!(await c.reserveName(u.name)).ok){f("lb.name.taken","This name is already taken. Please choose another.");return}const T=await c.submitScore(e,t,u.name);if(T.ok){c.storeName(u.name),v();return}if(T.code==="rate"){f("lb.name.rate","Daily leaderboard limit reached.");return}f("lb.name.err","Could not save right now. Please try again.")}catch{f("lb.name.err","Could not save right now. Please try again.")}finally{y=!1,d.disabled=!1}};d.addEventListener("click",b),a.addEventListener("keydown",u=>{u.key==="Enter"&&b()})}const m={subject:null,requestId:0};function I(){return c.SUBJECTS[0]&&c.SUBJECTS[0].id||"gk"}function B(e,t){const s=c.SUBJECTS.find(n=>n.id===e);return s?t==="as"?s.name.as:s.name.en:e}function k(e){return(c.SUBS[e]||[]).map(t=>({id:t[0],en:t[1],as:t[2]}))}function M(e,t){return t==="as"?e.as:e.en}function j(e){try{return new URLSearchParams(window.location.search).get(e)||""}catch{return""}}function H(){const e=j("subject");return c.SUBJECTS.some(t=>t.id===e)?e:null}function P(e,t){return`
      <div class="lb-subcard" id="lb-sub-${l(e.id)}">
        <div class="lb-subcard-head">
          <h2>${l(M(e,t))}</h2>
          <span class="lb-subcard-badge">${l(i("lb.top5","Top 5"))}</span>
        </div>
        <div class="lb-subcard-body" id="lb-board-${l(e.id)}">
          <div class="lb-skel">${l(i("lb.loading","Loading leaderboard…"))}</div>
        </div>
      </div>`}function q(){if(window.location.search)try{window.history.replaceState(null,null,window.location.pathname)}catch{}}function L(e){const t=g(),s=H();s&&(m.subject=s);const n=m.subject||I();m.subject=n,m.requestId++;const a=k(n);e.innerHTML=`
      <div class="page-head">
        <nav class="breadcrumb">
          <a href="/">${l(i("breadcrumb.home","Home"))}</a><span class="bc-sep">/</span><span>${l(i("lb.title","Leaderboard"))}</span>
        </nav>
        <h1>🏆 ${l(i("lb.title","Leaderboard"))}</h1>
        <p class="page-desc">${l(i("lb.sub",""))}</p>
      </div>

      <section class="lb-wrap">
        <div class="lb-tabs" id="lb-tabs" role="tablist" aria-label="${l(i("lb.subject","Subject"))}">
          ${c.SUBJECTS.map(r=>`
            <button type="button" role="tab" class="lb-tab${r.id===n?" active":""}"
              data-subject="${l(r.id)}" aria-selected="${r.id===n?"true":"false"}">
              ${l(t==="as"?r.name.as:r.name.en)}
            </button>`).join("")}
        </div>

        <div class="lb-boards" id="lb-boards">
          ${a.length?a.map(r=>P(r,t)).join(""):`<div class="lb-empty">${l(i("lb.empty","No scores here yet. Be the first to join!"))}</div>`}
        </div>

        <div class="lb-card lb-graphcard">
          <div class="lb-card-head">
            <h2>${l(i("lb.graphTitle","Your accuracy by sub-category"))}</h2>
          </div>
          <div id="lb-graph" class="lb-graph"></div>
        </div>
      </section>`;const o=p("lb-tabs");o&&Array.prototype.forEach.call(o.querySelectorAll(".lb-tab"),r=>{r.addEventListener("click",()=>{r.dataset.subject!==m.subject&&(q(),m.subject=r.dataset.subject,L(e))})}),a.forEach(r=>x(n,r,t)),J();const d=j("sub");if(d&&a.some(r=>r.id===d)){const r=p("lb-sub-"+d);if(r){r.classList.add("lb-subcard-target");const h=()=>{try{r.scrollIntoView({block:"center",behavior:"smooth"})}catch{}};typeof window.requestAnimationFrame=="function"?window.requestAnimationFrame(h):h()}}}async function x(e,t,s){const n=e+"/"+t.id,a=p("lb-board-"+t.id);if(!a)return;const o=m.requestId;try{const d=await c.fetchTop(n,5);if(o!==m.requestId)return;if(!d.ok){a.innerHTML=S();return}const r=c.deviceId(),h=d.rows.findIndex(b=>b.deviceId&&b.deviceId===r);let v="";if(h<0&&N(n)){const b=await c.fetchMyRank(n);if(o!==m.requestId)return;b&&b.ok&&b.rank>0&&(v=O(b.mine,b.rank,b.total,s))}const f=d.rows.length?d.rows.map((b,u)=>U(b,u+1,s,b.deviceId===r)).join(""):`<div class="lb-empty">${l(i("lb.empty","No scores here yet. Be the first to join!"))}</div>`;a.innerHTML=f+v}catch{if(o!==m.requestId)return;a.innerHTML=S()}}function N(e){try{const t=c.bestByScope();return!!t&&Object.prototype.hasOwnProperty.call(t,e)}catch{return!1}}function O(e,t,s,n){const a=t===1?"🥇":t===2?"🥈":t===3?"🥉":"";return`
      <div class="lb-myline">
        <span class="lb-myline-tag">${l(i("lb.you","Your rank"))}</span>
        <span class="lb-myline-rank">${a||"#"+t}</span>
        <span class="lb-myline-name">${l(e.name)}</span>
        <span class="lb-myline-score">${e.bestPct}%</span>
        ${s!=null?`<span class="lb-myline-of">${l(i("lb.of","of"))} ${s}</span>`:""}
      </div>`}function S(){return`<div class="lb-empty">${l(i("lb.error","Could not load the leaderboard right now."))}
      <button class="lb-retry" type="button" onclick="location.reload()">${l(i("lb.retry","Retry"))}</button></div>`}function U(e,t,s,n){return`
      <div class="lb-row${n?" lb-row-me":""}">
        <span class="lb-row-rank">${(t===1?"🥇":t===2?"🥈":t===3?"🥉":"")||"#"+t}</span>
        <span class="lb-row-name">${l(e.name)}</span>
        <span class="lb-row-score">${e.bestPct}%</span>
      </div>`}function J(){const e=p("lb-graph");if(!e)return;const t=g(),s=c.bestByScope(),n=[];if(c.SUBJECTS.forEach(o=>{k(o.id).forEach(d=>{const r=o.id+"/"+d.id;r in s&&n.push({scope:r,label:B(o.id,t)+" • "+(t==="as"?d.as:d.en),pct:s[r]})})}),!n.length){e.innerHTML=`<div class="lb-empty">${l(i("lb.graphEmpty","Attempt a few practice sets to see your accuracy graph."))}</div>`;return}n.sort((o,d)=>d.pct-o.pct);const a=n[n.length-1];e.innerHTML=`
      <div class="lb-bars">
        ${n.map(o=>`
          <div class="lb-bar-row">
            <span class="lb-bar-label" title="${l(o.label)}">${l(o.label)}</span>
            <span class="lb-bar-track">
              <span class="lb-bar-fill" style="width:${Math.max(2,o.pct)}%;--v:${o.pct}"></span>
            </span>
            <span class="lb-bar-val">${o.pct}%</span>
          </div>`).join("")}
      </div>
      <p class="lb-weak">${l(i("lb.graphWeak","Weakest"))}: <b>${l(a.label)}</b> — ${a.pct}%</p>`}window.AXOLeaderboardUI={beforeFinalSubmit:E,renderPage:L}})();
