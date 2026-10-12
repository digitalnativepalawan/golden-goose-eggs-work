// SANVIC Entry Experience
// First visit flow: nickname -> travel vibe -> welcome.
(function(){
  const KEY = 'sanvic_entry_v1';
  const MAX = 4;
  const DELAY = 5200;
  const VIBES = [
    ['Mojito by the beach',['beach','drink','social']],
    ['Smashed burger after swimming',['food','beach']],
    ['Meeting someone new',['social','pulse']],
    ['Reading in a hammock',['quiet','slow']],
    ['Trekking into the jungle',['explore','nature']],
    ['Beach bed with my love',['quiet','couples','private']],
    ['Watching turtle hatchlings',['nature','wildlife']],
    ['Lost somewhere on a scooter',['explore','routes']],
    ['Surfing badly but proudly',['surf','adventure']],
    ['Eating fish caught this morning',['food','local']],
    ['Trying to kill the hangover',['food','recovery']],
    ['Chasing sunset',['sunset','photo']],
    ['Finding the place nobody told me about',['hidden','explore']],
    ['Singing videoke with friendly locals',['social','local','pulse']],
    ['Joining island hopping with new friends',['island','social','pulse']],
    ['Finding a wild beach with almost nobody around',['quiet','hidden','beach']],
    ['Hunting for the perfect photo',['photo','viewpoints','sunset']],
    ['Cold Chardonnay on a private boat',['private','curated','boat']],
    ['Massage, brunch, and pretending emails don’t exist',['slow','wellness','food']],
    ['Wandering through the local market',['food','local','market']]
  ];
  const PLACEHOLDERS = ['Marco','Luna','IslandCat','The Dutch Guy','SandyFeet','Still Hungover'];
  const state = { step:1, nickname:'', vibes:[] };
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
      .sanvic-entry-count{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.34);font-weight:600;flex-shrink:0}.sanvic-vibe-grid{display:grid;grid-template-columns:1fr;gap:8px;overflow-y:auto;max-height:34dvh;min-height:0;padding:1px 2px 8px;overscroll-behavior:contain}.sanvic-vibe-option{border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.84);font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:.88rem;font-weight:400;line-height:1.25;text-align:left;padding:12px 14px;letter-spacing:-.01em}.sanvic-vibe-option.selected{border-color:rgba(20,184,166,.42);background:rgba(20,184,166,.13);color:rgba(255,255,255,.95);box-shadow:inset 0 0 0 1px rgba(20,184,166,.08)}.sanvic-vibe-option.disabled{opacity:.45}.sanvic-entry-smile{font-family:var(--font-body,'DM Sans',-apple-system,sans-serif);font-size:2.7rem;color:var(--limestone,#c4a882);line-height:1;font-weight:300}
      @media(min-width:700px){.sanvic-entry{justify-content:flex-start;padding-left:max(6vw,70px)}.sanvic-entry-card{width:min(46vw,560px);max-height:min(86vh,720px)}.sanvic-entry-inner{padding:32px 28px 24px}.sanvic-entry-title{font-size:clamp(2.1rem,3.2vw,3rem)}.sanvic-vibe-grid{grid-template-columns:1fr 1fr;max-height:40vh}}
      @media(max-height:720px){.sanvic-entry-inner{gap:10px;padding-top:18px;padding-bottom:14px}.sanvic-entry-title{font-size:1.72rem}.sanvic-entry-sub{font-size:.82rem}.sanvic-vibe-grid{max-height:28dvh}.sanvic-vibe-option{padding:9px 11px;font-size:.82rem}.sanvic-entry-primary{min-height:46px}}
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
      const ph=PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)];
      w.innerHTML=`<div class="sanvic-entry-kicker">SANVIC</div><h1 class="sanvic-entry-title">How should we call you?</h1><p class="sanvic-entry-sub">Just a nickname.<br>No account. No email. No drama.</p><input id="sanvicName" class="sanvic-entry-input" maxlength="32" autocomplete="off" placeholder="${esc(ph)}" value="${esc(state.nickname)}"><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryNext">Continue</button><button type="button" class="sanvic-entry-secondary" id="entrySkip">Skip</button></div>`;
      const input=document.getElementById('sanvicName');
      input.addEventListener('input',()=>state.nickname=input.value);
      input.addEventListener('keydown',e=>{if(e.key==='Enter') next();});
      bindAction('entryNext', next);
      bindAction('entrySkip', ()=>{state.nickname='';state.step=2;render();});
      setTimeout(()=>input.focus({preventScroll:true}),80);
      return;
    }
    if(state.step===2){
      const count=state.vibes.length;
      w.innerHTML=`<div class="sanvic-entry-kicker">Your San Vicente mood</div><h1 class="sanvic-entry-title">Tomorrow at 3 PM, where do you see yourself?</h1><p class="sanvic-entry-sub">Choose up to 4.</p><div class="sanvic-entry-count">${count}/${MAX} chosen</div><div class="sanvic-vibe-grid">${VIBES.map((v,i)=>{const sel=state.vibes.includes(v[0]);const dis=!sel&&count>=MAX;return `<button type="button" class="sanvic-vibe-option ${sel?'selected':''} ${dis?'disabled':''}" data-i="${i}">${esc(v[0])}</button>`;}).join('')}</div><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryNext">Continue</button></div>`;
      document.querySelectorAll('.sanvic-vibe-option').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.i)));
      bindAction('entryNext', next);
      return;
    }
    const name=state.nickname.trim()||'Traveler';
    w.innerHTML=`<div class="sanvic-entry-kicker">The map is open</div><div class="sanvic-entry-smile">:)</div><h1 class="sanvic-entry-title">${esc(name)}, welcome to San Vicente :)</h1><p class="sanvic-entry-sub">The map is open.<br>The day is still unwritten.</p><p class="sanvic-entry-note">A few things are already happening today.</p><div class="sanvic-entry-actions"><button type="button" class="sanvic-entry-primary" id="entryEnter">Enter San Vicente</button></div>`;
    bindAction('entryEnter', complete);
  }

  function next(){ if(state.step===1){const i=document.getElementById('sanvicName');state.nickname=(i?i.value:'').trim();state.step=2;} else if(state.step===2){state.step=3;} render(); }
  function toggle(i){ const v=VIBES[i]; if(!v)return; const k=state.vibes.indexOf(v[0]); if(k>=0)state.vibes.splice(k,1); else if(state.vibes.length<MAX)state.vibes.push(v[0]); render(); }
  function applyProfile(p){ const x=p||saved(); if(!x)return; document.body.dataset.sanvicVibes=(x.vibeTags||[]).join(' '); if(x.nickname)document.body.dataset.sanvicNickname=x.nickname; const n=document.getElementById('pulseComposeName'); if(n&&x.nickname&&!n.value)n.value=x.nickname; }
  function unlock(){ document.body.classList.remove('sanvic-entry-lock'); const b=document.getElementById('bottomDock'); if(b)b.classList.add('visible'); const t=document.getElementById('talaOrbWrap'); if(t)t.classList.remove('hidden'); applyProfile(); }
  function complete(){
    if(completed) return;
    completed = true;
    const p={nickname:state.nickname.trim(),vibes:state.vibes.slice(),vibeTags:tags(),enteredAt:new Date().toISOString()};
    try{ localStorage.setItem(KEY,JSON.stringify(p)); }catch(e){}
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
  // Explore is immediately usable. Personalisation remains an explicit choice.
})();
