/* Shared, pure rules for the SANVIC Backoffice.
 * No DOM, Supabase or network access: this module is deliberately testable and
 * is used by both the dashboard and the place editor. */
(function (root) {
  "use strict";

  var STATUSES = ["draft", "published", "archived"];
  var MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  var ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/heic",
    "image/heif",
    "image/bmp",
  ];
  var ALLOWED_IMAGE_EXTENSIONS = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "avif",
    "heic",
    "heif",
    "bmp",
  ];
  var SAN_VICENTE_BOUNDS = {
    minLat: 10.25,
    maxLat: 10.78,
    minLng: 118.95,
    maxLng: 119.45,
  };

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalize(value) {
    return text(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function statusOf(value) {
    var status = normalize(value);
    return STATUSES.indexOf(status) >= 0 ? status : "published";
  }

  function isPublished(place) {
    return !!place && statusOf(place.status) === "published";
  }

  function publicPlaces(places) {
    return (places || []).filter(isPublished);
  }

  function timestamp(value) {
    var ms = value ? new Date(value).getTime() : 0;
    return Number.isFinite(ms) ? ms : 0;
  }

  function parseCoordinate(value) {
    var raw = text(value);
    if (!raw) return null;
    var n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  function coordinates(draft) {
    var latRaw = draft && draft.lat;
    var lngRaw = draft && draft.lng;
    var hasLat = text(latRaw) !== "";
    var hasLng = text(lngRaw) !== "";
    var lat = hasLat ? parseCoordinate(latRaw) : null;
    var lng = hasLng ? parseCoordinate(lngRaw) : null;
    var finite = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
    var globalValid = finite && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    var inArea =
      globalValid &&
      lat >= SAN_VICENTE_BOUNDS.minLat &&
      lat <= SAN_VICENTE_BOUNDS.maxLat &&
      lng >= SAN_VICENTE_BOUNDS.minLng &&
      lng <= SAN_VICENTE_BOUNDS.maxLng;
    return {
      lat: lat,
      lng: lng,
      missing: !hasLat || !hasLng,
      finite: finite,
      valid: globalValid,
      inArea: inArea,
    };
  }

  function hasCoordinates(place) {
    return coordinates(place).valid;
  }

  function markerVisibility(category, label) {
    var source = normalize(category) + " " + normalize(label);
    if (/beach|island|coast/.test(source)) {
      return { zoom: 13, text: "Visible when visitors zoom to level 13 or closer." };
    }
    if (
      /stay|accommodation|hotel|resort|lodge|food|restaurant|resto|dining|cafe|bar/.test(source)
    ) {
      return { zoom: 14, text: "Visible when visitors zoom to level 14 or closer." };
    }
    return { zoom: 15, text: "Visible when visitors zoom to level 15 or closer." };
  }

  function coverOf(place) {
    if (!place) return "";
    var cover = text(place.cover);
    if (cover) return cover;
    if (text(place.image)) return text(place.image);
    return Array.isArray(place.images) && place.images.length ? text(place.images[0]) : "";
  }

  function issueList(place, options) {
    var opts = options || {};
    var issues = [];
    if (!text(place && place.name)) issues.push("name");
    if (!hasCoordinates(place)) issues.push("map pin");
    if (!text(place && place.category)) issues.push("category");
    if (!text(place && place.barangay)) issues.push("barangay");
    if (!text(place && place.description)) issues.push("description");
    var dead =
      opts.deadCovers && place && place.id != null ? opts.deadCovers.has(String(place.id)) : false;
    if (!coverOf(place) || dead) issues.push("cover photo");
    return issues;
  }

  function validatePlace(draft, options) {
    var opts = options || {};
    var mode = opts.mode === "draft" ? "draft" : "publish";
    var d = draft || {};
    var errors = {};
    var warnings = {};
    var c = coordinates(d);

    if (!text(d.name)) errors.name = "Add the public place name.";
    if (!text(d.category)) errors.category = "Choose a category.";
    if (c.missing) {
      if (mode === "publish")
        errors.coordinates = "Set a valid latitude and longitude, or drag the pin on the map.";
    } else if (!c.valid) {
      errors.coordinates =
        "Use decimal coordinates between -90/90 latitude and -180/180 longitude.";
    } else if (!c.inArea) {
      warnings.coordinates =
        "This pin is outside the usual San Vicente map area. Check it before publishing.";
    }

    if (mode === "publish") {
      if (!text(d.barangay)) errors.barangay = "Add the barangay or area.";
      if (!text(d.description)) errors.description = "Describe what visitors will find there.";
      if (!coverOf(d)) errors.cover = "Add at least one photo for the public listing.";
      if (text(d.color) && !/^#[0-9a-f]{6}$/i.test(text(d.color))) {
        errors.color = "Use a six-digit hex colour such as #0EA5E9.";
      }
      if (d.gallery && Array.isArray(d.gallery)) {
        var unsafe = d.gallery.some(function (url) {
          return !safeImageUrl(url);
        });
        if (unsafe) errors.gallery = "One or more photo links is not a valid public image URL.";
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
      warnings: warnings,
      coordinates: c,
    };
  }

  function validateImage(file) {
    if (!file) return { ok: false, error: "No image was selected." };
    var name = text(file.name);
    var type = normalize(file.type);
    var ext = name.indexOf(".") >= 0 ? normalize(name.split(".").pop()) : "";
    var size = Number(file.size);
    if (type === "image/svg+xml" || ext === "svg") {
      return {
        ok: false,
        error: "SVG images are not allowed. Choose a JPG, PNG, WebP, GIF, AVIF or HEIC photo.",
      };
    }
    if (
      type
        ? type.indexOf("image/") !== 0 || ALLOWED_IMAGE_TYPES.indexOf(type) < 0
        : ALLOWED_IMAGE_EXTENSIONS.indexOf(ext) < 0
    ) {
      return { ok: false, error: "Choose a JPG, PNG, WebP, GIF, AVIF, HEIC or BMP image." };
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Choose an image smaller than 15 MB." };
    }
    return { ok: true, error: "", type: type, extension: ext };
  }

  function safeImageUrl(value) {
    var raw = text(value);
    if (!raw) return "";
    if (/^(?:assets\/|\/site\/assets\/)/.test(raw) && raw.indexOf("..") < 0) return raw;
    try {
      var url = new URL(raw);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function storagePublicUrl(baseUrl, bucket, path) {
    var base = text(baseUrl).replace(/\/+$/, "");
    var name = text(bucket);
    var parts = text(path).split("/").filter(Boolean).map(encodeURIComponent);
    if (!base || !name || !parts.length) return "";
    return base + "/storage/v1/object/public/" + encodeURIComponent(name) + "/" + parts.join("/");
  }

  function categoryLabel(place, categories) {
    if (!place) return "";
    var c = categories && categories[place.category];
    return c ? text(c.label || place.category) : text(place.category);
  }

  function matchesQuery(place, query, categories) {
    var terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    var haystack = normalize(
      [
        place && place.name,
        place && place.category,
        categoryLabel(place, categories),
        place && place.barangay,
        place && place.description,
        place && place.tip,
      ].join(" "),
    );
    return terms.every(function (term) {
      return haystack.indexOf(term) >= 0;
    });
  }

  function filterAndSortPlaces(places, options) {
    var opts = options || {};
    var list = (places || []).slice();
    list = list.filter(function (place) {
      if (opts.status && opts.status !== "all" && statusOf(place.status) !== opts.status)
        return false;
      if (opts.category && opts.category !== "all" && place.category !== opts.category)
        return false;
      if (opts.area && opts.area !== "all" && normalize(place.barangay) !== normalize(opts.area))
        return false;
      if (opts.issuesOnly && issueList(place, { deadCovers: opts.deadCovers }).length === 0)
        return false;
      return matchesQuery(place, opts.query, opts.categories);
    });
    var sort = opts.sort || "updated_desc";
    var issueCount = function (p) {
      return issueList(p, { deadCovers: opts.deadCovers }).length;
    };
    list.sort(function (a, b) {
      if (sort === "name_asc")
        return text(a.name).localeCompare(text(b.name), "en", {
          sensitivity: "base",
          numeric: true,
        });
      if (sort === "name_desc")
        return text(b.name).localeCompare(text(a.name), "en", {
          sensitivity: "base",
          numeric: true,
        });
      if (sort === "issues")
        return issueCount(b) - issueCount(a) || text(a.name).localeCompare(text(b.name));
      if (sort === "status")
        return (
          STATUSES.indexOf(statusOf(a.status)) - STATUSES.indexOf(statusOf(b.status)) ||
          text(a.name).localeCompare(text(b.name))
        );
      if (sort === "created_desc") return timestamp(b.createdAt) - timestamp(a.createdAt);
      return (
        timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt) ||
        text(a.name).localeCompare(text(b.name))
      );
    });
    return list;
  }

  function contentStatus(places, extras) {
    var list = places || [];
    var other = extras || {};
    var status = {
      total: list.length,
      published: 0,
      drafts: 0,
      archived: 0,
      needsWork: 0,
      missingPin: 0,
      missingCover: 0,
      categories: count(other.categories),
      tribes: count(other.tribes),
      events: count(other.events),
      nearby: count(other.nearby),
      talaAnswers: count(other.talaAnswers),
    };
    list.forEach(function (place) {
      var key = statusOf(place.status);
      var countKey = key === "draft" ? "drafts" : key;
      status[countKey] += 1;
      var issues = issueList(place, { deadCovers: other.deadCovers });
      if (issues.length) status.needsWork += 1;
      if (issues.indexOf("map pin") >= 0) status.missingPin += 1;
      if (issues.indexOf("cover photo") >= 0) status.missingCover += 1;
    });
    return status;
  }

  function count(value) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return 0;
  }

  var CHANGE_FIELDS = [
    ["name", "Name"],
    ["category", "Category"],
    ["barangay", "Barangay"],
    ["description", "Description"],
    ["tip", "Visitor tip"],
    ["lat", "Latitude"],
    ["lng", "Longitude"],
    ["color", "Marker colour"],
    ["status", "Publishing status"],
    ["featured", "Featured"],
    ["cover", "Cover photo"],
    ["galleryCount", "Photo gallery"],
    ["contactCount", "Contacts"],
    ["linkCount", "Links"],
    ["amenityCount", "Facilities"],
  ];

  function canonicalField(place, key) {
    if (key === "cover") return coverOf(place);
    if (key === "galleryCount") {
      if (Array.isArray(place.gallery)) return place.gallery.length;
      if (Array.isArray(place.images)) return place.images.length;
      return place.galleryCount || 0;
    }
    if (key === "contactCount")
      return place.contactCount != null ? place.contactCount : count(place.contacts);
    if (key === "linkCount") return place.linkCount != null ? place.linkCount : count(place.links);
    if (key === "amenityCount")
      return place.amenityCount != null ? place.amenityCount : count(place.amenities);
    return place[key];
  }

  function changedFields(before, after) {
    var a = before || {};
    var b = after || {};
    return CHANGE_FIELDS.filter(function (pair) {
      var key = pair[0];
      return text(canonicalField(a, key)) !== text(canonicalField(b, key));
    }).map(function (pair) {
      return pair[1];
    });
  }

  function globalSearch(places, sections, query) {
    var q = normalize(query);
    if (!q) return { places: [], sections: [] };
    var placeHits = (places || [])
      .filter(function (p) {
        return (
          normalize(
            [p && p.name, p && p.barangay, p && p.category, p && p.description].join(" "),
          ).indexOf(q) >= 0
        );
      })
      .slice(0, 8);
    var sectionHits = (sections || [])
      .filter(function (s) {
        return normalize([s && s.label, s && s.help].join(" ")).indexOf(q) >= 0;
      })
      .slice(0, 8);
    return { places: placeHits, sections: sectionHits };
  }

  function formatBytes(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "—";
    if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
    return Math.round(n / 1024) + " KB";
  }

  function formatDate(value, now) {
    var then = timestamp(value);
    if (!then) return "Not yet saved";
    var current = now ? new Date(now).getTime() : Date.now();
    var diff = Math.max(0, current - then);
    if (diff < 60 * 1000) return "Just now";
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + " min ago";
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + " hr ago";
    if (diff < 7 * 24 * 60 * 60 * 1000) return Math.floor(diff / 86400000) + " days ago";
    try {
      return new Date(then).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (_) {
      return new Date(then).toISOString().slice(0, 10);
    }
  }

  var api = {
    STATUSES: STATUSES,
    MAX_IMAGE_BYTES: MAX_IMAGE_BYTES,
    SAN_VICENTE_BOUNDS: SAN_VICENTE_BOUNDS,
    statusOf: statusOf,
    isPublished: isPublished,
    publicPlaces: publicPlaces,
    coordinates: coordinates,
    hasCoordinates: hasCoordinates,
    markerVisibility: markerVisibility,
    issueList: issueList,
    validatePlace: validatePlace,
    validateImage: validateImage,
    safeImageUrl: safeImageUrl,
    storagePublicUrl: storagePublicUrl,
    filterAndSortPlaces: filterAndSortPlaces,
    contentStatus: contentStatus,
    changedFields: changedFields,
    globalSearch: globalSearch,
    formatBytes: formatBytes,
    formatDate: formatDate,
    normalize: normalize,
  };

  root.SanvicAdmin = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window === "undefined" ? globalThis : window);
