import { ReactNode } from "react";
import { cn } from "./DashboardLayout";

interface WidgetPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function WidgetPanel({ title, icon, children, className }: WidgetPanelProps) {
  // Parse title to separate main title and agent name
  const match = title.match(/^(.+?)\s*\((.+)\)$/);
  const mainTitle = match ? match[1] : title;
  const agentName = match ? match[2] : null;

  return (
    <div className={cn("flex flex-col relative z-10 w-full bg-[#0a140a]/90 p-2.5 rounded-md border border-[#00B558]/40 shadow-[inset_0_0_30px_rgba(0,181,88,0.1)] backdrop-blur-md", className)}>
      {/* Header */}
      <div className="flex flex-col mb-2">
        <div className="flex items-center space-x-2">
          {icon && <span className="w-4 h-4 drop-shadow-[0_0_8px_currentColor]">{icon}</span>}
          <h3 className="text-[#e2e8f0] text-sm font-bold tracking-widest drop-shadow-md uppercase">
            {mainTitle}
            {agentName && (
              <span className="text-[10px] font-normal text-gray-400 ml-1.5 normal-case tracking-normal">
                ({agentName})
              </span>
            )}
          </h3>
        </div>
        {/* Fading underline mimicking the image */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-[#00B558]/80 via-[#00B558]/30 to-transparent mt-1.5 shadow-[0_0_10px_rgba(0,181,88,0.6)]" />
      </div>

      {/* Content */}
      <div className="flex-1 w-full flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}