import { useState, useEffect } from "react";
import { 
  Target,
  Maximize,
  Square,
  ArrowRight,
  Info,
  X,
  Zap,
  TrendingUp,
  Activity
} from "lucide-react";
import { WidgetPanel } from "../components/WidgetPanel";
import React, { useRef, useCallback } from "react";
import { AnalysisModal } from "../components/AnalysisModal";
import { motion, AnimatePresence } from "motion/react";
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';

// Fix for Figma inspector injecting data-fg props which crash Maplibre
const SafeSource = ({ children, id, ...props }: any) => {
  const cleanProps = { id, ...props };
  Object.keys(cleanProps).forEach(k => { if (k.startsWith('data-fg') || k.startsWith('data-fgid')) delete cleanProps[k]; });
  return React.createElement(Source, { key: id, ...cleanProps }, children);
};

const SafeLayer = (props: any) => {
  const cleanProps = { ...props };
  Object.keys(cleanProps).forEach(k => { if (k.startsWith('data-fg') || k.startsWith('data-fgid')) delete cleanProps[k]; });
  return React.createElement(Layer, cleanProps);
};

declare global {
  interface Window {
    lastMapViewState?: any;
  }
}

// --- MOCK RIYADH COMMUTE ALERTS (flw_1) ---
const COMMUTE_ALERTS = [
  { id: 1, type: "commute", name: "King Fahd Rd", lat: 24.7335, lng: 46.6663, severity: "CRITICAL", delay: "+45m", baselineSpeed: 65, currentSpeed: 12, deviation: "-81.5% 速度下降", cause: "反季节暴雨导致主要地下通道突发山洪。排水系统满负荷运行。", recommendation: "启动应急泵站。通过数字指示牌将车流引导至Olaya街。" },
  { id: 2, type: "commute", name: "Olaya St", lat: 24.7196, lng: 46.6784, severity: "HIGH", delay: "+32m", baselineSpeed: 40, currentSpeed: 15, deviation: "-62.5% 速度下降", cause: "利雅得季Boulevard World开幕夜导致行人和车辆激增。", recommendation: "主要路口绿灯延长25秒。向导航应用发出自动警告。" },
  { id: 3, type: "commute", name: "Northern Ring", lat: 24.7645, lng: 46.6687, severity: "CRITICAL", delay: "+50m", baselineSpeed: 90, currentSpeed: 20, deviation: "-77.7% 速度下降", cause: "严重局部沙尘暴致能见度降至<50m。高速巡逻手动引导交通。", recommendation: "启动低能见度VMS警告。将可变限速降至40km/h。" },
  { id: 4, type: "commute", name: "King Abdullah Rd", lat: 24.7431, lng: 46.6953, severity: "HIGH", delay: "+28m", baselineSpeed: 50, currentSpeed: 18, deviation: "-64.0% 速度下降", cause: "LEAP科技展大量参会者涌入。停车容量超限导致连锁拥堵。", recommendation: "部署临时班车专用道。引导来车前往远程溢出停车区。" },
  { id: 5, type: "commute", name: "Khureis Rd", lat: 24.7265, lng: 46.7451, severity: "CRITICAL", delay: "+40m", baselineSpeed: 80, currentSpeed: 14, deviation: "-82.5% 速度下降", cause: "VIP外交车队通过主干道。临时滚动路障生效中。", recommendation: "监控至车队通过。准备快速绿灯疏通积压车流。" },
  { id: 6, type: "commute", name: "Makkah Rd", lat: 24.6644, lng: 46.6912, severity: "HIGH", delay: "+25m", baselineSpeed: 60, currentSpeed: 22, deviation: "-63.3% 速度下降", cause: "非计划路面塌陷(天坑)，可能由近期地质变动引起。2车道封闭。", recommendation: "派遣紧急土木工程队。封闭受影响车道并向左并道。" },
  { id: 7, type: "commute", name: "Takhassusi St", lat: 24.7077, lng: 46.6578, severity: "CRITICAL", delay: "+38m", baselineSpeed: 45, currentSpeed: 8, deviation: "-82.2% 速度下降", cause: "沙特国王大学体育场重大赛事结束。6万名球迷同时离场。", recommendation: "执行赛后AI交通方案#4。临时将中间车道改为出城方向。" },
  { id: 8, type: "commute", name: "Eastern Ring", lat: 24.7338, lng: 46.7725, severity: "HIGH", delay: "+20m", baselineSpeed: 90, currentSpeed: 35, deviation: "-61.1% 速度下降", cause: "突发沙尘暴积聚和强烈侧风导致高车身车辆危险条件。", recommendation: "限制桥梁路段重型货车通行。通知高速巡逻队确保周边安全。" },
  { id: 9, type: "commute", name: "Abu Bakr Rd", lat: 24.7656, lng: 46.7028, severity: "CRITICAL", delay: "+42m", baselineSpeed: 70, currentSpeed: 10, deviation: "-85.7% 速度下降", cause: "国庆文化节游行准备提前封锁关键路口。", recommendation: "派遣快速响应交通督导员。向Balady应用用户建议替代路线。" },
  { id: 10, type: "commute", name: "Prince Turki", lat: 24.7408, lng: 46.6341, severity: "HIGH", delay: "+22m", baselineSpeed: 50, currentSpeed: 18, deviation: "-64.0% 速度下降", cause: "浓雾结合突发VIP走廊封闭，速度降低64%。", recommendation: "激活路面道钉照明。闪烁电子标志警示来车注意急停。" },
  { id: 11, type: "commute", name: "King Salman Rd", lat: 24.8156, lng: 46.6111, severity: "HIGH", delay: "+18m", baselineSpeed: 80, currentSpeed: 40, deviation: "-50.0% 速度下降", cause: "国际马拉松赛导致路口封闭。分流交通量超预期。", recommendation: "调整绕行点交通信号配时，优先保障横向通行。" },
  { id: 12, type: "commute", name: "Dirab Rd", lat: 24.5681, lng: 46.6800, severity: "CRITICAL", delay: "+35m", baselineSpeed: 65, currentSpeed: 15, deviation: "-76.9% 速度下降", cause: "红色山洪预警生效。干谷溢出到行车道携带碎石。", recommendation: "立即派遣道路清理队。设置警告护栏并封闭外侧车道。" }
];

// --- WHITE LAND ACTIVATION: AI-IDENTIFIED UNDEVELOPED PARCELS (idl_1) ---
// Agent scans MOMRAH White Land Registry + satellite imagery to pinpoint specific idle plots,
// cross-referencing with infrastructure proximity, population growth vectors, and zoning data.
const WHITE_LAND_ACTIVATION_ALERTS = [
  // RIYADH — 3 spots
  { id: 101, type: "idle_land", name: "Al Yasmin Block 4A, Riyadh", lat: 25.05, lng: 46.35, severity: "CRITICAL", delay: "14,500 SQM · 4 YRS IDLE", cause: "AI识别：卫星变化检测确认自2022年以来零施工活动。地块距已完工的萨勒曼国王公园地铁站400米，道路、供水和电力基础设施已全部到位。周边95%为已开发住宅区（Al Yasmin均价：3,100 SAR/平方米）。业主未申请建筑许可，尽管白地税第二阶段已生效（2.5%年税率=每年110万SAR罚款）。\n\n未开发原因：投机持有。业主2019年以2,200 SAR/平方米购入，当前市值3,100 SAR/平方米——持有待升值而非建设。\n\n开发理由：距地铁站400米。步行8分钟到萨勒曼国王公园。所有公用设施已接通。可交付145套住宅（每套100平方米）。半径2公里内Sakani等候名单约320个家庭。开发商回报率：4年建设周期22%内部收益率。", recommendation: "根据白地税第二阶段发出最终警告。90天内无许可申请，按皇家法令M/4启动强制公开拍卖。推荐用途：145套中层住宅（G+5）带底层商业。预计交付：许可后18个月。" },
  { id: 102, type: "idle_land", name: "Al Malqa Apex, Riyadh", lat: 24.60, lng: 46.70, severity: "CRITICAL", delay: "32,000 SQM · 6 YRS IDLE", cause: "AI识别：大利雅得最大单一闲置地块。32,000平方米阻塞了通往北部郊区的市政公用设施走廊扩建。2020年以8,500万SAR购入，当前评估价值1.2亿SAR。72个月连续卫星扫描显示零开发活动。相邻地块已开发为KAFD支持基础设施。\n\n未开发原因：业主（企业实体）将其作为资产负债表资产。土地增值率（6.8%复合年增长率）超过当前利率环境下的开发利润率。\n\n开发理由：阻塞了服务Al Malqa北区4.5万套规划住宅的关键供水主管道。适合混合用途：邻近KAFD（2.3公里），为2,400+ B级办公人员创造住房需求。市政公用设施通行权将解锁3个相邻地块共80,000平方米。", recommendation: "启动公用设施走廊征收审查（12,000平方米条状地块）。剩余20,000平方米：要求180天内开始开发或适用加速5%年税率。推荐用途：公交导向混合开发——200套住宅+8,000平方米办公+4,000平方米商业。" },
  { id: 103, type: "idle_land", name: "Khashm Al Aan South, Riyadh", lat: 24.15, lng: 47.10, severity: "HIGH", delay: "22,000 SQM · 3 YRS IDLE", cause: "AI识别：位于利雅得东扩带，沿哈立德国王路走廊。地块距利雅得地铁绿线终点站（2025年运营）仅1.2公里却未开发。市政2023年已安装公用设施接口但尚未接通。\n\n未开发原因：继承人之间产权纠纷（3名家族成员，2021年继承）。根据伊斯兰法院记录，无单一方可申请建筑许可。\n\n开发理由：地铁绿线终点站创造公交导向需求。利雅得东部人均住房供应最低（每千居民1.2套，城市平均2.8套）。地块可服务800+个Sakani合格家庭。工业区工人（萨勒曼国王能源园，南8公里）需要经济住房。", recommendation: "提交伊斯兰法院加速分割裁决。120天内未解决，MOMRAH依据《土地治理法》第14条指定开发托管人。推荐用途：经济住房（G+4）——180套，目标价50-75万SAR，面向Sakani受益人。" },

  // MAKKAH — 2 spots
  { id: 104, type: "idle_land", name: "Al Shara'i Plateau, Makkah", lat: 21.25, lng: 39.95, severity: "CRITICAL", delay: "48,000 SQM · 5 YRS IDLE", cause: "AI识别：禁寺东6公里的高原地带，拥有全景视野。地块公用设施齐全（道路、供水、电力自2021年起可用）。2018年总体规划修订后划为住宅区。卫星图像显示为裸土，有临时仓储集装箱。\n\n未开发原因：业主等待朝觐住宿重新划区（酒店收益是住宅的3倍）。市政2023和2024年两次拒绝重新划区——该区域专用于住宅以保护住房供应。\n\n开发理由：麦加全国住房自有率最低（52%对70%目标）。Al Shara'i在800米内有学校、清真寺和诊所。公交15分钟到禁寺。可容纳480个家庭单元。该邮区内有3,200个家庭在麦加Sakani等候名单上。", recommendation: "执行住宅区划。适用加速白地税（圣城区闲置5年以上地块税率5%）。推荐用途：480套家庭住宅综合体带地下停车。快速审批建筑许可——预计24个月建设周期。" },
  { id: 105, type: "idle_land", name: "North Jeddah Corniche Strip, Jeddah", lat: 21.80, lng: 39.05, severity: "HIGH", delay: "18,000 SQM · 4 YRS IDLE", cause: "AI识别：北部滨海扩建区的临海地块。2022年已获拆除许可并清场，但未申请后续建筑许可。毗邻吉达塔开发区。污水和淡化水全部接通。\n\n未开发原因：开发商原混合用途项目融资在2023年加息期间失败。地块在开发商资产组合中标记为「计划中」但无资金。\n\n开发理由：一线海景。吉达塔区域2030年前将吸引25,000+居民。北部滨海仅剩3个住宅地块。吉达金融业从业人员对高端住房需求强劲。预计120套豪华单元14个月内售罄。", recommendation: "促成PIF共同投资或PPP结构重启开发。120天内无许可则启动白地税第二阶段。推荐用途：120套海景住宅（G+8）带码头层商业。" },

  // EASTERN PROVINCE — 2 spots
  { id: 106, type: "idle_land", name: "Dhahran Valley West, Eastern Province", lat: 26.05, lng: 50.25, severity: "HIGH", delay: "28,000 SQM · 3 YRS IDLE", cause: "AI识别：距宰赫兰展览中心2公里、阿美总部4公里。地块位于NHC指定的「宰赫兰谷」住宅扩展区。NHC 2023年安装了所有主干基础设施（道路、供水、电力、光纤）。未开始建设。\n\n未开发原因：通过NHC合作分配给私营开发商，但开发商优先利雅得项目。建设开工自2023年以来已3次延期。\n\n开发理由：阿美2025年扩建在宰赫兰园区新增15,000名员工。宰赫兰当前空置率：1.8%（接近零）。平均租金同比上涨28%。2,100名阿美员工在内部住房等候名单上。所有基础设施已预建——可立即开工。", recommendation: "触发NHC绩效条款——要求90天内开工或重新分配给其他开发商。推荐用途：280套中层员工住房（G+6）带社区设施。预计交付：20个月。" },
  { id: 107, type: "idle_land", name: "Jubail 2 Southern Buffer, Eastern Province", lat: 27.15, lng: 49.45, severity: "HIGH", delay: "35,000 SQM · 5 YRS IDLE", cause: "AI识别：毗邻朱拜勒2号石化综合体的工业支持区。划为工人住房和轻商业。道路2021年完工。供水/供电已到地块边界。\n\n未开发原因：需要环境修复——之前作为临时施工暂存区造成土壤污染（2022年环境影响评估报告）。修复成本估计800万SAR，业主不愿投资。\n\n开发理由：4万名石化工人每天从达曼通勤45分钟以上。现场住房预计可减少12%的工业缺勤率。朱拜勒皇家委员会总体规划将该地块划为350套工人住房。800万SAR修复成本仅为预计开发价值（3.8亿SAR）的2%。", recommendation: "提供SIDF修复贷款（0%利率，10年期）。60天内业主拒绝则皇家委员会行使优先购买权。推荐用途：350套工人宿舍+家庭住宅综合体带清真寺和商业街。" },

  // MADINAH — 2 spots
  { id: 108, type: "idle_land", name: "KEC Phase 2 North, Madinah", lat: 24.75, lng: 39.30, severity: "HIGH", delay: "20,000 SQM · 4 YRS IDLE", cause: "AI识别：位于知识经济城二期边界内。2022年总体规划将该地块划为教职工住房。道路网络已完工。变电站在500米外。沙漠地形——无需修复。\n\n未开发原因：KEC二期因承包商重组延期2年。住宅地块优先级低于大学校园建筑。\n\n开发理由：伊斯兰大学麦地那分校2026-2030年计划扩招800名教师。当前教师住房等候：14个月。禁寺附近私人租金同比上涨18%——教师留存受威胁。地块可交付200套教师住房，每套60万SAR（低于市场价）。", recommendation: "将住房交付与校园时间线分离。为教师住房发放独立建筑许可。与REDF合作为教职工提供2.5%补贴抵押贷款。推荐用途：200套教师联排住宅（G+2）带家庭设施。" },
  { id: 109, type: "idle_land", name: "Al Manar Commercial, Madinah", lat: 24.20, lng: 39.80, severity: "HIGH", delay: "12,000 SQM · 3 YRS IDLE", cause: "AI识别：Al Manar区商业地块，距先知寺3公里。2023年曾获批酒店开发。建筑许可2025年12月到期未开工。\n\n未开发原因：2024年旅游住宿供过于求分析显示麦地那中心2028年前将有4,200间酒店客房过剩，原酒店方案不可行。\n\n开发理由：虽然酒店过剩，但住宅严重不足。重新划为住宅区可服务访客转居民趋势（年增8%）。Al Manar交通优越——步行5分钟到哈拉曼站。可容纳150套住宅服务年轻专业人士和小家庭。", recommendation: "批准商业转住宅重新划区申请（快速30天审查）。保留底层商业要求。推荐用途：150套住宅塔楼（G+12）带零售裙楼和共享办公空间。麦地那知识经济劳动力的黄金地段。" },

  // ASIR — 2 spots
  { id: 110, type: "idle_land", name: "Soudah Gateway Parcel, Asir", lat: 18.10, lng: 42.30, severity: "HIGH", delay: "15,000 SQM · 2 YRS IDLE", cause: "AI识别：苏戴开发巨型项目的入口走廊。2024年苏戴总体规划将该地块划为旅游劳动力住房。艾卜哈-苏戴高速公路接入已完成。海拔2,800米山地地形。\n\n未开发原因：需要地质勘察进行基础设计（山岩）。勘察已预算但未委托——苏戴开发公司与市政部之间的官僚延误。\n\n开发理由：苏戴项目2029年前需要8,000名旅游工人。最近住房在40公里外的艾卜哈（1小时山路车程）。工人通勤成本：每年4,500万SAR班车运营费。现场住房可消除通勤并提高工人留存率。凉爽山地气候（平均18°C）是天然优势。", recommendation: "立即委托地质勘察（120万SAR，90天工期）。并行开始基础设计。推荐用途：150套山地工人村——适合地形的模块化建设。气候响应式设计，自然通风。预计交付：勘察完成后16个月。" },

  // QASSIM — 2 spots
  { id: 111, type: "idle_land", name: "Buraidah North University Belt, Qassim", lat: 26.55, lng: 43.70, severity: "HIGH", delay: "25,000 SQM · 4 YRS IDLE", cause: "AI识别：毗邻卡西姆大学主校区。2020年起划为住宅区。道路和电力可用。供水主管道距地块边界200米（需延伸）。\n\n未开发原因：供水设施延伸停滞——市政预算已拨付但承包商采购因卡西姆东部竞争性基础设施项目延期2年。\n\n开发理由：2028年前预计4,000名学生需要住房（大学扩建计划）。目前学生从布赖代中心通勤（25分钟）或居住条件不达标。教职工住房需求：200套。地块为平坦农田——零修复，易于施工。", recommendation: "优先延伸供水主管道（200米，估计200万SAR，45天安装）。发布NHC预审开发商名单。推荐用途：250套混合学生+教职工住房——200套单间/一居室学生单元+50套家庭联排住宅。包含学生服务（图书馆、健身房、便利店）。" },
  { id: 112, type: "idle_land", name: "Al Rass Agri-Tech Hub, Qassim", lat: 25.65, lng: 44.20, severity: "HIGH", delay: "18,000 SQM · 3 YRS IDLE", cause: "AI识别：位于Al Rass-布赖代农业走廊交汇处。2023年划为混合用途。200米外新高速立交已完工。电力和通信已接通。东1公里有农业研究站。\n\n未开发原因：农业社区传统上不愿转换农田边缘地块。业主（农业合作社）缺乏开发专业知识和资金。\n\n开发理由：卡西姆农业科技部门年增长15%。6家农业科技初创企业在5公里内寻找办公/仓储空间（无合适供应）。NEOM食品科技合作2029年前在卡西姆创造300+技术工人需求。地块可作为新兴农业科技创新区的核心。", recommendation: "向农业合作社提供MODON（沙特工业城市管理局）合作——保证收益分成共同开发。推荐用途：农业科技创新园区——5,000平方米轻工业/仓储，3,000平方米办公，100套工人住房。创建卡西姆首个专属农业科技中心。" }
];

