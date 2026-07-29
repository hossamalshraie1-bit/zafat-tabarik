// ═══════════════════════════════════════════════════════════
// admin.js — استوديو زفات تباريك | لوحة الإدارة
// ═══════════════════════════════════════════════════════════

// ─── Supabase Safe Initialization ──────────────────────────
const SUPABASE_URL = 'https://bsafasrqshvpxczudtht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYWZhc3Jxc2h2cHhjenVkdGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTA3MzUsImV4cCI6MjA5OTc4NjczNX0.C3-spzDsh3e9so_SRRKkJgs5aadtPzdCH-sgWLbpIsw';

let dbClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase loading failed:', e.message);
}

// ─── Filebase / S3 Config ────────────────────────────────────
const FILEBASE_KEY = '9AF6DD7AF753FCF13BBB';
const FILEBASE_SECRET = 'Ca5O9bNqsS6Q8tx4OGD5NvvReh2Nw9jhHYAUlym8';
const FILEBASE_BUCKET = 'ztabarik';
const FILEBASE_EP = 'https://ztabarik.s3.filebase.io';

// ─── Admin Credentials (hardcoded) ──────────────────────────
const ADMIN_EMAIL = 'admin@studio.com';
const ADMIN_PASSWORD = '12345';

// ─── Nav Sections ───────────────────────────────────────────
const NAV = [
  { key: 'coming-soon', label: 'قريباً', icon: 'image' },
  { key: 'latest', label: 'أحدث الأعمال', icon: 'clipboard-list' },
  { key: 'exclusive', label: 'حصريات', icon: 'star' },
  { key: 'artists', label: 'الفنانون', icon: 'user' },
  { key: 'filters', label: 'الفلاتر', icon: 'filter' },
];

// ─── App State ───────────────────────────────────────────────
let authed = false;
let section = 'coming-soon';
let theme = localStorage.getItem('studio_admin_theme') || 'dark';
let artists = [];
let tracks = [];
let filters = [];
let comingSoon = [];

// ─── Safe Lucide wrapper ─────────────────────────────────────
function safeCreateIcons() {
  try {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  } catch (e) {
    console.warn('Lucide icon creation failed:', e.message);
  }
}

// ─── Boot ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(theme);
  safeCreateIcons();

  // Check new login status
  if (sessionStorage.getItem('studio_admin_auth') === 'true') {
    showDashboard();
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Logout buttons
  const logoutSid = document.getElementById('logout-btn-sidebar');
  if (logoutSid) logoutSid.addEventListener('click', handleLogout);
  const logoutMob = document.getElementById('logout-btn-mobile');
  if (logoutMob) logoutMob.addEventListener('click', handleLogout);

  // Theme toggles
  const themeSid = document.getElementById('theme-toggle-sidebar');
  if (themeSid) themeSid.addEventListener('click', toggleTheme);
  const themeMob = document.getElementById('theme-toggle-mobile');
  if (themeMob) themeMob.addEventListener('click', toggleTheme);
});

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const errDiv = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  btn.textContent = '...جاري التحقق';
  btn.disabled = true;

  setTimeout(() => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('studio_admin_auth', 'true');
      if (errDiv) errDiv.style.display = 'none';
      showDashboard();
    } else {
      if (errDiv) {
        errDiv.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        errDiv.style.display = 'block';
      }
      btn.textContent = 'دخول للوحة الإدارة ←';
      btn.disabled = false;
    }
  }, 600);
}

function handleLogout() {
  if (!confirm('تسجيل الخروج؟')) return;
  sessionStorage.removeItem('studio_admin_auth');
  authed = false;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function showDashboard() {
  authed = true;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'flex';
  buildNav();
  fetchAllData();
}

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('studio_admin_theme', t);
  // Update icons
  ['theme-toggle-sidebar', 'theme-toggle-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? '<i data-lucide="sun" style="width:14px;height:14px;"></i>'
      : '<i data-lucide="moon" style="width:14px;height:14px;"></i>';
  });
  lucide.createIcons();
}

