import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Settings, Info, TrendingUp, Clock, Car, Leaf, Brain, Loader2, Droplets, TreePine, Shield, Thermometer } from "lucide-react";
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  UTSettingsModal, MISettingsModal, SOSettingsModal, EFSettingsModal, ERSettingsModal,
  UTParams, MIParams, SOParams, EFParams, ERParams,
  DEFAULT_UT, DEFAULT_MI, DEFAULT_SO, DEFAULT_EF, DEFAULT_ER,
} from "./SimulationSettingsModal";

// ─── Types ────────────────────────────────────────────────────
interface Indicator {
  id: string; name: string; desc: string;
  current: number; target: number; unit: string; aiRole: string;
  inverse?: boolean; // lower is better (e.g. failure risk)
}
interface AgentDef {
  id: string; name: string; color: string; indicators: Indicator[];
}

// ─── 5 Agents from Implementation Card ────────────────────────
const AGENTS: AgentDef[] = [
  {
    id: "UT", name: "Urban Test Agent", color: "#00B558",
    indicators: [
      { id: "UT-1", name: "Avg. Travel Speed", desc: "Average downtown travel speed during morning peak hours.", current: 18, target: 35, unit: "km/h", aiRole: "Traffic AI" },
      { id: "UT-2", name: "Peak Hour Delay", desc: "Average additional delay per trip during morning rush.", current: 45, target: 15, unit: "min", aiRole: "Delay Prediction", inverse: true },
      { id: "UT-3", name: "Vehicle Throughput", desc: "Downtown corridor capacity during peak hours.", current: 12400, target: 18000, unit: "veh/hr", aiRole: "Capacity AI" },
      { id: "UT-4", name: "CO\u2082 Reduction", desc: "Emission reduction from combined traffic optimization.", current: 0, target: 40, unit: "%", aiRole: "Green AI" },
    ],
  },
  {
    id: "MI", name: "Mobility Impact Advisor Agent", color: "#FCD34D",
    indicators: [
      { id: "MI-1", name: "Pedestrian Mode Share", desc: "Suggests shade and cooling interventions to increase walking in desert climates.", current: 10.2, target: 18, unit: "%", aiRole: "Shade Suggestion" },
      { id: "MI-2", name: "Active Transit Score", desc: "Monitors bike-lane safety and usage to optimize future cycling infrastructure.", current: 74, target: 90, unit: "Score", aiRole: "Safety Monitoring" },
      { id: "MI-3", name: "Public Transit Accessibility", desc: "Ensures 80% of citizens live within 800m of a transport hub.", current: 78, target: 95, unit: "%", aiRole: "Reach AI" },
    ],
  },
  {
    id: "SO", name: "Scenario Optimizer Agent", color: "#00B558",
    indicators: [
      { id: "SO-1", name: "Sustainability Alignment", desc: "Ranks planning scenarios based on their carbon footprint and water efficiency.", current: 84, target: 95, unit: "%", aiRole: "Trade-off AI" },
      { id: "SO-2", name: "Cost-Benefit Ratio", desc: "Analyzes long-term ROI of infrastructure vs. short-term construction costs.", current: 3.2, target: 4.5, unit: "Ratio", aiRole: "ROI Projection" },
      { id: "SO-3", name: "Social Equity Score", desc: "Ensures urban interventions are distributed fairly across all demographic groups.", current: 88, target: 100, unit: "Score", aiRole: "Ethical AI" },
    ],
  },
  {
    id: "EF", name: "Economic and Financial Analyzer Agent", color: "#3b82f6",
    indicators: [
      { id: "EF-1", name: "Project IRR", desc: "Internal Rate of Return for the neighbourhood development. Accounts for construction, land, infrastructure, and mixed-use revenue.", current: 8, target: 18, unit: "%", aiRole: "IRR Model" },
      { id: "EF-2", name: "Fiscal Self-Sufficiency", desc: "% of neighbourhood costs covered by locally-generated revenue (property fees, rents, parking).", current: 25, target: 75, unit: "%", aiRole: "Revenue AI" },
      { id: "EF-3", name: "Funding Gap", desc: "Unfunded infrastructure deficit. Reduced by PPP, land value capture, and developer contributions.", current: 12, target: 3, unit: "SAR B", aiRole: "Finance AI", inverse: true },
      { id: "EF-4", name: "Job-Housing Balance", desc: "Ratio of jobs to housing units. 1.0 = equilibrium. Mixed-use and anchor tenants drive this up.", current: 0.6, target: 1.2, unit: "Ratio", aiRole: "Planning AI" },
      { id: "EF-5", name: "Private Investment Leverage", desc: "SAR private capital per SAR public. Higher = more attractive market conditions.", current: 1.8, target: 4.5, unit: "×", aiRole: "Market AI" },
    ],
  },
  {
    id: "ER", name: "Environmental and Resilience Evaluator", color: "#10b981",
    indicators: [
      { id: "ER-1", name: "Flood Risk Index", desc: "Composite score measuring flood resilience across wadi channels, basins, and 340km drain network.", current: 42, target: 85, unit: "Score", aiRole: "Drainage AI" },
      { id: "ER-2", name: "Heat Island Reduction", desc: "Reduction in urban heat island effect from vegetation, reflective surfaces, and shade.", current: 0, target: 3.5, unit: "°C", aiRole: "Thermal AI" },
      { id: "ER-3", name: "Climate Resilience Score", desc: "Building stock meeting flood-proofing, heat-resistance, and water-efficiency standards. SBC baseline: 35%.", current: 35, target: 90, unit: "%", aiRole: "Code AI" },
    ],
  },
];

// ─── Map wrappers (Figma-safe) ────────────────────────────────
const SafeSource = ({ children, id, ...props }: any) => {
  const cleanProps = { id, ...props };
  Object.keys(cleanProps).forEach(k => { if (k.startsWith('data-fg') || k.startsWith('data-fgid')) delete cleanProps[k]; });
  return React.createElement(Source, { key: id, ...cleanProps }, children);
};
const SafeLayer = (props: any) => {
  const cleanProps = { ...props };
  Object.keys(cleanProps).forEach(k => { if (k.startsWith('data-fg') || k.startsWith('data-fgid')) delete cleanProps[k]; });
  return React.createElement(Layer, cleanProps);
};

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const DOWNTOWN_VIEW = { longitude: 46.685, latitude: 24.72, zoom: 12, pitch: 0, bearing: 0 };

