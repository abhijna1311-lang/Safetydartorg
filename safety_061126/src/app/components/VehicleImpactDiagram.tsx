import { useRef, useState } from 'react';
import { MapPin, Trash2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import vehicleImg from '../../imports/VehicleImpactContact.png';

export interface ImpactMarker {
  x: number; // 0–100 % of container width
  y: number; // 0–100 % of container height
}

interface Props {
  markers: ImpactMarker[];
  onChange: (markers: ImpactMarker[]) => void;
  maxMarkers?: number;
}

// ── zone labels ───────────────────────────────────────────────────────────────
// Based on a landscape top-down vehicle diagram:
//   left edge = front of vehicle, right edge = rear
//   top edge  = driver/left side, bottom edge = passenger/right side
function zoneLabel(x: number, y: number): string {
  const fore = x < 33;
  const aft  = x > 66;
  const left = y < 40;
  const right = y > 60;

  if (fore  && left)  return 'Front-left corner';
  if (fore  && right) return 'Front-right corner';
  if (aft   && left)  return 'Rear-left corner';
  if (aft   && right) return 'Rear-right corner';
  if (fore)           return 'Front impact';
  if (aft)            return 'Rear impact';
  if (left)           return 'Left side';
  if (right)          return 'Right side';
  return 'Centre body';
}

// ── colours ───────────────────────────────────────────────────────────────────
const COLORS = [
  { bg: '#007DBA', glow: 'rgba(0,125,186,0.35)' },
  { bg: '#E85D04', glow: 'rgba(232,93,4,0.35)'  },
  { bg: '#7B2D8B', glow: 'rgba(123,45,139,0.35)'},
  { bg: '#1D8348', glow: 'rgba(29,131,72,0.35)' },
  { bg: '#B7950B', glow: 'rgba(183,149,11,0.35)'},
  { bg: '#1A5276', glow: 'rgba(26,82,118,0.35)' },
];

const PIN_SIZE = 30; // px — diameter of the circular pin

// ── component ─────────────────────────────────────────────────────────────────
export function VehicleImpactDiagram({ markers, onChange, maxMarkers = 6 }: Props) {
  const imgRef  = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [flash,   setFlash]   = useState<number | null>(null);
  const atMax = markers.length >= maxMarkers;

  // ── add pin ──────────────────────────────────────────────────────────────
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (atMax) return;
    // Ignore if the click target is already a pin (they stop propagation)
    const rect = imgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    const idx = markers.length;
    onChange([...markers, { x, y }]);
    setFlash(idx);
    setTimeout(() => setFlash(null), 700);
  };

  // ── remove pin ───────────────────────────────────────────────────────────
  const removePin = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation(); // don't bubble to container → no new pin added
    onChange(markers.filter((_, i) => i !== idx));
    setHovered(null);
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
            {atMax
              ? `${maxMarkers} pins placed — click a pin × to remove`
              : markers.length === 0
                ? 'Click anywhere on the vehicle to mark the impact point'
                : `${markers.length} pin${markers.length > 1 ? 's' : ''} placed — click on the diagram to add more, or × a pin to remove`}
          </p>
          <span className="text-[10px] font-semibold font-['Poppins'] text-[#007DBA]/50">
            {markers.length}/{maxMarkers}
          </span>
        </div>

        {/* ── Clickable image area ────────────────────────────────────────── */}
        <div
          ref={imgRef}
          onClick={handleContainerClick}
          className="relative select-none"
          style={{ cursor: atMax ? 'not-allowed' : 'crosshair' }}
        >
          {/* Vehicle image — no height cap, no objectFit so bbox matches visual */}
          <img
            src={vehicleImg}
            alt="Vehicle impact contact diagram"
            draggable={false}
            className="w-full h-auto block pointer-events-none"
          />

          {/* Empty-state overlay */}
          {markers.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-5">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#007DBA]/25 rounded-xl px-4 py-2 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#007DBA]/60" />
                <span className="text-xs text-[#007DBA]/70 font-['Poppins']">Click to place first pin</span>
              </div>
            </div>
          )}

          {/* ── Pins ─────────────────────────────────────────────────────── */}
          {markers.map((m, i) => {
            const col = COLORS[i % COLORS.length];
            const isHov = hovered === i;
            const isNew = flash === i;

            return (
              // Outer div handles ONLY positioning — never touch transform here
              // so Motion's scale on the inner div never fights centering
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${m.x}%`,
                  top:  `${m.y}%`,
                  // Centre the pin on the click point using margin, not transform
                  marginLeft: -(PIN_SIZE / 2),
                  marginTop:  -(PIN_SIZE / 2),
                  width:  PIN_SIZE,
                  height: PIN_SIZE,
                  zIndex: isHov ? 30 : 20,
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => removePin(e, i)}
              >
                {/* Spring-pop animation wrapper — owns transform, not positioning */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                  style={{ width: '100%', height: '100%', position: 'relative' }}
                >
                  {/* Pulse ring on first appear */}
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.7 }}
                      animate={{ scale: 2.6, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: col.bg,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Pin circle */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: col.bg,
                      boxShadow: isHov
                        ? `0 0 0 3px white, 0 0 0 5px ${col.bg}, 0 6px 18px ${col.glow}`
                        : `0 0 0 2px white, 0 0 0 4px ${col.bg}, 0 3px 10px ${col.glow}`,
                      transition: 'box-shadow 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {isHov ? (
                      <X style={{ width: 14, height: 14, color: '#fff', strokeWidth: 2.5 }} />
                    ) : (
                      <span style={{
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Tooltip above pin */}
                <AnimatePresence>
                  {isHov && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute',
                        bottom: PIN_SIZE + 6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 40,
                      }}
                    >
                      <div
                        className="px-2.5 py-1.5 rounded-lg shadow-xl text-[10px] font-['Poppins']"
                        style={{ background: col.bg, color: '#fff' }}
                      >
                        <p className="font-semibold">{zoneLabel(m.x, m.y)}</p>
                        <p style={{ opacity: 0.75 }}>Click to remove</p>
                      </div>
                      {/* Arrow */}
                      <div style={{
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: `5px solid ${col.bg}`,
                        margin: '0 auto',
                      }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: col.bg }}
                    >
                      <span className="text-[10px] font-bold text-white font-['Poppins']">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 font-medium font-['Poppins']">{zoneLabel(m.x, m.y)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange(markers.filter((_, j) => j !== i))}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Remove pin ${i + 1}`}
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