// SANVIC barangay marker polish
// Visual-only refinement for the municipality-level barangay dots and labels.
(function(){
  let overviewApplied = false;
  let overviewTimer = null;

  function addStyles(){
    if(document.getElementById('sanvicBarangayMarkerPolishCss')) return;
    const style = document.createElement('style');
    style.id = 'sanvicBarangayMarkerPolishCss';
    style.textContent = `
      .sv-brgy-pin{gap:5px!important;transform:translate(-6px,-7px)!important;}
      .sv-brgy-dot{width:7px!important;height:7px!important;border:none!important;box-shadow:none!important;}
      .sv-brgy-label{font-size:.56rem!important;letter-spacing:.035em!important;padding:2px 6px!important;line-height:1.05!important;background:rgba(4,12,30,.32)!important;border-color:rgba(29,155,240,.14)!important;}
      .sv-brgy-pin.label-hidden .sv-brgy-label{display:none!important;}
      @media(min-width:768px) and (max-width:1024px){
        .sv-brgy-dot{width:7px!important;height:7px!important;border:none!important;box-shadow:none!important;}
        .sv-brgy-label{font-size:.52rem!important;padding:2px 5px!important;letter-spacing:.03em!important;}
      }
      @media(max-width:767px){
        .sv-brgy-pin{gap:3px!important;transform:translate(-5px,-6px)!important;}
        .sv-brgy-dot{width:6px!important;height:6px!important;border:none!important;box-shadow:none!important;}
        .sv-brgy-label{font-size:.44rem!important;padding:1px 4px!important;letter-spacing:.02em!important;background:rgba(4,12,30,.28)!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function fitMunicipalityOverview(force){
    try{
      if(typeof map === 'undefined' || !map || typeof L === 'undefined' || typeof SAN_VICENTE_BARANGAYS === 'undefined') return false;
      if(overviewApplied && !force) return true;
      const bounds = L.geoJSON(SAN_VICENTE_BARANGAYS).getBounds();
      const w = window.innerWidth || 1024;
      const padding = w <= 767 ? [42, 72] : (w <= 1024 ? [56, 82] : [72, 96]);
      map.fitBounds(bounds, { padding, maxZoom: 10, animate: false });
      document.body.classList.add('sanvic-overview');
      overviewApplied = true;
      setTimeout(layoutLabels, 120);
      return true;
    }catch(e){ return false; }
  }

  function overlap(a,b,pad){
    return !(a.right + pad < b.left || a.left - pad > b.right || a.bottom + pad < b.top || a.top - pad > b.bottom);
  }

  function layoutLabels(){
    try{
      const pins = Array.from(document.querySelectorAll('.sv-brgy-pin'));
      if(!pins.length) return;
      pins.forEach(pin => pin.classList.remove('label-hidden'));

      const w = window.innerWidth || 1024;
      const phone = w <= 767;
      const z = (typeof map !== 'undefined' && map && map.getZoom) ? map.getZoom() : 10;

      // Zoomed out: dots only, no labels — keeps the overview map clean.
      // Labels reveal as the user zooms in and are then de-cluttered by
      // an overlap pass so nothing stacks.
      if(z <= 11){
        pins.forEach(pin => pin.classList.add('label-hidden'));
        return;
      }

      const visible = [];
      pins.forEach((pin) => {
        const label = pin.querySelector('.sv-brgy-label');
        if(!label) return;
        const rect = label.getBoundingClientRect();
        const pad = phone ? 6 : 5;
        if(visible.some(existing => overlap(rect, existing, pad))){
          pin.classList.add('label-hidden');
        } else {
          visible.push(rect);
        }
      });
    }catch(e){}
  }

  function boot(){
    addStyles();
    let tries = 0;
    overviewTimer = setInterval(function(){
      tries += 1;
      fitMunicipalityOverview(false);
      layoutLabels();
      if(tries > 120) clearInterval(overviewTimer);
    }, 150);
    window.addEventListener('resize', () => {
      overviewApplied = false;
      setTimeout(() => { fitMunicipalityOverview(true); layoutLabels(); }, 160);
    }, { passive:true });
    try{
      if(typeof map !== 'undefined' && map && map.on){
        map.on('zoomend moveend resize', function(){
          const z = map.getZoom ? map.getZoom() : 10;
          if(z > 10) document.body.classList.remove('sanvic-overview');
          setTimeout(layoutLabels, 80);
        });
      }
    }catch(e){}
  }

  window.sanvicFitMunicipalityOverview = function(){
    overviewApplied = false;
    fitMunicipalityOverview(true);
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
