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
  /** Vehicle-specific silhouette and impact zones. */
  variant?: 'bus' | 'rail' | 'streetcar' | 'nrv';
  /** Override the word used in the instruction strip / aria label (default follows variant). */
  nounLabel?: string;
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
  { id: 'Rear',       x: 96,  y: 165, w: 118, h: 160, rx: 20, lx: 155, ly: 250 },
  { id: 'Front',      x: 726, y: 165, w: 130, h: 160, rx: 48, lx: 788, ly: 250 },
  { id: 'Left Side',  x: 232, y: 150, w: 476, h: 52,  rx: 14, lx: 470, ly: 181 },
  { id: 'Right Side', x: 232, y: 288, w: 476, h: 52,  rx: 14, lx: 470, ly: 319 },
];

const DOTS: Dot[] = [
  { id: 'Top',               cx: 396, cy: 224, lx: 396, ly: 199, anchor: 'middle' },
  { id: 'Underbody',         cx: 560, cy: 266, lx: 560, ly: 291, anchor: 'middle' },
  { id: 'Rear Wheel Left',   cx: 282, cy: 110, lx: 282, ly: 92,  anchor: 'middle' },
  { id: 'Rear Wheel Right',  cx: 282, cy: 360, lx: 282, ly: 385, anchor: 'middle' },
  { id: 'Front Wheel Left',  cx: 718, cy: 110, lx: 718, ly: 92,  anchor: 'middle' },
  { id: 'Front Wheel Right', cx: 718, cy: 360, lx: 718, ly: 385, anchor: 'middle' },
];

// ── rail (LRV) model ──────────────────────────────────────────────────────────
// Top-down light-rail car on the same 1000×460 canvas. FRONT (cab) on the right,
// REAR on the left; LEFT flank along the top, RIGHT flank along the bottom. Uses the
// exact rail "Point of impact" values: front/rear ends + side impact/sideswipe flanks
// are tappable REGIONS; Roof/Top and Underbody are labelled DOTS.
const RAIL_REGIONS: Region[] = [
  { id: 'Rear',       x: 96,  y: 165, w: 112, h: 160, rx: 20, lx: 152, ly: 245 },
  { id: 'Front',      x: 772, y: 165, w: 112, h: 160, rx: 20, lx: 828, ly: 245 },
  { id: 'Left Side',  x: 224, y: 150, w: 510, h: 52,  rx: 14, lx: 479, ly: 176 },
  { id: 'Right Side', x: 224, y: 288, w: 510, h: 52,  rx: 14, lx: 479, ly: 314 },
];

const RAIL_DOTS: Dot[] = [
  { id: 'Top',               cx: 430, cy: 245, lx: 430, ly: 222, anchor: 'middle' },
  { id: 'Underbody',         cx: 560, cy: 245, lx: 560, ly: 268, anchor: 'middle' },
  { id: 'Rear Wheel Left',   cx: 180, cy: 110, lx: 180, ly: 92,  anchor: 'middle' },
  { id: 'Rear Wheel Right',  cx: 180, cy: 380, lx: 180, ly: 405, anchor: 'middle' },
  { id: 'Front Wheel Left',  cx: 820, cy: 110, lx: 820, ly: 92,  anchor: 'middle' },
  { id: 'Front Wheel Right', cx: 820, cy: 380, lx: 820, ly: 405, anchor: 'middle' },
];

// ── streetcar model ──────────────────────────────────────────────────────────
// A shorter, single-car modern streetcar with rounded cabs at both ends, visible
// side doors/windows, and no LRV articulation seams. The same eight requirement
// values remain selectable, but their regions follow the compact streetcar body.
const STREETCAR_REGIONS: Region[] = [
  { id: 'Rear',       x: 146, y: 168, w: 112, h: 154, rx: 42, lx: 202, ly: 245 },
  { id: 'Front',      x: 742, y: 168, w: 112, h: 154, rx: 42, lx: 798, ly: 245 },
  { id: 'Left Side',  x: 272, y: 154, w: 456, h: 52,  rx: 14, lx: 500, ly: 180 },
  { id: 'Right Side', x: 272, y: 284, w: 456, h: 52,  rx: 14, lx: 500, ly: 310 },
];

const STREETCAR_DOTS: Dot[] = [
  { id: 'Top',               cx: 445, cy: 245, lx: 445, ly: 222, anchor: 'middle' },
  { id: 'Underbody',         cx: 570, cy: 245, lx: 570, ly: 268, anchor: 'middle' },
  { id: 'Rear Wheel Left',   cx: 220, cy: 110, lx: 220, ly: 92,  anchor: 'middle' },
  { id: 'Rear Wheel Right',  cx: 220, cy: 380, lx: 220, ly: 405, anchor: 'middle' },
  { id: 'Front Wheel Left',  cx: 780, cy: 110, lx: 780, ly: 92,  anchor: 'middle' },
  { id: 'Front Wheel Right', cx: 780, cy: 380, lx: 780, ly: 405, anchor: 'middle' },
];

