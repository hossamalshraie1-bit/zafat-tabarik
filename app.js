// ═══════════════════════════════════════════════════════════
// app.js — استوديو زفات تباريك | الواجهة الرئيسية
// ═══════════════════════════════════════════════════════════

// ─── Config ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://bsafasrqshvpxczudtht.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYWZhc3Jxc2h2cHhjenVkdGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTA3MzUsImV4cCI6MjA5OTc4NjczNX0.C3-spzDsh3e9so_SRRKkJgs5aadtPzdCH-sgWLbpIsw';

// ─── Safe Supabase init (won't crash if CDN not loaded) ───────
let DB = null;
function initDB() {
  try {
    if (window.supabase && window.supabase.createClient) {
      DB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {
    console.warn('Supabase init failed:', e.message);
  }
}

// ─── State ────────────────────────────────────────────────────
let allTracks     = [];
let allArtists    = [];
let allFilters    = [];
let comingSoon    = [];
let currentTrack  = null;
let isPlaying     = false;
let savedIds      = [];
let cart          = [];
let activeView    = 'home';
let selectedArtist = null;
let artistFilter  = { style: 'all', category: 'all' };
let worksFilter   = 'all';
let worksSearch   = '';
let carouselIdx   = 0;
let carouselTimer = null;
let appTheme      = 'dark';

var DEMO_FILTERS = [
  { id: '1', label: 'زفات', filter_group: 'genre' },
  { id: '2', label: 'شيلات', filter_group: 'genre' },
  { id: '3', label: 'دعوات', filter_group: 'genre' },
  { id: '4', label: 'مناسبات', filter_group: 'style' }
];

var DEMO_ARTISTS = [
  { id: 'a1', name: 'زفات العروس', specialty: 'زفات الأفراح', image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=70', is_featured: true, description: 'فنان متخصص في تقديم زفات خاصة بالأسماء والمناسبات.' },
  { id: 'a2', name: 'شيلة الراعي', specialty: 'شيلات بدوية', image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=70', is_featured: true, description: 'أدوات صوتية تقليدية ولحن عصري يليق بزفاتك.' },
  { id: 'a3', name: 'قلوب الورد', specialty: 'دعوات وتهاني', image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=70', is_featured: false, description: 'إنتاج صوتي مخصص للدعوات والتهاني.' }
];

var DEMO_TRACKS = [
  { id: 't1', title: 'زفة الأبطال', artist: 'زفات العروس', cover_image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=70', section: 'latest', filters: ['زفات'], is_exclusive: true },
  { id: 't2', title: 'شيلة الفخر', artist: 'شيلة الراعي', cover_image_url: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=400&q=70', section: 'latest', filters: ['شيلات'] },
  { id: 't3', title: 'دعوة العروس', artist: 'قلوب الورد', cover_image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=70', section: 'exclusive', filters: ['دعوات'] },
  { id: 't4', title: 'مقدمة الحفل', artist: 'زفات العروس', cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=70', section: 'exclusive', filters: ['مناسبات'] }
];

var DEMO_COMING_SOON = [
  { id: 'c1', title: 'عرض خاص قريباً', description: 'حجز زفة باسمك مع هدية صوتية مجانية.', image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=70' },
  { id: 'c2', title: 'شيلة جديدة', description: 'تحضير صوتي متكامل لمناسباتكم القادمة.', image_url: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=800&q=70' },
  { id: 'c3', title: 'جلسة تسجيل VIP', description: 'خصم خاص لأصحاب المناسبات الكبيرة.', image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=70' }
];

function seedMockData() {
  if (!allTracks.length)   allTracks   = DEMO_TRACKS.slice();
  if (!allArtists.length)  allArtists  = DEMO_ARTISTS.slice();
  if (!allFilters.length)  allFilters  = DEMO_FILTERS.slice();
  if (!comingSoon.length)  comingSoon  = DEMO_COMING_SOON.slice();
}

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // Load saved theme
  try { appTheme = localStorage.getItem('studio_theme') || 'dark'; } catch (e) {}
  applyTheme(appTheme);

  // Load saved favorites + cart
  try { savedIds = JSON.parse(localStorage.getItem('studio_favorites') || '[]'); } catch (e) { savedIds = []; }
  try { cart     = JSON.parse(localStorage.getItem('studio_cart')     || '[]'); } catch (e) { cart = []; }

  // Year
  var cy = document.getElementById('copy-year');
  if (cy) cy.textContent = '© ' + new Date().getFullYear() + ' استوديو زفات تباريك للصوتيات. جميع الحقوق محفوظة.';

  // Wire ALL buttons immediately (no dependency on data)
  wireHeader();
  wirePrimaryTabs();
  wireBottomNav();
  wireArtistDetail();
  wireBookingDrawer();
  wireAudioPlayer();
  wireWorksFilters();
  wireSearchField();

  updateCartBadge();

  // Seed and render mock data immediately so cards appear on first load.
  seedMockData();
  populateDetailDropdowns();
  renderHomeView();

  // Init Supabase then fetch real data in background
  initDB();
  fetchData();
});

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
function applyTheme(t) {
  appTheme = t;
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('studio_theme', t); } catch (e) {}

  var sun  = document.getElementById('icon-sun');
  var moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.style.display  = (t === 'dark')  ? 'block' : 'none';
    moon.style.display = (t === 'light') ? 'block' : 'none';
  }
}

// ═══════════════════════════════════════════════════════════
// HEADER BUTTONS
// ═══════════════════════════════════════════════════════════
function wireHeader() {
  on('btn-theme', 'click', function () {
    applyTheme(appTheme === 'dark' ? 'light' : 'dark');
  });
  on('btn-info',     'click', function () { switchView('about'); });
  on('btn-cart',     'click', openBooking);
  on('btn-floating', 'click', openBooking);
}

// ═══════════════════════════════════════════════════════════
// PRIMARY TABS (top)
// ═══════════════════════════════════════════════════════════
function wirePrimaryTabs() {
  on('tab-home',    'click', function () { switchView('home'); });
  on('tab-works',   'click', function () { switchView('all_works'); });
  on('tab-artists', 'click', function () { switchView('all_artists'); });
}

// ═══════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════
function wireBottomNav() {
  on('nav-home',   'click', function () { switchView('home'); });
  on('nav-search', 'click', function () { switchView('search'); });
  on('nav-saved',  'click', function () { switchView('saved'); });
  on('nav-about',  'click', function () { switchView('about'); });
}

// ═══════════════════════════════════════════════════════════
// VIEW SWITCHING  ← THE CORE NAV FUNCTION
// ═══════════════════════════════════════════════════════════
function switchView(tab) {
  activeView = tab;

  // 1. Show / hide header + primary tabs
  var showTop = (tab === 'home' || tab === 'all_works' || tab === 'all_artists');
  setDisplay('app-header',  showTop ? 'flex' : 'none');
  setDisplay('primary-tabs', showTop ? 'flex' : 'none');

  // 2. Primary tab highlights
  setActive('tab-home',    tab === 'home');
  setActive('tab-works',   tab === 'all_works');
  setActive('tab-artists', tab === 'all_artists');

  // 3. Bottom nav highlights
  ['nav-home','nav-search','nav-saved','nav-about'].forEach(function (id) {
    setActive(id, false);
  });
  var navMap = { home:'nav-home', search:'nav-search', saved:'nav-saved', about:'nav-about' };
  if (navMap[tab]) setActive(navMap[tab], true);

  // 4. Show / hide view panels
  var panels = ['view-home','view-search','view-saved','view-about','view-allartists','view-allworks'];
  panels.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  // Close artist detail overlay if open
  var ad = document.getElementById('view-artistdetail');
  if (ad) ad.classList.remove('open');

  var viewMap = {
    home:        'view-home',
    search:      'view-search',
    saved:       'view-saved',
    about:       'view-about',
    all_artists: 'view-allartists',
    all_works:   'view-allworks'
  };
  var target = viewMap[tab];
  if (target) {
    var el = document.getElementById(target);
    if (el) el.classList.add('active');
  }

  // 5. Lazy render on switch
  if (tab === 'saved')       renderSaved();
  if (tab === 'all_works')   renderAllWorks();
  if (tab === 'search')      renderSearch();
  if (tab === 'all_artists') renderAllArtistsGrid();
}

// ═══════════════════════════════════════════════════════════
// HOME VIEW ─ additional buttons
// ═══════════════════════════════════════════════════════════
function wireHomeButtons() {
  on('btn-view-all-works',    'click', function () { switchView('all_works'); });
  on('btn-view-all-artists',  'click', function () { switchView('all_artists'); });
  on('all-artists-back',      'click', function () { switchView('home'); });
  on('about-go-works',        'click', function () { switchView('all_works'); });
  on('about-open-booking',    'click', openBooking);
}

// ═══════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════
async function fetchData() {
  if (!DB) {
    // No Supabase – use demo data to preview the site immediately
    seedMockData();
    populateDetailDropdowns();
    renderHomeView();
    wireHomeButtons();
    return;
  }
  try {
    var [aR, tR, fR, cR] = await Promise.all([
      DB.from('artists').select('*').order('name', { ascending: true }),
      DB.from('tracks').select('*, artists(name)').order('created_at', { ascending: false }),
      DB.from('filters').select('*').order('label', { ascending: true }),
      DB.from('coming_soon').select('*').order('sort_order', { ascending: true })
    ]);

    if (aR.data) allArtists = aR.data;
    if (tR.data) allTracks  = tR.data;
    if (fR.data) allFilters = fR.data;
    if (cR.data) comingSoon = cR.data;

    seedMockData();
    populateDetailDropdowns();
    renderHomeView();

    // Wire home buttons after render
    wireHomeButtons();

  } catch (err) {
    console.error('خطأ في جلب البيانات:', err);
    seedMockData();
    populateDetailDropdowns();
    renderHomeView();
    wireHomeButtons();
  }
}

// ═══════════════════════════════════════════════════════════
// HOME VIEW RENDER
// ═══════════════════════════════════════════════════════════
function renderHomeView() {
  renderCarousel();
  renderLatest();
  renderExclusive();
  renderFeaturedArtists();
}

// ─── Carousel ────────────────────────────────────────────────
function renderCarousel() {
  var box   = document.getElementById('carousel-box');
  var track = document.getElementById('carousel-track');
  var dots  = document.getElementById('carousel-dots');
  if (!box) return;

  if (!comingSoon.length) { box.style.display = 'none'; return; }

  box.style.display = 'block';
  var n = comingSoon.length;
  track.style.width = (n * 100) + '%';
  track.innerHTML = comingSoon.map(function (s, i) {
    return '<div style="position:relative;width:' + (100/n) + '%;height:100%;flex-shrink:0;background-image:url(\'' + s.image_url + '\');background-size:cover;background-position:center;">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0.72),rgba(0,0,0,0.4));"></div>' +
      '<div style="position:absolute;bottom:0;left:0;right:0;padding:24px;z-index:2;">' +
        '<h3 style="color:#fff;font-size:1.1rem;font-weight:800;margin-bottom:6px;text-shadow:0 2px 8px rgba(0,0,0,0.6);">' + esc(s.title) + '</h3>' +
        '<p style="color:rgba(255,255,255,0.88);font-size:0.88rem;">' + esc(s.description || '') + '</p>' +
      '</div></div>';
  }).join('');

  dots.innerHTML = comingSoon.map(function (_, i) {
    return '<span class="dot' + (i===0?' active':'') + '" data-i="' + i + '" style="cursor:pointer;"></span>';
  }).join('');

  dots.querySelectorAll('.dot').forEach(function (d) {
    d.addEventListener('click', function () { goSlide(+d.dataset.i); });
  });

  clearInterval(carouselTimer);
  carouselIdx = 0;
  moveCarousel();
  if (n > 1) {
    carouselTimer = setInterval(function () {
      carouselIdx = (carouselIdx + 1) % n;
      moveCarousel();
    }, 7000);
  }
}

function goSlide(i) { carouselIdx = i; moveCarousel(); }

function moveCarousel() {
  var track = document.getElementById('carousel-track');
  var n     = comingSoon.length;
  if (!track || !n) return;
  track.style.transform = 'translateX(' + (100/n * carouselIdx) + '%)';
  document.querySelectorAll('#carousel-dots .dot').forEach(function (d, i) {
    d.classList.toggle('active', i === carouselIdx);
  });
}

// ─── Latest tracks ────────────────────────────────────────────
function renderLatest() {
  var c = document.getElementById('scroll-latest');
  if (!c) return;
  var list = allTracks.filter(function (t) { return t.section === 'latest'; });
  if (!list.length) {
    c.innerHTML = '<div style="color:var(--text-muted);padding:20px;font-size:0.85rem;">لا توجد أعمال حديثة حالياً.</div>';
    return;
  }
  c.innerHTML = list.map(function (tr, i) {
    return '<article class="work-card small" role="listitem" onclick="selectTrack(\'' + tr.id + '\')" style="cursor:pointer;">' +
      '<div class="card-inner-bg" style="background-image:url(\'' + (tr.cover_image_url || trackImg(i)) + '\');background-size:cover;background-position:center;">' +
        '<span class="tag-badge">★ NEW</span>' +
        '<div class="card-music-indicator">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</div>' +
        '<div class="card-text-overlay">' +
          '<div class="card-title">' + esc(tr.title) + '</div>' +
          '<div class="card-artist">' + esc((tr.artists && tr.artists.name) || tr.artist || 'استوديو زفات تباريك للصوتيات') + '</div>' +
        '</div>' +
      '</div></article>';
  }).join('');
}

// ─── Exclusive tracks ─────────────────────────────────────────
function renderExclusive() {
  var c = document.getElementById('scroll-exclusive');
  if (!c) return;
  var list = allTracks.filter(function (t) { return t.section === 'exclusive' || t.is_exclusive; });
  if (!list.length) {
    c.innerHTML = '<div style="color:var(--text-muted);padding:20px;font-size:0.85rem;">لا توجد حصريات حالياً.</div>';
    return;
  }
  c.innerHTML = list.map(function (tr, i) {
    var saved = savedIds.indexOf(tr.id) > -1;
    return '<div class="work-card tall" onclick="selectTrack(\'' + tr.id + '\')" style="cursor:pointer;">' +
      '<div class="card-inner-bg" style="background-image:url(\'' + (tr.cover_image_url || trackImg(i+3)) + '\');background-size:cover;background-position:center;">' +
        '<span class="tag-badge hot">★ حصري 🔥</span>' +
        '<button onclick="toggleSave(\'' + tr.id + '\',event)" style="position:absolute;top:8px;left:8px;z-index:10;background:rgba(0,0,0,0.5);border:none;width:28px;height:28px;border-radius:50%;display:flex;justify-content:center;align-items:center;cursor:pointer;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="' + (saved?'#cca43b':'none') + '" stroke="' + (saved?'#cca43b':'#fff') + '" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>' +
        '<div class="card-text-overlay">' +
          '<div class="card-title">' + esc(tr.title) + '</div>' +
          '<div class="card-artist">' + esc((tr.artists && tr.artists.name) || tr.artist || 'استوديو زفات تباريك للصوتيات') + '</div>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

// ─── Featured artists ─────────────────────────────────────────
function renderFeaturedArtists() {
  var c = document.getElementById('scroll-artists');
  if (!c) return;
  var list = allArtists.filter(function (a) { return a.is_featured; });
  if (!list.length) {
    c.innerHTML = '<div style="color:var(--text-muted);padding:20px;font-size:0.85rem;">لا يوجد فنانون مميزون حالياً.</div>';
    return;
  }
  c.innerHTML = list.map(function (ar) {
    return '<div class="artist-card" onclick="openArtistDetail(\'' + ar.id + '\')" style="cursor:pointer;">' +
      '<div class="card-inner-bg" style="background-image:url(\'' + (ar.image_url || artistImg(ar.name)) + '\');background-size:cover;background-position:center;">' +
        '<div style="position:absolute;top:8px;right:8px;z-index:10;background:rgba(204,164,59,0.9);padding:2px 6px;border-radius:4px;font-size:0.6rem;font-weight:bold;color:#000;">FMT</div>' +
        '<div class="card-text-overlay">' +
          '<div class="card-title" style="font-size:0.83rem;">' + esc(ar.name) + '</div>' +
          '<div class="card-artist" style="color:var(--accent-color);font-weight:600;">' + esc(ar.specialty || '') + '</div>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// ALL ARTISTS GRID
// ═══════════════════════════════════════════════════════════
function renderAllArtistsGrid() {
  var grid = document.getElementById('all-artists-grid');
  if (!grid) return;
  if (!allArtists.length) {
    grid.innerHTML = '<div style="color:var(--text-muted);padding:40px;text-align:center;grid-column:1/-1;">لا يوجد فنانون حالياً.</div>';
    return;
  }
  grid.innerHTML = allArtists.map(function (ar) {
    return '<div onclick="openArtistDetail(\'' + ar.id + '\')" style="height:190px;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--card-shadow);cursor:pointer;position:relative;">' +
      '<div style="width:100%;height:100%;background-image:url(\'' + (ar.image_url || artistImg(ar.name)) + '\');background-size:cover;background-position:center;">' +
        (ar.is_featured ? '<div style="position:absolute;top:8px;right:8px;z-index:10;background:rgba(204,164,59,0.92);padding:2px 6px;border-radius:4px;font-size:0.6rem;font-weight:bold;color:#000;">⭐ مميز</div>' : '') +
        '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.82) 0%,transparent 55%);"></div>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:10px;text-align:center;">' +
          '<div style="font-weight:800;font-size:0.85rem;color:#fff;">' + esc(ar.name) + '</div>' +
          '<div style="color:var(--accent-color);font-weight:600;font-size:0.72rem;">' + esc(ar.specialty || '') + '</div>' +
        '</div></div></div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// ARTIST DETAIL OVERLAY
// ═══════════════════════════════════════════════════════════
function wireArtistDetail() {
  on('btn-detail-back',  'click', closeArtistDetail);
  on('detail-style',     'change', function (e) { artistFilter.style    = e.target.value; renderDetailTracks(); updateDetailClearBtn(); });
  on('detail-category',  'change', function (e) { artistFilter.category = e.target.value; renderDetailTracks(); updateDetailClearBtn(); });
  on('btn-detail-clear', 'click', function () {
    artistFilter = { style: 'all', category: 'all' };
    var ss = document.getElementById('detail-style');
    var cs = document.getElementById('detail-category');
    if (ss) ss.value = 'all';
    if (cs) cs.value = 'all';
    renderDetailTracks();
    updateDetailClearBtn();
  });
}

function populateDetailDropdowns() {
  var ss = document.getElementById('detail-style');
  var cs = document.getElementById('detail-category');
  if (!ss || !cs) return;

  var styleF = allFilters.filter(function (f) { return f.filter_group === 'style'; });
  var catF   = allFilters.filter(function (f) { return f.filter_group !== 'style'; });

  ss.innerHTML = '<option value="all">كل الأنماط</option>' +
    styleF.map(function (f) { return '<option value="' + esc(f.label) + '">' + esc(f.label) + '</option>'; }).join('');
  cs.innerHTML = '<option value="all">كل الأنواع</option>' +
    catF.map(function (f) { return '<option value="' + esc(f.label) + '">' + esc(f.label) + '</option>'; }).join('');
}

function openArtistDetail(artistId) {
  var ar = allArtists.find(function (a) { return String(a.id) === String(artistId); });
  if (!ar) return;

  selectedArtist = ar;
  artistFilter   = { style: 'all', category: 'all' };

  var bg = document.getElementById('detail-header-bg');
  if (bg) bg.style.backgroundImage = "url('" + (ar.image_url || '') + "')";

  setText('detail-name',     ar.name);
  setText('detail-specialty', ar.specialty || '');
  setText('detail-desc',     ar.description || '');

  var ss = document.getElementById('detail-style');
  var cs = document.getElementById('detail-category');
  if (ss) ss.value = 'all';
  if (cs) cs.value = 'all';

  renderDetailTracks();
  updateDetailClearBtn();

  var overlay = document.getElementById('view-artistdetail');
  if (overlay) overlay.classList.add('open');
}

function closeArtistDetail() {
  var overlay = document.getElementById('view-artistdetail');
  if (overlay) overlay.classList.remove('open');
  selectedArtist = null;
}

function renderDetailTracks() {
  var container = document.getElementById('detail-tracks-list');
  if (!container || !selectedArtist) return;

  var artistTracks = allTracks.filter(function (t) {
    return String(t.artist_id) === String(selectedArtist.id) ||
           ((t.artists && t.artists.name) === selectedArtist.name) ||
           (t.artist === selectedArtist.name);
  });

  var filtered = artistTracks.filter(function (t) {
    var fl = t.filters || [];
    var styleOk = artistFilter.style === 'all' || fl.indexOf(artistFilter.style) > -1;
    var catOk   = artistFilter.category === 'all' || fl.indexOf(artistFilter.category) > -1;
    return styleOk && catOk;
  });

  setText('detail-count', 'المعروض: ' + filtered.length + ' عمل صوتي');

  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">' +
      '<p>لا توجد أعمال في هذا التصنيف</p></div>';
    return;
  }

  var styleFilters = allFilters.filter(function (f) { return f.filter_group === 'style'; });

  container.innerHTML = filtered.map(function (tr) {
    var active   = currentTrack && currentTrack.id === tr.id;
    var playing  = active && isPlaying;
    var fl       = tr.filters || [];
    var saved    = savedIds.indexOf(tr.id) > -1;

    var badges = fl.map(function (f) {
      var isSt = styleFilters.some(function (s) { return s.label === f; });
      return '<span style="padding:1px 6px;border-radius:20px;font-size:0.62rem;font-weight:600;' +
        'background:' + (isSt?'rgba(204,164,59,0.1)':'rgba(168,85,247,0.1)') + ';' +
        'border:1px solid ' + (isSt?'rgba(204,164,59,0.3)':'rgba(168,85,247,0.3)') + ';' +
        'color:' + (isSt?'#cca43b':'#a855f7') + ';">' + esc(f) + '</span>';
    }).join('');

    return '<div class="artist-track-item ' + (active?'playing':'') + '" onclick="selectTrack(\'' + tr.id + '\')">' +
      '<div style="width:50px;height:50px;border-radius:10px;flex-shrink:0;background-image:url(\'' + (tr.cover_image_url || '') + '\');background-size:cover;background-position:center;background-color:var(--bg-tertiary);border:1px solid rgba(204,164,59,0.2);display:flex;align-items:center;justify-content:center;">' +
        (playing
          ? '<div class="waveform"><div class="wb"></div><div class="wb"></div><div class="wb"></div></div>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>') +
      '</div>' +
      '<div style="flex:1;min-width:0;padding:0 10px;">' +
        '<div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(tr.title) + '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">' + badges + '</div>' +
      '</div>' +
      '<button onclick="toggleSave(\'' + tr.id + '\',event)" style="border:none;background:transparent;padding:6px;cursor:pointer;flex-shrink:0;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="' + (saved?'#cca43b':'none') + '" stroke="' + (saved?'#cca43b':'var(--text-muted)') + '" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      '</button>' +
    '</div>';
  }).join('');
}

function updateDetailClearBtn() {
  var btn = document.getElementById('btn-detail-clear');
  if (!btn) return;
  var hasFilter = artistFilter.style !== 'all' || artistFilter.category !== 'all';
  btn.style.display = hasFilter ? 'inline' : 'none';
}

// ═══════════════════════════════════════════════════════════
// ALL WORKS
// ═══════════════════════════════════════════════════════════
function wireWorksFilters() {
  document.querySelectorAll('.all-works-filter-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      worksFilter = btn.dataset.filter;
      document.querySelectorAll('.all-works-filter-tab').forEach(function (b) {
        b.classList.toggle('active', b.dataset.filter === worksFilter);
      });
      if (activeView === 'all_works') renderAllWorks();
    });
  });

  var ws = document.getElementById('works-search');
  if (ws) ws.addEventListener('input', function (e) {
    worksSearch = e.target.value;
    if (activeView === 'all_works') renderAllWorks();
  });
}

function renderAllWorks() {
  var c = document.getElementById('all-works-list');
  if (!c) return;

  var list = allTracks.slice();

  if (worksFilter === 'saved') {
    list = list.filter(function (t) { return savedIds.indexOf(t.id) > -1; });
  } else if (worksFilter === 'zaffat') {
    list = list.filter(function (t) {
      var fl = (t.filters || []).join(' ');
      return fl.includes('زفات') || fl.includes('زفة') || (t.title || '').includes('زفة') || (t.title || '').includes('زفات');
    });
  } else if (worksFilter === 'sheelat') {
    list = list.filter(function (t) {
      var fl = (t.filters || []).join(' ');
      return fl.includes('شيلات') || fl.includes('شيلة') || (t.title || '').includes('شيلة') || (t.title || '').includes('شيلات');
    });
  }

  if (worksSearch.trim()) {
    var q = worksSearch.trim().toLowerCase();
    list = list.filter(function (t) {
      return (t.title || '').toLowerCase().includes(q) ||
             ((t.artists && t.artists.name) || '').toLowerCase().includes(q);
    });
  }

  if (!list.length) {
    c.innerHTML = '<div style="text-align:center;padding:50px 20px;color:var(--text-muted);">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.35;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
      '<p>لا توجد نتائج مطابقة</p></div>';
    return;
  }

  c.innerHTML = list.map(function (tr, i) {
    var saved  = savedIds.indexOf(tr.id) > -1;
    var active = currentTrack && currentTrack.id === tr.id;
    var plying = active && isPlaying;

    return '<div onclick="selectTrack(\'' + tr.id + '\')" style="display:flex;gap:12px;padding:10px;background:var(--bg-secondary);border-radius:12px;cursor:pointer;border:1px solid ' + (active?'var(--accent-color)':'var(--border-color)') + ';align-items:center;">' +
      '<div style="width:50px;height:50px;border-radius:8px;flex-shrink:0;display:flex;justify-content:center;align-items:center;background-image:url(\'' + (tr.cover_image_url || trackImg(i)) + '\');background-size:cover;background-position:center;background-color:var(--bg-tertiary);">' +
        (plying ? '<div class="waveform"><div class="wb"></div><div class="wb"></div><div class="wb"></div></div>' :
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>') +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(tr.title) + '</div>' +
        '<div style="font-size:0.78rem;color:var(--text-secondary);">' + esc((tr.artists && tr.artists.name) || tr.artist || 'استوديو زفات تباريك للصوتيات') + '</div>' +
      '</div>' +
      '<button onclick="toggleSave(\'' + tr.id + '\',event)" style="border:none;background:transparent;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="' + (saved?'#cca43b':'none') + '" stroke="' + (saved?'#cca43b':'var(--text-muted)') + '" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      '</button>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════
function wireSearchField() {
  on('search-field', 'input', function (e) {
    if (activeView === 'search') renderSearch(e.target.value);
  });
}

function renderSearch(q) {
  var c = document.getElementById('search-results');
  if (!c) return;
  q = (q || '').trim().toLowerCase();
  var list = q
    ? allTracks.filter(function (t) {
        return (t.title || '').toLowerCase().includes(q) ||
               ((t.artists && t.artists.name) || '').toLowerCase().includes(q) ||
               (t.filters || []).some(function (f) { return f.toLowerCase().includes(q); });
      })
    : allTracks.slice(0, 15);

  if (!list.length) {
    c.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center;">لا توجد نتائج مطابقة.</div>';
    return;
  }

  c.innerHTML = list.map(function (tr, i) {
    return '<div onclick="selectTrack(\'' + tr.id + '\')" style="display:flex;gap:12px;padding:8px;background:var(--bg-secondary);border-radius:12px;cursor:pointer;border:1px solid var(--border-color);align-items:center;">' +
      '<div style="width:44px;height:44px;border-radius:8px;flex-shrink:0;background-image:url(\'' + (tr.cover_image_url || trackImg(i)) + '\');background-size:cover;background-position:center;background-color:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(tr.title) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-secondary);">' + esc((tr.artists && tr.artists.name) || tr.artist || 'استوديو زفات تباريك للصوتيات') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// SAVED
// ═══════════════════════════════════════════════════════════
function renderSaved() {
  var list  = document.getElementById('saved-list');
  var empty = document.getElementById('saved-empty');
  if (!list) return;

  var saved = allTracks.filter(function (t) { return savedIds.indexOf(t.id) > -1; });

  if (!saved.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = saved.map(function (tr, i) {
    return '<div onclick="selectTrack(\'' + tr.id + '\')" style="display:flex;gap:12px;padding:8px;background:var(--bg-secondary);border-radius:12px;cursor:pointer;border:1px solid var(--border-color);align-items:center;">' +
      '<div style="width:46px;height:46px;border-radius:8px;flex-shrink:0;background-image:url(\'' + (tr.cover_image_url || trackImg(i)) + '\');background-size:cover;background-position:center;background-color:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(tr.title) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-secondary);">' + esc((tr.artists && tr.artists.name) || tr.artist || '') + '</div>' +
      '</div>' +
      '<button onclick="toggleSave(\'' + tr.id + '\',event)" style="border:none;background:transparent;padding:6px;cursor:pointer;flex-shrink:0;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      '</button>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// FAVORITES (toggle save)
// ═══════════════════════════════════════════════════════════
function toggleSave(trackId, event) {
  if (event) event.stopPropagation();
  var idx = savedIds.indexOf(trackId);
  if (idx > -1) savedIds.splice(idx, 1); else savedIds.push(trackId);
  try { localStorage.setItem('studio_favorites', JSON.stringify(savedIds)); } catch (e) {}

  if (activeView === 'home')         { renderExclusive(); }
  if (activeView === 'all_works')    renderAllWorks();
  if (activeView === 'saved')        renderSaved();
  if (activeView === 'search')       renderSearch(document.getElementById('search-field') ? document.getElementById('search-field').value : '');
  if (selectedArtist)                renderDetailTracks();
}

// ═══════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════
function addToCart(trackId, event) {
  if (event) event.stopPropagation();
  var tr = allTracks.find(function (t) { return String(t.id) === String(trackId); });
  if (!tr || cart.some(function (c) { return c.id === trackId; })) return;
  cart.push(tr);
  try { localStorage.setItem('studio_cart', JSON.stringify(cart)); } catch (e) {}
  updateCartBadge();
}

function removeFromCart(trackId) {
  cart = cart.filter(function (c) { return c.id !== trackId; });
  try { localStorage.setItem('studio_cart', JSON.stringify(cart)); } catch (e) {}
  updateCartBadge();
  renderCartInDrawer();
}

function updateCartBadge() {
  var badge = document.getElementById('cart-badge');
  if (!badge) return;
  if (cart.length > 0) {
    badge.textContent  = cart.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════
// BOOKING DRAWER
// ═══════════════════════════════════════════════════════════
function wireBookingDrawer() {
  on('booking-overlay',  'click', closeBooking);
  on('btn-booking-close','click', closeBooking);
  on('booking-form',     'submit', submitBooking);
}

function openBooking() {
  renderCartInDrawer();
  var el = document.getElementById('booking-drawer-container');
  if (el) el.classList.add('open');
}

function closeBooking() {
  var el = document.getElementById('booking-drawer-container');
  if (el) el.classList.remove('open');
}

function renderCartInDrawer() {
  var block = document.getElementById('cart-ref-block');
  var list  = document.getElementById('cart-ref-list');
  if (!block || !list) return;

  if (!cart.length) { block.style.display = 'none'; return; }

  block.style.display = 'block';
  list.innerHTML = cart.map(function (item) {
    return '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-primary);border-radius:6px;font-size:0.8rem;border:1px solid var(--border-color);">' +
      '<span style="font-weight:bold;">' + esc(item.title) + '</span>' +
      '<button type="button" onclick="removeFromCart(\'' + item.id + '\')" style="color:#ef4444;background:none;border:none;cursor:pointer;font-weight:bold;">حذف</button>' +
    '</div>';
  }).join('');
}

async function submitBooking(e) {
  e.preventDefault();
  var name    = (document.getElementById('book-name')    || {}).value || '';
  var service = (document.getElementById('book-service') || {}).value || '';
  var notes   = (document.getElementById('book-notes')   || {}).value || '';

  if (!name.trim()) return;

  var servLabel = {
    recording: '🎤 جلسة تسجيل',
    mixing_mastering: '🎛️ مكس وماستر',
    voiceover: '🗣️ تعليق صوتي',
    podcast: '🎧 بودكاست'
  }[service] || service;

  var cartText = cart.length
    ? '\n\n🎵 الأعمال المرجعية:\n' + cart.map(function (c) { return '  - ' + c.title; }).join('\n')
    : '';

  var msg = 'السلام عليكم 🌺\n\nطلب حجز لدى استوديو زفات تباريك:\n\n👤 الاسم: ' + name + '\n🎙️ الخدمة: ' + servLabel + '\n📝 الملاحظات: ' + (notes||'لا يوجد') + cartText + '\n\nشكراً ✨';

  if (DB) {
    try {
      await DB.from('bookings').insert([{ client_name: name, service_type: service, notes: notes, status: 'pending' }]);
    } catch (_) {}
  }

  window.open('https://wa.me/967776158797?text=' + encodeURIComponent(msg), '_blank');

  e.target.reset();
  cart = [];
  try { localStorage.setItem('studio_cart', '[]'); } catch (_) {}
  updateCartBadge();
  closeBooking();
}

// ═══════════════════════════════════════════════════════════
// AUDIO PLAYER
// ═══════════════════════════════════════════════════════════
var audioEl = null;

function wireAudioPlayer() {
  audioEl = document.getElementById('audio-el');
  if (!audioEl) return;

  audioEl.addEventListener('timeupdate', function () {
    if (!audioEl.duration) return;
    var pct  = (audioEl.currentTime / audioEl.duration) * 100;
    var fill = document.getElementById('player-prog-fill');
    var time = document.getElementById('player-time');
    if (fill) fill.style.width = pct + '%';
    if (time) time.textContent = fmtTime(audioEl.currentTime);
  });

  audioEl.addEventListener('ended', function () { isPlaying = false; updatePlayerUI(); });

  on('player-cover',     'click', togglePlay);
  on('player-info-click','click', togglePlay);

  on('player-progress', 'click', function (e) {
    if (!audioEl || !audioEl.duration) return;
    var r = document.getElementById('player-progress').getBoundingClientRect();
    audioEl.currentTime = ((e.clientX - r.left) / r.width) * audioEl.duration;
  });

  on('player-order', 'click', function () {
    if (!currentTrack) return;
    var msg = 'مرحباً، أعجبني هذا العمل (' + currentTrack.title + ') وأرغب في طلب عمل مشابه.';
    window.open('https://wa.me/967776158797?text=' + encodeURIComponent(msg), '_blank');
  });

  on('player-close', 'click', function () {
    if (audioEl) audioEl.pause();
    currentTrack = null;
    isPlaying    = false;
    var mp = document.getElementById('mini-player');
    if (mp) mp.style.display = 'none';
  });
}

function selectTrack(trackId) {
  var tr = allTracks.find(function (t) { return String(t.id) === String(trackId); });
  if (!tr) return;

  if (currentTrack && currentTrack.id === tr.id) { togglePlay(); return; }

  currentTrack = tr;
  isPlaying    = false;

  if (audioEl && (tr.audio_url || tr.audio_file)) {
    audioEl.src = tr.audio_url || tr.audio_file;
    audioEl.load();
    audioEl.play().then(function () { isPlaying = true; updatePlayerUI(); }).catch(function () { updatePlayerUI(); });
  }
  updatePlayerUI();
}

function togglePlay() {
  if (!currentTrack || !audioEl) return;
  if (audioEl.paused) {
    audioEl.play().then(function () { isPlaying = true; updatePlayerUI(); }).catch(function () {});
  } else {
    audioEl.pause();
    isPlaying = false;
    updatePlayerUI();
  }
}

function updatePlayerUI() {
  var mp = document.getElementById('mini-player');
  if (!mp) return;

  if (!currentTrack) { mp.style.display = 'none'; return; }
  mp.style.display = 'flex';

  if (currentTrack.cover_image_url) {
    var cover = document.getElementById('player-cover');
    if (cover) cover.style.backgroundImage = "url('" + currentTrack.cover_image_url + "')";
  }

  setText('player-title',  currentTrack.title);
  setText('player-artist', (currentTrack.artists && currentTrack.artists.name) || currentTrack.artist || 'استوديو زفات تباريك للصوتيات');

  var iconPlay  = document.getElementById('player-icon-play');
  var iconPause = document.getElementById('player-icon-pause');
  if (iconPlay  && iconPause) {
    iconPlay.style.display  = isPlaying ? 'none'  : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function on(id, event, fn) {
  var el = document.getElementById(id);
  if (el) el.addEventListener(event, fn);
}

function setDisplay(id, val) {
  var el = document.getElementById(id);
  if (el) el.style.display = val;
}

function setActive(id, active) {
  var el = document.getElementById(id);
  if (el) el.classList.toggle('active', active);
}

function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '00:00';
  var m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return (m < 10 ? '0' + m : m) + ':' + (sec < 10 ? '0' + sec : sec);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

var TRACK_IMGS = [
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=70',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=70',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=70',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=70',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=70',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=70'
];

var ARTIST_IMGS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=70',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=70',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=70'
];

function trackImg(i)  { return TRACK_IMGS[Math.abs(i | 0) % TRACK_IMGS.length]; }
function artistImg(n) {
  var h = 0;
  for (var j = 0; j < (n || '').length; j++) h = (h * 31 + (n || '').charCodeAt(j)) & 0xFFFF;
  return ARTIST_IMGS[h % ARTIST_IMGS.length];
}
