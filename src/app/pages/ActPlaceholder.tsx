import { Construction } from "lucide-react";
import { useLocation } from "react-router";

export default function ActPlaceholder() {
  const location = useLocation();
  const path = location.pathname;
  
  const labels: Record<string, string> = {
    "/diagnostics_and_forecasting": "Act I: Diagnostics and Forecasting",
    "/simulation": "Act III: Impact Simulation and Feasibility Assessment",
    "/monitoring": "Act IV: Monitoring and Improvement",
  };

  const title = labels[path] || "Page Under Construction";

  return (
    <div className="flex h-full w-full items-center justify-center p-8 bg-slate-900/40 backdrop-blur-md rounded-xl border border-green-700/20 shadow-[inset_0_0_50px_rgba(22,163,74,0.05)] relative overflow-hidden pointer-events-auto">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-700/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col items-center text-center space-y-6 relative z-10 p-12 bg-slate-950/80 rounded-2xl border border-green-700/30 shadow-[0_0_30px_rgba(22,163,74,0.1)]">
        
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
          <Construction className="w-24 h-24 text-yellow-500 relative z-10 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
        </div>
        
        <h2 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-100 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
          {title}
        </h2>
        
        <p className="text-green-200/60 max-w-lg leading-relaxed text-sm tracking-wide font-mono">
          Data for this module is currently being computed and rendered by specialized Agents. 
          Full monitoring feeds are being synchronized. Please stand by.
        </p>

        <div className="flex items-center space-x-2 text-xs font-mono text-yellow-500/50 mt-8 border border-yellow-500/20 px-4 py-2 rounded-full bg-green-950/40">
           <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></span>
           <span>AGENT SYNCHRONIZATION IN PROGRESS...</span>
        </div>

      </div>
    </div>
  );
}