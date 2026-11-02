// ═══════════════════════════════════════════════════════
// PULSE ADMIN — moderate posts/comments, mute/ban users,
// manage category chips. Uses security-definer RPC functions
// (admin_delete_pulse_post etc.) which check has_role(auth.uid(),
// 'admin') inside, so only a signed-in admin can moderate.
// ═══════════════════════════════════════════════════════
let pulseAdminSubTab = "posts";
let pulseAdminEditingPostId = null;

function renderAdminPulse() {
  const body = document.getElementById("adminBody");
  body.innerHTML = `
    <div class="admin-tala-filters">
      <button class="admin-cat-tab ${pulseAdminSubTab === "posts" ? "active" : ""}" onclick="adminPulseSetSubTab('posts')">Posts</button>
      <button class="admin-cat-tab ${pulseAdminSubTab === "categories" ? "active" : ""}" onclick="adminPulseSetSubTab('categories')">Categories</button>
      <button class="admin-cat-tab ${pulseAdminSubTab === "users" ? "active" : ""}" onclick="adminPulseSetSubTab('users')">Users</button>
    </div>
    <div id="adminPulseBody"><div class="admin-empty">Loading…</div></div>`;

  if (pulseAdminSubTab === "posts") renderAdminPulsePosts();
  else if (pulseAdminSubTab === "categories") renderAdminPulseCategories();
  else renderAdminPulseUsers();
}

function adminPulseSetSubTab(tab) {
  pulseAdminSubTab = tab;
  pulseAdminEditingPostId = null;
  renderAdminPulse();
}

// ───────────── POSTS (edit / delete any post or comment) ─────────────

