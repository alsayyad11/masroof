/* ============================================================
   MASROOF — CHARTS (Pure Canvas, no deps)
   ============================================================ */
import { formatCurrency, getLanguage } from '../utils.js';

function getStyle(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// ── Bar Chart ──────────────────────────────────────────────
export function drawBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const pad = { top: 24, right: 16, bottom: 48, left: 60 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const primaryClr = '#ff4f00';
  const inkClr = getStyle('--clr-ink') || '#201515';
  const borderClr = getStyle('--clr-border') || '#e0d9cf';
  const bodyClr = getStyle('--clr-body-mid') || '#939084';
  const successClr = '#1a8a5a';
  const canvasBg = getStyle('--clr-canvas-soft') || '#f8f4f0';

  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(...data.map(d => Math.max(d.income || 0, d.expenses || 0)), 1);
  const yStep = Math.ceil(maxVal / 4);

  // Grid lines
  ctx.strokeStyle = borderClr;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = bodyClr;
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(abbreviate(i * yStep), pad.left - 6, y + 4);
  }

  const n = data.length;
  const groupW = chartW / n;
  const barW = Math.min(groupW * 0.3, 20);

  data.forEach((d, i) => {
    const gx = pad.left + i * groupW + groupW / 2;

    // Income bar
    const incomeH = ((d.income || 0) / maxVal) * chartH;
    ctx.fillStyle = successClr;
    ctx.beginPath();
    ctx.roundRect(gx - barW - 2, pad.top + chartH - incomeH, barW, incomeH, [3, 3, 0, 0]);
    ctx.fill();

    // Expense bar
    const expenseH = ((d.expenses || 0) / maxVal) * chartH;
    ctx.fillStyle = primaryClr;
    ctx.beginPath();
    ctx.roundRect(gx + 2, pad.top + chartH - expenseH, barW, expenseH, [3, 3, 0, 0]);
    ctx.fill();

    // Month label
    ctx.fillStyle = bodyClr;
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.month, gx, H - 8);
  });

  // Legend
  const ly = H - 2;
  ctx.fillStyle = successClr;
  ctx.fillRect(pad.left, ly - 8, 12, 8);
  ctx.fillStyle = bodyClr;
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Income', pad.left + 16, ly);

  ctx.fillStyle = primaryClr;
  ctx.fillRect(pad.left + 80, ly - 8, 12, 8);
  ctx.fillStyle = bodyClr;
  ctx.fillText('Expenses', pad.left + 96, ly);
}

// ── Donut Chart ────────────────────────────────────────────
export function drawDonutChart(canvasId, data, centerLabel = '') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  if (!data.length) {
    ctx.fillStyle = getStyle('--clr-border') || '#e0d9cf';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) / 2 - 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = getStyle('--clr-canvas') || '#fffefb';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) / 2 - 48, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = W / 2;
  const cy = H / 2;
  const outerR = Math.min(W, H) / 2 - 12;
  const innerR = outerR * 0.62;
  const gap = 0.025;

  let startAngle = -Math.PI / 2;

  data.forEach(item => {
    const slice = (item.value / total) * (Math.PI * 2) - gap;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    startAngle += slice + gap;
  });

  // Inner circle (hole)
  const canvasBg = getStyle('--clr-canvas') || '#fffefb';
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = canvasBg;
  ctx.fill();

  // Center label
  if (centerLabel) {
    ctx.fillStyle = getStyle('--clr-ink') || '#201515';
    ctx.font = `700 16px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerLabel, cx, cy - 6);
    ctx.font = `400 11px Arial, sans-serif`;
    ctx.fillStyle = getStyle('--clr-body-mid') || '#939084';
    ctx.fillText('total', cx, cy + 12);
  }
}

// ── Line Chart ─────────────────────────────────────────────
export function drawLineChart(canvasId, data, color = '#ff4f00') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const pad = { top: 16, right: 16, bottom: 32, left: 52 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const borderClr = getStyle('--clr-border') || '#e0d9cf';
  const bodyClr = getStyle('--clr-body-mid') || '#939084';

  // Grid
  ctx.strokeStyle = borderClr;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = bodyClr;
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(abbreviate(((4 - i) / 4) * maxVal), pad.left - 4, y + 3);
  }

  if (data.length < 2) return;

  const points = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * chartW,
    y: pad.top + (1 - d.value / maxVal) * chartH,
  }));

  // Fill gradient
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, color + '30');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    ctx.bezierCurveTo(cp1x, points[i - 1].y, cp1x, points[i].y, points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = getStyle('--clr-canvas') || '#fff';
    ctx.fill();
  });

  // Labels
  data.forEach((d, i) => {
    ctx.fillStyle = bodyClr;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(d.label || '', points[i].x, H - 6);
  });
}

function abbreviate(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return Math.round(n).toString();
}