// Seeded PRNG for deterministic heatmap points
function seededRNG(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Pre-generate traffic congestion points for downtown Riyadh
function generateTrafficPoints() {
  const rng = seededRNG(42);
  const pts: { lng: number; lat: number; w: number; core: boolean; intersection: boolean }[] = [];
  const clusters = [
    { lng: 46.663, lat: 24.765, n: 60, sp: 0.008, w: 0.95 }, // King Fahd / Northern Ring
    { lng: 46.678, lat: 24.711, n: 55, sp: 0.007, w: 0.92 }, // Olaya / Tahlia
    { lng: 46.695, lat: 24.743, n: 50, sp: 0.008, w: 0.88 }, // King Abdullah Rd
    { lng: 46.664, lat: 24.695, n: 45, sp: 0.007, w: 0.85 }, // King Fahd / Makkah
    { lng: 46.678, lat: 24.730, n: 40, sp: 0.006, w: 0.80 }, // Olaya / Al Oruba
    { lng: 46.626, lat: 24.681, n: 35, sp: 0.008, w: 0.70 }, // DQ area
    { lng: 46.639, lat: 24.761, n: 40, sp: 0.007, w: 0.75 }, // KAFD approach
    { lng: 46.712, lat: 24.700, n: 30, sp: 0.009, w: 0.65 }, // Eastern corridor
  ];
  for (const c of clusters) {
    const isCore = c.lng > 46.65 && c.lng < 46.70 && c.lat > 24.69 && c.lat < 24.75;
    for (let i = 0; i < c.n; i++) {
      const u1 = Math.max(rng(), 0.0001), u2 = rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      pts.push({ lng: c.lng + z0 * c.sp, lat: c.lat + z1 * c.sp, w: c.w * (0.4 + 0.6 * rng()), core: isCore, intersection: true });
    }
  }
  // Background traffic
  for (let i = 0; i < 200; i++) {
    pts.push({ lng: 46.60 + rng() * 0.16, lat: 24.66 + rng() * 0.13, w: rng() * 0.12, core: false, intersection: false });
  }
  return pts;
}
const BASE_TRAFFIC = generateTrafficPoints();

const HEATMAP_PAINT: any = {
  'heatmap-weight': ['get', 'weight'],
  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 15, 3.5],
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0, 181, 88, 0)',
    0.25, 'rgba(0, 181, 88, 0.5)',
    0.5, 'rgba(252, 211, 77, 0.7)',
    0.75, 'rgba(255, 68, 68, 0.9)',
    1, 'rgba(255, 255, 255, 1)',
  ],
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 25],
  'heatmap-opacity': 0.9,
};

// ─── Environmental risk heatmap (flood/heat zones) ────────────
function generateEnvRiskPoints() {
  const rng = seededRNG(99);
  const pts: { lng: number; lat: number; w: number; wadi: boolean; urban: boolean }[] = [];
  const clusters = [
    // Flood-risk: Wadi Hanifah and low-lying areas
    { lng: 46.60, lat: 24.65, n: 70, sp: 0.020, w: 0.95, wadi: true, urban: false },  // Wadi Hanifah flood plain
    { lng: 46.55, lat: 24.60, n: 50, sp: 0.025, w: 0.85, wadi: true, urban: false },  // South-West basin
    { lng: 46.70, lat: 24.55, n: 45, sp: 0.022, w: 0.80, wadi: true, urban: false },  // South lowlands
    { lng: 46.62, lat: 24.72, n: 35, sp: 0.015, w: 0.70, wadi: true, urban: true },   // Wadi through downtown
    // Heat-island: dense urban cores
    { lng: 46.673, lat: 24.711, n: 55, sp: 0.012, w: 0.90, wadi: false, urban: true }, // Olaya dense
    { lng: 46.639, lat: 24.761, n: 45, sp: 0.010, w: 0.85, wadi: false, urban: true }, // KAFD high-rise
    { lng: 46.712, lat: 24.640, n: 40, sp: 0.015, w: 0.75, wadi: false, urban: true }, // Downtown area
    { lng: 46.695, lat: 24.743, n: 35, sp: 0.012, w: 0.72, wadi: false, urban: true }, // King Abdullah corridor
  ];
  for (const c of clusters) {
    for (let i = 0; i < c.n; i++) {
      const u1 = Math.max(rng(), 0.0001), u2 = rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      pts.push({ lng: c.lng + z0 * c.sp, lat: c.lat + z1 * c.sp, w: c.w * (0.4 + 0.6 * rng()), wadi: c.wadi, urban: c.urban });
    }
  }
  for (let i = 0; i < 180; i++) {
    pts.push({ lng: 46.48 + rng() * 0.35, lat: 24.50 + rng() * 0.32, w: rng() * 0.10, wadi: false, urban: false });
  }
  return pts;
}
const BASE_ENV_RISK = generateEnvRiskPoints();

const ENV_RISK_VIEW = { longitude: 46.65, latitude: 24.68, zoom: 10.5, pitch: 0, bearing: 0 };

const ENV_HEATMAP_PAINT: any = {
  'heatmap-weight': ['get', 'weight'],
  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1, 14, 3],
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(16, 185, 129, 0)',
    0.2, 'rgba(16, 185, 129, 0.4)',
    0.45, 'rgba(252, 211, 77, 0.65)',
    0.7, 'rgba(249, 115, 22, 0.85)',
    0.9, 'rgba(239, 68, 68, 0.95)',
    1, 'rgba(255, 255, 255, 1)',
  ],
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 8, 14, 22],
  'heatmap-opacity': 0.85,
};

// ─── Flood spot markers for ER ────────────────────────────────
const FLOOD_SPOTS = [
  { name: "Wadi Hanifah — Al Diriyah", lng: 46.575, lat: 24.73, baseRadius: 850, risk: 92 },
  { name: "Wadi Hanifah — Al Aqiq", lng: 46.595, lat: 24.68, baseRadius: 750, risk: 88 },
  { name: "King Fahd Rd Underpass", lng: 46.663, lat: 24.735, baseRadius: 400, risk: 85 },
  { name: "South Basin — Exit 15", lng: 46.72, lat: 24.55, baseRadius: 1200, risk: 78 },
  { name: "Olaya Depression", lng: 46.678, lat: 24.695, baseRadius: 350, risk: 72 },
  { name: "Northern Ring Catchment", lng: 46.66, lat: 24.78, baseRadius: 600, risk: 68 },
  { name: "Eastern District Basin", lng: 46.78, lat: 24.72, baseRadius: 900, risk: 65 },
];

// Heat island clusters for heatmap
const HEAT_ISLAND_PAINT: any = {
  'heatmap-weight': ['get', 'weight'],
  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 14, 3],
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(252, 211, 77, 0)',
    0.2, 'rgba(252, 211, 77, 0.35)',
    0.45, 'rgba(249, 115, 22, 0.6)',
    0.7, 'rgba(239, 68, 68, 0.85)',
    0.9, 'rgba(220, 38, 38, 0.95)',
    1, 'rgba(255, 255, 255, 1)',
  ],
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 10, 14, 25],
  'heatmap-opacity': 0.85,
};

function generateHeatIslandPoints() {
  const rng = seededRNG(77);
  const pts: { lng: number; lat: number; w: number; urban: boolean }[] = [];
  const clusters = [
    { lng: 46.673, lat: 24.711, n: 80, sp: 0.014, w: 0.95 }, // Olaya dense commercial
    { lng: 46.639, lat: 24.761, n: 65, sp: 0.012, w: 0.90 }, // KAFD high-rise canyon
    { lng: 46.712, lat: 24.640, n: 55, sp: 0.016, w: 0.82 }, // Downtown asphalt
    { lng: 46.695, lat: 24.743, n: 50, sp: 0.013, w: 0.78 }, // King Abdullah corridor
    { lng: 46.650, lat: 24.690, n: 40, sp: 0.015, w: 0.72 }, // Al Malaz
    { lng: 46.730, lat: 24.780, n: 35, sp: 0.018, w: 0.65 }, // Industrial east
  ];
  for (const c of clusters) {
    for (let i = 0; i < c.n; i++) {
      const u1 = Math.max(rng(), 0.0001), u2 = rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      pts.push({ lng: c.lng + z0 * c.sp, lat: c.lat + z1 * c.sp, w: c.w * (0.4 + 0.6 * rng()), urban: true });
    }
  }
  for (let i = 0; i < 120; i++) {
    pts.push({ lng: 46.50 + rng() * 0.35, lat: 24.50 + rng() * 0.35, w: rng() * 0.08, urban: false });
  }
  return pts;
}
const BASE_HEAT_ISLANDS = generateHeatIslandPoints();

