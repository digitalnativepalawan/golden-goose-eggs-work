// SANVIC Pulse demo fallback
// Uses admin-style local content only when Supabase has no Pulse rows yet.
(function(){
  const DEMO_POSTS = [
    { id:9001, cat:'island', name:'Local Guide – Jun', admin:true, time:'7m ago', text:'Two boats are looking for extra joiners tomorrow morning. Port Barton dock, ask for the blue boat.', location:'Port Barton', tag:'Island Hopping', likes:18, comments:4 },
    { id:9002, cat:'food', name:'Reyna', time:'14m ago', text:'Fresh grilled fish at the market tonight. Best time is before 7 before everything disappears.', location:'Poblacion Public Market', image:'assets/pulse/boodle-fight-fish.jpg', likes:27, comments:6 },
    { id:9003, cat:'hidden', name:'Maya', time:'22m ago', text:'Quiet tide pools past Bato ni Ningning today. Good light, almost nobody around.', location:'Bato ni Ningning', likes:21, comments:5 },
    { id:9004, cat:'surf', name:'Diego', time:'31m ago', text:'Small clean sets in Alimanguan. Beginner-friendly this morning, watch the current later.', location:'Alimanguan Beach', likes:15, comments:3 },
    { id:9005, cat:'events', name:'Beach Bar Co.', admin:true, time:'45m ago', text:'Acoustic set tonight near Long Beach. Come early if you want sunset seats.', location:'Long Beach', likes:24, comments:7 },
    { id:9006, cat:'island', name:'Tara', time:'1h ago', text:'Looking for two people to split a private boat to Inaladelan tomorrow. Chill pace, no rushing.', location:'Port Barton', image:'assets/pulse/island-boats-aerial.jpg', likes:13, comments:8 },
    { id:9007, cat:'food', name:'Alex', time:'1h ago', text:'Burger stall near the beach is open again. Perfect after swimming.', location:'Long Beach', likes:11, comments:2 },
    { id:9008, cat:'hidden', name:'Sophie', time:'2h ago', text:'Pamuayan Falls trail is muddy but worth it. Bring water and sandals you do not love too much.', location:'Pamuayan Falls', image:'assets/pulse/kayak-lagoon.jpg', likes:19, comments:4 }
  ];

  function demoForCategory(cat){
    if(!cat || cat === 'all') return DEMO_POSTS;
    return DEMO_POSTS.filter(p => p.cat === cat);
  }

  function emptyText(cat){
    if(cat === 'island') return 'No island posts yet. A boat plan usually starts with one message.';
    if(cat === 'food') return 'No food posts yet. Share what smells good nearby.';
    if(cat === 'hidden') return 'No hidden spots yet. Keep your eyes open.';
    if(cat === 'surf') return 'No surf notes yet. First one in the water can report back.';
    if(cat === 'events') return 'No events posted yet. Tonight is still young.';
    return 'No posts yet. Be the first to share something.';
  }

  function renderDemoPulse(){
    const body = document.getElementById('pulseBody');
    if(!body || typeof window.pulseCardHtml !== 'function') return false;
    const cat = window.pulseCategory || 'all';
    const posts = demoForCategory(cat);
    body.dataset.demoPulse = 'true';
    if(!posts.length){
      body.innerHTML = '<div class="pulse-empty">' + emptyText(cat) + '</div>';
      return true;
    }
    body.innerHTML = posts.map(window.pulseCardHtml).join('');
    return true;
  }

  function wrapPulseFeed(){
    if(typeof window.renderPulseFeed !== 'function' || window.renderPulseFeed.__sanvicDemoWrapped) return;
    const realRender = window.renderPulseFeed;
    window.renderPulseFeed = async function(){
      await realRender.apply(this, arguments);
      const body = document.getElementById('pulseBody');
      if(!body) return;
      const txt = (body.textContent || '').toLowerCase();
      if(txt.includes('no posts yet') || txt.includes('could not load pulse')) renderDemoPulse();
    };
    window.renderPulseFeed.__sanvicDemoWrapped = true;
  }

  const realLike = window.togglePulseLike;
  window.togglePulseLike = async function(btn, postId){
    if(Number(postId) >= 9000){
      const span = btn && btn.querySelector ? btn.querySelector('span') : null;
      const liked = btn.classList.toggle('liked');
      if(span){
        const cur = parseInt(span.textContent, 10) || 0;
        span.textContent = Math.max(0, cur + (liked ? 1 : -1));
      }
      return;
    }
    if(typeof realLike === 'function') return realLike.apply(this, arguments);
  };

  window.renderSanvicDemoPulse = renderDemoPulse;
  window.addEventListener('load', () => setTimeout(wrapPulseFeed, 1200));
  document.addEventListener('click', () => setTimeout(wrapPulseFeed, 80));
})();
