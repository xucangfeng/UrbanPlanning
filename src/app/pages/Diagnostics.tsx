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
  { id: 1, type: "commute", name: "King Fahd Rd", lat: 24.7335, lng: 46.6663, severity: "CRITICAL", delay: "+45m", baselineSpeed: 65, currentSpeed: 12, deviation: "-81.5% SPEED DROP", cause: "Unexpected flash flooding in major underpass due to unseasonal heavy rainfall. Drainage system operating at maximum capacity.", recommendation: "Activate emergency pumps. Reroute upcoming traffic to Olaya St via digital signages." },
  { id: 2, type: "commute", name: "Olaya St", lat: 24.7196, lng: 46.6784, severity: "HIGH", delay: "+32m", baselineSpeed: 40, currentSpeed: 15, deviation: "-62.5% SPEED DROP", cause: "Massive surge in pedestrian and vehicular traffic due to Riyadh Season opening night at Boulevard World.", recommendation: "Extend green light phase at main intersections by 25s. Issue automated warning to navigation apps." },
  { id: 3, type: "commute", name: "Northern Ring", lat: 24.7645, lng: 46.6687, severity: "CRITICAL", delay: "+50m", baselineSpeed: 90, currentSpeed: 20, deviation: "-77.7% SPEED DROP", cause: "Severe localized sandstorm drastically reducing visibility to <50m. Highway patrol manually pacing traffic.", recommendation: "Activate low-visibility VMS warnings. Reduce variable speed limits to 40km/h." },
  { id: 4, type: "commute", name: "King Abdullah Rd", lat: 24.7431, lng: 46.6953, severity: "HIGH", delay: "+28m", baselineSpeed: 50, currentSpeed: 18, deviation: "-64.0% SPEED DROP", cause: "Massive influx of attendees for LEAP Tech Exhibition. Parking capacity exceeded causing cascading gridlock.", recommendation: "Deploy temporary shuttle lanes. Direct incoming traffic to remote overflow parking zones." },
  { id: 5, type: "commute", name: "Khureis Rd", lat: 24.7265, lng: 46.7451, severity: "CRITICAL", delay: "+40m", baselineSpeed: 80, currentSpeed: 14, deviation: "-82.5% SPEED DROP", cause: "VIP diplomatic motorcade routing through main artery. Temporary rolling roadblocks in effect.", recommendation: "Monitor until motorcade passes. Prepare rapid green-light flush to clear buildup." },
  { id: 6, type: "commute", name: "Makkah Rd", lat: 24.6644, lng: 46.6912, severity: "HIGH", delay: "+25m", baselineSpeed: 60, currentSpeed: 22, deviation: "-63.3% SPEED DROP", cause: "Unscheduled road surface subsidence (sinkhole) opening up, likely due to recent geological shifts. 2 lanes closed.", recommendation: "Dispatch emergency civil engineering team. Close affected lanes and merge traffic left." },
  { id: 7, type: "commute", name: "Takhassusi St", lat: 24.7077, lng: 46.6578, severity: "CRITICAL", delay: "+38m", baselineSpeed: 45, currentSpeed: 8, deviation: "-82.2% SPEED DROP", cause: "Major sporting event at King Saud University Stadium ending. 60,000 fans exiting simultaneously.", recommendation: "Implement post-event AI traffic plan #4. Convert center lanes to outbound flow temporarily." },
  { id: 8, type: "commute", name: "Eastern Ring", lat: 24.7338, lng: 46.7725, severity: "HIGH", delay: "+20m", baselineSpeed: 90, currentSpeed: 35, deviation: "-61.1% SPEED DROP", cause: "Unexpected dust storm accumulation and severe crosswinds causing dangerous conditions for high-profile vehicles.", recommendation: "Restrict heavy truck movement on bridge segments. Alert highway patrol to secure perimeter." },
  { id: 9, type: "commute", name: "Abu Bakr Rd", lat: 24.7656, lng: 46.7028, severity: "CRITICAL", delay: "+42m", baselineSpeed: 70, currentSpeed: 10, deviation: "-85.7% SPEED DROP", cause: "National Day Cultural festival parade preparations blocking key intersections ahead of schedule.", recommendation: "Dispatch rapid response traffic wardens. Suggest alternate routes to Balady app users." },
  { id: 10, type: "commute", name: "Prince Turki", lat: 24.7408, lng: 46.6341, severity: "HIGH", delay: "+22m", baselineSpeed: 50, currentSpeed: 18, deviation: "-64.0% SPEED DROP", cause: "Dense morning fog combining with unexpected VIP corridor closures, leading to 64% speed reduction.", recommendation: "Activate road stud lighting. Pulse electronic signs to alert oncoming drivers of sudden stops." },
  { id: 11, type: "commute", name: "King Salman Rd", lat: 24.8156, lng: 46.6111, severity: "HIGH", delay: "+18m", baselineSpeed: 80, currentSpeed: 40, deviation: "-50.0% SPEED DROP", cause: "International marathon routing intersection closure. Unexpectedly high volume of diverted traffic.", recommendation: "Adjust traffic signal timing at detour points to prioritize lateral flow." },
  { id: 12, type: "commute", name: "Dirab Rd", lat: 24.5681, lng: 46.6800, severity: "CRITICAL", delay: "+35m", baselineSpeed: 65, currentSpeed: 15, deviation: "-76.9% SPEED DROP", cause: "Red-level flash flood warnings active. Wadis overflowing onto the carriageway carrying debris.", recommendation: "Dispatch road clearing crew immediately. Place warning barriers and close outside lanes." }
];

