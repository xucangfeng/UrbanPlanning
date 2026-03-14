import React, { useState, useRef, useCallback } from "react";
import { Target, Maximize, Square, ArrowRight, Info, Layers, Car, Sprout, Zap, Building } from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import { motion, AnimatePresence } from "motion/react";
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ScenarioComparisonModal } from './ScenarioComparisonModal';
import { generateRiyadhHeatmap } from './SimulationMapHelper';

const SafeSource = ({ children, ...props }: any) => {
  const cleanProps = { ...props };
  Object.keys(cleanProps).forEach(k => { if (k.startsWith('data-fg') || k.startsWith('data-fgid')) delete cleanProps[k]; });
  return React.createElement(Source, cleanProps, children);
};

const SafeLayer = (props: any) => {
  const cleanProps = { ...props };
  Object.keys(cleanProps).forEach(k => { if (k.startsWith('data-fg') || k.startsWith('data-fgid')) delete cleanProps[k]; });
  return React.createElement(Layer, cleanProps);
};

// --- MOCK SIMULATION DATA ---
const TRAFFIC_ALERTS: any[] = [];
const BUDGET_ALERTS = [
  { id: 2, type: "budget", name: "KAFD Expansion", lat: 24.76, lng: 46.63, severity: "CRITICAL", delay: "OVER BUDGET", cause: "Raw material cost surge", recommendation: "Value engineer phase 3." }
];
const CLIMATE_ALERTS = [
  { id: 3, type: "climate", name: "Wadi Hanifah", lat: 24.65, lng: 46.60, severity: "HIGH", delay: "FLOOD RISK", cause: "Simulated 50-year storm", recommendation: "Increase buffer zones." }
];

