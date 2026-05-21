import React, { useEffect, useRef, useCallback } from 'react';
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_ROW = { off_duty: 0, sleeper: 1, driving: 2, on_duty: 3 };

const ROW_COLOR = {
  off_duty: '#64748b',
  sleeper:  '#7c3aed',
  driving:  '#dc2626',
  on_duty:  '#d97706',
};

const HOUR_LABELS = [
  'M','1','2','3','4','5','6','7','8','9','10','11',
  'N','1','2','3','4','5','6','7','8','9','10','11','M',
];

// ─── drawing function ──────────────────────────────────────────────────────────

function drawLog(canvas, dayData, driverInfo = {}) {
  if (!canvas || !dayData) return;

  const dpr  = window.devicePixelRatio || 1;
  const W    = canvas.offsetWidth  || 900;
  const H    = canvas.offsetHeight || 320;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // ── Layout ────────────────────────────────────────────────────────────────
  const HEADER_H   = 78;
  const HLABEL_H   = 22;   // hour label strip above grid
  const FOOTER_H   = 46;
  const GRID_TOP   = HEADER_H + HLABEL_H;
  const GRID_H     = H - GRID_TOP - FOOTER_H;
  const ROW_H      = GRID_H / 4;
  const LEFT_W     = 116;
  const RIGHT_PAD  = 8;
  const GRID_W     = W - LEFT_W - RIGHT_PAD;
  const HOUR_W     = GRID_W / 24;

  // ── helpers ───────────────────────────────────────────────────────────────
  const gridX = (hour) => LEFT_W + (hour / 24) * GRID_W;
  const rowY  = (row)  => GRID_TOP + row * ROW_H + ROW_H / 2;

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // ── Header ────────────────────────────────────────────────────────────────
  // Navy gradient
  const grad = ctx.createLinearGradient(0, 0, W, HEADER_H);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(1, '#1e40af');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);

  // DOT badge (manual rounded rect for max browser compat)
  ctx.fillStyle = '#f59e0b';
  const [bx, by, bw, bh, br] = [10, 10, 46, 46, 4];
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 10px Inter,system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DOT', 33, 28);
  ctx.font = '7px Inter,system-ui,sans-serif';
  ctx.fillText('395.8', 33, 40);
  ctx.fillText('FORM', 33, 50);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Inter,system-ui,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("DRIVER'S DAILY LOG", 66, 28);

  ctx.font = '10px Inter,system-ui,sans-serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('Property-Carrying Vehicle  |  70-hr / 8-day Cycle', 66, 44);
  ctx.fillText(`Date: ${dayData.date}  |  Day ${dayData.day_number} of Trip`, 66, 58);

  // Totals in header (right side)
  const tot = dayData.totals || {};
  const totItems = [
    { label: 'OFF DUTY',  val: tot.off_duty || 0, color: '#94a3b8' },
    { label: 'SLEEPER',   val: tot.sleeper  || 0, color: '#a78bfa' },
    { label: 'DRIVING',   val: tot.driving  || 0, color: '#f87171' },
    { label: 'ON DUTY',   val: tot.on_duty  || 0, color: '#fbbf24' },
  ];
  let tx = W - 10;
  for (let i = totItems.length - 1; i >= 0; i--) {
    const { label, val, color } = totItems[i];
    const h   = Math.floor(val);
    const m   = Math.round((val - h) * 60);
    const str = `${h}h${m > 0 ? ` ${m}m` : ''}`;

    ctx.font = 'bold 12px Inter,system-ui,sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.fillText(str, tx, 30);

    ctx.font = '8px Inter,system-ui,sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(label, tx, 42);
    tx -= ctx.measureText(str).width + 28;
  }

  // ── Hour label strip ──────────────────────────────────────────────────────
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(LEFT_W, HEADER_H, GRID_W + RIGHT_PAD, HLABEL_H);

  // Hour markers
  ctx.textAlign = 'center';
  for (let i = 0; i <= 24; i++) {
    const x = gridX(i);
    const lbl = HOUR_LABELS[i] || '';

    // Major tick
    ctx.strokeStyle = i % 6 === 0 ? '#94a3b8' : '#cbd5e1';
    ctx.lineWidth   = i % 6 === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, HEADER_H + HLABEL_H - 5);
    ctx.lineTo(x, HEADER_H + HLABEL_H);
    ctx.stroke();

    ctx.fillStyle = i % 6 === 0 ? '#334155' : '#94a3b8';
    ctx.font      = `${i % 6 === 0 ? 'bold ' : ''}9px Inter,system-ui,sans-serif`;
    ctx.fillText(lbl, x, HEADER_H + 14);
  }

  // 6-hour sub-labels
  ['Midnight','6 AM','Noon','6 PM','Midnight'].forEach((l, i) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '7px Inter,system-ui,sans-serif';
    ctx.fillText(l, gridX(i * 6), HEADER_H + HLABEL_H - 6);
  });

  // ── Row label background ──────────────────────────────────────────────────
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, GRID_TOP, LEFT_W, GRID_H);

  // outer border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, GRID_TOP, W - RIGHT_PAD + 1, GRID_H);

  // vertical divider
  ctx.beginPath();
  ctx.moveTo(LEFT_W, GRID_TOP);
  ctx.lineTo(LEFT_W, GRID_TOP + GRID_H);
  ctx.stroke();

  // ── Grid lines ────────────────────────────────────────────────────────────
  // Horizontal row separators
  for (let r = 0; r <= 4; r++) {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = r === 0 || r === 4 ? 1.5 : 0.7;
    ctx.beginPath();
    ctx.moveTo(0,                GRID_TOP + r * ROW_H);
    ctx.lineTo(W - RIGHT_PAD,   GRID_TOP + r * ROW_H);
    ctx.stroke();
  }

  // Vertical hour lines
  for (let i = 0; i <= 24; i++) {
    const x = gridX(i);
    ctx.strokeStyle = i % 6 === 0 ? '#94a3b8' : '#e2e8f0';
    ctx.lineWidth   = i % 6 === 0 ? 0.8 : 0.3;
    ctx.beginPath();
    ctx.moveTo(x, GRID_TOP);
    ctx.lineTo(x, GRID_TOP + GRID_H);
    ctx.stroke();
  }

  // Quarter-hour minor lines
  for (let q = 0; q < 24 * 4; q++) {
    if (q % 4 === 0) continue;
    const x = LEFT_W + (q / (24 * 4)) * GRID_W;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth   = 0.3;
    ctx.beginPath();
    ctx.moveTo(x, GRID_TOP);
    ctx.lineTo(x, GRID_TOP + GRID_H);
    ctx.stroke();
  }

  // ── Row labels ────────────────────────────────────────────────────────────
  const ROW_LABELS = [
    ['Off Duty', ''],
    ['Sleeper', 'Berth'],
    ['Driving', ''],
    ['On Duty', '(Not Driving)'],
  ];
  const ROW_LINE_COLORS = ['#64748b', '#7c3aed', '#dc2626', '#d97706'];

  for (let r = 0; r < 4; r++) {
    const midY = GRID_TOP + r * ROW_H + ROW_H / 2;

    // Colored left accent bar
    ctx.fillStyle = ROW_LINE_COLORS[r];
    ctx.fillRect(0, GRID_TOP + r * ROW_H + 1, 4, ROW_H - 1);

    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    const [l1, l2] = ROW_LABELS[r];
    if (l2) {
      ctx.font = 'bold 9px Inter,system-ui,sans-serif';
      ctx.fillText(l1, 10, midY - 4);
      ctx.font = '8px Inter,system-ui,sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(l2, 10, midY + 7);
    } else {
      ctx.font = 'bold 9px Inter,system-ui,sans-serif';
      ctx.fillText(l1, 10, midY + 4);
    }

    // Row number (DOT format)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px Inter,system-ui,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(r + 1), LEFT_W - 6, GRID_TOP + r * ROW_H + ROW_H - 4);
  }

  // ── Activity lines ────────────────────────────────────────────────────────
  const acts = [...(dayData.activities || [])].sort((a, b) => a.start_hour - b.start_hour);

  // First pass: draw shaded background for each activity block
  for (const act of acts) {
    const row  = STATUS_ROW[act.status] ?? 0;
    const x1   = gridX(act.start_hour);
    const x2   = gridX(act.end_hour);
    const top  = GRID_TOP + row * ROW_H + 1;
    const bot  = GRID_TOP + (row + 1) * ROW_H - 1;

    ctx.fillStyle = ROW_COLOR[act.status] ? ROW_COLOR[act.status] + '18' : '#00000008';
    ctx.fillRect(x1, top, x2 - x1, bot - top);
  }

  // Second pass: draw the activity lines and vertical connectors
  let prevRow = -1;
  let prevX2  = -1;

  for (const act of acts) {
    const row  = STATUS_ROW[act.status] ?? 0;
    const x1   = gridX(act.start_hour);
    const x2   = gridX(act.end_hour);
    const cy   = rowY(row);
    const color = ROW_COLOR[act.status] || '#1e293b';

    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';

    // Vertical connector from previous row → this row
    if (prevRow !== -1 && prevRow !== row && Math.abs(x1 - prevX2) < 2) {
      const prevCY = rowY(prevRow);
      ctx.beginPath();
      ctx.moveTo(x1, prevCY);
      ctx.lineTo(x1, cy);
      ctx.stroke();
    }

    // Horizontal status line
    ctx.beginPath();
    ctx.moveTo(x1, cy);
    ctx.lineTo(x2, cy);
    ctx.stroke();

    prevRow = row;
    prevX2  = x2;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footTop = GRID_TOP + GRID_H;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, footTop, W, FOOTER_H);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0,   footTop);
  ctx.lineTo(W,   footTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0,   footTop + FOOTER_H);
  ctx.lineTo(W,   footTop + FOOTER_H);
  ctx.stroke();

  // Totals bar
  const COLS = [
    { key: 'off_duty', label: 'Off Duty',  color: '#64748b' },
    { key: 'sleeper',  label: 'Sleeper',   color: '#7c3aed' },
    { key: 'driving',  label: 'Driving',   color: '#dc2626' },
    { key: 'on_duty',  label: 'On Duty (Not Driving)', color: '#d97706' },
  ];

  ctx.font = 'bold 9px Inter,system-ui,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.fillText('TOTALS:', 10, footTop + 18);

  let fx = 76;
  for (const col of COLS) {
    const val = tot[col.key] || 0;
    const h   = Math.floor(val);
    const m   = Math.round((val - h) * 60);
    const str = `${h}:${String(m).padStart(2, '0')}`;

    // Colored swatch
    ctx.fillStyle = col.color;
    ctx.fillRect(fx, footTop + 7, 10, 10);

    ctx.fillStyle = '#334155';
    ctx.font = '9px Inter,system-ui,sans-serif';
    ctx.fillText(col.label, fx + 14, footTop + 17);

    ctx.font = 'bold 11px Inter,system-ui,sans-serif';
    ctx.fillStyle = col.color;
    ctx.fillText(str, fx + 14, footTop + 30);

    fx += Math.max(ctx.measureText(col.label).width + 30, 120);
  }

  // Hours recap bar (right side)
  const totalOnDuty = (tot.driving || 0) + (tot.on_duty || 0);
  ctx.font = '9px Inter,system-ui,sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(
    `Total on-duty: ${totalOnDuty.toFixed(1)}h  |  Carrier: Spotter Logistics`,
    W - 10,
    footTop + 20,
  );
  ctx.fillText('49 CFR § 395.8 — Property Carrying Driver', W - 10, footTop + 34);
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ELDLogSheet({ dayData, index, total }) {
  const canvasRef = useRef(null);

  const redraw = useCallback(() => {
    if (canvasRef.current && dayData) {
      drawLog(canvasRef.current, dayData);
    }
  }, [dayData]);

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(redraw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [redraw]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `eld-log-day-${dayData.day_number}-${dayData.date}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Sheet header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
            {dayData.day_number}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            Daily Log — {dayData.date}
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">
            Sheet {index + 1} of {total}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            title="Download as PNG"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            PNG
          </button>
          <button
            onClick={() => window.print()}
            title="Print"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 no-print"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="eld-canvas-wrap p-1">
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '320px' }}
        />
      </div>

      {/* Activity legend below canvas */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex flex-wrap gap-4">
          {(dayData.activities || [])
            .filter((a) => a.status !== 'off_duty' || a.end_hour - a.start_hour > 0.5)
            .map((act, i) => {
              const color = ROW_COLOR[act.status] || '#64748b';
              const h  = act.end_hour - act.start_hour;
              const hh = Math.floor(h);
              const mm = Math.round((h - hh) * 60);
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="h-2 w-8 rounded-full" style={{ background: color }} />
                  <span>{act.description}</span>
                  <span className="text-slate-400">
                    ({hh > 0 ? `${hh}h ` : ''}{mm > 0 ? `${mm}m` : ''})
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
