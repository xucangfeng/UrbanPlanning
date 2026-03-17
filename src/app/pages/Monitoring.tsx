import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { 
  Target, BrainCircuit, ShieldAlert,
  Eye, Building2, Activity, AlertTriangle, MapPin, Layers, TrendingUp
} from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import { AgentTerminal } from "../components/AgentTerminal";
import { 
  ComposedChart, Area, Line, Bar, Cell,
  ResponsiveContainer, ReferenceLine, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';

// --- MOCK DATA (STRICTLY ALIGNED WITH KPIs) ---
const generateData = () => {
  return {
    twinDrift: [
      { time: 'JAN', reported: 490, detected: 490 },
      { time: 'FEB', reported: 492, detected: 493 },
      { time: 'MAR', reported: 494, detected: 496 },
      { time: 'APR', reported: 495, detected: 498 },
      { time: 'MAY', reported: 496, detected: 501 },
      { time: 'JUN', reported: 497, detected: 504 },
      { time: 'JUL', reported: 498, detected: 507 },
      { time: 'AUG', reported: 499, detected: 509 },
      { time: 'SEP', reported: 499, detected: 511 },
      { time: 'OCT', reported: 500, detected: 512 },
      { time: 'NOV', reported: 500, detected: 513.5 },
      { time: 'DEC', reported: 500, detected: 514.2 }
    ],
    populationPressure: [
      { time: '24 Q1', influx: 75, capacity: 100 },
      { time: '24 Q3', influx: 81, capacity: 100 },
      { time: '25 Q1', influx: 86, capacity: 100 },
      { time: '25 Q3', influx: 92, capacity: 100 },
      { time: '26 Q1', influx: 97, capacity: 100 },
      { time: '26 Q3', influx: 102, capacity: 100 },
      { time: '27 Q1', influx: 108, capacity: 100 },
      { time: '27 Q3', influx: 115, capacity: 100 }
    ],
    amanahMatrix: [
      { name: "RIYADH", violations: 142, enforcementRate: 45, color: "#FF4444", feeLeak: "12.4M" },
      { name: "JEDDAH", violations: 89, enforcementRate: 62, color: "#FCD34D", feeLeak: "8.1M" },
      { name: "MECCA", violations: 34, enforcementRate: 88, color: "#00B558", feeLeak: "1.2M" },
      { name: "MEDINA", violations: 12, enforcementRate: 94, color: "#00B558", feeLeak: "0.4M" },
      { name: "DAMMAM", violations: 76, enforcementRate: 58, color: "#FCD34D", feeLeak: "6.7M" },
      { name: "AL HASA", violations: 45, enforcementRate: 72, color: "#00B558", feeLeak: "2.1M" },
    ],
    assetYield: [
      { time: 'M1', target: 85, actual: 12 },
      { time: 'M2', target: 85, actual: 18 },
      { time: 'M3', target: 85, actual: 24 },
      { time: 'M4', target: 85, actual: 28 },
      { time: 'M5', target: 85, actual: 30 },
      { time: 'M6', target: 85, actual: 31.6 },
      { time: 'M7', target: 85, actual: 31.4 },
      { time: 'M8', target: 85, actual: 32.0 },
      { time: 'M9', target: 85, actual: 31.6 },
      { time: 'M10', target: 85, actual: 31.2 },
      { time: 'M11', target: 85, actual: 31.5 },
      { time: 'M12', target: 85, actual: 31.6 }
    ]
  };
};

const colors = {
  blue: { border: "border-[#3B82F6]/30 hover:border-[#3B82F6]", bg: "bg-[#3B82F6]/5 hover:bg-[#3B82F6]/20", text: "text-[#3B82F6]", shadow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.4),inset_0_0_15px_rgba(59,130,246,0.2)]" },
  red: { border: "border-[#FF4444]/30 hover:border-[#FF4444]", bg: "bg-[#FF4444]/5 hover:bg-[#FF4444]/20", text: "text-[#FF4444]", shadow: "hover:shadow-[0_0_20px_rgba(255,68,68,0.4),inset_0_0_15px_rgba(255,68,68,0.2)]" },
  yellow: { border: "border-[#FCD34D]/30 hover:border-[#FCD34D]", bg: "bg-[#FCD34D]/5 hover:bg-[#FCD34D]/20", text: "text-[#FCD34D]", shadow: "hover:shadow-[0_0_20px_rgba(252,211,77,0.4),inset_0_0_15px_rgba(252,211,77,0.2)]" },
  green: { border: "border-[#00B558]/30 hover:border-[#00B558]", bg: "bg-[#00B558]/5 hover:bg-[#00B558]/20", text: "text-[#00B558]", shadow: "hover:shadow-[0_0_20px_rgba(0,181,88,0.4),inset_0_0_15px_rgba(0,181,88,0.2)]" },
  white: { border: "border-gray-500/40 hover:border-white", bg: "bg-white/[0.02] hover:bg-white/[0.1]", text: "text-white", shadow: "hover:shadow-[0_0_20px_rgba(255,255,255,0.2),inset_0_0_15px_rgba(255,255,255,0.1)]" },
};

