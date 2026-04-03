import { 
  Activity,
  MapPin,
  TrendingUp,
  Layers,
  Target,
  Maximize,
  Square,
  ArrowRight,
  PieChart as PieChartIcon,
  Wifi,
  Crosshair
} from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, LineChart, Line, ComposedChart, Area
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

const sprawlData = [
  { time: '1月', reported: 490, detected: 490 },
  { time: '3月', reported: 494, detected: 496 },
  { time: '5月', reported: 496, detected: 501 },
  { time: '7月', reported: 498, detected: 507 },
  { time: '9月', reported: 499, detected: 511 },
  { time: '12月', reported: 500, detected: 514.2 },
];

const landUseData = [
  { name: "商业用地", value: 34, color: "#FCD34D" },
  { name: "住宅用地", value: 28, color: "#006C35" },
  { name: "绿地", value: 21, color: "#00B558" },
  { name: "公共服务", value: 17, color: "#3b82f6" },
];

const renderFlowDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  if (payload.value > 45) {
      return <circle key={`dot-flow-${index}`} cx={cx} cy={cy} r={4} fill="#ff4444" stroke="#fff" strokeWidth={1} />;
  }
  return <circle key={`dot-flow-${index}`} cx={cx} cy={cy} r={3} fill="#0c1a06" stroke="#00B558" strokeWidth={1.5} />;
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
          {/* Road Network Expansion — from Diagnostics dmd_2 data */}
          <Marker longitude={42.0} latitude={26.5} anchor="bottom">
            <MapLabel title="利雅得–NEOM" metric="4,200 KM" desc="走廊规划 · 2029" type="alert" />
          </Marker>
          <Marker longitude={39.1} latitude={22.4} anchor="bottom">
            <MapLabel title="吉达–KAEC" metric="1,800 KM" desc="高速公路建设中 · 2028" type="warning" />
          </Marker>
          <Marker longitude={50.1} latitude={26.45} anchor="bottom">
            <MapLabel title="东部省环线" metric="3,500 KM" desc="货运环线 · 2030" type="alert" />
          </Marker>
          <Marker longitude={42.3} latitude={18.25} anchor="bottom">
            <MapLabel title="艾卜哈–索达" metric="800 KM" desc="旅游公路设计 · 2028" type="warning" />
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
        <div onClick={() => navigate('/diagnostics_and_forecasting')} className="flex-[1.2] min-h-0 cursor-pointer">
        <WidgetPanel title="诊断与预测" icon={<Activity className="w-4 h-4 text-[#00B558]" />} className="h-full">
          <div className="flex flex-col gap-3 h-full">
            <div className="h-[60%] flex-none min-h-0 w-full relative p-2 bg-[#051105]/40 border border-[#00B558]/30 shadow-[inset_0_0_15px_rgba(0,181,88,0.05)]">
               <div className="absolute top-2 left-2 right-2 text-[10px] font-bold text-[#00B558] mb-1 flex justify-between tracking-widest z-10 uppercase">
                 <span>流量智能体 (24H通勤)</span>
                 <span className="text-[#ff4444]">阈值 &gt;45M</span>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={flowData} margin={{ top: 20, right: 10, left: -20, bottom: -5 }}>
                   <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 80]} />
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }} 
                     formatter={(value: number) => [`${value}M/时`, '流量']}
                     labelFormatter={(label) => `时间: ${label}`}
                   />
                   <ReferenceLine y={45} stroke="#ff4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '>45M', fill: '#ff4444', fontSize: 10, fontWeight: 'bold' }} />
                   <Line type="monotone" dataKey="value" stroke="#00B558" strokeWidth={2.5} dot={renderFlowDot} isAnimationActive={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
               <KpiCard act="需求预测器" metric="-153K" unit="单位" desc="2030年住房缺口" icon={<TrendingUp className="w-4 h-4 text-[#FCD34D]" />} borderColor="border-[#FCD34D]/40" bgColor="bg-[#D4AF37]/10" glow="group-hover:shadow-[0_0_15px_rgba(252,211,77,0.3)]" metricColor="text-[#FCD34D]" centered />
               <KpiCard act="闲置土地智能体" metric="38" unit="%" desc="白地激活率" icon={<MapPin className="w-4 h-4 text-[#ff4444]" />} borderColor="border-[#ff4444]/40" bgColor="bg-[#ef4444]/10" glow="group-hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" metricColor="text-[#ff4444]" centered />
            </div>
          </div>
        </WidgetPanel>
        </div>

        {/* Action 2: Land Use Optimization */}
        <div onClick={() => navigate('/optimization')} className="flex-[0.8] min-h-0 cursor-pointer">
        <WidgetPanel title="土地利用优化" icon={<PieChartIcon className="w-4 h-4 text-[#FCD34D]" />} className="h-full">
          <div className="flex gap-2 h-full">
            <div className="flex-[1.2] min-w-0 bg-[#051105]/40 border border-[#FCD34D]/30 p-2 flex flex-col items-center justify-between relative shadow-[inset_0_0_15px_rgba(252,211,77,0.05)]">
               <span className="absolute top-1.5 left-2 text-[10px] font-bold text-[#FCD34D]/90 tracking-widest uppercase drop-shadow-sm w-full text-center pr-4 z-10">区划顾问</span>
               
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
                       formatter={(value: number) => [`${value}%`, '占比']}
                     />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-[#FCD34D] text-[22px] font-black drop-shadow-[0_0_10px_rgba(252,211,77,0.8)] leading-none mt-1">73</span>
                   <span className="text-[7px] text-gray-500 font-bold tracking-wider uppercase mt-0.5">平衡指数</span>
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
               <KpiCard act="干预指南" metric="84" unit="" desc="潜力评分" icon={<Target className="w-4 h-4 text-[#00B558]" />} borderColor="border-[#00B558]/40" bgColor="bg-[#006C35]/10" glow="group-hover:shadow-[0_0_15px_rgba(0,181,88,0.3)]" metricColor="text-[#00B558]" compact centered />
               <KpiCard act="交通与停车" metric="72" unit="" desc="可达性指数" icon={<Crosshair className="w-4 h-4 text-[#FCD34D]" />} borderColor="border-[#FCD34D]/40" bgColor="bg-[#FCD34D]/10" glow="group-hover:shadow-[0_0_15px_rgba(252,211,77,0.3)]" metricColor="text-[#FCD34D]" compact centered />
            </div>
          </div>
        </WidgetPanel>
        </div>

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
        <div onClick={() => navigate('/simulation')} className="flex-[0.9] min-h-0 cursor-pointer">
        <WidgetPanel title="影响模拟" icon={<Layers className="w-4 h-4 text-[#00B558]" />} className="h-full">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.5] bg-gradient-to-br from-[#006C35]/40 to-transparent border border-[#00B558]/50 p-2.5 flex items-center justify-between relative shadow-[inset_0_0_20px_rgba(0,181,88,0.15)] rounded-sm backdrop-blur-sm group hover:border-[#00B558] transition-colors">
               <div className="flex flex-col pl-2">
                 <span className="text-sm text-[#10b981] font-black tracking-widest leading-tight uppercase drop-shadow-sm">
                   洪涝风险<br/>指数
                 </span>
                 <span className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">当前 · 2030目标: 85</span>
               </div>
               <span className="text-[4.5rem] pr-2 leading-none font-black text-[#10b981] drop-shadow-[0_0_20px_rgba(16,185,129,0.6)] tracking-tighter">42</span>
            </div>
            <div className="flex-[0.5] bg-gradient-to-br from-[#1e3a5f]/40 to-transparent border border-[#3b82f6]/50 p-2.5 flex items-center justify-between relative shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] rounded-sm backdrop-blur-sm group hover:border-[#3b82f6] transition-colors">
               <div className="flex flex-col pl-2">
                 <span className="text-sm text-[#3b82f6] font-black tracking-widest leading-tight uppercase drop-shadow-sm">
                   项目<br/>IRR
                 </span>
                 <span className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">当前 · 2030目标: 18%</span>
               </div>
               <span className="text-[4.5rem] pr-2 leading-none font-black text-[#3b82f6] drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] tracking-tighter">8<span className="text-3xl">%</span></span>
            </div>
          </div>
        </WidgetPanel>
        </div>

        {/* Action 4: Monitoring & Improvement */}
        <div onClick={() => navigate('/monitoring')} className="flex-[1.1] min-h-0 cursor-pointer">
        <WidgetPanel title="监控与改进" icon={<Wifi className="w-4 h-4 text-[#FCD34D]" />} className="h-full">
          <div className="flex flex-col gap-3 h-full">
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
               <KpiCard act="变化追踪器" metric="+2.8" unit="%" desc="足迹偏移" icon={<Activity className="w-4 h-4 text-[#ff4444]" />} borderColor="border-[#ff4444]/40" bgColor="bg-[#ef4444]/10" glow="group-hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" metricColor="text-[#ff4444]" centered />
               <KpiCard act="承载力" metric="+14" unit="K" desc="月净流入" icon={<TrendingUp className="w-4 h-4 text-[#FCD34D]" />} borderColor="border-[#FCD34D]/40" bgColor="bg-[#FCD34D]/10" glow="group-hover:shadow-[0_0_15px_rgba(252,211,77,0.3)]" metricColor="text-[#FCD34D]" centered />
            </div>
            <div className="h-[60%] flex-none w-full min-h-0 border-t border-[#FCD34D]/30 pt-2 mt-1 relative">
               <div className="absolute top-2 right-2 text-[10px] font-bold text-[#FCD34D] mb-1 flex flex-col items-end tracking-widest z-10 uppercase">
                 <span>城市扩展差距</span>
                 <span className="text-[#ff4444]">偏移: 14.2 KM²</span>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={sprawlData} margin={{ top: 15, right: 0, left: -20, bottom: -5 }}>
                   <defs>
                     <linearGradient id="sprawlBlueGrad" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2}/>
                       <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                   <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={[485, 520]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }} 
                     cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                     formatter={(value: number) => [`${value} KM²`]}
                   />
                   <Area type="step" dataKey="reported" name="市政府" stroke="#3B82F6" strokeWidth={1.5} fill="url(#sprawlBlueGrad)" isAnimationActive={true} />
                   <Line type="step" dataKey="detected" name="激光雷达实测" stroke="#FF4444" strokeWidth={2.5} dot={false} isAnimationActive={true} />
                 </ComposedChart>
               </ResponsiveContainer>
            </div>
          </div>
        </WidgetPanel>
        </div>

      </motion.div>
    </div>
  );
}

/* HELPER COMPONENTS */

function KpiCard({ act, metric, unit, desc, icon, borderColor, bgColor, glow, metricColor = "text-[#FCD34D]", compact = false, centered = false }: { act: string, metric: string, unit?: string, desc: string, icon: React.ReactNode, borderColor: string, bgColor: string, glow: string, metricColor?: string, compact?: boolean, centered?: boolean }) {
  
  let finalNumberColor = `${metricColor} drop-shadow-[0_0_10px_rgba(252,211,77,0.3)]`;
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