// ─── Chart data ───────────────────────────────────────────────
const MI_RADAR_BASE = [
  { s: "Pedestrian", base: 10.2, target: 18 },
  { s: "Cycling", base: 74, target: 90 },
  { s: "Transit", base: 78, target: 95 },
];
const SO_BAR_BASE = [
  { n: "Sustain.", cur: 84, tgt: 95 },
  { n: "Cost-Benefit", cur: 3.2, tgt: 4.5 },
  { n: "Equity", cur: 88, tgt: 100 },
];
const EF_BAR_BASE = [
  { n: "IRR", cur: 8, tgt: 18 },
  { n: "Self-Suff.", cur: 25, tgt: 75 },
  { n: "Gap (B)", cur: 12, tgt: 3 },
  { n: "Job-Hous.", cur: 0.6, tgt: 1.2 },
  { n: "Leverage", cur: 1.8, tgt: 4.5 },
];

// ─── Helpers ──────────────────────────────────────────────────
function mul(base: number, m: number, dec = 0): number {
  const v = base * m;
  return dec > 0 ? parseFloat(v.toFixed(dec)) : Math.round(v);
}
function fmt(v: number, dec = 0): string {
  return dec > 0 ? v.toFixed(dec) : Math.round(v).toString();
}

function AgentBadge({ id, color }: { id: string; color: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border"
      style={{ color, borderColor: `${color}60`, backgroundColor: `${color}15` }}>{id}</span>
  );
}