const InfoCircle = () => (
  <div className="w-[14px] h-[14px] rounded-full border border-current flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
    <span className="text-[9px] font-bold">i</span>
  </div>
);

function KpiCard({ act, metric, unit, desc, icon, colorConfig, flex = "flex-1", centered = false, className = "", onClick }: any) {
  const { border, bg, text, shadow } = colorConfig;
  return (
    <div onClick={onClick} className={`p-3 border ${border} ${bg} ${shadow} rounded-md flex flex-col group min-h-0 relative transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:z-50 ${flex} ${className} ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-current' : 'cursor-default'}`}>
       <div className={`flex justify-between items-start shrink-0 mb-1 z-20 relative`}>
         <div className={`flex items-center gap-1.5 ${text}`}>
            <div className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md">{icon}</div>
            <span className="text-[10px] xl:text-[11px] font-bold tracking-widest uppercase group-hover:text-white transition-colors">{act}</span>
         </div>
         <div className={text}><InfoCircle /></div>
       </div>
       <div className={`flex flex-col flex-1 min-h-0 z-20 relative ${centered ? 'justify-center items-center' : 'justify-end'}`}>
          <div className="flex items-baseline">
             <span className={`font-black tracking-tighter leading-none text-[32px] xl:text-[38px] uppercase ${text} group-hover:scale-105 group-hover:text-white transition-all origin-left duration-300 drop-shadow-lg`}>
               {metric}
               {unit === '%' && <span className="text-sm xl:text-base ml-0.5">%</span>}
             </span>
             {unit && unit !== '%' && <span className={`text-[10px] xl:text-[11px] font-bold tracking-widest uppercase ml-1.5 ${text}`}>{unit}</span>}
          </div>
          <span className={`text-[9px] xl:text-[10px] font-medium text-gray-500 tracking-wider mt-0.5 uppercase w-full truncate ${centered ? 'text-center mt-2' : 'text-left'} group-hover:text-gray-300 transition-colors`}>
            {desc}
          </span>
       </div>
    </div>
  )
}

function ActionAlert({ title, desc, value, valColor = "text-[#FF4444]" }: any) {
  return (
    <div className="shrink-0 flex items-center justify-between bg-[#FF4444]/5 border border-[#FF4444]/20 px-3 py-2.5 rounded-md group cursor-default relative transition-all duration-300 hover:scale-[1.02] hover:translate-x-1 hover:bg-[#FF4444]/20 hover:border-[#FF4444] hover:shadow-[0_0_20px_rgba(255,68,68,0.4),inset_0_0_10px_rgba(255,68,68,0.2)] hover:z-50">
      <div className="flex flex-col gap-0.5 z-20 relative">
        <span className="text-[10px] xl:text-[11px] text-[#FF4444] font-bold tracking-widest uppercase group-hover:text-white transition-colors drop-shadow-md">ACTION: {title}</span>
        <span className="text-[9px] xl:text-[10px] text-gray-400 group-hover:text-gray-200 transition-colors uppercase tracking-wider">{desc}</span>
      </div>
      <span className={`text-[18px] xl:text-[20px] font-black drop-shadow-[0_0_8px_rgba(255,68,68,0.8)] group-hover:scale-110 transition-transform origin-right z-20 relative ${valColor}`}>{value}</span>
    </div>
  );
}

