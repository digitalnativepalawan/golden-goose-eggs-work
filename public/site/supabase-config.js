// ═══════════════════════════════════════════════════════
// Supabase connection for the static SANVIC.PH site.
// Public anon/publishable key — safe to expose client-side,
// access is governed by Row Level Security policies on the
// destinations / tala_responses / tala_settings tables.
// ═══════════════════════════════════════════════════════
const SUPABASE_URL = "https://qkbqvdwplgakjdhxdbiz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZvdKuIsiZIsW2-w1bHts2w_HHBj6r4-";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { apikey: SUPABASE_ANON_KEY } },
});

(function loadSanvicExperienceModules(){
  // Modules share the page-wide deploy stamp set in index.html, so bumping
  // SANVIC_DEPLOY_VERSION there refreshes everything at once. Date.now()
  // fallback keeps modules loading (uncached) if the stamp is ever missing.
  const v = encodeURIComponent(window.SANVIC_DEPLOY_VERSION || String(Date.now()));
  // Map hierarchy and sizing now belong to app.js. The legacy pin scripts
  // repeatedly reset filters/zoom and are intentionally no longer loaded.
  ['entry-flow.js', 'personalize.js', 'pulse-demo-content.js'].forEach((file) => {
    const script = document.createElement('script');
    script.src = file + '?v=' + v;
    document.body.appendChild(script);
  });
})();