// --- WHITE LAND ACTIVATION: AI-IDENTIFIED UNDEVELOPED PARCELS (idl_1) ---
// Agent scans MOMRAH White Land Registry + satellite imagery to pinpoint specific idle plots,
// cross-referencing with infrastructure proximity, population growth vectors, and zoning data.
const WHITE_LAND_ACTIVATION_ALERTS = [
  // RIYADH — 3 spots
  { id: 101, type: "idle_land", name: "Al Yasmin Block 4A, Riyadh", lat: 25.05, lng: 46.35, severity: "CRITICAL", delay: "14,500 SQM · 4 YRS IDLE", cause: "AI IDENTIFICATION: Satellite change-detection confirms zero construction activity since 2022. Plot sits 400m from completed King Salman Park metro station with full road, water, and power infrastructure already delivered. Surrounded by 95% developed residential neighborhoods (Al Yasmin avg. price: SAR 3,100/sqm). Owner filed no building permit despite Phase 2 White Land Tax (2.5% annual levy = SAR 1.1M/yr penalty).\n\nWHY UNDERDEVELOPED: Speculative holding. Owner purchased in 2019 at SAR 2,200/sqm, current market value SAR 3,100/sqm — holding for appreciation rather than building.\n\nWHY DEVELOP: 400m to metro station. 8-min walk to King Salman Park. All utilities connected. Can deliver 145 residential units at 100 sqm each. Estimated 320 families on Sakani waitlist within 2 km radius. ROI for developer: 22% IRR over 4-year build cycle.", recommendation: "Issue Final Warning under White Land Tax Phase 2. If no permit application within 90 days, escalate to mandatory public auction per Royal Decree M/4. Recommended use: 145-unit mid-rise residential (G+5) with ground-floor retail. Estimated delivery: 18 months from permit." },
  { id: 102, type: "idle_land", name: "Al Malqa Apex, Riyadh", lat: 24.60, lng: 46.70, severity: "CRITICAL", delay: "32,000 SQM · 6 YRS IDLE", cause: "AI IDENTIFICATION: Largest single idle parcel in Greater Riyadh. 32,000 sqm blocking municipal utilities corridor expansion to northern suburbs. Acquired 2020 for SAR 85M, current assessed value SAR 120M. Zero development activity per 72 consecutive monthly satellite scans. Adjacent plots developed as KAFD support infrastructure.\n\nWHY UNDERDEVELOPED: Owner (corporate entity) using as balance-sheet asset. Land value appreciation (6.8% CAGR) exceeds development profit margins in current interest rate environment.\n\nWHY DEVELOP: Blocks critical water main extension serving 45,000 planned units in Al Malqa North. Ideal for mixed-use: proximity to KAFD (2.3 km) creates demand for 2,400+ Grade-B office workers needing housing. Municipal utilities ROW would unlock 3 adjacent parcels totaling 80,000 sqm.", recommendation: "Initiate eminent domain review for utilities corridor (12,000 sqm strip). Remaining 20,000 sqm: mandate development start within 180 days or apply accelerated 5% annual levy. Recommended use: mixed-use transit-oriented development — 200 residential units + 8,000 sqm office + 4,000 sqm retail." },
  { id: 103, type: "idle_land", name: "Khashm Al Aan South, Riyadh", lat: 24.15, lng: 47.10, severity: "HIGH", delay: "22,000 SQM · 3 YRS IDLE", cause: "AI IDENTIFICATION: Located on Riyadh's eastern expansion belt along King Khalid Rd corridor. Plot undeveloped despite being within 1.2 km of Riyadh Metro Green Line terminus station (2025 operational). Utility stub-outs installed by municipality in 2023 but remain unconnected.\n\nWHY UNDERDEVELOPED: Ownership dispute between heirs (3 family members, inheritance since 2021). No single party authorized to apply for building permit per Sharia court records.\n\nWHY DEVELOP: Metro Green Line terminus creates transit-oriented demand. Eastern Riyadh has lowest housing supply per capita (1.2 units per 1,000 residents vs city avg 2.8). Plot can serve 800+ Sakani-eligible families. Industrial zone workers (King Salman Energy Park, 8 km south) need affordable housing.", recommendation: "Refer to Sharia court for expedited partition ruling. If unresolved in 120 days, MOMRAH to appoint development trustee per Land Governance Act Article 14. Recommended use: affordable housing (G+4) — 180 units targeting SAR 500K–750K price range for Sakani beneficiaries." },

  // MAKKAH — 2 spots
  { id: 104, type: "idle_land", name: "Al Shara'i Plateau, Makkah", lat: 21.25, lng: 39.95, severity: "CRITICAL", delay: "48,000 SQM · 5 YRS IDLE", cause: "AI IDENTIFICATION: Elevated plateau 6 km east of Haram with panoramic views. Plot fully serviced (road, water, power since 2021). Zoned residential since 2018 Master Plan revision. Satellite imagery shows bare earth with temporary storage containers.\n\nWHY UNDERDEVELOPED: Owner awaiting Hajj accommodation rezoning (hospitality yields 3× residential). Municipality denied rezoning in 2023 and 2024 — area designated exclusively residential to protect housing supply.\n\nWHY DEVELOP: Makkah has the lowest homeownership rate nationally (52% vs 70% target). Al Shara'i has existing school, mosque, and clinic within 800m. 15-min bus route to Haram. Can accommodate 480 family units. 3,200 families on Makkah Sakani waitlist identified within this postal zone.", recommendation: "Enforce residential zoning. Apply accelerated White Land Tax (5% for plots >5 years idle in holy city zones). Recommended use: 480-unit family residential complex with underground parking. Fast-track building permit — estimated 24-month construction." },
  { id: 105, type: "idle_land", name: "North Jeddah Corniche Strip, Jeddah", lat: 21.80, lng: 39.05, severity: "HIGH", delay: "18,000 SQM · 4 YRS IDLE", cause: "AI IDENTIFICATION: Waterfront parcel on northern Corniche extension. Plot cleared for construction in 2022 (demolition permit issued) but no follow-up building permit. Adjacent to Jeddah Tower development zone. Full sewage and desalinated water connection.\n\nWHY UNDERDEVELOPED: Developer's original mixed-use project financing fell through during 2023 interest rate hike. Plot remains in developer's portfolio as 'planned' but unfunded.\n\nWHY DEVELOP: Prime waterfront. Jeddah Tower district will attract 25,000+ residents by 2030. Only 3 waterfront residential plots remaining in northern Corniche. Strong demand for premium housing from Jeddah's growing financial sector workforce. Estimated absorption: 14 months for 120 luxury units.", recommendation: "Facilitate PIF co-investment or PPP structure to restart development. If no permit within 120 days, initiate White Land Tax Phase 2. Recommended use: 120-unit waterfront residential (G+8) with marina-level retail." },

  // EASTERN PROVINCE — 2 spots
  { id: 106, type: "idle_land", name: "Dhahran Valley West, Eastern Province", lat: 26.05, lng: 50.25, severity: "HIGH", delay: "28,000 SQM · 3 YRS IDLE", cause: "AI IDENTIFICATION: Located 2 km from Dhahran Expo Center and 4 km from Aramco HQ. Plot within NHC-designated 'Dhahran Valley' residential expansion zone. All trunk infrastructure installed by NHC in 2023 (roads, water, power, fiber). No construction started.\n\nWHY UNDERDEVELOPED: Allocated to private developer via NHC partnership, but developer prioritized Riyadh projects. Construction start delayed 3× since 2023.\n\nWHY DEVELOP: Aramco's 2025 expansion adds 15,000 employees in Dhahran campus. Current vacancy rate in Dhahran: 1.8% (near-zero). Average rent increased 28% YoY. 2,100 Aramco employees on internal housing waitlist. All infrastructure pre-built — construction can start immediately.", recommendation: "Trigger NHC performance clause — mandate construction start within 90 days or reassign to alternate developer. Recommended use: 280-unit mid-rise workforce housing (G+6) with community facilities. Estimated delivery: 20 months." },
  { id: 107, type: "idle_land", name: "Jubail 2 Southern Buffer, Eastern Province", lat: 27.15, lng: 49.45, severity: "HIGH", delay: "35,000 SQM · 5 YRS IDLE", cause: "AI IDENTIFICATION: Industrial support zone adjacent to Jubail 2 petrochemical complex. Zoned for worker housing and light commercial. Road access completed 2021. Water/power available at boundary.\n\nWHY UNDERDEVELOPED: Environmental remediation required — previous use as temporary construction staging left soil contamination (2022 EIA report). Remediation cost estimated SAR 8M, owner unwilling to invest.\n\nWHY DEVELOP: 40,000 petrochemical workers commute 45+ min daily from Dammam. On-site housing would reduce industrial absenteeism by estimated 12%. Royal Commission for Jubail master plan allocates this plot for 350 worker housing units. SAR 8M remediation cost is 2% of projected development value (SAR 380M).", recommendation: "Offer SIDF remediation loan (0% interest, 10-year term). If owner declines within 60 days, Royal Commission to exercise first-refusal purchase right. Recommended use: 350-unit worker dormitory + family housing complex with mosque and commercial street." },

  // MADINAH — 2 spots
  { id: 108, type: "idle_land", name: "KEC Phase 2 North, Madinah", lat: 24.75, lng: 39.30, severity: "HIGH", delay: "20,000 SQM · 4 YRS IDLE", cause: "AI IDENTIFICATION: Located within Knowledge Economic City Phase 2 boundary. Plot allocated for academic staff housing in 2022 master plan. Road network completed. Power substation 500m away. Desert terrain — no remediation needed.\n\nWHY UNDERDEVELOPED: KEC Phase 2 timeline slipped 2 years due to contractor restructuring. Housing plots deprioritized in favor of university campus buildings.\n\nWHY DEVELOP: Islamic University of Madinah expanding faculty by 800 positions (2026–2030 plan). Current faculty housing waitlist: 14 months. Private rental near Haram rising 18% YoY — academic retention at risk. Plot can deliver 200 faculty housing units at SAR 600K each (below market).", recommendation: "Separate housing delivery from campus timeline. Issue standalone building permit for faculty housing. Partner with REDF for subsidized mortgage at 2.5% for academic staff. Recommended use: 200-unit faculty townhouse development (G+2) with family amenities." },
  { id: 109, type: "idle_land", name: "Al Manar Commercial, Madinah", lat: 24.20, lng: 39.80, severity: "HIGH", delay: "12,000 SQM · 3 YRS IDLE", cause: "AI IDENTIFICATION: Commercial-zoned plot in Al Manar district, 3 km from Prophet's Mosque. Previously approved for hotel development (2023). Building permit expired December 2025 without construction start.\n\nWHY UNDERDEVELOPED: Original hotel concept became unviable after 2024 tourism accommodation oversupply analysis showed 4,200 excess hotel rooms in central Madinah by 2028.\n\nWHY DEVELOP: While hotel is oversupplied, residential is critically undersupplied. Rezoning to residential would serve visitor-to-resident conversion trend (8% YoY). Al Manar has excellent transit — 5-min walk to Haramain station. Can accommodate 150 residential units serving young professionals and small families.", recommendation: "Approve commercial-to-residential rezoning application (fast-track 30-day review). Maintain ground-floor commercial requirement. Recommended use: 150-unit residential tower (G+12) with retail podium and co-working space. Prime location for Madinah's growing knowledge economy workforce." },

  // ASIR — 2 spots
  { id: 110, type: "idle_land", name: "Soudah Gateway Parcel, Asir", lat: 18.10, lng: 42.30, severity: "HIGH", delay: "15,000 SQM · 2 YRS IDLE", cause: "AI IDENTIFICATION: Entry corridor to Soudah Development mega-project. Plot designated for tourism workforce housing in 2024 Soudah master plan. Road access from Abha–Soudah highway completed. Mountain terrain at 2,800m elevation.\n\nWHY UNDERDEVELOPED: Geological survey required for foundation design (mountain rock). Survey budgeted but not yet commissioned — bureaucratic delay between Soudah Development Co. and Ministry of Municipal Affairs.\n\nWHY DEVELOP: Soudah project needs 8,000 tourism workers by 2029. Nearest housing is 40 km away in Abha (1-hour mountain drive). Worker commute cost: SAR 45M/yr in shuttle operations. On-site housing eliminates commute and improves worker retention. Cool mountain climate (avg 18°C) is natural advantage.", recommendation: "Commission geological survey immediately (SAR 1.2M, 90-day timeline). Begin foundation design in parallel. Recommended use: 150-unit mountain workforce village — modular construction suited to terrain. Climate-responsive design with natural ventilation. Estimated delivery: 16 months from survey completion." },

  // QASSIM — 2 spots
  { id: 111, type: "idle_land", name: "Buraidah North University Belt, Qassim", lat: 26.55, lng: 43.70, severity: "HIGH", delay: "25,000 SQM · 4 YRS IDLE", cause: "AI IDENTIFICATION: Adjacent to Qassim University main campus. Zoned residential since 2020. Road access and power available. Water main 200m from plot boundary (extension required).\n\nWHY UNDERDEVELOPED: Water utility extension stalled — municipality budget allocated but contractor procurement delayed 2 years due to competing infrastructure projects in eastern Qassim.\n\nWHY DEVELOP: 4,000 students projected to need housing by 2028 (university expansion plan). Currently students commute from Buraidah center (25 min) or live in substandard arrangements. Faculty housing demand: 200 units. Plot is flat agricultural land — zero remediation, easy construction.", recommendation: "Prioritize water main extension (200m, estimated SAR 2M, 45-day install). Release NHC pre-approved developer list. Recommended use: 250-unit mixed student + faculty housing — 200 studio/1-BR student units + 50 family townhouses. Include student services (library, gym, convenience retail)." },
  { id: 112, type: "idle_land", name: "Al Rass Agri-Tech Hub, Qassim", lat: 25.65, lng: 44.20, severity: "HIGH", delay: "18,000 SQM · 3 YRS IDLE", cause: "AI IDENTIFICATION: Located at Al Rass – Buraidah agricultural corridor junction. Zoned mixed-use (2023). New highway interchange completed 200m away. Power and telecommunications connected. Agricultural research station 1 km east.\n\nWHY UNDERDEVELOPED: Agricultural community traditionally reluctant to convert farmland edge plots. Owner (farming cooperative) lacks development expertise and capital.\n\nWHY DEVELOP: Qassim agri-tech sector growing 15% YoY. 6 agri-tech startups seeking office/warehouse space within 5 km (no suitable supply). NEOM Food Tech partnership creating demand for 300+ technical workers in Qassim by 2029. Plot can serve as anchor for emerging agri-tech innovation district.", recommendation: "Offer MODON (Saudi Authority for Industrial Cities) partnership to farming cooperative — co-develop with guaranteed revenue share. Recommended use: agri-tech innovation campus — 5,000 sqm light industrial/warehouse, 3,000 sqm office, 100-unit worker housing. Create Qassim's first dedicated agri-tech hub." }
];