async function renderAdminPulsePosts() {
  const body = document.getElementById("adminPulseBody");
  try {
    const { data: posts, error } = await sb
      .from("pulse_posts")
      .select(
        "id, user_id, category, text_content, image_url, location_text, display_name, is_anonymous, admin_post, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    if (!posts || !posts.length) {
      body.innerHTML = `<div class="admin-empty">No Tribes posts yet.</div>`;
      return;
    }

    // Fetch comment counts separately (avoids RLS-hanging count aggregates)
    const postIds = posts.map((p) => p.id);
    const { data: commentCounts } = await sb
      .from("pulse_comments")
      .select("post_id")
      .in("post_id", postIds);
    const countByPost = {};
    (commentCounts || []).forEach((r) => {
      countByPost[r.post_id] = (countByPost[r.post_id] || 0) + 1;
    });

    body.innerHTML = posts
      .map((p) => {
        const isEditing = pulseAdminEditingPostId === p.id;
        const commentCount = countByPost[p.id] || 0;
        const authorLabel = p.is_anonymous ? "Anonymous" : p.display_name || "Traveler";
        return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <div class="admin-tala-badges">
              <span class="admin-cat-pill knowledge">${escapeHtml(p.category || "all")}</span>
              ${p.admin_post ? '<span class="admin-cat-pill personality">Admin post</span>' : ""}
              <span class="admin-len-pill">${commentCount} comment${commentCount === 1 ? "" : "s"}</span>
            </div>
            <strong>${escapeHtml(authorLabel)}</strong> · <span style="color:var(--white-dim);font-size:.7rem;">${new Date(p.created_at).toLocaleString()}</span>
            ${
              isEditing
                ? `
              <div class="admin-field" style="margin-top:8px;"><textarea id="adminPulsePostText-${p.id}" rows="3">${escapeHtml(p.text_content || "")}</textarea></div>
              <div class="admin-field"><label>Category</label><input id="adminPulsePostCat-${p.id}" value="${escapeHtml(p.category || "")}"></div>
              <div class="admin-edit-actions">
                <button class="admin-save-btn" onclick="adminPulseSavePost(${p.id})">Save</button>
                <button class="admin-cancel-btn" onclick="pulseAdminEditingPostId=null;renderAdminPulsePosts();">Cancel</button>
              </div>
            `
                : `<div style="margin-top:6px;font-size:.82rem;color:var(--white-soft);">${escapeHtml(p.text_content || "(no text)")}</div>`
            }
            ${p.image_url ? `<img src="${p.image_url}" loading="lazy" decoding="async" style="max-width:120px;border-radius:8px;margin-top:8px;display:block;" onerror="this.style.display='none'">` : ""}
          </div>
          ${
            !isEditing
              ? `
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="pulseAdminEditingPostId=${p.id};renderAdminPulsePosts();">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminPulseDeletePost(${p.id})">Delete</button>
          </div>`
              : ""
          }
        </div>
      </div>`;
      })
      .join("");
  } catch (err) {
    body.innerHTML = `<div class="admin-empty">Could not load posts: ${escapeHtml(err.message || String(err))}</div>`;
  }
}

async function adminPulseSavePost(postId) {
  if (!adminRequireWrite()) return;
  const text = document.getElementById(`adminPulsePostText-${postId}`).value.trim();
  const cat = document.getElementById(`adminPulsePostCat-${postId}`).value.trim();
  try {
    const { error } = await sb.rpc("admin_update_pulse_post", {
      post_id: postId,
      new_text: text,
      new_category: cat,
    });
    if (error) throw error;
    pulseAdminEditingPostId = null;
    renderAdminPulsePosts();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminPulseDeletePost(postId) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this post and all its comments/likes? This cannot be undone.")) return;
  try {
    const { error } = await sb.rpc("admin_delete_pulse_post", { post_id: postId });
    if (error) throw error;
    renderAdminPulsePosts();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

// ───────────── CATEGORIES ─────────────

let pulseAdminEditingCatId = null;

async function renderAdminPulseCategories() {
  const body = document.getElementById("adminPulseBody");
  try {
    const { data: cats, error } = await sb.from("pulse_categories").select("*").order("sort_order");
    if (error) throw error;

    let html = `<button class="admin-add-btn" onclick="pulseAdminEditingCatId='new';renderAdminPulseCategories();">+ Add category</button>`;

    if (pulseAdminEditingCatId !== null) {
      const isNew = pulseAdminEditingCatId === "new";
      const c = isNew
        ? { key: "", label: "", sort_order: (cats || []).length }
        : cats.find((x) => x.id === pulseAdminEditingCatId);
      if (c) {
        html += `
        <div class="admin-edit-box">
          <div class="admin-field"><label>Key (used in code, lowercase, no spaces)</label><input id="catfKey" value="${escapeHtml(c.key)}" ${isNew ? "" : "disabled"}></div>
          <div class="admin-field"><label>Label (shown to users)</label><input id="catfLabel" value="${escapeHtml(c.label)}"></div>
          <div class="admin-edit-actions">
            <button class="admin-save-btn" onclick="adminPulseSaveCategory(${isNew ? "'new'" : c.id})">${isNew ? "Create" : "Save changes"}</button>
            <button class="admin-cancel-btn" onclick="pulseAdminEditingCatId=null;renderAdminPulseCategories();">Cancel</button>
          </div>
        </div>`;
      }
    }

    html += (cats || [])
      .map(
        (c) => `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(c.label)}</strong> <span style="color:var(--white-dim);font-size:.7rem;">(${escapeHtml(c.key)})</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="pulseAdminEditingCatId=${c.id};renderAdminPulseCategories();">Edit</button>
            ${c.key !== "all" ? `<button class="admin-mini-btn danger" onclick="adminPulseDeleteCategory(${c.id})">Delete</button>` : ""}
          </div>
        </div>
      </div>`,
      )
      .join("");

    body.innerHTML = html;
  } catch (err) {
    body.innerHTML = `<div class="admin-empty">Could not load categories: ${escapeHtml(err.message || String(err))}</div>`;
  }
}

async function adminPulseSaveCategory(id) {
  if (!adminRequireWrite()) return;
  const key = document
    .getElementById("catfKey")
    .value.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const label = document.getElementById("catfLabel").value.trim();
  if (!key || !label) {
    alert("Key and label are both required.");
    return;
  }
  try {
    if (id === "new") {
      const { error } = await sb.from("pulse_categories").insert({ key, label, sort_order: 999 });
      if (error) throw error;
    } else {
      const { error } = await sb.from("pulse_categories").update({ label }).eq("id", id);
      if (error) throw error;
    }
    pulseAdminEditingCatId = null;
    renderAdminPulseCategories();
    refreshPulseCategoryChips();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminPulseDeleteCategory(id) {
  if (!adminRequireWrite()) return;
  if (
    !confirm(
      "Delete this category? Existing posts tagged with it will keep their tag, but it will no longer appear as a filter chip.",
    )
  )
    return;
  try {
    const { error } = await sb.from("pulse_categories").delete().eq("id", id);
    if (error) throw error;
    renderAdminPulseCategories();
    refreshPulseCategoryChips();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

// Called from admin after saving/deleting a category, so any open
// Pulse panel picks up the new label immediately.
// Called after a category is added, renamed or deleted in the Backoffice. It used
// to call a helper that was never written — so saving a category threw and
// nothing on screen changed.
async function refreshPulseCategoryChips() {
  await loadPulseCategoriesFromDB();
  renderPulseComposeCategoryMenu();
  if (pulseView === "feed") renderPulseFeed();
}

// ───────────── USERS (mute / ban) ─────────────

async function renderAdminPulseUsers() {
  const body = document.getElementById("adminPulseBody");
  body.innerHTML = `
    <input class="admin-tala-search" id="pulseUserSearch" placeholder="Search by name or email..." oninput="adminPulseSearchUsers(this.value)">
    <div id="pulseUserResults"><div class="admin-empty">Type a name to search for a traveler.</div></div>`;
}

let pulseUserSearchTimer = null;
function adminPulseSearchUsers(q) {
  clearTimeout(pulseUserSearchTimer);
  pulseUserSearchTimer = setTimeout(() => doAdminPulseSearchUsers(q), 300);
}

async function doAdminPulseSearchUsers(q) {
  const results = document.getElementById("pulseUserResults");
  q = q.trim();
  if (!q) {
    results.innerHTML = `<div class="admin-empty">Type a name to search for a traveler.</div>`;
    return;
  }
  try {
    const { data: users, error } = await sb
      .from("traveler_profiles")
      .select("id, display_name, is_muted, is_banned, moderation_note")
      .ilike("display_name", `%${q}%`)
      .limit(20);
    if (error) throw error;

    if (!users || !users.length) {
      results.innerHTML = `<div class="admin-empty">No travelers found matching "${escapeHtml(q)}".</div>`;
      return;
    }

    results.innerHTML = users
      .map(
        (u) => `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(u.display_name || "(no name)")}</strong>
            <div class="admin-tala-badges" style="margin-top:4px;">
              ${u.is_muted ? '<span class="admin-cat-pill personality">Muted</span>' : ""}
              ${u.is_banned ? '<span class="admin-cat-pill personality" style="background:rgba(239,68,68,.16);color:#fca5a5;">Banned</span>' : ""}
              ${!u.is_muted && !u.is_banned ? '<span class="admin-cat-pill knowledge">Active</span>' : ""}
            </div>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminPulseToggleMute('${u.id}', ${!u.is_muted})">${u.is_muted ? "Unmute" : "Mute"}</button>
            <button class="admin-mini-btn danger" onclick="adminPulseToggleBan('${u.id}', ${!u.is_banned})">${u.is_banned ? "Unban" : "Ban"}</button>
          </div>
        </div>
      </div>`,
      )
      .join("");
  } catch (err) {
    results.innerHTML = `<div class="admin-empty">Search failed: ${escapeHtml(err.message || String(err))}</div>`;
  }
}

async function adminPulseToggleMute(userId, muted) {
  if (!adminRequireWrite()) return;
  try {
    const { error } = await sb.rpc("admin_set_user_moderation", {
      target_user_id: userId,
      muted,
      banned: false,
      note: null,
    });
    if (error) throw error;
    doAdminPulseSearchUsers(document.getElementById("pulseUserSearch").value);
  } catch (err) {
    alert("Action failed: " + (err.message || err));
  }
}

async function adminPulseToggleBan(userId, banned) {
  if (!adminRequireWrite()) return;
  if (banned && !confirm("Ban this traveler? They will be unable to post or comment in Tribes."))
    return;
  try {
    const { error } = await sb.rpc("admin_set_user_moderation", {
      target_user_id: userId,
      muted: false,
      banned,
      note: null,
    });
    if (error) throw error;
    doAdminPulseSearchUsers(document.getElementById("pulseUserSearch").value);
  } catch (err) {
    alert("Action failed: " + (err.message || err));
  }
}

// ═══════════════════════════════════════════════════════
// THE HUNT — admin-managed data
// ═══════════════════════════════════════════════════════
let HUNT_SETTINGS = {};
// Rewards are only ever what the SANVIC team publishes in the hunt_rewards
// table. This list starts empty on purpose: it used to hold three invented
// rewards with stock photos, which read to a visitor as real offers that
// nobody created. An empty table now means an honest empty panel.
let HUNT_REWARDS = [];

// ═══════════════════════════════════════════════════════
// MY SANVIC — private pocket panel
// ═══════════════════════════════════════════════════════
// My Journey buffers. Every one of these is filled from Supabase — tribes,
// events and the admin-curated upcoming items at boot, saved places on open —
// and then filtered to what this visitor actually did. There is deliberately
// no demo content here: the panel must never show a place, tribe or event that
// nobody collected.
let MYSV_UPCOMING = []; // my_sanvic_upcoming, admin-curated
let MYSV_SAVED = []; // saved_places, this device or this account
let MYSV_TRIBES = []; // tribes, filtered to the ones this visitor joined
let MYSV_EVENTS = []; // events, filtered to the ones this visitor joined

// ── RECENTLY VIEWED ───────────────────────────────────────────────────────
// The only section of My Journey with no server-side record, so we keep a
// short local trail of places actually opened. Same device-bound pattern as
// the hunt's points: real on the phone you used, and lost with the browser.
const MYSV_RECENT_KEY = "sanvic_recent_places";
function mysvTrackRecent(d) {
  if (!d || d.id == null) return;
  try {
    const list = JSON.parse(localStorage.getItem(MYSV_RECENT_KEY) || "[]");
    const entry = { id: d.id, label: d.name || "Place", image: d.image || "" };
    const next = [entry, ...list.filter((r) => String(r.id) !== String(d.id))].slice(0, 8);
    localStorage.setItem(MYSV_RECENT_KEY, JSON.stringify(next));
  } catch (_) {}
}
function mysvRecentList() {
  try {
    return JSON.parse(localStorage.getItem(MYSV_RECENT_KEY) || "[]");
  } catch (_) {
    return [];
  }
}

// There are no accounts any more, so nothing to sync and nobody to sign in.
function mysvIsSignedIn() {
  return false;
}
function mysvSyncDismissed() {
  try {
    return sessionStorage.getItem("mysv_sync_dismissed") === "1";
  } catch (_) {
    return false;
  }
}
function mysvDismissSync() {
  try {
    sessionStorage.setItem("mysv_sync_dismissed", "1");
  } catch (_) {}
  renderMySanvic();
}
function mysvSignIn() {
  openDashboard("overview");
}

// Load saved places for whoever is holding the device: the account when signed
// in, otherwise the same anonymous device id the save button already writes
// with. Signed-in saves follow the traveller; device saves stay on the phone.
// Never demo content — if nothing was saved, the section is simply empty.
async function loadMySanvicSaved() {
  try {
    const owner = saveOwner();
    const { data: saved, error } = await sb
      .from("saved_places")
      .select("id, destination_id")
      .eq(owner.col, owner.val);
    if (error) throw error;
    const rows = saved || [];
    const destIds = rows.map((s) => s.destination_id).filter(Boolean);
    if (!destIds.length) {
      MYSV_SAVED = [];
      return;
    }
    // Fetch destination details for each saved place
    const { data: dests } = await sb
      .from("destinations")
      .select("id, name, category, barangay, image")
      .in("id", destIds);
    const destMap = new Map((dests || []).map((d) => [d.id, d]));
    MYSV_SAVED = rows
      .map((s) => {
        const d = destMap.get(s.destination_id);
        if (!d) return null;
        const catLabel = (catStyle[d.category] && catStyle[d.category].label) || d.category || "";
        return {
          id: "sp_" + s.id,
          destId: d.id,
          title: d.name || "Saved place",
          cat: catLabel + (d.barangay ? " • " + d.barangay : ""),
          km: "",
          image: d.image || "",
          grad: "linear-gradient(135deg,#38bdf8,#0c4a6e)",
        };
      })
      .filter(Boolean);
  } catch (e) {
    console.warn("[MYSV] Could not load saved places:", e);
  }
}

function openMySanvicPanel() {
  const p = document.getElementById("mySanvicPanel");
  if (!p) return;
  p.classList.add("open");
  p.setAttribute("aria-hidden", "false");
  // Joins normally arrive in the boot payload; re-fetch only when that came
  // back empty, so a tribe someone really joined is never missing here.
  const needsJoins =
    !(typeof myTribes !== "undefined" && myTribes && myTribes.size) &&
    typeof loadJoinData === "function";
  Promise.all([loadMySanvicSaved(), needsJoins ? loadJoinData() : Promise.resolve()])
    .then(() => renderMySanvic())
    .catch(() => renderMySanvic());
}
function closeMySanvicPanel() {
  const p = document.getElementById("mySanvicPanel");
  if (!p) return;
  p.classList.remove("open");
  p.setAttribute("aria-hidden", "true");
}

// No avatars are invented here. The panel used to draw three gradient dots for
// every joined tribe and event whether or not anyone else had joined, which read
// as real members. Only the known count is shown.
function mysvAvatars(count, more) {
  if (!more) return "";
  return `<div class="mysv-avatars"><div class="mysv-avatar-more">+${escapeHtml(String(more))}</div></div>`;
}

// Real hunt numbers, from the same localStorage state the Hunt panel reads.
// Device-bound, exactly like the Hunt itself — no invented progress here.
function mysvHuntStats() {
  const state = huntLoadState();
  const total = Array.isArray(destinations) ? destinations.length : 0;
  const found = state.unlocked.length;
  const rewards = typeof huntRewardItems === "function" ? huntRewardItems() : [];
  const nextReward = rewards.find((r) => !state.claimed.includes(String(r.id))) || null;
  return {
    total,
    found,
    pct: total ? Math.round((found / total) * 100) : 0,
    points: state.points,
    claimed: state.claimed.length,
    nextReward,
    rewardCount: rewards.length,
  };
}

// What the visitor actually put on their list from Today. Resolved back to the
// rows themselves, so My Journey shows the item by its own name — the panel
// used to show the admin-curated my_sanvic_upcoming cards here instead, which
// is half of why saving "Fiesta day" appeared to show up as something else.
function mysvTodayGoing() {
  const out = [];
  const seen = new Set();
  const push = (key, title, meta) => {
    if (!myToday.has(key) || seen.has(key)) return;
    seen.add(key);
    out.push({ id: key, title: title || "Saved", meta: meta || "" });
  };
  (TODAY_DATA.happening || []).forEach((e, i) =>
    push(todayItemKey(e, i), e.title, [e.place, e.time].filter(Boolean).join(" · ")),
  );
  (TODAY_DATA.joinable || []).forEach((j, i) => push(todayJoinableKey(j), j.title, j.detail || ""));
  return out;
}

function renderMySanvic() {
  const body = document.getElementById("mysvBody");
  if (!body) return;
  const signedIn = false;
  const showSync = false;

  const hunt = mysvHuntStats();
  const recent = mysvRecentList();
  const joinedTribes = MYSV_TRIBES.filter((t) =>
    typeof myTribes !== "undefined" && myTribes ? myTribes.has(String(t.id)) : false,
  );
  const joinedEvents = MYSV_EVENTS.filter((e) =>
    typeof myEvents !== "undefined" && myEvents ? myEvents.has(String(e.id)) : false,
  );
  const goingItems = mysvTodayGoing();

  const hasContent =
    MYSV_SAVED.length ||
    joinedTribes.length ||
    joinedEvents.length ||
    goingItems.length ||
    recent.length ||
    hunt.found > 0;

  const header = `
    <div class="mysv-head">
      <div class="mysv-title-row">
        <h1 class="mysv-title">My Journey</h1>
        <svg class="mysv-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <div class="mysv-sub">Your saves, tribes, chat rooms and discoveries.</div>
      <div class="mysv-tag">Your San Vicente, quietly collected.</div>
    </div>`;

  const sync = showSync
    ? `
    <div class="mysv-sync">
      <div class="mysv-sync-ico">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="8 13 12 9 16 13"/><line x1="12" y1="9" x2="12" y2="17"/></svg>
      </div>
      <div class="mysv-sync-body">
        <div class="mysv-sync-t">Everything stays on this device</div>
        <div class="mysv-sync-s">No account needed. Your saves, tribes and discoveries live here.</div>
      </div>
    </div>`
    : "";

  if (!hasContent) {
    body.innerHTML =
      header +
      sync +
      `
      <div class="mysv-empty">
        <div class="mysv-empty-t">Your journey is still empty.</div>
        <div class="mysv-empty-s">Save places, join tribes, follow events, or unlock discoveries. They'll appear here.</div>
        <div class="mysv-empty-actions">
          <button class="mysv-cap-btn" onclick="closeMySanvicPanel();dockNav('discover')">Explore San Vicente</button>
          <button class="mysv-cap-btn" onclick="closeMySanvicPanel();dockNav('pulse')">Open Tribes</button>
          <button class="mysv-cap-btn" onclick="closeMySanvicPanel();dockNav('hunt')">Try The Hunt</button>
        </div>
      </div>`;
    return;
  }

  // Only what the visitor put on their own list. The admin-curated
  // my_sanvic_upcoming cards used to render here as though they were the
  // visitor's own saves, which is the other half of the "I saved Fiesta day and
  // it shows me something different" report.
  const going = goingItems.length
    ? `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">${lucideSvg("calendar", 15)} You're going</div><div class="mysv-sec-sub">Saved from Today.</div></div>
      </div>
      <div class="mysv-hscroll">
        ${goingItems
          .map(
            (g) => `
          <div class="mysv-up-card" style="background:linear-gradient(135deg,#0ea5e9,#0c4a6e)">
            <div class="mysv-up-info">
              <div class="mysv-up-title">${escapeHtml(g.title)}</div>
              <div class="mysv-up-meta">${escapeHtml(g.meta)}</div>
            </div>
          </div>`,
          )
          .join("")}
      </div>
    </div>`
    : "";

  const saved = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">${lucideSvg("luggage", 15)} Saved Places</div><div class="mysv-sec-sub">Places you saved from Explore.</div></div>
        
      </div>
      <div class="mysv-hscroll">
        ${MYSV_SAVED.map((s) => {
          const cardBg = s.image
            ? `background-image:url('${escapeHtml(s.image)}');background-size:cover;background-position:center;`
            : `background:${s.grad};`;
          return `
          <div class="mysv-sv-card" style="${cardBg}">
            <button class="mysv-sv-heart" onclick="mysvToggleSaved('${s.id}')" aria-label="Remove from saved">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <div class="mysv-sv-info" onclick="mysvAction('view','${s.destId}')" role="button" tabindex="0" style="cursor:pointer">
              <div class="mysv-sv-title">${escapeHtml(s.title)}</div>
              <div class="mysv-sv-cat">${escapeHtml(s.cat)}</div>
              <div class="mysv-sv-row">
                <span class="mysv-km">${lucideSvg("map-pin", 12)} Open place</span>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;

  const tribes = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">${lucideSvg("users", 15)} Joined Tribes</div><div class="mysv-sec-sub">Tribes you joined on this device.</div></div>
        
      </div>
      <div>
        ${joinedTribes
          .map((t) => {
            const thumbBg = t.thumb
              ? `background-image:url('${escapeHtml(t.thumb)}');background-size:cover;background-position:center;`
              : `background:${t.grad};`;
            return `
          <div class="mysv-tribe-row">
            <div class="mysv-tribe-thumb" style="${thumbBg}"></div>
            <div class="mysv-tribe-body">
              <div class="mysv-tribe-title">${escapeHtml(t.title)}</div>
              <div class="mysv-tribe-meta">${escapeHtml(t.meta)}</div>
              ${t.credit ? `<div class="pv2-creditline">${escapeHtml(t.credit)}</div>` : ""}
            </div>
            ${mysvAvatars(3, t.more)}
            <button class="mysv-cap-btn" onclick="mysvAction('openChat','${t.id}')">Open Chat</button>
          </div>`;
          })
          .join("")}
      </div>
    </div>`;

  const rewardThumb = hunt.nextReward
    ? hunt.nextReward.images && hunt.nextReward.images[0]
      ? `background-image:url('${escapeHtml(hunt.nextReward.images[0])}');background-size:cover;background-position:center;`
      : `background:${hunt.nextReward.grad || "linear-gradient(135deg,#0ea5e9,#0c4a6e)"};`
    : "";

  const split = `
    <div class="mysv-section">
      <div class="mysv-split${joinedEvents.length ? "" : " single"}">
        ${
          joinedEvents.length
            ? `<div class="mysv-col">
          <div class="mysv-sec-head" style="margin-bottom:6px">
            <div><div class="mysv-sec-title">${lucideSvg("calendar", 15)} Events I'm Interested In</div><div class="mysv-sec-sub">You showed interest in these.</div></div>
          </div>
          ${joinedEvents
            .map((e) => {
              const evImg = e.images && e.images.length ? e.images[0] : "";
              const evBg = evImg
                ? `background-image:url('${escapeHtml(evImg)}');background-size:cover;background-position:center;`
                : `background:${e.grad};`;
              return `
            <div class="mysv-ev-card">
              <div class="mysv-ev-thumb" style="${evBg}"></div>
              <div class="mysv-ev-body">
                <div class="mysv-ev-title">${escapeHtml(e.title)}</div>
                <div class="mysv-ev-meta">${escapeHtml(e.meta)}</div>
                ${e.credit ? `<div class="pv2-creditline">${escapeHtml(e.credit)}</div>` : ""}
                <div class="mysv-ev-row">
                  ${mysvAvatars(3, e.more)}
                  <button class="mysv-cap-btn" onclick="mysvAction('details','${e.id}')">View Details</button>
                </div>
              </div>
            </div>`;
            })
            .join("")}
        </div>`
            : ""
        }
        <div class="mysv-col">
          <div class="mysv-sec-head" style="margin-bottom:6px">
            <div><div class="mysv-sec-title">${lucideSvg("target", 15)} Hunt Progress</div><div class="mysv-sec-sub">Your discoveries and rewards.</div></div>
            
          </div>
          <div class="mysv-hunt">
            <div class="mysv-hunt-main">
              <div class="mysv-ring">
                <svg width="74" height="74" viewBox="0 0 74 74">
                  <circle cx="37" cy="37" r="32" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
                  <circle cx="37" cy="37" r="32" fill="none" stroke="#3fd6d6" stroke-width="6" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 32}" stroke-dashoffset="${2 * Math.PI * 32 * (1 - hunt.pct / 100)}"/>
                </svg>
                <div class="mysv-ring-label">${hunt.pct}%</div>
              </div>
              <div class="mysv-hunt-info">
                <div class="mysv-hunt-title">${hunt.points} points</div>
                <div class="mysv-hunt-meta">${hunt.found} of ${hunt.total} discoveries<br>${hunt.nextReward ? "Next: " + escapeHtml(hunt.nextReward.title) : hunt.rewardCount ? "All rewards unlocked" : "No rewards published yet"}</div>
              </div>
              <div class="mysv-gift" onclick="mysvAction('reward','')" role="button" tabindex="0" style="cursor:pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              </div>
            </div>
            ${
              hunt.nextReward
                ? `
            <div class="mysv-reward">
              <div class="mysv-reward-thumb" style="${rewardThumb}"></div>
              <div class="mysv-reward-body">
                <div class="mysv-reward-lab">Next reward</div>
                <div class="mysv-reward-t">${escapeHtml(hunt.nextReward.title)}</div>
              </div>
              <button class="mysv-cap-btn" onclick="mysvAction('reward','${escapeHtml(String(hunt.nextReward.id))}')">View Reward</button>
            </div>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>`;

  const recentHtml = `
    <div class="mysv-section">
      <div class="mysv-sec-head">
        <div><div class="mysv-sec-title">${lucideSvg("clock", 15)} Recently Viewed</div><div class="mysv-sec-sub">Places you recently looked at.</div></div>
        
      </div>
      <div class="mysv-hscroll">
        ${recent
          .map(
            (r) => `
          <button class="mysv-pill" onclick="mysvAction('view','${r.id}')" aria-label="${escapeHtml(r.label)}">
            <span class="mysv-pill-thumb" style="background-image:url('${escapeHtml(r.image || "")}');background-size:cover;background-position:center;background-color:#2a3247"></span>
            ${escapeHtml(r.label)}
          </button>`,
          )
          .join("")}
      </div>
    </div>`;

  // Empty sections are omitted rather than shown blank. Hunt progress is the
  // one block that always renders, because a zero state there is information.
  body.innerHTML =
    header +
    sync +
    going +
    (MYSV_SAVED.length ? saved : "") +
    (joinedTribes.length ? tribes : "") +
    split +
    (recent.length ? recentHtml : "");
}

async function mysvToggleSaved(id) {
  const i = MYSV_SAVED.findIndex((s) => s.id === id);
  if (i < 0) return;
  // 'sp_' ids are real saved_places rows — remove the row too, not just the
  // card, so Explore's heart and this list cannot drift apart.
  if (id.startsWith("sp_")) {
    const realId = id.replace("sp_", "");
    try {
      await sb.from("saved_places").delete().eq("id", realId);
    } catch (e) {
      console.warn("[MYSV] delete failed:", e);
    }
  }
  MYSV_SAVED.splice(i, 1);
  renderMySanvic();
}
function mysvAction(kind, id) {
  if (!mysvIsSignedIn() && (kind === "openChat" || kind === "interested")) {
    return mysvSignIn();
  }
  if (kind === "view" && id) {
    // Open the place itself rather than a copy of it inside this panel.
    const dest = (Array.isArray(destinations) ? destinations : []).find(
      (d) => String(d.id) === String(id),
    );
    if (dest) {
      closeMySanvicPanel();
      openDest(dest);
      return;
    }
  }
  if (kind === "reward") {
    closeMySanvicPanel();
    dockNav("hunt");
    return;
  }
  if (kind === "openChat" || kind === "details" || kind === "interested") {
    closeMySanvicPanel();
    if (typeof openPulsePanel === "function") openPulsePanel();
    return;
  }
}

// ═══════════════════════════════════════════════════════
// THE HUNT — discovery, unlock, earn.
// All content derives from the same Supabase tables used elsewhere:
//   • destinations       → today's hunt, trails, rewards, geo targets
//   • nearby_places      → "Nearby Discoveries" carousel
// Progress/points stay in localStorage (client-only gamification layer).
// ═══════════════════════════════════════════════════════

function huntGradientFor(color, i) {
  const base = color || ["#0ea5e9", "#f97316", "#34d399", "#a78bfa", "#f59e0b", "#38bdf8"][i % 6];
  return `linear-gradient(135deg, ${base}, rgba(0,0,0,.65))`;
}
function huntTargetFor(dest) {
  if (!dest || dest.lat == null || dest.lng == null) return null;
  return { lat: Number(dest.lat), lng: Number(dest.lng), name: dest.name };
}
function huntTodayDest() {
  const list = Array.isArray(destinations) ? destinations : [];
  return (
    list.find((d) => d.featured && d.lat != null) ||
    list.find((d) => d.lat != null) ||
    list[0] ||
    null
  );
}

// ── HUNTING SPOTS ─────────────────────────────────────────────────────────
// A hunting spot is a place the team flagged for the Hunt. Each one carries the
// clue the visitor has to work out, and unlocks by GPS when they actually reach
// it — no QR code, no scanning. Until somewhere is flagged there is nothing to
// hunt, and the panel says so instead of inventing spots.
// ── THE RIDDLES ───────────────────────────────────────────────────────────
// Written by the partner, kept in their own table so they never appear as
// ordinary pins in Explore and give themselves away. Loaded when the Hunt opens
// rather than at boot, because nobody needs them until then.
let HUNT_RIDDLES = [];
let huntRiddlesLoaded = false;
async function loadHuntRiddles() {
  if (huntRiddlesLoaded) return HUNT_RIDDLES;
  try {
    const { data, error } = await sb
      .from("hunt_riddles")
      .select("id,slug,title,verse,lat,lng,difficulty,image_url,hint,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    HUNT_RIDDLES = data || [];
    huntRiddlesLoaded = true;
  } catch (err) {
    console.warn("[SANVIC] Riddles failed to load:", err);
  }
  return HUNT_RIDDLES;
}

// Unlocked by being there, same rule as a hunting spot. Keyed on the riddle slug
// so it can never collide with a destination id.
function huntRiddleCard(r, i) {
  const state = huntLoadState();
  const done = state.unlocked.includes(r.slug);
  const img = r.image_url || "";
  const verse = String(r.verse || "").trim();
  return `
    <div class="hunt-spot hunt-riddle${done ? " is-done" : ""}">
      <div class="hunt-spot-media">
        ${
          img
            ? `<div class="hunt-spot-thumb" style="background-image:url('${escapeHtml(img)}')"></div>`
            : `<div class="hunt-spot-thumb hunt-spot-thumb-none" aria-hidden="true">${lucideSvg("image", 20)}</div>`
        }
        <span class="hunt-spot-chip">${done ? lucideSvg("circle-check", 12) + " Found" : "Riddle " + (i + 1)}</span>
      </div>
      <div class="hunt-spot-body">
        <div class="hunt-riddle-title">${escapeHtml(r.title || "Riddle")}</div>
        ${r.difficulty ? `<div class="hunt-riddle-diff">Difficulty ${escapeHtml(r.difficulty)}</div>` : ""}
        <div class="hunt-riddle-verse">${escapeHtml(verse)}</div>
        <button class="hunt-glass-btn" onclick="huntStartRiddle('${escT(r.slug)}')">${done ? "Visit again" : "Unlock at the spot"}</button>
      </div>
    </div>`;
}

// The riddle version of huntStart: same GPS rule, coordinates from the riddle.
function huntStartRiddle(slug) {
  const r = HUNT_RIDDLES.find((x) => String(x.slug) === String(slug));
  if (!r || r.lat == null || r.lng == null) {
    showHuntOverlay("No location yet", "This riddle has no coordinates in the admin yet.");
    return;
  }
  const onFail = () =>
    showHuntOverlay(
      "Not there yet",
      "Get to the place the riddle describes and try again. It unlocks within 200 m.",
    );
  if (!navigator.geolocation) return onFail();
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const R = 6371000,
        toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(r.lat - pos.coords.latitude);
      const dLng = toRad(r.lng - pos.coords.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pos.coords.latitude)) * Math.cos(toRad(r.lat)) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.sqrt(a));
      if (dist > 200) return onFail();
      const s = huntLoadState();
      if (!s.unlocked.includes(r.slug)) {
        s.unlocked.push(r.slug);
        s.points += 100;
        huntSaveState(s);
        renderHunt();
      }
      showHuntOverlay("Found it!", `${r.title} — 100 points.`);
    },
    () => onFail(),
    { timeout: 8000 },
  );
}