// --- URBAN LAND UTILIZATION: AI-IDENTIFIED UNDERUTILIZED ZONES (idl_2) ---
// Agent analyzes satellite urban footprint, infrastructure density maps, population census grids,
// and municipal zoning registers to find zones where zoned land is significantly underutilized.
const URBAN_UTILIZATION_ALERTS = [
  // RIYADH — 3 spots
  { id: 201, type: "utilization", name: "KAFD North Buffer Zone, Riyadh", lat: 25.10, lng: 46.30, severity: "CRITICAL", delay: "12 KM² UNDERUSED", cause: "AI识别：阿卜杜拉国王金融区以北12平方公里城市区域，建设密度仅18%（城市平均65%）。卫星分析显示：70%裸土，15%临时建筑（KAFD建设期间施工营地，现已空置），15%单层仓储。\n\n利用不足原因：该区域被指定为KAFD施工暂存区（2015-2024年）。KAFD已完工90%，暂存区已空置但尚未重新划为永久用途。临时使用许可仍有效——阻止了永久建设许可。\n\n对住建部的价值：开发这一区域可将利雅得利用指数从62提升至67（+5分）。12平方公里中等密度（容积率2.0）产生2,400万平方米建筑面积——相当于一座中型沙特城市。邻近KAFD创造15,000+后勤工人住房的直接需求。", recommendation: "撤销过期临时使用许可（批量处理——340个许可）。发布统一重新划区为混合住宅（R3）。发布NHC总体规划社区招标（6,000套住宅+200,000平方米商业）。预计指数提升：利雅得区域+5分。" },
  { id: 202, type: "utilization", name: "Diriyah Gate Western Corridor, Riyadh", lat: 24.55, lng: 46.65, severity: "CRITICAL", delay: "8 KM² UNDERUSED", cause: "AI识别：德拉伊耶门遗产项目以西8平方公里走廊。基础设施分析显示：道路90%容量，供水/电力主干线已安装（2024年），但仅22%的地块有在建工程。其余仍为椰枣农场和空置沙漠。\n\n利用不足原因：遗产缓冲区法规对整条走廊施加12米高度限制。开发商因低密度约束降低项目可行性而避开该区域（容积率限制0.8）。\n\n对住建部的价值：德拉伊耶门2030年前将吸引500万游客/年+封闭社区25,000名常驻居民。走廊需要酒店、零售和服务工人住房。当前缺口：3公里内零可用住房供8,000+服务行业工人。以遗产兼容密度（G+3）开发联排住宅仍可行。", recommendation: "创建「遗产兼容开发指南」——允许G+3并采用传统纳吉迪建筑标准。为遗产区项目提供30% Sakani融资补贴。目标：2,400套联排住宅+80,000平方米精品商业。指数影响：+3分。" },
  { id: 203, type: "utilization", name: "Eastern Industrial Fringe, Riyadh", lat: 24.10, lng: 47.15, severity: "HIGH", delay: "15 KM² UNDERUSED", cause: "AI识别：利雅得东界第二和第三环路之间15平方公里区域。2018年起划为工业/混合用途。卫星分析：60%空置地块，25%单层汽修作坊，15%低层仓储（平均容积率0.3，划区容量2.5）。\n\n利用不足原因：产业迁移——原有汽车/机械企业搬到新的MODON工业城。剩余租户为短期租约，无投资永久建筑的动力。\n\n对住建部的价值：地铁绿线终点站创造住宅机会。从工业重新划为混合用途可为利雅得东部劳动力人口（萨勒曼国王能源园员工）提供18,000+套住房。利雅得利用指数改善影响最大的区域。", recommendation: "启动正式重新划区程序（工业→混合用途R2/C2）。为剩余汽修企业提供搬迁到MODON工业城的激励。发布公交导向开发招标。15平方公里中等密度=37,500套潜力。指数影响：+7分。" },

  // MAKKAH — 2 spots
  { id: 204, type: "utilization", name: "Al Awali Heights, Makkah", lat: 21.15, lng: 39.95, severity: "CRITICAL", delay: "6 KM² UNDERUSED", cause: "AI识别：麦加城市核心以南6平方公里高地区域。2019年总体规划划为住宅区。卫星显示：85%裸山地形，已建成等级道路（2023年完工）。仅2栋别墅在建。\n\n利用不足原因：陡峭地形（15-25%坡度）使建设成本增加40%。标准住宅开发商避开山地。尽管道路基础设施已完成，但无特定山坡开发激励计划。\n\n对住建部的价值：麦加平地95%已建成——向山上扩展是唯一的增长方向。Al Awali提供更凉爽的小气候（300米海拔提升）、禁寺景观和现有道路。6平方公里可容纳3,600套依坡设计的梯田式住宅。可将麦加利用指数从55提升至59。", recommendation: "创建「山地开发激励」——山坡项目25%建设成本补贴、快速审批（45天批准）、山地住房Sakani资格。要求梯田式建筑类型。目标：12个山坡组团3,600套住宅。指数影响：+4分。" },
  { id: 205, type: "utilization", name: "Jeddah Al Hamdaniyah East, Makkah Region", lat: 21.75, lng: 39.10, severity: "HIGH", delay: "10 KM² UNDERUSED", cause: "AI识别：吉达东部10平方公里平坦区域。完整路网（2020年），变电站运营中，供水主管道已接通。卫星显示：40%空置地块仅有围墙（无建筑），30%单层临时住房，30%已开发。\n\n利用不足原因：2018-2020年快速土地分割创造了4,000+个小地块（平均300平方米）。碎片化的所有权模式阻止了总体规划开发。单个地块太小，无法高效建设多户住宅。\n\n对住建部的价值：Al Hamdaniyah是吉达人口增长最快的区域（年增8%）。非正式/临时住房表明需求强劲但供应不足。地块整合计划可释放5,000+套正规住房。毗邻新哈拉曼铁路站（3公里）。", recommendation: "启动MOMRAH地块整合计划——激励业主合并相邻地块（多户住宅最低1,200平方米）。为整合地块提供15%容积率奖励。部署标准地块尺寸的「填充式住房」模板设计。3年目标5,000套。指数影响：+5分。" },

  // EASTERN PROVINCE — 2 spots
  { id: 206, type: "utilization", name: "Ras Al Khair Port Hinterland, Eastern Province", lat: 27.35, lng: 49.10, severity: "HIGH", delay: "20 KM² UNDERUSED", cause: "AI识别：拉斯海尔工业港后方20平方公里区域。2022年皇家委员会总体规划划为工业支持和工人住房。平坦沙漠地形，道路已完工，Ma'aden工业电网可用。\n\n利用不足原因：矿业公司（Ma'aden、Sabic）使用临时营地而非投资永久住房。尽管皇家委员会倾向永久社区，营地文化持续存在。\n\n对住建部的价值：35,000名工业工人目前住在临时营地（10年预计需求：永久）。2030愿景「生活质量」计划要求2030年前将营地替换为正规社区。20平方公里可支撑一个8,000套永久住宅+市政设施的完整城镇。可将东部省得分从65转变为69。", recommendation: "发布皇家委员会指令，强制要求营地转社区过渡时间表（第一期：2028年前3,000套）。要求矿业公司每人向住房基金缴纳5万SAR。与NHC合作建设总体规划工业城镇。指数影响：+4分。" },
  { id: 207, type: "utilization", name: "Al Ahsa Southern Oasis Edge, Eastern Province", lat: 25.55, lng: 49.80, severity: "HIGH", delay: "8 KM² UNDERUSED", cause: "AI识别：艾赫萨绿洲南界8平方公里区域。联合国教科文组织世界遗产缓冲区形成开发约束。卫星显示：古老椰枣林（40%），空置沙漠（35%），零散传统聚落（25%）。划为生态旅游和低密度住宅。\n\n利用不足原因：联合国教科文组织遗产认定造成无法开发的印象。实际上缓冲区允许敏感开发（G+2，最大覆盖率30%）。当地市政缺乏遗产兼容规划的技术能力。\n\n对住建部的价值：艾赫萨2018年被列为联合国教科文组织世界遗产。2030愿景将文化旅游列为GDP多元化目标。8平方公里生态旅游开发（200套精品单元，遗产步道，椰枣农场体验）将创造1,200个就业岗位并展示可在全国推广的遗产兼容开发模式。", recommendation: "派遣MOMRAH遗产规划技术团队到艾赫萨市政。创建「绿洲边缘开发框架」——生态旅馆、椰枣农场旅游、文化中心。限G+2，土色调材料，覆盖率30%。目标：200套精品旅游单元+150个工匠作坊。指数影响：+2分。" },

  // MADINAH — 2 spots
  { id: 208, type: "utilization", name: "Haramain Station District, Madinah", lat: 24.70, lng: 39.35, severity: "HIGH", delay: "5 KM² UNDERUSED", cause: "AI识别：麦地那哈拉曼高铁站周围5平方公里区域。车站2018年运营但周边区域70%未开发。卫星显示：车站建筑、停车结构和裸露平整土地。道路网络和公用设施由SAR（沙特铁路）安装。\n\n利用不足原因：土地所有权分为沙特铁路（60%）、财政部（25%）和私人（15%）。无单一实体被授权发布总体规划开发计划。三方业主之间的协调自2021年以来停滞。\n\n对住建部的价值：城市内唯一高铁站——公交导向开发的教科书案例。车站日处理8,000名旅客，预计2030年增至15,000人。5平方公里TOD可容纳4,000套住宅+150,000平方米商业+50,000平方米酒店。其他沙特铁路站的示范模型。", recommendation: "建立联合开发机构（沙特铁路+财政部+私人合作伙伴），MOMRAH作为协调方。发布TOD总体规划招标。国际标杆：东京站再开发模型。目标：4,000套住宅+商业综合体。指数影响：+6分（麦地那最大的单一区域机会）。" },
  { id: 209, type: "utilization", name: "Yanbu Al Sinaiyah Worker Zone, Madinah Region", lat: 24.15, lng: 38.05, severity: "HIGH", delay: "7 KM² UNDERUSED", cause: "AI识别：延布工业城内7平方公里划为工人社区开发的区域。皇家委员会2020年划区。基础路网存在。工业电网可用但供水需要海水淡化厂扩建。\n\n利用不足原因：海水淡化厂扩建延期——原定2023年完工因SWCC预算重新分配推迟到2027年。无饮用水无法开始住宅建设。\n\n对住建部的价值：延布港扩建（2026-2030年）将新增20,000名物流和工业工人。当前住房：90%临时营地。社区开发将改善工人留存率（当前流失率35%/年 vs 成熟城市15%）。7平方公里可支撑5,000套永久住宅。", recommendation: "将SWCC海水淡化厂扩建升级为优先项目。安装临时集装箱式淡化设备（日产10万升）以立即启动一期建设（500套）。完整工厂目标2028年。指数影响：麦地那区域+4分。" },

  // ASIR — 2 spots
  { id: 210, type: "utilization", name: "Abha City Center Infill, Asir", lat: 17.95, lng: 42.30, severity: "HIGH", delay: "3 KM² UNDERUSED", cause: "AI识别：艾卜哈市中心3平方公里，由单层传统建筑组成，覆盖率15%（划区容量60%）。卫星分析：400+栋单层建筑位于划为G+4的地块上。平均建筑年龄35年。2024年市政调查将许多结构评估为「状况不佳」。\n\n利用不足原因：传统建筑业主缺乏重建资金。对原始建筑的文化依恋。市政无城市更新援助计划。\n\n对住建部的价值：艾卜哈旅游经济（苏戴、里贾尔阿尔玛）2029年前需要3,000+间酒店客房和服务式公寓。中心填充避免山地蔓延。从单层重建为G+4使住房容量翻四倍而不扩大城市足迹。通过引导式重建保护阿西尔建筑遗产。", recommendation: "启动「阿西尔城市更新基金」——为业主提供低息贷款重建（拆除+按G+4重建）。要求阿西里建筑遗产元素（石立面、彩色窗框）。一期目标800套替换住宅。指数影响：+3分。" },
  { id: 211, type: "utilization", name: "Khamis Mushait Eastern Expansion, Asir", lat: 18.55, lng: 42.90, severity: "HIGH", delay: "9 KM² UNDERUSED", cause: "AI识别：海米斯穆谢特东部扩展区9平方公里。2021年划为住宅/商业。主要高速公路接入道路已完工。沿公路走廊的电力线路已安装。平坦地形（阿西尔罕见——显著优势）。\n\n利用不足原因：军事基地邻近（5公里）造成非正式开发冻结——开发商认为限制空域将阻止建设。国防部2025年确认允许标准高度限制（G+6）内的民用建设。\n\n对住建部的价值：大艾卜哈都市区唯一大型平坦可开发区域。9平方公里可支撑7,000+套标准密度住宅。军事人员住房需求：2,000套（目前从艾卜哈通勤30+分钟）。海米斯穆谢特人口年增4.5%——阿西尔最快。", recommendation: "发布国防部正式许可函确认允许开发。启动NHC招标建设7,000套总体规划社区含军人家庭住房配额（2,000套）。利用平坦地形降低建设成本。指数影响：+8分（阿西尔的变革性项目）。" },

  // QASSIM — 2 spots
  { id: 212, type: "utilization", name: "Buraidah–Unaizah Corridor, Qassim", lat: 26.50, lng: 43.65, severity: "HIGH", delay: "14 KM² UNDERUSED", cause: "AI识别：布赖代与欧奈扎之间沿65号公路14平方公里线性区域。2022年划为混合用途。高速公路立交已完工。农业灌溉渠穿过区域（基础设施存在但需重新利用）。\n\n利用不足原因：历史农业用途——椰枣农场经济产出低（农业价值800 SAR/平方米 vs 城市价值3,500 SAR/平方米）。农场主抗拒转换。无正式「农业转城市」支持计划。\n\n对住建部的价值：连接布赖代-欧奈扎创建75万人口都市走廊（从两个独立城市）。沿公路线性发展支持快速公交。合并将创建卡西姆首个真正的都市区。农业业主通过转换获得4倍价值提升。", recommendation: "创建「农业转型债券」——业主转换土地并获得10年SAR年金等于3倍农业收入。制定带BRT路线的走廊总体规划。目标：8,000套住宅+100,000平方米农业科技商业。指数影响：+9分（卡西姆最大的单一机会）。" },
  { id: 213, type: "utilization", name: "Al Rass Heritage Quarter, Qassim", lat: 25.60, lng: 44.25, severity: "HIGH", delay: "2 KM² UNDERUSED", cause: "AI识别：Al Rass传统老城区2平方公里。单层土砖建筑，入住率20%（80%废弃或季节性使用）。卫星显示：屋顶退化，5年未发新建设许可。市政记录显示300+处废弃房产。\n\n利用不足原因：农村向城市迁移使历史街区人口流失。无遗产保护或适应性再利用计划。土砖建筑不符合标准建筑许可条件。\n\n对住建部的价值：沙特2030愿景「文化遗产」支柱目标在全国范围内保护和活化传统街区。Al Rass拥有罕见的正宗纳吉迪建筑。适应性再利用（精品酒店、工匠作坊、文化中心）在德拉伊耶和吉达Al-Balad已证明成功。300处废弃房产=300个潜在遗产旅游单元。", recommendation: "将Al Rass街区列入沙特遗产名录。启动以Al-Balad修复为模型的适应性再利用计划。一期改造100处房产：40套精品住宿，30个工匠作坊，30个文化/美食场所。派遣SCTH（旅游管理局）技术团队。指数影响：+2分但文化价值高。" }
];

