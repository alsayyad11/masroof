/* ============================================================
   MASROOF — UTILITIES
   i18n, theme, format, validation
   ============================================================ */

// ── i18n ───────────────────────────────────────────────────
import { en } from '../locales/en.js';
import { ar } from '../locales/ar.js';

const locales = { en, ar };
let currentLocale = 'en';

export function initI18n() {
  const saved = localStorage.getItem('masroof_lang') || 'en';
  setLanguage(saved, false);
}

export function setLanguage(lang, save = true) {
  currentLocale = locales[lang] ? lang : 'en';
  const html = document.documentElement;
  html.lang = currentLocale;
  html.dir  = currentLocale === 'ar' ? 'rtl' : 'ltr';
  if (save) localStorage.setItem('masroof_lang', currentLocale);

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const val = t(key);
    if (attr) el.setAttribute(attr, val);
    else el.textContent = val;
  });

  // Update lang button
  const btn = document.getElementById('btn-lang');
  if (btn) btn.textContent = currentLocale === 'ar' ? 'EN' : 'عر';

  // Dispatch event for pages to react
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLocale } }));
}

export function t(key, vars = {}) {
  const locale = locales[currentLocale] || en;
  let str = locale[key] || en[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return str;
}

export function getLanguage() { return currentLocale; }
export function isRTL() { return currentLocale === 'ar'; }

// ── Theme ──────────────────────────────────────────────────
let currentTheme = 'light';

export function initTheme() {
  const saved = localStorage.getItem('masroof_theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved || system, false);
}

export function setTheme(theme, save = true) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (save) localStorage.setItem('masroof_theme', theme);

  // Update theme toggle icon
  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
}

export function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

export function getTheme() { return currentTheme; }

// ── Format ─────────────────────────────────────────────────
export function formatCurrency(amount, currency = 'USD', locale = null) {
  const loc = locale || (getLanguage() === 'ar' ? 'ar-SA' : 'en-US');
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function formatAmount(amount, currency = 'USD') {
  return formatCurrency(Math.abs(amount), currency);
}

export function formatNumber(num, locale = null) {
  const loc = locale || (getLanguage() === 'ar' ? 'ar-SA' : 'en-US');
  return new Intl.NumberFormat(loc).format(num);
}

export function formatDate(dateStr, style = 'medium') {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const loc = getLanguage() === 'ar' ? 'ar-SA' : 'en-US';
  const options = {
    short:  { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long:   { year: 'numeric', month: 'long',  day: 'numeric' },
    full:   { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
  };
  return new Intl.DateTimeFormat(loc, options[style] || options.medium).format(date);
}

export function formatRelativeDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - date) / 86400000);

  if (diff === 0) return t('today');
  if (diff === 1) return t('yesterday');
  if (diff < 7)  return formatDate(dateStr, 'short');
  return formatDate(dateStr, 'medium');
}

export function formatPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0);
  return {
    start,
    end: `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
  };
}

export function getLast30Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  };
}

export function getDateRange(preset) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      const s = d.toISOString().split('T')[0];
      return { start: s, end: s };
    }
    case 'this_week': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return { start: d.toISOString().split('T')[0], end: today };
    }
    case 'last_week': {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    case 'this_month': {
      const { year, month } = getCurrentMonth();
      return getMonthRange(year, month);
    }
    case 'last_month': {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      return getMonthRange(d.getFullYear(), d.getMonth() + 1);
    }
    case 'last_3_months': {
      const s = new Date(now); s.setMonth(s.getMonth() - 3);
      return { start: s.toISOString().split('T')[0], end: today };
    }
    case 'this_year': {
      return { start: `${now.getFullYear()}-01-01`, end: today };
    }
    default:
      return getMonthRange(now.getFullYear(), now.getMonth() + 1);
  }
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ── Validation ─────────────────────────────────────────────
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(pwd) {
  return pwd && pwd.length >= 6;
}

export function validateAmount(val) {
  const n = parseFloat(val);
  return !isNaN(n) && n > 0;
}

export function validateRequired(val) {
  return val !== null && val !== undefined && String(val).trim() !== '';
}

// ── Color helpers ──────────────────────────────────────────
export const CATEGORY_COLORS = [
  '#ff4f00', '#e74c3c', '#e67e22', '#f39c12',
  '#27ae60', '#16a085', '#2980b9', '#8e44ad',
  '#2c3e50', '#7f8c8d', '#d35400', '#c0392b',
];

export const ACCOUNT_COLORS = [
  '#ff4f00', '#2196f3', '#4caf50', '#9c27b0',
  '#ff9800', '#00bcd4', '#f44336', '#607d8b',
];

export const GOAL_ICONS = ['🏠', '🚗', '✈️', '🎓', '💍', '📱', '💻', '🏖️', '🛒', '💊', '🎉', '💰'];
export const CATEGORY_ICONS = {
  food: '🍔', transport: '🚌', shopping: '🛍️', health: '💊',
  entertainment: '🎬', utilities: '⚡', rent: '🏠', salary: '💰',
  freelance: '💻', investment: '📈', education: '📚', travel: '✈️',
  clothing: '👔', sports: '⚽', restaurant: '🍽️', coffee: '☕',
  groceries: '🛒', insurance: '🛡️', phone: '📱', internet: '🌐',
  beauty: '💅', pets: '🐾', gifts: '🎁', other: '📦',
};