function huntSpotList() {
  return (Array.isArray(destinations) ? destinations : []).filter(
    (d) => d.huntSpot && d.lat != null && d.lng != null,
  );
}
// The photo on a spot card is deliberately a tight crop, not the wide shot: the
// old panorama gave the place away instantly, which defeats a clue. It hints
// without confirming.
function huntSpotCard(d, i) {
  const state = huntLoadState();
  const done = state.unlocked.includes(String(d.id));
  const img = d.image || (Array.isArray(d.images) ? d.images[0] || "" : "");
  return `
    <div class="hunt-spot${done ? " is-done" : ""}">
      <div class="hunt-spot-media">
        ${
          img
            ? `<div class="hunt-spot-thumb" style="background-image:url('${escapeHtml(img)}')"></div>`
            : `<div class="hunt-spot-thumb hunt-spot-thumb-none">${lucideSvg("camera", 20)}</div>`
        }
        <span class="hunt-spot-chip">${done ? lucideSvg("circle-check", 12) + " Found" : "Spot " + (i + 1)}</span>
      </div>
      <div class="hunt-spot-body">
        <div class="hunt-spot-clue">${escapeHtml(d.clue || "No clue written for this spot yet.")}</div>
        <div class="hunt-spot-name">${
          done
            ? lucideSvg("map-pin", 13) + " " + escapeHtml(d.name)
            : lucideSvg("eye-off", 13) + " Find it to reveal"
        }</div>
        <button class="hunt-glass-btn" onclick="huntStart('${d.id}')">${done ? "Visit again" : "Unlock at the spot"}</button>
      </div>
    </div>`;
}
function huntNearbyItems() {
  const flat = [];
  Object.keys(nearbyPlacesByBarangay || {}).forEach((b) => {
    (nearbyPlacesByBarangay[b] || []).forEach((p) => flat.push({ ...p, barangay: b }));
  });
  return flat.slice(0, 12);
}
function huntTrailGroups() {
  const list = Array.isArray(destinations) ? destinations : [];
  const state = huntLoadState();
  const byCat = {};
  list.forEach((d) => {
    const key = d.category || "explore";
    (byCat[key] = byCat[key] || []).push(d);
  });
  return Object.keys(byCat).map((k, i) => {
    const items = byCat[k];
    const done = items.filter((d) => state.unlocked.includes(String(d.id))).length;
    const label =
      (window.catStyle && catStyle[k] && catStyle[k].label) ||
      k.charAt(0).toUpperCase() + k.slice(1);
    const firstImg = items.find((d) => d.image)?.image || "";
    // Category labels are plural ("Islands", "Stays"), so dropping them into
    // "Explore N ___ spots" read as "2 islands spots". Use a singular noun.
    const noun = { beaches: "beach", islands: "island", stays: "stay" }[k] || label.toLowerCase();
    return {
      id: k,
      title: `${label} Trail`,
      desc: `Explore ${items.length} ${noun} spot${items.length === 1 ? "" : "s"} across San Vicente.`,
      done,
      total: items.length,
      image: firstImg,
      grad: huntGradientFor(items[0] && items[0].color, i),
    };
  });
}
// Admin-published rewards only. This used to fall back to "X Explorer" cards
// generated from whatever destinations were marked featured, which invented a
// reward for every featured place. No rewards published means no rewards.
function huntRewardItems() {
  return HUNT_REWARDS;
}

