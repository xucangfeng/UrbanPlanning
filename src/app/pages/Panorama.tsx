import { 
  Activity,
  MapPin,
  TrendingUp,
  Layers,
  Target,
  Maximize,
  Square,
  ArrowRight,
  ShieldCheck,
  PieChart as PieChartIcon,
  Wind,
  Wifi,
  Crosshair
} from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, LineChart, Line, BarChart, Bar
} from "recharts";

import { motion } from "motion/react";
import { useNavigate } from "react-router";
import Map, { MapRef, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRef, useCallback } from "react";

declare global {
  interface Window {
    lastMapViewState?: any;
  }
}

const flowData = [
  { time: "00:00", value: 25 },
  { time: "04:00", value: 20 },
  { time: "08:00", value: 55 },
  { time: "12:00", value: 35 },
  { time: "16:00", value: 30 },
  { time: "18:00", value: 65 },
  { time: "20:00", value: 45 },
  { time: "24:00", value: 25 },
];

const syncData = [
  { time: "00:00", delay: 10 },
  { time: "04:00", delay: 15 },
  { time: "08:00", delay: 85 },
  { time: "12:00", delay: 20 },
  { time: "16:00", delay: 18 },
  { time: "18:00", delay: 72 },
  { time: "20:00", delay: 30 },
  { time: "24:00", delay: 12 },
];

const landUseData = [
  { name: "OVER-LIMIT", value: 35, color: "#ff4444" },
  { name: "COMMERCIAL", value: 25, color: "#FCD34D" },
  { name: "PUBLIC/GREEN", value: 20, color: "#00B558" },
  { name: "RESIDENTIAL", value: 20, color: "#006C35" },
];

const renderFlowDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  if (payload.value > 45) {
      return <circle key={`dot-flow-${index}`} cx={cx} cy={cy} r={4} fill="#ff4444" stroke="#fff" strokeWidth={1} />;
  }
  return <circle key={`dot-flow-${index}`} cx={cx} cy={cy} r={3} fill="#0c1a06" stroke="#00B558" strokeWidth={1.5} />;
};

const renderSyncDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  if (payload.delay > 60) {
      return <circle key={`dot-sync-${index}`} cx={cx} cy={cy} r={4} fill="#ff4444" stroke="#fff" strokeWidth={1} />;
  }
  return <circle key={`dot-sync-${index}`} cx={cx} cy={cy} r={3} fill="#0c1a06" stroke="#FCD34D" strokeWidth={1.5} />;
};

const renderSyncBar = (props: any) => {
  const { fill, x, y, width, height, payload, index } = props;
  const isAlert = payload.delay > 60;
  
  // Create a rounded top bar
  // Make sure we don't try to draw negative heights or arc over bounds
  const pathHeight = Math.max(0, height);
  const radius = Math.min(width / 2, pathHeight);
  const pathY = y;
  
  const path = `
    M${x},${pathY + pathHeight}
    L${x},${pathY + radius}
    A${radius},${radius},0,0,1,${x + width},${pathY + radius}
    L${x + width},${pathY + pathHeight}
    Z
  `;

  return (
    <path 
      key={`bar-sync-${index}`}
      d={path}
      fill={isAlert ? "#ff4444" : "#FCD34D"} 
      opacity={isAlert ? 1 : 0.8} 
    />
  );
};