// --- URBAN LAND UTILIZATION: AI-IDENTIFIED UNDERUTILIZED ZONES (idl_2) ---
// Agent analyzes satellite urban footprint, infrastructure density maps, population census grids,
// and municipal zoning registers to find zones where zoned land is significantly underutilized.
const URBAN_UTILIZATION_ALERTS = [
  // RIYADH — 3 spots
  { id: 201, type: "utilization", name: "KAFD North Buffer Zone, Riyadh", lat: 25.10, lng: 46.30, severity: "CRITICAL", delay: "12 KM² UNDERUSED", cause: "AI IDENTIFICATION: 12 km² zoned urban area north of King Abdullah Financial District showing only 18% built density vs 65% city average. Satellite analysis reveals: 70% bare earth, 15% temporary structures (construction camps from KAFD build-out, now vacated), 15% single-story warehousing.\n\nWHY UNDERUTILIZED: Area was designated as KAFD construction staging zone (2015–2024). Now that KAFD is 90% complete, staging areas are vacated but not yet re-zoned for permanent use. Temporary-use permits still active — prevents permanent construction permits.\n\nVALUE TO MINISTRY: Score impact — developing this single zone would lift Riyadh's utilization index from 62 to 67 (+5 points). 12 km² at medium density (FAR 2.0) yields 24M sqm of floor space — equivalent to a mid-size Saudi city. Proximity to KAFD creates immediate demand for 15,000+ support workers' housing.", recommendation: "Revoke expired temporary-use permits (batch process — 340 permits). Issue blanket re-zoning to mixed-use residential (R3). Publish NHC tender for master-planned community (6,000 residential units + 200,000 sqm commercial). Estimated index lift: +5 points for Riyadh region." },
  { id: 202, type: "utilization", name: "Diriyah Gate Western Corridor, Riyadh", lat: 24.55, lng: 46.65, severity: "CRITICAL", delay: "8 KM² UNDERUSED", cause: "AI IDENTIFICATION: 8 km² corridor west of Diriyah Gate heritage project. Infrastructure analysis shows: roads at 90% capacity, water/power trunk lines installed (2024), but only 22% of plots have active construction. Rest remains as date palm farms and vacant desert.\n\nWHY UNDERUTILIZED: Heritage buffer zone regulations impose 12m height limit across entire corridor. Developers avoiding area due to low-density constraint reducing project viability (FAR limited to 0.8).\n\nVALUE TO MINISTRY: Diriyah Gate will attract 5M visitors/year by 2030 + 25,000 permanent residents in gated community. Corridor needs hospitality, retail, and service worker housing. Current gap: zero available housing within 3 km for 8,000+ service industry workers. Developing at heritage-compatible density (G+3) still viable for townhouse product.", recommendation: "Create 'Heritage-Compatible Development Guide' — allow G+3 with traditional Najdi architectural standards. Offer 30% Sakani financing subsidy for heritage-district projects. Target 2,400 townhouse units + 80,000 sqm boutique commercial. Index impact: +3 points." },
  { id: 203, type: "utilization", name: "Eastern Industrial Fringe, Riyadh", lat: 24.10, lng: 47.15, severity: "HIGH", delay: "15 KM² UNDERUSED", cause: "AI IDENTIFICATION: 15 km² zone on Riyadh's eastern boundary between 2nd and 3rd Ring Roads. Zoned industrial/mixed since 2018. Satellite analysis: 60% vacant lots, 25% single-story auto-repair workshops, 15% low-rise warehousing (avg FAR: 0.3 vs zoned capacity of 2.5).\n\nWHY UNDERUTILIZED: Industrial migration — original auto/mechanical businesses moving to new MODON industrial cities. Remaining occupants have short-term leases and no incentive to invest in permanent structures.\n\nVALUE TO MINISTRY: Metro Green Line terminus creates residential opportunity. Rezoning from industrial to mixed-use would enable 18,000+ housing units for eastern Riyadh's workforce population (King Salman Energy Park employees). Highest impact zone in Riyadh for utilization index improvement.", recommendation: "Initiate formal rezoning process (industrial → mixed-use R2/C2). Offer relocation incentives for remaining auto-repair businesses to MODON cities. Publish transit-oriented development tender. 15 km² at medium density = 37,500 units potential. Index impact: +7 points." },

  // MAKKAH — 2 spots
  { id: 204, type: "utilization", name: "Al Awali Heights, Makkah", lat: 21.15, lng: 39.95, severity: "CRITICAL", delay: "6 KM² UNDERUSED", cause: "AI IDENTIFICATION: 6 km² elevated zone south of Makkah's urban core. Zoned residential since 2019 master plan. Satellite shows: 85% bare mountain terrain with graded access roads (completed 2023). Only 2 villas under construction.\n\nWHY UNDERUTILIZED: Steep terrain (15–25% gradient) increases construction cost by 40%. Standard residential developers avoid mountain sites. No specific incentive program for hillside development despite completed road infrastructure.\n\nVALUE TO MINISTRY: Makkah's flatland is 95% built-out — vertical expansion (mountains) is the only growth vector. Al Awali offers cooler microclimate (300m elevation gain), views of Haram, and existing road access. 6 km² can accommodate 3,600 terraced units designed for slope conditions. Would lift Makkah utilization from 55 to 59.", recommendation: "Create 'Mountain Development Incentive' — 25% construction cost subsidy for hillside projects, fast-track permits (45-day approval), and Sakani eligibility for mountain housing. Require terraced architectural typology. Target 3,600 units across 12 hillside clusters. Index impact: +4 points." },
  { id: 205, type: "utilization", name: "Jeddah Al Hamdaniyah East, Makkah Region", lat: 21.75, lng: 39.10, severity: "HIGH", delay: "10 KM² UNDERUSED", cause: "AI IDENTIFICATION: 10 km² flat zone in eastern Jeddah. Fully gridded road network (2020), power substations operational, water main connected. Satellite shows: 40% empty lots with perimeter walls only (no structures), 30% single-story temporary housing, 30% developed.\n\nWHY UNDERUTILIZED: Rapid land subdivision in 2018–2020 created 4,000+ small plots (avg 300 sqm). Fragmented ownership pattern prevents master-planned development. Individual plots too small for efficient multi-family construction.\n\nVALUE TO MINISTRY: Al Hamdaniyah is Jeddah's fastest-growing district by population (+8% YoY). Informal/temporary housing indicates strong demand but inadequate supply. Plot consolidation program could unlock 5,000+ proper housing units. Adjacent to new Haramain railway station (3 km).", recommendation: "Launch MOMRAH plot consolidation program — incentivize owners to merge adjacent plots (minimum 1,200 sqm for multi-family). Offer 15% FAR bonus for consolidated plots. Deploy 'infill housing' template designs for standard plot sizes. Target 5,000 units over 3 years. Index impact: +5 points." },

  // EASTERN PROVINCE — 2 spots
  { id: 206, type: "utilization", name: "Ras Al Khair Port Hinterland, Eastern Province", lat: 27.35, lng: 49.10, severity: "HIGH", delay: "20 KM² UNDERUSED", cause: "AI IDENTIFICATION: 20 km² zone behind Ras Al Khair industrial port. Zoned for industrial support and worker housing in 2022 Royal Commission master plan. Flat desert terrain, road access completed, power from Ma'aden industrial grid available.\n\nWHY UNDERUTILIZED: Mining companies (Ma'aden, Sabic) use temporary camps for workers rather than investing in permanent housing. Camp culture persists despite Royal Commission preference for permanent communities.\n\nVALUE TO MINISTRY: 35,000 industrial workers currently in temporary camps (10-year projected need: permanent). Vision 2030 'Quality of Life' program mandates replacing camps with proper communities by 2030. 20 km² can support a full township of 8,000 permanent units + civic amenities. Would transform Eastern Province score from 65 to 69.", recommendation: "Issue Royal Commission directive mandating camp-to-community transition timeline (Phase 1: 3,000 units by 2028). Require mining companies to contribute SAR 50K per worker to housing fund. Partner with NHC for master-planned industrial township. Index impact: +4 points." },
  { id: 207, type: "utilization", name: "Al Ahsa Southern Oasis Edge, Eastern Province", lat: 25.55, lng: 49.80, severity: "HIGH", delay: "8 KM² UNDERUSED", cause: "AI IDENTIFICATION: 8 km² zone at Al Ahsa oasis southern boundary. UNESCO World Heritage buffer zone creates development constraints. Satellite shows: ancient palm groves (40%), vacant desert (35%), scattered traditional settlements (25%). Zoned for eco-tourism and low-density residential.\n\nWHY UNDERUTILIZED: UNESCO heritage designation creates perception that no development is possible. In reality, buffer zone allows sensitive development (G+2, 30% site coverage max). Local municipality lacks technical capacity for heritage-compatible planning.\n\nVALUE TO MINISTRY: Al Ahsa was designated UNESCO World Heritage in 2018. Vision 2030 targets cultural tourism as GDP diversifier. 8 km² of eco-tourism development (200 boutique units, heritage trails, date farm experiences) would create 1,200 jobs and demonstrate heritage-compatible development model replicable nationally.", recommendation: "Deploy MOMRAH heritage planning technical team to Al Ahsa municipality. Create 'Oasis Edge Development Framework' — eco-lodges, date farm tourism, cultural centers. Limit to G+2, earth-tone materials, 30% coverage. Target 200 boutique tourism units + 150 artisan workshops. Index impact: +2 points." },

  // MADINAH — 2 spots
  { id: 208, type: "utilization", name: "Haramain Station District, Madinah", lat: 24.70, lng: 39.35, severity: "HIGH", delay: "5 KM² UNDERUSED", cause: "AI IDENTIFICATION: 5 km² zone surrounding Madinah's Haramain High-Speed Railway station. Station operational since 2018 but surrounding district remains 70% undeveloped. Satellite shows: station building, parking structures, and bare graded land. Road network and utilities installed by SAR (Saudi Railways).\n\nWHY UNDERUTILIZED: Land ownership split between Saudi Railways (60%), Ministry of Finance (25%), and private (15%). No single entity authorized to issue master development plan. Coordination between 3 landowners has stalled since 2021.\n\nVALUE TO MINISTRY: Only high-speed rail station in city — transit-oriented development textbook case. Station handles 8,000 passengers/day with projected growth to 15,000 by 2030. 5 km² TOD can accommodate 4,000 residential units + 150,000 sqm commercial + 50,000 sqm hospitality. Model for other Saudi railway stations.", recommendation: "Establish joint development authority (Saudi Railways + MOF + private partners) with MOMRAH as facilitator. Publish TOD master plan tender. International benchmark: Tokyo Station redevelopment model. Target 4,000 units + commercial complex. Index impact: +6 points (largest single-zone opportunity in Madinah)." },
  { id: 209, type: "utilization", name: "Yanbu Al Sinaiyah Worker Zone, Madinah Region", lat: 24.15, lng: 38.05, severity: "HIGH", delay: "7 KM² UNDERUSED", cause: "AI IDENTIFICATION: 7 km² zone in Yanbu Industrial City designated for worker community development. Royal Commission zoned area in 2020. Basic road grid exists. Power from industrial grid available but water requires desalination plant extension.\n\nWHY UNDERUTILIZED: Desalination plant extension delayed — original 2023 completion pushed to 2027 due to SWCC budget reallocation. Without potable water, no residential construction can begin.\n\nVALUE TO MINISTRY: Yanbu port expansion (2026–2030) will add 20,000 logistics and industrial workers. Current housing: 90% temporary camps. Community development would improve worker retention (current turnover: 35%/yr vs 15% in established cities). 7 km² can support 5,000 permanent units.", recommendation: "Escalate SWCC desalination plant extension to priority status. Install temporary packaged desalination units (100 KL/day capacity) to enable Phase 1 construction (500 units) immediately. Full plant targeting 2028. Index impact: +4 points for Madinah region." },

  // ASIR — 2 spots
  { id: 210, type: "utilization", name: "Abha City Center Infill, Asir", lat: 17.95, lng: 42.30, severity: "HIGH", delay: "3 KM² UNDERUSED", cause: "AI IDENTIFICATION: 3 km² of central Abha consisting of single-story traditional buildings with 15% site coverage (vs zoned 60% capacity). Satellite analysis: 400+ single-story structures on plots zoned for G+4. Average building age: 35 years. Many structurally assessed as 'poor condition' per 2024 municipal survey.\n\nWHY UNDERUTILIZED: Traditional building owners lack capital for redevelopment. Cultural attachment to original structures. No municipal urban renewal program offering assistance.\n\nVALUE TO MINISTRY: Abha's tourism economy (Soudah, Rijal Almaa) needs 3,000+ hotel rooms and serviced apartments by 2029. Central infill avoids mountain sprawl. Redeveloping single-story to G+4 quadruples housing capacity without expanding urban footprint. Preserves Asir architectural heritage through guided redevelopment.", recommendation: "Launch 'Asir Urban Renewal Fund' — low-interest loans for owners to redevelop (demolish + rebuild at G+4). Mandate Asiri architectural heritage elements (stone facades, colored window frames). Target 800 replacement units in Phase 1. Index impact: +3 points." },
  { id: 211, type: "utilization", name: "Khamis Mushait Eastern Expansion, Asir", lat: 18.55, lng: 42.90, severity: "HIGH", delay: "9 KM² UNDERUSED", cause: "AI IDENTIFICATION: 9 km² eastern expansion zone of Khamis Mushait. Zoned residential/commercial 2021. Main highway access road completed. Power lines installed along highway corridor. Flat terrain (rare in Asir — significant advantage).\n\nWHY UNDERUTILIZED: Military base proximity (5 km) created informal development freeze — developers assumed restricted airspace would prevent construction. Ministry of Defense confirmed in 2025 that civilian construction is permitted with standard height limits (G+6).\n\nVALUE TO MINISTRY: Only large flat developable zone in greater Abha metro area. 9 km² can support 7,000+ housing units at standard density. Military personnel housing demand: 2,000 units (currently commuting 30+ min from Abha). Khamis Mushait population growing 4.5% YoY — fastest in Asir.", recommendation: "Publish formal MOD clearance letter confirming development permitted. Launch NHC tender for 7,000-unit master-planned community with military family housing allocation (2,000 units). Leverage flat terrain for cost-effective construction. Index impact: +8 points (transformative for Asir)." },

  // QASSIM — 2 spots
  { id: 212, type: "utilization", name: "Buraidah–Unaizah Corridor, Qassim", lat: 26.50, lng: 43.65, severity: "HIGH", delay: "14 KM² UNDERUSED", cause: "AI IDENTIFICATION: 14 km² linear zone between Buraidah and Unaizah along Highway 65. Zoned mixed-use 2022. Highway interchange completed. Agricultural irrigation canals run through zone (infrastructure present but repurposing needed).\n\nWHY UNDERUTILIZED: Historical agricultural use — date palm farms with low economic output (SAR 800/sqm agricultural value vs SAR 3,500/sqm urban value). Farm owners resistant to conversion. No formal 'agricultural-to-urban transition' support program.\n\nVALUE TO MINISTRY: Bridging Buraidah–Unaizah creates a metro corridor of 750K population (from two separate cities). Linear development along highway supports bus rapid transit. Consolidation would create Qassim's first true metropolitan area. Agricultural owners receive 4× value uplift through conversion.", recommendation: "Create 'Agricultural Transition Bond' — owners convert land and receive 10-year SAR annuity equal to 3× agricultural income. Develop corridor master plan with BRT route. Target 8,000 units + 100,000 sqm agri-tech commercial. Index impact: +9 points (largest single opportunity in Qassim)." },
  { id: 213, type: "utilization", name: "Al Rass Heritage Quarter, Qassim", lat: 25.60, lng: 44.25, severity: "HIGH", delay: "2 KM² UNDERUSED", cause: "AI IDENTIFICATION: 2 km² traditional old quarter of Al Rass. Single-story mudbrick structures with 20% occupancy (80% abandoned or seasonal use). Satellite shows: degrading rooflines, no new construction permits issued in 5 years. Municipal records show 300+ abandoned properties.\n\nWHY UNDERUTILIZED: Rural-to-urban migration left historic quarter depopulated. No heritage preservation or adaptive reuse program. Mudbrick structures not eligible for standard building permits.\n\nVALUE TO MINISTRY: Saudi Vision 2030 'Cultural Heritage' pillar targets preservation and activation of traditional quarters nationwide. Al Rass has authentic Najdi architecture rarely found elsewhere. Adaptive reuse (boutique hotels, artisan workshops, cultural centers) proven successful in Ad Diriyah and Jeddah Al-Balad. 300 abandoned properties = 300 potential heritage tourism units.", recommendation: "Register Al Rass quarter on Saudi Heritage List. Launch adaptive reuse program modeled on Al-Balad restoration. Convert 100 properties in Phase 1: 40 boutique accommodation, 30 artisan workshops, 30 cultural/food venues. Deploy SCTH (Tourism Authority) technical team. Index impact: +2 points but high cultural value." }
];