// --- MOCK HOUSING DEMAND ALERTS (dmd_1) ---
const HOUSING_DEMAND_ALERTS = [
  { id: 301, type: "housing", name: "Riyadh Region", lat: 24.7136, lng: 46.6753, severity: "CRITICAL", delay: "-35K BY 2030", deficit: "35,000", ownership: "55%", target: "70%", pop: "8.6M", cause: "预测周期：2030年。缺口基于2016-2025年人口增长率(4.2%复合年增长)和NHC住房供应管道。2030愿景企业总部搬迁(1,100+家公司)驱动快速增长。北部扩张(KAFD、德拉伊耶门)超过住宅供应。", recommendation: "快速审批Al Janadriyah、Khashm Al Aan走廊1.5万套住房许可。启动NHC Sakani第八期。2028年前交付2万套，2030年前交付剩余1.5万套。" },
  { id: 302, type: "housing", name: "Makkah Region", lat: 21.4225, lng: 39.8262, severity: "CRITICAL", delay: "-42K BY 2030", deficit: "42,000", ownership: "52%", target: "70%", pop: "9.0M", cause: "预测周期：2030年。全国最大缺口。朝觐/副朝季节性需求形成双轨住房市场。自有率52%(2026年Q1)—追踪区域中最低。禁寺附近住宅转为酒店加剧短缺。", recommendation: "2028年前在Al Awali、Al Shara'i规划2万套。新建混合用途许可中强制60%住宅。剩余2.2万套通过PPP于2030年前交付。" },
  { id: 303, type: "housing", name: "Eastern Province", lat: 26.3927, lng: 49.9777, severity: "HIGH", delay: "-28K BY 2030", deficit: "28,000", ownership: "65%", target: "70%", pop: "5.1M", cause: "预测周期：2030年。自有率65%(2026年Q1)—差目标5个百分点。阿美扩张区(宰赫兰、朱拜勒2)吸引20万+技术工人。40%现有存量建于2000年前需更新。", recommendation: "2028年前释放宰赫兰谷1.2万套NHC住宅。激励私营开发商在Al Aziziyah工业走廊建设剩余1.6万套。" },
  { id: 304, type: "housing", name: "Madinah Region", lat: 24.4672, lng: 39.6024, severity: "HIGH", delay: "-18K BY 2030", deficit: "18,000", ownership: "60%", target: "70%", pop: "2.2M", cause: "预测周期：2030年。自有率60%(2026年Q1)—差目标10个百分点。知识经济城二期吸引学术和技术人才。访客转居民比率自2022年起年增8%。", recommendation: "加速穆罕默德·本·萨勒曼王子项目8,000套(2028年完工)。将Al Manar闲置商业转为1万套住宅，2030年前完成。" },
  { id: 305, type: "housing", name: "Asir Region", lat: 18.2164, lng: 42.5053, severity: "HIGH", delay: "-15K BY 2030", deficit: "15,000", ownership: "72%", target: "70%", pop: "2.3M", cause: "预测周期：2030年。自有率已达72%(超过70%目标)，但缺口由城镇化驱动：2020年以来乡村向艾卜哈迁移率年增3.1%。苏戴峰旅游项目增加5,000套临时转永久住房需求。", recommendation: "2028年前在苏戴走廊附近规划6,000套。升级海米斯穆谢特扩展区基础设施以支持2030年前9,000套。" },
  { id: 306, type: "housing", name: "Qassim Region", lat: 26.3260, lng: 43.9750, severity: "HIGH", delay: "-15K BY 2030", deficit: "15,000", ownership: "71%", target: "70%", pop: "1.5M", cause: "预测周期：2030年。自有率71%(超过目标)，但缺口来自农业科技人才涌入和大学扩建。预计2028年学生宿舍短缺4,000个床位。", recommendation: "2027年前在布赖代北部释放5,000块NHC地块。与卡西姆大学合作2028年前建2,000套学生公寓。剩余8,000套通过私营部门于2030年前交付。" }
];

// --- MOCK ROAD NETWORK ALERTS (dmd_2) ---
const ROAD_NETWORK_ALERTS = [
  { id: 401, type: "road", name: "Riyadh – NEOM Corridor", lat: 26.5, lng: 42.0, severity: "CRITICAL", delay: "4.2K KM · 2029", length: "4,200 KM", status: "PLANNED", completion: "2029", cause: "目标完工：2029年。连接首都与NEOM、Trojena和The Line的关键北部干线。当前经塔布克路线增加6小时绕行。无直达高速通道。基于NTS 2021走廊研究规划。", recommendation: "一期(利雅得-哈伊勒，850公里)2027年完成。二期(哈伊勒-NEOM，3,350公里)2029年完成。2026年Q2开始征地。" },
  { id: 402, type: "road", name: "Jeddah – KAEC Expressway", lat: 22.4, lng: 39.1, severity: "HIGH", delay: "1.8K KM · 2028", length: "1,800 KM", status: "IN PROGRESS", completion: "2028", cause: "目标完工：2028年。阿卜杜拉国王经济城接入路高峰期140%容量。单车道瓶颈导致45分钟延误。一期(双车道)截至2026年Q1完成60%。", recommendation: "2027年Q4前完成双车道。加速拉比格绕行(300公里)于2028年交付。" },
  { id: 403, type: "road", name: "Eastern Province Ring Road", lat: 26.45, lng: 50.1, severity: "CRITICAL", delay: "3.5K KM · 2030", length: "3,500 KM", status: "DESIGN", completion: "2030", cause: "目标完工：2030年。达曼-朱拜勒-拉斯海尔工业三角区缺乏专用货运走廊。设计阶段基于2023年交通部货运需求研究，预测2030年货车流量增长85%。", recommendation: "2026年Q4前完成环评。朱拜勒-拉斯海尔段(最高回报率)2028年完成。全线2030年完成。" },
  { id: 404, type: "road", name: "Madinah – Yanbu Highway", lat: 23.9, lng: 38.5, severity: "HIGH", delay: "2.1K KM · 2027", length: "2,100 KM", status: "IN PROGRESS", completion: "2027", cause: "目标完工：2027年。追踪项目中最早交付。现有双车道公路被石化物流严重拥堵。延布港扩建需日均5万+货车通行的一级通道。完成45%。", recommendation: "二期拓宽按计划2027年Q2完成。增加危险品运输智能交通管理系统。" },
  { id: 405, type: "road", name: "Abha – Soudah Tourism Rd", lat: 18.25, lng: 42.3, severity: "HIGH", delay: "0.8K KM · 2028", length: "800 KM", status: "DESIGN", completion: "2028", cause: "目标完工：2028年。苏戴开发项目预计2029年接待200万游客/年。当前山路：单车道，平均30km/h，无路肩。6段隧道需地质勘察。", recommendation: "2026年Q1开始地质勘察。2026年Q3开工。景观快速路2028年Q4交付。" },
  { id: 406, type: "road", name: "Qassim Agricultural Route", lat: 26.1, lng: 44.2, severity: "HIGH", delay: "1.6K KM · 2029", length: "1,600 KM", status: "PLANNED", completion: "2029", cause: "目标完工：2029年。卡西姆生产沙特40%的椰枣和蔬菜。农场到市场道路未铺设，导致15%农作物损耗。预测基于交通部2024年农业物流审计。", recommendation: "2027年前铺设600公里优先农业走廊。在4个节点安装冷链物流中心。2029年前完成全网络。" }
];

// --- PUBLIC INFRASTRUCTURE COMPETITIVENESS: AI-IDENTIFIED GAPS (ast_1) ---
// Agent scores each zone 0–100 across 6 sub-dimensions: transit access (20%), healthcare proximity (15%),
// education coverage (15%), utility reliability (20%), green space (15%), digital connectivity (15%).
// Sources: MOMRA municipal services DB, GASTAT infrastructure census, SEC reliability indices, RCRC GIS layers.
const INFRA_COMPETITIVENESS_ALERTS = [
  // RIYADH — 2 zones
  { id: 501, type: "infra_gap", name: "North Riyadh Metro Corridor, Riyadh", lat: 25.00, lng: 46.45, severity: "CRITICAL", delay: "SCORE: 42/100", cause: "AI识别：卫星图像计算机视觉分析确认利雅得地铁4号线车站完工90%，但周边5平方公里零公共公园（0平方米/人均 vs 世卫组织标准9平方米）。医疗缺口：最近医院8.2公里服务12万居民（0.4床位/千人 vs 全国平均2.2）。SEC电网数据显示97.8%正常运行（良好）但光纤入户率仅35%，尽管管道基础设施已安装。3所学校服务18,000名学龄儿童（容量缺口：4,200个学位）。\n\n低分原因：公交子分数因地铁而强（82/100）。但医疗（18/100）、绿地（5/100）和教育（31/100）严重不足。该区域在规划社会基础设施之前已进行住宅开发——典型的沙特「住房先行」缺口。\n\n对竞争力的影响：全球宜居性基准（EIU、美世）将医疗和绿地权重合计30%。该走廊综合评分42/100，相当于全球三线城市，尽管地铁投资超2,000亿SAR。修复医疗+公园可将评分提升至68/100（+26分）。", recommendation: "优先级1：在地铁站沿线分配3个地块（总计最少50,000平方米）建设公共公园——估计1.2亿SAR。优先级2：委托建设200床位区域医院（卫生部快速通道——24个月建设）。优先级3：建设2所小学（4,200个学位）。综合效果：评分从42→68。时间线：30个月。" },
  { id: 502, type: "infra_gap", name: "South Riyadh Industrial Belt, Riyadh", lat: 24.35, lng: 46.80, severity: "HIGH", delay: "SCORE: 51/100", cause: "AI识别：第二环路以南12平方公里区域，居住18万工业工人。公交评分：22/100（无地铁，3条公交线路班次间隔45分钟）。公用事业可靠性：94.2%正常运行（低于99%目标——2025年52小时计划外停电）。5G覆盖率：15%。每45,000名居民仅1个诊所。零专用绿地——最近公园6公里外。\n\n低分原因：工业区划意味着社会基础设施从未规划。但住宅蔓延意味着18万人现在永久居住在此。公交和医疗缺口使工人每天通勤90+分钟才能获得基本服务。\n\n对竞争力的影响：工业劳动力留存使雇主每年每名工人花费45,000 SAR交通补贴。根据麦肯锡基准，改善宜居性可减少25%流失率。", recommendation: "部署BRT线路连接工业带到地铁终点站（8公里，8亿SAR，18个月建设）。建立3个社区诊所+1个急救中心。升级SEC变电站达到99.5%可靠性。评分影响：51→72（+21分）。" },

  // MAKKAH — 2 zones
  { id: 503, type: "infra_gap", name: "East Jeddah Residential Sprawl, Makkah Region", lat: 21.65, lng: 39.35, severity: "CRITICAL", delay: "SCORE: 38/100", cause: "AI识别：吉达东部20平方公里卫星分析显示快速无序住宅增长（2018-2026年）。人口密度：15,000人/平方公里但基础设施按5,000人/平方公里设计。公交：零轨道交通，8条公交线路（平均班次间隔60分钟）。医疗：3个诊所服务30万居民（0.3床位/千人）。学校容量达145%。供水：16小时/天（间歇性）。绿地：0.8平方米/人均。\n\n低分原因：麦加省评分最低的区域。快速非正规密集化超过了基础设施规划。市政因碎片化私人产权无法获取公共设施用地。\n\n对竞争力的影响：该区域产生吉达Balady应用40%的投诉量。居民满意度调查：2.1/10。推动中产阶级北迁，形成城市不平等螺旋。", recommendation: "紧急基础设施方案：24/7供水（海水淡化厂扩建——20亿SAR，30个月）。BRT走廊到吉达中心（15亿SAR）。通过卫生部紧急拨款建设5所新学校+2所医院。地块整合建设3个公共公园。评分影响：38→62（+24分）。" },
  { id: 504, type: "infra_gap", name: "Taif Mountain Gateway, Makkah Region", lat: 21.30, lng: 40.45, severity: "HIGH", delay: "SCORE: 48/100", cause: "AI识别：塔伊夫旅游门户区（Al Hada-Al Shafa走廊）。基础设施为季节性游客优化但85,000常驻人口服务不足。公交：仅山路，无公共交通（评分12/100）。医疗：1所综合医院（120床位服务85,000人+200万年度游客）。数字化：无5G，光纤22%。绿地因山地环境自然优越（35平方米/人均）。\n\n低分原因：旅游投资优先考虑游客体验而非居民服务。随着塔伊夫因凉爽气候成为全年居住热门选择，常驻人口年增6%。\n\n对竞争力的影响：塔伊夫定位为2030愿景「山地旅游」锚点。但居民基础设施缺口威胁社区对旅游增长的接受度。", recommendation: "委托建设连接Al Hada、Al Shafa和塔伊夫市中心的公共穿梭系统（电动小巴车队——2亿SAR）。将医院扩建至350床位。沿走廊部署光纤+5G。评分影响：48→67（+19分）。" },

  // EASTERN PROVINCE — 2 zones
  { id: 505, type: "infra_gap", name: "Jubail Residential Sector, Eastern Province", lat: 27.00, lng: 49.55, severity: "HIGH", delay: "SCORE: 56/100", cause: "AI识别：朱拜勒工业城周围皇家委员会规划的住宅区。公交：内部公交系统（评分45/100）但无到达曼的城际铁路连接。医疗：皇家委员会医院充足（评分72/100）。教育：国际学校有限（评分48/100）。绿地：规划良好（12平方米/人均，评分78/100）。数字化：光纤85%，5G 60%（评分71/100）。公用事业可靠性：优秀（99.6%，评分92/100）。\n\n低分原因：公用事业和绿地强项，但与达曼都市区（80公里）的公交隔离和有限的教育选择使有学龄儿童的家庭不感兴趣。外籍工程师越来越多地拒绝朱拜勒派驻。\n\n对竞争力的影响：阿美/SABIC报告朱拜勒比达曼职位招聘成本高22%。公交缺口每名员工每年增加35,000 SAR通勤成本。", recommendation: "优先事项：朱拜勒-达曼快速铁路（80公里，80亿SAR，36个月建设——已在交通部管道中）。新增3个国际学校许可。评分影响：56→74（+18分）。" },
  { id: 506, type: "infra_gap", name: "Al Khobar Waterfront District, Eastern Province", lat: 26.20, lng: 50.30, severity: "HIGH", delay: "SCORE: 63/100", cause: "AI识别：胡拜尔高端滨海区。公交：中等（公交+邻近达曼地铁延伸，评分55/100）。医疗：法赫德国王医院3公里外（评分68/100）。教育：多样性良好包括邻近KFUPM（评分72/100）。绿地：滨海步道优秀（22平方米/人均，评分88/100）。数字化：全覆盖光纤+5G（评分85/100）。公用事业：99.2%（评分88/100）。\n\n分析意义：东部省监测区域中当前评分最高。但滨海开发计划（2027-2030年）将新增25,000居民——若无前瞻性投资，医疗和公交子评分将分别降至45/100和38/100。\n\n对竞争力的影响：目前是东部省最具竞争力的住宅区。若无前瞻性基础设施，2030年前评分有从63降至52的风险。", recommendation: "前瞻性容量建设：将达曼地铁2号线延伸至胡拜尔滨海区（30亿SAR）。委托建设200床位医院以吸收增长。在2030年增长期间保持评分63+。" },

  // MADINAH — 2 zones
  { id: 507, type: "infra_gap", name: "Knowledge Economic City, Madinah", lat: 24.55, lng: 39.20, severity: "CRITICAL", delay: "SCORE: 35/100", cause: "AI识别：KEC一期运营但周边区域服务严重不足。公交：无公共交通（评分8/100）——居民完全依赖私家车。距麦地那市中心25公里。医疗：1个小诊所（评分15/100）。教育：2所学校容量130%（评分28/100）。绿地：沙漠景观，零公共公园（评分3/100）。数字化：光纤仅到KEC建筑，周边住宅仅有ADSL（评分32/100）。\n\n低分原因：KEC作为孤立校园开发——无周边有机增长的住宅区城市规划。典型的「巨型项目孤岛」综合症。\n\n对竞争力的影响：KEC作为「知识之城」的价值主张因不宜居的周边环境而受损。伊斯兰大学卫星校区教师招聘提及生活质量担忧。", recommendation: "将KEC融入麦地那城市肌理：委托建设到哈拉曼站的穿梭巴士（15公里，1.5亿SAR）。建设区域医院（150床位）和3所学校。创建80,000平方米中央公园。部署全市光纤。评分影响：35→61（+26分）。" },
  { id: 508, type: "infra_gap", name: "Yanbu Heritage Coast, Madinah Region", lat: 24.00, lng: 38.00, severity: "HIGH", delay: "SCORE: 47/100", cause: "AI识别：延布传统市中心和滨海区域。公交：有限的本地公交（评分28/100）。医疗：对当前人口充足（评分62/100）。教育：足够（评分58/100）。绿地：滨海可达性良好但缺乏正式公园（评分42/100）。数字化：光纤40%，无5G（评分35/100）。公用事业：供水间歇性（18小时/天）（评分55/100）。\n\n低分原因：延布投资历史上集中在工业城（皇家委员会区域）。传统市中心基础设施老化——道路平均年龄28年，水管35年。\n\n对竞争力的影响：延布遗产海岸具有50亿SAR旅游开发潜力（红海邻近）但当前基础设施评分阻碍了私人投资。", recommendation: "城市更新计划：更换老化供水网络（8亿SAR，24个月）。在遗产海岸部署光纤+5G。创建3公里滨海步道公园。评分影响：47→64（+17分）。" },

  // ASIR — 1 zone
  { id: 509, type: "infra_gap", name: "Abha City Center, Asir", lat: 18.25, lng: 42.55, severity: "HIGH", delay: "SCORE: 52/100", cause: "AI识别：艾卜哈市中心（3平方公里核心区）。公交：无正式公共交通系统（评分15/100）——山地地形使标准公交线路困难。医疗：苏丹王子医院充足（评分65/100）。教育：学校密度良好（评分62/100）。绿地：山地公园优秀（评分82/100）。数字化：光纤55%，5G 20%（评分45/100）。公用事业：98.5%电网可靠性（评分82/100）。\n\n低分原因：公交和数字化子评分拖累综合评分，尽管自然设施优越。艾卜哈山地地理需要专业公交方案（缆车、齿轨铁路）但标准交通部规划未涉及。\n\n对竞争力的影响：苏戴开发项目预计2030年前每年100万+游客。无公交，艾卜哈市中心无法吸收游客溢出——造成拥堵并降低居民生活质量。", recommendation: "委托建设艾卜哈城市缆车系统（4站，12亿SAR——拉巴斯、麦德林验证模式）。利用苏戴电信投资加速5G部署。评分影响：52→71（+19分）。" },

  // QASSIM — 2 zones
  { id: 510, type: "infra_gap", name: "Buraidah Central District, Qassim", lat: 26.40, lng: 43.80, severity: "HIGH", delay: "SCORE: 49/100", cause: "AI识别：布赖代市中心。公交：无公共交通系统（评分10/100）。医疗：医院充足但分布不均——布赖代西部有15公里空白（评分52/100）。教育：强项——卡西姆大学邻近（评分70/100）。绿地：椰枣绿洲提供一些绿色但无正式公园（评分35/100）。数字化：光纤45%，仅5G试点（评分38/100）。公用事业：98.8%可靠（评分85/100）。\n\n低分原因：卡西姆历史上在城市公交和数字化基础设施投资不足。农业经济意味着城市化压力较小。但农业科技转型自2022年起推动快速城市化。\n\n对竞争力的影响：农业科技公司报告难以从利雅得吸引技术人才。68%拒绝职位的候选人引用「生活质量差距」（2025年HRDF调查）。", recommendation: "启动布赖代BRT（3条线路，6亿SAR）。将2块椰枣地转换为公共公园。加速光纤+5G（卡西姆2027数字化计划）。评分影响：49→66（+17分）。" },
  { id: 511, type: "infra_gap", name: "Unaizah Heritage Core, Qassim", lat: 25.90, lng: 44.10, severity: "HIGH", delay: "SCORE: 44/100", cause: "AI识别：欧奈扎传统市中心——以历史市场和农业遗产著称。公交：无（评分5/100）。医疗：1所综合医院，60床位服务17万人口（评分38/100）。教育：足够（评分60/100）。绿地：农业外围但城市核心零公园（评分22/100）。数字化：ADSL为主，光纤20%，无5G（评分25/100）。公用事业：夏季供水间歇性（评分65/100）。\n\n低分原因：欧奈扎在聚焦布赖代的卡西姆发展计划中被忽视。遗产旅游潜力（传统集市、椰枣节）因基础设施不足而未实现。\n\n对竞争力的影响：欧奈扎拥有沙特旅游管理局重视的正宗文化资产但基础设施评分使其不适合大规模旅游。", recommendation: "遗产旅游基础设施方案：到布赖代的穿梭巴士（30公里，1亿SAR）。将医院扩建至200床位。创建遗产区步行街和绿色走廊。部署光纤+5G。评分影响：44→63（+19分）。" }
];

