import React from "react";
import { motion } from "motion/react";
import { X, RotateCcw, Play } from "lucide-react";

// ── 各智能体参数类型 ─────────────────────────────────
export interface UTParams { additionalLanes: number; metroShift: number; signalOptimization: number; congestionPricing: number; }
export interface MIParams { shadeInfra: number; transitExpansion: number; cyclingInvestment: number; }
export interface SOParams { sustainabilityWeight: number; investmentScale: number; equityPriority: number; }
export interface EFParams { mixedUseRatio: number; pppShare: number; farBonus: number; landValueCapture: number; anchorIncentive: number; }
export interface ERParams { drainageExpansion: number; greenCover: number; retentionBasins: number; buildingCode: number; coolRoof: number; }

export const DEFAULT_UT: UTParams = { additionalLanes: 0, metroShift: 0, signalOptimization: 30, congestionPricing: 0 };
export const DEFAULT_MI: MIParams = { shadeInfra: 1.0, transitExpansion: 1.0, cyclingInvestment: 1.0 };
export const DEFAULT_SO: SOParams = { sustainabilityWeight: 1.0, investmentScale: 1.0, equityPriority: 1.0 };
export const DEFAULT_EF: EFParams = { mixedUseRatio: 15, pppShare: 20, farBonus: 0, landValueCapture: 5, anchorIncentive: 0 };
export const DEFAULT_ER: ERParams = { drainageExpansion: 0, greenCover: 8, retentionBasins: 0, buildingCode: 35, coolRoof: 5 };

// ── 滑块 ────────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step, unit, onChange, formatValue, color = "#00B558" }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; formatValue?: (v: number) => string; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{label}</span>
        <span className="text-[12px] font-black tracking-wider" style={{ color }}>
          {formatValue ? formatValue(value) : value}{(!formatValue || !formatValue(value).startsWith('无')) && unit}
        </span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-[#1a2f1a] rounded-full" />
        <div className="absolute left-0 h-[3px] rounded-full" style={{ width: `${pct}%`, background: color }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full h-4 opacity-0 cursor-pointer" />
        <div className="absolute w-3 h-3 rounded-full border-2 border-[#0a140a] pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)`, backgroundColor: color, boxShadow: `0 0 6px ${color}99` }} />
      </div>
    </div>
  );
}

