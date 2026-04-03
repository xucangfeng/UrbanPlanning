import { useRef, useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { ShieldCheck, Wind, Target, Activity as ActivityIcon } from 'lucide-react';

const INITIAL_VIEW_STATE = {
  longitude: 45.0792,
  latitude: 23.8859,
  zoom: 4.8,
  pitch: 20,
  bearing: 0
};

const ZONES = [
  { id: 'zone-1', name: '诊断预测', sub: '利雅得 — 流量与需求', lat: 24.7136, lng: 46.6753, color: '#00B558', icon: ActivityIcon, route: '/diagnostics_and_forecasting' },
  { id: 'zone-2', name: '优化配置', sub: '吉达 — 土地利用', lat: 21.5433, lng: 39.1728, color: '#FCD34D', icon: Target, route: '/optimization' },
  { id: 'zone-3', name: '模拟仿真', sub: 'NEOM — 未来建模', lat: 28.0068, lng: 35.1440, color: '#00B558', icon: Wind, route: '/simulation' },
  { id: 'zone-4', name: '监测改进', sub: '达曼 — 实时监测', lat: 26.3927, lng: 49.9777, color: '#FCD34D', icon: ShieldCheck, route: '/monitoring' },
];

export function GISMapBackground() {
  const navigate = useNavigate();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const location = useLocation();
  const mapRef = useRef<any>(null);

  // When route changes, fly to the specific zone
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (location.pathname === '/') {
      mapRef.current.flyTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        duration: 2000
      });
    } else {
      const zone = ZONES.find(z => location.pathname.startsWith(z.route));
      if (zone) {
        mapRef.current.flyTo({
          center: [zone.lng, zone.lat],
          zoom: 12,
          pitch: 60,
          bearing: 15,
          duration: 2500
        });
      }
    }
  }, [location.pathname]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-auto bg-[#020805]">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {ZONES.map((zone) => {
          const isActive = location.pathname.startsWith(zone.route);
          const Icon = zone.icon;
          
          return (
            <Marker
              key={zone.id}
              longitude={zone.lng}
              latitude={zone.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                navigate(zone.route);
              }}
            >
              <div 
                className="relative flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                {/* Floating Info Box */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: (hoveredZone === zone.id || isActive) ? 1 : 0.8, 
                    y: (hoveredZone === zone.id || isActive) ? 0 : 5,
                    scale: (hoveredZone === zone.id || isActive) ? 1.05 : 1
                  }}
                  className="flex flex-col gap-1.5 px-4 py-3 mb-2 bg-[#020b14]/95 backdrop-blur-xl border rounded-sm transition-all shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
                  style={{
                    boxShadow: (hoveredZone === zone.id || isActive) ? `0 0 35px ${zone.color}C0, inset 0 0 15px ${zone.color}30` : `0 4px 20px rgba(0,0,0,0.9), 0 0 20px ${zone.color}80`,
                    borderColor: (hoveredZone === zone.id || isActive) ? zone.color : `${zone.color}A0`,
                    borderWidth: (hoveredZone === zone.id || isActive) ? '2px' : '1px',
                    backgroundColor: (hoveredZone === zone.id || isActive) ? '#020b14' : 'rgba(2,11,20,0.95)'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 drop-shadow-[0_0_8px_currentColor]" style={{ color: zone.color }} />
                    <span className="text-[13px] font-bold tracking-wider whitespace-nowrap drop-shadow-[0_0_8px_currentColor]" style={{ color: zone.color }}>
                      {zone.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono pl-6 uppercase tracking-widest">{zone.sub}</span>
                </motion.div>

                {/* Animated Center Point */}
                <div className="relative flex items-center justify-center w-8 h-8">
                  <motion.div 
                    className="absolute w-full h-full rounded-full border border-dashed"
                    style={{ borderColor: zone.color, opacity: isActive ? 1 : 0.4 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                  {isActive && (
                    <motion.div 
                      className="absolute w-20 h-20 rounded-full border border-2"
                      style={{ borderColor: zone.color }}
                      animate={{ scale: [0.5, 1.5], opacity: [0.8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_15px_currentColor]"
                    style={{ backgroundColor: zone.color, color: zone.color }}
                  />
                </div>

                {/* Vertical connecting line */}
                <div className="w-[1px] h-8 bg-gradient-to-t to-transparent opacity-60 mt-1" style={{ backgroundImage: `linear-gradient(to top, transparent, ${zone.color})` }} />
              </div>
            </Marker>
          );
        })}
      </Map>
      <div className="absolute inset-0 bg-gradient-to-br from-[#002b12]/40 via-[#011409]/20 to-[#02210b]/40 pointer-events-none" />
    </div>
  );
}