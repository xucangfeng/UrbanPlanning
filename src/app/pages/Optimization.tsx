import React, { useState, useRef, useCallback, useEffect } from "react";
import { Target, Maximize, Square, ArrowRight, Info, Layers, Car, Sprout, Building, Zap, TreePine, MapPin } from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import { motion } from "motion/react";
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';

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

// --- MOCK OPTIMIZATION DATA ---
const ZONING_ALERTS = [
  { id: 1, type: "zone", name: "KAFD Commercial", lat: 24.7600, lng: 46.6350, severity: "CRITICAL", delay: "OVERLOAD", cause: "Zoning mismatch", recommendation: "Rezoning suggested." }
];
const PARKING_ALERTS = [
  { id: 2, type: "park", name: "Boulevard Riyadh", lat: 24.76, lng: 46.60, severity: "HIGH", delay: "SATURATED", cause: "Event peak", recommendation: "Deploy shuttles." }
];
const GREENERY_ALERTS = [
  
];

const PRIORITY_ALERTS = [
  { id: 4, type: "priority", name: "Diriyah Gate Sync", lat: 24.7350, lng: 46.5750, severity: "HIGH", delay: "AT RISK", cause: "Roadwork conflict", recommendation: "Re-align schedules." }
];
const MOBILITY_ALERTS = [
  { id: 5, type: "mobility", name: "Olaya BRT Lane", lat: 24.69, lng: 46.68, severity: "CRITICAL", delay: "BOTTLENECK", cause: "Signal timing", recommendation: "Optimize phase." }
];