function toggleTheme() {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function buildNav() {
  const sidebarNav = document.getElementById('sidebar-nav');
  const mobileNav = document.getElementById('mobile-bottom-nav');
  if (!sidebarNav || !mobileNav) return;

  // Sidebar buttons
  sidebarNav.innerHTML = NAV.map(n => `
    <button class="adm-nav-btn ${section === n.key ? 'active' : ''}" data-section="${n.key}" onclick="switchSection('${n.key}')">
      <i data-lucide="${n.icon}" style="width:16px;height:16px;"></i> ${n.label}
    </button>
  `).join('');

  // Mobile bottom nav buttons
  mobileNav.innerHTML = NAV.map(n => `
    <button onclick="switchSection('${n.key}')" data-section="${n.key}" style="
      flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
      padding:10px 4px;border:none;background:transparent;
      color:${section === n.key ? '#cca43b' : '#6e6e6e'};
      font-family:'Cairo',sans-serif;font-weight:700;font-size:0.6rem;cursor:pointer;
      border-top:${section === n.key ? '2px solid #cca43b' : '2px solid transparent'};
      transition:all 0.18s;">
      <i data-lucide="${n.icon}" style="width:16px;height:16px;"></i>
      ${n.label}
    </button>
  `).join('');

  safeCreateIcons();
}

function switchSection(key) {
  section = key;
  // Update active nav buttons
  document.querySelectorAll('[data-section]').forEach(btn => {
    const isActive = btn.dataset.section === key;
    btn.classList.toggle('active', isActive);
    if (btn.closest('#mobile-bottom-nav')) {
      btn.style.color = isActive ? '#cca43b' : '#6e6e6e';
      btn.style.borderTop = isActive ? '2px solid #cca43b' : '2px solid transparent';
    }
  });

  // Show correct section panel
  document.querySelectorAll('.adm-section').forEach(el => el.style.display = 'none');
  const panelId = `section-${key}`;
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.style.display = 'block';
    renderSection(key);
  }
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════
async function fetchAllData() {
  if (!dbClient) {
    console.warn('Supabase not instantiated. Rendering empty admin dashboard.');
    renderSection(section);
    return;
  }
  try {
    const [aRes, tRes, fRes, cRes] = await Promise.all([
      dbClient.from('artists').select('*').order('name', { ascending: true }),
      dbClient.from('tracks').select('*, artists(name)').order('created_at', { ascending: false }),
      dbClient.from('filters').select('*').order('label', { ascending: true }),
      dbClient.from('coming_soon').select('*').order('sort_order', { ascending: true })
    ]);

    if (aRes.data) artists = aRes.data;
    if (tRes.data) tracks = tRes.data;
    if (fRes.data) filters = fRes.data;
    if (cRes.data) comingSoon = cRes.data;

  } catch (err) {
    console.error('خطأ في جلب البيانات:', err);
  }

  // Render active section regardless of complete success
  renderSection(section);
}

// ═══════════════════════════════════════════════════════════
// RENDER SECTIONS
// ═══════════════════════════════════════════════════════════
function renderSection(key) {
  switch (key) {
    case 'coming-soon': renderComingSoon(); break;
    case 'latest': renderLatest(); break;
    case 'exclusive': renderExclusive(); break;
    case 'artists': renderArtists(); break;
    case 'filters': renderFilters(); break;
  }
}

// ─── Section Header helper ───────────────────────────────────
function sectionHeader(title, subtitle, onAddFn, addLabel = 'إضافة') {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:10px;">
      <div>
        <h2 style="margin:0 0 4px;font-size:1.2rem;font-weight:800;color:var(--text-primary);">${title}</h2>
        <p style="margin:0;font-size:0.76rem;color:#9c9b96;">${subtitle}</p>
      </div>
      <button onclick="${onAddFn}" style="display:flex;align-items:center;gap:6px;padding:9px 16px;flex-shrink:0;background:linear-gradient(135deg,#cca43b,#b8912e);border:none;border-radius:10px;color:#000;font-family:'Cairo',sans-serif;font-weight:800;font-size:0.82rem;cursor:pointer;box-shadow:0 4px 16px rgba(204,164,59,0.3);">
        <i data-lucide="plus" style="width:14px;height:14px;"></i> ${addLabel}
      </button>
    </div>
  `;
}

// ─── Coming Soon ─────────────────────────────────────────────
function renderComingSoon() {
  const panel = document.getElementById('section-coming-soon');
  if (!panel) return;

  const cardsHtml = comingSoon.length === 0
    ? emptyState()
    : `<div class="adm-grid-3" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">
        ${comingSoon.map(item => cardItemHTML(item)).join('')}
       </div>`;

  panel.innerHTML = sectionHeader(
    'قسم قريباً',
    'البطاقات المعروضة في الشريح الرئيسي بالصفحة الرئيسية',
    `openComingSoonModal(null)`,
    'إضافة بطاقة'
  ) + cardsHtml;
  safeCreateIcons();
}

function cardItemHTML(item) {
  return `
    <div class="adm-card" style="background-image:url('${item.image_url || ''}');background-size:cover;background-position:center;">
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 55%);"></div>
      <div style="position:absolute;bottom:10px;right:10px;left:10px;">
        <div style="font-weight:800;font-size:0.85rem;color:#fff;">${esc(item.title)}</div>
        <div style="font-size:0.7rem;color:#cca43b;margin-top:2px;">${esc(item.description || '')}</div>
      </div>
      <div style="position:absolute;top:8px;left:8px;display:flex;gap:5px;">
        <button class="adm-sm-btn" onclick="openComingSoonModal('${item.id}')" style="background:rgba(204,164,59,0.2);border:1px solid rgba(204,164,59,0.5);color:#cca43b;">
          <i data-lucide="edit" style="width:12px;height:12px;"></i>
        </button>
        <button class="adm-sm-btn" onclick="deleteItem('coming_soon','${item.id}','coming-soon')" style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);color:#ef4444;">
          <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
        </button>
      </div>
    </div>`;
}

// ─── Latest & Exclusive (Track lists) ────────────────────────
function renderLatest() {
  const panel = document.getElementById('section-latest');
  if (!panel) return;
  const list = tracks.filter(t => t.section === 'latest');
  panel.innerHTML = sectionHeader(
    'أحدث الأعمال',
    `آخر المقاطع المضافة كـ "أحدث الأعمال" (${list.length} حالياً)`,
    `openTrackModal(null,'latest')`,
    'إضافة مقطع'
  ) + (list.length === 0 ? emptyState() : `<div style="display:flex;flex-direction:column;gap:10px;">${list.map(t => trackRowHTML(t)).join('')}</div>`);
  safeCreateIcons();
}

function renderExclusive() {
  const panel = document.getElementById('section-exclusive');
  if (!panel) return;
  const list = tracks.filter(t => t.section === 'exclusive' || t.is_exclusive);
  panel.innerHTML = sectionHeader(
    'حصرياتنا',
    `المقاطع الحصرية (${list.length} حالياً)`,
    `openTrackModal(null,'exclusive')`,
    'إضافة حصري'
  ) + (list.length === 0 ? emptyState() : `<div style="display:flex;flex-direction:column;gap:10px;">${list.map(t => trackRowHTML(t)).join('')}</div>`);
  safeCreateIcons();
}

function trackRowHTML(track) {
  const artist = artists.find(a => String(a.id) === String(track.artist_id));
  const filterBadges = (track.filters || []).map(fl =>
    `<span style="padding:1px 7px;background:rgba(204,164,59,0.1);border:1px solid rgba(204,164,59,0.25);border-radius:20px;font-size:0.67rem;color:#cca43b;">${esc(fl)}</span>`
  ).join('');
  const exclBadge = track.is_exclusive
    ? `<span style="padding:1px 7px;background:rgba(255,193,7,0.12);border:1px solid rgba(255,193,7,0.3);border-radius:20px;font-size:0.67rem;color:#ffc107;">★ حصري</span>`
    : '';

  return `
    <div class="adm-track-row">
      <div style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background-image:url('${track.cover_image_url || ''}');background-size:cover;background-position:center;background-color:var(--bg-tertiary);border:1px solid rgba(204,164,59,0.2);"></div>
      <div style="flex:1;overflow:hidden;">
        <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);margin-bottom:2px;">${esc(track.title)}</div>
        <div style="font-size:0.73rem;color:#cca43b;">${esc(artist?.name || track.artist || '—')}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${filterBadges}${exclBadge}</div>
      </div>
      <div style="display:flex;gap:7px;flex-shrink:0;">
        <button class="adm-row-btn" onclick="openTrackModal('${track.id}', '${track.section || 'latest'}')" style="background:rgba(204,164,59,0.15);border:1px solid rgba(204,164,59,0.4);color:#cca43b;">
          <i data-lucide="edit" style="width:13px;height:13px;"></i>
        </button>
        <button class="adm-row-btn" onclick="deleteItem('tracks','${track.id}','${track.section === 'exclusive' || track.is_exclusive ? 'exclusive' : 'latest'}')" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444;">
          <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
        </button>
      </div>
    </div>`;
}

// ─── Artists ─────────────────────────────────────────────────
function renderArtists() {
  const panel = document.getElementById('section-artists');
  if (!panel) return;
  panel.innerHTML = sectionHeader(
    'الفنانون',
    'المميزون ⭐ يظهرون في قسم كبار الفنانين',
    `openArtistModal(null)`,
    'إضافة فنان'
  ) + `<div class="adm-grid-2" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;">
    ${artists.map(a => artistCardHTML(a)).join('')}
  </div>`;
  safeCreateIcons();
}

function artistCardHTML(artist) {
  return `
    <div class="adm-artist-card" style="border-color:${artist.is_featured ? 'rgba(204,164,59,0.4)' : 'var(--border-color)'};">
      <div style="height:95px;background-image:url('${artist.image_url || ''}');background-size:cover;background-position:center;background-color:var(--bg-tertiary);position:relative;">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 50%);"></div>
        ${artist.is_featured ? `<div style="position:absolute;top:7px;right:7px;background:rgba(204,164,59,0.92);padding:2px 7px;border-radius:5px;font-size:0.65rem;font-weight:800;color:#000;">⭐ كبار الفنانين</div>` : ''}
      </div>
      <div style="padding:12px 14px;">
        <div style="font-weight:800;font-size:0.92rem;margin-bottom:2px;color:var(--text-primary);">${esc(artist.name)}</div>
        <div style="color:#cca43b;font-size:0.73rem;margin-bottom:10px;">${esc(artist.specialty || '')}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="toggleFeatured('${artist.id}')" style="flex:1;padding:6px;font-size:0.72rem;font-weight:700;background:${artist.is_featured ? 'rgba(204,164,59,0.15)' : 'var(--bg-tertiary)'};border:1px solid ${artist.is_featured ? 'rgba(204,164,59,0.4)' : 'var(--border-color)'};border-radius:8px;color:${artist.is_featured ? '#cca43b' : 'var(--text-secondary)'};font-family:'Cairo',sans-serif;cursor:pointer;">
            ${artist.is_featured ? '⭐ مميز' : '☆ تمييز'}
          </button>
          <button class="adm-row-btn" onclick="openArtistModal('${artist.id}')" style="background:rgba(204,164,59,0.15);border:1px solid rgba(204,164,59,0.4);color:#cca43b;">
            <i data-lucide="edit" style="width:13px;height:13px;"></i>
          </button>
          <button class="adm-row-btn" onclick="deleteItem('artists','${artist.id}','artists')" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444;">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
          </button>
        </div>
      </div>
    </div>`;
}

// ─── Filters ─────────────────────────────────────────────────
function renderFilters() {
  const panel = document.getElementById('section-filters');
  if (!panel) return;

  const pills = filters.map(f => {
    const isStyle = f.filter_group === 'style';
    return `
      <div class="adm-filter-pill" style="background:${isStyle ? 'rgba(204,164,59,0.08)' : 'rgba(168,85,247,0.08)'};border:1px solid ${isStyle ? '#cca43b' : '#a855f7'};">
        <span style="font-size:0.85rem;">${isStyle ? '🎵' : '🏷️'}</span>
        <span style="font-weight:700;font-size:0.84rem;color:var(--text-primary);">${esc(f.label)}</span>
        <span style="font-size:0.65rem;opacity:0.7;padding:2px 6px;background:var(--bg-tertiary);border-radius:10px;color:var(--text-secondary);">${isStyle ? 'نمط' : 'نوع'}</span>
        <button class="adm-sm-btn" onclick="openFilterModal('${f.id}')" style="background:rgba(204,164,59,0.2);border:1px solid rgba(204,164,59,0.5);color:#cca43b;">
          <i data-lucide="edit" style="width:12px;height:12px;"></i>
        </button>
        <button class="adm-sm-btn" onclick="deleteItem('filters','${f.id}','filters')" style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);color:#ef4444;">
          <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
        </button>
      </div>`;
  }).join('');

  panel.innerHTML = sectionHeader(
    'الفلاتر',
    'التبويبات التي تظهر في صفحة كل فنان لفلترة أعماله',
    `openFilterModal(null)`,
    'إضافة فلتر'
  ) + `
    <div style="display:flex;flex-wrap:wrap;gap:10px;">${pills}</div>
    <div style="margin-top:14px;padding:12px 14px;background:rgba(204,164,59,0.06);border-radius:10px;border:1px dashed rgba(204,164,59,0.22);color:#9c9b96;font-size:0.77rem;line-height:1.75;">
      💡 الفلاتر المميزة بـ 🎵 تظهر كخيار لنمط العمل (مع/بدون موسيقى)، بينما المميزة بـ 🏷️ تظهر لنوع العمل (شيلات/زفات).
    </div>`;
  safeCreateIcons();
}

// ═══════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════
async function upsertRow(table, data, sectionKey) {
  if (!dbClient) {
    showToast('⚠️ لا يوجد اتصال بـ Supabase');
    return;
  }
  const isNew = !data.id;
  const { error } = isNew
    ? await dbClient.from(table).insert([data])
    : await dbClient.from(table).update(data).eq('id', data.id);

  if (error) {
    showToast('❌ خطأ: ' + error.message);
    return;
  }
  showToast('✓ تم الحفظ بنجاح');
  closeModal();
  await fetchAllData();
  renderSection(sectionKey);
}

async function deleteItem(table, id, sectionKey) {
  if (!dbClient) {
    showToast('⚠️ لا يوجد اتصال بـ Supabase');
    return;
  }
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  const { error } = await dbClient.from(table).delete().eq('id', id);
  if (error) { showToast('❌ خطأ أثناء الحذف'); return; }
  showToast('✓ تم الحذف بنجاح');
  await fetchAllData();
  renderSection(sectionKey);
}

async function toggleFeatured(artistId) {
  const artist = artists.find(a => String(a.id) === String(artistId));
  if (!artist) return;
  await upsertRow('artists', { ...artist, is_featured: !artist.is_featured }, 'artists');
}

// ═══════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════
function openModal(title, bodyHTML, wide = false) {
  const container = document.getElementById('adm-modal-container');
  container.style.display = 'block';
  container.innerHTML = `
    <div class="adm-modal-overlay" onclick="handleModalOutsideClick(event)">
      <div class="adm-modal ${wide ? 'wide' : ''}" onclick="event.stopPropagation()">
        <div class="adm-modal-header">
          <span style="font-weight:800;font-size:0.97rem;">${title}</span>
          <button onclick="closeModal()" style="background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:7px;padding:5px 8px;color:var(--text-secondary);cursor:pointer;">
            <i data-lucide="x" style="width:14px;height:14px;"></i>
          </button>
        </div>
        <div class="adm-modal-body">${bodyHTML}</div>
      </div>
    </div>`;
  safeCreateIcons();
}

function closeModal() {
  const container = document.getElementById('adm-modal-container');
  container.style.display = 'none';
  container.innerHTML = '';
}

function handleModalOutsideClick(e) {
  if (e.target.classList.contains('adm-modal-overlay')) closeModal();
}

// ─── Coming Soon Modal ───────────────────────────────────────
function openComingSoonModal(itemId) {
  const item = itemId ? comingSoon.find(c => String(c.id) === String(itemId)) : null;
  const title = item ? 'تعديل بطاقة قريباً' : 'إضافة بطاقة قريباً';

  openModal(title, `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label class="adm-lbl">العنوان</label>
        <input class="adm-inp" id="cs-title" value="${esc(item?.title || '')}" placeholder="مثال: ألبوم جديد قريباً">
      </div>
      <div><label class="adm-lbl">وصف قصير</label>
        <input class="adm-inp" id="cs-desc" value="${esc(item?.description || '')}" placeholder="وصف مختصر عن البطاقة">
      </div>
      <div id="cs-upload-wrap">${uploadZoneHTML('cs-image-url', item?.image_url || '', 'صورة البطاقة 🖼️', 'image/*')}</div>
      <div style="display:flex;gap:10px;margin-top:4px;">
        <button class="adm-btn-save" id="cs-save-btn" onclick="saveComingSoon('${item?.id || ''}')">
          <i data-lucide="save" style="width:14px;height:14px;"></i> حفظ
        </button>
        <button class="adm-btn-cancel" onclick="closeModal()">إلغاء</button>
      </div>
    </div>
  `);
}

async function saveComingSoon(id) {
  const data = {
    title: document.getElementById('cs-title').value.trim(),
    description: document.getElementById('cs-desc').value.trim(),
    image_url: document.getElementById('cs-image-url').value.trim(),
  };
  if (!data.title || !data.image_url) { showToast('⚠️ العنوان والصورة مطلوبان'); return; }
  if (id) data.id = id;
  await upsertRow('coming_soon', data, 'coming-soon');
}

// ─── Track Modal ─────────────────────────────────────────────
function openTrackModal(trackId, defaultSection = 'latest') {
  const track = trackId ? tracks.find(t => String(t.id) === String(trackId)) : null;
  const title = track ? 'تعديل مقطع' : 'إضافة مقطع صوتي';
  const selectedFilters = track?.filters || [];
  const styleFilters = filters.filter(f => f.filter_group === 'style');
  const catFilters = filters.filter(f => f.filter_group !== 'style');

  const artistOptions = artists.map(a =>
    `<option value="${a.id}" ${String(track?.artist_id) === String(a.id) ? 'selected' : ''}>${esc(a.name)}</option>`
  ).join('');

  const filterButtons = (list, color) => list.map(fl => {
    const on = selectedFilters.includes(fl.label);
    return `<button type="button" class="filter-toggle-btn" data-label="${esc(fl.label)}" data-color="${color}"
      style="padding:6px 14px;border-radius:30px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:600;font-size:0.8rem;
      border:1px solid ${on ? color : 'rgba(255,255,255,0.1)'};
      background:${on ? (color === '#cca43b' ? 'rgba(204,164,59,0.18)' : 'rgba(168,85,247,0.14)') : 'rgba(255,255,255,0.04)'};
      color:${on ? color : '#aeaeae'};transition:all 0.14s;">
      ${on ? '✓ ' : ''}${esc(fl.label)}
    </button>`;
  }).join('');

  openModal(title, `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label class="adm-lbl">عنوان المقطع</label>
        <input class="adm-inp" id="tr-title" value="${esc(track?.title || '')}" placeholder="مثال: زفة فخمة بالأسماء">
      </div>
      <div><label class="adm-lbl">الفنان</label>
        <select class="adm-inp" id="tr-artist">
          <option value="">— اختر فنان —</option>
          ${artistOptions}
        </select>
      </div>
      <div><label class="adm-lbl">القسم في الصفحة الرئيسية</label>
        <select class="adm-inp" id="tr-section">
          <option value="latest" ${(track?.section || defaultSection) === 'latest' ? 'selected' : ''}>أحدث الأعمال</option>
          <option value="exclusive" ${(track?.section || defaultSection) === 'exclusive' ? 'selected' : ''}>حصرياتنا</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="tr-excl" ${track?.is_exclusive ? 'checked' : ''} style="accent-color:#cca43b;width:15px;height:15px;">
        <label for="tr-excl" style="cursor:pointer;font-weight:700;color:#cca43b;font-size:0.85rem;">تمييز كحصري ★</label>
      </div>
      ${styleFilters.length > 0 ? `
      <div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;font-weight:700;">🎵 نمط العمل</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;" id="style-filter-group">${filterButtons(styleFilters, '#cca43b')}</div>
      </div>` : ''}
      ${catFilters.length > 0 ? `
      <div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;font-weight:700;">🏷️ نوع العمل</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;" id="cat-filter-group">${filterButtons(catFilters, '#a855f7')}</div>
      </div>` : ''}
      <div>${uploadZoneHTML('tr-cover-url', track?.cover_image_url || '', 'صورة الغلاف (اختيارية) 🖼️', 'image/*')}</div>
      <div>${uploadZoneHTML('tr-audio-url', track?.audio_url || '', 'ملف الصوت 🎵', 'audio/*', true)}</div>
      <div style="display:flex;gap:10px;margin-top:4px;">
        <button class="adm-btn-save" onclick="saveTrack('${track?.id || ''}')">
          <i data-lucide="save" style="width:14px;height:14px;"></i> حفظ المقطع
        </button>
        <button class="adm-btn-cancel" onclick="closeModal()">إلغاء</button>
      </div>
    </div>
  `, true);

  // Wire filter toggle buttons
  document.querySelectorAll('.filter-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.dataset.label;
      const color = btn.dataset.color;
      const isOn = btn.textContent.trim().startsWith('✓');
      if (isOn) {
        btn.textContent = label;
        btn.style.border = `1px solid rgba(255,255,255,0.1)`;
        btn.style.background = `rgba(255,255,255,0.04)`;
        btn.style.color = '#aeaeae';
      } else {
        btn.textContent = `✓ ${label}`;
        btn.style.border = `1px solid ${color}`;
        btn.style.background = color === '#cca43b' ? 'rgba(204,164,59,0.18)' : 'rgba(168,85,247,0.14)';
        btn.style.color = color;
      }
    });
  });
}

async function saveTrack(id) {
  const selectedFilterBtns = document.querySelectorAll('.filter-toggle-btn');
  const selectedFilters = [];
  selectedFilterBtns.forEach(btn => {
    if (btn.textContent.trim().startsWith('✓')) {
      selectedFilters.push(btn.dataset.label);
    }
  });

  const data = {
    title: document.getElementById('tr-title').value.trim(),
    artist_id: document.getElementById('tr-artist').value || null,
    section: document.getElementById('tr-section').value,
    is_exclusive: document.getElementById('tr-excl').checked,
    filters: selectedFilters,
    cover_image_url: document.getElementById('tr-cover-url').value.trim() || null,
    audio_url: document.getElementById('tr-audio-url').value.trim() || null,
  };
  if (!data.title) { showToast('⚠️ عنوان المقطع مطلوب'); return; }
  if (!data.audio_url) { showToast('⚠️ ملف الصوت مطلوب'); return; }
  if (id) data.id = id;
  const sKey = data.section === 'exclusive' ? 'exclusive' : 'latest';
  await upsertRow('tracks', data, sKey);
}

// ─── Artist Modal ────────────────────────────────────────────
function openArtistModal(artistId) {
  const artist = artistId ? artists.find(a => String(a.id) === String(artistId)) : null;
  const title = artist ? 'تعديل فنان' : 'إضافة فنان جديد';

  openModal(title, `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label class="adm-lbl">اسم الفنان</label>
        <input class="adm-inp" id="ar-name" value="${esc(artist?.name || '')}" placeholder="مثال: أحمد المنشد">
      </div>
      <div><label class="adm-lbl">التخصص</label>
        <input class="adm-inp" id="ar-specialty" value="${esc(artist?.specialty || '')}" placeholder="مثال: منشد ومؤدي زفات">
      </div>
      <div><label class="adm-lbl">وصف قصير</label>
        <input class="adm-inp" id="ar-desc" value="${esc(artist?.description || '')}" placeholder="وصف مختصر عن الفنان">
      </div>
      <div>${uploadZoneHTML('ar-image-url', artist?.image_url || '', 'صورة الفنان 🖼️', 'image/*')}</div>
      <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:rgba(204,164,59,0.06);border-radius:10px;border:1px solid rgba(204,164,59,0.2);">
        <input type="checkbox" id="ar-featured" ${artist?.is_featured ? 'checked' : ''} style="accent-color:#cca43b;width:16px;height:16px;">
        <label for="ar-featured" style="cursor:pointer;font-weight:700;color:#cca43b;font-size:0.85rem;">⭐ من كبار الفنانين (يظهر في قسم كبار الفنانين)</label>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px;">
        <button class="adm-btn-save" onclick="saveArtist('${artist?.id || ''}')">
          <i data-lucide="save" style="width:14px;height:14px;"></i> حفظ
        </button>
        <button class="adm-btn-cancel" onclick="closeModal()">إلغاء</button>
      </div>
    </div>
  `);
}

async function saveArtist(id) {
  const data = {
    name: document.getElementById('ar-name').value.trim(),
    specialty: document.getElementById('ar-specialty').value.trim(),
    description: document.getElementById('ar-desc').value.trim(),
    image_url: document.getElementById('ar-image-url').value.trim() || null,
    is_featured: document.getElementById('ar-featured').checked,
  };
  if (!data.name || !data.image_url) { showToast('⚠️ الاسم والصورة مطلوبان'); return; }
  if (id) data.id = id;
  await upsertRow('artists', data, 'artists');
}

// ─── Filter Modal ─────────────────────────────────────────────
function openFilterModal(filterId) {
  const f = filterId ? filters.find(x => String(x.id) === String(filterId)) : null;
  const title = f ? 'تعديل فلتر' : 'إضافة فلتر';
  const grp = f?.filter_group || 'style';

  openModal(title, `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label class="adm-lbl">اسم الفلتر</label>
        <input class="adm-inp" id="fl-label" value="${esc(f?.label || '')}" placeholder="مثال: مع موسيقى">
      </div>
      <div>
        <label class="adm-lbl">نوع الفلتر</label>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button type="button" id="fl-style-btn" onclick="setFilterGroup('style')" style="flex:1;padding:10px;border-radius:10px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:0.82rem;border:2px solid ${grp === 'style' ? '#cca43b' : 'var(--border-color)'};background:${grp === 'style' ? 'rgba(204,164,59,0.15)' : 'var(--bg-tertiary)'};color:${grp === 'style' ? '#cca43b' : 'var(--text-secondary)'};">
            🎵 نمط العمل<br><span style="font-size:0.68rem;opacity:0.8;">مثال: مع موسيقى، بدون موسيقى</span>
          </button>
          <button type="button" id="fl-cat-btn" onclick="setFilterGroup('category')" style="flex:1;padding:10px;border-radius:10px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:0.82rem;border:2px solid ${grp === 'category' ? '#a855f7' : 'var(--border-color)'};background:${grp === 'category' ? 'rgba(168,85,247,0.12)' : 'var(--bg-tertiary)'};color:${grp === 'category' ? '#a855f7' : 'var(--text-secondary)'};">
            🏷️ نوع العمل<br><span style="font-size:0.68rem;opacity:0.8;">مثال: شيلات، زفات، أناشيد</span>
          </button>
        </div>
        <input type="hidden" id="fl-group" value="${grp}">
      </div>
      <div style="display:flex;gap:10px;margin-top:4px;">
        <button class="adm-btn-save" onclick="saveFilter('${f?.id || ''}')">
          <i data-lucide="save" style="width:14px;height:14px;"></i> حفظ
        </button>
        <button class="adm-btn-cancel" onclick="closeModal()">إلغاء</button>
      </div>
    </div>
  `);
}

function setFilterGroup(grp) {
  document.getElementById('fl-group').value = grp;
  const styleBtn = document.getElementById('fl-style-btn');
  const catBtn = document.getElementById('fl-cat-btn');
  if (grp === 'style') {
    styleBtn.style.border = '2px solid #cca43b'; styleBtn.style.background = 'rgba(204,164,59,0.15)'; styleBtn.style.color = '#cca43b';
    catBtn.style.border = '2px solid var(--border-color)'; catBtn.style.background = 'var(--bg-tertiary)'; catBtn.style.color = 'var(--text-secondary)';
  } else {
    catBtn.style.border = '2px solid #a855f7'; catBtn.style.background = 'rgba(168,85,247,0.12)'; catBtn.style.color = '#a855f7';
    styleBtn.style.border = '2px solid var(--border-color)'; styleBtn.style.background = 'var(--bg-tertiary)'; styleBtn.style.color = 'var(--text-secondary)';
  }
}

async function saveFilter(id) {
  const data = {
    label: document.getElementById('fl-label').value.trim(),
    filter_group: document.getElementById('fl-group').value,
  };
  if (!data.label) { showToast('⚠️ اسم الفلتر مطلوب'); return; }
  if (id) data.id = id;
  await upsertRow('filters', data, 'filters');
}

// ═══════════════════════════════════════════════════════════
// FILE UPLOAD (Filebase S3 Direct)
// ═══════════════════════════════════════════════════════════
function uploadZoneHTML(inputId, currentUrl, label, accept, isAudio = false) {
  const isImage = !isAudio && accept.includes('image');
  const preview = isImage && currentUrl
    ? `<div style="position:absolute;inset:0;background-image:url('${currentUrl}');background-size:cover;background-position:center;opacity:0.25;border-radius:10px;"></div>`
    : '';
  const audioPreview = isAudio && currentUrl
    ? `<audio controls src="${currentUrl}" style="width:100%;border-radius:8px;margin-top:4px;"></audio>`
    : '';
  const imgPreview = isImage && currentUrl
    ? `<div style="height:70px;border-radius:8px;background-image:url('${currentUrl}');background-size:cover;background-position:center;border:1px solid rgba(204,164,59,0.25);margin-top:2px;"></div>`
    : '';

  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <label class="adm-lbl">${label}</label>
      <div class="upload-zone" id="zone-${inputId}" onclick="triggerFileInput('${inputId}', '${accept}')"
        ondragover="event.preventDefault();this.classList.add('drag-over');"
        ondragleave="this.classList.remove('drag-over');"
        ondrop="event.preventDefault();this.classList.remove('drag-over');handleFileDrop(event,'${inputId}','${accept}');">
        ${preview}
        <div style="position:relative;z-index:1;" id="zone-inner-${inputId}">
          <div style="font-size:1.8rem;margin-bottom:6px;">${isAudio ? '🎵' : '🖼️'}</div>
          <div style="font-size:0.82rem;color:#cca43b;font-weight:700;margin-bottom:3px;">${currentUrl ? 'تغيير الملف' : 'رفع ملف من الجهاز'}</div>
          <div style="font-size:0.72rem;color:#6e6e6e;">اضغط أو اسحب الملف هنا</div>
          ${isAudio && currentUrl ? `<div style="font-size:0.7rem;color:#059669;margin-top:4px;">✓ تم رفع ملف مسبقاً</div>` : ''}
        </div>
      </div>
      ${audioPreview}
      ${imgPreview}
      <div style="position:relative;">
        <input class="adm-inp" id="${inputId}" value="${currentUrl || ''}" placeholder="${isAudio ? 'أو الصق رابط الصوت هنا...' : 'أو الصق رابط الصورة هنا...'}" style="font-size:0.78rem;padding-right:34px;color:#888;" oninput="">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:0.75rem;color:#6e6e6e;">🔗</span>
      </div>
    </div>`;
}

