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
      { time: '1月', reported: 490, detected: 490 },
      { time: '2月', reported: 492, detected: 493 },
      { time: '3月', reported: 494, detected: 496 },
      { time: '4月', reported: 495, detected: 498 },
      { time: '5月', reported: 496, detected: 501 },
      { time: '6月', reported: 497, detected: 504 },
      { time: '7月', reported: 498, detected: 507 },
      { time: '8月', reported: 499, detected: 509 },
      { time: '9月', reported: 499, detected: 511 },
      { time: '10月', reported: 500, detected: 512 },
      { time: '11月', reported: 500, detected: 513.5 },
      { time: '12月', reported: 500, detected: 514.2 }
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

    // Development Pipeline Data - Urban Monitoring Module
    // 追踪沙特2030愿景重点城市开发项目进度（与CAPEX UTILIZATION呼应：在建项目 vs 已建成项目）
    // 当前时间：2026年，所有项目均为正在进行中（deadline > 2026）
    // 
    // 进度状态判断逻辑：
    // 计划进度 = (当前年份 - 起始年份 + 1) / (截止年份 - 起始年份 + 1) × 100
    // AHEAD: 实际进度 > 计划进度 + 5%
    // DELAYED: 实际进度 < 计划进度 - 5%
    // ON TRACK: 计划进度 - 5% ≤ 实际进度 ≤ 计划进度 + 5%
    devProjects: [
      // ==================== 进度超前项目 (AHEAD) ====================
      {
        id: 1,
        name: "NEOM - The Line",
        code: "NEOM-TL",
        type: "Mega City",
        location: "Tabuk Region",
        totalArea: 170, // KM of linear city
        progress: 72.4, // 123/170 = 72.4% (计划60%，实际72.4%，超前+12.4%)
        budget: 500, // Billion SAR
        spent: 362.0,
        milestone: "Phase 2 Infrastructure",
        deadline: "2030",
        status: "ahead",
        // 计划进度: (2026-2021+1)/(2030-2021+1) = 6/10 = 60%
        aiRecommendation: "卫星影像确认速度较基线快+28%。激光雷达显示结构完整性提前完成。",
        aiAction: "推进至第二阶段",
        spatialChange: [
          { year: '2021', developed: 0, planned: 170 },
          { year: '2022', developed: 18, planned: 170 },
          { year: '2023', developed: 42, planned: 170 },
          { year: '2024', developed: 68, planned: 170 },
          { year: '2025', developed: 95, planned: 170 },
          { year: '2026', developed: 123, planned: 170 }, // 实际123KM > 计划102KM
          { year: '2027', developed: 142, planned: 170, projected: true },
          { year: '2028', developed: 156, planned: 170, projected: true },
          { year: '2029', developed: 165, planned: 170, projected: true },
          { year: '2030', developed: 170, planned: 170, projected: true }
        ]
      },
      {
        id: 2,
        name: "Diriyah Gate Phase 2",
        code: "DG-P2",
        type: "Heritage",
        location: "Riyadh",
        totalArea: 22, // KM² (Phase 2 expansion)
        progress: 86.4, // 19/22 = 86.4% (计划71.4%，实际86.4%，超前+15%)
        budget: 45, // Billion SAR
        spent: 38.9,
        milestone: "Cultural District Open",
        deadline: "2028",
        status: "ahead",
        // 计划进度: (2026-2022+1)/(2028-2022+1) = 5/7 = 71.4%
        aiRecommendation: "航测检测保护工作提前+18%。地面传感器确认游客接待能力就绪。",
        aiAction: "加速旅游开放",
        spatialChange: [
          { year: '2022', developed: 0, planned: 22 },
          { year: '2023', developed: 4.5, planned: 22 },
          { year: '2024', developed: 10.0, planned: 22 },
          { year: '2025', developed: 14.5, planned: 22 },
          { year: '2026', developed: 19, planned: 22 }, // 实际19KM² > 计划15.7KM²
          { year: '2027', developed: 21, planned: 22, projected: true },
          { year: '2028', developed: 22, planned: 22, projected: true }
        ]
      },
      // ==================== 进度落后项目 (DELAYED) ====================
      {
        id: 3,
        name: "New Murabba",
        code: "NM",
        type: "Downtown",
        location: "Riyadh",
        totalArea: 19, // KM²
        progress: 26.3, // 5/19 = 26.3% (计划60%，实际26.3%，落后-33.7%)
        budget: 104, // Billion SAR
        spent: 27.4,
        milestone: "Foundation Stalled",
        deadline: "2030",
        status: "delayed",
        // 计划进度: (2026-2021+1)/(2030-2021+1) = 6/10 = 60%
        aiRecommendation: "激光雷达揭示地基因土壤成分导致延误。热成像显示设备闲置42%。",
        aiAction: "紧急增加25%人力",
        spatialChange: [
          { year: '2021', developed: 0, planned: 19 },
          { year: '2022', developed: 0.3, planned: 19 },
          { year: '2023', developed: 0.8, planned: 19 },
          { year: '2024', developed: 1.8, planned: 19 },
          { year: '2025', developed: 3.2, planned: 19 },
          { year: '2026', developed: 5, planned: 19 }, // 实际5KM² << 计划11.4KM²
          { year: '2027', developed: 8.5, planned: 19, projected: true },
          { year: '2028', developed: 12.5, planned: 19, projected: true },
          { year: '2029', developed: 16, planned: 19, projected: true },
          { year: '2030', developed: 19, planned: 19, projected: true }
        ]
      },
      {
        id: 4,
        name: "Riyadh Metro Extension PH3",
        code: "RME-PH3",
        type: "Infrastructure",
        location: "Riyadh",
        totalArea: 45, // KM of track
        progress: 33.3, // 15/45 = 33.3% (计划62.5%，实际33.3%，落后-29.2%)
        budget: 28, // Billion SAR
        spent: 9.3,
        milestone: "Track Laying",
        deadline: "2029",
        status: "delayed",
        // 计划进度: (2026-2022+1)/(2029-2022+1) = 5/8 = 62.5%
        aiRecommendation: "探地雷达检测到不稳定底层。卫星显示材料交付较计划减少35%。",
        aiAction: "需要工程审查",
        spatialChange: [
          { year: '2022', developed: 0, planned: 45 },
          { year: '2023', developed: 1.5, planned: 45 },
          { year: '2024', developed: 4.5, planned: 45 },
          { year: '2025', developed: 9, planned: 45 },
          { year: '2026', developed: 15, planned: 45 }, // 实际15KM << 计划28.1KM
          { year: '2027', developed: 26, planned: 45, projected: true },
          { year: '2028', developed: 38, planned: 45, projected: true },
          { year: '2029', developed: 45, planned: 45, projected: true }
        ]
      },
      // ==================== 正常推进项目 (ON TRACK) ====================
      {
        id: 5,
        name: "Red Sea Global Phase 2",
        code: "RSG-P2",
        type: "Tourism",
        location: "Red Sea Coast",
        totalArea: 35, // KM² (Phase 2 expansion)
        progress: 74.3, // 26/35 = 74.3% (计划71.4%，实际74.3%，偏差+2.9%)
        budget: 32, // Billion SAR
        spent: 23.8,
        milestone: "Resort Islands Ready",
        deadline: "2028",
        status: "on-track",
        // 计划进度: (2026-2022+1)/(2028-2022+1) = 5/7 = 71.4%
        aiRecommendation: "地理空间数据确认时间线对齐。无人机调查显示珊瑚保护按计划进行。",
        aiAction: "维持当前进度",
        spatialChange: [
          { year: '2022', developed: 0, planned: 35 },
          { year: '2023', developed: 4.0, planned: 35 },
          { year: '2024', developed: 10.0, planned: 35 },
          { year: '2025', developed: 17.5, planned: 35 },
          { year: '2026', developed: 26, planned: 35 }, // 实际26KM² ≈ 计划25KM²
          { year: '2027', developed: 31, planned: 35, projected: true },
          { year: '2028', developed: 35, planned: 35, projected: true }
        ]
      },
      {
        id: 6,
        name: "Qiddiya Entertainment",
        code: "QD",
        type: "Entertainment",
        location: "Riyadh Province",
        totalArea: 366, // KM²
        progress: 76.5, // 280/366 = 76.5% (计划75%，实际76.5%，偏差+1.5%)
        budget: 75, // Billion SAR
        spent: 57.4,
        milestone: "Six Flags Opening Q4",
        deadline: "2028",
        status: "on-track",
        // 计划进度: (2026-2021+1)/(2028-2021+1) = 6/8 = 75%
        aiRecommendation: "卫星追踪显示建设稳定。激光雷达确认游乐设施基础已完成。",
        aiAction: "按计划Q4开业",
        spatialChange: [
          { year: '2021', developed: 0, planned: 366 },
          { year: '2022', developed: 25, planned: 366 },
          { year: '2023', developed: 70, planned: 366 },
          { year: '2024', developed: 140, planned: 366 },
          { year: '2025', developed: 210, planned: 366 },
          { year: '2026', developed: 280, planned: 366 }, // 实际280KM² ≈ 计划274.5KM²
          { year: '2027', developed: 330, planned: 366, projected: true },
          { year: '2028', developed: 366, planned: 366, projected: true }
        ]
      },
    ],

    // Land Use Transformation Data - Change Tracker Agent (2017-2026)
    landUseChange: [
      { year: '2017', residential: 438, commercial: 89, green: 9.0, industrial: 125, total: 661.0 },
      { year: '2018', residential: 458, commercial: 94, green: 9.8, industrial: 132, total: 693.8 },
      { year: '2019', residential: 480, commercial: 100, green: 10.5, industrial: 140, total: 730.5 },
      { year: '2020', residential: 505, commercial: 108, green: 11.2, industrial: 148, total: 772.2 },
      { year: '2021', residential: 532, commercial: 115, green: 12.0, industrial: 156, total: 815.0 },
      { year: '2022', residential: 562, commercial: 124, green: 12.8, industrial: 165, total: 863.8 },
      { year: '2023', residential: 595, commercial: 134, green: 13.5, industrial: 175, total: 917.5 },
      { year: '2024', residential: 630, commercial: 145, green: 14.2, industrial: 185, total: 974.2 },
      { year: '2025', residential: 665, commercial: 158, green: 14.6, industrial: 200, total: 1037.6, projected: true },
      { year: '2026', residential: 705, commercial: 172, green: 15.0, industrial: 218, total: 1110.0, projected: true }
    ],
    greenSpaceRegional: [
      { region: "利雅得", current: 12.8, target: 15.0, growth: 0.6, status: "on-track" },
      { region: "吉达", current: 11.5, target: 15.0, growth: 0.5, status: "attention" },
      { region: "麦加", current: 14.2, target: 15.0, growth: 0.8, status: "exceeding" },
      { region: "麦地那", current: 13.8, target: 15.0, growth: 0.7, status: "on-track" },
      { region: "达曼", current: 10.8, target: 15.0, growth: 0.4, status: "critical" },
      { region: "塔布克", current: 15.5, target: 15.0, growth: 1.2, status: "exceeding" },
    ],

    // CAPEX Projects Data - sorted by idle rate (highest first)
    capexProjects: [
      { 
        id: 1, 
        name: "利雅得地铁二期扩展", 
        code: "RME-PH2",
        idleRate: 78.5, 
        budget: 4.2, 
        spent: 1.8, 
        phase: "PH2",
        recommendation: "DEFER",
        yieldData: [
          { time: 'M1', target: 85, actual: 8 },
          { time: 'M2', target: 85, actual: 12 },
          { time: 'M3', target: 85, actual: 15 },
          { time: 'M4', target: 85, actual: 18 },
          { time: 'M5', target: 85, actual: 22 },
          { time: 'M6', target: 85, actual: 24.5 },
          { time: 'M7', target: 85, actual: 23.8 },
          { time: 'M8', target: 85, actual: 25.0 },
          { time: 'M9', target: 85, actual: 24.2 },
          { time: 'M10', target: 85, actual: 23.5 },
          { time: 'M11', target: 85, actual: 24.0 },
          { time: 'M12', target: 85, actual: 24.5 }
        ]
      },
      { 
        id: 2, 
        name: "吉达滨水区三期开发", 
        code: "JWD-PH3",
        idleRate: 68.4, 
        budget: 3.8, 
        spent: 2.1, 
        phase: "PH3",
        recommendation: "REVIEW",
        yieldData: [
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
      },
      { 
        id: 3, 
        name: "达曼工业区", 
        code: "DIZ-01",
        idleRate: 52.3, 
        budget: 2.5, 
        spent: 1.9, 
        phase: "PH1",
        recommendation: "PROCEED",
        yieldData: [
          { time: 'M1', target: 85, actual: 35 },
          { time: 'M2', target: 85, actual: 42 },
          { time: 'M3', target: 85, actual: 48 },
          { time: 'M4', target: 85, actual: 52 },
          { time: 'M5', target: 85, actual: 58 },
          { time: 'M6', target: 85, actual: 62.3 },
          { time: 'M7', target: 85, actual: 65.1 },
          { time: 'M8', target: 85, actual: 68.5 },
          { time: 'M9', target: 85, actual: 70.2 },
          { time: 'M10', target: 85, actual: 72.8 },
          { time: 'M11', target: 85, actual: 74.5 },
          { time: 'M12', target: 85, actual: 76.2 }
        ]
      },
      { 
        id: 4, 
        name: "麦加交通枢纽", 
        code: "MTH-02",
        idleRate: 41.8, 
        budget: 5.1, 
        spent: 4.2, 
        phase: "PH2",
        recommendation: "PROCEED",
        yieldData: [
          { time: 'M1', target: 85, actual: 55 },
          { time: 'M2', target: 85, actual: 58 },
          { time: 'M3', target: 85, actual: 62 },
          { time: 'M4', target: 85, actual: 65 },
          { time: 'M5', target: 85, actual: 68 },
          { time: 'M6', target: 85, actual: 70.5 },
          { time: 'M7', target: 85, actual: 72.3 },
          { time: 'M8', target: 85, actual: 74.1 },
          { time: 'M9', target: 85, actual: 75.8 },
          { time: 'M10', target: 85, actual: 77.2 },
          { time: 'M11', target: 85, actual: 78.5 },
          { time: 'M12', target: 85, actual: 79.8 }
        ]
      },
      { 
        id: 5, 
        name: "麦地那智慧城市一期", 
        code: "MSC-PH1",
        idleRate: 28.6, 
        budget: 1.8, 
        spent: 1.5, 
        phase: "PH1",
        recommendation: "PROCEED",
        yieldData: [
          { time: 'M1', target: 85, actual: 62 },
          { time: 'M2', target: 85, actual: 68 },
          { time: 'M3', target: 85, actual: 72 },
          { time: 'M4', target: 85, actual: 75 },
          { time: 'M5', target: 85, actual: 78 },
          { time: 'M6', target: 85, actual: 80.2 },
          { time: 'M7', target: 85, actual: 81.5 },
          { time: 'M8', target: 85, actual: 82.8 },
          { time: 'M9', target: 85, actual: 83.5 },
          { time: 'M10', target: 85, actual: 84.1 },
          { time: 'M11', target: 85, actual: 84.8 },
          { time: 'M12', target: 85, actual: 85.2 }
        ]
      },
      { 
        id: 6, 
        name: "塔布克可再生能源", 
        code: "TRE-01",
        idleRate: 15.2, 
        budget: 1.2, 
        spent: 0.9, 
        phase: "PH1",
        recommendation: "PROCEED",
        yieldData: [
          { time: 'M1', target: 85, actual: 70 },
          { time: 'M2', target: 85, actual: 74 },
          { time: 'M3', target: 85, actual: 78 },
          { time: 'M4', target: 85, actual: 80 },
          { time: 'M5', target: 85, actual: 82 },
          { time: 'M6', target: 85, actual: 83.5 },
          { time: 'M7', target: 85, actual: 84.2 },
          { time: 'M8', target: 85, actual: 85.0 },
          { time: 'M9', target: 85, actual: 85.8 },
          { time: 'M10', target: 85, actual: 86.5 },
          { time: 'M11', target: 85, actual: 87.2 },
          { time: 'M12', target: 85, actual: 88.0 }
        ]
      },
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
    <div onClick={onClick} className={`p-2 border ${border} ${bg} ${shadow} rounded-md flex flex-col group min-h-0 relative transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:z-50 ${flex} ${className} ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-current' : 'cursor-default'}`}>
       <div className={`flex justify-between items-start shrink-0 mb-1 z-20 relative`}>
         <div className={`flex items-center gap-1.5 ${text}`}>
            <div className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md">{icon}</div>
            <span className="text-[10px] xl:text-[11px] font-bold tracking-widest uppercase group-hover:text-white transition-colors">{act}</span>
         </div>
         <div className={text}><InfoCircle /></div>
       </div>
       <div className={`flex flex-col flex-1 min-h-0 z-20 relative ${centered ? 'justify-center items-center' : 'justify-end'}`}>
          <div className="flex items-baseline justify-center w-full">
             <span className={`font-black tracking-tighter leading-none ${centered ? 'text-[22px] xl:text-[26px]' : 'text-[32px] xl:text-[38px]'} uppercase ${text} group-hover:scale-105 group-hover:text-white transition-all origin-left duration-300 drop-shadow-lg`}>
               {metric}
               {unit === '%' && <span className="text-xs xl:text-sm ml-0.5">%</span>}
             </span>
             {unit && unit !== '%' && <span className={`text-[9px] xl:text-[10px] font-bold tracking-widest uppercase ml-1.5 ${text}`}>{unit}</span>}
          </div>
          <span className={`text-[9px] xl:text-[10px] font-medium text-gray-500 tracking-wider mt-0.5 uppercase w-full truncate ${centered ? 'text-center mt-1.5' : 'text-left'} group-hover:text-gray-300 transition-colors`}>
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
        <span className="text-[10px] xl:text-[11px] text-[#FF4444] font-bold tracking-widest uppercase group-hover:text-white transition-colors drop-shadow-md">RECOMMENDATION: {title}</span>
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
        <p className="text-[10px] text-gray-300 mb-1.5 border-b border-[#00B558]/30 pb-1.5 uppercase tracking-wider">{`时间: ${label}`}</p>
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
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1); // Default to first project

  const handleMetricClick = (metric: string) => {
    setActiveTarget(metric);
    setIsTerminalOpen(true);
  };

  const selectedProject = data.capexProjects.find(p => p.id === selectedProjectId) || data.capexProjects[0];
  const [selectedDevProjectId, setSelectedDevProjectId] = useState<number>(1); // For Development Pipeline
  const selectedDevProject = data.devProjects.find(p => p.id === selectedDevProjectId) || data.devProjects[0];

  // 计算进度追踪数据
  const progressData = useMemo(() => {
    // 从项目的spatialChange数据中获取实际起始年份
    const projectStartYear = selectedDevProject.spatialChange.length > 0 
      ? parseInt(selectedDevProject.spatialChange[0].year) 
      : 2021;
    const endYear = parseInt(selectedDevProject.deadline);
    const currentYear = 2026;
    const years = [];
    
    for (let y = projectStartYear; y <= endYear; y++) {
      const spatialData = selectedDevProject.spatialChange.find(d => parseInt(d.year) === y);
      const totalYears = endYear - projectStartYear + 1;
      const planProgress = Math.min(100, ((y - projectStartYear + 1) / totalYears) * 100);
      
      // 2026年及之前显示实际进度，之后置空
      let actualProgress: number | null = null;
      if (y <= currentYear && spatialData) {
        actualProgress = (spatialData.developed / selectedDevProject.totalArea) * 100;
      }
      // y > currentYear 时 actualProgress 保持 null
      
      years.push({
        year: y.toString(),
        planProgress: parseFloat(planProgress.toFixed(1)),
        actualProgress: actualProgress !== null ? parseFloat(actualProgress.toFixed(1)) : null,
        projected: y > currentYear
      });
    }
    return years;
  }, [selectedDevProject]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-full w-full bg-[#020603] uppercase text-[#00B558] overflow-hidden"
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
            <WidgetPanel title="空间真相 (变化追踪智能体)" icon={<Eye className="w-4 h-4 text-[#3B82F6]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                <div className="flex gap-3 shrink-0">
                  <KpiCard act="总体规划" metric="500" unit="KM²" desc="已批配额" icon={<MapPin className="w-3.5 h-3.5" />} colorConfig={colors.blue} />
                  <KpiCard onClick={() => handleMetricClick('+2.8%')} act="偏差" metric="+2.8" unit="%" desc="足迹偏移" icon={<AlertTriangle className="w-3.5 h-3.5" />} colorConfig={colors.red} />
                </div>
                
                <ChartContainer title="城市扩展真相差距" subtitle="激光雷达扫描 vs 市政府报告" alert="差异: 14.2 KM²" hoverBorderColor="hover:border-[#3B82F6]" hoverShadow="hover:shadow-[0_0_20px_rgba(59,130,246,0.2),inset_0_0_15px_rgba(59,130,246,0.1)]">
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
                      <Area type="step" dataKey="reported" name="市政府" stroke="#3B82F6" strokeWidth={1.5} fill="url(#blueGrad)" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                      <Line type="step" dataKey="detected" name="激光雷达实测" stroke="#FF4444" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, fill: '#ff4444', stroke: '#020603', strokeWidth: 2 }} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ActionAlert title="Fin. Exposure" desc="如开发预估基础设施成本" value="24亿 SAR" />
              </div>
            </WidgetPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-[75%] flex flex-col min-w-0 h-full"
          >
            <WidgetPanel title="资本支出利用与资产生命周期 (状况监测智能体)" icon={<Building2 className="w-4 h-4 text-[#FCD34D]" />} className="flex-1 min-h-0">
              <div className="flex h-full min-h-0 p-2.5 gap-3">
                {/* Left: Project List (sorted by idle rate) */}
                <div className="w-[28%] flex flex-col min-h-0">
                  <div className="text-[9px] text-[#FCD34D] font-bold tracking-widest mb-1.5 px-1">按闲置率排列项目</div>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5">
                    {data.capexProjects.map((project) => {
                      const isSelected = project.id === selectedProjectId;
                      const idleColor = project.idleRate >= 60 ? "#FF4444" : project.idleRate >= 40 ? "#FCD34D" : "#00B558";
                      const recColor = project.recommendation === "DEFER" ? "#FF4444" : project.recommendation === "REVIEW" ? "#FCD34D" : "#00B558";
                      return (
                        <div
                          key={project.id}
                          onClick={() => setSelectedProjectId(project.id)}
                          className={`flex flex-col p-2 rounded border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#FCD34D]/15 border-[#FCD34D]/50 ring-1 ring-[#FCD34D]/30'
                              : 'bg-[#1e293b]/50 border-transparent hover:border-[#FCD34D]/30 hover:bg-[#FCD34D]/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{project.code}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${recColor}20`, color: recColor }}>{project.recommendation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-gray-500">闲置:</span>
                            <span className="text-[12px] font-black" style={{ color: idleColor }}>{project.idleRate}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Selected Project Details */}
                <div className="flex-1 flex flex-col min-h-0 gap-2">
                  {/* Project Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 bg-[#1e293b]/50 rounded border border-[#FCD34D]/20">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white">{selectedProject.name}</span>
                      <span className="text-[9px] text-gray-500">{selectedProject.code} | 预算: {selectedProject.budget}B SAR | 已用: {selectedProject.spent}B SAR</span>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                      selectedProject.recommendation === 'DEFER' ? 'bg-[#FF4444]/20 text-[#FF4444]' :
                      selectedProject.recommendation === 'REVIEW' ? 'bg-[#FCD34D]/20 text-[#FCD34D]' :
                      'bg-[#00B558]/20 text-[#00B558]'
                    }`}>
                      {selectedProject.recommendation} {selectedProject.phase}
                    </span>
                  </div>

                  {/* KPIs */}
                  <div className="flex gap-2 shrink-0">
                    <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-[#FCD34D]/10 border border-[#FCD34D]/30 rounded">
                      <Building2 className="w-3 h-3 text-[#FCD34D]" />
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-[#FCD34D] leading-none">{selectedProject.idleRate}<span className="text-[9px] ml-0.5">%</span></span>
                        <span className="text-[8px] text-gray-500">闲置率</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-white/5 border border-white/20 rounded">
                      <Target className="w-3 h-3 text-white" />
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-white leading-none">85<span className="text-[9px] ml-0.5">%</span></span>
                        <span className="text-[8px] text-gray-500">ROI目标</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded">
                      <Layers className="w-3 h-3 text-[#3B82F6]" />
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-[#3B82F6] leading-none">{selectedProject.phase}</span>
                        <span className="text-[8px] text-gray-500">当前阶段</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="flex-1 min-h-0 border border-[#FCD34D]/20 rounded-md p-2 hover:border-[#FCD34D]/40 transition-all">
                    <div className="text-[9px] text-[#FCD34D] font-bold tracking-widest mb-1">资产生命周期产出 (12个月)</div>
                    <div className="h-[calc(100%-20px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={selectedProject.yieldData} margin={{ top: 10, right: 5, bottom: 5, left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} dx={-5} />
                          <Tooltip content={<CustomTooltip unit="%" />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                          <ReferenceLine y={85} stroke="#3B82F6" strokeDasharray="4 4" strokeOpacity={0.6} />
                          <Bar dataKey="actual" name="实际使用" fill="#FCD34D" fillOpacity={0.85} barSize={14} radius={[2, 2, 0, 0]}>
                            {selectedProject.yieldData.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} className="hover:opacity-100 hover:fill-white transition-all cursor-default" />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
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
            <WidgetPanel title="承载力 (持续学习智能体)" icon={<BrainCircuit className="w-4 h-4 text-[#FCD34D]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-3 gap-3">
                <div className="flex gap-3 shrink-0">
                  <KpiCard act="目标人口" metric="15.0" unit="M" desc="利雅得扩张" icon={<Target className="w-3.5 h-3.5" />} colorConfig={colors.green} />
                  <KpiCard act="增速" metric="+14" unit="K" desc="月净流入" icon={<Activity className="w-3.5 h-3.5" />} colorConfig={colors.yellow} />
                </div>

                <ChartContainer title="基础设施压力" subtitle="基于水、电、交通负荷" alert="指数: 92.4" hoverBorderColor="hover:border-[#FCD34D]" hoverShadow="hover:shadow-[0_0_20px_rgba(252,211,77,0.2),inset_0_0_15px_rgba(252,211,77,0.1)]">
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
                      
                      <Line type="monotone" dataKey="capacity" name="最大容量" stroke="#00B558" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={true} animationDuration={1000} />
                      <Area type="monotone" dataKey="influx" name="需求负荷" stroke="#FCD34D" strokeWidth={2} fill="url(#goldGrad)" isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" activeDot={{ r: 4, fill: '#FCD34D', stroke: '#020603', strokeWidth: 2 }} />
                      
                      <ReferenceLine x="26 Q3" stroke="#FF4444" strokeDasharray="3 3" label={{ position: 'top', value: '崩溃', fill: '#FF4444', fontSize: 8, fontWeight: 'bold' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ActionAlert title="Utility Risk" desc="预计崩溃时间线" value="2026年Q3" />
              </div>
            </WidgetPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="w-[50%] flex flex-col min-w-0 h-full pb-[64px]"
          >
            <WidgetPanel title="开发管道 (城市监测模块)" icon={<Activity className="w-4 h-4 text-[#00B558]" />} className="flex-1 min-h-0">
              <div className="flex h-full min-h-0 p-2.5 gap-3">
                {/* Left: Project List (sorted by progress) */}
                <div className="w-[42%] flex flex-col min-h-0">
                  <div className="text-[9px] text-[#00B558] font-bold tracking-widest mb-1.5 px-1">愿景2030巨型项目</div>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5">
                    {data.devProjects.filter(p => parseInt(p.deadline) > 2026).map((project) => {
                      const isSelected = project.id === selectedDevProjectId;
                      const statusColor = project.status === "ahead" ? "#00B558" : project.status === "on-track" ? "#3B82F6" : "#FF4444";
                      return (
                        <div
                          key={project.id}
                          onClick={() => setSelectedDevProjectId(project.id)}
                          className={`flex flex-col p-2 rounded border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#00B558]/15 border-[#00B558]/50 ring-1 ring-[#00B558]/30'
                              : 'bg-[#1e293b]/50 border-transparent hover:border-[#00B558]/30 hover:bg-[#00B558]/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{project.code}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                              project.status === 'ahead' ? 'bg-[#00B558]/20 text-[#00B558]' :
                              project.status === 'on-track' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                              'bg-[#FF4444]/20 text-[#FF4444]'
                            }`}>
                              {project.status === 'ahead' ? '超前' : project.status === 'on-track' ? '按计划' : '落后'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: statusColor }} />
                            </div>
                            <span className="text-[11px] font-black" style={{ color: statusColor }}>{project.progress}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Spatial Change + AI Recommendation (高层精简视角) */}
                <div className="flex-1 flex flex-col min-h-0 gap-2">
                  {/* Project Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1e293b]/50 rounded border border-[#00B558]/20">
                    <span className="text-[12px] font-black text-white">{selectedDevProject.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-black text-[#00B558]">{selectedDevProject.progress}%</div>
                      <div className="text-[11px] text-gray-400">{selectedDevProject.deadline}</div>
                    </div>
                  </div>

                  {/* Progress Tracking Chart - 计划进度 vs 实际进度 */}
                  <div className="flex-1 min-h-0 border border-[#00B558]/20 rounded-md p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#00B558] font-bold tracking-widest">地理空间追踪</span>
                        <span className="text-[7px] px-1.5 py-0.5 bg-[#3B82F6]/20 text-[#3B82F6] rounded">卫星+激光雷达</span>
                      </div>
                      <span className="text-[8px] text-gray-500">上次扫描: 2026年12月</span>
                    </div>
                    <div className="h-[calc(100%-20px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          data={progressData}
                          margin={{ top: 5, right: 5, bottom: 5, left: -15 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="year" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} dx={-5} />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-[#051105]/95 border border-[#00B558]/50 p-2 rounded shadow-lg z-50">
                                    <p className="text-[10px] text-gray-300 mb-1">{label}</p>
                                    {payload.map((entry: any, index: number) => (
                                      <p key={index} className="text-[11px] font-black" style={{ color: entry.color }}>
                                        {entry.name}: {entry.value?.toFixed(1)}%
                                      </p>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }} 
                            cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} 
                          />
                          <ReferenceLine x="2026" stroke="#FF4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'top', value: '当前', fill: '#FF4444', fontSize: 8, fontWeight: 'bold' }} />
                          <Line type="monotone" dataKey="planProgress" name="计划进度" stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#3B82F6' }} />
                          <Line type="monotone" dataKey="actualProgress" name="实际进度" stroke="#00B558" strokeWidth={2.5} dot={{ r: 4, fill: '#00B558' }} activeDot={{ r: 6, fill: '#00B558', stroke: '#020603', strokeWidth: 2 }} connectNulls={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI Recommendation - 基于技术手段采集的结论 */}
                  <div className={`shrink-0 flex flex-col gap-1.5 px-3 py-2 rounded border ${
                    selectedDevProject.status === 'delayed' ? 'bg-[#FF4444]/10 border-[#FF4444]/30' :
                    selectedDevProject.status === 'ahead' ? 'bg-[#00B558]/10 border-[#00B558]/30' :
                    'bg-[#3B82F6]/10 border-[#3B82F6]/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-[#FCD34D]" />
                        <span className={`text-[10px] font-bold ${
                          selectedDevProject.status === 'delayed' ? 'text-[#FF4444]' :
                          selectedDevProject.status === 'ahead' ? 'text-[#00B558]' : 'text-[#3B82F6]'
                        }`}>
                          AI分析
                        </span>
                      </div>
                      <div className="text-[8px] text-gray-500">下次扫描: 2027年1月</div>
                    </div>
                    <div className="text-[9px] text-gray-400 leading-relaxed">
                      {selectedDevProject.aiRecommendation}
                    </div>
                    <div className={`text-[11px] font-black ${
                      selectedDevProject.status === 'delayed' ? 'text-[#FF4444]' :
                      selectedDevProject.status === 'ahead' ? 'text-[#00B558]' : 'text-[#3B82F6]'
                    }`}>
                      → {selectedDevProject.aiAction}
                    </div>
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
            <WidgetPanel title="土地利用变化 (变化追踪智能体)" icon={<Layers className="w-4 h-4 text-[#FF4444]" />} className="flex-1 min-h-0">
              <div className="flex flex-col h-full min-h-0 p-2.5 gap-2">
                {/* Compact KPI Row */}
                <div className="flex gap-2 shrink-0">
                  <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded">
                    <MapPin className="w-3 h-3 text-[#3B82F6]" />
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-[#3B82F6] leading-none">825<span className="text-[9px] ml-0.5">KM²</span></span>
                      <span className="text-[8px] text-gray-500">城市面积</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-[#00B558]/10 border border-[#00B558]/30 rounded">
                    <TrendingUp className="w-3 h-3 text-[#00B558]" />
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-[#00B558] leading-none">+3.2<span className="text-[9px] ml-0.5">%</span></span>
                      <span className="text-[8px] text-gray-500">年增长率</span>
                    </div>
                  </div>
                </div>

                {/* Main Chart - Takes most space */}
                <div className="flex-1 min-h-0 border border-[#FF4444]/20 rounded-md p-2 hover:border-[#FF4444]/40 transition-all">
                  <div className="text-[9px] text-[#FF4444] font-bold tracking-widest mb-1">土地利用演变 (2017-2026)</div>
                  <div className="h-[calc(100%-20px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.landUseChange} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="year" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} dx={-5} />
                        <Tooltip content={<CustomTooltip unit=" KM²" />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <ReferenceLine x="2024" stroke="#FF4444" strokeDasharray="3 3" strokeOpacity={0.4} label={{ position: 'top', value: '预测', fill: '#FF4444', fontSize: 8, fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="residential" name="住宅" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.25} />
                        <Line type="monotone" dataKey="commercial" name="商业" stroke="#FCD34D" strokeWidth={2} dot={{ r: 2, fill: '#FCD34D' }} />
                        <Line type="monotone" dataKey="green" name="绿地" stroke="#00B558" strokeWidth={2.5} dot={{ r: 3, fill: '#00B558' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Compact Green Space Grid */}
                <div className="shrink-0">
                  <div className="text-[9px] text-[#00B558] font-bold tracking-widest mb-1.5">各区域绿地</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {data.greenSpaceRegional.slice(0, 6).map((item, idx) => {
                      const statusColor = item.status === "exceeding" ? "#00B558" : item.status === "on-track" ? "#3B82F6" : item.status === "attention" ? "#FCD34D" : "#FF4444";
                      return (
                        <div key={idx} className="flex flex-col items-center p-1.5 bg-[#0f172a] rounded border border-[#00B558]/10">
                          <span className="text-[8px] text-gray-400 font-bold">{item.region}</span>
                          <span className="text-[11px] font-black leading-tight" style={{ color: statusColor }}>{item.current}%</span>
                          <div className="w-full h-0.5 bg-[#1e293b] rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(item.current / 15) * 100}%`, backgroundColor: statusColor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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