const OPTIMIZATION_AGENTS = {
  zoning: {
    id: "zoning", title: "ZONING MIX ADVISOR", icon: Layers, color: "#FCD34D",
    functions: [
      { 
        id: "zon_1", name: "LAND USE BALANCE INDEX", desc: "COMPREHENSIVE SCORE MEASURING DEVIATION FROM VISION 2030 LAND ALLOCATION TARGETS. AI ANALYZES ZONING DATA TO IDENTIFY IMBALANCES AND SUGGESTS REZONING RECOMMENDATIONS.",
        stats: [
          { label: 'BALANCE SCORE', value: '73', color: '#FCD34D' }, 
          { label: 'TREND', value: '+5', color: '#00B558' }, 
          { label: 'RESIDENTIAL GAP', value: '-7%', color: '#ff4444' },
          { label: 'COMMERCIAL SURPLUS', value: '+9%', color: '#ff4444' },
          { label: 'SERVICE DEFICIT', value: '-3%', color: '#FCD34D' },
          { label: 'GREEN SPACE GAP', value: '+1%', color: '#00B558' }
        ],
        balanceData: {
          score: 73,
          trend: '+5',
          targets: { residential: 35, commercial: 25, service: 20, green: 20 },
          actual: { residential: 28, commercial: 34, service: 17, green: 21 },
          aiRecommendation: "Convert Al Olaya commercial zones to mixed-use residential. Projected score improvement: +12 points."
        }
      }
    ]
  },
  parking: {
    id: "parking", title: "ACCESS & PARKING", icon: Car, color: "#FCD34D",
    functions: [
      { 
        id: "prk_1", name: "URBAN ACCESSIBILITY INDEX", desc: "COMPREHENSIVE INDEX MEASURING URBAN TRANSPORT EFFICIENCY AND ACCESSIBILITY. AI ANALYZES PARKING TURNOVER, PUBLIC TRANSIT COVERAGE, LAST-MILE CONNECTIVITY, AND EV INFRASTRUCTURE TO SUPPORT VISION 2030 TRANSPORTATION GOALS.",
        stats: [
          { label: 'EFFICIENCY SCORE', value: '72', color: '#FCD34D' },
          { label: 'TREND', value: '+3', color: '#00B558' },
          { label: 'PARKING TURNOVER', value: '65pt', color: '#ff4444' },
          { label: 'TRANSIT COVERAGE', value: '85pt', color: '#00B558' },
          { label: 'EV INFRASTRUCTURE', value: '64pt', color: '#ff4444' }
        ],
        accessibilityData: {
          score: 72,
          trend: '+3',
          status: 'NEEDS IMPROVEMENT',
          dimensions: {
            parkingTurnover: { current: 65, target: 100, gap: 35, weight: 0.30, label: 'PARKING TURNOVER' },
            publicTransit: { current: 85, target: 100, gap: 15, weight: 0.25, label: 'PUBLIC TRANSIT' },
            lastMile: { current: 73, target: 100, gap: 27, weight: 0.25, label: 'LAST-MILE CONNECT' },
            evInfrastructure: { current: 64, target: 100, gap: 36, weight: 0.20, label: 'EV INFRASTRUCTURE' }
          }
        }
      },
      { 
        id: "prk_2", name: "EV CHARGING DENSITY", desc: "PREDICTS EV ADOPTION RATES TO SUGGEST OPTIMAL LOCATIONS FOR CHARGING HUBS.",
        stats: [{ label: 'DEFICITS', value: '12', color: '#ff4444' }, { label: 'PLANNED', value: '45', color: '#00B558' }]
      },
      { 
        id: "prk_3", name: "LAST-MILE CONNECTIVITY", desc: "CALCULATES THE EFFICIENCY OF MICRO-MOBILITY LINKS TO MAJOR TRANSIT STATIONS.",
        stats: [{ label: 'GAPS', value: '6', color: '#FCD34D' }, { label: 'EFFICIENT', value: '22', color: '#00B558' }]
      }
    ]
  },
  priority: {
    id: "priority", title: "PRIORITY CLASSIFIER", icon: Building, color: "#00B558",
    functions: [
      { 
        id: "pri_1", name: "PROJECT PRIORITY INDEX", desc: "AI-POWERED PRIORITY RANKING SYSTEM FOR URBAN DEVELOPMENT PROJECTS. EVALUATES BOTTLENECK IMPACT, TIME URGENCY, ROI, AND SYNERGY TO OPTIMIZE RESOURCE ALLOCATION AND ENSURE VISION 2030 TARGET ACHIEVEMENT.",
        stats: [
          { label: 'P0 URGENT', value: '1', color: '#ff4444' },
          { label: 'P1 HIGH', value: '2', color: '#FCD34D' },
          { label: 'BACKLOG', value: '3', color: '#ff4444' },
          { label: 'AUTO-APPROVED', value: '75%', color: '#FCD34D' }
        ],
        priorityData: {
          projects: [
            { id: 'NM', name: 'New Murabba', score: 85, priority: 'P0', status: 'DELAYED', bottleneck: 92, urgency: 60, roi: 100, synergy: 87, delay: '180 days', action: '+25% WORKFORCE URGENT' },
            { id: 'RME-PH3', name: 'Riyadh Metro PH3', score: 78, priority: 'P1', status: 'DELAYED', bottleneck: 85, urgency: 55, roi: 90, synergy: 75, delay: '120 days', action: 'ENGINEERING REVIEW' },
            { id: 'NEOM-TL', name: 'NEOM - The Line', score: 72, priority: 'P1', status: 'AHEAD', bottleneck: 45, urgency: 70, roi: 95, synergy: 82, delay: 'On Track', action: 'PROCEED TO PHASE 2' },
            { id: 'DG-P2', name: 'Diriyah Gate PH2', score: 68, priority: 'P2', status: 'AHEAD', bottleneck: 40, urgency: 50, roi: 88, synergy: 92, delay: 'On Track', action: 'ACCELERATE TOURISM' },
            { id: 'RSG-P2', name: 'Red Sea Global PH2', score: 65, priority: 'P2', status: 'ON TRACK', bottleneck: 35, urgency: 45, roi: 85, synergy: 90, delay: 'On Track', action: 'SUSTAIN MOMENTUM' },
            { id: 'QD', name: 'Qiddiya Entertainment', score: 62, priority: 'P2', status: 'ON TRACK', bottleneck: 30, urgency: 40, roi: 90, synergy: 85, delay: 'On Track', action: 'ENTERTAINMENT FOCUS' }
          ],
          totalBacklog: 3,
          autoApprovalRate: 75,
          avgApprovalTime: 45
        }
      },
      { 
        id: "pri_2", name: "ZONING APPROVAL SPEED", desc: "AUTOMATES ROUTINE PERMIT APPROVALS WHILE FLAGGING COMPLEX CASES FOR HUMAN REVIEW.",
        stats: [{ label: 'FLAGGED', value: '2', color: '#ff4444' }, { label: 'AUTO-APPROVED', value: '11k', color: '#00B558' }]
      },
      { 
        id: "pri_3", name: "INFRASTRUCTURE URGENCY", desc: "RANKS PROJECTS BY IMPACT ON 2030 TARGETS TO OPTIMIZE BUDGET ALLOCATION.",
        stats: [{ label: 'CRITICAL', value: '4', color: '#FCD34D' }, { label: 'ALIGNED', value: '18', color: '#00B558' }]
      }
    ]
  },
  greenery: {
    id: "greenery", title: "PARKS SELECTOR", icon: Sprout, color: "#00B558",
    functions: [
      { 
        id: "grn_1", name: "GREEN SPACE COVERAGE INDEX", desc: "COMPREHENSIVE INDEX MEASURING GREEN SPACE SERVICE CAPACITY AND ACCESSIBILITY. AI IDENTIFIES OPTIMAL PARK LOCATIONS TO SUPPORT SAUDI GREEN INITIATIVE AND VISION 2030 SUSTAINABILITY TARGETS.",
        stats: [
          { label: 'COVERAGE SCORE', value: '44', color: '#ff4444' },
          { label: 'TREND', value: '+5', color: '#00B558' },
          { label: 'PER CAPITA', value: '11.3pt', color: '#ff4444' },
          { label: 'ACCESSIBILITY', value: '57.8pt', color: '#FCD34D' },
          { label: 'HEAT RELIEF', value: '70pt', color: '#00B558' }
        ],
        greenCoverageData: {
          score: 44,
          trend: '+5',
          status: 'CRITICAL SHORTAGE',
          dimensions: {
            perCapita: { current: 11.3, target: 100, gap: 88.7, weight: 0.40, label: 'PER CAPITA AREA', actual: '1.7 m²' },
            accessibility: { current: 57.8, target: 100, gap: 42.2, weight: 0.30, label: 'ACCESSIBILITY', actual: '52% coverage' },
            heatRelief: { current: 70, target: 100, gap: 30, weight: 0.20, label: 'HEAT RELIEF', actual: '2.1°C cooling' },
            irrigation: { current: 81.3, target: 100, gap: 18.7, weight: 0.10, label: 'IRRIGATION', actual: '65% smart' }
          },
          newParks: 10,
          totalArea: '60,000 m²',
          servicePopulation: '60,000 people'
        }
      },
      { 
        id: "grn_2", name: "URBAN HEAT ISLAND REDUCT", desc: "PREDICTS TEMPERATURE DROPS RESULTING FROM PROPOSED CANOPY COVER INTERVENTIONS.",
        stats: [{ label: 'SEVERE SPOTS', value: '8', color: '#ff4444' }, { label: 'COOLED', value: '52', color: '#00B558' }]
      },
      { 
        id: "grn_3", name: "IRRIGATION EFFICIENCY", desc: "USES SOIL SENSORS AND WEATHER AI TO MINIMIZE WATER USE IN PUBLIC PARKS.",
        stats: [{ label: 'STRESSED', value: '5', color: '#ff4444' }, { label: 'OPTIMAL', value: '84%', color: '#FCD34D' }]
      }
    ]
  },
  mobility: {
    id: "mobility", title: "INTERVENTION GUIDE", icon: Zap, color: "#00B558",
    functions: [
      { 
        id: "mob_1", name: "URBAN DEVELOPMENT POTENTIAL", desc: "COMPREHENSIVE INDEX MEASURING URBAN UPGRADE POTENTIAL BASED ON LAND USE EFFICIENCY, ACCESSIBILITY, SERVICE COVERAGE, AND INFRASTRUCTURE. AI IDENTIFIES PRIORITY INTERVENTION AREAS TO SUPPORT VISION 2030 POPULATION GROWTH TARGETS.",
        stats: [
          { label: 'POTENTIAL SCORE', value: '84', color: '#00B558' },
          { label: 'STATUS', value: 'PRIORITY', color: '#FCD34D' },
          { label: 'ACCESSIBILITY GAP', value: '27pt', color: '#ff4444' },
          { label: 'SERVICE GAP', value: '25pt', color: '#ff4444' },
          { label: 'EFFICIENCY GAP', value: '15pt', color: '#FCD34D' }
        ],
        potentialData: {
          score: 84,
          status: 'PRIORITY UPGRADE',
          dimensions: {
            accessibility: { current: 73, target: 100, gap: 27, weight: 0.25 },
            service: { current: 75, target: 100, gap: 25, weight: 0.25 },
            efficiency: { current: 85, target: 100, gap: 15, weight: 0.30 },
            infrastructure: { current: 98, target: 100, gap: 2, weight: 0.20 }
          },
          demandIntensity: 1.56,
          populationDensity: 125,
          growthTarget: '150K → 250K'
        }
      }
    ]
  }
};

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
      <motion.div className="absolute rounded-full border border-solid" style={{ borderColor: color }} initial={{ width: 10, height: 10, opacity: 1 }} animate={{ width: 50, height: 50, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
      <motion.div className="absolute rounded-full border border-solid" style={{ borderColor: color }} initial={{ width: 10, height: 10, opacity: 1 }} animate={{ width: 50, height: 50, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }} />
      <div className="w-2.5 h-2.5 rounded-full relative z-10" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}></div>
      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#051105]/85 border backdrop-blur-md px-2.5 py-1.5 rounded-sm whitespace-nowrap opacity-100 pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col items-center transition-all duration-300 ${isHovered ? 'border-opacity-100 shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-110 -translate-y-2' : 'border-opacity-50 scale-100'}`} style={{ borderColor: isHovered ? color : `${color}50` }}>
         <div className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isHovered ? 'text-white' : 'text-gray-300'}`}>{alert.name}</div>
         <div className="text-[11px] font-black uppercase tracking-widest mt-0.5" style={{ color }}>{alert.delay} DELAY</div>
      </div>
    </div>
  );
};

function FunctionCard({ item, color, isActive, onClick, layout = "full" }: { item: any, color: string, isActive: boolean, onClick: () => void, layout?: "full"|"half" }) {
  const [isHoveringInfo, setIsHoveringInfo] = useState(false);
  const rgbColor = color === '#FCD34D' ? '252,211,77' : color === '#3b82f6' ? '59,130,246' : color === '#ff4444' ? '255,68,68' : '0,181,88';
  
  // ZONING MIX ADVISOR - LAND USE BALANCE INDEX (zon_1) - 简洁专业
  if (item.id === 'zon_1' && item.balanceData) {
    const { score, trend, targets, actual } = item.balanceData;
    
    // 计算各用途偏差
    const categories = [
      { name: 'RESIDENTIAL', target: targets.residential, actual: actual.residential, gap: actual.residential - targets.residential },
      { name: 'COMMERCIAL', target: targets.commercial, actual: actual.commercial, gap: actual.commercial - targets.commercial },
      { name: 'SERVICE', target: targets.service, actual: actual.service, gap: actual.service - targets.service },
      { name: 'GREEN', target: targets.green, actual: actual.green, gap: actual.green - targets.green },
    ];
    
    // 评分颜色
    const scoreColor = score >= 85 ? '#00B558' : score >= 70 ? '#FCD34D' : '#ff4444';

    return (
      <div 
        onClick={onClick}
        className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full p-4 ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
        style={{ borderColor: isActive ? color : `${color}40` }}
      >
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
         
         {/* Header */}
         <div className="flex justify-between items-start w-full gap-2 relative z-10 mb-2">
           <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] text-[13px]`} style={{ color }}>{item.name}</h4>
           <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-4 h-4" style={{ color }} /></div>
         </div>
         
         {/* Info Overlay */}
         <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 p-4 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className={`font-medium tracking-wider text-gray-300 uppercase text-[11px] leading-[1.5]`}>{item.desc}</p>
         </div>
         
         <div className={`relative w-full flex-1 flex flex-col z-10 min-h-0 transition-opacity duration-300 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
            {/* Core Score */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-[52px] font-black leading-none" style={{ color: scoreColor, textShadow: `0 0 30px ${scoreColor}70` }}>{score}</span>
                  <span className="text-[16px] text-gray-500 font-bold">/100</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00B558]/15 border border-[#00B558]/40">
                    <span className="text-[#00B558] text-[11px] font-black">{trend}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">vs 2025</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">STATUS</div>
                <div className="text-[11px] font-black uppercase tracking-wide" style={{ color: scoreColor }}>
                  {score >= 85 ? 'HEALTHY' : score >= 70 ? 'NEEDS ATTENTION' : 'CRITICAL'}
                </div>
              </div>
            </div>
            
            {/* All Categories with Target vs Actual */}
            <div className="flex-1 flex flex-col justify-center gap-2.5">
              {categories.map((cat, idx) => {
                const barWidth = (cat.actual / 50) * 100; // max 50%
                const targetWidth = (cat.target / 50) * 100;
                const gapColor = Math.abs(cat.gap) >= 5 ? '#ff4444' : Math.abs(cat.gap) >= 3 ? '#FCD34D' : '#00B558';
                
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{cat.name}</span>
                      <span className={`text-[11px] font-black ${Math.abs(cat.gap) >= 5 ? 'text-[#ff4444]' : Math.abs(cat.gap) >= 3 ? 'text-[#FCD34D]' : 'text-[#00B558]'}`}>
                        {cat.gap > 0 ? '+' : ''}{cat.gap}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-[#0f172a]/50 rounded overflow-hidden">
                      {/* Target marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-10" style={{ left: `${targetWidth}%` }} />
                      {/* Actual bar */}
                      <div className="h-full rounded transition-all" style={{ 
                        width: `${barWidth}%`, 
                        backgroundColor: gapColor,
                        opacity: 0.8
                      }} />
                      {/* Labels */}
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <span className="text-[9px] text-white font-bold">{cat.actual}%</span>
                        <span className="text-[9px] text-gray-500 font-bold">{cat.target}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    );
  }

  const primaryStat = item.stats[0];
  // INTERVENTION GUIDE - URBAN DEVELOPMENT POTENTIAL (mob_1) - 干预优先级决策
  if (item.id === 'mob_1' && item.potentialData) {
    const { score, status, dimensions, demandIntensity, growthTarget } = item.potentialData;
    
    // 评分颜色（越高越需要干预）
    const scoreColor = score >= 85 ? '#ff4444' : score >= 70 ? '#FCD34D' : '#00B558';
    
    // 干预优先级列表
    const interventions = [
      { priority: 'P0', action: 'TRAFFIC SYSTEM UPGRADE', investment: '500M SAR', impact: '-8min commute', roi: 'HIGH' },
      { priority: 'P1', action: 'SERVICE FACILITIES', investment: '300M SAR', impact: '+12% coverage', roi: 'MEDIUM' },
      { priority: 'P2', action: 'LAND USE OPTIMIZATION', investment: '100M SAR', impact: '+15% efficiency', roi: 'MEDIUM' }
    ];

    return (
      <div 
        onClick={onClick}
        className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full p-4 ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
        style={{ borderColor: isActive ? color : `${color}40` }}
      >
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
         
         {/* Header */}
         <div className="flex justify-between items-start w-full gap-2 relative z-10 mb-3">
           <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] text-[13px]`} style={{ color }}>{item.name}</h4>
           <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-4 h-4" style={{ color }} /></div>
         </div>
         
         {/* Info Overlay */}
         <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 p-4 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className={`font-medium tracking-wider text-gray-300 uppercase text-[11px] leading-[1.5]`}>{item.desc}</p>
         </div>
         
         <div className={`relative w-full flex-1 flex flex-col z-10 min-h-0 transition-opacity duration-300 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
            {/* Top Summary */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">POTENTIAL INDEX</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-black leading-none" style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}70` }}>{score}</span>
                    <span className="text-[11px] text-gray-500 font-bold">/100</span>
                  </div>
                </div>
                <div className="flex flex-col items-start px-2 py-1 rounded bg-[#FCD34D]/10 border border-[#FCD34D]/30">
                  <span className="text-[8px] text-gray-500 font-bold uppercase">DEMAND</span>
                  <span className="text-[11px] text-[#FCD34D] font-black">{demandIntensity}x</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">POPULATION GROWTH</div>
                <div className="text-[13px] font-black text-[#00B558]">{growthTarget}</div>
              </div>
            </div>
            
            {/* Intervention Priority List */}
            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-auto">
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">INTERVENTION PRIORITIES</div>
              
              {interventions.map((intv, idx) => {
                const priorityColor = intv.priority === 'P0' ? '#ff4444' : intv.priority === 'P1' ? '#FCD34D' : '#00B558';
                const roiColor = intv.roi === 'HIGH' ? '#00B558' : '#FCD34D';
                
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#0f172a]/30 border border-slate-700/30 hover:bg-[#0f172a]/50 transition-colors">
                    {/* Priority Badge */}
                    <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center font-black text-[11px]" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor, border: `1px solid ${priorityColor}50` }}>
                      {intv.priority}
                    </div>
                    
                    {/* Action & Impact */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white font-bold uppercase tracking-wide truncate">{intv.action}</div>
                      <div className="text-[9px] text-[#00B558] font-bold">{intv.impact}</div>
                    </div>
                    
                    {/* Investment & ROI */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="text-[10px] text-gray-300 font-bold">{intv.investment}</div>
                      <div className="text-[8px] font-black uppercase" style={{ color: roiColor }}>ROI: {intv.roi}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bottom Stats */}
            <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 font-bold uppercase">TOTAL INVESTMENT</span>
                <span className="text-[13px] text-white font-black">900M SAR</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 font-bold uppercase">TIMELINE</span>
                <span className="text-[13px] text-white font-black">2026 Q4 - 2028</span>
              </div>
            </div>
         </div>
      </div>
    );
  }

  // ACCESS & PARKING - URBAN ACCESSIBILITY INDEX (prk_1) - 雷达图展示
  if (item.id === 'prk_1' && item.accessibilityData) {
    const { score, trend, status, dimensions } = item.accessibilityData;
    
    // 评分颜色
    const scoreColor = score >= 85 ? '#00B558' : score >= 70 ? '#FCD34D' : '#ff4444';
    
    // 雷达图数据
    const radarData = Object.entries(dimensions).map(([key, val]: [string, any]) => ({
      dimension: val.label,
      value: val.current,
      fullMark: 100
    }));

    return (
      <div 
        onClick={onClick}
        className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full p-4 ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
        style={{ borderColor: isActive ? color : `${color}40` }}
      >
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
         
         {/* Header */}
         <div className="flex justify-between items-start w-full gap-2 relative z-10 mb-2">
           <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] text-[13px]`} style={{ color }}>{item.name}</h4>
           <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-4 h-4" style={{ color }} /></div>
         </div>
         
         {/* Info Overlay */}
         <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 p-4 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className={`font-medium tracking-wider text-gray-300 uppercase text-[11px] leading-[1.5]`}>{item.desc}</p>
         </div>
         
         <div className={`relative w-full flex-1 flex flex-col z-10 min-h-0 transition-opacity duration-300 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
            {/* Core Score */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-[48px] font-black leading-none" style={{ color: scoreColor, textShadow: `0 0 30px ${scoreColor}70` }}>{score}</span>
                  <span className="text-[14px] text-gray-500 font-bold">/100</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00B558]/15 border border-[#00B558]/40">
                    <span className="text-[#00B558] text-[10px] font-black">{trend}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">vs 2025</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">STATUS</div>
                <div className="text-[10px] font-black uppercase tracking-wide" style={{ color: scoreColor }}>
                  {score >= 85 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'NEEDS IMPROVEMENT' : 'CRITICAL'}
                </div>
              </div>
            </div>
            
            {/* Radar Chart */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />
                  <Radar name="Current" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Dimension Bars */}
            <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2">
              {Object.entries(dimensions).slice(0, 4).map(([key, dim]: [string, any]) => {
                const dimColor = dim.current >= 85 ? '#00B558' : dim.current >= 70 ? '#FCD34D' : '#ff4444';
                return (
                  <div key={key} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{dim.label}</span>
                      <span className="text-[10px] font-black" style={{ color: dimColor }}>{dim.current}pt</span>
                    </div>
                    <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${dim.current}%`, backgroundColor: dimColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    );
  }

  // PARKS SELECTOR - GREEN SPACE COVERAGE INDEX (grn_1) - 维度展示
  if (item.id === 'grn_1' && item.greenCoverageData) {
    const { score, trend, status, dimensions, newParks, totalArea, servicePopulation } = item.greenCoverageData;
    
    // 评分颜色（绿地严重不足）
    const scoreColor = score >= 85 ? '#00B558' : score >= 70 ? '#FCD34D' : score >= 50 ? '#FCD34D' : '#ff4444';

    return (
      <div 
        onClick={onClick}
        className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full p-4 ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
        style={{ borderColor: isActive ? color : `${color}40` }}
      >
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
         
         {/* Header */}
         <div className="flex justify-between items-start w-full gap-2 relative z-10 mb-2 flex-shrink-0">
           <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] text-[13px]`} style={{ color }}>{item.name}</h4>
           <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-4 h-4" style={{ color }} /></div>
         </div>
         
         {/* Info Overlay */}
         <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 p-4 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className={`font-medium tracking-wider text-gray-300 uppercase text-[11px] leading-[1.5]`}>{item.desc}</p>
         </div>
         
         <div className={`relative w-full flex-1 flex flex-col z-10 min-h-0 transition-opacity duration-300 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
            {/* Core Score */}
            <div className="flex items-start justify-between mb-2 flex-shrink-0">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[36px] font-black leading-none" style={{ color: scoreColor, textShadow: `0 0 30px ${scoreColor}70` }}>{score}</span>
                  <span className="text-[12px] text-gray-500 font-bold">/100</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00B558]/15 border border-[#00B558]/40">
                    <span className="text-[#00B558] text-[9px] font-black">{trend}</span>
                  </div>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">vs 2025</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">STATUS</div>
                <div className="text-[9px] font-black uppercase tracking-wide" style={{ color: scoreColor }}>
                  {score >= 85 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'INSUFFICIENT' : 'CRITICAL'}
                </div>
              </div>
            </div>
            
            {/* Dimension Bars */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-auto">
              {Object.entries(dimensions).map(([key, dim]: [string, any]) => {
                const dimColor = dim.current >= 85 ? '#00B558' : dim.current >= 70 ? '#FCD34D' : '#ff4444';
                return (
                  <div key={key} className="flex flex-col gap-0.5 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">{dim.label}</span>
                      <span className="text-[9px] font-black" style={{ color: dimColor }}>{dim.actual}</span>
                    </div>
                    <div className="relative h-2.5 bg-[#0f172a]/50 rounded overflow-hidden flex-shrink-0">
                      <div className="h-full rounded transition-all" style={{ 
                        width: `${dim.current}%`, 
                        backgroundColor: dimColor,
                        opacity: 0.8
                      }} />
                      <div className="absolute inset-0 flex items-center justify-end px-1.5">
                        <span className="text-[8px] text-white font-bold">{dim.current}pt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bottom Info */}
            <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-3 gap-1.5 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[7px] text-gray-500 font-bold uppercase">NEW PARKS</span>
                <span className="text-[11px] text-white font-black">{newParks} sites</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] text-gray-500 font-bold uppercase">TOTAL AREA</span>
                <span className="text-[11px] text-white font-black">{totalArea}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] text-gray-500 font-bold uppercase">SERVICE</span>
                <span className="text-[11px] text-white font-black">{servicePopulation}</span>
              </div>
            </div>
         </div>
      </div>
    );
  }

  // PRIORITY CLASSIFIER - PROJECT PRIORITY INDEX (pri_1) - 项目优先级列表
  if (item.id === 'pri_1' && item.priorityData) {
    const { projects, totalBacklog, autoApprovalRate, avgApprovalTime } = item.priorityData;
    
    return (
      <div 
        onClick={onClick}
        className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full p-4 ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
        style={{ borderColor: isActive ? color : `${color}40` }}
      >
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
         
         {/* Header */}
         <div className="flex justify-between items-start w-full gap-2 relative z-10 mb-2">
           <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] text-[13px]`} style={{ color }}>{item.name}</h4>
           <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-4 h-4" style={{ color }} /></div>
         </div>
         
         {/* Info Overlay */}
         <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 p-4 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className={`font-medium tracking-wider text-gray-300 uppercase text-[11px] leading-[1.5]`}>{item.desc}</p>
         </div>
         
         <div className={`relative w-full flex-1 flex flex-col z-10 min-h-0 transition-opacity duration-300 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
            {/* Top Summary */}
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">BACKLOG</span>
                  <span className="text-[20px] font-black leading-none text-[#ff4444]">{totalBacklog}</span>
                </div>
                <div className="flex flex-col items-start px-1.5 py-0.5 rounded bg-[#00B558]/10 border border-[#00B558]/30">
                  <span className="text-[6px] text-gray-500 font-bold uppercase">AUTO-APPROVED</span>
                  <span className="text-[9px] text-[#00B558] font-black">{autoApprovalRate}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">AVG TIME</div>
                <div className="text-[11px] font-black text-white">{avgApprovalTime} days</div>
              </div>
            </div>
            
            {/* Project Priority List */}
            <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-auto">
              <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">PROJECT RANKING</div>
              
              {projects.map((project, idx) => {
                const priorityColor = project.priority === 'P0' ? '#ff4444' : project.priority === 'P1' ? '#FCD34D' : '#00B558';
                
                return (
                  <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-[#0f172a]/30 border border-slate-700/30 hover:bg-[#0f172a]/50 transition-colors">
                    {/* Priority Badge */}
                    <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center font-black text-[9px]" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor, border: `1px solid ${priorityColor}50` }}>
                      {project.priority}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-white font-bold uppercase tracking-wide truncate">{project.id}</span>
                        <span className={`text-[6px] px-1 py-0.5 rounded font-bold ${project.status === 'DELAYED' ? 'bg-[#ff4444]/20 text-[#ff4444]' : 'bg-[#00B558]/20 text-[#00B558]'}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="text-[7px] text-gray-400 font-bold uppercase">{project.delay}</div>
                    </div>
                    
                    {/* Score */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[12px] font-black" style={{ color: priorityColor }}>{project.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bottom Stats */}
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 grid grid-cols-2 gap-1.5">
              <div className="flex flex-col">
                <span className="text-[6px] text-gray-500 font-bold uppercase">P0 URGENT ACTION</span>
                <span className="text-[8px] text-[#ff4444] font-black truncate">New Murabba: +25% workforce</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[6px] text-gray-500 font-bold uppercase">P1 FOCUS</span>
                <span className="text-[8px] text-[#FCD34D] font-black truncate">Metro PH3: Engineering review</span>
              </div>
            </div>
         </div>
      </div>
    );
  }

  const isListLayout = item.id === 'grn_1';

  const renderMiniChart = () => {
    const chartClass = isListLayout 
      ? `absolute inset-0 w-full h-full transition-opacity duration-300 ${isActive ? 'opacity-100 z-20' : 'opacity-70'}`
      : `absolute right-2 bottom-0 w-[180px] h-[60px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`;

    if (!isListLayout && layout !== "full") return null;

    const data = Array.from({length: 6}).map((_, i) => ({ year: `202${i+1}`, val: 30 + Math.random()*20, pen: Math.random()*5 }));
    
    let valLabel = 'Metric Index';
    let valUnit = '';
    
    if (item.id.startsWith('zon')) { valLabel = 'Walkability Score'; valUnit = '/100'; }
    if (item.id.startsWith('prk')) { valLabel = 'EV Nodes Active'; valUnit = ''; }
    if (item.id.startsWith('pri')) { valLabel = 'Approvals / Month'; valUnit = 'k'; }
    if (item.id.startsWith('grn')) { valLabel = 'Canopy Cover'; valUnit = '%'; }
    if (item.id.startsWith('mob')) { valLabel = 'Slum Replaced'; valUnit = 'Ha'; }

    return (
      <div className={chartClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="year" hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
              labelFormatter={(label) => `YEAR: ${label}`}
              formatter={(value: number) => [`${value.toFixed(1)}${valUnit}`, valLabel]}
            />
            <Area type="monotone" dataKey="val" stroke={color} strokeWidth={1.5} fillOpacity={1} fill={`url(#grad-${item.id})`} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full ${layout === 'full' ? 'p-3' : 'p-2.5'} ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
      style={{ borderColor: isActive ? color : `${color}40` }}
    >
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="flex justify-between items-start w-full gap-2 relative z-10">
         <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] ${layout === 'full' ? 'text-[14px] w-[80%]' : 'text-[11px] line-clamp-2'}`} style={{ color }}>{item.name}</h4>
         <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-3.5 h-3.5" style={{ color }} /></div>
       </div>
       <div className={`relative w-full flex-1 flex flex-col mt-1 z-10 min-h-0 ${(layout === 'half' && isListLayout) ? 'justify-center' : ''}`}>
          <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <p className={`font-medium tracking-wider text-gray-300 uppercase ${layout === 'full' ? 'text-[11px] leading-[1.5]' : 'text-[9px] leading-[1.3] line-clamp-4'}`}>{item.desc}</p>
          </div>
          <div className={`w-full flex transition-opacity duration-300 relative ${isHoveringInfo ? 'opacity-0' : 'opacity-100'} ${isListLayout ? 'flex-1 flex-col justify-start items-start min-h-0' : 'items-end justify-between flex-1'}`}>
             {isListLayout ? (
               <div className="flex flex-col w-full h-full justify-center">
                 <div className="flex justify-between items-end gap-2 w-full mb-1">
                   <span className="font-black leading-none tracking-tighter" style={{ color: primaryStat.color, fontSize: layout === 'full' ? '38px' : '30px', textShadow: `0 0 20px ${primaryStat.color}60` }}>{primaryStat.value}</span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[9px] mb-1 text-right flex-1">{primaryStat.label}</span>
                 </div>
                 <div className="flex flex-col gap-[2px]">
                   {item.stats.slice(1).map((stat: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center w-full border-t border-slate-800/50 pt-[2px]">
                       <span className="text-slate-500 font-bold tracking-wider text-[8px] uppercase">{stat.label}</span>
                       <span className="font-black tracking-widest text-[10px]" style={{ color: stat.color || color }}>{stat.value}</span>
                     </div>
                   ))}
                 </div>
                 {item.id !== 'zon_2' && item.id !== 'zon_3' && item.id !== 'grn_1' && (
                   <div className="flex-1 w-full min-h-[30px] mt-1 relative">{renderMiniChart()}</div>
                 )}
               </div>
             ) : (
               <>
                 <div className="flex items-end gap-2 relative z-10">
                   <span className="font-black leading-none tracking-tighter" style={{ color: primaryStat.color, fontSize: layout === 'full' ? '38px' : '28px', textShadow: `0 0 20px ${primaryStat.color}60` }}>{primaryStat.value}</span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[9px] mb-1.5 max-w-[50%]">{primaryStat.label}</span>
                 </div>
                 {renderMiniChart()}
               </>
             )}
          </div>
       </div>
    </div>
  );
}

// Generate GeoJSON for highlighting (Line for roads/traffic, Polygon for areas)
const getHighlightGeoJSON = (lat: number, lng: number, type: string) => {
  const isRoad = ['traffic', 'commute', 'emergency'].includes(type);
  
  if (isRoad) {
    const offset = 0.015;
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
    const size = 0.015;
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

const RIYADH_CENTER: [number, number] = [46.67, 24.71];

function createGeoJSONCircle(center: [number, number], radiusInKm: number, points: number = 64) {
  const coords = { latitude: center[1], longitude: center[0] };
  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push([...ret[0]]); // Use spread to avoid reference duplication
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ret] },
      properties: {}
    }]
  };
}

const greeneryBoundary3km = createGeoJSONCircle(RIYADH_CENTER, 3);
const greeneryBoundary8km = createGeoJSONCircle(RIYADH_CENTER, 8);
const greeneryBoundary15km = createGeoJSONCircle(RIYADH_CENTER, 15);

const PARK_SUGGESTIONS = [
  { id: 'ps_1', lat: 24.7145, lng: 46.673, name: 'OLAYA SECTOR 4', reason: 'High heat island effect, dense residential. Need immediate cooling.' },
  { id: 'ps_2', lat: 24.725, lng: 46.661, name: 'KING FAHD DIST. N', reason: 'Deficit in canopy coverage. Prioritized for community access.' },
  { id: 'ps_3', lat: 24.701, lng: 46.682, name: 'SULAIMANIYAH SOUTH', reason: 'Unused municipal plot suitable for 8,000 m² ecological park.' },
  { id: 'ps_4', lat: 24.743, lng: 46.655, name: 'AL NAKHEEL EDGE', reason: 'High pedestrian flow, lack of shade. Micro-climate intervention.' },
  { id: 'ps_5', lat: 24.734, lng: 46.685, name: 'MOHAMMADIYAH CORE', reason: 'Redevelopment zone, integrates with upcoming transit node.' },
  { id: 'ps_6', lat: 24.719, lng: 46.706, name: 'AL OLAYA EAST', reason: 'Commercial district requiring green buffers for micro-cooling.' },
  { id: 'ps_7', lat: 24.683, lng: 46.652, name: 'AL MAATHER NODE', reason: 'Aligns with heritage protection and irrigation optimization.' },
  { id: 'ps_8', lat: 24.689, lng: 46.697, name: 'AL MUTAMARAT', reason: 'Mitigating severe urban heat island reading from recent scans.' },
  { id: 'ps_9', lat: 24.782, lng: 46.634, name: 'AL WOROUD GREEN', reason: 'Connects existing green corridors to improve biodiversity.' },
  { id: 'ps_10', lat: 24.641, lng: 46.724, name: 'UMM AL HAMAM', reason: 'Targeted for rapid deployment native flora planting.' },
];

export default function Optimization() {
  const [activeMetric, setActiveMetric] = useState("grn_1");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [hoveredAlertId, setHoveredAlertId] = useState<number | null>(null);
  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      if (activeMetric === "grn_1") {
         mapRef.current.flyTo({ center: [46.67, 24.71], zoom: 9.8, pitch: 0, bearing: 0, duration: 2500, essential: true });
      } else {
         mapRef.current.flyTo({ center: [46.67, 24.71], zoom: 8.5, pitch: 0, bearing: 0, duration: 2500, essential: true });
      }
    }
  }, [activeMetric]);

  useEffect(() => {
    if (mapRef.current) {
      if (activeMetric === "grn_1") {
         mapRef.current.flyTo({ center: [46.67, 24.71], zoom: 9.8, pitch: 0, bearing: 0, duration: 1500, essential: true });
      } else {
         mapRef.current.flyTo({ center: [46.67, 24.71], zoom: 8.5, pitch: 0, bearing: 0, duration: 1500, essential: true });
      }
    }
  }, [activeMetric]);

  const handleMetricClick = (id: string) => { setActiveMetric(id); };

  let currentAlerts: any[] = [];
  if (activeMetric.startsWith('zon')) currentAlerts = ZONING_ALERTS;
  else if (activeMetric.startsWith('prk')) currentAlerts = PARKING_ALERTS;
  else if (activeMetric.startsWith('grn')) currentAlerts = GREENERY_ALERTS;
  else if (activeMetric.startsWith('pri')) currentAlerts = PRIORITY_ALERTS;
  else if (activeMetric.startsWith('mob')) currentAlerts = MOBILITY_ALERTS;

  const activeAgent = Object.values(OPTIMIZATION_AGENTS).find(agent => agent.functions.some(f => f.id === activeMetric)) || OPTIMIZATION_AGENTS.priority;
  const activeColor = activeAgent.color;
  const activeRgb = activeColor === '#FCD34D' ? '252,211,77' : activeColor === '#3b82f6' ? '59,130,246' : activeColor === '#ff4444' ? '255,68,68' : '0,181,88';

  const hoveredAlert = currentAlerts.find(a => a.id === hoveredAlertId);
  const hoveredHighlightGeoJSON = hoveredAlert ? getHighlightGeoJSON(hoveredAlert.lat, hoveredAlert.lng, hoveredAlert.type) : null;
  const isRoad = hoveredAlert && ['traffic', 'commute', 'emergency'].includes(hoveredAlert.type);

  return (
    <div className="relative h-full w-full pt-[80px] pb-4 flex justify-between px-6 overflow-hidden pointer-events-none uppercase bg-[#051005]">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map 
          ref={mapRef} 
          style={{ width: '100%', height: '100%' }} 
          onLoad={handleMapLoad} 
          onMove={(e) => { (window as any).lastMapViewState = { ...e.viewState }; }}
          initialViewState={(window as any).lastMapViewState || { longitude: 46.67, latitude: 24.71, zoom: 10.2, pitch: 0, bearing: 0 }} 
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" 
          interactive={true}
          dragPan={true}
          scrollZoom={true}
          doubleClickZoom={true}
        >
          {/* Highlighted Region Layer */}
          {hoveredHighlightGeoJSON && hoveredAlert && (
            <SafeSource id="hovered-region" type="geojson" data={hoveredHighlightGeoJSON as any}>
              {isRoad ? (
                <SafeLayer 
                  id="hovered-region-line" 
                  type="line" 
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : '#FCD34D', 'line-width': 8, 'line-opacity': 0.8, 'line-blur': 2}} 
                />
              ) : (
                <>
                  <SafeLayer 
                    id="hovered-region-fill" 
                    type="fill" 
                    paint={{'fill-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : '#FCD34D', 'fill-opacity': 0.15}} 
                  />
                  <SafeLayer 
                    id="hovered-region-line" 
                    type="line" 
                    paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : '#FCD34D', 'line-width': 2, 'line-dasharray': [2, 2]}} 
                  />
                </>
              )}
            </SafeSource>
          )}

          {activeMetric === 'grn_1' && (
            <>
              <SafeSource id="greenery-boundary-15km" type="geojson" data={greeneryBoundary15km as any}>
                <SafeLayer id="greenery-boundary-15km-fill" type="fill" paint={{'fill-color': '#1E40AF', 'fill-opacity': 0.05}} />
                <SafeLayer id="greenery-boundary-15km-line" type="line" paint={{'line-color': '#3b82f6', 'line-width': 1.5, 'line-opacity': 0.5}} />
              </SafeSource>
              
              <SafeSource id="greenery-boundary-8km" type="geojson" data={greeneryBoundary8km as any}>
                <SafeLayer id="greenery-boundary-8km-fill" type="fill" paint={{'fill-color': '#1E40AF', 'fill-opacity': 0.08}} />
                <SafeLayer id="greenery-boundary-8km-line" type="line" paint={{'line-color': '#3b82f6', 'line-width': 1.5, 'line-opacity': 0.7}} />
              </SafeSource>

              <SafeSource id="greenery-boundary-3km" type="geojson" data={greeneryBoundary3km as any}>
                <SafeLayer id="greenery-boundary-3km-fill" type="fill" paint={{'fill-color': '#00B558', 'fill-opacity': 0.12}} />
                <SafeLayer id="greenery-boundary-3km-line" type="line" paint={{'line-color': '#00B558', 'line-width': 2}} />
              </SafeSource>

              {/* Red glow effect under pins */}
              <SafeSource id="greenery-red-glow" type="geojson" data={{
                type: "FeatureCollection",
                features: PARK_SUGGESTIONS.map(p => ({
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [p.lng, p.lat] },
                  properties: {}
                }))
              } as any}>
                <SafeLayer 
                  id="greenery-red-glow-layer" 
                  type="circle" 
                  paint={{
                    'circle-radius': 50,
                    'circle-color': '#ff0000',
                    'circle-blur': 1.5,
                    'circle-opacity': 0.5
                  }} 
                />
              </SafeSource>

              {/* Distance Labels */}
              <Marker longitude={RIYADH_CENTER[0]} latitude={RIYADH_CENTER[1] + (15.0 / 110.574)} anchor="center">
                <div className="bg-[#1E40AF]/70 px-2.5 py-0.5 rounded-full text-white text-[10px] font-black tracking-widest backdrop-blur-sm border border-[#3b82f6]/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]">15KM</div>
              </Marker>
              <Marker longitude={RIYADH_CENTER[0]} latitude={RIYADH_CENTER[1] + (8.0 / 110.574)} anchor="center">
                <div className="bg-[#1E40AF]/70 px-2.5 py-0.5 rounded-full text-white text-[10px] font-black tracking-widest backdrop-blur-sm border border-[#3b82f6]/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]">8KM</div>
              </Marker>
              <Marker longitude={RIYADH_CENTER[0]} latitude={RIYADH_CENTER[1] + (3.0 / 110.574)} anchor="center">
                <div className="bg-[#00B558]/70 px-2.5 py-0.5 rounded-full text-white text-[10px] font-black tracking-widest backdrop-blur-sm border border-[#00B558]/40 shadow-[0_0_10px_rgba(0,181,88,0.3)]">3KM</div>
              </Marker>

              {PARK_SUGGESTIONS.map((park) => (
                <Marker key={park.id} longitude={park.lng} latitude={park.lat} anchor="bottom">
                  <div className="relative flex flex-col items-center group cursor-help z-40 pb-2">
                    {/* Bouncing Map Pin with Tree Icon */}
                    <div className="relative flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.6)] z-10 transition-transform duration-300 group-hover:scale-110">
                       <div className="w-6 h-6 bg-[#00B558] rounded-full flex items-center justify-center">
                         <TreePine className="w-3.5 h-3.5 text-white" />
                       </div>
                    </div>
                    <div className="absolute bottom-[2px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-white z-0 drop-shadow-md"></div>
                    
                    {/* Tooltip / Nameplate */}
                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[#051105]/95 border border-[#00B558]/50 backdrop-blur-xl px-3 py-2 rounded-md shadow-[0_0_25px_rgba(0,181,88,0.3)] w-[220px] flex flex-col items-start text-left z-50">
                       <span className="text-[#00B558] font-black text-[10px] tracking-widest uppercase mb-1 drop-shadow-[0_0_5px_rgba(0,181,88,0.5)] flex items-center gap-1">
                         <MapPin className="w-3 h-3" /> {park.name}
                       </span>
                       <span className="text-gray-300 font-bold text-[9px] uppercase leading-tight tracking-wider">
                         {park.reason}
                       </span>
                    </div>
                  </div>
                </Marker>
              ))}
            </>
          )}

          {currentAlerts.map(alert => (
            <Marker key={alert.id} longitude={alert.lng} latitude={alert.lat} anchor="center">
              <MapBuoy alert={alert} isHovered={hoveredAlertId === alert.id} onHover={(hovered) => setHoveredAlertId(hovered ? alert.id : null)} onClick={() => setSelectedAlert(alert)} />
            </Marker>
          ))}
        </Map>
      </div>
      
      {/* Map tint overlay */}
      <div className="absolute inset-0 bg-[#051005]/50 pointer-events-none z-10" />

      <div className="absolute inset-y-0 left-0 w-[500px] bg-gradient-to-r from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[500px] bg-gradient-to-l from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pr-4 pointer-events-auto">
        <WidgetPanel title={OPTIMIZATION_AGENTS.greenery.title} icon={<OPTIMIZATION_AGENTS.greenery.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.greenery.color}/>} className="flex-1 min-h-0">
          <div className="h-full w-full"><FunctionCard item={OPTIMIZATION_AGENTS.greenery.functions[0]} color={OPTIMIZATION_AGENTS.greenery.color} isActive={activeMetric === OPTIMIZATION_AGENTS.greenery.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.greenery.functions[0].id)} layout="full" /></div>
        </WidgetPanel>
        <WidgetPanel title={OPTIMIZATION_AGENTS.parking.title} icon={<OPTIMIZATION_AGENTS.parking.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.parking.color}/>} className="flex-1 min-h-0">
          <div className="h-full w-full"><FunctionCard item={OPTIMIZATION_AGENTS.parking.functions[0]} color={OPTIMIZATION_AGENTS.parking.color} isActive={activeMetric === OPTIMIZATION_AGENTS.parking.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.parking.functions[0].id)} layout="full" /></div>
        </WidgetPanel>
        <WidgetPanel title={OPTIMIZATION_AGENTS.priority.title} icon={<OPTIMIZATION_AGENTS.priority.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.priority.color}/>} className="flex-1 min-h-0">
          <div className="h-full w-full"><FunctionCard item={OPTIMIZATION_AGENTS.priority.functions[0]} color={OPTIMIZATION_AGENTS.priority.color} isActive={activeMetric === OPTIMIZATION_AGENTS.priority.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.priority.functions[0].id)} layout="full" /></div>
        </WidgetPanel>
      </motion.div>

      {/* CENTER VIEW */}
      <div className="flex-1 relative pointer-events-none flex flex-col items-center justify-center z-20">
        <div className="absolute top-4 right-4 pointer-events-auto flex items-center bg-[#0d1f0d]/80 border border-[#D4AF37]/30 backdrop-blur-md rounded-sm overflow-hidden z-20">
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Target className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Square className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Maximize className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all hover:scale-110"><ArrowRight className="w-4 h-4" /></button>
        </div>
        <div className="relative flex items-center justify-center pointer-events-none opacity-60">
          <div className="absolute w-2 h-2 rounded-full z-10 animate-pulse transition-colors duration-500" style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
          <div className="absolute w-8 h-8 rounded-full border z-10 animate-ping transition-colors duration-500" style={{ borderColor: `${activeColor}80`, animationDuration: '3s' }} />
          <motion.div className="absolute w-[300px] h-[300px] rounded-full border-[1px] border-dashed transition-colors duration-500" style={{ borderColor: `${activeColor}40`, boxShadow: `inset 0 0 50px rgba(${activeRgb},0.05)` }} animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} />
          <div className="absolute w-[100vw] h-[1px] transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, transparent, ${activeColor}20, transparent)` }} />
          <div className="absolute h-[100vh] w-[1px] transition-all duration-500" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${activeColor}20, transparent)` }} />
        </div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
          <motion.path key={activeMetric} d="M 50% 50% L 35% 70%" fill="none" stroke={activeColor} strokeWidth="1.5" strokeDasharray="4 4" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
        </svg>
      </div>

      {/* RIGHT SIDEBAR */}
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pl-4 pointer-events-auto">
        <WidgetPanel title={OPTIMIZATION_AGENTS.zoning.title} icon={<OPTIMIZATION_AGENTS.zoning.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.zoning.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.zoning.functions[0]} color={OPTIMIZATION_AGENTS.zoning.color} isActive={activeMetric === OPTIMIZATION_AGENTS.zoning.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.zoning.functions[0].id)} layout="full" /></div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={OPTIMIZATION_AGENTS.mobility.title} icon={<OPTIMIZATION_AGENTS.mobility.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.mobility.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.mobility.functions[0]} color={OPTIMIZATION_AGENTS.mobility.color} isActive={activeMetric === OPTIMIZATION_AGENTS.mobility.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.mobility.functions[0].id)} layout="full" /></div>
          </div>
        </WidgetPanel>
      </motion.div>
    </div>
  );
}