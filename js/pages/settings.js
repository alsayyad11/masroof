/* ============================================================
   MASROOF — SETTINGS PAGE
   ============================================================ */
import { t, setLanguage, setTheme, getLanguage, getTheme, validateRequired, validatePassword } from '../utils.js';
import { getProfile, updateProfile, updatePassword, signOut } from '../services/auth.js';
import { showConfirm } from '../components/modal.js';
import { toast } from '../toast.js';

let userId, profile = {};

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'SAR', name: 'Saudi Riyal (ر.س)' },
  { code: 'AED', name: 'UAE Dirham (د.إ)' },
  { code: 'EGP', name: 'Egyptian Pound (E£)' },
  { code: 'KWD', name: 'Kuwaiti Dinar (KD)' },
  { code: 'QAR', name: 'Qatari Riyal (QR)' },
  { code: 'JOD', name: 'Jordanian Dinar (JD)' },
  { code: 'MAD', name: 'Moroccan Dirham (DH)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'TRY', name: 'Turkish Lira (₺)' },
];

export async function initSettings(uid, prof) {
  userId = uid;
  profile = prof || {};
  renderPage();
  window.addEventListener('languagechange', renderPage);
}

function renderPage() {
  const el = document.getElementById('page-content');
  if (!el) return;
  const currentLang  = getLanguage();
  const currentTheme = getTheme();

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${t('settings_title')}</h1>
        <p class="page-subtitle">${t('settings_subtitle')}</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:240px 1fr;gap:var(--sp-2xl);align-items:start;" id="settings-layout">
      <!-- Sidebar nav -->
      <div class="card" style="padding:var(--sp-md);position:sticky;top:calc(var(--topbar-height)+var(--sp-lg));">
        ${[
          { id: 'profile',    label: t('profile_settings'),   icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>` },
          { id: 'appearance', label: t('appearance'),          icon: `<circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>` },
          { id: 'language',   label: t('language_region'),     icon: `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>` },
          { id: 'currency',   label: t('currency_settings'),   icon: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` },
          { id: 'danger',     label: t('danger_zone'),         icon: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>` },
        ].map(item => `
          <a href="#${item.id}" class="nav-item" style="text-decoration:none;" data-settings-tab="${item.id}">
            <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${item.icon}</svg>
            <span>${item.label}</span>
          </a>`).join('')}
      </div>

      <!-- Sections -->
      <div style="display:flex;flex-direction:column;gap:var(--sp-2xl);">

        <!-- Profile -->
        <div class="card" id="profile">
          <div class="card-header"><span class="card-title">${t('profile_settings')}</span></div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-lg);">
            <div style="display:flex;align-items:center;gap:var(--sp-lg);">
              <div class="avatar avatar-lg" style="width:64px;height:64px;font-size:var(--text-xl);">
                ${(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="font-semibold" style="font-size:var(--text-md);">${profile.full_name || ''}</div>
                <div class="text-caption text-muted">${profile.email || ''}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">${t('profile_name')}</label>
                <input type="text" class="form-input" id="s-name" value="${profile.full_name || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">${t('profile_email')}</label>
                <input type="email" class="form-input" id="s-email" value="${profile.email || ''}" readonly style="opacity:0.6;cursor:not-allowed;">
              </div>
            </div>
            <button class="btn btn-primary" id="btn-save-profile" style="align-self:flex-start;">${t('save_changes')}</button>
          </div>
          <div class="divider"></div>
          <div class="card-header" style="margin-top:var(--sp-lg);"><span class="card-title">${t('change_password')}</span></div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-lg);">
            <div class="form-group">
              <label class="form-label">${t('new_password')}</label>
              <input type="password" class="form-input" id="s-new-pw" placeholder="••••••••">
              <div class="form-error hidden" id="s-pw-err"></div>
            </div>
            <div class="form-group">
              <label class="form-label">${t('confirm_password')}</label>
              <input type="password" class="form-input" id="s-confirm-pw" placeholder="••••••••">
              <div class="form-error hidden" id="s-confirm-err"></div>
            </div>
            <button class="btn btn-outline" id="btn-change-pw" style="align-self:flex-start;">${t('change_password')}</button>
          </div>
        </div>

        <!-- Appearance -->
        <div class="card" id="appearance">
          <div class="card-header"><span class="card-title">${t('appearance')}</span></div>
          <div class="form-group">
            <label class="form-label">${t('theme_label')}</label>
            <div style="display:flex;gap:var(--sp-md);">
              ${['light','dark'].map(theme => `
                <label style="flex:1;cursor:pointer;" class="theme-option">
                  <input type="radio" name="theme" value="${theme}" ${currentTheme === theme ? 'checked' : ''} style="display:none;">
                  <div style="border:2px solid ${currentTheme === theme ? 'var(--clr-primary)' : 'var(--clr-border)'};border-radius:var(--radius-md);padding:var(--sp-lg);text-align:center;cursor:pointer;transition:all var(--transition-fast);background:${theme === 'dark' ? '#1a1410' : '#fffefb'};">
                    <div style="font-size:22px;margin-bottom:var(--sp-xs);">${theme === 'dark' ? '🌙' : '☀️'}</div>
                    <div style="font-size:var(--text-xs);font-weight:600;color:${theme === 'dark' ? '#f2ede5' : '#201515'};">${t('theme_' + theme)}</div>
                  </div>
                </label>`).join('')}
            </div>
          </div>
        </div>

        <!-- Language -->
        <div class="card" id="language">
          <div class="card-header"><span class="card-title">${t('language_region')}</span></div>
          <div class="form-group">
            <label class="form-label">${t('language_label')}</label>
            <div style="display:flex;gap:var(--sp-md);">
              ${['en','ar'].map(lang => `
                <label style="flex:1;cursor:pointer;">
                  <input type="radio" name="lang" value="${lang}" ${currentLang === lang ? 'checked' : ''} style="display:none;" class="lang-radio">
                  <div class="lang-option" data-lang="${lang}" style="border:2px solid ${currentLang === lang ? 'var(--clr-primary)' : 'var(--clr-border)'};border-radius:var(--radius-md);padding:var(--sp-lg);text-align:center;cursor:pointer;transition:all var(--transition-fast);">
                    <div style="font-size:22px;margin-bottom:var(--sp-xs);">${lang === 'ar' ? '🇸🇦' : '🇺🇸'}</div>
                    <div style="font-size:var(--text-xs);font-weight:600;">${t('lang_' + lang)}</div>
                  </div>
                </label>`).join('')}
            </div>
          </div>
        </div>

        <!-- Currency -->
        <div class="card" id="currency">
          <div class="card-header"><span class="card-title">${t('currency_settings')}</span></div>
          <div class="form-group">
            <label class="form-label">${t('currency_label')}</label>
            <select class="form-select" id="s-currency" style="max-width:320px;">
              ${CURRENCIES.map(c => `<option value="${c.code}" ${(profile.currency || 'USD') === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" id="btn-save-currency" style="align-self:flex-start;margin-top:var(--sp-md);">${t('save_changes')}</button>
        </div>

        <!-- Danger Zone -->
        <div class="card" id="danger" style="border-color:var(--clr-error);">
          <div class="card-header"><span class="card-title" style="color:var(--clr-error);">${t('danger_zone')}</span></div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-lg);">
            <div>
              <div class="font-semibold">${t('delete_account_action')}</div>
              <div class="text-caption text-muted">${t('delete_account_warning')}</div>
            </div>
            <button class="btn btn-danger" id="btn-delete-account">${t('delete_account_action')}</button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Profile save
  document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
    const name = document.getElementById('s-name').value.trim();
    if (!name) return;
    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true; btn.textContent = t('saving');
    try {
      await updateProfile(userId, { full_name: name });
      profile.full_name = name;
      toast.success(t('success'), t('saved'));
    } catch (err) { toast.error(t('error'), err.message); }
    btn.disabled = false; btn.textContent = t('save_changes');
  });

  // Password change
  document.getElementById('btn-change-pw')?.addEventListener('click', async () => {
    const newPw    = document.getElementById('s-new-pw').value;
    const confirm  = document.getElementById('s-confirm-pw').value;
    let valid = true;
    if (!validatePassword(newPw)) { showErr('s-pw-err', t('password_min')); valid = false; } else hideErr('s-pw-err');
    if (newPw !== confirm)        { showErr('s-confirm-err', t('passwords_no_match')); valid = false; } else hideErr('s-confirm-err');
    if (!valid) return;
    const btn = document.getElementById('btn-change-pw');
    btn.disabled = true;
    try {
      await updatePassword(newPw);
      toast.success(t('success'), t('saved'));
      document.getElementById('s-new-pw').value = '';
      document.getElementById('s-confirm-pw').value = '';
    } catch (err) { toast.error(t('error'), err.message); }
    btn.disabled = false;
  });

  // Theme options
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', () => {
      setTheme(radio.value);
      renderPage();
    });
  });

  // Language options
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setLanguage(opt.dataset.lang);
      renderPage();
    });
  });

  // Currency save
  document.getElementById('btn-save-currency')?.addEventListener('click', async () => {
    const currency = document.getElementById('s-currency').value;
    try {
      await updateProfile(userId, { currency });
      profile.currency = currency;
      toast.success(t('success'), t('saved'));
    } catch (err) { toast.error(t('error'), err.message); }
  });

  // Delete account
  document.getElementById('btn-delete-account')?.addEventListener('click', () => {
    showConfirm({
      title: t('delete_account_action'),
      message: t('delete_account_warning'),
      confirmText: t('delete'),
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await signOut();
          window.location.href = 'login.html';
        } catch (err) { toast.error(t('error'), err.message); }
      },
    });
  });

  // Settings nav smooth scroll
  document.querySelectorAll('[data-settings-tab]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(a.dataset.settingsTab);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Responsive
  if (window.innerWidth < 768) {
    const layout = document.getElementById('settings-layout');
    if (layout) layout.style.gridTemplateColumns = '1fr';
    const sideNav = layout?.querySelector('.card');
    if (sideNav) sideNav.style.display = 'none';
  }
}

function showErr(id, msg) { const el = document.getElementById(id); if (el) { el.textContent = msg; el.classList.remove('hidden'); } }
function hideErr(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
