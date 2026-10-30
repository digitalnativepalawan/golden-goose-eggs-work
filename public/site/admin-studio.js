/* ═══════════════════════════════════════════════════════════════════════
   SANVIC Studio — task-oriented layer over the existing Backoffice.
   Loaded after app.js and before kmz-import.js. It deliberately keeps the
   original Supabase client, RLS permissions, renderers and write paths.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var model = window.SanvicAdmin;
  var originalLoadData = window.loadDataFromSupabase;
  var originalDestRowToObj =
    window.destRowToObj ||
    function (row) {
      return row;
    };
  var studioDirectoryRows = [];
  var studioPublishingEnabled = false;
  var studioPublishingChecked = false;
  var studioStatusColumnSeen = false;
  var studioDirty = false;
  var studioSaveState = "saved";
  var studioSaveMessage = "All changes saved";
  var studioNavOpen = false;
  var studioSectionTitles = {
    home: "Admin home",
    dest: "Places",
    map: "Map & pins",
    photos: "Photos",
    categories: "Categories",
    site: "Site content",
    tribes: "Tribes",
    events: "Events",
    today: "Today",
    mysanvic: "My Sanvic",
    hunt: "The Hunt",
    pulse: "Pulse posts",
    tala: "Tala answers",
    ai: "TALA AI",
  };
  var studioHomeQuery = "";
  var studioPlaceFilters = {
    query: "",
    status: "all",
    category: "all",
    area: "all",
    issuesOnly: false,
    sort: "updated_desc",
  };

  function esc(value) {
    return typeof escapeHtml === "function"
      ? escapeHtml(value)
      : String(value == null ? "" : value);
  }

  function icon(name, size) {
    if (typeof lucideSvg === "function") return lucideSvg(name, size || 16);
    return "";
  }

  function safeUrl(value) {
    return model.safeImageUrl(value);
  }

  function live(message) {
    var el = document.getElementById("adminLiveRegion");
    if (el) el.textContent = message || "";
  }

  function allPlaces() {
    return studioDirectoryRows.length
      ? studioDirectoryRows
      : typeof destinations !== "undefined"
        ? destinations
        : [];
  }

  function publishingReady() {
    return studioPublishingEnabled;
  }

  function statusBadge(status) {
    var s = model.statusOf(status);
    var label = s === "published" ? "Published" : s === "draft" ? "Draft" : "Archived";
    return '<span class="admin-status-pill ' + s + '">' + label + "</span>";
  }

  function callGlobal(name) {
    var fn = window[name];
    if (typeof fn !== "function") return undefined;
    return fn.apply(window, Array.prototype.slice.call(arguments, 1));
  }

  function readActivity() {
    try {
      var rows = JSON.parse(localStorage.getItem("sanvic_admin_activity") || "[]");
      return Array.isArray(rows) ? rows.slice(0, 20) : [];
    } catch (_) {
      return [];
    }
  }

  function recordActivity(kind, label, id) {
    var rows = readActivity();
    rows.unshift({
      kind: kind || "content",
      label: String(label || "Untitled"),
      id: id == null ? "" : String(id),
      at: new Date().toISOString(),
    });
    try {
      localStorage.setItem("sanvic_admin_activity", JSON.stringify(rows.slice(0, 20)));
    } catch (_) {
      /* storage may be full */
    }
  }

  function setSaveState(state, message) {
    studioSaveState = state || "saved";
    studioSaveMessage =
      message ||
      (state === "saving"
        ? "Saving changes…"
        : state === "failed"
          ? "Save failed"
          : state === "dirty"
            ? "Unsaved changes"
            : "All changes saved");
    var head = document.getElementById("adminSaveIndicator");
    if (head) {
      head.dataset.state = studioSaveState;
      head.textContent = studioSaveMessage;
    }
    var sticky = document.getElementById("adfSaveState");
    if (sticky) {
      sticky.dataset.state = studioSaveState;
      sticky.textContent = studioSaveMessage;
    }
    if (message) live(message);
  }

  function markDirty() {
    // Only the place editor has a sticky Save/Cancel workflow today. Other
    // existing forms still auto-save on blur, so don't raise a false
    // beforeunload warning just because their gallery changed.
    if (!document.querySelector("#adminBody .admin-dest-editor")) return;
    studioDirty = true;
    setSaveState("dirty", "Unsaved changes");
  }

  function clearDirty() {
    studioDirty = false;
    setSaveState("saved", "All changes saved");
  }

  function confirmDiscard() {
    if (!studioDirty) return true;
    return window.confirm("This form has unsaved changes. Discard them and continue?");
  }

  function syncViewport() {
    try {
      var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty(
        "--admin-visual-height",
        Math.max(320, Math.round(h)) + "px",
      );
    } catch (_) {
      /* visualViewport is optional */
    }
  }

  function toggleNav(force) {
    var shell = document.getElementById("adminShell");
    var button = document.getElementById("adminNavToggle");
    if (!shell) return;
    studioNavOpen = typeof force === "boolean" ? force : !studioNavOpen;
    shell.classList.toggle("nav-open", studioNavOpen);
    if (button) {
      button.setAttribute("aria-expanded", studioNavOpen ? "true" : "false");
      button.setAttribute("aria-label", studioNavOpen ? "Close navigation" : "Open navigation");
    }
  }

  function setActiveTab(tab) {
    document.querySelectorAll("#adminNav .admin-tab[data-tab]").forEach(function (el) {
      var active = el.dataset.tab === tab;
      el.classList.toggle("active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    var label = document.getElementById("adminSectionLabel");
    if (label) label.textContent = studioSectionTitles[tab] || "Backoffice";
  }

  function closePanelGuarded() {
    if (!confirmDiscard()) return;
    window.closeAdminPanel();
  }

  window.adminAllPlaces = allPlaces;
  window.adminPublishingEnabled = publishingReady;
  window.adminStatusBadge = statusBadge;
  window.adminRecordActivity = recordActivity;
  window.adminToggleNav = toggleNav;
  window.adminClosePanelGuarded = closePanelGuarded;

  // Keep every destination row available to the Backoffice, while the public
  // map/list receives only published rows. Existing rows without the new
  // columns remain published, so an un-migrated database keeps working.
  window.destRowToObj = function (row) {
    var place = originalDestRowToObj(row);
    studioStatusColumnSeen =
      studioStatusColumnSeen || Object.prototype.hasOwnProperty.call(row || {}, "status");
    place.status = model.statusOf(row.status);
    place.publishedAt = row.published_at || null;
    place.archivedAt = row.archived_at || null;
    place.updatedAt = row.updated_at || row.created_at || null;
    place.createdAt = row.created_at || null;
    place._statusColumnPresent = studioStatusColumnSeen;
    return place;
  };

  async function detectPublishingSupport() {
    if (studioPublishingChecked) return studioPublishingEnabled;
    studioPublishingChecked = true;
    studioPublishingEnabled = studioStatusColumnSeen;
    if (studioStatusColumnSeen || typeof sb === "undefined") return studioPublishingEnabled;
    try {
      var result = await sb.from("destinations").select("status").limit(1);
      studioPublishingEnabled = !result.error;
    } catch (_) {
      studioPublishingEnabled = false;
    }
    return studioPublishingEnabled;
  }

  window.loadDataFromSupabase = async function () {
    studioStatusColumnSeen = false;
    await originalLoadData();
    await detectPublishingSupport();
    studioDirectoryRows =
      typeof destinations !== "undefined" && Array.isArray(destinations)
        ? destinations.slice()
        : [];
    studioDirectoryRows.forEach(function (p) {
      p.status = model.statusOf(p.status);
      delete p._statusColumnPresent;
    });
    destinations = studioDirectoryRows.filter(function (p) {
      return model.isPublished(p);
    });
    window.destinations = destinations;
    window.adminDirectoryRows = studioDirectoryRows;
  };

  window.openAdminPanel = async function () {
    if (typeof dataReady === "undefined" || !dataReady) await window.loadDataFromSupabase();
    syncViewport();
    adminWriteWarned = false;
    await window.refreshAdminAccess();
    document.getElementById("adminPanelOverlay").classList.add("active");
    if (typeof refreshAdminAiBadge === "function") refreshAdminAiBadge();
    adminTab = "home";
    window.switchAdminTab("home");
    var title = document.getElementById("adminTitle");
    if (title) title.focus && title.focus({ preventScroll: true });
    live("Backoffice opened. Admin home is ready.");
  };

  window.closeAdminPanel = function () {
    document.getElementById("adminPanelOverlay").classList.remove("active");
    toggleNav(false);
    adminResetEditorState();
    adminDestroyMaps();
    adminEditingDestId = null;
    adminEditingTalaId = null;
    studioDirty = false;
    clearDirty();
    live("Backoffice closed.");
  };

  window.switchAdminTab = function (tab) {
    if (!confirmDiscard()) return;
    if (typeof adminDestroyMaps === "function") adminDestroyMaps();
    adminResetEditorState();
    adminTab = tab;
    adminEditingDestId = null;
    adminEditingTalaId = null;
    setActiveTab(tab);
    toggleNav(window.innerWidth >= 1180);
    var renderers = {
      home: function () {
        adminRenderHome();
      },
      dest: function () {
        window.renderAdminDest();
      },
      map: function () {
        adminRenderMapOverview();
      },
      photos: function () {
        adminRenderPhotos();
      },
      categories: function () {
        adminRenderCategories();
      },
      site: "renderAdminSite",
      tala: "renderAdminTala",
      ai: "renderAdminTalaAi",
      pulse: "renderAdminPulse",
      today: "renderAdminToday",
      tribes: "renderAdminTribes",
      events: "renderAdminEvents",
      mysanvic: "renderAdminMySanvic",
      hunt: "renderAdminHunt",
    };
    var renderer = renderers[tab] || renderers.home;
    if (typeof renderer === "function") renderer();
    else callGlobal(renderer);
    var body = document.getElementById("adminBody");
    if (body) body.scrollTop = 0;
    live(studioSectionTitles[tab] + " opened.");
  };

  window.adminOpenSection = function (tab, options) {
    if (!confirmDiscard()) return;
    if (tab === "dest" && options && options.status) {
      studioPlaceFilters.status = options.status;
      studioPlaceFilters.issuesOnly = !!options.issuesOnly;
      studioPlaceFilters.query = options.query || "";
    }
    if (tab === "map" && options && options.query) studioMapQuery = options.query;
    window.switchAdminTab(tab);
  };

  document.addEventListener("keydown", function (event) {
    var overlay = document.getElementById("adminPanelOverlay");
    if (!overlay || !overlay.classList.contains("active")) return;
    if (event.key === "Escape") {
      if (studioNavOpen) {
        event.preventDefault();
        toggleNav(false);
      } else {
        event.preventDefault();
        closePanelGuarded();
      }
    }
  });

  window.addEventListener("beforeunload", function (event) {
    if (!studioDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncViewport);
    window.visualViewport.addEventListener("scroll", syncViewport);
  }
  window.addEventListener("resize", syncViewport);
  syncViewport();

  window.addEventListener("load", function () {
    try {
      if (new URLSearchParams(window.location.search).has("admin")) {
        setTimeout(function () {
          window.openAdminPanel();
        }, 120);
      }
    } catch (_) {
      /* older browsers */
    }
  });

  /* ───────────────────────── ADMIN HOME ───────────────────────── */

  var studioSections = [
    {
      tab: "dest",
      label: "Places",
      help: "Add or edit listings, photos, statuses and visitor details",
    },
    { tab: "map", label: "Map & pins", help: "Find missing coordinates and fix marker locations" },
    { tab: "photos", label: "Photos", help: "Upload device photos and attach them to a place" },
    {
      tab: "categories",
      label: "Categories",
      help: "Manage category labels, colours and marker icons",
    },
    { tab: "site", label: "Site content", help: "Hero title, subtitle and loading-screen text" },
    { tab: "tribes", label: "Tribes", help: "Groups and live plans shown in Pulse" },
    { tab: "events", label: "Events", help: "Local happenings shown in Pulse" },
    { tab: "today", label: "Today", help: "Daily briefing, weather and notices" },
    { tab: "mysanvic", label: "My Sanvic", help: "Saved places and upcoming cards" },
    { tab: "hunt", label: "The Hunt", help: "Hunting spots, clues and rewards" },
    { tab: "pulse", label: "Pulse posts", help: "Moderate visitor posts and categories" },
    { tab: "tala", label: "Tala answers", help: "Curated concierge answers and suggestions" },
    { tab: "ai", label: "TALA AI", help: "Live AI settings and model" },
  ];

  function adminRenderHome() {
    var places = allPlaces();
    var categoryCount = typeof catStyle !== "undefined" ? Object.keys(catStyle).length : 0;
    var tribeCount =
      typeof PULSE_TRIBES !== "undefined" && Array.isArray(PULSE_TRIBES) ? PULSE_TRIBES.length : 0;
    var eventCount =
      typeof PULSE_EVENTS !== "undefined" && Array.isArray(PULSE_EVENTS) ? PULSE_EVENTS.length : 0;
    var nearbyCount =
      typeof nearbyPlacesByBarangay !== "undefined"
        ? Object.values(nearbyPlacesByBarangay).reduce(function (n, a) {
            return n + (Array.isArray(a) ? a.length : 0);
          }, 0)
        : 0;
    var talaCount = typeof aiData !== "undefined" && Array.isArray(aiData) ? aiData.length : 0;
    var stats = model.contentStatus(places, {
      deadCovers: adminDeadCovers,
      categories: new Array(categoryCount),
      tribes: new Array(tribeCount),
      events: new Array(eventCount),
      nearby: new Array(nearbyCount),
      talaAnswers: new Array(talaCount),
    });
    var hits = model.globalSearch(places, studioSections, studioHomeQuery);
    var needs = model
      .filterAndSortPlaces(places, {
        issuesOnly: true,
        sort: "issues",
        deadCovers: adminDeadCovers,
      })
      .slice(0, 5);
    var connected = typeof destinationsSource !== "undefined" && destinationsSource === "supabase";
    var canWrite = typeof adminCanWrite !== "undefined" && adminCanWrite;
    var body = document.getElementById("adminBody");
    if (!body) return;

    body.innerHTML = `
      <section class="admin-home-hero">
        <div class="admin-home-eyebrow">SANVIC content workspace</div>
        <h2>What needs updating today?</h2>
        <p>Search live content, check what is published, then open the exact record. Every action here uses the real Supabase site data.</p>
        <div class="admin-home-search">
          <span class="admin-search-icon">${icon("search", 18)}</span>
          <input class="admin-search-input" id="adminGlobalSearch" type="search" value="${esc(studioHomeQuery)}" placeholder="Search places, barangays or tools" aria-label="Search all Backoffice content" oninput="adminGlobalSearch(this.value)">
        </div>
        ${studioHomeQuery ? adminSearchResultsHtml(hits) : ""}
      </section>

      <div class="admin-notice ${connected ? (canWrite ? "success" : "warning") : "error"}" style="margin-bottom:14px">
        <strong>${connected ? "Connected to the live Supabase directory." : "Live database unavailable — showing offline fallback."}</strong>
        ${canWrite ? " Your admin account can save changes." : " Sign in with an admin account to save changes."}
        ${!publishingReady() ? " Publishing states are pending the one-time database migration; existing places stay live until it is applied." : ""}
      </div>

      <section class="admin-card" style="margin-bottom:14px">
        <div class="admin-card-head"><h3>Public site status</h3>${statusBadge("published")}</div>
        <div class="admin-stat-grid">
          ${adminStatCard("published", stats.published, "Live on the public map")}
          ${adminStatCard("drafts", stats.drafts, "Drafts hidden from visitors")}
          ${adminStatCard("needs", stats.needsWork, "Listings needing details")}
          ${adminStatCard("archived", stats.archived, "Archived, retained for restore")}
        </div>
        <p class="admin-section-desc" style="margin-top:12px">Only Published places appear in Explore, the interactive map and visitor lists. Drafts and archives remain editable here.</p>
      </section>

      <div class="admin-home-grid" style="margin-bottom:14px">
        <section class="admin-card">
          <div class="admin-card-head"><h3>Needs attention</h3><span class="admin-kicker">${stats.missingPin} pins · ${stats.missingCover} photos</span></div>
          ${adminNeedsAttentionHtml(needs)}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button type="button" class="admin-mini-btn" onclick="adminOpenSection('dest',{issuesOnly:true})">Review incomplete</button>
            <button type="button" class="admin-mini-btn" onclick="adminOpenSection('dest',{status:'draft'})">Review drafts</button>
            <button type="button" class="admin-mini-btn" onclick="adminOpenSection('map')">Fix map pins</button>
          </div>
        </section>
        <section class="admin-card">
          <div class="admin-card-head"><h3>Content inventory</h3><span class="admin-kicker">Live tables</span></div>
          <div class="admin-plain-list">
            ${adminInventoryRow("Categories", stats.categories, "categories")}
            ${adminInventoryRow("Tribes", stats.tribes, "tribes")}
            ${adminInventoryRow("Events", stats.events, "events")}
            ${adminInventoryRow("Nearby places", stats.nearby, "dest")}
            ${adminInventoryRow("Tala answers", stats.talaAnswers, "tala")}
          </div>
        </section>
      </div>

      <section class="admin-card" style="margin-bottom:14px">
        <div class="admin-card-head"><h3>Quick actions</h3><span class="admin-kicker">Most-used tasks</span></div>
        <div class="admin-quick-grid">
          ${adminQuickAction("map-pin-plus", "Add a place", "Create a draft with a name, then add its pin and photos.", "adminNewDest()")}
          ${adminQuickAction("camera", "Upload photos", "Choose from the device library or take a new photo.", "adminOpenSection('photos')")}
          ${adminQuickAction("map", "Check the map", "See missing pins and open their listings.", "adminOpenSection('map')")}
          ${adminQuickAction("tag", "Manage categories", "Change labels, marker colours and icons.", "adminOpenSection('categories')")}
          ${adminQuickAction("users", "Tribes & events", "Update community content from the existing editors.", "adminOpenSection('tribes')")}
          ${adminQuickAction("globe", "Edit site text", "Update the hero and loading-screen copy.", "adminOpenSection('site')")}
        </div>
      </section>

      <section class="admin-card">
        <div class="admin-card-head"><h3>Recent edits</h3><span class="admin-kicker">Real saved changes</span></div>
        ${adminRecentEditsHtml(places)}
      </section>`;
    if (studioHomeQuery) {
      var input = document.getElementById("adminGlobalSearch");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  function adminStatCard(kind, value, label) {
    return `<div class="admin-stat-card ${kind}"><span class="admin-stat-value">${Number(value || 0)}</span><span class="admin-stat-label">${esc(label)}</span></div>`;
  }

  function adminQuickAction(iconName, label, help, action) {
    return `<button type="button" class="admin-quick-action" onclick="${esc(action)}">${icon(iconName, 20)}<span><strong>${esc(label)}</strong><small>${esc(help)}</small></span></button>`;
  }

  function adminInventoryRow(label, count, tab) {
    return `<button type="button" class="admin-activity-item" style="width:100%;text-align:left;border:0;cursor:pointer" onclick="adminOpenSection('${esc(tab)}')"><span class="admin-activity-dot"></span><span class="admin-activity-main"><strong>${esc(label)}</strong><small>Open editor</small></span><strong style="color:var(--admin-text)">${Number(count || 0)}</strong></button>`;
  }

  function adminSearchResultsHtml(hits) {
    var placeRows = (hits.places || [])
      .map(function (p) {
        return `<button type="button" class="admin-search-result" onclick="adminOpenSearchPlace(${Number(p.id)})"><span><strong>${esc(p.name || "Untitled place")}</strong><small style="display:block;color:var(--admin-muted)">${esc(p.barangay || "No barangay")} · ${esc(model.statusOf(p.status))}</small></span>${icon("chevron-right", 16)}</button>`;
      })
      .join("");
    var sectionRows = (hits.sections || [])
      .map(function (s) {
        return `<button type="button" class="admin-search-result" onclick="adminOpenSection('${esc(s.tab)}')"><span><strong>${esc(s.label)}</strong><small style="display:block;color:var(--admin-muted)">${esc(s.help)}</small></span>${icon("chevron-right", 16)}</button>`;
      })
      .join("");
    if (!placeRows && !sectionRows)
      return '<div class="admin-notice" style="margin-top:8px">No live content matches that search.</div>';
    return `<div class="admin-search-results">${placeRows}${sectionRows}</div>`;
  }

  function adminNeedsAttentionHtml(rows) {
    if (!rows.length)
      return '<div class="admin-notice success">Every live listing has its core details. New drafts can still be added.</div>';
    return `<div class="admin-activity-list">${rows
      .map(function (p) {
        var issues = model.issueList(p, { deadCovers: adminDeadCovers });
        return `<button type="button" class="admin-activity-item" style="width:100%;text-align:left;border:0;cursor:pointer" onclick="adminOpenSearchPlace(${Number(p.id)})"><span class="admin-activity-dot" style="background:var(--admin-warning)"></span><span class="admin-activity-main"><strong>${esc(p.name || "Untitled place")}</strong><small>Needs: ${esc(issues.join(", "))}</small></span>${icon("chevron-right", 16)}</button>`;
      })
      .join("")}</div>`;
  }

  function adminRecentEditsHtml(places) {
    var items = readActivity().map(function (r) {
      return {
        label: r.label,
        detail: r.kind === "place" ? "Place saved" : String(r.kind || "Content saved"),
        at: r.at,
        id: r.id,
      };
    });
    places.forEach(function (p) {
      if (!p.updatedAt) return;
      items.push({
        label: p.name || "Untitled place",
        detail: "Updated in database · " + model.statusOf(p.status),
        at: p.updatedAt,
        id: p.id,
      });
    });
    items.sort(function (a, b) {
      return new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime();
    });
    var seen = new Set();
    items = items
      .filter(function (r) {
        var key = String(r.label) + "|" + String(r.at).slice(0, 16);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 7);
    if (!items.length)
      return '<div class="admin-notice">No edits have been recorded yet. Saved listings will appear here with their real database timestamps.</div>';
    return `<div class="admin-activity-list">${items
      .map(function (r) {
        return `<div class="admin-activity-item"><span class="admin-activity-dot"></span><span class="admin-activity-main"><strong>${esc(r.label)}</strong><small>${esc(r.detail)} · ${esc(model.formatDate(r.at))}</small></span></div>`;
      })
      .join("")}</div>`;
  }

  window.adminRenderHome = adminRenderHome;
  window.adminGlobalSearch = function (value) {
    studioHomeQuery = String(value || "");
    adminRenderHome();
  };
  window.adminOpenSearchPlace = function (id) {
    adminOpenPlaceEditor(id);
  };

  /* ─────────────────── PLACES, STATUS AND MAP OVERVIEW ─────────────────── */

  var studioMapQuery = "";
  var studioPinMap = null;
  var studioPinMarker = null;
  var studioOverviewMap = null;

  function showNotice(message, kind) {
    var body = document.getElementById("adminBody");
    if (body) {
      var box = document.createElement("div");
      box.className = "admin-notice " + (kind || "");
      box.setAttribute("role", "status");
      box.style.marginBottom = "12px";
      box.textContent = message;
      body.insertBefore(box, body.firstChild);
      setTimeout(
        function () {
          box.remove();
        },
        kind === "error" ? 8000 : 5000,
      );
    }
    live(message);
    if (typeof toast === "function") toast(message);
  }

  function showUndo(message, action) {
    var old = document.getElementById("adminUndoBar");
    if (old) old.remove();
    var bar = document.createElement("div");
    bar.id = "adminUndoBar";
    bar.className = "admin-undo-bar";
    bar.setAttribute("role", "status");
    var text = document.createElement("span");
    text.textContent = message;
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "Undo";
    button.addEventListener("click", function () {
      bar.remove();
      try {
        action();
      } catch (err) {
        showNotice("Undo failed: " + (err.message || err), "error");
      }
    });
    bar.append(text, button);
    document.body.appendChild(bar);
    setTimeout(function () {
      if (bar.isConnected) bar.remove();
    }, 12000);
    live(message + " Undo is available.");
  }

  function adminDestroyMaps() {
    if (studioPinMap) {
      try {
        studioPinMap.remove();
      } catch (_) {}
    }
    studioPinMap = null;
    studioPinMarker = null;
    if (studioOverviewMap) {
      try {
        studioOverviewMap.remove();
      } catch (_) {}
    }
    studioOverviewMap = null;
  }

  function adminStatusActionsHtml(d) {
    var status = model.statusOf(d.status);
    if (!publishingReady()) {
      return '<button type="button" disabled>Publishing needs the database update</button>';
    }
    if (status === "published") {
      return `<button type="button" onclick="adminUnpublishDest(${Number(d.id)})">Move to drafts</button>
              <button type="button" onclick="adminArchiveDest(${Number(d.id)})">Archive place</button>`;
    }
    if (status === "archived") {
      return `<button type="button" onclick="adminRestoreDest(${Number(d.id)})">Restore to draft</button>
              <button type="button" onclick="adminPublishDest(${Number(d.id)})">Publish restored place</button>`;
    }
    return `<button type="button" onclick="adminPublishDest(${Number(d.id)})">Publish place</button>
            <button type="button" onclick="adminArchiveDest(${Number(d.id)})">Archive draft</button>`;
  }

  window.adminDestRowHtml = function (d) {
    var issues = model.issueList(d, { deadCovers: adminDeadCovers });
    var gallery = Array.isArray(d.images) ? d.images : [];
    var cover = String(d.image || "").trim() || gallery[0] || "";
    var coverUrl = safeUrl(cover);
    var stats = d.stats || {};
    var bits = [];
    if (d.barangay) bits.push(esc(d.barangay));
    if (stats.rating) bits.push(icon("star", 12) + " " + esc(String(stats.rating)));
    if (stats.travel) bits.push(esc(String(stats.travel)));
    if (gallery.length)
      bits.push("+" + gallery.length + " photo" + (gallery.length === 1 ? "" : "s"));
    var status = model.statusOf(d.status);
    var photoLabel = cover ? "Add another photo" : "Add a cover photo";
    return `
      <div class="admin-list-item admin-dest-row">
        <button type="button" class="admin-row-thumb" data-dest-id="${Number(d.id)}" onclick="adminQuickPhoto(${Number(d.id)},'library')" aria-label="${photoLabel}">
          ${coverUrl ? `<img src="${esc(coverUrl)}" alt="" onerror="adminThumbBroken(this)">` : icon("camera", 18)}
          ${coverUrl ? `<span class="admin-thumb-badge">${icon("camera", 10)}</span>` : ""}
        </button>
        <div class="admin-dest-main">
          <div class="admin-list-item-head">
            <div class="admin-dest-open" onclick="adminEditDest(${Number(d.id)})">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <strong>${esc(d.name || "Untitled place")}</strong>
                ${statusBadge(status)}
                ${d.featured ? `<span class="admin-status-pill">${icon("star", 11)} Featured</span>` : ""}
              </div>
              <span class="admin-row-meta">${bits.join(" &middot; ") || "No details yet"}</span>
              <div class="admin-quality ${issues.length ? "needs-work" : "ready"}">${issues.length ? "Needs: " + esc(issues.join(", ")) : "Ready for the public site"}</div>
            </div>
            <div class="admin-row-actions">
              <button type="button" class="admin-mini-btn${cover ? "" : " accent"}" onclick="adminQuickPhoto(${Number(d.id)},'library')">+ Photo</button>
              <button type="button" class="admin-mini-btn" onclick="adminEditDest(${Number(d.id)})">Edit</button>
              <button type="button" class="admin-mini-btn" onclick="adminPreviewDest(${Number(d.id)})">View</button>
              <details class="admin-row-menu">
                <summary>More</summary>
                <div class="admin-row-menu-body">
                  ${adminStatusActionsHtml(d)}
                  <button type="button" onclick="adminQuickPhoto(${Number(d.id)},'camera')">Take new photo</button>
                  <button type="button" class="danger" onclick="adminDeleteDest(${Number(d.id)})">Delete permanently</button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>`;
  };

  function adminPlaceFilterHtml() {
    var places = allPlaces();
    var areas = Array.from(
      new Set(
        places
          .map(function (p) {
            return String(p.barangay || "").trim();
          })
          .filter(Boolean),
      ),
    ).sort();
    var categories = typeof catStyle !== "undefined" ? Object.keys(catStyle) : [];
    var f = studioPlaceFilters;
    return `
      <div class="admin-filter-grid">
        <div class="admin-field"><label for="adminDestSearch">Search places</label>
          <input class="admin-directory-search" id="adminDestSearch" type="search" value="${esc(f.query)}" placeholder="Name, barangay or description" aria-label="Search places" oninput="adminFilterDestinations(this.value)">
        </div>
        <div class="admin-field"><label for="adminStatusFilter">Publishing</label>
          <select id="adminStatusFilter" onchange="adminUpdatePlaceFilter('status',this.value)">
            ${["all", "published", "draft", "archived"]
              .map(function (v) {
                return `<option value="${v}"${f.status === v ? " selected" : ""}>${v === "all" ? "All statuses" : model.statusOf(v)}</option>`;
              })
              .join("")}
          </select>
        </div>
        <div class="admin-field"><label for="adminCategoryFilter">Category</label>
          <select id="adminCategoryFilter" onchange="adminUpdatePlaceFilter('category',this.value)">
            <option value="all">All categories</option>
            ${categories
              .map(function (k) {
                return `<option value="${esc(k)}"${f.category === k ? " selected" : ""}>${esc(catStyle[k].label || k)}</option>`;
              })
              .join("")}
          </select>
        </div>
        <div class="admin-field"><label for="adminAreaFilter">Barangay / area</label>
          <select id="adminAreaFilter" onchange="adminUpdatePlaceFilter('area',this.value)">
            <option value="all">All areas</option>
            ${areas
              .map(function (a) {
                return `<option value="${esc(a)}"${f.area === a ? " selected" : ""}>${esc(a)}</option>`;
              })
              .join("")}
          </select>
        </div>
        <div class="admin-field"><label for="adminSortFilter">Sort by</label>
          <select id="adminSortFilter" onchange="adminUpdatePlaceFilter('sort',this.value)">
            <option value="updated_desc"${f.sort === "updated_desc" ? " selected" : ""}>Recently updated</option>
            <option value="name_asc"${f.sort === "name_asc" ? " selected" : ""}>Name A–Z</option>
            <option value="issues"${f.sort === "issues" ? " selected" : ""}>Most issues first</option>
            <option value="status"${f.sort === "status" ? " selected" : ""}>Publishing status</option>
          </select>
        </div>
      </div>`;
  }

  window.renderAdminDest = function () {
    var body = document.getElementById("adminBody");
    if (!body) return;
    adminSnapshotForm();
    var places = allPlaces();
    var filtered = model.filterAndSortPlaces(places, {
      query: studioPlaceFilters.query,
      status: studioPlaceFilters.status,
      category: studioPlaceFilters.category,
      area: studioPlaceFilters.area,
      issuesOnly: studioPlaceFilters.issuesOnly,
      sort: studioPlaceFilters.sort,
      categories: typeof catStyle !== "undefined" ? catStyle : {},
      deadCovers: adminDeadCovers,
    });
    var incomplete = model.contentStatus(places, { deadCovers: adminDeadCovers }).needsWork;
    var groups = window.adminDestGroups(filtered);
    var connected = typeof destinationsSource !== "undefined" && destinationsSource === "supabase";
    var canWrite = typeof adminCanWrite !== "undefined" && adminCanWrite;

    var html = `
      <div class="admin-data-banner ${connected && canWrite ? "" : "warning"}">
        <strong>${connected ? "Live Supabase directory" : "Offline fallback data"}</strong>
        <span>${places.length} listing${places.length === 1 ? "" : "s"} · ${incomplete} need details · ${canWrite ? "Admin writes enabled" : "Sign in with an admin account to save"}</span>
      </div>
      ${!connected ? '<div class="admin-notice warning">The database could not be reached. Reconnect before editing; saving fallback entries can create duplicates.</div>' : ""}
      ${!publishingReady() ? '<div class="admin-notice warning">Publish, draft and archive controls become active after the one-time destination publishing SQL migration is applied. Existing listings remain published.</div>' : ""}
      <button type="button" class="admin-add-btn" onclick="adminNewDest()">+ Add business or tourist place</button>
      ${adminPlaceFilterHtml()}
      <div class="admin-dir-toolbar">
        <button type="button" onclick="adminSetAllCats(false)">Expand all</button>
        <button type="button" onclick="adminSetAllCats(true)">Collapse all</button>
        <button type="button" class="${studioPlaceFilters.issuesOnly ? "on" : ""}" onclick="adminToggleNeedsWork()">${studioPlaceFilters.issuesOnly ? "Showing incomplete only" : "Only incomplete"} · ${incomplete}</button>
        <button type="button" onclick="adminResetPlaceFilters()">Clear filters</button>
      </div>`;

    if (adminEditingDestId !== null) html += window.adminDestFormHtml();

    if (!filtered.length) {
      html += `<div class="admin-notice">${places.length ? "No listings match these filters. Clear a filter or search for another name." : "No live listings yet. Add the first place above."}</div>`;
    } else {
      html += groups
        .map(function (g) {
          var collapsed = !!adminCollapsedCats[g.key];
          var needs = g.items.filter(function (d) {
            return model.issueList(d, { deadCovers: adminDeadCovers }).length;
          }).length;
          return `<div class="admin-cat-group">
          <button type="button" class="admin-cat-head" style="width:100%;text-align:left;color:var(--admin-text)" onclick="adminToggleCat(${JSON.stringify(g.key).replace(/"/g, "&quot;")})" aria-expanded="${!collapsed}">
            <span class="admin-cat-dot" style="background:${esc(g.color)}"></span>
            <span class="admin-cat-name">${esc(g.label)}</span>
            <span class="admin-cat-note">${needs ? needs + " need details" : "all complete"}</span>
            <span class="admin-cat-count">${g.items.length}</span>
            <span class="admin-cat-chev">${icon(collapsed ? "chevron-right" : "chevron-down", 14)}</span>
          </button>
          ${collapsed ? "" : `<div class="admin-cat-body">${g.items.map(window.adminDestRowHtml).join("")}</div>`}
        </div>`;
        })
        .join("");
    }

    html += `
      <div class="admin-dir-tools-label">Directory tools</div>
      <details class="admin-section-card admin-form-section-card" style="margin-bottom:10px">
        <summary>Manage categories · ${Object.keys(typeof catStyle !== "undefined" ? catStyle : {}).length}</summary>
        <div class="admin-section-body">${window.adminDestCatPanelHtml()}</div>
      </details>
      <details class="admin-section-card admin-form-section-card" style="margin-bottom:10px">
        <summary>Manage “What’s around me” · ${Object.values(
          typeof nearbyPlacesByBarangay !== "undefined" ? nearbyPlacesByBarangay : {},
        ).reduce(function (n, a) {
          return n + (Array.isArray(a) ? a.length : 0);
        }, 0)}</summary>
        <div class="admin-section-body">${window.adminNearbyPanelHtml()}</div>
      </details>
      ${
        typeof window.adminKmzPanelHtml === "function"
          ? `
      <details class="admin-section-card admin-form-section-card">
        <summary>Import places from KMZ / KML</summary>
        <div class="admin-section-body">${window.adminKmzPanelHtml()}</div>
      </details>`
          : ""
      }`;

    body.innerHTML = html;
    adminAfterRender();
  };

  window.adminFilterDestinations = function (value) {
    studioPlaceFilters.query = String(value || "");
    if (typeof adminDestSearchQuery !== "undefined")
      adminDestSearchQuery = studioPlaceFilters.query;
    window.renderAdminDest();
    var input = document.getElementById("adminDestSearch");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  window.adminUpdatePlaceFilter = function (key, value) {
    studioPlaceFilters[key] = value;
    window.renderAdminDest();
  };

  window.adminResetPlaceFilters = function () {
    studioPlaceFilters = {
      query: "",
      status: "all",
      category: "all",
      area: "all",
      issuesOnly: false,
      sort: "updated_desc",
    };
    if (typeof adminDestSearchQuery !== "undefined") adminDestSearchQuery = "";
    window.renderAdminDest();
  };

  window.adminToggleNeedsWork = function () {
    studioPlaceFilters.issuesOnly = !studioPlaceFilters.issuesOnly;
    window.renderAdminDest();
  };

  function validateSavedPlace(d) {
    return model.validatePlace(
      {
        name: d.name,
        category: d.category,
        barangay: d.barangay,
        description: d.description,
        lat: d.lat,
        lng: d.lng,
        color: d.color,
        image: d.image,
        images: d.images,
        gallery: [].concat(d.image || [], d.images || []),
      },
      { mode: "publish" },
    );
  }

  async function setPlaceStatus(id, nextStatus, options) {
    var opts = options || {};
    if (!publishingReady()) {
      showNotice(
        "Apply the destination publishing SQL migration before changing publish states.",
        "error",
      );
      return false;
    }
    if (!window.adminRequireWrite()) return false;
    var d = allPlaces().find(function (p) {
      return String(p.id) === String(id);
    });
    if (!d) {
      showNotice("That place could not be found. Refresh and try again.", "error");
      return false;
    }
    if (nextStatus === "published" && !opts.skipValidation) {
      var check = validateSavedPlace(d);
      if (!check.valid) {
        var missing = Object.values(check.errors).join(" ");
        if (
          window.confirm(
            "This place is not ready to publish: " + missing + "\n\nOpen the editor to fix it?",
          )
        )
          adminOpenPlaceEditor(id);
        return false;
      }
      if (
        check.warnings.coordinates &&
        !window.confirm(check.warnings.coordinates + " Publish anyway?")
      )
        return false;
    }
    var previous = model.statusOf(d.status);
    var result = await sb.from("destinations").update({ status: nextStatus }).eq("id", id);
    if (result.error) {
      showNotice("Could not update status: " + result.error.message, "error");
      return false;
    }
    recordActivity("place status", d.name || "Untitled place", id);
    await window.loadDataFromSupabase();
    window.renderAdminDest();
    if (typeof rebuildMarkers === "function") rebuildMarkers();
    var verb =
      nextStatus === "published"
        ? "published"
        : nextStatus === "archived"
          ? "archived"
          : "moved to drafts";
    showNotice((d.name || "Place") + " " + verb + ".", "success");
    if (!opts.noUndo) {
      showUndo((d.name || "Place") + " " + verb + ".", function () {
        setPlaceStatus(id, previous, { skipValidation: true, noUndo: true });
      });
    }
    return true;
  }

  window.adminSetPlaceStatus = setPlaceStatus;
  window.adminPublishDest = function (id) {
    return setPlaceStatus(id, "published");
  };
  window.adminUnpublishDest = function (id) {
    return setPlaceStatus(id, "draft");
  };
  window.adminArchiveDest = function (id) {
    var d = allPlaces().find(function (p) {
      return String(p.id) === String(id);
    });
    if (
      !window.confirm(
        "Archive “" +
          ((d && d.name) || "this place") +
          "”? It will be hidden from visitors but kept for restore.",
      )
    )
      return;
    return setPlaceStatus(id, "archived");
  };
  window.adminRestoreDest = function (id) {
    return setPlaceStatus(id, "draft", { skipValidation: true });
  };

  window.adminDeleteDest = async function (id) {
    if (!window.adminRequireWrite()) return;
    var d = allPlaces().find(function (p) {
      return String(p.id) === String(id);
    });
    if (
      !window.confirm(
        "Permanently delete “" +
          ((d && d.name) || "this place") +
          "”? This cannot be undone. Archiving is safer.",
      )
    )
      return;
    var result = await sb.from("destinations").delete().eq("id", id);
    if (result.error) {
      showNotice("Delete failed: " + result.error.message, "error");
      return;
    }
    recordActivity("place deleted", (d && d.name) || "Place", id);
    await window.loadDataFromSupabase();
    window.renderAdminDest();
    if (typeof rebuildMarkers === "function") rebuildMarkers();
    showNotice("Place deleted permanently.", "success");
  };

  window.adminToggleFeatured = async function (id) {
    if (!window.adminRequireWrite()) return;
    var d = allPlaces().find(function (p) {
      return String(p.id) === String(id);
    });
    if (!d) return;
    var next = !d.featured;
    var result = await sb.from("destinations").update({ featured: next }).eq("id", id);
    if (result.error) {
      showNotice("Could not update Featured: " + result.error.message, "error");
      return;
    }
    d.featured = next;
    recordActivity("place featured", d.name || "Untitled place", id);
    window.renderAdminDest();
    if (typeof rebuildMarkers === "function") rebuildMarkers();
    showNotice(
      (d.name || "Place") + (next ? " is featured." : " is no longer featured."),
      "success",
    );
  };

  window.adminPreviewDest = function (id) {
    var d = allPlaces().find(function (p) {
      return String(p.id) === String(id);
    });
    if (!d) return;
    window.closeAdminPanel();
    if (typeof map !== "undefined" && map && model.hasCoordinates(d))
      map.flyTo([d.lat, d.lng], 15, { duration: 0.6 });
    if (typeof openDest === "function") openDest(d, false);
    if (typeof toast === "function")
      toast(
        model.statusOf(d.status) === "published"
          ? "Public preview"
          : "Staff preview — not visible to visitors",
      );
  };

  window.adminQuickPhoto = function (id, mode) {
    if (!window.adminRequireWrite()) return;
    var input = document.getElementById("adminQuickPhotoInput");
    if (input) input.remove();
    input = document.createElement("input");
    input.type = "file";
    input.id = "adminQuickPhotoInput";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif";
    input.multiple = mode !== "camera";
    if (mode === "camera") input.setAttribute("capture", "environment");
    input.style.display = "none";
    input.addEventListener("change", function () {
      adminQuickPhotoUploadFiles(id, input.files);
    });
    document.body.appendChild(input);
    input.click();
  };

  async function adminQuickPhotoUploadFiles(id, files) {
    if (!files || !files.length) return;
    var body = document.getElementById("adminBody");
    if (body && !document.getElementById("adminQuickPhotoUploadList")) {
      body.insertAdjacentHTML(
        "afterbegin",
        '<div class="admin-upload-list" id="adminQuickPhotoUploadList" aria-live="polite"></div>',
      );
    }
    var added = 0;
    studioUploadFiles(files, "adminQuickPhoto", {
      addToGallery: false,
      onSuccess: async function (url, file, entry) {
        var d = allPlaces().find(function (p) {
          return String(p.id) === String(id);
        });
        if (!d) return;
        var gallery = Array.isArray(d.images) ? d.images.slice() : [];
        var patch;
        if (!d.image) patch = { image: url, images: gallery };
        else {
          gallery.push(url);
          patch = { images: gallery };
        }
        var result = await sb.from("destinations").update(patch).eq("id", id);
        if (result.error) throw new Error(result.error.message);
        recordActivity("place photo", d.name || "Untitled place", id);
        added++;
        if (entry) entry.message = "Added to " + (d.name || "place");
      },
      onComplete: async function () {
        await window.loadDataFromSupabase();
        window.renderAdminDest();
        if (typeof rebuildMarkers === "function") rebuildMarkers();
        if (added)
          showNotice(
            added + " photo" + (added === 1 ? "" : "s") + " saved to the place.",
            "success",
          );
      },
    });
  }

  window.adminQuickPhotoUpload = function (file) {
    adminQuickPhotoUploadFiles(adminQuickPhotoTargetId, [file]);
  };

  /* Categories reuse the existing CRUD functions and category panel renderer. */
  function adminRenderCategories() {
    var places = allPlaces();
    var keys = typeof catStyle !== "undefined" ? Object.keys(catStyle) : [];
    var body = document.getElementById("adminBody");
    if (!body) return;
    var rows = keys
      .map(function (key) {
        var count = places.filter(function (p) {
          return p.category === key;
        }).length;
        var c = catStyle[key];
        return `<div class="admin-activity-item"><span class="admin-activity-dot" style="background:${esc(c.color || "#0ea5e9")}"></span><span class="admin-activity-main"><strong>${esc(c.label || key)}</strong><small>${esc(key)} · ${count} place${count === 1 ? "" : "s"}</small></span><button type="button" class="admin-mini-btn" onclick="adminEditDestCat('${esc(key)}')">Edit</button></div>`;
      })
      .join("");
    body.innerHTML = `
      <section class="admin-home-hero">
        <div class="admin-home-eyebrow">Directory taxonomy</div>
        <h2>Categories &amp; marker colours</h2>
        <p>The same category key, label and colour drive Explore chips, map markers and place listings. Changes here update the public site after a refresh.</p>
      </section>
      <section class="admin-card" style="margin-bottom:14px"><div class="admin-card-head"><h3>Current categories</h3><span class="admin-kicker">${keys.length} live</span></div><div class="admin-activity-list">${rows || '<div class="admin-notice">No categories are loaded.</div>'}</div></section>
      <section class="admin-card"><h3 style="margin-bottom:10px">Edit categories</h3>${window.adminDestCatPanelHtml()}</section>`;
  }
  window.adminRenderCategories = adminRenderCategories;

  /* A real overview of pins: missing-coordinate records become one-tap fixes. */
  function adminRenderMapOverview() {
    var places = allPlaces();
    var q = model.normalize(studioMapQuery);
    var shown = places.filter(function (p) {
      return !q || model.normalize([p.name, p.barangay, p.category].join(" ")).includes(q);
    });
    var missing = shown.filter(function (p) {
      return !model.hasCoordinates(p);
    });
    var pinned = shown.filter(function (p) {
      return model.hasCoordinates(p);
    });
    var body = document.getElementById("adminBody");
    if (!body) return;
    body.innerHTML = `
      <section class="admin-home-hero">
        <div class="admin-home-eyebrow">Interactive map</div>
        <h2>Pins &amp; public visibility</h2>
        <p>Published places with valid coordinates appear on the public map. Drafts, archives and missing pins stay hidden until fixed.</p>
      </section>
      <div class="admin-stat-grid" style="margin-bottom:14px">
        ${adminStatCard(
          "published",
          pinned.filter(function (p) {
            return model.isPublished(p);
          }).length,
          "Published pins",
        )}
        ${adminStatCard(
          "drafts",
          pinned.filter(function (p) {
            return !model.isPublished(p);
          }).length,
          "Hidden pins",
        )}
        ${adminStatCard("needs", missing.length, "Missing / invalid pins")}
        ${adminStatCard(
          "archived",
          shown.filter(function (p) {
            return model.statusOf(p.status) === "archived";
          }).length,
          "Archived",
        )}
      </div>
      <div class="admin-field"><label for="adminMapSearch">Find a place on this map</label><input id="adminMapSearch" type="search" value="${esc(studioMapQuery)}" placeholder="Name, barangay or category" oninput="adminFilterMap(this.value)"></div>
      <div id="adminOverviewMap" class="admin-map-overview" aria-label="Map of place pins"></div>
      <div class="admin-map-legend">
        ${Object.keys(typeof catStyle !== "undefined" ? catStyle : {})
          .slice(0, 12)
          .map(function (k) {
            return `<span><i style="--legend-color:${esc(catStyle[k].color || "#0ea5e9")}"></i>${esc(catStyle[k].label || k)}</span>`;
          })
          .join("")}
      </div>
      <section class="admin-card" style="margin-bottom:14px"><div class="admin-card-head"><h3>Needs a pin</h3><span class="admin-kicker">${missing.length}</span></div>
        <div class="admin-map-list">${
          missing.length
            ? missing
                .map(function (p) {
                  return `<div class="admin-map-list-row"><span><strong>${esc(p.name || "Untitled place")}</strong><small>${esc(p.barangay || "No barangay")} · ${esc(model.statusOf(p.status))}</small></span><button type="button" class="admin-mini-btn" onclick="adminMapOpenPlace(${Number(p.id)})">Fix location</button></div>`;
                })
                .join("")
            : '<div class="admin-notice success">Every matching place has valid coordinates.</div>'
        }</div>
      </section>
      <section class="admin-card"><div class="admin-card-head"><h3>Places with pins</h3><span class="admin-kicker">${pinned.length}</span></div>
        <div class="admin-map-list">${
          pinned
            .slice(0, 30)
            .map(function (p) {
              return `<button type="button" class="admin-map-list-row" style="text-align:left;cursor:pointer" onclick="adminMapOpenPlace(${Number(p.id)})"><span><strong>${esc(p.name || "Untitled place")}</strong><small>${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)} · ${esc(model.statusOf(p.status))}</small></span>${icon("chevron-right", 16)}</button>`;
            })
            .join("") || '<div class="admin-notice">No pinned places match.</div>'
        }</div>
      </section>`;
    adminInitOverviewMap(pinned);
  }
  window.adminRenderMapOverview = adminRenderMapOverview;
  window.adminFilterMap = function (value) {
    studioMapQuery = String(value || "");
    adminDestroyMaps();
    adminRenderMapOverview();
    var input = document.getElementById("adminMapSearch");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  };
  window.adminMapOpenPlace = function (id) {
    adminOpenPlaceEditor(id);
  };

  function adminInitOverviewMap(rows) {
    var node = document.getElementById("adminOverviewMap");
    if (!node || typeof L === "undefined") return;
    if (studioOverviewMap) {
      try {
        studioOverviewMap.remove();
      } catch (_) {}
    }
    studioOverviewMap = L.map(node, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([10.5, 119.22], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(studioOverviewMap);
    var bounds = [];
    rows.forEach(function (p) {
      var color =
        (typeof catStyle !== "undefined" && catStyle[p.category] && catStyle[p.category].color) ||
        "#0ea5e9";
      var status = model.statusOf(p.status);
      var html = `<span class="admin-map-pin" style="--pin-color:${esc(color)};${status === "published" ? "" : "opacity:.5;filter:grayscale(.5)"}"></span>`;
      var marker = L.marker([Number(p.lat), Number(p.lng)], {
        title: p.name || "Untitled place",
        icon: L.divIcon({
          className: "admin-overview-marker",
          html: html,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(studioOverviewMap);
      marker.bindTooltip(esc((p.name || "Untitled place") + " · " + status));
      marker.on("click", function () {
        adminOpenPlaceEditor(p.id);
      });
      bounds.push([Number(p.lat), Number(p.lng)]);
    });
    if (bounds.length) studioOverviewMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    setTimeout(function () {
      if (studioOverviewMap) studioOverviewMap.invalidateSize();
    }, 80);
  }

  /* ───────────────────── PLACE EDITOR STATE ───────────────────── */

  var studioDraft = {};
  var studioFormLoadedKey = "";
  var studioFormErrors = {};
  var studioTouched = new Set();
  var studioCurrentStatus = "draft";
  var studioGeocodeResults = [];
  var studioMediaContainer = "adf";

  var FIELD_ERROR_IDS = {
    name: ["adfName", "adfNameError"],
    category: ["adfCat", "adfCatError"],
    barangay: ["adfBarangay", "adfBarangayError"],
    description: ["adfDesc", "adfDescError"],
    coordinates: ["adfLat", "adfCoordinatesError"],
    cover: ["adfGallery", "adfGalleryError"],
    gallery: ["adfGallery", "adfGalleryError"],
    color: ["adfColor", "adfColorError"],
  };
  var FIELD_TO_ERROR = {
    adfName: "name",
    adfCat: "category",
    adfBarangay: "barangay",
    adfDesc: "description",
    adfLat: "coordinates",
    adfLng: "coordinates",
    adfColor: "color",
    adfGallery: "cover",
  };

  function adminResetEditorState() {
    studioDraft = {};
    studioFormLoadedKey = "";
    studioFormErrors = {};
    studioTouched = new Set();
    studioCurrentStatus = publishingReady() ? "draft" : "published";
    studioGeocodeResults = [];
    studioMediaContainer = "adf";
    if (typeof __mediaGallery !== "undefined") __mediaGallery = [];
    if (typeof studioUploadEntries !== "undefined") studioUploadEntries = [];
  }

  function canonicalFromPlace(d, isNew) {
    var stats = (d && d.stats) || {};
    return {
      id: isNew ? "new" : d.id,
      status: isNew ? "draft" : model.statusOf(d && d.status),
      adfName: (d && d.name) || "",
      adfLat: d && d.lat != null ? String(d.lat) : "",
      adfLng: d && d.lng != null ? String(d.lng) : "",
      adfBarangay: (d && d.barangay) || "",
      adfCat:
        (d && d.category) ||
        (typeof catStyle !== "undefined" && Object.keys(catStyle)[0]) ||
        "beaches",
      adfColor: (d && d.color) || "#0EA5E9",
      adfDesc: (d && d.description) || "",
      adfTip: (d && d.tip) || "",
      adfRating: stats.rating || "",
      adfTravel: stats.travel || "",
      adfTemp: stats.temp || "",
      adfSeason: stats.season || "",
      adfGbp: (d && d.googleBusinessUrl) || "",
      adfCredit: (d && d.imageCredit) || "",
      adfClue: (d && d.clue) || "",
      adfHuntSpot: !!(d && d.huntSpot),
      adfFeatured: !!(d && d.featured),
      adfVideoType: (d && d.videoType) || "none",
      adfYoutubeUrl: (d && d.videoType === "youtube" && d.videoUrl) || "",
      adfVideoUploadedUrl: (d && d.videoType === "upload" && d.videoUrl) || "",
      _fields: {},
    };
  }

  function adminPrepareEditor(d, isNew) {
    var key = isNew ? "new" : String(d.id);
    if (studioFormLoadedKey === key) return;
    studioFormLoadedKey = key;
    studioDraft = canonicalFromPlace(d, isNew);
    studioCurrentStatus = publishingReady() ? studioDraft.status : "published";
    studioFormErrors = {};
    studioTouched = new Set();
    studioUploadEntries = [];
    studioDirty = false;
    __mediaGallery = [];
    if (d.image && !adminDeadCovers.has(String(d.id))) __mediaGallery.push(d.image);
    if (Array.isArray(d.images))
      d.images.forEach(function (u) {
        if (u && __mediaGallery.indexOf(u) < 0) __mediaGallery.push(u);
      });
  }

  function adminOpenPlaceEditor(id) {
    if (!confirmDiscard()) return;
    adminDestroyMaps();
    adminResetEditorState();
    adminTab = "dest";
    setActiveTab("dest");
    toggleNav(false);
    adminEditingDestId = id;
    if (id === "new") {
      __adminDetails = null;
      __adminContacts = [];
      __adminLinks = [];
      __adminAmenities = new Set();
      __adminPayments = new Set();
      window.renderAdminDest();
      Promise.all([window.loadAmenityVocab()])
        .then(function () {
          window.renderAdminPlaceExtras();
        })
        .catch(function () {});
    } else {
      __adminDetails = null;
      __adminContacts = [];
      __adminLinks = [];
      __adminAmenities = new Set();
      __adminPayments = new Set();
      window.renderAdminDest();
      Promise.all([window.loadAmenityVocab(), window.adminFetchPlaceExtras(id)])
        .then(function () {
          window.renderAdminPlaceExtras();
        })
        .catch(function () {});
    }
    setTimeout(function () {
      var form = document.querySelector(".admin-dest-editor");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  window.adminNewDest = function () {
    adminOpenPlaceEditor("new");
  };
  window.adminEditDest = function (id) {
    adminOpenPlaceEditor(id);
  };

  function domField(id) {
    var el = document.getElementById(id);
    if (!el || el.type === "file") return null;
    var form = el.closest && el.closest(".admin-dest-editor");
    // Ignore a previous place's DOM while the next editor is being prepared.
    if (form && form.dataset.editorKey && form.dataset.editorKey !== studioFormLoadedKey)
      return null;
    return el;
  }

  function formValue(id, fallback) {
    var el = domField(id);
    if (el) {
      if (el.type === "checkbox" || el.type === "radio") return !!el.checked;
      return el.value;
    }
    if (studioDraft._fields && Object.prototype.hasOwnProperty.call(studioDraft._fields, id)) {
      var field = studioDraft._fields[id];
      if (field.type === "checkbox" || field.type === "radio") return !!field.checked;
      return field.value;
    }
    if (Object.prototype.hasOwnProperty.call(studioDraft, id)) return studioDraft[id];
    return fallback == null ? "" : fallback;
  }

  function valueAttr(id, fallback) {
    return esc(formValue(id, fallback));
  }
  function checkedAttr(id, fallback) {
    return formValue(id, fallback) ? " checked" : "";
  }

  function adminSnapshotForm() {
    var form = document.querySelector("#adminBody .admin-dest-editor");
    if (!form) return;
    if (form.dataset.editorKey && form.dataset.editorKey !== studioFormLoadedKey) return;
    studioDraft._fields = studioDraft._fields || {};
    form.querySelectorAll("input[id], textarea[id], select[id]").forEach(function (el) {
      if (el.type === "file") return;
      studioDraft._fields[el.id] = {
        value: el.value,
        checked: !!el.checked,
        type: el.type || "text",
      };
    });
    var statusEl = document.getElementById("adfStatus");
    if (statusEl) studioCurrentStatus = model.statusOf(statusEl.value);
  }

  function adminRestoreFormFields() {
    var fields = studioDraft._fields || {};
    Object.keys(fields).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.type === "file") return;
      var state = fields[id];
      if (state.type === "checkbox" || state.type === "radio") el.checked = !!state.checked;
      else el.value = state.value;
    });
    var statusEl = document.getElementById("adfStatus");
    if (statusEl) statusEl.value = studioCurrentStatus;
  }

  function currentFormStatus() {
    var el = domField("adfStatus");
    return model.statusOf(el ? el.value : studioCurrentStatus);
  }

  function effectiveMode(nextStatus) {
    if (!publishingReady()) return "publish";
    var status = nextStatus || currentFormStatus();
    return status === "published" ? "publish" : "draft";
  }

  function adminReadForm() {
    function v(id, fallback) {
      return formValue(id, fallback == null ? "" : fallback);
    }
    return {
      id: formValue("adfId", ""),
      name: v("adfName"),
      category: v("adfCat"),
      barangay: v("adfBarangay"),
      lat: v("adfLat"),
      lng: v("adfLng"),
      description: v("adfDesc"),
      tip: v("adfTip"),
      color: v("adfColor", "#0EA5E9"),
      status: currentFormStatus(),
      featured: !!v("adfFeatured", false),
      cover: typeof __mediaGallery !== "undefined" ? __mediaGallery[0] || "" : "",
      gallery: typeof __mediaGallery !== "undefined" ? __mediaGallery.slice() : [],
      galleryCount: typeof __mediaGallery !== "undefined" ? __mediaGallery.length : 0,
      rating: v("adfRating"),
      travel: v("adfTravel"),
      temp: v("adfTemp"),
      season: v("adfSeason"),
      googleBusinessUrl: v("adfGbp"),
      imageCredit: v("adfCredit"),
      clue: v("adfClue"),
      huntSpot: !!v("adfHuntSpot", false),
      contactCount: typeof __adminContacts !== "undefined" ? __adminContacts.length : 0,
      linkCount: typeof __adminLinks !== "undefined" ? __adminLinks.length : 0,
      amenityCount: typeof __adminAmenities !== "undefined" ? __adminAmenities.size : 0,
    };
  }

  function savedCanonical(d) {
    return {
      name: d.name || "",
      category: d.category || "",
      barangay: d.barangay || "",
      description: d.description || "",
      tip: d.tip || "",
      lat: d.lat == null ? "" : String(d.lat),
      lng: d.lng == null ? "" : String(d.lng),
      color: d.color || "#0EA5E9",
      status: model.statusOf(d.status),
      featured: !!d.featured,
      cover: d.image || "",
      galleryCount: Array.isArray(d.images) ? d.images.length : 0,
    };
  }

  function adminShowValidation(errors, focusFirst) {
    studioFormErrors = errors || {};
    document.querySelectorAll("#adminBody .admin-field-error").forEach(function (el) {
      el.textContent = "";
    });
    document.querySelectorAll("#adminBody [aria-invalid='true']").forEach(function (el) {
      el.setAttribute("aria-invalid", "false");
    });
    var first = null;
    Object.keys(studioFormErrors).forEach(function (key) {
      var pair = FIELD_ERROR_IDS[key];
      if (!pair) return;
      var field = document.getElementById(pair[0]);
      var msg = document.getElementById(pair[1]);
      if (msg) msg.textContent = studioFormErrors[key];
      if (field) {
        field.setAttribute("aria-invalid", "true");
        if (!first) first = field;
      }
    });
    if (focusFirst && first) {
      first.focus({ preventScroll: false });
      first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function adminValidateSingle(el) {
    if (!el || !el.id) return;
    var key = FIELD_TO_ERROR[el.id];
    if (!key) return;
    studioTouched.add(key);
    var check = model.validatePlace(adminReadForm(), { mode: effectiveMode() });
    var msg = check.errors[key] || "";
    var pair = FIELD_ERROR_IDS[key];
    if (pair) {
      var box = document.getElementById(pair[1]);
      var field = document.getElementById(pair[0]);
      if (box) box.textContent = msg;
      if (field) field.setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }

  function adminUpdatePreview() {
    var d = adminReadForm();
    var safeCover = safeUrl(d.cover);
    var coverEl = document.getElementById("adfPreviewCover");
    if (coverEl) {
      if (safeCover) {
        coverEl.src = safeCover;
        coverEl.hidden = false;
      } else {
        coverEl.removeAttribute("src");
        coverEl.hidden = true;
      }
    }
    var setText = function (id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value || "";
    };
    setText("adfPreviewTitle", d.name || "Untitled place");
    setText(
      "adfPreviewCategory",
      (typeof catStyle !== "undefined" && catStyle[d.category] && catStyle[d.category].label) ||
        d.category ||
        "Uncategorised",
    );
    setText("adfPreviewBarangay", d.barangay || "No barangay yet");
    setText(
      "adfPreviewDescription",
      d.description || "Add a short description so visitors know what to expect.",
    );
    setText("adfPreviewTip", d.tip);
    setText(
      "adfPreviewPhotoCount",
      d.galleryCount
        ? d.galleryCount + " photo" + (d.galleryCount === 1 ? "" : "s")
        : "No photos yet",
    );
    var statusEl = document.getElementById("adfPreviewStatus");
    if (statusEl) statusEl.innerHTML = statusBadge(d.status);
    var formStatus = document.getElementById("adfStatusPill");
    if (formStatus) formStatus.innerHTML = statusBadge(d.status);
    var color = /^#[0-9a-f]{6}$/i.test(d.color)
      ? d.color
      : (typeof catStyle !== "undefined" && catStyle[d.category] && catStyle[d.category].color) ||
        "#0EA5E9";
    var dot = document.getElementById("adfPreviewMarkerDot");
    if (dot) dot.style.setProperty("--pin-color", color);
    var visibility = model.markerVisibility(
      d.category,
      (typeof catStyle !== "undefined" && catStyle[d.category] && catStyle[d.category].label) ||
        d.category,
    );
    setText("adfPreviewMarkerText", visibility.text);
    var coords = model.coordinates(d);
    var guidance = document.getElementById("adfCoordinatesGuidance");
    if (guidance) {
      guidance.className = "admin-map-guidance";
      if (coords.missing) {
        guidance.className += d.status === "published" ? " error" : " warning";
        guidance.textContent =
          d.status === "published"
            ? "A published place needs a map pin. Use search, tap the map, or enter coordinates."
            : "No pin yet. You can save this draft, but coordinates are required before publishing.";
      } else if (!coords.valid) {
        guidance.className += " error";
        guidance.textContent =
          "These coordinates are invalid. Use decimal latitude and longitude, or drag the pin.";
      } else if (!coords.inArea) {
        guidance.className += " warning";
        guidance.textContent =
          "This pin is outside the usual San Vicente area. Check the map before publishing.";
      } else {
        guidance.textContent =
          "Coordinates look valid. Drag the pin or tap the map to fine-tune the exact location.";
      }
    }
    var saved = studioDraft.saved || null;
    var changes = saved ? model.changedFields(saved, d) : [];
    var changesEl = document.getElementById("adfChangesList");
    if (changesEl) {
      changesEl.innerHTML = changes.length
        ? changes
            .map(function (c) {
              return '<span class="admin-change-pill">' + esc(c) + "</span>";
            })
            .join("")
        : '<span class="admin-preview-chip">No public changes yet</span>';
    }
    if (studioPinMarker && typeof L !== "undefined") adminUpdatePinMarker();
  }

  function adminInitFormEvents() {
    var form = document.querySelector("#adminBody .admin-dest-editor");
    if (!form) return;
    form.addEventListener("input", function (event) {
      var id = event.target && event.target.id;
      if (!id || ["adfLocationSearch", "adfMapsLink", "adfUrlInput"].indexOf(id) >= 0) return;
      markDirty();
      if (id === "adfLat" || id === "adfLng") adminSyncPinFromFields();
      if (id === "adfCat" || id === "adfColor") adminUpdatePinMarker();
      adminUpdatePreview();
    });
    form.addEventListener("change", function (event) {
      markDirty();
      if (event.target && (event.target.id === "adfCat" || event.target.id === "adfColor"))
        adminUpdatePinMarker();
      adminUpdatePreview();
    });
    form.addEventListener("focusout", function (event) {
      adminValidateSingle(event.target);
    });
  }

  function adminAfterRender() {
    adminRestoreFormFields();
    studioCurrentStatus = currentFormStatus();
    adminInitFormEvents();
    adminInitPinMap();
    adminUpdatePreview();
    if (typeof studioRenderUploadList === "function")
      studioRenderUploadList(studioMediaContainer || "adf");
    adminShowValidation(studioFormErrors, false);
    setSaveState(
      studioDirty ? "dirty" : "saved",
      studioDirty ? "Unsaved changes" : "All changes saved",
    );
  }

  function adminSetFormStatus(nextStatus) {
    if (!publishingReady()) {
      showNotice("Apply the destination publishing SQL migration before changing status.", "error");
      return;
    }
    var status = model.statusOf(nextStatus);
    var el = document.getElementById("adfStatus");
    if (el) el.value = status;
    studioCurrentStatus = status;
    studioDraft._fields = studioDraft._fields || {};
    studioDraft._fields.adfStatus = { value: status, checked: false, type: "hidden" };
    markDirty();
    adminUpdatePreview();
    live("Publishing status set to " + status + ". Save to apply it.");
  }

  window.adminSetFormStatus = adminSetFormStatus;

  function adminStatusCardHtml(status) {
    if (!publishingReady()) {
      return `<div class="admin-public-preview"><h3>Publishing state</h3><p>All existing listings are live. Apply the additive SQL migration to create drafts and archives.</p></div>`;
    }
    return `<div class="admin-public-preview"><h3>Publishing state</h3><div style="margin:8px 0">${statusBadge(status)}</div>
      <p>${status === "published" ? "This listing appears in Explore and on the public map." : status === "draft" ? "This listing is hidden from visitors until published." : "This listing is archived and hidden, but its data and photos are retained."}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${status !== "published" ? '<button type="button" class="admin-mini-btn accent" onclick="adminSetFormStatus(\'published\')">Mark for publishing</button>' : ""}
        ${status === "published" ? '<button type="button" class="admin-mini-btn" onclick="adminSetFormStatus(\'draft\')">Move to draft on save</button>' : ""}
        ${status === "archived" ? '<button type="button" class="admin-mini-btn" onclick="adminSetFormStatus(\'draft\')">Restore as draft</button>' : ""}
      </div></div>`;
  }

  window.adminDestFormHtml = function () {
    var isNew = adminEditingDestId === "new";
    var d = isNew
      ? {
          id: "new",
          name: "",
          lat: "",
          lng: "",
          category: (typeof catStyle !== "undefined" && Object.keys(catStyle)[0]) || "beaches",
          color: "#0EA5E9",
          barangay: "",
          description: "",
          tip: "",
          image: "",
          images: [],
          imageCredit: "",
          googleBusinessUrl: "",
          clue: "",
          huntSpot: false,
          featured: false,
          videoUrl: "",
          videoType: "none",
          status: "draft",
          stats: {},
        }
      : allPlaces().find(function (p) {
          return String(p.id) === String(adminEditingDestId);
        });
    if (!d)
      return '<div class="admin-notice error">That place could not be found. Close the editor and refresh.</div>';
    adminPrepareEditor(d, isNew);
    studioDraft.saved = savedCanonical(d);
    var status = model.statusOf(studioCurrentStatus);
    var categories = typeof catStyle !== "undefined" ? Object.keys(catStyle) : [];
    var areas = Array.from(
      new Set(
        []
          .concat(
            typeof EXPLORE_AREAS !== "undefined"
              ? EXPLORE_AREAS.map(function (a) {
                  return a.k;
                })
              : [],
            typeof nearbyPlacesByBarangay !== "undefined"
              ? Object.keys(nearbyPlacesByBarangay)
              : [],
          )
          .filter(Boolean),
      ),
    ).sort();
    var saveLabel = isNew
      ? publishingReady()
        ? "Create draft"
        : "Create listing"
      : "Save changes";
    var publishLabel = status === "published" ? "Save & publish" : "Save & publish";
    return `
      <form class="admin-dest-editor admin-edit-box" data-editor-key="${esc(studioFormLoadedKey)}" onsubmit="return false" aria-label="${isNew ? "New place" : "Edit place"}">
        <input type="hidden" id="adfId" value="${isNew ? "" : Number(d.id)}">
        <input type="hidden" id="adfStatus" value="${esc(status)}">
        <div class="admin-form-heading">${isNew ? "New place" : "Edit place"}</div>
        <div class="admin-form-help">Work through the sections in any order. Save/Cancel stays visible at the bottom. Photos are uploaded to Supabase Storage as soon as you choose them; the listing is only saved when you press Save.</div>
        <div style="padding:0 16px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span id="adfStatusPill">${statusBadge(status)}</span><span class="admin-preview-chip">Required fields are marked *</span></div>
        <div class="admin-editor-grid" style="padding:0 16px 16px">
          <div class="admin-editor-main">
            <details class="admin-form-section-card" open>
              <summary>1. Public listing</summary>
              <div class="admin-section-body">
                <div class="admin-field"><label for="adfName">Place name <span class="admin-required">*</span></label><input id="adfName" value="${valueAttr("adfName")}" placeholder="e.g. Long Beach" autocomplete="off"><p class="admin-field-error" id="adfNameError"></p><div class="admin-hint">Use the name visitors will recognise. This appears in search, cards and the detail sheet.</div></div>
                <div class="admin-grid-2">
                  <div class="admin-field"><label for="adfCat">Category <span class="admin-required">*</span></label><select id="adfCat">${categories
                    .map(function (k) {
                      return `<option value="${esc(k)}"${formValue("adfCat") === k ? " selected" : ""}>${esc(catStyle[k].label || k)}</option>`;
                    })
                    .join(
                      "",
                    )}</select><p class="admin-field-error" id="adfCatError"></p><div class="admin-hint">Controls the public filter chip and marker colour.</div></div>
                  <div class="admin-field"><label for="adfBarangay">Barangay / area <span class="admin-required">*</span></label><input id="adfBarangay" list="adfBarangayList" value="${valueAttr("adfBarangay")}" placeholder="e.g. Poblacion or Port Barton"><datalist id="adfBarangayList">${areas
                    .map(function (a) {
                      return `<option value="${esc(a)}"></option>`;
                    })
                    .join(
                      "",
                    )}</datalist><p class="admin-field-error" id="adfBarangayError"></p></div>
                </div>
                <div class="admin-field"><label for="adfDesc">Description <span class="admin-required">*</span></label><textarea id="adfDesc" rows="4" placeholder="What is this place, and why should someone visit or use it?">${valueAttr("adfDesc")}</textarea><p class="admin-field-error" id="adfDescError"></p></div>
                <div class="admin-field"><label for="adfTip">Visitor tip</label><textarea id="adfTip" rows="3" placeholder="Access, hours, fees, cash, road or weather advice">${valueAttr("adfTip")}</textarea></div>
                <div class="admin-toggle-row"><label for="adfFeatured">Feature in Explore</label><input type="checkbox" id="adfFeatured"${checkedAttr("adfFeatured")}></div>
                <div class="admin-grid-2">
                  <div class="admin-field"><label for="adfRating">Rating</label><input id="adfRating" value="${valueAttr("adfRating")}" placeholder="4.8"></div>
                  <div class="admin-field"><label for="adfTravel">Access / travel time</label><input id="adfTravel" value="${valueAttr("adfTravel")}" placeholder="15 min from Poblacion"></div>
                  <div class="admin-field"><label for="adfTemp">Typical temperature</label><input id="adfTemp" value="${valueAttr("adfTemp")}" placeholder="29°C"></div>
                  <div class="admin-field"><label for="adfSeason">Best season</label><input id="adfSeason" value="${valueAttr("adfSeason")}" placeholder="Nov–May"></div>
                </div>
              </div>
            </details>

            <details class="admin-form-section-card" open>
              <summary>2. Map location &amp; marker</summary>
              <div class="admin-section-body">
                <div class="admin-field"><label for="adfMapsLink">Paste a Google Maps link</label><input id="adfMapsLink" placeholder="https://www.google.com/maps/place/..." oninput="adminParseMapsLink()"><div id="adfMapsLinkStatus" class="admin-hint">Full google.com/maps/... links can fill the coordinates below.</div></div>
                <div class="admin-map-search-row">
                  <input id="adfLocationSearch" type="search" placeholder="Search for a place or address" aria-label="Search for a map location" onkeydown="if(event.key==='Enter'){event.preventDefault();adminSearchPinLocation();}">
                  <button type="button" class="admin-mini-btn accent" onclick="adminSearchPinLocation()">Search</button>
                  <button type="button" class="admin-mini-btn" onclick="adminUseMyLocation()" aria-label="Use my current location">${icon("locate-fixed", 16)}</button>
                </div>
                <div id="adfGeocodeResults" class="admin-geocode-results" aria-live="polite"></div>
                <div class="admin-map-wrap">
                  <div class="admin-map-toolbar">
                    <div class="admin-hint">Drag the pin, tap the map, or enter decimal coordinates. The marker uses the category colour from the public map.</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                      <button type="button" class="admin-mini-btn" onclick="adminSetPinFromCenter()">Use map centre</button>
                      <button type="button" class="admin-mini-btn" onclick="adminClearPin()">Clear pin</button>
                    </div>
                  </div>
                  <div id="adfMapCanvas" class="admin-map-canvas" aria-label="Drag the pin to set this place's location"></div>
                  <div class="admin-pin-preview"><span class="admin-pin-dot" id="adfPreviewMarkerDot"></span><span><strong>Public marker preview</strong><small id="adfPreviewMarkerText">Visible when visitors zoom in.</small></span></div>
                  <div class="admin-map-guidance" id="adfCoordinatesGuidance" role="status">Checking coordinates…</div>
                </div>
                <div class="admin-grid-2" style="margin-top:12px">
                  <div class="admin-field"><label for="adfLat">Latitude</label><input id="adfLat" inputmode="decimal" value="${valueAttr("adfLat")}" placeholder="10.49620" oninput="adminSyncPinFromFields()"><p class="admin-field-error" id="adfCoordinatesError"></p></div>
                  <div class="admin-field"><label for="adfLng">Longitude</label><input id="adfLng" inputmode="decimal" value="${valueAttr("adfLng")}" placeholder="119.26070" oninput="adminSyncPinFromFields()"></div>
                </div>
                <div class="admin-field"><label for="adfColor">Marker colour override</label><input id="adfColor" value="${valueAttr("adfColor", "#0EA5E9")}" placeholder="#0EA5E9"><p class="admin-field-error" id="adfColorError"></p><div class="admin-hint">Leave this as the category colour unless this place needs a distinct marker.</div></div>
              </div>
            </details>

            <details class="admin-form-section-card" open>
              <summary>3. Photos &amp; video</summary>
              <div class="admin-section-body">
                <div id="adfGallery">${window.mediaGalleryHtml("adf", "dest")}</div>
                ${window.mediaVideoHtml("adf", d.videoUrl, d.videoType)}
                <div class="admin-field"><label for="adfCredit">Photo credit</label><input id="adfCredit" value="${valueAttr("adfCredit")}" placeholder="Photo: Jane Doe, Wikimedia Commons, CC BY 4.0"><div class="admin-hint">Required when a photo has a licence that asks for attribution. Leave blank for your own photos.</div></div>
              </div>
            </details>

            <details class="admin-form-section-card">
              <summary>4. Practical details, contacts &amp; facilities</summary>
              <div class="admin-section-body">
                <div class="admin-field"><button type="button" class="admin-save-btn" id="adfAutoFillBtn" onclick="adminAutoFill()">Auto-fill from OpenStreetMap &amp; Wikimedia</button><div id="adfAutoStatus" class="admin-hint">Optional helper. You can still enter everything manually.</div><div id="adfAutoResults"></div></div>
                <div id="adpExtras" class="admin-extras">${window.adminPlaceExtrasHtml()}</div>
              </div>
            </details>

            <details class="admin-form-section-card">
              <summary>5. Business profile &amp; The Hunt</summary>
              <div class="admin-section-body">
                <div class="admin-field"><label for="adfGbp">Google Business Profile URL</label><input id="adfGbp" value="${valueAttr("adfGbp")}" placeholder="https://www.google.com/maps/place/..." oninput="adminParseGbpLink()"><div id="adfGbpStatus" class="admin-hint">Paste the business's Share link. Coordinates are filled in when the link contains them.</div></div>
                <div class="admin-field"><label for="adfClue">The Hunt clue</label><textarea id="adfClue" rows="3" placeholder="A riddle that hints at this place without naming it.">${valueAttr("adfClue")}</textarea></div>
                <label class="admin-toggle-row" for="adfHuntSpot"><span>Make this one of the hunting spots</span><input type="checkbox" id="adfHuntSpot"${checkedAttr("adfHuntSpot")}></label>
              </div>
            </details>

            <div class="admin-edit-actions" role="group" aria-label="Place editor actions">
              <button type="button" class="admin-save-btn" id="adfSaveBtn" onclick="adminSaveDest()">${esc(saveLabel)}</button>
              ${status !== "published" && publishingReady() ? `<button type="button" class="admin-save-btn" onclick="adminSaveDest('published')">${esc(publishLabel)}</button>` : ""}
              <button type="button" class="admin-secondary-btn" onclick="adminPreviewCurrentPlace()">Preview</button>
              <button type="button" class="admin-cancel-btn" onclick="adminCancelEditor()">Cancel</button>
              <div class="admin-save-state" id="adfSaveState" role="status" aria-live="polite" data-state="${esc(studioSaveState)}">${esc(studioSaveMessage)}</div>
            </div>
          </div>
          <aside class="admin-editor-aside">
            ${adminStatusCardHtml(status)}
            <div class="admin-public-preview">
              <div class="admin-kicker">Public listing preview</div>
              <img class="admin-public-preview-cover" id="adfPreviewCover" alt="" hidden>
              <h3 id="adfPreviewTitle">Untitled place</h3>
              <div class="admin-public-preview-meta"><span class="admin-preview-chip" id="adfPreviewCategory">Uncategorised</span><span class="admin-preview-chip" id="adfPreviewBarangay">No barangay yet</span><span class="admin-preview-chip" id="adfPreviewPhotoCount">No photos yet</span></div>
              <span id="adfPreviewStatus">${statusBadge(status)}</span>
              <p id="adfPreviewDescription">Add a short description so visitors know what to expect.</p>
              <p id="adfPreviewTip"></p>
              <p class="admin-section-desc">This preview reflects your unsaved edits. The public map uses the same category colour and only shows published places with valid pins.</p>
            </div>
            <div class="admin-changes-card"><h3>Changes going live</h3><p class="admin-section-desc">These fields differ from the saved listing. Review them before publishing.</p><div class="admin-changes-list" id="adfChangesList"><span class="admin-preview-chip">No public changes yet</span></div></div>
          </aside>
        </div>
      </form>`;
  };

  window.adminCancelEditor = function () {
    if (!confirmDiscard()) return;
    studioDirty = false;
    adminResetEditorState();
    adminEditingDestId = null;
    adminDestroyMaps();
    window.renderAdminDest();
    clearDirty();
  };

  window.adminPreviewCurrentPlace = function () {
    var d = adminReadForm();
    var coords = model.coordinates(d);
    var numericId = /^\d+$/.test(String(d.id || "")) ? Number(d.id) : null;
    var preview = {
      id: numericId,
      name: d.name || "Untitled place",
      lat: coords.valid ? coords.lat : null,
      lng: coords.valid ? coords.lng : null,
      category: d.category,
      color: d.color,
      barangay: d.barangay,
      description: d.description,
      tip: d.tip,
      image: d.cover,
      images: d.gallery.slice(1),
      imageCredit: d.imageCredit,
      stats: { rating: d.rating, travel: d.travel, temp: d.temp, season: d.season },
      status: d.status,
      videoUrl: "",
      videoType: "",
      featured: d.featured,
    };
    window.closeAdminPanel();
    if (typeof openDest === "function") openDest(preview, false);
    if (typeof toast === "function")
      toast(d.status === "published" ? "Preview of published listing" : "Preview of hidden draft");
  };

  /* Leaflet pin editor. Uses the same OSM tiles as the public map. */
  function adminPinIcon(color, status) {
    var opacity = status === "published" ? "1" : "0.62";
    return L.divIcon({
      className: "admin-pin-marker",
      html: `<span class="admin-map-pin" style="--pin-color:${esc(color)};opacity:${opacity}"></span>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  function adminInitPinMap() {
    var node = document.getElementById("adfMapCanvas");
    if (!node || typeof L === "undefined") return;
    if (studioPinMap) {
      try {
        studioPinMap.remove();
      } catch (_) {}
    }
    var d = adminReadForm();
    var c = model.coordinates(d);
    var center = c.valid ? [c.lat, c.lng] : [10.5, 119.22];
    studioPinMap = L.map(node, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true,
      tap: true,
    }).setView(center, c.valid ? 15 : 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(studioPinMap);
    studioPinMarker = L.marker(center, {
      draggable: true,
      keyboard: true,
      title: "Drag to set the place location",
      icon: adminPinIcon(d.color, d.status),
    }).addTo(studioPinMap);
    studioPinMarker.on("dragend", function () {
      var p = studioPinMarker.getLatLng();
      adminSetPinLatLng(p.lat, p.lng);
    });
    studioPinMap.on("click", function (event) {
      adminSetPinLatLng(event.latlng.lat, event.latlng.lng);
    });
    setTimeout(function () {
      if (studioPinMap) studioPinMap.invalidateSize();
    }, 80);
  }

  function adminUpdatePinMarker() {
    if (!studioPinMarker || typeof L === "undefined") return;
    var d = adminReadForm();
    var color = /^#[0-9a-f]{6}$/i.test(d.color)
      ? d.color
      : (typeof catStyle !== "undefined" && catStyle[d.category] && catStyle[d.category].color) ||
        "#0EA5E9";
    studioPinMarker.setIcon(adminPinIcon(color, d.status));
  }

  function adminSetPinLatLng(lat, lng) {
    var latEl = document.getElementById("adfLat");
    var lngEl = document.getElementById("adfLng");
    if (latEl) latEl.value = Number(lat).toFixed(6);
    if (lngEl) lngEl.value = Number(lng).toFixed(6);
    if (studioPinMarker && typeof L !== "undefined") studioPinMarker.setLatLng([lat, lng]);
    markDirty();
    adminUpdatePreview();
    adminValidateSingle(latEl);
  }

  window.adminSetPinLatLng = adminSetPinLatLng;
  window.adminSyncPinFromFields = function () {
    if (!studioPinMarker || !studioPinMap || typeof L === "undefined") return;
    var d = adminReadForm();
    var c = model.coordinates(d);
    if (!c.valid) return;
    studioPinMarker.setLatLng([c.lat, c.lng]);
    if (!c.inArea)
      studioPinMap.setView([c.lat, c.lng], Math.max(studioPinMap.getZoom(), 13), {
        animate: false,
      });
    else if (studioPinMap.getZoom() < 13)
      studioPinMap.setView([c.lat, c.lng], 14, { animate: false });
  };

  window.adminSetPinFromCenter = function () {
    if (!studioPinMap) return;
    var p = studioPinMap.getCenter();
    adminSetPinLatLng(p.lat, p.lng);
  };

  window.adminClearPin = function () {
    var latEl = document.getElementById("adfLat");
    var lngEl = document.getElementById("adfLng");
    if (latEl) latEl.value = "";
    if (lngEl) lngEl.value = "";
    markDirty();
    adminUpdatePreview();
  };

  window.adminUseMyLocation = function () {
    if (!navigator.geolocation) {
      showNotice("This browser cannot provide a location. Enter coordinates manually.", "warning");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        adminSetPinLatLng(pos.coords.latitude, pos.coords.longitude);
        if (studioPinMap) studioPinMap.setView([pos.coords.latitude, pos.coords.longitude], 16);
      },
      function (err) {
        showNotice("Could not get your location: " + (err.message || "permission denied"), "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  window.adminSearchPinLocation = async function () {
    var input = document.getElementById("adfLocationSearch");
    var out = document.getElementById("adfGeocodeResults");
    var q = input && input.value.trim();
    if (!q || !out) return;
    out.innerHTML = '<div class="admin-notice">Searching OpenStreetMap…</div>';
    try {
      var url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=" +
        encodeURIComponent(q + " San Vicente Palawan Philippines");
      var res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Search service returned HTTP " + res.status);
      var rows = await res.json();
      studioGeocodeResults = Array.isArray(rows) ? rows : [];
      if (!studioGeocodeResults.length) {
        out.innerHTML =
          '<div class="admin-notice warning">No matching place found. Try a shorter name or enter coordinates directly.</div>';
        return;
      }
      out.innerHTML = studioGeocodeResults
        .map(function (r, i) {
          return `<button type="button" onclick="adminChoosePinResult(${i})"><strong>${esc(r.display_name.split(",")[0] || q)}</strong><small>${esc(r.display_name)}</small></button>`;
        })
        .join("");
      live(studioGeocodeResults.length + " map results found.");
    } catch (err) {
      out.innerHTML =
        '<div class="admin-notice error">Map search is unavailable right now. You can still drag the pin or enter coordinates.</div>';
    }
  };

  window.adminChoosePinResult = function (index) {
    var r = studioGeocodeResults[index];
    if (!r) return;
    var lat = Number(r.lat),
      lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    adminSetPinLatLng(lat, lng);
    if (studioPinMap) studioPinMap.setView([lat, lng], 16);
    var out = document.getElementById("adfGeocodeResults");
    if (out)
      out.innerHTML =
        '<div class="admin-notice success">Location selected. Drag the pin if it needs fine-tuning.</div>';
  };

  /* Save the real destinations row and all related practical details. */
  window.adminSaveDest = async function (nextStatus) {
    if (!window.adminRequireWrite()) return;
    adminSnapshotForm();
    var requestedStatus = nextStatus ? model.statusOf(nextStatus) : currentFormStatus();
    if (nextStatus && !publishingReady()) {
      showNotice(
        "Apply the destination publishing SQL migration before changing publish states.",
        "error",
      );
      return;
    }
    var mode = nextStatus === "published" ? "publish" : effectiveMode(nextStatus);
    var form = adminReadForm();
    var validation = model.validatePlace(form, { mode: mode });
    if (!validation.valid) {
      adminShowValidation(validation.errors, true);
      setSaveState("failed", "Fix the highlighted fields before saving.");
      showNotice("This listing cannot be saved yet. Fix the highlighted fields.", "error");
      return;
    }
    if (
      validation.warnings.coordinates &&
      nextStatus === "published" &&
      !window.confirm(validation.warnings.coordinates + " Publish anyway?")
    )
      return;

    var saveBtn = document.getElementById("adfSaveBtn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
    }
    setSaveState("saving", "Saving to the live database…");
    try {
      var gallery = (typeof __mediaGallery !== "undefined" ? __mediaGallery : []).map(safeUrl);
      if (
        gallery.some(function (u) {
          return !u;
        })
      ) {
        adminShowValidation(
          { gallery: "One or more photo links is not a valid public image URL." },
          true,
        );
        throw new Error("A photo link is invalid or uses a temporary local/blob URL.");
      }
      var video = await window.mediaUploadVideoIfNeeded("adf");
      var cover = gallery.shift() || "";
      var coords = model.coordinates(form);
      var val = function (id) {
        return formValue(id, "");
      };
      var payload = {
        name: val("adfName").trim(),
        lat: coords.valid ? coords.lat : null,
        lng: coords.valid ? coords.lng : null,
        category: val("adfCat"),
        color: val("adfColor").trim() || "#0EA5E9",
        image: cover,
        images: gallery,
        description: val("adfDesc").trim(),
        tip: val("adfTip").trim(),
        rating: val("adfRating").trim(),
        travel: val("adfTravel").trim(),
        temp: val("adfTemp").trim(),
        season: val("adfSeason").trim(),
        video_url: video.url || null,
        video_type: video.type || null,
        featured: !!formValue("adfFeatured", false),
        barangay: val("adfBarangay").trim(),
        google_business_url: val("adfGbp").trim() || null,
        image_credit: val("adfCredit").trim() || null,
        clue: val("adfClue").trim() || null,
        hunt_spot: !!formValue("adfHuntSpot", false),
      };
      if (publishingReady()) payload.status = requestedStatus;
      var placeId = adminEditingDestId;
      if (placeId === "new") {
        payload.sort_order = allPlaces().length;
        var inserted = await sb.from("destinations").insert(payload).select("id").single();
        if (inserted.error) throw inserted.error;
        placeId = inserted.data && inserted.data.id;
      } else {
        var updated = await sb.from("destinations").update(payload).eq("id", placeId);
        if (updated.error) throw updated.error;
      }
      try {
        await window.adminSavePlaceExtras(placeId);
      } catch (extraErr) {
        showNotice(
          "The place was saved, but its practical details failed: " +
            (extraErr.message || extraErr),
          "warning",
        );
      }
      recordActivity("place saved", payload.name, placeId);
      studioDirty = false;
      adminEditingDestId = null;
      adminResetEditorState();
      await window.loadDataFromSupabase();
      window.renderAdminDest();
      if (typeof rebuildMarkers === "function") rebuildMarkers();
      clearDirty();
      showNotice(
        payload.name + " saved" + (publishingReady() ? " as " + requestedStatus : "") + ".",
        "success",
      );
    } catch (err) {
      setSaveState("failed", "Save failed: " + (err.message || err));
      showNotice("Save failed: " + (err.message || err), "error");
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = adminEditingDestId === "new" ? "Create listing" : "Save changes";
      }
    }
  };

  /* ─────────────────── DEVICE-FIRST PHOTO WORKFLOW ─────────────────── */

  var studioUploadEntries = [];
  var studioUploadSeq = 0;
  var studioPhotoFiles = [];
  var studioPhotoError = "";
  var studioPhotoBusy = false;
  var studioPhotoSearch = "";

  function studioMediaError(containerId, message) {
    var el = document.getElementById((containerId || "adf") + "GalleryError");
    if (el) el.textContent = message || "";
    if (message) showNotice(message, "error");
  }

  function studioMediaCardHtml(url, index, containerId) {
    var safe = safeUrl(url);
    var name = safe ? safe.split("/").pop().split("?")[0] : "Invalid image URL";
    return `<div class="admin-photo-card">
      <div class="admin-photo-thumb">
        ${safe ? `<img src="${esc(safe)}" alt="Photo ${index + 1} preview">` : icon("image-off", 24)}
        ${index === 0 ? '<span class="admin-photo-cover-tag">Cover</span>' : ""}
      </div>
      <div class="admin-photo-body">
        <div class="admin-photo-name">${esc(name)}</div>
        <div class="admin-photo-actions">
          ${index > 0 ? `<button type="button" onclick="mediaMakeCover(${index},'${esc(containerId)}')">Set cover</button>` : ""}
          <button type="button" onclick="mediaMoveImage(${index},-1,'${esc(containerId)}')"${index === 0 ? " disabled" : ""} aria-label="Move photo ${index + 1} earlier">↑</button>
          <button type="button" onclick="mediaMoveImage(${index},1,'${esc(containerId)}')"${index === __mediaGallery.length - 1 ? " disabled" : ""} aria-label="Move photo ${index + 1} later">↓</button>
          <button type="button" class="danger" onclick="mediaRemoveImage(${index},'${esc(containerId)}')">Remove</button>
        </div>
      </div>
    </div>`;
  }

  window.mediaGalleryHtml = function (containerId, prefix) {
    __mediaPrefix = prefix || "item";
    __mediaActiveContainer = containerId;
    studioMediaContainer = containerId;
    var cards = (__mediaGallery || [])
      .map(function (url, i) {
        return studioMediaCardHtml(url, i, containerId);
      })
      .join("");
    return `
      <label class="admin-photo-label">Photos — first image is the public cover</label>
      <div class="admin-hint">Choose photos from the device library, take a new photo, drag files here, or paste a copied image while focus is outside a text field. Images are optimized and saved to Supabase Storage immediately.</div>
      <div class="admin-dropzone" id="${containerId}Dropzone" ondragover="event.preventDefault();this.classList.add('is-drag')" ondragleave="this.classList.remove('is-drag')" ondrop="mediaDrop(event,'${containerId}')">
        <label class="admin-photo-add">
          <input type="file" id="${containerId}LibraryInput" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif" multiple onchange="mediaUploadFile(this,'${containerId}')" hidden>
          ${icon("images", 22)}<span>Choose photos</span><small>Device library · multiple allowed</small>
        </label>
        <label class="admin-photo-add">
          <input type="file" id="${containerId}CameraInput" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onchange="mediaUploadFile(this,'${containerId}')" hidden>
          ${icon("camera", 22)}<span>Take photo</span><small>Uses the device camera where supported</small>
        </label>
      </div>
      <div class="admin-photo-grid" id="${containerId}PhotoGrid">${cards || '<div class="admin-notice">No photos yet. Add the cover photo first.</div>'}</div>
      <p class="admin-field-error" id="${containerId}GalleryError"></p>
      <div class="admin-upload-list" id="${containerId}UploadList" aria-live="polite"></div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <input id="${containerId}UrlInput" placeholder="Or paste a public https image URL" style="flex:1;min-width:180px" aria-label="Paste image URL">
        <button type="button" class="admin-mini-btn" onclick="mediaAddUrl('${containerId}')">Add URL</button>
      </div>
      <div class="admin-hint">Removing a photo only removes it from this listing after you save; the uploaded file stays in the Photos library. Temporary blob: and data: URLs are never saved.</div>`;
  };

  window.mediaRefreshGrid = function (containerId) {
    var grid = document.getElementById((containerId || studioMediaContainer) + "PhotoGrid");
    if (!grid) return;
    containerId = containerId || studioMediaContainer;
    grid.innerHTML = __mediaGallery.length
      ? __mediaGallery
          .map(function (url, i) {
            return studioMediaCardHtml(url, i, containerId);
          })
          .join("")
      : '<div class="admin-notice">No photos yet. Add the cover photo first.</div>';
  };

  window.mediaAddUrl = function (containerId) {
    var input = document.getElementById(containerId + "UrlInput");
    var url = input && input.value.trim();
    if (!url) return;
    var safe = safeUrl(url);
    if (!safe) {
      studioMediaError(
        containerId,
        "Use a public http(s) image URL. Local paths, blob: and data: URLs cannot be saved.",
      );
      return;
    }
    if (__mediaGallery.indexOf(safe) >= 0) {
      studioMediaError(containerId, "That photo is already in this listing.");
      return;
    }
    __mediaGallery.push(safe);
    input.value = "";
    studioMediaError(containerId, "");
    markDirty();
    window.mediaRefreshGrid(containerId);
    adminUpdatePreview();
  };

  window.mediaRemoveImage = function (index, containerId) {
    if (
      !window.confirm(
        "Remove this photo from the listing? The uploaded file remains in the Photos library.",
      )
    )
      return;
    __mediaGallery.splice(index, 1);
    markDirty();
    window.mediaRefreshGrid(containerId);
    adminUpdatePreview();
  };

  window.mediaMakeCover = function (index, containerId) {
    if (index <= 0 || index >= __mediaGallery.length) return;
    var url = __mediaGallery.splice(index, 1)[0];
    __mediaGallery.unshift(url);
    markDirty();
    window.mediaRefreshGrid(containerId);
    adminUpdatePreview();
    live("Cover photo changed.");
  };

  window.mediaMoveImage = function (index, direction, containerId) {
    var next = index + direction;
    if (next < 0 || next >= __mediaGallery.length) return;
    var tmp = __mediaGallery[index];
    __mediaGallery[index] = __mediaGallery[next];
    __mediaGallery[next] = tmp;
    markDirty();
    window.mediaRefreshGrid(containerId);
    adminUpdatePreview();
  };

  window.mediaDrop = function (event, containerId) {
    event.preventDefault();
    if (event.currentTarget) event.currentTarget.classList.remove("is-drag");
    var files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length) studioUploadFiles(files, containerId, { addToGallery: true });
  };

  window.mediaUploadFile = function (input, containerId) {
    var files = input && input.files ? Array.from(input.files) : [];
    if (files.length)
      studioUploadFiles(files, containerId, { addToGallery: containerId !== "adminQuickPhoto" });
    if (input) input.value = "";
  };

  window.mediaUploadFiles = function (files, containerId) {
    var isLibrary = containerId === "adminPhotoLibrary";
    return studioUploadFiles(files, containerId, {
      addToGallery: !isLibrary,
      onComplete: isLibrary
        ? function () {
            adminLoadPhotoLibrary();
          }
        : null,
    });
  };

  function studioUploadListHost(containerId) {
    return document.getElementById(containerId + "UploadList");
  }

  function studioRenderUploadList(containerId) {
    var host = studioUploadListHost(containerId);
    if (!host) return;
    var entries = studioUploadEntries.filter(function (e) {
      return e.containerId === containerId;
    });
    if (!entries.length) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML = entries
      .map(function (e) {
        var statusText =
          e.status === "success"
            ? e.message || "Uploaded and ready"
            : e.status === "failed"
              ? "Failed"
              : e.status === "uploading"
                ? "Uploading"
                : e.status === "optimizing"
                  ? "Optimizing image"
                  : "Queued";
        return `<div class="admin-upload-row" data-status="${esc(e.status)}">
        <div class="admin-upload-row-head"><strong>${esc(e.file ? e.file.name : "Photo")}</strong><span>${esc(statusText)}${e.progress ? " · " + e.progress + "%" : ""}</span></div>
        <div class="admin-progress"><div class="admin-progress-bar" style="width:${Number(e.progress || 0)}%"></div></div>
        ${e.error ? `<div class="admin-upload-error">${esc(e.error)}</div>` : ""}
        ${e.status === "failed" ? `<div class="admin-upload-actions"><button type="button" onclick="studioRetryUpload(${e.id})">Retry</button><button type="button" onclick="studioRemoveUpload(${e.id})">Dismiss</button></div>` : ""}
      </div>`;
      })
      .join("");
    if (
      entries.some(function (e) {
        return e.status === "failed";
      })
    ) {
      host.insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="admin-mini-btn" onclick="studioRetryAllFailed('${esc(containerId)}')">Retry all failed</button>`,
      );
    }
  }

  function studioUpdateEntry(entry) {
    studioRenderUploadList(entry.containerId);
  }

  async function studioStoreImageFile(file, onProgress) {
    if (!file) throw new Error("No image was selected.");
    var sessionResult = await sb.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session || !session.access_token)
      throw new Error("Sign in with an admin account before uploading photos.");
    var ext =
      ((file.name || "").split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 5) || "jpg";
    var path =
      "dest_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9) + "." + ext;
    var baseUrl = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : (sb && sb.supabaseUrl) || "";
    var publicUrl = model.storagePublicUrl(baseUrl, "destination-images", path);
    if (!publicUrl) throw new Error("Supabase Storage is not configured.");
    // Uploads use /object/<bucket>/<path>; /object/public/... is read-only.
    var uploadUrl =
      baseUrl.replace(/\/+$/, "") +
      "/storage/v1/object/destination-images/" +
      encodeURIComponent(path);
    var apiKey =
      typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : (sb && sb.supabaseKey) || "";
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("apikey", apiKey);
      xhr.setRequestHeader("Authorization", "Bearer " + session.access_token);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("cache-control", "3600");
      xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
      if (xhr.upload) {
        xhr.upload.onprogress = function (event) {
          if (event.lengthComputable)
            onProgress(Math.min(95, Math.round(8 + (event.loaded / event.total) * 87)));
        };
      }
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(publicUrl);
          return;
        }
        var message = "Upload failed (HTTP " + xhr.status + ").";
        try {
          var body = JSON.parse(xhr.responseText || "{}");
          if (body.message || body.error) message = body.message || body.error;
        } catch (_) {
          /* keep status message */
        }
        reject(new Error(message));
      };
      xhr.onerror = function () {
        reject(new Error("Network error during upload. Check the connection and retry."));
      };
      xhr.onabort = function () {
        reject(new Error("Upload was cancelled."));
      };
      xhr.send(file);
    });
  }

  async function studioUploadOne(entry, options) {
    var opts = options || entry.options || {};
    entry.options = opts;
    // If the bytes are already in Storage, retry only the failed attachment.
    if (entry.url && typeof opts.onSuccess === "function") {
      try {
        await opts.onSuccess(entry.url, entry.file, entry);
        entry.status = "success";
        entry.progress = 100;
        entry.error = "";
      } catch (err) {
        entry.status = "failed";
        entry.error = err && err.message ? err.message : String(err);
      }
      studioUpdateEntry(entry);
      return;
    }
    entry.status = "optimizing";
    entry.progress = 8;
    entry.error = "";
    studioUpdateEntry(entry);
    try {
      var check = model.validateImage(entry.file);
      if (!check.ok) throw new Error(check.error);
      var optimized = entry.file;
      if (/heic|heif/i.test(entry.file.type || entry.file.name || "")) {
        try {
          if (typeof createImageBitmap === "function") {
            var bitmap = await createImageBitmap(entry.file);
            if (bitmap.close) bitmap.close();
          }
        } catch (_) {
          throw new Error("This browser cannot read that HEIC photo. Choose JPG or PNG instead.");
        }
      }
      if (typeof window.mediaShrinkImage === "function")
        optimized = await window.mediaShrinkImage(entry.file);
      entry.status = "uploading";
      entry.progress = 18;
      studioUpdateEntry(entry);
      var url = await studioStoreImageFile(optimized, function (p) {
        entry.progress = p;
        studioUpdateEntry(entry);
      });
      entry.url = url;
      if (opts.addToGallery) {
        __mediaGallery.push(url);
        window.mediaRefreshGrid(entry.containerId);
        adminUpdatePreview();
        markDirty();
      }
      if (typeof opts.onSuccess === "function") await opts.onSuccess(url, entry.file, entry);
      entry.status = "success";
      entry.progress = 100;
      entry.url = url;
      live((entry.file.name || "Photo") + " uploaded to Supabase Storage.");
    } catch (err) {
      entry.status = "failed";
      entry.error = err && err.message ? err.message : String(err);
    }
    studioUpdateEntry(entry);
  }

  async function studioUploadFiles(files, containerId, options) {
    if (!window.adminRequireWrite()) return;
    var list = Array.from(files || []);
    if (!list.length) return;
    containerId = containerId || studioMediaContainer || "adf";
    var opts = options || { addToGallery: true };
    var created = list.map(function (file) {
      return {
        id: ++studioUploadSeq,
        file: file,
        containerId: containerId,
        status: "queued",
        progress: 0,
        error: "",
        message: "",
        url: "",
        options: opts,
      };
    });
    studioUploadEntries = studioUploadEntries.concat(created);
    studioRenderUploadList(containerId);
    var queue = created.slice();
    var worker = async function () {
      while (queue.length) await studioUploadOne(queue.shift(), opts);
    };
    await Promise.all([worker(), worker()]);
    var failed = created.filter(function (e) {
      return e.status === "failed";
    }).length;
    var success = created.length - failed;
    live(
      success +
        " photo" +
        (success === 1 ? "" : "s") +
        " uploaded" +
        (failed ? ", " + failed + " failed" : "") +
        ".",
    );
    if (failed)
      showNotice(failed + " photo(s) failed. Use Retry next to each failed item.", "error");
    if (success && typeof opts.onComplete === "function") await opts.onComplete(success, created);
  }

  window.studioUploadFiles = studioUploadFiles;
  window.studioRetryUpload = function (id) {
    var entry = studioUploadEntries.find(function (e) {
      return e.id === Number(id);
    });
    if (!entry) return;
    studioUploadOne(entry, entry.options).then(function () {
      if (entry.status === "success" && entry.containerId === "adminPhotoLibrary")
        adminLoadPhotoLibrary();
      if (
        entry.status === "success" &&
        entry.options &&
        typeof entry.options.onComplete === "function"
      ) {
        entry.options.onComplete(1, [entry]);
      }
    });
  };
  window.studioRemoveUpload = function (id) {
    studioUploadEntries = studioUploadEntries.filter(function (e) {
      return e.id !== Number(id);
    });
    studioRenderUploadList(studioMediaContainer);
    studioRenderUploadList("adminPhotoLibrary");
  };
  window.studioRetryAllFailed = function (containerId) {
    studioUploadEntries
      .filter(function (e) {
        return e.containerId === containerId && e.status === "failed";
      })
      .forEach(function (e) {
        window.studioRetryUpload(e.id);
      });
  };

  // The original app.js paste listener calls mediaUploadFiles(). Neutralize it
  // when focus is inside text so pasted URLs/text are never hijacked.
  document.addEventListener(
    "paste",
    function (event) {
      var target = event.target;
      if (target && target.closest && target.closest("input, textarea, [contenteditable='true']")) {
        if (typeof __mediaActiveContainer !== "undefined") __mediaActiveContainer = "";
      }
    },
    true,
  );

  /* ───────────────────── PHOTOS LIBRARY ───────────────────── */

  function adminRenderPhotos() {
    studioMediaContainer = "adminPhotoLibrary";
    __mediaActiveContainer = "adminPhotoLibrary";
    var body = document.getElementById("adminBody");
    if (!body) return;
    body.innerHTML = `
      <section class="admin-home-hero">
        <div class="admin-home-eyebrow">Supabase Storage · destination-images</div>
        <h2>Photos from the team’s devices</h2>
        <p>Upload once, then attach a real public Storage URL to one or more places. Existing place photos are preserved unless you explicitly set a new cover.</p>
      </section>
      <section class="admin-card" style="margin-bottom:14px">
        <div class="admin-card-head"><h3>Upload photos</h3><span class="admin-kicker">JPG · PNG · WebP · GIF · AVIF · HEIC · max 15 MB</span></div>
        <div class="admin-dropzone" id="adminPhotoDropzone" ondragover="event.preventDefault();this.classList.add('is-drag')" ondragleave="this.classList.remove('is-drag')" ondrop="adminPhotoDrop(event)">
          <label class="admin-photo-add">
            <input type="file" id="adminPhotoLibraryLibraryInput" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif" multiple onchange="adminPhotoChoose(this)" hidden>
            ${icon("images", 22)}<span>Choose from library</span><small>Multiple photos supported on phone and desktop</small>
          </label>
          <label class="admin-photo-add">
            <input type="file" id="adminPhotoLibraryCameraInput" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onchange="adminPhotoChoose(this)" hidden>
            ${icon("camera", 22)}<span>Take a photo</span><small>Opens the device camera where supported</small>
          </label>
        </div>
        <div class="admin-upload-list" id="adminPhotoLibraryUploadList" aria-live="polite"></div>
        <div class="admin-hint">Desktop users can drag files onto the area above. Paste is accepted only when focus is outside a text field, so normal form editing is never interrupted.</div>
      </section>
      <section class="admin-card">
        <div class="admin-card-head"><h3>Site photos</h3><span class="admin-kicker" id="adminPhotoCount">Loading…</span></div>
        <div class="admin-field"><label for="adminPhotoSearch">Filter by filename</label><input id="adminPhotoSearch" type="search" value="${esc(studioPhotoSearch)}" placeholder="e.g. long_beach" oninput="adminFilterPhotos(this.value)"></div>
        <div id="adminPhotoError"></div>
        <div id="adminPhotoGrid" class="admin-photo-library-grid"><div class="admin-skeleton"></div><div class="admin-skeleton"></div><div class="admin-skeleton"></div></div>
      </section>`;
    studioRenderUploadList("adminPhotoLibrary");
    adminLoadPhotoLibrary();
  }
  window.adminRenderPhotos = adminRenderPhotos;

  async function adminLoadPhotoLibrary() {
    var grid = document.getElementById("adminPhotoGrid");
    if (!grid) return;
    studioPhotoBusy = true;
    var result = await sb.storage
      .from("destination-images")
      .list("", { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    studioPhotoBusy = false;
    if (result.error) {
      studioPhotoError = "Could not load photos: " + result.error.message;
      studioPhotoFiles = [];
    } else {
      studioPhotoError = "";
      studioPhotoFiles = (result.data || [])
        .filter(function (f) {
          return f && f.name && f.id;
        })
        .map(function (f) {
          var publicData = sb.storage.from("destination-images").getPublicUrl(f.name);
          return {
            name: f.name,
            size: f.metadata && f.metadata.size ? Number(f.metadata.size) : null,
            createdAt: f.created_at || f.updated_at || "",
            url: publicData && publicData.data ? publicData.data.publicUrl : "",
          };
        });
    }
    adminRenderPhotoCards();
  }
  window.adminLoadPhotoLibrary = adminLoadPhotoLibrary;

  function adminPhotoUsage() {
    var usage = new Map();
    allPlaces().forEach(function (p) {
      [].concat(p.image || [], Array.isArray(p.images) ? p.images : []).forEach(function (url) {
        if (!url) return;
        var key = String(url);
        if (!usage.has(key)) usage.set(key, []);
        usage.get(key).push(p.name || "Untitled place");
      });
    });
    return usage;
  }

  function adminRenderPhotoCards() {
    var grid = document.getElementById("adminPhotoGrid");
    if (!grid) return;
    var error = document.getElementById("adminPhotoError");
    if (error)
      error.innerHTML = studioPhotoError
        ? `<div class="admin-notice error">${esc(studioPhotoError)}</div>`
        : "";
    var count = document.getElementById("adminPhotoCount");
    if (count)
      count.textContent =
        studioPhotoFiles.length + " file" + (studioPhotoFiles.length === 1 ? "" : "s");
    var q = model.normalize(studioPhotoSearch);
    var files = studioPhotoFiles.filter(function (f) {
      return !q || model.normalize(f.name).includes(q);
    });
    if (!files.length) {
      grid.innerHTML =
        '<div class="admin-notice">No photos match. Upload one from the device above.</div>';
      return;
    }
    var usage = adminPhotoUsage();
    var places = allPlaces()
      .slice()
      .sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    grid.innerHTML = files
      .map(function (f) {
        var index = studioPhotoFiles.indexOf(f);
        var usedBy = usage.get(f.url) || [];
        var options = places
          .map(function (p) {
            return `<option value="${Number(p.id)}">${esc(p.name || "Untitled place")}</option>`;
          })
          .join("");
        return `<div class="admin-library-card">
        <img class="admin-library-thumb" src="${esc(safeUrl(f.url))}" alt="" loading="lazy">
        <div class="admin-library-body">
          <strong>${esc(f.name)}</strong>
          <small>${esc(model.formatBytes(f.size))} · ${esc(model.formatDate(f.createdAt))}</small>
          <small style="color:${usedBy.length ? "var(--admin-accent)" : "var(--admin-muted)"}">${usedBy.length ? "Used by: " + esc(usedBy.join(", ")) : "Not attached to a place"}</small>
          <div class="admin-library-actions">
            <select id="adminPhotoPlace-${index}" aria-label="Choose a place for ${esc(f.name)}"><option value="">Choose a place…</option>${options}</select>
            <button type="button" onclick="adminAttachPhoto(${index},'cover')">Set as cover</button>
            <button type="button" onclick="adminAttachPhoto(${index},'gallery')">Add to gallery</button>
            <button type="button" class="danger" style="grid-column:1/-1;color:var(--admin-danger)" onclick="adminDeletePhoto(${index})">Delete unused file</button>
          </div>
        </div>
      </div>`;
      })
      .join("");
  }

  window.adminFilterPhotos = function (value) {
    studioPhotoSearch = String(value || "");
    adminRenderPhotoCards();
    var input = document.getElementById("adminPhotoSearch");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  window.adminPhotoChoose = function (input) {
    var files = input && input.files ? Array.from(input.files) : [];
    if (files.length)
      studioUploadFiles(files, "adminPhotoLibrary", {
        addToGallery: false,
        onComplete: function () {
          adminLoadPhotoLibrary();
        },
      });
    if (input) input.value = "";
  };

  window.adminPhotoDrop = function (event) {
    event.preventDefault();
    if (event.currentTarget) event.currentTarget.classList.remove("is-drag");
    var files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length)
      studioUploadFiles(files, "adminPhotoLibrary", {
        addToGallery: false,
        onComplete: function () {
          adminLoadPhotoLibrary();
        },
      });
  };

  window.adminAttachPhoto = async function (index, mode) {
    if (!window.adminRequireWrite()) return;
    var file = studioPhotoFiles[index];
    var select = document.getElementById("adminPhotoPlace-" + index);
    var placeId = select && select.value;
    if (!file || !placeId) {
      showNotice("Choose a place before attaching this photo.", "warning");
      return;
    }
    var place = allPlaces().find(function (p) {
      return String(p.id) === String(placeId);
    });
    if (!place) {
      showNotice("That place no longer exists. Refresh and try again.", "error");
      return;
    }
    var gallery = Array.isArray(place.images) ? place.images.slice() : [];
    var patch;
    if (mode === "cover") patch = { image: file.url };
    else {
      if (gallery.indexOf(file.url) < 0) gallery.push(file.url);
      patch = { images: gallery };
      if (!place.image) patch.image = file.url;
    }
    var result = await sb.from("destinations").update(patch).eq("id", place.id);
    if (result.error) {
      showNotice("Could not attach photo: " + result.error.message, "error");
      return;
    }
    recordActivity("photo attached", place.name || "Untitled place", place.id);
    await window.loadDataFromSupabase();
    if (typeof rebuildMarkers === "function") rebuildMarkers();
    showNotice(file.name + " attached to " + (place.name || "place") + ".", "success");
    adminLoadPhotoLibrary();
  };

  window.adminDeletePhoto = async function (index) {
    if (!window.adminRequireWrite()) return;
    var file = studioPhotoFiles[index];
    if (!file) return;
    var usage = adminPhotoUsage();
    if ((usage.get(file.url) || []).length) {
      showNotice(
        "This photo is used by a place. Set a different cover or remove it from the listing first.",
        "warning",
      );
      return;
    }
    if (
      !window.confirm(
        "Permanently delete " + file.name + " from Supabase Storage? This cannot be undone.",
      )
    )
      return;
    var result = await sb.storage.from("destination-images").remove([file.name]);
    if (result.error) {
      showNotice("Delete failed: " + result.error.message, "error");
      return;
    }
    showNotice(file.name + " deleted from Storage.", "success");
    adminLoadPhotoLibrary();
  };

  /* Quick-photo completions need a visible success/failure signal. */
  var originalQuickComplete = adminQuickPhotoUploadFiles;
  window.adminQuickPhotoUploadFiles = originalQuickComplete;

  /* Expose helpers used by legacy inline markup. */
  window.adminShowNotice = showNotice;
  window.adminSyncViewport = syncViewport;
  window.adminMarkDirty = markDirty;
  /* Keep the dedicated Categories screen in place after legacy CRUD actions. */
  var originalNewCat = window.adminNewDestCat;
  var originalEditCat = window.adminEditDestCat;
  var originalSaveCat = window.adminSaveDestCat;
  var originalDeleteCat = window.adminDeleteDestCat;
  function refreshCategoriesIfActive() {
    if (adminTab === "categories") adminRenderCategories();
  }
  window.adminNewDestCat = function () {
    if (originalNewCat) originalNewCat();
    refreshCategoriesIfActive();
  };
  window.adminEditDestCat = function (key) {
    if (originalEditCat) originalEditCat(key);
    refreshCategoriesIfActive();
  };
  window.adminSaveDestCat = async function (key) {
    if (originalSaveCat) await originalSaveCat(key);
    refreshCategoriesIfActive();
  };
  window.adminDeleteDestCat = async function (key) {
    if (originalDeleteCat) await originalDeleteCat(key);
    refreshCategoriesIfActive();
  };
  window.adminSetAllCats = function (collapsed) {
    window.adminDestGroups(allPlaces()).forEach(function (g) {
      adminCollapsedCats[g.key] = !!collapsed;
    });
    window.renderAdminDest();
  };
})();
