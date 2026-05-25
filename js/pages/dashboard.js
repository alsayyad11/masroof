/* ============================================================
   MASROOF — DASHBOARD PAGE
   ============================================================ */
import { t, formatCurrency, formatRelativeDate, formatPercent, getMonthRange, getCurrentMonth, getLanguage } from '../utils.js';
import { getDashboardSummary, getMonthlyTrend, getCategorySpending, getTransactions, getBudgets, getBudgetSpending } from '../services/data.js';
import { drawBarChart, drawDonutChart } from '../components/charts.js';

let userId, userCurrency = 'USD';
let summaryData = {}, trendData = [], categoryData = [], recentTx = [], budgets = [];

export async function initDashboard(uid, profile) {
  userId = uid;
  userCurrency = profile?.currency || 'USD';
  renderSkeleton();
  await loadData();
  render();
  window.addEventListener('languagechange', render);
  window.addEventListener('resize', () => redrawCharts());
}

function renderSkeleton() {
  const el = document.getElementById('page-content');
  if (!el) return;
  el.innerHTML = `
    <div class="page-header">
      <div><div class="skeleton skeleton-title" style="width:200px;height:32px;"></div><div class="skeleton skeleton-text" style="width:140px;margin-top:8px;"></div></div>
    </div>
    <div class="stats-grid">
      ${[1,2,3,4].map(() => `<div class="stat-card"><div class="skeleton skeleton-card"></div></div>`).join('')}
    </div>
    <div class="dashboard-grid">
      <div class="card"><div class="skeleton" style="height:280px;"></div></div>
      <div class="card"><div class="skeleton" style="height:280px;"></div></div>
    </div>`;
}

async function loadData() {
  const { year, month } = getCurrentMonth();
  const { start, end } = getMonthRange(year, month);
  const lastMonth = getMonthRange(year, month - 1 || 12, month === 1 ? year - 1 : year);

  const [summary, trend, categories, recent, budgetList] = await Promise.all([
    getDashboardSummary(userId, start, end).catch(() => ({ totalBalance: 0, income: 0, expenses: 0, net: 0, transactions: [] })),
    getMonthlyTrend(userId, 6).catch(() => []),
    getCategorySpending(userId, start, end).catch(() => []),
    getTransactions(userId, { start_date: start, end_date: end, limit: 8 }).catch(() => []),
    getBudgets(userId).catch(() => []),
  ]);

  summaryData = summary;
  trendData = trend;
  categoryData = categories;
  recentTx = recent;
  budgets = budgetList;

  // Budget spending
  const spending = await getBudgetSpending(userId, budgets, start, end).catch(() => ({}));
  budgets = budgets.map(b => ({ ...b, spent: spending[b.category_id] || 0 }));
}