// --- REAL ESTATE ASSET YIELD FORECAST: AI-IDENTIFIED HIGH-VALUE & AT-RISK ZONES (ast_2) ---
// Agent forecasts rental yield trajectory per zone using REGA transaction data, SAMA RE finance,
// population growth models, giga-project proximity scoring, and NHC supply pipeline analysis.
// Current national avg yield (Q1 2026): 5.2%. Vision 2030 target: RE sector at 10% of GDP (from 5.8%).
const YIELD_FORECAST_ALERTS = [
  // RIYADH — 2 zones
  { id: 601, type: "yield", name: "KAFD–Diriyah Gate Corridor, Riyadh", lat: 24.80, lng: 46.55, severity: "CRITICAL", delay: "YIELD: 6.1% → 9.4%", cause: "AI IDENTIFICATION: ML yield prediction model (trained on 10 years REGA data + satellite construction activity) forecasts 54% yield appreciation over 5 years. Zone sits between two giga-projects: KAFD (90% complete) and Diriyah Gate (60% complete). Combined project investment: SAR 120B+. Current gross yield: 6.1%. Projected 2030 yield: 9.4%.\n\nDRIVERS: (1) Corporate HQ relocations — 1,100+ companies mandated to move to Riyadh by 2030, with KAFD absorbing 30%. (2) Tourism — Diriyah Gate targets 5M visitors/year (2030), creating SAR 2.8B annual hospitality revenue within 3 km. (3) Metro Line 1 Diriyah station opening 2026 adds transit premium. (4) Supply constrained — heritage buffer zone limits new development west of KAFD.\n\nRISK ASSESSMENT: AI risk model scores 82/100 confidence (high). Primary risk: macro slowdown reducing corporate relocations. Mitigant: government mandate makes relocations non-discretionary.\n\nAI CLUSTERING: Geospatial K-means identifies this as Saudi Arabia's #1 appreciation zone across all 6 tracked regions.", recommendation: "INVESTMENT PRIORITY: HIGH. Accelerate mixed-use permits in corridor buffer zones. Mandate 30% residential allocation in new commercial permits to capture yield. Estimated portfolio value uplift: SAR 45B by 2030. Recommend REDF-backed affordable units within corridor to prevent workforce displacement." },
  { id: 602, type: "yield", name: "East Riyadh Logistics Hub, Riyadh", lat: 24.50, lng: 47.05, severity: "HIGH", delay: "YIELD: 4.8% → 7.2%", cause: "AI IDENTIFICATION: 15 km² zone at intersection of new dry port and King Salman Energy Park access. Current gross yield: 4.8% (industrial warehousing dominant). Projected 2030 yield: 7.2%.\n\nDRIVERS: (1) Saudi Arabia's logistics sector growing 12% YoY — e-commerce fulfillment demand doubling. (2) New dry port operations (2027) will increase commercial traffic 3×. (3) Land values currently SAR 800/sqm (low) with projected appreciation to SAR 2,200/sqm. (4) Government designating zone as 'logistics free zone' with tax incentives.\n\nRISK ASSESSMENT: AI risk model scores 71/100 confidence (moderate-high). Primary risk: competing logistics zones in Eastern Province (Dammam). Mitigant: Riyadh's central location gives 4-hour truck reach to 70% of Saudi population.\n\nAI CLUSTERING: Identified as highest-growth industrial/logistics zone nationally.", recommendation: "INVESTMENT PRIORITY: MEDIUM-HIGH. Fast-track logistics free zone designation. Pre-build Grade-A warehouse parks (300,000 sqm). Target e-commerce anchor tenants (Noon, Amazon SA). Estimated total asset value creation: SAR 18B by 2030." },

  // MAKKAH — 2 zones
  { id: 603, type: "yield", name: "Jeddah Central Waterfront, Makkah Region", lat: 21.55, lng: 39.12, severity: "CRITICAL", delay: "YIELD: 5.4% → 8.8%", cause: "AI识别：吉达中心项目（原机场用地750亿SAR巨型开发）。当前边缘区域毛收益率：5.4%。ML模型预测2030年项目各阶段完工时达到8.8%。\n\n驱动因素：（1）吉达中心总体规划：570万平方米混合用途空间，沙特历史上最大城市再开发。（2）吉达塔（世界最高）作为价值锚点。（3）现有滨海需求溢价——当前滨海收益率已达7.2%（吉达最高）。（4）红海国际机场扩建（15公里外）2030年前新增3,000万旅客容量。\n\n风险评估：AI风险模型评分76/100置信度（高）。主要风险：项目时间线延期（巨型项目历史延期2-3年）。缓解因素：皇室支持+PIF投资=执行确定性高于私营部门平均水平。\n\n情感分析：NLP扫描5,400份商业经纪报告显示83%对吉达滨水房地产持积极展望。", recommendation: "投资优先级：高。吉达中心3公里半径内区域——立即以开发前价格购地（3,500 SAR/平方米，预计2030年8,000 SAR/平方米）。推荐用途：酒店+服务式公寓，捕获副朝+休闲旅游汇合需求。" },
  { id: 604, type: "yield", name: "Makkah Southern Residential, Makkah", lat: 21.20, lng: 39.90, severity: "HIGH", delay: "YIELD: 4.5% → 6.8%", cause: "AI识别：禁寺以南8公里住宅区。当前毛收益率：4.5%。2030年预测：6.8%。\n\n驱动因素：（1）朝觐/副朝访客容量扩张——2030年目标3,000万副朝游客/年（2025年1,700万）。（2）哈拉曼铁路站4公里外。（3）住宅转服务式公寓趋势——15%的单元已上短租平台。（4）政府住房补贴（Sakani）提高自有率，减少出租库存，提高剩余出租物业收益率。\n\n风险评估：AI风险模型评分68/100置信度（中）。主要风险：麦加中心酒店过剩可能压缩禁寺5公里内住宅收益率。缓解因素：南部区域在酒店饱和半径之外——服务住宅需求。\n\nAI模式：季节性收益差异分析显示朝觐季节持续40%溢价——已计入年度收益预测。", recommendation: "投资优先级：中高。鼓励服务式公寓开发（收益率高于传统住宅）。改善到禁寺的公交连接以维持收益溢价。目标：2029年前2,000套新服务式公寓。" },

  // EASTERN PROVINCE — 2 zones
  { id: 605, type: "yield", name: "Dhahran Techno Valley, Eastern Province", lat: 26.30, lng: 50.15, severity: "CRITICAL", delay: "YIELD: 5.8% → 8.5%", cause: "AI识别：KFUPM科技谷（创新区）周边区域。当前毛收益率：5.8%。2030年预测：8.5%。\n\n驱动因素：（1）阿美研发园区扩建——新增8,000名研究员/工程师。（2）科技谷孵化器45家科技初创（2026年），预计2030年200+家。（3）沙特科技人才回流计划将15,000名技术工人带回东部省。（4）竞争供应有限——5公里内仅2个A级住宅开发项目。\n\n风险评估：AI风险模型评分79/100置信度（高）。主要风险：油价依赖影响阿美扩建速度。缓解因素：研发投资是非石油多元化战略——与油价反周期。\n\nAI聚类：识别为东部省#1增值区域。类似班加罗尔IT走廊轨迹（2010-2020年）。", recommendation: "投资优先级：高。在科技谷附近建设科技工人住房（智能公寓、共享居住）。目标：3,000套，均价120万SAR。预计15年内部收益率：14.2%。与KFUPM合作建设一体化校园城市模型。" },
  { id: 606, type: "yield", name: "Dammam Al Shatie District, Eastern Province", lat: 26.50, lng: 50.05, severity: "HIGH", delay: "YIELD: 5.2% → 7.0%", cause: "AI识别：达曼高端滨海区（Al Shatie）。当前毛收益率：5.2%。2030年预测：7.0%。\n\n驱动因素：（1）达曼滨海总体规划（120亿SAR）增加2公里长廊+码头。（2）跨海湾需求——巴林大桥通道每年产生40亿SAR零售消费。（3）东部省人口年增3.2%。（4）达曼唯一拥有A级办公供应的滨海区域。\n\n风险评估：AI风险模型评分65/100置信度（中）。主要风险：胡拜尔竞争性滨海开发稀释需求。缓解因素：达曼是行政首都——政府租户提供稳定入住底线。\n\n情感分析：商业经纪报告72%积极，28%中性——无负面展望。", recommendation: "投资优先级：中。多元化滨海业态——当前60%办公，建议调整为40%办公+30%住宅+30%娱乐，捕获巴林访客的周末/休闲需求。" },

  // MADINAH — 1 zone
  { id: 607, type: "yield", name: "Haramain Station District, Madinah", lat: 24.65, lng: 39.55, severity: "HIGH", delay: "YIELD: 4.2% → 7.1%", cause: "AI识别：麦地那哈拉曼高铁站周边区域。当前毛收益率：4.2%（追踪区域中最低——反映未开发环境）。2030年预测：7.1%（69%增值——全国最高增长率）。\n\n驱动因素：（1）车站日处理8,000名旅客，预计2030年增至15,000人——TOD需求教科书案例。（2）副朝游客从1,700万增至3,000万，在车站2公里内创造大量酒店需求。（3）车站附近几乎零商业供应——先发优势。（4）地价：1,800 SAR/平方米（显著低于公交可达性对应的公允价值——AI估值模型估计2028年公允价值5,500 SAR/平方米）。\n\n风险评估：AI风险模型评分73/100置信度（中高）。主要风险：多方业主土地所有权阻碍开发（沙特铁路+财政部+私人）。缓解因素：MOMRAH联合开发机构已提议——如实施，解锁150亿SAR开发。\n\nAI模式：NLP分析3,200份副朝游客评价识别「车站到住宿距离」为#1投诉（47%评价提及）。车站相邻酒店可捕获这一未满足需求。", recommendation: "投资优先级：高（低估）。加速联合开发机构组建。一期：车站500米内500套服务式公寓+50,000平方米零售。当前地价相比AI公允价值估计折价67%。" },

  // ASIR — 1 zone
  { id: 608, type: "yield", name: "Soudah Peaks Tourism Zone, Asir", lat: 18.40, lng: 42.40, severity: "HIGH", delay: "YIELD: 3.2% → 6.5%", cause: "AI识别：苏戴开发公司巨型项目（PIF支持，110亿SAR）周边区域。当前毛收益率：3.2%（开发前基线）。2030年预测：6.5%（103%增值）。\n\n驱动因素：（1）苏戴项目2030年前目标200万游客/年——豪华山地度假村，可比阿斯本/圣莫里茨。（2）目前现场零酒店供应——所有供应需新建。（3）凉爽气候（年均18°C）在沙特独特。（4）艾卜哈机场扩建（15亿SAR）2028年前新增直飞国际航线。\n\n风险评估：AI风险模型评分62/100置信度（中）。主要风险：旅游需求预测不确定性——苏戴是绿地项目无历史基线。缓解因素：PIF支持确保项目完成；国内旅游需求自2022年起年增25%。\n\nAI聚类：识别为沙特阿拉伯#1「新兴目的地」资产类别——可比Trojena（NEOM）但交付时间更早、海拔风险更低。", recommendation: "投资优先级：中高（投机性）。早期布局：获取苏戴总体规划内酒店特许经营权。建设精品旅馆物业（50-100间客房）。预计20年内部收益率：基础情景12.8%，上行情景18.5%。关键风险：执行时间线。" },

  // QASSIM — 1 zone
  { id: 609, type: "yield", name: "Buraidah Agri-Tech Innovation District, Qassim", lat: 26.30, lng: 43.95, severity: "HIGH", delay: "YIELD: 3.5% → 5.8%", cause: "AI识别：布赖代-Al Rass走廊新兴农业科技区。当前毛收益率：3.5%（低——主要为农用地带轻商业）。2030年预测：5.8%。\n\n驱动因素：（1）沙特农业科技部门年增15%——NEOM食品科技合作创建卡西姆供应链中心。（2）农业部指定卡西姆为「国家农业创新区」（2025年法令）。（3）6家农业科技初创企业寻找A级空间（当前零供应）。（4）农用地转商业用地创造4倍价值提升。\n\n风险评估：AI风险模型评分58/100置信度（中）。主要风险：农业科技部门在沙特尚处早期——基于全球类似案例（荷兰、以色列）的需求预测可能不完全适用。缓解因素：20亿SAR政府创新基金降低私人投资风险。\n\nAI模式：NLP扫描1,200份农业科技初创企业投资者演示显示72%偏好「卡西姆位置」——强显示性偏好信号。", recommendation: "投资优先级：中（长期）。建设孵化器+轻工业综合体（40,000平方米）。与MODON合作获取农业科技区认定。利基资产类别的先发优势。预计15年内部收益率：9.5%。" }
];

