/* ============================================================
   MASROOF — EXPORT SERVICE
   PDF, CSV, Excel exports
   ============================================================ */
import { formatCurrency, formatDate, t, getLanguage, isRTL } from '../utils.js';

// ── CSV Export ─────────────────────────────────────────────
export function exportCSV(transactions, filename = 'masroof-transactions') {
  const headers = ['Date', 'Description', 'Type', 'Category', 'Account', 'Amount', 'Status', 'Notes'];
  const rows = transactions.map(tx => [
    tx.date,
    `"${(tx.description || '').replace(/"/g, '""')}"`,
    tx.type,
    tx.category?.name || '',
    tx.account?.name || '',
    tx.amount,
    tx.status,
    `"${(tx.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// ── Excel Export ───────────────────────────────────────────
export function exportExcel(transactions, summary, filename = 'masroof-report') {
  // Build HTML table that Excel can open
  const currency = 'USD';
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"></head>
    <body>
    <h2>Masroof — Financial Report</h2>
    <table border="1">
      <thead><tr style="background:#201515;color:#fff;">
        <th>Date</th><th>Description</th><th>Type</th><th>Category</th>
        <th>Account</th><th>Amount</th><th>Status</th><th>Notes</th>
      </tr></thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td>${tx.date}</td>
            <td>${tx.description || ''}</td>
            <td>${tx.type}</td>
            <td>${tx.category?.name || ''}</td>
            <td>${tx.account?.name || ''}</td>
            <td>${tx.type === 'income' ? '' : '-'}${Number(tx.amount).toFixed(2)}</td>
            <td>${tx.status}</td>
            <td>${tx.notes || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </body></html>`;

  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel');
}

// ── PDF Export ─────────────────────────────────────────────
export function exportPDF(data, template = 'minimal') {
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to generate PDF'); return; }

  const { transactions = [], summary = {}, period = '', accounts = [] } = data;
  const currency = summary.currency || 'USD';
  const rtl = isRTL();
  const dir = rtl ? 'rtl' : 'ltr';

  const templates = {
    minimal:   buildMinimalTemplate(transactions, summary, period, currency, dir),
    corporate: buildCorporateTemplate(transactions, summary, period, currency, dir),
    modern:    buildModernTemplate(transactions, summary, period, currency, dir),
    dark:      buildDarkTemplate(transactions, summary, period, currency, dir),
  };

  const html = templates[template] || templates.minimal;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

function buildMinimalTemplate(transactions, summary, period, currency, dir) {
  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="UTF-8">
<title>Masroof — Financial Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; color: #201515; background: #fff; padding: 40px; font-size: 13px; direction: ${dir}; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #e0d9cf; }
  .brand { font-size: 24px; font-weight: 700; color: #201515; letter-spacing: -0.5px; }
  .brand span { color: #ff4f00; }
  .report-meta { text-align: right; color: #605d52; font-size: 12px; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .period { color: #605d52; font-size: 12px; margin-bottom: 32px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }
  .summary-card { background: #f8f4f0; border-radius: 8px; padding: 16px; }
  .summary-label { font-size: 11px; color: #939084; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .summary-value { font-size: 20px; font-weight: 700; color: #201515; }
  .income-value { color: #1a8a5a; }
  .expense-value { color: #c0392b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { font-size: 11px; font-weight: 600; color: #939084; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; border-bottom: 2px solid #e0d9cf; text-align: ${dir === 'rtl' ? 'right' : 'left'}; }
  td { padding: 10px 12px; border-bottom: 1px solid #f2ede5; font-size: 12px; color: #2f2a26; text-align: ${dir === 'rtl' ? 'right' : 'left'}; }
  tr:last-child td { border-bottom: none; }
  .type-income { color: #1a8a5a; font-weight: 600; }
  .type-expense { color: #c0392b; font-weight: 600; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0d9cf; text-align: center; color: #939084; font-size: 11px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Ma<span>sr</span>oof</div>
      <div style="color:#605d52;font-size:12px;margin-top:4px;">Personal Finance Report</div>
    </div>
    <div class="report-meta">
      <div style="font-weight:600;font-size:14px;">Financial Report</div>
      <div>${period}</div>
      <div>Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Total Income</div>
      <div class="summary-value income-value">${formatCurrency(summary.income || 0, currency)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Total Expenses</div>
      <div class="summary-value expense-value">${formatCurrency(summary.expenses || 0, currency)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Net Savings</div>
      <div class="summary-value">${formatCurrency((summary.income || 0) - (summary.expenses || 0), currency)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Transactions</div>
      <div class="summary-value">${transactions.length}</div>
    </div>
  </div>
  <h2>Transaction Details</h2>
  <p class="period">${period}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(tx => `
        <tr>
          <td>${formatDate(tx.date, 'medium')}</td>
          <td>${tx.description || '—'}</td>
          <td>${tx.category?.name || '—'}</td>
          <td>${tx.account?.name || '—'}</td>
          <td class="type-${tx.type}">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
          <td class="type-${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">Generated by Masroof • ${new Date().toLocaleDateString()} • masroof.app</div>
</body>
</html>`;
}

function buildCorporateTemplate(transactions, summary, period, currency, dir) {
  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="UTF-8">
<title>Masroof — Corporate Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; color: #201515; background: #fff; font-size: 13px; direction: ${dir}; }
  .top-bar { background: #201515; color: #fffefb; padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .brand span { color: #ff4f00; }
  .report-info { text-align: right; font-size: 12px; opacity: 0.8; }
  .content { padding: 40px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #ff4f00; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #ff4f00; }
  .summary-row { display: flex; gap: 16px; margin-bottom: 40px; }
  .summary-item { flex: 1; background: #f8f4f0; border-radius: 6px; padding: 20px; border-left: 4px solid #201515; }
  .summary-label { font-size: 11px; color: #939084; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .summary-value { font-size: 22px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #201515; color: #f8f4f0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 14px; text-align: ${dir === 'rtl' ? 'right' : 'left'}; }
  td { padding: 10px 14px; border-bottom: 1px solid #f2ede5; font-size: 12px; }
  tr:nth-child(even) { background: #fafafa; }
  .amount-income { color: #1a8a5a; font-weight: 700; }
  .amount-expense { color: #c0392b; font-weight: 700; }
  .footer { margin-top: 40px; padding: 16px 40px; background: #f8f4f0; text-align: center; color: #939084; font-size: 11px; }
  @media print { body { font-size: 12px; } }
</style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">Ma<span>sr</span>oof</div>
    <div class="report-info">
      <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Corporate Financial Report</div>
      <div>${period}</div>
    </div>
  </div>
  <div class="content">
    <div class="section-title">Financial Summary</div>
    <div class="summary-row">
      <div class="summary-item">
        <div class="summary-label">Total Income</div>
        <div class="summary-value" style="color:#1a8a5a">${formatCurrency(summary.income || 0, currency)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Expenses</div>
        <div class="summary-value" style="color:#c0392b">${formatCurrency(summary.expenses || 0, currency)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Net Balance</div>
        <div class="summary-value">${formatCurrency((summary.income || 0) - (summary.expenses || 0), currency)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Transactions</div>
        <div class="summary-value">${transactions.length}</div>
      </div>
    </div>
    <div class="section-title">Transaction Ledger</div>
    <table>
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td>${formatDate(tx.date)}</td>
            <td>${tx.description || '—'}</td>
            <td>${tx.category?.name || '—'}</td>
            <td>${tx.account?.name || '—'}</td>
            <td>${tx.type}</td>
            <td class="amount-${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">Masroof Financial Report — ${period} — Generated ${new Date().toLocaleDateString()}</div>
</body>
</html>`;
}

function buildModernTemplate(transactions, summary, period, currency, dir) {
  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="UTF-8">
<title>Masroof — Modern Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; background: #fffefb; color: #201515; font-size: 13px; direction: ${dir}; }
  .hero { background: linear-gradient(135deg, #201515 0%, #2f2a26 100%); color: #fffefb; padding: 48px 40px 40px; }
  .hero-brand { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin-bottom: 24px; }
  .hero-brand span { color: #ff4f00; }
  .hero-title { font-size: 16px; opacity: 0.7; margin-bottom: 32px; }
  .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .hero-stat-label { font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .hero-stat-value { font-size: 24px; font-weight: 700; }
  .body { padding: 40px; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .section-title { font-size: 16px; font-weight: 700; color: #201515; }
  .pill { background: #ff4f00; color: #fff; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; font-weight: 700; color: #939084; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 14px; border-bottom: 1px solid #e0d9cf; text-align: ${dir === 'rtl' ? 'right' : 'left'}; }
  td { padding: 12px 14px; border-bottom: 1px solid #f8f4f0; font-size: 12px; }
  tr:hover td { background: #f8f4f0; }
  .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .chip-income { background: #eaf7f0; color: #1a8a5a; }
  .chip-expense { background: #fdecea; color: #c0392b; }
  .amount-income { color: #1a8a5a; font-weight: 700; }
  .amount-expense { color: #c0392b; font-weight: 700; }
  .footer { text-align: center; padding: 24px; color: #c5c0b1; font-size: 11px; border-top: 1px solid #e0d9cf; margin-top: 40px; }
  @media print { .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="hero">
    <div class="hero-brand">Ma<span>sr</span>oof</div>
    <div class="hero-title">Financial Report • ${period}</div>
    <div class="hero-stats">
      <div>
        <div class="hero-stat-label">Income</div>
        <div class="hero-stat-value" style="color:#4ade80">${formatCurrency(summary.income || 0, currency)}</div>
      </div>
      <div>
        <div class="hero-stat-label">Expenses</div>
        <div class="hero-stat-value" style="color:#f87171">${formatCurrency(summary.expenses || 0, currency)}</div>
      </div>
      <div>
        <div class="hero-stat-label">Net</div>
        <div class="hero-stat-value">${formatCurrency((summary.income || 0) - (summary.expenses || 0), currency)}</div>
      </div>
      <div>
        <div class="hero-stat-label">Count</div>
        <div class="hero-stat-value">${transactions.length}</div>
      </div>
    </div>
  </div>
  <div class="body">
    <div class="section-header">
      <div class="section-title">Transactions</div>
      <div class="pill">${transactions.length} records</div>
    </div>
    <table>
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td style="color:#939084">${formatDate(tx.date, 'short')}</td>
            <td style="font-weight:500">${tx.description || '—'}</td>
            <td>${tx.category?.name || '—'}</td>
            <td>${tx.account?.name || '—'}</td>
            <td><span class="chip chip-${tx.type}">${tx.type}</span></td>
            <td class="amount-${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">Masroof • ${new Date().toLocaleDateString()} • masroof.app</div>
</body>
</html>`;
}

function buildDarkTemplate(transactions, summary, period, currency, dir) {
  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="UTF-8">
<title>Masroof — Dark Premium Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; background: #1a1410; color: #f2ede5; font-size: 13px; direction: ${dir}; min-height: 100vh; }
  .header { padding: 48px 48px 32px; border-bottom: 1px solid #362e26; display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: -1px; color: #f2ede5; }
  .brand span { color: #ff6120; }
  .report-meta { text-align: right; }
  .report-label { font-size: 11px; color: #756c5f; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .report-period { font-size: 14px; font-weight: 600; color: #e0d9cf; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #362e26; margin-bottom: 0; }
  .summary-item { background: #231d16; padding: 28px 24px; }
  .summary-item:first-child { border-radius: 0; }
  .s-label { font-size: 11px; color: #756c5f; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
  .s-value { font-size: 22px; font-weight: 700; color: #f2ede5; }
  .income-c { color: #34d399 !important; }
  .expense-c { color: #f87171 !important; }
  .table-section { padding: 40px 48px; }
  .table-title { font-size: 13px; font-weight: 700; color: #e0d9cf; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 10px; font-weight: 700; color: #756c5f; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 12px; border-bottom: 1px solid #362e26; text-align: ${dir === 'rtl' ? 'right' : 'left'}; }
  td { padding: 12px; border-bottom: 1px solid #2c2520; font-size: 12px; color: #c8bfb4; }
  tr:last-child td { border-bottom: none; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .tag-income  { background: rgba(52,211,153,0.15); color: #34d399; }
  .tag-expense { background: rgba(248,113,113,0.15); color: #f87171; }
  .footer { padding: 24px 48px; border-top: 1px solid #362e26; color: #4a4238; font-size: 11px; text-align: center; }
  @media print {
    body { background: #1a1410 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .summary { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Ma<span>sr</span>oof</div>
    <div class="report-meta">
      <div class="report-label">Financial Report</div>
      <div class="report-period">${period}</div>
      <div style="color:#4a4238;font-size:11px;margin-top:4px;">${new Date().toLocaleDateString()}</div>
    </div>
  </div>
  <div class="summary">
    <div class="summary-item">
      <div class="s-label">Income</div>
      <div class="s-value income-c">${formatCurrency(summary.income || 0, currency)}</div>
    </div>
    <div class="summary-item">
      <div class="s-label">Expenses</div>
      <div class="s-value expense-c">${formatCurrency(summary.expenses || 0, currency)}</div>
    </div>
    <div class="summary-item">
      <div class="s-label">Net Balance</div>
      <div class="s-value">${formatCurrency((summary.income || 0) - (summary.expenses || 0), currency)}</div>
    </div>
    <div class="summary-item">
      <div class="s-label">Transactions</div>
      <div class="s-value">${transactions.length}</div>
    </div>
  </div>
  <div class="table-section">
    <div class="table-title">Transaction Ledger</div>
    <table>
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td style="color:#756c5f">${formatDate(tx.date, 'short')}</td>
            <td style="color:#e0d9cf;font-weight:500">${tx.description || '—'}</td>
            <td>${tx.category?.name || '—'}</td>
            <td>${tx.account?.name || '—'}</td>
            <td><span class="tag tag-${tx.type}">${tx.type}</span></td>
            <td class="${tx.type === 'income' ? 'income-c' : 'expense-c'}" style="font-weight:700">
              ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">Generated by Masroof • ${new Date().toLocaleDateString()}</div>
</body>
</html>`;
}

// ── File download helper ───────────────────────────────────
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
