import { useState, useEffect } from "react";
import { 
  Target,
  Maximize,
  Square,
  ArrowRight,
  Info,
  X,
  Zap,
  TrendingUp,
  Activity
} from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import React, { useRef, useCallback } from "react";
import { AnalysisModal } from "../components/AnalysisModal";
import { motion, AnimatePresence } from "motion/react";
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';

// Fix for Figma inspector injecting data-fg props which crash Maplibre
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

declare global {
  interface Window {
    lastMapViewState?: any;
  }
}

// --- MOCK RIYADH COMMUTE ALERTS (flw_1) ---
const COMMUTE_ALERTS = [
  { id: 1, type: "commute", name: "King Fahd Rd", lat: 24.7335, lng: 46.6663, severity: "CRITICAL", delay: "+45m", baselineSpeed: 65, currentSpeed: 12, deviation: "-81.5% SPEED DROP", cause: "Unexpected flash flooding in major underpass due to unseasonal heavy rainfall. Drainage system operating at maximum capacity.", recommendation: "Activate emergency pumps. Reroute upcoming traffic to Olaya St via digital signages." },
  { id: 2, type: "commute", name: "Olaya St", lat: 24.7196, lng: 46.6784, severity: "HIGH", delay: "+32m", baselineSpeed: 40, currentSpeed: 15, deviation: "-62.5% SPEED DROP", cause: "Massive surge in pedestrian and vehicular traffic due to Riyadh Season opening night at Boulevard World.", recommendation: "Extend green light phase at main intersections by 25s. Issue automated warning to navigation apps." },
  { id: 3, type: "commute", name: "Northern Ring", lat: 24.7645, lng: 46.6687, severity: "CRITICAL", delay: "+50m", baselineSpeed: 90, currentSpeed: 20, deviation: "-77.7% SPEED DROP", cause: "Severe localized sandstorm drastically reducing visibility to <50m. Highway patrol manually pacing traffic.", recommendation: "Activate low-visibility VMS warnings. Reduce variable speed limits to 40km/h." },
  { id: 4, type: "commute", name: "King Abdullah Rd", lat: 24.7431, lng: 46.6953, severity: "HIGH", delay: "+28m", baselineSpeed: 50, currentSpeed: 18, deviation: "-64.0% SPEED DROP", cause: "Massive influx of attendees for LEAP Tech Exhibition. Parking capacity exceeded causing cascading gridlock.", recommendation: "Deploy temporary shuttle lanes. Direct incoming traffic to remote overflow parking zones." },
  { id: 5, type: "commute", name: "Khureis Rd", lat: 24.7265, lng: 46.7451, severity: "CRITICAL", delay: "+40m", baselineSpeed: 80, currentSpeed: 14, deviation: "-82.5% SPEED DROP", cause: "VIP diplomatic motorcade routing through main artery. Temporary rolling roadblocks in effect.", recommendation: "Monitor until motorcade passes. Prepare rapid green-light flush to clear buildup." },
  { id: 6, type: "commute", name: "Makkah Rd", lat: 24.6644, lng: 46.6912, severity: "HIGH", delay: "+25m", baselineSpeed: 60, currentSpeed: 22, deviation: "-63.3% SPEED DROP", cause: "Unscheduled road surface subsidence (sinkhole) opening up, likely due to recent geological shifts. 2 lanes closed.", recommendation: "Dispatch emergency civil engineering team. Close affected lanes and merge traffic left." },
  { id: 7, type: "commute", name: "Takhassusi St", lat: 24.7077, lng: 46.6578, severity: "CRITICAL", delay: "+38m", baselineSpeed: 45, currentSpeed: 8, deviation: "-82.2% SPEED DROP", cause: "Major sporting event at King Saud University Stadium ending. 60,000 fans exiting simultaneously.", recommendation: "Implement post-event AI traffic plan #4. Convert center lanes to outbound flow temporarily." },
  { id: 8, type: "commute", name: "Eastern Ring", lat: 24.7338, lng: 46.7725, severity: "HIGH", delay: "+20m", baselineSpeed: 90, currentSpeed: 35, deviation: "-61.1% SPEED DROP", cause: "Unexpected dust storm accumulation and severe crosswinds causing dangerous conditions for high-profile vehicles.", recommendation: "Restrict heavy truck movement on bridge segments. Alert highway patrol to secure perimeter." },
  { id: 9, type: "commute", name: "Abu Bakr Rd", lat: 24.7656, lng: 46.7028, severity: "CRITICAL", delay: "+42m", baselineSpeed: 70, currentSpeed: 10, deviation: "-85.7% SPEED DROP", cause: "National Day Cultural festival parade preparations blocking key intersections ahead of schedule.", recommendation: "Dispatch rapid response traffic wardens. Suggest alternate routes to Balady app users." },
  { id: 10, type: "commute", name: "Prince Turki", lat: 24.7408, lng: 46.6341, severity: "HIGH", delay: "+22m", baselineSpeed: 50, currentSpeed: 18, deviation: "-64.0% SPEED DROP", cause: "Dense morning fog combining with unexpected VIP corridor closures, leading to 64% speed reduction.", recommendation: "Activate road stud lighting. Pulse electronic signs to alert oncoming drivers of sudden stops." },
  { id: 11, type: "commute", name: "King Salman Rd", lat: 24.8156, lng: 46.6111, severity: "HIGH", delay: "+18m", baselineSpeed: 80, currentSpeed: 40, deviation: "-50.0% SPEED DROP", cause: "International marathon routing intersection closure. Unexpectedly high volume of diverted traffic.", recommendation: "Adjust traffic signal timing at detour points to prioritize lateral flow." },
  { id: 12, type: "commute", name: "Dirab Rd", lat: 24.5681, lng: 46.6800, severity: "CRITICAL", delay: "+35m", baselineSpeed: 65, currentSpeed: 15, deviation: "-76.9% SPEED DROP", cause: "Red-level flash flood warnings active. Wadis overflowing onto the carriageway carrying debris.", recommendation: "Dispatch road clearing crew immediately. Place warning barriers and close outside lanes." }
];

// --- MOCK WHITE LAND ALERTS (idl_1) ---
const WHITE_LAND_ALERTS = [
  { id: 101, type: "white_land", name: "Al Yasmin Plot 4A", lat: 24.8211, lng: 46.6184, severity: "CRITICAL", size: "14,500 SQM", duration: "4 YEARS", estValue: "SAR 45M", penalty: "SAR 1.1M/YR", cause: "Prime residential zoning held undeveloped despite surrounding infrastructure completion.", recommendation: "Issue Final Warning for White Land Tax Phase 2. Prepare for mandatory auction." },
  { id: 102, type: "white_land", name: "Qurtubah Block 12", lat: 24.8100, lng: 46.7212, severity: "HIGH", size: "8,200 SQM", duration: "2.5 YEARS", estValue: "SAR 22M", penalty: "SAR 550K/YR", cause: "Commercial strip plot remaining vacant. Owner cited pending permits but no application found.", recommendation: "Initiate Phase 1 Tax Assessment. Dispatch field inspector." },
  { id: 103, type: "white_land", name: "Al Malqa Apex", lat: 24.7891, lng: 46.5982, severity: "CRITICAL", size: "32,000 SQM", duration: "6 YEARS", estValue: "SAR 120M", penalty: "SAR 3.0M/YR", cause: "Large scale speculative holding blocking key municipal utilities corridor expansion.", recommendation: "Eminent domain review triggered. Fast-track activation." }
];

