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
        id: "zon_1", name: "MIXED-USE RATIO", desc: "SUGGESTS ZONING PIVOTS TO INTEGRATE RETAIL INTO RESIDENTIAL BLOCKS FOR WALKABILITY.",
        stats: [
          { label: 'OVER-LIMIT', value: '35%', color: '#ff4444' }, 
          { label: 'TARGET', value: '25%', color: '#00B558' }, 
          { label: 'RESID.', value: '20%', color: '#94a3b8' },
          { label: 'COMM.', value: '25%', color: '#94a3b8' },
          { label: 'PUBLIC/GREEN', value: '20%', color: '#94a3b8' }
        ]
      },
      { 
        id: "zon_2", name: "15-MIN CITY ACCESS", desc: "IDENTIFIES 'AMENITY DESERTS' WHERE RESIDENTS LACK ESSENTIAL SERVICES WITHIN WALKING DISTANCE.",
        stats: [{ label: 'DESERTS', value: '8', color: '#ff4444' }, { label: 'COVERED', value: '82%', color: '#00B558' }]
      },
      { 
        id: "zon_3", name: "COMMERCIAL DIVERSITY INDEX", desc: "ENSURES A BALANCED MIX OF SMES AND LARGE RETAIL IN NEW DEVELOPMENTS.",
        stats: [{ label: 'INDEX SKEW', value: '15', color: '#ff4444' }, { label: 'BALANCED', value: '142', color: '#00B558' }]
      }
    ]
  },
  parking: {
    id: "parking", title: "ACCESS & PARKING", icon: Car, color: "#FCD34D",
    functions: [
      { 
        id: "prk_1", name: "SMART PARKING TURNOVER", desc: "STRAIN <5%",
        stats: [{ label: 'ZONES', value: '13', color: '#ff4444' }, { label: 'OPTIMIZED', value: '52', color: '#FCD34D' }]
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
        id: "pri_1", name: "BOTTLENECK INDEX", desc: "DETECTS ADMINISTRATIVE STALLS IN ZONING APPROVALS TO TRIGGER AUTOMATED ESCALATION.",
        stats: [{ label: 'STALLED', value: '3', color: '#ff4444' }, { label: 'RESOLVED', value: '9', color: '#00B558' }]
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
        id: "grn_1", name: "GREEN SPACE PER CAPITA", desc: "IDENTIFIES OPTIMAL SITES FOR URBAN FORESTS TO MEET 'GREEN RIYADH' TARGETS.",
        stats: [
          { label: 'CURRENT (M²/CAPITA)', value: '1.7', color: '#FCD34D' },
          { label: 'NEW LOCATIONS', value: '10', color: '#FCD34D' },
          { label: 'AVG SIZE (M²)', value: '3K-10K', color: '#00B558' },
          { label: 'COVERAGE GAIN', value: '+7%', color: '#00B558' }
        ]
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
        id: "mob_1", name: "OPTIMAL ROI", desc: "TRACKS THE AI-MONITORED TRANSITION OF UNPLANNED AREAS INTO MODERNIZED DISTRICTS.",
        stats: [{ label: 'ROI YIELD', value: '47%', color: '#00B558' }, { label: 'TRANSITIONING', value: '34', color: '#00B558' }]
      },
      { 
        id: "mob_2", name: "HERITAGE INTEGRATION", desc: "ENSURES NEW CONSTRUCTION RESPECTS THE 'VISUAL BUFFER' OF HISTORIC SITES LIKE DIRIYAH.",
        stats: [{ label: 'CONFLICTS', value: '5', color: '#FCD34D' }, { label: 'ALIGNED', value: '12', color: '#00B558' }]
      },
      { 
        id: "mob_3", name: "FACADE COMPLIANCE SCORE", desc: "COMPUTER VISION CHECKS IF BUILDING RENOVATIONS ALIGN WITH REGIONAL ARCHITECTURAL CODES.",
        stats: [{ label: 'VIOLATIONS', value: '18', color: '#ff4444' }, { label: 'COMPLIANT', value: '92%', color: '#00B558' }]
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
  
  if (item.id === 'zon_1') {
    const radarData = [
      { subject: 'RESIDENTIAL', A: 80, B: 60, fullMark: 100 },
      { subject: 'COMMERCIAL', A: 50, B: 70, fullMark: 100 },
      { subject: 'SERVICE', A: 60, B: 80, fullMark: 100 },
      { subject: 'PUBLIC', A: 40, B: 50, fullMark: 100 },
      { subject: 'GREEN', A: 70, B: 60, fullMark: 100 },
      { subject: 'MIXED', A: 50, B: 50, fullMark: 100 },
    ];
    return (
      <div 
        onClick={onClick}
        className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full p-2.5 ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
        style={{ borderColor: isActive ? color : `${color}40` }}
      >
         <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
         <div className="flex justify-between items-start w-full gap-2 relative z-10 mb-1">
           <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] text-[14px] w-[80%]`} style={{ color }}>{item.name}</h4>
           <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-3.5 h-3.5" style={{ color }} /></div>
         </div>
         <div className="relative w-full flex-1 flex mt-1 z-10 min-h-[40px] gap-2">
            <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
               <p className={`font-medium tracking-wider text-gray-300 uppercase text-[11px] leading-[1.5]`}>{item.desc}</p>
            </div>
            
            {/* Chart Area */}
            <div className={`w-[55%] flex flex-col items-center justify-center transition-opacity duration-300 relative ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
                <div className="w-full flex-1 min-h-[100px] relative -ml-2">
                   <ResponsiveContainer width="100%" height="100%">
                     <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                       <PolarGrid stroke="#334155" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 7, fontWeight: 'bold', fontFamily: 'inherit', letterSpacing: '0.05em' }} />
                       <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                         formatter={(value: number, name: string) => [`${value}%`, name]}
                       />
                       <Radar name="Current" dataKey="A" stroke="#00B558" strokeWidth={1.5} fill="#00B558" fillOpacity={0.3} />
                       <Radar name="Target" dataKey="B" stroke="#ff4444" strokeWidth={1.5} fill="#ff4444" fillOpacity={0.2} />
                     </RadarChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-1 text-[9px] font-bold tracking-wider">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 border border-[#00B558] bg-[#00B558]/30"></div><span className="text-[#00B558]">CURRENT</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 border border-[#ff4444] bg-[#ff4444]/30"></div><span className="text-[#ff4444]">TARGET</span></div>
                </div>
            </div>

            {/* Stats Area */}
            <div className={`w-[45%] flex flex-col justify-center gap-1 transition-opacity duration-300 relative ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
                {item.stats.slice(0, 2).map((stat: any, idx: number) => (
                    <div key={idx} className="flex flex-col">
                        <span className="text-slate-500 font-bold tracking-wider text-[8px] uppercase leading-tight mb-[1px]">{stat.label}</span>
                        <span className="font-black tracking-widest text-[14px] leading-tight" style={{ color: stat.color || color, textShadow: `0 0 10px ${stat.color}60` }}>{stat.value}</span>
                    </div>
                ))}
                <div className="h-[1px] w-full bg-slate-800/50 my-[2px]"></div>
                <div className="flex flex-col gap-0.5">
                  {item.stats.slice(2).map((stat: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center w-full">
                          <span className="text-slate-500 font-bold tracking-wider text-[8px] uppercase">{stat.label}</span>
                          <span className="font-black tracking-widest text-[10px]" style={{ color: stat.color }}>{stat.value}</span>
                      </div>
                  ))}
                </div>
            </div>
         </div>
      </div>
    );
  }

  const primaryStat = item.stats[0];
  const isListLayout = item.id.startsWith('zon') || item.id.startsWith('mob') || item.id === 'grn_1';

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
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.65] min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.greenery.functions[0]} color={OPTIMIZATION_AGENTS.greenery.color} isActive={activeMetric === OPTIMIZATION_AGENTS.greenery.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.greenery.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.35] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={OPTIMIZATION_AGENTS.greenery.functions[1]} color={OPTIMIZATION_AGENTS.greenery.color} isActive={activeMetric === OPTIMIZATION_AGENTS.greenery.functions[1].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.greenery.functions[1].id)} layout="half" />
               <FunctionCard item={OPTIMIZATION_AGENTS.greenery.functions[2]} color={OPTIMIZATION_AGENTS.greenery.color} isActive={activeMetric === OPTIMIZATION_AGENTS.greenery.functions[2].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.greenery.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={OPTIMIZATION_AGENTS.parking.title} icon={<OPTIMIZATION_AGENTS.parking.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.parking.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.65] min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.parking.functions[0]} color={OPTIMIZATION_AGENTS.parking.color} isActive={activeMetric === OPTIMIZATION_AGENTS.parking.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.parking.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.35] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={OPTIMIZATION_AGENTS.parking.functions[1]} color={OPTIMIZATION_AGENTS.parking.color} isActive={activeMetric === OPTIMIZATION_AGENTS.parking.functions[1].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.parking.functions[1].id)} layout="half" />
               <FunctionCard item={OPTIMIZATION_AGENTS.parking.functions[2]} color={OPTIMIZATION_AGENTS.parking.color} isActive={activeMetric === OPTIMIZATION_AGENTS.parking.functions[2].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.parking.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={OPTIMIZATION_AGENTS.priority.title} icon={<OPTIMIZATION_AGENTS.priority.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.priority.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.65] min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.priority.functions[0]} color={OPTIMIZATION_AGENTS.priority.color} isActive={activeMetric === OPTIMIZATION_AGENTS.priority.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.priority.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.35] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={OPTIMIZATION_AGENTS.priority.functions[1]} color={OPTIMIZATION_AGENTS.priority.color} isActive={activeMetric === OPTIMIZATION_AGENTS.priority.functions[1].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.priority.functions[1].id)} layout="half" />
               <FunctionCard item={OPTIMIZATION_AGENTS.priority.functions[2]} color={OPTIMIZATION_AGENTS.priority.color} isActive={activeMetric === OPTIMIZATION_AGENTS.priority.functions[2].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.priority.functions[2].id)} layout="half" />
            </div>
          </div>
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
            <div className="flex-[0.65] min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.zoning.functions[0]} color={OPTIMIZATION_AGENTS.zoning.color} isActive={activeMetric === OPTIMIZATION_AGENTS.zoning.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.zoning.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.35] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={OPTIMIZATION_AGENTS.zoning.functions[1]} color={OPTIMIZATION_AGENTS.zoning.color} isActive={activeMetric === OPTIMIZATION_AGENTS.zoning.functions[1].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.zoning.functions[1].id)} layout="half" />
               <FunctionCard item={OPTIMIZATION_AGENTS.zoning.functions[2]} color={OPTIMIZATION_AGENTS.zoning.color} isActive={activeMetric === OPTIMIZATION_AGENTS.zoning.functions[2].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.zoning.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={OPTIMIZATION_AGENTS.mobility.title} icon={<OPTIMIZATION_AGENTS.mobility.icon className="w-5 h-5" color={OPTIMIZATION_AGENTS.mobility.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.65] min-h-0 w-full"><FunctionCard item={OPTIMIZATION_AGENTS.mobility.functions[0]} color={OPTIMIZATION_AGENTS.mobility.color} isActive={activeMetric === OPTIMIZATION_AGENTS.mobility.functions[0].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.mobility.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.35] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={OPTIMIZATION_AGENTS.mobility.functions[1]} color={OPTIMIZATION_AGENTS.mobility.color} isActive={activeMetric === OPTIMIZATION_AGENTS.mobility.functions[1].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.mobility.functions[1].id)} layout="half" />
               <FunctionCard item={OPTIMIZATION_AGENTS.mobility.functions[2]} color={OPTIMIZATION_AGENTS.mobility.color} isActive={activeMetric === OPTIMIZATION_AGENTS.mobility.functions[2].id} onClick={() => handleMetricClick(OPTIMIZATION_AGENTS.mobility.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
      </motion.div>
    </div>
  );
}