// --- MAP BUOY COMPONENT ---
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
      {/* Pulse rings */}
      <motion.div 
        className="absolute rounded-full border border-solid"
        style={{ borderColor: color }}
        initial={{ width: 10, height: 10, opacity: 1 }}
        animate={{ width: 50, height: 50, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute rounded-full border border-solid"
        style={{ borderColor: color }}
        initial={{ width: 10, height: 10, opacity: 1 }}
        animate={{ width: 50, height: 50, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
      />
      
      {/* Core dot */}
      <div className="w-2.5 h-2.5 rounded-full relative z-10" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}></div>
      
      {/* Always-on Tooltip/Label for Dashboard */}
      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#051105]/85 border backdrop-blur-md px-2.5 py-1.5 rounded-sm whitespace-nowrap opacity-100 pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col items-center transition-all duration-300 ${isHovered ? 'border-opacity-100 shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-110 -translate-y-2' : 'border-opacity-50 scale-100'}`} style={{ borderColor: isHovered ? color : `${color}50` }}>
         <div className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isHovered ? 'text-white' : 'text-gray-300'}`}>{alert.name}</div>
         <div className="text-[11px] font-black uppercase tracking-widest mt-0.5" style={{ color }}>
           {alert.type === 'commute' ? `${alert.delay} 延误` : alert.delay}
         </div>
      </div>
    </div>
  );
};

// --- DYNAMIC SVG ICONS FOR AGENTS ---
const DynamicFlowIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M3 12h4l2.5-6 4 12 2.5-6h5" strokeOpacity="0.3" />
    <motion.path 
      d="M3 12h4l2.5-6 4 12 2.5-6h5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      stroke={color}
      initial={{ pathLength: 0, opacity: 1 }}
      animate={{ pathLength: 1, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
    <motion.circle cx="9.5" cy="6" r="1.5" fill={color} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
    <motion.circle cx="13.5" cy="18" r="1.5" fill={color} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
  </svg>
);

const DynamicDemandIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="4" y="14" width="3" height="6" rx="0.5" strokeOpacity="0.3" />
    <rect x="10.5" y="10" width="3" height="10" rx="0.5" strokeOpacity="0.3" />
    <rect x="17" y="6" width="3" height="14" rx="0.5" strokeOpacity="0.3" />
    <motion.rect x="4" y="14" width="3" height="6" rx="0.5" fill={color} fillOpacity="0.2" animate={{ height: [0, 6, 0], y: [20, 14, 20] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.rect x="10.5" y="10" width="3" height="10" rx="0.5" fill={color} fillOpacity="0.2" animate={{ height: [0, 10, 0], y: [20, 10, 20] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
    <motion.rect x="17" y="6" width="3" height="14" rx="0.5" fill={color} fillOpacity="0.2" animate={{ height: [0, 14, 0], y: [20, 6, 20] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
    <motion.path d="M3 16 l7 -5 l6 -6" stroke={color} strokeLinecap="round" strokeLinejoin="round" 
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity }} />
  </svg>
);

const DynamicIdleIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M3 8h18M3 16h18M8 3v18M16 3v18" strokeOpacity="0.15" />
    <rect x="3" y="3" width="18" height="18" rx="2" strokeOpacity="0.3" />
    <motion.line x1="3" y1="3" x2="21" y2="3" stroke={color} strokeWidth="1" strokeOpacity="0.8" 
      animate={{ y: [0, 18, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
    <motion.rect x="8" y="8" width="8" height="8" strokeDasharray="2 2" strokeOpacity="0.8"
      animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
  </svg>
);

const DynamicAssetIcon = ({ color }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round">
    <motion.polygon points="12 3 20 7 12 11 4 7" fill={color} fillOpacity="0.1" animate={{ y: [-1, 1, -1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    <motion.polygon points="12 8 20 12 12 16 4 12" strokeOpacity="0.6" animate={{ y: [-0.5, 0.5, -0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
    <motion.polygon points="12 13 20 17 12 21 4 17" strokeOpacity="0.3" animate={{ y: [0, 0, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
    <motion.line x1="12" y1="11" x2="12" y2="21" strokeOpacity="0.4" strokeDasharray="2 2" />
  </svg>
);

// -- CORE AGENTS DATA WITH ADDED ALERTS & URGENCY STATS --
// --- 全国拥堵城市排名数据 ---
const CITY_CONGESTION_RANKING = [
  { rank: 1, city: '利雅得', region: '利雅得', congestionIndex: 78, avgDelay: '+35 min', criticalRoads: 12, affected: '2.3M', status: 'CRITICAL' },
  { rank: 2, city: '吉达', region: '麦加', congestionIndex: 72, avgDelay: '+28 min', criticalRoads: 8, affected: '1.5M', status: 'CRITICAL' },
  { rank: 3, city: '麦加', region: '麦加', congestionIndex: 68, avgDelay: '+32 min', criticalRoads: 6, affected: '1.2M', status: 'HIGH' },
  { rank: 4, city: '达曼', region: '东部', congestionIndex: 62, avgDelay: '+22 min', criticalRoads: 5, affected: '850K', status: 'HIGH' },
  { rank: 5, city: '麦地那', region: '麦地那', congestionIndex: 58, avgDelay: '+18 min', criticalRoads: 4, affected: '620K', status: 'WARNING' },
  { rank: 6, city: '胡拜尔', region: '东部', congestionIndex: 55, avgDelay: '+15 min', criticalRoads: 3, affected: '480K', status: 'WARNING' },
  { rank: 7, city: '塔布克', region: '塔布克', congestionIndex: 48, avgDelay: '+12 min', criticalRoads: 2, affected: '320K', status: '中等' },
  { rank: 8, city: '布赖代', region: '卡西姆', congestionIndex: 45, avgDelay: '+10 min', criticalRoads: 2, affected: '280K', status: '中等' },
];

const AGENTS_DATA = {
  flow: {
    id: "flow", title: "交通流代理", icon: DynamicFlowIcon, color: "#00B558",
    functions: [
      { 
        id: "flw_1", name: "24小时通勤指数", 
        desc: "AI利用实时计算机视觉源检测非周期性拥堵异常。",
        stats: [
          { label: '严重告警', value: '12', color: '#ff4444' },
          { label: '警告', value: '34', color: '#FCD34D' },
          { label: '活跃摄像头', value: '142', color: '#00B558' }
        ]
      },
      {
        id: "flw_4", name: "城市拥堵排名",
        desc: "全国城市实时交通拥堵指数。临界阈值：60+。",
        stats: [
          { label: '城市', value: '8', color: '#00B558' },
          { label: '严重', value: '4', color: '#ff4444' },
          { label: '高', value: '2', color: '#FCD34D' }
        ]
      }
    ]
  },
  demand: {
    id: "demand", title: "需求预测器", icon: DynamicDemandIcon, color: "#FCD34D",
    functions: [
      { 
        id: "dmd_1", name: "住房需求预测", 
        desc: "2030年前6大区域住房缺口。NHC Sakani数据+人口增长模型。2030目标：70%住房自有率。当前：63%。缺口=弥补差距所需单位。",
        stats: [
          { label: '2030年缺口', value: '-153K', color: '#ff4444' },
          { label: '自有率', value: '63%', color: '#FCD34D' },
          { label: '2030目标', value: '70%', color: '#00B558' }
        ]
      },
      { 
        id: "dmd_2", name: "道路网络扩展", 
        desc: "基于国家交通战略(2021-2030)和巨型项目走廊研究。当前：7.6万公里。目标：2030年前10万公里。",
        stats: [
          { label: '当前', value: '76K KM', color: '#FCD34D' },
          { label: '2030年差距', value: '24K KM', color: '#ff4444' },
          { label: '2030目标', value: '100K KM', color: '#00B558' }
        ]
      }
    ]
  },
  idle: {
    id: "idle", title: "闲置土地代理", icon: DynamicIdleIcon, color: "#ff4444",
    functions: [
      { 
        id: "idl_1", name: "白地激活率", 
        desc: "AI扫描MOMRAH白地登记册+卫星图像定位闲置地块。解释未开发原因并推荐用途。税率：2.5%。",
        stats: [
          { label: '2026年Q1', value: '38%', color: '#ff4444' },
          { label: '2030目标', value: '65%', color: '#00B558' },
          { label: 'AI发现', value: '12', color: '#FCD34D' }
        ]
      },
      { 
        id: "idl_2", name: "城市土地利用指数", 
        desc: "AI分析卫星足迹、基础设施密度和区划，识别利用不足区域。评估各区域影响并推荐开发。",
        stats: [
          { label: '2026年Q1', value: '58', color: '#ff4444' },
          { label: '标记区域', value: '13', color: '#FCD34D' }
        ]
      }
    ]
  },
  asset: {
    id: "asset", title: "资产评估", icon: DynamicAssetIcon, color: "#FCD34D",
    functions: [
      { 
        id: "ast_1", name: "基础设施竞争力指数", 
        desc: "对交通、医疗、教育、公用事业、绿地和数字化评分0-100。通过MOMRA+GASTAT数据与50个全球城市比较。",
        stats: [
          { label: '2026年Q1', value: '54', color: '#ff4444' },
          { label: '2030目标', value: '75', color: '#00B558' },
          { label: '标记区域', value: '11', color: '#FCD34D' }
        ]
      },
      { 
        id: "ast_2", name: "房地产收益预测", 
        desc: "基于10年REGA数据+卫星活动的ML模型预测各区域收益率。目标：房地产占GDP 10%。",
        stats: [
          { label: '2026年Q1', value: '5.2%', color: '#ff4444' },
          { label: '2030目标', value: '7.5%', color: '#00B558' },
          { label: '追踪区域', value: '9', color: '#FCD34D' }
        ]
      }
    ]
  }
};

function FunctionCard({ item, color, isActive, onClick, onActionClick, layout = "full" }: { item: any, color: string, isActive: boolean, onClick: () => void, onActionClick?: (id: string) => void, layout?: "full"|"half" }) {
  const [isHoveringInfo, setIsHoveringInfo] = useState(false);
  const rgbColor = color === '#FCD34D' ? '252,211,77' : color === '#ff4444' ? '255,68,68' : '0,181,88';
  const primaryStat = item.stats[0];
  const isRightPanel = item.id.startsWith('ast') || item.id.startsWith('idl');

  const renderMiniChart = () => {
    const rightPanelFullLayout = isRightPanel && layout === "full";
    const chartClass = isRightPanel 
      ? `absolute inset-0 w-full h-full transition-opacity duration-300 ${isActive ? 'opacity-100 z-20' : 'opacity-70'}`
      : `absolute right-2 bottom-0 w-[180px] h-[60px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`;

    if (!isRightPanel && layout !== "full") return null;

    if (item.id === "idl_1" || item.id === "idl_2") {
      return null;
    }

    if (item.id.startsWith("ast")) {
      const data = [
        { year: '21', y: 4.5 }, { year: '22', y: 4.0 }, 
        { year: '23', y: 3.8 }, { year: '24', y: 3.2 }, 
        { year: '25', y: 6.0 }, { year: '26', y: 8.5 }
      ];
      return (
        <div className={chartClass}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="year" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => `20${label}年`}
                formatter={(value: number) => [`${value}%`, '商业投资回报率']}
              />
              <defs>
                <linearGradient id={`roiGradMini-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#roiGradMini-${item.id})`} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id === "flw_1") {
      // Create distinct but correlated lines. Peak at hour 8 (morning commute).
      // Predicted is smooth, Actual is more erratic and only goes up to hour 12 (current time).
      const data = Array.from({length: 24}).map((_, i) => {
        // Base sine wave for daily rhythm (peak around 8-9am and 5-6pm)
        const rhythm = Math.max(0, Math.sin((i - 6) * Math.PI / 12) * 8 + Math.sin((i - 15) * Math.PI / 12) * 6);

        // Predicted is smoothed rhythm + baseline noise
        const predicted = Math.max(0, Math.floor(rhythm + 2));

        // Actual has more variance and specifically hits exactly 12 at hour 12
        let actual = null;
        if (i <= 12) {
          if (i === 12) actual = 12; // Force exactly 12 at current time
          else actual = Math.max(0, Math.floor(rhythm + (Math.random() * 6 - 2))); // +/- variance from rhythm
        }

        return {
          t: i,
          n: predicted,
          a: actual
        };
      });

      return (
        <div className={`absolute right-2 bottom-0 w-[180px] h-[60px] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="t" hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => `时间: ${label}:00`}
                formatter={(value: number, name: string) => {
                  if (name === 'n') return [`${value}`, '预测事件'];
                  if (name === 'a') return [`${value}`, '实际事件'];
                  return [value, name];
                }}
              />
              <Area type="monotone" dataKey="n" stroke="#00B558" strokeWidth={1} strokeDasharray="2 2" fillOpacity={0.1} fill="#00B558" isAnimationActive={false} />
              <Line type="monotone" dataKey="a" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id === "dmd_1") {
      const data = [
        { t: 'RYD', v: 35 }, { t: 'MKH', v: 42 }, { t: 'EST', v: 28 }, { t: 'MDN', v: 18 }, { t: 'ASR', v: 15 }, { t: 'QSM', v: 15 }
      ];
      return (
        <div className={`absolute right-0 bottom-0 w-[55%] h-[70%] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 4 }}>
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => {
                  const names: Record<string, string> = { RYD: '利雅得', MKH: '麦加', EST: '东部', MDN: '麦地那', ASR: '阿西尔', QSM: '卡西姆' };
                  return names[label] || label;
                }}
                formatter={(value: number) => [`${value}K套`, '2030年缺口']}
              />
              <Bar dataKey="v" fill={color} opacity={0.6} barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="v" position="top" fill="#FCD34D" fontSize={8} formatter={(v: number) => `${v}K`} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (item.id === "dmd_2") {
      const data = [
        { t: 'RYD', v: 4.2 }, { t: 'MKH', v: 1.8 }, { t: 'EST', v: 3.5 }, { t: 'MDN', v: 2.1 }, { t: 'ASR', v: 0.8 }, { t: 'QSM', v: 1.6 }
      ];
      return (
        <div className={`absolute right-0 bottom-0 w-[55%] h-[70%] transition-opacity duration-300 ${isActive ? 'opacity-90 z-20' : 'opacity-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 4 }}>
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', textTransform: 'uppercase' }}
                labelFormatter={(label) => {
                  const names: Record<string, string> = { RYD: '利雅得', MKH: '麦加', EST: '东部', MDN: '麦地那', ASR: '阿西尔', QSM: '卡西姆' };
                  return names[label] || label;
                }}
                formatter={(value: number) => [`${value}K KM`, '2030年差距']}
              />
              <defs>
                <linearGradient id="roadGradMini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#roadGradMini)" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 cursor-pointer flex flex-col group h-full
        ${layout === 'full' ? 'p-4' : 'p-3'}
        ${isActive 
          ? `bg-[#051105]/80 border shadow-[inset_0_0_20px_rgba(${rgbColor},0.15)]` 
          : `bg-[#070d07]/60 border shadow-[inset_0_0_10px_rgba(${rgbColor},0.05)] hover:bg-[#0c140c]/90`
        }
      `}
      style={{ borderColor: isActive ? color : `${color}40` }}
    >
       {/* Corner Accents */}
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-50 transition-colors" style={{ borderColor: color }} />
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-50 transition-colors" style={{ borderColor: color }} />

       <div className="flex justify-between items-start w-full gap-2 relative z-10">
         <h4 className={`font-black tracking-widest uppercase drop-shadow-sm leading-[1.15] ${layout === 'full' ? 'text-[15px] w-[80%]' : 'text-[11px] line-clamp-2'}`} style={{ color }}>
           {item.name}
         </h4>
         <div className="flex items-center gap-1 -mr-1 -mt-1 flex-none">
           {['flw_1', 'ast_1', 'ast_2'].includes(item.id) ? (
             <div 
               className="p-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
               onClick={(e) => {
                 e.stopPropagation();
                 if (onActionClick) onActionClick(item.id);
               }}
               title="查看详情"
             >
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                 className="flex items-center justify-center w-5 h-5 relative"
               >
                 <Target className="w-4 h-4" style={{ color }} />
                 <motion.div 
                   className="absolute inset-0 rounded-full border border-dashed opacity-50" 
                   style={{ borderColor: color }}
                   animate={{ rotate: -360 }}
                   transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 />
               </motion.div>
             </div>
           ) : (
             <div 
               className="p-1 cursor-help opacity-40 hover:opacity-100 transition-opacity"
               onMouseEnter={() => setIsHoveringInfo(true)}
               onMouseLeave={() => setIsHoveringInfo(false)}
             >
               <Info className="w-3.5 h-3.5" style={{ color }} />
             </div>
           )}
         </div>
       </div>

       <div className={`relative w-full flex-1 flex flex-col mt-2 z-10 min-h-[40px] ${(layout === 'half' && isRightPanel) ? 'justify-center' : ''}`}>
          {/* DESCRIPTION LAYER (Visible on Info Hover) */}
          <div className={`absolute inset-0 flex items-start bg-[#070d07]/95 backdrop-blur-sm transition-opacity duration-300 z-20 overflow-y-auto p-1 ${isHoveringInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <p className={`font-medium tracking-wider text-gray-300 uppercase ${layout === 'full' ? 'text-[10px] leading-[1.6]' : 'text-[9px] leading-[1.5]'}`}>
               {item.desc}
             </p>
          </div>

          {/* SPECIAL RENDERING FOR CITY CONGESTION RANKING TABLE */}
          {item.id === 'flw_4' ? (
            <div className={`w-full h-full transition-opacity duration-300 ${isHoveringInfo ? 'opacity-0' : 'opacity-100'}`}>
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#00B558]/30 scrollbar-track-transparent">
                <table className="w-full text-[9px]">
                  <thead className="sticky top-0 bg-[#070d07] z-10">
                    <tr className="text-[#00B558] border-b border-[#00B558]/30">
                      <th className="text-left py-1 px-1 font-bold">排名</th>
                      <th className="text-left py-1 px-1 font-bold">城市</th>
                      <th className="text-center py-1 px-1 font-bold">指数</th>
                      <th className="text-center py-1 px-1 font-bold">延误</th>
                      <th className="text-center py-1 px-1 font-bold">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CITY_CONGESTION_RANKING.map((city, idx) => {
                      const statusColor = city.status === 'CRITICAL' ? '#ff4444' : 
                                         city.status === 'HIGH' ? '#FCD34D' : 
                                         city.status === 'WARNING' ? '#3b82f6' : '#00B558';
                      const indexColor = city.congestionIndex >= 70 ? '#ff4444' :
                                        city.congestionIndex >= 60 ? '#FCD34D' :
                                        city.congestionIndex >= 50 ? '#3b82f6' : '#00B558';
                      
                      return (
                        <tr 
                          key={city.rank}
                          className={`border-b border-[#00B558]/10 hover:bg-[#00B558]/5 transition-colors cursor-pointer
                            ${idx % 2 === 0 ? 'bg-[#070d07]/40' : 'bg-[#070d07]/20'}`}
                        >
                          <td className="py-1 px-1 font-bold" style={{ color: indexColor }}>{city.rank}</td>
                          <td className="py-1 px-1">
                            <div className="font-bold text-white">{city.city}</div>
                            <div className="text-[7px] text-gray-500">{city.region}</div>
                          </td>
                          <td className="py-1 px-1 text-center font-bold" style={{ color: indexColor }}>
                            {city.congestionIndex}
                          </td>
                          <td className="py-1 px-1 text-center font-medium text-gray-300">
                            {city.avgDelay}
                          </td>
                          <td className="py-1 px-1 text-center">
                            <span 
                              className="inline-block px-1 py-0.5 rounded text-[8px] font-bold"
                              style={{ 
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                border: `1px solid ${statusColor}40`
                              }}
                            >
                              {city.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
          /* MULTI-METRIC LAYER (Hidden on Info Hover) */
          <div className={`w-full flex transition-opacity duration-300 relative ${isHoveringInfo ? 'opacity-0' : 'opacity-100'} 
            ${isRightPanel ? 'flex-1 flex-col justify-start items-start min-h-0' : 'items-end justify-between flex-1'}`}>
             
             {isRightPanel ? (
               <div className="flex flex-col w-full h-full">
                 <div className="flex justify-between items-end gap-2 w-full mb-1">
                   <span 
                      className="font-black leading-none tracking-tighter" 
                      style={{ color: primaryStat.color, fontSize: item.id === 'idl_2' ? (layout === 'full' ? '32px' : '28px') : (layout === 'full' ? '46px' : '36px'), textShadow: `0 0 20px ${primaryStat.color}60` }}
                   >
                      {primaryStat.value}
                   </span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[10px] mb-1 text-right flex-1">
                      {primaryStat.label}
                   </span>
                 </div>

                 {/* idl_2: Progress bar right below the value */}
                 {item.id === 'idl_2' && (
                   <div className="w-full mb-1">
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-[8px] font-bold tracking-[0.12em] uppercase text-gray-600">PROGRESS</span>
                       <span className="text-[9px] font-black tracking-wider" style={{ color: '#FCD34D' }}>72.5%</span>
                     </div>
                     <div className="relative w-full h-[5px] bg-[#1a2a1a] rounded-full overflow-visible">
                       <motion.div
                         className="absolute left-0 top-0 h-full rounded-full"
                         style={{ background: 'linear-gradient(90deg, #ff4444, #FCD34D)', boxShadow: '0 0 6px rgba(252,211,77,0.3)' }}
                         initial={{ width: 0 }}
                         animate={{ width: '72.5%' }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                       />
                     </div>
                     <div className="flex justify-between items-center mt-0.5">
                       <span className="text-[7px] text-gray-600 font-bold">0</span>
                       <span className="text-[7px] text-[#FCD34D] font-bold">58 当前</span>
                       <span className="text-[7px] text-[#00B558] font-bold">80 目标</span>
                     </div>
                   </div>
                 )}
                 
                 {/* Stacked secondary metrics */}
                 <div className={`flex flex-col w-full ${isRightPanel ? 'flex-1 justify-center mb-1' : ''}`}>
                   {item.stats.slice(1).map((stat: any, idx: number) => (
                     <div key={idx} className={`flex justify-between items-center w-full border-t border-slate-800/50 ${isRightPanel ? 'py-1.5' : 'py-1 mt-0.5'}`}>
                       <span className={`text-slate-500 font-bold tracking-wider uppercase ${isRightPanel ? 'text-[10px]' : 'text-[9px]'}`}>{stat.label}</span>
                       <span className={`font-black tracking-widest ${isRightPanel ? 'text-[12px]' : 'text-[11px]'}`} style={{ color: stat.color || color }}>{stat.value}</span>
                     </div>
                   ))}
                 </div>
                 
                 {!isRightPanel && (
                   <div className="flex-1 w-full min-h-[40px] mt-1 relative">
                     {renderMiniChart()}
                   </div>
                 )}
               </div>
             ) : (
               <>
                 <div className="flex flex-col relative z-10">
                   <span 
                      className="font-black leading-none tracking-tighter" 
                      style={{ color: primaryStat.color, fontSize: layout === 'full' ? '46px' : '32px', textShadow: `0 0 20px ${primaryStat.color}60` }}
                   >
                      {primaryStat.value}
                   </span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[10px] mt-1">
                      {primaryStat.label}
                   </span>
                   {item.id === 'dmd_2' && (
                     <span className="font-bold tracking-widest uppercase text-[10px] mt-0.5" style={{ color: '#00B558' }}>
                       10万KM (2030目标)
                     </span>
                   )}
                 </div>
                 {renderMiniChart()}
               </>
             )}
          </div>
          )}
       </div>
    </div>
  );
}

const TargetModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Heavy Blur Backdrop */}
      <div className="absolute inset-0 bg-[#020805]/85 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-[1160px] h-[85vh] max-h-[800px] bg-gradient-to-br from-[#051105] to-[#0a1a0a] border border-[#00B558]/40 shadow-[0_0_80px_rgba(0,181,88,0.2)] flex flex-col overflow-hidden rounded-xl"
      >
        {/* Military Cyberpunk Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-[2px] bg-[#00B558]" />
        <div className="absolute top-0 left-0 w-[2px] h-32 bg-[#00B558]" />
        <div className="absolute bottom-0 right-0 w-32 h-[2px] bg-[#00B558]" />
        <div className="absolute bottom-0 right-0 w-[2px] h-32 bg-[#00B558]" />
        <div className="absolute top-2 right-12 flex gap-1">
          {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#00B558]/40" />)}
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#00B558]/20 bg-[#00B558]/10 relative overflow-hidden">
          <motion.div 
             className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[#00B558]/10 to-transparent"
             animate={{ x: ['-100%', '100%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full border-2 border-[#00B558] flex items-center justify-center relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="flex items-center justify-center relative w-full h-full"
              >
                <Target className="w-5 h-5 text-[#00B558]" />
              </motion.div>
              <div className="absolute inset-0 rounded-full border border-[#00B558] animate-ping opacity-50" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(0,181,88,0.5)] leading-none mb-1">
                通勤效率状态与预测
              </h2>
              <span className="text-[10px] text-[#00B558] font-bold tracking-[0.2em] uppercase">交通流代理 // 战略KPI诊断</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#00B558]/60 hover:text-white hover:bg-[#00B558]/20 rounded transition-colors relative z-10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col p-8 gap-8 relative z-10 h-full overflow-hidden">
          
          {/* AI INSIGHT BANNER */}
          <div className="flex items-center justify-between gap-4 bg-[#00B558]/5 border border-[#00B558]/20 px-6 py-3 shrink-0 shadow-[0_0_15px_rgba(0,181,88,0.05)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00B558]" />
            <div className="flex items-center gap-3 relative z-10">
              <Zap className="w-4 h-4 text-[#00B558] animate-pulse" />
              <span className="text-[10px] font-bold text-[#00B558] tracking-[0.15em] uppercase">
                系统洞察：AI利用实时计算机视觉源检测非周期性拥堵异常。
              </span>
            </div>
            <div className="flex gap-1 relative z-10">
               {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-3 bg-[#00B558]/40" />)}
            </div>
          </div>

          {/* HERO VISUALIZATION: CURRENT VS TARGET */}
          <div className="flex items-center justify-between bg-gradient-to-b from-[#030a03] to-[#051105] border border-[#00B558]/30 p-6 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,181,88,0.1)] before:absolute before:inset-0 before:bg-[linear-gradient(rgba(0,181,88,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,181,88,0.05)_1px,transparent_1px)] before:bg-[size:20px_20px] before:pointer-events-none">
             
             {/* Left: CURRENT VALUE */}
             <div className="flex items-center gap-6 w-[35%] relative z-10">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                   <svg width="128" height="128" className="absolute transform -rotate-90">
                      <circle cx="64" cy="64" r="60" fill="none" stroke="#00B558" strokeWidth="1" strokeDasharray="4 8" opacity="0.4" className="animate-[spin_20s_linear_infinite]" style={{ transformOrigin: "64px 64px" }} />
                      <circle cx="64" cy="64" r="50" fill="none" stroke="#00B558" strokeWidth="2" opacity="0.1" />
                      <motion.circle cx="64" cy="64" r="50" fill="none" stroke="#00B558" strokeWidth="6" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50} animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - 0.78) }} transition={{ duration: 2, ease: "easeOut" }} style={{ filter: 'drop-shadow(0 0 10px rgba(0,181,88,0.8))' }} strokeLinecap="round" />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-[#00B558] font-bold tracking-[0.2em] uppercase mb-0.5">INDEX</span>
                      <span className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(0,181,88,1)] leading-none tracking-tighter">78</span>
                   </div>
                </div>
                <div className="flex flex-col">
                   <span className="text-[#00B558] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#00B558] rounded-full animate-pulse" /> 当前状态
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-none mb-1.5">中等</h3>
                   <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">实时: 08:42</span>
                </div>
             </div>

             {/* Middle: GAP CONNECTOR */}
             <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
                <div className="w-full flex items-center">
                   <div className="h-[2px] bg-gradient-to-r from-[#00B558] via-[#00B558] to-[#FCD34D] flex-1 relative overflow-hidden">
                      <motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ["-20%", "120%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                   </div>
                   <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center shadow-[0_0_20px_rgba(252,211,77,0.1)]">
                      <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">效率差距</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FCD34D]" />
                        <span className="text-lg font-black text-[#FCD34D] tracking-widest">+14 PTS</span>
                      </div>
                   </div>
                   <div className="h-[2px] bg-gradient-to-r from-[#FCD34D] to-[#FCD34D] flex-1 relative overflow-hidden">
                      <motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ["-20%", "120%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                   </div>
                </div>
             </div>

             {/* Right: TARGET VALUE */}
             <div className="flex items-center gap-6 w-[35%] flex-row-reverse text-right relative z-10">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                   <svg width="128" height="128" className="absolute transform -rotate-90">
                      <circle cx="64" cy="64" r="60" fill="none" stroke="#FCD34D" strokeWidth="1" strokeDasharray="4 8" opacity="0.4" className="animate-[spin_20s_linear_infinite_reverse]" style={{ transformOrigin: "64px 64px" }} />
                      <circle cx="64" cy="64" r="50" fill="none" stroke="#FCD34D" strokeWidth="2" opacity="0.1" />
                      <motion.circle cx="64" cy="64" r="50" fill="none" stroke="#FCD34D" strokeWidth="6" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50} animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - 0.92) }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} style={{ filter: 'drop-shadow(0 0 10px rgba(252,211,77,0.8))' }} strokeLinecap="round" />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-[#FCD34D] font-bold tracking-[0.2em] uppercase mb-0.5">INDEX</span>
                      <span className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(252,211,77,1)] leading-none tracking-tighter">92</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[#FCD34D] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2">
                     2030目标 <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-sm" />
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-none mb-1.5">最优</h3>
                   <span className="text-[10px] text-[#FCD34D]/70 font-mono tracking-wider border border-[#FCD34D]/20 bg-[#FCD34D]/5 px-2 py-0.5 inline-block w-fit">愿景目标</span>
                </div>
             </div>
          </div>

          {/* TWO COLUMN LOGIC & MATRIX */}
          <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
             
             {/* LEFT COLUMN: 计算逻辑 */}
             <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-[#00B558] uppercase tracking-[0.2em] border-b border-[#00B558]/30 pb-2 flex items-center gap-2 shrink-0">
                  <Zap className="w-3.5 h-3.5" /> 计算逻辑
                </h3>
                
                <div className="bg-gradient-to-br from-[#0a1a0a] to-[#051105] border border-[#00B558]/20 p-6 flex flex-col flex-1 justify-between relative overflow-hidden min-h-0">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-[#00B558]/5 rotate-45 transform translate-x-10 -translate-y-10 pointer-events-none" />
                   
                   {/* Huge Formula Block */}
                   <div className="bg-[#030a03] border border-[#00B558]/30 p-4 flex flex-col items-center justify-center gap-4 shadow-[inset_0_0_20px_rgba(0,181,88,0.1)] mb-4 shrink-0">
                      <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">通勤效率算法</span>
                      <div className="flex items-center gap-3 font-mono text-base tracking-wider">
                         <span className="text-white font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">INDEX</span> 
                         <span className="text-[#00B558]">=</span> 
                         <span className="text-white">100</span> 
                         <span className="text-[#00B558]">×</span> 
                         <span className="flex items-center gap-2 bg-[#00B558]/10 px-3 py-1.5 rounded-sm border border-[#00B558]/20">
                            <span className="flex flex-col items-center leading-none gap-1">
                               <span className="text-gray-200 text-xs">V<sub className="text-[9px] text-[#00B558]">ACTUAL</sub></span>
                               <span className="w-full h-px bg-[#00B558]/60 my-0.5"></span>
                               <span className="text-gray-400 text-xs">V<sub className="text-[9px]">BASE</sub></span>
                            </span>
                         </span>
                         <span className="text-[#00B558]">×</span> 
                         <span className="text-[#FCD34D] drop-shadow-[0_0_10px_rgba(252,211,77,0.3)]">C<sub className="text-[10px] text-gray-400">MOD</sub></span>
                      </div>
                   </div>

                   {/* Parameter Breakdown */}
                   <div className="flex flex-col gap-3 justify-center flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-[#00B558] rounded-none mt-1.5 shrink-0 shadow-[0_0_8px_#00B558]" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">V<sub className="text-[9px] text-gray-400">ACTUAL</sub></span>
                            <span className="text-[9px] text-[#00B558] font-mono bg-[#00B558]/10 border border-[#00B558]/20 px-1.5 py-0.5 rounded-[2px] tracking-widest">实时数据源</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">通过计算机视觉和IoT获取的当前路段平均速度。</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-none mt-1.5 shrink-0" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">V<sub className="text-[9px] text-gray-400">BASE</sub></span>
                            <span className="text-[9px] text-gray-400 font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-[2px] tracking-widest">历史AI</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">预期非高峰稳态速度(13:00-16:00平均值)。</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-none mt-1.5 shrink-0 shadow-[0_0_8px_#FCD34D]" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">C<sub className="text-[9px] text-gray-400">MOD</sub></span>
                            <span className="text-[9px] text-[#FCD34D] font-mono bg-[#FCD34D]/10 border border-[#FCD34D]/20 px-1.5 py-0.5 rounded-[2px] tracking-widest">0.6 ~ 1.0 (动态)</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">事故、天气和非周期性事件的动态惩罚因子。</span>
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* RIGHT COLUMN: INTERPRETATION MATRIX */}
             <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-[#00B558] uppercase tracking-[0.2em] border-b border-[#00B558]/30 pb-2 flex items-center gap-2 shrink-0">
                  <Activity className="w-3.5 h-3.5" /> 指数解读矩阵
                </h3>
                
                <div className="flex flex-col flex-1 bg-[#051105] border border-[#00B558]/20 rounded-sm overflow-hidden min-h-0">
                   {/* Matrix Header */}
                   <div className="grid grid-cols-12 bg-[#00B558]/15 border-b border-[#00B558]/30 text-[9px] font-black text-[#00B558] uppercase tracking-widest px-4 py-2.5 shrink-0">
                     <div className="col-span-3">指数范围</div>
                     <div className="col-span-4">状态等级</div>
                     <div className="col-span-5">建议措施</div>
                   </div>
                   
                   <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                     {/* Row 1 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">90-100</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#00B558] shadow-[0_0_10px_rgba(0,181,88,0.8)] shrink-0" /> 最优通行
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">维持当前信号灯配时</div>
                     </div>

                     {/* Row 2 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">70-89</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#FCD34D] shadow-[0_0_10px_rgba(252,211,77,0.8)] shrink-0" /> 基本通行
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">监控流量趋势变化</div>
                     </div>

                     {/* Row 3 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">50-69</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.8)] shrink-0" /> 轻度拥堵
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">优化路口信号同步</div>
                     </div>

                     {/* Row 4 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">30-49</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.8)] shrink-0" /> 中度拥堵
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">启用潮汐车道/公交优先</div>
                     </div>

                     {/* Row 5 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 hover:bg-[#ff4444]/10 transition-colors flex-1 min-h-[40px] bg-[#ff4444]/5">
                       <div className="col-span-3 font-mono font-black text-[#ff4444] text-[11px] tracking-wider">0-29</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-[#ff4444] uppercase tracking-widest text-[9px]">
                         <div className="relative w-2 h-2 shrink-0">
                           <span className="absolute inset-0 rounded-full bg-[#ff4444] animate-ping opacity-75" />
                           <span className="relative block w-2 h-2 rounded-full bg-black border-[1.5px] border-[#ff4444] shadow-[0_0_10px_rgba(255,68,68,1)]" />
                         </div> 
                         严重拥堵
                       </div>
                       <div className="col-span-5 text-[9px] text-[#ff4444] uppercase tracking-wide font-bold">触发紧急响应与改道</div>
                     </div>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- 基础设施竞争力指数 DETAIL MODAL ---
const InfraModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  const color = '#FCD34D';
  const subDimensions = [
    { name: '交通可达性', weight: 20, national: 38, target: 70, icon: '🚇', desc: '800米内有公共交通(地铁、BRT、公交)的人口比例' },
    { name: '公用事业可靠性', weight: 20, national: 72, target: 95, icon: '⚡', desc: 'SEC电网正常运行时间+供水连续性' },
    { name: '医疗邻近性', weight: 15, national: 52, target: 75, icon: '🏥', desc: '每千人医院床位+到初级医疗的平均距离' },
    { name: '教育覆盖率', weight: 15, national: 58, target: 80, icon: '🎓', desc: '学校学位与学龄人口比' },
    { name: '绿地空间', weight: 15, national: 35, target: 60, icon: '🌳', desc: '人均公园面积 vs WHO标准(9平方米/人)' },
    { name: '数字连接', weight: 15, national: 55, target: 80, icon: '📡', desc: '光纤入户率+5G覆盖率' },
  ];
  const regions = [
    { name: '利雅得', score: 62, target: 78, gap: 16 },
    { name: '麦加', score: 48, target: 72, gap: 24 },
    { name: '东部', score: 59, target: 76, gap: 17 },
    { name: '麦地那', score: 45, target: 70, gap: 25 },
    { name: '阿西尔', score: 52, target: 71, gap: 19 },
    { name: '卡西姆', score: 47, target: 68, gap: 21 },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-[#020805]/85 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-[1160px] h-[85vh] max-h-[800px] bg-gradient-to-br from-[#051105] to-[#0a1a0a] border border-[#FCD34D]/40 shadow-[0_0_80px_rgba(252,211,77,0.2)] flex flex-col overflow-hidden rounded-xl"
      >
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-[2px] bg-[#FCD34D]" />
        <div className="absolute top-0 left-0 w-[2px] h-32 bg-[#FCD34D]" />
        <div className="absolute bottom-0 right-0 w-32 h-[2px] bg-[#FCD34D]" />
        <div className="absolute bottom-0 right-0 w-[2px] h-32 bg-[#FCD34D]" />

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#FCD34D]/20 bg-[#FCD34D]/10 relative overflow-hidden">
          <motion.div className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[#FCD34D]/10 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full border-2 border-[#FCD34D] flex items-center justify-center relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="flex items-center justify-center w-full h-full"><Target className="w-5 h-5 text-[#FCD34D]" /></motion.div>
              <div className="absolute inset-0 rounded-full border border-[#FCD34D] animate-ping opacity-50" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(252,211,77,0.5)] leading-none mb-1">基础设施竞争力指数</h2>
              <span className="text-[10px] text-[#FCD34D] font-bold tracking-[0.2em] uppercase">资产评估代理 // 2030愿景宜居性KPI</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#FCD34D]/60 hover:text-white hover:bg-[#FCD34D]/20 rounded transition-colors relative z-10"><X className="w-6 h-6" /></button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col p-8 pb-12 gap-6 relative z-10 h-full overflow-y-auto">

          {/* AI INSIGHT BANNER */}
          <div className="flex items-center gap-4 bg-[#FCD34D]/5 border border-[#FCD34D]/20 px-6 py-3 shrink-0 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FCD34D]" />
            <Zap className="w-4 h-4 text-[#FCD34D] animate-pulse" />
            <span className="text-[10px] font-bold text-[#FCD34D] tracking-[0.15em] uppercase">AI引擎：计算机视觉验证基础设施实际交付与计划对比。异常检测标记停滞的改进。与50个全球城市比较。</span>
          </div>

          {/* HERO: CURRENT vs TARGET */}
          <div className="flex items-center justify-between bg-gradient-to-b from-[#030a03] to-[#051105] border border-[#FCD34D]/30 p-6 relative overflow-hidden shadow-[inset_0_0_40px_rgba(252,211,77,0.1)] before:absolute before:inset-0 before:bg-[linear-gradient(rgba(252,211,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(252,211,77,0.03)_1px,transparent_1px)] before:bg-[size:20px_20px] before:pointer-events-none shrink-0">
            <div className="flex items-center gap-6 w-[35%] relative z-10">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg width="112" height="112" className="absolute transform -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 8" opacity="0.4" />
                  <circle cx="56" cy="56" r="40" fill="none" stroke={color} strokeWidth="2" opacity="0.1" />
                  <motion.circle cx="56" cy="56" r="40" fill="none" stroke="#ff4444" strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40} animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.54) }} transition={{ duration: 2, ease: "easeOut" }} style={{ filter: 'drop-shadow(0 0 10px rgba(255,68,68,0.8))' }} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[8px] text-[#ff4444] font-bold tracking-[0.2em] uppercase">SCORE</span>
                  <span className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(255,68,68,1)] leading-none tracking-tighter">54</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[#ff4444] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#ff4444] rounded-full animate-pulse" /> 全国平均</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">低于目标</h3>
                <span className="text-[10px] text-[#ff4444]/70 font-mono tracking-wider border border-[#ff4444]/20 bg-[#ff4444]/5 px-2 py-0.5 inline-block w-fit">Q1 2026</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
              <div className="w-full flex items-center">
                <div className="h-[2px] bg-gradient-to-r from-[#ff4444] to-[#FCD34D] flex-1 relative overflow-hidden"><motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ['-20%', '120%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} /></div>
                <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center">
                  <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">2030年差距</span>
                  <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-[#FCD34D]" /><span className="text-lg font-black text-[#FCD34D] tracking-widest">+21 PTS</span></div>
                </div>
                <div className="h-[2px] bg-gradient-to-r from-[#FCD34D] to-[#00B558] flex-1 relative overflow-hidden"><motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ['-20%', '120%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} /></div>
              </div>
            </div>
            <div className="flex items-center gap-6 w-[35%] flex-row-reverse text-right relative z-10">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg width="112" height="112" className="absolute transform -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#00B558" strokeWidth="1" strokeDasharray="4 8" opacity="0.4" />
                  <circle cx="56" cy="56" r="40" fill="none" stroke="#00B558" strokeWidth="2" opacity="0.1" />
                  <motion.circle cx="56" cy="56" r="40" fill="none" stroke="#00B558" strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40} animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.75) }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} style={{ filter: 'drop-shadow(0 0 10px rgba(0,181,88,0.8))' }} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[8px] text-[#00B558] font-bold tracking-[0.2em] uppercase">SCORE</span>
                  <span className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(0,181,88,1)] leading-none tracking-tighter">75</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#00B558] font-bold tracking-[0.25em] uppercase text-[9px] mb-1">2030目标</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">全球前40</h3>
                <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">愿景目标</span>
              </div>
            </div>
          </div>

          {/* TWO COLUMN: Sub-Dimensions + Regional Breakdown */}
          <div className="grid grid-cols-2 gap-8">

            {/* LEFT: 6 Sub-Dimension Breakdown */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Zap className="w-3.5 h-3.5" /> 评分子维度(贡献组合)</h3>
              <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-2">
                {subDimensions.map((dim, i) => (
                  <div key={i} className="bg-[#0a1a0a] border border-[#FCD34D]/15 p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{dim.icon}</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{dim.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-black text-[#FCD34D] bg-[#FCD34D]/10 border border-[#FCD34D]/20 px-1.5 py-0.5 tracking-widest">{dim.weight}% 权重</span>
                    </div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">{dim.desc}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[#051105] rounded-sm overflow-hidden relative">
                        <motion.div className="h-full rounded-sm" style={{ backgroundColor: dim.national < 50 ? '#ff4444' : '#FCD34D' }} initial={{ width: 0 }} animate={{ width: `${dim.national}%` }} transition={{ duration: 1.5, delay: i * 0.1 }} />
                        <div className="absolute top-0 h-full w-[2px] bg-[#00B558]" style={{ left: `${dim.target}%` }}><div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] text-[#00B558] font-bold whitespace-nowrap">{dim.target}</div></div>
                      </div>
                      <span className="text-[10px] font-black w-8 text-right" style={{ color: dim.national < 50 ? '#ff4444' : '#FCD34D' }}>{dim.national}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Regional Scores */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Activity className="w-3.5 h-3.5" /> 区域竞争力得分</h3>
              <div className="flex flex-col flex-1 bg-[#051105] border border-[#FCD34D]/20 overflow-hidden min-h-0">
                <div className="grid grid-cols-12 bg-[#FCD34D]/15 border-b border-[#FCD34D]/30 text-[9px] font-black text-[#FCD34D] uppercase tracking-widest px-4 py-2.5 shrink-0">
                  <div className="col-span-3">区域</div>
                  <div className="col-span-3">当前</div>
                  <div className="col-span-3">2030目标</div>
                  <div className="col-span-3">差距</div>
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                  {regions.map((r, i) => (
                    <div key={i} className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#FCD34D]/10 hover:bg-[#FCD34D]/10 transition-colors">
                      <div className="col-span-3 text-[11px] font-black text-white tracking-wider uppercase">{r.name}</div>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#051105] rounded-sm overflow-hidden"><motion.div className="h-full" style={{ backgroundColor: r.score < 50 ? '#ff4444' : '#FCD34D' }} initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ duration: 1, delay: i * 0.1 }} /></div>
                        <span className="text-[11px] font-black" style={{ color: r.score < 50 ? '#ff4444' : '#FCD34D' }}>{r.score}</span>
                      </div>
                      <div className="col-span-3 text-[11px] font-black text-[#00B558] tracking-wider">{r.target}</div>
                      <div className="col-span-3 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#FCD34D]" />
                        <span className="text-[11px] font-black text-[#FCD34D]">+{r.gap}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-[#0a1a0a] border border-[#FCD34D]/15 p-3 shrink-0 mb-2">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">数据来源：</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">MOMRA市政数据库 · GASTAT基础设施普查 · SEC可靠性指数 · 卫生部设施登记 · 教育部学校密度 · RCRC绿地GIS · CITC数字化覆盖</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- 房地产收益预测 DETAIL MODAL ---
const YieldModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  const regions = [
    { name: '利雅得', current: 6.1, projected: 8.2, drivers: 'KAFD+德拉伊耶门+企业总部指令', confidence: 82 },
    { name: '麦加', current: 4.8, projected: 7.1, drivers: '吉达中心+3000万副朝目标+红海机场', confidence: 76 },
    { name: '东部', current: 5.5, projected: 7.8, drivers: '阿美研发扩展+科技谷+1.5万人才回流', confidence: 79 },
    { name: '麦地那', current: 4.2, projected: 6.5, drivers: '哈拉曼站TOD+副朝增长+KEC二期', confidence: 73 },
    { name: '阿西尔', current: 3.8, projected: 6.0, drivers: '苏戴峰度假村(110亿SAR)+艾卜哈机场扩建', confidence: 62 },
    { name: '卡西姆', current: 3.5, projected: 5.8, drivers: '农业科技创新区+NEOM食品科技合作', confidence: 58 },
  ];
  const factors = [
    { name: '需求乘数', weight: 35, desc: '人口增长率+企业总部搬迁+旅游住宿夜数预测', color: '#FCD34D' },
    { name: '供应压力', weight: 20, desc: 'NHC住房管道+商业许可发放(供应越多=收益压缩)', color: '#ff4444' },
    { name: '巨型项目溢价', weight: 25, desc: '邻近KAFD、德拉伊耶、吉达中心、NEOM、红海 — 增加1.5-3.0%收益溢价', color: '#00B558' },
    { name: '基础设施质量', weight: 10, desc: '来自PICI评分的交通可达性、公用事业可靠性、数字连接', color: '#3b82f6' },
    { name: '风险折扣', weight: 10, desc: '供应过剩风险、单一行业依赖、宏观敏感性 — 降低预测收益', color: '#f97316' },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-[#020805]/85 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-[1160px] h-[85vh] max-h-[800px] bg-gradient-to-br from-[#051105] to-[#0a1a0a] border border-[#FCD34D]/40 shadow-[0_0_80px_rgba(252,211,77,0.2)] flex flex-col overflow-hidden rounded-xl"
      >
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-[2px] bg-[#FCD34D]" />
        <div className="absolute top-0 left-0 w-[2px] h-32 bg-[#FCD34D]" />
        <div className="absolute bottom-0 right-0 w-32 h-[2px] bg-[#FCD34D]" />
        <div className="absolute bottom-0 right-0 w-[2px] h-32 bg-[#FCD34D]" />

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#FCD34D]/20 bg-[#FCD34D]/10 relative overflow-hidden">
          <motion.div className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[#FCD34D]/10 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full border-2 border-[#FCD34D] flex items-center justify-center relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="flex items-center justify-center w-full h-full"><Target className="w-5 h-5 text-[#FCD34D]" /></motion.div>
              <div className="absolute inset-0 rounded-full border border-[#FCD34D] animate-ping opacity-50" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(252,211,77,0.5)] leading-none mb-1">房地产收益预测</h2>
              <span className="text-[10px] text-[#FCD34D] font-bold tracking-[0.2em] uppercase">资产评估代理 // 2030愿景房地产目标：GDP的10%</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#FCD34D]/60 hover:text-white hover:bg-[#FCD34D]/20 rounded transition-colors relative z-10"><X className="w-6 h-6" /></button>
        </div>

        {/* Content */}
        <div className="flex flex-col p-8 pb-12 gap-6 relative z-10 h-full overflow-y-auto">

          {/* AI INSIGHT */}
          <div className="flex items-center gap-4 bg-[#FCD34D]/5 border border-[#FCD34D]/20 px-6 py-3 shrink-0 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FCD34D]" />
            <Zap className="w-4 h-4 text-[#FCD34D] animate-pulse" />
            <span className="text-[10px] font-bold text-[#FCD34D] tracking-[0.15em] uppercase">基于10年REGA交易数据+卫星建设检测训练的ML模型。地理空间K均值聚类识别微区域。NLP情感分析扫描15,000+经纪报告。</span>
          </div>

          {/* HERO: CURRENT vs TARGET YIELD */}
          <div className="flex items-center justify-between bg-gradient-to-b from-[#030a03] to-[#051105] border border-[#FCD34D]/30 p-6 relative overflow-hidden shadow-[inset_0_0_40px_rgba(252,211,77,0.1)] before:absolute before:inset-0 before:bg-[linear-gradient(rgba(252,211,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(252,211,77,0.03)_1px,transparent_1px)] before:bg-[size:20px_20px] before:pointer-events-none shrink-0">
            <div className="flex items-center gap-6 w-[35%] relative z-10">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg width="112" height="112" className="absolute transform -rotate-90">
                  <circle cx="56" cy="56" r="40" fill="none" stroke="#ff4444" strokeWidth="2" opacity="0.1" />
                  <motion.circle cx="56" cy="56" r="40" fill="none" stroke="#ff4444" strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40} animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.52) }} transition={{ duration: 2, ease: "easeOut" }} style={{ filter: 'drop-shadow(0 0 10px rgba(255,68,68,0.8))' }} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[8px] text-[#ff4444] font-bold tracking-[0.2em] uppercase">YIELD</span>
                  <span className="text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(255,68,68,1)] leading-none tracking-tighter">5.2%</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[#ff4444] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#ff4444] rounded-full animate-pulse" /> 全国平均</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">低于目标</h3>
                <span className="text-[10px] text-[#ff4444]/70 font-mono tracking-wider border border-[#ff4444]/20 bg-[#ff4444]/5 px-2 py-0.5 inline-block w-fit">2026年Q1 毛收益</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
              <div className="w-full flex items-center">
                <div className="h-[2px] bg-gradient-to-r from-[#ff4444] to-[#FCD34D] flex-1 relative overflow-hidden"><motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ['-20%', '120%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} /></div>
                <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center">
                  <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">收益差距</span>
                  <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-[#FCD34D]" /><span className="text-lg font-black text-[#FCD34D] tracking-widest">+2.3 PP</span></div>
                </div>
                <div className="h-[2px] bg-gradient-to-r from-[#FCD34D] to-[#00B558] flex-1 relative overflow-hidden"><motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ['-20%', '120%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} /></div>
              </div>
            </div>
            <div className="flex items-center gap-6 w-[35%] flex-row-reverse text-right relative z-10">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg width="112" height="112" className="absolute transform -rotate-90">
                  <circle cx="56" cy="56" r="40" fill="none" stroke="#00B558" strokeWidth="2" opacity="0.1" />
                  <motion.circle cx="56" cy="56" r="40" fill="none" stroke="#00B558" strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40} animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.75) }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} style={{ filter: 'drop-shadow(0 0 10px rgba(0,181,88,0.8))' }} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[8px] text-[#00B558] font-bold tracking-[0.2em] uppercase">YIELD</span>
                  <span className="text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(0,181,88,1)] leading-none tracking-tighter">7.5%</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#00B558] font-bold tracking-[0.25em] uppercase text-[9px] mb-1">2030目标</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">房地产占GDP 10%</h3>
                <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">愿景目标</span>
              </div>
            </div>
          </div>

          {/* TWO COLUMNS */}
          <div className="grid grid-cols-2 gap-8">

            {/* LEFT: Yield Projection Factors */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Zap className="w-3.5 h-3.5" /> 收益预测模型(因子权重)</h3>
              
              {/* Formula */}
              <div className="bg-[#030a03] border border-[#FCD34D]/30 p-3 flex flex-col items-center gap-2 shrink-0">
                <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">收益预测算法</span>
                <div className="flex items-center gap-2 font-mono text-sm tracking-wider">
                  <span className="text-white font-black">Y<sub className="text-[8px] text-gray-400">2030</sub></span>
                  <span className="text-[#FCD34D]">=</span>
                  <span className="text-white">Y<sub className="text-[8px] text-gray-400">当前</sub></span>
                  <span className="text-[#FCD34D]">×</span>
                  <span className="text-[#FCD34D]">D<sub className="text-[8px] text-gray-400">MUL</sub></span>
                  <span className="text-[#FCD34D]">×</span>
                  <span className="text-[#00B558]">(1+P<sub className="text-[8px] text-gray-400">GIGA</sub>)</span>
                  <span className="text-[#FCD34D]">/</span>
                  <span className="text-[#ff4444]">S<sub className="text-[8px] text-gray-400">PRESS</sub></span>
                  <span className="text-[#FCD34D]">×</span>
                  <span className="text-[#f97316]">R<sub className="text-[8px] text-gray-400">ADJ</sub></span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2">
                {factors.map((f, i) => (
                  <div key={i} className="bg-[#0a1a0a] border border-[#FCD34D]/15 p-3 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{f.name}</span>
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 tracking-widest border" style={{ color: f.color, borderColor: `${f.color}30`, backgroundColor: `${f.color}10` }}>{f.weight}% 权重</span>
                    </div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide leading-relaxed">{f.desc}</span>
                    <div className="w-full h-1.5 bg-[#051105] rounded-sm overflow-hidden">
                      <motion.div className="h-full rounded-sm" style={{ backgroundColor: f.color }} initial={{ width: 0 }} animate={{ width: `${f.weight * 2.5}%` }} transition={{ duration: 1, delay: i * 0.15 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Regional Yield Table */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Activity className="w-3.5 h-3.5" /> 区域收益轨迹(2026→2030)</h3>
              <div className="flex flex-col flex-1 bg-[#051105] border border-[#FCD34D]/20 overflow-hidden min-h-0">
                <div className="grid grid-cols-12 bg-[#FCD34D]/15 border-b border-[#FCD34D]/30 text-[9px] font-black text-[#FCD34D] uppercase tracking-widest px-4 py-2.5 shrink-0">
                  <div className="col-span-2">区域</div>
                  <div className="col-span-2">当前</div>
                  <div className="col-span-2">2030</div>
                  <div className="col-span-4">关键驱动</div>
                  <div className="col-span-2">置信度</div>
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                  {regions.map((r, i) => (
                    <div key={i} className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#FCD34D]/10 hover:bg-[#FCD34D]/10 transition-colors">
                      <div className="col-span-2 text-[10px] font-black text-white tracking-wider uppercase">{r.name}</div>
                      <div className="col-span-2 text-[11px] font-black text-[#ff4444]">{r.current}%</div>
                      <div className="col-span-2 text-[11px] font-black text-[#00B558]">{r.projected}%</div>
                      <div className="col-span-4 text-[8px] text-gray-400 uppercase tracking-wide leading-tight">{r.drivers}</div>
                      <div className="col-span-2 flex items-center gap-1">
                        <div className="w-10 h-1.5 bg-[#051105] rounded-sm overflow-hidden"><motion.div className="h-full rounded-sm" style={{ backgroundColor: r.confidence >= 75 ? '#00B558' : r.confidence >= 60 ? '#FCD34D' : '#f97316' }} initial={{ width: 0 }} animate={{ width: `${r.confidence}%` }} transition={{ duration: 1, delay: i * 0.1 }} /></div>
                        <span className="text-[9px] font-black" style={{ color: r.confidence >= 75 ? '#00B558' : r.confidence >= 60 ? '#FCD34D' : '#f97316' }}>{r.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-[#0a1a0a] border border-[#FCD34D]/15 p-3 shrink-0 mb-2">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">数据来源：</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">REGA交易登记(10年) · SAMA房地产金融报告 · NHC住房管道 · STB游客预测 · GASTAT人口普查 · 卫星建设检测(SENTINEL-2)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Diagnostics() {
  const [activeMetric, setActiveMetric] = useState("flw_1");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [hoveredAlertId, setHoveredAlertId] = useState<number | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showInfraModal, setShowInfraModal] = useState(false);
  const [showYieldModal, setShowYieldModal] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Load HiAgent chat SDK
  useEffect(() => {
    const scriptId = 'hiagent-sdk';
    if (document.getElementById(scriptId)) return;

    // Inject style to ensure the chat widget sits above all page layers
    const style = document.createElement('style');
    style.id = 'hiagent-style';
    style.textContent = `
      [class*="hiagent"], [id*="hiagent"],
      div[style*="position: fixed"][style*="z-index"] iframe {
        z-index: 99999 !important;
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://hiagent-byteplus.volcenginepaas.com/resources/product/llm/public/sdk/embedLite.js';
    script.onload = () => {
      if ((window as any).HiagentWebSDK) {
        new (window as any).HiagentWebSDK.WebLiteClient({
          appKey: 'd6sdi7elvndfd6e1neng',
          baseUrl: 'https://hiagent-byteplus.volcenginepaas.com',
          variables: {},
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
      const styleEl = document.getElementById('hiagent-style');
      if (styleEl) styleEl.remove();
      // Remove any chat widget the SDK injected
      document.querySelectorAll('[class*="hiagent"], [id*="hiagent"]').forEach(el => el.remove());
    };
  }, []);

  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [46.6853, 24.7136],
        zoom: 11.2,
        pitch: 45,
        bearing: -15,
        duration: 2500,
        essential: true
      });
    }
  }, []);

  const handleMetricClick = (id: string) => {
    setActiveMetric(id);
    window.dispatchEvent(new CustomEvent('agent-metric-select', { detail: { id } }));
    // Fly map to appropriate view based on selected metric
    if (mapRef.current) {
      if (id === 'dmd_1' || id === 'dmd_2' || id === 'idl_1' || id === 'idl_2') {
        // Zoom out to show all Saudi regions
        mapRef.current.flyTo({
          center: [44.0, 23.5],
          zoom: 5.0,
          pitch: 20,
          bearing: 0,
          duration: 2000,
          essential: true
        });
      } else if (id.startsWith('ast')) {
        // Zoom out to show all Saudi regions for asset evaluation
        mapRef.current.flyTo({
          center: [44.0, 23.5],
          zoom: 5.0,
          pitch: 20,
          bearing: 0,
          duration: 2000,
          essential: true
        });
      } else if (id.startsWith('flw')) {
        // Zoom to Riyadh
        mapRef.current.flyTo({
          center: [46.6853, 24.7136],
          zoom: 11.2,
          pitch: 45,
          bearing: -15,
          duration: 2000,
          essential: true
        });
      }
    }
  };

  // Generate GeoJSON for highlighting (Line for roads/traffic, Polygon for areas)
  const getHighlightGeoJSON = (lat: number, lng: number, type: string) => {
    const isRoad = ['commute', 'traffic', 'emergency', 'road'].includes(type);
    
    if (isRoad) {
      const offset = type === 'road' ? 0.5 : 0.015;
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
      const size = ['housing', 'idle_land', 'utilization'].includes(type) ? 0.5 : 0.015;
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

  let currentAlerts: any[] = [];
  if (activeMetric === 'flw_1') currentAlerts = COMMUTE_ALERTS;
  else if (activeMetric === 'dmd_1') currentAlerts = HOUSING_DEMAND_ALERTS;
  else if (activeMetric === 'dmd_2') currentAlerts = ROAD_NETWORK_ALERTS;
  else if (activeMetric === 'idl_1') currentAlerts = WHITE_LAND_ACTIVATION_ALERTS;
  else if (activeMetric === 'idl_2') currentAlerts = URBAN_UTILIZATION_ALERTS;
  else if (activeMetric === 'ast_1') currentAlerts = INFRA_COMPETITIVENESS_ALERTS;
  else if (activeMetric === 'ast_2') currentAlerts = YIELD_FORECAST_ALERTS;

  const hoveredAlert = currentAlerts.find(a => a.id === hoveredAlertId);
  const hoveredHighlightGeoJSON = hoveredAlert ? getHighlightGeoJSON(hoveredAlert.lat, hoveredAlert.lng, hoveredAlert.type) : null;
  const isRoad = hoveredAlert && ['commute', 'traffic', 'emergency', 'road'].includes(hoveredAlert.type);

  const activeAgent = Object.values(AGENTS_DATA).find(agent => agent.functions.some(f => f.id === activeMetric)) || AGENTS_DATA.flow;
  const activeColor = activeAgent.color;
  const activeRgb = activeColor === '#FCD34D' ? '252,211,77' : activeColor === '#ff4444' ? '255,68,68' : '0,181,88';

  return (
    <div className="relative h-full w-full pt-[80px] pb-4 flex justify-between px-6 overflow-hidden pointer-events-none uppercase bg-[#051005]">
      
      {/* FULLSCREEN BACKGROUND MAP */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map
          ref={mapRef}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onMove={(e) => { window.lastMapViewState = { ...e.viewState }; }}
          initialViewState={window.lastMapViewState || {
            longitude: 44.0,
            latitude: 24.0,
            zoom: 4.2,
            pitch: 30,
            bearing: 0
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          interactive={true}
        >
          {/* Render Buoys depending on selected metric */}
          {currentAlerts.map(alert => (
            <Marker key={`${alert.type}-${alert.id}`} longitude={alert.lng} latitude={alert.lat} anchor="center">
              <MapBuoy 
                alert={alert} 
                isHovered={hoveredAlertId === alert.id}
                onHover={(hovered) => setHoveredAlertId(hovered ? alert.id : null)}
                onClick={() => setSelectedAlert(alert)} 
              />
            </Marker>
          ))}

          {/* Render declarative map highlight when hovered */}
          {hoveredHighlightGeoJSON && hoveredAlert && (
            <SafeSource id="hovered-region" type="geojson" data={hoveredHighlightGeoJSON as any}>
              {isRoad ? (
                <>
                  <SafeLayer 
                    id="hovered-region-line-glow" 
                    type="line" 
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{'line-color': hoveredAlert.severity === 'CRITICAL' ? '#ff4444' : activeColor, 'line-width': 8, 'line-opacity': 0.6, 'line-blur': 2}} 
                  />
                  <SafeLayer 
                    id="hovered-region-line-core" 
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
        </Map>
        
        {/* Dark map wash to ensure UI overlays pop */}
        <div className="absolute inset-0 bg-[#051005]/50 pointer-events-none z-10" />
      </div>

      {/* Heavy gradients for side panels mapping smoothly into the map */}
      <div className="absolute inset-y-0 left-0 w-[500px] bg-gradient-to-r from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[500px] bg-gradient-to-l from-[#051005] via-[#0c1a06]/90 to-transparent z-10 pointer-events-none" />

      {/* LEFT SIDEBAR: Flow, Demand, Citizen */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pr-4 pointer-events-auto"
      >
        <WidgetPanel title={AGENTS_DATA.flow.title} icon={<AGENTS_DATA.flow.icon color={AGENTS_DATA.flow.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-[0.35] min-h-0 w-full">
               <FunctionCard 
                 item={AGENTS_DATA.flow.functions[0]} 
                 color={AGENTS_DATA.flow.color} 
                 isActive={activeMetric === AGENTS_DATA.flow.functions[0].id} 
                 onClick={() => handleMetricClick(AGENTS_DATA.flow.functions[0].id)} 
                 onActionClick={(id) => {
                   if (id === 'flw_1') setShowTargetModal(true);
                 }}
                 layout="full" 
               />
            </div>
            <div className="flex-[0.65] min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.flow.functions[1]} color={AGENTS_DATA.flow.color} isActive={activeMetric === AGENTS_DATA.flow.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.flow.functions[1].id)} layout="full" />
            </div>
          </div>
        </WidgetPanel>
        
        <WidgetPanel title={AGENTS_DATA.demand.title} icon={<AGENTS_DATA.demand.icon color={AGENTS_DATA.demand.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.demand.functions[0]} color={AGENTS_DATA.demand.color} isActive={activeMetric === AGENTS_DATA.demand.functions[0].id} onClick={() => handleMetricClick(AGENTS_DATA.demand.functions[0].id)} layout="full" />
            </div>
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.demand.functions[1]} color={AGENTS_DATA.demand.color} isActive={activeMetric === AGENTS_DATA.demand.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.demand.functions[1].id)} layout="full" />
            </div>
          </div>
        </WidgetPanel>

      </motion.div>

      {/* CENTER VIEW - Radar HUD overlaying Map */}
      <div className="flex-1 relative pointer-events-none flex flex-col items-center justify-center z-20">
        
        {/* Top Right Toolbars */}
        <div className="absolute top-4 right-4 pointer-events-auto flex items-center bg-[#0d1f0d]/80 border border-[#D4AF37]/30 backdrop-blur-md rounded-sm overflow-hidden z-20">
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Target className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Square className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all border-r border-[#D4AF37]/30 hover:scale-110"><Maximize className="w-4 h-4" /></button>
           <button className="p-2.5 text-[#006C35] hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all hover:scale-110"><ArrowRight className="w-4 h-4" /></button>
        </div>

        {/* Central UI HUD - Reticle changes color based on active Agent */}
        <div className="relative flex items-center justify-center pointer-events-none opacity-60">
          <div className="absolute w-2 h-2 rounded-full z-10 animate-pulse transition-colors duration-500" style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
          <div className="absolute w-8 h-8 rounded-full border z-10 animate-ping transition-colors duration-500" style={{ borderColor: `${activeColor}80`, animationDuration: '3s' }} />
          
          <motion.div 
            className="absolute w-[300px] h-[300px] rounded-full border-[1px] border-dashed transition-colors duration-500"
            style={{ borderColor: `${activeColor}40`, boxShadow: `inset 0 0 50px rgba(${activeRgb},0.05)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute w-[100vw] h-[1px] transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, transparent, ${activeColor}20, transparent)` }} />
          <div className="absolute h-[100vh] w-[1px] transition-all duration-500" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${activeColor}20, transparent)` }} />
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
          <motion.path 
            key={activeMetric}
            d="M 50% 50% L 35% 70%" 
            fill="none" 
            stroke={activeColor}
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* RIGHT SIDEBAR: Idle, Asset */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-[420px] flex flex-col gap-4 pt-2 h-full min-h-0 overflow-hidden pl-4 pointer-events-auto"
      >
        <WidgetPanel title={AGENTS_DATA.idle.title} icon={<AGENTS_DATA.idle.icon color={AGENTS_DATA.idle.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.idle.functions[0]} color={AGENTS_DATA.idle.color} isActive={activeMetric === AGENTS_DATA.idle.functions[0].id} onClick={() => handleMetricClick(AGENTS_DATA.idle.functions[0].id)} layout="full" />
            </div>
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.idle.functions[1]} color={AGENTS_DATA.idle.color} isActive={activeMetric === AGENTS_DATA.idle.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.idle.functions[1].id)} layout="full" />
            </div>
          </div>
        </WidgetPanel>
        
        <WidgetPanel title={AGENTS_DATA.asset.title} icon={<AGENTS_DATA.asset.icon color={AGENTS_DATA.asset.color}/>} className="flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.asset.functions[0]} color={AGENTS_DATA.asset.color} isActive={activeMetric === AGENTS_DATA.asset.functions[0].id} onClick={() => handleMetricClick(AGENTS_DATA.asset.functions[0].id)} onActionClick={(id) => { if (id === 'ast_1') setShowInfraModal(true); }} layout="full" />
            </div>
            <div className="flex-1 min-h-0 w-full">
               <FunctionCard item={AGENTS_DATA.asset.functions[1]} color={AGENTS_DATA.asset.color} isActive={activeMetric === AGENTS_DATA.asset.functions[1].id} onClick={() => handleMetricClick(AGENTS_DATA.asset.functions[1].id)} onActionClick={(id) => { if (id === 'ast_2') setShowYieldModal(true); }} layout="full" />
            </div>
          </div>
        </WidgetPanel>
      </motion.div>

      {/* ANALYSIS MODAL */}
      <AnalysisModal 
        isOpen={!!selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
        data={selectedAlert} 
      />

      {/* TARGET MODAL */}
      <AnimatePresence>
        {showTargetModal && (
          <TargetModal 
            isOpen={showTargetModal} 
            onClose={() => setShowTargetModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* INFRA COMPETITIVENESS MODAL */}
      <AnimatePresence>
        {showInfraModal && (
          <InfraModal
            isOpen={showInfraModal}
            onClose={() => setShowInfraModal(false)}
          />
        )}
      </AnimatePresence>

      {/* YIELD FORECAST MODAL */}
      <AnimatePresence>
        {showYieldModal && (
          <YieldModal
            isOpen={showYieldModal}
            onClose={() => setShowYieldModal(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}