import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Crosshair, Zap, Activity, Map as MapIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

const generateCommuteChartData = (baselineSpeed: number, currentSpeed: number) => {
  const data = [];
  const currentHour = 17;
  for (let i = 0; i <= 23; i++) {
    let normal = baselineSpeed;
    if (i >= 7 && i <= 9) normal -= 15;
    if (i >= 16 && i <= 19) normal -= 20;
    normal = normal + Math.sin(i / 2) * 5;
    if (normal < 15) normal = 15;
    let actual = normal;
    if (i === currentHour) {
      actual = currentSpeed;
    } else if (i === currentHour - 1) {
      actual = normal - (normal - currentSpeed) * 0.4;
    } else if (i > currentHour) {
      actual = undefined as any;
    } else {
      actual = normal + (Math.random() * 4 - 2);
    }
    const point: any = { time: `${i.toString().padStart(2, '0')}:00`, Normal: Math.round(normal) };
    if (actual !== undefined) { point.Actual = Math.round(actual); }
    data.push(point);
  }
  return data;
};

const generateWhiteLandChartData = (baseValueStr: string) => {
  const val = parseInt(baseValueStr.replace(/\D/g, ''));
  return [
    { year: '2021', Value: val * 0.6, Penalty: 0 },
    { year: '2022', Value: val * 0.7, Penalty: val * 0.01 },
    { year: '2023', Value: val * 0.8, Penalty: val * 0.02 },
    { year: '2024', Value: val * 0.9, Penalty: val * 0.035 },
    { year: '2025', Value: val, Penalty: val * 0.05 },
    { year: '2026', Value: val * 1.15, Penalty: val * 0.08 }
  ];
};

const generateROIChartData = (currentYieldStr: string, projectedYieldStr: string) => {
  const current = parseFloat(currentYieldStr);
  const projected = parseFloat(projectedYieldStr);
  const diff = projected - current;
  return [
    { year: '2021', Yield: current - diff * 0.8 },
    { year: '2022', Yield: current - diff * 0.5 },
    { year: '2023', Yield: current - diff * 0.2 },
    { year: '2024', Yield: current },
    { year: '2025', Yield: current + diff * 0.5 },
    { year: '2026', Yield: projected }
  ];
};

