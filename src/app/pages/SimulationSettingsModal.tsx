import React from "react";
import { motion } from "motion/react";
import { X, RotateCcw, Play } from "lucide-react";

// ── Per-agent parameter types ─────────────────────────────────
export interface UTParams { additionalLanes: number; metroShift: number; signalOptimization: number; congestionPricing: number; }
export interface MIParams { shadeInfra: number; transitExpansion: number; cyclingInvestment: number; }
export interface SOParams { sustainabilityWeight: number; investmentScale: number; equityPriority: number; }
export interface EFParams { diversificationRate: number; fdiAttraction: number; jobGrowth: number; }
export interface ERParams { drainageExpansion: number; greenCover: number; retentionBasins: number; buildingCode: number; coolRoof: number; }

export const DEFAULT_UT: UTParams = { additionalLanes: 0, metroShift: 0, signalOptimization: 30, congestionPricing: 0 };
export const DEFAULT_MI: MIParams = { shadeInfra: 1.0, transitExpansion: 1.0, cyclingInvestment: 1.0 };
export const DEFAULT_SO: SOParams = { sustainabilityWeight: 1.0, investmentScale: 1.0, equityPriority: 1.0 };
export const DEFAULT_EF: EFParams = { diversificationRate: 1.0, fdiAttraction: 1.0, jobGrowth: 1.0 };
export const DEFAULT_ER: ERParams = { drainageExpansion: 0, greenCover: 8, retentionBasins: 0, buildingCode: 35, coolRoof: 5 };

// ── Slider ────────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step, unit, onChange, formatValue, color = "#00B558" }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; formatValue?: (v: number) => string; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{label}</span>
        <span className="text-[12px] font-black tracking-wider" style={{ color }}>
          {formatValue ? formatValue(value) : value}{unit}
        </span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-[#1a2f1a] rounded-full" />
        <div className="absolute left-0 h-[3px] rounded-full" style={{ width: `${pct}%`, background: color }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full h-4 opacity-0 cursor-pointer" />
        <div className="absolute w-3 h-3 rounded-full border-2 border-[#0a140a] pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)`, backgroundColor: color, boxShadow: `0 0 6px ${color}99` }} />
      </div>
    </div>
  );
}

