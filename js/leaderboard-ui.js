(function(){"use strict";const c=window.AXOLeaderboard;function d(e){return document.getElementById(e)}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function o(e,s){try{const r=window.AXOApp,n=r&&r.tc||r&&r.t;if(typeof n=="function"){const a=n(e);if(a&&a!==e)return a}}catch{}return s||e}function k(){try{const e=window.AXOApp;return e&&typeof e.contentLang=="function"?e.contentLang()==="as"?"as":"en":e&&e.uiLang()==="as"?"as":"en"}catch{return"en"}}let f=!1;function j(e){let s=null,r=0;try{const a=window.AXOApp&&window.AXOApp.mock();if(a&&c&&c.resolveScope&&c.resolveScope(a.cat&&a.cat.id,a.subId)){s=c.resolveScope(a.cat.id,a.subId);let t=0;a.pool.forEach((i,p)=>{a.answers[p]===i.correct&&t++}),r=a.pool.length?Math.round(t/a.pool.length*100):0}}catch{s=null}if(!s||!c||!c.enabled()){e();return}try{c.recordAttempt(s,r)}catch{}const n=c.storedName();if(n){c.submitScore(s,r,n).catch(()=>{}),e();return}M(s,r,e)}function M(e,s,r){const n=document.createElement("div");n.className="lb-modal",n.id="lb-join-modal",n.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-join-title">
        <button class="lb-close" type="button" aria-label="Close">✕</button>
        <div class="lb-modal-ico">🏆</div>
        <h3 id="lb-join-title">${l(o("lb.join.title","Join the leaderboard?"))}</h3>
        <p>${l(o("lb.join.body","Your name will be shown on the leaderboard with your best score."))}</p>
        <div class="lb-modal-actions">
          <button class="btn btn-outline" id="lb-join-skip" type="button">${l(o("lb.join.skip","Skip"))}</button>
          <button class="btn btn-primary" id="lb-join-yes" type="button">${l(o("lb.join.yes","Yes, add me"))}</button>
        </div>
      </div>`,document.body.appendChild(n);const a=()=>n.remove(),t=()=>{a(),r()};n.querySelector(".lb-close").addEventListener("click",t),n.querySelector(".lb-modal-backdrop").addEventListener("click",t),d("lb-join-skip").addEventListener("click",t),d("lb-join-yes").addEventListener("click",()=>{a(),H(e,s,r)})}function H(e,s,r){const n=document.createElement("div");n.className="lb-modal",n.id="lb-name-modal",n.innerHTML=`
      <div class="lb-modal-backdrop"></div>
      <div class="lb-modal-box" role="dialog" aria-modal="true" aria-labelledby="lb-name-title">
        <button class="lb-close" type="button" aria-label="Close">✕</button>
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
      </div>`,document.body.appendChild(n);const a=d("lb-name-input"),t=d("lb-name-err"),i=d("lb-name-save");setTimeout(()=>a.focus(),30);let p=!1;const v=()=>{p||(p=!0,n.remove(),r())};n.querySelector(".lb-close").addEventListener("click",v),n.querySelector(".lb-modal-backdrop").addEventListener("click",v),d("lb-name-cancel").addEventListener("click",v);const m=(u,g)=>{t.textContent=o(u,g)},T=async()=>{if(f)return;const u=c.validateName(a.value);if(!u.ok){u.code==="short"?m("lb.name.short","Please enter at least 2 characters."):u.code==="long"?m("lb.name.long","Please keep the name within 20 characters."):u.code==="chars"?m("lb.name.chars","Only letters, numbers, spaces and underscore are allowed."):m("lb.name.bad","This name is not allowed. Please choose another."),a.focus();return}f=!0,i.disabled=!0,t.textContent="";try{if(!(await c.reserveName(u.name)).ok){m("lb.name.taken","This name is already taken. Please choose another.");return}const E=await c.submitScore(e,s,u.name);if(E.ok){c.storeName(u.name),v();return}if(E.code==="rate"){m("lb.name.rate","Daily leaderboard limit reached.");return}m("lb.name.err","Could not save right now. Please try again.")}catch{m("lb.name.err","Could not save right now. Please try again.")}finally{f=!1,i.disabled=!1}};i.addEventListener("click",T),a.addEventListener("keydown",u=>{u.key==="Enter"&&T()})}const b={subject:null,scope:null,requestId:0};function C(){return c.SUBJECTS[0]&&c.SUBJECTS[0].id||"gk"}function $(e,s){const r=c.SUBJECTS.find(n=>n.id===e);return r?s==="as"?r.name.as:r.name.en:e}function w(e){return(c.SUBS[e]||[]).map(s=>({id:s[0],en:s[1],as:s[2]}))}function y(e){const s=k(),r=b.subject||C(),n=w(r),a=b.scope&&n.some(t=>t.id===L(a))?b.scope:n[0]?r+"/"+n[0].id:null;if(e.innerHTML=`
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
              ${c.SUBJECTS.map(t=>`<option value="${l(t.id)}"${t.id===r?" selected":""}>${l(s==="as"?t.name.as:t.name.en)}</option>`).join("")}
            </select>
          </label>
          <label class="lb-field">
            <span>${l(o("lb.subcategory","Sub-category"))}</span>
            <select id="lb-sub-select">
              ${n.map(t=>`<option value="${l(t.id)}"${a&&t.id===L(a)?" selected":""}>${l(s==="as"?t.as:t.en)}</option>`).join("")}
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
      </section>`,!a){d("lb-board").innerHTML=`<div class="lb-empty">${l(o("lb.empty","No scores here yet."))}</div>`,d("lb-myrank").innerHTML="";return}d("lb-subject-select").addEventListener("change",t=>{b.subject=t.target.value,b.scope=null,y(e)}),d("lb-sub-select").addEventListener("change",t=>{b.scope=b.subject+"/"+t.target.value,y(e)}),d("lb-scope-name").textContent=$(r,s)+" • "+c.subName(a,s),B(a,s),A()}function L(e){return String(e).split("/")[1]}async function B(e,s){const r=++b.requestId,n=d("lb-board"),a=d("lb-myrank");try{const t=await c.fetchTop(e,5);if(r!==b.requestId)return;if(!t.ok){n.innerHTML=h(),a.innerHTML=h();return}n.innerHTML=t.rows.length?t.rows.map((p,v)=>S(p,v+1,s)).join(""):`<div class="lb-empty">${l(o("lb.empty","No scores here yet. Be the first to join!"))}</div>`,a.innerHTML=`<div class="lb-skel">${l(o("lb.loading","Loading…"))}</div>`;const i=await c.fetchMyRank(e);if(r!==b.requestId)return;if(!i.ok){a.innerHTML=h();return}i.rank>0?a.innerHTML=`
          <div class="lb-rank-big">
            <span class="lb-rank-num">#${i.rank}</span>
            <span class="lb-rank-of">${l(o("lb.of","of"))} ${i.total!=null?i.total:"?"} ${l(o("lb.entries","entries"))}</span>
          </div>
          ${S(i.mine,i.rank,s,!0)}`:a.innerHTML=`
          <p class="lb-none">${l(o("lb.notOnBoard","You are not on this leaderboard yet."))}</p>
          <a class="btn btn-primary" href="/mock-test">${l(o("lb.takeTest","Take a mock test"))}</a>`}catch{if(r!==b.requestId)return;n.innerHTML=h(),a.innerHTML=h()}}function h(){return`<div class="lb-empty">${l(o("lb.error","Could not load the leaderboard right now."))}
      <button class="lb-retry" type="button" onclick="location.reload()">${l(o("lb.retry","Retry"))}</button></div>`}function S(e,s,r,n){return`
      <div class="lb-row${n?" lb-row-me":""}">
        <span class="lb-row-rank">${(s===1?"🥇":s===2?"🥈":s===3?"🥉":"")||"#"+s}</span>
        <span class="lb-row-name">${l(e.name)}</span>
        <span class="lb-row-score">${e.bestPct}%</span>
      </div>`}function A(){const e=d("lb-graph");if(!e)return;const s=k(),r=c.bestByScope(),n=[];if(c.SUBJECTS.forEach(t=>{w(t.id).forEach(i=>{const p=t.id+"/"+i.id;p in r&&n.push({scope:p,label:$(t.id,s)+" • "+(s==="as"?i.as:i.en),pct:r[p]})})}),!n.length){e.innerHTML=`<div class="lb-empty">${l(o("lb.graphEmpty","Attempt a few practice sets to see your accuracy graph."))}</div>`;return}n.sort((t,i)=>i.pct-t.pct);const a=n[n.length-1];e.innerHTML=`
      <div class="lb-bars">
        ${n.map(t=>`
          <div class="lb-bar-row">
            <span class="lb-bar-label" title="${l(t.label)}">${l(t.label)}</span>
            <span class="lb-bar-track">
              <span class="lb-bar-fill" style="width:${Math.max(2,t.pct)}%;--v:${t.pct}"></span>
            </span>
            <span class="lb-bar-val">${t.pct}%</span>
          </div>`).join("")}
      </div>
      <p class="lb-weak">${l(o("lb.graphWeak","Weakest"))}: <b>${l(a.label)}</b> — ${a.pct}%</p>`}window.AXOLeaderboardUI={beforeFinalSubmit:j,renderPage:y}})();
