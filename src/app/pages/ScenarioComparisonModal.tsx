import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { X } from 'lucide-react';
import { generateRiyadhHeatmap } from './SimulationMapHelper';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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

export function ScenarioComparisonModal({ onClose }: { onClose: () => void }) {
  const scheme1Data = useMemo(() => generateRiyadhHeatmap(1), []);
  const scheme2Data = useMemo(() => generateRiyadhHeatmap(2), []);

  const chartData = [
    { time: '0:00', s1: 5, s2: 5 },
    { time: '4:00', s1: 4.8, s2: 4 },
    { time: '8:00', s1: 6.5, s2: 3.5 },
    { time: '12:00', s1: 7.2, s2: 2.8 },
    { time: '16:00', s1: 8.5, s2: 2.2 },
    { time: '20:00', s1: 9.8, s2: 1.5 },
    { time: '24:00', s1: 10, s2: 1.2 },
  ];

  const mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
  const initialViewState = { longitude: 46.72, latitude: 24.68, zoom: 10.5, pitch: 0, bearing: 0 };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#020502]/90 backdrop-blur-lg p-8 pointer-events-auto"
    >
      <div className="relative w-full max-w-[1200px] bg-[#0a140a]/90 border border-[#00B558]/30 rounded-lg p-6 shadow-[0_0_50px_rgba(0,181,88,0.15)] flex flex-col gap-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex gap-6 h-[400px]">
          {/* 地图1 */}
          <div className="flex-1 flex flex-col gap-2 relative">
            <h3 className="text-[#00B558] text-[11px] font-bold tracking-[0.2em] uppercase">方案1（住宅主导型）</h3>
            <div className="flex-1 rounded-sm overflow-hidden border border-[#00B558]/30 relative">
               <Map 
                  initialViewState={initialViewState} 
                  mapStyle={mapStyle} 
                  interactive={false}
               >
                 <SafeSource type="geojson" data={scheme1Data as any}>
                   <SafeLayer 
                      id="s1-heatmap" 
                      type="heatmap" 
                      paint={{
                        'heatmap-weight': ['get', 'weight'],
                        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 15, 3.5],
                        'heatmap-color': [
                          'interpolate', ['linear'], ['heatmap-density'],
                          0, 'rgba(0, 181, 88, 0)',
                          0.2, 'rgba(0, 181, 88, 0.6)',
                          0.5, 'rgba(252, 211, 77, 0.8)',
                          0.8, 'rgba(255, 68, 68, 0.95)',
                          1, 'rgba(255, 255, 255, 1)'
                        ],
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 20],
                        'heatmap-opacity': 0.95
                      }} 
                   />
                 </SafeSource>
               </Map>
               <div className="absolute inset-0 border border-white/5 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          {/* 地图2 */}
          <div className="flex-1 flex flex-col gap-2 relative">
            <h3 className="text-[#FCD34D] text-[11px] font-bold tracking-[0.2em] uppercase">方案2（商住混合型）</h3>
            <div className="flex-1 rounded-sm overflow-hidden border border-[#FCD34D]/30 relative">
               <Map 
                  initialViewState={initialViewState} 
                  mapStyle={mapStyle} 
                  interactive={false}
               >
                 <SafeSource type="geojson" data={scheme2Data as any}>
                   <SafeLayer 
                      id="s2-heatmap" 
                      type="heatmap" 
                      paint={{
                        'heatmap-weight': ['get', 'weight'],
                        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 15, 3.5],
                        'heatmap-color': [
                          'interpolate', ['linear'], ['heatmap-density'],
                          0, 'rgba(0, 181, 88, 0)',
                          0.2, 'rgba(0, 181, 88, 0.6)',
                          0.5, 'rgba(252, 211, 77, 0.8)',
                          0.8, 'rgba(255, 68, 68, 0.95)',
                          1, 'rgba(255, 255, 255, 1)'
                        ],
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 20],
                        'heatmap-opacity': 0.95
                      }} 
                   />
                 </SafeSource>
               </Map>
               <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-md shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />
            </div>
          </div>
        </div>

        {/* 底部面板 */}
        <div className="flex gap-6 h-[120px]">
          <div className="flex-1 flex flex-col justify-end relative">
             <div className="flex justify-between items-center mb-2">
               <h4 className="text-gray-300 text-xs font-bold tracking-widest uppercase">拥堵趋势</h4>
               <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-[#00B558] bg-[#00B558]/20" />方案1</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-[#FCD34D] bg-[#FCD34D]/20" />方案2</div>
               </div>
             </div>
             <div className="flex-1 w-full min-h-0 border border-[#00B558]/30 bg-black/40 p-2">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorS1" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#00B558" stopOpacity={0.5}/>
                           <stop offset="95%" stopColor="#00B558" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorS2" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.5}/>
                           <stop offset="95%" stopColor="#FCD34D" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                     <XAxis dataKey="time" hide />
                     <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 10 }} domain={[0, 10]} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0a140a', border: '1px solid #00B55840', borderRadius: '4px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="s1" stroke="#00B558" strokeWidth={2} fillOpacity={1} fill="url(#colorS1)" />
                     <Area type="monotone" dataKey="s2" stroke="#FCD34D" strokeWidth={2} fillOpacity={1} fill="url(#colorS2)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="w-[450px] flex flex-col justify-center text-[10px] font-bold tracking-widest uppercase mt-6 pl-6 border-l border-[#00B558]/30 space-y-1">
             <div className="flex flex-col gap-1 bg-[#00B558]/10 p-2.5 border border-[#00B558]/30">
               <div className="text-[#00B558]">方案1（住宅主导型）</div>
               <div className="text-white">拥堵指数: 4.5 - 6.0</div>
             </div>
             <div className="text-center text-[#FCD34D] text-[10px] leading-none py-0.5">对比</div>
             <div className="flex flex-col gap-1 bg-[#FCD34D]/10 p-2.5 border border-[#FCD34D]/30">
               <div className="text-[#FCD34D]">方案2（商住混合型）</div>
               <div className="text-white">流量: 2500 - 3500 辆/小时</div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}