// --- MOCK HOUSING DEMAND ALERTS (dmd_1) ---
const HOUSING_DEMAND_ALERTS = [
  { id: 301, type: "housing", name: "Riyadh Region", lat: 24.7136, lng: 46.6753, severity: "CRITICAL", delay: "-35K BY 2030", deficit: "35,000", ownership: "55%", target: "70%", pop: "8.6M", cause: "Forecast horizon: 2030. Deficit based on 2016–2025 population growth rate (4.2% CAGR) and NHC housing delivery pipeline. Rapid growth driven by Vision 2030 corporate HQ relocations (1,100+ companies). Northern expansion (KAFD, Diriyah Gate) outpacing residential supply.", recommendation: "Fast-track 15,000 housing permits in Al Janadriyah, Khashm Al Aan corridors. Activate NHC Sakani Phase 8. Deliver 20,000 units by 2028, remaining 15,000 by 2030." },
  { id: 302, type: "housing", name: "Makkah Region", lat: 21.4225, lng: 39.8262, severity: "CRITICAL", delay: "-42K BY 2030", deficit: "42,000", ownership: "52%", target: "70%", pop: "9.0M", cause: "Forecast horizon: 2030. Highest deficit nationally. Hajj/Umrah seasonal demand creates dual housing market. Ownership at 52% (Q1 2026) — lowest among tracked regions. Hospitality conversion of residential stock near Haram compounds shortage.", recommendation: "Zone 20,000 units in Al Awali, Al Shara'i by 2028. Mandate 60% residential in new mixed-use permits. Remaining 22,000 units via PPP by 2030." },
  { id: 303, type: "housing", name: "Eastern Province", lat: 26.3927, lng: 49.9777, severity: "HIGH", delay: "-28K BY 2030", deficit: "28,000", ownership: "65%", target: "70%", pop: "5.1M", cause: "Forecast horizon: 2030. Ownership at 65% (Q1 2026) — 5pp gap to target. Aramco expansion zones (Dhahran, Jubail 2) attracting 200K+ skilled workers. 40% of existing stock built pre-2000 needs replacement.", recommendation: "Release 12,000 NHC units in Dhahran Valley by 2028. Incentivize private developers in Al Aziziyah industrial corridor for remaining 16,000 units by 2030." },
  { id: 304, type: "housing", name: "Madinah Region", lat: 24.4672, lng: 39.6024, severity: "HIGH", delay: "-18K BY 2030", deficit: "18,000", ownership: "60%", target: "70%", pop: "2.2M", cause: "Forecast horizon: 2030. Ownership at 60% (Q1 2026) — 10pp gap. Knowledge Economic City Phase 2 drawing academic and tech talent. Visitor-to-resident conversion rate rising 8% YoY since 2022.", recommendation: "Accelerate 8,000-unit Prince Muhammad bin Salman project (completion 2028). Convert underutilized commercial in Al Manar for 10,000 units by 2030." },
  { id: 305, type: "housing", name: "Asir Region", lat: 18.2164, lng: 42.5053, severity: "HIGH", delay: "-15K BY 2030", deficit: "15,000", ownership: "72%", target: "70%", pop: "2.3M", cause: "Forecast horizon: 2030. Ownership already at 72% (exceeds 70% target), but deficit driven by urbanization: rural-to-Abha migration at 3.1% annually since 2020. Tourism demand from Soudah Peaks project adds 5,000 temporary-to-permanent units needed.", recommendation: "Zone 6,000 units near Soudah corridor by 2028. Upgrade infrastructure in Khamis Mushait expansion zone for 9,000 units by 2030." },
  { id: 306, type: "housing", name: "Qassim Region", lat: 26.3260, lng: 43.9750, severity: "HIGH", delay: "-15K BY 2030", deficit: "15,000", ownership: "71%", target: "70%", pop: "1.5M", cause: "Forecast horizon: 2030. Ownership at 71% (exceeds target), but deficit from agri-tech workforce influx and university expansion. Student housing shortage of 4,000 beds projected by 2028.", recommendation: "Release 5,000 NHC plots in Buraidah North by 2027. Partner with Qassim University for 2,000 student units by 2028. Remaining 8,000 via private sector by 2030." }
];

// --- MOCK ROAD NETWORK ALERTS (dmd_2) ---
const ROAD_NETWORK_ALERTS = [
  { id: 401, type: "road", name: "Riyadh – NEOM Corridor", lat: 26.5, lng: 42.0, severity: "CRITICAL", delay: "4.2K KM · 2029", length: "4,200 KM", status: "PLANNED", completion: "2029", cause: "Target completion: 2029. Critical northern arterial connecting capital to NEOM, Trojena, and The Line. Current route via Tabuk adds 6h detour. No direct high-speed expressway exists. Planning based on NTS 2021 corridor study.", recommendation: "Phase 1 (Riyadh–Hail, 850 km) by 2027. Phase 2 (Hail–NEOM, 3,350 km) by 2029. Begin ROW acquisition Q2 2026." },
  { id: 402, type: "road", name: "Jeddah – KAEC Expressway", lat: 22.4, lng: 39.1, severity: "HIGH", delay: "1.8K KM · 2028", length: "1,800 KM", status: "IN PROGRESS", completion: "2028", cause: "Target completion: 2028. King Abdullah Economic City access road at 140% capacity during peak. Single carriageway bottleneck causing 45-min delays. Phase 1 (dual carriageway) 60% complete as of Q1 2026.", recommendation: "Complete dual carriageway by Q4 2027. Accelerate Rabigh bypass (300 km) for 2028 delivery." },
  { id: 403, type: "road", name: "Eastern Province Ring Road", lat: 26.45, lng: 50.1, severity: "CRITICAL", delay: "3.5K KM · 2030", length: "3,500 KM", status: "DESIGN", completion: "2030", cause: "Target completion: 2030. Dammam-Jubail-Ras Al Khair industrial triangle lacks dedicated freight corridor. Design phase based on 2023 MOT freight demand study projecting 85% truck traffic increase by 2030.", recommendation: "Complete EIA by Q4 2026. Jubail–Ras Al Khair segment (highest ROI) by 2028. Full ring by 2030." },
  { id: 404, type: "road", name: "Madinah – Yanbu Highway", lat: 23.9, lng: 38.5, severity: "HIGH", delay: "2.1K KM · 2027", length: "2,100 KM", status: "IN PROGRESS", completion: "2027", cause: "Target completion: 2027. Earliest delivery among tracked projects. Existing 2-lane highway severely congested by petrochemical logistics. Yanbu port expansion requires Grade-A access for 50K+ daily truck movements. 45% complete.", recommendation: "Phase 2 widening on track for Q2 2027. Add intelligent traffic management system for hazmat routing." },
  { id: 405, type: "road", name: "Abha – Soudah Tourism Rd", lat: 18.25, lng: 42.3, severity: "HIGH", delay: "0.8K KM · 2028", length: "800 KM", status: "DESIGN", completion: "2028", cause: "Target completion: 2028. Soudah Development project expects 2M visitors/year by 2029. Current mountain roads: single lane, 30 km/h average, no shoulder. Geological survey required for 6 tunnel segments.", recommendation: "Begin geological survey Q1 2026. Construction start Q3 2026. Scenic expressway delivery by Q4 2028." },
  { id: 406, type: "road", name: "Qassim Agricultural Route", lat: 26.1, lng: 44.2, severity: "HIGH", delay: "1.6K KM · 2029", length: "1,600 KM", status: "PLANNED", completion: "2029", cause: "Target completion: 2029. Qassim produces 40% of Saudi dates and vegetables. Farm-to-market roads are unpaved, causing 15% crop spoilage. Forecast based on MOT 2024 agricultural logistics audit.", recommendation: "Pave 600 km priority farm corridors by 2027. Install cold chain logistics hubs at 4 nodes. Full network by 2029." }
];