function huntLoadState() {
  try {
    return {
      unlocked: JSON.parse(localStorage.getItem("sanvic_hunt_unlocked") || "[]"),
      points: parseInt(localStorage.getItem("sanvic_hunt_points") || "0", 10) || 0,
      progress: JSON.parse(localStorage.getItem("sanvic_hunt_progress") || "{}"),
      claimed: JSON.parse(localStorage.getItem("sanvic_hunt_claimed") || "[]"),
    };
  } catch (_) {
    return { unlocked: [], points: 0, progress: {}, claimed: [] };
  }
}
function huntSaveState(s) {
  try {
    localStorage.setItem("sanvic_hunt_unlocked", JSON.stringify(s.unlocked || []));
    localStorage.setItem("sanvic_hunt_points", String(s.points || 0));
    localStorage.setItem("sanvic_hunt_progress", JSON.stringify(s.progress || {}));
    localStorage.setItem("sanvic_hunt_claimed", JSON.stringify(s.claimed || []));
  } catch (_) {}
}

function openHuntPanel() {
  const p = document.getElementById("huntPanel");
  if (!p) return;
  p.classList.add("open");
  p.setAttribute("aria-hidden", "false");
  renderHunt();
  maybeShowSectionBriefing("hunt");
  // Riddles are fetched the first time the Hunt is opened and then cached, so the
  // rest of the app never pays for them.
  if (!huntRiddlesLoaded)
    loadHuntRiddles().then(() => {
      if (document.getElementById("huntPanel")) renderHunt();
    });
}
function closeHuntPanel() {
  const p = document.getElementById("huntPanel");
  if (!p) return;
  p.classList.remove("open");
  p.setAttribute("aria-hidden", "true");
  closeHuntOverlay();
}
function showHuntOverlay(title, sub) {
  const o = document.getElementById("huntOverlay");
  if (!o) return;
  if (title) document.getElementById("huntOverlayTitle").textContent = title;
  if (sub) document.getElementById("huntOverlaySub").textContent = sub;
  o.classList.add("show");
}
function closeHuntOverlay(evt) {
  if (evt && evt.target && evt.target.closest && evt.target.closest(".hunt-overlay-card")) return;
  const o = document.getElementById("huntOverlay");
  if (o) o.classList.remove("show");
}