// ── non-revenue vehicle model ─────────────────────────────────────────────────
// Compact road vehicle (car/SUV) with the exact NRV impact vocabulary. Unlike
// the bus, there is no bike-rack zone.
const NRV_REGIONS: Region[] = [
  { id: 'Rear',       x: 190, y: 172, w: 112, h: 146, rx: 42, lx: 246, ly: 245 },
  { id: 'Front',      x: 698, y: 172, w: 112, h: 146, rx: 52, lx: 754, ly: 245 },
  { id: 'Left Side',  x: 316, y: 158, w: 368, h: 52,  rx: 14, lx: 500, ly: 184 },
  { id: 'Right Side', x: 316, y: 280, w: 368, h: 52,  rx: 14, lx: 500, ly: 306 },
];

const NRV_DOTS: Dot[] = [
  { id: 'Top',               cx: 440, cy: 245, lx: 440, ly: 222, anchor: 'middle' },
  { id: 'Underbody',         cx: 555, cy: 245, lx: 555, ly: 268, anchor: 'middle' },
  { id: 'Rear Wheel Left',   cx: 331, cy: 110, lx: 331, ly: 92,  anchor: 'middle' },
  { id: 'Rear Wheel Right',  cx: 331, cy: 380, lx: 331, ly: 405, anchor: 'middle' },
  { id: 'Front Wheel Left',  cx: 667, cy: 110, lx: 667, ly: 92,  anchor: 'middle' },
  { id: 'Front Wheel Right', cx: 667, cy: 380, lx: 667, ly: 405, anchor: 'middle' },
];