// --- PUBLIC INFRASTRUCTURE COMPETITIVENESS: AI-IDENTIFIED GAPS (ast_1) ---
// Agent scores each zone 0–100 across 6 sub-dimensions: transit access (20%), healthcare proximity (15%),
// education coverage (15%), utility reliability (20%), green space (15%), digital connectivity (15%).
// Sources: MOMRA municipal services DB, GASTAT infrastructure census, SEC reliability indices, RCRC GIS layers.
const INFRA_COMPETITIVENESS_ALERTS = [
  // RIYADH — 2 zones
  { id: 501, type: "infra_gap", name: "North Riyadh Metro Corridor, Riyadh", lat: 25.00, lng: 46.45, severity: "CRITICAL", delay: "SCORE: 42/100", cause: "AI IDENTIFICATION: Computer vision analysis of satellite imagery confirms Riyadh Metro Line 4 stations 90% complete but surrounding 5 km² has zero public parks (0 sqm/capita vs 9 sqm WHO standard). Healthcare gap: nearest hospital 8.2 km away serving 120,000 residents (0.4 beds/1,000 vs national avg 2.2). SEC grid data shows 97.8% uptime (good) but fiber-to-home penetration only 35% despite duct infrastructure installed. 3 schools serving catchment of 18,000 school-age children (capacity deficit: 4,200 seats).\n\nWHY LOW SCORE: Transit sub-score strong (82/100) due to metro. But healthcare (18/100), green space (5/100), and education (31/100) are severely deficient. Area developed residentially before social infrastructure was planned — classic Saudi 'housing-first' gap.\n\nIMPACT ON COMPETITIVENESS: Global livability benchmarks (EIU, Mercer) weight healthcare and green space at 30% combined. This corridor's composite 42/100 puts it equivalent to tier-3 cities globally, despite SAR 200B+ metro investment. Fixing healthcare + parks would lift score to 68/100 (+26 points).", recommendation: "Priority 1: Allocate 3 plots (min 50,000 sqm total) for public parks along metro stations — estimated SAR 120M. Priority 2: Commission 200-bed district hospital (MOH fast-track — 24-month build). Priority 3: Build 2 primary schools (4,200 seats). Combined effect: score from 42 → 68. Timeline: 30 months." },
  { id: 502, type: "infra_gap", name: "South Riyadh Industrial Belt, Riyadh", lat: 24.35, lng: 46.80, severity: "HIGH", delay: "SCORE: 51/100", cause: "AI IDENTIFICATION: 12 km² zone south of 2nd Ring Road housing 180,000 industrial workers. Transit score: 22/100 (no metro, 3 bus routes with 45-min headways). Utility reliability: 94.2% uptime (below 99% target — 52 hours unplanned outage in 2025). 5G coverage: 15%. One clinic per 45,000 residents. Zero dedicated green space — nearest park 6 km away.\n\nWHY LOW SCORE: Industrial zone designation meant social infrastructure was never planned. But residential creep means 180,000 people now live here permanently. Transit and healthcare gaps make workers commute 90+ min daily to access basic services.\n\nIMPACT ON COMPETITIVENESS: Industrial workforce retention costs employers SAR 45,000/worker/year in transport subsidies. Improving livability would reduce turnover 25% per McKinsey benchmark.", recommendation: "Deploy BRT line connecting industrial belt to metro terminus (8 km, SAR 800M, 18-month build). Establish 3 community clinics + 1 urgent care center. Upgrade SEC substation for 99.5% reliability. Score impact: 51 → 72 (+21 points)." },

  // MAKKAH — 2 zones
  { id: 503, type: "infra_gap", name: "East Jeddah Residential Sprawl, Makkah Region", lat: 21.65, lng: 39.35, severity: "CRITICAL", delay: "SCORE: 38/100", cause: "AI IDENTIFICATION: Satellite analysis of 20 km² eastern Jeddah shows rapid unplanned residential growth (2018–2026). Population density: 15,000/km² but infrastructure designed for 5,000/km². Transit: zero rail, 8 bus routes (avg 60-min headway). Healthcare: 3 clinics for 300,000 residents (0.3 beds/1,000). Schools at 145% capacity. Water supply: 16 hours/day (intermittent). Green space: 0.8 sqm/capita.\n\nWHY LOW SCORE: Lowest-scoring zone in Makkah province. Rapid informal densification outpaced infrastructure planning. Municipality unable to acquire land for public facilities due to fragmented private ownership.\n\nIMPACT ON COMPETITIVENESS: Zone produces 40% of Jeddah's complaint volume to Balady app. Resident satisfaction survey: 2.1/10. Drives middle-class flight to north Jeddah, creating urban inequality spiral.", recommendation: "Emergency infrastructure package: 24/7 water supply (desalination plant extension — SAR 2B, 30 months). BRT corridor to Jeddah central (SAR 1.5B). 5 new schools + 2 hospitals via MOH emergency allocation. Plot consolidation for 3 public parks. Score impact: 38 → 62 (+24 points)." },
  { id: 504, type: "infra_gap", name: "Taif Mountain Gateway, Makkah Region", lat: 21.30, lng: 40.45, severity: "HIGH", delay: "SCORE: 48/100", cause: "AI IDENTIFICATION: Taif's tourism gateway zone (Al Hada – Al Shafa corridor). Infrastructure optimized for seasonal visitors but permanent population of 85,000 underserved. Transit: mountain roads only, no public transport (score: 12/100). Healthcare: 1 general hospital (120 beds for 85,000 + 2M annual visitors). Digital: 5G non-existent, fiber 22%. Green space strong naturally (mountain environment, 35 sqm/capita).\n\nWHY LOW SCORE: Tourism investment prioritized visitor experience over resident services. Permanent population growing 6% YoY as Taif gains popularity for year-round living (cool climate).\n\nIMPACT ON COMPETITIVENESS: Taif positioned as Vision 2030 'mountain tourism' anchor. But resident infrastructure gap threatens community acceptance of tourism growth.", recommendation: "Commission public shuttle system connecting Al Hada, Al Shafa, and Taif city center (electric minibus fleet — SAR 200M). Expand hospital to 350 beds. Deploy fiber + 5G along corridor. Score impact: 48 → 67 (+19 points)." },

  // EASTERN PROVINCE — 2 zones
  { id: 505, type: "infra_gap", name: "Jubail Residential Sector, Eastern Province", lat: 27.00, lng: 49.55, severity: "HIGH", delay: "SCORE: 56/100", cause: "AI IDENTIFICATION: Royal Commission-planned residential sectors around Jubail Industrial City. Transit: internal bus system (score: 45/100) but no intercity rail connection to Dammam. Healthcare: Royal Commission hospital adequate (score: 72/100). Education: international schools limited (score: 48/100). Green space: well-planned (12 sqm/capita, score: 78/100). Digital: fiber 85%, 5G 60% (score: 71/100). Utility reliability: excellent (99.6%, score: 92/100).\n\nWHY LOW SCORE: Strong in utilities and green space, but transit isolation from Dammam metro area (80 km) and limited education choice make it unattractive for families with school-age children. Expatriate engineers increasingly declining Jubail postings.\n\nIMPACT ON COMPETITIVENESS: Aramco/SABIC report 22% higher recruitment costs for Jubail vs Dammam positions. Transit gap adds SAR 35,000/employee/year in commuting costs.", recommendation: "Priority: Jubail–Dammam express rail (80 km, SAR 8B, 36-month build — already in MOT pipeline). Add 3 international school licenses. Score impact: 56 → 74 (+18 points)." },
  { id: 506, type: "infra_gap", name: "Al Khobar Waterfront District, Eastern Province", lat: 26.20, lng: 50.30, severity: "HIGH", delay: "SCORE: 63/100", cause: "AI IDENTIFICATION: Al Khobar's premium waterfront district. Transit: moderate (bus + proximity to Dammam metro extension, score: 55/100). Healthcare: King Fahad Hospital 3 km away (score: 68/100). Education: good variety including KFUPM proximity (score: 72/100). Green space: Corniche excellent (22 sqm/capita, score: 88/100). Digital: full fiber + 5G (score: 85/100). Utility: 99.2% (score: 88/100).\n\nWHY ANALYSIS MATTERS: Highest current score among monitored Eastern Province zones. But waterfront development plan (2027–2030) will add 25,000 residents — healthcare and transit sub-scores will degrade to 45/100 and 38/100 respectively without proactive investment.\n\nIMPACT ON COMPETITIVENESS: Currently Eastern Province's most competitive residential zone. Risk of score dropping from 63 → 52 by 2030 without pre-emptive infrastructure.", recommendation: "Pre-emptive capacity build: extend Dammam metro Line 2 to Khobar waterfront (SAR 3B). Commission 200-bed hospital to absorb growth. Maintain score at 63+ through 2030 growth period." },

  // MADINAH — 2 zones
  { id: 507, type: "infra_gap", name: "Knowledge Economic City, Madinah", lat: 24.55, lng: 39.20, severity: "CRITICAL", delay: "SCORE: 35/100", cause: "AI IDENTIFICATION: KEC Phase 1 operational but surrounding area severely underserved. Transit: no public transport (score: 8/100) — residents rely entirely on private cars. 25 km from Madinah city center. Healthcare: 1 small clinic (score: 15/100). Education: 2 schools at 130% capacity (score: 28/100). Green space: desert landscape, zero public parks (score: 3/100). Digital: fiber to KEC buildings only, surrounding residential has ADSL only (score: 32/100).\n\nWHY LOW SCORE: KEC developed as isolated campus — no urban planning for residential neighborhoods that grew organically around it. Classic 'giga-project island' syndrome.\n\nIMPACT ON COMPETITIVENESS: KEC's value proposition as 'knowledge city' undermined by unlivable surroundings. Faculty recruitment at Islamic University satellite campus citing quality-of-life concerns.", recommendation: "Integrate KEC into Madinah urban fabric: commission shuttle to Haramain station (15 km, SAR 150M). Build district hospital (150-bed) and 3 schools. Create 80,000 sqm central park. Deploy city-wide fiber. Score impact: 35 → 61 (+26 points)." },
  { id: 508, type: "infra_gap", name: "Yanbu Heritage Coast, Madinah Region", lat: 24.00, lng: 38.00, severity: "HIGH", delay: "SCORE: 47/100", cause: "AI IDENTIFICATION: Yanbu's traditional city center and coastal zone. Transit: limited local bus (score: 28/100). Healthcare: adequate for current population (score: 62/100). Education: sufficient (score: 58/100). Green space: coastal access good but formal parks lacking (score: 42/100). Digital: fiber 40%, no 5G (score: 35/100). Utility: water intermittent (18 hrs/day) (score: 55/100).\n\nWHY LOW SCORE: Yanbu investment historically focused on industrial city (Royal Commission zone). Traditional city center infrastructure aging — average road age 28 years, water pipes 35 years.\n\nIMPACT ON COMPETITIVENESS: Yanbu Heritage Coast has SAR 5B tourism development potential (Red Sea proximity) but current infrastructure score deters private investment.", recommendation: "Urban renewal program: replace aging water network (SAR 800M, 24-month). Deploy fiber + 5G across heritage coast. Create waterfront promenade park (3 km). Score impact: 47 → 64 (+17 points)." },

  // ASIR — 1 zone
  { id: 509, type: "infra_gap", name: "Abha City Center, Asir", lat: 18.25, lng: 42.55, severity: "HIGH", delay: "SCORE: 52/100", cause: "AI IDENTIFICATION: Abha downtown (3 km² core). Transit: no formal public transport system (score: 15/100) — mountain topography makes standard bus routes difficult. Healthcare: Prince Sultan Hospital adequate (score: 65/100). Education: good school density (score: 62/100). Green space: mountain parks excellent (score: 82/100). Digital: fiber 55%, 5G 20% (score: 45/100). Utility: 98.5% grid reliability (score: 82/100).\n\nWHY LOW SCORE: Transit and digital sub-scores drag composite down despite strong natural amenities. Abha's mountain geography requires specialized transit solutions (cable car, funicular) not addressed by standard MOT planning.\n\nIMPACT ON COMPETITIVENESS: Soudah Development project expects 1M+ visitors annually by 2030. Without transit, Abha city center cannot absorb visitor overflow — creating congestion and reducing resident quality of life.", recommendation: "Commission Abha urban cable car system (4 stations, SAR 1.2B — proven model from La Paz, Medellín). Accelerate 5G rollout leveraging Soudah telecom investment. Score impact: 52 → 71 (+19 points)." },

  // QASSIM — 2 zones
  { id: 510, type: "infra_gap", name: "Buraidah Central District, Qassim", lat: 26.40, lng: 43.80, severity: "HIGH", delay: "SCORE: 49/100", cause: "AI IDENTIFICATION: Buraidah city center. Transit: no public transport system (score: 10/100). Healthcare: adequate hospitals but poorly distributed — western Buraidah has 15-km gap (score: 52/100). Education: strong — Qassim University proximity (score: 70/100). Green space: date palm oases provide some green but no formal parks (score: 35/100). Digital: fiber 45%, 5G pilot only (score: 38/100). Utility: 98.8% reliable (score: 85/100).\n\nWHY LOW SCORE: Qassim historically underinvested in urban transit and digital infrastructure. Agricultural economy meant less pressure to urbanize. But agri-tech transformation driving rapid urbanization since 2022.\n\nIMPACT ON COMPETITIVENESS: Agri-tech companies report difficulty attracting tech talent from Riyadh. 'Quality of life gap' cited by 68% of declining job candidates (2025 HRDF survey).", recommendation: "Launch Buraidah BRT (3 lines, SAR 600M). Convert 2 date palm plots to public parks. Accelerate fiber + 5G (Qassim 2027 digital plan). Score impact: 49 → 66 (+17 points)." },
  { id: 511, type: "infra_gap", name: "Unaizah Heritage Core, Qassim", lat: 25.90, lng: 44.10, severity: "HIGH", delay: "SCORE: 44/100", cause: "AI IDENTIFICATION: Unaizah traditional city center — known for historical markets and agricultural heritage. Transit: none (score: 5/100). Healthcare: 1 general hospital, 60 beds for 170,000 population (score: 38/100). Education: adequate (score: 60/100). Green space: agricultural periphery but urban core has zero parks (score: 22/100). Digital: ADSL dominant, fiber 20%, no 5G (score: 25/100). Utility: water intermittent in summer (score: 65/100).\n\nWHY LOW SCORE: Unaizah overlooked in Qassim development plans which focused on Buraidah. Heritage tourism potential (traditional souq, date festivals) unrealized due to infrastructure deficit.\n\nIMPACT ON COMPETITIVENESS: Unaizah has authentic cultural assets valued by Saudi Tourism Authority but infrastructure score makes it unsuitable for tourism at scale.", recommendation: "Heritage tourism infrastructure package: shuttle connection to Buraidah (30 km, SAR 100M). Expand hospital to 200 beds. Create heritage quarter walking streets with green corridors. Deploy fiber + 5G. Score impact: 44 → 63 (+19 points)." }
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
  { id: 603, type: "yield", name: "Jeddah Central Waterfront, Makkah Region", lat: 21.55, lng: 39.12, severity: "CRITICAL", delay: "YIELD: 5.4% → 8.8%", cause: "AI IDENTIFICATION: Jeddah Central project (SAR 75B mega-development on former airport site). Current fringe-area gross yield: 5.4%. ML model forecasts 8.8% by 2030 as project phases complete.\n\nDRIVERS: (1) Jeddah Central master plan: 5.7M sqm of mixed-use space, creating largest urban redevelopment in Saudi history. (2) Jeddah Tower (world's tallest) as value anchor. (3) Existing Corniche demand premium — current Corniche yields already 7.2% (highest in Jeddah). (4) Red Sea International Airport expansion (15 km away) adding 30M passenger capacity by 2030.\n\nRISK ASSESSMENT: AI risk model scores 76/100 confidence (high). Primary risk: project timeline delays (mega-projects historically slip 2–3 years). Mitigant: Royal backing + PIF investment = execution certainty above private-sector average.\n\nSENTIMENT ANALYSIS: NLP scan of 5,400 commercial broker reports shows 83% positive outlook for Jeddah waterfront RE.", recommendation: "INVESTMENT PRIORITY: HIGH. Zone surrounding Jeddah Central within 3 km radius — purchase land NOW at pre-development prices (SAR 3,500/sqm, projected SAR 8,000/sqm by 2030). Recommended use: hospitality + serviced apartments capturing Umrah + leisure tourism convergence." },
  { id: 604, type: "yield", name: "Makkah Southern Residential, Makkah", lat: 21.20, lng: 39.90, severity: "HIGH", delay: "YIELD: 4.5% → 6.8%", cause: "AI IDENTIFICATION: Residential zone 8 km south of Haram. Current gross yield: 4.5%. Projected 2030: 6.8%.\n\nDRIVERS: (1) Hajj/Umrah visitor capacity expansion — target 30M Umrah visitors/year by 2030 (from 17M in 2025). (2) Haramain rail station 4 km away. (3) Residential-to-serviced-apartment conversion trend — 15% of units now on short-term rental platforms. (4) Government housing subsidies (Sakani) improving ownership rates, reducing rental stock, increasing yield on remaining rentals.\n\nRISK ASSESSMENT: AI risk model scores 68/100 confidence (moderate). Primary risk: hotel oversupply in central Makkah may compress residential yields within 5 km of Haram. Mitigant: Southern zone outside hotel saturation radius — serves residential demand.\n\nAI PATTERN: Seasonal yield variance analysis shows consistent 40% premium during Hajj season — averaging this into annual yield projection.", recommendation: "INVESTMENT PRIORITY: MEDIUM-HIGH. Encourage serviced apartment development (higher yield than traditional residential). Improve transit connectivity to Haram to maintain yield premium. Target 2,000 new serviced units by 2029." },

  // EASTERN PROVINCE — 2 zones
  { id: 605, type: "yield", name: "Dhahran Techno Valley, Eastern Province", lat: 26.30, lng: 50.15, severity: "CRITICAL", delay: "YIELD: 5.8% → 8.5%", cause: "AI IDENTIFICATION: Zone surrounding KFUPM Techno Valley (innovation district). Current gross yield: 5.8%. Projected 2030: 8.5%.\n\nDRIVERS: (1) Aramco's R&D campus expansion — adding 8,000 researchers/engineers. (2) 45 tech startups in Techno Valley incubator (2026), projected 200+ by 2030. (3) Saudi tech talent repatriation program bringing 15,000 skilled workers to Eastern Province. (4) Limited competing supply — only 2 Grade-A residential developments within 5 km.\n\nRISK ASSESSMENT: AI risk model scores 79/100 confidence (high). Primary risk: oil price dependency affecting Aramco expansion pace. Mitigant: R&D investment is non-oil diversification strategy — countercyclical to oil.\n\nAI CLUSTERING: Identified as Eastern Province's #1 appreciation zone. Comparable to Bengaluru IT corridor trajectory (2010–2020).", recommendation: "INVESTMENT PRIORITY: HIGH. Build tech-worker housing (smart apartments, co-living) near Techno Valley. Target: 3,000 units @ SAR 1.2M avg. Estimated 15-year IRR: 14.2%. Partner with KFUPM for integrated campus-city model." },
  { id: 606, type: "yield", name: "Dammam Al Shatie District, Eastern Province", lat: 26.50, lng: 50.05, severity: "HIGH", delay: "YIELD: 5.2% → 7.0%", cause: "AI IDENTIFICATION: Dammam's premium waterfront district (Al Shatie). Current gross yield: 5.2%. Projected 2030: 7.0%.\n\nDRIVERS: (1) Dammam waterfront master plan (SAR 12B) adding 2 km promenade + marina. (2) Cross-Gulf demand — Bahrain causeway traffic generating SAR 4B annual retail spending. (3) Eastern Province population growing 3.2% YoY. (4) Only waterfront zone in Dammam with Grade-A office supply.\n\nRISK ASSESSMENT: AI risk model scores 65/100 confidence (moderate). Primary risk: competing waterfront development in Al Khobar diluting demand. Mitigant: Dammam is administrative capital — government tenants provide stable occupancy floor.\n\nSENTIMENT ANALYSIS: Commercial broker reports 72% positive, 28% neutral — no negative outlook flagged.", recommendation: "INVESTMENT PRIORITY: MEDIUM. Diversify waterfront mix — currently 60% office, recommend shifting to 40% office + 30% residential + 30% entertainment to capture weekend/leisure demand from Bahrain visitors." },

  // MADINAH — 1 zone
  { id: 607, type: "yield", name: "Haramain Station District, Madinah", lat: 24.65, lng: 39.55, severity: "HIGH", delay: "YIELD: 4.2% → 7.1%", cause: "AI IDENTIFICATION: Zone around Madinah's Haramain High-Speed Railway station. Current gross yield: 4.2% (lowest among tracked zones — reflecting undeveloped surroundings). Projected 2030: 7.1% (69% appreciation — highest growth rate nationally).\n\nDRIVERS: (1) Station handles 8,000 passengers/day, projected 15,000 by 2030 — TOD demand textbook case. (2) Umrah visitor growth from 17M to 30M creates massive hospitality demand within 2 km of station. (3) Currently almost no commercial supply near station — first-mover advantage. (4) Land price: SAR 1,800/sqm (significantly below fair value given transit access — AI valuation model estimates SAR 5,500/sqm fair value by 2028).\n\nRISK ASSESSMENT: AI risk model scores 73/100 confidence (moderate-high). Primary risk: multi-stakeholder land ownership blocking development (Saudi Railways + MOF + private). Mitigant: MOMRAH joint development authority proposed — if enacted, unlocks SAR 15B development.\n\nAI PATTERN: NLP analysis of 3,200 Umrah visitor reviews identifies 'distance from station to accommodation' as #1 complaint (mentioned in 47% of reviews). Station-adjacent hospitality would capture this unmet demand.", recommendation: "INVESTMENT PRIORITY: HIGH (UNDERVALUED). Expedite joint development authority formation. First phase: 500 serviced apartments + 50,000 sqm retail within 500m of station. Current land prices represent 67% discount to AI fair value estimate." },

  // ASIR — 1 zone
  { id: 608, type: "yield", name: "Soudah Peaks Tourism Zone, Asir", lat: 18.40, lng: 42.40, severity: "HIGH", delay: "YIELD: 3.2% → 6.5%", cause: "AI IDENTIFICATION: Zone surrounding Soudah Development Company's mega-project (PIF-backed, SAR 11B). Current gross yield: 3.2% (pre-development baseline). Projected 2030: 6.5% (103% appreciation).\n\nDRIVERS: (1) Soudah project targets 2M visitors/year by 2030 — luxury mountain resort comparable to Aspen/St. Moritz. (2) Currently zero hospitality supply at site — all supply must be built. (3) Cool climate (avg 18°C year-round) unique in Saudi Arabia. (4) Abha airport expansion (SAR 1.5B) adding direct international routes by 2028.\n\nRISK ASSESSMENT: AI risk model scores 62/100 confidence (moderate). Primary risk: tourism demand projection uncertainty — Soudah is greenfield with no historical baseline. Mitigant: PIF backing ensures project completion; domestic tourism demand growing 25% YoY since 2022.\n\nAI CLUSTERING: Identified as Saudi Arabia's #1 'emerging destination' asset class — comparable to Trojena (NEOM) but with earlier delivery timeline and lower altitude risk.", recommendation: "INVESTMENT PRIORITY: MEDIUM-HIGH (SPECULATIVE). Early-stage positioning: acquire hospitality concessions within Soudah master plan. Build boutique lodge properties (50–100 keys). Estimated 20-year IRR: 12.8% base case, 18.5% upside case. Key risk: execution timeline." },

  // QASSIM — 1 zone
  { id: 609, type: "yield", name: "Buraidah Agri-Tech Innovation District, Qassim", lat: 26.30, lng: 43.95, severity: "HIGH", delay: "YIELD: 3.5% → 5.8%", cause: "AI IDENTIFICATION: Emerging agri-tech zone at Buraidah–Al Rass corridor. Current gross yield: 3.5% (low — primarily agricultural land with light commercial). Projected 2030: 5.8%.\n\nDRIVERS: (1) Saudi agri-tech sector growing 15% YoY — NEOM Food Tech partnership creating Qassim supply chain hub. (2) Ministry of Agriculture designating Qassim as 'National Agricultural Innovation Zone' (2025 decree). (3) 6 agri-tech startups seeking Grade-A space (zero current supply). (4) Agricultural land-to-commercial conversion creating 4× value uplift.\n\nRISK ASSESSMENT: AI risk model scores 58/100 confidence (moderate). Primary risk: agri-tech sector nascent in Saudi Arabia — demand projections based on global analogues (Netherlands, Israel) may not fully transfer. Mitigant: SAR 2B government innovation fund de-risks private investment.\n\nAI PATTERN: NLP scan of 1,200 agri-tech startup investor presentations shows 'Qassim location preference' in 72% — strong revealed preference signal.", recommendation: "INVESTMENT PRIORITY: MEDIUM (LONG-TERM). Build incubator + light industrial complex (40,000 sqm). Partner with MODON for agri-tech zone designation. First-mover advantage in niche asset class. Estimated 15-year IRR: 9.5%." }
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
           {alert.type === 'commute' ? `${alert.delay} DELAY` : alert.delay}
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
  { rank: 1, city: 'Riyadh', region: 'Riyadh', congestionIndex: 78, avgDelay: '+35 min', criticalRoads: 12, affected: '2.3M', status: 'CRITICAL' },
  { rank: 2, city: 'Jeddah', region: 'Makkah', congestionIndex: 72, avgDelay: '+28 min', criticalRoads: 8, affected: '1.5M', status: 'CRITICAL' },
  { rank: 3, city: 'Makkah', region: 'Makkah', congestionIndex: 68, avgDelay: '+32 min', criticalRoads: 6, affected: '1.2M', status: 'HIGH' },
  { rank: 4, city: 'Dammam', region: 'Eastern', congestionIndex: 62, avgDelay: '+22 min', criticalRoads: 5, affected: '850K', status: 'HIGH' },
  { rank: 5, city: 'Madinah', region: 'Madinah', congestionIndex: 58, avgDelay: '+18 min', criticalRoads: 4, affected: '620K', status: 'WARNING' },
  { rank: 6, city: 'Khobar', region: 'Eastern', congestionIndex: 55, avgDelay: '+15 min', criticalRoads: 3, affected: '480K', status: 'WARNING' },
  { rank: 7, city: 'Tabuk', region: 'Tabuk', congestionIndex: 48, avgDelay: '+12 min', criticalRoads: 2, affected: '320K', status: 'MODERATE' },
  { rank: 8, city: 'Buraidah', region: 'Qassim', congestionIndex: 45, avgDelay: '+10 min', criticalRoads: 2, affected: '280K', status: 'MODERATE' },
];

