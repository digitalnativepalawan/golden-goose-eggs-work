/* Shared pure directory rules. No database, DOM or second content store. */
(function (root) {
  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  const hasCoordinates = (d) =>
    d.lat !== null &&
    d.lng !== null &&
    String(d.lat).trim() !== "" &&
    String(d.lng).trim() !== "" &&
    Number.isFinite(Number(d.lat)) &&
    Number.isFinite(Number(d.lng)) &&
    Math.abs(Number(d.lat)) <= 90 &&
    Math.abs(Number(d.lng)) <= 180;
  function safeUrl(value, local = false) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (local && /^(?:assets\/|\/site\/assets\/)/.test(raw) && !raw.includes("..")) return raw;
    try {
      const u = new URL(raw);
      return ["https:", "http:"].includes(u.protocol) ? u.href : "";
    } catch (e) {
      return "";
    }
  }

  // ── READING A REQUEST, NOT A NAME ───────────────────────────────────────
  // The search used to demand that every word appear literally, so "best sunset
  // spots" could never match anything: no place is called "best". It now drops
  // the words that carry no place meaning, and understands the words that do.
  const STOPWORDS = new Set([
    "best",
    "good",
    "great",
    "nice",
    "top",
    "the",
    "a",
    "an",
    "and",
    "or",
    "for",
    "in",
    "on",
    "at",
    "near",
    "around",
    "me",
    "my",
    "i",
    "some",
    "any",
    "where",
    "what",
    "which",
    "with",
    "to",
    "of",
    "is",
    "are",
    "be",
    "it",
    "that",
    "this",
    "spots",
    "spot",
    "place",
    "places",
    "thing",
    "things",
    "do",
    "see",
    "visit",
    "going",
    "go",
    "show",
    "find",
    "looking",
    "want",
    "like",
    "there",
    "here",
    "you",
    "your",
    "can",
    "get",
  ]);
  const SYNONYMS = {
    sunset: ["sunset", "dusk", "sundown", "evening", "golden", "west"],
    sunrise: ["sunrise", "dawn", "morning", "east"],
    quiet: ["quiet", "calm", "peaceful", "secluded", "relaxing", "slow", "chill", "calm"],
    beach: ["beach", "shore", "sand", "seaside", "coast", "coastline"],
    swim: ["swim", "swimming", "swimmable"],
    snorkel: ["snorkel", "snorkelling", "snorkeling", "reef", "coral"],
    dive: ["dive", "diving", "scuba"],
    island: ["island", "islands", "hopping", "sandbar", "boat"],
    waterfall: ["waterfall", "falls", "cascade"],
    hike: ["hike", "hiking", "trek", "trekking", "trail", "walk", "walking", "jungle", "forest"],
    surf: ["surf", "surfing", "waves", "swell", "board"],
    food: [
      "food",
      "eat",
      "eating",
      "restaurant",
      "dinner",
      "lunch",
      "menu",
      "dish",
      "dishes",
      "seafood",
      "grill",
      "kitchen",
    ],
    drink: ["drink", "drinks", "bar", "cocktail", "cocktails", "beer", "wine"],
    coffee: ["coffee", "cafe", "espresso", "breakfast"],
    night: ["nightlife", "night", "party", "music", "live"],
    cheap: ["cheap", "budget", "affordable", "value", "inexpensive", "economical"],
    luxury: ["luxury", "premium", "upscale", "elegant"],
    family: ["family", "families", "kids", "children", "child", "toddler"],
    romantic: ["romantic", "couple", "couples", "honeymoon", "private", "intimate"],
    hidden: ["hidden", "secret", "unknown", "undeveloped", "remote", "untouched", "wild", "quiet"],
    view: [
      "view",
      "viewpoint",
      "photo",
      "photography",
      "scenic",
      "panorama",
      "lookout",
      "viewpoints",
    ],
    market: ["market", "shop", "shopping", "souvenir", "store", "stalls"],
    service: ["service", "services", "laundry", "rental", "rentals", "atm", "money", "repair"],
    boat: ["boat", "ferry", "transfer", "port", "pier", "crossing"],
    stay: [
      "stay",
      "stays",
      "hotel",
      "hostel",
      "resort",
      "room",
      "rooms",
      "accommodation",
      "lodge",
      "guesthouse",
      "villa",
      "cottage",
    ],
    village: ["village", "town", "poblacion", "community", "barangay"],
    mangrove: ["mangrove", "mangroves", "river", "estuary"],
    camping: ["camp", "camping", "tent"],
    spring: ["spring", "springs", "freshwater"],
    birthday: ["family", "party", "celebration"],
    group: ["group", "groups", "friends", "friends"],
    accessible: ["accessible", "wheelchair", "elderly", "easy"],
  };
  const DIRECT = (() => {
    const map = {};
    for (const [key, list] of Object.entries(SYNONYMS)) {
      for (const word of list) {
        if (!map[word]) map[word] = new Set();
        map[word].add(key);
        list.forEach((w) => map[word].add(w));
      }
    }
    return map;
  })();
  function expand(term) {
    const set = new Set([term]);
    const extra = DIRECT[term];
    if (extra) extra.forEach((t) => set.add(t));
    return [...set];
  }
  // The words worth scoring on, in the order a visitor typed them.
  function queryTerms(query) {
    return normalize(query)
      .split(/[^a-z0-9]+/)
      .filter((t) => t && t.length > 1 && !STOPWORDS.has(t));
  }
  // ── WORDS, NOT LETTERS ──────────────────────────────────────────────────
  // Matching used to be substring, so searching "drinks" widened to "bar" and
  // then hit every "Barton" and every "barangay". Fields are compared word by
  // word instead: a variant has to be a whole word, or be at least four letters
  // and sit at the start of a word. That keeps "waterf" finding "Waterfall"
  // while "port" no longer finds "Support" or "Airport".
  const words = (value) =>
    normalize(value)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  function wordHit(list, variant) {
    for (const word of list) {
      if (word === variant) return true;
      if (variant.length >= 4 && word.indexOf(variant) === 0) return true;
    }
    return false;
  }
  // A place is scored by where the words land: its own name is the strongest
  // signal, then its category, then where it is, then what is written about it.
  // A word the visitor actually typed outranks a synonym that was only guessed
  // at, so "waterfall" puts the place named Waterfall above Pamuayan Falls.
  const SYNONYM_WEIGHT = 0.6;
  function score(place, terms, categories) {
    if (!terms || !terms.length) return 0;
    const name = words(place.name);
    const cat = words(
      (categories && categories[place.category] && categories[place.category].label) ||
        place.category,
    );
    const where = words(place.barangay);
    const tip = words(place.tip);
    const desc = words(place.description);
    let total = 0;
    for (const term of terms) {
      let best = 0;
      for (const variant of expand(term)) {
        const w = variant === term ? 1 : SYNONYM_WEIGHT;
        if (wordHit(name, variant)) best = Math.max(best, 6 * w);
        else if (wordHit(cat, variant)) best = Math.max(best, 4 * w);
        else if (wordHit(where, variant)) best = Math.max(best, 3 * w);
        else if (wordHit(tip, variant)) best = Math.max(best, 2.5 * w);
        else if (wordHit(desc, variant)) best = Math.max(best, 1.5 * w);
      }
      total += best;
    }
    return total;
  }
  function filter(places, state, categories) {
    const terms = queryTerms(state.query);
    return places.filter((d) => {
      if (state.category !== "all" && d.category !== state.category) return false;
      if (state.area && normalize(d.barangay) !== normalize(state.area)) return false;
      if (!terms.length) return true;
      return score(d, terms, categories) > 0;
    });
  }
  function distanceKm(a, b) {
    const rad = Math.PI / 180,
      lat = (b.lat - a.lat) * rad,
      lng = (b.lng - a.lng) * rad;
    const h =
      Math.sin(lat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(lng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  root.SanvicExplore = {
    normalize,
    hasCoordinates,
    safeUrl,
    filter,
    distanceKm,
    score,
    queryTerms,
    expand,
  };
})(typeof window === "undefined" ? globalThis : window);