// ── Modal shell with descriptions ─────────────────────────────
function ModalShell({ title, color, onClose, onApply, onReset, descriptions, children }: {
  title: string; color: string; onClose: () => void; onApply: () => void; onReset: () => void;
  descriptions: { name: string; desc: string }[]; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020502]/80 backdrop-blur-md pointer-events-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-[520px] max-h-[80vh] bg-[#0a140a]/95 border rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
        style={{ borderColor: `${color}40` }}>
        <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{ borderColor: `${color}25` }}>
          <h2 className="text-white text-sm font-bold tracking-[0.15em] uppercase">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
          {children}
          {/* Function descriptions */}
          <div className="border-t pt-3 mt-1" style={{ borderColor: `${color}15` }}>
            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-600 mb-2 block">Indicator Descriptions</span>
            {descriptions.map(d => (
              <div key={d.name} className="mb-2">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{d.name}</span>
                <p className="text-[9px] text-gray-500 leading-snug mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-t bg-[#070d07]/50" style={{ borderColor: `${color}25` }}>
          <button onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-sm transition-all">
            <RotateCcw className="w-3.5 h-3.5" />Reset
          </button>
          <button onClick={() => { onApply(); onClose(); }}
            className="flex items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-black rounded-sm transition-all"
            style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}50` }}>
            <Play className="w-3.5 h-3.5" />Apply
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 5 Agent modals ────────────────────────────────────────────
const UT_DESCS = [
  { name: "Additional Lanes", desc: "Number of extra lanes added to 6 major downtown corridors (King Fahd Rd, Olaya St, King Abdullah Rd, Northern Ring, Makkah Rd, Eastern Ring). Methods: remove on-street parking (+1), road widening (+2), contraflow peak lanes (+1). Each lane adds ~800–1,000 veh/hr capacity per corridor." },
  { name: "Metro Ridership Shift", desc: "Percentage of current car commuters shifting to Riyadh Metro Lines 1–6. Each 10% shift removes ~12,400 vehicles from downtown roads during peak hours." },
  { name: "Signal Optimization", desc: "Percentage of downtown intersections upgraded with Adaptive Traffic Signal Control (ATSC). Baseline: 30% of 180 intersections already have SCATS/SCOOT systems. Slider adjusts coverage up to 100%." },
  { name: "Proposed Peak-Hour Toll", desc: "New congestion charge for vehicles entering the downtown core zone during peak hours (7–9 AM, 4–7 PM). Currently: 0 SAR (no toll exists). Reference: London ~70 SAR, Stockholm ~15 SAR, Singapore ~14 SAR." },
];
const MI_DESCS = [
  { name: "Pedestrian Mode Share", desc: "Suggests shade and cooling interventions to increase walking in desert climates." },
  { name: "Active Transit Score", desc: "Monitors bike-lane safety and usage to optimize future cycling infrastructure." },
  { name: "Public Transit Accessibility", desc: "Ensures 80% of citizens live within 800m of a transport hub." },
];
const SO_DESCS = [
  { name: "Sustainability Alignment", desc: "Ranks planning scenarios based on their carbon footprint and water efficiency." },
  { name: "Cost-Benefit Ratio", desc: "Analyzes long-term ROI of infrastructure vs. short-term construction costs." },
  { name: "Social Equity Score", desc: "Ensures urban interventions are distributed fairly across all demographic groups." },
];
const EF_DESCS = [
  { name: "Non-Oil GDP Contribution", desc: "Tracks real estate's impact on diversifying the national economy." },
  { name: "Foreign FDI in Urban", desc: "Predicts investor sentiment to suggest the best time for land auctions." },
  { name: "Job Creation Potential", desc: "Correlates zoning with industry growth to forecast local employment." },
];
const ER_DESCS = [
  { name: "Flood Risk Index", desc: "Composite score measuring urban flood resilience across Riyadh's wadi channels, low-lying basins, and drainage network. Combines capacity of 340km storm drain network with terrain risk modeling." },
  { name: "Heat Island Reduction", desc: "Reduction in urban heat island intensity from increased vegetation cover, cool roofs, reflective surfaces, and shade infrastructure. Riyadh's baseline UHI is +4–6°C above surrounding desert." },
  { name: "Climate Resilience Score", desc: "Composite score of building stock meeting updated flood-proofing, heat-resistance, and water-efficiency standards. Saudi Building Code (SBC 601/602) mandated in 2018; current adoption at ~35% of new construction as of 2025 (MOMRA enforcement data)." },
];

export function UTSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: UTParams; onChange: (p: UTParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof UTParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="Urban Test Agent — Downtown Riyadh Traffic" color="#00B558" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={UT_DESCS}>
      <SliderRow label="Additional Lanes (Major Corridors)" value={params.additionalLanes} min={0} max={4} step={1} unit=" lanes" onChange={v => upd('additionalLanes', v)} formatValue={v => `+${v}`} />
      <SliderRow label="Metro Ridership Shift" value={params.metroShift} min={0} max={40} step={2} unit="%" onChange={v => upd('metroShift', v)} />
      <SliderRow label="Signal Optimization Coverage" value={params.signalOptimization} min={30} max={100} step={5} unit="%" onChange={v => upd('signalOptimization', v)} formatValue={v => `${v}`} />
      <SliderRow label="Proposed Peak-Hour Toll" value={params.congestionPricing} min={0} max={30} step={1} unit=" SAR" onChange={v => upd('congestionPricing', v)} formatValue={v => v === 0 ? 'None' : `${v}`} />
    </ModalShell>
  );
}

export function MISettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: MIParams; onChange: (p: MIParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof MIParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="Mobility Impact Advisor Agent" color="#FCD34D" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={MI_DESCS}>
      <SliderRow label="Shade Infrastructure" value={params.shadeInfra} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('shadeInfra', v)} color="#FCD34D" />
      <SliderRow label="Transit Network Expansion" value={params.transitExpansion} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('transitExpansion', v)} color="#FCD34D" />
      <SliderRow label="Cycling Investment" value={params.cyclingInvestment} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('cyclingInvestment', v)} color="#FCD34D" />
    </ModalShell>
  );
}

export function SOSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: SOParams; onChange: (p: SOParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof SOParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="Scenario Optimizer Agent" color="#00B558" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={SO_DESCS}>
      <SliderRow label="Sustainability Weight" value={params.sustainabilityWeight} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('sustainabilityWeight', v)} />
      <SliderRow label="Investment Scale" value={params.investmentScale} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('investmentScale', v)} />
      <SliderRow label="Equity Priority" value={params.equityPriority} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('equityPriority', v)} />
    </ModalShell>
  );
}

export function EFSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: EFParams; onChange: (p: EFParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof EFParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="Economic and Financial Analyzer Agent" color="#3b82f6" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={EF_DESCS}>
      <SliderRow label="Diversification Rate" value={params.diversificationRate} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('diversificationRate', v)} color="#3b82f6" />
      <SliderRow label="FDI Attraction Factor" value={params.fdiAttraction} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('fdiAttraction', v)} color="#3b82f6" />
      <SliderRow label="Job Market Growth" value={params.jobGrowth} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('jobGrowth', v)} color="#3b82f6" />
    </ModalShell>
  );
}

export function ERSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: ERParams; onChange: (p: ERParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof ERParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="Environmental & Resilience Evaluator — Riyadh" color="#10b981" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={ER_DESCS}>
      <SliderRow label="Drainage Infrastructure Expansion" value={params.drainageExpansion} min={0} max={50} step={5} unit=" km" onChange={v => upd('drainageExpansion', v)} color="#10b981" formatValue={v => `+${v}`} />
      <SliderRow label="Retention Basins & Flood Barriers" value={params.retentionBasins} min={0} max={8} step={1} unit=" facilities" onChange={v => upd('retentionBasins', v)} color="#10b981" formatValue={v => `+${v}`} />
      <SliderRow label="Urban Green Cover" value={params.greenCover} min={8} max={30} step={1} unit="%" onChange={v => upd('greenCover', v)} color="#10b981" />
      <SliderRow label="Cool Roof & Reflective Surface Coverage" value={params.coolRoof} min={5} max={60} step={5} unit="%" onChange={v => upd('coolRoof', v)} color="#10b981" />
      <SliderRow label="Climate-Resilient Building Code" value={params.buildingCode} min={35} max={100} step={5} unit="%" onChange={v => upd('buildingCode', v)} color="#10b981" />
    </ModalShell>
  );
}