// --- MOCK HOUSING DEMAND ALERTS (dmd_1) ---
const HOUSING_DEMAND_ALERTS = [
  { id: 301, type: "housing", name: "Riyadh Region", lat: 24.7136, lng: 46.6753, severity: "CRITICAL", delay: "-35K BY 2030", deficit: "35,000", ownership: "55%", target: "70%", pop: "8.6M", cause: "Forecast horizon: 2030. Deficit based on 2016–2025 population growth rate (4.2% CAGR) and NHC housing delivery pipeline. Rapid growth driven by Vision 2030 corporate HQ relocations (1,100+ companies). Northern expansion (KAFD, Diriyah Gate) outpacing residential supply.", recommendation: "Fast-track 15,000 housing permits in Al Janadriyah, Khashm Al Aan corridors. Activate NHC Sakani Phase 8. Deliver 20,000 units by 2028, remaining 15,000 by 2030." },
  { id: 302, type: "housing", name: "Makkah Region", lat: 21.4225, lng: 39.8262, severity: "CRITICAL", delay: "-42K BY 2030", deficit: "42,000", ownership: "52%", target: "70%", pop: "9.0M", cause: "Forecast horizon: 2030. Highest deficit nationally. Hajj/Umrah seasonal demand creates dual housing market. Ownership at 52% (Q1 2026) — lowest among tracked regions. Hospitality conversion of residential stock near Haram compounds shortage.", recommendation: "Zone 20,000 units in Al Awali, Al Shara'i by 2028. Mandate 60% residential in new mixed-use permits. Remaining 22,000 units via PPP by 2030." },
  { id: 303, type: "housing", name: "Eastern Province", lat: 26.3927, lng: 49.9777, severity: "HIGH", delay: "-28K BY 2030", deficit: "28,000", ownership: "65%", target: "70%", pop: "5.1M", cause: "Forecast horizon: 2030. Ownership at 65% (Q1 2026) — 5pp gap to target. Aramco expansion zones (Dhahran, Jubail 2) attracting 200K+ skilled workers. 40% of existing stock built pre-2000 needs replacement.", recommendation: "Release 12,000 NHC units in Dhahran Valley by 2028. Incentivize private developers in Al Aziziyah industrial corridor for remaining 16,000 units by 2030." },
  { id: 304, type: "housing", name: "Madinah Region", lat: 24.4672, lng: 39.6024, severity: "HIGH", delay: "-18K BY 2030", deficit: "18,000", ownership: "60%", target: "70%", pop: "2.2M", cause: "Forecast horizon: 2030. Ownership at 60% (Q1 2026) — 10pp gap. Knowledge Economic City Phase 2 drawing academic and tech talent. Visitor-to-resident conversion rate rising 8% YoY since 2022.", recommendation: "Accelerate 8,000-unit Prince Muhammad bin Salman project (completion 2028). Convert underutilized commercial in Al Manar for 10,000 units by 2030." },
  { id: 305, type: "housing", name: "Asir Region", lat: 18.2164, lng: 42.5053, severity: "HIGH", delay: "-15K BY 2030", deficit: "15,000", ownership: "72%", target: "70%", pop: "2.3M", cause: "Forecast horizon: 2030. Ownership already at 72% (exceeds 70% target), but deficit driven by urbanization: rural-to-Abha migration at 3.1% annually since 2020. Tourism demand from Soudah Peaks project adds 5,000 temporary-to-permanent units needed.", recommendation: "Zone 6,000 units near Soudah corridor by 2028. Upgrade infrastructure in Khamis Mushait expansion zone for 9,000 units by 2030." },
  { id: 306, type: "housing", name: "Qassim Region", lat: 26.3260, lng: 43.9750, severity: "HIGH", delay: "-15K BY 2030", deficit: "15,000", ownership: "71%", target: "70%", pop: "1.5M", cause: "Forecast horizon: 2030. Ownership at 71% (exceeds target), but deficit from agri-tech workforce influx and university expansion. Student housing shortage of 4,000 beds projected by 2028.", recommendation: "Release 5,000 NHC plots in Buraidah North by 2027. Partner with Qassim University for 2,000 student units by 2028. Remaining 8,000 via private sector by 2030." }
];

// --- MOCK ROAD NETWORK ALERTS (dmd_2) ---
const ROAD_NETWORK_ALERTS = [
  { id: 401, type: "road", name: "Riyadh – NEOM Corridor", lat: 26.5, lng: 42.0, severity: "CRITICAL", delay: "4.2K KM · 2029", length: "4,200 KM", status: "PLANNED", completion: "2029", cause: "Target completion: 2029. Critical northern arterial connecting capital to NEOM, Trojena, and The Line. Current route via Tabuk adds 6h detour. No direct high-speed expressway exists. Planning based on NTS 2021 corridor study.", recommendation: "Phase 1 (Riyadh–Hail, 850 km) by 2027. Phase 2 (Hail–NEOM, 3,350 km) by 2029. Begin ROW acquisition Q2 2026." },
  { id: 402, type: "road", name: "Jeddah – KAEC Expressway", lat: 22.4, lng: 39.1, severity: "HIGH", delay: "1.8K KM · 2028", length: "1,800 KM", status: "IN PROGRESS", completion: "2028", cause: "Target completion: 2028. King Abdullah Economic City access road at 140% capacity during peak. Single carriageway bottleneck causing 45-min delays. Phase 1 (dual carriageway) 60% complete as of Q1 2026.", recommendation: "Complete dual carriageway by Q4 2027. Accelerate Rabigh bypass (300 km) for 2028 delivery." },
  { id: 403, type: "road", name: "Eastern Province Ring Road", lat: 26.45, lng: 50.1, severity: "CRITICAL", delay: "3.5K KM · 2030", length: "3,500 KM", status: "DESIGN", completion: "2030", cause: "Target completion: 2030. Dammam-Jubail-Ras Al Khair industrial triangle lacks dedicated freight corridor. Design phase based on 2023 MOT freight demand study projecting 85% truck traffic increase by 2030.", recommendation: "Complete EIA by Q4 2026. Jubail–Ras Al Khair segment (highest ROI) by 2028. Full ring by 2030." },
  { id: 404, type: "road", name: "Madinah – Yanbu Highway", lat: 23.9, lng: 38.5, severity: "HIGH", delay: "2.1K KM · 2027", length: "2,100 KM", status: "IN PROGRESS", completion: "2027", cause: "Target completion: 2027. Earliest delivery among tracked projects. Existing 2-lane highway severely congested by petrochemical logistics. Yanbu port expansion requires Grade-A access for 50K+ daily truck movements. 45% complete.", recommendation: "Phase 2 widening on track for Q2 2027. Add intelligent traffic management system for hazmat routing." },
  { id: 405, type: "road", name: "Abha – Soudah Tourism Rd", lat: 18.25, lng: 42.3, severity: "HIGH", delay: "0.8K KM · 2028", length: "800 KM", status: "DESIGN", completion: "2028", cause: "Target completion: 2028. Soudah Development project expects 2M visitors/year by 2029. Current mountain roads: single lane, 30 km/h average, no shoulder. Geological survey required for 6 tunnel segments.", recommendation: "Begin geological survey Q1 2026. Construction start Q3 2026. Scenic expressway delivery by Q4 2028." },
  { id: 406, type: "road", name: "Qassim Agricultural Route", lat: 26.1, lng: 44.2, severity: "HIGH", delay: "1.6K KM · 2029", length: "1,600 KM", status: "PLANNED", completion: "2029", cause: "Target completion: 2029. Qassim produces 40% of Saudi dates and vegetables. Farm-to-market roads are unpaved, causing 15% crop spoilage. Forecast based on MOT 2024 agricultural logistics audit.", recommendation: "Pave 600 km priority farm corridors by 2027. Install cold chain logistics hubs at 4 nodes. Full network by 2029." }
];