export function AnalysisModal({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  if (!data) return null;
  const isCritical = data.severity === "CRITICAL";
  const color = isCritical ? "#ff4444" : "#FCD34D";
  const Icon = data.type === 'white_land' ? MapIcon : data.type === 'roi' ? (data.trend === 'POSITIVE' ? TrendingUp : TrendingDown) : Activity;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[#051005]/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[540px] bg-[#0a140a]/95 border pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col uppercase tracking-wider font-bold" style={{ borderColor: `${color}60` }}>
            {/* HEADER */}
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r" style={{ borderColor: `${color}30`, backgroundImage: `linear-gradient(to right, ${color}20, transparent)` }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#051105] rounded-sm border" style={{ borderColor: `${color}50`, boxShadow: `0 0 10px ${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 font-bold tracking-widest">
                    {data.type === 'commute' ? '检测异常' : data.type === 'white_land' ? '闲置土地智能体' : '资产评估'}
                  </div>
                  <div className="text-[16px] font-black text-gray-100 tracking-wider mt-0.5">{data.name}</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-5 flex flex-col gap-4">
              {data.type === 'commute' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#051105]/80 border border-[#00B558]/20 p-3 rounded-sm flex flex-col justify-center">
                      <div className="text-[9px] text-[#00B558] mb-1 font-bold">正常基线</div>
                      <div className="text-[20px] text-gray-200 font-black">{data.baselineSpeed} km/h</div>
                    </div>
                    <div className="bg-[#051105]/80 border p-3 rounded-sm relative overflow-hidden flex flex-col justify-center" style={{ borderColor: `${color}40` }}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }}></div>
                      <div className="text-[9px] mb-1 relative z-10 font-bold" style={{ color }}>当前状态</div>
                      <div className="text-[20px] text-gray-101 font-black relative z-10">{data.currentSpeed} km/h</div>
                      <motion.div className="absolute right-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </div>
                    <div className="bg-[#051105]/80 border border-gray-800 p-3 rounded-sm flex flex-col justify-center">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold">预计延误</div>
                      <div className="text-[20px] font-black" style={{ color }}>{data.delay}</div>
                    </div>
                  </div>
                  <div className="bg-[#051105]/50 border border-gray-800 p-3 rounded-sm">
                    <div className="text-[9px] text-gray-400 mb-3 font-bold flex justify-between">
                      <span>24小时交通速度趋势</span>
                      <span style={{ color }}>当前时间: 17:00</span>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={generateCommuteChartData(data.baselineSpeed, data.currentSpeed)} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                          <defs><linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00B558" stopOpacity={0.15}/><stop offset="95%" stopColor="#00B558" stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="time" stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} interval={5} />
                          <YAxis stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#051105', borderColor: '#374151', fontSize: '10px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} labelStyle={{ color: '#9CA3AF' }} />
                          <Area type="monotone" dataKey="Normal" stroke="#00B558" strokeWidth={1} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorNormal)" />
                          <Line type="monotone" dataKey="Actual" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#051105', stroke: color, strokeWidth: 2 }} />
                          <ReferenceLine x="17:00" stroke={color} strokeDasharray="3 3" opacity={0.5} />
                          <ReferenceDot x="17:00" y={data.currentSpeed} r={4} fill={color} stroke="#051105" strokeWidth={2} />
                          <ReferenceDot x="17:00" y={Math.round(generateCommuteChartData(data.baselineSpeed, data.currentSpeed)[17].Normal)} r={4} fill="#00B558" stroke="#051105" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {data.type === 'white_land' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#051105]/80 border border-gray-800 p-3 rounded-sm flex flex-col justify-center">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold">地块面积</div>
                      <div className="text-[20px] text-gray-200 font-black">{data.size}</div>
                    </div>
                    <div className="bg-[#051105]/80 border border-gray-800 p-3 rounded-sm flex flex-col justify-center">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold">估值</div>
                      <div className="text-[20px] text-gray-200 font-black">{data.estValue}</div>
                    </div>
                    <div className="bg-[#051105]/80 border p-3 rounded-sm relative overflow-hidden flex flex-col justify-center" style={{ borderColor: `${color}40` }}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }}></div>
                      <div className="text-[9px] mb-1 relative z-10 font-bold" style={{ color }}>税收罚金</div>
                      <div className="text-[20px] font-black relative z-10" style={{ color }}>{data.penalty}</div>
                    </div>
                  </div>
                  <div className="bg-[#051105]/50 border border-gray-800 p-3 rounded-sm">
                    <div className="text-[9px] text-gray-400 mb-3 font-bold flex justify-between">
                      <span>土地价值 vs 税收罚金累积</span>
                      <span style={{ color }}>闲置: {data.duration}</span>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={generateWhiteLandChartData(data.estValue)} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                          <defs><linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="year" stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} hide />
                          <Tooltip contentStyle={{ backgroundColor: '#051105', borderColor: '#374151', fontSize: '10px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} labelStyle={{ color: '#9CA3AF' }} />
                          <Area yAxisId="left" type="step" dataKey="Value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#valGrad)" />
                          <Bar yAxisId="right" dataKey="Penalty" fill={color} opacity={0.8} barSize={12} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {data.type === 'roi' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#051105]/80 border border-gray-800 p-3 rounded-sm flex flex-col justify-center">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold">当前收益率</div>
                      <div className="text-[20px] text-gray-200 font-black">{data.currentYield}</div>
                    </div>
                    <div className="bg-[#051105]/80 border border-gray-800 p-3 rounded-sm flex flex-col justify-center relative">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold">预期收益率</div>
                      <div className="text-[20px] text-gray-200 font-black">{data.projectedYield}</div>
                    </div>
                    <div className="bg-[#051105]/80 border p-3 rounded-sm relative overflow-hidden flex flex-col justify-center" style={{ borderColor: `${color}40` }}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }}></div>
                      <div className="text-[9px] mb-1 relative z-10 font-bold" style={{ color }}>10年趋势</div>
                      <div className="text-[20px] font-black relative z-10 flex items-center gap-2" style={{ color }}>{data.trend}</div>
                    </div>
                  </div>
                  <div className="bg-[#051105]/50 border border-gray-800 p-3 rounded-sm">
                    <div className="text-[9px] text-gray-400 mb-3 font-bold flex justify-between">
                      <span>投资回报率预测轨迹</span>
                      <span style={{ color }}>{data.trend === 'POSITIVE' ? '升值' : '贬值'}</span>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={generateROIChartData(data.currentYield, data.projectedYield)} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                          <defs><linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.25}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="year" stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#4B5563" fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: '#051105', borderColor: '#374151', fontSize: '10px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} labelStyle={{ color: '#9CA3AF' }} formatter={(value: number) => [`${value.toFixed(1)}%`, '收益率']} />
                          <Area type="monotone" dataKey="Yield" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#roiGrad)" />
                          <ReferenceLine x="2024" stroke="#9CA3AF" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: '当前', fill: '#9CA3AF', fontSize: 9 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {/* Cause */}
              <div className="bg-[#051105]/50 border border-gray-800 p-3 rounded-sm">
                <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-1.5 font-bold">
                  <Crosshair className="w-3.5 h-3.5" /> 事件/环境原因
                </div>
                <div className="text-[12px] text-gray-300 leading-relaxed normal-case font-medium">
                  {data.cause}
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-1 flex items-start gap-3 p-3 bg-[#051105]/80 border border-[#00B558]/30 rounded-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00B558]/10 to-transparent opacity-50"></div>
                <Zap className="w-5 h-5 text-[#00B558] shrink-0 mt-0.5 relative z-10" />
                <div className="relative z-10">
                  <div className="text-[10px] text-[#00B558] mb-1.5 font-black tracking-widest">AI 建议</div>
                  <div className="text-[12px] text-gray-200 leading-relaxed normal-case font-medium">{data.recommendation}</div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-gray-800 bg-[#051105]/90 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color }} />
                <span className="text-[11px] tracking-widest font-black" style={{ color }}>严重程度: {data.severity}</span>
              </div>
              <button onClick={onClose} className="px-6 py-2.5 bg-[#00B558] text-[#051105] text-[12px] font-black tracking-widest hover:bg-[#00d668] transition-all rounded-sm hover:scale-105 shadow-[0_0_15px_rgba(0,181,88,0.4)]">
                通知管理团队
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
