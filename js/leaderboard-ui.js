(function(){"use strict";const r=window.AXOLeaderboard;function m(e){return document.getElementById(e)}function o(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function c(e,t){try{const s=window.AXOApp,l=s&&s.tc||s&&s.t;if(typeof l=="function"){const a=l(e);if(a&&a!==e)return a}}catch{}return t||e}function $(){try{const e=window.AXOApp;return e&&typeof e.contentLang=="function"?e.contentLang()==="as"?"as":"en":e&&e.uiLang()==="as"?"as":"en"}catch{return"en"}}let y=!1;function T(e){let t=null,s=0;try{const a=window.AXOApp&&window.AXOApp.mock();if(a&&r&&r.resolveScope&&r.resolveScope(a.cat&&a.cat.id,a.subId)){t=r.resolveScope(a.cat.id,a.subId);let n=0;a.pool.forEach((i,u)=>{a.answers[u]===i.correct&&n++}),s=a.pool.length?Math.round(n/a.pool.length*100):0}}catch{t=null}if(!t||!r||!r.enabled()){e();return}try{r.recordAttempt(t,s)}catch{}const l=r.storedName();if(l){r.submitScore(t,s,l).catch(()=>{}),e();return}E(t,s,e)}function w(e,t,s){let l=!1;const a=()=>{l||(l=!0,s())};try{r.anonymousName().then(n=>n?r.submitScore(e,t,n):null).catch(()=>{}).then(a,a)}catch{a()}}function E(e,t,s){const l=document.createElement("div");l.className="lb-modal",l.id="lb-join-modal",l.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-join-title">
        <div class="lb-modal-ico">🏆</div>
        <h3 id="lb-join-title">${o(c("lb.join.title","Join the leaderboard?"))}</h3>
        <p>${o(c("lb.join.body","Your name will be shown on the leaderboard with your best score. You can skip this — your mock test will still run normally."))}</p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-join-skip" type="button">${o(c("lb.join.skip","Skip"))}</button>
          <button class="btn btn-primary" id="lb-join-yes" type="button">${o(c("lb.join.yes","Yes, add me"))}</button>
        </div>
      </div>`,document.body.appendChild(l);let a=!1;const n=()=>l.remove(),i=()=>{a||(a=!0,n(),s())};m("lb-join-skip").addEventListener("click",()=>{a||(n(),w(e,t,i))}),m("lb-join-yes").addEventListener("click",()=>{a||(n(),A(e,t,s))})}function A(e,t,s){const l=document.createElement("div");l.className="lb-modal",l.id="lb-name-modal",l.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-name-title">
        <div class="lb-modal-ico">✍️</div>
        <h3 id="lb-name-title">${o(c("lb.name.title","Enter your name"))}</h3>
        <p>${o(c("lb.name.body","This name will appear on the leaderboard."))}</p>
        <input class="lb-name-input" id="lb-name-input" type="text" maxlength="20"
               autocomplete="off" spellcheck="false" placeholder="${o(c("lb.name.ph","Your name"))}">
        <p class="lb-name-err" id="lb-name-err" role="alert"></p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-name-cancel" type="button">${o(c("lb.name.cancel","Cancel"))}</button>
          <button class="btn btn-primary" id="lb-name-save" type="button">${o(c("lb.name.save","Save and submit"))}</button>
        </div>
      </div>`,document.body.appendChild(l);const a=m("lb-name-input"),n=m("lb-name-err"),i=m("lb-name-save");setTimeout(()=>a.focus(),30);let u=!1;const v=()=>l.remove(),h=()=>{u||(u=!0,v(),s())};m("lb-name-cancel").addEventListener("click",()=>{u||(v(),w(e,t,h))});const p=(b,g)=>{n.textContent=c(b,g)},d=async()=>{if(y)return;const b=r.validateName(a.value);if(!b.ok){b.code==="short"?p("lb.name.short","Please enter at least 2 characters."):b.code==="long"?p("lb.name.long","Please keep the name within 20 characters."):b.code==="chars"?p("lb.name.chars","Only letters, numbers, spaces and underscore are allowed."):p("lb.name.bad","This name is not allowed. Please choose another."),a.focus();return}y=!0,i.disabled=!0,n.textContent="";try{if(!(await r.reserveName(b.name)).ok){p("lb.name.taken","This name is already taken. Please choose another.");return}const S=await r.submitScore(e,t,b.name);if(S.ok){r.storeName(b.name),h();return}if(S.code==="rate"){p("lb.name.rate","Daily leaderboard limit reached.");return}p("lb.name.err","Could not save right now. Please try again.")}catch{p("lb.name.err","Could not save right now. Please try again.")}finally{y=!1,i.disabled=!1}};i.addEventListener("click",d),a.addEventListener("keydown",b=>{b.key==="Enter"&&d()})}const f={subject:null,requestId:0};function C(){return r.SUBJECTS[0]&&r.SUBJECTS[0].id||"gk"}function I(e,t){const s=r.SUBJECTS.find(l=>l.id===e);return s?t==="as"?s.name.as:s.name.en:e}function k(e){return(r.SUBS[e]||[]).map(t=>({id:t[0],en:t[1],as:t[2]}))}function M(e,t){return t==="as"?e.as:e.en}function B(e,t){return`
      <div class="lb-subcard">
        <div class="lb-subcard-head">
          <h2>${o(M(e,t))}</h2>
          <span class="lb-subcard-badge">${o(c("lb.top5","Top 5"))}</span>
        </div>
        <div class="lb-subcard-body" id="lb-board-${o(e.id)}">
          <div class="lb-skel">${o(c("lb.loading","Loading leaderboard…"))}</div>
        </div>
      </div>`}function j(e){const t=$(),s=f.subject||C();f.subject=s,f.requestId++;const l=k(s);e.innerHTML=`
      <div class="page-head">
        <nav class="breadcrumb">
          <a href="/">${o(c("breadcrumb.home","Home"))}</a><span class="bc-sep">/</span><span>${o(c("lb.title","Leaderboard"))}</span>
        </nav>
        <h1>🏆 ${o(c("lb.title","Leaderboard"))}</h1>
        <p class="page-desc">${o(c("lb.sub",""))}</p>
      </div>

      <section class="lb-wrap">
        <div class="lb-tabs" id="lb-tabs" role="tablist" aria-label="${o(c("lb.subject","Subject"))}">
          ${r.SUBJECTS.map(n=>`
            <button type="button" role="tab" class="lb-tab${n.id===s?" active":""}"
              data-subject="${o(n.id)}" aria-selected="${n.id===s?"true":"false"}">
              ${o(t==="as"?n.name.as:n.name.en)}
            </button>`).join("")}
        </div>

        <div class="lb-boards" id="lb-boards">
          ${l.length?l.map(n=>B(n,t)).join(""):`<div class="lb-empty">${o(c("lb.empty","No scores here yet. Be the first to join!"))}</div>`}
        </div>

        <div class="lb-card lb-graphcard">
          <div class="lb-card-head">
            <h2>${o(c("lb.graphTitle","Your accuracy by sub-category"))}</h2>
          </div>
          <div id="lb-graph" class="lb-graph"></div>
        </div>
      </section>`;const a=m("lb-tabs");a&&Array.prototype.forEach.call(a.querySelectorAll(".lb-tab"),n=>{n.addEventListener("click",()=>{n.dataset.subject!==f.subject&&(f.subject=n.dataset.subject,j(e))})}),l.forEach(n=>H(s,n,t)),O()}async function H(e,t,s){const l=e+"/"+t.id,a=m("lb-board-"+t.id);if(!a)return;const n=f.requestId;try{const i=await r.fetchTop(l,5);if(n!==f.requestId)return;if(!i.ok){a.innerHTML=L();return}const u=r.deviceId(),v=i.rows.findIndex(d=>d.deviceId&&d.deviceId===u);let h="";if(v<0&&x(l)){const d=await r.fetchMyRank(l);if(n!==f.requestId)return;d&&d.ok&&d.rank>0&&(h=N(d.mine,d.rank,d.total,s))}const p=i.rows.length?i.rows.map((d,b)=>P(d,b+1,s,d.deviceId===u)).join(""):`<div class="lb-empty">${o(c("lb.empty","No scores here yet. Be the first to join!"))}</div>`;a.innerHTML=p+h}catch{if(n!==f.requestId)return;a.innerHTML=L()}}function x(e){try{const t=r.bestByScope();return!!t&&Object.prototype.hasOwnProperty.call(t,e)}catch{return!1}}function N(e,t,s,l){const a=t===1?"🥇":t===2?"🥈":t===3?"🥉":"";return`
      <div class="lb-myline">
        <span class="lb-myline-tag">${o(c("lb.you","Your rank"))}</span>
        <span class="lb-myline-rank">${a||"#"+t}</span>
        <span class="lb-myline-name">${o(e.name)}</span>
        <span class="lb-myline-score">${e.bestPct}%</span>
        ${s!=null?`<span class="lb-myline-of">${o(c("lb.of","of"))} ${s}</span>`:""}
      </div>`}function L(){return`<div class="lb-empty">${o(c("lb.error","Could not load the leaderboard right now."))}
      <button class="lb-retry" type="button" onclick="location.reload()">${o(c("lb.retry","Retry"))}</button></div>`}function P(e,t,s,l){return`
      <div class="lb-row${l?" lb-row-me":""}">
        <span class="lb-row-rank">${(t===1?"🥇":t===2?"🥈":t===3?"🥉":"")||"#"+t}</span>
        <span class="lb-row-name">${o(e.name)}</span>
        <span class="lb-row-score">${e.bestPct}%</span>
      </div>`}function O(){const e=m("lb-graph");if(!e)return;const t=$(),s=r.bestByScope(),l=[];if(r.SUBJECTS.forEach(n=>{k(n.id).forEach(i=>{const u=n.id+"/"+i.id;u in s&&l.push({scope:u,label:I(n.id,t)+" • "+(t==="as"?i.as:i.en),pct:s[u]})})}),!l.length){e.innerHTML=`<div class="lb-empty">${o(c("lb.graphEmpty","Attempt a few practice sets to see your accuracy graph."))}</div>`;return}l.sort((n,i)=>i.pct-n.pct);const a=l[l.length-1];e.innerHTML=`
      <div class="lb-bars">
        ${l.map(n=>`
          <div class="lb-bar-row">
            <span class="lb-bar-label" title="${o(n.label)}">${o(n.label)}</span>
            <span class="lb-bar-track">
              <span class="lb-bar-fill" style="width:${Math.max(2,n.pct)}%;--v:${n.pct}"></span>
            </span>
            <span class="lb-bar-val">${n.pct}%</span>
          </div>`).join("")}
      </div>
      <p class="lb-weak">${o(c("lb.graphWeak","Weakest"))}: <b>${o(a.label)}</b> — ${a.pct}%</p>`}window.AXOLeaderboardUI={beforeFinalSubmit:T,renderPage:j}})();
