// ═══════════════════════════════════════════════════════
// SANVIC Entry Experience Polish
// Visual refinement only: keeps the exact flow, copy, and logic intact.
// ═══════════════════════════════════════════════════════
(function polishSanvicEntryExperience(){
  function injectPolishStyles(){
    if(document.getElementById('sanvicEntryPolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'sanvicEntryPolishStyles';
    style.textContent = `
      .sanvic-entry-experience{align-items:flex-end!important;justify-content:center!important;padding:calc(var(--safe-top,24px) + 18px) 18px calc(var(--safe-bottom,0px) + 28px)!important;background:radial-gradient(circle at 50% 20%,rgba(20,184,166,.13),transparent 28%),linear-gradient(180deg,rgba(2,14,38,.24),rgba(2,14,38,.86))!important}
      .sanvic-entry-backdrop{background:rgba(2,14,38,.28)!important;backdrop-filter:blur(9px) saturate(1.1)!important;-webkit-backdrop-filter:blur(9px) saturate(1.1)!important}
      .sanvic-entry-card{width:min(100%,460px)!important;border-radius:30px!important;background:linear-gradient(180deg,rgba(7,18,39,.72),rgba(3,12,30,.94))!important;border:1px solid rgba(232,220,200,.1)!important;box-shadow:0 34px 110px rgba(0,0,0,.5),0 0 80px rgba(20,184,166,.07),0 0 0 1px rgba(255,255,255,.025) inset!important}
      .sanvic-entry-inner{padding:28px 22px 22px!important;gap:18px!important}
      .sanvic-entry-kicker{letter-spacing:.42em!important;color:rgba(232,220,200,.72)!important}
      .sanvic-entry-title{font-size:clamp(2.2rem,10vw,3.05rem)!important;line-height:1!important;max-width:360px!important;text-wrap:balance!important}
      .sanvic-entry-sub{font-size:.88rem!important;color:rgba(255,255,255,.58)!important;line-height:1.55!important;margin-top:-2px!important}
      .sanvic-entry-input{height:56px!important;border-radius:20px!important;background:rgba(255,255,255,.055)!important;border-color:rgba(232,220,200,.11)!important;font-size:.98rem!important}
      .sanvic-entry-primary{height:52px!important;letter-spacing:.03em!important;background:linear-gradient(135deg,#efe2ca,#c8a672)!important;box-shadow:0 12px 30px rgba(196,168,130,.18)!important}
      .sanvic-entry-secondary{height:38px!important;color:rgba(255,255,255,.46)!important}
      .sanvic-vibe-grid{gap:10px!important;max-height:min(48vh,390px)!important}
      .sanvic-vibe-option{border-radius:20px!important;padding:14px 15px!important;background:rgba(255,255,255,.052)!important}
      .sanvic-vibe-option.selected{background:rgba(224,122,95,.16)!important;border-color:rgba(224,122,95,.56)!important;transform:translateY(-1px)!important}
      .sanvic-entry-card::after{content:'Welcome to San Vicente. Tell us your vibe and step inside.';display:block;position:absolute;left:24px;right:24px;bottom:-34px;text-align:center;font-family:var(--font-body,-apple-system,sans-serif);font-size:.68rem;line-height:1.4;color:rgba(255,255,255,.34);letter-spacing:.02em;pointer-events:none}
      @media (min-width:700px){
        .sanvic-entry-experience{align-items:center!important;justify-content:flex-start!important;padding-left:max(6vw,72px)!important;padding-right:18px!important}
        .sanvic-entry-card{width:min(44vw,540px)!important}
        .sanvic-entry-inner{padding:34px 30px 28px!important}
        .sanvic-entry-title{font-size:clamp(2.6rem,4vw,4rem)!important;max-width:470px!important}
        .sanvic-entry-sub{font-size:.94rem!important}
        .sanvic-vibe-grid{grid-template-columns:1fr 1fr!important;max-height:min(46vh,420px)!important}
      }
      @media (max-width:420px){
        .sanvic-entry-experience{align-items:flex-end!important;padding-left:14px!important;padding-right:14px!important;padding-bottom:calc(var(--safe-bottom,0px) + 18px)!important}
        .sanvic-entry-card{border-radius:28px!important}
        .sanvic-entry-inner{padding:26px 20px 20px!important}
      }
    `;
    document.head.appendChild(style);
  }

  injectPolishStyles();
})();