function MapLabel({ title, metric, desc, type }: { title: string, metric: string, desc: string, type: 'warning' | 'alert' }) {
  const color = type === 'alert' ? '#ff4444' : '#FCD34D';
  const bgColor = type === 'alert' ? 'rgba(255,68,68,0.05)' : 'rgba(252,211,77,0.05)';
  const borderColor = type === 'alert' ? 'border-[#ff4444]/30' : 'border-[#FCD34D]/30';
  
  return (
    <div className="flex flex-col items-center group">
      {/* Icon Area */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 rounded-full border border-solid opacity-20 animate-ping" style={{ borderColor: color, animationDuration: '3s' }} />
        <div className="absolute w-8 h-8 rounded-full border border-solid opacity-40 animate-ping" style={{ borderColor: color, animationDuration: '2s' }} />
        <div className="relative w-7 h-7 rounded-full flex items-center justify-center bg-[#070d07]/80 backdrop-blur-sm border z-10 shadow-lg" style={{ borderColor: `${color}80`, boxShadow: `0 0 10px ${color}40` }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
             <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        </div>
      </div>
      
      {/* Connecting element */}
      <div className="w-[1px] h-4 opacity-50" style={{ backgroundImage: `linear-gradient(to bottom, ${color}, transparent)` }} />

      {/* Information Box */}
      <div className={`px-4 py-2 bg-[#051005]/80 backdrop-blur-md border ${borderColor} rounded-[4px] min-w-[220px] flex flex-col items-center pointer-events-auto transition-transform hover:scale-105`} style={{ boxShadow: `0 0 20px ${bgColor}` }}>
        <span className="text-[11px] font-black tracking-[0.15em] uppercase mb-1.5 drop-shadow-sm" style={{ color }}>{title}</span>
        <div className="flex items-baseline justify-center gap-2 w-full">
          <span className="text-[16px] font-black text-gray-200 tracking-tight">{metric}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{desc}</span>
        </div>
      </div>
    </div>
  )
}

export default function Panorama() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [44.0, 24.0],
        zoom: 4.2,
        pitch: 30,
        bearing: 0,
        duration: 2500,
        essential: true
      });
    }
  }, []);

  return (
    <div className="relative h-full w-full pt-[80px] pb-4 flex justify-between px-6 overflow-hidden pointer-events-none uppercase">
      {/* FULLSCREEN BACKGROUND MAP */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map
          ref={mapRef}
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
          {/* Scatter 4 MapLabels within Saudi Arabia macro view */}
          <Marker longitude={38.5} latitude={28.0} anchor="bottom">
            <MapLabel title="WHITE LAND" metric="4 YRS" desc="AL YASMIN UNTAXED" type="warning" />
          </Marker>
          <Marker longitude={48.5} latitude={26.5} anchor="bottom">
            <MapLabel title="ZONING STRAIN" metric="35%" desc="KAFD COMMERCIAL OVERLOAD" type="alert" />
          </Marker>
          <Marker longitude={46.5} latitude={20.5} anchor="bottom">
            <MapLabel title="CRITICAL FLOW" metric="12KM/H" desc="KING FAHD SPEED DROP" type="alert" />
          </Marker>
          <Marker longitude={41.5} latitude={22.5} anchor="bottom">
            <MapLabel title="FLOOD RISK" metric="98%" desc="WADI HANIFAH LOAD" type="warning" />
          </Marker>
        </Map>
        {/* Dark map wash to ensure UI overlays pop */}
        <div className="absolute inset-0 bg-[#051005]/50 pointer-events-none z-10" />
      </div>

      {/* Heavy gradients for the side panels mimicking frosted glass overlay */}
      <div className="absolute inset-y-0 left-0 w-[500px] bg-gradient-to-r from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[500px] bg-gradient-to-l from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pr-4 pointer-events-auto"
      >
        
        {/* Action 1: Diagnostics & Prediction */}
        <WidgetPanel title="DIAGNOSTICS & PREDICTION" icon={<Activity className="w-4 h-4 text-[#00B558]" />} className="flex-[1.2] min-h-0">
          <div className="flex flex-col gap-3 h-full">
            <div className="h-[60%] flex-none min-h-0 w-full relative p-2 bg-[#051105]/40 border border-[#00B558]/30 shadow-[inset_0_0_15px_rgba(0,181,88,0.05)]">
               <div className="absolute top-2 left-2 right-2 text-[10px] font-bold text-[#00B558] mb-1 flex justify-between tracking-widest z-10 uppercase">
                 <span>Flow Agent (24H Commute)</span>
                 <span className="text-[#ff4444]">Threshold &gt;45M</span>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={flowData} margin={{ top: 20, right: 10, left: -20, bottom: -5 }}>
                   <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 80]} />
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }} 
                     formatter={(value: number) => [`${value}M/hr`, 'Flow Vol.']}
                     labelFormatter={(label) => `Time: ${label}`}
                   />
                   <ReferenceLine y={45} stroke="#ff4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '>45M', fill: '#ff4444', fontSize: 10, fontWeight: 'bold' }} />
                   <Line type="monotone" dataKey="value" stroke="#00B558" strokeWidth={2.5} dot={renderFlowDot} isAnimationActive={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
               <KpiCard act="Demand Forecaster" metric="-8,240" unit="UNITS" desc="N. Riyadh 3-BR Shortage" icon={<TrendingUp className="w-4 h-4 text-[#FCD34D]" />} borderColor="border-[#FCD34D]/40" bgColor="bg-[#D4AF37]/10" glow="group-hover:shadow-[0_0_15px_rgba(252,211,77,0.3)]" metricColor="text-[#FCD34D]" centered />
               <KpiCard act="Idle Land Agent" metric="47" unit="PLOTS" desc="Idle >12M High-Value" icon={<MapPin className="w-4 h-4 text-[#ff4444]" />} borderColor="border-[#ff4444]/40" bgColor="bg-[#ef4444]/10" glow="group-hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" metricColor="text-[#ff4444]" centered />
            </div>
          </div>
        </WidgetPanel>

        {/* Action 2: Land Use Optimization */}
        <WidgetPanel title="LAND USE OPTIMIZATION" icon={<PieChartIcon className="w-4 h-4 text-[#FCD34D]" />} className="flex-[0.8] min-h-0">
          <div className="flex gap-2 h-full">
            <div className="flex-[1.2] min-w-0 bg-[#051105]/40 border border-[#FCD34D]/30 p-2 flex flex-col items-center justify-between relative shadow-[inset_0_0_15px_rgba(252,211,77,0.05)]">
               <span className="absolute top-1.5 left-2 text-[10px] font-bold text-[#FCD34D]/90 tracking-widest uppercase drop-shadow-sm w-full text-center pr-4 z-10">ZONING ADVISOR</span>
               
               <div className="w-[150px] h-[150px] relative flex-1 flex flex-col justify-center items-center mt-3">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={landUseData} nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={0} stroke="#0a140a" strokeWidth={2} dataKey="value" isAnimationActive={true}>
                       {landUseData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }} 
                       formatter={(value: number) => [`${value}%`, 'Share']}
                     />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-[#ff4444] text-[28px] font-black drop-shadow-[0_0_10px_rgba(255,68,68,0.8)] leading-none mt-1">35%</span>
                 </div>
               </div>
               
               <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 mt-2 px-1 pb-1 z-10 flex-none">
                 {landUseData.map((item, i) => (
                   <div key={i} className="flex items-center justify-between text-[9px]">
                      <div className="flex items-center gap-1.5 truncate">
                         <div className="w-1.5 h-1.5 rounded-[1px] flex-none" style={{ backgroundColor: item.color, boxShadow: `0 0 5px ${item.color}80` }} />
                         <span className="text-gray-200 font-bold truncate tracking-wider">{item.name}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
            
            <div className="flex-[0.7] min-w-0 flex flex-col gap-2">
               <KpiCard act="Intervention Guide" metric="47" unit="%" desc="Optimal ROI" icon={<Target className="w-4 h-4 text-[#00B558]" />} borderColor="border-[#00B558]/40" bgColor="bg-[#006C35]/10" glow="group-hover:shadow-[0_0_15px_rgba(0,181,88,0.3)]" metricColor="text-[#00B558]" compact centered />
               <KpiCard act="Access & Parking" metric="13" unit="ZONES" desc="Strain <5%" icon={<Crosshair className="w-4 h-4 text-[#ff4444]" />} borderColor="border-[#ff4444]/40" bgColor="bg-[#ef4444]/10" glow="group-hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" metricColor="text-[#ff4444]" compact centered />
            </div>
          </div>
        </WidgetPanel>

      </motion.div>

      {/* CENTER VIEW - Map Overlays */}
      <div className="flex-1 relative pointer-events-none flex flex-col items-center justify-center">
        
        {/* Top Right Toolbars */}
        <div className="absolute top-4 right-4 pointer-events-auto flex items-center bg-[#0d1f0d]/80 border border-[#D4AF37]/30 backdrop-blur-md rounded-sm overflow-hidden">
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Target className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Square className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Maximize className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all hover:scale-110"><ArrowRight className="w-4 h-4" /></button>
        </div>

        {/* Central UI HUD - Minimalist Targeting Reticle & Callout */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-2 h-2 bg-[#FCD34D] rounded-full shadow-[0_0_15px_#FCD34D] z-10 animate-pulse" />
          <div className="absolute w-8 h-8 rounded-full border border-[#FCD34D]/50 z-10 animate-ping" style={{ animationDuration: '3s' }} />
          
          <motion.div 
            className="absolute w-[300px] h-[300px] rounded-full border-[1.5px] border-dashed border-[#FCD34D]/20 shadow-[0_0_50px_rgba(252,211,77,0.05)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute w-[100vw] h-[1px] bg-gradient-to-r from-transparent via-[#00B558]/30 to-transparent pointer-events-none" />
          <div className="absolute h-[100vh] w-[1px] bg-gradient-to-b from-transparent via-[#00B558]/30 to-transparent pointer-events-none" />
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <motion.path 
            d="M 50% 50% L 85% 80%" 
            fill="none" 
            stroke="#00B558" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* RIGHT SIDEBAR */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pl-4 pointer-events-auto"
      >
        
        {/* Action 3: Impact Simulation & Feasibility */}
        <WidgetPanel title="IMPACT SIMULATION" icon={<Layers className="w-4 h-4 text-[#00B558]" />} className="flex-[0.9] min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.5] bg-gradient-to-br from-[#006C35]/40 to-transparent border border-[#00B558]/50 p-2.5 flex items-center justify-between relative shadow-[inset_0_0_20px_rgba(0,181,88,0.15)] rounded-sm backdrop-blur-sm group hover:border-[#00B558] transition-colors">
               <div className="flex flex-col pl-2">
                 <span className="text-sm text-[#00B558] font-black tracking-widest leading-tight uppercase drop-shadow-sm">
                   SIMULATION<br/>CONFIDENCE
                 </span>
                 <span className="text-[10px] text-[#FCD34D] font-bold mt-2 uppercase tracking-widest">MODEL VALIDATION SCORE</span>
               </div>
               <span className="text-[4.5rem] pr-2 leading-none font-black text-[#FCD34D] drop-shadow-[0_0_20px_rgba(252,211,77,0.6)] tracking-tighter">98%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-[0.5] min-h-0">
               <KpiCard act="Mobility Impact" metric="+34" unit="%" desc="Shade-Driven NMT Lift" icon={<Wind className="w-4 h-4 text-[#00B558]" />} borderColor="border-[#00B558]/40" bgColor="bg-[#006C35]/10" glow="group-hover:shadow-[0_0_15px_rgba(0,181,88,0.3)]" metricColor="text-[#00B558]" compact centered />
               <KpiCard act="Env. & Resilience" metric="5" unit="AREAS" desc="Flood High-Risk Zones" icon={<ShieldCheck className="w-4 h-4 text-[#ff4444]" />} borderColor="border-[#ff4444]/40" bgColor="bg-[#ef4444]/10" glow="group-hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" metricColor="text-[#ff4444]" compact centered />
            </div>
          </div>
        </WidgetPanel>

        {/* Action 4: Monitoring & Improvement */}
        <WidgetPanel title="MONITORING & IMPROVEMENT" icon={<Wifi className="w-4 h-4 text-[#FCD34D]" />} className="flex-[1.1] min-h-0">
          <div className="flex flex-col gap-3 h-full">
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
               <KpiCard act="Change Tracker" metric="12" unit="SITES" desc="Sat-AI Violations" icon={<Activity className="w-4 h-4 text-[#ff4444]" />} borderColor="border-[#ff4444]/40" bgColor="bg-[#ef4444]/10" glow="group-hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" metricColor="text-[#ff4444]" centered />
               <KpiCard act="Cont. Learning" metric="+8.3" unit="%" desc="Model Accuracy Lift" icon={<TrendingUp className="w-4 h-4 text-[#00B558]" />} borderColor="border-[#00B558]/40" bgColor="bg-[#006C35]/10" glow="group-hover:shadow-[0_0_15px_rgba(0,181,88,0.3)]" metricColor="text-[#00B558]" centered />
            </div>
            <div className="h-[60%] flex-none w-full min-h-0 border-t border-[#FCD34D]/30 pt-2 mt-1 relative">
               <div className="absolute top-2 right-2 text-[10px] font-bold text-[#FCD34D] mb-1 flex flex-col items-end tracking-widest z-10 uppercase">
                 <span>Sync Delay</span>
                 <span className="text-[#ff4444]">Threshold &gt;1H</span>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={syncData} margin={{ top: 15, right: 0, left: -25, bottom: -5 }} barSize={14}>
                   <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }} 
                     cursor={{ fill: '#1e293b', opacity: 0.4 }} 
                     formatter={(value: number) => [`${value} mins`, 'Sync Delay']}
                     labelFormatter={(label) => `Time: ${label}`}
                   />
                   <ReferenceLine y={60} stroke="#ff4444" strokeDasharray="3 3" />
                   <Bar dataKey="delay" shape={renderSyncBar} isAnimationActive={false} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        </WidgetPanel>

      </motion.div>
    </div>
  );
}

/* HELPER COMPONENTS */

function KpiCard({ act, metric, unit, desc, icon, borderColor, bgColor, glow, metricColor = "text-[#FCD34D]", compact = false, centered = false }: { act: string, metric: string, unit?: string, desc: string, icon: React.ReactNode, borderColor: string, bgColor: string, glow: string, metricColor?: string, compact?: boolean, centered?: boolean }) {
  
  // Map colors to match the reference image style: white for standard/green, intense glow for gold/red
  let finalNumberColor = `${metricColor} drop-shadow-[0_0_10px_rgba(252,211,77,0.3)]`; // Default soft gold shadow
  if (metricColor.includes('FCD34D') || metricColor.includes('D4AF37')) {
    finalNumberColor = `${metricColor} drop-shadow-[0_0_15px_rgba(252,211,77,0.6)]`;
  } else if (metricColor.includes('ff4444')) {
    finalNumberColor = `${metricColor} drop-shadow-[0_0_15px_rgba(255,68,68,0.6)]`;
  } else if (metricColor.includes('00B558') || metricColor.includes('10B981')) {
    finalNumberColor = `${metricColor} drop-shadow-[0_0_15px_rgba(0,181,88,0.6)]`;
  }

  return (
    <div className={`p-3 border ${borderColor} rounded-lg flex flex-col relative group transition-all duration-300 hover:-translate-y-1 bg-[#070d07] hover:bg-[#0c140c] ${glow} shadow-sm ${compact ? 'flex-1' : 'min-h-[105px]'}`}>
       {/* Top Row: Icon + Action Title */}
       <div className="flex items-center gap-2 mb-2">
         <div className="opacity-90">{icon}</div>
         <span className="text-[10px] font-bold text-gray-300 tracking-wider uppercase drop-shadow-sm">{act}</span>
       </div>
       
       {/* Bottom Row: Metric + Subtext */}
       <div className={`flex flex-col flex-1 items-center justify-between text-center w-full`}>
          <div className="flex items-baseline justify-center mt-auto">
             <span className={`font-black tracking-tighter leading-none ${compact ? 'text-[36px]' : 'text-[42px]'} uppercase ${finalNumberColor}`}>
               {metric}
               {unit === '%' && <span className={`${compact ? 'text-2xl' : 'text-[26px]'} ml-0.5`}>%</span>}
             </span>
             {unit && unit !== '%' && <span className={`text-[9px] font-bold tracking-widest opacity-70 uppercase ml-1.5 ${finalNumberColor}`}>{unit}</span>}
          </div>
          <span className="text-[10px] font-medium text-gray-400 tracking-wider mt-auto pt-1.5 truncate uppercase max-w-full w-full" title={desc}>{desc}</span>
       </div>
    </div>
  )
}