function render() {
  const el = document.getElementById('page-content');
  if (!el) return;

  const { totalBalance = 0, income = 0, expenses = 0, net = 0 } = summaryData;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${t('dashboard_title')}</h1>
        <p class="page-subtitle">${t('dashboard_subtitle')}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="btn-add-tx">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${t('add_transaction')}
        </button>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="stats-grid">
      ${statCard(t('total_balance'), formatCurrency(totalBalance, userCurrency), 'balance', null, '#ff4f00')}
      ${statCard(t('monthly_income'), formatCurrency(income, userCurrency), 'income', null, '#1a8a5a')}
      ${statCard(t('monthly_expenses'), formatCurrency(expenses, userCurrency), 'expense', null, '#c0392b')}
      ${statCard(t('net_savings'), formatCurrency(net, userCurrency), 'savings', null, net >= 0 ? '#1a8a5a' : '#c0392b')}
    </div>

    <!-- Charts row -->
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${t('income_vs_expense')}</span>
          <span class="text-caption text-muted">${t('this_month')}</span>
        </div>
        <div style="position:relative;height:260px;">
          <canvas id="bar-chart" style="width:100%;height:100%;display:block;"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">${t('category_breakdown')}</span>
        </div>
        <div style="display:flex;gap:var(--sp-lg);align-items:center;">
          <div style="position:relative;width:140px;height:140px;flex-shrink:0;">
            <canvas id="donut-chart" style="width:140px;height:140px;display:block;"></canvas>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--sp-sm);min-width:0;">
            ${categoryData.slice(0, 5).map(cat => `
              <div style="display:flex;align-items:center;gap:var(--sp-sm);">
                <div style="width:10px;height:10px;border-radius:50%;background:${cat.color || '#ff4f00'};flex-shrink:0;"></div>
                <span class="truncate text-caption" style="flex:1;">${getLanguage() === 'ar' && cat.name_ar ? cat.name_ar : cat.name}</span>
                <span class="text-caption font-semibold">${formatCurrency(cat.total, userCurrency)}</span>
              </div>
            `).join('') || `<p class="text-caption text-muted">${t('no_data')}</p>`}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom row: Recent Transactions + Budget Status -->
    <div class="dashboard-grid" style="margin-top:var(--sp-xl);">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${t('recent_transactions')}</span>
          <button class="btn btn-ghost btn-sm" id="btn-view-all-tx">${t('view_all')}</button>
        </div>
        ${recentTx.length ? `
          <div class="table-wrapper">
            <table class="table">
              <thead><tr>
                <th>${t('description')}</th>
                <th>${t('category')}</th>
                <th>${t('date')}</th>
                <th style="text-align:right;">${t('amount')}</th>
              </tr></thead>
              <tbody>
                ${recentTx.map(tx => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--sp-sm);">
                        <div class="cat-icon" style="background:${tx.category?.color ? tx.category.color + '22' : 'var(--clr-canvas-raised)'};">
                          <span style="font-size:14px;">${tx.category?.icon || '📦'}</span>
                        </div>
                        <span class="font-medium truncate" style="max-width:160px;">${tx.description || '—'}</span>
                      </div>
                    </td>
                    <td><span class="text-caption text-muted">${getLanguage() === 'ar' && tx.category?.name_ar ? tx.category.name_ar : (tx.category?.name || '—')}</span></td>
                    <td><span class="text-caption text-muted">${formatRelativeDate(tx.date)}</span></td>
                    <td style="text-align:right;">
                      <span class="${tx.type === 'income' ? 'amount-income' : tx.type === 'expense' ? 'amount-expense' : 'amount-neutral'}">
                        ${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}${formatCurrency(tx.amount, tx.account?.currency || userCurrency)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state" style="padding:var(--sp-2xl) var(--sp-lg);">
            <div class="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--clr-body-mid)" stroke-width="1.5" stroke-linecap="round"><path d="M3 3h18v18H3z" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <p class="empty-state-title">${t('no_transactions')}</p>
            <p class="empty-state-desc">${t('no_transactions_sub')}</p>
          </div>
        `}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">${t('top_budgets')}</span>
          <button class="btn btn-ghost btn-sm" id="btn-view-all-budgets">${t('view_all')}</button>
        </div>
        ${budgets.length ? budgets.slice(0, 4).map(b => {
          const pct = formatPercent(b.spent, b.amount);
          const status = pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success';
          const remaining = Number(b.amount) - Number(b.spent);
          return `
            <div style="margin-bottom:var(--sp-lg);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-xs);">
                <div style="display:flex;align-items:center;gap:var(--sp-sm);">
                  <div class="cat-icon" style="width:28px;height:28px;background:${b.category?.color ? b.category.color + '22' : 'var(--clr-canvas-raised)'};">
                    <span style="font-size:12px;">${b.category?.icon || '📦'}</span>
                  </div>
                  <span class="text-caption font-semibold">${b.name}</span>
                </div>
                <span class="text-caption text-muted">${pct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${status}" style="width:${Math.min(pct, 100)}%;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:var(--sp-xs);">
                <span class="text-fine text-muted">${formatCurrency(b.spent, userCurrency)} ${t('budget_of')} ${formatCurrency(b.amount, userCurrency)}</span>
                <span class="text-fine ${status === 'error' ? 'text-error' : 'text-muted'}">
                  ${remaining >= 0 ? t('budget_remaining', { amount: formatCurrency(remaining, userCurrency) }) : t('overspent', { amount: formatCurrency(Math.abs(remaining), userCurrency) })}
                </span>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="empty-state" style="padding:var(--sp-xl);">
            <p class="empty-state-title">${t('no_budgets')}</p>
            <p class="empty-state-desc">${t('no_budgets_sub')}</p>
          </div>
        `}
      </div>
    </div>
  `;

  // Wire up navigation buttons
  document.getElementById('btn-add-tx')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'transactions', action: 'add' } }));
  });
  document.getElementById('btn-view-all-tx')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'transactions' } }));
  });
  document.getElementById('btn-view-all-budgets')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'budgets' } }));
  });

  // Draw charts after DOM is rendered
  requestAnimationFrame(() => redrawCharts());
}

function redrawCharts() {
  drawBarChart('bar-chart', trendData.length ? trendData : [{ month: 'Now', income: summaryData.income || 0, expenses: summaryData.expenses || 0 }]);
  drawDonutChart('donut-chart', categoryData.slice(0, 6).map(c => ({ color: c.color || '#ff4f00', value: c.total })),
    categoryData.length ? formatCurrency(categoryData.reduce((s, c) => s + c.total, 0), userCurrency) : '');
}

function statCard(label, value, type, change, color) {
  const iconMap = {
    balance:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    income:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    expense:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
    savings:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>`,
  };
  return `
    <div class="stat-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--sp-md);">
        <span class="stat-card-label">${label}</span>
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${iconMap[type] || ''}</div>
      </div>
      <div class="stat-card-value" style="color:${color};">${value}</div>
    </div>`;
}