const AGENTS_DATA = {
  flow: {
    id: "flow", title: "FLOW AGENT", icon: DynamicFlowIcon, color: "#00B558",
    functions: [
      { 
        id: "flw_1", name: "24H COMMUTE INDEX", 
        desc: "AI DETECTS NON-RECURRENT CONGESTION ANOMALIES USING REAL-TIME COMPUTER VISION FEEDS.",
        stats: [
          { label: 'CRITICAL ALERTS', value: '12', color: '#ff4444' },
          { label: 'WARNINGS', value: '34', color: '#FCD34D' },
          { label: 'ACTIVE CAMS', value: '142', color: '#00B558' }
        ]
      },
      {
        id: "flw_4", name: "CITY CONGESTION RANKING",
        desc: "REAL-TIME NATIONAL TRAFFIC CONGESTION INDEX BY CITY. CRITICAL THRESHOLD: 60+.",
        stats: [
          { label: 'CITIES', value: '8', color: '#00B558' },
          { label: 'CRITICAL', value: '4', color: '#ff4444' },
          { label: 'HIGH', value: '2', color: '#FCD34D' }
        ]
      }
    ]
  },
  demand: {
    id: "demand", title: "DEMAND FORECASTER", icon: DynamicDemandIcon, color: "#FCD34D",
    functions: [
      { 
        id: "dmd_1", name: "HOUSING DEMAND FORECAST", 
        desc: "HOUSING SHORTFALL BY 2030 ACROSS 6 REGIONS. NHC SAKANI DATA + POPULATION GROWTH MODELS. 2030 TARGET: 70% HOMEOWNERSHIP. CURRENT: 63%. DEFICIT = UNITS TO CLOSE GAP.",
        stats: [
          { label: 'BY-2030 DEFICIT', value: '-153K', color: '#ff4444' },
          { label: 'Q1 2026', value: '63%', color: '#FCD34D' },
          { label: '2030 TARGET', value: '70%', color: '#00B558' }
        ]
      },
      { 
        id: "dmd_2", name: "ROAD NETWORK EXPANSION", 
        desc: "BASED ON NATIONAL TRANSPORT STRATEGY (2021–2030) AND GIGA-PROJECT CORRIDOR STUDIES. CURRENT: 76K KM. TARGET: 100K KM BY 2030. PROJECTS SHOWN ON MAP.",
        stats: [
          { label: 'Q1 2026', value: '76K KM', color: '#FCD34D' },
          { label: 'BY-2030 GAP', value: '24K KM', color: '#ff4444' },
          { label: '2030 TARGET', value: '100K KM', color: '#00B558' }
        ]
      }
    ]
  },
  idle: {
    id: "idle", title: "IDLE LAND AGENT", icon: DynamicIdleIcon, color: "#ff4444",
    functions: [
      { 
        id: "idl_1", name: "WHITE LAND ACTIVATION RATE", 
        desc: "AI SCANS MOMRAH WHITE LAND REGISTRY + SATELLITE IMAGERY TO PINPOINT IDLE PARCELS. EXPLAINS WHY EACH PLOT IS UNDEVELOPED AND RECOMMENDS USE. TAX: 2.5% LEVY.",
        stats: [
          { label: 'CURRENT Q1 2026', value: '38%', color: '#ff4444' },
          { label: '2030 TARGET', value: '65%', color: '#00B558' },
          { label: 'AI SPOTS', value: '12', color: '#FCD34D' }
        ]
      },
      { 
        id: "idl_2", name: "URBAN LAND UTILIZATION INDEX", 
        desc: "AI ANALYZES SATELLITE FOOTPRINT, INFRA DENSITY, AND ZONING TO IDENTIFY UNDERUTILIZED ZONES. SCORES IMPACT PER ZONE AND RECOMMENDS DEVELOPMENT.",
        stats: [
          { label: 'CURRENT Q1 2026', value: '58', color: '#ff4444' },
          { label: '2030 TARGET', value: '80', color: '#00B558' },
          { label: 'ZONES FLAGGED', value: '13', color: '#FCD34D' }
        ]
      }
    ]
  },
  asset: {
    id: "asset", title: "ASSET EVALUATION", icon: DynamicAssetIcon, color: "#FCD34D",
    functions: [
      { 
        id: "ast_1", name: "INFRASTRUCTURE COMPETITIVENESS INDEX", 
        desc: "SCORES ZONES 0–100 ACROSS TRANSIT, HEALTHCARE, EDUCATION, UTILITIES, GREEN SPACE, AND DIGITAL. BENCHMARKED AGAINST 50 GLOBAL PEER CITIES VIA MOMRA + GASTAT DATA.",
        stats: [
          { label: 'CURRENT Q1 2026', value: '54', color: '#ff4444' },
          { label: '2030 TARGET', value: '75', color: '#00B558' },
          { label: 'ZONES FLAGGED', value: '11', color: '#FCD34D' }
        ]
      },
      { 
        id: "ast_2", name: "REAL ESTATE YIELD FORECAST", 
        desc: "ML MODEL ON 10-YR REGA DATA + SATELLITE ACTIVITY FORECASTS YIELD PER ZONE. FACTORS: DEMAND (POP + HQ + TOURISM), SUPPLY (NHC), AND GIGA-PROJECT PROXIMITY. TARGET: RE 10% OF GDP.",
        stats: [
          { label: 'CURRENT Q1 2026', value: '5.2%', color: '#ff4444' },
          { label: '2030 TARGET', value: '7.5%', color: '#00B558' },
          { label: 'ZONES TRACKED', value: '9', color: '#FCD34D' }
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
                labelFormatter={(label) => `YEAR 20${label}`}
                formatter={(value: number) => [`${value}%`, 'Commercial ROI']}
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
                labelFormatter={(label) => `TIME: ${label}:00`}
                formatter={(value: number, name: string) => {
                  if (name === 'n') return [`${value}`, 'Predicted Events'];
                  if (name === 'a') return [`${value}`, 'Actual Events'];
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
                  const names: Record<string, string> = { RYD: 'RIYADH', MKH: 'MAKKAH', EST: 'EASTERN', MDN: 'MADINAH', ASR: 'ASIR', QSM: 'QASSIM' };
                  return names[label] || label;
                }}
                formatter={(value: number) => [`${value}K UNITS`, 'By-2030 Deficit']}
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
                  const names: Record<string, string> = { RYD: 'RIYADH', MKH: 'MAKKAH', EST: 'EASTERN', MDN: 'MADINAH', ASR: 'ASIR', QSM: 'QASSIM' };
                  return names[label] || label;
                }}
                formatter={(value: number) => [`${value}K KM`, 'By-2030 Gap']}
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
               title="View Details"
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
                      <th className="text-left py-1 px-1 font-bold">#</th>
                      <th className="text-left py-1 px-1 font-bold">CITY</th>
                      <th className="text-center py-1 px-1 font-bold">IDX</th>
                      <th className="text-center py-1 px-1 font-bold">DELAY</th>
                      <th className="text-center py-1 px-1 font-bold">STATUS</th>
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
                      style={{ color: primaryStat.color, fontSize: layout === 'full' ? '46px' : '36px', textShadow: `0 0 20px ${primaryStat.color}60` }}
                   >
                      {primaryStat.value}
                   </span>
                   <span className="text-gray-400 font-bold tracking-widest uppercase leading-tight text-[10px] mb-1 text-right flex-1">
                      {primaryStat.label}
                   </span>
                 </div>
                 
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
                       100K KM (2030 TARGET)
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
                COMMUTE EFFICIENCY STATUS & PROJECTION
              </h2>
              <span className="text-[10px] text-[#00B558] font-bold tracking-[0.2em] uppercase">FLOW AGENT // STRATEGIC KPI DIAGNOSTIC</span>
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
                SYSTEM INSIGHT: AI DETECTS NON-RECURRENT CONGESTION ANOMALIES USING REAL-TIME COMPUTER VISION FEEDS.
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
                     <span className="w-1.5 h-1.5 bg-[#00B558] rounded-full animate-pulse" /> CURRENT STATUS
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-none mb-1.5">MODERATE</h3>
                   <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">REAL-TIME: 08:42</span>
                </div>
             </div>

             {/* Middle: GAP CONNECTOR */}
             <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
                <div className="w-full flex items-center">
                   <div className="h-[2px] bg-gradient-to-r from-[#00B558] via-[#00B558] to-[#FCD34D] flex-1 relative overflow-hidden">
                      <motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ["-20%", "120%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                   </div>
                   <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center shadow-[0_0_20px_rgba(252,211,77,0.1)]">
                      <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">EFFICIENCY GAP</span>
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
                     TARGET 2030 <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-sm" />
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-none mb-1.5">OPTIMAL</h3>
                   <span className="text-[10px] text-[#FCD34D]/70 font-mono tracking-wider border border-[#FCD34D]/20 bg-[#FCD34D]/5 px-2 py-0.5 inline-block w-fit">VISION GOAL</span>
                </div>
             </div>
          </div>

          {/* TWO COLUMN LOGIC & MATRIX */}
          <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
             
             {/* LEFT COLUMN: CALCULATION LOGIC */}
             <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-[#00B558] uppercase tracking-[0.2em] border-b border-[#00B558]/30 pb-2 flex items-center gap-2 shrink-0">
                  <Zap className="w-3.5 h-3.5" /> CALCULATION LOGIC
                </h3>
                
                <div className="bg-gradient-to-br from-[#0a1a0a] to-[#051105] border border-[#00B558]/20 p-6 flex flex-col flex-1 justify-between relative overflow-hidden min-h-0">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-[#00B558]/5 rotate-45 transform translate-x-10 -translate-y-10 pointer-events-none" />
                   
                   {/* Huge Formula Block */}
                   <div className="bg-[#030a03] border border-[#00B558]/30 p-4 flex flex-col items-center justify-center gap-4 shadow-[inset_0_0_20px_rgba(0,181,88,0.1)] mb-4 shrink-0">
                      <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">COMMUTE EFFICIENCY ALGORITHM</span>
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
                            <span className="text-[9px] text-[#00B558] font-mono bg-[#00B558]/10 border border-[#00B558]/20 px-1.5 py-0.5 rounded-[2px] tracking-widest">REAL-TIME FEEDS</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">Current segment average velocity via computer vision and IoT.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-none mt-1.5 shrink-0" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">V<sub className="text-[9px] text-gray-400">BASE</sub></span>
                            <span className="text-[9px] text-gray-400 font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-[2px] tracking-widest">HISTORICAL AI</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">Expected non-peak steady state velocity (13:00-16:00 avg).</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-none mt-1.5 shrink-0 shadow-[0_0_8px_#FCD34D]" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-white uppercase tracking-wider">C<sub className="text-[9px] text-gray-400">MOD</sub></span>
                            <span className="text-[9px] text-[#FCD34D] font-mono bg-[#FCD34D]/10 border border-[#FCD34D]/20 px-1.5 py-0.5 rounded-[2px] tracking-widest">0.6 ~ 1.0 (DYNAMIC)</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">Dynamic penalty factor for accidents, weather, & non-cyclical events.</span>
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* RIGHT COLUMN: INTERPRETATION MATRIX */}
             <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-[#00B558] uppercase tracking-[0.2em] border-b border-[#00B558]/30 pb-2 flex items-center gap-2 shrink-0">
                  <Activity className="w-3.5 h-3.5" /> INDEX INTERPRETATION MATRIX
                </h3>
                
                <div className="flex flex-col flex-1 bg-[#051105] border border-[#00B558]/20 rounded-sm overflow-hidden min-h-0">
                   {/* Matrix Header */}
                   <div className="grid grid-cols-12 bg-[#00B558]/15 border-b border-[#00B558]/30 text-[9px] font-black text-[#00B558] uppercase tracking-widest px-4 py-2.5 shrink-0">
                     <div className="col-span-3">Index Range</div>
                     <div className="col-span-4">Status Level</div>
                     <div className="col-span-5">Recommended Action</div>
                   </div>
                   
                   <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                     {/* Row 1 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">90-100</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#00B558] shadow-[0_0_10px_rgba(0,181,88,0.8)] shrink-0" /> OPTIMAL FLOW
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Maintain current signal timing</div>
                     </div>

                     {/* Row 2 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">70-89</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#FCD34D] shadow-[0_0_10px_rgba(252,211,77,0.8)] shrink-0" /> BASIC FLOW
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Monitor volume trend changes</div>
                     </div>

                     {/* Row 3 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">50-69</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.8)] shrink-0" /> MILD CONGESTION
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Optimize intersection sync</div>
                     </div>

                     {/* Row 4 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#00B558]/10 hover:bg-[#00B558]/10 transition-colors flex-1 min-h-[40px]">
                       <div className="col-span-3 font-mono font-bold text-white text-[11px] tracking-wider">30-49</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-white uppercase tracking-widest text-[9px]">
                         <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.8)] shrink-0" /> MODERATE CONGESTION
                       </div>
                       <div className="col-span-5 text-[9px] text-gray-400 uppercase tracking-wide">Activate tidal lanes / bus pri.</div>
                     </div>

                     {/* Row 5 */}
                     <div className="grid grid-cols-12 items-center px-4 py-3 hover:bg-[#ff4444]/10 transition-colors flex-1 min-h-[40px] bg-[#ff4444]/5">
                       <div className="col-span-3 font-mono font-black text-[#ff4444] text-[11px] tracking-wider">0-29</div>
                       <div className="col-span-4 flex items-center gap-2 font-black text-[#ff4444] uppercase tracking-widest text-[9px]">
                         <div className="relative w-2 h-2 shrink-0">
                           <span className="absolute inset-0 rounded-full bg-[#ff4444] animate-ping opacity-75" />
                           <span className="relative block w-2 h-2 rounded-full bg-black border-[1.5px] border-[#ff4444] shadow-[0_0_10px_rgba(255,68,68,1)]" />
                         </div> 
                         SEVERE GRIDLOCK
                       </div>
                       <div className="col-span-5 text-[9px] text-[#ff4444] uppercase tracking-wide font-bold">Trigger emergency & rerouting</div>
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

// --- INFRASTRUCTURE COMPETITIVENESS INDEX DETAIL MODAL ---
const InfraModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  const color = '#FCD34D';
  const subDimensions = [
    { name: 'TRANSIT ACCESS', weight: 20, national: 38, target: 70, icon: '🚇', desc: 'Population within 800m of public transit (metro, BRT, bus)' },
    { name: 'UTILITY RELIABILITY', weight: 20, national: 72, target: 95, icon: '⚡', desc: 'SEC grid uptime (SAIFI/SAIDI) + water supply continuity' },
    { name: 'HEALTHCARE PROXIMITY', weight: 15, national: 52, target: 75, icon: '🏥', desc: 'Hospital beds per 1,000 + avg distance to primary care' },
    { name: 'EDUCATION COVERAGE', weight: 15, national: 58, target: 80, icon: '🎓', desc: 'School seats vs school-age population ratio' },
    { name: 'GREEN SPACE', weight: 15, national: 35, target: 60, icon: '🌳', desc: 'Public parks sqm per capita vs WHO standard (9 sqm/person)' },
    { name: 'DIGITAL CONNECTIVITY', weight: 15, national: 55, target: 80, icon: '📡', desc: 'FTTH penetration + 5G coverage percentage' },
  ];
  const regions = [
    { name: 'RIYADH', score: 62, target: 78, gap: 16 },
    { name: 'MAKKAH', score: 48, target: 72, gap: 24 },
    { name: 'EASTERN', score: 59, target: 76, gap: 17 },
    { name: 'MADINAH', score: 45, target: 70, gap: 25 },
    { name: 'ASIR', score: 52, target: 71, gap: 19 },
    { name: 'QASSIM', score: 47, target: 68, gap: 21 },
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
              <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(252,211,77,0.5)] leading-none mb-1">INFRASTRUCTURE COMPETITIVENESS INDEX</h2>
              <span className="text-[10px] text-[#FCD34D] font-bold tracking-[0.2em] uppercase">ASSET EVALUATION AGENT // VISION 2030 LIVABILITY KPI</span>
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
            <span className="text-[10px] font-bold text-[#FCD34D] tracking-[0.15em] uppercase">AI ENGINE: COMPUTER VISION VERIFIES ON-GROUND INFRA DELIVERY VS PLANNED. ANOMALY DETECTION FLAGS STALLED IMPROVEMENT. BENCHMARKED AGAINST 50 GLOBAL PEER CITIES.</span>
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
                <span className="text-[#ff4444] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#ff4444] rounded-full animate-pulse" /> NATIONAL AVG</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">BELOW TARGET</h3>
                <span className="text-[10px] text-[#ff4444]/70 font-mono tracking-wider border border-[#ff4444]/20 bg-[#ff4444]/5 px-2 py-0.5 inline-block w-fit">Q1 2026</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
              <div className="w-full flex items-center">
                <div className="h-[2px] bg-gradient-to-r from-[#ff4444] to-[#FCD34D] flex-1 relative overflow-hidden"><motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ['-20%', '120%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} /></div>
                <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center">
                  <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">GAP TO 2030</span>
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
                <span className="text-[#00B558] font-bold tracking-[0.25em] uppercase text-[9px] mb-1">TARGET 2030</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">TOP 40 GLOBAL</h3>
                <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">VISION GOAL</span>
              </div>
            </div>
          </div>

          {/* TWO COLUMN: Sub-Dimensions + Regional Breakdown */}
          <div className="grid grid-cols-2 gap-8">

            {/* LEFT: 6 Sub-Dimension Breakdown */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Zap className="w-3.5 h-3.5" /> SCORING SUB-DIMENSIONS (CONTRIBUTION MIX)</h3>
              <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-2">
                {subDimensions.map((dim, i) => (
                  <div key={i} className="bg-[#0a1a0a] border border-[#FCD34D]/15 p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{dim.icon}</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{dim.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-black text-[#FCD34D] bg-[#FCD34D]/10 border border-[#FCD34D]/20 px-1.5 py-0.5 tracking-widest">{dim.weight}% WEIGHT</span>
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
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Activity className="w-3.5 h-3.5" /> REGIONAL COMPETITIVENESS SCORES</h3>
              <div className="flex flex-col flex-1 bg-[#051105] border border-[#FCD34D]/20 overflow-hidden min-h-0">
                <div className="grid grid-cols-12 bg-[#FCD34D]/15 border-b border-[#FCD34D]/30 text-[9px] font-black text-[#FCD34D] uppercase tracking-widest px-4 py-2.5 shrink-0">
                  <div className="col-span-3">REGION</div>
                  <div className="col-span-3">CURRENT</div>
                  <div className="col-span-3">2030 TARGET</div>
                  <div className="col-span-3">GAP</div>
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
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">DATA SOURCES: </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">MOMRA MUNICIPAL DB · GASTAT INFRASTRUCTURE CENSUS · SEC RELIABILITY INDICES (SAIFI/SAIDI) · MOH FACILITY REGISTRY · MOE SCHOOL DENSITY · RCRC GREEN SPACE GIS · CITC DIGITAL COVERAGE</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- REAL ESTATE YIELD FORECAST DETAIL MODAL ---
const YieldModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  const regions = [
    { name: 'RIYADH', current: 6.1, projected: 8.2, drivers: 'KAFD + Diriyah Gate + Corporate HQ mandate', confidence: 82 },
    { name: 'MAKKAH', current: 4.8, projected: 7.1, drivers: 'Jeddah Central + 30M Umrah target + Red Sea airport', confidence: 76 },
    { name: 'EASTERN', current: 5.5, projected: 7.8, drivers: 'Aramco R&D expansion + Techno Valley + 15K repatriations', confidence: 79 },
    { name: 'MADINAH', current: 4.2, projected: 6.5, drivers: 'Haramain station TOD + Umrah growth + KEC Phase 2', confidence: 73 },
    { name: 'ASIR', current: 3.8, projected: 6.0, drivers: 'Soudah Peaks resort (SAR 11B) + Abha airport expansion', confidence: 62 },
    { name: 'QASSIM', current: 3.5, projected: 5.8, drivers: 'Agri-tech innovation zone + NEOM food tech partnership', confidence: 58 },
  ];
  const factors = [
    { name: 'DEMAND MULTIPLIER', weight: 35, desc: 'Population growth rate + corporate HQ relocations + tourism bed-night projections', color: '#FCD34D' },
    { name: 'SUPPLY PRESSURE', weight: 20, desc: 'NHC housing pipeline + commercial permits issued (higher supply = yield compression)', color: '#ff4444' },
    { name: 'GIGA-PROJECT PREMIUM', weight: 25, desc: 'Proximity to KAFD, Diriyah, Jeddah Central, NEOM, Red Sea — adds 1.5–3.0% yield premium', color: '#00B558' },
    { name: 'INFRASTRUCTURE QUALITY', weight: 10, desc: 'Transit access, utility reliability, digital connectivity from PICI scoring', color: '#3b82f6' },
    { name: 'RISK DISCOUNT', weight: 10, desc: 'Oversupply risk, single-sector dependency, macro sensitivity — reduces projected yield', color: '#f97316' },
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
              <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(252,211,77,0.5)] leading-none mb-1">REAL ESTATE YIELD FORECAST</h2>
              <span className="text-[10px] text-[#FCD34D] font-bold tracking-[0.2em] uppercase">ASSET EVALUATION AGENT // VISION 2030 RE SECTOR TARGET: 10% OF GDP</span>
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
            <span className="text-[10px] font-bold text-[#FCD34D] tracking-[0.15em] uppercase">ML MODEL TRAINED ON 10 YEARS REGA TRANSACTION DATA + SATELLITE CONSTRUCTION DETECTION. GEOSPATIAL K-MEANS CLUSTERING IDENTIFIES MICRO-ZONES. NLP SENTIMENT ANALYSIS SCANS 15,000+ BROKER REPORTS.</span>
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
                <span className="text-[#ff4444] font-bold tracking-[0.25em] uppercase text-[9px] mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#ff4444] rounded-full animate-pulse" /> NATIONAL AVG</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">BELOW TARGET</h3>
                <span className="text-[10px] text-[#ff4444]/70 font-mono tracking-wider border border-[#ff4444]/20 bg-[#ff4444]/5 px-2 py-0.5 inline-block w-fit">Q1 2026 GROSS</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
              <div className="w-full flex items-center">
                <div className="h-[2px] bg-gradient-to-r from-[#ff4444] to-[#FCD34D] flex-1 relative overflow-hidden"><motion.div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" animate={{ left: ['-20%', '120%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} /></div>
                <div className="shrink-0 px-4 bg-[#051105] border-y border-[#FCD34D]/30 py-2 mx-3 flex flex-col items-center">
                  <span className="text-[9px] text-[#FCD34D]/70 font-bold tracking-[0.2em] uppercase mb-0.5">YIELD GAP</span>
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
                <span className="text-[#00B558] font-bold tracking-[0.25em] uppercase text-[9px] mb-1">TARGET 2030</span>
                <h3 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1">RE 10% GDP</h3>
                <span className="text-[10px] text-[#00B558]/70 font-mono tracking-wider border border-[#00B558]/20 bg-[#00B558]/5 px-2 py-0.5 inline-block w-fit">VISION GOAL</span>
              </div>
            </div>
          </div>

          {/* TWO COLUMNS */}
          <div className="grid grid-cols-2 gap-8">

            {/* LEFT: Yield Projection Factors */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Zap className="w-3.5 h-3.5" /> YIELD PROJECTION MODEL (FACTOR WEIGHTS)</h3>
              
              {/* Formula */}
              <div className="bg-[#030a03] border border-[#FCD34D]/30 p-3 flex flex-col items-center gap-2 shrink-0">
                <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">YIELD FORECAST ALGORITHM</span>
                <div className="flex items-center gap-2 font-mono text-sm tracking-wider">
                  <span className="text-white font-black">Y<sub className="text-[8px] text-gray-400">2030</sub></span>
                  <span className="text-[#FCD34D]">=</span>
                  <span className="text-white">Y<sub className="text-[8px] text-gray-400">NOW</sub></span>
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
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 tracking-widest border" style={{ color: f.color, borderColor: `${f.color}30`, backgroundColor: `${f.color}10` }}>{f.weight}% WEIGHT</span>
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
              <h3 className="text-[10px] font-black text-[#FCD34D] uppercase tracking-[0.2em] border-b border-[#FCD34D]/30 pb-2 flex items-center gap-2 shrink-0"><Activity className="w-3.5 h-3.5" /> REGIONAL YIELD TRAJECTORIES (2026 → 2030)</h3>
              <div className="flex flex-col flex-1 bg-[#051105] border border-[#FCD34D]/20 overflow-hidden min-h-0">
                <div className="grid grid-cols-12 bg-[#FCD34D]/15 border-b border-[#FCD34D]/30 text-[9px] font-black text-[#FCD34D] uppercase tracking-widest px-4 py-2.5 shrink-0">
                  <div className="col-span-2">REGION</div>
                  <div className="col-span-2">NOW</div>
                  <div className="col-span-2">2030</div>
                  <div className="col-span-4">KEY DRIVERS</div>
                  <div className="col-span-2">CONF.</div>
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
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">DATA SOURCES: </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">REGA TRANSACTION REGISTRY (10-YR) · SAMA RE FINANCE REPORTS · NHC HOUSING PIPELINE · STB VISITOR PROJECTIONS · GASTAT POPULATION CENSUS · SATELLITE CONSTRUCTION DETECTION (SENTINEL-2)</span>
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