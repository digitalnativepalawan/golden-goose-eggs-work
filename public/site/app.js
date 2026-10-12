// ═══════════════════════════════════════════════════════
// SANVIC.PH × TALA — Clean Interaction Model
// One active layer at a time. Map is the product.
// Data lives in Supabase (destinations, tala_responses, tala_settings).
// Hardcoded arrays below are only the fallback used if the
// Supabase fetch fails (offline, RLS issue, etc).
// ═══════════════════════════════════════════════════════

// ─── DEFAULT/FALLBACK DATA ───
const DEFAULT_DESTINATIONS = [
  { id:1, name:"Long Beach", lat:10.4962, lng:119.2607, category:"beaches",
    image:"assets/san-vicente-long-beach.jpg",
    description:"San Vicente's signature coastline: a long, open sweep of golden sand with gentle water, coconut edges, and quiet sections that still feel undeveloped compared with busier Palawan towns.",
    tip:"Best for sunset, long walks, and easy swimming. Start near Poblacion, then move north or south for quieter stretches.",
    stats:{rating:"4.9",travel:"10m from Poblacion",temp:"29°C",season:"Nov–May"}, color:"#0ea5e9" },
  { id:2, name:"Port Barton", lat:10.4102, lng:119.1771, category:"beaches",
    image:"assets/san-vicente-port-barton.jpg",
    description:"A relaxed fishing village inside San Vicente with calm bay views, island-hopping boats, simple beachfront stays, and a slower local rhythm made for unhurried travelers.",
    tip:"Use Port Barton as the base for island hopping. Bring cash, book boats early, and expect a quieter night scene.",
    stats:{rating:"4.8",travel:"1h 20m from Poblacion",temp:"29°C",season:"Dec–May"}, color:"#0ea5e9" },
  { id:3, name:"Boayan Island", lat:10.5500, lng:119.0900, category:"islands",
    image:"assets/san-vicente-boayan.jpg",
    description:"A remote island off San Vicente with clear water, forested hills, small coves, and a frontier feeling for travelers who want a quieter island escape.",
    tip:"Go with a local boat operator and check sea conditions. Pack water, snacks, dry bag, and reef-safe sunscreen.",
    stats:{rating:"4.7",travel:"Boat from San Vicente",temp:"30°C",season:"Mar–May"}, color:"#8b5cf6" },
  { id:4, name:"German Island", lat:10.4586, lng:119.0705, category:"islands",
    image:"assets/san-vicente-boayan.jpg",
    description:"A small island stop often paired with Port Barton tours, known for clear shallows, snorkeling areas, and peaceful beach time between boat rides.",
    tip:"Ask your boatman about turtle-friendly viewing rules. Keep distance from wildlife and avoid stepping on coral.",
    stats:{rating:"4.6",travel:"30–45m by boat",temp:"30°C",season:"Dec–May"}, color:"#8b5cf6" },
  { id:5, name:"Pamuayan Falls", lat:10.3908, lng:119.2083, category:"nature",
    image:"assets/san-vicente-waterfalls.jpg",
    description:"A freshwater waterfall near Port Barton reached by a short inland ride and forest walk, ideal when you want a break from saltwater and beach heat.",
    tip:"Wear sandals with grip. Go after light rain for stronger flow, but avoid trails during heavy rain.",
    stats:{rating:"4.5",travel:"25m from Port Barton",temp:"27°C",season:"Year-round"}, color:"#22c55e" },
  { id:6, name:"Bato ni Ningning", lat:10.5634, lng:119.3092, category:"nature",
    image:"assets/san-vicente-long-beach.jpg",
    description:"A scenic viewpoint above San Vicente where the coast, green hills, and Long Beach reveal the scale of the municipality from above.",
    tip:"Go late afternoon for softer light. Use a motorbike or tricycle and allow extra time for the uphill route.",
    stats:{rating:"4.6",travel:"35m from Poblacion",temp:"28°C",season:"Nov–May"}, color:"#22c55e" },
  { id:7, name:"San Vicente - Poblacion", lat:10.5318, lng:119.2822, category:"culture",
    image:"assets/san-vicente-long-beach.jpg",
    description:"The practical center of San Vicente, with access to Long Beach, transport, small eateries, municipal services, and local life away from the island-hopping crowds.",
    tip:"Use Poblacion for arrivals, supplies, and Long Beach access. Confirm van and boat schedules one day ahead.",
    stats:{rating:"4.4",travel:"Town center",temp:"29°C",season:"Year-round"}, color:"#f59e0b" },
  { id:8, name:"Inaladelan Island", lat:10.4643, lng:119.0447, category:"islands",
    image:"assets/san-vicente-boayan.jpg",
    description:"A polished island stop from Port Barton with bright sand, clear water, hammocks, and an easy picnic atmosphere for day trips.",
    tip:"Often included in Port Barton island-hopping. Bring a small dry bag and ask if environmental fees are included.",
    stats:{rating:"4.7",travel:"Boat from Port Barton",temp:"30°C",season:"Dec–May"}, color:"#8b5cf6" }
];

const DEFAULT_TALA_DATA = [
  {kw:["beach","beaches","sandy","shore","long beach"],
    r:`<strong>San Vicente Beaches</strong><br><br>1. <strong>Long Beach</strong> — the main 14km coastal highlight<br>2. <strong>Port Barton</strong> — calm bay, boats, relaxed village life<br>3. <strong>Inaladelan Island</strong> — bright sand and easy day-trip water<br><br>Best light: sunrise for quiet, sunset for color.`},
  {kw:["san vicente","sanvicente","sanvic"],
    r:`<strong>San Vicente, Palawan</strong><br><br>Focus on Long Beach, Port Barton, Boayan Island, Inaladelan Island, Pamuayan Falls, Bato ni Ningning, and Poblacion. It is quieter than El Nido or Coron, so navigation, cash, and local transport planning matter.`},
  {kw:["port barton","barton"],
    r:`<strong>Port Barton</strong><br><br>A calm San Vicente village for island hopping, beachfront stays, snorkeling, and slow travel. Bring cash, book boats early, and keep plans flexible for weather.`},
  {kw:["island","islands","island hop","island-hopping"],
    r:`<strong>Island Hopping from San Vicente</strong><br><br>Use Port Barton for German Island, Inaladelan Island, turtle-viewing areas, and reef stops. For a more remote feel, ask local operators about Boayan Island and check sea conditions first.`},
  {kw:["time","visit","weather","season","month"],
    r:`<strong>Best Time for San Vicente</strong><br><br>Nov–May is the easiest window for Long Beach and Port Barton island hopping. Mar–May has calmer seas and hotter days. Jun–Oct can still work, but boat trips are more weather-dependent.`},
  {kw:["get","transport","flight","bus","ferry","travel"],
    r:`<strong>Getting Around San Vicente</strong><br><br>Puerto Princesa → San Vicente: van or bus, usually 3–4.5 hours.<br>Poblacion → Port Barton: around 1–1.5 hours by road.<br><br>Local movement: tricycle, motorbike rental, hired van, and boat transfers for islands. Confirm schedules one day ahead.`},
  {kw:["budget","cost","money","price","cheap"],
    r:`<strong>San Vicente Budget Guide</strong><br><br>Budget: 1,800–3,500₱/day<br>Mid-range: 4,000–8,000₱/day<br>Boat tours vary by route and group size.<br><br>Bring cash, especially for Port Barton, island stops, and small eateries.`},
  {kw:["food","eat","restaurant","dish","cuisine"],
    r:`<strong>Food Around San Vicente</strong><br><br>Look for grilled fish, kinilaw, simple beachfront carinderias, fresh fruit, and local seafood in Port Barton or Poblacion. Many small places are cash-only.`},
  {kw:["accommodation","stays","hotel","lodging","resort","where to stay","place to stay","stay","accomodation","homestay"],
    r:`<strong>Where to Stay in San Vicente</strong><br><br><strong>Long Beach</strong> — boathouses, beachfront cottages, and mid-range resorts along the 14km strip. Best for first-timers who want the beach in front of them.<br><br><strong>Port Barton</strong> — quieter, smaller beachfront lodges, homestays, and a few guesthouses. Better for slow travel and island-hopping bases.<br><br><strong>Poblacion</strong> — the practical base: closest to transport, market, and Long Beach access. Good for arrivals, supplies, and budget stays.<br><br>Book ahead in peak season (Dec–May). Many places are small and fill up on weekends. Cash is king — bring it.`},
  {kw:["cafe","cafes","coffee","caffe","brunch","breakfast","lunch","dining","resto","restaurants","food spots","where to eat"],
    r:`<strong>Cafés & Food Spots in San Vicente</strong><br><br><strong>Poblacion</strong> — the town center has simple cafés, carinderias, and a few spots with wifi and morning coffee. Good for a slow start before heading to the beach.<br><br><strong>Long Beach</strong> — beachfront grills, boathouse cafés, and casual seafood stops along the strip. Best at sunrise or late afternoon.<br><br><strong>Port Barton</strong> — a handful of cafés, fusion spots, and beachfront eateries. Smaller than Long Beach but more relaxed.<br><br>Most small places are cash-only and close early. Bring cash, ask locals for today's best spot — it changes.`},
  {kw:["diving","snorkel","dive","coral","wreck"],
    r:`<strong>Snorkeling</strong><br><br>Port Barton island-hopping is the easiest snorkeling base in San Vicente. Ask for reef stops, turtle-friendly viewing, German Island, and Inaladelan Island. Never touch coral or chase wildlife.`},
  {kw:["packing","bring","prepare","gear"],
    r:`<strong>Packing</strong><br><br>Swimsuit, quick-dry towel, waterproof case<br>Reef-safe sunscreen (mandatory in El Nido)<br>Snorkel mask, water shoes, repellent<br><br>ID, printed tickets, cash — lots of cash.`},
  {kw:["tour","tours","island hop","lagoon"],
    r:`<strong>San Vicente Island-Hopping</strong><br><br>Base yourself in Port Barton for boat routes to German Island, Inaladelan Island, reef stops, and turtle-viewing areas. For Boayan, arrange a local boat and check weather before committing.`},
  {kw:["hello","hi","hey","morning","evening"],
    r:`Mabuhay — welcome. I'm <strong>tala</strong>, your Palawan concierge. Ask about destinations, timing, routes, or hidden gems.`},
  {kw:["thank","thanks","salamat"],
    r:`My pleasure. Palawan will not disappoint. If you need anything else, I'm here.`},
  {kw:["safe","safety","danger"],
    r:`Palawan is one of the safest provinces in the Philippines. Watch for strong currents, use reef-safe sunscreen, and stick with registered tour operators. Emergency: 911.`},
  {kw:["waterfall","falls","pamuayan"],
    r:`<strong>Pamuayan Falls</strong><br><br>A freshwater stop near Port Barton with a forest path and natural pool. Go with grippy footwear, avoid heavy rain, and bring drinking water.`}
];

const DEFAULT_FALLBACK_RESPONSE = `I'm not sure about that, but I can help with:<br><br>Long Beach · Port Barton · Boayan Island · Pamuayan Falls<br>Transport · Budget · Food · Island hopping<br><br>Or tap any San Vicente marker on the map.`;

const DEFAULT_HERO_TITLE = `Discover Palawan<br><em>Differently.</em>`;
const DEFAULT_HERO_SUBTITLE = ``;
const DEFAULT_SPLASH_SUBTEXT = `The San Vicente Travel Hub<br>Curated by the people who live here`;
const DEFAULT_SPLASH_FOOTER = `PALAWAN`;

// ─── TALA AI (OpenRouter) state ───
let talaAiEnabled = false;
let talaAiModel = '';
let talaAiKey = '';

// ─── LIVE DATA (populated from Supabase, falls back to defaults) ───
let destinations = [];
let aiData = [];
let defaultR = DEFAULT_FALLBACK_RESPONSE;
let heroTitle = DEFAULT_HERO_TITLE;
let heroSubtitle = DEFAULT_HERO_SUBTITLE;
let splashSubtext = DEFAULT_SPLASH_SUBTEXT;
let splashFooter = DEFAULT_SPLASH_FOOTER;
let dataReady = false;
let destinationsSource = 'loading';

// ═══════════════════════════════════════════════════════
// AUTHENTICATION — Supabase Auth, Email Magic Link only for
// now. Google/Apple need real OAuth app registrations on
// Anthropic/David's end before they can be wired up; the login
// modal already has buttons for them so adding the providers
// later is just a few lines, not a redesign.
// ═══════════════════════════════════════════════════════
let currentUser = null;       // Supabase auth user object, or null if signed out
let currentProfile = null;    // row from traveler_profiles, or null
let pendingProtectedAction = null; // a function to re-run automatically after successful login

async function initAuth(){
  const { data: { session } } = await sb.auth.getSession();
  if(session){
    currentUser = session.user;
    await loadTravelerProfile();
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if(event === 'SIGNED_IN' && session){
      currentUser = session.user;
      await loadTravelerProfile();
      closeLoginModal();
      updateAuthUI();
      if(pendingProtectedAction){
        const fn = pendingProtectedAction;
        pendingProtectedAction = null;
        fn();
      }
    } else if(event === 'SIGNED_OUT'){
      currentUser = null;
      currentProfile = null;
      updateAuthUI();
    }
  });

  updateAuthUI();
}

async function loadTravelerProfile(){
  if(!currentUser) return;
  try {
    const { data, error } = await sb.from('traveler_profiles').select('*').eq('id', currentUser.id).maybeSingle();
    if(error) throw error;
    currentProfile = data;
    // Touch last_seen, best-effort, don't block on it
    sb.from('traveler_profiles').update({ last_seen: new Date().toISOString() }).eq('id', currentUser.id);
  } catch(err){
    console.warn('[SANVIC] Failed to load traveler profile:', err);
  }
}

function isLoggedIn(){
  return !!currentUser;
}

// Call this to gate any action that requires login. If logged in,
// runs `action` immediately. If not, opens the login modal and
// queues `action` to run automatically right after sign-in.
function requireAuth(action){
  if(isLoggedIn()){
    action();
  } else {
    pendingProtectedAction = action;
    openLoginModal();
  }
}

function openLoginModal(){
  document.getElementById('loginModalOverlay').classList.add('active');
  document.getElementById('loginModalSheet').classList.add('open');
  document.getElementById('loginEmailStatus').textContent = '';
  document.getElementById('loginEmailInput').value = '';
}

function closeLoginModal(){
  document.getElementById('loginModalOverlay').classList.remove('active');
  document.getElementById('loginModalSheet').classList.remove('open');
  pendingProtectedAction = null; // closing without logging in cancels the queued action
}

async function sendMagicLink(){
  const email = document.getElementById('loginEmailInput').value.trim();
  const statusEl = document.getElementById('loginEmailStatus');
  if(!email || !email.includes('@')){
    statusEl.textContent = 'Please enter a valid email address.';
    statusEl.style.color = '#ef4444';
    return;
  }
  statusEl.textContent = 'Sending link...';
  statusEl.style.color = 'var(--white-dim)';
  try {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href }
    });
    if(error) throw error;
    statusEl.textContent = `Check your email — we sent a link to ${email}.`;
    statusEl.style.color = '#5eead4';
  } catch(err){
    statusEl.textContent = 'Could not send link: ' + (err.message || err);
    statusEl.style.color = '#ef4444';
  }
}

async function signInWithProvider(provider){
  const statusEl = document.getElementById('loginEmailStatus');
  statusEl.textContent = `Opening ${provider} sign-in...`;
  statusEl.style.color = 'var(--white-dim)';
  try {
    // Use the iframe's own URL — accessing window.top across origins (e.g. in the Lovable editor) throws
    let redirectTo = window.location.href;
    try { if (window.top && window.top !== window.self) redirectTo = window.top.location.href; } catch(_) {}
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });
    if(error) throw error;
  } catch(err){
    statusEl.textContent = `Could not start ${provider} sign-in: ` + (err.message || err);
    statusEl.style.color = '#ef4444';
  }
}

async function signOutUser(){
  await sb.auth.signOut();
  closeDashboard();
}

function updateAuthUI(){
  // Bell/notification icon and avatar swap in the hero or dock area
  // could go here later; for now this drives the dashboard's own
  // header state and the dock "Saved" tab behavior.
  const dashAvatarWrap = document.getElementById('dashUserAvatarWrap');
  if(dashAvatarWrap){
    if(isLoggedIn() && currentProfile){
      dashAvatarWrap.style.display = '';
    }
  }
}

// ═══════════════════════════════════════════════════════
// TRAVELER DASHBOARD
// ═══════════════════════════════════════════════════════
let dashSection = 'overview';

function openDashboard(section){
  closeAllPanels();
  document.getElementById('dashboardPanel').classList.add('open');
  renderDashProfileCard();
  selectDashSection(section || 'overview');
}

function closeDashboard(){
  document.getElementById('dashboardPanel').classList.remove('open');
}

const DASH_GUEST_AVATAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';

function renderDashProfileCard(){
  const nameEl = document.getElementById('dashUserName');
  const subEl = document.getElementById('dashUserSub');
  const avatarWrap = document.getElementById('dashUserAvatarWrap');
  const signinBtn = document.getElementById('dashProfileSigninBtn');
  const signoutBtn = document.getElementById('dashSignoutBtn');

  if(!currentUser){
    avatarWrap.innerHTML = DASH_GUEST_AVATAR;
    nameEl.textContent = 'Welcome, Explorer';
    subEl.textContent = 'Sign in to save places and plan trips';
    if(signinBtn) signinBtn.style.display = '';
    if(signoutBtn) signoutBtn.style.display = 'none';
    return;
  }

  if(signinBtn) signinBtn.style.display = 'none';
  if(signoutBtn) signoutBtn.style.display = '';

  const displayName = (currentProfile && currentProfile.display_name) || currentUser.email.split('@')[0];
  nameEl.textContent = `Hello, ${displayName}`;
  subEl.textContent = 'Welcome back to San Vicente';

  if(currentProfile && currentProfile.avatar_url){
    avatarWrap.innerHTML = `<img src="${currentProfile.avatar_url}" alt="">`;
  } else {
    avatarWrap.innerHTML = `<span>${escapeHtml(displayName.slice(0,1).toUpperCase())}</span>`;
  }
}

function selectDashSection(section){
  dashSection = section;
  document.querySelectorAll('.dash-nav-item').forEach(b=>b.classList.toggle('active', b.dataset.section===section));
  const body = document.getElementById('dashSectionBody');
  body.innerHTML = `<div class="dash-empty-state">Loading...</div>`;

  switch(section){
    case 'overview': renderDashOverview(); break;
    case 'saved': renderDashSaved(); break;
    case 'bookings': body.innerHTML = `<div class="dash-section-title">Bookings</div><div class="dash-empty-state">Booking management is coming in a future update.</div>`; break;
    case 'trips': body.innerHTML = `<div class="dash-section-title">My Trips</div><div class="dash-empty-state">Trip planning is coming in a future update.</div>`; break;
    case 'activity': renderDashActivity(); break;
    case 'messages': body.innerHTML = `<div class="dash-section-title">Messages</div><div class="dash-empty-state">Direct messages between travelers are coming soon.</div>`; break;
    case 'settings': renderDashSettings(); break;
  }
}

async function renderDashOverview(){
  const body = document.getElementById('dashSectionBody');
  if(!currentUser){
    body.innerHTML = `<div class="dash-section-title">Overview</div><div class="dash-empty-state">Sign in to track your saved places and Pulse activity.<br><button class="login-provider-btn" style="margin-top:12px;" onclick="openLoginModal()">Sign in</button></div>`;
    return;
  }
  try {
    const { data: saved } = await sb.from('saved_places').select('id').eq('user_id', currentUser.id);
    const { data: posts } = await sb.from('pulse_posts').select('id').eq('user_id', currentUser.id);
    body.innerHTML = `
      <div class="dash-section-title">Overview</div>
      <div class="admin-grid-2" style="margin-bottom:14px;">
        <div class="dash-empty-state" style="padding:18px;">
          <div style="font-size:1.4rem;color:var(--ocean-teal-light);font-weight:600;">${(saved||[]).length}</div>
          <div style="font-size:.7rem;margin-top:4px;">Saved places</div>
        </div>
        <div class="dash-empty-state" style="padding:18px;">
          <div style="font-size:1.4rem;color:var(--ocean-teal-light);font-weight:600;">${(posts||[]).length}</div>
          <div style="font-size:.7rem;margin-top:4px;">Pulse posts</div>
        </div>
      </div>
      <div class="dash-empty-state">Trip planning and richer activity history are coming in a future update.</div>`;
  } catch(err){
    body.innerHTML = `<div class="dash-empty-state">Couldn't load your overview right now.</div>`;
  }
}

async function renderDashSaved(){
  const body = document.getElementById('dashSectionBody');
  if(!currentUser){
    body.innerHTML = `<div class="dash-section-title">Saved Places</div><div class="dash-empty-state">Sign in to save places and sync them across your devices.<br><button class="login-provider-btn" style="margin-top:12px;" onclick="openLoginModal()">Sign in</button></div>`;
    return;
  }
  try {
    const { data, error } = await sb.from('saved_places')
      .select('id, destination_id, destinations(name, image, category)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if(error) throw error;

    if(!data || !data.length){
      body.innerHTML = `<div class="dash-section-title">Saved Places</div><div class="dash-empty-state">You haven't saved any places yet. Tap the bookmark on a destination to save it here.</div>`;
      return;
    }

    body.innerHTML = `<div class="dash-section-title">Saved Places</div>` + data.map(row=>{
      const d = row.destinations;
      if(!d) return '';
      return `
      <div class="around-card" style="margin-bottom:10px;cursor:pointer;" onclick="closeDashboard();openDestinationById(${row.destination_id})">
        <img src="${d.image}" alt="" style="width:50px;height:50px;border-radius:10px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">
        <div class="around-card-body">
          <div class="around-card-name">${escapeHtml(d.name)}</div>
          <div class="around-card-meta">${escapeHtml(catStyle[d.category]?.label||d.category)}</div>
        </div>
      </div>`;
    }).join('');
  } catch(err){
    body.innerHTML = `<div class="dash-empty-state">Couldn't load saved places right now.</div>`;
  }
}

async function renderDashActivity(){
  const body = document.getElementById('dashSectionBody');
  if(!currentUser){
    body.innerHTML = `<div class="dash-section-title">Activity</div><div class="dash-empty-state">Sign in to see your Pulse posts and saves here.<br><button class="login-provider-btn" style="margin-top:12px;" onclick="openLoginModal()">Sign in</button></div>`;
    return;
  }
  try {
    const { data, error } = await sb.from('pulse_posts')
      .select('id, text_content, category, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if(error) throw error;

    if(!data || !data.length){
      body.innerHTML = `<div class="dash-section-title">Activity</div><div class="dash-empty-state">Your Pulse posts and saves will show up here.</div>`;
      return;
    }

    body.innerHTML = `<div class="dash-section-title">Activity</div>` + data.map(p=>`
      <div class="around-card" style="margin-bottom:10px;">
        <div class="around-card-icon">📍</div>
        <div class="around-card-body">
          <div class="around-card-name">${escapeHtml((p.text_content||'').slice(0,60))}${(p.text_content||'').length>60?'…':''}</div>
          <div class="around-card-meta">${new Date(p.created_at).toLocaleDateString()}</div>
        </div>
      </div>`).join('');
  } catch(err){
    body.innerHTML = `<div class="dash-empty-state">Couldn't load activity right now.</div>`;
  }
}

async function renderDashSettings(){
  const body = document.getElementById('dashSectionBody');
  if(!currentUser){
    body.innerHTML = `<div class="dash-section-title">Settings</div><div class="dash-empty-state">Sign in to edit your traveler profile.<br><button class="login-provider-btn" style="margin-top:12px;" onclick="openLoginModal()">Sign in</button></div>`;
    return;
  }
  body.innerHTML = `
    <div class="dash-section-title">Settings</div>
    <div class="admin-field"><label>Display name</label><input id="dashSettingsName" value="${escapeHtml((currentProfile&&currentProfile.display_name)||'')}"></div>
    <div class="admin-field"><label>Bio</label><textarea id="dashSettingsBio" rows="3">${escapeHtml((currentProfile&&currentProfile.bio)||'')}</textarea></div>
    <button class="admin-save-btn" onclick="saveDashSettings()">Save changes</button>`;
}

async function saveDashSettings(){
  const display_name = document.getElementById('dashSettingsName').value.trim();
  const bio = document.getElementById('dashSettingsBio').value.trim();
  try {
    const { error } = await sb.from('traveler_profiles').update({ display_name, bio, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
    if(error) throw error;
    currentProfile = { ...currentProfile, display_name, bio };
    renderDashProfileCard();
    alert('Saved.');
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

// ─── Save / unsave a destination (requires login) ───
async function toggleSavePlace(destinationId, btnEl){
  requireAuth(async ()=>{
    try {
      const { data: existing } = await sb.from('saved_places').select('id').eq('user_id', currentUser.id).eq('destination_id', destinationId).maybeSingle();
      if(existing){
        await sb.from('saved_places').delete().eq('id', existing.id);
        if(btnEl) btnEl.classList.remove('saved');
      } else {
        await sb.from('saved_places').insert({ user_id: currentUser.id, destination_id: destinationId });
        if(btnEl) btnEl.classList.add('saved');
      }
    } catch(err){
      alert('Could not update saved places: ' + (err.message || err));
    }
  });
}

function handleDestSaveClick(){
  if(!currentDest) return;
  toggleSavePlace(currentDest.id, document.getElementById('deSaveBtn'));
}

async function refreshDestSaveButton(destinationId){
  const btn = document.getElementById('deSaveBtn');
  if(!btn) return;
  btn.classList.remove('saved');
  if(!isLoggedIn()) return; // anonymous visitors always see the un-saved state
  try {
    const { data } = await sb.from('saved_places').select('id').eq('user_id', currentUser.id).eq('destination_id', destinationId).maybeSingle();
    if(data) btn.classList.add('saved');
  } catch(err){
    // fail silently — save state is a nice-to-have, not critical path
  }
}

function destRowToObj(row){
  return {
    id: row.id, name: row.name, lat: row.lat, lng: row.lng, category: row.category,
    image: row.image, images: row.images || [], description: row.description, tip: row.tip, color: row.color || '#0ea5e9',
    videoUrl: row.video_url || '', videoType: row.video_type || '', featured: !!row.featured,
    googleBusinessUrl: row.google_business_url || '',
    barangay: row.barangay || '',
    stats: { rating: row.rating, travel: row.travel, temp: row.temp, season: row.season }
  };
}

const DEFAULT_SUGGESTIONS = [
  { id:1, text:"Best beaches in San Vicente" },
  { id:2, text:"Where should I stay?" },
  { id:3, text:"Best time to visit" },
  { id:4, text:"Budget guide" },
  { id:5, text:"Local hidden gems" }
];

let talaSuggestions = [];

// True if today's month/day falls within [fromM/fromD, toM/toD], inclusive,
// handling ranges that wrap across the new year (e.g. Nov 1 -> Mar 31).
// A suggestion with no range set is always active.
function isSuggestionActiveToday(s){
  if(s.active_from_month==null || s.active_to_month==null) return true;
  const now = new Date();
  const todayKey = (now.getMonth()+1)*100 + now.getDate();
  const fromKey = s.active_from_month*100 + (s.active_from_day||1);
  const toKey = s.active_to_month*100 + (s.active_to_day||28);
  if(fromKey <= toKey){
    return todayKey >= fromKey && todayKey <= toKey;
  } else {
    // wraps across new year, e.g. Nov 1 -> Mar 31
    return todayKey >= fromKey || todayKey <= toKey;
  }
}

async function loadDataFromSupabase(){
  let directoryLoaded=false;
  try {
    const [destRes, talaRes, settingsRes, sugRes, siteRes, catRes, nearbyRes, aiSettingsRes, todayRes, tribesRes, eventsRes, upcomingRes, huntRewardsRes, huntSettingsRes] = await Promise.all([
      sb.from('destinations').select('*').order('sort_order', { ascending: true }),
      sb.from('tala_responses').select('*').order('sort_order', { ascending: true }),
      sb.from('tala_settings').select('*').eq('key', 'default_response').maybeSingle(),
      sb.from('tala_suggestions').select('*').order('sort_order', { ascending: true }),
      sb.from('site_settings').select('*').in('key', ['hero_title', 'hero_subtitle', 'splash_subtext', 'splash_footer']),
      sb.from('destination_categories').select('*').order('sort_order', { ascending: true }),
      sb.from('nearby_places').select('*').order('sort_order', { ascending: true }),
      sb.from('tala_settings').select('key,value').in('key', ['ai_enabled', 'ai_model', 'ai_key']),
      sb.from('today_content').select('key,data'),
      sb.from('tribes').select('*').order('sort_order', { ascending: true }),
      sb.from('events').select('*').order('sort_order', { ascending: true }),
      sb.from('my_sanvic_upcoming').select('*').order('sort_order', { ascending: true }),
      sb.from('hunt_rewards').select('*').order('sort_order', { ascending: true }),
      sb.from('hunt_settings').select('*'),
    ].map(request=>Promise.resolve(request).catch(error=>({data:null,error}))));

    if (destRes.error) throw destRes.error;
    // An optional assistant-table failure must not replace the live directory.

    if(aiSettingsRes && aiSettingsRes.data){
      aiSettingsRes.data.forEach(r=>{
        if(r.key==='ai_enabled') talaAiEnabled = (r.value === 'true');
        if(r.key==='ai_model' && r.value) talaAiModel = r.value;
        if(r.key==='ai_key' && r.value) talaAiKey = r.value;
      });
    }

    destinations = Array.isArray(destRes.data) ? destRes.data.map(destRowToObj) : [];
    destinationsSource = 'supabase';
    directoryLoaded=true;
    aiData = (talaRes.data && talaRes.data.length) ? talaRes.data.map(r=>({ id:r.id, kw:r.keywords, r:r.response, cat:r.category||'knowledge' })) : DEFAULT_TALA_DATA;
    defaultR = (settingsRes.data && settingsRes.data.value) ? settingsRes.data.value : DEFAULT_FALLBACK_RESPONSE;
    talaSuggestions = (sugRes && sugRes.data && sugRes.data.length) ? sugRes.data : DEFAULT_SUGGESTIONS;
    applyCategoriesFromRows(catRes && catRes.data);
    applyNearbyPlacesFromRows(nearbyRes && nearbyRes.data);


    const siteRows = (siteRes && siteRes.data) ? siteRes.data : [];
    const titleRow = siteRows.find(r => r.key === 'hero_title');
    const subRow = siteRows.find(r => r.key === 'hero_subtitle');
    const splashSubRow = siteRows.find(r => r.key === 'splash_subtext');
    const splashFootRow = siteRows.find(r => r.key === 'splash_footer');
    heroTitle = (titleRow && titleRow.value) ? titleRow.value : DEFAULT_HERO_TITLE;
    heroSubtitle = (subRow && subRow.value != null) ? subRow.value : DEFAULT_HERO_SUBTITLE;
    splashSubtext = (splashSubRow && splashSubRow.value != null) ? splashSubRow.value : DEFAULT_SPLASH_SUBTEXT;
    splashFooter = (splashFootRow && splashFootRow.value != null) ? splashFootRow.value : DEFAULT_SPLASH_FOOTER;

    // Load Today content from DB (overrides hardcoded TODAY_DATA)
    if(todayRes && todayRes.data && todayRes.data.length){
      todayRes.data.forEach(r=>{
        if(r.key==='tala_pick') TODAY_DATA.talaPick = r.data;
        else if(r.key==='happening') TODAY_DATA.happening = r.data;
        else if(r.key==='joinable') TODAY_DATA.joinable = r.data;
        else if(r.key==='weather') TODAY_DATA.weather = r.data;
        else if(r.key==='locals') TODAY_DATA.locals = r.data;
        else if(r.key==='notices') TODAY_DATA.notices = r.data;
      });
    }

    // Load tribes from DB (overrides hardcoded PULSE_TRIBES)
    if(tribesRes && tribesRes.data && tribesRes.data.length){
      PULSE_TRIBES.length = 0;
      tribesRes.data.forEach(t=>{
        PULSE_TRIBES.push({
          id: t.id, title: t.title, where: t.where_text, when: t.when_text,
          sub: t.sub, thumb: t.thumb_url, images: t.images||[], joined: t.joined, extra: t.extra,
          cap: t.cap, tags: t.tags||[], spots: t.spots, seatsOpen: t.seats_open,
          warn: t.spots>0, videoUrl: t.video_url||'', videoType: t.video_type||''
        });
      });
      MYSV_TRIBES.length = 0;
      tribesRes.data.forEach(t=>{
        MYSV_TRIBES.push({
          id: t.id, title: t.title,
          meta: t.where_text + ' • ' + t.when_text,
          more: t.extra, grad: 'linear-gradient(135deg,#f97316,#7c2d12)',
          thumb: t.thumb_url, images: t.images||[]
        });
      });
    }

    // Load events from DB (overrides hardcoded PULSE_EVENTS / MYSV_EVENTS)
    if(eventsRes && eventsRes.data && eventsRes.data.length){
      PULSE_EVENTS.length = 0;
      eventsRes.data.forEach(ev=>{
        PULSE_EVENTS.push({
          id: ev.id, title: ev.title, org: ev.org, where: ev.where_text,
          when: ev.when_text, price: ev.price, tags: ev.tags||[],
          images: ev.images||[], videoUrl: ev.video_url||'', videoType: ev.video_type||''
        });
      });
      MYSV_EVENTS.length = 0;
      eventsRes.data.forEach(ev=>{
        MYSV_EVENTS.push({
          id: ev.id, title: ev.title,
          meta: ev.where_text + ' • ' + ev.when_text,
          more: 0, grad: 'linear-gradient(135deg,#a78bfa,#1e1b4b)',
          images: ev.images||[]
        });
      });
    }

    // Load upcoming items from DB
    if(upcomingRes && upcomingRes.data && upcomingRes.data.length){
      MYSV_UPCOMING.length = 0;
      upcomingRes.data.forEach(u=>{
        MYSV_UPCOMING.push({
          id: u.id, title: u.title, badge: u.badge, badgeStyle: u.badge_style||'solid',
          meta: u.meta, cta: u.cta||'View', action: u.action||'', actionId: u.action_id||'',
          images: u.images||[], videoUrl: u.video_url||'', videoType: u.video_type||'',
          grad: 'linear-gradient(135deg,#0ea5e9,#0c4a6e)'
        });
      });
    }

    // Load hunt settings + rewards
    if(huntSettingsRes && huntSettingsRes.data){
      huntSettingsRes.data.forEach(r=>{ HUNT_SETTINGS[r.key] = r.value; });
    }
    if(huntRewardsRes && huntRewardsRes.data && huntRewardsRes.data.length){
      HUNT_REWARDS.length = 0;
      huntRewardsRes.data.forEach(r=>{
        HUNT_REWARDS.push({
          id: r.id, title: r.title, subtitle: r.subtitle||'', badge: r.badge||'',
          destId: r.dest_id||'', pointsRequired: r.points_required||100,
          images: r.images||[], videoUrl: r.video_url||'', videoType: r.video_type||'',
          grad: 'linear-gradient(135deg,#0ea5e9,#0c4a6e)'
        });
      });
    }
  } catch(err) {
    console.warn('[SANVIC] Supabase load failed, using built-in defaults:', err);
    if(!directoryLoaded){
      destinations = DEFAULT_DESTINATIONS;
      destinationsSource = 'fallback';
    }
    aiData = DEFAULT_TALA_DATA;
    defaultR = DEFAULT_FALLBACK_RESPONSE;
    talaSuggestions = DEFAULT_SUGGESTIONS;
    talaAiEnabled = false;
    talaAiModel = '';
    talaAiKey = '';
    heroTitle = DEFAULT_HERO_TITLE;
    heroSubtitle = DEFAULT_HERO_SUBTITLE;
    splashSubtext = DEFAULT_SPLASH_SUBTEXT;
    splashFooter = DEFAULT_SPLASH_FOOTER;
    applyCategoriesFromRows(null); // falls through to keeping current catStyle (defaults on first load)
    applyNearbyPlacesFromRows(null);
  }
  applyHeroText();
  applySplashText();
  window.destinations = destinations;
  dataReady = true;
  if(document.getElementById('exploreSheet')?.classList.contains('open')) renderExploreContent();
}

function applyHeroText(){
  const titleEl = document.getElementById('heroHeadline');
  const subEl = document.getElementById('heroSubtitle');
  if(titleEl) titleEl.innerHTML = heroTitle;
  if(subEl) subEl.innerHTML = heroSubtitle;
}

function applySplashText(){
  const tagEl = document.getElementById('splashTagline');
  const footEl = document.getElementById('splashFooter');
  if(tagEl) tagEl.innerHTML = splashSubtext;
  if(footEl) footEl.innerHTML = splashFooter;
}

const DEFAULT_CAT_STYLE = {
  beaches:{label:"Beaches",color:"#0ea5e9",icon:"waves"},
  islands:{label:"Islands",color:"#8b5cf6",icon:"palmtree"},
  nature:{label:"Nature",color:"#22c55e",icon:"trees"},
  adventure:{label:"Adventure",color:"#ef4444",icon:"compass"},
  culture:{label:"Culture",color:"#f59e0b",icon:"landmark"},
  stays:{label:"Stays",color:"#ec4899",icon:"bed-double"}
};

// Inlined Lucide SVG inner-content for the curated icon set admins can
// pick from. Keep this in sync with the picker list below. Rendered into
// a <svg viewBox="0 0 24 24" stroke="currentColor"...> wrapper.
const EXTRA_ICONS = {
  "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\".5\"/>",
  "film": "<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"2.18\" ry=\"2.18\"/><path d=\"M7 2v20\"/><path d=\"M17 2v20\"/><path d=\"M2 12h20\"/><path d=\"M2 7h5\"/><path d=\"M2 17h5\"/><path d=\"M17 7h5\"/><path d=\"M17 17h5\"/>",
  "zap": "<path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\"/>",
  "file-text": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>",
  "save": "<path d=\"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z\"/><path d=\"M17 21v-7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v7\"/><path d=\"M7 3v4a2 2 0 0 0 2 2h6\"/>",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>",
  "check": "<path d=\"M20 6 9 17l-5-5\"/>",
  "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>",
  "sparkles-ai": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\"/><path d=\"M20 3v4\"/><path d=\"M22 5h-4\"/><path d=\"M4 17v2\"/><path d=\"M5 18H3\"/>",
  "cpu": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><rect x=\"9\" y=\"9\" width=\"6\" height=\"6\"/><path d=\"M15 2v2M15 20v2M2 15h2M20 15h2M2 9h2M20 9h2M9 2v2M9 20v2\"/>",
  "key": "<path d=\"m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4\"/>",
  "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/><path d=\"M2 12h20\"/>"
};
const LUCIDE_ICONS = JSON.parse('{"anchor": "<path d=\\"M12 6v16\\" /> <path d=\\"m19 13 2-1a9 9 0 0 1-18 0l2 1\\" /> <path d=\\"M9 11h6\\" /> <circle cx=\\"12\\" cy=\\"4\\" r=\\"2\\" />", "bed-double": "<path d=\\"M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8\\" /> <path d=\\"M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4\\" /> <path d=\\"M12 4v6\\" /> <path d=\\"M2 18h20\\" />", "bike": "<circle cx=\\"18.5\\" cy=\\"17.5\\" r=\\"3.5\\" /> <circle cx=\\"5.5\\" cy=\\"17.5\\" r=\\"3.5\\" /> <circle cx=\\"15\\" cy=\\"5\\" r=\\"1\\" /> <path d=\\"M12 17.5V14l-3-3 4-3 2 3h2\\" />", "camera": "<path d=\\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\\" /> <circle cx=\\"12\\" cy=\\"13\\" r=\\"3\\" />", "car": "<path d=\\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\\" /> <circle cx=\\"7\\" cy=\\"17\\" r=\\"2\\" /> <path d=\\"M9 17h6\\" /> <circle cx=\\"17\\" cy=\\"17\\" r=\\"2\\" />", "coffee": "<path d=\\"M10 2v2\\" /> <path d=\\"M14 2v2\\" /> <path d=\\"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1\\" /> <path d=\\"M6 2v2\\" />", "compass": "<circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\" /> <path d=\\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\\" />", "droplets": "<path d=\\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\\" /> <path d=\\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\\" />", "fish": "<path d=\\"M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z\\" /> <path d=\\"M18 12v.5\\" /> <path d=\\"M16 17.93a9.77 9.77 0 0 1 0-11.86\\" /> <path d=\\"M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33\\" /> <path d=\\"M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4\\" /> <path d=\\"m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98\\" />", "flower-2": "<path d=\\"M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1\\" /> <circle cx=\\"12\\" cy=\\"8\\" r=\\"2\\" /> <path d=\\"M12 10v12\\" /> <path d=\\"M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z\\" /> <path d=\\"M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z\\" />", "footprints": "<path d=\\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\\" /> <path d=\\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\\" /> <path d=\\"M16 17h4\\" /> <path d=\\"M4 13h4\\" />", "gem": "<path d=\\"M10.5 3 8 9l4 13 4-13-2.5-6\\" /> <path d=\\"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z\\" /> <path d=\\"M2 9h20\\" />", "heart": "<path d=\\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\\" />", "landmark": "<path d=\\"M10 18v-7\\" /> <path d=\\"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z\\" /> <path d=\\"M14 18v-7\\" /> <path d=\\"M18 18v-7\\" /> <path d=\\"M3 22h18\\" /> <path d=\\"M6 18v-7\\" />", "map-pin": "<path d=\\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\\" /> <circle cx=\\"12\\" cy=\\"10\\" r=\\"3\\" />", "mountain": "<path d=\\"m8 3 4 8 5-5 5 15H2L8 3z\\" />", "music": "<path d=\\"M9 18V5l12-2v13\\" /> <circle cx=\\"6\\" cy=\\"18\\" r=\\"3\\" /> <circle cx=\\"18\\" cy=\\"16\\" r=\\"3\\" />", "palmtree": "<path d=\\"M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4\\" /> <path d=\\"M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3\\" /> <path d=\\"M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35\\" /> <path d=\\"M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14\\" />", "plane": "<path d=\\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z\\" />", "ship": "<path d=\\"M12 10.189V14\\" /> <path d=\\"M12 2v3\\" /> <path d=\\"M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6\\" /> <path d=\\"M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76\\" /> <path d=\\"M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\\" />", "shopping-bag": "<path d=\\"M16 10a4 4 0 0 1-8 0\\" /> <path d=\\"M3.103 6.034h17.794\\" /> <path d=\\"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z\\" />", "sparkles": "<path d=\\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\\" /> <path d=\\"M20 2v4\\" /> <path d=\\"M22 4h-4\\" /> <circle cx=\\"4\\" cy=\\"20\\" r=\\"2\\" />", "star": "<path d=\\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\\" />", "sun": "<circle cx=\\"12\\" cy=\\"12\\" r=\\"4\\" /> <path d=\\"M12 2v2\\" /> <path d=\\"M12 20v2\\" /> <path d=\\"m4.93 4.93 1.41 1.41\\" /> <path d=\\"m17.66 17.66 1.41 1.41\\" /> <path d=\\"M2 12h2\\" /> <path d=\\"M20 12h2\\" /> <path d=\\"m6.34 17.66-1.41 1.41\\" /> <path d=\\"m19.07 4.93-1.41 1.41\\" />", "tent": "<path d=\\"M3.5 21 14 3\\" /> <path d=\\"M20.5 21 10 3\\" /> <path d=\\"M15.5 21 12 15l-3.5 6\\" /> <path d=\\"M2 21h20\\" />", "trees": "<path d=\\"M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z\\" /> <path d=\\"M7 16v6\\" /> <path d=\\"M13 19v3\\" /> <path d=\\"M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5\\" />", "umbrella": "<path d=\\"M12 13v7a2 2 0 0 0 4 0\\" /> <path d=\\"M12 2v2\\" /> <path d=\\"M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z\\" />", "utensils": "<path d=\\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\\" /> <path d=\\"M7 2v20\\" /> <path d=\\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\\" />", "waves": "<path d=\\"M2 12q2.5 2 5 0t5 0 5 0 5 0\\" /> <path d=\\"M2 19q2.5 2 5 0t5 0 5 0 5 0\\" /> <path d=\\"M2 5q2.5 2 5 0t5 0 5 0 5 0\\" />", "wine": "<path d=\\"M8 22h8\\" /> <path d=\\"M7 10h10\\" /> <path d=\\"M12 15v7\\" /> <path d=\\"M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z\\" />"}');
const LUCIDE_ICON_KEYS = Object.keys(LUCIDE_ICONS);
function lucideSvg(name, size){
  const inner = EXTRA_ICONS[name] || LUCIDE_ICONS[name] || LUCIDE_ICONS['map-pin'];
  const s = size || 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Converts a "#rrggbb" hex color into the soft translucent background
// chip color used throughout (12% opacity), matching the look every
// existing category already has.
function hexToBg(hex, alpha){
  alpha = alpha==null ? .12 : alpha;
  const h = (hex||'#0ea5e9').replace('#','');
  const r = parseInt(h.substring(0,2),16) || 0;
  const g = parseInt(h.substring(2,4),16) || 0;
  const b = parseInt(h.substring(4,6),16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Mutable — repopulated from destination_categories in Supabase every
// time data loads. Starts with the built-in defaults so nothing is
// ever blank before the first load finishes.
let catStyle = {};
Object.keys(DEFAULT_CAT_STYLE).forEach(k=>{
  const d = DEFAULT_CAT_STYLE[k];
  catStyle[k] = { label: d.label, color: d.color, bg: hexToBg(d.color), icon: d.icon || 'map-pin' };
});

function applyCategoriesFromRows(rows){
  if(!rows || !rows.length) return; // keep defaults if the table is empty/unreachable
  const next = {};
  rows.forEach(r=>{
    next[r.key] = { label: r.label, color: r.color || '#0ea5e9', bg: hexToBg(r.color), icon: r.icon || 'map-pin' };
  });
  catStyle = next;
}

// ─── AI ───
function getAI(input) {
  const l = input.toLowerCase().replace(/[?.!,]/g,'').trim();
  for (const d of destinations) {
    if (l.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(l))
      return { reply: `<strong>${d.name}</strong><br><br>${d.description}<br><br>${d.tip}`, dest: d };
  }
  let best=null, bestS=0;
  for (const item of aiData) for (const k of item.kw)
    if (l.includes(k) && k.length>bestS) { bestS=k.length; best=item.r; }
  return { reply: best||defaultR, dest: null };
}

// Live AI answer calling OpenRouter directly from the browser, using the API
// key + model stored in tala_settings via the admin. Falls back to curated
// keyword answers on any failure (key not set, model error, offline).
const TALA_BASE_PROMPT = 'You are TALA, the warm, local travel concierge of San Vicente, Palawan. You know the town, its beaches, waterfalls, islands, food and transport. Be friendly, concise and personal. If you don\'t know something, say so kindly and suggest asking at the tourism office. Keep answers under 120 words unless asked for details.';

function talaKnowledgeBlock(){
  const lines = [];
  destinations.forEach(d=>{
    lines.push(`[${d.category}] ${d.name}: ${d.description || ''} ${d.tip ? '— Tip: ' + d.tip : ''}`);
  });
  aiData.forEach(it=>{
    it.kw.forEach(k=>{
      if(!it.r) return;
      lines.push(`"${k}" -> ${it.r}`);
    });
  });
  const block = lines.slice(0, 140).join('\n');
  return block ? ('\n\nLOCAL KNOWLEDGE BASE (use this first, it is vetted by the tourism office):\n' + block + '\n') : '';
}

async function getAILive(input){
  const destMatch = getAI(input).dest;
  const key = (talaAiKey || '').trim();
  const model = (talaAiModel || '').trim();
  if(!key) throw new Error('OpenRouter API key not set — add it in Backoffice > TALA AI');
  if(!model) throw new Error('No AI model selected');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer ' + key
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      temperature: 0.6,
      messages: [
        { role:'system', content: TALA_BASE_PROMPT + talaKnowledgeBlock() },
        { role:'user', content: input }
      ]
    })
  });
  const j = await res.json().catch(()=>({}));
  if(!res.ok){
    const e = (j && j.error) ? (j.error.message || JSON.stringify(j.error)) : ('HTTP ' + res.status);
    throw new Error(String(e));
  }
  const reply = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
  return { reply: reply || getAI(input).reply, dest: destMatch };
}

function answerTala(t){
  if(talaAiEnabled){
    document.getElementById('tshStatus').textContent = 'tala is thinking…';
    getAILive(t)
      .then(obj => {
        const { reply, dest } = obj;
        if (dest && typeof openDest === 'function') {
          openDest(dest);
          openTalaSheet();
        }
        markTalaIdle(); addMsg('bot', reply); speak(reply);
      })
      .catch(err=>{ console.warn('[TALA] live AI unavailable, using curated answers:', err); markTalaIdle(); const fallback = getAI(t); addMsg('bot', fallback.reply); speak(fallback.reply); });
  } else {
    const r = getAI(t);
    if (r.dest && typeof openDest === 'function') openDest(r.dest);
    setTimeout(()=>{ addMsg('bot', r.reply); speak(r.reply); }, 140);
  }
}
function markTalaIdle(){
  const st = document.getElementById('tshStatus');
  if(st && st.textContent === 'tala is thinking…') st.textContent = 'Your Palawan concierge';
}

// ─── MAP ───
let map, mapReady=false;
const markersByCat={};
let allMarkers=[];
const PIN_VISIBLE_ZOOM = 12; // pins hidden below this zoom on the default/idle map view
let pinsCurrentlyVisible = true;
let activeMarkerSet = []; // tracks whichever markers are "supposed" to be on the map right now (all, or a filtered category)
let pinVisibilityOverride = false; // true once the user explicitly picks a category — keeps pins on regardless of zoom until they go back to 'All'/Map tab

// Signature neon-dot palette. Reserved functional categories always
// map to a fixed colour so the map reads at a glance; any other
// admin-defined category falls through to its configured colour.
const NEON_CATEGORY_COLORS = {
  stays: '#facc15',       // Amber — Accommodations
  food: '#ff3b47',        // Neon Red — F&B
  beaches: '#39ff88',     // Matrix Green — Beaches
  nature: '#39ff88',      // Matrix Green — Viewpoints / Waterfalls
  islands: '#39ff88',     // Matrix Green
  transport: '#a855f7',   // Cyber Purple — Public Transport
  airport: '#a855f7'      // Cyber Purple — Airports
};
function neonColorForCategory(key){
  if(NEON_CATEGORY_COLORS[key]) return NEON_CATEGORY_COLORS[key];
  const label = (catStyle[key] && catStyle[key].label || '').toLowerCase();
  if(label.includes('food') || label.includes('f&b') || label.includes('restaurant')) return NEON_CATEGORY_COLORS.food;
  if(label.includes('stay') || label.includes('accommodation') || label.includes('hotel') || label.includes('resort')) return NEON_CATEGORY_COLORS.stays;
  if(label.includes('beach') || label.includes('waterfall') || label.includes('viewpoint') || label.includes('nature')) return NEON_CATEGORY_COLORS.beaches;
  if(label.includes('transport') || label.includes('airport') || label.includes('port') || label.includes('station')) return NEON_CATEGORY_COLORS.transport;
  return (catStyle[key] && catStyle[key].color) || '#39ff88';
}

function rebuildMarkers(){
  if(!map) return;
  allMarkers.forEach(m=>map.removeLayer(m));
  allMarkers=[];
  for(const k in markersByCat) delete markersByCat[k];
  destinations.forEach(d=>{
    if(!SanvicExplore.hasCoordinates(d)) return;
    if(!markersByCat[d.category]) markersByCat[d.category]=[];
    const style=catStyle[d.category] || DEFAULT_CAT_STYLE[d.category] || {};
    const configured=style.icon;
    const icon=LUCIDE_ICONS[configured] || EXTRA_ICONS[configured] ? configured : DEFAULT_CAT_STYLE[d.category]?.icon || 'map-pin';
    const color=/^#[0-9a-f]{6}$/i.test(style.color||'') ? style.color : '#0ea5e9';
    const html = `<span class="place-pin" style="--pin-color:${color}">${lucideSvg(icon,11)}</span>`;
    const m = L.marker([d.lat,d.lng],{title:d.name,alt:d.name,keyboard:true,icon:L.divIcon({className:'place-marker',html,iconSize:[44,44],iconAnchor:[22,22]})});
    const label = document.createElement('span'); label.textContent=d.name;
    m.bindTooltip(label,{direction:'top',offset:[0,-11]});
    m._d=d; m.on('click',()=>openDest(d));
    markersByCat[d.category].push(m); allMarkers.push(m);
  });
  activeMarkerSet = allMarkers;
  applyPinVisibility();
  renderDiscoverList(document.querySelector('.discover-cat.active')?.dataset.cat || 'all');
  if(document.body.classList.contains('explore-open')) syncExploreMap();
}

// Adds/removes activeMarkerSet from the map based on current zoom,
// without touching which markers are "selected" by a category filter.
// Skipped while pinVisibilityOverride is set (explicit category pick).
function applyPinVisibility(){
  if(!map) return;
  const z = map.getZoom();
  const shouldShow = pinVisibilityOverride || document.body.classList.contains('explore-open') || z >= PIN_VISIBLE_ZOOM;
  // Zoom-based label suppression: at zoom <= 11, hide barangay text tooltips
  // so the canvas reads as clean neon-dot nodes only.
  const cont = map.getContainer();
  if(cont) cont.classList.toggle('zoom-far', z <= 11);
  if(shouldShow === pinsCurrentlyVisible) {
    if(shouldShow) activeMarkerSet.forEach(m=>{ if(!map.hasLayer(m)) m.addTo(map); });
    return;
  }
  pinsCurrentlyVisible = shouldShow;
  if(shouldShow){
    activeMarkerSet.forEach(m=>m.addTo(map));
  } else {
    allMarkers.forEach(m=>{ if(map.hasLayer(m)) map.removeLayer(m); });
  }
}

// ─── "MY LOCATION" ───
// One-shot getCurrentPosition() on tap — no watchPosition/continuous
// tracking, so it costs nothing while the visitor isn't actively asking
// "where am I". Re-tapping the button gets a fresh fix.
let userLocationMarker = null, userLocationAccuracyCircle = null;

function mapNotice(message){
  const el=document.getElementById('mapStatus');
  el.textContent=message; el.hidden=!message;
}
function locateUser(nearby=false){
  if(!navigator.geolocation){mapNotice('Location is not available on this device. Search by barangay instead.');return;}
  if(!map){mapNotice('The map is still loading. You can search for a place meanwhile.');return;}
  if(!document.body.classList.contains('explore-open')) dockNav('discover');
  if(currentDest) closeDestSheet(false);
  if(!exploreIsSide())setExploreSnap(1);
  const btn=document.getElementById('locateMeBtn');
  btn.disabled=true; btn.classList.add('locating'); btn.setAttribute('aria-busy','true');
  mapNotice('Finding your location…');
  navigator.geolocation.getCurrentPosition(pos=>{
    btn.disabled=false;btn.classList.remove('locating');btn.setAttribute('aria-busy','false');
    const {latitude:lat,longitude:lng,accuracy}=pos.coords;
    if(lat<6.5||lat>12.9||lng<116.6||lng>121){mapNotice('You are outside Palawan. Choose a barangay to explore San Vicente.');return;}
    if(userLocationMarker)map.removeLayer(userLocationMarker);
    if(userLocationAccuracyCircle)map.removeLayer(userLocationAccuracyCircle);
    userLocationAccuracyCircle=L.circle([lat,lng],{radius:accuracy,color:'#0d9488',weight:1,fillOpacity:.08,interactive:false}).addTo(map);
    userLocationMarker=L.marker([lat,lng],{title:'Your location',icon:L.divIcon({className:'user-location',html:'<span></span>',iconSize:[24,24],iconAnchor:[12,12]}),zIndexOffset:1100}).addTo(map);
    exploreState.nearby=!!nearby;
    renderExploreContent(); syncExploreMap();
    map.setView([lat,lng],14,{animate:!reducedMotion()});
    mapNotice(nearby?'Places sorted by straight-line distance, not travel time.':'Your location is shown. Accuracy about '+Math.round(accuracy)+' m.');
  },err=>{
    btn.disabled=false;btn.classList.remove('locating');btn.setAttribute('aria-busy','false');
    mapNotice(err.code===1?'Location permission is off. Enable it in your browser, or search by barangay.':'We could not locate you. Try again or search by barangay.');
  },{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
}
function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
let barangayLayer=null;
let barangayVisible=true;
async function initMap(){
  if(mapReady)return;
  mapReady=true;
  if(!dataReady)await loadDataFromSupabase();
  if(typeof L==='undefined'){mapNotice('The map could not load. You can still browse the directory. Reload when your connection returns.');return;}
  map=L.map('map',{center:[10.50,119.22],zoom:11,minZoom:8,maxZoom:19,zoomControl:false,attributionControl:true,
    maxBounds:[[6.5,116.6],[12.9,121.0]],maxBoundsViscosity:1,worldCopyJump:false});
  const attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
  window._mS=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution,maxZoom:19});
  window._mTerrain=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{attribution:attribution+', SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',maxNativeZoom:17,maxZoom:19,subdomains:'abc'});
  window._mSatellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
    attribution:'Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community',maxZoom:19});
  [window._mS,window._mTerrain,window._mSatellite].forEach(layer=>{
    let errors=0;
    layer.on('tileerror',()=>{
      if(!map.hasLayer(layer))return;
      if(++errors>=3) mapNotice('Some map tiles are unavailable. Try another layer; the place directory still works.');
    });
    layer.on('tileload',()=>{errors=0;});
  });
  window._mView=null;
  let preferred='street';
  try{preferred=sessionStorage.getItem('sanvic_basemap')||'street';barangayVisible=sessionStorage.getItem('sanvic_boundaries')!=='off';}catch(e){}
  switchMapLayer(preferred);
  L.control.zoom({position:'topright'}).addTo(map);
  document.getElementById('mapLayerToggle').classList.add('visible');
  initBarangayLayer(); rebuildMarkers();
  map.on('zoomend',applyPinVisibility);
  map.on('resize',()=>highlightExplorePlace(exploreState.selected));
  syncMapViewport();
  if(document.body.classList.contains('explore-open'))fitExploreResults();
}
function getBarangayStyle(){
  const light=['street','terrain'].includes(window._mView);
  return {color:light?'#34556b':'#d1e3ec',weight:1.3,opacity:.55,fillOpacity:.015,dashArray:'5,5'};
}
function initBarangayLayer(){
  if(typeof SAN_VICENTE_BARANGAYS==='undefined')return;
  barangayLayer=L.geoJSON(SAN_VICENTE_BARANGAYS,{style:getBarangayStyle(),onEachFeature:(f,layer)=>{
    const label=document.createElement('span');label.textContent=f.properties?.name||'Barangay';
    layer.bindTooltip(label,{sticky:true,className:'barangay-tooltip'});
  }});
  if(barangayVisible)barangayLayer.addTo(map);
  document.getElementById('barangayToggle').checked=barangayVisible;
}
function toggleBarangayLayer(){
  barangayVisible=document.getElementById('barangayToggle').checked;
  if(barangayLayer && map){if(barangayVisible)barangayLayer.addTo(map);else map.removeLayer(barangayLayer);}
  try{sessionStorage.setItem('sanvic_boundaries',barangayVisible?'on':'off');}catch(e){}
}
function updateBarangayStyle(){barangayLayer?.setStyle(getBarangayStyle());}
function switchMapLayer(type){
  if(!map)return;
  const layers={street:window._mS,dark:window._mS,terrain:window._mTerrain,satellite:window._mSatellite};
  if(!layers[type])type='street';
  const previous=layers[window._mView];
  if(previous && previous!==layers[type])map.removeLayer(previous);
  if(!map.hasLayer(layers[type]))layers[type].addTo(map);
  window._mView=type;
  document.body.classList.toggle('map-dark',type==='dark');
  document.body.classList.toggle('map-light',type==='street'||type==='terrain');
  document.body.classList.toggle('map-satellite',type==='satellite');
  document.querySelectorAll('input[name="basemap"]').forEach(input=>{input.checked=input.value===type;});
  try{sessionStorage.setItem('sanvic_basemap',type);}catch(e){}
  updateBarangayStyle(); mapNotice('');
}
function toggleLayersMenu(force){
  const menu=document.getElementById('layersMenu'), trigger=document.getElementById('layersButton');
  const open=typeof force==='boolean'?force:menu.hidden;
  menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));
  if(open)menu.querySelector('input:checked')?.focus();
}
document.addEventListener('click',e=>{
  if(!e.target.closest('#mapLayerToggle'))toggleLayersMenu(false);
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(!document.getElementById('layersMenu').hidden){toggleLayersMenu(false);document.getElementById('layersButton').focus();}
  else if(currentDest){closeDestSheet();}
  else if(document.body.classList.contains('explore-open')&&!exploreIsSide()){setExploreSnap(1);document.getElementById('esHandle').focus();}
});

// ─── SINGLE-ACTIVE-LAYER SYSTEM ───
// At any moment, at most ONE of: destSheet, talaSheet, search-focus is active.
// When one opens, others close automatically.

function closeAllPanels() {
  closeDestSheet(false);
  closeTalaSheet(false);
  closeAroundMePanel();
  closePulsePanel();
  closeDashboard();
  closeTodaySheet();
  closeExploreSheet();
  if(typeof closeMySanvicPanel==='function') closeMySanvicPanel();
  if(typeof closeHuntPanel==='function') closeHuntPanel();
  refreshPanelOpen();
}

// ─── PANEL-OPEN BODY STATE ───
// Toggles body.panel-open whenever any drawer/sheet/panel is visible so we
// can dampen the hero greeting + weather bar and prevent visual bleed.
function refreshPanelOpen(){
  try{
    const sel = [
      '.today-sheet.peek', '.today-sheet.expanded',
      '.explore-sheet.open',
      '#pulsePanel:not(.hidden)',
      '#mySanvicPanel:not(.hidden)',
      '#huntPanel:not(.hidden)',
      '#discoverPanel.open',
      '#aroundMePanel.open',
      '#destSheet.open',
      '#talaSheet.open',
      '#dashboard.open'
    ].join(',');
    const open = !!document.querySelector(sel);
    document.body.classList.toggle('panel-open', open);
  }catch(e){}
}
// Re-check on next frame so class mutations settle before we read them.
function schedulePanelOpen(){ requestAnimationFrame(refreshPanelOpen); }
// Observe body subtree for class changes on the panel roots and auto-sync.
if(typeof window!=='undefined'){
  window.addEventListener('DOMContentLoaded', ()=>{
    try{
      const mo = new MutationObserver(schedulePanelOpen);
      mo.observe(document.body, { attributes:true, subtree:true, attributeFilter:['class','hidden','style'] });
    }catch(e){}
  });
}




// ─── TODAY DRAWER ───
// The "Today" dock tab opens this bottom sheet. Peek state shows a
// greeting ("Good morning, {Name}") and a Today chip; expanded state
// reveals the seven "San Vicente Daily" editorial cards.
function timeOfDayGreeting(){
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function todayNickname(){
  try{
    const raw = localStorage.getItem('sanvic_entry_v1');
    if(!raw) return '';
    const p = JSON.parse(raw);
    return (p && p.nickname ? String(p.nickname).trim() : '');
  }catch(e){ return ''; }
}
function updateTodayGreeting(){
  const kicker = document.getElementById('todayGreetingKicker');
  const nameEl = document.getElementById('todayGreetingName');
  if(!kicker || !nameEl) return;
  kicker.textContent = timeOfDayGreeting();
  const name = todayNickname();
  nameEl.textContent = name || 'Traveler';
}
function openTodaySheet(){
  const s = document.getElementById('todaySheet');
  if(!s) return;
  renderTodayContent();
  updateTodayGreeting();
  s.classList.remove('hidden','expanded');
  s.classList.add('peek');
}
function toggleTodaySheet(){
  const s = document.getElementById('todaySheet');
  if(!s) return;
  const cur = s.classList.contains('expanded') ? 'expanded'
    : s.classList.contains('mid') ? 'mid'
    : s.classList.contains('peek') ? 'peek' : 'hidden';
  s.classList.remove('peek','mid','expanded','hidden');
  const next = cur==='peek' ? 'mid' : cur==='mid' ? 'expanded' : 'peek';
  s.classList.add(next);
  if(next!=='peek') updateTodayGreeting();
}
function setTodaySnap(level){
  const s = document.getElementById('todaySheet');
  if(!s) return;
  s.classList.remove('peek','mid','expanded','hidden');
  s.classList.add(level===3?'expanded':level===2?'mid':'peek');
}
function collapseTodaySheet(){
  const s = document.getElementById('todaySheet');
  if(!s) return;
  s.classList.remove('expanded','mid');
  s.classList.add('peek');
}
function closeTodaySheet(){
  const s = document.getElementById('todaySheet');
  if(!s) return;
  s.classList.remove('peek','expanded');
  s.classList.add('hidden');
}

// ─── EXPLORE — one shared state for the list, map and selected place ───
const EXPLORE_SIDE_QUERY = '(min-width:1100px), (min-width:900px) and (orientation:landscape)';
const EXPLORE_AREAS = typeof SAN_VICENTE_BARANGAYS === 'undefined' ? [] :
  SAN_VICENTE_BARANGAYS.features.map(f=>({k:f.properties.name}));
let exploreAudience = 'visitor';
try{ exploreAudience = localStorage.getItem('sanvic_explore_audience') === 'local' ? 'local' : 'visitor'; }catch(e){}
const exploreState = {query:'', category:'all', area:'', snap:1, selected:null, scroll:0, nearby:false};
let exploreReturnView = null;
let exploreResizeObserver = null;
function exploreIsSide(){ return window.matchMedia(EXPLORE_SIDE_QUERY).matches; }
function setExploreAudience(mode){
  exploreAudience = mode === 'local' ? 'local' : 'visitor';
  try{localStorage.setItem('sanvic_explore_audience',exploreAudience);}catch(e){}
  renderExploreContent();
}
function openExploreSheet(){
  const s = document.getElementById('exploreSheet');
  if(!s) return;
  document.body.classList.add('explore-open');
  s.classList.add('open');
  s.removeAttribute('inert');
  document.getElementById('heroOverlay').classList.add('hidden');
  document.getElementById('heroFade').classList.add('hidden');
  setExploreSnap(exploreState.snap);
  renderExploreContent();
  requestAnimationFrame(()=>{ document.getElementById('exploreContent').scrollTop=exploreState.scroll; syncExploreMap(); });
}
function closeExploreSheet(){
  const s = document.getElementById('exploreSheet');
  if(!s) return;
  exploreState.scroll = document.getElementById('exploreContent').scrollTop;
  s.classList.remove('open');
  s.setAttribute('inert','');
  document.body.classList.remove('explore-open');
  syncMapViewport();
}
function setExploreSnap(level){
  const s = document.getElementById('exploreSheet');
  if(!s) return;
  exploreState.snap = Math.max(1,Math.min(3,Number(level)||1));
  s.classList.remove('l1','l2','l3');
  s.classList.add('l'+exploreState.snap);
  s.dataset.snap=String(exploreState.snap);
  const handle=document.getElementById('esHandle');
  handle.setAttribute('aria-label',exploreState.snap===3?'Collapse place list':'Expand place list');
  handle.setAttribute('aria-expanded',String(exploreState.snap>1));
  syncMapViewport();
}
function cycleExploreSnap(){ setExploreSnap(exploreState.snap===3?1:exploreState.snap+1); }
function syncMapViewport(){
  if(!map) return;
  const sheet = document.getElementById('exploreSheet');
  const detail = document.body.classList.contains('place-open');
  const open = document.body.classList.contains('explore-open');
  let bottom = 0;
  if(!exploreIsSide()){
    if(detail) bottom = document.getElementById('destSheet').getBoundingClientRect().height + 80;
    else if(open) bottom = sheet.getBoundingClientRect().height + 80;
  }
  document.body.style.setProperty('--map-bottom',Math.min(bottom,window.innerHeight-160)+'px');
  // Desktop map has its own column; Leaflet measures the actual available space.
  map.invalidateSize({animate:false,pan:false});
}
function exploreResults(){
  const results=SanvicExplore.filter(destinations,exploreState,catStyle);
  const localKeys=/food|shop|service|transport|market|stay|cafe|restaurant/i;
  return results.sort((a,b)=>{
    if(exploreState.nearby && userLocationMarker){
      const p=userLocationMarker.getLatLng();
      const dist=d=>SanvicExplore.hasCoordinates(d)?SanvicExplore.distanceKm(p,d):Infinity;
      return dist(a)-dist(b);
    }
    if(exploreAudience==='local'){
      const local=d=>localKeys.test(d.category+' '+(catStyle[d.category]?.label||''))?1:0;
      if(local(a)!==local(b)) return local(b)-local(a);
    }
    return Number(!!b.featured)-Number(!!a.featured) || a.name.localeCompare(b.name);
  });
}
function explorePlaceCard(d){
  const cat=catStyle[d.category] || {label:d.category||'Place',icon:'map-pin'};
  const photo=SanvicExplore.safeUrl(d.image,true);
  const selected=String(exploreState.selected)===String(d.id);
  const distance=exploreState.nearby && userLocationMarker && SanvicExplore.hasCoordinates(d)
    ? SanvicExplore.distanceKm(userLocationMarker.getLatLng(),d).toFixed(1)+' km straight-line' : '';
  return `<button class="explore-result${selected?' selected':''}" data-place-id="${escT(d.id)}" aria-pressed="${selected}" onclick="selectExplorePlace(this.dataset.placeId)">
    <span class="explore-result-image">${photo?`<img src="${escT(photo)}" alt="${escT(d.name)}" loading="lazy" onerror="this.hidden=true">`:''}<span class="image-placeholder" aria-hidden="true">${lucideSvg(cat.icon||'map-pin',24)}</span></span>
    <span class="explore-result-copy"><span class="result-category">${escT(cat.label)}</span><strong>${escT(d.name)}</strong><span class="result-area">${lucideSvg('map-pin',13)} ${escT(d.barangay||'San Vicente')}</span>
    ${distance||d.stats?.travel?`<span class="result-access">${escT(distance||d.stats.travel)}</span>`:''}</span><span class="result-arrow" aria-hidden="true">${lucideSvg('chevron-right',17)}</span>
  </button>`;
}
function renderExploreContent(){
  const body=document.getElementById('exploreContent');
  if(!body) return;
  document.querySelectorAll('.es-audience-btn').forEach(b=>{
    const active=b.dataset.mode===exploreAudience;
    b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));
  });
  const keys=Object.keys(catStyle).filter(k=>destinations.some(d=>d.category===k));
  // Show real categories only; the admin remains free to add or rename them.
  const ribbon=document.getElementById('esRibbon');
  ribbon.innerHTML=`<button class="es-chip ${exploreState.category==='all'?'accent':''}" data-category="all" aria-pressed="${exploreState.category==='all'}" onclick="selectExploreCategory('all')">All places</button>`+
    keys.map(k=>`<button class="es-chip ${exploreState.category===k?'accent':''}" data-category="${escT(k)}" aria-pressed="${exploreState.category===k}" onclick="selectExploreCategory(this.dataset.category)">${lucideSvg(catStyle[k].icon||'map-pin',16)}${escT(catStyle[k].label)}</button>`).join('');
  const areas=Array.from(new Set(destinations.map(d=>d.barangay).filter(Boolean))).sort();
  const area=document.getElementById('esArea');
  area.innerHTML='<option value="">All barangays</option>'+areas.map(b=>`<option value="${escT(b)}">${escT(b)}</option>`).join('');
  area.value=exploreState.area;
  const matches=exploreResults();
  document.getElementById('esResultCount').textContent=destinationsSource==='loading'?'Loading places…':matches.length+' place'+(matches.length===1?'':'s');
  document.getElementById('esReset').hidden=!exploreState.query && exploreState.category==='all' && !exploreState.area && !exploreState.nearby;
  document.getElementById('esNearby').setAttribute('aria-pressed',String(exploreState.nearby));
  const status=document.getElementById('esDataStatus');
  status.hidden=destinationsSource==='supabase';
  status.innerHTML=destinationsSource==='fallback'
    ? 'Directory unavailable. These are sample places, not verified live listings. <button onclick="retryExploreData()">Retry</button>'
    : 'Loading the local directory…';
  if(destinationsSource==='loading'){ body.innerHTML='<div class="explore-empty" role="status">Finding places across San Vicente…</div>'; return; }
  body.innerHTML=matches.length?matches.map(explorePlaceCard).join(''):
    `<div class="explore-empty">${lucideSvg('map-pin',32)}<h3>${destinations.length?'No matching places yet':'The directory is taking shape'}</h3><p>${destinations.length?'Try a different name, category or barangay.':'Local businesses and tourist places will appear here as they are added.'}</p>${destinations.length?'<button class="es-action" onclick="resetExploreFilters()">Show all places</button>':''}</div>`;
}
function syncExploreMap(){
  if(!map) return;
  const ids=new Set(exploreResults().filter(SanvicExplore.hasCoordinates).map(d=>String(d.id)));
  allMarkers.forEach(m=>{ if(!ids.has(String(m._d.id))) map.removeLayer(m); });
  activeMarkerSet=allMarkers.filter(m=>ids.has(String(m._d.id)));
  pinVisibilityOverride=true;
  applyPinVisibility();
  highlightExplorePlace(exploreState.selected);
}
function filterExploreResults(raw){
  exploreState.query=String(raw||'');
  renderExploreContent(); syncExploreMap();
}
function selectExploreCategory(category){
  exploreState.category=category;
  renderExploreContent(); syncExploreMap(); fitExploreResults();
}
function selectExploreArea(area){
  exploreState.area=area;
  renderExploreContent(); syncExploreMap(); fitExploreResults();
}
function resetExploreFilters(){
  Object.assign(exploreState,{query:'',category:'all',area:'',nearby:false});
  document.getElementById('esSearchInput').value='';
  renderExploreContent(); syncExploreMap(); fitExploreResults();
}
function fitExploreResults(){
  if(!map) return;
  const coords=exploreResults().filter(SanvicExplore.hasCoordinates).map(d=>[Number(d.lat),Number(d.lng)]);
  if(!coords.length) return;
  if(!exploreIsSide()) setExploreSnap(1);
  syncMapViewport();
  const bottom=exploreIsSide()?90:Math.min(document.getElementById('exploreSheet').getBoundingClientRect().height+100,window.innerHeight-180);
  map.fitBounds(coords,{paddingTopLeft:[48,100],paddingBottomRight:[70,bottom],maxZoom:14,animate:false});
}
function selectExplorePlace(id){
  const d=destinations.find(d=>String(d.id)===String(id));
  if(d) openDest(d);
}
function highlightExplorePlace(id){
  exploreState.selected=id;
  allMarkers.forEach(m=>{
    const selected=String(m._d.id)===String(id);
    m.getElement()?.classList.toggle('selected',selected);
    m.setZIndexOffset(selected?1000:0);
  });
  document.querySelectorAll('.explore-result').forEach(el=>{
    const selected=el.dataset.placeId===String(id);
    el.classList.toggle('selected',selected); el.setAttribute('aria-pressed',String(selected));
  });
}
async function retryExploreData(){
  destinationsSource='loading'; renderExploreContent();
  await loadDataFromSupabase(); rebuildMarkers(); renderExploreContent(); syncExploreMap();
}
function askTalaFromExplore(){
  closeAllPanels(); openTalaSheet();
  const input=document.getElementById('talaInput');
  input.value=exploreAudience==='local'?'Help me find a local business in San Vicente':'Help me plan a day exploring San Vicente';
  input.focus();
}
function recommendExplorePlace(){
  closeAllPanels(); openTalaSheet();
  const input=document.getElementById('talaInput');
  input.value='I would like to recommend a local place. How can I share its name, barangay and location with the SANVIC team?';
  input.focus();
  // This is assistance, not a submission form. Never imply it saves a listing.
}
function initExploreInteractions(){
  const sheet=document.getElementById('exploreSheet'), handle=document.getElementById('esHandle');
  let drag=null, moved=false;
  handle.addEventListener('pointerdown',e=>{
    if(exploreIsSide()) return;
    drag={y:e.clientY,height:sheet.getBoundingClientRect().height}; moved=false;
    handle.setPointerCapture(e.pointerId);
    sheet.style.transition='none';
  });
  handle.addEventListener('pointermove',e=>{
    if(!drag) return;
    moved=moved||Math.abs(drag.y-e.clientY)>5;
    sheet.style.setProperty('height',Math.max(180,Math.min(window.innerHeight-84,drag.height+drag.y-e.clientY))+'px','important');
  });
  function release(){
    if(!drag) return;
    const h=sheet.getBoundingClientRect().height;
    sheet.style.height=''; sheet.style.transition='';
    if(moved){
      const heights=[Math.min(232,window.innerHeight*.4),window.innerHeight*.60,window.innerHeight-84];
      let best=0; heights.forEach((v,i)=>{if(Math.abs(v-h)<Math.abs(heights[best]-h))best=i;});
      setExploreSnap(best+1);
    }
    drag=null;
  }
  handle.addEventListener('pointerup',release);
  handle.addEventListener('pointercancel',release);
  handle.addEventListener('click',()=>{if(!moved)cycleExploreSnap(); moved=false;});
  document.getElementById('esSearchInput').addEventListener('focus',()=>{if(!exploreIsSide())setExploreSnap(2);});
  document.getElementById('exploreContent').addEventListener('scroll',e=>{exploreState.scroll=e.target.scrollTop;},{passive:true});
  exploreResizeObserver=new ResizeObserver(syncMapViewport);
  exploreResizeObserver.observe(sheet); exploreResizeObserver.observe(document.getElementById('destSheet'));
  window.addEventListener('resize',syncMapViewport,{passive:true});
  window.visualViewport?.addEventListener('resize',()=>{
    const keyboard=window.innerHeight-window.visualViewport.height;
    document.body.style.setProperty('--keyboard-inset',keyboard>120?keyboard+'px':'0px');
    syncMapViewport();
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initExploreInteractions,{once:true});
else initExploreInteractions();

// ─── TODAY DAILY DATA (demo seed; DB wiring is a follow-up) ───
const TODAY_DATA = {
  snapshot: {
    weather: { icon:'☀️', temp:'29°C', label:'Sunny' },
    sea: 'Calm swell',
    sunset: '17:52',
    moon: { glyph:'🌔', label:'Waxing gibbous' },
    tribes: 3,
    happenings: 6
  },
  talaPick: {
    intro: "Go north today. The sea looks calmer near Alimanguan, and the light will thank you at sunset.",
    path: [
      { label:'Late lunch',   sub:'12:30 · Port Barton' },
      { label:'Wild beach',   sub:'14:00 · Alimanguan'  },
      { label:'Sunset drink', sub:'17:30 · Long Beach'  }
    ]
  },
  happening: [
    { title:'Acoustic night at Nauti Beach', place:'Long Beach',   time:'19:30', dist:'2.4 km', vibe:'Chill' },
    { title:'Sunset paddle out',              place:'Alimanguan',   time:'16:30', dist:'11 km',  vibe:'Surf'  },
    { title:'Fiesta procession',              place:'Poblacion',    time:'18:00', dist:'0.6 km', vibe:'Local' },
    { title:'Beach bonfire jam',              place:'Port Barton',  time:'20:30', dist:'28 km',  vibe:'Social'}
  ],
  joinable: [
    { title:'Island hop from Port Barton', detail:'3 seats left · departs 8:00 tomorrow', crowd:3 },
    { title:'Dinner in Poblacion tonight',  detail:'2 travelers looking for company · 19:30', crowd:2 },
    { title:'Van to Puerto Princesa',       detail:'1 seat left · Friday 06:00 pickup',      crowd:4 }
  ],
  weather: [
    { icon:'🏝️', label:'Island hopping', verdict:'Good morning for it. Wind picks up after 2 PM — head out early.' },
    { icon:'🏄', label:'Surf',            verdict:'Small and clean at Alimanguan. Fine for longboards, patient shortboarders.' },
    { icon:'🌧️', label:'Rain risk',       verdict:'Low until early evening. A short shower possible around 18:00.' },
    { icon:'🌊', label:'Tide',            verdict:'Low tide at 14:20 — good for tidepools, not great for shallow boat launches.' }
  ],
  locals: [
    { biz:'Long Beach Grill',   badge:'🐟', text:'Fresh yellowfin tuna just came in. Ask for kinilaw.',        meta:'Poblacion · 18m ago' },
    { biz:'Nauti Beach Bar',    badge:'🍹', text:'2-for-1 sunset drinks, 17:00 to 18:30 only.',                meta:'Long Beach · 42m ago' },
    { biz:'Aling Rosa Bakery',  badge:'🥖', text:'Fresh pandesal from 6 AM. Ube version back tomorrow.',       meta:'Poblacion · 2h ago' }
  ],
  notices: [
    { text:'BPI ATM Poblacion — cash available, no queue right now.' },
    { text:'Alimanguan gas station: out of unleaded until Thursday.' },
    { text:'Weak cell signal past Bato ni Ningning — download offline maps first.' },
    { text:'Muddy road to Pamuayan Falls after last night’s rain. 4×4 or scooter only.' }
  ]
};

function escT(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderTodayContent(){
  const host = document.getElementById('todayScroll');
  if(!host || host.dataset.rendered === '1') return;
  const d = TODAY_DATA;
  const snap = `
    <article class="today-card">
      <div class="today-kicker">Daily snapshot</div>
      <div class="today-title">San Vicente, right now</div>
      <div class="today-snap-grid">
        <div class="today-snap"><span class="tsn-glyph">${d.snapshot.weather.icon}</span><span class="tsn-val">${escT(d.snapshot.weather.temp)}</span><span class="tsn-lbl">${escT(d.snapshot.weather.label)}</span></div>
        <div class="today-snap"><span class="tsn-glyph">🌊</span><span class="tsn-val">${escT(d.snapshot.sea)}</span><span class="tsn-lbl">Sea</span></div>
        <div class="today-snap"><span class="tsn-glyph">🌇</span><span class="tsn-val">${escT(d.snapshot.sunset)}</span><span class="tsn-lbl">Sunset</span></div>
        <div class="today-snap"><span class="tsn-glyph">${d.snapshot.moon.glyph}</span><span class="tsn-val">${escT(d.snapshot.moon.label)}</span><span class="tsn-lbl">Moon</span></div>
        <div class="today-snap"><span class="tsn-glyph">👥</span><span class="tsn-val">${d.snapshot.tribes}</span><span class="tsn-lbl">Tribes forming</span></div>
        <div class="today-snap"><span class="tsn-glyph">✨</span><span class="tsn-val">${d.snapshot.happenings}</span><span class="tsn-lbl">Happening today</span></div>
      </div>
    </article>`;
  const pick = `
    <article class="today-card">
      <div class="today-kicker">TALA’s pick of the day</div>
      <p class="today-lede">${escT(d.talaPick.intro)}</p>
      <div class="today-path">
        ${d.talaPick.path.map((n,i)=>`
          <div class="today-node">
            <div class="tnode-label">${escT(n.label)}</div>
            <div class="tnode-sub">${escT(n.sub)}</div>
          </div>
          ${i<d.talaPick.path.length-1?'<div class="today-arrow">→</div>':''}
        `).join('')}
      </div>
    </article>`;
  const happening = `
    <article class="today-card">
      <div class="today-kicker">Happening today</div>
      <ul class="today-list">
        ${d.happening.map(e=>`
          <li class="today-row">
            <div class="trow-main">
              <div class="trow-title">${escT(e.title)}</div>
              <div class="trow-meta">${escT(e.place)} · ${escT(e.time)}</div>
            </div>
            <div class="trow-chips">
              <span class="tchip">${escT(e.dist)}</span>
              <span class="tchip tchip-accent">${escT(e.vibe)}</span>
            </div>
            <div class="trow-actions">
              <button class="tbtn tbtn-primary">Join</button>
              <button class="tbtn">Save</button>
              <button class="tbtn">Directions</button>
            </div>
          </li>
        `).join('')}
      </ul>
    </article>`;
  const joinable = `
    <article class="today-card">
      <div class="today-kicker">Joinable today</div>
      <div class="today-title">Open spots, right now</div>
      <ul class="today-list">
        ${d.joinable.map(j=>`
          <li class="today-row">
            <div class="trow-main">
              <div class="trow-title">${escT(j.title)}</div>
              <div class="trow-meta">${escT(j.detail)}</div>
            </div>
            <div class="tavatars">${Array.from({length:j.crowd}).map((_,i)=>`<span class="tav" style="--i:${i}"></span>`).join('')}</div>
            <div class="trow-actions">
              <button class="tbtn tbtn-primary">Ask to join</button>
            </div>
          </li>
        `).join('')}
      </ul>
    </article>`;
  const weather = `
    <article class="today-card">
      <div class="today-kicker">Sea &amp; weather</div>
      <div class="today-title">What the day is telling you</div>
      <ul class="today-verdicts">
        ${d.weather.map(w=>`
          <li class="tverdict">
            <span class="tv-icon">${w.icon}</span>
            <div><div class="tv-label">${escT(w.label)}</div><div class="tv-text">${escT(w.verdict)}</div></div>
          </li>
        `).join('')}
      </ul>
    </article>`;
  const locals = `
    <article class="today-card">
      <div class="today-kicker">Fresh from locals</div>
      <ul class="today-locals">
        ${d.locals.map(l=>`
          <li class="tlocal">
            <span class="tl-badge">${l.badge}</span>
            <div><div class="tl-text">${escT(l.text)}</div><div class="tl-meta">${escT(l.biz)} · ${escT(l.meta)}</div></div>
          </li>
        `).join('')}
      </ul>
    </article>`;
  const notices = `
    <article class="today-card today-card-muted">
      <div class="today-kicker">Small notices</div>
      <ul class="today-notices">
        ${d.notices.map(n=>`<li class="tnotice"><span class="tn-glyph">⚠︎</span><span>${escT(n.text)}</span></li>`).join('')}
      </ul>
    </article>`;
  host.innerHTML = snap + pick + happening + joinable + weather + locals + notices;
  host.dataset.rendered = '1';
}

// ─── DESTINATION SHEET ───
let currentDest = null;

// ─── AROUND ME ───
// Each destination carries its own `barangay` (set in admin, from the
// destinations table). Nearby places are loaded from Supabase
// (nearby_places table, admin-manageable) and grouped by barangay.
// DEFAULT_NEARBY_PLACES below is only the offline fallback.
const DEFAULT_NEARBY_PLACES = {
  "Poblacion": [
    { name:"Tienda ni Aling Rosa", cat:"shop", desc:"Sari-sari store, snacks & drinks", dist:"Poblacion town", icon:"🛒" },
    { name:"Long Beach Grill", cat:"food", desc:"Grilled seafood, beachfront seating", dist:"Poblacion town", icon:"🍽️" },
    { name:"Motorbike Rental Hub", cat:"service", desc:"Daily & weekly rentals", dist:"Poblacion town", icon:"🛵" }
  ],
  "Port Barton": [
    { name:"Jambalaya Cajun Café", cat:"food", desc:"Cajun-Filipino fusion, fast wifi", dist:"Port Barton town", icon:"🍽️" },
    { name:"Ballesteros General Store", cat:"shop", desc:"Supplies, snacks, sunscreen", dist:"Port Barton town", icon:"🛒" },
    { name:"NFH Port Barton Dive Club", cat:"service", desc:"PADI training & equipment", dist:"Port Barton town", icon:"🤿" }
  ],
  "Alimanguan": [
    { name:"Alimanguan Boat Co-op", cat:"service", desc:"Island-hopping boat hire", dist:"At the dock", icon:"🛶" },
    { name:"Beachside Carinderia", cat:"food", desc:"Home-style Filipino meals", dist:"Alimanguan", icon:"🍽️" }
  ]
};

// Mutable — repopulated from nearby_places in Supabase every time data
// loads. Starts with the defaults above so nothing is ever blank.
let nearbyPlacesByBarangay = {};
Object.keys(DEFAULT_NEARBY_PLACES).forEach(b=>{
  nearbyPlacesByBarangay[b] = DEFAULT_NEARBY_PLACES[b].map(p=>({...p}));
});

function applyNearbyPlacesFromRows(rows){
  if(!rows || !rows.length) return; // keep current/default set if the table is empty/unreachable
  const next = {};
  rows.forEach(r=>{
    if(!next[r.barangay]) next[r.barangay] = [];
    next[r.barangay].push({ id:r.id, name:r.name, cat:r.category, desc:r.description, dist:r.distance_label, icon:r.icon||'📍' });
  });
  nearbyPlacesByBarangay = next;
}

let currentAroundBarangay = null;
let currentAroundCat = 'all';

function getAroundMeData(barangay){
  return nearbyPlacesByBarangay[barangay] || [];
}

function openAroundMePanel(){
  if(!currentDest) return;
  currentAroundBarangay = currentDest.barangay || null;
  currentAroundCat = 'all';
  document.querySelectorAll('.around-cat').forEach(b=>b.classList.toggle('active', b.dataset.cat==='all'));

  const titleEl = document.getElementById('aroundTitle');
  const subEl = document.getElementById('aroundSubtitle');
  if(currentAroundBarangay){
    titleEl.textContent = `Around ${currentDest.name}`;
    subEl.textContent = `Brgy. ${currentAroundBarangay} · ${getAroundMeData(currentAroundBarangay).length} places`;
  } else {
    titleEl.textContent = `Around ${currentDest.name}`;
    subEl.textContent = `Nearby places`;
  }

  renderAroundList();
  document.getElementById('aroundSheet').classList.add('open');
  document.getElementById('aroundOverlay').classList.add('active');
}

function closeAroundMePanel(){
  document.getElementById('aroundSheet').classList.remove('open');
  document.getElementById('aroundOverlay').classList.remove('active');
}

function selectAroundCategory(cat){
  currentAroundCat = cat;
  document.querySelectorAll('.around-cat').forEach(b=>b.classList.toggle('active', b.dataset.cat===cat));
  renderAroundList();
}

function renderAroundList(){
  const list = document.getElementById('aroundList');
  const places = getAroundMeData(currentAroundBarangay);
  const filtered = currentAroundCat==='all' ? places : places.filter(p=>p.cat===currentAroundCat);

  if(!filtered.length){
    list.innerHTML = `<div class="around-empty">No ${currentAroundCat==='all'?'':currentAroundCat+' '}places listed yet for this area.</div>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="around-card">
      <div class="around-card-icon">${p.icon}</div>
      <div class="around-card-body">
        <div class="around-card-name">${escapeHtml(p.name)}</div>
        <div class="around-card-meta">${escapeHtml(p.desc)}</div>
      </div>
      <div class="around-card-dist">${escapeHtml(p.dist)}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════
// PULSE — live community layer (UI/mock-data phase).
// Posts below are realistic placeholder content matching the
// approved design mockups. No real posting/accounts yet — that's
// a deliberate follow-up phase once user identity exists. The
// "Create Post" button and category/tab structure are wired up
// so the real data layer can slot in later without changing the
// UI shell.
// ═══════════════════════════════════════════════════════

let PULSE_CATEGORIES = {
  all:    { label: 'Pulse',          subtitle: 'Live community in San Vicente' },
  hidden: { label: 'Hidden Spots',   subtitle: 'Secret places, shared by locals.' },
  island: { label: 'Island Hopping', subtitle: 'Plan. Connect. Explore together.' },
  food:   { label: 'Food & Nightlife', subtitle: 'Where to eat, drink, and dance tonight.' },
  surf:   { label: 'Surf Report',    subtitle: 'Conditions, sessions, and swells.' },
  events: { label: 'Events Tonight', subtitle: "What's happening around San Vicente." }
};

// Loads admin-edited category labels from Supabase, overlaying them
// onto the hardcoded defaults above (subtitles + icons stay as
// designed; only the label text is admin-editable for now).
async function loadPulseCategoriesFromDB(){
  try {
    const { data: cats, error } = await sb.from('pulse_categories').select('key, label');
    if(error) throw error;
    (cats||[]).forEach(c=>{
      if(PULSE_CATEGORIES[c.key]) PULSE_CATEGORIES[c.key].label = c.label;
      else PULSE_CATEGORIES[c.key] = { label: c.label, subtitle: '' };
    });
  } catch(err){
    console.warn('[SANVIC] Could not load pulse categories from DB, using defaults:', err);
  }
}

const PULSE_POSTS = [
  { id:1, cat:'food', name:'Alex', avatar:'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&q=70', time:'3m ago', text:'Fresh tuna arrived at the market!', location:'Poblacion Public Market', image:'assets/pulse/street-food-skewers.jpg', likes:12, comments:5 },
  { id:2, cat:'hidden', name:'Sophie', avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=70', time:'8m ago', text:'Crystal clear water today at Bigaho Falls 💧', location:'Bigaho Falls', image:'assets/pulse/kayak-lagoon.jpg', likes:18, comments:7 },
  { id:3, cat:'island', name:'Jon', avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=70', time:'12m ago', text:'Looking for 2 more people to share a private boat tomorrow.', tag:'Island Hopping', avatars:3, likes:6, comments:3 },
  { id:4, cat:'all', name:'Local Guide – Jun', time:'15m ago', admin:true, text:'If you\'re heading to Port Barton, bring cash. ATM offline.', location:'Port Barton', likes:9, comments:2 },
  { id:5, cat:'all', name:'Maya', avatar:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&q=70', time:'18m ago', text:'Best sunset right now at Long Beach 🌅 Come and join!', location:'Long Beach', image:'assets/pulse/island-boats-beach.jpg', likes:24, comments:11 },
  { id:6, cat:'surf', name:'Diego', avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&q=70', time:'24m ago', text:'Clean 2-3ft sets at Alimanguan this morning, light offshore wind. Good for beginners right now.', location:'Alimanguan Beach', likes:15, comments:4 },
  { id:7, cat:'events', name:'Beach Bar Co.', time:'35m ago', admin:true, text:'Live acoustic set tonight from 7pm, free entry. Come early for sunset seats.', location:'Long Beach', likes:21, comments:6 },
  { id:8, cat:'food', name:'Pia', avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=70', time:'41m ago', text:'Night market has the best halo-halo right now, ube version is back 🍧', location:'Poblacion Night Market', image:'assets/pulse/bulalo-boodle.jpg', likes:14, comments:3 },
  { id:9, cat:'hidden', name:'Marco', avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=70', time:'52m ago', text:'Found a quiet tide pool past the rocks at Bato ni Ningning, perfect for sunset photos and almost nobody there.', location:'Bato ni Ningning', likes:19, comments:8 },
  { id:10, cat:'island', name:'Tara', avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=70', time:'1h ago', text:'Anyone heading to Port Barton this weekend? Let\'s share a ride and explore together!', location:'Port Barton', image:'assets/pulse/island-boats-aerial.jpg', likes:8, comments:6 },
  { id:11, cat:'all', name:'Carlos', avatar:'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop&q=70', time:'1h ago', text:'Lost a small black drone near Long Beach this afternoon. If found please message — happy to reward!', location:'Long Beach', likes:5, comments:9 },
  { id:12, cat:'surf', name:'Diego', avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&q=70', time:'2h ago', text:'Tide is dropping fast, current picking up past the point. Be careful past 5pm today.', location:'Alimanguan Beach', likes:11, comments:1 },
  { id:13, cat:'food', name:'Reyna', avatar:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&q=70', time:'3h ago', text:'Boodle fight with the whole barangay tonight! Bring your appetite, everyone\'s welcome 🐟', location:'Poblacion', image:'assets/pulse/boodle-fight-fish.jpg', likes:27, comments:9 }
];

let pulseCategory = 'all';
let pulseView = 'tribes';

// ─── PULSE v2: Tribes / Events / Lounge / Form ───
const PV2_CATS = ['All','Island Hopping','Sunset','Food & Drinks','Transport','Surf','Nightlife','Explore','Local Life'];
const PV2_AV = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&q=70',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=70',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=70',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=80&h=80&fit=crop&q=70',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=70',
];
const PULSE_TRIBES = [
  { id:'t1', title:'Sunset Chasers 🌅', where:'Long Beach', when:'Today, 5:30 PM', sub:'Sunset, drinks, photos & good vibes.', cap:6, joined:4, extra:2, tags:['Sunset'],
    thumb:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=260&fit=crop&q=70' },
  { id:'t2', title:'Island Hopping Tomorrow 🚣', where:'Port Barton', when:'Tomorrow, 8:00 AM', sub:'3 island stops, crystal water.', cap:6, joined:4, extra:1, tags:['Island Hopping'], spots:2, warn:true,
    thumb:'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&h=260&fit=crop&q=70' },
  { id:'t3', title:'Sunset Drinks 🍸', where:'Poblacion', when:'Today, 6:00 PM', sub:"Let's catch the golden hour.", cap:5, joined:4, extra:3, tags:['Sunset','Food & Drinks','Nightlife'],
    thumb:'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&h=260&fit=crop&q=70' },
  { id:'t4', title:'Sunrise Surf Crew 🌊', where:'Alimanguan', when:'Tomorrow, 6:00 AM', sub:'Waves, coffee, go!', cap:3, joined:4, extra:1, tags:['Surf'],
    thumb:'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=200&h=260&fit=crop&q=70' },
  { id:'t5', title:'Shared Ride to Port Barton 🚐', where:'Poblacion', when:'Tomorrow, 10:00 AM', sub:"2 seats open. Let's split gas!", cap:0, joined:4, extra:1, tags:['Transport'], seatsOpen:2, ok:true,
    thumb:'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=200&h=260&fit=crop&q=70' },
];
const PULSE_EVENTS = [
  { id:'e1', title:'🎉 Full Moon Party at Baybay', org:'Baybay Beach Club', where:'Baybay Beach', when:'Tonight, 9:00 PM', price:'Free entry', tags:['Nightlife'] },
  { id:'e2', title:'🍖 Lechon by the Beach', org:'Sunset Resort', where:'Sunset Resort', when:'Today, 6:00 PM', price:'₱650 / plate', tags:['Food & Drinks'] },
  { id:'e3', title:'🎸 Acoustic Night in Poblacion', org:'The Deck', where:'Poblacion', when:'Tonight, 7:30 PM', price:'No cover', tags:['Nightlife','Food & Drinks'] },
];
const PULSE_LOUNGE = [
  { id:'l1', name:'Marco', text:'Hey! Anyone at Long Beach right now? Weather is unreal 🌤️' },
  { id:'l2', name:'Tara', text:'Just got to Port Barton — where should I grab lunch?' },
  { id:'l3', name:'Kai', text:'Board rental at Alimanguan is 400/day fyi.' },
];

function pulseIsSignedIn(){
  try{
    if(window.pulseIsSignedIn_override) return true;
    if(typeof supabase !== 'undefined' && supabase && supabase.auth){
      // best-effort synchronous check via cached user
      const u = supabase.auth.__cachedUser;
      if(u) return true;
    }
    if(localStorage.getItem('sanvic_user')) return true;
  }catch(_){ }
  return false;
}
function openPulseAuthGate(){ const w=document.getElementById('pv2AuthWrap'); if(w) w.classList.add('on'); }
function closePulseAuthGate(){ const w=document.getElementById('pv2AuthWrap'); if(w) w.classList.remove('on'); }
function pulseSignInContinue(){
  closePulseAuthGate();
  if(typeof openAuthPanel==='function') openAuthPanel();
  else if(typeof openDashboard==='function') openDashboard('account');
  else alert('Sign-in coming soon.');
}

function openPulsePanel(){
  document.getElementById('pulsePanel').classList.add('open');
  renderPulseCatRibbon();
  selectPulseView(pulseView || 'tribes');
}
function closePulsePanel(){
  const panel = document.getElementById('pulsePanel');
  if(panel) panel.classList.remove('open');
  closePulseAuthGate();
}

function pulseDeviceId(){
  try{
    let id = localStorage.getItem('pulse_device_id');
    if(!id){ id = 'd_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('pulse_device_id',id); }
    return id;
  }catch(_){ return 'd_anon'; }
}
function pulseSavedName(){ try{ return localStorage.getItem('pulse_display_name') || (window.todayNickname?todayNickname():'') || 'You'; }catch(_){ return 'You'; } }
function pulseSaveName(n){ try{ if(n) localStorage.setItem('pulse_display_name',n); }catch(_){ } }

function selectPulseView(view){
  pulseView = view;
  const panel = document.getElementById('pulsePanel');
  if(panel) panel.dataset.view = view;
  document.querySelectorAll('.pv2-vtab').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  // Hide ribbon on lounge/form
  const rib = document.getElementById('pv2CatRibbon');
  if(rib) rib.style.display = (view==='lounge'||view==='form') ? 'none' : '';
  renderPulseBody();
}
function selectPulseCategoryV2(cat){
  pulseCategory = cat;
  document.querySelectorAll('.pv2-cat').forEach(b=>b.classList.toggle('active', b.dataset.cat===cat));
  renderPulseBody();
}
function renderPulseCatRibbon(){
  const el = document.getElementById('pv2CatScroll');
  if(!el) return;
  el.innerHTML = PV2_CATS.map(c=>{
    const key = c==='All' ? 'all' : c;
    const active = (pulseCategory===key || (pulseCategory==='all' && c==='All')) ? ' active' : '';
    return `<button class="pv2-cat${active}" data-cat="${key}" onclick="selectPulseCategoryV2('${key.replace(/'/g,"\\'")}')">${c}</button>`;
  }).join('');
}
function matchesCat(item){
  if(!pulseCategory || pulseCategory==='all') return true;
  return Array.isArray(item.tags) && item.tags.includes(pulseCategory);
}
function avStackHTML(count){
  const n = Math.min(4, count||4);
  return `<div class="pv2-avstack">${Array.from({length:n}).map((_,i)=>`<div class="pv2-av" style="background-image:url('${PV2_AV[i%PV2_AV.length]}')"></div>`).join('')}</div>`;
}
function guardOr(fn){ return pulseIsSignedIn() ? fn() : openPulseAuthGate(); }
function joinTribe(id){ guardOr(()=>{ const t=PULSE_TRIBES.find(x=>x.id===id); if(t){ t.joined+=1; renderPulseBody(); } }); }
function interestedEvent(id){ guardOr(()=>{ alert("You're on the list. We'll ping you nearer the time."); }); }

function tribeCardHTML(t){
  const metaExtra = t.spots
    ? `<div class="pv2-metaline warn">${t.joined} travelers • ${t.spots} spots left</div>`
    : t.seatsOpen
      ? `<div class="pv2-metaline ok">${t.joined} travelers • ${t.seatsOpen} seats open</div>`
      : `<div class="pv2-metaline">${t.cap||t.joined} travelers</div>`;
  const allImages = [];
  if(t.thumb) allImages.push(t.thumb);
  if(t.images && Array.isArray(t.images)) allImages.push(...t.images);
  const uniqueImages = [...new Set(allImages)];
  const thumbClick = uniqueImages.length > 1
    ? `onclick="openCarousel(${JSON.stringify(uniqueImages).replace(/"/g, '&quot;')},0)"`
    : '';
  const thumbStyle = uniqueImages.length > 1 ? 'cursor:pointer' : '';
  return `
  <div class="pv2-tribe">
    <div class="pv2-tribe-thumb" style="background-image:url('${t.thumb}');${thumbStyle}" ${thumbClick}></div>
    <div class="pv2-tribe-body">
      <div class="pv2-tribe-title">${t.title}</div>
      <div class="pv2-tribe-meta">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${t.where}</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${t.when}</span>
      </div>
      <div class="pv2-tribe-sub">${t.sub}</div>
      <div class="pv2-tribe-foot">
        <div>
          <div style="display:flex;align-items:center">${avStackHTML(4)}<span class="pv2-av-count">+${t.extra||1}</span></div>
          ${metaExtra}
        </div>
        <button class="pv2-join" onclick="joinTribe('${t.id}')">Join Tribe</button>
      </div>
    </div>
  </div>`;
}
function eventCardHTML(e){
  const allImages = (e.images && Array.isArray(e.images) && e.images.length) ? e.images : [];
  const imageHtml = allImages.length > 1
    ? `<img class="pulse-card-image" src="${allImages[0]}" alt="" loading="lazy" style="cursor:pointer" onclick="openCarousel(${JSON.stringify(allImages).replace(/"/g, '&quot;')},0)" onerror="this.style.display='none'">`
    : '';
  return `
  <div class="pv2-event">
    ${imageHtml}
    <div class="pv2-event-t">${e.title}</div>
    <div class="pv2-event-org"><span class="pv2-event-org-dot">${e.org.slice(0,1)}</span>${e.org}</div>
    <div class="pv2-event-meta"><span>📍 ${e.where}</span><span>🕒 ${e.when}</span></div>
    <div class="pv2-event-foot">
      ${e.price ? `<span class="pv2-pricechip">${e.price}</span>` : '<span></span>'}
      <button class="pv2-join" onclick="interestedEvent('${e.id}')">I'm Interested</button>
    </div>
  </div>`;
}

function emptyStateHTML(){
  return `<div class="pv2-empty">
    <div style="font-size:1.6rem">🤫</div>
    <div>Quiet for now. Start the first tribe and see who joins!</div>
    <button class="pv2-cta" onclick="selectPulseView('form')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Form Your Tribe</button>
  </div>`;
}

function renderPulseBody(){
  const body = document.getElementById('pulseBody');
  if(!body) return;
  if(pulseView==='tribes'){
    const list = PULSE_TRIBES.filter(matchesCat);
    if(!list.length){ body.innerHTML = emptyStateHTML(); return; }
    body.innerHTML = `
      <div class="pv2-listhead">
        <div class="pv2-listhead-l">
          <div class="pv2-listhead-t">👥 Active Tribes</div>
          <div class="pv2-listhead-s">Groups of travelers planning something together.</div>
        </div>
        <button class="pv2-viewall">View all ›</button>
      </div>
      ${list.map(tribeCardHTML).join('')}
      <div class="pv2-footbanner">
        <div class="pv2-footbanner-i">👥</div>
        <div class="pv2-footbanner-body">
          <div class="pv2-footbanner-t">Can't find what you're looking for?</div>
          <div class="pv2-footbanner-s">Start a tribe and see who joins!</div>
        </div>
        <button class="pv2-cta" onclick="selectPulseView('form')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Form Your Tribe</button>
      </div>`;
  } else if(pulseView==='events'){
    const list = PULSE_EVENTS.filter(matchesCat);
    if(!list.length){ body.innerHTML = emptyStateHTML(); return; }
    body.innerHTML = `
      <div class="pv2-listhead"><div class="pv2-listhead-l"><div class="pv2-listhead-t">🎉 Events &amp; Happenings</div><div class="pv2-listhead-s">Verified organizers only.</div></div></div>
      ${list.map(eventCardHTML).join('')}`;
  } else if(pulseView==='lounge'){
    renderPulseLounge();
  } else if(pulseView==='form'){
    renderPulseWizard();
  }
}

// ── LOUNGE ──
let LOUNGE_MSGS = null;
function renderPulseLounge(){
  const body = document.getElementById('pulseBody');
  if(!LOUNGE_MSGS) LOUNGE_MSGS = PULSE_LOUNGE.map(m=>({...m,me:false}));
  const chat = LOUNGE_MSGS.map(m=>`
    <div class="pv2-lmsg${m.me?' me':''}">
      ${m.me?'':`<div class="pv2-lmsg-name">${m.name}</div>`}${m.text}
    </div>
    ${m.helper?`<div class="pv2-helper"><span>Want to turn this into a Tribe?</span><button onclick="selectPulseView('form')">Form Your Tribe</button></div>`:''}
  `).join('');
  body.innerHTML = `<div class="pv2-lounge" id="pv2LoungeScroll">${chat}</div>
    <div class="pv2-linput">
      <input id="pv2LoungeInput" type="text" placeholder="Say something to the lounge…" onkeydown="if(event.key==='Enter')sendLoungeMsg()"/>
      <button onclick="sendLoungeMsg()">Send</button>
    </div>`;
  const el = body; el.scrollTop = el.scrollHeight;
}
function sendLoungeMsg(){
  if(!pulseIsSignedIn()) return openPulseAuthGate();
  const input = document.getElementById('pv2LoungeInput');
  const text = (input?.value||'').trim();
  if(!text) return;
  const isCoord = /(anyone|who wants|looking for|split|share|join)/i.test(text) && /(tomorrow|tonight|today|hopping|surf|dinner|ride|boat|trip)/i.test(text);
  LOUNGE_MSGS.push({ id:'my_'+Date.now(), name:pulseSavedName(), text, me:true, helper:isCoord });
  renderPulseLounge();
}

// ── WIZARD ──
const WIZ_STEPS = 5;
let wizStep = 0;
let formDraft = { plan:'', when:'', whenCustom:'', wherePick:'', whereText:'', size:'', note:'' };
function selectPulseView_reset(){ wizStep=0; formDraft={plan:'',when:'',whenCustom:'',wherePick:'',whereText:'',size:'',note:''}; }
function renderPulseWizard(){
  const body = document.getElementById('pulseBody');
  const progress = Array.from({length:WIZ_STEPS}).map((_,i)=>`<span class="${i<=wizStep?'done':''}"></span>`).join('');
  let q='', opts='', valid=false;
  if(wizStep===0){
    q="What are you planning?";
    const plans = ['Island Hopping','Sunset','Drinks','Surf','Dinner','Shared Ride','Explore'];
    opts = `<div class="pv2-wiz-opts">${plans.map(p=>`<button class="pv2-wiz-chip${formDraft.plan===p?' on':''}" onclick="wizSet('plan','${p}')">${p}</button>`).join('')}</div>`;
    valid = !!formDraft.plan;
  } else if(wizStep===1){
    q="When?";
    opts = `<div class="pv2-wiz-opts">
      <button class="pv2-wiz-chip${formDraft.when==='Today'?' on':''}" onclick="wizSet('when','Today')">Today</button>
      <button class="pv2-wiz-chip${formDraft.when==='Tomorrow'?' on':''}" onclick="wizSet('when','Tomorrow')">Tomorrow</button>
      <button class="pv2-wiz-chip${formDraft.when==='custom'?' on':''}" onclick="wizSet('when','custom')">Pick date/time</button>
    </div>${formDraft.when==='custom'?`<input class="pv2-wiz-input" type="datetime-local" value="${formDraft.whenCustom}" onchange="formDraft.whenCustom=this.value;wizRender()"/>`:''}`;
    valid = formDraft.when && (formDraft.when!=='custom' || formDraft.whenCustom);
  } else if(wizStep===2){
    q="Where?";
    opts = `<div class="pv2-wiz-opts">
      <button class="pv2-wiz-chip${formDraft.wherePick==='choose'?' on':''}" onclick="wizSet('wherePick','choose')">Choose Place</button>
      <button class="pv2-wiz-chip${formDraft.wherePick==='current'?' on':''}" onclick="wizSet('wherePick','current')">Use Current Map Location</button>
      <button class="pv2-wiz-chip${formDraft.wherePick==='type'?' on':''}" onclick="wizSet('wherePick','type')">Type Location</button>
    </div>${formDraft.wherePick==='type'?`<input class="pv2-wiz-input" placeholder="Type a place…" value="${formDraft.whereText}" oninput="formDraft.whereText=this.value"/>`:''}`;
    valid = formDraft.wherePick && (formDraft.wherePick!=='type' || formDraft.whereText.trim());
  } else if(wizStep===3){
    q="How many people?";
    const sizes = ['2–4','5–10','10+'];
    opts = `<div class="pv2-wiz-opts">${sizes.map(s=>`<button class="pv2-wiz-chip${formDraft.size===s?' on':''}" onclick="wizSet('size','${s}')">${s}</button>`).join('')}</div>`;
    valid = !!formDraft.size;
  } else {
    q="Short note";
    opts = `<textarea class="pv2-wiz-textarea" placeholder="Looking for 2 more people to split a boat tomorrow morning." oninput="formDraft.note=this.value">${formDraft.note}</textarea>`;
    valid = formDraft.note.trim().length>0;
  }
  const last = wizStep===WIZ_STEPS-1;
  body.innerHTML = `
    <div class="pv2-wiz">
      <div class="pv2-wiz-progress">${progress}</div>
      <div class="pv2-wiz-q">${q}</div>
      ${opts}
      <div class="pv2-wiz-nav">
        <button class="pv2-wiz-back" onclick="wizBack()" ${wizStep===0?'style="visibility:hidden"':''}>‹ Back</button>
        <button class="pv2-wiz-next" ${valid?'':'disabled'} onclick="${last?'wizCreate()':'wizNext()'}">${last?'Create Tribe':'Next ›'}</button>
      </div>
    </div>`;
}
function wizRender(){ renderPulseWizard(); }
function wizSet(k,v){ formDraft[k]=v; renderPulseWizard(); }
function wizNext(){ if(wizStep<WIZ_STEPS-1) wizStep++; renderPulseWizard(); }
function wizBack(){ if(wizStep>0) wizStep--; renderPulseWizard(); }
function wizCreate(){
  if(!pulseIsSignedIn()) return openPulseAuthGate();
  const whereLabel = formDraft.wherePick==='current' ? 'Current map area' : (formDraft.wherePick==='type' ? formDraft.whereText : 'Chosen place');
  const whenLabel = formDraft.when==='custom' ? formDraft.whenCustom.replace('T',', ') : formDraft.when;
  PULSE_TRIBES.unshift({
    id:'t_'+Date.now(), title:formDraft.plan+' 🆕', where:whereLabel, when:whenLabel, sub:formDraft.note||'Just formed.',
    cap:formDraft.size, joined:1, extra:0, tags:[formDraft.plan],
    thumb:'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=200&h=260&fit=crop&q=70'
  });
  selectPulseView_reset();
  selectPulseView('tribes');
}



function pulseCardHtml(post){
  let avatarHtml;
  if(post.admin){
    avatarHtml = `<div class="pulse-avatar-icon">Local<br>Guide</div>`;
  } else if(post.avatar){
    avatarHtml = `<div class="pulse-avatar-wrap"><img class="pulse-avatar" src="${post.avatar}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;pulse-avatar-icon&quot; style=&quot;background:rgba(255,255,255,.08);color:var(--white-muted);&quot;>${escapeHtml(post.name.slice(0,2).toUpperCase())}</div>'"><span class="online-dot"></span></div>`;
  } else {
    avatarHtml = `<div class="pulse-avatar-wrap"><div class="pulse-avatar-icon" style="background:rgba(255,255,255,.08);color:var(--white-muted);">${escapeHtml(post.name.slice(0,2).toUpperCase())}</div><span class="online-dot"></span></div>`;
  }

  return `
    <div class="pulse-card">
      <div class="pulse-card-top">
        ${avatarHtml}
        <div class="pulse-card-meta">
          <div class="pulse-card-name-row">
            <span class="pulse-card-name">${escapeHtml(post.name)}</span>
            <span class="pulse-card-time">${escapeHtml(post.time)}</span>
            ${post.admin ? '<span class="pulse-admin-badge">Admin</span>' : ''}
          </div>
          <div class="pulse-card-text">${escapeHtml(post.text)}</div>
          ${post.tag ? `<span class="pulse-card-tag">${escapeHtml(post.tag)}</span>` : ''}
          ${post.location ? `<div class="pulse-card-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(post.location)}</div>` : ''}
          ${post.image ? `<img class="pulse-card-image" src="${post.image}" alt="" loading="lazy" style="cursor:zoom-in" onclick="openPulseLightbox('${encodeURI(post.image).replace(/'/g, "\\'")}')" onerror="this.style.display='none'">` : ''}
          ${post.avatars ? `<div class="pulse-card-avatars">${Array.from({length:Math.min(post.avatars,3)}).map((_,i)=>`<div class="pulse-avatar-more">+</div>`).join('')}${post.avatars>3?`<div class="pulse-avatar-more">+${post.avatars-3}</div>`:''}</div>` : ''}
          <div class="pulse-card-actions">
            <button class="pulse-action" onclick="togglePulseLike(this, ${post.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>${post.likes}</span>
            </button>
            <button class="pulse-action" onclick="togglePulseThread(${post.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span id="pulseCommentCount-${post.id}">${post.comments}</span>
            </button>
            <button class="pulse-more-btn" onclick="alert('Report / hide options coming soon.')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
            </button>
          </div>
          <div class="pulse-thread" id="pulseThread-${post.id}" style="display:none;"></div>
        </div>
      </div>
    </div>`;
}

async function togglePulseThread(postId){
  const wrap = document.getElementById('pulseThread-'+postId);
  if(!wrap) return;
  if(wrap.style.display !== 'none'){ wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  wrap.innerHTML = `<div class="pulse-thread-loading">Loading replies…</div>`;
  await renderPulseThread(postId);
}

async function renderPulseThread(postId){
  const wrap = document.getElementById('pulseThread-'+postId);
  if(!wrap) return;
  const { data: rows, error } = await sb.from('pulse_comments')
    .select('id, display_name, text_content, created_at, is_anonymous, user_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if(error){ wrap.innerHTML = `<div class="pulse-thread-loading">Could not load replies: ${escapeHtml(error.message)}</div>`; return; }
  const savedName = pulseSavedName();
  const list = (rows||[]).map(c => {
    const name = c.display_name || 'Anonymous traveler';
    return `<div class="pulse-comment"><div class="pulse-comment-head"><span class="pulse-comment-name">${escapeHtml(name)}</span><span class="pulse-comment-time">${escapeHtml(relTime(c.created_at))}</span></div><div class="pulse-comment-text">${escapeHtml(c.text_content||'')}</div></div>`;
  }).join('');
  wrap.innerHTML = `
    <div class="pulse-comment-list">${list || '<div class="pulse-thread-empty">No replies yet. Be the first.</div>'}</div>
    <div class="pulse-comment-composer">
      <input type="text" id="pulseCommentName-${postId}" maxlength="40" placeholder="Your name (optional)" value="${escapeHtml(savedName)}" class="pulse-comment-input pulse-comment-name-input">
      <div class="pulse-comment-row">
        <input type="text" id="pulseCommentText-${postId}" maxlength="300" placeholder="Write a reply…" class="pulse-comment-input" onkeydown="if(event.key==='Enter'){submitPulseComment(${postId})}">
        <button class="pulse-comment-send" onclick="submitPulseComment(${postId})">Send</button>
      </div>
    </div>`;
}

let pulseLastCommentAt = 0;
async function submitPulseComment(postId){
  const txtEl = document.getElementById('pulseCommentText-'+postId);
  const nameEl = document.getElementById('pulseCommentName-'+postId);
  if(!txtEl) return;
  const text = (txtEl.value||'').trim();
  if(!text) return;
  const now = Date.now();
  if(now - pulseLastCommentAt < 15000){ alert('Please wait a few seconds before replying again.'); return; }
  const name = ((nameEl && nameEl.value) || '').trim().slice(0,40) || null;
  if(name) pulseSaveName(name);
  txtEl.disabled = true;
  const { error } = await sb.from('pulse_comments').insert({
    post_id: postId,
    user_id: currentUser ? currentUser.id : null,
    display_name: name,
    is_anonymous: !name,
    text_content: text.slice(0,300),
  });
  txtEl.disabled = false;
  if(error){ alert('Could not reply: '+error.message); return; }
  pulseLastCommentAt = now;
  txtEl.value = '';
  // bump count
  const cntEl = document.getElementById('pulseCommentCount-'+postId);
  if(cntEl) cntEl.textContent = (parseInt(cntEl.textContent,10)||0) + 1;
  await renderPulseThread(postId);
}

function openPulseLightbox(url){
  const box = document.getElementById('pulseLightbox');
  const img = document.getElementById('pulseLightboxImg');
  if(!box || !img) return;
  img.src = url;
  box.classList.add('open');
}
function closePulseLightbox(){
  const box = document.getElementById('pulseLightbox');
  if(box){ box.classList.remove('open'); const img = document.getElementById('pulseLightboxImg'); if(img) img.src=''; }
}
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closePulseLightbox(); });

// Set of post IDs the current user has liked — refreshed on each feed load
let pulseLikedSet = new Set();
// Cache of latest feed rows by id so togglePulseLike can update counts
let pulseFeedById = new Map();

function relTime(iso){
  if(!iso) return '';
  const d = new Date(iso);
  const s = Math.max(1, Math.floor((Date.now() - d.getTime())/1000));
  if(s < 60) return s+'s ago';
  const m = Math.floor(s/60); if(m < 60) return m+'m ago';
  const h = Math.floor(m/60); if(h < 24) return h+'h ago';
  const days = Math.floor(h/24); if(days < 7) return days+'d ago';
  return d.toLocaleDateString();
}

async function togglePulseLike(btn, postId){
  const device = pulseDeviceId();
  const liked = pulseLikedSet.has(postId);
  const span = btn.querySelector('span');
  const cur = parseInt(span.textContent, 10) || 0;
  if(liked){
    pulseLikedSet.delete(postId);
    btn.classList.remove('liked');
    span.textContent = Math.max(0, cur - 1);
    const { error } = await sb.from('pulse_likes').delete().eq('post_id', postId).eq('device_id', device);
    if(error){ pulseLikedSet.add(postId); btn.classList.add('liked'); span.textContent = cur; alert('Could not unlike: '+error.message); }
  } else {
    pulseLikedSet.add(postId);
    btn.classList.add('liked');
    span.textContent = cur + 1;
    const { error } = await sb.from('pulse_likes').insert({ post_id: postId, device_id: device });
    if(error && error.code !== '23505'){
      pulseLikedSet.delete(postId); btn.classList.remove('liked'); span.textContent = cur;
      alert('Could not like: '+error.message);
    }
  }
}

async function renderPulseFeed(){
  const body = document.getElementById('pulseBody');
  if(!body) return;

  if(pulseTab !== 'feed'){
    body.innerHTML = `<div class="pulse-empty">This view is coming soon.</div>`;
    return;
  }

  body.innerHTML = `<div class="pulse-empty">Loading…</div>`;

  let query = sb.from('pulse_posts')
    .select('id, user_id, category, text_content, image_url, location_text, tag, display_name, is_anonymous, admin_post, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if(pulseCategory !== 'all') query = query.eq('category', pulseCategory);

  const { data: rows, error } = await query;
  if(error){
    body.innerHTML = `<div class="pulse-empty">Could not load Pulse: ${escapeHtml(error.message)}</div>`;
    return;
  }

  // Fetch traveler profiles for the post authors (no FK between tables, so do it separately)
  const profileById = new Map();
  const authorIds = Array.from(new Set((rows||[]).filter(r=>!r.is_anonymous && r.user_id).map(r=>r.user_id)));
  if(authorIds.length){
    const { data: profs } = await sb.rpc('get_public_profiles', { _ids: authorIds });
    if(profs) profs.forEach(p => profileById.set(p.id, p));
  }

  // Load this device's likes so the heart state is correct
  pulseLikedSet = new Set();
  // Fetch likes and comment counts separately (avoids RLS-hanging count aggregates)
  const postIds = (rows||[]).map(r=>r.id);
  const likeCountByPost = {};
  if(postIds.length){
    const { data: likes } = await sb.from('pulse_likes').select('post_id').eq('device_id', pulseDeviceId()).in('post_id', postIds);
    if(likes) likes.forEach(l => pulseLikedSet.add(l.post_id));
    // All likes for count
    const { data: allLikes } = await sb.from('pulse_likes').select('post_id').in('post_id', postIds);
    (allLikes||[]).forEach(l=>{ likeCountByPost[l.post_id] = (likeCountByPost[l.post_id]||0) + 1; });
  }
  const commentCountByPost = {};
  if(postIds.length){
    const { data: allComments } = await sb.from('pulse_comments').select('post_id').in('post_id', postIds);
    (allComments||[]).forEach(c=>{ commentCountByPost[c.post_id] = (commentCountByPost[c.post_id]||0) + 1; });
  }

  pulseFeedById = new Map();
  const posts = (rows || []).map(r => {
    const prof = r.user_id ? profileById.get(r.user_id) : null;
    const name = r.display_name || (prof && prof.display_name) || 'Anonymous traveler';
    const avatar = (prof && prof.avatar_url) || null;
    const mapped = {
      id: r.id,
      cat: r.category,
      name,
      avatar,
      admin: !!r.admin_post,
      time: relTime(r.created_at),
      text: r.text_content || '',
      image: r.image_url || null,
      location: r.location_text || null,
      tag: r.tag || null,
      likes: likeCountByPost[r.id] || 0,
      comments: commentCountByPost[r.id] || 0,
    };
    pulseFeedById.set(r.id, mapped);
    return mapped;
  });

  if(!posts.length){
    body.innerHTML = `<div class="pulse-empty">No posts yet in this category. Be the first to share something!</div>`;
    return;
  }
  body.innerHTML = posts.map(pulseCardHtml).join('');
  // Mark hearts that the current user has already liked
  body.querySelectorAll('.pulse-action').forEach(btn => {
    const m = btn.getAttribute('onclick') && btn.getAttribute('onclick').match(/togglePulseLike\(this,\s*(\d+)\)/);
    if(m && pulseLikedSet.has(parseInt(m[1],10))) btn.classList.add('liked');
  });
}

let pulseComposeImageDataUrl = null;
let pulseNextPostId = 1000; // mock IDs for session-local posts, won't collide with seeded 1-12

let pulseComposeLocation = null;

function openPulseCompose(){
  document.getElementById('pulseComposeText').value = '';
  const initCat = pulseCategory !== 'all' ? pulseCategory : 'all';
  setPulseCat(initCat);
  const nameEl = document.getElementById('pulseComposeName');
  if(nameEl) nameEl.value = pulseSavedName();
  removePulseComposeImage();
  clearPulseLocation();
  updatePulseComposeState();
  document.getElementById('pulseComposeOverlay').classList.add('active');
  document.getElementById('pulseComposeSheet').classList.add('open');
}

function closePulseCompose(){
  document.getElementById('pulseComposeOverlay').classList.remove('active');
  document.getElementById('pulseComposeSheet').classList.remove('open');
  document.getElementById('pulseComposeCatMenu').style.display = 'none';
  closePulseLocPicker();
}

// ── Custom channel dropdown ──
function togglePulseCatMenu(e){
  if(e) e.stopPropagation();
  const menu = document.getElementById('pulseComposeCatMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function selectPulseCat(btn){
  setPulseCat(btn.dataset.val, btn.dataset.label);
  document.getElementById('pulseComposeCatMenu').style.display = 'none';
}
function setPulseCat(val, label){
  document.getElementById('pulseComposeCategory').value = val;
  if(!label){
    const btn = document.querySelector(`#pulseComposeCatMenu button[data-val="${val}"]`);
    label = btn ? btn.dataset.label : 'General';
  }
  document.getElementById('pulseComposeCatLabel').textContent = label;
  document.querySelectorAll('#pulseComposeCatMenu button').forEach(b=>{
    b.classList.toggle('active', b.dataset.val === val);
  });
}
document.addEventListener('click', (e)=>{
  const menu = document.getElementById('pulseComposeCatMenu');
  const btn = document.getElementById('pulseComposeCatBtn');
  if(menu && menu.style.display === 'block' && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
    menu.style.display = 'none';
  }
});

// ── Location picker ──
function openPulseLocPicker(){
  const list = document.getElementById('pulseLocList');
  const items = (Array.isArray(destinations) && destinations.length ? destinations : []).slice().sort((a,b)=> a.name.localeCompare(b.name));
  list.innerHTML = items.map(d=>`
    <button type="button" onclick="pickPulseLocation('${escapeHtml(d.name).replace(/'/g,"\\'")}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;color:var(--ocean-teal-light)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ${escapeHtml(d.name)}
    </button>
  `).join('');
  document.getElementById('pulseLocOverlay').classList.add('active');
  document.getElementById('pulseLocSheet').classList.add('open');
}
function closePulseLocPicker(){
  const o = document.getElementById('pulseLocOverlay');
  const s = document.getElementById('pulseLocSheet');
  if(o) o.classList.remove('active');
  if(s) s.classList.remove('open');
}
function pickPulseLocation(name){
  pulseComposeLocation = name;
  const chip = document.getElementById('pulseComposeLocChip');
  document.getElementById('pulseComposeLocChipText').textContent = name;
  chip.style.display = 'inline-flex';
  closePulseLocPicker();
}
function clearPulseLocation(){
  pulseComposeLocation = null;
  const chip = document.getElementById('pulseComposeLocChip');
  if(chip) chip.style.display = 'none';
}
function useCurrentLocation(){
  if(!navigator.geolocation){
    alert('Geolocation is not available on this device.');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos)=>{
    const { latitude:lat, longitude:lng } = pos.coords;
    const items = Array.isArray(destinations) ? destinations : [];
    let best = null, bestKm = Infinity;
    const toRad = (d)=> d * Math.PI / 180;
    for(const d of items){
      if(typeof d.lat !== 'number' || typeof d.lng !== 'number') continue;
      const dLat = toRad(d.lat - lat), dLng = toRad(d.lng - lng);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat))*Math.cos(toRad(d.lat))*Math.sin(dLng/2)**2;
      const km = 2 * 6371 * Math.asin(Math.sqrt(a));
      if(km < bestKm){ bestKm = km; best = d; }
    }
    if(best && bestKm <= 5) pickPulseLocation(best.name);
    else if(best && bestKm <= 30) pickPulseLocation(`Near ${best.name}`);
    else pickPulseLocation('Near San Vicente');
  }, (err)=>{
    alert('Could not get your location: ' + (err.message || 'permission denied'));
  }, { enableHighAccuracy:true, timeout:8000, maximumAge:60000 });
}

function handlePulseComposeImage(event){
  const file = event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){
    alert('Please choose an image file.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e)=>{
    pulseComposeImageDataUrl = e.target.result;
    document.getElementById('pulseComposeImagePreview').src = pulseComposeImageDataUrl;
    document.getElementById('pulseComposeImagePreviewWrap').style.display = '';
    updatePulseComposeState();
  };
  reader.readAsDataURL(file);
}

function removePulseComposeImage(){
  pulseComposeImageDataUrl = null;
  document.getElementById('pulseComposeImagePreview').src = '';
  document.getElementById('pulseComposeImagePreviewWrap').style.display = 'none';
  document.getElementById('pulseComposeFileInput').value = '';
  updatePulseComposeState();
}

function updatePulseComposeState(){
  const text = document.getElementById('pulseComposeText').value.trim();
  const postBtn = document.getElementById('pulseComposePostBtn');
  postBtn.disabled = !text && !pulseComposeImageDataUrl;
}

let pulseLastPostAt = 0;
async function submitPulsePost(){
  const text = document.getElementById('pulseComposeText').value.trim();
  if(!text && !pulseComposeImageDataUrl) return;

  // Light client-side rate limit: 1 post per 30s per device.
  const now = Date.now();
  if(now - pulseLastPostAt < 30000){
    alert('Please wait a few seconds before posting again.');
    return;
  }

  const cat = document.getElementById('pulseComposeCategory').value;
  const nameEl = document.getElementById('pulseComposeName');
  const displayName = ((nameEl && nameEl.value) || '').trim().slice(0, 40) || null;
  if(displayName) pulseSaveName(displayName);
  const postBtn = document.getElementById('pulseComposePostBtn');
  postBtn.disabled = true;

  const { error } = await sb.from('pulse_posts').insert({
    user_id: currentUser ? currentUser.id : null,
    display_name: displayName,
    category: cat || 'all',
    text_content: text ? text.slice(0, 500) : null,
    image_url: pulseComposeImageDataUrl || null,
    location_text: pulseComposeLocation || null,
    is_anonymous: !currentUser,
  });

  postBtn.disabled = false;

  if(error){
    alert('Could not post: ' + error.message);
    return;
  }
  pulseLastPostAt = now;

  closePulseCompose();
  pulseCategory = 'all';
  pulseTab = 'feed';
  document.querySelectorAll('.pulse-cat').forEach(b=>b.classList.toggle('active', b.dataset.cat==='all'));
  document.querySelectorAll('.pulse-tab').forEach(b=>{ if(!b.classList.contains('disabled')) b.classList.toggle('active', b.dataset.tab==='feed'); });
  document.getElementById('pulseTitle').innerHTML = `${PULSE_CATEGORIES.all.label} <span class="live-dot"></span>`;
  document.getElementById('pulseSubtitle').textContent = PULSE_CATEGORIES.all.subtitle;

  await renderPulseFeed();
  document.getElementById('pulseBody').scrollTo({top:0, behavior:'smooth'});
}

// ═══════════════════════════════════════════════════════
// HERO WEATHER WIDGET — small, non-critical visual touch under
// the hero subtitle. Uses Open-Meteo (no API key, no signup,
// free for non-commercial use up to 10k calls/day). Client-side
// only, cached in localStorage for 10 minutes so a page refresh
// doesn't re-fetch immediately. If the request fails for any
// reason, the widget simply stays hidden — this is decoration,
// never allowed to show an error or interrupt the page.
// ═══════════════════════════════════════════════════════
const SANVIC_LAT = 10.50, SANVIC_LNG = 119.22;
const WEATHER_CACHE_KEY = 'sanvic_weather_cache_v1';
const WEATHER_CACHE_MS = 10 * 60 * 1000; // 10 minutes

// Open-Meteo WMO weather codes -> a small label + simple inline SVG icon.
// Codes grouped into the handful of states that matter for a quick glance.
// severity: 'calm' (default/fine), 'caution' (rain/drizzle/fog — be aware),
// 'severe' (storms/heavy showers — clear safety signal for boats/beach plans)
function weatherCodeToDisplay(code){
  if(code === 0) return { label: 'Clear', icon: 'sun', severity: 'calm' };
  if([1,2,3].includes(code)) return { label: 'Partly cloudy', icon: 'cloud-sun', severity: 'calm' };
  if([45,48].includes(code)) return { label: 'Foggy', icon: 'cloud', severity: 'caution' };
  if([51,53,55,56,57].includes(code)) return { label: 'Drizzle', icon: 'cloud-drizzle', severity: 'caution' };
  if([61,63,66,80].includes(code)) return { label: 'Rain', icon: 'cloud-rain', severity: 'caution' };
  if([65,67,81,82].includes(code)) return { label: 'Heavy rain', icon: 'cloud-rain', severity: 'severe' };
  if([95,96,99].includes(code)) return { label: 'Thunderstorms', icon: 'cloud-lightning', severity: 'severe' };
  if([71,73,75,77,85,86].includes(code)) return { label: 'Showers', icon: 'cloud-rain', severity: 'caution' };
  return { label: 'Cloudy', icon: 'cloud', severity: 'calm' };
}

// Strong wind escalates severity even on an otherwise calm-coded day —
// relevant for boats/island-hopping, which this app cares about a lot.
function escalateForWind(severity, windKmh){
  if(windKmh == null) return severity;
  if(windKmh >= 50) return 'severe';
  if(windKmh >= 30 && severity === 'calm') return 'caution';
  return severity;
}

const WEATHER_ICONS = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  'cloud-sun': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2"/><path d="M9.5 14.5A4.5 4.5 0 1 1 13.74 8h.76a4 4 0 0 1 0 8h-7a3.5 3.5 0 0 1-.99-1.5z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 19h11.5z"/></svg>',
  'cloud-drizzle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 15a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 15h11.5z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
  'cloud-rain': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 4.5 13h11.5z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
  'cloud-lightning': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 13a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 13h11.5z"/><polyline points="13 14 11 18 14 18 12 22"/></svg>',
  sunset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="19.78" y1="10.22" x2="18.36" y2="11.64"/><line x1="1" y1="18" x2="23" y2="18"/><polyline points="8 6 12 2 16 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

async function initHeroWeather(){
  try {
    const cached = getWeatherCache();
    if(cached){
      renderHeroWeather(cached);
      return;
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${SANVIC_LAT}&longitude=${SANVIC_LNG}&current=temperature_2m,weather_code,wind_speed_10m&daily=sunset&timezone=Asia%2FManila`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Weather request failed');
    const data = await res.json();

    const temp = data.current && data.current.temperature_2m;
    const code = data.current && data.current.weather_code;
    const wind = data.current && data.current.wind_speed_10m;
    const sunsetIso = data.daily && data.daily.sunset && data.daily.sunset[0];
    if(temp == null || code == null) throw new Error('Unexpected weather response shape');

    const payload = { temp, code, wind, sunsetIso, fetchedAt: Date.now() };
    setWeatherCache(payload);
    renderHeroWeather(payload);
  } catch(err){
    // Decoration only — fail silently, widget just stays hidden.
    console.warn('[SANVIC] Hero weather unavailable:', err);
  }
}

function getWeatherCache(){
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(!parsed.fetchedAt || Date.now() - parsed.fetchedAt > WEATHER_CACHE_MS) return null;
    return parsed;
  } catch(err){
    return null;
  }
}

function setWeatherCache(payload){
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload)); } catch(err){ /* ignore quota/private-mode errors */ }
}

function renderHeroWeather(payload){
  const widget = document.getElementById('heroWeather');
  if(!widget) return;

  const { label, icon, severity: baseSeverity } = weatherCodeToDisplay(payload.code);
  const severity = escalateForWind(baseSeverity, payload.wind);
  const tempC = Math.round(payload.temp);

  widget.classList.remove('wx-calm','wx-caution','wx-severe');
  widget.classList.add(`wx-${severity}`);

  let html = '';
  if(severity !== 'calm'){
    const alertText = severity === 'severe' ? 'Rough conditions' : 'Be aware';
    html += `<span class="hw-item hw-alert-label">${WEATHER_ICONS.warning}${alertText}</span><span class="hw-dot"></span>`;
  }

  html += `<span class="hw-item">${WEATHER_ICONS[icon]}${tempC}°C</span>`;
  html += `<span class="hw-dot"></span><span class="hw-item">${escapeHtml(label)}</span>`;

  if(payload.sunsetIso){
    const sunsetDate = new Date(payload.sunsetIso);
    const timeStr = sunsetDate.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
    html += `<span class="hw-dot"></span><span class="hw-item">${WEATHER_ICONS.sunset}Sunset ${timeStr}</span>`;
  }

  widget.innerHTML = html;
  widget.style.display = 'inline-flex';
}

function getYoutubeId(url){
  if(!url) return '';
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : '';
}

// Extracts {lat, lng, name} from a (non-shortened) Google Maps URL.
// Handles the common patterns Google Maps produces:
//   .../@10.538951,119.27753,15z              (viewport center)
//   ...!3d10.538951!4d119.27753...            (exact pin, preferred)
//   .../place/Boayan+Island/data=...!8m2!3d10.5!4d119.2 (place page, has a name)
//   ?q=10.538951,119.27753  or  ?ll=10.5,119.2
// Returns null if it's a shortened maps.app.goo.gl link (those need
// to be opened once so the browser can follow the redirect) or if
// no coordinate pattern is found. `name` is null when the URL has
// no /place/ segment (e.g. a bare @lat,lng viewport link).
function parseGoogleMapsUrl(url){
  if(!url) return null;
  url = url.trim();
  if(/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) return null; // shortened — can't resolve client-side

  let lat=null, lng=null;

  // Prefer the exact-pin pair (!3d...!4d...) over the viewport-center pair (@lat,lng)
  let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if(m){ lat=parseFloat(m[1]); lng=parseFloat(m[2]); }

  if(lat===null){
    m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if(m){ lat=parseFloat(m[1]); lng=parseFloat(m[2]); }
  }

  if(lat===null){
    m = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if(m){ lat=parseFloat(m[1]); lng=parseFloat(m[2]); }
  }

  if(lat===null) return null;

  let name = null;
  const nameMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if(nameMatch){
    name = decodeURIComponent(nameMatch[1].replace(/\+/g,' '));
  }

  return { lat, lng, name };
}

// ───────────── IMAGE CAROUSEL ─────────────
let __carouselImages = [];
let __carouselIndex = 0;

function openCarousel(images, startIndex){
  if(!images || images.length === 0) return;
  __carouselImages = images;
  __carouselIndex = startIndex || 0;
  renderCarousel();
  document.getElementById('carouselOverlay').classList.add('active');
}

function closeCarousel(e){
  if(e && e.target !== document.getElementById('carouselOverlay') && e.target.className !== 'carousel-close') return;
  document.getElementById('carouselOverlay').classList.remove('active');
}

function carouselPrev(e){
  if(e) e.stopPropagation();
  __carouselIndex = (__carouselIndex - 1 + __carouselImages.length) % __carouselImages.length;
  renderCarousel();
}

function carouselNext(e){
  if(e) e.stopPropagation();
  __carouselIndex = (__carouselIndex + 1) % __carouselImages.length;
  renderCarousel();
}

function renderCarousel(){
  const img = document.getElementById('carouselImg');
  img.src = __carouselImages[__carouselIndex];
  document.getElementById('carouselCounter').textContent = (__carouselIndex + 1) + ' / ' + __carouselImages.length;
  const dots = document.getElementById('carouselDots');
  dots.innerHTML = __carouselImages.map((_, i) =>
    `<button class="carousel-dot${i===__carouselIndex?' active':''}" onclick="event.stopPropagation();__carouselIndex=${i};renderCarousel()"></button>`
  ).join('');
  // Hide nav if single image
  document.querySelectorAll('.carousel-nav').forEach(el => el.style.display = __carouselImages.length > 1 ? '' : 'none');
  dots.style.display = __carouselImages.length > 1 ? '' : 'none';
}

function buildCarouselImages(d){
  const images = [];
  if(d.image) images.push(d.image);
  if(d.images && Array.isArray(d.images)) images.push(...d.images);
  return [...new Set(images)];
}

function openDest(d,recordHistory=true){
  if(!d)return;
  if(!document.body.classList.contains('explore-open')){
    closeAllPanels(); openExploreSheet(); setActiveDock('discover');
  }
  if(!exploreReturnView){
    exploreReturnView={center:map?.getCenter(),zoom:map?.getZoom(),snap:exploreState.snap,scroll:document.getElementById('exploreContent').scrollTop};
  }
  currentDest=d;
  highlightExplorePlace(d.id);
  if(recordHistory){
    const state={sanvic:true,tab:'discover',place:String(d.id)};
    if(history.state?.place)history.replaceState(state,'');else history.pushState(state,'');
  }
  const category=catStyle[d.category]||{label:d.category||'Place',color:'#0d9488',bg:'rgba(13,148,136,.15)'};
  const stats=d.stats||{};
  const photo=document.getElementById('dePhoto');
  const media=document.getElementById('deMedia');
  const images=buildCarouselImages(d).map(u=>SanvicExplore.safeUrl(u,true)).filter(Boolean);
  photo.classList.remove('has-carousel');photo.onclick=null;
  photo.removeAttribute('tabindex');photo.removeAttribute('role');photo.removeAttribute('aria-label');photo.onkeydown=null;
  media.replaceChildren();
  const placeholder=document.createElement('div');placeholder.className='detail-image-placeholder';
  placeholder.innerHTML=lucideSvg(category.icon||'map-pin',36)+'<span>San Vicente</span>';media.appendChild(placeholder);
  const video=SanvicExplore.safeUrl(d.videoUrl);
  if(video && d.videoType==='youtube' && getYoutubeId(video)){
    const frame=document.createElement('iframe');frame.src='https://www.youtube.com/embed/'+encodeURIComponent(getYoutubeId(video))+'?playsinline=1&rel=0';
    frame.title=d.name+' video';frame.allow='encrypted-media; picture-in-picture';frame.allowFullscreen=true;media.appendChild(frame);
  }else if(video && d.videoType==='upload'){
    const el=document.createElement('video');el.src=video;el.controls=true;el.playsInline=true;el.preload='metadata';if(images[0])el.poster=images[0];media.appendChild(el);
  }else if(images[0]){
    const img=document.createElement('img');img.src=images[0];img.alt=d.name;
    img.onerror=()=>{img.hidden=true;photo.classList.remove('has-carousel');};media.appendChild(img);
    if(images.length>1){
      photo.classList.add('has-carousel');photo.setAttribute('role','button');photo.tabIndex=0;photo.setAttribute('aria-label','View '+images.length+' photos of '+d.name);
      photo.onclick=()=>openCarousel(images,0);
      photo.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCarousel(images,0);}};
    }
  }
  document.getElementById('deTitle').textContent=d.name;
  document.getElementById('dcName').textContent=d.name;
  document.getElementById('deBarangay').textContent=d.barangay?'Barangay '+d.barangay:'San Vicente, Palawan';
  const cat=document.getElementById('deCat');cat.textContent=category.label;cat.style.background=category.bg;cat.style.color=category.color;
  document.getElementById('deStats').innerHTML=[
    stats.travel?['Access',stats.travel]:null,
    stats.season?['Season',stats.season]:null,
    stats.rating?['Listed rating',stats.rating+' · source not supplied']:null
  ].filter(Boolean).map(([label,value])=>`<div class="dest-exp-stat"><strong>${escT(label)}</strong><span>${escT(value)}</span></div>`).join('');
  const desc=document.getElementById('deDesc');desc.textContent=d.description||'More details will be added by the local team.';
  desc.classList.remove('collapsed');document.getElementById('deReadMore').style.display='none';
  const tip=document.getElementById('deTip');tip.textContent=d.tip||'';tip.hidden=!d.tip;
  const directions=document.getElementById('deDirections');
  directions.disabled=!SanvicExplore.hasCoordinates(d);
  directions.onclick=()=>window.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(d.lat+','+d.lng),'_blank','noopener,noreferrer');
  const gbp=document.getElementById('deGbp'), url=SanvicExplore.safeUrl(d.googleBusinessUrl);
  gbp.style.display=url?'':'none';gbp.onclick=()=>{if(url)window.open(url,'_blank','noopener,noreferrer');};
  const save=document.getElementById('deSaveBtn');save.setAttribute('aria-label','Save '+d.name);
  save.disabled=destinationsSource!=='supabase';
  save.title=save.disabled?'Sample places cannot be saved':'Save this place';
  refreshDestSaveButton(d.id);
  document.getElementById('deAskTala').onclick=()=>{
    closeDestSheet(false);openTalaSheet();
    const input=document.getElementById('talaInput');input.value='Tell me about '+d.name+(d.barangay?' in '+d.barangay:'')+'. What should I know before visiting?';input.focus();
  };
  closeTalaSheet(false);
  const sheet=document.getElementById('destSheet');sheet.className='dest-sheet expanded';sheet.removeAttribute('inert');
  sheet.setAttribute('role','region');sheet.setAttribute('aria-labelledby','deTitle');sheet.style.transform='';
  document.getElementById('destOverlay').classList.remove('active');
  document.body.classList.add('place-open');
  document.getElementById('exploreSheet').setAttribute('inert','');
  document.getElementById('heroOverlay').classList.add('hidden');document.getElementById('heroFade').classList.add('hidden');
  document.querySelector('.dest-expanded').scrollTop=0;
  syncMapViewport();
  if(map && SanvicExplore.hasCoordinates(d)){
    map.setView([d.lat,d.lng],Math.max(13,map.getZoom()),{animate:false});
    if(!exploreIsSide())map.panBy([0,Math.min(window.innerHeight*.25,190)],{animate:false});
  }
  document.getElementById('detailBack').focus({preventScroll:true});
}
function toggleDestSheet(){
  // Details are a single readable view. Explore owns the mobile snap states.
  if(currentDest)document.querySelector('.dest-expanded').scrollTo({top:0,behavior:reducedMotion()?'auto':'smooth'});
}
function closeDestSheet(restore=true){
  const sheet=document.getElementById('destSheet');
  const wasOpen=!!currentDest;
  sheet.style.transform='';sheet.className='dest-sheet';sheet.setAttribute('inert','');
  document.getElementById('deMedia').replaceChildren(); // stop video/audio
  document.getElementById('destOverlay').classList.remove('active');
  document.body.classList.remove('place-open');
  if(document.getElementById('exploreSheet').classList.contains('open'))document.getElementById('exploreSheet').removeAttribute('inert');
  closeAroundMePanel();currentDest=null;
  if(!talaOpen)document.getElementById('talaOrbWrap').classList.remove('hidden');
  if(restore && wasOpen && exploreReturnView){
    const previous=exploreReturnView;
    setExploreSnap(previous.snap);
    document.getElementById('exploreContent').scrollTop=previous.scroll;
    syncMapViewport();
    if(map && previous.center)map.setView(previous.center,previous.zoom,{animate:false});
    const selected=Array.from(document.querySelectorAll('.explore-result')).find(el=>el.dataset.placeId===String(exploreState.selected));
    (selected||document.getElementById('esSearchInput')).focus({preventScroll:true});
  }
  exploreReturnView=null;
  if(!handlingExploreHistory && history.state?.place)history.replaceState({sanvic:true,tab:'discover'},'');
  schedulePanelOpen();
}

// ─── DISCOVER + NAVIGATION ───
function focusSanVicente(){
  closeAllPanels();
  closeDiscoverPanel();
  if(map){
    pinVisibilityOverride = false;
    activeMarkerSet = allMarkers;
    map.flyTo([10.50,119.22],11,{duration:1});
    applyPinVisibility();
  }
  document.querySelectorAll('.dock-item').forEach(d=>d.classList.remove('active'));
  const mapBtn=document.querySelector('.dock-item[data-tab="map"]');
  if(mapBtn) mapBtn.classList.add('active');
}

function renderDiscoverList(cat='all'){
  const list=document.getElementById('discoverList');
  if(!list) return;
  let items;
  if(cat==='all'){
    items = destinations.filter(d=>d.featured);
    if(!items.length) items = destinations; // fallback so Discover is never empty before anything is marked featured
  } else {
    items = destinations.filter(d=>d.category===cat);
  }
  if(!items.length){
    list.innerHTML = `<div style="padding:20px;color:var(--white-dim);font-size:.78rem;">No spots yet.</div>`;
    return;
  }
  list.innerHTML=items.map(d=>`
    <button class="discover-card" onclick="openDestinationById(${d.id})">
      <img src="${d.image}" alt="${d.name}" onerror="this.style.opacity=0">
      <div class="discover-card-body">
        <div class="discover-card-name">${d.name}</div>
        <div class="discover-card-meta"><span>${catStyle[d.category]?.label||d.category}</span><span>•</span><span>${d.stats.travel||''}</span></div>
      </div>
    </button>`).join('');
}

function openDiscoverPanel(){
  closeDestSheet(false);
  closeTalaSheet(false);
  document.getElementById('discoverPanel').classList.add('open');
  document.getElementById('heroOverlay').classList.add('hidden');
  document.getElementById('heroFade').classList.add('hidden');
  renderDiscoverList(document.querySelector('.discover-cat.active')?.dataset.cat || 'all');
}

function closeDiscoverPanel(){
  const panel=document.getElementById('discoverPanel');
  if(panel) panel.classList.remove('open');
}

function selectDiscoverCategory(cat){
  document.querySelectorAll('.discover-cat').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
  filterCategory(cat);
  renderDiscoverList(cat);
}

function openDestinationById(id){
  const d=destinations.find(item=>item.id===id);
  if(d) openDest(d);
}

function toggleReadMore() {
  const el = document.getElementById('deDesc');
  const btn = document.getElementById('deReadMore');
  if(el.classList.contains('collapsed')){
    el.classList.remove('collapsed');
    btn.textContent = 'Show less';
  } else {
    el.classList.add('collapsed');
    btn.textContent = 'Read more';
  }
}

// ─── TALA ───
let talaOpen = false;
let voiceOn = true;
let isListening = false;
let recognition = null;
let synth = window.speechSynthesis;
let voices = [];

// ─── UNIFIED VOICE STATE (defined first, used by everything) ───
function setListeningUI(on) {
  const orb = document.getElementById('talaOrb');
  const micBtn = document.getElementById('talaMicBtn');
  const status = document.getElementById('tshStatus');
  if (on) { orb.classList.add('listening'); micBtn.classList.add('listening'); status.textContent = 'Listening...'; }
  else { orb.classList.remove('listening'); micBtn.classList.remove('listening'); if (talaOpen) status.textContent = 'Your Palawan concierge'; }
}
function stopVoice() { if (recognition && isListening) recognition.stop(); isListening = false; setListeningUI(false); }
function startVoice() {
  if (!recognition) return;
  if (!talaOpen) openTalaSheet();
  isListening = true; setListeningUI(true);
  recognition.start();
}

if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous=false; recognition.interimResults=true; recognition.lang='en-US';
  recognition.onresult = e=>{
    let t=''; for(let i=e.resultIndex;i<e.results.length;i++) t+=e.results[i][0].transcript;
    document.getElementById('talaInput').value=t;
    if(e.results[e.results.length-1].isFinal) processTala(t);
  };
  recognition.onend = ()=>{ isListening=false; setListeningUI(false); };
  recognition.onerror = e=>{ isListening=false; setListeningUI(false);
    if(e.error==='not-allowed') addMsg('bot','Microphone access needed. Please allow permissions or type instead.');
  };
}

function loadVoices(){voices=synth.getVoices();}
loadVoices();
if(synth.onvoiceschanged) synth.onvoiceschanged=loadVoices;

function openTalaSheet() {
  talaOpen=true;
  document.getElementById('talaSheet').classList.add('open');
  document.getElementById('talaOverlay').classList.add('active');
  document.getElementById('talaOrbWrap').classList.add('hidden');
  closeDestSheet(false);
  renderTalaSuggestions();
}

const TALA_VIBE_CHIPS = [
  {text:'Something quiet'},{text:'Food after swimming'},{text:'People to join'},
  {text:'Sunset plan'},{text:'Hidden place nearby'},{text:"What’s happening tonight?"}
];
function renderTalaSuggestions(){
  const container = document.getElementById('talaSugs');
  if(!container) return;
  const list = (talaSuggestions && talaSuggestions.length) ? talaSuggestions : TALA_VIBE_CHIPS;
  const active = list.filter(s => typeof isSuggestionActiveToday === 'function' ? isSuggestionActiveToday(s) : true);
  const shown = active.length ? active : list;
  container.innerHTML = shown.map(s=>
    `<button class="tala-sug" onclick="askTala(this)">${escapeHtml(s.text)}</button>`
  ).join('');
}

function closeTalaSheet(anim) {
  talaOpen=false;
  document.getElementById('talaSheet').classList.remove('open');
  document.getElementById('talaOverlay').classList.remove('active');
  if(!currentDest) document.getElementById('talaOrbWrap').classList.remove('hidden');
}

// Orb: tap opens sheet, long-press starts listening
let orbTimer=null, orbLong=false;
function orbTouchStart(){orbLong=false;orbTimer=setTimeout(()=>{orbLong=true;startVoice();},500);}
function orbTouchEnd(){clearTimeout(orbTimer);if(!orbLong) openTalaSheet();}
function orbMouseDown(){orbLong=false;orbTimer=setTimeout(()=>{orbLong=true;startVoice();},500);}
function orbMouseUp(){clearTimeout(orbTimer);if(!orbLong) openTalaSheet();}

function toggleMic(){
  if(!recognition){addMsg('bot','Voice not supported. Type your question.');return;}
  if(isListening){stopVoice();}
  else{startVoice();}
}

function sendTala(){
  const inp=document.getElementById('talaInput');
  const t=inp.value.trim(); if(!t)return;
  processTala(t); inp.value='';
}

function processTala(t){
  addMsg('user',t);
  answerTala(t);
}

function askTala(btn){processTala(btn.textContent);}

function addMsg(type,text){
  const chat=document.getElementById('talaChat');
  const d=document.createElement('div'); d.className=`tala-msg ${type}`; d.innerHTML=text;
  chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
}

function speak(text){
  if(!synth||!voiceOn) return;
  synth.cancel();
  if(!voices.length) voices = synth.getVoices();
  const c=text.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  if(!c) return;
  const u=new SpeechSynthesisUtterance(c);
  u.rate=1;u.pitch=1;u.volume=.85;
  const v=voices.find(v=>v.lang.startsWith('en')&&v.name.toLowerCase().includes('female'))||voices.find(v=>v.lang.startsWith('en-US'))||voices.find(v=>v.lang.startsWith('en'));
  if(v) u.voice=v;
  u.onstart=()=>{document.getElementById('tshAvatar').classList.add('speaking');document.getElementById('tshStatus').textContent='tala is speaking...';};
  u.onend=()=>{document.getElementById('tshAvatar').classList.remove('speaking');document.getElementById('tshStatus').textContent='Your Palawan concierge';};
  synth.speak(u);
}

function toggleMute(){
  voiceOn=!voiceOn;
  const b=document.getElementById('tshMute');
  b.classList.toggle('muted', !voiceOn);
  if(voiceOn){b.title='Mute voice';document.getElementById('tshStatus').textContent='Your Palawan concierge';}
  else{b.title='Unmute voice';document.getElementById('tshStatus').textContent='Voice muted';synth.cancel();document.getElementById('tshAvatar').classList.remove('speaking');}
}

// ─── SEARCH ───
const placeholders=["Ask tala about beaches...","Best time to visit San Vicente?","How to get to San Vicente?","Hidden gems locals love...","Budget travel tips...","Best surf spots in Alimanguan...","What to eat in San Vicente..."];
let phIdx=0,phChar=0,phDir=1;
const heroInput=document.getElementById('heroInput');

function animPlaceholder(){
  const cur=placeholders[phIdx];
  if(phDir===1){heroInput.setAttribute('placeholder',cur.substring(0,phChar+1));phChar++;if(phChar===cur.length){setTimeout(()=>{phDir=-1;animPlaceholder();},2200);return;}}
  else{heroInput.setAttribute('placeholder',cur.substring(0,phChar-1));phChar--;if(phChar===0){phDir=1;phIdx=(phIdx+1)%placeholders.length;}}
  setTimeout(animPlaceholder,phDir===1?55:28);
}

function heroAsk(){
  const t=heroInput.value.trim(); if(!t)return;
  closeDestSheet(false);
  openTalaSheet();
  addMsg('user',t);
  answerTala(t);
}

function heroMic(){
  if(isListening){stopVoice();return;}
  if(!recognition){openTalaSheet();addMsg('bot','Voice requires Chrome, Edge, or Safari. Type instead.');return;}
  // Show orb listening immediately for visual feedback
  setListeningUI(true);
  // Open tala sheet if not already open, then start recognition
  if(!talaOpen) openTalaSheet();
  setTimeout(()=>{
    if(recognition && !isListening){
      recognition.start();
      isListening=true;
      setListeningUI(true);
      document.getElementById('tshStatus').textContent='Listening...';
    }
  },200);
}

// ─── BOTTOM NAV ───
const DOCK_SEEN_KEY = 'sanvic_dock_seen';
function dismissDockIntro(){
  document.getElementById('bottomDock')?.classList.remove('intro-pulse');
  document.getElementById('dockCoachmark')?.classList.remove('show');
  localStorage.setItem(DOCK_SEEN_KEY,'1');
}
let handlingExploreHistory=false;
function dockNav(tab){
  dismissDockIntro();
  setActiveDock(tab);
  if(!handlingExploreHistory){
    if(!history.state?.sanvic)history.replaceState({sanvic:true,tab},'');
    else if(history.state.tab!==tab)history.pushState({sanvic:true,tab},'');
  }

  switch(tab){
    case 'map': closeAllPanels(); closeDiscoverPanel(); document.getElementById('heroOverlay').classList.remove('hidden'); document.getElementById('heroFade').classList.remove('hidden'); if(map){ pinVisibilityOverride=false; activeMarkerSet=allMarkers; map.flyTo([10.50,119.22],11,{duration:1}); applyPinVisibility(); } openTodaySheet(); break;
    case 'discover': closeAllPanels(); closeDiscoverPanel(); openExploreSheet(); break;
    case 'tala': closeAllPanels(); closeDiscoverPanel(); openTalaSheet(); break;
    case 'pulse': closeAllPanels(); closeDiscoverPanel(); openPulsePanel(); break;
    case 'saved': closeAllPanels(); closeDiscoverPanel(); openMySanvicPanel(); break;
    case 'hunt': closeAllPanels(); closeDiscoverPanel(); openHuntPanel(); break;
  }
}

function setActiveDock(tab){
  document.body.dataset.activeTab=tab;
  document.querySelectorAll('.dock-item').forEach(d=>{
    const active=d.dataset.tab===tab || (tab==='hunt'&&d.dataset.tab==='discover');
    d.classList.toggle('active',active);
    if(active)d.setAttribute('aria-current','page');else d.removeAttribute('aria-current');
  });
}
window.addEventListener('popstate',e=>{
  if(!e.state?.sanvic)return;
  handlingExploreHistory=true;
  if(currentDest)closeDestSheet(true);
  dockNav(e.state.tab||'discover');
  if(e.state.place){const d=destinations.find(x=>String(x.id)===e.state.place);if(d)openDest(d,false);}
  handlingExploreHistory=false;
});

function filterCategory(cat){
  if(!mapReady) return;
  allMarkers.forEach(m=>{ if(map.hasLayer(m)) map.removeLayer(m); });
  if(cat==='all'){
    activeMarkerSet = allMarkers;
    pinVisibilityOverride = false; // back to zoom-based behavior on the default view
    map.flyTo([10.50,119.22],11,{duration:1});
  } else {
    const ms=markersByCat[cat]||[];
    activeMarkerSet = ms;
    pinVisibilityOverride = true; // user explicitly asked for this category — always show it
    if(ms.length) map.flyToBounds(L.featureGroup(ms).getBounds().pad(.25),{duration:1,maxZoom:15});
  }
  applyPinVisibility();
}

// ─── MAP LAZY LOAD ───
const mapObs = new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting && !mapReady) { initMap(); mapObs.disconnect(); }
},{rootMargin:'200px'});
// Map is fullscreen so always observing
setTimeout(()=>{ if(!mapReady) initMap(); },100);

// ─── SCROLL → HIDE HERO ───
const shell = document.getElementById('appShell')||document.body;
let scrollY=0;
window.addEventListener('scroll',()=>{
  scrollY=window.scrollY;
  const hero=document.getElementById('heroOverlay');
  const fade=document.getElementById('heroFade');
  if(scrollY>100){hero.classList.add('hidden');fade.classList.add('hidden');}
  else{hero.classList.remove('hidden');fade.classList.remove('hidden');}
},{passive:true});

// ─── INIT ───
window.addEventListener('load',()=>{
  setTimeout(()=>{document.getElementById('splash').classList.add('hidden');},650);
  setTimeout(animPlaceholder,1200);
  setTimeout(loadVoices,800);
  initAuth();
  initHeroWeather();

  // Show dock & orb after splash (kept in sync with the 5s splash hold)
  setTimeout(()=>{
    document.getElementById('bottomDock').classList.add('visible');
    document.getElementById('talaOrbWrap').classList.remove('hidden');
    dockNav('discover');
    if(!localStorage.getItem(DOCK_SEEN_KEY)){
      setTimeout(()=>{
        document.getElementById('bottomDock').classList.add('intro-pulse');
        document.getElementById('dockCoachmark').classList.add('show');
      },400);
      setTimeout(dismissDockIntro,5200); // auto-dismiss if user never taps
    }
  },750);
});

// ═══════════════════════════════════════════════════════
// ADMIN PANEL — triple-click "SANVIC.PH" brand label, PIN 5309.
// Edits write directly to Supabase (destinations, tala_responses,
// tala_settings) so changes show up for every visitor, synced
// through the same Lovable Cloud database the React app uses.
// ═══════════════════════════════════════════════════════
const ADMIN_PIN = "5309";
let brandClickCount = 0, brandClickTimer = null;
let adminUnlocked = false;
let adminTab = 'dest';
let adminEditingDestId = null;   // null = not editing, 'new' = creating, else id
let adminEditingTalaId = null;
let adminCanWrite = false;

async function refreshAdminAccess(){
  adminCanWrite = false;
  if(!currentUser) return;
  try{
    const { data } = await sb.from('user_roles').select('role').eq('user_id', currentUser.id).eq('role','admin').maybeSingle();
    adminCanWrite = !!data;
  }catch(e){}
}
function adminRequireWrite(){
  if(adminCanWrite) return true;
  alert('Sign in with a Supabase user that has the admin role before changing live content. The visible PIN only opens this interface; Supabase RLS is the real security gate.');
  if(!currentUser) openLoginModal();
  return false;
}

function adminBrandClick(){
  brandClickCount++;
  clearTimeout(brandClickTimer);
  brandClickTimer = setTimeout(()=>{ brandClickCount = 0; }, 700);
  if(brandClickCount >= 3){
    brandClickCount = 0;
    openAdminPin();
  }
}

function openAdminPin(){
  document.getElementById('adminPinInput').value = '';
  document.getElementById('adminPinErr').textContent = '';
  document.getElementById('adminPinOverlay').classList.add('active');
  setTimeout(()=>document.getElementById('adminPinInput').focus(), 100);
}

function closeAdminPin(){
  document.getElementById('adminPinOverlay').classList.remove('active');
}

function checkAdminPin(){
  const val = document.getElementById('adminPinInput').value.trim();
  if(val === ADMIN_PIN){
    adminUnlocked = true;
    closeAdminPin();
    openAdminPanel();
  } else {
    document.getElementById('adminPinErr').textContent = 'Incorrect PIN';
    document.getElementById('adminPinInput').value = '';
  }
}

async function openAdminPanel(){
  if(!dataReady) await loadDataFromSupabase();
  await refreshAdminAccess();
  document.getElementById('adminPanelOverlay').classList.add('active');
  refreshAdminAiBadge();
  switchAdminTab(adminTab);
}

function refreshAdminAiBadge(){
  const b = document.getElementById('adminAiBadge');
  if(!b) return;
  b.classList.toggle('is-on', !!talaAiEnabled);
  b.innerHTML = `${lucideSvg('cpu',12)} ${talaAiEnabled ? 'AI on · ' : 'AI off · '}${escapeHtml(talaAiModel || '—')}`;
  b.title = talaAiEnabled ? 'TALA answers use OpenRouter (live AI)' : 'TALA uses curated keyword answers';
}

function closeAdminPanel(){
  document.getElementById('adminPanelOverlay').classList.remove('active');
  adminEditingDestId = null;
  adminEditingTalaId = null;
}

function switchAdminTab(tab){
  adminTab = tab;
  document.getElementById('adminTabDest').classList.toggle('active', tab==='dest');
  document.getElementById('adminTabTala').classList.toggle('active', tab==='tala');
  document.getElementById('adminTabTalaAi').classList.toggle('active', tab==='ai');
  document.getElementById('adminTabPulse').classList.toggle('active', tab==='pulse');
  document.getElementById('adminTabSite').classList.toggle('active', tab==='site');
  document.getElementById('adminTabToday').classList.toggle('active', tab==='today');
  document.getElementById('adminTabTribes').classList.toggle('active', tab==='tribes');
  document.getElementById('adminTabEvents').classList.toggle('active', tab==='events');
  document.getElementById('adminTabMySanvic').classList.toggle('active', tab==='mysanvic');
  document.getElementById('adminTabHunt').classList.toggle('active', tab==='hunt');
  adminEditingDestId = null;
  adminEditingTalaId = null;
  if(tab==='dest') renderAdminDest();
  else if(tab==='tala') renderAdminTala();
  else if(tab==='ai') renderAdminTalaAi();
  else if(tab==='site') renderAdminSite();
  else if(tab==='today') renderAdminToday();
  else if(tab==='tribes') renderAdminTribes();
  else if(tab==='events') renderAdminEvents();
  else if(tab==='mysanvic') renderAdminMySanvic();
  else if(tab==='hunt') renderAdminHunt();
  else renderAdminPulse();
}

function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ───────────── DESTINATIONS ADMIN ─────────────

let destCatPanelOpen = false;
let editingDestCatId = null; // null = not editing, 'new' = creating, else id
let adminDestSearchQuery = '';

function adminPlaceIssues(d){
  const issues = [];
  if(!String(d.name||'').trim()) issues.push('name');
  if(!Number.isFinite(Number(d.lat)) || !Number.isFinite(Number(d.lng))) issues.push('map pin');
  if(!String(d.category||'').trim()) issues.push('category');
  if(!String(d.barangay||'').trim()) issues.push('barangay');
  if(!String(d.description||'').trim()) issues.push('description');
  if(!String(d.image||'').trim()) issues.push('cover photo');
  return issues;
}
function adminFilterDestinations(value){
  adminDestSearchQuery = String(value||'').trim().toLowerCase();
  renderAdminDest();
  const input = document.getElementById('adminDestSearch');
  if(input){ input.focus(); input.setSelectionRange(input.value.length,input.value.length); }
}
function adminPreviewDest(id){
  const d = destinations.find(x=>String(x.id)===String(id));
  if(!d) return;
  closeAdminPanel();
  if(map){ map.flyTo([d.lat,d.lng],15,{duration:1}); }
  openDest(d);
}

function adminToggleDestCatPanel(){
  destCatPanelOpen = !destCatPanelOpen;
  renderAdminDest();
}

function adminDestCatPanelHtml(){
  let html = `
    <div class="admin-field" style="font-size:.7rem;color:var(--white-dim);margin-bottom:10px;">
      These are the categories available when adding or editing a destination (Beaches, Islands, etc). Add your own, rename, or change the marker color. Deleting a category doesn't delete destinations already using it — they'll just show the category's key until you re-assign them.
    </div>
    <button class="admin-add-btn" onclick="adminNewDestCat()">+ Add category</button>`;

  if(editingDestCatId !== null){
    html += adminDestCatFormHtml();
  }

  const keys = Object.keys(catStyle);
  if(!keys.length){
    html += `<div class="admin-empty">No categories yet.</div>`;
  } else {
    html += keys.map(key=>{
      const c = catStyle[key];
      const ico = lucideSvg(c.icon||'map-pin', 14);
      return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditDestCat('${escapeHtml(key)}')" style="flex:1;cursor:pointer;display:flex;align-items:center;gap:10px;">
            <span class="sv-pin-preview" style="--pin-color:${escapeHtml(c.color)};width:28px;height:28px;flex-shrink:0;">${ico}</span>
            <div>
              <strong>${escapeHtml(c.label)}</strong><br>
              <span>${escapeHtml(key)} · ${escapeHtml(c.icon||'map-pin')}</span>
            </div>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditDestCat('${escapeHtml(key)}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteDestCat('${escapeHtml(key)}')">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  return html;
}

function adminDestCatFormHtml(){
  const isNew = editingDestCatId === 'new';
  const c = isNew ? {key:'',label:'',color:'#0ea5e9',icon:'map-pin'} : { key: editingDestCatId, ...catStyle[editingDestCatId] };
  const currentIcon = c.icon || 'map-pin';
  const iconGrid = LUCIDE_ICON_KEYS.map(name=>{
    const sel = name === currentIcon ? ' is-selected' : '';
    return `<button type="button" class="sv-icon-opt${sel}" data-icon="${name}" onclick="adminPickIcon('${name}')" title="${name}">${lucideSvg(name,18)}</button>`;
  }).join('');
  return `
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Key (lowercase, no spaces — used internally, can't be changed later)</label>
        <input id="dcfKey" value="${escapeHtml(c.key)}" placeholder="e.g. waterfalls" ${isNew?'':'disabled'}>
      </div>
      <div class="admin-field"><label>Label (shown to visitors)</label><input id="dcfLabel" value="${escapeHtml(c.label)}" placeholder="e.g. Waterfalls"></div>
      <div class="admin-field"><label>Marker color (hex)</label><input id="dcfColor" value="${escapeHtml(c.color)}" placeholder="#0ea5e9" oninput="adminRefreshIconPreview()"></div>
      <div class="admin-field">
        <label>Map icon</label>
        <div class="sv-icon-preview-row">
          <span id="dcfPreview" class="sv-pin-preview" style="--pin-color:${escapeHtml(c.color)}">${lucideSvg(currentIcon,18)}</span>
          <span style="font-size:.72rem;color:var(--white-dim);">Preview · <span id="dcfIconName">${escapeHtml(currentIcon)}</span></span>
        </div>
        <input id="dcfIcon" type="hidden" value="${escapeHtml(currentIcon)}">
        <div class="sv-icon-grid">${iconGrid}</div>
      </div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveDestCat('${isNew?'':escapeHtml(c.key)}')">${isNew?'Create':'Save changes'}</button>
        <button class="admin-cancel-btn" onclick="editingDestCatId=null;renderAdminDest();">Cancel</button>
      </div>
    </div>`;
}

function adminPickIcon(name){
  const f = document.getElementById('dcfIcon'); if(!f) return;
  f.value = name;
  document.querySelectorAll('.sv-icon-opt').forEach(b=>b.classList.toggle('is-selected', b.dataset.icon===name));
  const lbl = document.getElementById('dcfIconName'); if(lbl) lbl.textContent = name;
  adminRefreshIconPreview();
}
function adminRefreshIconPreview(){
  const prev = document.getElementById('dcfPreview'); if(!prev) return;
  const name = (document.getElementById('dcfIcon')||{}).value || 'map-pin';
  const color = (document.getElementById('dcfColor')||{}).value || '#0ea5e9';
  prev.style.setProperty('--pin-color', color);
  prev.innerHTML = lucideSvg(name, 18);
}

function adminNewDestCat(){ editingDestCatId='new'; renderAdminDest(); }
function adminEditDestCat(key){ editingDestCatId=key; renderAdminDest(); }

async function adminSaveDestCat(existingKey){
  if(!adminRequireWrite()) return;
  const isNew = !existingKey;
  const key = document.getElementById('dcfKey').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const label = document.getElementById('dcfLabel').value.trim();
  const color = document.getElementById('dcfColor').value.trim() || '#0ea5e9';
  const icon = (document.getElementById('dcfIcon').value || 'map-pin').trim();
  if(!key || !label){ alert('Key and label are both required.'); return; }
  if(isNew && catStyle[key]){ alert(`A category with the key "${key}" already exists.`); return; }

  try {
    if(isNew){
      const sortOrder = Object.keys(catStyle).length;
      const { error } = await sb.from('destination_categories').insert({ key, label, color, icon, sort_order: sortOrder });
      if(error) throw error;
    } else {
      const { error } = await sb.from('destination_categories').update({ label, color, icon }).eq('key', existingKey);
      if(error) throw error;
    }
    await loadDataFromSupabase();
    editingDestCatId = null;
    renderAdminDest();
    rebuildMarkers(); // marker icons/colors depend on catStyle
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminDeleteDestCat(key){
  if(!adminRequireWrite()) return;
  const inUse = destinations.filter(d=>d.category===key).length;
  const warn = inUse ? ` ${inUse} destination${inUse===1?'':'s'} currently use this category and will show "${key}" until reassigned.` : '';
  if(!confirm(`Delete the "${catStyle[key]?.label||key}" category?${warn}`)) return;
  try {
    const { error } = await sb.from('destination_categories').delete().eq('key', key);
    if(error) throw error;
    await loadDataFromSupabase();
    renderAdminDest();
    rebuildMarkers();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

let nearbyPanelOpen = false;
let editingNearbyId = null; // null = not editing, 'new' = creating, else id

function adminToggleNearbyPanel(){
  nearbyPanelOpen = !nearbyPanelOpen;
  renderAdminDest();
}

const NEARBY_CAT_LABELS = { food:'Food', shop:'Shop', service:'Service', stay:'Stay' };

function adminNearbyPanelHtml(){
  let html = `
    <div class="admin-field" style="font-size:.7rem;color:var(--white-dim);margin-bottom:10px;">
      Shown when a visitor taps "What's around me" on a destination — grouped by barangay, the same barangay set on that destination below. Add real food/shop/service spots so every barangay has something useful.
    </div>
    <button class="admin-add-btn" onclick="adminNewNearby()">+ Add place</button>`;

  if(editingNearbyId !== null){
    html += adminNearbyFormHtml();
  }

  const barangays = Object.keys(nearbyPlacesByBarangay).sort();
  if(!barangays.length){
    html += `<div class="admin-empty">No nearby places yet.</div>`;
  } else {
    barangays.forEach(b=>{
      const items = nearbyPlacesByBarangay[b];
      if(!items.length) return;
      html += `<div style="font-size:.68rem;color:var(--white-dim);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 6px;">Brgy. ${escapeHtml(b)}</div>`;
      html += items.map(p=>`
        <div class="admin-list-item">
          <div class="admin-list-item-head">
            <div onclick="adminEditNearby(${p.id})" style="flex:1;cursor:pointer;display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.1rem;">${escapeHtml(p.icon)}</span>
              <div>
                <strong>${escapeHtml(p.name)}</strong> <span style="color:var(--white-dim);font-size:.68rem;">(${NEARBY_CAT_LABELS[p.cat]||p.cat})</span><br>
                <span>${escapeHtml(p.desc)}</span>
              </div>
            </div>
            <div class="admin-row-actions">
              <button class="admin-mini-btn" onclick="adminEditNearby(${p.id})">Edit</button>
              <button class="admin-mini-btn danger" onclick="adminDeleteNearby(${p.id})">Delete</button>
            </div>
          </div>
        </div>`).join('');
    });
  }
  return html;
}

function adminNearbyFormHtml(){
  const isNew = editingNearbyId === 'new';
  let p = null;
  if(!isNew){
    for(const b in nearbyPlacesByBarangay){
      const found = nearbyPlacesByBarangay[b].find(x=>x.id===editingNearbyId);
      if(found){ p = {...found, barangay:b}; break; }
    }
  }
  p = p || {barangay:'', name:'', cat:'food', desc:'', dist:'', icon:'📍'};
  return `
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Barangay (must match a destination's barangay exactly)</label>
        <input id="npfBarangay" list="npfBarangayList" value="${escapeHtml(p.barangay)}" placeholder="e.g. Poblacion">
        <datalist id="npfBarangayList">${Array.from(new Set([...Object.keys(nearbyPlacesByBarangay), ...destinations.map(d=>d.barangay).filter(Boolean)])).map(b=>`<option value="${escapeHtml(b)}">`).join('')}</datalist>
      </div>
      <div class="admin-field"><label>Name</label><input id="npfName" value="${escapeHtml(p.name)}" placeholder="e.g. Mango Bar and Restaurant"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Category</label>
          <select id="npfCat">
            <option value="food" ${p.cat==='food'?'selected':''}>Food</option>
            <option value="shop" ${p.cat==='shop'?'selected':''}>Shop</option>
            <option value="service" ${p.cat==='service'?'selected':''}>Service</option>
            <option value="stay" ${p.cat==='stay'?'selected':''}>Stay</option>
          </select>
        </div>
        <div class="admin-field"><label>Icon (single emoji)</label><input id="npfIcon" value="${escapeHtml(p.icon)}" placeholder="🍽️"></div>
      </div>
      <div class="admin-field"><label>Short description</label><input id="npfDesc" value="${escapeHtml(p.desc)}" placeholder="e.g. Grilled seafood, beachfront seating"></div>
      <div class="admin-field"><label>Distance / location label</label><input id="npfDist" value="${escapeHtml(p.dist)}" placeholder="e.g. Poblacion town, 5 min walk"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveNearby(${isNew?"'new'":editingNearbyId})">${isNew?'Create':'Save changes'}</button>
        <button class="admin-cancel-btn" onclick="editingNearbyId=null;renderAdminDest();">Cancel</button>
      </div>
    </div>`;
}

function adminNewNearby(){ editingNearbyId='new'; renderAdminDest(); }
function adminEditNearby(id){ editingNearbyId=id; renderAdminDest(); }

async function adminSaveNearby(id){
  if(!adminRequireWrite()) return;
  const barangay = document.getElementById('npfBarangay').value.trim();
  const name = document.getElementById('npfName').value.trim();
  const cat = document.getElementById('npfCat').value;
  const icon = document.getElementById('npfIcon').value.trim() || '📍';
  const desc = document.getElementById('npfDesc').value.trim();
  const dist = document.getElementById('npfDist').value.trim();
  if(!barangay || !name){ alert('Barangay and name are both required.'); return; }

  try {
    if(id === 'new'){
      const sortOrder = (nearbyPlacesByBarangay[barangay]||[]).length;
      const { error } = await sb.from('nearby_places').insert({ barangay, name, category:cat, description:desc, distance_label:dist, icon, sort_order:sortOrder });
      if(error) throw error;
    } else {
      const { error } = await sb.from('nearby_places').update({ barangay, name, category:cat, description:desc, distance_label:dist, icon }).eq('id', id);
      if(error) throw error;
    }
    await loadDataFromSupabase();
    editingNearbyId = null;
    renderAdminDest();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminDeleteNearby(id){
  if(!adminRequireWrite()) return;
  if(!confirm('Delete this place?')) return;
  try {
    const { error } = await sb.from('nearby_places').delete().eq('id', id);
    if(error) throw error;
    await loadDataFromSupabase();
    renderAdminDest();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

function renderAdminDest(){
  const body = document.getElementById('adminBody');
  const incomplete = destinations.filter(d=>adminPlaceIssues(d).length).length;
  const q = adminDestSearchQuery;
  const visibleDestinations = destinations.filter(d=>!q || [d.name,d.barangay,d.category,d.description].some(v=>String(v||'').toLowerCase().includes(q)));
  let html = `
    <div class="admin-data-banner ${destinationsSource==='fallback'||!adminCanWrite?'warning':''}">
      <strong>${destinationsSource==='supabase'?'Live Supabase directory':'Offline fallback data'}</strong>
      <span>${destinations.length} listing${destinations.length===1?'':'s'} · ${incomplete} need${incomplete===1?'s':''} details · ${adminCanWrite?'Admin writes enabled':'Sign in as an assigned admin to save'}</span>
    </div>
    ${destinationsSource==='fallback'?'<div class="admin-data-note">The database could not be reached, so these are built-in demo records. Reconnect before editing; saving fallback entries can create duplicates.</div>':''}
    <div class="admin-section-toggle" onclick="adminToggleDestCatPanel()">
      <span>${lucideSvg('tag',13)} Manage categories ${destCatPanelOpen?'▾':'▸'}</span>
      <span class="admin-section-count">${Object.keys(catStyle).length}</span>
    </div>
    <div id="adfCatPanel" style="display:${destCatPanelOpen?'':'none'}">
      ${adminDestCatPanelHtml()}
    </div>
    <div class="admin-section-toggle" onclick="adminToggleNearbyPanel()" style="margin-top:8px;">
      <span>${lucideSvg('map-pin',13)} Manage "What's around me" ${nearbyPanelOpen?'▾':'▸'}</span>
      <span class="admin-section-count">${Object.values(nearbyPlacesByBarangay).reduce((n,arr)=>n+arr.length,0)}</span>
    </div>
    <div id="adfNearbyPanel" style="display:${nearbyPanelOpen?'':'none'}">
      ${adminNearbyPanelHtml()}
    </div>
    <button class="admin-add-btn" style="margin-top:14px;" onclick="adminNewDest()">+ Add business or tourist place</button>
    <input class="admin-directory-search" id="adminDestSearch" value="${escapeHtml(adminDestSearchQuery)}" placeholder="Search name, barangay or category" oninput="adminFilterDestinations(this.value)">`;

  if(adminEditingDestId !== null){
    html += adminDestFormHtml();
  }

  if(!visibleDestinations.length){
    html += `<div class="admin-empty">${destinations.length?'No listings match that search.':'No live listings yet. Add your first business or tourist place above.'}</div>`;
  } else {
    html += visibleDestinations.map(d=>{
      const issues = adminPlaceIssues(d);
      return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditDest(${d.id})" style="flex:1;cursor:pointer;">
            <strong>${escapeHtml(d.name)}</strong>${d.featured ? ` <span class="admin-feat-icon" title="Featured">${lucideSvg('star',12)}</span>` : ''}${d.videoUrl ? ` <span class="admin-feat-icon" title="Has video">${lucideSvg('film',12)}</span>` : ''}<br>
            <span>${escapeHtml(catStyle[d.category]?.label||d.category)} · ${escapeHtml(d.barangay||'Barangay missing')}</span>
            <div class="admin-quality ${issues.length?'needs-work':'ready'}">${issues.length?'Needs: '+escapeHtml(issues.join(', ')):'Ready for Explore'}</div>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminPreviewDest(${d.id})">View</button>
            <button class="admin-mini-btn" onclick="adminEditDest(${d.id})">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteDest(${d.id})">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  body.innerHTML = html;
}

function adminDestFormHtml(){
  const isNew = adminEditingDestId === 'new';
  const d = isNew ? {name:'',lat:'',lng:'',category:'beaches',image:'',images:[],description:'',tip:'',color:'#0ea5e9',videoUrl:'',videoType:'',featured:false,barangay:'',googleBusinessUrl:'',stats:{rating:'',travel:'',temp:'',season:''}} : destinations.find(x=>x.id===adminEditingDestId);
  if(!d) return '';
  // Initialize media gallery with existing images
  __mediaGallery = [];
  if(d.image) __mediaGallery.push(d.image);
  if(d.images && Array.isArray(d.images)) __mediaGallery.push(...d.images);
  return `
    <div class="admin-edit-box">
      <div class="admin-form-heading">${isNew?'New listing':'Edit listing'}</div>
      <div class="admin-form-help">Use this same form for beaches, attractions, accommodations, restaurants, tour operators, shops and local services. Saved records appear in Explore and on the map.</div>
      <div class="admin-toggle-row">
        <label for="adfFeatured">Featured in Explore</label>
        <input type="checkbox" id="adfFeatured" ${d.featured?'checked':''}>
      </div>

      <div class="admin-form-section">1. Identity and location</div>
      <div class="admin-field"><label>Name *</label><input id="adfName" value="${escapeHtml(d.name)}" placeholder="Public business or place name"></div>

      <div class="admin-field">
        <label>Paste Google Maps link (fills name + lat/lng below)</label>
        <input id="adfMapsLink" placeholder="https://www.google.com/maps/place/..." oninput="adminParseMapsLink()">
        <div id="adfMapsLinkStatus" style="font-size:.68rem;color:var(--white-dim);margin-top:6px;">
          Works with full google.com/maps/... links. Shortened maps.app.goo.gl links need to be opened once first — then copy the expanded URL from the address bar.
        </div>
      </div>

      <div class="admin-grid-2">
        <div class="admin-field"><label>Latitude</label><input id="adfLat" value="${d.lat}"></div>
        <div class="admin-field"><label>Longitude</label><input id="adfLng" value="${d.lng}"></div>
      </div>
      <div class="admin-field">
        <label>Barangay *</label>
        <input id="adfBarangay" list="adfBarangayList" value="${escapeHtml(d.barangay||'')}" placeholder="e.g. Poblacion, Port Barton, Alimanguan...">
        <datalist id="adfBarangayList">${Array.from(new Set([...EXPLORE_AREAS.map(a=>a.k),...Object.keys(nearbyPlacesByBarangay)])).map(b=>`<option value="${escapeHtml(b)}">`).join('')}</datalist>
      </div>
      <div class="admin-field">
        <label>Google Business Profile URL (sightseeing, accommodation, cafe, tour office...)</label>
        <input id="adfGbp" value="${escapeHtml(d.googleBusinessUrl)}" placeholder="https://www.google.com/maps/place/... or https://maps.app.goo.gl/..." oninput="adminParseGbpLink()">
        <div id="adfGbpStatus" style="font-size:.68rem;color:var(--white-dim);margin-top:6px;">
          Paste the "Share" link from the business's Google profile. If coordinates can be read from it, they're filled in below.
        </div>
      </div>
      <div class="admin-field" style="margin-top:10px">
        <button type="button" class="admin-save-btn" id="adfAutoFillBtn" onclick="adminAutoFill()" style="min-height:44px">Auto-fill from OpenStreetMap &amp; Wikimedia (no API keys)</button>
        <div id="adfAutoStatus" style="font-size:.68rem;color:var(--white-dim);margin-top:8px;line-height:1.5"></div>
        <div id="adfAutoResults"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Category</label>
          <select id="adfCat">
            ${Object.keys(catStyle).map(c=>`<option value="${c}" ${c===d.category?'selected':''}>${catStyle[c].label}</option>`).join('')}
          </select>
        </div>
        <div class="admin-field"><label>Marker color</label><input id="adfColor" value="${escapeHtml(d.color)}"></div>
      </div>

      <div class="admin-form-section">2. Photos and visitor information</div>
      ${mediaGalleryHtml('adf','dest')}
      ${mediaVideoHtml('adf', d.videoUrl, d.videoType)}

      <div class="admin-field"><label>Description *</label><textarea id="adfDesc" rows="3" placeholder="What is this place, and why should someone visit or use it?">${escapeHtml(d.description)}</textarea></div>
      <div class="admin-field"><label>Local tip</label><textarea id="adfTip" rows="2" placeholder="Access, hours, fees, cash, road or weather advice">${escapeHtml(d.tip)}</textarea></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Rating</label><input id="adfRating" value="${escapeHtml(d.stats.rating)}"></div>
        <div class="admin-field"><label>Access / travel time</label><input id="adfTravel" value="${escapeHtml(d.stats.travel)}" placeholder="e.g. 15 min from Poblacion"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Temp</label><input id="adfTemp" value="${escapeHtml(d.stats.temp)}"></div>
        <div class="admin-field"><label>Season</label><input id="adfSeason" value="${escapeHtml(d.stats.season)}"></div>
      </div>

      <div class="admin-edit-actions">
        <button class="admin-save-btn" id="adfSaveBtn" onclick="adminSaveDest()">${isNew?'Create listing':'Save changes'}</button>
        <button class="admin-cancel-btn" onclick="adminEditingDestId=null;renderAdminDest();">Cancel</button>
      </div>
    </div>`;
}

function adminToggleVideoFields(){
  const type = document.getElementById('adfVideoType').value;
  document.getElementById('adfVideoYoutubeWrap').style.display = type==='youtube' ? '' : 'none';
  document.getElementById('adfVideoUploadWrap').style.display = type==='upload' ? '' : 'none';
}

function adminPreviewImage(){
  const url = document.getElementById('adfImage').value.trim();
  const img = document.getElementById('adfImagePreview');
  if(url){ img.src = url; img.style.display = ''; }
  else { img.style.display = 'none'; }
}

async function adminUploadImageNow(){
  const fileInput = document.getElementById('adfImageFile');
  const file = fileInput.files[0];
  const status = document.getElementById('adfImageUploadStatus');
  if(!file) return;

  status.textContent = 'Uploading...';
  status.style.color = 'var(--white-dim)';
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `dest_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await sb.storage.from('destination-images').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg'
    });
    if(error) throw error;

    const { data } = sb.storage.from('destination-images').getPublicUrl(path);
    document.getElementById('adfImage').value = data.publicUrl;
    adminPreviewImage();
    status.textContent = 'Uploaded.';
    status.style.color = '#22c55e';
  } catch(err){
    status.textContent = 'Upload failed: ' + (err.message || err);
    status.style.color = '#ef4444';
  }
}

function adminParseMapsLink(){
  const input = document.getElementById('adfMapsLink');
  const status = document.getElementById('adfMapsLinkStatus');
  const url = input.value.trim();
  if(!url){
    status.textContent = 'Tip: works with full google.com/maps/... links. Shortened maps.app.goo.gl links need to be opened once first — then copy the expanded URL from the address bar.';
    status.style.color = 'var(--white-dim)';
    return;
  }
  if(/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)){
    status.textContent = 'That\'s a shortened link — open it in a browser tab first, then paste the expanded google.com/maps/... URL here. (Or just paste the short link in chat and ask to have it resolved.)';
    status.style.color = '#f59e0b';
    return;
  }
  const result = parseGoogleMapsUrl(url);
  if(result){
    document.getElementById('adfLat').value = result.lat;
    document.getElementById('adfLng').value = result.lng;
    const nameField = document.getElementById('adfName');
    if(result.name && !nameField.value.trim()) nameField.value = result.name;
    status.textContent = `Found: ${result.lat}, ${result.lng}${result.name ? ' — "'+result.name+'"' : ''}. Filled in below.`;
    status.style.color = '#22c55e';
  } else {
    status.textContent = 'Could not find coordinates in that link. Try copying the link again from the address bar after opening the place on Google Maps.';
    status.style.color = '#ef4444';
  }
}

function adminNewDest(){ adminEditingDestId='new'; renderAdminDest(); }
function adminEditDest(id){ adminEditingDestId=id; renderAdminDest(); }

// Optional helper: a Google Business Profile URL is usually just a Google
// Maps place link — when it is, quietly fill in name/lat/lng as a convenience.
// The URL itself is always stored verbatim in the google_business_url column.
function adminParseGbpLink(){
  const status = document.getElementById('adfGbpStatus');
  const url = (document.getElementById('adfGbp').value || '').trim();
  if(!url){
    status.textContent = 'Paste the "Share" link from the business\'s Google profile. If coordinates can be read from it, they\'re filled in below.';
    status.style.color = 'var(--white-dim)';
    return;
  }
  const result = parseGoogleMapsUrl(url);
  if(result){
    const latEl = document.getElementById('adfLat');
    const lngEl = document.getElementById('adfLng');
    const nameEl = document.getElementById('adfName');
    if(latEl && lngEl){
      if(!latEl.value) latEl.value = result.lat;
      if(!lngEl.value) lngEl.value = result.lng;
    }
    if(result.name && nameEl && !nameEl.value.trim()) nameEl.value = result.name;
    status.textContent = 'Coordinates found and filled in. This URL will also be saved as the Google Business Profile link.';
    status.style.color = '#22c55e';
  } else {
    status.textContent = 'Saved as-is. (Some profile share links are short URLs that can\'t be read client-side — that\'s fine.)';
    status.style.color = '#f59e0b';
  }
}

// ─── OPEN-SOURCE AUTO-FILL (no API keys) ───
// Pasted flow: admin pastes a Google Business link (or types a name),
// we resolve the place through OpenStreetMap (Nominatim + Overpass) for real
// data and recommend photos from Wikimedia Commons. All endpoints are open,
// keyless, CORS-enabled. Attribution required for OSM (ODbL) + Commons (CC).

function gbpNameFromUrl(url){
  if(!url) return '';
  const m = url.match(/\/maps\/place\/([^/@]+)/);
  if(m) return decodeURIComponent(m[1].replace(/\+/g,' '));
  const q = url.match(/[?&]q=([^&]+)/);
  if(q && q[1] && !/^[\d.,]+$/.test(q[1].trim())) return decodeURIComponent(q[1].replace(/\+/g,' '));
  return '';
}

async function adminNominatim(q){
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&q=' +
    encodeURIComponent(q + ' San Vicente Palawan Philippines');
  const res = await fetch(url);
  if(!res.ok) throw new Error('Nominatim HTTP ' + res.status);
  const rows = await res.json();
  if(!rows || !rows.length) return null;
  // Rank by distance to San Vicente + prefer results that actually mention it.
  const center = { lat: 10.50, lon: 119.22 };
  const score = r => Math.hypot(parseFloat(r.lat)-center.lat, parseFloat(r.lon)-center.lon)
    + (/san vicente/i.test(r.display_name) ? 0 : 2)
    + (/palawan/i.test(r.display_name) ? 0 : 1);
  rows.sort((a,b)=>score(a)-score(b));
  const r = rows[0];
  return { lat:r.lat, lon:r.lon, displayName:r.display_name, shortName:r.display_name.split(',')[0].trim(), osmType:r.osm_type, osmId:r.osm_id };
}

async function adminOsmTags(osmType, osmId){
  const type = osmType === 'relation' ? 'relation' : (osmType === 'way' ? 'way' : 'node');
  const q = '[out:json];(' + type + '(' + osmId + '););out tags;';
  const res = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q));
  if(!res.ok) throw new Error('Overpass HTTP ' + res.status);
  const j = await res.json();
  return (j.elements && j.elements[0] && j.elements[0].tags) || {};
}

// Ordered guesses: [osmtag, [values], [preferred destination category keys...]]
const OSM_CATEGORY_HINTS = [
  ['amenity', ['restaurant','cafe','bar','fast_food','pub','food_court'], ['food']],
  ['shop', ['travel_agency'], ['activity','tours','adventure']],
  ['office', ['travel_agent','travel_agency'], ['activity','tours','adventure']],
  ['tourism', ['hotel','guest_house','hostel','resort','chalet','motel','apartment'], ['stays','lodging','hotel']],
  ['tourism', ['attraction','viewpoint'], ['adventure','nature','culture']],
  ['tourism', ['museum','gallery','artwork'], ['culture']],
  ['leisure', ['beach_resort','water_park'], ['stays','adventure']],
  ['natural', ['beach','bay'], ['beaches','nature']],
  ['natural', ['island'], ['islands','nature']],
  ['amenity', ['atm','bank','pharmacy','clinic'], ['service','services']],
  ['highway', ['bus_stop','ferry_terminal'], ['transport']],
];
function adminPickCategoryFromTags(tags){
  const t = tags || {};
  const sel = document.getElementById('adfCat');
  if(!sel) return null;
  const pick = bases => {
    for(const b of bases) if(Array.from(sel.options).some(o=>o.value === b)){ sel.value = b; return b; }
    return null;
  };
  for(const [k, vals, bases] of OSM_CATEGORY_HINTS){
    const v = String(t[k] || '').toLowerCase();
    if(vals.includes(v)) return pick(bases) || null;
  }
  return null;
}

function adminApplyOsmTags(tags, results){
  const t = tags || {};
  const info = [];
  const website = t.website || t['contact:website'] || t['url:wikipedia'] || '';
  const phone = t.phone || t['contact:phone'] || t['phone:mobile'] || '';
  const hours = t.opening_hours || '';
  if(website) info.push('Website: <a href="' + escapeHtml(website) + '" target="_blank" rel="noreferrer" style="color:var(--ocean-teal-light)">' + escapeHtml(website) + '</a>');
  if(phone) info.push('Phone: ' + escapeHtml(phone));
  if(hours) info.push('Hours: ' + escapeHtml(hours));
  if(t['addr:housenumber'] || t['addr:street']) info.push('Address: ' + escapeHtml((t['addr:housenumber']||'') + ' ' + (t['addr:street']||'')) + ', San Vicente');

  adminPickCategoryFromTags(t);

  const descEl = document.getElementById('adfDesc');
  if(descEl && !descEl.value.trim()){
    const parts = [(t.name || 'This spot') + ' — located in San Vicente, Palawan.'];
    const hoursStr = hours ? ' Open ' + hours + '.' : '';
    const addrStr = (t['addr:housenumber']||t['addr:street']) ? ' Found at ' + ((t['addr:housenumber']||'') + ' ' + (t['addr:street']||'')).trim() + ', San Vicente.' : '';
    if(hoursStr) parts.push(hoursStr);
    if(addrStr) parts.push(addrStr);
    descEl.value = parts.join('');
  }

  if(info.length){
    results.insertAdjacentHTML('beforeend',
      '<div style="border:1px solid var(--glass-border);border-radius:12px;background:rgba(255,255,255,.04);padding:10px 12px;margin-top:10px">' +
      '<div style="font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--white-dim);margin-bottom:6px">OpenStreetMap details (open-source)</div>' +
      info.map(s => '<div style="font-size:.75rem;color:var(--sand);margin:2px 0">' + s + '</div>').join('') +
      '<div style="font-size:.6rem;color:var(--white-dim);margin-top:6px">Data &copy; OpenStreetMap contributors (ODbL)</div>' +
      '</div>');
  }
}

async function adminWikimediaSuggest(q, results){
  const box = document.createElement('div');
  box.innerHTML =
    '<div style="font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--white-dim);margin:10px 0 6px">Wikimedia Commons photos — tap one to use it</div>' +
    '<div style="font-size:.6rem;color:var(--white-dim);margin-bottom:4px">Photos are CC-licensed by their authors — show attribution on the live site too.</div>' +
    '<div id="wikimediaThumbs" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:6px">Loading…</div>';
  results.appendChild(box);
  try{
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
      '&gsrsearch=' + encodeURIComponent(q + ' San Vicente Palawan') +
      '&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*';
    const res = await fetch(url);
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const pages = (j.query && j.query.pages) || {};
    const photos = [];
    Object.keys(pages).forEach(k => {
      const p = pages[k];
      const ii = p.imageinfo && p.imageinfo[0];
      if(ii && ii.thumburl) photos.push({
        thumb: ii.thumburl,
        url: ii.descriptionurl || ii.url || '',
        artist: (ii.extmetadata && ii.extmetadata.Artist && ii.extmetadata.Artist.value) || '',
        license: (ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value) || ''
      });
    });
    const grid = document.getElementById('wikimediaThumbs');
    if(!grid) return;
    if(!photos.length){
      grid.innerHTML = '<div style="color:var(--white-dim);font-size:.7rem;grid-column:1/-1">No Commons photos found — upload your own instead.</div>';
      return;
    }
    window.__wmPhotos = photos;
    grid.innerHTML = photos.map((ph, i) =>
      '<button type="button" onclick="adminPickWikimedia(' + i + ')" title="' + escapeHtml((ph.artist||'Photo').replace(/<[^>]+>/g,'').trim() + ' · ' + ph.license) + '" style="border:1px solid var(--glass-border);border-radius:8px;overflow:hidden;padding:0;background:rgba(255,255,255,.04);cursor:pointer">' +
      '<img src="' + ph.thumb + '" alt="" loading="lazy" style="width:100%;height:62px;object-fit:cover;display:block"></button>'
    ).join('');
  }catch(e){
    const grid = document.getElementById('wikimediaThumbs');
    if(grid) grid.innerHTML = '<div style="color:var(--white-dim);font-size:.7rem;grid-column:1/-1">Wikimedia lookup failed (' + escapeHtml(e.message || e) + ')</div>';
  }
}

function adminPickWikimedia(i){
  const phs = window.__wmPhotos || [];
  const ph = phs[i];
  if(!ph) return;
  const img = document.getElementById('adfImage');
  if(img) img.value = ph.thumb;
  adminPreviewImage();
  const attrEl = document.getElementById('adfImageAttribution');
  const artist = (ph.artist || '').replace(/<[^>]+>/g,'').trim() || 'unknown author';
  if(attrEl){
    attrEl.innerHTML = 'Photo from ' +
      (ph.url ? '<a href="' + ph.url + '" target="_blank" rel="noreferrer" style="color:var(--ocean-teal-light)">Wikimedia Commons</a>' : 'Wikimedia Commons') +
      ' — ' + escapeHtml(artist) + (ph.license ? ' (' + escapeHtml(ph.license) + ')' : '') + '. Show this attribution on the live map too.';
  }
}

async function adminAutoFill(){
  const status = document.getElementById('adfAutoStatus');
  const results = document.getElementById('adfAutoResults');
  status.style.color = 'var(--white-dim)';
  results.innerHTML = '';
  const gbp = (document.getElementById('adfGbp').value || '').trim();
  let name = gbpNameFromUrl(gbp);
  const nameField = document.getElementById('adfName');
  if(!name && nameField && nameField.value.trim()) name = nameField.value.trim();
  name = (name || '').trim();
  if(!name){
    status.textContent = 'Type a location name first — or paste a Google Maps link with a /place/ name — so we can search OpenStreetMap.';
    status.style.color = '#ef4444';
    return;
  }
  status.textContent = 'Searching OpenStreetMap for "' + name + '"…';
  let r;
  try {
    r = await adminNominatim(name);
  } catch(e){
    status.textContent = 'OpenStreetMap lookup failed (' + escapeHtml(e.message || e) + '). You can still fill the fields manually.';
    status.style.color = '#ef4444';
    return;
  }
  if(!r){
    status.textContent = 'No matching place on OpenStreetMap for "' + name + '". Fill the fields manually.';
    status.style.color = '#f59e0b';
    return;
  }
  const latEl = document.getElementById('adfLat');
  const lngEl = document.getElementById('adfLng');
  if(latEl && !latEl.value) latEl.value = r.lat;
  if(lngEl && !lngEl.value) lngEl.value = r.lon;
  if(nameField && !nameField.value.trim() && r.shortName) nameField.value = r.shortName;
  status.innerHTML = 'Matched: <strong>' + escapeHtml(r.displayName) + '</strong> (via OpenStreetMap / Nominatim).';
  status.style.color = '#22c55e';
  let tags = {};
  if(r.osmId){
    try { tags = await adminOsmTags(r.osmType, r.osmId); }
    catch(e){ /* details are a bonus — coords already filled */ }
  }
  adminApplyOsmTags(tags, results);
  adminWikimediaSuggest(name, results);
}

async function adminUploadVideoIfNeeded(){
  const type = document.getElementById('adfVideoType').value;
  if(type !== 'upload') return null;

  const fileInput = document.getElementById('adfVideoFile');
  const file = fileInput.files[0];
  const statusEl = document.getElementById('adfVideoUploadStatus');
  const existingUrl = document.getElementById('adfVideoUploadedUrl').value;

  if(!file) return existingUrl || null; // keep existing video if no new file chosen

  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const path = `dest_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;

  statusEl.textContent = 'Uploading...';
  const { error } = await sb.storage.from('destination-videos').upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || 'video/mp4'
  });
  if(error){ statusEl.textContent = 'Upload failed: ' + error.message; throw error; }

  const { data } = sb.storage.from('destination-videos').getPublicUrl(path);
  statusEl.textContent = 'Uploaded.';
  return data.publicUrl;
}

async function adminSaveDest(){
  if(!adminRequireWrite()) return;
  const saveBtn = document.getElementById('adfSaveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const video = await mediaUploadVideoIfNeeded('adf');
    const images = __mediaGallery.slice();
    const coverImage = images.shift() || '';

    const payload = {
      name: document.getElementById('adfName').value.trim(),
      lat: parseFloat(document.getElementById('adfLat').value),
      lng: parseFloat(document.getElementById('adfLng').value),
      category: document.getElementById('adfCat').value,
      color: document.getElementById('adfColor').value.trim() || '#0ea5e9',
      image: coverImage,
      images: images,
      description: document.getElementById('adfDesc').value.trim(),
      tip: document.getElementById('adfTip').value.trim(),
      rating: document.getElementById('adfRating').value.trim(),
      travel: document.getElementById('adfTravel').value.trim(),
      temp: document.getElementById('adfTemp').value.trim(),
      season: document.getElementById('adfSeason').value.trim(),
      video_url: video.url || null,
      video_type: video.type || null,
      featured: document.getElementById('adfFeatured').checked,
      barangay: document.getElementById('adfBarangay').value.trim(),
      google_business_url: document.getElementById('adfGbp').value.trim() || null,
    };
    if(!payload.name || isNaN(payload.lat) || isNaN(payload.lng) || !payload.category || !payload.barangay || !payload.description){
      alert('Complete the required fields: name, map coordinates, category, barangay, and description.');
      saveBtn.disabled = false;
      saveBtn.textContent = adminEditingDestId === 'new' ? 'Create listing' : 'Save changes';
      return;
    }
    const insideSanVicente = payload.lat >= 10.25 && payload.lat <= 10.78 && payload.lng >= 118.95 && payload.lng <= 119.45;
    if(!insideSanVicente && !confirm('These coordinates appear to be outside San Vicente. Save this listing anyway?')){
      saveBtn.disabled = false;
      saveBtn.textContent = adminEditingDestId === 'new' ? 'Create listing' : 'Save changes';
      return;
    }

    if(adminEditingDestId === 'new'){
      payload.sort_order = destinations.length;
      const { error } = await sb.from('destinations').insert(payload);
      if(error) throw error;
    } else {
      const { error } = await sb.from('destinations').update(payload).eq('id', adminEditingDestId);
      if(error) throw error;
    }
    await loadDataFromSupabase();
    adminEditingDestId = null;
    renderAdminDest();
    rebuildMarkers();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
    saveBtn.disabled = false;
    saveBtn.textContent = adminEditingDestId === 'new' ? 'Create listing' : 'Save changes';
  }
}

async function adminDeleteDest(id){
  if(!adminRequireWrite()) return;
  if(!confirm('Delete this destination?')) return;
  try {
    const { error } = await sb.from('destinations').delete().eq('id', id);
    if(error) throw error;
    await loadDataFromSupabase();
    renderAdminDest();
    rebuildMarkers();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

// ───────────── TALA ADMIN ─────────────

let talaFilterCat = 'all';
let talaSearchQuery = '';
let talaSuggestionsOpen = false;
let editingSuggestionId = null;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function talaContentLength(text){
  const len = (text||'').length;
  if(len < 150) return {label:'Short', cls:'short'};
  if(len < 500) return {label:'Medium', cls:'medium'};
  return {label:'Long', cls:'long'};
}

function adminToggleSuggestionsPanel(){
  talaSuggestionsOpen = !talaSuggestionsOpen;
  renderAdminTala();
}

function adminSuggestionsPanelHtml(){
  let html = `
    <div class="admin-field" style="font-size:.7rem;color:var(--white-dim);margin-bottom:10px;">
      These are the tappable suggestion chips shown when Tala opens. Set a date range to make one seasonal (e.g. surf season Nov 1\u2013Mar 31) \u2014 leave it blank to always show.
    </div>
    <button class="admin-add-btn" onclick="adminNewSuggestion()">+ Add suggestion</button>`;

  if(editingSuggestionId !== null){
    html += adminSuggestionFormHtml();
  }

  if(!talaSuggestions.length){
    html += `<div class="admin-empty">No suggestions yet.</div>`;
  } else {
    html += talaSuggestions.map(s=>{
      const active = isSuggestionActiveToday(s);
      const rangeLabel = (s.active_from_month && s.active_to_month)
        ? `${MONTH_NAMES[s.active_from_month-1]} ${s.active_from_day||1} \u2013 ${MONTH_NAMES[s.active_to_month-1]} ${s.active_to_day||28}`
        : 'Always shown';
      return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditSuggestion(${s.id})" style="flex:1;cursor:pointer;">
            <div class="admin-tala-badges">
              <span class="admin-len-pill" style="${active?'color:#5eead4;background:rgba(20,184,166,.14)':''}">${active ? 'Active now' : 'Not active now'}</span>
              <span class="admin-len-pill">${rangeLabel}</span>
            </div>
            <strong>${escapeHtml(s.text)}</strong>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditSuggestion(${s.id})">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteSuggestion(${s.id})">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  return html;
}

function adminSuggestionFormHtml(){
  const isNew = editingSuggestionId === 'new';
  const s = isNew ? {text:'',active_from_month:'',active_from_day:'',active_to_month:'',active_to_day:''} : talaSuggestions.find(x=>x.id===editingSuggestionId);
  if(!s) return '';
  const monthOptions = (selected)=> `<option value="">\u2014</option>` + MONTH_NAMES.map((m,i)=>`<option value="${i+1}" ${selected==i+1?'selected':''}>${m}</option>`).join('');
  return `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Suggestion text</label><input id="asfText" value="${escapeHtml(s.text)}" placeholder="e.g. Best beaches in San Vicente"></div>
      <div class="admin-field" style="font-size:.68rem;color:var(--white-dim);">Optional seasonal range (leave all on \u2014 for always-on)</div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>From month</label><select id="asfFromM">${monthOptions(s.active_from_month)}</select></div>
        <div class="admin-field"><label>From day</label><input id="asfFromD" type="number" min="1" max="31" value="${s.active_from_day||''}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>To month</label><select id="asfToM">${monthOptions(s.active_to_month)}</select></div>
        <div class="admin-field"><label>To day</label><input id="asfToD" type="number" min="1" max="31" value="${s.active_to_day||''}"></div>
      </div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveSuggestion()">${isNew?'Create':'Save changes'}</button>
        <button class="admin-cancel-btn" onclick="editingSuggestionId=null;renderAdminTala();">Cancel</button>
      </div>
    </div>`;
}

function adminNewSuggestion(){ editingSuggestionId='new'; renderAdminTala(); }
function adminEditSuggestion(id){ editingSuggestionId=id; renderAdminTala(); }

async function adminSaveSuggestion(){
  const text = document.getElementById('asfText').value.trim();
  if(!text){ alert('Suggestion text is required.'); return; }

  const fromM = document.getElementById('asfFromM').value;
  const fromD = document.getElementById('asfFromD').value;
  const toM = document.getElementById('asfToM').value;
  const toD = document.getElementById('asfToD').value;

  const payload = {
    text,
    active_from_month: fromM ? parseInt(fromM) : null,
    active_from_day: fromD ? parseInt(fromD) : null,
    active_to_month: toM ? parseInt(toM) : null,
    active_to_day: toD ? parseInt(toD) : null,
  };

  try {
    if(editingSuggestionId === 'new'){
      payload.sort_order = talaSuggestions.length;
      const { error } = await sb.from('tala_suggestions').insert(payload);
      if(error) throw error;
    } else {
      const { error } = await sb.from('tala_suggestions').update(payload).eq('id', editingSuggestionId);
      if(error) throw error;
    }
    await loadDataFromSupabase();
    editingSuggestionId = null;
    renderAdminTala();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminDeleteSuggestion(id){
  if(!confirm('Delete this suggestion?')) return;
  try {
    const { error } = await sb.from('tala_suggestions').delete().eq('id', id);
    if(error) throw error;
    await loadDataFromSupabase();
    renderAdminTala();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

// ───────────── TALA AI ADMIN (OpenRouter) ─────────────

const TALA_AI_DEFAULT_MODEL = 'google/gemini-2.5-flash';
const TALA_AI_FALLBACK_MODELS = {
  free: [
    'google/gemini-2.5-flash',
    'qwen/qwen3-30b-a3b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'mistralai/mistral-small-3.1-24b-instruct:free'
  ],
  paid: [
    'openai/gpt-4o-mini',
    'openai/gpt-4.1-mini',
    'anthropic/claude-3-5-haiku',
    'google/gemini-2.5-pro',
    'deepseek/deepseek-chat'
  ]
};
let talaAiModelsCache = null;

async function fetchOpenRouterModels(){
  if(talaAiModelsCache) return talaAiModelsCache;
  const free = [], paid = [];
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models');
    if(r.ok){
      const j = await r.json();
      (j.data || []).forEach(m=>{
        const cost = parseFloat(m.pricing && m.pricing.prompt);
        (cost === 0 ? free : paid).push(m.id);
      });
      free.sort(); paid.sort();
    }
  } catch(e){ /* offline — use curated fallback below */ }
  talaAiModelsCache = {
    free: free.length ? free : TALA_AI_FALLBACK_MODELS.free.slice(),
    paid: paid.length ? paid : TALA_AI_FALLBACK_MODELS.paid.slice()
  };
  return talaAiModelsCache;
}

async function renderAdminTalaAi(){
  const body = document.getElementById('adminBody');
  body.innerHTML = `
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin-bottom:12px;line-height:1.6;">
      Route Tala's answers to a live AI model through OpenRouter — called directly from the browser, no server needed. Paste your OpenRouter API key below, pick a model, then hit <strong style="color:var(--white-soft)">Save</strong> and the light goes green when the model replies. If the key or model fail, Tala silently falls back to the keyword answers you manage in the <strong style="color:var(--white-soft)">Tala Answers</strong> tab.
    </div>
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>OpenRouter API key <span style="text-transform:none;letter-spacing:0;color:var(--white-dim)">(sk-or-v1-…, from openrouter.ai/keys)</span></label>
        <input type="password" id="aiKeyInput" placeholder="sk-or-v1-••••" autocomplete="off">
      </div>
      <div class="admin-toggle-row">
        <label>Live AI answers enabled</label>
        <input type="checkbox" id="aiEnabledCb">
      </div>
      <div class="admin-field" style="margin-top:12px">
        <label>Model</label>
        <select id="aiModelSel"><option>Loading models…</option></select>
      </div>
      <div class="admin-field">
        <label>Custom model ID <span style="text-transform:none;letter-spacing:0;color:var(--white-dim)">(overrides dropdown, e.g. google/gemini-2.5-flash)</span></label>
        <input type="text" id="aiModelCustom" placeholder="OpenRouter model id">
      </div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveAiConfig()">${lucideSvg('save',14)} Save AI config</button>
        <button class="admin-cancel-btn" onclick="adminTestAi()">${lucideSvg('zap',12)} Test</button>
      </div>
      <div id="aiTestOut" style="font-size:.72rem;margin-top:8px;color:var(--white-dim);min-height:14px;"></div>
    </div>
    <div class="admin-empty" style="padding:14px 0">Free &amp; paid models load here from openrouter.ai…</div>`;

  document.getElementById('aiKeyInput').value = talaAiKey || '';
  document.getElementById('aiEnabledCb').checked = !!talaAiEnabled;
  document.getElementById('aiModelCustom').value = talaAiModel || '';

  const models = await fetchOpenRouterModels();
  const sel = document.getElementById('aiModelSel');
  const cur = talaAiModel;
  let html = '';
  if(models.free.length){
    html += `<optgroup label="Free models">`;
    models.free.forEach(id=>{ html += `<option value="${escapeHtml(id)}" ${cur===id?'selected':''}>${escapeHtml(id)}</option>`; });
    html += `</optgroup>`;
  }
  if(models.paid.length){
    html += `<optgroup label="Paid models">`;
    models.paid.forEach(id=>{ html += `<option value="${escapeHtml(id)}" ${cur===id?'selected':''}>${escapeHtml(id)}</option>`; });
    html += `</optgroup>`;
  }
  sel.innerHTML = html || '<option value="' + escapeHtml(TALA_AI_DEFAULT_MODEL) + '">' + escapeHtml(TALA_AI_DEFAULT_MODEL) + '</option>';

  refreshAiServerStatus();
}

// Green-light checker: actually calls OpenRouter with the currently entered
// key + model. Colors the status line. No server involved.
async function refreshAiServerStatus(){
  const key = (document.getElementById('aiKeyInput') ? document.getElementById('aiKeyInput').value : talaAiKey || '').trim();
  const sel = document.getElementById('aiModelSel');
  const custom = document.getElementById('aiModelCustom');
  const model = (custom && custom.value.trim()) || (sel && sel.value) || talaAiModel || TALA_AI_DEFAULT_MODEL;
  const out = document.getElementById('aiTestOut');
  if(!out) return;

  if(!key){
    out.innerHTML = `<span style="color:#fbbf24">${lucideSvg('x',12)} No OpenRouter API key yet — paste one above and save.</span>`;
    return;
  }
  out.innerHTML = `<span style="color:#fbbf24">${lucideSvg('refresh-cw',12)} Checking <b>${escapeHtml(model)}</b> with your key…</span>`;
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + key},
      body: JSON.stringify({ model, max_tokens: 8, messages:[{ role:'user', content:'Say "ok".' }] })
    });
    const j = await r.json().catch(()=>({}));
    if(r.ok){
      const reply = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
      out.innerHTML = `<span style="color:#5eead4">${lucideSvg('check',12)} Connected — ${escapeHtml(model)} replied: “${escapeHtml(reply.slice(0,60))}”</span>`;
    } else {
      const e = (j && j.error) ? (j.error.message || j.error.type || '') : ('HTTP ' + r.status);
      out.innerHTML = `<span style="color:#f87171">${lucideSvg('x',12)} ${escapeHtml(model)} failed — ${escapeHtml(String(e).slice(0,200))}. Try another model.</span>`;
    }
  } catch(e){
    out.innerHTML = `<span style="color:#f87171">${lucideSvg('x',12)} Can't reach OpenRouter — ${escapeHtml(String(e && e.message || e).slice(0,200))}</span>`;
  }
}

async function adminSaveAiConfig(){
  const sel = document.getElementById('aiModelSel');
  const custom = document.getElementById('aiModelCustom').value.trim();
  const model = custom || (sel && sel.value) || TALA_AI_DEFAULT_MODEL;
  const enabled = document.getElementById('aiEnabledCb').checked;
  const key = (document.getElementById('aiKeyInput').value || '').trim();
  const out = document.getElementById('aiTestOut');
  out.textContent = 'Saving…';
  try {
    const rows = [
      { key:'ai_enabled', value: enabled ? 'true' : 'false' },
      { key:'ai_model', value: model }
    ];
    if(key) rows.push({ key:'ai_key', value: key });
    const { error } = await sb.from('tala_settings').upsert(rows);
    if(error) throw error;
    talaAiEnabled = enabled;
    talaAiModel = model;
    if(key) talaAiKey = key;
    refreshAdminAiBadge();
    out.innerHTML = `<span style="color:#5eead4">${lucideSvg('check',12)} Saved.</span> Live AI ${enabled?'on':'off'} · ${escapeHtml(model)}`;
    refreshAiServerStatus();
  } catch(err){
    out.textContent = 'Save failed: ' + (err.message || err);
    out.style.color = '#f87171';
  }
}

async function adminTestAi(){
  const sel = document.getElementById('aiModelSel');
  const custom = document.getElementById('aiModelCustom').value.trim();
  const model = custom || (sel && sel.value) || TALA_AI_DEFAULT_MODEL;
  const out = document.getElementById('aiTestOut');
  out.textContent = 'Asking ' + model + '…';
  out.style.color = 'var(--white-dim)';
  try {
    const key = (document.getElementById('aiKeyInput').value || '').trim();
    if(!key){ out.textContent = 'Paste your OpenRouter API key first.'; out.style.color = '#fbbf24'; return; }
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + key},
      body: JSON.stringify({
        model, max_tokens: 80, temperature: 0.6,
        messages:[{ role:'system', content: TALA_BASE_PROMPT }, { role:'user', content:'Say hello as tala, the warm San Vicente travel concierge. Under 10 words.' }]
      })
    });
    const j = await r.json().catch(()=>({}));
    if(r.ok){
      const reply = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
      out.innerHTML = `<span style="color:#5eead4">${lucideSvg('check',12)} Reply:</span> ${escapeHtml(reply.slice(0,300))}`;
    } else {
      const e = (j && j.error) ? (j.error.message || j.error.type || '') : ('HTTP ' + r.status);
      out.innerHTML = `<span style="color:#f87171">${lucideSvg('x',12)} ${escapeHtml(String(e).slice(0,200))}</span>`;
    }
  } catch(err){
    out.textContent = 'Request failed: ' + (err.message || err);
    out.style.color = '#f87171';
  }
}

// ───────────── SITE SETTINGS ADMIN (hero title/subtitle) ─────────────

function renderAdminSite(){
  const body = document.getElementById('adminBody');
  body.innerHTML = `
    <div class="admin-field" style="margin-top:4px;">
      <label>Hero title (shown over the map — basic HTML like &lt;br&gt; and &lt;em&gt; allowed)</label>
      <textarea id="adsHeroTitle" rows="2" onblur="adminSaveHeroTitle()">${escapeHtml(heroTitle)}</textarea>
    </div>
    <div class="admin-field">
      <label>Hero subtitle (optional, smaller line under the title)</label>
      <textarea id="adsHeroSubtitle" rows="2" onblur="adminSaveHeroSubtitle()">${escapeHtml(heroSubtitle)}</textarea>
    </div>
    <div class="admin-field" style="margin-top:18px;">
      <label>Loading screen subtext (the 2-line tagline under the SANVIC logo — use &lt;br&gt; for the line break)</label>
      <textarea id="adsSplashSubtext" rows="2" onblur="adminSaveSplashSubtext()">${escapeHtml(splashSubtext)}</textarea>
    </div>
    <div class="admin-field">
      <label>Loading screen footer (small caps text at the bottom of the loader)</label>
      <textarea id="adsSplashFooter" rows="1" onblur="adminSaveSplashFooter()">${escapeHtml(splashFooter)}</textarea>
    </div>
    <div class="admin-empty" style="margin-top:6px;">Saves automatically when you click away from a field. Changes appear for every visitor.</div>`;
}

async function adminSaveHeroTitle(){
  const val = document.getElementById('adsHeroTitle').value.trim();
  if(val === heroTitle) return;
  const finalVal = val || DEFAULT_HERO_TITLE;
  try {
    const { error } = await sb.from('site_settings').upsert({ key: 'hero_title', value: finalVal });
    if(error) throw error;
    heroTitle = finalVal;
    applyHeroText();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminSaveHeroSubtitle(){
  const val = document.getElementById('adsHeroSubtitle').value.trim();
  if(val === heroSubtitle) return;
  try {
    const { error } = await sb.from('site_settings').upsert({ key: 'hero_subtitle', value: val });
    if(error) throw error;
    heroSubtitle = val;
    applyHeroText();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminSaveSplashSubtext(){
  const val = document.getElementById('adsSplashSubtext').value.trim();
  if(val === splashSubtext) return;
  const finalVal = val || DEFAULT_SPLASH_SUBTEXT;
  try {
    const { error } = await sb.from('site_settings').upsert({ key: 'splash_subtext', value: finalVal });
    if(error) throw error;
    splashSubtext = finalVal;
    applySplashText();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminSaveSplashFooter(){
  const val = document.getElementById('adsSplashFooter').value.trim();
  if(val === splashFooter) return;
  const finalVal = val || DEFAULT_SPLASH_FOOTER;
  try {
    const { error } = await sb.from('site_settings').upsert({ key: 'splash_footer', value: finalVal });
    if(error) throw error;
    splashFooter = finalVal;
    applySplashText();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

// ───────────── REUSABLE MEDIA UPLOAD ─────────────
// Shared by Destinations, Tribes, Events admin forms.
// Manages an array of image URLs + optional YouTube/uploaded video.
// ──────────────────────────────────────────────────

let __mediaGallery = [];    // current image URLs being edited
let __mediaPrefix = 'item'; // storage path prefix (dest_, tribe_, event_)

function mediaGalleryHtml(containerId, prefix){
  __mediaPrefix = prefix || 'item';
  const imgs = (__mediaGallery || []).map((url, i) => `
    <div class="admin-media-thumb">
      <img src="${escapeHtml(url)}" onerror="this.parentElement.style.display='none'">
      <button class="admin-media-del" onclick="mediaRemoveImage(${i},'${containerId}')">&times;</button>
    </div>`).join('');
  return `
    <label>Gallery images (tap + to upload from device, or paste a URL)</label>
    <div class="admin-media-grid" id="${containerId}Gallery">${imgs}
      <label class="admin-media-add">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="mediaUploadFile(this,'${containerId}')" hidden>
        <span>+</span>
      </label>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <input id="${containerId}UrlInput" placeholder="Or paste image URL…" style="flex:1;padding:7px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
      <button class="admin-mini-btn" onclick="mediaAddUrl('${containerId}')">Add URL</button>
    </div>`;
}

function mediaAddUrl(containerId){
  const inp = document.getElementById(containerId + 'UrlInput');
  const url = (inp.value || '').trim();
  if(!url) return;
  __mediaGallery.push(url);
  inp.value = '';
  mediaRefreshGrid(containerId);
}

async function mediaUploadFile(input, containerId){
  const file = input.files[0];
  if(!file) return;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = __mediaPrefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
  try {
    const { error } = await sb.storage.from('destination-images').upload(path, file, { cacheControl:'3600', upsert:false, contentType: file.type || 'image/jpeg' });
    if(error) throw error;
    const { data } = sb.storage.from('destination-images').getPublicUrl(path);
    if(data && data.publicUrl){
      __mediaGallery.push(data.publicUrl);
      mediaRefreshGrid(containerId);
    }
  } catch(e){ alert('Upload failed: ' + e.message); }
  input.value = '';
}

function mediaRemoveImage(idx, containerId){
  __mediaGallery.splice(idx, 1);
  mediaRefreshGrid(containerId);
}

function mediaRefreshGrid(containerId){
  const grid = document.getElementById(containerId + 'Gallery');
  if(!grid) return;
  const addBtn = grid.querySelector('.admin-media-add');
  const thumbs = (__mediaGallery || []).map((url, i) => `
    <div class="admin-media-thumb">
      <img src="${escapeHtml(url)}" onerror="this.parentElement.style.display='none'">
      <button class="admin-media-del" onclick="mediaRemoveImage(${i},'${containerId}')">&times;</button>
    </div>`).join('');
  grid.innerHTML = thumbs + (addBtn ? addBtn.outerHTML : `<label class="admin-media-add"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="mediaUploadFile(this,'${containerId}')" hidden><span>+</span></label>`);
}

function mediaVideoHtml(containerId, currentUrl, currentType){
  const vType = currentType || 'none';
  return `
    <div class="admin-field">
      <label>Video (shown instead of gallery when set)</label>
      <select id="${containerId}VideoType" onchange="document.getElementById('${containerId}YoutubeWrap').style.display=this.value==='youtube'?'':'none';document.getElementById('${containerId}UploadWrap').style.display=this.value==='upload'?'':'none';">
        <option value="none" ${vType==='none'?'selected':''}>No video</option>
        <option value="youtube" ${vType==='youtube'?'selected':''}>YouTube URL</option>
        <option value="upload" ${vType==='upload'?'selected':''}>Upload from device</option>
      </select>
    </div>
    <div class="admin-field" id="${containerId}YoutubeWrap" style="display:${vType==='youtube'?'':'none'}">
      <label>YouTube URL</label>
      <input id="${containerId}YoutubeUrl" value="${vType==='youtube'?escapeHtml(currentUrl||''):''}" placeholder="https://youtube.com/watch?v=…">
    </div>
    <div class="admin-field" id="${containerId}UploadWrap" style="display:${vType==='upload'?'':'none'}">
      <label>Video file (mp4/webm, up to 100MB)</label>
      <input type="file" id="${containerId}VideoFile" accept="video/mp4,video/webm,video/quicktime">
      ${vType==='upload' && currentUrl ? '<div style="font-size:.68rem;color:var(--white-dim);margin-top:4px;">Current: <a href="'+currentUrl+'" target="_blank" style="color:var(--ocean-teal-light)">view video</a></div>' : ''}
      <input type="hidden" id="${containerId}VideoUploadedUrl" value="${vType==='upload'?escapeHtml(currentUrl||''):''}">
    </div>`;
}

async function mediaUploadVideoIfNeeded(containerId){
  const type = document.getElementById(containerId + 'VideoType');
  if(!type) return { url:null, type:null };
  const vType = type.value;
  if(vType === 'youtube'){
    return { url: (document.getElementById(containerId+'YoutubeUrl')||{}).value||'', type:'youtube' };
  }
  if(vType === 'upload'){
    const fileInput = document.getElementById(containerId+'VideoFile');
    const hiddenUrl = (document.getElementById(containerId+'VideoUploadedUrl')||{}).value||'';
    if(fileInput && fileInput.files[0]){
      const file = fileInput.files[0];
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = __mediaPrefix + '_vid_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
      const { error } = await sb.storage.from('destination-images').upload(path, file, { cacheControl:'3600', upsert:false, contentType: file.type || 'video/mp4' });
      if(error) throw error;
      const { data } = sb.storage.from('destination-images').getPublicUrl(path);
      return { url: data.publicUrl, type:'upload' };
    }
    return { url: hiddenUrl || null, type: hiddenUrl ? 'upload' : null };
  }
  return { url:null, type:null };
}

// ───────────── TODAY ADMIN ─────────────
let adminTodayData = null;

async function loadTodayContent(){
  try {
    const { data, error } = await sb.from('today_content').select('key,data');
    if(error) throw error;
    if(data && data.length){
      adminTodayData = {};
      data.forEach(r=>{ adminTodayData[r.key] = r.data; });
    }
  } catch(e){ console.warn('[ADMIN] today_content load failed:', e); }
  if(!adminTodayData) adminTodayData = JSON.parse(JSON.stringify(TODAY_DATA));
}

// ───────────── TODAY ADMIN ─────────────
let __todayHappeningGalleries = {};
let __todayLocalGalleries = {};
let __todayNextHid = 0;
let __todayNextLid = 0;

function todayItemGalleryHtml(itemId, prefix, galleryMap, itemLabel){
  const imgs = (galleryMap[itemId] || []).map((url, i) => `
    <div class="admin-media-thumb">
      <img src="${escapeHtml(url)}" onerror="this.parentElement.style.display='none'">
      <button class="admin-media-del" onclick="todayRemoveItemImage('${itemId}',${i},'${prefix}')">&times;</button>
    </div>`).join('');
  return `
    <label>Gallery images (tap + to upload from device, or paste a URL)</label>
    <div class="admin-media-grid" id="${prefix}${itemId}Gallery">${imgs}
      <label class="admin-media-add">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="todayUploadItemImage(this,'${itemId}','${prefix}')" hidden>
        <span>+</span>
      </label>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <input id="${prefix}${itemId}UrlInput" placeholder="Or paste image URL…" style="flex:1;padding:7px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
      <button class="admin-mini-btn" onclick="todayAddItemImageUrl('${itemId}','${prefix}')">Add URL</button>
    </div>`;
}

function todayAddItemImageUrl(itemId, prefix){
  const inp = document.getElementById(prefix + itemId + 'UrlInput');
  const url = (inp.value || '').trim();
  if(!url) return;
  if(prefix === 'happening'){
    if(!__todayHappeningGalleries[itemId]) __todayHappeningGalleries[itemId] = [];
    __todayHappeningGalleries[itemId].push(url);
  } else {
    if(!__todayLocalGalleries[itemId]) __todayLocalGalleries[itemId] = [];
    __todayLocalGalleries[itemId].push(url);
  }
  inp.value = '';
  todayRefreshItemGallery(itemId, prefix);
}

async function todayUploadItemImage(input, itemId, prefix){
  const file = input.files[0];
  if(!file) return;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = 'today_' + prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
  try {
    const { error } = await sb.storage.from('destination-images').upload(path, file, { cacheControl:'3600', upsert:false, contentType: file.type || 'image/jpeg' });
    if(error) throw error;
    const { data } = sb.storage.from('destination-images').getPublicUrl(path);
    if(data && data.publicUrl){
      if(prefix === 'happening'){
        if(!__todayHappeningGalleries[itemId]) __todayHappeningGalleries[itemId] = [];
        __todayHappeningGalleries[itemId].push(data.publicUrl);
      } else {
        if(!__todayLocalGalleries[itemId]) __todayLocalGalleries[itemId] = [];
        __todayLocalGalleries[itemId].push(data.publicUrl);
      }
      todayRefreshItemGallery(itemId, prefix);
    }
  } catch(e){ alert('Upload failed: ' + e.message); }
  input.value = '';
}

function todayRemoveItemImage(itemId, idx, prefix){
  if(prefix === 'happening'){
    if(__todayHappeningGalleries[itemId]) __todayHappeningGalleries[itemId].splice(idx, 1);
  } else {
    if(__todayLocalGalleries[itemId]) __todayLocalGalleries[itemId].splice(idx, 1);
  }
  todayRefreshItemGallery(itemId, prefix);
}

function todayRefreshItemGallery(itemId, prefix){
  const grid = document.getElementById(prefix + itemId + 'Gallery');
  if(!grid) return;
  const galleryMap = prefix === 'happening' ? __todayHappeningGalleries : __todayLocalGalleries;
  const imgs = (galleryMap[itemId] || []).map((url, i) => `
    <div class="admin-media-thumb">
      <img src="${escapeHtml(url)}" onerror="this.parentElement.style.display='none'">
      <button class="admin-media-del" onclick="todayRemoveItemImage('${itemId}',${i},'${prefix}')">&times;</button>
    </div>`).join('');
  grid.innerHTML = imgs + `
    <label class="admin-media-add">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="todayUploadItemImage(this,'${itemId}','${prefix}')" hidden>
      <span>+</span>
    </label>`;
}

function todayRemoveHappening(id){
  delete __todayHappeningGalleries[id];
  const el = document.getElementById('happeningCard_' + id);
  if(el) el.remove();
}

function todayRemoveLocal(id){
  delete __todayLocalGalleries[id];
  const el = document.getElementById('localCard_' + id);
  if(el) el.remove();
}

function todayBuildHappeningCard(id, e){
  __todayHappeningGalleries[id] = (e && e.images && Array.isArray(e.images)) ? e.images.slice() : [];
  const title = e ? escapeHtml(e.title||'') : '';
  const place = e ? escapeHtml(e.place||'') : '';
  const time = e ? escapeHtml(e.time||'') : '';
  const dist = e ? escapeHtml(e.dist||'') : '';
  const vibe = e ? escapeHtml(e.vibe||'') : '';
  return `
    <div class="admin-list-item" id="happeningCard_${id}">
      <div class="admin-list-item-head">
        <div style="flex:1;">
          <input id="hapTitle_${id}" value="${title}" placeholder="Title" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;margin-bottom:4px;">
          <div class="admin-grid-2" style="margin-top:4px;">
            <input id="hapPlace_${id}" value="${place}" placeholder="Place" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
            <input id="hapTime_${id}" value="${time}" placeholder="Time" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
          </div>
          <div class="admin-grid-2" style="margin-top:4px;">
            <input id="hapDist_${id}" value="${dist}" placeholder="Distance" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
            <input id="hapVibe_${id}" value="${vibe}" placeholder="Vibe" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
          </div>
        </div>
        <button class="admin-mini-btn danger" onclick="todayRemoveHappening('${id}')">&times;</button>
      </div>
      <div style="padding:0 8px 8px;">${todayItemGalleryHtml(id, 'happening', __todayHappeningGalleries, 'event')}</div>
    </div>`;
}

function todayAddHappeningCard(){
  const id = 'h_' + (++__todayNextHid);
  const div = document.createElement('div');
  div.innerHTML = todayBuildHappeningCard(id, null);
  document.getElementById('todayHappeningCards').appendChild(div.firstElementChild);
}

function todayBuildLocalCard(id, l){
  __todayLocalGalleries[id] = (l && l.images && Array.isArray(l.images)) ? l.images.slice() : [];
  const badge = l ? escapeHtml(l.badge||'') : '';
  const biz = l ? escapeHtml(l.biz||'') : '';
  const text = l ? escapeHtml(l.text||'') : '';
  const meta = l ? escapeHtml(l.meta||'') : '';
  return `
    <div class="admin-list-item" id="localCard_${id}">
      <div class="admin-list-item-head">
        <div style="flex:1;">
          <div class="admin-grid-2">
            <input id="locBadge_${id}" value="${badge}" placeholder="Badge (emoji)" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
            <input id="locBiz_${id}" value="${biz}" placeholder="Business name" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
          </div>
          <input id="locText_${id}" value="${text}" placeholder="Tip text" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;margin-top:4px;">
          <input id="locMeta_${id}" value="${meta}" placeholder="Meta" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;margin-top:4px;">
        </div>
        <button class="admin-mini-btn danger" onclick="todayRemoveLocal('${id}')">&times;</button>
      </div>
      <div style="padding:0 8px 8px;">${todayItemGalleryHtml(id, 'local', __todayLocalGalleries, 'tip')}</div>
    </div>`;
}

function todayAddLocalCard(){
  const id = 'l_' + (++__todayNextLid);
  const div = document.createElement('div');
  div.innerHTML = todayBuildLocalCard(id, null);
  document.getElementById('todayLocalCards').appendChild(div.firstElementChild);
}

async function renderAdminToday(){
  const body = document.getElementById('adminBody');
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  await loadTodayContent();
  const d = adminTodayData;
  const happening = (d.happening||[]);
  const joinable = (d.joinable||[]);
  const weather = (d.weather||[]);
  const locals = (d.locals||[]);
  const notices = (d.notices||[]);
  const path = (d.talaPick && d.talaPick.path) || [];

  __todayHappeningGalleries = {};
  __todayLocalGalleries = {};
  __todayNextHid = 0;
  __todayNextLid = 0;

  let happeningCardsHtml = '';
  happening.forEach((e, i) => {
    const id = 'e' + i;
    happeningCardsHtml += todayBuildHappeningCard(id, e);
  });
  let localCardsHtml = '';
  locals.forEach((l, i) => {
    const id = 'll' + i;
    localCardsHtml += todayBuildLocalCard(id, l);
  });

  body.innerHTML = `
    <div class="admin-field">
      <label>TALA's pick intro</label>
      <textarea id="atPickIntro" rows="2">${escapeHtml((d.talaPick||{}).intro||'')}</textarea>
    </div>
    <div class="admin-field">
      <label>TALA's pick path (one per line: Label | Sub)</label>
      <textarea id="atPickPath" rows="3">${path.map(p=> p.label+' | '+p.sub).join('\n')}</textarea>
    </div>
    <div class="admin-field">
      <label>Happening today</label>
      <div id="todayHappeningCards">${happeningCardsHtml}</div>
      <button class="admin-add-btn" onclick="todayAddHappeningCard()" style="margin-top:8px;">+ Add event</button>
    </div>
    <div class="admin-field">
      <label>Joinable today (one per line: Title | Detail | Crowd)</label>
      <textarea id="atJoinable" rows="3">${joinable.map(j=> [j.title,j.detail,j.crowd].join(' | ')).join('\n')}</textarea>
    </div>
    <div class="admin-field">
      <label>Weather verdicts (one per line: Icon | Label | Verdict)</label>
      <textarea id="atWeather" rows="3">${weather.map(w=> [w.icon,w.label,w.verdict].join(' | ')).join('\n')}</textarea>
    </div>
    <div class="admin-field">
      <label>Local tips</label>
      <div id="todayLocalCards">${localCardsHtml}</div>
      <button class="admin-add-btn" onclick="todayAddLocalCard()" style="margin-top:8px;">+ Add tip</button>
    </div>
    <div class="admin-field">
      <label>Notices (one per line: Text)</label>
      <textarea id="atNotices" rows="2">${notices.map(n=> n.text).join('\n')}</textarea>
    </div>
    <div class="admin-edit-actions">
      <button class="admin-save-btn" onclick="adminSaveToday()">${lucideSvg('save',14)} Save Today content</button>
      <span id="atStatus" style="font-size:.72rem;color:var(--white-dim);margin-left:8px;"></span>
    </div>`;
}

function parseLines(text, fieldCount){
  return text.split('\n').map(l=>l.trim()).filter(Boolean).map(line=>{
    const parts = line.split('|').map(s=>s.trim());
    while(parts.length < fieldCount) parts.push('');
    return parts;
  });
}

function collectTodayHappeningItems(){
  const cards = document.querySelectorAll('[id^="happeningCard_"]');
  const items = [];
  cards.forEach(card => {
    const id = card.id.replace('happeningCard_', '');
    const title = (document.getElementById('hapTitle_' + id)||{}).value||'';
    if(!title.trim()) return;
    items.push({
      title: title.trim(),
      place: ((document.getElementById('hapPlace_' + id)||{}).value||'').trim(),
      time: ((document.getElementById('hapTime_' + id)||{}).value||'').trim(),
      dist: ((document.getElementById('hapDist_' + id)||{}).value||'').trim(),
      vibe: ((document.getElementById('hapVibe_' + id)||{}).value||'').trim(),
      images: (__todayHappeningGalleries[id] || []).slice()
    });
  });
  return items;
}

function collectTodayLocalItems(){
  const cards = document.querySelectorAll('[id^="localCard_"]');
  const items = [];
  cards.forEach(card => {
    const id = card.id.replace('localCard_', '');
    const text = (document.getElementById('locText_' + id)||{}).value||'';
    if(!text.trim()) return;
    items.push({
      badge: ((document.getElementById('locBadge_' + id)||{}).value||'').trim(),
      biz: ((document.getElementById('locBiz_' + id)||{}).value||'').trim(),
      text: text.trim(),
      meta: ((document.getElementById('locMeta_' + id)||{}).value||'').trim(),
      images: (__todayLocalGalleries[id] || []).slice()
    });
  });
  return items;
}

async function adminSaveToday(){
  const status = document.getElementById('atStatus');
  status.textContent = 'Saving…';
  try {
    const pickIntro = document.getElementById('atPickIntro').value.trim();
    const pickPath = parseLines(document.getElementById('atPickPath').value, 2).map(p=>({ label:p[0], sub:p[1] }));
    const happening = collectTodayHappeningItems();
    const joinable = parseLines(document.getElementById('atJoinable').value, 3).map(p=>({ title:p[0], detail:p[1], crowd:parseInt(p[2])||0 }));
    const weather = parseLines(document.getElementById('atWeather').value, 3).map(p=>({ icon:p[0], label:p[1], verdict:p[2] }));
    const locals = collectTodayLocalItems();
    const notices = parseLines(document.getElementById('atNotices').value, 1).map(p=>({ text:p[0] }));

    const rows = [
      { key:'tala_pick', data:{ intro: pickIntro, path: pickPath } },
      { key:'happening', data: happening },
      { key:'joinable', data: joinable },
      { key:'weather', data: weather },
      { key:'locals', data: locals },
      { key:'notices', data: notices },
    ];
    const { error } = await sb.from('today_content').upsert(rows, { onConflict:'key' });
    if(error) throw error;
    status.innerHTML = '<span style="color:#5eead4">✓ Saved</span>';
    TODAY_DATA.talaPick = { intro: pickIntro, path: pickPath };
    TODAY_DATA.happening = happening;
    TODAY_DATA.joinable = joinable;
    TODAY_DATA.weather = weather;
    TODAY_DATA.locals = locals;
    TODAY_DATA.notices = notices;
  } catch(err){
    status.innerHTML = '<span style="color:#f87171">Failed: ' + escapeHtml(err.message) + '</span>';
  }
}



async function renderAdminTribes(){
  const body = document.getElementById('adminBody');
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let tribes = [];
  try {
    const { data, error } = await sb.from('tribes').select('*').order('sort_order');
    if(error) throw error;
    tribes = data || [];
  } catch(e){
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  let html = `<button class="admin-add-btn" onclick="adminEditTribe('new')">+ Add tribe</button>`;

  if(!tribes.length){
    html += '<div class="admin-empty">No tribes yet. Add one above.</div>';
  } else {
    tribes.forEach(t=>{
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(t.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(t.where_text||'')} · ${escapeHtml(t.when_text||'')}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditTribe('${t.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteTribe('${t.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminEditTribe(id){
  const body = document.getElementById('adminBody');
  const isNew = id === 'new';
  let t = { title:'', where_text:'', when_text:'', sub:'', thumb_url:'', joined:0, extra:0, cap:0, spots:null, seats_open:null, sort_order:0, images:[], video_url:null, video_type:null };
  if(!isNew){
    try {
      const { data } = await sb.from('tribes').select('*').eq('id', id).single();
      if(data) t = data;
    } catch(e){ alert('Load failed: '+e.message); return; }
  }
  // Initialize media gallery
  __mediaGallery = [];
  if(t.thumb_url) __mediaGallery.push(t.thumb_url);
  if(t.images && Array.isArray(t.images)) __mediaGallery.push(...t.images);
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="atbfTitle" value="${escapeHtml(t.title)}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Where</label><input id="atbfWhere" value="${escapeHtml(t.where_text||'')}"></div>
        <div class="admin-field"><label>When</label><input id="atbfWhen" value="${escapeHtml(t.when_text||'')}"></div>
      </div>
      <div class="admin-field"><label>Subtitle</label><input id="atbfSub" value="${escapeHtml(t.sub||'')}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Joined</label><input type="number" id="atbfJoined" value="${t.joined||0}"></div>
        <div class="admin-field"><label>Extra (+N)</label><input type="number" id="atbfExtra" value="${t.extra||0}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Capacity</label><input type="number" id="atbfCap" value="${t.cap||0}"></div>
        <div class="admin-field"><label>Spots left</label><input type="number" id="atbfSpots" value="${t.spots||''}"></div>
      </div>
      <div class="admin-field"><label>Tags (comma-separated)</label><input id="atbfTags" value="${(t.tags||[]).join(', ')}"></div>
      ${mediaGalleryHtml('atbf','tribe')}
      ${mediaVideoHtml('atbf', t.video_url, t.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="atbfSort" value="${t.sort_order||0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveTribe('${isNew?'':id}')">${isNew?'Create':'Save'}</button>
        <button class="admin-cancel-btn" onclick="renderAdminTribes()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveTribe(id){
  const isNew = id === 'new';
  try {
    const video = await mediaUploadVideoIfNeeded('atbf');
    const images = __mediaGallery.slice();
    const thumbUrl = images.shift() || '';
    const payload = {
      title: document.getElementById('atbfTitle').value.trim(),
      where_text: document.getElementById('atbfWhere').value.trim(),
      when_text: document.getElementById('atbfWhen').value.trim(),
      sub: document.getElementById('atbfSub').value.trim(),
      thumb_url: thumbUrl,
      images: images,
      video_url: video.url || null,
      video_type: video.type || null,
      joined: parseInt(document.getElementById('atbfJoined').value)||0,
      extra: parseInt(document.getElementById('atbfExtra').value)||0,
      cap: parseInt(document.getElementById('atbfCap').value)||0,
      spots: document.getElementById('atbfSpots').value ? parseInt(document.getElementById('atbfSpots').value) : null,
      seats_open: document.getElementById('atbfSpots').value ? parseInt(document.getElementById('atbfSpots').value) : null,
      tags: document.getElementById('atbfTags').value.split(',').map(s=>s.trim()).filter(Boolean),
      sort_order: parseInt(document.getElementById('atbfSort').value)||0,
    };
    if(!payload.title){ alert('Title is required.'); return; }
    if(isNew){
      const { error } = await sb.from('tribes').insert(payload);
      if(error) throw error;
    } else {
      const { error } = await sb.from('tribes').update(payload).eq('id', id);
      if(error) throw error;
    }
    renderAdminTribes();
  } catch(err){ alert('Save failed: '+err.message); }
}

async function adminDeleteTribe(id){
  if(!confirm('Delete this tribe?')) return;
  try { await sb.from('tribes').delete().eq('id', id); renderAdminTribes(); }
  catch(e){ alert('Delete failed: '+e.message); }
}

// ───────────── EVENTS ADMIN ─────────────

async function renderAdminEvents(){
  const body = document.getElementById('adminBody');
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let events = [];
  try {
    const { data, error } = await sb.from('events').select('*').order('sort_order');
    if(error) throw error;
    events = data || [];
  } catch(e){
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  let html = `<button class="admin-add-btn" onclick="adminEditEvent('new')">+ Add event</button>`;

  if(!events.length){
    html += '<div class="admin-empty">No events yet. Add one above.</div>';
  } else {
    events.forEach(ev=>{
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(ev.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(ev.org||'')} · ${escapeHtml(ev.where_text||'')} · ${escapeHtml(ev.when_text||'')}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditEvent('${ev.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteEvent('${ev.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminEditEvent(id){
  const body = document.getElementById('adminBody');
  const isNew = id === 'new';
  let ev = { title:'', org:'', where_text:'', when_text:'', price:'', tags:[], sort_order:0, images:[], video_url:null, video_type:null };
  if(!isNew){
    try {
      const { data } = await sb.from('events').select('*').eq('id', id).single();
      if(data) ev = data;
    } catch(e){ alert('Load failed: '+e.message); return; }
  }
  __mediaGallery = (ev.images && Array.isArray(ev.images)) ? ev.images.slice() : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="aevfTitle" value="${escapeHtml(ev.title)}"></div>
      <div class="admin-field"><label>Organizer</label><input id="aevfOrg" value="${escapeHtml(ev.org||'')}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Where</label><input id="aevfWhere" value="${escapeHtml(ev.where_text||'')}"></div>
        <div class="admin-field"><label>When</label><input id="aevfWhen" value="${escapeHtml(ev.when_text||'')}"></div>
      </div>
      <div class="admin-field"><label>Price</label><input id="aevfPrice" value="${escapeHtml(ev.price||'')}"></div>
      <div class="admin-field"><label>Tags (comma-separated)</label><input id="aevfTags" value="${(ev.tags||[]).join(', ')}"></div>
      ${mediaGalleryHtml('aevf','event')}
      ${mediaVideoHtml('aevf', ev.video_url, ev.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="aevfSort" value="${ev.sort_order||0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveEvent('${isNew?'':id}')">${isNew?'Create':'Save'}</button>
        <button class="admin-cancel-btn" onclick="renderAdminEvents()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveEvent(id){
  const isNew = id === 'new';
  try {
    const video = await mediaUploadVideoIfNeeded('aevf');
    const payload = {
      title: document.getElementById('aevfTitle').value.trim(),
      org: document.getElementById('aevfOrg').value.trim(),
      where_text: document.getElementById('aevfWhere').value.trim(),
      when_text: document.getElementById('aevfWhen').value.trim(),
      price: document.getElementById('aevfPrice').value.trim(),
      tags: document.getElementById('aevfTags').value.split(',').map(s=>s.trim()).filter(Boolean),
      images: __mediaGallery.slice(),
      video_url: video.url || null,
      video_type: video.type || null,
      sort_order: parseInt(document.getElementById('aevfSort').value)||0,
    };
    if(!payload.title){ alert('Title is required.'); return; }
    if(isNew){
      const { error } = await sb.from('events').insert(payload);
      if(error) throw error;
    } else {
      const { error } = await sb.from('events').update(payload).eq('id', id);
      if(error) throw error;
    }
    renderAdminEvents();
  } catch(err){ alert('Save failed: '+err.message); }
}

async function adminDeleteEvent(id){
  if(!confirm('Delete this event?')) return;
  try { await sb.from('events').delete().eq('id', id); renderAdminEvents(); }
  catch(e){ alert('Delete failed: '+e.message); }
}

// ───────────── MYSANVIC ADMIN ─────────────

async function renderAdminMySanvic(){
  const body = document.getElementById('adminBody');
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let upcoming = [];
  try {
    const { data, error } = await sb.from('my_sanvic_upcoming').select('*').order('sort_order');
    if(error) throw error;
    upcoming = data || [];
  } catch(e){
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  let html = `
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin-bottom:12px;">
      Curate the "Upcoming" cards shown in My Sanvic. These are featured activities, events, or promotions you want visitors to see first.
    </div>
    <button class="admin-add-btn" onclick="adminEditUpcoming('new')">+ Add upcoming item</button>`;

  if(!upcoming.length){
    html += '<div class="admin-empty">No upcoming items yet. Add one above.</div>';
  } else {
    upcoming.forEach(u => {
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(u.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(u.badge||'')} · ${escapeHtml(u.meta||'')}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditUpcoming('${u.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteUpcoming('${u.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminEditUpcoming(id){
  const body = document.getElementById('adminBody');
  const isNew = id === 'new';
  let u = { badge:'', badge_style:'solid', title:'', meta:'', cta:'View', action:'', action_id:'', sort_order:0, images:[], video_url:null, video_type:null };
  if(!isNew){
    try {
      const { data } = await sb.from('my_sanvic_upcoming').select('*').eq('id', id).single();
      if(data) u = data;
    } catch(e){ alert('Load failed: '+e.message); return; }
  }
  __mediaGallery = (u.images && Array.isArray(u.images)) ? u.images.slice() : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="amuTitle" value="${escapeHtml(u.title)}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Badge text</label><input id="amuBadge" value="${escapeHtml(u.badge||'')}" placeholder="e.g. NEW, HOT, FREE"></div>
        <div class="admin-field"><label>Badge style</label>
          <select id="amuBadgeStyle">
            <option value="solid" ${u.badge_style==='solid'?'selected':''}>Solid</option>
            <option value="soft" ${u.badge_style==='soft'?'selected':''}>Soft</option>
          </select>
        </div>
      </div>
      <div class="admin-field"><label>Meta text</label><input id="amuMeta" value="${escapeHtml(u.meta||'')}" placeholder="e.g. Island Hopping · Tomorrow"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Button text</label><input id="amuCta" value="${escapeHtml(u.cta||'View')}"></div>
        <div class="admin-field"><label>Action type</label>
          <select id="amuAction">
            <option value="" ${!u.action?'selected':''}>None</option>
            <option value="dest" ${u.action==='dest'?'selected':''}>Open destination</option>
            <option value="tribe" ${u.action==='tribe'?'selected':''}>Open tribe</option>
            <option value="event" ${u.action==='event'?'selected':''}>Open event</option>
            <option value="url" ${u.action==='url'?'selected':''}>Open URL</option>
          </select>
        </div>
      </div>
      <div class="admin-field"><label>Action ID / URL</label><input id="amuActionId" value="${escapeHtml(u.action_id||'')}" placeholder="Destination ID, tribe ID, or full URL"></div>
      ${mediaGalleryHtml('amu','upcoming')}
      ${mediaVideoHtml('amu', u.video_url, u.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="amuSort" value="${u.sort_order||0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveUpcoming('${isNew?'':id}')">${isNew?'Create':'Save'}</button>
        <button class="admin-cancel-btn" onclick="renderAdminMySanvic()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveUpcoming(id){
  const isNew = id === 'new';
  try {
    const video = await mediaUploadVideoIfNeeded('amu');
    const payload = {
      badge: document.getElementById('amuBadge').value.trim(),
      badge_style: document.getElementById('amuBadgeStyle').value,
      title: document.getElementById('amuTitle').value.trim(),
      meta: document.getElementById('amuMeta').value.trim(),
      cta: document.getElementById('amuCta').value.trim() || 'View',
      action: document.getElementById('amuAction').value,
      action_id: document.getElementById('amuActionId').value.trim(),
      images: __mediaGallery.slice(),
      video_url: video.url || null,
      video_type: video.type || null,
      sort_order: parseInt(document.getElementById('amuSort').value)||0,
    };
    if(!payload.title){ alert('Title is required.'); return; }
    if(isNew){
      const { error } = await sb.from('my_sanvic_upcoming').insert(payload);
      if(error) throw error;
    } else {
      const { error } = await sb.from('my_sanvic_upcoming').update(payload).eq('id', id);
      if(error) throw error;
    }
    renderAdminMySanvic();
  } catch(err){ alert('Save failed: '+err.message); }
}

async function adminDeleteUpcoming(id){
  if(!confirm('Delete this upcoming item?')) return;
  try { await sb.from('my_sanvic_upcoming').delete().eq('id', id); renderAdminMySanvic(); }
  catch(e){ alert('Delete failed: '+e.message); }
}

// ───────────── HUNT ADMIN ─────────────

async function renderAdminHunt(){
  const body = document.getElementById('adminBody');
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let rewards = [];
  let settings = {};
  try {
    const [rewardsRes, settingsRes] = await Promise.all([
      sb.from('hunt_rewards').select('*').order('sort_order'),
      sb.from('hunt_settings').select('*')
    ]);
    if(rewardsRes.error) throw rewardsRes.error;
    rewards = rewardsRes.data || [];
    (settingsRes.data || []).forEach(r => { settings[r.key] = r.value; });
  } catch(e){
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  const featuredDestId = settings.featured_dest_id || '';
  const pointsPerUnlock = settings.points_per_unlock || 100;
  const welcomeMsg = settings.welcome_msg || '';

  let html = `
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin-bottom:12px;">
      Configure The Hunt experience. Set which destination is featured daily, reward items visitors can earn, and hunt settings.
    </div>
    <div class="admin-edit-box" style="margin-bottom:16px;">
      <div style="font-weight:600;margin-bottom:8px;font-size:.82rem;color:var(--white-soft);">Hunt Settings</div>
      <div class="admin-field"><label>Featured destination ID (today's hunt target)</label><input id="ahSettingsFeat" value="${escapeHtml(featuredDestId)}" placeholder="Destination ID from Destinations tab"></div>
      <div class="admin-field"><label>Points per unlock</label><input type="number" id="ahSettingsPoints" value="${pointsPerUnlock}"></div>
      <div class="admin-field"><label>Welcome message</label><textarea id="ahSettingsWelcome" rows="2">${escapeHtml(welcomeMsg)}</textarea></div>
      <button class="admin-save-btn" onclick="adminSaveHuntSettings()">Save settings</button>
    </div>

    <button class="admin-add-btn" onclick="adminEditReward('new')">+ Add reward</button>`;

  if(!rewards.length){
    html += '<div class="admin-empty">No rewards yet. Add one above.</div>';
  } else {
    rewards.forEach(r => {
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(r.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(r.badge||'')} · ${r.points_required} pts · ${escapeHtml(r.subtitle||'')}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditReward('${r.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteReward('${r.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminSaveHuntSettings(){
  try {
    const rows = [
      { key:'featured_dest_id', value: document.getElementById('ahSettingsFeat').value.trim() },
      { key:'points_per_unlock', value: parseInt(document.getElementById('ahSettingsPoints').value)||100 },
      { key:'welcome_msg', value: document.getElementById('ahSettingsWelcome').value.trim() },
    ];
    const { error } = await sb.from('hunt_settings').upsert(rows, { onConflict:'key' });
    if(error) throw error;
    alert('Settings saved!');
  } catch(err){ alert('Save failed: '+err.message); }
}

async function adminEditReward(id){
  const body = document.getElementById('adminBody');
  const isNew = id === 'new';
  let r = { title:'', subtitle:'', badge:'', dest_id:'', points_required:100, sort_order:0, images:[], video_url:null, video_type:null };
  if(!isNew){
    try {
      const { data } = await sb.from('hunt_rewards').select('*').eq('id', id).single();
      if(data) r = data;
    } catch(e){ alert('Load failed: '+e.message); return; }
  }
  __mediaGallery = (r.images && Array.isArray(r.images)) ? r.images.slice() : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="ahrTitle" value="${escapeHtml(r.title)}"></div>
      <div class="admin-field"><label>Subtitle</label><input id="ahrSub" value="${escapeHtml(r.subtitle||'')}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Badge text</label><input id="ahrBadge" value="${escapeHtml(r.badge||'')}" placeholder="e.g. NEW, SOON"></div>
        <div class="admin-field"><label>Points required</label><input type="number" id="ahrPoints" value="${r.points_required||100}"></div>
      </div>
      <div class="admin-field"><label>Destination ID (optional — link to a destination)</label><input id="ahrDest" value="${escapeHtml(r.dest_id||'')}"></div>
      ${mediaGalleryHtml('ahr','reward')}
      ${mediaVideoHtml('ahr', r.video_url, r.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="ahrSort" value="${r.sort_order||0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveReward('${isNew?'':id}')">${isNew?'Create':'Save'}</button>
        <button class="admin-cancel-btn" onclick="renderAdminHunt()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveReward(id){
  const isNew = id === 'new';
  try {
    const video = await mediaUploadVideoIfNeeded('ahr');
    const payload = {
      title: document.getElementById('ahrTitle').value.trim(),
      subtitle: document.getElementById('ahrSub').value.trim(),
      badge: document.getElementById('ahrBadge').value.trim(),
      dest_id: document.getElementById('ahrDest').value.trim(),
      images: __mediaGallery.slice(),
      video_url: video.url || null,
      video_type: video.type || null,
      points_required: parseInt(document.getElementById('ahrPoints').value)||100,
      sort_order: parseInt(document.getElementById('ahrSort').value)||0,
    };
    if(!payload.title){ alert('Title is required.'); return; }
    if(isNew){
      const { error } = await sb.from('hunt_rewards').insert(payload);
      if(error) throw error;
    } else {
      const { error } = await sb.from('hunt_rewards').update(payload).eq('id', id);
      if(error) throw error;
    }
    renderAdminHunt();
  } catch(err){ alert('Save failed: '+err.message); }
}

async function adminDeleteReward(id){
  if(!confirm('Delete this reward?')) return;
  try { await sb.from('hunt_rewards').delete().eq('id', id); renderAdminHunt(); }
  catch(e){ alert('Delete failed: '+e.message); }
}

// ───────────── TALA ADMIN ─────────────

function renderAdminTala(){
  const body = document.getElementById('adminBody');
  let html = `
    <div class="admin-section-toggle" onclick="adminToggleSuggestionsPanel()">
      <span>${lucideSvg('zap',13)} Quick suggestion chips ${talaSuggestionsOpen?'▾':'▸'}</span>
      <span class="admin-section-count">${talaSuggestions.length}</span>
    </div>
    <div id="adfSuggestionsPanel" style="display:${talaSuggestionsOpen?'':'none'}">
      ${adminSuggestionsPanelHtml()}
    </div>

    <div class="admin-field" style="margin-top:16px;">
      <label>Fallback response (used when nothing matches)</label>
      <textarea id="adfDefaultR" rows="3" onblur="adminSaveDefaultResponse()">${escapeHtml(defaultR)}</textarea>
    </div>
    <div class="admin-grid-2" style="margin-bottom:14px;">
      <button class="admin-add-btn" style="margin-bottom:0;" onclick="adminNewTala()">+ Add response</button>
      <button class="admin-add-btn" style="margin-bottom:0;" onclick="document.getElementById('adfBulkFile').click()">⇧ Upload .txt files</button>
    </div>
    <input type="file" id="adfBulkFile" accept=".txt,text/plain" multiple style="display:none" onchange="adminHandleBulkFiles(event)">
    <div id="adfBulkQueue"></div>`;

  if(adminEditingTalaId !== null){
    html += adminTalaFormHtml();
  }

  // Filter tabs + search
  const counts = { all: aiData.length, personality: aiData.filter(i=>(i.cat||'knowledge')==='personality').length, knowledge: aiData.filter(i=>(i.cat||'knowledge')==='knowledge').length };
  html += `
    <div class="admin-tala-filters">
      <button class="admin-cat-tab ${talaFilterCat==='all'?'active':''}" onclick="adminSetTalaFilter('all')">All <span>${counts.all}</span></button>
      <button class="admin-cat-tab personality ${talaFilterCat==='personality'?'active':''}" onclick="adminSetTalaFilter('personality')">Personality <span>${counts.personality}</span></button>
      <button class="admin-cat-tab knowledge ${talaFilterCat==='knowledge'?'active':''}" onclick="adminSetTalaFilter('knowledge')">Knowledge <span>${counts.knowledge}</span></button>
    </div>
    <input class="admin-tala-search" placeholder="Search keywords or content..." value="${escapeHtml(talaSearchQuery)}" oninput="adminSetTalaSearch(this.value)">`;

  // Apply filter + search
  let items = aiData;
  if(talaFilterCat !== 'all') items = items.filter(i=>(i.cat||'knowledge')===talaFilterCat);
  if(talaSearchQuery.trim()){
    const q = talaSearchQuery.trim().toLowerCase();
    items = items.filter(i=>
      i.kw.join(' ').toLowerCase().includes(q) ||
      (i.r||'').toLowerCase().includes(q)
    );
  }

  if(!items.length){
    html += `<div class="admin-empty">${aiData.length ? 'No matches for this filter/search.' : 'No responses yet.'}</div>`;
  } else {
    html += items.map(item=>{
      const cat = item.cat || 'knowledge';
      const len = talaContentLength(item.r);
      return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditTala(${item.id})" style="flex:1;cursor:pointer;">
            <div class="admin-tala-badges">
              <span class="admin-cat-pill ${cat}">${cat==='personality'?'Personality':'Knowledge'}</span>
              <span class="admin-len-pill ${len.cls}">${len.label}</span>
            </div>
            <strong>${escapeHtml(item.kw.join(', '))}</strong>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditTala(${item.id})">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteTala(${item.id})">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  body.innerHTML = html;
}

function adminSetTalaFilter(cat){
  talaFilterCat = cat;
  renderAdminTala();
}

function adminSetTalaSearch(val){
  talaSearchQuery = val;
  // Re-render just the list portion would be ideal, but re-running the
  // full render is simple and fast enough at this data size. Preserve
  // focus by not fully replacing the search input itself on every key.
  const body = document.getElementById('adminBody');
  const scrollPos = body.scrollTop;
  renderAdminTala();
  body.scrollTop = scrollPos;
  const input = document.querySelector('.admin-tala-search');
  if(input){ input.focus(); input.setSelectionRange(val.length, val.length); }
}

function adminTalaFormHtml(){
  const isNew = adminEditingTalaId === 'new';
  const item = isNew ? {kw:[],r:'',cat:'knowledge'} : aiData.find(x=>x.id===adminEditingTalaId);
  if(!item) return '';
  const cat = item.cat || 'knowledge';
  return `
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Category</label>
        <select id="atfCat">
          <option value="knowledge" ${cat==='knowledge'?'selected':''}>Knowledge (facts about San Vicente)</option>
          <option value="personality" ${cat==='personality'?'selected':''}>Personality (how Tala talks/acts)</option>
        </select>
      </div>
      <div class="admin-field"><label>Keywords (comma-separated)</label><input id="atfKw" value="${escapeHtml(item.kw.join(', '))}"></div>
      <div class="admin-field"><label>Response (HTML allowed, e.g. &lt;strong&gt;, &lt;br&gt;)</label><textarea id="atfResp" rows="5">${escapeHtml(item.r)}</textarea></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveTala()">${isNew?'Create':'Save changes'}</button>
        <button class="admin-cancel-btn" onclick="adminEditingTalaId=null;renderAdminTala();">Cancel</button>
      </div>
    </div>`;
}

function adminNewTala(){ adminEditingTalaId='new'; renderAdminTala(); }

// ───────────── BULK .TXT UPLOAD ─────────────
// Reads each selected .txt file, shows it in a queue with an editable
// keyword field (pre-filled from the filename), and lets the admin
// save them all into tala_responses in one batch. Each file becomes
// one response entry — the full file content is the response, and the
// keywords typed in are what triggers it. No auto-parsing of arbitrary
// prose into multiple entries, since that's not reliable; this keeps
// the one unavoidable manual step (deciding trigger words) but removes
// everything else.
let bulkQueue = []; // { id, filename, content, keywords }
let bulkIdCounter = 0;

function guessKeywordsFromFilename(filename){
  return filename
    .replace(/\.txt$/i,'')
    .replace(/^\d+[_\-\s]*/,'')   // strip leading numbers like "01_"
    .replace(/[_\-]+/g,' ')
    .trim();
}

function adminHandleBulkFiles(event){
  const files = Array.from(event.target.files || []);
  if(!files.length) return;

  let pending = files.length;
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = (e)=>{
      bulkQueue.push({
        id: ++bulkIdCounter,
        filename: file.name,
        content: e.target.result,
        keywords: guessKeywordsFromFilename(file.name)
      });
      pending--;
      if(pending === 0) renderBulkQueue();
    };
    reader.onerror = ()=>{
      pending--;
      if(pending === 0) renderBulkQueue();
    };
    reader.readAsText(file);
  });

  event.target.value = ''; // allow re-selecting the same file later
}

function renderBulkQueue(){
  const container = document.getElementById('adfBulkQueue');
  if(!container) return;
  if(!bulkQueue.length){ container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field" style="margin-bottom:8px;">
        <label>${bulkQueue.length} file${bulkQueue.length>1?'s':''} ready — set category + trigger keywords for each, then save</label>
      </div>
      ${bulkQueue.map(item=>`
        <div class="admin-list-item" style="margin-bottom:10px;">
          <div style="font-size:.8rem;color:var(--white-soft);font-weight:500;margin-bottom:6px;">
            ${lucideSvg('file-text',13)} ${escapeHtml(item.filename)} <span style="color:var(--white-dim);font-size:.68rem;">(${item.content.length.toLocaleString()} chars)</span>
          </div>
          <div class="admin-field" style="margin-bottom:6px;">
            <label>Category</label>
            <select onchange="bulkQueue.find(x=>x.id===${item.id}).category=this.value">
              <option value="knowledge" ${item.category!=='personality'?'selected':''}>Knowledge (facts about San Vicente)</option>
              <option value="personality" ${item.category==='personality'?'selected':''}>Personality (how Tala talks/acts)</option>
            </select>
          </div>
          <div class="admin-field" style="margin-bottom:6px;">
            <label>Trigger keywords (comma-separated — words a visitor might type that should bring up this content)</label>
            <input value="${escapeHtml(item.keywords)}" oninput="bulkQueue.find(x=>x.id===${item.id}).keywords=this.value">
          </div>
          <button class="admin-mini-btn danger" onclick="bulkQueue=bulkQueue.filter(x=>x.id!==${item.id});renderBulkQueue();">Remove from queue</button>
        </div>`).join('')}
      <div class="admin-edit-actions">
        <button class="admin-save-btn" id="adfBulkSaveBtn" onclick="adminSaveBulkQueue()">Save all ${bulkQueue.length} to Tala</button>
        <button class="admin-cancel-btn" onclick="bulkQueue=[];renderBulkQueue();">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveBulkQueue(){
  const saveBtn = document.getElementById('adfBulkSaveBtn');
  const invalid = bulkQueue.filter(item=>!item.keywords.trim());
  if(invalid.length){
    alert(`Please add at least one keyword for: ${invalid.map(i=>i.filename).join(', ')}`);
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  try {
    const rows = bulkQueue.map((item, i)=>({
      keywords: item.keywords.split(',').map(s=>s.trim()).filter(Boolean),
      response: escapeHtml(item.content).replace(/\n/g,'<br>'),
      category: item.category || 'knowledge',
      sort_order: aiData.length + i
    }));
    const { error } = await sb.from('tala_responses').insert(rows);
    if(error) throw error;

    bulkQueue = [];
    await loadDataFromSupabase();
    renderAdminTala();
  } catch(err){
    alert('Bulk save failed: ' + (err.message || err));
    saveBtn.disabled = false;
    saveBtn.textContent = `Save all ${bulkQueue.length} to Tala`;
  }
}
function adminEditTala(id){ adminEditingTalaId=id; renderAdminTala(); }

async function adminSaveTala(){
  const kw = document.getElementById('atfKw').value.split(',').map(s=>s.trim()).filter(Boolean);
  const r = document.getElementById('atfResp').value.trim();
  const cat = document.getElementById('atfCat').value;
  if(!kw.length || !r){
    alert('At least one keyword and a response are required.');
    return;
  }
  try {
    if(adminEditingTalaId === 'new'){
      const { error } = await sb.from('tala_responses').insert({ keywords: kw, response: r, category: cat, sort_order: aiData.length });
      if(error) throw error;
    } else {
      const { error } = await sb.from('tala_responses').update({ keywords: kw, response: r, category: cat }).eq('id', adminEditingTalaId);
      if(error) throw error;
    }
    await loadDataFromSupabase();
    adminEditingTalaId = null;
    renderAdminTala();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminDeleteTala(id){
  if(!confirm('Delete this response?')) return;
  try {
    const { error } = await sb.from('tala_responses').delete().eq('id', id);
    if(error) throw error;
    await loadDataFromSupabase();
    renderAdminTala();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

async function adminSaveDefaultResponse(){
  const val = document.getElementById('adfDefaultR').value.trim();
  if(!val || val === defaultR) return;
  try {
    const { error } = await sb.from('tala_settings').upsert({ key: 'default_response', value: val });
    if(error) throw error;
    defaultR = val;
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

// ───────────── RESET TO DEFAULTS ─────────────

async function adminResetDefaults(){
  if(!confirm('This will erase ALL destinations, categories, and tala responses in Supabase and replace them with the original built-in defaults. Continue?')) return;
  try {
    await sb.from('destinations').delete().neq('id', -1);
    await sb.from('tala_responses').delete().neq('id', -1);
    await sb.from('destination_categories').delete().neq('id', -1);

    const destRows = DEFAULT_DESTINATIONS.map((d,i)=>({
      name:d.name, lat:d.lat, lng:d.lng, category:d.category, image:d.image,
      description:d.description, tip:d.tip, color:d.color, sort_order:i,
      rating:d.stats.rating, travel:d.stats.travel, temp:d.stats.temp, season:d.stats.season
    }));
    const talaRows = DEFAULT_TALA_DATA.map((t,i)=>({ keywords:t.kw, response:t.r, sort_order:i }));
    const catRows = Object.keys(DEFAULT_CAT_STYLE).map((key,i)=>({ key, label: DEFAULT_CAT_STYLE[key].label, color: DEFAULT_CAT_STYLE[key].color, icon: DEFAULT_CAT_STYLE[key].icon, sort_order:i }));

    await sb.from('destinations').insert(destRows);
    await sb.from('tala_responses').insert(talaRows);
    await sb.from('destination_categories').insert(catRows);
    await sb.from('tala_settings').upsert({ key:'default_response', value: DEFAULT_FALLBACK_RESPONSE });

    await loadDataFromSupabase();
    rebuildMarkers();
    if(adminTab==='dest') renderAdminDest(); else renderAdminTala();
    alert('Reset complete.');
  } catch(err){
    alert('Reset failed: ' + (err.message || err));
  }
}

// ═══════════════════════════════════════════════════════
// PULSE ADMIN — moderate posts/comments, mute/ban users,
// manage category chips. Uses security-definer RPC functions
// (admin_delete_pulse_post etc.) to bypass per-user RLS, since
// this admin panel is PIN-gated, not Supabase-Auth-gated — same
// trust model as the rest of this admin panel.
// ═══════════════════════════════════════════════════════
let pulseAdminSubTab = 'posts';
let pulseAdminEditingPostId = null;

function renderAdminPulse(){
  const body = document.getElementById('adminBody');
  body.innerHTML = `
    <div class="admin-tala-filters">
      <button class="admin-cat-tab ${pulseAdminSubTab==='posts'?'active':''}" onclick="adminPulseSetSubTab('posts')">Posts</button>
      <button class="admin-cat-tab ${pulseAdminSubTab==='categories'?'active':''}" onclick="adminPulseSetSubTab('categories')">Categories</button>
      <button class="admin-cat-tab ${pulseAdminSubTab==='users'?'active':''}" onclick="adminPulseSetSubTab('users')">Users</button>
    </div>
    <div id="adminPulseBody"><div class="admin-empty">Loading…</div></div>`;

  if(pulseAdminSubTab === 'posts') renderAdminPulsePosts();
  else if(pulseAdminSubTab === 'categories') renderAdminPulseCategories();
  else renderAdminPulseUsers();
}

function adminPulseSetSubTab(tab){
  pulseAdminSubTab = tab;
  pulseAdminEditingPostId = null;
  renderAdminPulse();
}

// ───────────── POSTS (edit / delete any post or comment) ─────────────

async function renderAdminPulsePosts(){
  const body = document.getElementById('adminPulseBody');
  try {
    const { data: posts, error } = await sb.from('pulse_posts')
      .select('id, user_id, category, text_content, image_url, location_text, display_name, is_anonymous, admin_post, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if(error) throw error;

    if(!posts || !posts.length){
      body.innerHTML = `<div class="admin-empty">No Pulse posts yet.</div>`;
      return;
    }

    // Fetch comment counts separately (avoids RLS-hanging count aggregates)
    const postIds = posts.map(p=>p.id);
    const { data: commentCounts } = await sb.from('pulse_comments').select('post_id').in('post_id', postIds);
    const countByPost = {};
    (commentCounts||[]).forEach(r=>{ countByPost[r.post_id] = (countByPost[r.post_id]||0) + 1; });

    body.innerHTML = posts.map(p=>{
      const isEditing = pulseAdminEditingPostId === p.id;
      const commentCount = countByPost[p.id] || 0;
      const authorLabel = p.is_anonymous ? 'Anonymous' : (p.display_name || 'Traveler');
      return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <div class="admin-tala-badges">
              <span class="admin-cat-pill knowledge">${escapeHtml(p.category||'all')}</span>
              ${p.admin_post ? '<span class="admin-cat-pill personality">Admin post</span>' : ''}
              <span class="admin-len-pill">${commentCount} comment${commentCount===1?'':'s'}</span>
            </div>
            <strong>${escapeHtml(authorLabel)}</strong> · <span style="color:var(--white-dim);font-size:.7rem;">${new Date(p.created_at).toLocaleString()}</span>
            ${isEditing ? `
              <div class="admin-field" style="margin-top:8px;"><textarea id="adminPulsePostText-${p.id}" rows="3">${escapeHtml(p.text_content||'')}</textarea></div>
              <div class="admin-field"><label>Category</label><input id="adminPulsePostCat-${p.id}" value="${escapeHtml(p.category||'')}"></div>
              <div class="admin-edit-actions">
                <button class="admin-save-btn" onclick="adminPulseSavePost(${p.id})">Save</button>
                <button class="admin-cancel-btn" onclick="pulseAdminEditingPostId=null;renderAdminPulsePosts();">Cancel</button>
              </div>
            ` : `<div style="margin-top:6px;font-size:.82rem;color:var(--white-soft);">${escapeHtml(p.text_content||'(no text)')}</div>`}
            ${p.image_url ? `<img src="${p.image_url}" style="max-width:120px;border-radius:8px;margin-top:8px;display:block;" onerror="this.style.display='none'">` : ''}
          </div>
          ${!isEditing ? `
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="pulseAdminEditingPostId=${p.id};renderAdminPulsePosts();">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminPulseDeletePost(${p.id})">Delete</button>
          </div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch(err){
    body.innerHTML = `<div class="admin-empty">Could not load posts: ${escapeHtml(err.message||String(err))}</div>`;
  }
}

async function adminPulseSavePost(postId){
  const text = document.getElementById(`adminPulsePostText-${postId}`).value.trim();
  const cat = document.getElementById(`adminPulsePostCat-${postId}`).value.trim();
  try {
    const { error } = await sb.rpc('admin_update_pulse_post', { post_id: postId, new_text: text, new_category: cat });
    if(error) throw error;
    pulseAdminEditingPostId = null;
    renderAdminPulsePosts();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminPulseDeletePost(postId){
  if(!confirm('Delete this post and all its comments/likes? This cannot be undone.')) return;
  try {
    const { error } = await sb.rpc('admin_delete_pulse_post', { post_id: postId });
    if(error) throw error;
    renderAdminPulsePosts();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

// ───────────── CATEGORIES ─────────────

let pulseAdminEditingCatId = null;

async function renderAdminPulseCategories(){
  const body = document.getElementById('adminPulseBody');
  try {
    const { data: cats, error } = await sb.from('pulse_categories').select('*').order('sort_order');
    if(error) throw error;

    let html = `<button class="admin-add-btn" onclick="pulseAdminEditingCatId='new';renderAdminPulseCategories();">+ Add category</button>`;

    if(pulseAdminEditingCatId !== null){
      const isNew = pulseAdminEditingCatId === 'new';
      const c = isNew ? {key:'',label:'',sort_order:(cats||[]).length} : cats.find(x=>x.id===pulseAdminEditingCatId);
      if(c){
        html += `
        <div class="admin-edit-box">
          <div class="admin-field"><label>Key (used in code, lowercase, no spaces)</label><input id="catfKey" value="${escapeHtml(c.key)}" ${isNew?'':'disabled'}></div>
          <div class="admin-field"><label>Label (shown to users)</label><input id="catfLabel" value="${escapeHtml(c.label)}"></div>
          <div class="admin-edit-actions">
            <button class="admin-save-btn" onclick="adminPulseSaveCategory(${isNew?"'new'":c.id})">${isNew?'Create':'Save changes'}</button>
            <button class="admin-cancel-btn" onclick="pulseAdminEditingCatId=null;renderAdminPulseCategories();">Cancel</button>
          </div>
        </div>`;
      }
    }

    html += (cats||[]).map(c=>`
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(c.label)}</strong> <span style="color:var(--white-dim);font-size:.7rem;">(${escapeHtml(c.key)})</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="pulseAdminEditingCatId=${c.id};renderAdminPulseCategories();">Edit</button>
            ${c.key!=='all' ? `<button class="admin-mini-btn danger" onclick="adminPulseDeleteCategory(${c.id})">Delete</button>` : ''}
          </div>
        </div>
      </div>`).join('');

    body.innerHTML = html;
  } catch(err){
    body.innerHTML = `<div class="admin-empty">Could not load categories: ${escapeHtml(err.message||String(err))}</div>`;
  }
}

async function adminPulseSaveCategory(id){
  const key = document.getElementById('catfKey').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const label = document.getElementById('catfLabel').value.trim();
  if(!key || !label){ alert('Key and label are both required.'); return; }
  try {
    if(id === 'new'){
      const { error } = await sb.from('pulse_categories').insert({ key, label, sort_order: 999 });
      if(error) throw error;
    } else {
      const { error } = await sb.from('pulse_categories').update({ label }).eq('id', id);
      if(error) throw error;
    }
    pulseAdminEditingCatId = null;
    renderAdminPulseCategories();
    refreshPulseCategoryChips();
  } catch(err){
    alert('Save failed: ' + (err.message || err));
  }
}

async function adminPulseDeleteCategory(id){
  if(!confirm('Delete this category? Existing posts tagged with it will keep their tag, but it will no longer appear as a filter chip.')) return;
  try {
    const { error } = await sb.from('pulse_categories').delete().eq('id', id);
    if(error) throw error;
    renderAdminPulseCategories();
    refreshPulseCategoryChips();
  } catch(err){
    alert('Delete failed: ' + (err.message || err));
  }
}

// Called from admin after saving/deleting a category, so any open
// Pulse panel picks up the new label immediately.
async function refreshPulseCategoryChips(){
  await loadPulseCategoriesFromDB();
  applyPulseCategoryLabelsToChips();
}

// ───────────── USERS (mute / ban) ─────────────

async function renderAdminPulseUsers(){
  const body = document.getElementById('adminPulseBody');
  body.innerHTML = `
    <input class="admin-tala-search" id="pulseUserSearch" placeholder="Search by name or email..." oninput="adminPulseSearchUsers(this.value)">
    <div id="pulseUserResults"><div class="admin-empty">Type a name to search for a traveler.</div></div>`;
}

let pulseUserSearchTimer = null;
function adminPulseSearchUsers(q){
  clearTimeout(pulseUserSearchTimer);
  pulseUserSearchTimer = setTimeout(()=>doAdminPulseSearchUsers(q), 300);
}

async function doAdminPulseSearchUsers(q){
  const results = document.getElementById('pulseUserResults');
  q = q.trim();
  if(!q){ results.innerHTML = `<div class="admin-empty">Type a name to search for a traveler.</div>`; return; }
  try {
    const { data: users, error } = await sb.from('traveler_profiles')
      .select('id, display_name, is_muted, is_banned, moderation_note')
      .ilike('display_name', `%${q}%`)
      .limit(20);
    if(error) throw error;

    if(!users || !users.length){
      results.innerHTML = `<div class="admin-empty">No travelers found matching "${escapeHtml(q)}".</div>`;
      return;
    }

    results.innerHTML = users.map(u=>`
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(u.display_name||'(no name)')}</strong>
            <div class="admin-tala-badges" style="margin-top:4px;">
              ${u.is_muted ? '<span class="admin-cat-pill personality">Muted</span>' : ''}
              ${u.is_banned ? '<span class="admin-cat-pill personality" style="background:rgba(239,68,68,.16);color:#fca5a5;">Banned</span>' : ''}
              ${!u.is_muted && !u.is_banned ? '<span class="admin-cat-pill knowledge">Active</span>' : ''}
            </div>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminPulseToggleMute('${u.id}', ${!u.is_muted})">${u.is_muted?'Unmute':'Mute'}</button>
            <button class="admin-mini-btn danger" onclick="adminPulseToggleBan('${u.id}', ${!u.is_banned})">${u.is_banned?'Unban':'Ban'}</button>
          </div>
        </div>
      </div>`).join('');
  } catch(err){
    results.innerHTML = `<div class="admin-empty">Search failed: ${escapeHtml(err.message||String(err))}</div>`;
  }
}

async function adminPulseToggleMute(userId, muted){
  try {
    const { error } = await sb.rpc('admin_set_user_moderation', { target_user_id: userId, muted, banned: false, note: null });
    if(error) throw error;
    doAdminPulseSearchUsers(document.getElementById('pulseUserSearch').value);
  } catch(err){
    alert('Action failed: ' + (err.message || err));
  }
}

async function adminPulseToggleBan(userId, banned){
  if(banned && !confirm('Ban this traveler? They will be unable to post or comment in Pulse.')) return;
  try {
    const { error } = await sb.rpc('admin_set_user_moderation', { target_user_id: userId, muted: false, banned, note: null });
    if(error) throw error;
    doAdminPulseSearchUsers(document.getElementById('pulseUserSearch').value);
  } catch(err){
    alert('Action failed: ' + (err.message || err));
  }
}

// ═══════════════════════════════════════════════════════
// THE HUNT — admin-managed data
// ═══════════════════════════════════════════════════════
let HUNT_SETTINGS = {};
let HUNT_REWARDS = [
  { id:'hr1', title:'Long Beach Explorer', subtitle:'Unlock Long Beach to earn this reward.', badge:'NEW', destId:'', pointsRequired:100, images:['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75','https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=75'], videoUrl:'', videoType:'', grad:'linear-gradient(135deg,#0ea5e9,#0c4a6e)' },
  { id:'hr2', title:'Island Hopper', subtitle:'Discover all islands near Port Barton.', badge:'SOON', destId:'', pointsRequired:200, images:['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=75','https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75'], videoUrl:'', videoType:'', grad:'linear-gradient(135deg,#22d3ee,#164e63)' },
  { id:'hr3', title:'Waterfall Hunter', subtitle:'Find Pamuayan Falls.', badge:'', destId:'', pointsRequired:150, images:['https://images.unsplash.com/photo-1432405972618-c6b0cfba8b0f?w=400&q=75'], videoUrl:'', videoType:'', grad:'linear-gradient(135deg,#34d399,#064e3b)' }
];

// ═══════════════════════════════════════════════════════
// MY SANVIC — private pocket panel
// ═══════════════════════════════════════════════════════
let MYSV_UPCOMING = [
  { id:'u1', title:'Sunset Chasers 🌅', meta:'5:30 PM • Long Beach', badge:'Today', badgeStyle:'solid', avatars:4, more:3, cta:'Open Tribe Chat', action:'openChat', images:['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75','https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&q=75'], grad:'linear-gradient(135deg,#f97316,#7c2d12)' },
  { id:'u2', title:'Lechon by the Beach 🍖', meta:'6:00 PM • Sunset Resort', badge:'Today', badgeStyle:'solid', cta:'View Details', action:'details', images:['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75'], grad:'linear-gradient(135deg,#d97706,#78350f)' },
  { id:'u3', title:'Island Hopping Tribe 🚣', meta:'8:00 AM • Port Barton', badge:'Tomorrow', badgeStyle:'solid', avatars:4, more:2, cta:'Open Tribe Chat', action:'openChat', images:['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=75','https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75'], grad:'linear-gradient(135deg,#0ea5e9,#0c4a6e)' },
  { id:'u4', title:'Acoustic Night 🎸', meta:'7:30 PM • Poblacion', badge:'May 18', badgeStyle:'soft', cta:"I'm Interested", action:'interested', images:['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=75'], grad:'linear-gradient(135deg,#7c3aed,#1e1b4b)' }
];
let MYSV_SAVED = [
  { id:'s1', title:'Long Beach', cat:'Beach · San Vicente', km:12, image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75', grad:'linear-gradient(135deg,#38bdf8,#0c4a6e)' },
  { id:'s2', title:'Boayan Island', cat:'Island · Port Barton', km:18, image:'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=75', grad:'linear-gradient(135deg,#22d3ee,#164e63)' },
  { id:'s3', title:'Pamuayan Falls', cat:'Waterfall · Alimanguan', km:18, image:'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b0f?w=400&q=75', grad:'linear-gradient(135deg,#34d399,#064e3b)' },
  { id:'s4', title:'Poblacion Market', cat:'Local Life · Poblacion', km:2, image:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75', grad:'linear-gradient(135deg,#f59e0b,#78350f)' },
  { id:'s5', title:'Alimanguan Beach', cat:'Beach · Alimanguan', km:25, image:'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&q=75', grad:'linear-gradient(135deg,#60a5fa,#1e3a8a)' }
];
let MYSV_TRIBES = [
  { id:'t1', title:'Sunset Chasers 🌅', meta:'Long Beach • Today, 5:30 PM', more:3, thumb:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75', grad:'linear-gradient(135deg,#f97316,#7c2d12)' },
  { id:'t2', title:'Island Hopping Tomorrow 🚣', meta:'Port Barton • Tomorrow, 8:00 AM', more:2, thumb:'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=75', grad:'linear-gradient(135deg,#0ea5e9,#0c4a6e)' },
  { id:'t3', title:'Shared Ride to Port Barton 🚐', meta:'Poblacion • May 18, 10:00 AM', more:1, thumb:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75', grad:'linear-gradient(135deg,#10b981,#064e3b)' }
];
const MYSV_EVENTS = [
  { id:'e1', title:'Full Moon Party 🌙', meta:'Baybay • Tonight, 9:00 PM', more:12, images:['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=75','https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&q=75'], grad:'linear-gradient(135deg,#a78bfa,#1e1b4b)' },
  { id:'e2', title:'Acoustic Night 🎸', meta:'Poblacion • May 18, 7:30 PM', more:8, images:['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=75'], grad:'linear-gradient(135deg,#f472b6,#831843)' }
];
const MYSV_RECENT = [
  { id:'r1', label:'Port Barton Village', image:'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&q=75', grad:'linear-gradient(135deg,#38bdf8,#0c4a6e)' },
  { id:'r2', label:'Private Boat Experience', image:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=75', grad:'linear-gradient(135deg,#22d3ee,#164e63)' },
  { id:'r3', label:'Wild Beach North', image:'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=200&q=75', grad:'linear-gradient(135deg,#60a5fa,#1e3a8a)' },
  { id:'r4', label:'Sunset Drinks Tribe', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=75', grad:'linear-gradient(135deg,#f97316,#7c2d12)' }
];

function mysvIsSignedIn(){
  try{
    if(typeof pulseIsSignedIn==='function') return pulseIsSignedIn();
    if(typeof currentUser!=='undefined' && currentUser) return true;
    return !!localStorage.getItem('sanvic_user');
  }catch(_){ return false; }
}
function mysvSyncDismissed(){ try{ return sessionStorage.getItem('mysv_sync_dismissed')==='1'; }catch(_){ return false; } }
function mysvDismissSync(){ try{ sessionStorage.setItem('mysv_sync_dismissed','1'); }catch(_){} renderMySanvic(); }
function mysvSignIn(){
  if(typeof openAuthPanel==='function') return openAuthPanel();
  if(typeof openLoginModal==='function') return openLoginModal();
  if(typeof openDashboard==='function') return openDashboard('account');
  alert('Sign-in coming soon.');
}

// Load saved places from Supabase (requires signed-in user).
// Falls back to demo data if not signed in or query fails.
async function loadMySanvicSaved(){
  if(!currentUser) return;
  try {
    const { data: saved, error } = await sb.from('saved_places')
      .select('id, destination_id')
      .eq('user_id', currentUser.id);
    if(error) throw error;
    if(!saved || !saved.length) return;
    // Fetch destination details for each saved place
    const destIds = saved.map(s=>s.destination_id).filter(Boolean);
    if(!destIds.length) return;
    const { data: dests } = await sb.from('destinations')
      .select('id, name, category, barangay, image')
      .in('id', destIds);
    if(!dests || !dests.length) return;
    const destMap = new Map(dests.map(d=>[d.id, d]));
    // Replace demo data with real saved places
    MYSV_SAVED = saved.map(s=>{
      const d = destMap.get(s.destination_id);
      const catLabel = (catStyle[d.category] && catStyle[d.category].label) || d.category || '';
      return {
        id: 'sp_' + s.id,
        title: d.name || 'Saved place',
        cat: catLabel + (d.barangay ? ' • ' + d.barangay : ''),
        km: '',
        image: d.image || '',
        grad: 'linear-gradient(135deg,#38bdf8,#0c4a6e)'
      };
    });
  } catch(e){
    console.warn('[MYSV] Could not load saved places:', e);
  }
}

function openMySanvicPanel(){
  const p = document.getElementById('mySanvicPanel');
  if(!p) return;
  p.classList.add('open');
  p.setAttribute('aria-hidden','false');
  loadMySanvicSaved().then(()=> renderMySanvic());
}
function closeMySanvicPanel(){
  const p = document.getElementById('mySanvicPanel');
  if(!p) return;
  p.classList.remove('open');
  p.setAttribute('aria-hidden','true');
}

function mysvAvatars(count, more){
  if(!count) return '';
  const dots = Array.from({length:Math.min(count,4)}).map((_,i)=>`<div class="mysv-avatar" style="background:linear-gradient(135deg,hsl(${i*70},60%,55%),hsl(${i*70+40},55%,25%))"></div>`).join('');
  const moreEl = more ? `<div class="mysv-avatar-more">+${more}</div>` : '';
  return `<div class="mysv-avatars">${dots}${moreEl}</div>`;
}

function renderMySanvic(){
  const body = document.getElementById('mysvBody');
  if(!body) return;
  const signedIn = mysvIsSignedIn();
  const showSync = !signedIn && !mysvSyncDismissed();

  const hasContent = MYSV_SAVED.length || MYSV_TRIBES.length || MYSV_UPCOMING.length || MYSV_EVENTS.length;

  const header = `
    <div class="mysv-head">
      <div class="mysv-title-row">
        <h1 class="mysv-title">My Sanvic</h1>
        <svg class="mysv-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <div class="mysv-sub">Your saved places, joined tribes, plans, and discoveries.</div>
      <div class="mysv-tag">Your San Vicente, quietly collected.</div>
    </div>`;

  const sync = showSync ? `
    <div class="mysv-sync">
      <div class="mysv-sync-ico">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="8 13 12 9 16 13"/><line x1="12" y1="9" x2="12" y2="17"/></svg>
      </div>
      <div class="mysv-sync-body">
        <div class="mysv-sync-t">Keep your Sanvic in sync</div>
        <div class="mysv-sync-s">Sign in to access your Sanvic anywhere, on any device.</div>
      </div>
      <div class="mysv-sync-actions">
        <button class="mysv-btn-teal" onclick="mysvSignIn()">Sign in</button>
        <button class="mysv-link" onclick="mysvDismissSync()">Continue anonymously</button>
      </div>
    </div>` : '';

  if(!hasContent){
    body.innerHTML = header + sync + `
      <div class="mysv-empty">
        <div class="mysv-empty-t">Your trip is still empty.</div>
        <div class="mysv-empty-s">Save places, join tribes, follow events, or unlock discoveries. They'll appear here.</div>
        <div class="mysv-empty-actions">
          <button class="mysv-cap-btn" onclick="closeMySanvicPanel();dockNav('discover')">Explore San Vicente</button>
          <button class="mysv-cap-btn" onclick="closeMySanvicPanel();dockNav('pulse')">Open Pulse</button>
          <button class="mysv-cap-btn" onclick="closeMySanvicPanel();dockNav('map')">See Today</button>
        </div>
      </div>`;
    return;
  }

  const upcoming = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">📅 Upcoming</div><div class="mysv-sec-sub">Things you're going to or interested in.</div></div>
        <button class="mysv-viewall">View all ›</button>
      </div>
      <div class="mysv-hscroll">
        ${MYSV_UPCOMING.map(u=>{
          const allImgs = [];
          if(u.images && Array.isArray(u.images)) allImgs.push(...u.images);
          const hasImages = allImgs.length > 0;
          const cardBg = hasImages
            ? `background-image:url('${escapeHtml(allImgs[0])}');background-size:cover;background-position:center;`
            : `background:${u.grad};`;
          return `
          <div class="mysv-up-card" style="${cardBg}">
            <span class="mysv-badge ${u.badgeStyle==='soft'?'soft':''}">${escapeHtml(u.badge)}</span>
            <div class="mysv-up-info">
              <div class="mysv-up-title">${escapeHtml(u.title)}</div>
              <div class="mysv-up-meta">${escapeHtml(u.meta)}</div>
              <div class="mysv-up-row">
                ${mysvAvatars(u.avatars||0, u.more||0)}
                <button class="mysv-cap-btn" onclick="mysvAction('${u.action}','${u.id}')">${escapeHtml(u.cta)}</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  const saved = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">🧳 Saved Places</div><div class="mysv-sec-sub">Places you saved from Explore.</div></div>
        <button class="mysv-viewall">View all ›</button>
      </div>
      <div class="mysv-hscroll">
        ${MYSV_SAVED.map(s=>{
          const cardBg = s.image
            ? `background-image:url('${escapeHtml(s.image)}');background-size:cover;background-position:center;`
            : `background:${s.grad};`;
          return `
          <div class="mysv-sv-card" style="${cardBg}">
            <button class="mysv-sv-heart" onclick="mysvToggleSaved('${s.id}')" aria-label="Saved">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <div class="mysv-sv-info">
              <div class="mysv-sv-title">${escapeHtml(s.title)}</div>
              <div class="mysv-sv-cat">${escapeHtml(s.cat)}</div>
              <div class="mysv-sv-row">
                <span class="mysv-km">📍 ${s.km} km</span>
                <button class="mysv-dot" onclick="mysvAction('menu','${s.id}')">⋯</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  const tribes = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">👥 Joined Tribes</div><div class="mysv-sec-sub">Tribes you joined in Pulse.</div></div>
        <button class="mysv-viewall">View all ›</button>
      </div>
      <div>
        ${MYSV_TRIBES.map(t=>{
          const thumbBg = t.thumb
            ? `background-image:url('${escapeHtml(t.thumb)}');background-size:cover;background-position:center;`
            : `background:${t.grad};`;
          return `
          <div class="mysv-tribe-row">
            <div class="mysv-tribe-thumb" style="${thumbBg}"></div>
            <div class="mysv-tribe-body">
              <div class="mysv-tribe-title">${escapeHtml(t.title)}</div>
              <div class="mysv-tribe-meta">${escapeHtml(t.meta)}</div>
            </div>
            ${mysvAvatars(3, t.more)}
            <button class="mysv-cap-btn" onclick="mysvAction('openChat','${t.id}')">Open Chat</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  const split = `
    <div class="mysv-section">
      <div class="mysv-split">
        <div class="mysv-col">
          <div class="mysv-sec-head" style="margin-bottom:6px">
            <div><div class="mysv-sec-title">📅 Events I'm Interested In</div><div class="mysv-sec-sub">You showed interest in these.</div></div>
            <button class="mysv-viewall">View all ›</button>
          </div>
          ${MYSV_EVENTS.map(e=>{
            const evImg = (e.images && e.images.length) ? e.images[0] : '';
            const evBg = evImg
              ? `background-image:url('${escapeHtml(evImg)}');background-size:cover;background-position:center;`
              : `background:${e.grad};`;
            return `
            <div class="mysv-ev-card">
              <div class="mysv-ev-thumb" style="${evBg}"></div>
              <div class="mysv-ev-body">
                <div class="mysv-ev-title">${escapeHtml(e.title)}</div>
                <div class="mysv-ev-meta">${escapeHtml(e.meta)}</div>
                <div class="mysv-ev-row">
                  ${mysvAvatars(3, e.more)}
                  <button class="mysv-cap-btn" onclick="mysvAction('details','${e.id}')">View Details</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
        <div class="mysv-col">
          <div class="mysv-sec-head" style="margin-bottom:6px">
            <div><div class="mysv-sec-title">🎯 Hunt Progress</div><div class="mysv-sec-sub">Your discoveries and rewards.</div></div>
            <button class="mysv-viewall">View all ›</button>
          </div>
          <div class="mysv-hunt">
            <div class="mysv-hunt-main">
              <div class="mysv-ring">
                <svg width="74" height="74" viewBox="0 0 74 74">
                  <circle cx="37" cy="37" r="32" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
                  <circle cx="37" cy="37" r="32" fill="none" stroke="#3fd6d6" stroke-width="6" stroke-linecap="round" stroke-dasharray="${2*Math.PI*32}" stroke-dashoffset="${2*Math.PI*32*(1-0.4)}"/>
                </svg>
                <div class="mysv-ring-label">40%</div>
              </div>
              <div class="mysv-hunt-info">
                <div class="mysv-hunt-title">Long Beach Explorer</div>
                <div class="mysv-hunt-meta">4 / 10 discoveries<br>Next reward: 2 more</div>
              </div>
              <div class="mysv-gift">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              </div>
            </div>
            <div class="mysv-reward">
              <div class="mysv-reward-thumb" style="background-image:url('https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&q=75');background-size:cover;background-position:center;"></div>
              <div class="mysv-reward-body">
                <div class="mysv-reward-lab">Recent reward</div>
                <div class="mysv-reward-t">Hidden Beach Access</div>
              </div>
              <button class="mysv-cap-btn" onclick="mysvAction('reward','hidden-beach')">View Reward</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const recent = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">🕒 Recently Viewed</div><div class="mysv-sec-sub">Places you recently looked at.</div></div>
        <button class="mysv-viewall">View all ›</button>
      </div>
      <div class="mysv-hscroll">
        ${MYSV_RECENT.map(r=>`
          <button class="mysv-pill" onclick="mysvAction('view','${r.id}')">
            <span class="mysv-pill-thumb" style="background-image:url('${r.image||''}');background-size:cover;background-position:center;background-color:#2a3247"></span>
            ${escapeHtml(r.label)}
          </button>`).join('')}
      </div>
    </div>`;

  body.innerHTML = header + sync + upcoming + saved + tribes + split + recent;
}

async function mysvToggleSaved(id){
  const i = MYSV_SAVED.findIndex(s=>s.id===id);
  if(i<0) return;
  // If it's a real Supabase-saved place (id starts with 'sp_'), delete from DB
  if(id.startsWith('sp_') && currentUser){
    const realId = id.replace('sp_','');
    try { await sb.from('saved_places').delete().eq('id', realId); } catch(e){ console.warn('[MYSV] delete failed:', e); }
  }
  MYSV_SAVED.splice(i,1);
  renderMySanvic();
}
function mysvAction(kind, id){
  if(!mysvIsSignedIn() && (kind==='openChat' || kind==='interested')){
    return mysvSignIn();
  }
  // Best-effort routing to existing surfaces
  if(kind==='openChat' || kind==='details' || kind==='interested'){
    closeMySanvicPanel();
    if(typeof openPulsePanel==='function') openPulsePanel();
    return;
  }
  if(kind==='view' || kind==='menu' || kind==='reward'){
    // no-op placeholder for now
  }
}


// ═══════════════════════════════════════════════════════
// THE HUNT — discovery, unlock, earn.
// All content derives from the same Supabase tables used elsewhere:
//   • destinations       → today's hunt, trails, rewards, geo targets
//   • nearby_places      → "Nearby Discoveries" carousel
// Progress/points stay in localStorage (client-only gamification layer).
// ═══════════════════════════════════════════════════════

function huntGradientFor(color, i){
  const base = color || ['#0ea5e9','#f97316','#34d399','#a78bfa','#f59e0b','#38bdf8'][i%6];
  return `linear-gradient(135deg, ${base}, rgba(0,0,0,.65))`;
}
function huntTargetFor(dest){
  if(!dest || dest.lat==null || dest.lng==null) return null;
  return { lat:Number(dest.lat), lng:Number(dest.lng), name:dest.name };
}
function huntTodayDest(){
  const list = Array.isArray(destinations) ? destinations : [];
  return list.find(d=>d.featured && d.lat!=null) || list.find(d=>d.lat!=null) || list[0] || null;
}
function huntNearbyItems(){
  const flat = [];
  Object.keys(nearbyPlacesByBarangay||{}).forEach(b=>{
    (nearbyPlacesByBarangay[b]||[]).forEach(p=>flat.push({...p, barangay:b}));
  });
  return flat.slice(0, 12);
}
function huntTrailGroups(){
  const list = Array.isArray(destinations) ? destinations : [];
  const state = huntLoadState();
  const byCat = {};
  list.forEach(d=>{
    const key = d.category || 'explore';
    (byCat[key] = byCat[key] || []).push(d);
  });
  return Object.keys(byCat).map((k, i)=>{
    const items = byCat[k];
    const done = items.filter(d=>state.unlocked.includes(String(d.id))).length;
    const label = (window.catStyle && catStyle[k] && catStyle[k].label) || (k.charAt(0).toUpperCase()+k.slice(1));
    const firstImg = items.find(d=>d.image)?.image || '';
    return {
      id:k, title:`${label} Trail`,
      desc:`Explore ${items.length} ${label.toLowerCase()} spot${items.length===1?'':'s'} across San Vicente.`,
      done, total:items.length,
      image: firstImg,
      grad: huntGradientFor((items[0]&&items[0].color), i)
    };
  });
}
function huntRewardItems(){
  if(HUNT_REWARDS.length) return HUNT_REWARDS;
  const list = (Array.isArray(destinations)?destinations:[]).filter(d=>d.featured).slice(0,3);
  return list.map((d,i)=>({
    id:String(d.id),
    title:`${d.name} Explorer`,
    sub:`Unlock ${d.name} on the map to earn this reward.`,
    badge: i===0 ? 'NEW' : 'SOON',
    grad: huntGradientFor(d.color, i)
  }));
}

function huntLoadState(){
  try{
    return {
      unlocked: JSON.parse(localStorage.getItem('sanvic_hunt_unlocked') || '[]'),
      points: parseInt(localStorage.getItem('sanvic_hunt_points') || '0', 10) || 0,
      progress: JSON.parse(localStorage.getItem('sanvic_hunt_progress') || '{}')
    };
  }catch(_){ return { unlocked:[], points:0, progress:{} }; }
}
function huntSaveState(s){
  try{
    localStorage.setItem('sanvic_hunt_unlocked', JSON.stringify(s.unlocked||[]));
    localStorage.setItem('sanvic_hunt_points', String(s.points||0));
    localStorage.setItem('sanvic_hunt_progress', JSON.stringify(s.progress||{}));
  }catch(_){}
}

function openHuntPanel(){
  const p = document.getElementById('huntPanel');
  if(!p) return;
  p.classList.add('open');
  p.setAttribute('aria-hidden','false');
  renderHunt();
}
function closeHuntPanel(){
  const p = document.getElementById('huntPanel');
  if(!p) return;
  p.classList.remove('open');
  p.setAttribute('aria-hidden','true');
  closeHuntOverlay();
}
function showHuntOverlay(title, sub){
  const o = document.getElementById('huntOverlay');
  if(!o) return;
  if(title) document.getElementById('huntOverlayTitle').textContent = title;
  if(sub) document.getElementById('huntOverlaySub').textContent = sub;
  o.classList.add('show');
}
function closeHuntOverlay(evt){
  if(evt && evt.target && evt.target.closest && evt.target.closest('.hunt-overlay-card')) return;
  const o = document.getElementById('huntOverlay');
  if(o) o.classList.remove('show');
}

function huntAvatars(count, more){
  const dots = Array.from({length:count}).map((_,i)=>`<div class="hunt-avatar" style="background:linear-gradient(135deg,hsl(${i*60+20},60%,55%),hsl(${i*60+80},55%,25%))"></div>`).join('');
  const moreEl = more ? `<div class="hunt-avatar-more">+${more}</div>` : '';
  return `<div class="hunt-avatars">${dots}${moreEl}</div>`;
}

function huntSelectTab(tab){
  document.querySelectorAll('.hunt-vtab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  const map = { today:'huntToday', nearby:'huntNearby', trails:'huntTrails', collections:'huntTrails', rewards:'huntSplit', progress:'huntSplit' };
  const target = document.getElementById(map[tab] || 'huntToday');
  if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
}
function huntScrollToSplit(){
  const el = document.getElementById('huntSplit');
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

function huntStart(destId){
  const dest = (Array.isArray(destinations)?destinations:[]).find(d=>String(d.id)===String(destId));
  const target = huntTargetFor(dest);
  const onFail = () => showHuntOverlay('Marker out of range', 'Head closer to the location in San Vicente to unlock this story layer.');
  if(!target || !navigator.geolocation) return onFail();
  navigator.geolocation.getCurrentPosition(pos => {
    const R = 6371000;
    const toRad = d => d*Math.PI/180;
    const dLat = toRad(target.lat - pos.coords.latitude);
    const dLng = toRad(target.lng - pos.coords.longitude);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pos.coords.latitude))*Math.cos(toRad(target.lat))*Math.sin(dLng/2)**2;
    const dist = 2*R*Math.asin(Math.sqrt(a));
    if(dist > 200) return onFail();
    const s = huntLoadState();
    const key = String(destId);
    if(!s.unlocked.includes(key)){ s.unlocked.push(key); s.points += 100; huntSaveState(s); renderHunt(); }
    showHuntOverlay('Unlocked!', `You earned 100 pts near ${target.name}.`);
  }, () => onFail(), { timeout: 4000 });
}
function huntNearbyTap(idx){
  const item = huntNearbyItems()[Number(idx)];
  if(!item) return;
  showHuntOverlay(item.name || 'Nearby find', item.desc || 'Head to this spot to explore it in person.');
}
function huntOpenTrail(catKey){
  closeHuntPanel();
  if(typeof openDiscoverPanel==='function'){ openDiscoverPanel(); }
  if(typeof filterDestinations==='function'){ try{ filterDestinations(catKey); }catch(_){ } }
}
function huntRedeem(id){
  showHuntOverlay('Reward pending', 'Complete the required discoveries to redeem this reward.');
}

function renderHunt(){
  const body = document.getElementById('huntBody');
  if(!body) return;
  const state = huntLoadState();
  const today = huntTodayDest();
  const nearby = huntNearbyItems();
  const trails = huntTrailGroups();
  const rewards = huntRewardItems();
  const totalDest = (Array.isArray(destinations)?destinations.length:0);
  const discoveries = state.unlocked.length;
  const readyRewards = rewards.length;
  const pct = totalDest ? Math.round((discoveries/totalDest)*100) : 0;

  const tabs = [
    { k:'today', label:"Today's Hunt", svg:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>' },
    { k:'nearby', label:'Nearby', svg:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
    { k:'trails', label:'Trails', svg:'<path d="M3 20l4-8 4 4 4-10 6 14"/>' },
    { k:'collections', label:'Collections', svg:'<path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"/><line x1="8" y1="8" x2="15" y2="8"/><line x1="8" y1="12" x2="15" y2="12"/>' },
    { k:'rewards', label:'Rewards', svg:'<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>' },
    { k:'progress', label:'My Progress', svg:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>' }
  ];

  const todayBlock = today ? `
    <div class="hunt-section" id="huntToday">
      <div class="hunt-today" style="background-image:url('${today.image||''}');background-size:cover;background-position:center">
        <div class="hunt-today-body">
          <span class="hunt-today-badge">TODAY</span>
          <div class="hunt-today-title">${escapeHtml(today.name)} 🌅</div>
          <div class="hunt-today-desc">${escapeHtml(today.description || today.tip || 'Find the hidden marker at this featured spot.')}</div>
          <div class="hunt-meta-row">
            ${today.barangay ? `<span class="hunt-meta-pill">📍 ${escapeHtml(today.barangay)}</span>` : ''}
            <span class="hunt-meta-pill">📶 ${escapeHtml((today.stats && today.stats.rating) || 'Easy')}</span>
            ${(today.stats && today.stats.travel) ? `<span class="hunt-meta-pill">🕒 ${escapeHtml(today.stats.travel)}</span>` : ''}
          </div>
          <div class="hunt-reward-strip">REWARD: 100 pts • Explorer Badge 🏅</div>
        </div>
        <div class="hunt-today-side">
          ${huntAvatars(4, 12)}
          <div class="hunt-avatar-label">+12 travelers active today</div>
          <button class="hunt-cta-teal" onclick="huntStart('${today.id}')">Start Hunt</button>
        </div>
      </div>
    </div>` : '';

  body.innerHTML = `
    <div class="hunt-head">
      <div class="hunt-head-top">
        <div style="min-width:0">
          <div class="hunt-title-row">
            <h1 class="hunt-title">The Hunt</h1>
            <svg class="hunt-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/></svg>
          </div>
          <div class="hunt-sub">Discover. Unlock. Earn.</div>
        </div>
        <button class="hunt-status" onclick="huntScrollToSplit()" aria-label="Jump to progress">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3h-3V1H9v2H6a2 2 0 0 0-2 2v3a5 5 0 0 0 4 4.9V13a4 4 0 0 0 3 3.87V19H8v2h8v-2h-3v-2.13A4 4 0 0 0 16 13v-.1A5 5 0 0 0 20 8V5a2 2 0 0 0-2-2zM6 8V5h2v5.83A3 3 0 0 1 6 8zm12 0a3 3 0 0 1-2 2.83V5h2z"/></svg>
          <span>${discoveries} discoveries / ${readyRewards} rewards ready ›</span>
        </button>
      </div>
      <div class="hunt-copy">Find hidden spots, unlock stories, collect badges, and earn rewards across San Vicente.</div>
    </div>

    <div class="hunt-viewtabs">
      ${tabs.map((t,i)=>`<button class="hunt-vtab ${i===0?'active':''}" data-tab="${t.k}" onclick="huntSelectTab('${t.k}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg>
        <span>${escapeHtml(t.label)}</span>
      </button>`).join('')}
    </div>

    ${todayBlock}

    <div class="hunt-section" id="huntNearby">
      <div class="hunt-sec-head">
        <div><div class="hunt-sec-title">Nearby Discoveries</div><div class="hunt-sec-sub">Hidden spots near you.</div></div>
        <button class="hunt-viewall" onclick="closeHuntPanel(); dockNav('discover');">View all ›</button>
      </div>
      <div class="hunt-hscroll">
        ${nearby.length ? nearby.map((c,i)=>{
          const huntNearbyImages = [
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=75',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=75',
            'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&q=75'
          ];
          const matchDest = (Array.isArray(destinations)?destinations:[]).find(d=>d.name&&c.name&&d.name.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]));
          const imgSrc = matchDest?.image || huntNearbyImages[i%huntNearbyImages.length];
          return `
          <div class="hunt-near-card" style="background-image:url('${imgSrc}');background-size:cover;background-position:center" onclick="huntNearbyTap(${i})">
            ${c.dist ? `<span class="hunt-chip-dist">↖ ${escapeHtml(c.dist)}</span>` : ''}
            <div class="hunt-near-info">
              <div class="hunt-near-title">${escapeHtml(c.icon||'📍')} ${escapeHtml(c.name)}</div>
              <div class="hunt-near-desc">${escapeHtml(c.desc||'')}</div>
              <div class="hunt-near-meta">${escapeHtml(c.barangay||'')} • ${escapeHtml(c.cat||'')}</div>
            </div>
          </div>`;
        }).join('') : '<div class="hunt-empty">No nearby places yet. Add some from the SANVIC Admin panel.</div>'}
      </div>
    </div>

    <div class="hunt-section" id="huntTrails">
      <div class="hunt-sec-head">
        <div><div class="hunt-sec-title">Trails</div><div class="hunt-sec-sub">Complete trails, unlock badges, earn rewards.</div></div>
        <button class="hunt-viewall" onclick="closeHuntPanel(); dockNav('discover');">View all ›</button>
      </div>
      <div class="hunt-hscroll">
        ${trails.length ? trails.map(t=>`
          <div class="hunt-trail-card">
            <div class="hunt-trail-top">
              <div class="hunt-trail-thumb" style="background-image:url('${t.image||''}');background-size:cover;background-position:center;background-color:${t.grad.includes('#') ? t.grad.match(/#[a-f0-9]+/i)?.[0] || '#1a2744' : '#1a2744'}"></div>
              <div class="hunt-trail-body">
                <div class="hunt-trail-title">${escapeHtml(t.title)}</div>
                <div class="hunt-trail-desc">${escapeHtml(t.desc)}</div>
              </div>
            </div>
            <div class="hunt-trail-foot">
              <div class="hunt-progress"><div class="hunt-progress-fill" style="width:${t.total?(t.done/t.total)*100:0}%"></div></div>
              <div class="hunt-progress-count">${t.done} / ${t.total}</div>
              <button class="hunt-chev" onclick="huntOpenTrail('${t.id}')" aria-label="Open trail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>`).join('') : '<div class="hunt-empty">No trails yet — add destinations in the SANVIC Admin panel.</div>'}
      </div>
    </div>

    <div class="hunt-section" id="huntSplit">
      <div class="hunt-split">
        <div class="hunt-col">
          <div class="hunt-sec-head" style="margin-bottom:6px">
            <div><div class="hunt-sec-title">🎁 Rewards</div><div class="hunt-sec-sub">Redeem your unlocked rewards.</div></div>
          </div>
          ${rewards.length ? rewards.map(r=>{
            const allImgs = [];
            if(r.images && Array.isArray(r.images)) allImgs.push(...r.images);
            const hasImages = allImgs.length > 0;
            const rewardBg = hasImages ? `background-image:url('${allImgs[0]}');background-size:cover;background-position:center` : `background:${r.grad}`;
            const rewardOverlay = hasImages ? 'position:relative' : '';
            return `
            <div class="hunt-reward-card" style="${rewardBg};${rewardOverlay}">
              ${hasImages ? '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7));border-radius:inherit"></div>' : ''}
              <span class="hunt-reward-badge" style="position:relative">${escapeHtml(r.badge)}</span>
              <div style="position:relative">
                <div class="hunt-reward-t">${escapeHtml(r.title)}</div>
                <div class="hunt-reward-s">${escapeHtml(r.subtitle||r.sub||'')}</div>
              </div>
              <div class="hunt-reward-row">
                <div></div>
                <button class="hunt-glass-btn" onclick="huntRedeem('${r.id}')">Redeem</button>
              </div>
            </div>`;
          }).join('') : '<div class="hunt-empty">Feature destinations in the SANVIC Admin panel to publish rewards.</div>'}
        </div>
        <div class="hunt-col">
          <div class="hunt-sec-head" style="margin-bottom:6px">
            <div><div class="hunt-sec-title">📊 My Progress</div><div class="hunt-sec-sub">Your journey so far.</div></div>
          </div>
          <div class="hunt-progress-panel">
            <div class="hunt-donut">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
                <circle cx="48" cy="48" r="40" fill="none" stroke="#3fd6d6" stroke-width="8" stroke-linecap="round" stroke-dasharray="${2*Math.PI*40}" stroke-dashoffset="${2*Math.PI*40*(1-pct/100)}"/>
              </svg>
              <div class="hunt-donut-label">${pct}%</div>
            </div>
            <div class="hunt-progress-list">
              <div class="hunt-progress-item">🎯 ${discoveries} discoveries unlocked</div>
              <div class="hunt-progress-item">🗺️ ${trails.length} trails available</div>
              <div class="hunt-progress-item">🏆 ${state.points} points earned</div>
              <div class="hunt-progress-item">🎁 ${readyRewards} rewards ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
