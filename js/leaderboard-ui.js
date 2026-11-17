(function(){"use strict";const i=window.AXOLeaderboard;function d(e){return document.getElementById(e)}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function o(e,s){try{const r=window.AXOApp,t=r&&r.tc||r&&r.t;if(typeof t=="function"){const a=t(e);if(a&&a!==e)return a}}catch{}return s||e}function $(){try{const e=window.AXOApp;return e&&typeof e.contentLang=="function"?e.contentLang()==="as"?"as":"en":e&&e.uiLang()==="as"?"as":"en"}catch{return"en"}}let f=!1;function H(e){let s=null,r=0;try{const a=window.AXOApp&&window.AXOApp.mock();if(a&&i&&i.resolveScope&&i.resolveScope(a.cat&&a.cat.id,a.subId)){s=i.resolveScope(a.cat.id,a.subId);let n=0;a.pool.forEach((c,u)=>{a.answers[u]===c.correct&&n++}),r=a.pool.length?Math.round(n/a.pool.length*100):0}}catch{s=null}if(!s||!i||!i.enabled()){e();return}try{i.recordAttempt(s,r)}catch{}const t=i.storedName();if(t){i.submitScore(s,r,t).catch(()=>{}),e();return}B(s,r,e)}function k(e,s,r){let t=!1;const a=()=>{t||(t=!0,r())};try{i.anonymousName().then(n=>n?i.submitScore(e,s,n):null).catch(()=>{}).then(a,a)}catch{a()}}function B(e,s,r){const t=document.createElement("div");t.className="lb-modal",t.id="lb-join-modal",t.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-join-title">
        <div class="lb-modal-ico">🏆</div>
        <h3 id="lb-join-title">${l(o("lb.join.title","Join the leaderboard?"))}</h3>
        <p>${l(o("lb.join.body","Your name will be shown on the leaderboard with your best score. You can skip this — your mock test will still run normally."))}</p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-join-skip" type="button">${l(o("lb.join.skip","Skip"))}</button>
          <button class="btn btn-primary" id="lb-join-yes" type="button">${l(o("lb.join.yes","Yes, add me"))}</button>
        </div>
      </div>`,document.body.appendChild(t);let a=!1;const n=()=>t.remove(),c=()=>{a||(a=!0,n(),r())};d("lb-join-skip").addEventListener("click",()=>{a||(n(),k(e,s,c))}),d("lb-join-yes").addEventListener("click",()=>{a||(n(),C(e,s,r))})}function C(e,s,r){const t=document.createElement("div");t.className="lb-modal",t.id="lb-name-modal",t.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-name-title">
        <div class="lb-modal-ico">✍️</div>
        <h3 id="lb-name-title">${l(o("lb.name.title","Enter your name"))}</h3>
        <p>${l(o("lb.name.body","This name will appear on the leaderboard."))}</p>
        <input class="lb-name-input" id="lb-name-input" type="text" maxlength="20"
               autocomplete="off" spellcheck="false" placeholder="${l(o("lb.name.ph","Your name"))}">
        <p class="lb-name-err" id="lb-name-err" role="alert"></p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-name-cancel" type="button">${l(o("lb.name.cancel","Cancel"))}</button>
          <button class="btn btn-primary" id="lb-name-save" type="button">${l(o("lb.name.save","Save and submit"))}</button>
        </div>
      </div>`,document.body.appendChild(t);const a=d("lb-name-input"),n=d("lb-name-err"),c=d("lb-name-save");setTimeout(()=>a.focus(),30);let u=!1;const h=()=>t.remove(),j=()=>{u||(u=!0,h(),r())};d("lb-name-cancel").addEventListener("click",()=>{u||(h(),k(e,s,j))});const m=(p,g)=>{n.textContent=o(p,g)},E=async()=>{if(f)return;const p=i.validateName(a.value);if(!p.ok){p.code==="short"?m("lb.name.short","Please enter at least 2 characters."):p.code==="long"?m("lb.name.long","Please keep the name within 20 characters."):p.code==="chars"?m("lb.name.chars","Only letters, numbers, spaces and underscore are allowed."):m("lb.name.bad","This name is not allowed. Please choose another."),a.focus();return}f=!0,c.disabled=!0,n.textContent="";try{if(!(await i.reserveName(p.name)).ok){m("lb.name.taken","This name is already taken. Please choose another.");return}const M=await i.submitScore(e,s,p.name);if(M.ok){i.storeName(p.name),j();return}if(M.code==="rate"){m("lb.name.rate","Daily leaderboard limit reached.");return}m("lb.name.err","Could not save right now. Please try again.")}catch{m("lb.name.err","Could not save right now. Please try again.")}finally{f=!1,c.disabled=!1}};c.addEventListener("click",E),a.addEventListener("keydown",p=>{p.key==="Enter"&&E()})}const b={subject:null,scope:null,requestId:0};function A(){return i.SUBJECTS[0]&&i.SUBJECTS[0].id||"gk"}function w(e,s){const r=i.SUBJECTS.find(t=>t.id===e);return r?s==="as"?r.name.as:r.name.en:e}function L(e){return(i.SUBS[e]||[]).map(s=>({id:s[0],en:s[1],as:s[2]}))}function y(e){const s=$(),r=b.subject||A(),t=L(r),a=b.scope&&t.some(n=>n.id===T(a))?b.scope:t[0]?r+"/"+t[0].id:null;if(e.innerHTML=`
      <div class="page-head">
        <nav class="breadcrumb">
          <a href="/">${l(o("breadcrumb.home","Home"))}</a><span class="bc-sep">/</span><span>${l(o("lb.title","Leaderboard"))}</span>
        </nav>
        <h1>🏆 ${l(o("lb.title","Leaderboard"))}</h1>
        <p class="page-desc">${l(o("lb.sub",""))}</p>
      </div>

      <section class="lb-wrap">
        <div class="lb-picker">
          <label class="lb-field">
            <span>${l(o("lb.subject","Subject"))}</span>
            <select id="lb-subject-select">
              ${i.SUBJECTS.map(n=>`<option value="${l(n.id)}"${n.id===r?" selected":""}>${l(s==="as"?n.name.as:n.name.en)}</option>`).join("")}
            </select>
          </label>
          <label class="lb-field">
            <span>${l(o("lb.subcategory","Sub-category"))}</span>
            <select id="lb-sub-select">
              ${t.map(n=>`<option value="${l(n.id)}"${a&&n.id===T(a)?" selected":""}>${l(s==="as"?n.as:n.en)}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="lb-grid">
          <div class="lb-card">
            <div class="lb-card-head">
              <h2>${l(o("lb.title","Leaderboard"))}</h2>
              <span class="lb-scope-name" id="lb-scope-name"></span>
            </div>
            <div id="lb-board" class="lb-board">
              <div class="lb-skel">${l(o("lb.loading","Loading leaderboard…"))}</div>
            </div>
          </div>

          <div class="lb-card lb-mycard">
            <div class="lb-card-head"><h2>${l(o("lb.you","Your rank"))}</h2></div>
            <div id="lb-myrank" class="lb-myrank"><div class="lb-skel">${l(o("lb.loading","Loading leaderboard…"))}</div></div>
          </div>

          <div class="lb-card lb-graphcard">
            <div class="lb-card-head">
              <h2>${l(o("lb.graphTitle","Your accuracy by sub-category"))}</h2>
            </div>
            <div id="lb-graph" class="lb-graph"></div>
          </div>
        </div>
      </section>`,!a){d("lb-board").innerHTML=`<div class="lb-empty">${l(o("lb.empty","No scores here yet."))}</div>`,d("lb-myrank").innerHTML="";return}d("lb-subject-select").addEventListener("change",n=>{b.subject=n.target.value,b.scope=null,y(e)}),d("lb-sub-select").addEventListener("change",n=>{b.scope=b.subject+"/"+n.target.value,y(e)}),d("lb-scope-name").textContent=w(r,s)+" • "+i.subName(a,s),N(a,s),x()}function T(e){return String(e).split("/")[1]}async function N(e,s){const r=++b.requestId,t=d("lb-board"),a=d("lb-myrank");try{const n=await i.fetchTop(e,5);if(r!==b.requestId)return;if(!n.ok){t.innerHTML=v(),a.innerHTML=v();return}t.innerHTML=n.rows.length?n.rows.map((u,h)=>S(u,h+1,s)).join(""):`<div class="lb-empty">${l(o("lb.empty","No scores here yet. Be the first to join!"))}</div>`,a.innerHTML=`<div class="lb-skel">${l(o("lb.loading","Loading…"))}</div>`;const c=await i.fetchMyRank(e);if(r!==b.requestId)return;if(!c.ok){a.innerHTML=v();return}c.rank>0?a.innerHTML=`
          <div class="lb-rank-big">
            <span class="lb-rank-num">#${c.rank}</span>
            <span class="lb-rank-of">${l(o("lb.of","of"))} ${c.total!=null?c.total:"?"} ${l(o("lb.entries","entries"))}</span>
          </div>
          ${S(c.mine,c.rank,s,!0)}`:a.innerHTML=`
          <p class="lb-none">${l(o("lb.notOnBoard","You are not on this leaderboard yet."))}</p>
          <a class="btn btn-primary" href="/mock-test">${l(o("lb.takeTest","Take a mock test"))}</a>`}catch{if(r!==b.requestId)return;t.innerHTML=v(),a.innerHTML=v()}}function v(){return`<div class="lb-empty">${l(o("lb.error","Could not load the leaderboard right now."))}
      <button class="lb-retry" type="button" onclick="location.reload()">${l(o("lb.retry","Retry"))}</button></div>`}function S(e,s,r,t){return`
      <div class="lb-row${t?" lb-row-me":""}">
        <span class="lb-row-rank">${(s===1?"🥇":s===2?"🥈":s===3?"🥉":"")||"#"+s}</span>
        <span class="lb-row-name">${l(e.name)}</span>
        <span class="lb-row-score">${e.bestPct}%</span>
      </div>`}function x(){const e=d("lb-graph");if(!e)return;const s=$(),r=i.bestByScope(),t=[];if(i.SUBJECTS.forEach(n=>{L(n.id).forEach(c=>{const u=n.id+"/"+c.id;u in r&&t.push({scope:u,label:w(n.id,s)+" • "+(s==="as"?c.as:c.en),pct:r[u]})})}),!t.length){e.innerHTML=`<div class="lb-empty">${l(o("lb.graphEmpty","Attempt a few practice sets to see your accuracy graph."))}</div>`;return}t.sort((n,c)=>c.pct-n.pct);const a=t[t.length-1];e.innerHTML=`
      <div class="lb-bars">
        ${t.map(n=>`
          <div class="lb-bar-row">
            <span class="lb-bar-label" title="${l(n.label)}">${l(n.label)}</span>
            <span class="lb-bar-track">
              <span class="lb-bar-fill" style="width:${Math.max(2,n.pct)}%;--v:${n.pct}"></span>
            </span>
            <span class="lb-bar-val">${n.pct}%</span>
          </div>`).join("")}
      </div>
      <p class="lb-weak">${l(o("lb.graphWeak","Weakest"))}: <b>${l(a.label)}</b> — ${a.pct}%</p>`}window.AXOLeaderboardUI={beforeFinalSubmit:H,renderPage:y}})();