// --- MOCK COMMERCIAL ROI ALERTS (ast_1) ---
const ROI_ALERTS = [
  { id: 201, type: "roi", name: "KAFD Fringe Retail", lat: 24.7600, lng: 46.6350, severity: "HIGH", currentYield: "3.2%", projectedYield: "8.5%", trend: "POSITIVE", cause: "New metro station opening within 200m radius. Anticipated 400% foot traffic increase.", recommendation: "Fast-track mixed-use rezoning applications. Subsidize facade upgrades." },
  { id: 202, type: "roi", name: "Olaya Historic Strip", lat: 24.7000, lng: 46.6850, severity: "CRITICAL", currentYield: "6.5%", projectedYield: "2.1%", trend: "NEGATIVE", cause: "Aging infrastructure and parking scarcity leading to 35% tenant vacancy rate over 12 months.", recommendation: "Initiate urban regeneration project. Convert 2 lanes to pedestrian & outdoor seating." },
  { id: 203, type: "roi", name: "Diplomatic Quarter Hub", lat: 24.6852, lng: 46.6231, severity: "HIGH", currentYield: "5.1%", projectedYield: "9.2%", trend: "POSITIVE", cause: "Inflow of regional HQ mandates creating severe undersupply of Grade-A office space.", recommendation: "Increase FAR (Floor Area Ratio) limits by 20% for sustainable designs." }
];

