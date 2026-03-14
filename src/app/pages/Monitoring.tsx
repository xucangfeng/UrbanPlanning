import React, { useState, useRef, useCallback } from "react";
import { Target, Maximize, Square, ArrowRight, Info, Eye, Activity, Siren, Wind, Train, Zap } from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import { motion } from "motion/react";
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';

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

// --- MOCK MONITORING DATA ---
const CROWD_ALERTS = [
  { id: 1, type: "crowd", name: "Riyadh Season Gate", lat: 24.76, lng: 46.60, severity: "CRITICAL", delay: "OVERCAPACITY", cause: "Mass exit event", recommendation: "Open overflow gates." }
];
const SENSOR_ALERTS = [
  { id: 2, type: "sensor", name: "Olaya Node Alpha", lat: 24.70, lng: 46.68, severity: "HIGH", delay: "OFFLINE", cause: "Power interruption", recommendation: "Dispatch technician." }
];
const EMERGENCY_ALERTS = [
  { id: 3, type: "emergency", name: "King Fahd Corridor", lat: 24.73, lng: 46.66, severity: "CRITICAL", delay: "DISPATCHED", cause: "Multi-vehicle collision", recommendation: "Hold all red lights." }
];

const MONITORING_AGENTS = {
  urban: {
    id: "urban", title: "URBAN MONITORING", icon: Eye, color: "#00B558",
    functions: [
      { 
        id: "urb_1", name: "DIGITAL TWIN SYNC", desc: "ENSURES THE 3D MODEL REFLECTS PHYSICAL CHANGES WITH ZERO DATA LATENCY.",
        stats: [{ label: 'LATENCY', value: '<5ms', color: '#00B558' }, { label: 'SYNC', value: '100%', color: '#3b82f6' }]
      },
      { 
        id: "urb_2", name: "GEOSPATIAL ACCURACY", desc: "USES LIDAR AND AI TO MAINTAIN CENTIMETER-LEVEL PRECISION IN THE CITY MAP.",
        stats: [{ label: 'PRECISION', value: '1.2cm', color: '#00B558' }, { label: 'DRIFT', value: '0', color: '#FCD34D' }]
      },
      { 
        id: "urb_3", name: "DATA STREAM HEALTH", desc: "AUTONOMOUSLY REPAIRS OR FLAGS FAULTY SENSORS ACROSS THE SMART CITY NETWORK.",
        stats: [{ label: 'REPAIRED', value: '42', color: '#3b82f6' }, { label: 'FAULTS', value: '0', color: '#00B558' }]
      }
    ]
  },
  condition: {
    id: "condition", title: "CONDITION WATCH", icon: Activity, color: "#FCD34D",
    functions: [
      { 
        id: "cnd_1", name: "PREDICTIVE MAINT. SCORE", desc: "PREDICTS STRUCTURAL FAILURES IN BRIDGES AND ROADS BEFORE THEY OCCUR.",
        stats: [{ label: 'RISK', value: 'LOW', color: '#00B558' }, { label: 'ALERTS', value: '2', color: '#ff4444' }]
      },
      { 
        id: "cnd_2", name: "ASSET LIFESPAN", desc: "AI SUGGESTS EARLY INTERVENTIONS TO EXTEND THE LIFE OF MUNICIPAL ASSETS.",
        stats: [{ label: 'EXTENSION', value: '+14%', color: '#00B558' }, { label: 'DEGRADE', value: '-2%', color: '#3b82f6' }]
      },
      { 
        id: "cnd_3", name: "ENERGY WASTE DETECTION", desc: "FLAGS BUILDINGS WITH ABNORMAL HVAC PATTERNS FOR IMMEDIATE ENERGY AUDITS.",
        stats: [{ label: 'WASTE', value: '4.2%', color: '#FCD34D' }, { label: 'AUDITS', value: '8', color: '#ff4444' }]
      }
    ]
  },
  tracker: {
    id: "tracker", title: "CHANGE TRACKER", icon: Target, color: "#ff4444",
    functions: [
      { 
        id: "trk_1", name: "UNAUTHORIZED DEV. RATE", desc: "SAT-AI VIOLATIONS",
        stats: [{ label: 'SITES', value: '12', color: '#ff4444' }, { label: 'NEW', value: '2', color: '#ff4444' }]
      },
      { 
        id: "trk_2", name: "PERMIT COMPLIANCE", desc: "COMPARES FINISHED BUILDINGS AGAINST APPROVED BLUEPRINTS VIA DRONE SCANS.",
        stats: [{ label: 'COMPLIANCE', value: '98%', color: '#00B558' }, { label: 'VIOLS', value: '3', color: '#FCD34D' }]
      },
      { 
        id: "trk_3", name: "ZONING VIOLATION DETECTION", desc: "ALERTS PLANNERS WHEN RESIDENTIAL PROPERTIES ARE USED FOR COMMERCIAL PURPOSES.",
        stats: [{ label: 'DETECTED', value: '12', color: '#ff4444' }, { label: 'RESOLVED', value: '8', color: '#3b82f6' }]
      }
    ]
  },
  learning: {
    id: "learning", title: "CONT. LEARNING", icon: Zap, color: "#00B558",
    functions: [
      { 
        id: "lrn_1", name: "MODEL ACCURACY LIFT", desc: "THE RATE AT WHICH THE CITY'S BRAIN UPDATES BASED ON NEW DATA.",
        stats: [{ label: 'LIFT', value: '+8.3%', color: '#00B558' }, { label: 'EPOCHS', value: '1.4k', color: '#00B558' }]
      },
      { 
        id: "lrn_2", name: "FORECAST VARIANCE", desc: "THE STEADY DECREASE IN PREDICTION ERROR AS THE AI LEARNS FROM HISTORY.",
        stats: [{ label: 'ERROR', value: '1.2%', color: '#00B558' }, { label: 'IMPROVE', value: '+4%', color: '#FCD34D' }]
      },
      { 
        id: "lrn_3", name: "KNOWLEDGE TRANSFER RATE", desc: "SPEED AT WHICH INSIGHTS FROM RIYADH ARE APPLIED TO OTHER SAUDI CITIES.",
        stats: [{ label: 'SPEED', value: 'FAST', color: '#00B558' }, { label: 'NODES', value: '14', color: '#00B558' }]
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
  const isRightPanel = item.id.startsWith('trk') || item.id.startsWith('lrn');

  const renderMiniChart = () => {
    if (layout !== "full") return null;

    const chartClass = isRightPanel 
      ? `absolute inset-0 w-full h-full transition-opacity duration-300 ${isActive ? 'opacity-100 z-20' : 'opacity-70'}`
      : `absolute right-0 bottom-0 w-[240px] h-[75px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`;

    const data = Array.from({length: 6}).map((_, i) => ({ year: `202${i+1}`, val: 40 + Math.random()*40, pen: Math.random()*10 }));
    
    // Determine context based on agent ID
    let valLabel = 'Metric Value';
    let penLabel = 'Variance';
    let valUnit = '';
    let penUnit = '';

    if (item.id.startsWith('urb')) {
       valLabel = 'Sync Coverage'; valUnit = '%';
       penLabel = 'Latency'; penUnit = 'ms';
    } else if (item.id.startsWith('cnd')) {
       valLabel = 'Asset Health'; valUnit = '/100';
       penLabel = 'Anomalies'; penUnit = '';
    } else if (item.id.startsWith('trk')) {
       valLabel = 'Compliance Rate'; valUnit = '%';
       penLabel = 'Violations'; penUnit = '';
    } else if (item.id.startsWith('lrn')) {
       valLabel = 'Model Accuracy'; valUnit = '%';
       penLabel = 'Data Drift'; penUnit = '%';
    }

    return (
      <div className={chartClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey="year" hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
              labelFormatter={(label) => `YEAR: ${label}`}
              formatter={(value: number, name: string) => {
                if (name === 'val') return [`${value.toFixed(1)}${valUnit}`, valLabel];
                if (name === 'pen') return [`${value.toFixed(1)}${penUnit}`, penLabel];
                return [value, name];
              }}
            />
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="val" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${item.id})`} isAnimationActive={false} />
            {!isRightPanel && (
               <Bar dataKey="pen" fill={color} opacity={0.3} barSize={4} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 cursor-pointer flex flex-col group min-h-0 h-full ${layout === 'full' ? 'p-4' : 'p-3'} ${isActive ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`}`}
      style={{ borderColor: isActive ? color : `${color}40` }}
    >
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="flex justify-between items-start w-full gap-2 relative z-10">
         <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] ${layout === 'full' ? 'text-[15px] w-[80%] line-clamp-2' : 'text-[11px] line-clamp-2'}`} style={{ color }}>{item.name}</h4>
         <div className="p-1 -mr-1 -mt-1 cursor-help flex-none opacity-40 hover:opacity-100 transition-opacity" onMouseEnter={() => setIsHoveringInfo(true)} onMouseLeave={() => setIsHoveringInfo(false)}><Info className="w-3.5 h-3.5" style={{ color }} /></div>
       </div>
       <div className={`relative w-full flex-1 flex flex-col mt-2 z-10 min-h-[40px]`}>
          <div className={`absolute inset-0 flex items-center bg-[#070d07]/90 backdrop-blur-sm transition-opacity duration-300 z-20 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <p className={`font-medium tracking-wider text-gray-300 uppercase ${layout === 'full' ? 'text-[11px] leading-[1.5]' : 'text-[9px] leading-[1.3] line-clamp-4'}`}>{item.desc}</p>
          </div>
          <div className={`w-full flex transition-opacity duration-300 relative flex-1 flex-col min-h-0 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
             {isRightPanel ? (
               <div className="flex flex-col w-full h-full justify-between">
                 <div className="flex justify-between items-end gap-2 w-full mt-0.5 relative z-10">
                   <span className="font-black leading-none tracking-tighter" style={{ color: primaryStat.color, fontSize: layout === 'full' ? '50px' : '38px', textShadow: `0 0 20px ${primaryStat.color}60` }}>{primaryStat.value}</span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[11px] mb-1.5 text-right flex-1 line-clamp-2">{primaryStat.label}</span>
                 </div>
                 <div className={`flex flex-col w-full relative z-10`}>
                   {item.stats.slice(1).map((stat: any, idx: number) => (
                     <div key={idx} className={`flex justify-between items-center w-full border-t border-slate-800/50 ${layout === 'full' ? 'py-1.5' : 'py-1 mt-0.5'}`}>
                       <span className={`text-slate-500 font-bold tracking-wider uppercase ${layout === 'full' ? 'text-[10px]' : 'text-[9px]'}`}>{stat.label}</span>
                       <span className={`font-black tracking-widest ${layout === 'full' ? 'text-[14px]' : 'text-[12px]'}`} style={{ color: stat.color || color }}>{stat.value}</span>
                     </div>
                   ))}
                 </div>
                 {layout === 'full' && (
                   <div className="flex-1 w-full min-h-[40px] mt-1 relative z-0">{renderMiniChart()}</div>
                 )}
               </div>
             ) : (
               <div className="flex flex-col w-full h-full justify-between relative z-10">
                 <div className="flex items-end gap-1.5 mt-0.5">
                   <span className="font-black leading-none tracking-tighter" style={{ color: primaryStat.color, fontSize: layout === 'full' ? '50px' : '36px', textShadow: `0 0 20px ${primaryStat.color}60` }}>{primaryStat.value}</span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[11px] mb-1.5 max-w-[50%] line-clamp-2">{primaryStat.label}</span>
                 </div>
                 {item.stats.length > 1 && (
                   <div className={`flex ${layout === 'full' ? 'gap-6' : 'gap-4'} w-fit border-t border-white/10 ${layout === 'full' ? 'pt-2.5 pb-0.5' : 'pt-1.5'} mt-auto relative z-20`}>
                     {item.stats.slice(1).map((stat: any, idx: number) => (
                       <div key={idx} className="flex flex-col">
                         <span className="text-slate-500 font-bold tracking-wider text-[9px] uppercase leading-none">{stat.label}</span>
                         <span className={`font-black tracking-widest ${layout === 'full' ? 'text-[14px]' : 'text-[12px]'} mt-[5px] leading-none`} style={{ color: stat.color || color }}>{stat.value}</span>
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

export default function Monitoring() {
  const [activeMetric, setActiveMetric] = useState("urb_1");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [hoveredAlertId, setHoveredAlertId] = useState<number | null>(null);
  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [46.6853, 24.7136], zoom: 12, pitch: 60, bearing: 30, duration: 2500, essential: true });
    }
  }, []);

  const handleMetricClick = (id: string) => { 
    setActiveMetric(id); 
    window.dispatchEvent(new CustomEvent('agent-metric-select', { detail: { id } }));
  };

  let currentAlerts: any[] = [];
  if (activeMetric.startsWith('urb')) currentAlerts = CROWD_ALERTS;
  else if (activeMetric.startsWith('cnd')) currentAlerts = SENSOR_ALERTS;
  else if (activeMetric.startsWith('trk')) currentAlerts = EMERGENCY_ALERTS;

  const activeAgent = Object.values(MONITORING_AGENTS).find(agent => agent.functions.some(f => f.id === activeMetric)) || MONITORING_AGENTS.urban;
  const activeColor = activeAgent.color;
  const activeRgb = activeColor === '#FCD34D' ? '252,211,77' : activeColor === '#3b82f6' ? '59,130,246' : activeColor === '#ff4444' ? '255,68,68' : '0,181,88';

  const hoveredAlert = currentAlerts.find(a => a.id === hoveredAlertId);
  const hoveredHighlightGeoJSON = hoveredAlert ? getHighlightGeoJSON(hoveredAlert.lat, hoveredAlert.lng, hoveredAlert.type) : null;
  const isRoad = hoveredAlert && ['traffic', 'commute', 'emergency'].includes(hoveredAlert.type);

  return (
    <div className="relative h-full w-full pt-[80px] pb-4 flex justify-between px-6 overflow-hidden pointer-events-none uppercase bg-[#051005]">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map ref={mapRef} style={{ width: '100%', height: '100%' }} onLoad={handleMapLoad} 
          onMove={(e) => { (window as any).lastMapViewState = { ...e.viewState }; }}
          initialViewState={(window as any).lastMapViewState || { longitude: 46.68, latitude: 24.71, zoom: 11, pitch: 45, bearing: 0 }} 
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" interactive={true}>
          {/* Highlighted Region Layer */}
          {hoveredHighlightGeoJSON && hoveredAlert && (
            <SafeSource id="hovered-region" type="geojson" data={hoveredHighlightGeoJSON as any}>
              {isRoad ? (
                <>
                  <SafeLayer 
                    id="hovered-region-line-bg" 
                    type="line" 
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : activeColor, 'line-width': 8, 'line-opacity': 0.3, 'line-blur': 4}} 
                  />
                  <SafeLayer 
                    id="hovered-region-line" 
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
        <WidgetPanel title={MONITORING_AGENTS.urban.title} icon={<MONITORING_AGENTS.urban.icon className="w-5 h-5" color={MONITORING_AGENTS.urban.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={MONITORING_AGENTS.urban.functions[0]} color={MONITORING_AGENTS.urban.color} isActive={activeMetric === MONITORING_AGENTS.urban.functions[0].id} onClick={() => handleMetricClick(MONITORING_AGENTS.urban.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={MONITORING_AGENTS.urban.functions[1]} color={MONITORING_AGENTS.urban.color} isActive={activeMetric === MONITORING_AGENTS.urban.functions[1].id} onClick={() => handleMetricClick(MONITORING_AGENTS.urban.functions[1].id)} layout="half" />
               <FunctionCard item={MONITORING_AGENTS.urban.functions[2]} color={MONITORING_AGENTS.urban.color} isActive={activeMetric === MONITORING_AGENTS.urban.functions[2].id} onClick={() => handleMetricClick(MONITORING_AGENTS.urban.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={MONITORING_AGENTS.condition.title} icon={<MONITORING_AGENTS.condition.icon className="w-5 h-5" color={MONITORING_AGENTS.condition.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.55] min-h-0 w-full"><FunctionCard item={MONITORING_AGENTS.condition.functions[0]} color={MONITORING_AGENTS.condition.color} isActive={activeMetric === MONITORING_AGENTS.condition.functions[0].id} onClick={() => handleMetricClick(MONITORING_AGENTS.condition.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.45] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={MONITORING_AGENTS.condition.functions[1]} color={MONITORING_AGENTS.condition.color} isActive={activeMetric === MONITORING_AGENTS.condition.functions[1].id} onClick={() => handleMetricClick(MONITORING_AGENTS.condition.functions[1].id)} layout="half" />
               <FunctionCard item={MONITORING_AGENTS.condition.functions[2]} color={MONITORING_AGENTS.condition.color} isActive={activeMetric === MONITORING_AGENTS.condition.functions[2].id} onClick={() => handleMetricClick(MONITORING_AGENTS.condition.functions[2].id)} layout="half" />
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
        <WidgetPanel title={MONITORING_AGENTS.tracker.title} icon={<MONITORING_AGENTS.tracker.icon className="w-5 h-5" color={MONITORING_AGENTS.tracker.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.6] min-h-0 w-full"><FunctionCard item={MONITORING_AGENTS.tracker.functions[0]} color={MONITORING_AGENTS.tracker.color} isActive={activeMetric === MONITORING_AGENTS.tracker.functions[0].id} onClick={() => handleMetricClick(MONITORING_AGENTS.tracker.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.4] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={MONITORING_AGENTS.tracker.functions[1]} color={MONITORING_AGENTS.tracker.color} isActive={activeMetric === MONITORING_AGENTS.tracker.functions[1].id} onClick={() => handleMetricClick(MONITORING_AGENTS.tracker.functions[1].id)} layout="half" />
               <FunctionCard item={MONITORING_AGENTS.tracker.functions[2]} color={MONITORING_AGENTS.tracker.color} isActive={activeMetric === MONITORING_AGENTS.tracker.functions[2].id} onClick={() => handleMetricClick(MONITORING_AGENTS.tracker.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
        <WidgetPanel title={MONITORING_AGENTS.learning.title} icon={<MONITORING_AGENTS.learning.icon className="w-5 h-5" color={MONITORING_AGENTS.learning.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.6] min-h-0 w-full"><FunctionCard item={MONITORING_AGENTS.learning.functions[0]} color={MONITORING_AGENTS.learning.color} isActive={activeMetric === MONITORING_AGENTS.learning.functions[0].id} onClick={() => handleMetricClick(MONITORING_AGENTS.learning.functions[0].id)} layout="full" /></div>
            <div className="flex-[0.4] min-h-0 w-full grid grid-cols-2 gap-2">
               <FunctionCard item={MONITORING_AGENTS.learning.functions[1]} color={MONITORING_AGENTS.learning.color} isActive={activeMetric === MONITORING_AGENTS.learning.functions[1].id} onClick={() => handleMetricClick(MONITORING_AGENTS.learning.functions[1].id)} layout="half" />
               <FunctionCard item={MONITORING_AGENTS.learning.functions[2]} color={MONITORING_AGENTS.learning.color} isActive={activeMetric === MONITORING_AGENTS.learning.functions[2].id} onClick={() => handleMetricClick(MONITORING_AGENTS.learning.functions[2].id)} layout="half" />
            </div>
          </div>
        </WidgetPanel>
      </motion.div>
    </div>
  );
}