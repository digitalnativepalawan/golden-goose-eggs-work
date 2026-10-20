// SANVIC Entry Experience
// First visit flow: nickname -> travel vibe -> welcome.
(function(){
  const KEY = 'sanvic_entry_v1';
  const MAX = 4;
  const DELAY = 5200;
  // [label, personalisation tags, Lucide icon]
  // Icons are real Lucide SVG via the app's shared icon set (see lucideSvg in
  // app.js). No emoji: they render inconsistently across devices and read as
  // dated next to the rest of the interface.
  const VIBES = [
    ['Mojito by the beach',['beach','drink','social'],'martini'],
    ['Smashed burger after swimming',['food','beach'],'hamburger'],
    ['Meeting someone new',['social','pulse'],'users'],
    ['Reading in a hammock',['quiet','slow'],'book-open'],
    ['Trekking into the jungle',['explore','nature'],'footprints'],
    ['Beach bed with my love',['quiet','couples','private'],'heart'],
    ['Watching turtle hatchlings',['nature','wildlife'],'turtle'],
    ['Lost somewhere on a scooter',['explore','routes'],'scooter'],
    ['Surfing badly but proudly',['surf','adventure'],'waves'],
    ['Eating fish caught this morning',['food','local'],'fish'],
    ['Trying to kill the hangover',['food','recovery'],'coffee'],
    ['Chasing sunset',['sunset','photo'],'sunset'],
    ['Finding the place nobody told me about',['hidden','explore'],'compass'],
    ['Singing videoke with friendly locals',['social','local','pulse'],'mic'],
    ['Joining island hopping with new friends',['island','social','pulse'],'sailboat'],
    ['Finding a wild beach with almost nobody around',['quiet','hidden','beach'],'palmtree'],
    ['Hunting for the perfect photo',['photo','viewpoints','sunset'],'camera'],
    ['Cold Chardonnay on a private boat',['private','curated','boat'],'wine'],
    ['Massage, brunch, and pretending emails don’t exist',['slow','wellness','food'],'flower-2'],
    ['Wandering through the local market',['food','local','market'],'shopping-basket']
  ];
  // The shared icon set lives in app.js, which is parsed before this panel is
  // opened. Guarded so a load-order surprise leaves a readable list, not blank
  // buttons.
  function icon(name, size){
    try{ if(typeof lucideSvg === 'function') return lucideSvg(name, size || 18); }catch(e){}
    return '';
  }
  const PLACEHOLDERS = ['Marco','Luna','IslandCat','The Dutch Guy','SandyFeet','Still Hungover'];
  const state = { step:1, audience:'', nickname:'', vibes:[] };
  let completed = false;

  function esc(v){ return String(v||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function saved(){ try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;} }
  function resetEntrySession(){
    try{
      sessionStorage.removeItem('sanvic_entry_first_layer_opened');
      sessionStorage.removeItem('sanvic_entry_layer_nudged');
    }catch(e){}
  }
  function shouldShow(){
    const p=new URLSearchParams(location.search);
    if(p.get('resetEntry')==='1'){
      localStorage.removeItem(KEY);
      resetEntrySession();
      return true;
    }
    return !saved();
  }
  function tags(){ const out=[]; VIBES.forEach(v=>{ if(state.vibes.includes(v[0])) v[1].forEach(t=>{ if(!out.includes(t)) out.push(t); }); }); return out; }

  function css(){
    if(document.getElementById('sanvicEntryCss')) return;
    const s=document.createElement('style');
    s.id='sanvicEntryCss';
    s.textContent=`
      body.sanvic-entry-lock #bottomDock.visible,body.sanvic-entry-lock #talaOrbWrap{opacity:0!important;pointer-events:none!important}
      .sanvic-entry{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;padding:18px;background:radial-gradient(circle at 50% 8%,rgba(20,184,166,.14),transparent 30%),linear-gradient(180deg,rgba(2,14,38,.52),rgba(2,14,38,.9));opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s ease,visibility .25s ease;font-family:var(--font-body,'DM Sans',-apple-system,sans-serif)}
      .sanvic-entry.active{opacity:1;visibility:visible;pointer-events:auto}.sanvic-entry.closing{opacity:0;pointer-events:none}
      .sanvic-entry-card{width:min(100%,430px);max-height:calc(100dvh - 36px);border-radius:30px;background:linear-gradient(180deg,rgba(8,18,38,.78),rgba(4,12,30,.95));border:1px solid rgba(255,255,255,.08);box-shadow:0 28px 90px rgba(0,0,0,.46);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);overflow:hidden;display:flex}
      .sanvic-entry-inner{width:100%;max-height:inherit;padding:24px 20px 18px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
      .sanvic-entry-kicker{font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:.62rem;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.46);font-weight:600}
      .sanvic-entry-title{font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:clamp(1.72rem,7vw,2.35rem);font-weight:500;letter-spacing:-.045em;line-height:1.06;color:rgba(255,255,255,.92);margin:0}
      .sanvic-entry-sub{font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:.92rem;font-weight:300;line-height:1.55;color:rgba(255,255,255,.58);margin:0}.sanvic-entry-note{font-size:.78rem;color:rgba(255,255,255,.38);margin:0;line-height:1.5}
      .sanvic-entry-input{width:100%;height:54px;border-radius:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.055);color:rgba(255,255,255,.92);font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:1rem;font-weight:400;padding:0 15px;outline:0;user-select:text;-webkit-user-select:text}
      .sanvic-entry-input::placeholder{color:rgba(255,255,255,.32)}
      .sanvic-entry-actions{display:flex;flex-direction:column;gap:8px;flex-shrink:0}.sanvic-entry-primary,.sanvic-entry-secondary{border:0;border-radius:999px;font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}.sanvic-entry-primary{min-height:50px;background:linear-gradient(135deg,var(--sand,#e8dcc8),var(--limestone,#c4a882));color:var(--charcoal-deep,#020e26);font-weight:700;letter-spacing:-.01em}.sanvic-entry-secondary{height:34px;background:transparent;color:rgba(255,255,255,.48);font-weight:600}
      .sanvic-entry-count{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.34);font-weight:600;flex-shrink:0}.sanvic-vibe-grid{display:grid;grid-template-columns:1fr;gap:8px;overflow-y:auto;max-height:34dvh;min-height:0;padding:1px 2px 8px;overscroll-behavior:contain}.sanvic-vibe-option{display:flex;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.84);font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:.88rem;font-weight:400;line-height:1.25;text-align:left;padding:9px 13px 9px 11px;letter-spacing:-.01em}.sanvic-vibe-ico{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:30px;height:30px;border-radius:11px;background:rgba(255,255,255,.06);color:rgba(232,220,200,.78);transition:background .18s ease,color .18s ease}.sanvic-vibe-label{min-width:0}.sanvic-vibe-option.selected{border-color:rgba(20,184,166,.42);background:rgba(20,184,166,.13);color:rgba(255,255,255,.95);box-shadow:inset 0 0 0 1px rgba(20,184,166,.08)}.sanvic-vibe-option.selected .sanvic-vibe-ico{background:rgba(20,184,166,.22);color:#7fe7dc}.sanvic-vibe-option.disabled{opacity:.45}.sanvic-entry-smile{display:flex;color:var(--limestone,#c4a882)}
      .sanvic-entry-choices{display:flex;gap:10px;flex-shrink:0}
      .sanvic-entry-choice{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.9);font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:.95rem;font-weight:600;cursor:pointer;padding:0 10px;-webkit-tap-highlight-color:transparent}
      .sanvic-entry-choice svg{flex-shrink:0;opacity:.72}
      .sanvic-entry-choice:hover svg,.sanvic-entry-choice:focus-visible svg{opacity:1}
      .sanvic-entry-choice:hover{border-color:rgba(20,184,166,.5)}
      .sanvic-entry-choice:focus-visible{outline:2px solid #65e1d1;outline-offset:2px}
      @media(min-width:700px){.sanvic-entry{justify-content:flex-start;padding-left:max(6vw,70px)}.sanvic-entry-card{width:min(46vw,560px);max-height:min(86vh,720px)}.sanvic-entry-inner{padding:32px 28px 24px}.sanvic-entry-title{font-size:clamp(2.1rem,3.2vw,3rem)}.sanvic-vibe-grid{grid-template-columns:1fr 1fr;max-height:40vh}}
      @media(max-height:720px){.sanvic-entry-inner{gap:10px;padding-top:18px;padding-bottom:14px}.sanvic-entry-title{font-size:1.72rem}.sanvic-entry-sub{font-size:.82rem}.sanvic-vibe-grid{max-height:28dvh}.sanvic-vibe-option{padding:9px 11px;font-size:.82rem}.sanvic-entry-primary{min-height:46px}}
      /* ── The editorial introduction (step 0) ────────────────────────────
         James's design: a light page, serif headline, orange call to action.
         It is a deliberate departure from the dark app, so the card itself
         changes shape for it rather than the page squeezing into the dialog. */
      .sanvic-entry-card.is-intro{width:100%;max-height:100dvh;border-radius:0;background:#f7f5f2;border:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
      .sanvic-entry-card.is-intro .sanvic-entry-inner{padding:0;gap:0;overflow-y:auto;max-height:100dvh;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
      .sv-intro{display:flex;flex-direction:column;background:#f7f5f2;color:#33556f;min-height:100dvh}
      .sv-intro-hero{position:relative;height:44vh;min-height:220px;max-height:430px;overflow:hidden;background:#dfe7ea;flex-shrink:0}
      .sv-intro-hero img{width:100%;height:100%;object-fit:cover;display:block}
      .sv-intro-hero::after{content:'';position:absolute;left:-14%;right:-14%;bottom:-2px;height:10%;background:#f7f5f2;border-radius:50% 50% 0 0 / 100% 100% 0 0}
      .sv-intro-body{padding:24px 24px 34px;display:flex;flex-direction:column;gap:15px}
      .sv-intro-title{font-family:var(--font-display,Georgia,'Times New Roman',serif);font-size:clamp(1.95rem,7.6vw,2.6rem);line-height:1.12;font-weight:600;color:#1b3a5c;margin:0;letter-spacing:-.005em}
      .sv-intro-rule{height:3px;width:76px;background:#e2603a;border-radius:2px;flex-shrink:0}
      .sv-intro-rule.short{width:56px;margin:8px auto 0}
      .sv-intro-kicker{font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:#93a9ba;font-weight:600}
      .sv-intro-body p{font-size:.95rem;line-height:1.62;color:#3d5f79;margin:0}
      .sv-intro-lead{font-weight:700;color:#1b3a5c}
      .sv-intro-cta{margin-top:8px;min-height:56px;border:0;border-radius:999px;background:#e2603a;color:#fff;font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-weight:700;font-size:.9rem;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;box-shadow:0 12px 28px rgba(226,96,58,.26);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      .sv-intro-cta:active{transform:scale(.985)}
      .sv-intro-foot{text-align:center;font-size:.68rem;letter-spacing:.34em;text-transform:uppercase;color:#b0c1ce;margin-top:12px}
      @media(min-width:760px){
        .sv-intro-hero{height:46vh;max-height:540px}
        .sv-intro-body{max-width:780px;width:100%;margin:0 auto;padding:46px 40px 64px;gap:18px}
        .sv-intro-title{font-size:clamp(2.3rem,3.6vw,3.2rem)}
        .sv-intro-body p{font-size:1.04rem}
        .sv-intro-cta{max-width:420px;width:100%;margin-left:auto;margin-right:auto}
      }
    `;
    document.head.appendChild(s);
  }

  function mount(){
    if(document.getElementById('sanvicEntry')) return;
    const o=document.createElement('div');
    o.id='sanvicEntry';
    o.className='sanvic-entry';
    o.innerHTML='<section class="sanvic-entry-card" role="dialog" aria-modal="true"><div class="sanvic-entry-inner" id="sanvicEntryContent"></div></section>';
    document.body.appendChild(o);
  }

  function bindAction(id, fn){
    const el=document.getElementById(id);
    if(!el) return;
    let last = 0;
    const run = function(e){
      if(e){ e.preventDefault(); e.stopPropagation(); }
      const now = Date.now();
      if(now - last < 450) return;
      last = now;
      fn();
    };
    el.onclick = run;
    el.onpointerup = run;
    el.ontouchend = run;
  }

  function render(){
    const w=document.getElementById('sanvicEntryContent'); if(!w) return;
    // Step 0 is the editorial page: a full-bleed introduction, not a card, so
    // the whole panel switches shape for it.
    const card=document.querySelector('.sanvic-entry-card');
    if(card) card.classList.toggle('is-intro', state.step===0);
    if(state.step===0){
      // The words and the order are the partner's, taken from his design.
      w.innerHTML=`<div class="sv-intro">
        <div class="sv-intro-hero"><img src="assets/san-vicente-long-beach.jpg" alt="Long Beach, San Vicente" loading="eager"></div>
        <div class="sv-intro-body">
          <h1 class="sv-intro-title">There is more to paradise than you imagine.</h1>
          <div class="sv-intro-rule"></div>
          <div class="sv-intro-kicker">Discover San Vicente</div>
          <p>Welcome to San Vicente, one of Palawan's most beautiful and still largely undiscovered destinations.</p>
          <p>You may have heard of Port Barton, a charming seaside village famous for its island hopping, laid-back atmosphere and tropical charm. But Port Barton is only a small part of San Vicente.</p>
          <p class="sv-intro-lead">Travel north and discover an entirely different side of Palawan.</p>
          <p>Kilometers of unspoiled beaches, spectacular coastal viewpoints, fishing villages, tropical forests, hidden waterfalls and islands waiting to be explored.</p>
          <p>From the endless sands of Long Beach to the quieter shores of Alimanguan and beyond, San Vicente offers something increasingly rare: the freedom to discover paradise at your own pace.</p>
          <div class="sv-intro-rule short"></div>
          <button type="button" class="sv-intro-cta" id="entryIntroGo">Welcome in Sanvic <span aria-hidden="true">&#8594;</span></button>
          <div class="sv-intro-foot">Palawan</div>
        </div>
      </div>`;
      bindAction('entryIntroGo', ()=>{ state.step=1; render(); });
      return;
    }
    if(state.step===1){
      w.innerHTML=`<div class="sanvic-entry-kicker">SANVIC</div><h1 class="sanvic-entry-title">Do you live here, or are you visiting?</h1><p class="sanvic-entry-sub">It changes what the map puts in front of you first.<br>You can change this later.</p><div class="sanvic-entry-choices"><button type="button" class="sanvic-entry-choice" id="entryResident">${icon('house',17)}<span>I live here</span></button><button type="button" class="sanvic-entry-choice" id="entryVisitor">${icon('luggage',17)}<span>I'm visiting</span></button></div><button type="button" class="sanvic-entry-secondary" id="entrySkip">Skip</button>`;
      bindAction('entryResident', ()=>chooseAudience('local'));
      bindAction('entryVisitor', ()=>chooseAudience('visitor'));
      bindAction('entrySkip', ()=>{state.step=2;render();});
      return;
    }
    if(state.step===2){
      const ph=PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)];
      w.innerHTML=`<div class="sanvic-entry-kicker">SANVIC</div><h1 class="sanvic-entry-title">How should we call you?</h1><p class="sanvic-entry-sub">Just a nickname.<br>No account. No email. No drama.</p><input id="sanvicName" class="sanvic-entry-input" maxlength="32" autocomplete="off" placeholder="${esc(ph)}" value="${esc(state.nickname)}"><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryNext">Continue</button><button type="button" class="sanvic-entry-secondary" id="entrySkip">Skip</button></div>`;
      const input=document.getElementById('sanvicName');
      input.addEventListener('input',()=>state.nickname=input.value);
      input.addEventListener('keydown',e=>{if(e.key==='Enter') next();});
      bindAction('entryNext', next);
      bindAction('entrySkip', ()=>{state.nickname='';state.step=3;render();});
      setTimeout(()=>input.focus({preventScroll:true}),80);
      return;
    }
    if(state.step===3){
      const count=state.vibes.length;
      w.innerHTML=`<div class="sanvic-entry-kicker">Your San Vicente mood</div><h1 class="sanvic-entry-title">Tomorrow at 3 PM, where do you see yourself?</h1><p class="sanvic-entry-sub">Choose up to 4.</p><div class="sanvic-entry-count">${count}/${MAX} chosen</div><div class="sanvic-vibe-grid">${VIBES.map((v,i)=>{const sel=state.vibes.includes(v[0]);const dis=!sel&&count>=MAX;const ic=icon(v[2],18);return `<button type="button" class="sanvic-vibe-option ${sel?'selected':''} ${dis?'disabled':''}" data-i="${i}" aria-pressed="${sel?'true':'false'}">${ic?`<span class="sanvic-vibe-ico">${ic}</span>`:''}<span class="sanvic-vibe-label">${esc(v[0])}</span></button>`;}).join('')}</div><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryNext">Continue</button></div>`;
      document.querySelectorAll('.sanvic-vibe-option').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.i)));
      bindAction('entryNext', next);
      return;
    }
    const name=state.nickname.trim()||'Traveler';
    w.innerHTML=`<div class="sanvic-entry-kicker">The map is open</div><div class="sanvic-entry-smile">${icon('smile',30)}</div><h1 class="sanvic-entry-title">${esc(name)}, welcome to San Vicente</h1><p class="sanvic-entry-sub">The map is open.<br>The day is still unwritten.</p><p class="sanvic-entry-note">A few things are already happening today.</p><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryEnter">Enter San Vicente</button></div>`;
    bindAction('entryEnter', complete);
  }

  function next(){ if(state.step===2){const i=document.getElementById('sanvicName');state.nickname=(i?i.value:'').trim();state.step=3;} else if(state.step===3){state.step=4;} render(); }
  // Stored under the same key the Explore sheet already reads, so the answer
  // takes effect immediately and survives a reload.
  function chooseAudience(v){ state.audience=(v==='local')?'local':'visitor'; state.step=2; render(); }
  function toggle(i){ const v=VIBES[i]; if(!v)return; const k=state.vibes.indexOf(v[0]); if(k>=0)state.vibes.splice(k,1); else if(state.vibes.length<MAX)state.vibes.push(v[0]); render(); }
  function applyProfile(p){ const x=p||saved(); if(!x)return; document.body.dataset.sanvicVibes=(x.vibeTags||[]).join(' '); if(x.nickname)document.body.dataset.sanvicNickname=x.nickname; const n=document.getElementById('pulseComposeName'); if(n&&x.nickname&&!n.value)n.value=x.nickname; }
  function unlock(){ document.body.classList.remove('sanvic-entry-lock'); const b=document.getElementById('bottomDock'); if(b)b.classList.add('visible'); const t=document.getElementById('talaOrbWrap'); if(t)t.classList.remove('hidden'); applyProfile(); }
  function complete(){
    if(completed) return;
    completed = true;
    const p={nickname:state.nickname.trim(),vibes:state.vibes.slice(),vibeTags:tags(),audience:state.audience||'',enteredAt:new Date().toISOString()};
    try{ localStorage.setItem(KEY,JSON.stringify(p)); }catch(e){}
    if(state.audience){
      try{ localStorage.setItem('sanvic_explore_audience',state.audience); }catch(e){}
      try{ if(typeof setExploreAudience==='function') setExploreAudience(state.audience); }catch(e){}
    }
    applyProfile(p);
    const o=document.getElementById('sanvicEntry');
    if(o){ o.classList.remove('active'); o.remove(); }
    unlock();
    try{ window.dispatchEvent(new Event('sanvic:entry-complete')); }catch(e){}
  }

  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'entryEnter') complete(); }, true);
  document.addEventListener('touchend', function(e){ if(e.target && e.target.id === 'entryEnter') { e.preventDefault(); complete(); } }, true);

  css();
  window.openSanvicWelcome=()=>{
    completed=false;state.step=1;
    document.body.classList.add('sanvic-entry-lock');
    mount();render();
    document.getElementById('sanvicEntry')?.classList.add('active');
  };
  if(!shouldShow()){
    document.body.classList.remove('sanvic-entry-lock');
    const b=document.getElementById('bottomDock'); if(b) b.classList.add('visible');
    const t=document.getElementById('talaOrbWrap'); if(t) t.classList.remove('hidden');
    setTimeout(applyProfile,0);
    return;
  }
  // First visit: hold the splash, then open the questionnaire. The flow, the
  // 20 vibes and the personalisation were all still here — only the trigger
  // had been switched off, which is why nobody ever saw it.
  const openWhenReady=()=>{
    completed=false;
    // The editorial page comes first, straight after the splash. Reopening the
    // flow later (from "choose your vibes") still goes to the questions.
    state.step=0;
    document.body.classList.add('sanvic-entry-lock');
    mount();
    render();
    const el=document.getElementById('sanvicEntry');
    if(el) el.classList.add('active');
  };
  const hold=Number(window.SANVIC_SPLASH_HOLD||2000);
  if(document.readyState==='complete'){ setTimeout(openWhenReady,hold); }
  else { window.addEventListener('load',()=>setTimeout(openWhenReady,hold)); }
})();