// ── motorcycle model removed (no operator mode, other-vehicle side uses damage-area chips) ─

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
export function VehicleImpactDiagram({ markers, onChange, maxMarkers = 12, variant = 'bus', nounLabel }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const isStreetcar = variant === 'streetcar';
  const isNRV = variant === 'nrv';
  const isRail = variant === 'rail' || variant === 'streetcar';
  const regions = isNRV ? NRV_REGIONS : isStreetcar ? STREETCAR_REGIONS : isRail ? RAIL_REGIONS : REGIONS;
  const dots = isNRV ? NRV_DOTS : isStreetcar ? STREETCAR_DOTS : isRail ? RAIL_DOTS : DOTS;
  const noun = nounLabel ?? (isNRV ? 'NRV' : isStreetcar ? 'streetcar' : isRail ? 'train' : 'bus');
  const vehicleLabel = nounLabel ? nounLabel.charAt(0).toUpperCase() + nounLabel.slice(1) : (isNRV ? 'NRV' : isStreetcar ? 'Streetcar' : isRail ? 'Train' : 'Bus');
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
        <label className="block text-sm font-semibold text-slate-800 font-['Poppins']">
          Mark damage areas on {noun}
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
              ? `Tap the part of the ${noun} that was hit`
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
            aria-label={`${vehicleLabel} impact diagram — tap a part to mark it`}
          >
            {/* orientation hints */}
            <text x={isNRV ? 754 : isStreetcar ? 798 : isRail ? 828 : 912} y={isRail || isNRV ? 138 : 162} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '1.5px', fill: '#B4C0CE', fontFamily: 'Poppins' }}>FRONT</text>
            <text x={isNRV ? 246 : isStreetcar ? 202 : isRail ? 152 : 95} y={isRail || isNRV ? 138 : 162} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '1.5px', fill: '#B4C0CE', fontFamily: 'Poppins' }}>REAR</text>

            {/* ── Vehicle body illustration (non-interactive) ───────────── */}
            {isNRV ? (
              <g pointerEvents="none">
                {/* wheels tucked under a compact road vehicle */}
                {[302, 638].map(wx => (
                  <g key={wx}>
                    <rect x={wx} y={148} width={58} height={15} rx={7} fill="#7A8AA0" />
                    <rect x={wx} y={327} width={58} height={15} rx={7} fill="#7A8AA0" />
                  </g>
                ))}
                {/* car/SUV body with a distinct hood and rear hatch */}
                <rect x={184} y={150} width={632} height={190} rx={58} fill="#E9EFF6" stroke="#C3D0DE" strokeWidth={2.5} />
                <path d="M 690 156 L 754 166 Q 808 184 808 245 Q 808 306 754 324 L 690 334 Z" fill="#D3E2F1" stroke="#C3D0DE" strokeWidth={2} />
                <path d="M 306 174 L 644 174 L 684 206 L 684 284 L 644 316 L 306 316 Q 238 300 238 245 Q 238 190 306 174 Z" fill="#F3F7FB" stroke="#DAE3EE" strokeWidth={1.5} />
                {/* windshield and rear glass */}
                <path d="M 626 182 L 674 212 L 674 278 L 626 308 Z" fill="#C6D7EA" />
                <path d="M 310 184 L 274 206 L 274 284 L 310 306 Z" fill="#D3E2F1" />
                {/* roof seam and door line */}
                <line x1={474} y1={178} x2={474} y2={312} stroke="#D7E1EC" strokeWidth={2} />
              </g>
            ) : isStreetcar ? (
              <g pointerEvents="none">
                {/* track remains visible past the shorter single-car body */}
                {[50, 82, 112, 888, 918, 950].map(tx => (
                  <rect key={tx} x={tx} y={196} width={8} height={98} rx={2} fill="#C4D1DF" />
                ))}
                <line x1={38} y1={206} x2={962} y2={206} stroke="#A9BACB" strokeWidth={5} strokeLinecap="round" />
                <line x1={38} y1={284} x2={962} y2={284} stroke="#A9BACB" strokeWidth={5} strokeLinecap="round" />
                {/* compact, double-ended streetcar body */}
                <rect x={140} y={150} width={720} height={190} rx={42} fill="#E9EFF6" stroke="#C3D0DE" strokeWidth={2.5} />
                {/* rounded rear and front cab glazing */}
                <path d="M 208 156 L 174 162 Q 146 180 146 245 Q 146 310 174 328 L 208 334 Z" fill="#D3E2F1" stroke="#C3D0DE" strokeWidth={2} />
                <path d="M 792 156 L 826 162 Q 854 180 854 245 Q 854 310 826 328 L 792 334 Z" fill="#D3E2F1" stroke="#C3D0DE" strokeWidth={2} />
                <rect x={160} y={198} width={34} height={94} rx={10} fill="#C6D7EA" />
                <rect x={806} y={198} width={34} height={94} rx={10} fill="#C6D7EA" />
                {/* passenger windows and paired doors along the car */}
                {[286, 350, 586, 650].map(wx => (
                  <rect key={wx} x={wx} y={211} width={48} height={68} rx={7} fill="#D9E6F2" stroke="#CBD8E6" strokeWidth={1.5} />
                ))}
                <g stroke="#C4D2E0" strokeWidth={2} fill="#EEF4F9">
                  <rect x={414} y={198} width={68} height={94} rx={8} />
                  <rect x={518} y={198} width={68} height={94} rx={8} />
                  <line x1={448} y1={202} x2={448} y2={288} />
                  <line x1={552} y1={202} x2={552} y2={288} />
                </g>
                {/* compact rooftop equipment differentiates it from the long LRV roof */}
                <rect x={350} y={224} width={90} height={42} rx={10} fill="#F3F7FB" stroke="#DAE3EE" strokeWidth={1.5} />
                <rect x={560} y={224} width={90} height={42} rx={10} fill="#F3F7FB" stroke="#DAE3EE" strokeWidth={1.5} />
              </g>
            ) : isRail ? (
              <g pointerEvents="none">
                {/* railroad track — cross-ties + two rails running the length, exposed past both ends */}
                {[28, 56, 926, 954].map(tx => (
                  <rect key={tx} x={tx} y={196} width={9} height={98} rx={2} fill="#C4D1DF" />
                ))}
                <line x1={20} y1={206} x2={980} y2={206} stroke="#A9BACB" strokeWidth={5} strokeLinecap="round" />
                <line x1={20} y1={284} x2={980} y2={284} stroke="#A9BACB" strokeWidth={5} strokeLinecap="round" />
                {/* coupler at the rear (left) */}
                <rect x={74} y={236} width={22} height={18} rx={4} fill="#7A8AA0" />
                {/* main car body — long and rectangular (rail, not bus) */}
                <rect x={92} y={150} width={798} height={190} rx={16} fill="#E9EFF6" stroke="#C3D0DE" strokeWidth={2.5} />
                {/* blunt cab + windshield band at the front (right) */}
                <path d="M 802 150 L 858 150 Q 890 150 890 190 L 890 300 Q 890 340 858 340 L 802 340 Z" fill="#D3E2F1" stroke="#C3D0DE" strokeWidth={2} />
                <rect x={816} y={196} width={50} height={98} rx={9} fill="#C6D7EA" />
                {/* articulation seams — the LRV bends between sections */}
                <line x1={358} y1={152} x2={358} y2={338} stroke="#D2DCE8" strokeWidth={2} />
                <line x1={624} y1={152} x2={624} y2={338} stroke="#D2DCE8" strokeWidth={2} />
                {/* roof surface where the Roof / Underbody markers sit */}
                <rect x={150} y={200} width={600} height={90} rx={14} fill="#F3F7FB" stroke="#DAE3EE" strokeWidth={1.5} opacity={0.7} />
              </g>
            ) : (
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
            )}

            {/* ── Regions (big panels) ─────────────────────────────────────── */}
            {regions.map(r => {
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
            {dots.map(d => {
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