const ChartContainer = ({ children, title, subtitle, alert, hoverBorderColor = "hover:border-[#00B558]", hoverShadow = "hover:shadow-[0_0_20px_rgba(0,181,88,0.2),inset_0_0_15px_rgba(0,181,88,0.1)]" }: any) => (
  <div className={`flex-1 min-h-0 flex flex-col group cursor-default p-2.5 rounded-md border border-transparent relative transition-all duration-300 ${hoverBorderColor} hover:bg-[#020603]/90 ${hoverShadow} hover:scale-[1.01] hover:z-50`}>
    <div className="flex justify-between items-end shrink-0 mb-2 z-20 relative px-1">
      <div className="flex flex-col">
         <span className="text-[10px] xl:text-[11px] font-bold text-gray-400 tracking-widest uppercase group-hover:text-white transition-colors drop-shadow-md">{title}</span>
         <span className="text-[8.5px] xl:text-[9.5px] text-gray-500 font-medium tracking-widest uppercase group-hover:text-gray-300 transition-colors mt-0.5">{subtitle}</span>
      </div>
      {alert && <span className="text-[10px] text-[#ff4444] font-bold tracking-wider animate-pulse drop-shadow-md">{alert}</span>}
    </div>
    <div className="flex-1 w-full min-h-0 relative z-20 pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto">
        {children}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#051105]/95 border border-[#00B558]/50 p-2.5 rounded shadow-[0_0_20px_rgba(0,181,88,0.3)] backdrop-blur-md z-50">
        <p className="text-[10px] text-gray-300 mb-1.5 border-b border-[#00B558]/30 pb-1.5 uppercase tracking-wider">{`TIME: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-[11px] font-black tracking-widest uppercase drop-shadow-md" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}${unit}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Monitoring() {
  const data = useMemo(() => generateData(), []);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  const handleMetricClick = (metric: string) => {
    setActiveTarget(metric);
    setIsTerminalOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-full w-full bg-[#020603] uppercase font-mono text-[#00B558] overflow-hidden"
    >
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ 
        backgroundImage: `
          linear-gradient(to right, rgba(0,181,88,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,181,88,0.03) 1px, transparent 1px)
        `, 
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full h-full pt-[80px] pb-4 px-4 flex flex-col min-h-0 gap-4 pointer-events-auto">
        
        {/* =========================================
            TOP ROW: INCREASED HEIGHT TO 52% (was 42%)
            This gives the top charts massive vertical space to breathe
            ========================================= */}
        <div className="flex-[0.52] flex gap-4 min-h-0">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="w-[25%] flex flex-col min-w-0 h-full"
          >
            <WidgetPanel title="SPATIAL TRUTH" icon={<Eye className="w-4 h-4 text-[#3B82F6]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                <div className="flex gap-3 shrink-0">
                  <KpiCard act="Masterplan" metric="500" unit="KM²" desc="Approved Alloc" icon={<MapPin className="w-3.5 h-3.5" />} colorConfig={colors.blue} />
                  <KpiCard onClick={() => handleMetricClick('+2.8%')} act="Deviation" metric="+2.8" unit="%" desc="Footprint Drift" icon={<AlertTriangle className="w-3.5 h-3.5" />} colorConfig={colors.red} />
                </div>
                
                <ChartContainer title="Urban Sprawl Truth Gap" subtitle="Lidar Scans vs Amanah Reports" alert="DISCREPANCY: 14.2 KM²" hoverBorderColor="hover:border-[#3B82F6]" hoverShadow="hover:shadow-[0_0_20px_rgba(59,130,246,0.2),inset_0_0_15px_rgba(59,130,246,0.1)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.twinDrift} margin={{ top: 10, right: 0, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} dx={-5} />
                      <Tooltip content={<CustomTooltip unit=" KM²" />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="step" dataKey="reported" name="Amanah" stroke="#3B82F6" strokeWidth={1.5} fill="url(#blueGrad)" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                      <Line type="step" dataKey="detected" name="Lidar TRUTH" stroke="#FF4444" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, fill: '#ff4444', stroke: '#020603', strokeWidth: 2 }} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ActionAlert title="Fin. Exposure" desc="Misaligned Capex" value="2.4B SAR" />
              </div>
            </WidgetPanel>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-[75%] flex flex-col min-w-0 h-full"
          >
            <WidgetPanel title="CAPEX UTILIZATION & ASSET LIFECYCLE" icon={<Building2 className="w-4 h-4 text-[#FCD34D]" />} className="flex-1 min-h-0">
               <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                <div className="flex gap-3 shrink-0">
                  <KpiCard act="Idle Rate" metric="68.4" unit="%" desc="Ghost Asset Detection" icon={<Building2 className="w-3.5 h-3.5"/>} colorConfig={colors.yellow} />
                  <KpiCard act="ROI Goal" metric="85" unit="%" desc="Proj. Capacity Target" icon={<Target className="w-3.5 h-3.5"/>} colorConfig={colors.white} />
                  <KpiCard act="Action" metric="DEFER" unit="PH2" desc="Halt New Funds" icon={<Layers className="w-3.5 h-3.5"/>} colorConfig={colors.red} />
                </div>

                <ChartContainer title="Asset Lifecycle Yield" subtitle="Actual Usage vs Promised Target" hoverBorderColor="hover:border-[#FCD34D]" hoverShadow="hover:shadow-[0_0_20px_rgba(252,211,77,0.2),inset_0_0_15px_rgba(252,211,77,0.1)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.assetYield} margin={{ top: 20, right: 0, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} dx={-5} />
                      <Tooltip content={<CustomTooltip unit="%" />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                      <ReferenceLine y={85} stroke="#3B82F6" strokeDasharray="4 4" label={{ position: 'top', value: 'TARGET 85%', fill: '#3B82F6', fontSize: 10, fontWeight: 'bold' }} />
                      <Bar dataKey="actual" name="Actual Use" fill="#FCD34D" fillOpacity={0.9} barSize={16} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" radius={[2, 2, 0, 0]}>
                        {data.assetYield.map((entry, index) => (
                          <Cell key={`cell-${index}`} className="hover:opacity-100 hover:fill-[#fff] transition-all cursor-default" />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </WidgetPanel>
          </motion.div>

        </div>

        {/* =========================================
            BOTTOM ROW: DECREASED HEIGHT TO 48% (was 58%)
            Compressed to give top row more chart space
            ========================================= */}
        <div className="flex-[0.48] flex gap-4 min-h-0">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="w-[25%] flex flex-col min-w-0 h-full"
          >
            <WidgetPanel title="CARRYING CAPACITY" icon={<BrainCircuit className="w-4 h-4 text-[#FCD34D]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                <div className="flex gap-3 shrink-0">
                  <KpiCard act="Target Pop" metric="15.0" unit="M" desc="Riyadh Expansion" icon={<Target className="w-3.5 h-3.5" />} colorConfig={colors.green} />
                  <KpiCard act="Velocity" metric="+14" unit="K" desc="Net Influx/Mo" icon={<Activity className="w-3.5 h-3.5" />} colorConfig={colors.yellow} />
                </div>

                <ChartContainer title="Infrastructure Strain" subtitle="Demand Load vs Max Capacity Limit" alert="INDEX: 92.4" hoverBorderColor="hover:border-[#FCD34D]" hoverShadow="hover:shadow-[0_0_20px_rgba(252,211,77,0.2),inset_0_0_15px_rgba(252,211,77,0.1)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.populationPressure} margin={{ top: 15, right: 0, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FCD34D" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="#FCD34D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={[60, 120]} dx={-5} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      
                      <Line type="monotone" dataKey="capacity" name="Max Capacity" stroke="#00B558" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={true} animationDuration={1000} />
                      <Area type="monotone" dataKey="influx" name="Demand Load" stroke="#FCD34D" strokeWidth={2} fill="url(#goldGrad)" isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" activeDot={{ r: 4, fill: '#FCD34D', stroke: '#020603', strokeWidth: 2 }} />
                      
                      <ReferenceLine x="26 Q3" stroke="#FF4444" strokeDasharray="3 3" label={{ position: 'top', value: 'COLLAPSE', fill: '#FF4444', fontSize: 8, fontWeight: 'bold' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ActionAlert title="Utility Risk" desc="Saturation Horizon" value="Q3 2026" />
              </div>
            </WidgetPanel>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="w-[50%] flex flex-col min-w-0 h-full pb-[64px]"
          >
            <WidgetPanel title="ENFORCEMENT AUDIT" icon={<Activity className="w-4 h-4 text-[#00B558]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                
                <div className="flex-1 min-h-0 flex flex-col group">
                  <div className="flex justify-between items-center border-b border-[#00B558]/20 pb-2 mb-2 shrink-0">
                     <span className="text-[11px] text-[#00B558]/80 font-bold tracking-[0.2em] uppercase">Amanah Matrix</span>
                     <div className="flex items-center gap-2 bg-[#00B558]/10 px-2 py-1 rounded border border-[#00B558]/30">
                        <div className="w-1.5 h-1.5 bg-[#00B558] rounded-full animate-pulse shadow-[0_0_8px_#00B558]" />
                        <span className="text-[9px] text-[#00B558] tracking-widest font-bold">LIVE</span>
                     </div>
                  </div>
                  
                  <div className="flex text-[9px] xl:text-[10px] text-[#00B558]/60 font-bold tracking-widest px-3 pb-2 shrink-0 border-b border-[#00B558]/10 mb-2">
                     <div className="w-[25%]">REGION</div>
                     <div className="w-[20%] text-center">VIOLATIONS</div>
                     <div className="w-[20%] text-center">FEE LEAK</div>
                     <div className="flex-1 text-right pr-2">ENFORCEMENT</div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar justify-start min-h-0 pointer-events-auto">
                    {data.amanahMatrix.map((amanah, idx) => {
                      const rowHoverClass = amanah.name === "RIYADH" ? "hover:border-[#FF4444] hover:bg-[#FF4444]/10 hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]" : 
                                            amanah.name === "JEDDAH" || amanah.name === "DAMMAM" ? "hover:border-[#FCD34D] hover:bg-[#FCD34D]/10 hover:shadow-[0_0_15px_rgba(252,211,77,0.3)]" :
                                            "hover:border-[#00B558] hover:bg-[#00B558]/10 hover:shadow-[0_0_15px_rgba(0,181,88,0.3)]";

                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center py-2 px-3 border border-transparent rounded bg-[#00B558]/[0.02] cursor-default shrink-0 relative transition-all duration-300 hover:translate-x-2 hover:scale-[1.01] hover:z-50 ${rowHoverClass}`}
                        >
                          <div className="w-[25%] flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: amanah.color, boxShadow: `0 0 6px ${amanah.color}` }} />
                            <span className="text-[10px] xl:text-[11px] font-black tracking-widest text-gray-200">{amanah.name}</span>
                          </div>
                          <div className="w-[20%] text-center text-[11px] xl:text-[12px] font-mono tracking-wider font-bold" style={{ color: amanah.color }}>
                            {amanah.violations}
                          </div>
                          <div className="w-[20%] text-center text-[11px] xl:text-[12px] font-mono tracking-wider text-[#FF4444] font-bold drop-shadow-md">
                            {amanah.feeLeak}
                          </div>
                          <div className="flex-1 flex items-center gap-3 pl-4">
                            <div className="flex-1 h-1 bg-[#0f172a] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${amanah.enforcementRate}%`, backgroundColor: amanah.color }} />
                            </div>
                            <span className="w-8 text-right text-[10px] xl:text-[11px] font-black" style={{ color: amanah.color }}>{amanah.enforcementRate}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </WidgetPanel>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="w-[25%] flex flex-col min-w-0 h-full"
          >
            <WidgetPanel title="ZONING COMPLIANCE" icon={<ShieldAlert className="w-4 h-4 text-[#FF4444]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                <KpiCard act="Critical Violations" metric="353" desc="Municipal Decay Flags" icon={<ShieldAlert className="w-3.5 h-3.5"/>} colorConfig={colors.red} flex="flex-1" centered={true} />
                <KpiCard act="Mandate" metric="95.0" unit="%" icon={<Target className="w-3.5 h-3.5"/>} colorConfig={colors.white} flex="shrink-0" />
                <KpiCard act="National YTD" metric="69.4" unit="%" icon={<TrendingUp className="w-3.5 h-3.5"/>} colorConfig={colors.yellow} flex="shrink-0" />
                <ActionAlert title="Fee Leakage" desc="Est. Municipal Loss" value="450M SAR" />
              </div>
            </WidgetPanel>
          </motion.div>

        </div>
      </div>

      <AgentTerminal 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)} 
        targetMetric={activeTarget}
      />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 181, 88, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 181, 88, 0.5);
        }
      `}</style>
    </motion.div>
  );
}