function huntAvatars(count, more) {
  const dots = Array.from({ length: count })
    .map(
      (_, i) =>
        `<div class="hunt-avatar" style="background:linear-gradient(135deg,hsl(${i * 60 + 20},60%,55%),hsl(${i * 60 + 80},55%,25%))"></div>`,
    )
    .join("");
  const moreEl = more ? `<div class="hunt-avatar-more">+${more}</div>` : "";
  return `<div class="hunt-avatars">${dots}${moreEl}</div>`;
}

function huntSelectTab(tab) {
  document
    .querySelectorAll(".hunt-vtab")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const map = {
    today: "huntToday",
    trails: "huntTrails",
    rewards: "huntSplit",
    progress: "huntSplit",
  };
  const target = document.getElementById(map[tab] || "huntToday");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}
function huntScrollToSplit() {
  const el = document.getElementById("huntSplit");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function huntStart(destId) {
  const dest = (Array.isArray(destinations) ? destinations : []).find(
    (d) => String(d.id) === String(destId),
  );
  const target = huntTargetFor(dest);
  const onFail = () =>
    showHuntOverlay(
      "Marker out of range",
      "Head closer to the location in San Vicente to unlock this story layer.",
    );
  if (!target || !navigator.geolocation) return onFail();
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const R = 6371000;
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(target.lat - pos.coords.latitude);
      const dLng = toRad(target.lng - pos.coords.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pos.coords.latitude)) *
          Math.cos(toRad(target.lat)) *
          Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.sqrt(a));
      if (dist > 200) return onFail();
      const s = huntLoadState();
      const key = String(destId);
      if (!s.unlocked.includes(key)) {
        s.unlocked.push(key);
        s.points += 100;
        huntSaveState(s);
        renderHunt();
      }
      showHuntOverlay("Unlocked!", `You earned 100 pts near ${target.name}.`);
    },
    () => onFail(),
    { timeout: 4000 },
  );
}
function huntNearbyTap(idx) {
  const item = huntNearbyItems()[Number(idx)];
  if (!item) return;
  showHuntOverlay(
    item.name || "Nearby find",
    item.desc || "Head to this spot to explore it in person.",
  );
}
// A trail opens Explore, already filtered to that trail's category, and only
// that. It used to open the Hunt and the old discover panel together — two
// windows at once, the list was not the trail the visitor picked, and it would
// not scroll.
function huntOpenTrail(catKey) {
  closeHuntPanel();
  if (typeof closeDiscoverPanel === "function") closeDiscoverPanel();
  if (typeof openExploreSheet === "function") openExploreSheet();
  if (typeof selectExploreCategory === "function") selectExploreCategory(catKey);
  // Snap open last: selecting a category re-renders the sheet and resets it to
  // the smallest size, which left the trail list in a 168px slot.
  if (typeof setExploreSnap === "function" && !exploreIsSide()) setExploreSnap(2);
}
function huntRedeem(id) {
  ensurePerson((person) => {
    const s = huntLoadState();
    const key = String(id);
    if (s.claimed.includes(key)) {
      showHuntOverlay(
        "Already reserved",
        person.name + ", this reward is already held under your name.",
      );
      return;
    }
    const reward = huntRewardItems().find((r) => String(r.id) === key);
    const need = reward && reward.pointsRequired ? reward.pointsRequired : 100;
    if (s.points < need) {
      showHuntOverlay(
        "Not yet, " + person.name,
        "You have " + s.points + " of " + need + " points. Unlock more discoveries and come back.",
      );
      return;
    }
    s.claimed.push(key);
    huntSaveState(s);
    renderHunt();
    showHuntOverlay(
      "Reserved for " + person.name,
      "Show this at the counter to collect. No email needed — it is tied to this device.",
    );
  });
}

