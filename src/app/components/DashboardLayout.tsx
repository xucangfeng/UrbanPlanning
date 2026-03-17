import { Outlet, NavLink, useLocation } from "react-router";
import { Sun, Bell, User, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { GISMapBackground } from "./GISMapBackground";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Route → Header config (must be before DashboardLayout) ─────────────────
const ROUTE_CONFIG: Record<string, { title: string; subtitle: string; city: string; temp: string; weather: string }> = {
  '/':             { title: 'OVERALL URBAN PLANNING PANORAMA',   subtitle: 'National Overview',              city: 'Saudi Arabia', temp: '32°C', weather: 'Clear' },
  '/act1':         { title: 'DIAGNOSTICS AND FORECASTING',    subtitle: 'Anomaly Detection & Root Cause', city: 'Riyadh',       temp: '28°C', weather: 'Sunny' },
  '/optimization': { title: 'LAND USE OPTIMIZATION AND ZONING',  subtitle: 'Urban Planning Companion',       city: 'Riyadh',       temp: '28°C', weather: 'Sunny' },
  '/act3':         { title: 'IMPACT SIMULATION AND FEASIBILITY ASSESSMENT',           subtitle: 'Predictive Modeling',            city: 'Riyadh',       temp: '28°C', weather: 'Sunny' },
  '/act4':         { title: 'MONITORING AND IMPROVEMENT',    subtitle: 'Live Telemetry',                 city: 'Riyadh',       temp: '28°C', weather: 'Sunny' },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });
  const dateString = time.toISOString().split('T')[0];

  return (
    <div className="flex flex-col leading-tight font-mono text-slate-100">
      <span className="text-base tracking-widest font-semibold">{timeString}</span>
      <span className="text-[11px] text-green-300">{dateString}</span>
    </div>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const routeInfo = ROUTE_CONFIG[location.pathname] ?? ROUTE_CONFIG['/'];

  return (
    <div className="relative w-screen h-screen bg-[#020805] text-slate-100 font-sans overflow-hidden flex flex-col">
      {/* Background Image Setup - Upgraded for more interactive GIS Map */}
      <GISMapBackground />
      
      {/* Radial vignette to keep edges dark and focus on center */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_20%,#020b14_100%)] opacity-70 pointer-events-none" />
      
      {/* Overall Overlay for darkening and color-shifting the map */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#041015]/40 via-transparent to-[#040f1c]/60 pointer-events-none" />

      {/* Top Header */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-start pointer-events-none">
        {/* Left Segment */}
        <div 
          className="relative bg-gradient-to-r from-[#0d3b1e]/90 to-[#102a1a]/60 backdrop-blur-md h-16 flex items-center px-6 pr-24 border-b-2 border-green-500/80 shadow-[0_4px_15px_rgba(34,197,94,0.2)] pointer-events-auto"
          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
        >
          {/* Top Green Accent Line */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-[3px] bg-green-500 shadow-[0_0_12px_#22c55e]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className="flex items-center gap-8 text-white text-sm">
            <div className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]" />
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-base tracking-wide">{routeInfo.temp}</span>
                <span className="text-[11px] text-green-300">{routeInfo.weather}</span>
              </div>
            </div>
            <div className="font-bold text-xl tracking-wider text-green-50">{routeInfo.city}</div>
            <LiveClock />
          </div>
        </div>

        {/* Center Segment */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[72px] flex flex-col items-center justify-start pt-2 px-12 md:px-16 w-[700px] md:w-[800px] z-10 pointer-events-auto">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-[#0b2918] to-[#041209]/80 backdrop-blur-md border-b-[3px] border-green-500/90 shadow-[0_8px_30px_rgba(34,197,94,0.3)]"
            style={{ clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0 100%)' }}
          />
          <div className="relative z-20 flex flex-col items-center mt-1 w-full">
            <span className="text-[11px] font-medium text-slate-300 tracking-[0.1em] mb-0.5 opacity-90 uppercase">
              {routeInfo.subtitle}
            </span>
            <h1 className="text-lg md:text-[19px] font-bold text-white tracking-wider md:tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] whitespace-nowrap text-center">
              {routeInfo.title}
            </h1>
          </div>
        </div>

        {/* Right Segment */}
        <div 
          className="relative bg-gradient-to-l from-[#0d3b1e]/90 to-[#102a1a]/60 backdrop-blur-md h-16 flex items-center px-6 pl-24 border-b-2 border-green-500/80 shadow-[0_4px_15px_rgba(34,197,94,0.2)] pointer-events-auto"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)' }}
        >
          {/* Top Green Accent Line */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-[3px] bg-green-500 shadow-[0_0_12px_#22c55e]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div className="flex items-center gap-6 text-white ml-auto">
            <div className="relative cursor-pointer mr-2 group">
              <Bell className="w-5 h-5 text-green-100 group-hover:text-white transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] group-hover:scale-110" />
              <span className="absolute -top-1.5 -right-2 w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold border border-[#041209] shadow-[0_0_5px_rgba(239,68,68,0.8)] group-hover:bg-red-400 transition-colors">
                12
              </span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer group hover:bg-[#16a34a]/15 px-2 py-1.5 rounded-sm transition-all duration-300 border border-transparent hover:border-[#16a34a]/40">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#16a34a]/50 shadow-[0_0_12px_rgba(22,163,74,0.3)] group-hover:border-[#16a34a] transition-all overflow-hidden p-0.5">
                 <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" alt="H.E. Minister" className="w-full h-full object-cover rounded-full" />
                 <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"></div>
              </div>
              <span className="text-xs font-bold tracking-widest text-[#22c55e] group-hover:text-white transition-colors uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">H.E. Minister View</span>
              <ChevronDown className="w-3 h-3 text-[#22c55e]/70 group-hover:text-[#22c55e] transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-hidden pointer-events-none flex flex-col">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div 
          className="bg-[#0c1a06]/90 backdrop-blur-lg h-12 px-12 flex items-center justify-center border-t border-[#16a34a]/40 shadow-[0_-10px_30px_rgba(22,163,74,0.05)]"
          style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)' }}
        >
          <nav className="flex space-x-8 items-center">
            <NavItem to="/" label="PANORAMA" color="text-[#eab308]" glow="rgba(234,179,8,0.8)" />
            <NavItem to="/act1" label="DIAGNOSTICS" color="text-[#22c55e]" glow="rgba(34,197,94,0.8)" />
            <NavItem to="/optimization" label="OPTIMIZATION" color="text-[#facc15]" glow="rgba(250,204,21,0.8)" isTarget={true} />
            <NavItem to="/act3" label="SIMULATION" color="text-[#047857]" glow="rgba(4,120,87,0.8)" />
            <NavItem to="/act4" label="MONITORING" color="text-[#ca8a04]" glow="rgba(202,138,4,0.8)" />
          </nav>
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, label, color, glow, isTarget }: { to: string, label: string, color: string, glow: string, isTarget?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "text-xs font-bold tracking-[0.15em] transition-all duration-300 relative px-2 py-1",
        isActive 
          ? `${color} drop-shadow-[0_0_8px_${glow}]` 
          : "text-slate-400 hover:text-white",
        !isActive && isTarget && "animate-pulse"
      )}
    >
      {({ isActive }) => (
        <>
          <span className={cn(!isActive && isTarget && color)}>{label}</span>
          {isActive && (
            <motion.span 
              layoutId="nav-indicator"
              className="block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color.replace('text-', '').replace(/[\[\]]/g, ''), boxShadow: `0 0 10px ${glow}` }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}