function triggerFileInput(inputId, accept) {
  const el = document.createElement('input');
  el.type = 'file';
  el.accept = accept;
  el.onchange = (e) => uploadFile(e.target.files[0], inputId);
  el.click();
}

function handleFileDrop(event, inputId, accept) {
  const file = event.dataTransfer.files[0];
  if (file) uploadFile(file, inputId);
}

async function uploadFile(file, inputId) {
  if (!file) return;
  const zoneInner = document.getElementById(`zone-inner-${inputId}`);
  if (zoneInner) zoneInner.innerHTML = `<div style="color:#cca43b;font-size:0.85rem;font-weight:700;"><div style="font-size:1.5rem;margin-bottom:6px;">⏳</div>جاري الرفع...</div>`;

  const isImage = file.type.startsWith('image/');

  try {
    let url = '';

    if (isImage) {
      // ─── رفع الصور إلى Supabase Storage ───────────────────
      if (!dbClient) throw new Error('Supabase غير متصل');

      const ext = file.name.split('.').pop();
      const filePath = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await dbClient.storage
        .from('images')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (error) throw new Error(error.message);

      const { data: urlData } = dbClient.storage.from('images').getPublicUrl(filePath);
      url = urlData.publicUrl;

    } else {
      // ─── رفع الصوتيات إلى Filebase S3 ──────────────────────
      if (typeof AWS === 'undefined') throw new Error('مكتبة AWS غير محملة');

      const key = `audio/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

      AWS.config.update({
        accessKeyId: FILEBASE_KEY,
        secretAccessKey: FILEBASE_SECRET,
        region: 'us-east-1',
        signatureVersion: 'v4',
      });

      const s3 = new AWS.S3({ endpoint: FILEBASE_EP, s3ForcePathStyle: true });

      await s3.upload({
        Bucket: FILEBASE_BUCKET,
        Key: key,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read',
      }).promise();

      url = `https://${FILEBASE_BUCKET}.s3.filebase.io/${key}`;
    }

    // حفظ الرابط في الحقل المخفي
    const input = document.getElementById(inputId);
    if (input) input.value = url;

    // تحديث منطقة الرفع
    if (zoneInner) {
      zoneInner.innerHTML = `
        <div style="font-size:1.8rem;margin-bottom:6px;">${isImage ? '🖼️' : '🎵'}</div>
        <div style="font-size:0.82rem;color:#059669;font-weight:700;">✓ تم الرفع بنجاح</div>
        <div style="font-size:0.7rem;color:#6e6e6e;margin-top:4px;">${file.name}</div>`;
    }

    // معاينة الصوت
    if (!isImage) {
      const zone = document.getElementById(`zone-${inputId}`);
      if (zone && zone.parentNode) {
        let audioEl = zone.parentNode.querySelector('audio');
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.controls = true;
          audioEl.style = 'width:100%;border-radius:8px;margin-top:4px;';
          zone.parentNode.insertBefore(audioEl, zone.nextSibling);
        }
        audioEl.src = url;
      }
    }

    showToast('✓ تم رفع الملف بنجاح');

  } catch (err) {
    console.error('فشل رفع الملف:', err);
    if (zoneInner) zoneInner.innerHTML = `<div style="color:#ef4444;font-size:0.85rem;">⚠️ فشل الرفع: ${err.message}</div>`;
    showToast('❌ فشل في رفع الملف');
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function emptyState() {
  return `<div class="adm-empty"><div style="font-size:2rem;margin-bottom:8px;">📂</div><div style="font-size:0.84rem;">لا توجد عناصر بعد. أضف أول عنصر الآن.</div></div>`;
}

function showToast(msg) {
  const toast = document.getElementById('adm-toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2600);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
