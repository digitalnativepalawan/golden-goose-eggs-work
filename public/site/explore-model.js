/* Shared pure directory rules. No database, DOM or second content store. */
(function(root){
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const hasCoordinates = d => d.lat !== null && d.lng !== null && String(d.lat).trim() !== '' && String(d.lng).trim() !== '' && Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng)) && Math.abs(Number(d.lat)) <= 90 && Math.abs(Number(d.lng)) <= 180;
  function safeUrl(value, local=false){
    const raw = String(value || '').trim();
    if(!raw) return '';
    if(local && /^(?:assets\/|\/site\/assets\/)/.test(raw) && !raw.includes('..')) return raw;
    try{ const u = new URL(raw); return ['https:','http:'].includes(u.protocol) ? u.href : ''; }catch(e){ return ''; }
  }
  function filter(places, state, categories){
    const terms = normalize(state.query).split(/\s+/).filter(Boolean);
    return places.filter(d => {
      if(state.category !== 'all' && d.category !== state.category) return false;
      if(state.area && normalize(d.barangay) !== normalize(state.area)) return false;
      const haystack = normalize([d.name,d.barangay,d.category,categories[d.category]?.label,d.description,d.tip].join(' '));
      return terms.every(t => haystack.includes(t));
    });
  }
  function distanceKm(a,b){
    const rad = Math.PI/180, lat=(b.lat-a.lat)*rad, lng=(b.lng-a.lng)*rad;
    const h=Math.sin(lat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(lng/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
  }
  root.SanvicExplore = { normalize, hasCoordinates, safeUrl, filter, distanceKm };
})(typeof window === 'undefined' ? globalThis : window);