// ─── Indicator row (compact, with hover tooltip) ──────────────
function IndicatorRow({ ind, value, color }: { ind: Indicator; value: number; color: string }) {
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const pct = ind.inverse
    ? Math.max(0, Math.min(100, ((ind.current - value) / (ind.current - ind.target)) * 100))
    : Math.max(0, Math.min(100, (value / ind.target) * 100));

  const onEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 280) });
    }
    setHover(true);
  };

  return (
    <div className="flex items-center gap-2 py-[3px]" ref={ref}
      onMouseEnter={onEnter} onMouseLeave={() => setHover(false)}>
      {/* Name + AI role */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Info className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 cursor-help" />
        <span className="text-[12px] font-bold tracking-wider text-gray-300 truncate uppercase">{ind.name}</span>
        <span className="text-[9px] px-1 py-[1px] rounded bg-[#ffffff08] text-gray-600 font-bold tracking-wider uppercase flex-shrink-0">{ind.aiRole}</span>
      </div>
      {/* Value + target + progress */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-[80px] h-[4px] bg-[#1a2f1a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-[13px] font-black tracking-wider w-[55px] text-right" style={{ color }}>
          {fmt(value, ind.unit === "Ratio" ? 1 : 0)}
        </span>
        <span className="text-[10px] text-gray-600 font-bold w-[24px]">/{fmt(ind.target, ind.unit === "Ratio" ? 1 : 0)}</span>
        <span className="text-[10px] text-gray-600 font-medium w-[44px] uppercase">{ind.unit}</span>
      </div>
      {/* Hover tooltip via portal */}
      {hover && createPortal(
        <div className="fixed z-[200] w-[320px] p-3.5 bg-[#0d1a0d] border border-[#00B558]/30 rounded shadow-xl pointer-events-none"
          style={{ top: pos.top, left: pos.left }}>
          <div className="text-[13px] font-bold text-gray-200 uppercase tracking-wider mb-1.5">{ind.name}</div>
          <p className="text-[12px] leading-relaxed text-gray-400">{ind.desc}</p>
          <div className="flex items-center gap-3 mt-2 text-[12px]">
            <span className="text-gray-500">Current: <b className="text-gray-300">{fmt(ind.current, ind.unit === "Ratio" ? 1 : 0)}</b></span>
            <span className="text-gray-500">2030 Target: <b style={{ color }}>{fmt(ind.target, ind.unit === "Ratio" ? 1 : 0)}</b></span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────
function AgentSection({ agent, delay, onSettings, children }: {
  agent: AgentDef; delay: number; onSettings: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex flex-col bg-[#060e06]/90 border rounded-lg overflow-hidden"
      style={{ borderColor: `${agent.color}30` }}>
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b flex-shrink-0" style={{ borderColor: `${agent.color}20` }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <AgentBadge id={agent.id} color={agent.color} />
          <h3 className="text-[10px] font-black tracking-[0.12em] uppercase truncate" style={{ color: agent.color }}>{agent.name}</h3>
        </div>
        <button onClick={onSettings}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase rounded-sm border transition-all hover:bg-[#00B558]/10 cursor-pointer flex-shrink-0"
          style={{ color: agent.color, borderColor: `${agent.color}40` }}>
          <Settings className="w-3 h-3" />Settings
        </button>
      </div>
      <div className="flex-1 flex flex-col p-2 gap-1.5 min-h-0">{children}</div>
    </motion.div>
  );
}

// ─── KPI Card (for UT traffic section) ────────────────────────
function KPICard({ icon, label, current, simulated, unit, color, improved, inverse, desc, target }: {
  icon: React.ReactNode; label: string; current: number; simulated: number; unit: string;
  color: string; improved: boolean; inverse?: boolean; desc?: string; target?: number;
}) {
  const changed = simulated !== current;
  const delta = inverse ? current - simulated : simulated - current;
  const deltaPct = current > 0 ? Math.round((delta / current) * 100) : simulated > 0 ? 100 : 0;
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const onEnter = () => {
    if (ref.current && desc) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top - 4, left: Math.min(r.left, window.innerWidth - 340) });
    }
    setHover(true);
  };

  return (
    <div ref={ref} onMouseEnter={onEnter} onMouseLeave={() => setHover(false)}
      className="flex-1 flex items-center gap-2 px-2.5 py-1.5 bg-[#060e06]/80 rounded border cursor-help" style={{ borderColor: `${color}25` }}>
      <div className="flex-shrink-0" style={{ color }}>{icon}</div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-gray-500">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[16px] font-black tracking-wider" style={{ color: changed ? color : '#9ca3af' }}>
            {simulated.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-600 font-medium">{unit}</span>
          {changed && (
            <span className={`text-[10px] font-bold ${improved ? 'text-[#00B558]' : 'text-[#ff4444]'}`}>
              {improved ? '↑' : '↓'}{Math.abs(deltaPct)}%
            </span>
          )}
        </div>
        <span className="text-[12px] text-gray-600">Baseline: {current.toLocaleString()} {unit}</span>
      </div>
      {hover && desc && createPortal(
        <div className="fixed z-[200] w-[320px] p-3.5 bg-[#0d1a0d] border border-[#00B558]/30 rounded shadow-xl pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}>
          <div className="text-[13px] font-bold text-gray-200 uppercase tracking-wider mb-1.5">{label}</div>
          <p className="text-[12px] leading-relaxed text-gray-400">{desc}</p>
          {target !== undefined && (
            <div className="flex items-center gap-3 mt-2 text-[12px]">
              <span className="text-gray-500">Current: <b className="text-gray-300">{current.toLocaleString()}</b></span>
              <span className="text-gray-500">2030 Target: <b style={{ color }}>{target.toLocaleString()} {unit}</b></span>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── UT Content — Downtown Riyadh Traffic Simulation ──────────
function UTContent({ params }: { params: UTParams }) {
  // Current traffic GeoJSON (baseline — never changes)
  const currentGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: BASE_TRAFFIC.map(p => ({
      type: "Feature" as const,
      properties: { weight: p.w },
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    })),
  }), []);

  // Simulation GeoJSON (reactive to settings)
  const simGeoJSON = useMemo(() => {
    const capR = 1 - (params.additionalLanes / 4) * 0.25;
    const metR = 1 - (params.metroShift / 40) * 0.35;
    const sigR = 1 - ((params.signalOptimization - 30) / 70) * 0.20;
    const priR = 1 - (params.congestionPricing / 30) * 0.30;
    return {
      type: "FeatureCollection" as const,
      features: BASE_TRAFFIC.map(p => ({
        type: "Feature" as const,
        properties: {
          weight: Math.max(0.02, p.w * capR * metR * (p.intersection ? sigR : 1) * (p.core ? priR : 1)),
        },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    };
  }, [params]);

  // KPI calculations
  const kpis = useMemo(() => {
    const { additionalLanes, metroShift, signalOptimization, congestionPricing } = params;
    const gain = (additionalLanes / 4) * 0.3 + (metroShift / 40) * 0.4 + ((signalOptimization - 30) / 70) * 0.25 + (congestionPricing / 30) * 0.15;
    return {
      avgSpeed: Math.min(42, Math.round(18 * (1 + gain))),
      peakDelay: Math.max(8, Math.round(45 / (1 + gain))),
      throughput: Math.min(22000, Math.round(12400 * (1 + (additionalLanes / 4) * 0.2 + ((signalOptimization - 30) / 70) * 0.15 + (metroShift / 40) * 0.1))),
      co2Reduction: Math.min(45, Math.round((metroShift / 40) * 25 + (congestionPricing / 30) * 12 + ((signalOptimization - 30) / 70) * 8)),
    };
  }, [params]);

  const hasChanges = params.additionalLanes > 0 || params.metroShift > 0 || params.signalOptimization > 30 || params.congestionPricing > 0;

  return (
    <>
      {/* Two maps side by side */}
      <div className="flex-1 flex gap-1.5 min-h-0">
        {/* Current */}
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 px-1">Current Traffic</span>
          <div className="flex-1 rounded border border-[#ffffff10] overflow-hidden">
            <Map initialViewState={DOWNTOWN_VIEW} mapStyle={MAP_STYLE} interactive={false}>
              <SafeSource id="current-traffic" type="geojson" data={currentGeoJSON as any}>
                <SafeLayer id="current-heat" type="heatmap" paint={HEATMAP_PAINT} />
              </SafeSource>
            </Map>
          </div>
        </div>
        {/* Simulation */}
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Simulated Traffic</span>
            {hasChanges && <span className="text-[8px] px-1 py-[1px] rounded bg-[#00B558]/15 text-[#00B558] font-bold tracking-wider uppercase">Modified</span>}
          </div>
          <div className="flex-1 rounded border overflow-hidden" style={{ borderColor: hasChanges ? '#00B55840' : '#ffffff10' }}>
            <Map initialViewState={DOWNTOWN_VIEW} mapStyle={MAP_STYLE} interactive={false}>
              <SafeSource id="sim-traffic" type="geojson" data={simGeoJSON as any}>
                <SafeLayer id="sim-heat" type="heatmap" paint={HEATMAP_PAINT} />
              </SafeSource>
            </Map>
          </div>
        </div>
      </div>
      {/* KPI strip */}
      <div className="flex gap-1.5 flex-shrink-0">
        <KPICard icon={<TrendingUp className="w-4 h-4" />} label="Avg. Speed" current={18} simulated={kpis.avgSpeed} unit="km/h" color="#00B558" improved={kpis.avgSpeed > 18} desc="Average network-wide vehicle speed during peak hours. Riyadh's 2025 baseline of 18 km/h reflects chronic congestion on King Fahd Road, Makkah Road, and the Northern Ring Road." target={35} />
        <KPICard icon={<Clock className="w-4 h-4" />} label="Peak Delay" current={45} simulated={kpis.peakDelay} unit="min" color="#FCD34D" improved={kpis.peakDelay < 45} inverse desc="Average additional travel time per trip during morning (7-9 AM) and evening (4-7 PM) peaks compared to free-flow conditions. Includes intersection wait times, merge delays, and signal cycle inefficiencies." target={15} />
        <KPICard icon={<Car className="w-4 h-4" />} label="Throughput" current={12400} simulated={kpis.throughput} unit="veh/hr" color="#3b82f6" improved={kpis.throughput > 12400} desc="Vehicles per hour passing through Riyadh's 12 major arterial corridors during peak periods. Measures effective road capacity utilization after accounting for signal timing, lane management, and mode shift." target={18000} />
        <KPICard icon={<Leaf className="w-4 h-4" />} label="CO₂ Reduction" current={0} simulated={kpis.co2Reduction} unit="%" color="#10b981" improved={kpis.co2Reduction > 0} desc="Percentage reduction in transport-related CO₂ emissions from baseline. Driven by reduced congestion, improved traffic flow, modal shift to metro/BRT, and optimized signal cycles reducing idle time." target={40} />
      </div>
    </>
  );
}

// ─── MI Content ───────────────────────────────────────────────
function MIContent({ params }: { params: MIParams }) {
  const a = AGENTS[1];
  const values = useMemo(() => [
    mul(10.2, params.shadeInfra, 1),
    mul(74, params.cyclingInvestment * 0.4 + 0.6),
    mul(78, params.transitExpansion * 0.4 + 0.6),
  ], [params]);

  const radarData = useMemo(() => MI_RADAR_BASE.map((d, i) => ({
    s: d.s,
    current: d.base,
    simulated: values[i],
    target: d.target,
  })), [values]);

  return (
    <>
      <div className="flex-1 min-h-0 bg-[#070d07]/60 rounded border border-[#FCD34D]/10 p-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#0a1a0a" />
            <PolarAngleAxis dataKey="s" tick={{ fontSize: 9, fill: "#4a6a4a" }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar name="Current" dataKey="current" stroke="#FCD34D50" fill="#FCD34D10" strokeWidth={1} />
            <Radar name="Simulated" dataKey="simulated" stroke="#FCD34D" fill="#FCD34D30" strokeWidth={1.5} />
            <Radar name="2030 Target" dataKey="target" stroke="#00B558" fill="#00B55815" strokeWidth={1} strokeDasharray="3 3" />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {a.indicators.map((ind, i) => (
        <IndicatorRow key={ind.id} ind={ind} value={values[i]} color={a.color} />
      ))}
    </>
  );
}

// ─── SO Content ───────────────────────────────────────────────
function SOContent({ params }: { params: SOParams }) {
  const a = AGENTS[2];
  const values = useMemo(() => [
    Math.min(100, mul(84, params.sustainabilityWeight * 0.3 + 0.7)),
    mul(3.2, params.investmentScale * 0.4 + 0.6, 1),
    Math.min(100, mul(88, params.equityPriority * 0.3 + 0.7)),
  ], [params]);

  const barData = useMemo(() => SO_BAR_BASE.map((d, i) => ({
    n: d.n,
    current: d.cur,
    simulated: values[i],
    target: d.tgt,
  })), [values]);

  // Normalize for display (cost-benefit ratio is small, others are %)
  const displayData = useMemo(() => barData.map(d => ({
    n: d.n,
    current: d.n === "Cost-Benefit" ? (d.current / 4.5) * 100 : d.current,
    simulated: d.n === "Cost-Benefit" ? (d.simulated / 4.5) * 100 : d.simulated,
    target: d.n === "Cost-Benefit" ? 100 : d.target,
  })), [barData]);

  return (
    <>
      <div className="flex-1 min-h-0 bg-[#070d07]/60 rounded border border-[#00B558]/10 p-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#0a1a0a" strokeDasharray="3 3" />
            <XAxis dataKey="n" tick={{ fontSize: 9, fill: "#3a5a3a" }} />
            <YAxis tick={{ fontSize: 9, fill: "#3a5a3a" }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: "#0a140a", border: "1px solid #00B55830", fontSize: 9 }} />
            <Bar dataKey="current" fill="#ffffff15" name="Current" radius={[2, 2, 0, 0]} />
            <Bar dataKey="simulated" fill="#00B55880" name="Simulated" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {a.indicators.map((ind, i) => (
        <IndicatorRow key={ind.id} ind={ind} value={values[i]} color={a.color} />
      ))}
    </>
  );
}

// ─── EF Content — Economic & Financial Simulation ─────────────
function EFContent({ params }: { params: EFParams }) {
  const a = AGENTS[3];

  // Economic model calculations
  const metrics = useMemo(() => {
    const { mixedUseRatio, pppShare, farBonus, landValueCapture, anchorIncentive } = params;
    const mixedGain = (mixedUseRatio - 15) / 45; // 0 → 1
    const pppGain = (pppShare - 20) / 50;
    const farGain = farBonus / 30;
    const lvcGain = (landValueCapture - 5) / 35;
    const anchorGain = anchorIncentive / 50;

    // IRR: mixed-use boosts revenue, PPP reduces cost, FAR adds density revenue
    const irr = parseFloat((8 + mixedGain * 4.5 + pppGain * 2.5 + farGain * 2.0 + lvcGain * 0.5 + anchorGain * 0.5).toFixed(1));
    // Self-sufficiency: mixed-use generates local revenue, LVC captures value
    const selfSuff = Math.min(85, Math.round(25 + mixedGain * 25 + lvcGain * 15 + farGain * 8 + anchorGain * 7));
    // Funding gap: PPP fills gap, LVC and FAR contribute
    const gap = parseFloat(Math.max(1.5, 12 - pppGain * 4.0 - lvcGain * 2.5 - farGain * 1.5 - mixedGain * 0.8).toFixed(1));
    // Job-housing: mixed-use and anchor tenants drive up
    const jobHousing = parseFloat(Math.min(1.4, 0.6 + mixedGain * 0.30 + anchorGain * 0.25 + farGain * 0.10).toFixed(2));
    // Leverage: PPP and incentives attract private capital
    const leverage = parseFloat(Math.min(5.5, 1.8 + pppGain * 1.2 + anchorGain * 0.8 + mixedGain * 0.4 + farGain * 0.3).toFixed(1));

    return { irr, selfSuff, gap, jobHousing, leverage };
  }, [params]);

  const values = [metrics.irr, metrics.selfSuff, metrics.gap, metrics.jobHousing, metrics.leverage];

  // Funding sources breakdown (for stacked bar)
  const fundingSources = useMemo(() => {
    const total = 12; // Total programme cost SAR B
    const pppAmount = (params.pppShare / 100) * total;
    const lvcAmount = (params.landValueCapture / 100) * total * 0.6;
    const farAmount = (params.farBonus / 100) * total * 0.4;
    const anchorAmount = (params.anchorIncentive / 100) * total * 0.3;
    const govAmount = Math.max(0, total - pppAmount - lvcAmount - farAmount - anchorAmount);
    return [
      { name: "Gov. Budget", current: 9.6, simulated: govAmount, color: "#64748b" },
      { name: "PPP", current: 2.4, simulated: pppAmount, color: "#3b82f6" },
      { name: "Land Value Capture", current: 0, simulated: lvcAmount, color: "#10b981" },
      { name: "FAR Contrib.", current: 0, simulated: farAmount, color: "#8b5cf6" },
      { name: "Anchor Co-invest", current: 0, simulated: anchorAmount, color: "#f59e0b" },
    ];
  }, [params]);

  const fundingBarData = useMemo(() => ([
    { label: "Current", ...Object.fromEntries(fundingSources.map(s => [s.name, s.current])) },
    { label: "Simulated", ...Object.fromEntries(fundingSources.map(s => [s.name, s.simulated])) },
  ]), [fundingSources]);

  const hasChanges = params.mixedUseRatio > 15 || params.pppShare > 20 || params.farBonus > 0 || params.landValueCapture > 5 || params.anchorIncentive > 0;

  return (
    <>
      {/* Top section: Gauge KPIs + Funding chart side by side */}
      <div className="flex gap-3 flex-shrink-0">
        {/* IRR Gauge */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#070d07]/60 rounded border border-[#3b82f6]/15 py-3 px-2">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-1">Project IRR</span>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1a2f1a" strokeWidth="5" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={metrics.irr >= 12 ? "#3b82f6" : "#64748b"}
                strokeWidth="5" strokeDasharray={`${(metrics.irr / 20) * 201} 201`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-black tracking-tight" style={{ color: hasChanges ? '#3b82f6' : '#9ca3af' }}>{metrics.irr}%</span>
              <span className="text-[10px] text-gray-600">Target: 18%</span>
            </div>
          </div>
          <span className="text-[12px] text-gray-600 mt-1">Baseline: 8%</span>
        </div>
        {/* Self-Sufficiency Gauge */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#070d07]/60 rounded border border-[#10b981]/15 py-3 px-2">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-1">Fiscal Self-Sufficiency</span>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1a2f1a" strokeWidth="5" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={metrics.selfSuff >= 50 ? "#10b981" : "#64748b"}
                strokeWidth="5" strokeDasharray={`${(metrics.selfSuff / 100) * 201} 201`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-black tracking-tight" style={{ color: hasChanges ? '#10b981' : '#9ca3af' }}>{metrics.selfSuff}%</span>
              <span className="text-[10px] text-gray-600">Target: 75%</span>
            </div>
          </div>
          <span className="text-[12px] text-gray-600 mt-1">Baseline: 25%</span>
        </div>
        {/* Funding Gap */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#070d07]/60 rounded border border-[#f59e0b]/15 py-3 px-2">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-1">Funding Gap</span>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1a2f1a" strokeWidth="5" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={metrics.gap <= 6 ? "#10b981" : "#f59e0b"}
                strokeWidth="5" strokeDasharray={`${((12 - metrics.gap) / 12) * 201} 201`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-black tracking-tight" style={{ color: hasChanges ? (metrics.gap <= 6 ? '#10b981' : '#f59e0b') : '#9ca3af' }}>{metrics.gap}B</span>
              <span className="text-[10px] text-gray-600">Target: ≤3B</span>
            </div>
          </div>
          <span className="text-[12px] text-gray-600 mt-1">Baseline: 12B SAR</span>
        </div>
      </div>

      {/* Funding sources stacked bar */}
      <div className="flex-1 min-h-0 flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Funding Sources Breakdown (SAR Billions)</span>
          {hasChanges && <span className="text-[8px] px-1 py-[1px] rounded bg-[#3b82f6]/15 text-[#3b82f6] font-bold tracking-wider uppercase">Modified</span>}
        </div>
        <div className="flex-1 min-h-0 bg-[#070d07]/60 rounded border border-[#3b82f6]/10 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fundingBarData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid stroke="#0a1a0a" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#3a5a3a" }} domain={[0, 14]} unit=" B" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 700 }} width={75} />
              <Tooltip contentStyle={{ backgroundColor: "#0a140a", border: "1px solid #3b82f630", fontSize: 10 }} formatter={(v: number) => `${v.toFixed(1)}B SAR`} />
              {fundingSources.map(s => (
                <Bar key={s.name} dataKey={s.name} stackId="a" fill={s.color} radius={0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicator rows */}
      <div className="flex flex-col gap-0 flex-shrink-0">
        {a.indicators.map((ind, i) => (
          <IndicatorRow key={ind.id} ind={ind} value={values[i]} color={a.color} />
        ))}
      </div>
    </>
  );
}

// ─── ER Content — Environmental & Resilience Simulation ───────
function ERContent({ params }: { params: ERParams }) {
  const [vizMode, setVizMode] = useState<"flood" | "heat">("flood");
  const [selectedFlood, setSelectedFlood] = useState<number | null>(null);

  // Flood spots with reactive radii
  const floodSpots = useMemo(() => {
    const drainR = 1 - (params.drainageExpansion / 50) * 0.35;
    const basinR = 1 - (params.retentionBasins / 8) * 0.40;
    const codeR = 1 - ((params.buildingCode - 35) / 65) * 0.15;
    return FLOOD_SPOTS.map(s => ({
      ...s,
      simRadius: Math.max(50, Math.round(s.baseRadius * drainR * basinR * codeR)),
      simRisk: Math.max(8, Math.round(s.risk * drainR * basinR * codeR)),
    }));
  }, [params]);

  // Flood GeoJSON circles for map
  const floodCurrentGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: FLOOD_SPOTS.map((s, i) => ({
      type: "Feature" as const,
      properties: { radius: s.baseRadius, risk: s.risk, name: s.name, idx: i },
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
    })),
  }), []);

  const floodSimGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: floodSpots.map((s, i) => ({
      type: "Feature" as const,
      properties: { radius: s.simRadius, risk: s.simRisk, name: s.name, idx: i },
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
    })),
  }), [floodSpots]);

  // Heat island GeoJSON
  const heatCurrentGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: BASE_HEAT_ISLANDS.map(p => ({
      type: "Feature" as const,
      properties: { weight: p.w },
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    })),
  }), []);

  const heatSimGeoJSON = useMemo(() => {
    const greenR = 1 - ((params.greenCover - 8) / 22) * 0.35;
    const coolR = 1 - ((params.coolRoof - 5) / 55) * 0.30;
    const codeR = 1 - ((params.buildingCode - 35) / 65) * 0.15;
    return {
      type: "FeatureCollection" as const,
      features: BASE_HEAT_ISLANDS.map(p => ({
        type: "Feature" as const,
        properties: { weight: Math.max(0.02, p.w * (p.urban ? greenR * coolR : 1) * codeR) },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    };
  }, [params]);

  // Flood circle layer paint
  const floodCirclePaint: any = {
    'circle-radius': ['interpolate', ['linear'], ['zoom'],
      9, ['/', ['get', 'radius'], 200],
      12, ['/', ['get', 'radius'], 50],
      14, ['/', ['get', 'radius'], 20],
    ],
    'circle-color': ['interpolate', ['linear'], ['get', 'risk'],
      20, 'rgba(16, 185, 129, 0.4)',
      50, 'rgba(252, 211, 77, 0.5)',
      75, 'rgba(249, 115, 22, 0.6)',
      90, 'rgba(239, 68, 68, 0.7)',
    ],
    'circle-stroke-width': 1.5,
    'circle-stroke-color': ['interpolate', ['linear'], ['get', 'risk'],
      20, '#10b981',
      50, '#FCD34D',
      75, '#f97316',
      90, '#ef4444',
    ],
    'circle-opacity': 0.7,
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const { drainageExpansion, greenCover, retentionBasins, buildingCode, coolRoof } = params;
    const drainGain = (drainageExpansion / 50);
    const basinGain = (retentionBasins / 8);
    const greenGain = ((greenCover - 8) / 22);
    const codeGain = ((buildingCode - 35) / 65);
    const coolGain = ((coolRoof - 5) / 55);
    return {
      floodRisk: Math.min(95, Math.round(42 + drainGain * 28 + basinGain * 18 + codeGain * 7)),
      heatReduction: Math.min(5.5, parseFloat(((greenGain * 2.5) + coolGain * 1.8 + codeGain * 0.6).toFixed(1))),
      resilienceScore: Math.min(95, Math.round(35 + codeGain * 30 + drainGain * 12 + basinGain * 8 + greenGain * 5 + coolGain * 5)),
    };
  }, [params]);

  const hasChanges = params.drainageExpansion > 0 || params.retentionBasins > 0 || params.greenCover > 8 || params.buildingCode > 35 || params.coolRoof > 5;

  // Flood marker component matching Panorama MapLabel style
  const FloodMarkerLabel = ({ spot, idx, simulated }: { spot: typeof FLOOD_SPOTS[0] & { simRadius?: number; simRisk?: number }; idx: number; simulated?: boolean }) => {
    const risk = simulated ? (spot as any).simRisk ?? spot.risk : spot.risk;
    const radius = simulated ? (spot as any).simRadius ?? spot.baseRadius : spot.baseRadius;
    const isSelected = selectedFlood === idx;
    const isHigh = risk >= 75;
    const color = risk >= 85 ? '#ff4444' : risk >= 65 ? '#FCD34D' : '#10b981';
    const borderCls = risk >= 85 ? 'border-[#ff4444]/40' : risk >= 65 ? 'border-[#FCD34D]/40' : 'border-[#10b981]/40';

    return (
      <div className={`flex flex-col items-center ${isSelected ? 'z-50' : 'z-10'}`}
        onClick={(e) => { e.stopPropagation(); setSelectedFlood(isSelected ? null : idx); }}
        style={{ cursor: 'pointer', transformOrigin: 'bottom center', transform: isSelected ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
        {/* Info box (top) */}
        <div className={`px-2.5 py-1.5 bg-[#051005]/90 backdrop-blur-md border ${borderCls} rounded-[3px] flex flex-col items-center pointer-events-auto ${isSelected ? 'min-w-[160px]' : 'min-w-[100px]'}`}
          style={{ boxShadow: `0 0 15px ${color}15` }}>
          <span className="text-[9px] font-black tracking-[0.12em] uppercase mb-0.5 whitespace-nowrap" style={{ color }}>{spot.name}</span>
          <div className="flex items-baseline justify-center gap-1.5 w-full">
            <span className="text-[15px] font-black text-gray-200 tracking-tight">{risk}%</span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Risk</span>
          </div>
          {isSelected && (
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Flood Zone: {radius}m</span>
          )}
        </div>
        {/* Connecting line */}
        <div className="w-[1px] h-2.5 opacity-50" style={{ backgroundImage: `linear-gradient(to bottom, ${color}, transparent)` }} />
        {/* Pulsing icon (bottom, at map point) */}
        <div className="relative flex items-center justify-center">
          {isHigh && (
            <>
              <div className="absolute w-8 h-8 rounded-full border border-solid opacity-20 animate-ping" style={{ borderColor: color, animationDuration: '3s' }} />
              <div className="absolute w-5 h-5 rounded-full border border-solid opacity-40 animate-ping" style={{ borderColor: color, animationDuration: '2s' }} />
            </>
          )}
          <div className="relative w-5 h-5 rounded-full flex items-center justify-center bg-[#070d07]/80 border z-10"
            style={{ borderColor: `${color}80`, boxShadow: `0 0 8px ${color}40` }}>
            <Droplets className="w-2.5 h-2.5" style={{ color }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Viz mode selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-600">Visualize:</span>
        {([
          { id: "flood" as const, label: "Flood Risk Zones", icon: <Droplets className="w-3.5 h-3.5" /> },
          { id: "heat" as const, label: "Heat Islands", icon: <Thermometer className="w-3.5 h-3.5" /> },
        ]).map(opt => (
          <button key={opt.id} onClick={() => setVizMode(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-sm border transition-all cursor-pointer ${
              vizMode === opt.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            }`}
            style={{
              color: vizMode === opt.id ? '#10b981' : '#6b7280',
              borderColor: vizMode === opt.id ? '#10b98150' : '#ffffff15',
              backgroundColor: vizMode === opt.id ? '#10b98110' : 'transparent',
            }}>
            {opt.icon}{opt.label}
          </button>
        ))}
      </div>

      {/* Two maps side by side */}
      <div className="flex-1 flex gap-1.5 min-h-0">
        {/* Current */}
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 px-1">
            {vizMode === "flood" ? "Current Flood Risk" : "Current Heat Islands"}
          </span>
          <div className="flex-1 rounded border border-[#ffffff10] overflow-hidden relative">
            <Map initialViewState={ENV_RISK_VIEW} mapStyle={MAP_STYLE} interactive={false}>
              {vizMode === "flood" ? (
                <>
                  <SafeSource id="current-flood" type="geojson" data={floodCurrentGeoJSON as any}>
                    <SafeLayer id="current-flood-circles" type="circle" paint={floodCirclePaint} />
                  </SafeSource>
                  {FLOOD_SPOTS.map((s, i) => (
                    <Marker key={`cur-${i}`} longitude={s.lng} latitude={s.lat} anchor="bottom">
                      <FloodMarkerLabel spot={s} idx={i} />
                    </Marker>
                  ))}
                </>
              ) : (
                <SafeSource id="current-heat" type="geojson" data={heatCurrentGeoJSON as any}>
                  <SafeLayer id="current-heat-layer" type="heatmap" paint={HEAT_ISLAND_PAINT} />
                </SafeSource>
              )}
            </Map>
          </div>
        </div>
        {/* Simulation */}
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">
              {vizMode === "flood" ? "Simulated Flood Risk" : "Simulated Heat Islands"}
            </span>
            {hasChanges && <span className="text-[8px] px-1 py-[1px] rounded bg-[#10b981]/15 text-[#10b981] font-bold tracking-wider uppercase">Modified</span>}
          </div>
          <div className="flex-1 rounded border overflow-hidden relative" style={{ borderColor: hasChanges ? '#10b98140' : '#ffffff10' }}>
            <Map initialViewState={ENV_RISK_VIEW} mapStyle={MAP_STYLE} interactive={false}>
              {vizMode === "flood" ? (
                <>
                  <SafeSource id="sim-flood" type="geojson" data={floodSimGeoJSON as any}>
                    <SafeLayer id="sim-flood-circles" type="circle" paint={floodCirclePaint} />
                  </SafeSource>
                  {floodSpots.map((s, i) => (
                    <Marker key={`sim-${i}`} longitude={s.lng} latitude={s.lat} anchor="bottom">
                      <FloodMarkerLabel spot={s} idx={i} simulated />
                    </Marker>
                  ))}
                </>
              ) : (
                <SafeSource id="sim-heat" type="geojson" data={heatSimGeoJSON as any}>
                  <SafeLayer id="sim-heat-layer" type="heatmap" paint={HEAT_ISLAND_PAINT} />
                </SafeSource>
              )}
            </Map>
          </div>
        </div>
      </div>
      {/* KPI strip */}
      <div className="flex gap-1.5 flex-shrink-0">
        <KPICard icon={<Droplets className="w-4 h-4" />} label="Flood Risk" current={42} simulated={kpis.floodRisk} unit="Score" color="#10b981" improved={kpis.floodRisk > 42} desc="Composite score measuring flood resilience across wadi channels, basins, and 340km drain network. Improved by drainage expansion, retention basins, and building code compliance." target={85} />
        <KPICard icon={<TreePine className="w-4 h-4" />} label="Heat Island" current={0} simulated={kpis.heatReduction} unit="°C" color="#FCD34D" improved={kpis.heatReduction > 0} desc="Reduction in urban heat island intensity from vegetation, cool roofs, reflective surfaces, and shade infrastructure. Riyadh's baseline UHI is +4–6°C above surrounding desert." target={3.5} />
        <KPICard icon={<Shield className="w-4 h-4" />} label="Resilience" current={35} simulated={kpis.resilienceScore} unit="%" color="#3b82f6" improved={kpis.resilienceScore > 35} desc="Building stock meeting flood-proofing, heat-resistance, and water-efficiency standards. Saudi Building Code (SBC 601/602) mandated 2018; baseline adoption ~35%." target={90} />
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function Simulation() {
  const [utP, setUtP] = useState<UTParams>(DEFAULT_UT);
  const [miP, setMiP] = useState<MIParams>(DEFAULT_MI);
  const [soP, setSoP] = useState<SOParams>(DEFAULT_SO);
  const [efP, setEfP] = useState<EFParams>(DEFAULT_EF);
  const [erP, setErP] = useState<ERParams>(DEFAULT_ER);

  const [utD, setUtD] = useState<UTParams>(DEFAULT_UT);
  const [miD, setMiD] = useState<MIParams>(DEFAULT_MI);
  const [soD, setSoD] = useState<SOParams>(DEFAULT_SO);
  const [efD, setEfD] = useState<EFParams>(DEFAULT_EF);
  const [erD, setErD] = useState<ERParams>(DEFAULT_ER);

  const [modal, setModal] = useState<"UT" | "MI" | "SO" | "EF" | "ER" | null>(null);
  const [activeTab, setActiveTab] = useState<"UT" | "MI" | "SO" | "EF" | "ER">("UT");
  const [thinking, setThinking] = useState(false);
  const [thinkingProgress, setThinkingProgress] = useState(0);
  const [thinkingStep, setThinkingStep] = useState("");

  const THINKING_STEPS = [
    "Initializing simulation engine...",
    "Loading downtown Riyadh road network (6 corridors, 180 intersections)...",
    "Calibrating traffic demand model (1,200 sensor feeds)...",
    "Running micro-simulation (10,000 iterations)...",
    "Computing intersection delay propagation...",
    "Evaluating congestion redistribution effects...",
    "Calculating CO₂ emission differentials...",
    "Generating heatmap visualization...",
    "Validating results against baseline...",
    "Finalizing simulation output...",
  ];

  const applyWithThinking = useCallback((applyFn: () => void) => {
    setThinking(true);
    setThinkingProgress(0);
    setThinkingStep(THINKING_STEPS[0]);
    const duration = 4000 + Math.random() * 4000; // 4-8 seconds
    const interval = 80;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setThinkingProgress(pct);
      const stepIdx = Math.min(THINKING_STEPS.length - 1, Math.floor((pct / 100) * THINKING_STEPS.length));
      setThinkingStep(THINKING_STEPS[stepIdx]);
      if (elapsed >= duration) {
        clearInterval(timer);
        applyFn();
        setThinking(false);
      }
    }, interval);
  }, []);

  const open = useCallback((id: typeof modal) => {
    if (id === "UT") setUtD(utP);
    if (id === "MI") setMiD(miP);
    if (id === "SO") setSoD(soP);
    if (id === "EF") setEfD(efP);
    if (id === "ER") setErD(erP);
    setModal(id);
  }, [utP, miP, soP, efP, erP]);

  return (
    <div className="w-full h-full flex flex-col pointer-events-auto bg-[#020805] pt-[80px] pb-[48px]">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-[#00B558]/15 bg-[#050c05]/80 flex-shrink-0">
        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Active Agents</span>
        {AGENTS.map(a => (
          <div key={a.id} className="flex items-center gap-1">
            <AgentBadge id={a.id} color={a.color} />
            <span className="text-[9px] text-gray-600">{a.indicators.length}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00B558] animate-pulse" />
          <span className="text-[9px] text-[#00B558] font-bold tracking-widest uppercase">16 Indicators · 5 Agents</span>
        </div>
      </div>

      {/* All 5 agents in tabs */}
      <div className="flex-1 flex flex-col gap-0 p-1.5 min-h-0">
        {/* Tab bar */}
        <div className="flex items-center gap-0 mb-1 flex-shrink-0">
          {([
            { id: "UT" as const, agent: AGENTS[0], label: "Urban Test Agent", ready: true },
            { id: "EF" as const, agent: AGENTS[3], label: "Economic Forecasting", ready: true },
            { id: "ER" as const, agent: AGENTS[4], label: "Environmental & Resilience", ready: true },
            { id: "MI" as const, agent: AGENTS[1], label: "Mobility Intelligence", ready: false },
            { id: "SO" as const, agent: AGENTS[2], label: "Strategic Optimization", ready: false },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
              style={{ color: tab.agent.color }}>
              <AgentBadge id={tab.id} color={tab.agent.color} />
              {tab.label}
              {!tab.ready && <span className="text-[7px] px-1 py-[0.5px] rounded bg-[#ffffff08] text-gray-500 font-bold tracking-wider uppercase ml-0.5">Soon</span>}
            </button>
          ))}
          <div className="ml-auto">
            {activeTab !== "MI" && activeTab !== "SO" && (
              <button onClick={() => open(activeTab)}
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded-sm border transition-all hover:bg-[#00B558]/10 cursor-pointer flex-shrink-0"
                style={{ color: AGENTS[['UT','MI','SO','EF','ER'].indexOf(activeTab)].color, borderColor: `${AGENTS[['UT','MI','SO','EF','ER'].indexOf(activeTab)].color}40` }}>
                <Settings className="w-3 h-3" />Settings
              </button>
            )}
          </div>
        </div>
        {/* Tab content */}
        <div className="flex-1 flex flex-col bg-[#060e06]/90 border rounded-lg overflow-hidden min-h-0 p-2 gap-1.5"
          style={{ borderColor: `${AGENTS[['UT','MI','SO','EF','ER'].indexOf(activeTab)].color}30` }}>
          {activeTab === "UT" && <UTContent params={utP} />}
          {activeTab === "EF" && <EFContent params={efP} />}
          {activeTab === "ER" && <ERContent params={erP} />}
          {(activeTab === "MI" || activeTab === "SO") && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: `${AGENTS[activeTab === "MI" ? 1 : 2].color}30` }}>
                  <Brain className="w-7 h-7" style={{ color: AGENTS[activeTab === "MI" ? 1 : 2].color, opacity: 0.4 }} />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[14px] font-black tracking-[0.2em] uppercase text-gray-400">Coming Soon</span>
                <span className="text-[11px] text-gray-600 max-w-[360px] text-center leading-relaxed">
                  {activeTab === "MI"
                    ? "The Mobility Intelligence Agent will analyse pedestrian, cycling, and transit mode share with shade and cooling intervention recommendations."
                    : "The Strategic Optimization Agent will rank planning scenarios by sustainability, cost-benefit ratio, and social equity trade-offs."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === "UT" && <UTSettingsModal params={utD} onChange={setUtD} onApply={() => applyWithThinking(() => setUtP(utD))} onReset={() => setUtD(DEFAULT_UT)} onClose={() => setModal(null)} />}
        {modal === "MI" && <MISettingsModal params={miD} onChange={setMiD} onApply={() => applyWithThinking(() => setMiP(miD))} onReset={() => setMiD(DEFAULT_MI)} onClose={() => setModal(null)} />}
        {modal === "SO" && <SOSettingsModal params={soD} onChange={setSoD} onApply={() => applyWithThinking(() => setSoP(soD))} onReset={() => setSoD(DEFAULT_SO)} onClose={() => setModal(null)} />}
        {modal === "EF" && <EFSettingsModal params={efD} onChange={setEfD} onApply={() => applyWithThinking(() => setEfP(efD))} onReset={() => setEfD(DEFAULT_EF)} onClose={() => setModal(null)} />}
        {modal === "ER" && <ERSettingsModal params={erD} onChange={setErD} onApply={() => applyWithThinking(() => setErP(erD))} onReset={() => setErD(DEFAULT_ER)} onClose={() => setModal(null)} />}
      </AnimatePresence>

      {/* Thinking overlay */}
      <AnimatePresence>
        {thinking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-[#020502]/85 backdrop-blur-lg pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center gap-5 max-w-[420px] px-8 py-10"
            >
              {/* Brain icon with glow pulse */}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-[#00B558]/20 blur-xl"
                  style={{ margin: -20 }}
                />
                <Brain className="w-12 h-12 text-[#00B558]" />
              </div>

              {/* Title */}
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#00B558] animate-spin" />
                <span className="text-[14px] font-black tracking-[0.2em] uppercase text-white">
                  AI Simulation Running
                </span>
              </div>

              {/* Current step */}
              <motion.p
                key={thinkingStep}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-[#00B558]/80 font-mono tracking-wide text-center min-h-[16px]"
              >
                {thinkingStep}
              </motion.p>

              {/* Progress bar */}
              <div className="w-full max-w-[320px]">
                <div className="w-full h-[3px] bg-[#0a2a0a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#00B558] to-[#00ff88]"
                    style={{ width: `${thinkingProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-gray-600 font-mono">{Math.round(thinkingProgress)}%</span>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {thinkingProgress < 30 ? 'Initializing...' : thinkingProgress < 70 ? 'Simulating...' : thinkingProgress < 95 ? 'Validating...' : 'Complete'}
                  </span>
                </div>
              </div>

              {/* Animated dots */}
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#00B558]"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