// ── 模态框外壳（含描述）─────────────────────────────
function ModalShell({ title, color, onClose, onApply, onReset, descriptions, children }: {
  title: string; color: string; onClose: () => void; onApply: () => void; onReset: () => void;
  descriptions: { name: string; desc: string }[]; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020502]/80 backdrop-blur-md pointer-events-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-[520px] max-h-[80vh] bg-[#0a140a]/95 border rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
        style={{ borderColor: `${color}40` }}>
        <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{ borderColor: `${color}25` }}>
          <h2 className="text-white text-sm font-bold tracking-[0.15em] uppercase">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
          {children}
          {/* 参数描述 */}
          <div className="border-t pt-3 mt-1" style={{ borderColor: `${color}15` }}>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2 block">参数说明</span>
            {descriptions.map(d => (
              <div key={d.name} className="mb-2.5">
                <span className="text-[12px] font-bold text-gray-300 uppercase tracking-wider">{d.name}</span>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-t bg-[#070d07]/50" style={{ borderColor: `${color}25` }}>
          <button onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-sm transition-all">
            <RotateCcw className="w-3.5 h-3.5" />重置
          </button>
          <button onClick={() => { onApply(); onClose(); }}
            className="flex items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-black rounded-sm transition-all"
            style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}50` }}>
            <Play className="w-3.5 h-3.5" />应用
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 5个智能体设置模态框 ────────────────────────────────────
const UT_DESCS = [
  { name: "新增车道", desc: "在6条主要城区走廊（法赫德国王路、欧莱雅街、阿卜杜拉国王路、北环路、麦加路、东环路）上增加的额外车道数。方法包括：取消路边停车（+1车道）、道路拓宽（+2车道）、高峰期反向车道（+1车道）。每条车道可为每条走廊增加约800-1,000辆/小时通行能力。" },
  { name: "地铁出行转移率", desc: "当前驾车通勤者转向利雅得地铁1-6号线的比例。每转移10%，可减少高峰时段城区道路约12,400辆车。" },
  { name: "信号优化覆盖率", desc: "升级为自适应交通信号控制（ATSC）的城区交叉口比例。基线：180个交叉口中的30%已配备SCATS/SCOOT系统。滑块可将覆盖率调整至100%。" },
  { name: "建议高峰时段拥堵费", desc: "在高峰时段（7-9 AM, 4-7 PM）进入城区核心区域的新增拥堵收费。目前：0 SAR（无收费）。参考：伦敦约70 SAR，斯德哥尔摩约15 SAR，新加坡约14 SAR。" },
];
const MI_DESCS = [
  { name: "步行出行占比", desc: "建议遮阳和降温干预措施，以增加沙漠气候下的步行出行。" },
  { name: "主动交通评分", desc: "监测自行车道安全性和使用率，优化未来骑行基础设施建设。" },
  { name: "公共交通可达性", desc: "确保80%的居民在800米范围内可到达交通枢纽。" },
];
const SO_DESCS = [
  { name: "可持续性对齐度", desc: "根据碳足迹和水效率对规划方案进行排名。" },
  { name: "成本效益比", desc: "分析基础设施的长期投资回报率与短期建设成本。" },
  { name: "社会公平评分", desc: "确保城市干预措施在所有人口群体中公平分配。" },
];
const EF_DESCS = [
  { name: "混合用地开发比例", desc: "新开发区中指定为混合用途（零售+住宅+办公）的比例。较高的混合用途可创造步行友好、自我维持的社区，具有多样化的本地收入来源。利雅得基线约15%反映了遗留的单用途分区。" },
  { name: "PPP融资占比", desc: "通过公私合作伙伴关系资助的基础设施成本总额占比。PPP将建设和运营风险转移给私人开发商，以换取收益分成特许权（如收费公路、区域供冷）。减少政府财政负担和资金缺口。" },
  { name: "容积率奖励（开发商激励）", desc: "授予包含公共设施（保障性住房、公园、学校）的开发商的容积率奖励。开发商获得额外可建筑面积；城市在不花费公共资金的情况下获得基础设施贡献和密度收益。" },
  { name: "土地增值回收率", desc: "通过增值征费、特别评估区或税收增量融资，由市政当局回收的基础设施驱动的土地增值百分比。当地铁站使附近土地价值上升30-80%时，LVC将部分意外收益重新投入进一步开发。" },
  { name: "锚定租户激励", desc: "为吸引主要雇主（企业总部、大学、医院）锚定社区而提供的税收或租金优惠。创造就业引力，带动周边零售客流，吸引后续私人投资。" },
];
const ER_DESCS = [
  { name: "排水基础设施扩建", desc: "为利雅得现有340公里管网新增的雨水排放能力。目标是河谷溢流区（哈尼法、阿奇克）和低洼城市流域。每增加10公里可将受影响集水区的洪区半径减少约12%。" },
  { name: "蓄水池和防洪屏障", desc: "在关键洪水易发节点（河谷交汇处、公路下穿通道、区域排水口）建设的新蓄水池和防洪屏障设施数量。每个设施在峰值事件期间可储存约50,000m³暴雨径流。" },
  { name: "城市绿化覆盖率", desc: "植被冠层（公园、行道树、绿色走廊）覆盖的城市面积百分比。基线8%在全球主要城市中处于最低水平。每增加1%可使当地地表温度降低约0.15°C，并改善雨水吸收。" },
  { name: "凉爽屋顶和反射表面覆盖率", desc: "经过高反照率（反射）涂层或凉爽屋顶材料处理的屋顶和铺装表面百分比。反射而非吸收太阳辐射，可减少建筑制冷负荷10-20%，并使密集区域环境温度降低最高2°C。" },
  { name: "气候韧性建筑标准", desc: "新建筑中采用更新的沙特建筑规范（SBC 601/602）防洪、耐热和节水标准的采用率。基线约35%反映当前MOMRA执行水平。更高的采用率可减少结构性洪水损害和制冷能源需求。" },
];

export function UTSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: UTParams; onChange: (p: UTParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof UTParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="城市测试智能体 — 利雅得城区交通" color="#00B558" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={UT_DESCS}>
      <SliderRow label="新增车道（主要走廊）" value={params.additionalLanes} min={0} max={4} step={1} unit=" 车道" onChange={v => upd('additionalLanes', v)} formatValue={v => `+${v}`} />
      <SliderRow label="地铁出行转移率" value={params.metroShift} min={0} max={40} step={2} unit="%" onChange={v => upd('metroShift', v)} />
      <SliderRow label="信号优化覆盖率" value={params.signalOptimization} min={30} max={100} step={5} unit="%" onChange={v => upd('signalOptimization', v)} formatValue={v => `${v}`} />
      <SliderRow label="建议高峰时段拥堵费" value={params.congestionPricing} min={0} max={30} step={1} unit=" SAR" onChange={v => upd('congestionPricing', v)} formatValue={v => v === 0 ? '无' : `${v}`} />
    </ModalShell>
  );
}

export function MISettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: MIParams; onChange: (p: MIParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof MIParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="出行影响顾问智能体" color="#FCD34D" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={MI_DESCS}>
      <SliderRow label="遮阳基础设施" value={params.shadeInfra} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('shadeInfra', v)} color="#FCD34D" />
      <SliderRow label="公交网络扩展" value={params.transitExpansion} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('transitExpansion', v)} color="#FCD34D" />
      <SliderRow label="骑行投资" value={params.cyclingInvestment} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('cyclingInvestment', v)} color="#FCD34D" />
    </ModalShell>
  );
}

export function SOSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: SOParams; onChange: (p: SOParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof SOParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="场景优化智能体" color="#00B558" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={SO_DESCS}>
      <SliderRow label="可持续性权重" value={params.sustainabilityWeight} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('sustainabilityWeight', v)} />
      <SliderRow label="投资规模" value={params.investmentScale} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('investmentScale', v)} />
      <SliderRow label="公平优先级" value={params.equityPriority} min={0.5} max={3.0} step={0.1} unit="×" onChange={v => upd('equityPriority', v)} />
    </ModalShell>
  );
}

export function EFSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: EFParams; onChange: (p: EFParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof EFParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="经济与财务分析器 — 利雅得社区" color="#3b82f6" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={EF_DESCS}>
      <SliderRow label="混合用地开发比例" value={params.mixedUseRatio} min={15} max={60} step={5} unit="%" onChange={v => upd('mixedUseRatio', v)} color="#3b82f6" />
      <SliderRow label="PPP融资占比" value={params.pppShare} min={10} max={70} step={5} unit="%" onChange={v => upd('pppShare', v)} color="#3b82f6" />
      <SliderRow label="容积率奖励（开发商激励）" value={params.farBonus} min={0} max={30} step={5} unit="%" onChange={v => upd('farBonus', v)} color="#3b82f6" formatValue={v => v === 0 ? '无' : `+${v}`} />
      <SliderRow label="土地增值回收率" value={params.landValueCapture} min={0} max={40} step={5} unit="%" onChange={v => upd('landValueCapture', v)} color="#3b82f6" />
      <SliderRow label="锚定租户激励" value={params.anchorIncentive} min={0} max={50} step={5} unit="%" onChange={v => upd('anchorIncentive', v)} color="#3b82f6" formatValue={v => v === 0 ? '无' : `${v}`} />
    </ModalShell>
  );
}

export function ERSettingsModal({ params, onChange, onApply, onReset, onClose }: {
  params: ERParams; onChange: (p: ERParams) => void; onApply: () => void; onReset: () => void; onClose: () => void;
}) {
  const upd = (k: keyof ERParams, v: number) => onChange({ ...params, [k]: v });
  return (
    <ModalShell title="环境与韧性评估器 — 利雅得" color="#10b981" onClose={onClose} onApply={onApply} onReset={onReset} descriptions={ER_DESCS}>
      <SliderRow label="排水基础设施扩建" value={params.drainageExpansion} min={0} max={50} step={5} unit=" km" onChange={v => upd('drainageExpansion', v)} color="#10b981" formatValue={v => `+${v}`} />
      <SliderRow label="蓄水池和防洪屏障" value={params.retentionBasins} min={0} max={8} step={1} unit=" 设施" onChange={v => upd('retentionBasins', v)} color="#10b981" formatValue={v => `+${v}`} />
      <SliderRow label="城市绿化覆盖率" value={params.greenCover} min={8} max={30} step={1} unit="%" onChange={v => upd('greenCover', v)} color="#10b981" />
      <SliderRow label="凉爽屋顶和反射表面覆盖率" value={params.coolRoof} min={5} max={60} step={5} unit="%" onChange={v => upd('coolRoof', v)} color="#10b981" />
      <SliderRow label="气候韧性建筑标准" value={params.buildingCode} min={35} max={100} step={5} unit="%" onChange={v => upd('buildingCode', v)} color="#10b981" />
    </ModalShell>
  );
}
