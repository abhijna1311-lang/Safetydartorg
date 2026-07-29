import { useState } from 'react';
import { Trash2, Info, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ImpactMarker {
  x: number;      // 0–100 % of the diagram width  (anchor of the selected part)
  y: number;      // 0–100 % of the diagram height
  label?: string; // exact "Point of impact" value
}

interface Props {
  markers: ImpactMarker[];
  onChange: (markers: ImpactMarker[]) => void;
  maxMarkers?: number;
}

// ── diagram model ───────────────────────────────────────────────────────────────
// Top-down bus on a 1000×460 canvas. FRONT is on the right (cab/windshield),
// REAR on the left; the vehicle's LEFT side runs along the top edge and the
// RIGHT side along the bottom. Every selectable part uses the exact "Point of
// impact" value from the requirements — big panels are tappable REGIONS, small
// parts (mirrors, wheel, bike rack, roof, underbody) are labelled DOTS.
const VB_W = 1000;
const VB_H = 460;

interface Region { id: string; x: number; y: number; w: number; h: number; rx: number; lx: number; ly: number }
interface Dot { id: string; cx: number; cy: number; lx: number; ly: number; anchor: 'start' | 'middle' | 'end' }

const REGIONS: Region[] = [
  { id: 'Rear Impact',       x: 96,  y: 165, w: 118, h: 160, rx: 20, lx: 155, ly: 250 },
  { id: 'Front Impact',      x: 726, y: 165, w: 130, h: 160, rx: 48, lx: 788, ly: 250 },
  { id: 'Left Side Impact',  x: 232, y: 150, w: 232, h: 52,  rx: 14, lx: 348, ly: 181 },
  { id: 'Left Sideswipe',    x: 476, y: 150, w: 232, h: 52,  rx: 14, lx: 592, ly: 181 },
  { id: 'Right Side Impact', x: 232, y: 288, w: 232, h: 52,  rx: 14, lx: 348, ly: 319 },
  { id: 'Right Sideswipe',   x: 476, y: 288, w: 232, h: 52,  rx: 14, lx: 592, ly: 319 },
];

const DOTS: Dot[] = [
  { id: 'Top',                   cx: 396, cy: 224, lx: 396, ly: 199, anchor: 'middle' },
  { id: 'Underbody',             cx: 560, cy: 266, lx: 560, ly: 291, anchor: 'middle' },
  { id: 'Bike Rack',             cx: 892, cy: 245, lx: 912, ly: 249, anchor: 'start'  },
  { id: "Driver's Side Mirror",  cx: 690, cy: 120, lx: 690, ly: 103, anchor: 'middle' },
  { id: 'Passenger Side Mirror', cx: 690, cy: 370, lx: 690, ly: 393, anchor: 'middle' },
  { id: 'Front/Rear Wheel',      cx: 300, cy: 360, lx: 300, ly: 385, anchor: 'middle' },
];

const REGION_CENTER = (r: Region) => ({ cx: r.x + r.w / 2, cy: r.y + r.h / 2 });

// ── colours (assigned in selection order) ─────────────────────────────────────────
const COLORS = [
  { bg: '#007DBA', glow: 'rgba(0,125,186,0.35)' },
  { bg: '#E85D04', glow: 'rgba(232,93,4,0.35)'  },
  { bg: '#7B2D8B', glow: 'rgba(123,45,139,0.35)'},
  { bg: '#1D8348', glow: 'rgba(29,131,72,0.35)' },
  { bg: '#B7950B', glow: 'rgba(183,149,11,0.35)'},
  { bg: '#1A5276', glow: 'rgba(26,82,118,0.35)' },
  { bg: '#0E7490', glow: 'rgba(14,116,144,0.35)'},
  { bg: '#9A3412', glow: 'rgba(154,52,18,0.35)' },
  { bg: '#6D28D9', glow: 'rgba(109,40,217,0.35)'},
  { bg: '#15803D', glow: 'rgba(21,128,61,0.35)' },
  { bg: '#A16207', glow: 'rgba(161,98,7,0.35)'  },
  { bg: '#1E3A8A', glow: 'rgba(30,58,138,0.35)' },
];

// ── component ─────────────────────────────────────────────────────────────────
export function VehicleImpactDiagram({ markers, onChange, maxMarkers = 12 }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const atMax = markers.length >= maxMarkers;

  const indexOf = (id: string) => markers.findIndex(m => m.label === id);

  const toggle = (id: string, ax: number, ay: number) => {
    const i = indexOf(id);
    if (i >= 0) {
      onChange(markers.filter(m => m.label !== id));
    } else {
      if (atMax) return;
      onChange([...markers, { x: (ax / VB_W) * 100, y: (ay / VB_H) * 100, label: id }]);
    }
  };

  return (
    <div className="space-y-3">

      {/* ── Label row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <label className="block text-sm text-slate-700 font-['Poppins']">
          Mark impact location on vehicle
          <span className="text-red-500 ml-1">*</span>
        </label>
        {markers.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 font-['Poppins'] transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Diagram card ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border-2 bg-[#F0F6FB] shadow-sm overflow-hidden"
        style={{
          borderColor: markers.length === 0 ? '#CBD5E1' : '#007DBA',
          transition: 'border-color 0.25s',
        }}
      >
        {/* Instruction strip */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 border-b border-slate-100">
          <Info className="w-3.5 h-3.5 text-[#007DBA] flex-shrink-0" />
          <p className="text-[11px] text-slate-600 font-['Poppins'] flex-1">
            {markers.length === 0
              ? 'Tap the part of the bus that was hit'
              : atMax
                ? 'Maximum reached — tap a marked part to remove it'
                : `${markers.length} marked — tap another part to add, or tap a marked one to remove`}
          </p>
          <span className="text-[10px] font-semibold font-['Poppins'] text-[#007DBA]/50">
            {markers.length} selected
          </span>
        </div>

        {/* ── Tappable diagram ────────────────────────────────────────────── */}
        <div className="relative select-none px-3 pt-1 pb-3">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-auto block"
            role="group"
            aria-label="Bus impact diagram — tap a part to mark it"
          >
            {/* orientation hints */}
            <text x={912} y={162} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '1.5px', fill: '#B4C0CE', fontFamily: 'Poppins' }}>FRONT</text>
            <text x={95} y={162} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '1.5px', fill: '#B4C0CE', fontFamily: 'Poppins' }}>REAR</text>

            {/* ── Bus body illustration (non-interactive) ─────────────────── */}
            <g pointerEvents="none">
              {/* wheels peeking at the edges */}
              {[250, 686].map(wx => (
                <g key={wx}>
                  <rect x={wx} y={142} width={64} height={16} rx={7} fill="#7A8AA0" />
                  <rect x={wx} y={332} width={64} height={16} rx={7} fill="#7A8AA0" />
                </g>
              ))}
              {/* main body */}
              <rect x={96} y={150} width={762} height={190} rx={44} fill="#E9EFF6" stroke="#C3D0DE" strokeWidth={2.5} />
              {/* windshield / cab at the front (right) */}
              <path d="M 786 156 L 812 156 Q 852 172 852 245 Q 852 318 812 334 L 786 334 Z" fill="#D3E2F1" stroke="#C3D0DE" strokeWidth={2} />
              {/* roof surface where the Top / Underbody markers sit */}
              <rect x={150} y={188} width={600} height={114} rx={20} fill="#F3F7FB" stroke="#DAE3EE" strokeWidth={1.5} />
              {/* subtle roof seam */}
              <line x1={450} y1={192} x2={450} y2={298} stroke="#E1E9F2" strokeWidth={1.5} />
            </g>

            {/* ── Regions (big panels) ─────────────────────────────────────── */}
            {REGIONS.map(r => {
              const idx = indexOf(r.id);
              const on = idx >= 0;
              const isHov = hovered === r.id;
              const col = on ? COLORS[idx % COLORS.length].bg : '#64748B';
              const c = REGION_CENTER(r);
              return (
                <g
                  key={r.id}
                  onClick={() => toggle(r.id, c.cx, c.cy)}
                  onMouseEnter={() => setHovered(r.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx}
                    fill={col}
                    fillOpacity={on ? 0.3 : isHov ? 0.14 : 0.05}
                    stroke={on ? col : isHov ? '#94A3B8' : '#C3D0DE'}
                    strokeWidth={on ? 2.5 : 1.5}
                    strokeDasharray={on ? undefined : '5 4'}
                    style={{ transition: 'fill-opacity .15s, stroke .15s' }}
                  />
                  {on ? (
                    <>
                      <circle cx={c.cx} cy={c.cy} r={15} fill={col} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                      <text x={c.cx} y={c.cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 14, fontWeight: 700, fill: '#fff', fontFamily: 'Poppins' }}>{idx + 1}</text>
                    </>
                  ) : (
                    <text x={r.lx} y={r.ly} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 13, fontWeight: 600, fill: isHov ? '#334155' : '#94A3B8', fontFamily: 'Poppins', pointerEvents: 'none' }}>{r.id}</text>
                  )}
                </g>
              );
            })}

            {/* ── Part dots (mirrors, wheel, bike rack, roof, underbody) ────── */}
            {DOTS.map(d => {
              const idx = indexOf(d.id);
              const on = idx >= 0;
              const isHov = hovered === d.id;
              const col = on ? COLORS[idx % COLORS.length].bg : '#64748B';
              return (
                <g
                  key={d.id}
                  onClick={() => toggle(d.id, d.cx, d.cy)}
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={d.cx} cy={d.cy} r={15}
                    fill={on ? col : '#ffffff'}
                    stroke={on ? col : isHov ? '#94A3B8' : '#C3D0DE'}
                    strokeWidth={on ? 2 : 1.5}
                    style={{ transition: 'all .15s', filter: on || isHov ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.16))' : 'none' }}
                  />
                  {on ? (
                    <text x={d.cx} y={d.cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 13, fontWeight: 700, fill: '#fff', fontFamily: 'Poppins' }}>{idx + 1}</text>
                  ) : (
                    <circle cx={d.cx} cy={d.cy} r={3.5} fill={isHov ? '#334155' : '#94A3B8'} />
                  )}
                  <text x={d.lx} y={d.ly} textAnchor={d.anchor} dominantBaseline="central" style={{ fontSize: 12, fontWeight: 600, fill: on ? col : isHov ? '#334155' : '#8497AB', fontFamily: 'Poppins', pointerEvents: 'none' }}>{d.id}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {markers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-slate-50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-['Poppins']">
                  Impact points marked
                </p>
              </div>
              {markers.map((m, i) => {
                const col = COLORS[i % COLORS.length];
                return (
                  <div key={m.label ?? i} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: col.bg }}
                    >
                      <span className="text-[10px] font-bold text-white font-['Poppins']">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 font-medium font-['Poppins']">{m.label ?? 'Impact point'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange(markers.filter((_, j) => j !== i))}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${m.label ?? 'impact point'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}