const SIMULATION_AGENTS = {
  traffic: {
    id: "traffic", title: "URBAN TEST AGENT", icon: Target, color: "#00B558",
    functions: [
      { 
        id: "trf_1", name: "SIMULATION CONFIDENCE", desc: "SELF-VALIDATES AI MODELS BY COMPARING PREDICTED TRAFFIC WITH ACTUAL SENSOR DATA.",
        stats: [{ label: 'IMPROVEMENT', value: '+18%', color: '#00B558' }, { label: 'BOTTLENECKS', value: '4', color: '#ff4444' }, { label: 'TESTS', value: '32', color: '#3b82f6' }]
      },
      { 
        id: "trf_2", name: "POLICY FAILURE RISK", desc: "RUNS 10K SIMULATIONS TO PREDICT THE SOCIO-ECONOMIC RISKS OF NEW REGULATIONS.",
        stats: [{ label: 'SHIFT EST.', value: '12%', color: '#00B558' }, { label: 'CAPACITY', value: 'OK', color: '#FCD34D' }]
      },
      { 
        id: "trf_3", name: "SCENARIO DIVERSITY", desc: "GENERATES MULTIPLE URBAN GROWTH VERSIONS TO FIND THE MOST SUSTAINABLE PATH.",
        stats: [{ label: 'CO2 SAVED', value: '4.2k', color: '#00B558' }, { label: 'TARGET', value: '80%', color: '#FCD34D' }]
      }
    ]
  },
  budget: {
    id: "budget", title: "MOBILITY IMPACT", icon: Car, color: "#FCD34D",
    functions: [
      { 
        id: "bdg_1", name: "SHADE-DRIVEN NMT LIFT", desc: "SUGGESTS SHADE AND COOLING INTERVENTIONS TO INCREASE WALKING IN DESERT CLIMATES.",
        stats: [{ label: 'NMT LIFT', value: '+34%', color: '#00B558' }, { label: 'RISK', value: 'LOW', color: '#3b82f6' }]
      },
      { 
        id: "bdg_2", name: "ACTIVE TRANSIT SCORE", desc: "MONITORS BIKE-LANE SAFETY AND USAGE TO OPTIMIZE FUTURE CYCLING INFRASTRUCTURE.",
        stats: [{ label: 'EFFICIENCY', value: '92%', color: '#00B558' }, { label: 'DEFICIT', value: '0', color: '#3b82f6' }]
      },
      { 
        id: "bdg_3", name: "PUBLIC TRANSIT ACCESSIBILITY", desc: "ENSURES 80% OF CITIZENS LIVE WITHIN 800M OF A TRANSPORT HUB.",
        stats: [{ label: 'PROJECTED', value: 'SAR 2B', color: '#FCD34D' }, { label: 'GROWTH', value: '+5%', color: '#00B558' }]
      }
    ]
  },
  climate: {
    id: "climate", title: "SCENARIO OPTIMIZER", icon: Layers, color: "#00B558",
    functions: [
      { 
        id: "clm_1", name: "OPTIMAL GOAL HIT RATE", desc: "RANKS PLANNING SCENARIOS BASED ON THEIR CARBON FOOTPRINT AND WATER EFFICIENCY.",
        stats: [{ label: 'HIT RATE', value: '83%', color: '#00B558' }, { label: 'ZONES SAFE', value: '88%', color: '#00B558' }]
      },
      { 
        id: "clm_2", name: "COST-BENEFIT RATIO", desc: "ANALYZES LONG-TERM ROI OF INFRASTRUCTURE VS. SHORT-TERM CONSTRUCTION COSTS.",
        stats: [{ label: 'PEAK TEMP', value: '52°C', color: '#ff4444' }, { label: 'COOLING', value: 'ACTIVE', color: '#3b82f6' }]
      },
      { 
        id: "clm_3", name: "SOCIAL EQUITY SCORE", desc: "ENSURES URBAN INTERVENTIONS ARE DISTRIBUTED FAIRLY ACROSS ALL DEMOGRAPHIC GROUPS.",
        stats: [{ label: 'VISIBILITY', value: '<100m', color: '#ff4444' }, { label: 'ALERTS', value: 'READY', color: '#3b82f6' }]
      }
    ]
  },
  growth: {
    id: "growth", title: "ECONOMIC ANALYZER", icon: Building, color: "#FCD34D",
    functions: [
      { 
        id: "grw_1", name: "NON-OIL GDP CONTRIBUTION", desc: "TRACKS REAL ESTATE'S IMPACT ON DIVERSIFYING THE NATIONAL ECONOMY.",
        stats: [{ label: 'CORE DENSITY', value: '+24%', color: '#FCD34D' }, { label: 'SPRAWL', value: '-12%', color: '#00B558' }]
      },
      { 
        id: "grw_2", name: "FOREIGN FDI IN URBAN", desc: "PREDICTS INVESTOR SENTIMENT TO SUGGEST THE BEST TIME FOR LAND AUCTIONS.",
        stats: [{ label: 'SCHOOLS REQ', value: '14', color: '#ff4444' }, { label: 'HOSPITALS', value: '3', color: '#FCD34D' }]
      },
      { 
        id: "grw_3", name: "JOB CREATION POTENTIAL", desc: "CORRELATES ZONING WITH INDUSTRY GROWTH TO FORECAST LOCAL EMPLOYMENT.",
        stats: [{ label: 'NEW JOBS', value: '120k', color: '#00B558' }, { label: 'ACCESS', value: 'GOOD', color: '#3b82f6' }]
      }
    ]
  },
  grid: {
    id: "grid", title: "ENV & RESILIENCE", icon: Sprout, color: "#00B558",
    functions: [
      { 
        id: "grd_1", name: "FLOOD HIGH-RISK ZONES", desc: "REAL-TIME INTEGRATION WITH DRAINAGE SENSORS TO PREDICT AND PREVENT URBAN FLOODING.",
        stats: [{ label: 'AREAS', value: '5', color: '#ff4444' }, { label: 'RESERVE', value: '2%', color: '#ff4444' }]
      },
      { 
        id: "grd_2", name: "CARBON NEUTRALITY INDEX", desc: "MONITORS URBAN EMISSIONS TO TRIGGER 'GREEN-ONLY' ZONING IN HIGH-POLLUTION AREAS.",
        stats: [{ label: 'LEAKAGE', value: '4%', color: '#FCD34D' }, { label: 'PRESSURE', value: 'STABLE', color: '#00B558' }]
      },
      { 
        id: "grd_3", name: "RENEWABLE ENERGY MIX", desc: "OPTIMIZES ROOFTOP SOLAR PLACEMENT ON PUBLIC BUILDINGS USING 3D SHADOW ANALYSIS.",
        stats: [{ label: 'COVERAGE', value: '99%', color: '#00B558' }, { label: 'LATENCY', value: '12ms', color: '#3b82f6' }]
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
         <div className="text-[11px] font-black uppercase tracking-widest mt-0.5" style={{ color }}>{alert.delay}</div>
      </div>
    </div>
  );
};

function FunctionCard({ item, color, isActive, onClick, layout = "full" }: { item: any, color: string, isActive: boolean, onClick: () => void, layout?: "full"|"half" }) {
  const [isHoveringInfo, setIsHoveringInfo] = useState(false);
  const rgbColor = color === '#FCD34D' ? '252,211,77' : color === '#3b82f6' ? '59,130,246' : color === '#ff4444' ? '255,68,68' : '0,181,88';
  const primaryStat = item.stats[0];
  const isRightPanel = item.id.startsWith('grw') || item.id.startsWith('grd');

  const renderMiniChart = () => {
    const chartClass = isRightPanel 
      ? `absolute inset-0 w-full h-full transition-opacity duration-300 ${isActive ? 'opacity-100 z-20' : 'opacity-70'}`
      : `absolute right-2 bottom-1 w-[150px] h-[50px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`;

    if (!isRightPanel && layout !== "full") return null;

    const data = Array.from({length: 6}).map((_, i) => ({ year: `202${i+1}`, val: 40 + Math.random()*40, pen: Math.random()*10 }));
    
    let valLabel = 'Metric Index';
    let valUnit = '';
    
    if (item.id.startsWith('trf')) { valLabel = 'Simulation Variance'; valUnit = '%'; }
    if (item.id.startsWith('bdg')) { valLabel = 'Pedestrian Flow'; valUnit = 'k/day'; }
    if (item.id.startsWith('clm')) { valLabel = 'Emissions Cut'; valUnit = '%'; }
    if (item.id.startsWith('grw')) { valLabel = 'FDI Growth'; valUnit = 'M SAR'; }
    if (item.id.startsWith('grd')) { valLabel = 'Grid Resiliency'; valUnit = '/100'; }

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
            <Area type="monotone" dataKey="val" stroke={color} strokeWidth={1.5} fillOpacity={1} fill={`url(#grad-${item.id})`} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 cursor-pointer flex flex-col group min-h-0 h-full ${layout === 'full' ? 'p-3' : 'p-2.5'} ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
      style={{ borderColor: isActive ? color : `${color}40` }}
    >
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="flex justify-between items-start w-full gap-2 relative z-10">
         <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] ${layout === 'full' ? 'text-[13px] w-[80%] line-clamp-2' : 'text-[10px] line-clamp-2'}`} style={{ color }}>{item.name}</h4>
         <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-3.5 h-3.5" style={{ color }} /></div>
       </div>
       <div className={`relative w-full flex-1 flex flex-col mt-1.5 z-10 min-h-0 ${(layout === 'half' && isRightPanel) ? 'justify-center' : ''}`}>
          <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <p className={`font-medium tracking-wider text-gray-300 uppercase ${layout === 'full' ? 'text-[10px] leading-[1.4] line-clamp-4' : 'text-[8px] leading-[1.3] line-clamp-4'}`}>{item.desc}</p>
          </div>
          <div className={`w-full flex transition-opacity duration-300 relative flex-1 flex-col min-h-0 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'} ${isRightPanel ? 'justify-start items-start' : 'justify-end items-start'}`}>
             {isRightPanel ? (
               <div className={`flex flex-col w-full h-full ${layout === 'full' ? 'justify-start' : 'justify-center'}`}>
                 <div className="flex justify-between items-end gap-2 w-full mb-1 relative z-10">
                   <span className="font-black leading-none tracking-tighter" style={{ color: primaryStat.color, fontSize: layout === 'full' ? '44px' : '30px', textShadow: `0 0 20px ${primaryStat.color}60` }}>{primaryStat.value}</span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[9px] mb-1 text-right flex-1 line-clamp-1">{primaryStat.label}</span>
                 </div>
                 <div className="flex flex-col gap-[2px] relative z-10">
                   {item.stats.slice(1).map((stat: any, idx: number) => (
                     <div key={idx} className={`flex justify-between items-center w-full border-t border-slate-800/50 ${layout === 'full' ? 'pt-1.5 pb-0.5' : 'pt-[2px]'}`}>
                       <span className="text-slate-500 font-bold tracking-wider text-[8px] uppercase">{stat.label}</span>
                       <span className={`font-black tracking-widest ${layout === 'full' ? 'text-[12px]' : 'text-[10px]'}`} style={{ color: stat.color || color }}>{stat.value}</span>
                     </div>
                   ))}
                 </div>
                 {layout === 'full' && (
                   <div className="flex-1 w-full min-h-[20px] mt-1 relative">{renderMiniChart()}</div>
                 )}
               </div>
             ) : (
               <div className="flex flex-col w-full h-full justify-end relative z-10 pb-0.5">
                 <div className="flex items-end gap-1.5 mb-1 mt-auto">
                   <span className="font-black leading-none tracking-tighter" style={{ color: primaryStat.color, fontSize: layout === 'full' ? '36px' : '24px', textShadow: `0 0 20px ${primaryStat.color}60` }}>{primaryStat.value}</span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[8px] mb-1 max-w-[50%] line-clamp-2">{primaryStat.label}</span>
                 </div>
                 {layout === 'full' && item.stats.length > 1 && (
                   <div className="flex gap-5 w-fit border-t border-white/10 pt-1.5 mb-0.5 mt-1 relative z-20">
                     {item.stats.slice(1).map((stat: any, idx: number) => (
                       <div key={idx} className="flex flex-col">
                         <span className="text-slate-500 font-bold tracking-wider text-[7px] uppercase">{stat.label}</span>
                         <span className="font-black tracking-widest text-[10px] mt-[1px]" style={{ color: stat.color || color }}>{stat.value}</span>
                       </div>
                     ))}
                   </div>
                 )}
                 {renderMiniChart()}
               </div>
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

export default function Simulation() {
  const [activeMetric, setActiveMetric] = useState("trf_1");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [hoveredAlertId, setHoveredAlertId] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [heatmapScheme, setHeatmapScheme] = useState<1 | 2>(1);
  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [46.72, 24.68], zoom: 11, pitch: 35, bearing: -5, duration: 2500, essential: true });
    }
  }, []);

  const handleMetricClick = (id: string) => { setActiveMetric(id); };

  const heatmapData = React.useMemo(() => generateRiyadhHeatmap(heatmapScheme), [heatmapScheme]);

  let currentAlerts: any[] = [];
  if (activeMetric.startsWith('trf')) currentAlerts = TRAFFIC_ALERTS;
  else if (activeMetric.startsWith('bdg')) currentAlerts = BUDGET_ALERTS;
  else if (activeMetric.startsWith('clm')) currentAlerts = CLIMATE_ALERTS;

  const activeAgent = Object.values(SIMULATION_AGENTS).find(agent => agent.functions.some(f => f.id === activeMetric)) || SIMULATION_AGENTS.traffic;
  const activeColor = activeAgent.color;
  const activeRgb = activeColor === '#FCD34D' ? '252,211,77' : activeColor === '#3b82f6' ? '59,130,246' : activeColor === '#ff4444' ? '255,68,68' : '0,181,88';

  const hoveredAlert = currentAlerts.find(a => a.id === hoveredAlertId);
  const hoveredHighlightGeoJSON = hoveredAlert ? getHighlightGeoJSON(hoveredAlert.lat, hoveredAlert.lng, hoveredAlert.type) : null;
  const isRoad = hoveredAlert && ['traffic', 'commute', 'emergency'].includes(hoveredAlert.type);

  return (
    <div className="relative h-full w-full pt-[80px] pb-4 flex justify-between px-6 overflow-hidden pointer-events-none uppercase bg-[#051005]">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map ref={mapRef} style={{ width: '100%', height: '100%' }} onLoad={handleMapLoad} initialViewState={{ longitude: 46.72, latitude: 24.68, zoom: 10, pitch: 35, bearing: 0 }} mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" interactive={true}>
          {/* Highlighted Region Layer */}
          {hoveredHighlightGeoJSON && hoveredAlert && (
            <SafeSource id="hovered-region" type="geojson" data={hoveredHighlightGeoJSON as any}>
              {isRoad ? (
                <SafeLayer 
                  id="hovered-region-line" 
                  type="line" 
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{'line-color': activeColor, 'line-width': 8, 'line-opacity': 0.8, 'line-blur': 2}} 
                />
              ) : (
                <>
                  <SafeLayer 
                    id="hovered-region-fill" 
                    type="fill" 
                    paint={{'fill-color': activeColor, 'fill-opacity': 0.15}} 
                  />
                  <SafeLayer 
                    id="hovered-region-line" 
                    type="line" 
                    paint={{'line-color': activeColor, 'line-width': 2, 'line-dasharray': [2, 2]}} 
                  />
                </>
              )}
            </SafeSource>
          )}

          {/* Traffic Heatmap Layer */}
          {heatmapData && (
            <SafeSource id="traffic-heatmap" type="geojson" data={heatmapData as any}>
              <SafeLayer 
                id="traffic-heatmap-layer" 
                type="heatmap" 
                paint={{
                  'heatmap-weight': ['get', 'weight'],
                  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 15, 3.5],
                  'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0, 181, 88, 0)',
                    0.2, 'rgba(0, 181, 88, 0.6)', // green
                    0.5, 'rgba(252, 211, 77, 0.8)', // gold
                    0.8, 'rgba(255, 68, 68, 0.95)', // red
                    1, 'rgba(255, 255, 255, 1)' // hot core
                  ],
                  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 20],
                  'heatmap-opacity': 0.95
                }} 
              />
            </SafeSource>
          )}

          {currentAlerts.map(alert => (
            <Marker key={alert.id} longitude={alert.lng} latitude={alert.lat} anchor="center">
              <MapBuoy alert={alert} isHovered={hoveredAlertId === alert.id} onHover={(hovered) => setHoveredAlertId(hovered ? alert.id : null)} onClick={() => setSelectedAlert(alert)} />
            </Marker>
          ))}
        </Map>
        <div className="absolute inset-0 bg-[#051005]/50 pointer-events-none z-10" />
      </div>

      <div className="absolute inset-y-0 left-0 w-[500px] bg-gradient-to-r from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[500px] bg-gradient-to-l from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pr-4 pointer-events-auto">
        <WidgetPanel title={SIMULATION_AGENTS.traffic.title} icon={<SIMULATION_AGENTS.traffic.icon className="w-5 h-5" color={SIMULATION_AGENTS.traffic.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={SIMULATION_AGENTS.traffic.functions[0]} color={SIMULATION_AGENTS.traffic.color} isActive={activeMetric === SIMULATION_AGENTS.traffic.functions[0].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.traffic.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={SIMULATION_AGENTS.traffic.functions[1]} color={SIMULATION_AGENTS.traffic.color} isActive={activeMetric === SIMULATION_AGENTS.traffic.functions[1].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.traffic.functions[1].id)} layout="half" />
               <FunctionCard item={SIMULATION_AGENTS.traffic.functions[2]} color={SIMULATION_AGENTS.traffic.color} isActive={activeMetric === SIMULATION_AGENTS.traffic.functions[2].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.traffic.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={SIMULATION_AGENTS.budget.title} icon={<SIMULATION_AGENTS.budget.icon className="w-5 h-5" color={SIMULATION_AGENTS.budget.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={SIMULATION_AGENTS.budget.functions[0]} color={SIMULATION_AGENTS.budget.color} isActive={activeMetric === SIMULATION_AGENTS.budget.functions[0].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.budget.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={SIMULATION_AGENTS.budget.functions[1]} color={SIMULATION_AGENTS.budget.color} isActive={activeMetric === SIMULATION_AGENTS.budget.functions[1].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.budget.functions[1].id)} layout="half" />
               <FunctionCard item={SIMULATION_AGENTS.budget.functions[2]} color={SIMULATION_AGENTS.budget.color} isActive={activeMetric === SIMULATION_AGENTS.budget.functions[2].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.budget.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={SIMULATION_AGENTS.climate.title} icon={<SIMULATION_AGENTS.climate.icon className="w-5 h-5" color={SIMULATION_AGENTS.climate.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={SIMULATION_AGENTS.climate.functions[0]} color={SIMULATION_AGENTS.climate.color} isActive={activeMetric === SIMULATION_AGENTS.climate.functions[0].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.climate.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={SIMULATION_AGENTS.climate.functions[1]} color={SIMULATION_AGENTS.climate.color} isActive={activeMetric === SIMULATION_AGENTS.climate.functions[1].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.climate.functions[1].id)} layout="half" />
               <FunctionCard item={SIMULATION_AGENTS.climate.functions[2]} color={SIMULATION_AGENTS.climate.color} isActive={activeMetric === SIMULATION_AGENTS.climate.functions[2].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.climate.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
      </motion.div>

      {/* CENTER VIEW */}
      <div className="flex-1 relative pointer-events-none flex flex-col items-center justify-center z-20">
        
        {/* Heatmap Scheme Toggle */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center bg-[#051005]/80 backdrop-blur-md border border-[#00B558]/20 p-1 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <button 
            onClick={() => setHeatmapScheme(1)}
            className={`px-4 py-1 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-[2px] ${heatmapScheme === 1 ? 'bg-[#00B558]/20 text-[#00B558] border border-[#00B558]/50 shadow-[inset_0_0_10px_rgba(0,181,88,0.2)]' : 'text-gray-500 hover:text-[#00B558] border border-transparent'}`}
          >
            S1: RESIDENTIAL
          </button>
          <div className="w-[1px] h-3 bg-[#00B558]/20 mx-1" />
          <button 
            onClick={() => setHeatmapScheme(2)}
            className={`px-4 py-1 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-[2px] ${heatmapScheme === 2 ? 'bg-[#FCD34D]/20 text-[#FCD34D] border border-[#FCD34D]/50 shadow-[inset_0_0_10px_rgba(252,211,77,0.2)]' : 'text-gray-500 hover:text-[#FCD34D] border border-transparent'}`}
          >
            S2: COMMERCIAL
          </button>
        </div>

        {activeMetric === 'trf_3' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[220px] pointer-events-auto z-30"
          >
            <button 
              onClick={() => setShowComparison(true)} 
              className="px-6 py-2.5 bg-[#0a140a]/80 border border-[#00B558]/60 text-[#00B558] font-black uppercase tracking-[0.2em] text-xs hover:bg-[#00B558] hover:text-black transition-all shadow-[0_0_20px_rgba(0,181,88,0.2)] hover:shadow-[0_0_30px_rgba(0,181,88,0.6)] backdrop-blur-md rounded-sm"
            >
              Run Scenario Comparison
            </button>
          </motion.div>
        )}
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
        <WidgetPanel title={SIMULATION_AGENTS.growth.title} icon={<SIMULATION_AGENTS.growth.icon className="w-5 h-5" color={SIMULATION_AGENTS.growth.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={SIMULATION_AGENTS.growth.functions[0]} color={SIMULATION_AGENTS.growth.color} isActive={activeMetric === SIMULATION_AGENTS.growth.functions[0].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.growth.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={SIMULATION_AGENTS.growth.functions[1]} color={SIMULATION_AGENTS.growth.color} isActive={activeMetric === SIMULATION_AGENTS.growth.functions[1].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.growth.functions[1].id)} layout="half" />
               <FunctionCard item={SIMULATION_AGENTS.growth.functions[2]} color={SIMULATION_AGENTS.growth.color} isActive={activeMetric === SIMULATION_AGENTS.growth.functions[2].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.growth.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={SIMULATION_AGENTS.grid.title} icon={<SIMULATION_AGENTS.grid.icon className="w-5 h-5" color={SIMULATION_AGENTS.grid.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={SIMULATION_AGENTS.grid.functions[0]} color={SIMULATION_AGENTS.grid.color} isActive={activeMetric === SIMULATION_AGENTS.grid.functions[0].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.grid.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={SIMULATION_AGENTS.grid.functions[1]} color={SIMULATION_AGENTS.grid.color} isActive={activeMetric === SIMULATION_AGENTS.grid.functions[1].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.grid.functions[1].id)} layout="half" />
               <FunctionCard item={SIMULATION_AGENTS.grid.functions[2]} color={SIMULATION_AGENTS.grid.color} isActive={activeMetric === SIMULATION_AGENTS.grid.functions[2].id} onClick={() => handleMetricClick(SIMULATION_AGENTS.grid.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
      </motion.div>

      <AnimatePresence>
        {showComparison && <ScenarioComparisonModal onClose={() => setShowComparison(false)} />}
      </AnimatePresence>
    </div>
  );
}