// SANVIC mobile map/nav cleanup
// Keeps the restored floating TALA orb visible while syncing the footer nav labels.
(function(){
  const BARANGAY_ONLY_MAX_ZOOM = 12;
  const POI_VISIBLE_MIN_ZOOM = 13;
  let barangayMarkerLayer = null;

  // ─── Barangay pin placement ───
  // A polygon's bounding-box center (what Leaflet's getBounds().getCenter()
  // gives you) is not guaranteed to fall inside the polygon — for coastal,
  // crescent, or multi-island barangays it routinely lands in open water.
  // This computes a real "visual center": the interior point farthest from
  // every edge (a simplified pole-of-inaccessibility search), so the dot
  // always sits on land, roughly centered in the barangay's main landmass.
  function ringSignedArea(ring){
    let a = 0;
    for(let i=0, j=ring.length-1; i<ring.length; j=i++) a += ring[j][0]*ring[i][1] - ring[i][0]*ring[j][1];
    return a/2;
  }
  function pointInRing(pt, ring){
    let inside = false;
    for(let i=0, j=ring.length-1; i<ring.length; j=i++){
      const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
      if(((yi>pt[1])!==(yj>pt[1])) && (pt[0] < (xj-xi)*(pt[1]-yi)/(yj-yi)+xi)) inside = !inside;
    }
    return inside;
  }
  function pointInPolygon(pt, rings){
    if(!pointInRing(pt, rings[0])) return false;
    for(let i=1; i<rings.length; i++) if(pointInRing(pt, rings[i])) return false;
    return true;
  }
  function distToSegment(pt, a, b){
    const dx=b[0]-a[0], dy=b[1]-a[1];
    const lenSq = dx*dx+dy*dy;
    let t = lenSq ? ((pt[0]-a[0])*dx+(pt[1]-a[1])*dy)/lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(pt[0]-(a[0]+t*dx), pt[1]-(a[1]+t*dy));
  }
  function distToPolygonBoundary(pt, rings){
    let min = Infinity;
    rings.forEach(function(ring){
      for(let i=0, j=ring.length-1; i<ring.length; j=i++) min = Math.min(min, distToSegment(pt, ring[i], ring[j]));
    });
    return min;
  }
  function ringCentroid(ring){
    let area=0, cx=0, cy=0;
    for(let i=0, j=ring.length-1; i<ring.length; j=i++){
      const cross = ring[j][0]*ring[i][1] - ring[i][0]*ring[j][1];
      area += cross;
      cx += (ring[j][0]+ring[i][0])*cross;
      cy += (ring[j][1]+ring[i][1])*cross;
    }
    area *= 0.5;
    if(Math.abs(area) < 1e-12) return null;
    return [cx/(6*area), cy/(6*area)];
  }
  function visualCenterOfPolygon(rings){
    const ring = rings[0];
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    ring.forEach(function(p){ if(p[0]<minX)minX=p[0]; if(p[0]>maxX)maxX=p[0]; if(p[1]<minY)minY=p[1]; if(p[1]>maxY)maxY=p[1]; });

    let gx0=minX, gy0=minY, gw=maxX-minX, gh=maxY-minY, steps=14;
    let best=null, bestDist=-Infinity;
    for(let pass=0; pass<4; pass++){
      for(let iy=0; iy<=steps; iy++){
        for(let ix=0; ix<=steps; ix++){
          const x = gx0 + gw*ix/steps, y = gy0 + gh*iy/steps;
          if(!pointInPolygon([x,y], rings)) continue;
          const d = distToPolygonBoundary([x,y], rings);
          if(d > bestDist){ bestDist = d; best = [x,y]; }
        }
      }
      if(!best) break;
      gw/=3; gh/=3; gx0=best[0]-gw/2; gy0=best[1]-gh/2; steps=10;
    }
    if(best && bestDist > 0) return best;

    const centroid = ringCentroid(ring);
    if(centroid && pointInPolygon(centroid, rings)) return centroid;
    return centroid || [(minX+maxX)/2, (minY+maxY)/2];
  }
  function visualCenterOfFeature(feature){
    const geom = feature && feature.geometry;
    if(!geom) return null;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : (geom.type === 'MultiPolygon' ? geom.coordinates : null);
    if(!polys || !polys.length) return null;
    let bestPoly = polys[0], bestArea = -Infinity;
    polys.forEach(function(rings){
      const a = Math.abs(ringSignedArea(rings[0]));
      if(a > bestArea){ bestArea = a; bestPoly = rings; }
    });
    const c = visualCenterOfPolygon(bestPoly);
    return c ? { lat: c[1], lng: c[0] } : null;
  }

  function addStyles(){
    if(document.getElementById('sanvicMapPinNoPulseCss')) return;
    const s = document.createElement('style');
    s.id = 'sanvicMapPinNoPulseCss';
    s.textContent = `
      .splash-tagline{color:rgba(255,255,255,.72)!important;text-shadow:0 2px 12px rgba(0,0,0,.55)!important;font-weight:400!important;}
      .splash-footer{color:rgba(255,255,255,.72)!important;text-shadow:0 2px 12px rgba(0,0,0,.6)!important;font-weight:600!important;opacity:1!important;}
      .leaflet-control-zoom{display:none!important;visibility:hidden!important;pointer-events:none!important;}
      #talaOrbWrap,.tala-orb-wrap{display:flex!important;visibility:visible!important;pointer-events:auto!important;}
      #talaOrbWrap.hidden,.tala-orb-wrap.hidden{opacity:0!important;pointer-events:none!important;transform:translateY(20px)!important;}
      /* Legacy triple-layer markers removed in favour of neon dots. */
      .mk-wrap,.mk-ring,.mk-glow,.mk-dot{display:none!important;visibility:hidden!important;opacity:0!important;}
      .leaflet-marker-icon{overflow:visible!important;}
      /* ─── Signature neon-dot markers ─── */
      .sv-neon-icon{background:none!important;border:none!important;}
      .sv-neon-pin{position:relative;width:14px;height:14px;display:flex;align-items:center;justify-content:center;pointer-events:auto;}
      .sv-neon-core{width:7px;height:7px;border-radius:999px;background:var(--sv-neon,#39ff88);box-shadow:0 0 6px var(--sv-neon,#39ff88),0 0 14px color-mix(in oklab,var(--sv-neon,#39ff88) 65%,transparent),0 0 26px color-mix(in oklab,var(--sv-neon,#39ff88) 30%,transparent);animation:svNeonPulse 2.6s ease-in-out infinite;}
      @keyframes svNeonPulse{0%,100%{opacity:.88;box-shadow:0 0 5px var(--sv-neon,#39ff88),0 0 11px color-mix(in oklab,var(--sv-neon,#39ff88) 55%,transparent),0 0 20px color-mix(in oklab,var(--sv-neon,#39ff88) 22%,transparent);}50%{opacity:1;box-shadow:0 0 8px var(--sv-neon,#39ff88),0 0 18px color-mix(in oklab,var(--sv-neon,#39ff88) 70%,transparent),0 0 32px color-mix(in oklab,var(--sv-neon,#39ff88) 34%,transparent);}}
      @media(max-width:767px){.sv-neon-core{width:6px;height:6px;}}
      .sv-brgy-icon{background:none!important;border:none!important;}
      .sv-brgy-pin{display:flex;align-items:center;gap:8px;transform:translate(-10px,-10px);white-space:nowrap;pointer-events:auto;}
      .sv-brgy-dot{width:7px;height:7px;border-radius:999px;background:#00b3ff;border:none;box-shadow:0 0 6px #00b3ff,0 0 14px rgba(0,179,255,.55),0 0 24px rgba(0,179,255,.28);animation:svNeonPulse 2.8s ease-in-out infinite;}
      .sv-brgy-label{font-family:var(--font-body);font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(232,244,255,.94);text-shadow:0 2px 8px rgba(0,0,0,.8);background:rgba(4,12,30,.48);border:1px solid rgba(0,179,255,.28);border-radius:999px;padding:5px 9px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}

      @media(max-width:767px){
        .splash-tagline{font-size:.98rem!important;line-height:1.75!important;color:rgba(255,255,255,.76)!important;}
        .splash-footer{font-size:.72rem!important;color:rgba(255,255,255,.76)!important;letter-spacing:.38em!important;opacity:1!important;}
        .bottom-dock{bottom:calc(12px + var(--safe-bottom))!important;width:min(calc(100vw - 42px),430px)!important;padding:6px 7px!important;gap:1px!important;background:rgba(4,12,30,.74)!important;border-color:rgba(255,255,255,.08)!important;box-shadow:0 12px 34px rgba(0,0,0,.34)!important;}
        .dock-item{flex:1!important;width:auto!important;height:48px!important;border-radius:18px!important;gap:2px!important;color:rgba(255,255,255,.72)!important;background:transparent!important;}
        .dock-item svg{width:22px!important;height:22px!important;stroke:rgba(255,255,255,.84)!important;stroke-width:1.85!important;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5));}
        .dock-item span{font-size:.58rem!important;letter-spacing:.01em!important;color:rgba(255,255,255,.62)!important;}
        .dock-item.active{color:rgba(255,255,255,.96)!important;background:rgba(255,255,255,.055)!important;}
        .dock-item.active span{color:rgba(255,255,255,.9)!important;}
        .dock-item.active::after{bottom:3px!important;width:4px!important;height:4px!important;box-shadow:0 0 8px rgba(20,184,166,.38)!important;}
        .dock-item.active svg{stroke:rgba(255,255,255,.98)!important;filter:drop-shadow(0 0 10px rgba(20,184,166,.32));}
        .dock-item[data-tab="tala"]{transform:none!important;}
        .dock-item[data-tab="tala"] svg{width:22px!important;height:22px!important;stroke-width:1.85!important;}
        .dock-item[data-tab="tala"].active{background:rgba(255,255,255,.055)!important;box-shadow:none!important;}
        .sv-brgy-label{font-size:.62rem;padding:4px 8px;}

        .dest-sheet.expanded .sanvic-dest-close{display:flex!important;}
        .sanvic-dest-close{position:fixed;top:calc(var(--safe-top) + 12px);right:14px;z-index:130;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(4,12,30,.72);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);color:rgba(255,255,255,.92);align-items:center;justify-content:center;font-size:24px;line-height:1;box-shadow:0 8px 24px rgba(0,0,0,.32);}
      }
    `;
    document.head.appendChild(s);
  }

  function restoreTalaFloatingOrb(){
    const wrap = document.getElementById('talaOrbWrap');
    const orb = document.getElementById('talaOrb');
    if(wrap){
      wrap.style.removeProperty('display');
      wrap.style.removeProperty('visibility');
      wrap.setAttribute('aria-label', 'Ask TALA');
      wrap.dataset.adminNavLabel = 'TALA';
    }
    if(orb){
      orb.setAttribute('aria-label', 'Ask TALA');
      orb.setAttribute('title', 'Ask TALA');
    }
    const label = document.querySelector('#talaOrbWrap .tala-orb-label');
    if(label) label.textContent = 'Ask TALA';
  }

  function ensureDestinationClose(){
    const sheet = document.getElementById('destSheet');
    if(!sheet || document.getElementById('sanvicDestClose')) return;
    const b = document.createElement('button');
    b.id = 'sanvicDestClose';
    b.className = 'sanvic-dest-close';
    b.type = 'button';
    b.setAttribute('aria-label','Back to map');
    b.textContent = '×';
    b.style.display = 'none';
    b.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof closeDestSheet === 'function') closeDestSheet();
    };
    sheet.appendChild(b);
  }

  function escapeText(value){
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function ensureBarangayMarkers(){
    try{
      if(barangayMarkerLayer || typeof L === 'undefined' || typeof map === 'undefined' || !map || typeof SAN_VICENTE_BARANGAYS === 'undefined') return;
      barangayMarkerLayer = L.layerGroup();
      SAN_VICENTE_BARANGAYS.features.forEach(function(feature){
        const name = feature && feature.properties && feature.properties.name;
        if(!name) return;
        const vc = visualCenterOfFeature(feature);
        const center = vc ? L.latLng(vc.lat, vc.lng) : L.geoJSON(feature).getBounds().getCenter();
        const displayName = (name === 'Poblacion') ? 'San Vicente - Poblacion' : name;
        const html = '<div class="sv-brgy-pin"><span class="sv-brgy-dot"></span><span class="sv-brgy-label">' + escapeText(displayName) + '</span></div>';
        const marker = L.marker(center, {
          icon: L.divIcon({ className:'sv-brgy-icon', html: html, iconSize:[160,32], iconAnchor:[8,16] }),
          interactive: true,
          keyboard: false
        });
        marker.on('click', function(){ map.flyTo(center, POI_VISIBLE_MIN_ZOOM, { duration:.8 }); });
        marker.addTo(barangayMarkerLayer);
      });
      updateMapMarkerHierarchy();
      map.on('zoomend moveend', updateMapMarkerHierarchy);
    }catch(e){}
  }

  function updateMapMarkerHierarchy(){
    try{
      if(typeof map === 'undefined' || !map || !barangayMarkerLayer) return;
      const zoom = map.getZoom();
      const municipalityView = zoom <= BARANGAY_ONLY_MAX_ZOOM;

      if(municipalityView){
        if(!map.hasLayer(barangayMarkerLayer)) barangayMarkerLayer.addTo(map);
        if(typeof allMarkers !== 'undefined' && Array.isArray(allMarkers)){
          allMarkers.forEach(function(marker){ if(map.hasLayer(marker)) map.removeLayer(marker); });
        }
        if(typeof pinsCurrentlyVisible !== 'undefined') pinsCurrentlyVisible = false;
      } else {
        if(map.hasLayer(barangayMarkerLayer)) map.removeLayer(barangayMarkerLayer);
        if(zoom >= POI_VISIBLE_MIN_ZOOM && typeof activeMarkerSet !== 'undefined' && Array.isArray(activeMarkerSet)){
          activeMarkerSet.forEach(function(marker){ if(!map.hasLayer(marker)) marker.addTo(map); });
          if(typeof pinsCurrentlyVisible !== 'undefined') pinsCurrentlyVisible = true;
        }
      }
    }catch(e){}
  }

  function applyMapOpening(){
    try{
      if(typeof map !== 'undefined' && map && !window.__sanvicMunicipalityViewDone){
        window.__sanvicMunicipalityViewDone = true;
        map.setView([10.50, 119.20], 10, { animate:false });
      }
      if(typeof activeMarkerSet !== 'undefined' && typeof allMarkers !== 'undefined' && Array.isArray(allMarkers)) activeMarkerSet = allMarkers;
      if(typeof pinVisibilityOverride !== 'undefined') pinVisibilityOverride = false;
      ensureBarangayMarkers();
      updateMapMarkerHierarchy();
    }catch(e){}
  }

  function boot(){
    addStyles();
    let tries = 0;
    const timer = setInterval(function(){
      tries += 1;
      restoreTalaFloatingOrb();
      ensureDestinationClose();
      applyMapOpening();
      if(tries > 80) clearInterval(timer);
    }, 150);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
