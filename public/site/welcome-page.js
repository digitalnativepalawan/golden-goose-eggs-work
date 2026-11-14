// SANVIC editorial welcome page shown after the existing logo intro.
// This module deliberately leaves the original splash screen untouched.
(function () {
  "use strict";

  var CONFIG_KEY = "welcome_page";
  var DEFAULTS = {
    image: "assets/sanvic-welcome-coast.jpg",
    imageAlt: "Aerial view of San Vicente's beach, forest and mountains",
    eyebrow: "DISCOVER SAN VICENTE",
    title: "There is more to paradise than you imagine.",
    paragraph1:
      "Welcome to San Vicente, one of Palawan’s most beautiful and still largely undiscovered destinations.",
    paragraph2:
      "You may have heard of Port Barton, a charming seaside village famous for its island hopping, laid-back atmosphere and tropical charm. But Port Barton is only a small part of San Vicente.",
    highlight: "Travel north and discover an entirely different side of Palawan.",
    paragraph3:
      "Kilometers of unspoiled beaches, spectacular coastal viewpoints, fishing villages, tropical forests, hidden waterfalls and islands waiting to be explored.",
    paragraph4:
      "From the endless sands of Long Beach to the quieter shores of Alimanguan and beyond, San Vicente offers something increasingly rare: the freedom to discover paradise at your own pace.",
    button: "WELCOME IN SANVIC",
    footer: "PALAWAN",
  };
  var config = Object.assign({}, DEFAULTS);
  var isPreview = false;
  var loaded = false;
  var ready = null;

  function cleanConfig(value) {
    var next = Object.assign({}, DEFAULTS);
    if (!value || typeof value !== "object" || Array.isArray(value)) return next;
    Object.keys(DEFAULTS).forEach(function (key) {
      if (typeof value[key] === "string" && value[key].trim()) next[key] = value[key].trim();
    });
    return next;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function mount() {
    if (document.getElementById("sanvicEditorialWelcome")) return;
    var page = document.createElement("section");
    page.id = "sanvicEditorialWelcome";
    page.className = "sanvic-editorial-welcome";
    page.setAttribute("role", "dialog");
    page.setAttribute("aria-modal", "true");
    page.setAttribute("aria-labelledby", "sewTitle");
    page.setAttribute("aria-hidden", "true");
    page.innerHTML =
      '<div class="sew-page"><div class="sew-photo-wrap"><img class="sew-photo" id="sewPhoto" alt="" fetchpriority="high"></div>' +
      '<main class="sew-copy"><h1 class="sew-title" id="sewTitle"></h1><span class="sew-rule" aria-hidden="true"></span>' +
      '<div class="sew-eyebrow" id="sewEyebrow"></div><div class="sew-paragraphs" id="sewParagraphs"></div>' +
      '<span class="sew-rule sew-rule-bottom" aria-hidden="true"></span><button class="sew-enter" id="sewEnter" type="button"></button>' +
      '<div class="sew-footer" id="sewFooter"></div></main></div>';
    document.body.appendChild(page);
    var style = document.createElement("style");
    style.id = "sanvicEditorialWelcomeCss";
    style.textContent =
      '.sanvic-editorial-welcome{position:fixed;inset:0;z-index:10001;display:block;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#faf7f1;color:#112d49;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .32s ease,visibility .32s ease;font-family:var(--font-body,"DM Sans",Arial,sans-serif);user-select:text;-webkit-user-select:text}' +
      '.sanvic-editorial-welcome.open{opacity:1;visibility:visible;pointer-events:auto}body.sanvic-welcome-open{overflow:hidden!important}' +
      '.sew-page{width:100%;min-height:100%;margin:0 auto;background:#faf7f1}.sew-photo-wrap{height:clamp(240px,32vh,480px);overflow:hidden;border-radius:0 0 50% 50% / 0 0 8% 8%;background:#d9e1dd}.sew-photo{display:block;width:100%;height:100%;object-fit:cover;object-position:center 57%}' +
      '.sew-copy{max-width:660px;margin:0 auto;padding:24px 28px 42px}.sew-title{margin:0;color:#102c49;font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:clamp(2.4rem,8.2vw,3.5rem);line-height:.98;letter-spacing:-.035em}.sew-rule{display:block;width:64px;height:3px;margin:18px 0 22px;background:#c96543}.sew-eyebrow{margin-bottom:24px;color:#a9aab0;font-size:.68rem;font-weight:500;letter-spacing:.32em;line-height:1.4}.sew-paragraphs{display:grid;gap:20px}.sew-paragraphs p{margin:0;color:#213650;font-size:clamp(1rem,4.2vw,1.12rem);font-weight:400;line-height:1.45;letter-spacing:.002em}.sew-paragraphs p.sew-highlight{font-weight:700}.sew-rule-bottom{margin:24px auto 30px}.sew-enter{display:flex;align-items:center;justify-content:center;gap:14px;width:min(100%,500px);min-height:64px;margin:0 auto;border:0;border-radius:999px;background:#e76037;color:#fff;font:600 .88rem/1 var(--font-body,"DM Sans",Arial,sans-serif);letter-spacing:.24em;text-align:center;padding:12px 20px;cursor:pointer;box-shadow:0 4px 12px rgba(112,58,38,.12);-webkit-tap-highlight-color:transparent}.sew-enter:active{transform:scale(.99)}.sew-arrow{font-size:1.5rem;font-weight:300;letter-spacing:0}.sew-footer{margin-top:24px;color:#a3a8b1;font-size:.72rem;font-weight:500;letter-spacing:.36em;text-align:center}' +
      '@media(min-width:760px){.sew-page{max-width:900px;box-shadow:0 0 44px rgba(16,44,73,.08)}.sew-photo-wrap{height:min(48vh,480px)}.sew-copy{padding:32px 76px 52px}.sew-title{max-width:720px}.sew-paragraphs{gap:18px}}' +
      '@media(max-height:700px){.sew-photo-wrap{height:28vh;min-height:190px}.sew-copy{padding-top:18px}.sew-rule{margin-top:14px;margin-bottom:16px}.sew-eyebrow{margin-bottom:17px}.sew-paragraphs{gap:15px}.sew-paragraphs p{font-size:1rem}.sew-enter{min-height:54px}}' +
      '@media(prefers-reduced-motion:reduce){.sanvic-editorial-welcome{transition:none}}';
    document.head.appendChild(style);
    render();
    page.addEventListener("click", function (event) {
      if (event.target && event.target.closest("#sewEnter")) close();
    });
  }

  function render() {
    var page = document.getElementById("sanvicEditorialWelcome");
    if (!page) return;
    var image = document.getElementById("sewPhoto");
    image.src = config.image;
    image.alt = config.imageAlt;
    document.getElementById("sewTitle").textContent = config.title;
    document.getElementById("sewEyebrow").textContent = config.eyebrow;
    document.getElementById("sewParagraphs").innerHTML =
      "<p>" + esc(config.paragraph1) + "</p><p>" + esc(config.paragraph2) + "</p><p class=\"sew-highlight\">" + esc(config.highlight) + "</p><p>" + esc(config.paragraph3) + "</p><p>" + esc(config.paragraph4) + "</p>";
    document.getElementById("sewEnter").innerHTML = esc(config.button) + ' <span class="sew-arrow" aria-hidden="true">→</span>';
    document.getElementById("sewFooter").textContent = config.footer;
  }

  async function load() {
    if (loaded) return config;
    if (ready) return ready;
    ready = (async function () {
      try {
        if (typeof sb !== "undefined" && sb && sb.from) {
          var result = await sb.from("site_settings").select("value").eq("key", CONFIG_KEY).maybeSingle();
          if (!result.error && result.data && result.data.value) {
            var saved = typeof result.data.value === "string" ? JSON.parse(result.data.value) : result.data.value;
            config = cleanConfig(saved);
          }
        }
      } catch (_) {
        // The page still renders its bundled copy if settings cannot be read.
      }
      loaded = true;
      render();
      return config;
    })();
    return ready;
  }

  function open(preview) {
    isPreview = !!preview;
    mount();
    render();
    var page = document.getElementById("sanvicEditorialWelcome");
    page.scrollTop = 0;
    page.setAttribute("aria-hidden", "false");
    page.classList.add("open");
    document.body.classList.add("sanvic-welcome-open");
    var enter = document.getElementById("sewEnter");
    if (enter) enter.focus({ preventScroll: true });
    if (!isPreview) window.SANVIC_WELCOME_OPEN = true;
  }

  function close() {
    var page = document.getElementById("sanvicEditorialWelcome");
    if (page) {
      page.classList.remove("open");
      page.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("sanvic-welcome-open");
    if (!isPreview) window.SANVIC_WELCOME_OPEN = false;
    isPreview = false;
  }

  window.SanvicWelcomePage = {
    defaults: Object.assign({}, DEFAULTS),
    getConfig: function () { return Object.assign({}, config); },
    setConfig: function (next) { config = cleanConfig(next); loaded = true; render(); return Object.assign({}, config); },
    load: load,
    preview: function (next) { if (next) config = cleanConfig(next); open(true); },
    close: close,
  };

  mount();
  load();
  window.addEventListener("load", function () {
    var params = new URLSearchParams(window.location.search);
    var preview = params.get("welcome") === "1";
    var splashMs = Number(window.SANVIC_SPLASH_HOLD) || 4500;
    setTimeout(function () {
      // Never hold up entry on a network read: show the bundled page at once,
      // then let a saved admin version replace it whenever settings arrive.
      open(preview);
      load();
    }, splashMs + 180);
  });
})();
