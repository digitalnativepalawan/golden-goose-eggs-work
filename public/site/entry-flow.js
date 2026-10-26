// SANVIC Entry Experience
// First visit flow: audience -> nickname -> four interests -> welcome.
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
  // Shared with the Today panel, so a suggested place can carry the icon of the
  // vibe that put it there and name the choice it came from. Published here at
  // the top because it must exist even for someone who has already answered and
  // will never open this panel again.
  try{ window.SANVIC_VIBES = VIBES.map(v => ({ label:v[0], tags:v[1], icon:v[2] })); }catch(e){}
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
    const profile=saved();
    const validAudience=profile && ['local','visitor'].includes(profile.audience);
    const choices=profile && Array.isArray(profile.vibes)?profile.vibes:[];
    const validChoices=choices.length===MAX && new Set(choices).size===MAX && choices.every(choice=>VIBES.some(vibe=>vibe[0]===choice));
    return !(profile && profile.profileVersion===2 && validAudience && validChoices);
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
      .sanvic-entry-count{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700;flex-shrink:0}.sanvic-entry-primary:disabled{opacity:.42;cursor:not-allowed;filter:saturate(.45)}.sanvic-vibe-grid{display:grid;grid-template-columns:1fr;gap:8px;overflow-y:auto;max-height:34dvh;min-height:0;padding:1px 2px 8px;overscroll-behavior:contain}.sanvic-vibe-option{display:flex;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.84);font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:.88rem;font-weight:400;line-height:1.25;text-align:left;padding:9px 13px 9px 11px;letter-spacing:-.01em}.sanvic-vibe-ico{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:30px;height:30px;border-radius:11px;background:rgba(255,255,255,.06);color:rgba(232,220,200,.78);transition:background .18s ease,color .18s ease}.sanvic-vibe-label{min-width:0}.sanvic-vibe-option.selected{border-color:rgba(20,184,166,.42);background:rgba(20,184,166,.13);color:rgba(255,255,255,.95);box-shadow:inset 0 0 0 1px rgba(20,184,166,.08)}.sanvic-vibe-option.selected .sanvic-vibe-ico{background:rgba(20,184,166,.22);color:#7fe7dc}.sanvic-vibe-option.disabled{opacity:.45}.sanvic-entry-smile{display:flex;color:var(--limestone,#c4a882)}
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
    if(state.step===1){
      w.innerHTML=`<div class="sanvic-entry-kicker">SANVIC</div><h1 class="sanvic-entry-title">How will you use SANVIC?</h1><p class="sanvic-entry-sub">Choose the experience that fits you.</p><div class="sanvic-entry-choices"><button type="button" class="sanvic-entry-choice" id="entryVisitor">${icon('luggage',17)}<span>Traveller</span></button><button type="button" class="sanvic-entry-choice" id="entryResident">${icon('house',17)}<span>Resident</span></button></div>`;
      bindAction('entryResident', ()=>chooseAudience('local'));
      bindAction('entryVisitor', ()=>chooseAudience('visitor'));
      return;
    }
    if(state.step===2){
      const ph=PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)];
      w.innerHTML=`<div class="sanvic-entry-kicker">SANVIC</div><h1 class="sanvic-entry-title">What should we call you?</h1><p class="sanvic-entry-sub">Choose a nickname. No account or email needed.</p><input id="sanvicName" class="sanvic-entry-input" maxlength="32" autocomplete="nickname" placeholder="${esc(ph)}" value="${esc(state.nickname)}"><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryNext">Continue</button></div>`;
      const input=document.getElementById('sanvicName');
      input.addEventListener('input',()=>state.nickname=input.value);
      input.addEventListener('keydown',e=>{if(e.key==='Enter') next();});
      bindAction('entryNext', next);
      setTimeout(()=>input.focus({preventScroll:true}),80);
      return;
    }
    if(state.step===3){
      const count=state.vibes.length;
      w.innerHTML=`<div class="sanvic-entry-kicker">Your SANVIC profile</div><h1 class="sanvic-entry-title">What are you into?</h1><p class="sanvic-entry-sub">Choose exactly 4 interests to personalise places, tips, and plans across SANVIC.</p><div class="sanvic-entry-count" aria-live="polite">${count}/${MAX} selected · ${count===MAX?'ready to continue':'choose '+(MAX-count)+' more'}</div><div class="sanvic-vibe-grid" role="group" aria-label="Choose four travel interests">${VIBES.map((v,i)=>{const sel=state.vibes.includes(v[0]);const dis=!sel&&count>=MAX;const ic=icon(v[2],18);return `<button type="button" class="sanvic-vibe-option ${sel?'selected':''} ${dis?'disabled':''}" data-i="${i}" aria-pressed="${sel?'true':'false'}" aria-disabled="${dis?'true':'false'}" ${dis?'disabled':''}>${ic?`<span class="sanvic-vibe-ico">${ic}</span>`:''}<span class="sanvic-vibe-label">${esc(v[0])}</span></button>`;}).join('')}</div><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryNext" ${count===MAX?'':'disabled'}>Continue</button></div>`;
      document.querySelectorAll('.sanvic-vibe-option').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.i)));
      bindAction('entryNext', next);
      return;
    }
    const name=state.nickname.trim()||(state.audience==='local'?'Neighbour':'Traveller');
    w.innerHTML=`<div class="sanvic-entry-kicker">Your SANVIC experience</div><div class="sanvic-entry-smile">${icon('smile',30)}</div><h1 class="sanvic-entry-title">${esc(name)}, welcome to San Vicente</h1><p class="sanvic-entry-sub">Your places, plans, and local updates are ready.</p><p class="sanvic-entry-note">Personalised from the four interests you chose.</p><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryEnter">Enter SANVIC</button></div>`;
    bindAction('entryEnter', complete);
  }

  function next(){ if(state.step===2){const i=document.getElementById('sanvicName');state.nickname=(i?i.value:'').trim();state.step=3;} else if(state.step===3){if(state.vibes.length!==MAX)return;state.step=4;} render(); }
  // Stored under the same key the Explore sheet already reads, so the answer
  // takes effect immediately and survives a reload.
  function chooseAudience(v){ state.audience=(v==='local')?'local':'visitor'; state.step=2; render(); }
  function toggle(i){ const v=VIBES[i]; if(!v)return; const grid=document.querySelector('.sanvic-vibe-grid'); const scroll=grid?grid.scrollTop:0; const k=state.vibes.indexOf(v[0]); if(k>=0)state.vibes.splice(k,1); else if(state.vibes.length<MAX)state.vibes.push(v[0]); render(); requestAnimationFrame(()=>{const nextGrid=document.querySelector('.sanvic-vibe-grid');if(nextGrid)nextGrid.scrollTop=scroll;const nextOption=document.querySelector('.sanvic-vibe-option[data-i="'+i+'"]');if(nextOption)nextOption.focus({preventScroll:true});}); }
  function applyProfile(p){ const x=p||saved(); if(!x)return; document.body.dataset.sanvicVibes=(x.vibeTags||[]).join(' '); document.body.dataset.sanvicAudience=x.audience||'visitor'; document.body.classList.toggle('sanvic-audience-resident',x.audience==='local'); document.body.classList.toggle('sanvic-audience-traveler',x.audience!=='local'); if(x.nickname)document.body.dataset.sanvicNickname=x.nickname; const n=document.getElementById('pulseComposeName'); if(n&&x.nickname&&!n.value)n.value=x.nickname;
    // The selected audience is global profile state; visitor interests flow
    // through Today, TALA and Explore, while resident-specific surfaces can
    // branch cleanly from the same profile as that experience is finalized.
    document.body.classList.add('sanvic-profiled'); }
  function unlock(){ document.body.classList.remove('sanvic-entry-lock'); const b=document.getElementById('bottomDock'); if(b)b.classList.add('visible'); const t=document.getElementById('talaOrbWrap'); if(t)t.classList.remove('hidden'); applyProfile(); }
  function complete(){
    if(completed) return;
    completed = true;
    const p={profileVersion:2,nickname:state.nickname.trim(),vibes:state.vibes.slice(),vibeTags:tags(),audience:state.audience||'visitor',enteredAt:new Date().toISOString()};
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
  const hold=Number(window.SANVIC_SPLASH_HOLD||2000);

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
    document.body.classList.add('sanvic-entry-lock');
    mount();
    render();
    const el=document.getElementById('sanvicEntry');
    if(el) el.classList.add('active');
  };

  if(document.readyState==='complete'){ setTimeout(openWhenReady,hold); }
  else { window.addEventListener('load',()=>setTimeout(openWhenReady,hold)); }
})();