function renderHunt() {
  const body = document.getElementById("huntBody");
  if (!body) return;
  const state = huntLoadState();
  const today = huntTodayDest();
  const trails = huntTrailGroups();
  const rewards = huntRewardItems();
  const totalDest = Array.isArray(destinations) ? destinations.length : 0;
  const discoveries = state.unlocked.length;
  const readyRewards = rewards.length;
  const pct = totalDest ? Math.round((discoveries / totalDest) * 100) : 0;

  const tabs = [
    {
      k: "today",
      label: "Today's Hunt",
      svg: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    },
    { k: "trails", label: "Trails", svg: '<path d="M3 20l4-8 4 4 4-10 6 14"/>' },
    {
      k: "rewards",
      label: "Rewards",
      svg: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    },
    {
      k: "progress",
      label: "My Progress",
      svg: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
    },
  ];

  const todayBlock = today
    ? `
    <div class="hunt-section" id="huntToday">
      <div class="hunt-today" style="background-image:url('${today.image || ""}');background-size:cover;background-position:center">
        <div class="hunt-today-body">
          <span class="hunt-today-badge">TODAY</span>
          <div class="hunt-today-title">${escapeHtml(today.name)}</div>
          <div class="hunt-today-desc">${escapeHtml(today.description || today.tip || "Find the hidden marker at this featured spot.")}</div>
          <div class="hunt-meta-row">
            ${today.barangay ? `<span class="hunt-meta-pill">${lucideSvg("map-pin", 12)} ${escapeHtml(today.barangay)}</span>` : ""}
            <span class="hunt-meta-pill">${lucideSvg("gauge", 12)} ${escapeHtml((today.stats && today.stats.rating) || "Easy")}</span>
            ${today.stats && today.stats.travel ? `<span class="hunt-meta-pill">${lucideSvg("clock", 12)} ${escapeHtml(today.stats.travel)}</span>` : ""}
          </div>
          <div class="hunt-reward-strip">REWARD: 100 pts • ${lucideSvg("medal", 13)} Explorer Badge</div>
        </div>
        <div class="hunt-today-side">
          <button class="hunt-cta-teal" onclick="huntStart('${today.id}')">Start Hunt</button>
        </div>
      </div>
    </div>`
    : "";

  // Hunting spots: each one a clue plus a GPS unlock at the place itself.
  const spots = huntSpotList();
  const state0 = huntLoadState();
  const riddleFound = HUNT_RIDDLES.filter((r) => state0.unlocked.includes(r.slug)).length;
  const spotsFound = spots.filter((d) => state0.unlocked.includes(String(d.id))).length;
  const totalSpots = HUNT_RIDDLES.length + spots.length;
  const spotsBlock = `
    <div class="hunt-section" id="huntSpots">
      <div class="hunt-sec-head">
        <div><div class="hunt-sec-title">${lucideSvg("compass", 15)} The riddles</div><div class="hunt-sec-sub">Work out where it is, then get there to unlock it.</div></div>
        ${totalSpots ? `<div class="hunt-sec-count">${riddleFound + spotsFound} / ${totalSpots}</div>` : ""}
      </div>
      ${HUNT_RIDDLES.length ? `<div class="hunt-spots">${HUNT_RIDDLES.map(huntRiddleCard).join("")}</div>` : ""}
      ${spots.length ? `<div class="hunt-spots" style="margin-top:10px">${spots.map(huntSpotCard).join("")}</div>` : ""}
      ${totalSpots ? "" : `<div class="hunt-empty">No riddles published yet. The team writes them in the Backoffice.</div>`}
    </div>`;

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
          <span>${discoveries} discoveries / ${readyRewards} rewards ready ${lucideSvg("chevron-right", 13)}</span>
        </button>
      </div>
      <div class="hunt-copy">Find hidden spots, unlock stories, collect badges, and earn rewards across San Vicente.</div>
    </div>

    <div class="hunt-viewtabs">
      ${tabs
        .map(
          (
            t,
            i,
          ) => `<button class="hunt-vtab ${i === 0 ? "active" : ""}" data-tab="${t.k}" onclick="huntSelectTab('${t.k}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg>
        <span>${escapeHtml(t.label)}</span>
      </button>`,
        )
        .join("")}
    </div>

    ${todayBlock}

    ${spotsBlock}

    <div class="hunt-section" id="huntTrails">
      <div class="hunt-sec-head">
        <div><div class="hunt-sec-title">Trails</div><div class="hunt-sec-sub">Complete trails, unlock badges, earn rewards.</div></div>
        <button class="hunt-viewall" onclick="closeHuntPanel(); dockNav('discover');">View all ${lucideSvg("chevron-right", 13)}</button>
      </div>
      <div class="hunt-hscroll">
        ${
          trails.length
            ? trails
                .map(
                  (t) => `
          <div class="hunt-trail-card">
            <div class="hunt-trail-top">
              <div class="hunt-trail-thumb" style="background-image:url('${t.image || ""}');background-size:cover;background-position:center;background-color:${t.grad.includes("#") ? t.grad.match(/#[a-f0-9]+/i)?.[0] || "#1a2744" : "#1a2744"}"></div>
              <div class="hunt-trail-body">
                <div class="hunt-trail-title">${escapeHtml(t.title)}</div>
                <div class="hunt-trail-desc">${escapeHtml(t.desc)}</div>
              </div>
            </div>
            <div class="hunt-trail-foot">
              <div class="hunt-progress"><div class="hunt-progress-fill" style="width:${t.total ? (t.done / t.total) * 100 : 0}%"></div></div>
              <div class="hunt-progress-count">${t.done} / ${t.total}</div>
              <button class="hunt-chev" onclick="huntOpenTrail('${t.id}')" aria-label="Open trail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>`,
                )
                .join("")
            : '<div class="hunt-empty">No trails yet — add destinations in the SANVIC Admin panel.</div>'
        }
      </div>
    </div>

    <div class="hunt-section" id="huntSplit">
      <div class="hunt-split">
        <div class="hunt-col">
          <div class="hunt-sec-head" style="margin-bottom:6px">
            <div><div class="hunt-sec-title">${lucideSvg("gift", 15)} Rewards</div><div class="hunt-sec-sub">Redeem your unlocked rewards.</div></div>
          </div>
          ${
            rewards.length
              ? rewards
                  .map((r) => {
                    const allImgs = [];
                    if (r.images && Array.isArray(r.images)) allImgs.push(...r.images);
                    const hasImages = allImgs.length > 0;
                    const rewardBg = hasImages
                      ? `background-image:url('${allImgs[0]}');background-size:cover;background-position:center`
                      : `background:${r.grad}`;
                    const rewardOverlay = hasImages ? "position:relative" : "";
                    return `
            <div class="hunt-reward-card" style="${rewardBg};${rewardOverlay}">
              ${hasImages ? '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7));border-radius:inherit"></div>' : ""}
              <span class="hunt-reward-badge" style="position:relative">${escapeHtml(r.badge)}</span>
              <div style="position:relative">
                <div class="hunt-reward-t">${escapeHtml(r.title)}</div>
                <div class="hunt-reward-s">${escapeHtml(r.subtitle || r.sub || "")}</div>
              </div>
              <div class="hunt-reward-row">
                <div></div>
                <button class="hunt-glass-btn" onclick="huntRedeem('${r.id}')">Redeem</button>
              </div>
            </div>`;
                  })
                  .join("")
              : '<div class="hunt-empty">No rewards published yet.</div>'
          }
        </div>
        <div class="hunt-col">
          <div class="hunt-sec-head" style="margin-bottom:6px">
            <div><div class="hunt-sec-title">${lucideSvg("chart-column", 15)} My Progress</div><div class="hunt-sec-sub">Your journey so far.</div></div>
          </div>
          <div class="hunt-progress-panel">
            <div class="hunt-donut">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
                <circle cx="48" cy="48" r="40" fill="none" stroke="#3fd6d6" stroke-width="8" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 40}" stroke-dashoffset="${2 * Math.PI * 40 * (1 - pct / 100)}"/>
              </svg>
              <div class="hunt-donut-label">${pct}%</div>
            </div>
            <div class="hunt-progress-list">
              <div class="hunt-progress-item">${lucideSvg("target", 13)} ${discoveries} discoveries unlocked</div>
              <div class="hunt-progress-item">${lucideSvg("map", 13)} ${trails.length} trails available</div>
              <div class="hunt-progress-item">${lucideSvg("trophy", 13)} ${state.points} points earned</div>
              <div class="hunt-progress-item">${lucideSvg("gift", 13)} ${readyRewards} rewards ready</div>
              <div class="hunt-progress-item hunt-progress-who">${lucideSvg("users", 13)} ${
                personName()
                  ? escapeHtml(personName())
                  : `<button class="hunt-name-btn" onclick="openPersonSheet()">Add your name</button>`
              }</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