// --- MAP BUOY COMPONENT ---
const MapBuoy = ({ alert, isHovered, onHover, onClick }: { alert: any, isHovered: boolean, onHover: (hovered: boolean) => void, onClick: () => void }) => {
  const isCritical = alert.severity === "CRITICAL";
  const color = isCritical ? "#ff4444" : "#FCD34D";
  
  return (
    <div 
      onClick={onClick} 
      onMouseEnter={() => onHover(true)} 
      onMouseLeave={() => onHover(false)} 
      className={`relative group cursor-pointer flex items-center justify-center pointer-events-auto transition-transform duration-300 ${isHovered ? 'scale-125 z-50' : 'hover:scale-110 z-40'}`}
    >
      {/* Pulse rings */}
      <motion.div 
        className="absolute rounded-full border border-solid"
        style={{ borderColor: color }}
        initial={{ width: 10, height: 10, opacity: 1 }}
        animate={{ width: 50, height: 50, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute rounded-full border border-solid"
        style={{ borderColor: color }}
        initial={{ width: 10, height: 10, opacity: 1 }}
        animate={{ width: 50, height: 50, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
      />
      
      {/* Core dot */}
      <div className="w-2.5 h-2.5 rounded-full relative z-10" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}></div>
      
      {/* Always-on Tooltip/Label for Dashboard */}
      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#051105]/85 border backdrop-blur-md px-2.5 py-1.5 rounded-sm whitespace-nowrap opacity-100 pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col items-center transition-all duration-300 ${isHovered ? 'border-opacity-100 shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-110 -translate-y-2' : 'border-opacity-50 scale-100'}`} style={{ borderColor: isHovered ? color : `${color}50` }}>
         <div className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isHovered ? 'text-white' : 'text-gray-300'}`}>{alert.name}</div>
         <div className="text-[11px] font-black uppercase tracking-widest mt-0.5" style={{ color }}>
           {alert.type === 'commute' ? `${alert.delay} DELAY` : alert.delay}
         </div>
      </div>
    </div>
  );
};

// --- DYNAMIC SVG ICONS FOR AGENTS ---
const DynamicFlowIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M3 12h4l2.5-6 4 12 2.5-6h5" strokeOpacity="0.3" />
    <motion.path 
      d="M3 12h4l2.5-6 4 12 2.5-6h5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      stroke={color}
      initial={{ pathLength: 0, opacity: 1 }}
      animate={{ pathLength: 1, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
    <motion.circle cx="9.5" cy="6" r="1.5" fill={color} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
    <motion.circle cx="13.5" cy="18" r="1.5" fill={color} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
  </svg>
);

const DynamicDemandIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="4" y="14" width="3" height="6" rx="0.5" strokeOpacity="0.3" />
    <rect x="10.5" y="10" width="3" height="10" rx="0.5" strokeOpacity="0.3" />
    <rect x="17" y="6" width="3" height="14" rx="0.5" strokeOpacity="0.3" />
    <motion.rect x="4" y="14" width="3" height="6" rx="0.5" fill={color} fillOpacity="0.2" animate={{ height: [0, 6, 0], y: [20, 14, 20] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.rect x="10.5" y="10" width="3" height="10" rx="0.5" fill={color} fillOpacity="0.2" animate={{ height: [0, 10, 0], y: [20, 10, 20] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
    <motion.rect x="17" y="6" width="3" height="14" rx="0.5" fill={color} fillOpacity="0.2" animate={{ height: [0, 14, 0], y: [20, 6, 20] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
    <motion.path d="M3 16 l7 -5 l6 -6" stroke={color} strokeLinecap="round" strokeLinejoin="round" 
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity }} />
  </svg>
);

const DynamicIdleIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M3 8h18M3 16h18M8 3v18M16 3v18" strokeOpacity="0.15" />
    <rect x="3" y="3" width="18" height="18" rx="2" strokeOpacity="0.3" />
    <motion.line x1="3" y1="3" x2="21" y2="3" stroke={color} strokeWidth="1" strokeOpacity="0.8" 
      animate={{ y: [0, 18, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
    <motion.rect x="8" y="8" width="8" height="8" strokeDasharray="2 2" strokeOpacity="0.8"
      animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
  </svg>
);

const DynamicAssetIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round">
    <motion.polygon points="12 3 20 7 12 11 4 7" fill={color} fillOpacity="0.1" animate={{ y: [-1, 1, -1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    <motion.polygon points="12 8 20 12 12 16 4 12" strokeOpacity="0.6" animate={{ y: [-0.5, 0.5, -0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
    <motion.polygon points="12 13 20 17 12 21 4 17" strokeOpacity="0.3" animate={{ y: [0, 0, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
    <motion.line x1="12" y1="11" x2="12" y2="21" strokeOpacity="0.4" strokeDasharray="2 2" />
  </svg>
);

// -- CORE AGENTS DATA WITH ADDED ALERTS & URGENCY STATS --
const AGENTS_DATA = {
  flow: {
    id: "flow", title: "FLOW AGENT", icon: DynamicFlowIcon, color: "#00B558",
    functions: [
      { 
        id: "flw_1", name: "24H COMMUTE INDEX", 
        desc: "AI DETECTS NON-RECURRENT CONGESTION ANOMALIES USING REAL-TIME COMPUTER VISION FEEDS.",
        stats: [
          { label: 'CRITICAL ALERTS', value: '12', color: '#ff4444' },
          { label: 'WARNINGS', value: '34', color: '#FCD34D' },
          { label: 'ACTIVE CAMS', value: '142', color: '#00B558' }
        ]
      },
      { 
        id: "flw_2", name: "PT MODE SHARE", 
        desc: "PREDICTS TRANSIT DEMAND SHIFTS TO OPTIMIZE METRO FREQUENCY.",
        stats: [
          { label: 'SUGGESTED SHIFTS', value: '8', color: '#FCD34D' },
          { label: 'MONITORING', value: '24', color: '#00B558' }
        ]
      },
      { 
        id: "flw_3", name: "PEDESTRIAN DENSITY", 
        desc: "MONITORS WALKING PATTERNS FOR COOLING MIST FANS.",
        stats: [
          { label: 'HOTSPOTS', value: '6', color: '#ff4444' },
          { label: 'ACTIVE FANS', value: '56', color: '#00B558' }
        ]
      }
    ]
  },
  demand: {
    id: "demand", title: "DEMAND FORECASTER", icon: DynamicDemandIcon, color: "#FCD34D",
    functions: [
      { 
        id: "dmd_1", name: "HOUSING DEMAND FORECAST", 
        desc: "PROJECTED HOUSING UNIT SHORTFALL BY 2030 ACROSS 6 SAUDI REGIONS BASED ON NHC SAKANI PROGRAM DATA (2016–2025) AND POPULATION GROWTH MODELS. VISION 2030 TARGET: 70% NATIONAL HOMEOWNERSHIP. BASELINE: 47% (2016). CURRENT (Q1 2026): 63%. DEFICIT = UNITS NEEDED TO CLOSE GAP BY 2030.",
        stats: [
          { label: 'BY-2030 DEFICIT', value: '-153K', color: '#ff4444' },
          { label: 'Q1 2026', value: '63%', color: '#FCD34D' },
          { label: '2030 TARGET', value: '70%', color: '#00B558' }
        ]
      },
      { 
        id: "dmd_2", name: "ROAD NETWORK EXPANSION", 
        desc: "FORECAST BASED ON NATIONAL TRANSPORT STRATEGY (2021–2030) AND GIGA-PROJECT CORRIDOR STUDIES. CURRENT PAVED NETWORK: 76,000 KM (Q1 2026). TARGET: 100,000 KM BY 2030. INDIVIDUAL PROJECTS HAVE VARYING COMPLETION DATES (2027–2030) SHOWN IN MAP DETAILS.",
        stats: [
          { label: 'Q1 2026', value: '76K KM', color: '#FCD34D' },
          { label: 'BY-2030 GAP', value: '24K KM', color: '#ff4444' },
          { label: '2030 TARGET', value: '100K KM', color: '#00B558' }
        ]
      }
    ]
  },
  idle: {
    id: "idle", title: "IDLE LAND AGENT", icon: DynamicIdleIcon, color: "#ff4444",
    functions: [
      { 
        id: "idl_1", name: "WHITE LAND ACTIVATION", 
        desc: "IDLE >12M HIGH-VALUE",
        stats: [
          { label: 'PLOTS', value: '47', color: '#ff4444' },
          { label: 'NOTIFIED', value: '89', color: '#FCD34D' }
        ]
      },
      { 
        id: "idl_2", name: "VALUE CAPTURE", 
        desc: "CALCULATES POTENTIAL REVENUE FROM DORMANT LAND.",
        stats: [
          { label: 'HIGH POTENTIAL', value: '24', color: '#FCD34D' },
          { label: 'EVALUATING', value: '45', color: '#00B558' }
        ]
      },
      { 
        id: "idl_3", name: "DEV READINESS", 
        desc: "SCORES VACANT LAND BASED ON UTILITY PROXIMITY.",
        stats: [
          { label: 'LACK UTILITY', value: '18', color: '#ff4444' },
          { label: 'READY', value: '62', color: '#00B558' }
        ]
      }
    ]
  },
  asset: {
    id: "asset", title: "ASSET EVALUATION", icon: DynamicAssetIcon, color: "#FCD34D",
    functions: [
      { 
        id: "ast_1", name: "COMMERCIAL ROI FORECAST", 
        desc: "PROJECTS FUTURE ASSET VALUE BASED ON NEIGHBORHOOD TRANSFORMATION AND GLOBAL TRENDS.",
        stats: [
          { label: 'NEGATIVE TREND', value: '5', color: '#ff4444' },
          { label: 'HIGH YIELD', value: '18', color: '#00B558' }
        ]
      },
      { 
        id: "ast_2", name: "GLOBAL RANK", 
        desc: "BENCHMARKS RIYADH TO IDENTIFY INFRA GAPS.",
        stats: [
          { label: 'CRITICAL GAPS', value: '3', color: '#ff4444' },
          { label: 'ON PAR', value: '12', color: '#FCD34D' }
        ]
      },
      { 
        id: "ast_3", name: "PUBLIC ASSET UTIL", 
        desc: "ANALYZES OCCUPANCY TO SUGGEST REPURPOSING.",
        stats: [
          { label: 'UNDERUTILIZED', value: '34', color: '#FCD34D' },
          { label: 'OPTIMIZED', value: '76', color: '#00B558' }
        ]
      }
    ]
  }
};

function FunctionCard({ item, color, isActive, onClick, onActionClick, layout = "full" }: { item: any, color: string, isActive: boolean, onClick: () => void, onActionClick?: (id: string) => void, layout?: "full"|"half" }) {
  const [isHoveringInfo, setIsHoveringInfo] = useState(false);
  const rgbColor = color === '#FCD34D' ? '252,211,77' : color === '#ff4444' ? '255,68,68' : '0,181,88';
  const primaryStat = item.stats[0];
  const isRightPanel = item.id.startsWith('idl') || item.id.startsWith('ast');

  const renderMiniChart = () => {
    const rightPanelFullLayout = isRightPanel && layout === "full";
    const chartClass = isRightPanel 
      ? `absolute inset-0 w-full h-full transition-opacity duration-300 ${isActive ? 'opacity-100 z-20' : 'opacity-70'}`
      : `absolute right-2 bottom-0 w-[180px] h-[60px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`;

    if (!isRightPanel && layout !== "full") return null;

    if (item.id.startsWith("idl")) {
      const data = [
        { year: '21', val: 30, pen: 0 }, { year: '22', val: 35, pen: 1 }, 
        { year: '23', val: 40, pen: 2 }, { year: '24', val: 45, pen: 3.5 }, 
        { year: '25', val: 50, pen: 5 }, { year: '26', val: 55, pen: 8 }
      ];
      return (
        <div className={chartClass}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="year" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => `YEAR 20${label}`}
                formatter={(value: number, name: string) => {
                  if (name === 'val') return [`${value}%`, 'Dormant Area'];
                  if (name === 'pen') return [`${value}M SAR`, 'Tax Penalty'];
                  return [value, name];
                }}
              />
              <defs>
                <linearGradient id={`valGradMini-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="step" dataKey="val" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill={`url(#valGradMini-${item.id})`} isAnimationActive={false} />
              <Bar dataKey="pen" fill={color} opacity={0.8} barSize={8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id.startsWith("ast")) {
      const data = [
        { year: '21', y: 4.5 }, { year: '22', y: 4.0 }, 
        { year: '23', y: 3.8 }, { year: '24', y: 3.2 }, 
        { year: '25', y: 6.0 }, { year: '26', y: 8.5 }
      ];
      return (
        <div className={chartClass}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="year" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => `YEAR 20${label}`}
                formatter={(value: number) => [`${value}%`, 'Commercial ROI']}
              />
              <defs>
                <linearGradient id={`roiGradMini-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#roiGradMini-${item.id})`} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id === "flw_1") {
      // Create distinct but correlated lines. Peak at hour 8 (morning commute).
      // Predicted is smooth, Actual is more erratic and only goes up to hour 12 (current time).
      const data = Array.from({length: 24}).map((_, i) => {
        // Base sine wave for daily rhythm (peak around 8-9am and 5-6pm)
        const rhythm = Math.max(0, Math.sin((i - 6) * Math.PI / 12) * 8 + Math.sin((i - 15) * Math.PI / 12) * 6);
        
        // Predicted is smoothed rhythm + baseline noise
        const predicted = Math.max(0, Math.floor(rhythm + 2));
        
        // Actual has more variance and specifically hits exactly 12 at hour 12
        let actual = null;
        if (i <= 12) {
          if (i === 12) actual = 12; // Force exactly 12 at current time
          else actual = Math.max(0, Math.floor(rhythm + (Math.random() * 6 - 2))); // +/- variance from rhythm
        }

        return {
          t: i, 
          n: predicted, 
          a: actual
        };
      });

      return (
        <div className={`absolute right-2 bottom-0 w-[180px] h-[60px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="t" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => `TIME: ${label}:00`}
                formatter={(value: number, name: string) => {
                  if (name === 'n') return [`${value}`, 'Predicted Events'];
                  if (name === 'a') return [`${value}`, 'Actual Events'];
                  return [value, name];
                }}
              />
              <Area type="monotone" dataKey="n" stroke="#00B558" strokeWidth={1} strokeDasharray="2 2" fillOpacity={0.1} fill="#00B558" isAnimationActive={false} />
              <Line type="monotone" dataKey="a" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id === "dmd_1") {
      const data = [
        { t: 'RYD', v: 35 }, { t: 'MKH', v: 42 }, { t: 'EST', v: 28 }, { t: 'MDN', v: 18 }, { t: 'ASR', v: 15 }, { t: 'QSM', v: 15 }
      ];
      return (
        <div className={`absolute right-0 bottom-0 w-[55%] h-[70%] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 4 }}>
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => {
                  const names: Record<string, string> = { RYD: 'RIYADH', MKH: 'MAKKAH', EST: 'EASTERN', MDN: 'MADINAH', ASR: 'ASIR', QSM: 'QASSIM' };
                  return names[label] || label;
                }}
                formatter={(value: number) => [`${value}K UNITS`, 'By-2030 Deficit']}
              />
              <Bar dataKey="v" fill={color} opacity={0.6} barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="v" position="top" fill="#FCD34D" fontSize={8} formatter={(v: number) => `${v}K`} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id === "dmd_2") {
      const data = [
        { t: 'RYD', v: 4.2 }, { t: 'MKH', v: 1.8 }, { t: 'EST', v: 3.5 }, { t: 'MDN', v: 2.1 }, { t: 'ASR', v: 0.8 }, { t: 'QSM', v: 1.6 }
      ];
      return (
        <div className={`absolute right-0 bottom-0 w-[55%] h-[70%] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 4 }}>
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => {
                  const names: Record<string, string> = { RYD: 'RIYADH', MKH: 'MAKKAH', EST: 'EASTERN', MDN: 'MADINAH', ASR: 'ASIR', QSM: 'QASSIM' };
                  return names[label] || label;
                }}
                formatter={(value: number) => [`${value}K KM`, 'By-2030 Gap']}
              />
              <defs>
                <linearGradient id="roadGradMini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#roadGradMini)" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full
        ${layout === 'full' ? 'p-4' : 'p-3'}
        ${isActive 
          ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` 
          : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`
        }
      `}
      style={{ borderColor: isActive ? color : `${color}40` }}
    >
       {/* Corner Accents */}
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />

       <div className="flex justify-between items-start w-full gap-2 relative z-10">
         <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] ${layout === 'full' ? 'text-[15px] w-[80%]' : 'text-[11px] line-clamp-2'}`} style={{ color }}>
           {item.name}
         </h4>
         <div className="flex items-center gap-1 -mr-1 -mt-1 flex-none">
           {item.id === 'flw_1' ? (
             <div 
               className="p-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
               onClick={(e) => {
                 e.stopPropagation();
                 if (onActionClick) onActionClick(item.id);
               }}
               title="View Target Details"
             >
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                 className="flex items-center justify-center w-5 h-5 relative"
               >
                 <Target className="w-4 h-4" style={{ color }} />
                 <motion.div 
                   className="absolute inset-0 rounded-full border border-dashed opacity-50" 
                   style={{ borderColor: color }}
                   animate={{ rotate: -360 }}
                   transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 />
               </motion.div>
             </div>
           ) : (
             <div 
               className="p-1 cursor-help opacity-40 hover:opacity-100 transition-opacity"
               onMouseEnter={() => setIsHoveringInfo(true)}
               onMouseLeave={() => setIsHoveringInfo(false)}
             >
               <Info className="w-3.5 h-3.5" style={{ color }} />
             </div>
           )}
         </div>
       </div>

       <div className={`relative w-full flex-1 flex flex-col mt-2 z-10 min-h-[40px] ${(layout === 'half' && isRightPanel) ? 'justify-center' : ''}`}>
          {/* DESCRIPTION LAYER (Visible on Info Hover) */}
          <div className={`absolute inset-0 flex items-start bg-[#070d07]/95 backdrop-blur-sm transition-opacity duration-300 z-20 overflow-y-auto p-1 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <p className={`font-medium tracking-wider text-gray-300 uppercase ${layout === 'full' ? 'text-[10px] leading-[1.6]' : 'text-[9px] leading-[1.5]'}`}>
               {item.desc}
             </p>
          </div>

          {/* MULTI-METRIC LAYER (Hidden on Info Hover) */}
          <div className={`w-full flex transition-opacity duration-300 relative ${isHoveringInfo ? 'opacity-0' : 'opacity-100'} 
            ${isRightPanel ? 'flex-1 flex-col justify-start items-start min-h-0' : 'items-end justify-between flex-1'}`}>
             
             {isRightPanel ? (
               <div className="flex flex-col w-full h-full">
                 <div className="flex justify-between items-end gap-2 w-full mb-1">
                   <span 
                      className="font-black leading-none tracking-tighter" 
                      style={{ color: primaryStat.color, fontSize: layout === 'full' ? '46px' : '36px', textShadow: `0 0 20px ${primaryStat.color}60` }}
                   >
                      {primaryStat.value}
                   </span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[10px] mb-1 text-right flex-1">
                      {primaryStat.label}
                   </span>
                 </div>
                 
                 {/* Stacked secondary metrics */}
                 <div className={`flex flex-col w-full ${['idl_2', 'idl_3', 'ast_2', 'ast_3'].includes(item.id) ? 'flex-1 justify-center mb-1' : ''}`}>
                   {item.stats.slice(1).map((stat: any, idx: number) => (
                     <div key={idx} className={`flex justify-between items-center w-full border-t border-slate-800/50 ${['idl_2', 'idl_3', 'ast_2', 'ast_3'].includes(item.id) ? 'py-1.5' : 'py-1 mt-0.5'}`}>
                       <span className={`text-slate-500 font-bold tracking-wider uppercase ${['idl_2', 'idl_3', 'ast_2', 'ast_3'].includes(item.id) ? 'text-[10px]' : 'text-[9px]'}`}>{stat.label}</span>
                       <span className={`font-black tracking-widest ${['idl_2', 'idl_3', 'ast_2', 'ast_3'].includes(item.id) ? 'text-[12px]' : 'text-[11px]'}`} style={{ color: stat.color || color }}>{stat.value}</span>
                     </div>
                   ))}
                 </div>
                 
                 {!['idl_2', 'idl_3', 'ast_2', 'ast_3'].includes(item.id) && (
                   <div className="flex-1 w-full min-h-[40px] mt-1 relative">
                     {renderMiniChart()}
                   </div>
                 )}
               </div>
             ) : (
               <>
                 <div className="flex items-end gap-2 relative z-10">
                   <span 
                      className="font-black leading-none tracking-tighter" 
                      style={{ color: primaryStat.color, fontSize: layout === 'full' ? '46px' : '32px', textShadow: `0 0 20px ${primaryStat.color}60` }}
                   >
                      {primaryStat.value}
                   </span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[10px] mb-1.5 max-w-[50%]">
                      {primaryStat.label}
                   </span>
                 </div>
                 {renderMiniChart()}
               </>
             )}
          </div>
       </div>
    </div>
  );
}

const TargetModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Heavy Blur Backdrop */}
      <div className="absolute inset-0 bg-[#020805]/85 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-[1160px] h-[85vh] max-h-[800px] bg-gradient-to-br from-[#051105] to-[#0a1a0a] border border-[#00B558]/40 shadow-[0_0_80px_rgba(0,181,88,0.2)] flex flex-col overflow-hidden rounded-xl"
      >
        {/* Military Cyberpunk Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-[2px] bg-[#00B558]" />
        <div className="absolute top-0 left-0 w-[2px] h-32 bg-[#00B558]" />
        <div className="absolute bottom-0 right-0 w-32 h-[2px] bg-[#00B558]" />
        <div className="absolute bottom-0 right-0 w-[2px] h-32 bg-[#00B558]" />
        <div className="absolute top-2 right-12 flex gap-1">
          {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#00B558]/40" />)}
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#00B558]/20 bg-[#00B558]/10 relative overflow-hidden">
          <motion.div 
             className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[#00B558]/10 to-transparent"
             animate={{ x: ['-100%', '100%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full border-2 border-[#00B558] flex items-center justify-center relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="flex items-center justify-center relative w-full h-full"
              >
                <Target className="w-5 h-5 text-[#00B558]" />
              </motion.div>
              <div className="absolute inset-0 rounded-full border border-[#00B558] animate-ping opacity-50" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(0,181,88,0.5)] leading-none mb-1">
                COMMUTE EFFICIENCY STATUS & PROJECTION
              </h2>
              <span className="text-[10px] text-[#00B558] font-bold tracking-[0.2em] uppercase">FLOW AGENT // STRATEGIC KPI DIAGNOSTIC</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#00B558]/60 hover:text-white hover:bg-[#00B558]/20 rounded transition-colors relative z-10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col p-8 gap-8 relative z-10 h-full overflow-hidden">
          
          {/* AI INSIGHT BANNER */}
          <div className="flex items-center justify-between gap-4 bg-[#00B558]/5 border border-[#00B558]/20 px-6 py-3 shrink-0 shadow-[0_0_15px_rgba(0,181,88,0.05)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00B558]" />
            <div className="flex items-center gap-3 relative z-10">
              <Zap className="w-4 h-4 text-[#00B558] animate-pulse" />
              <span className="text-[10px] font-bold text-[#00B558] tracking-[0.15em] uppercase">
                SYSTEM INSIGHT: AI DETECTS NON-RECURRENT CONGESTION ANOMALIES USING REAL-TIME COMPUTER VISION FEEDS.
              </span>
            </div>
            <div className="flex gap-1 relative z-10">
               {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-3 bg-[#00B558]/40" />)}
            </div>
          </div>

          {/* HERO VISUALIZATION: CURRENT VS TARGET */}
          <div className="flex items-center justify-between bg-gradient-to-b from-[#030a03] to-[#051105] border border-[#00B558]/30 p-6 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,181,88,0.1)] before:absolute before:inset-0 before:bg-[linear-gradient(rgba(0,181,88,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,181,88,0.05)_1px,transparent_1px)] before:bg-[size:20px_20px] before:pointer-events-none">
             
             {/* Left: CURRENT VALUE */}
             <div className="flex items-center gap-6 w-[35%] relative z-10">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                   <svg width="128" height="128" className="absolute transform -rotate-90">
                      <circle cx="64" cy="64" r="60" fill="none" stroke="#00B558" strokeWidth="1" strokeDasharray="4 8" opacity="0.4" className="animate-[spin_20s_linear_infinite]" style={{ transformOrigin: "64px 64px" }} />
                      <circle cx="64" cy="64" r="50" fill="none" stroke="#00B558" strokeWidth="2" opacity="0.1" />
                      <motion.circle cx="64" cy="64" r="50" fill="none" stroke="#00B558" strokeWidth="6" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50} animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - 0.78) }} transition={{ duration: 2, ease: "easeOut" }} style={{ filter: 'drop-shadow(0 0 10px rgba(0,181,88,0.8))' }} strokeLinecap="round" />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-[#00B558] font-bold tracking-[0.2em] uppercase mb-0.5">INDEX</span>
                      <span className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(0,181,88,1)] leading-none tracking-tighter">78</span>
                   </div>
                </div>
                <div className="flex flex-col">
                   <span className="text-[#00B558] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#00B558] rounded-full animate-pulse" /> CURRENT STATUS
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-none mb-1.5">MODERATE</h3>
                   <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">REAL-TIME: 08:42</span>
                </div>
             </div>

             {/* Middle: GAP CONNECTOR */}
             <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
                <div className="w-full flex items-center">
                   <div className="h-[2px] bg-gradient-to-r from-[#00B558] via-[#00B558] to-[#FCD34D] flex-1 relative overflow-hidden">
                      <motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ["-20%", "120%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                   </div>
                   <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center shadow-[0_0_20px_rgba(252,211,77,0.1)]">
                      <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">EFFICIENCY GAP</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FCD34D]" />
                        <span className="text-lg font-black text-[#FCD34D] tracking-widest">+14 PTS</span>
                      </div>
                   </div>
                   <div className="h-[2px] bg-gradient-to-r from-[#FCD34D] to-[#FCD34D] flex-1 relative overflow-hidden">
                      <motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ["-20%", "120%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                   </div>
                </div>
             </div>

             {/* Right: TARGET VALUE */}
             <div className="flex items-center gap-6 w-[35%] flex-row-reverse text-right relative z-10">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                   <svg width="128" height="128" className="absolute transform -rotate-90">
                      <circle cx="64" cy="64" r="60" fill="none" stroke="#FCD34D" strokeWidth="1" strokeDasharray="4 8" opacity="0.4" className="animate-[spin_20s_linear_infinite_reverse]" style={{ transformOrigin: "64px 64px" }} />
                      <circle cx="64" cy="64" r="50" fill="none" stroke="#FCD34D" strokeWidth="2" opacity="0.1" />
                      <motion.circle cx="64" cy="64" r="50" fill="none" stroke="#FCD34D" strokeWidth="6" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50} animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - 0.92) }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} style={{ filter: 'drop-shadow(0 0 10px rgba(252,211,77,0.8))' }} strokeLinecap="round" />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-[#FCD34D] font-bold tracking-[0.2em] uppercase mb-0.5">INDEX</span>
                      <span className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(252,211,77,1)] leading-none tracking-tighter">92</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[#FCD34D] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2">
                     TARGET 2030 <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-sm" />
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-none mb-1.5">OPTIMAL</h3>
                   <span className="text-[10px] text-[#FCD34D]/70 font-mono tracking-wider border border-[#FCD34D]/20 bg-[#FCD34D]/5 px-2 py-0.5 inline-block w-fit">VISION GOAL</span>
                </div>
             </div>
          </div>

          {/* TWO COLUMN LOGIC & MATRIX */}
          <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
             
             {/* LEFT COLUMN: CALCULATION LOGIC */}
             <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-[#00B558] uppercase tracking-[0.2em] border-b border-[#00B558]/30 pb-2 flex items-center gap-2 shrink-0">
                  <Zap className="w-3.5 h-3.5" /> CALCULATION LOGIC
                </h3>
                
                <div className="bg-gradient-to-br from-[#0a1a0a] to-[#051105] border border-[#00B558]/20 p-6 flex flex-col flex-1 justify-between relative overflow-hidden min-h-0">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-[#00B558]/5 rotate-45 transform translate-x-10 -translate-y-10 pointer-events-none" />
                   
                   {/* Huge Formula Block */}
                   <div className="bg-[#030a03] border border-[#00B558]/30 p-4 flex flex-col items-center justify-center gap-4 shadow-[inset_0_0_20px_rgba(0,181,88,0.1)] mb-4 shrink-0">
                      <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">COMMUTE EFFICIENCY ALGORITHM</span>
                      <div className="flex items-center gap-3 font-mono text-base tracking-wider">
                         <span className="text-white font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">INDEX</span> 
                         <span className="text-[#00B558]">=</span> 
                         <span className="text-white">100</span> 
                         <span className="text-[#00B558]">×</span> 
                         <span className="flex items-center gap-2 bg-[#00B558]/10 px-3 py-1.5 rounded-sm border border-[#00B558]/20">
                            <span className="flex flex-col items-center leading-none gap-1">
                               <span className="text-gray-200 text-xs">V<sub className="text-[9px] text-[#00B558]">ACTUAL</sub></span>
                               <span className="w-full h-px bg-[#00B558]/60 my-0.5"></span>
                               <span className="text-gray-400 text-xs">V<sub className="text-[9px]">BASE</sub></span>
                            </span>
                         </span>
                         <span className="text-[#00B558]">×</span> 
                         <span className="text-[#FCD34D] drop-shadow-[0_0_10px_rgba(252,211,77,0.3)]">C<sub className="text-[10px] text-gray-400">MOD</sub></span>
                      </div>
                   </div>

                   {/* Parameter Breakdown */}
                   <div className="flex flex-col gap-3 justify-center flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-[#00B558] rounded-none mt-1.5 shrink-0 shadow-[0_0_8px_#00B558]" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">V<sub className="text-[9px] text-gray-400">ACTUAL</sub></span>
                            <span className="text-[9px] text-[#00B558] font-mono bg-[#00B558]/10 border border-[#00B558]/20 px-1.5 py-0.5 rounded-[2px] tracking-widest">REAL-TIME FEEDS</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">Current segment average velocity via computer vision and IoT.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-none mt-1.5 shrink-0" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">V<sub className="text-[9px] text-gray-400">BASE</sub></span>
                            <span className="text-[9px] text-gray-400 font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-[2px] tracking-widest">HISTORICAL AI</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">Expected non-peak steady state velocity (13:00-16:00 avg).</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-none mt-1.5 shrink-0 shadow-[0_0_8px_#FCD34D]" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">C<sub className="text-[9px] text-gray-400">MOD</sub></span>
                            <span className="text-[9px] text-[#FCD34D] font-mono bg-[#FCD34D]/10 border border-[#FCD34D]/20 px-1.5 py-0.5 rounded-[2px] tracking-widest">0.6 ~ 1.0 (DYNAMIC)</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">Dynamic penalty factor for accidents, weather, & non-cyclical events.</span>
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* RIGHT COLUMN: INTERPRETATION MATRIX */}
             <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-[#00B558] uppercase tracking-[0.2em] border-b border-[#00B558]/30 pb-2 flex items-center gap-2 shrink-0">
                  <Activity className="w-3.5 h-3.5" /> INDEX INTERPRETATION MATRIX
                </h3>
                
                <div className="flex flex-col flex-1 bg-[#051105] border border-[#00B558]/20 rounded-sm overflow-hidden min-h-0">
                   {/* Matrix Header */}
                   <div className="grid grid-cols-12 bg-[#00B558]/15 border-b border-[#00B558]/30 text-[9px] font-black text-[#00B558] uppercase tracking-widest px-4 py-2.5 shrink-0">
                     <div className="col-span-3">Index Range</div>
                     <div className="col-span-4">Status Level</div>
                     <div className="col-span-5">Recommended Action</div>
                   </div>
                   
                   <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                     {/* Row 1 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">90-100</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#00B558] shadow-[0_0_10px_rgba(0,181,88,0.8)] shrink-0" /> OPTIMAL FLOW
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Maintain current signal timing</div>
                     </div>

                     {/* Row 2 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">70-89</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#FCD34D] shadow-[0_0_10px_rgba(252,211,77,0.8)] shrink-0" /> BASIC FLOW
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Monitor volume trend changes</div>
                     </div>

                     {/* Row 3 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">50-69</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.8)] shrink-0" /> MILD CONGESTION
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Optimize intersection sync</div>
                     </div>

                     {/* Row 4 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">30-49</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.8)] shrink-0" /> MODERATE CONGESTION
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Activate tidal lanes / bus pri.</div>
                     </div>

                     {/* Row 5 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 hover:bg-[#ff4444]/10 transition-colors flex-1 min-h-[40px] bg-[#ff4444]/5">
                       <div className="col-span-3 font-mono font-black text-[#ff4444] text-[11px] tracking-wider">0-29</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-[#ff4444] uppercase tracking-widest text-[9px]">
                         <div className="relative w-2 h-2 shrink-0">
                           <span className="absolute inset-0 rounded-full bg-[#ff4444] animate-ping opacity-75" />
                           <span className="relative block w-2 h-2 rounded-full bg-black border-[1.5px] border-[#ff4444] shadow-[0_0_10px_rgba(255,68,68,1)]" />
                         </div> 
                         SEVERE GRIDLOCK
                       </div>
                       <div className="col-span-5 text-[9px] text-[#ff4444] uppercase tracking-wide font-bold">Trigger emergency & rerouting</div>
                     </div>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Diagnostics() {
  const [activeMetric, setActiveMetric] = useState("flw_1");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [hoveredAlertId, setHoveredAlertId] = useState<number | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Load HiAgent chat SDK
  useEffect(() => {
    const scriptId = 'hiagent-sdk';
    if (document.getElementById(scriptId)) return;

    // Inject style to ensure the chat widget sits above all page layers
    const style = document.createElement('style');
    style.id = 'hiagent-style';
    style.textContent = `
      [class*="hiagent"], [id*="hiagent"],
      div[style*="position: fixed"][style*="z-index"] iframe {
        z-index: 99999 !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://hiagent-byteplus.volcenginepaas.com/resources/product/llm/public/sdk/embedLite.js';
    script.onload = () => {
      if ((window as any).HiagentWebSDK) {
        new (window as any).HiagentWebSDK.WebLiteClient({
          appKey: 'd6sdi7elvndfd6e1neng',
          baseUrl: 'https://hiagent-byteplus.volcenginepaas.com',
          variables: {},
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
      const styleEl = document.getElementById('hiagent-style');
      if (styleEl) styleEl.remove();
      // Remove any chat widget the SDK injected
      document.querySelectorAll('[class*="hiagent"], [id*="hiagent"]').forEach(el => el.remove());
    };
  }, []);

  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [46.6853, 24.7136],
        zoom: 11.2,
        pitch: 45,
        bearing: -15,
        duration: 2500,
        essential: true
      });
    }
  }, []);

  const handleMetricClick = (id: string) => {
    setActiveMetric(id);
    window.dispatchEvent(new CustomEvent('agent-metric-select', { detail: { id } }));
    // Fly map to appropriate view based on selected metric
    if (mapRef.current) {
      if (id === 'dmd_1' || id === 'dmd_2') {
        // Zoom out to show all Saudi regions
        mapRef.current.flyTo({
          center: [44.0, 23.5],
          zoom: 5.0,
          pitch: 20,
          bearing: 0,
          duration: 2000,
          essential: true
        });
      } else if (id.startsWith('flw') || id.startsWith('idl') || id.startsWith('ast')) {
        // Zoom to Riyadh
        mapRef.current.flyTo({
          center: [46.6853, 24.7136],
          zoom: 11.2,
          pitch: 45,
          bearing: -15,
          duration: 2000,
          essential: true
        });
      }
    }
  };

  // Generate GeoJSON for highlighting (Line for roads/traffic, Polygon for areas)
  const getHighlightGeoJSON = (lat: number, lng: number, type: string) => {
    const isRoad = ['commute', 'traffic', 'emergency', 'road'].includes(type);
    
    if (isRoad) {
      const offset = type === 'road' ? 0.5 : 0.015;
      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [lng - offset, lat - offset],
              [lng + offset, lat + offset]
            ]
          },
          properties: {}
        }]
      };
    } else {
      const size = type === 'housing' ? 0.5 : 0.015;
      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng - size, lat - size],
              [lng + size, lat - size],
              [lng + size, lat + size],
              [lng - size, lat + size],
              [lng - size, lat - size]
            ]]
          },
          properties: {}
        }]
      };
    }
  };

  let currentAlerts: any[] = [];
  if (activeMetric === 'flw_1') currentAlerts = COMMUTE_ALERTS;
  else if (activeMetric === 'dmd_1') currentAlerts = HOUSING_DEMAND_ALERTS;
  else if (activeMetric === 'dmd_2') currentAlerts = ROAD_NETWORK_ALERTS;
  else if (activeMetric === 'idl_1') currentAlerts = WHITE_LAND_ALERTS;
  else if (activeMetric === 'ast_1') currentAlerts = ROI_ALERTS;

  const hoveredAlert = currentAlerts.find(a => a.id === hoveredAlertId);
  const hoveredHighlightGeoJSON = hoveredAlert ? getHighlightGeoJSON(hoveredAlert.lat, hoveredAlert.lng, hoveredAlert.type) : null;
  const isRoad = hoveredAlert && ['commute', 'traffic', 'emergency', 'road'].includes(hoveredAlert.type);

  const activeAgent = Object.values(AGENTS_DATA).find(agent => agent.functions.some(f => f.id === activeMetric)) || AGENTS_DATA.flow;
  const activeColor = activeAgent.color;
  const activeRgb = activeColor === '#FCD34D' ? '252,211,77' : activeColor === '#ff4444' ? '255,68,68' : '0,181,88';

  return (
    <div className="relative h-full w-full pt-[80px] pb-4 flex justify-between px-6 overflow-hidden pointer-events-none uppercase bg-[#051005]">
      
      {/* FULLSCREEN BACKGROUND MAP */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map
          ref={mapRef}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onMove={(e) => { window.lastMapViewState = { ...e.viewState }; }}
          initialViewState={window.lastMapViewState || {
            longitude: 44.0,
            latitude: 24.0,
            zoom: 4.2,
            pitch: 30,
            bearing: 0
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          interactive={true}
        >
          {/* Render Buoys depending on selected metric */}
          {currentAlerts.map(alert => (
            <Marker key={`${alert.type}-${alert.id}`} longitude={alert.lng} latitude={alert.lat} anchor="center">
              <MapBuoy 
                alert={alert} 
                isHovered={hoveredAlertId === alert.id}
                onHover={(hovered) => setHoveredAlertId(hovered ? alert.id : null)}
                onClick={() => setSelectedAlert(alert)} 
              />
            </Marker>
          ))}

          {/* Render declarative map highlight when hovered */}
          {hoveredHighlightGeoJSON && hoveredAlert && (
            <SafeSource id="hovered-region" type="geojson" data={hoveredHighlightGeoJSON as any}>
              {isRoad ? (
                <>
                  <SafeLayer 
                    id="hovered-region-line-glow" 
                    type="line" 
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : activeColor, 'line-width': 8, 'line-opacity': 0.6, 'line-blur': 2}} 
                  />
                  <SafeLayer 
                    id="hovered-region-line-core" 
                    type="line" 
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : activeColor, 'line-width': 3, 'line-opacity': 1}} 
                  />
                </>
              ) : (
                <>
                  <SafeLayer 
                    id="hovered-region-fill" 
                    type="fill" 
                    paint={{'fill-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : activeColor, 'fill-opacity': 0.15}} 
                  />
                  <SafeLayer 
                    id="hovered-region-line" 
                    type="line" 
                    paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : activeColor, 'line-width': 2, 'line-dasharray': [2, 2]}} 
                  />
                </>
              )}
            </SafeSource>
          )}
        </Map>
        
        {/* Dark map wash to ensure UI overlays pop */}
        <div className="absolute inset-0 bg-[#051005]/50 pointer-events-none z-10" />
      </div>

      {/* Heavy gradients for side panels mapping smoothly into the map */}
      <div className="absolute inset-y-0 left-0 w-[500px] bg-gradient-to-r from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[500px] bg-gradient-to-l from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />

      {/* LEFT SIDEBAR: Flow, Demand, Citizen */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pr-4 pointer-events-auto"
      >
        <WidgetPanel title={AGENTS_DATA.flow.title} icon={<AGENTS_DATA.flow.icon color={AGENTS_DATA.flow.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.55] min-h-0 w-full">
               <FunctionCard 
                 item={AGENTS_DATA.flow.functions[0]} 
                 color={AGENTS_DATA.flow.color} 
                 isActive={activeMetric === AGENTS_DATA.flow.functions[0].id} 
                 onClick={() => handleMetricClick(AGENTS_DATA.flow.functions[0].id)} 
                 onActionClick={(id) => {
                   if (id === 'flw_1') setShowTargetModal(true);
                 }}
                 layout="full" 
               />
            </div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={AGENTS_DATA.flow.functions[1]} color={AGENTS_DATA.flow.color} isActive={activeMetric === AGENTS_DATA.flow.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.flow.functions[1].id)} layout="half" />
               <FunctionCard item={AGENTS_DATA.flow.functions[2]} color={AGENTS_DATA.flow.color} isActive={activeMetric === AGENTS_DATA.flow.functions[2].id} onClick={() => handleMetricClick(AGENTS_DATA.flow.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        
        <WidgetPanel title={AGENTS_DATA.demand.title} icon={<AGENTS_DATA.demand.icon color={AGENTS_DATA.demand.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.demand.functions[0]} color={AGENTS_DATA.demand.color} isActive={activeMetric === AGENTS_DATA.demand.functions[0].id} onClick={() => handleMetricClick(AGENTS_DATA.demand.functions[0].id)} layout="full" />
            </div>
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.demand.functions[1]} color={AGENTS_DATA.demand.color} isActive={activeMetric === AGENTS_DATA.demand.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.demand.functions[1].id)} layout="full" />
            </div>
          </div>
        </WidgetPanel>

      </motion.div>

      {/* CENTER VIEW - Radar HUD overlaying Map */}
      <div className="flex-1 relative pointer-events-none flex flex-col items-center justify-center z-20">
        
        {/* Top Right Toolbars */}
        <div className="absolute top-4 right-4 pointer-events-auto flex items-center bg-[#0d1f0d]/80 border border-[#D4AF37]/30 backdrop-blur-md rounded-sm overflow-hidden z-20">
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Target className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Square className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Maximize className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all hover:scale-110"><ArrowRight className="w-4 h-4" /></button>
        </div>

        {/* Central UI HUD - Reticle changes color based on active Agent */}
        <div className="relative flex items-center justify-center pointer-events-none opacity-60">
          <div className="absolute w-2 h-2 rounded-full z-10 animate-pulse transition-colors duration-500" style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
          <div className="absolute w-8 h-8 rounded-full border z-10 animate-ping transition-colors duration-500" style={{ borderColor: `${activeColor}80`, animationDuration: '3s' }} />
          
          <motion.div 
            className="absolute w-[300px] h-[300px] rounded-full border-[1px] border-dashed transition-colors duration-500"
            style={{ borderColor: `${activeColor}40`, boxShadow: `inset 0 0 50px rgba(${activeRgb},0.05)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute w-[100vw] h-[1px] transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, transparent, ${activeColor}20, transparent)` }} />
          <div className="absolute h-[100vh] w-[1px] transition-all duration-500" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${activeColor}20, transparent)` }} />
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
          <motion.path 
            key={activeMetric}
            d="M 50% 50% L 35% 70%" 
            fill="none" 
            stroke={activeColor}
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* RIGHT SIDEBAR: Idle, Asset */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pl-4 pointer-events-auto"
      >
        <WidgetPanel title={AGENTS_DATA.idle.title} icon={<AGENTS_DATA.idle.icon color={AGENTS_DATA.idle.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.6] min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.idle.functions[0]} color={AGENTS_DATA.idle.color} isActive={activeMetric === AGENTS_DATA.idle.functions[0].id} onClick={() => handleMetricClick(AGENTS_DATA.idle.functions[0].id)} layout="full" />
            </div>
            <div className="flex-[0.4] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={AGENTS_DATA.idle.functions[1]} color={AGENTS_DATA.idle.color} isActive={activeMetric === AGENTS_DATA.idle.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.idle.functions[1].id)} layout="half" />
               <FunctionCard item={AGENTS_DATA.idle.functions[2]} color={AGENTS_DATA.idle.color} isActive={activeMetric === AGENTS_DATA.idle.functions[2].id} onClick={() => handleMetricClick(AGENTS_DATA.idle.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        
        <WidgetPanel title={AGENTS_DATA.asset.title} icon={<AGENTS_DATA.asset.icon color={AGENTS_DATA.asset.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.6] min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.asset.functions[0]} color={AGENTS_DATA.asset.color} isActive={activeMetric === AGENTS_DATA.asset.functions[0].id} onClick={() => handleMetricClick(AGENTS_DATA.asset.functions[0].id)} layout="full" />
            </div>
            <div className="flex-[0.4] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={AGENTS_DATA.asset.functions[1]} color={AGENTS_DATA.asset.color} isActive={activeMetric === AGENTS_DATA.asset.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.asset.functions[1].id)} layout="half" />
               <FunctionCard item={AGENTS_DATA.asset.functions[2]} color={AGENTS_DATA.asset.color} isActive={activeMetric === AGENTS_DATA.asset.functions[2].id} onClick={() => handleMetricClick(AGENTS_DATA.asset.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
      </motion.div>

      {/* ANALYSIS MODAL */}
      <AnalysisModal 
        isOpen={!!selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
        data={selectedAlert} 
      />

      {/* TARGET MODAL */}
      <AnimatePresence>
        {showTargetModal && (
          <TargetModal 
            isOpen={showTargetModal} 
            onClose={() => setShowTargetModal(false)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}