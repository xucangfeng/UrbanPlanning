# Sample Data — Urban Planning Companion

> Consolidated reference of all indicators, sample readings, 2030 targets, map markers, and calculation methodologies currently displayed in the demo.
> Data as of **Q1 2026** (simulated).

---

## 1. Diagnostics and Forecasting

**Page route:** `/diagnostics_and_forecasting`
**Full name:** Diagnostics and Forecasting

This page monitors Saudi Arabia's urban performance across traffic flow, housing demand, idle land, and asset competitiveness — all benchmarked against Vision 2030 targets.

---

### 1.1 Flow Agent

> Forecasts citizen movement patterns and changing demand for services.

#### 1.1.1 24H Commute Efficiency Index (`flw_1`)

**Description:** AI detects non-recurrent congestion anomalies using real-time computer vision feeds. The index measures how close a city's traffic flow is to optimal (free-flow) conditions, factoring in accidents, weather, and special events via dynamic penalty modifiers.

| Metric | Value |
|---|---|
| Current Index (Q1 2026) | **78** / 100 |
| 2030 Target | **92** / 100 |
| Gap | +14 pts |
| Critical Alerts | 12 |
| Warnings | 34 |
| Active Cameras | 142 |

**Calculation formula:**

```
INDEX = 100 × (V_ACTUAL / V_BASE) × C_MOD
```

- **V_ACTUAL** — Current segment average velocity via computer vision and IoT (real-time feeds).
- **V_BASE** — Expected non-peak steady-state velocity (13:00–16:00 historical average).
- **C_MOD** — Dynamic penalty factor (0.6–1.0) for accidents, weather, and non-cyclical events.

**Interpretation matrix:**

| Index Range | Status | Action |
|---|---|---|
| 90–100 | Optimal | Maintain |
| 70–89 | Moderate | Monitor |
| 50–69 | Degraded | Intervene |
| 0–49 | Critical | Emergency response |

**Map markers (12 Riyadh locations):**

| # | Location | Severity | Extra Delay | Speed Drop |
|---|---|---|---|---|
| 1 | King Fahd Rd | CRITICAL | +45m | -81.5% |
| 2 | Olaya St | HIGH | +32m | -62.5% |
| 3 | Northern Ring | CRITICAL | +50m | -77.7% |
| 4 | King Abdullah Rd | HIGH | +28m | -64.0% |
| 5 | Khureis Rd | CRITICAL | +40m | -82.5% |
| 6 | Makkah Rd | HIGH | +25m | -63.3% |
| 7 | Takhassusi St | CRITICAL | +38m | -82.2% |
| 8 | Eastern Ring | HIGH | +20m | -61.1% |
| 9 | Abu Bakr Rd | CRITICAL | +42m | -85.7% |
| 10 | Prince Turki | HIGH | +22m | -64.0% |
| 11 | King Salman Rd | HIGH | +18m | -50.0% |
| 12 | Dirab Rd | CRITICAL | +35m | -76.9% |

#### 1.1.2 City Congestion Ranking (`flw_4`)

**Description:** Real-time national traffic congestion index by city. Critical threshold: 60+.

| Metric | Value |
|---|---|
| Cities Tracked | 8 |
| Critical (≥60) | 4 |
| High | 2 |

**City rankings:**

| Rank | City | Region | Congestion Index | Avg Delay | Critical Roads | Affected Pop. | Status |
|---|---|---|---|---|---|---|---|
| 1 | Riyadh | Riyadh | 78 | +35 min | 12 | 2.3M | CRITICAL |
| 2 | Jeddah | Makkah | 72 | +28 min | 8 | 1.5M | CRITICAL |
| 3 | Makkah | Makkah | 68 | +32 min | 6 | 1.2M | HIGH |
| 4 | Dammam | Eastern | 62 | +22 min | 5 | 850K | HIGH |
| 5 | Madinah | Madinah | 58 | +18 min | 4 | 620K | WARNING |
| 6 | Khobar | Eastern | 55 | +15 min | 3 | 480K | WARNING |
| 7 | Tabuk | Tabuk | 48 | +12 min | 2 | 320K | MODERATE |
| 8 | Buraidah | Qassim | 45 | +10 min | 2 | 280K | MODERATE |

---

### 1.2 Demand Forecaster Agent

> Forecasts future needs for housing, infrastructure (roads), and amenities across regions.

#### 1.2.1 Housing Demand Forecast (`dmd_1`)

**Description:** Housing shortfall by 2030 across 6 regions. Uses NHC Sakani data + population growth models. 2030 Target: 70% homeownership. Current: 63%. Deficit = units to close gap.

| Metric | Value |
|---|---|
| By-2030 Deficit | **-153K** units |
| Current Homeownership (Q1 2026) | **63%** |
| 2030 Target | **70%** |

**Map markers (6 regions):**

| Region | Deficit | Current Ownership | Target | Population |
|---|---|---|---|---|
| Riyadh | -35,000 | 55% | 70% | 8.6M |
| Makkah | -42,000 | 52% | 70% | 9.0M |
| Eastern Province | -28,000 | 65% | 70% | 5.1M |
| Madinah | -18,000 | 60% | 70% | 2.2M |
| Asir | -15,000 | 72% | 70% | 2.3M |
| Qassim | -15,000 | 71% | 70% | 1.5M |

#### 1.2.2 Road Network Expansion (`dmd_2`)

**Description:** Based on National Transport Strategy (2021–2030) and giga-project corridor studies. Current: 76K KM. Target: 100K KM by 2030.

| Metric | Value |
|---|---|
| Current Network (Q1 2026) | **76K KM** |
| By-2030 Gap | **24K KM** |
| 2030 Target | **100K KM** |

**Map markers (6 road projects):**

| Project | Length | Status | Target Completion |
|---|---|---|---|
| Riyadh–NEOM Corridor | 4,200 KM | PLANNED | 2029 |
| Jeddah–KAEC Expressway | 1,800 KM | IN PROGRESS | 2028 |
| Eastern Province Ring Road | 3,500 KM | DESIGN | 2030 |
| Madinah–Yanbu Highway | 2,100 KM | IN PROGRESS (45%) | 2027 |
| Abha–Soudah Tourism Rd | 800 KM | DESIGN | 2028 |
| Qassim Agricultural Route | 1,600 KM | PLANNED | 2029 |

---

### 1.3 Idle Land Agent

> Identifies and maps underdeveloped or vacant parcels for redevelopment potential.

#### 1.3.1 White Land Activation Rate (`idl_1`)

**Description:** AI scans MOMRAH White Land Registry + satellite imagery to pinpoint idle parcels. Explains why each plot is undeveloped and recommends use. Applies White Land Tax (2.5% annual levy).

| Metric | Value |
|---|---|
| Current Activation Rate (Q1 2026) | **38%** |
| 2030 Target | **65%** |
| AI-Identified Spots | **12** |

**Map markers (12 spots across 6 regions):**

| # | Location | Area | Years Idle | Severity |
|---|---|---|---|---|
| 1 | Al Yasmin Block 4A, Riyadh | 14,500 SQM | 4 yrs | CRITICAL |
| 2 | Al Malqa Apex, Riyadh | 32,000 SQM | 6 yrs | CRITICAL |
| 3 | Khashm Al Aan South, Riyadh | 22,000 SQM | 3 yrs | HIGH |
| 4 | Al Shara'i Plateau, Makkah | 48,000 SQM | 5 yrs | CRITICAL |
| 5 | North Jeddah Corniche Strip | 18,000 SQM | 4 yrs | HIGH |
| 6 | Dhahran Valley West, Eastern | 28,000 SQM | 3 yrs | HIGH |
| 7 | Jubail 2 Southern Buffer, Eastern | 35,000 SQM | 5 yrs | HIGH |
| 8 | KEC Phase 2 North, Madinah | 20,000 SQM | 4 yrs | HIGH |
| 9 | Al Manar Commercial, Madinah | 12,000 SQM | 3 yrs | HIGH |
| 10 | Soudah Gateway Parcel, Asir | 15,000 SQM | 2 yrs | HIGH |
| 11 | Buraidah North University Belt, Qassim | 25,000 SQM | 4 yrs | HIGH |
| 12 | Al Rass Agri-Tech Hub, Qassim | 18,000 SQM | 3 yrs | HIGH |

#### 1.3.2 Urban Land Utilization Index (`idl_2`)

**Description:** AI analyzes satellite footprint, infrastructure density, and zoning to identify underutilized zones. Scores impact per zone and recommends development action.

| Metric | Value |
|---|---|
| Current Index (Q1 2026) | **58** / 100 |
| 2030 Target | **80** / 100 |
| Zones Flagged | **13** |

**Map markers (13 zones across 6 regions):**

| # | Zone | Region | Area | Status |
|---|---|---|---|---|
| 1 | KAFD North Buffer Zone | Riyadh | 12 KM² | CRITICAL |
| 2 | Diriyah Gate Western Corridor | Riyadh | 8 KM² | CRITICAL |
| 3 | Eastern Industrial Fringe | Riyadh | 15 KM² | HIGH |
| 4 | Al Awali Heights | Makkah | 6 KM² | CRITICAL |
| 5 | Jeddah Al Hamdaniyah East | Makkah | 10 KM² | HIGH |
| 6 | Ras Al Khair Port Hinterland | Eastern | 20 KM² | HIGH |
| 7 | Al Ahsa Southern Oasis Edge | Eastern | 8 KM² | HIGH |
| 8 | Haramain Station District | Madinah | 5 KM² | HIGH |
| 9 | Yanbu Al Sinaiyah Worker Zone | Madinah | 7 KM² | HIGH |
| 10 | Abha City Center Infill | Asir | 3 KM² | HIGH |
| 11 | Khamis Mushait Eastern Expansion | Asir | 9 KM² | HIGH |
| 12 | Buraidah–Unaizah Corridor | Qassim | 14 KM² | HIGH |
| 13 | Al Rass Heritage Quarter | Qassim | 2 KM² | HIGH |

---

### 1.4 Asset Evaluation Agent

> Analyzes site conditions to assess competitiveness and potential value of the area.

#### 1.4.1 Infrastructure Competitiveness Index (`ast_1`)

**Description:** Scores zones 0–100 across transit, healthcare, education, utilities, green space, and digital infrastructure. Benchmarked against 50 global peer cities via MOMRA + GASTAT data.

| Metric | Value |
|---|---|
| National Average (Q1 2026) | **54** / 100 |
| 2030 Target | **75** / 100 (Top 40 Global) |
| Gap | +21 pts |
| Zones Flagged | **11** |

**Calculation — 6 sub-dimensions (weighted):**

| Sub-Dimension | Weight | National Score | Target | Source |
|---|---|---|---|---|
| 🚌 Transit Access | 20% | 38 | 80 | Population within 800m of metro/BRT/bus |
| ⚡ Utility Reliability | 20% | 72 | 95 | SEC grid uptime (SAIFI/SAIDI) + water supply |
| 🏥 Healthcare Proximity | 15% | 52 | 80 | Hospital beds per 1,000 + avg distance to primary care |
| 🎓 Education Coverage | 15% | 58 | 85 | School seats vs school-age population ratio |
| 🌿 Green Space | 15% | 35 | 70 | Public parks SQM per capita vs WHO standard (9 SQM/person) |
| 📡 Digital Connectivity | 15% | 66 | 90 | FTTH penetration + 5G coverage percentage |

**Data sources:** MOMRA Municipal DB · GASTAT Infrastructure Census · SEC Reliability Indices (SAIFI/SAIDI) · MOH Facility Registry · MOE School Density · RCRC Green Space GIS · CITC Digital Coverage.

**Map markers (11 zones, regional scores):**

| # | Zone | Region | Score | Severity |
|---|---|---|---|---|
| 1 | North Riyadh Metro Corridor | Riyadh | 42/100 | CRITICAL |
| 2 | South Riyadh Industrial Belt | Riyadh | 51/100 | HIGH |
| 3 | East Jeddah Residential Sprawl | Makkah | 38/100 | CRITICAL |
| 4 | Taif Mountain Gateway | Makkah | 48/100 | HIGH |
| 5 | Jubail Residential Sector | Eastern | 56/100 | HIGH |
| 6 | Al Khobar Waterfront District | Eastern | 63/100 | HIGH |
| 7 | Knowledge Economic City | Madinah | 35/100 | CRITICAL |
| 8 | Yanbu Heritage Coast | Madinah | 47/100 | HIGH |
| 9 | Abha City Center | Asir | 52/100 | HIGH |
| 10 | Buraidah Central District | Qassim | 49/100 | HIGH |
| 11 | Unaizah Heritage Core | Qassim | 44/100 | HIGH |

**Regional aggregated scores (from detail modal):**

| Region | Current | 2030 Target | Gap |
|---|---|---|---|
| Riyadh | 62 | 78 | +16 |
| Makkah | 48 | 72 | +24 |
| Eastern | 59 | 76 | +17 |
| Madinah | 45 | 70 | +25 |
| Asir | 52 | 71 | +19 |
| Qassim | 47 | 68 | +21 |

#### 1.4.2 Real Estate Asset Yield Forecast (`ast_2`)

**Description:** ML model trained on 10-year REGA transaction data + satellite construction activity forecasts gross rental/investment yield per zone. Factors: demand (population + HQ relocations + tourism), supply (NHC pipeline), and giga-project proximity. Vision 2030 macro goal: Real estate sector contributes 10% of GDP (currently ~5.8%).

| Metric | Value |
|---|---|
| Current National Avg Yield (Q1 2026) | **5.2%** |
| 2030 Target Yield | **7.5%** |
| Gap | +2.3 percentage points |
| Zones Tracked | **9** |
| Vision 2030 Macro Goal | RE contributes 10% of GDP |

**Relationship between 7.5% yield target and 10% GDP goal:** The 7.5% yield target is the investment attractiveness metric needed to attract sufficient domestic and foreign capital into Saudi real estate. Higher yields → more private investment → sector growth → achieving the macro 10% GDP contribution target.

**Calculation formula:**

```
Y_2030 = Y_NOW × D_MUL × (1 + P_GIGA) / S_PRESS × R_ADJ
```

**5 yield factors (weighted):**

| Factor | Weight | Color | Description |
|---|---|---|---|
| D_MUL (Demand Multiplier) | 30% | #FCD34D | Population growth + corporate HQ relocations + tourism influx |
| P_GIGA (Giga-Project Proximity) | 25% | #00B558 | Distance and phase-completion of nearby giga-projects (NEOM, KAFD, etc.) |
| S_PRESS (Supply Pressure) | 20% | #ff4444 | NHC housing pipeline + private developer supply compressing yields |
| R_ADJ (Risk Adjustment) | 15% | #f97316 | Macro risk, oil price correlation, regulatory stability |
| Y_NOW (Base Yield) | 10% | #3b82f6 | Current gross yield from REGA transaction registry |

**Data sources:** REGA Transaction Registry (10-yr) · SAMA RE Finance Reports · NHC Housing Pipeline · STB Visitor Projections · GASTAT Population Census · Satellite Construction Detection (Sentinel-2).

**Map markers (9 zones with yield trajectories):**

| # | Zone | Region | Current Yield | 2030 Forecast | Confidence |
|---|---|---|---|---|---|
| 1 | KAFD–Diriyah Gate Corridor | Riyadh | 6.1% | 9.4% | 82% (High) |
| 2 | East Riyadh Logistics Hub | Riyadh | 4.8% | 7.2% | 71% (Mod-High) |
| 3 | Jeddah Central Waterfront | Makkah | 5.4% | 8.8% | 76% (High) |
| 4 | Makkah Southern Residential | Makkah | 4.5% | 6.8% | 68% (Moderate) |
| 5 | Dhahran Techno Valley | Eastern | 5.8% | 8.5% | 79% (High) |
| 6 | Dammam Al Shatie District | Eastern | 5.2% | 7.0% | 65% (Moderate) |
| 7 | Haramain Station District | Madinah | 4.2% | 7.1% | 73% (Mod-High) |
| 8 | Soudah Peaks Tourism Zone | Asir | 3.2% | 6.5% | 62% (Moderate) |
| 9 | Buraidah Agri-Tech District | Qassim | 3.5% | 5.8% | 58% (Moderate) |

**Regional yield trajectories (from detail modal):**

| Region | Current | 2030 Projected | Key Drivers | Confidence |
|---|---|---|---|---|
| Riyadh | 5.8% | 8.2% | KAFD, Diriyah Gate, corporate HQ | 82% |
| Makkah | 4.8% | 7.5% | Jeddah Central, Umrah expansion | 76% |
| Eastern | 5.4% | 7.8% | Aramco R&D, Techno Valley | 79% |
| Madinah | 4.2% | 7.1% | Haramain station TOD, Umrah growth | 73% |
| Asir | 3.2% | 6.5% | Soudah mega-project, domestic tourism | 62% |
| Qassim | 3.5% | 5.8% | Agri-tech sector, NEOM Food Tech | 58% |

### 1.5 Citizen Insight Agent

> Chat based assistant answering questions about mobility patterns and citizen behaviors.

---

## 2. Land Use Optimization and Zoning

**Page route:** `/optimization`
**Full name:** Land Use Optimization and Zoning

This page optimizes land allocation, parking and accessibility, park coverage, project prioritization, and urban intervention potential — supporting balanced, livable urban development.

---

### 2.1 Zoning Mix Advisor Agent

> Optimizes land-use balance between residential, commercial, and services to support policy goals.

#### 2.1.1 Land Use Balance Index (`zon_1`)

**Description:** Comprehensive score measuring deviation from Vision 2030 land allocation targets. AI analyzes zoning data to identify imbalances and suggests rezoning recommendations.

| Metric | Value |
|---|---|
| Balance Score | **73** / 100 |
| Trend | **+5** vs 2025 |

**Target vs Actual land-use allocation:**

| Category | Target | Actual | Gap |
|---|---|---|---|
| Residential | 35% | 28% | -7% |
| Commercial | 25% | 34% | +9% (surplus) |
| Service | 20% | 17% | -3% |
| Green | 20% | 21% | +1% |

**AI Recommendation:** Convert Al Olaya commercial zones to mixed-use residential. Projected score improvement: +12 points.

---

### 2.2 Accessibility and Parking Optimizer Agent

> Suggests optimal road, transport, and parking planning to improve accessibility.

#### 2.2.1 Urban Accessibility Index (`prk_1`)

**Description:** Comprehensive index measuring urban transport efficiency and accessibility. AI analyzes parking turnover, public transit coverage, last-mile connectivity, and EV infrastructure to support Vision 2030 transportation goals.

| Metric | Value |
|---|---|
| Efficiency Score | **72** / 100 |
| Trend | **+3** vs 2025 |

**Sub-dimensions:**

| Dimension | Weight | Current Score | Target |
|---|---|---|---|
| Parking Turnover | 30% | 65 | 100 |
| Public Transit | 25% | 85 | 100 |
| Last-Mile Connectivity | 25% | 73 | 100 |
| EV Infrastructure | 20% | 64 | 100 |

#### 2.2.2 EV Charging Density (`prk_2`)

**Description:** Predicts EV adoption rates to suggest optimal locations for charging hubs.

| Metric | Value |
|---|---|
| Deficit Zones | **12** |
| Planned Stations | **45** |

#### 2.2.3 Last-Mile Connectivity (`prk_3`)

**Description:** Calculates the efficiency of micro-mobility links to major transit stations.

| Metric | Value |
|---|---|
| Gaps | **6** |
| Efficient Links | **22** |

---

### 2.3 Parks Selector Agent

> Ensures access to green spaces and parks, in line with goals and accessibility radius.

#### 2.3.1 Green Space Coverage Index (`grn_1`)

**Description:** Comprehensive index measuring green space service capacity and accessibility. AI identifies optimal park locations to support Saudi Green Initiative and Vision 2030 sustainability targets.

| Metric | Value |
|---|---|
| Coverage Score | **44** / 100 |
| Trend | **+5** vs 2025 |
| Status | CRITICAL SHORTAGE |

**Sub-dimensions:**

| Dimension | Weight | Current Score | Actual Value |
|---|---|---|---|
| Per Capita Area | 40% | 11.3 | 1.7 m² (WHO standard: 9 m²) |
| Accessibility | 30% | 57.8 | 52% population coverage |
| Heat Relief | 20% | 70 | 2.1°C average cooling effect |
| Irrigation Efficiency | 10% | 81.3 | 65% smart irrigation |

| Metric | Value |
|---|---|
| New Parks Recommended | 10 |
| Total Area | 60,000 m² |
| Service Population | 60,000 people |

#### 2.3.2 Urban Heat Island Reduction (`grn_2`)

**Description:** Predicts temperature drops resulting from proposed canopy cover interventions.

| Metric | Value |
|---|---|
| Severe Spots | **8** |
| Areas Cooled | **52** |

#### 2.3.3 Irrigation Efficiency (`grn_3`)

**Description:** Uses soil sensors and weather AI to minimize water use in public parks.

| Metric | Value |
|---|---|
| Stressed Parks | **5** |
| Optimal Efficiency | **84%** |

---

### 2.4 Priority Classifier Agent

> Assesses and classifies land, highlighting urgent priority zones for action.

#### 2.4.1 Project Priority Index (`pri_1`)

**Description:** AI-powered priority ranking system for urban development projects. Evaluates bottleneck impact, time urgency, ROI, and synergy to optimize resource allocation and ensure Vision 2030 target achievement.

| Metric | Value |
|---|---|
| P0 (Urgent) Projects | **1** |
| P1 (High) Projects | **2** |
| Backlog | **3** |
| Auto-Approval Rate | **75%** |

**Project priority rankings:**

| Priority | Project | Score | Status | Bottleneck | Urgency | ROI | Synergy | Delay | Action |
|---|---|---|---|---|---|---|---|---|---|
| P0 | New Murabba | 85 | DELAYED | 92 | 60 | 100 | 87 | 180 days | +25% WORKFORCE |
| P1 | Riyadh Metro PH3 | 78 | DELAYED | 85 | 55 | 90 | 75 | 120 days | ENGINEERING REVIEW |
| P1 | NEOM – The Line | 72 | AHEAD | 45 | 70 | 95 | 82 | On Track | PROCEED PHASE 2 |
| P2 | Diriyah Gate PH2 | 68 | AHEAD | 40 | 50 | 88 | 92 | On Track | ACCELERATE TOURISM |
| P2 | Red Sea Global PH2 | 65 | ON TRACK | 35 | 45 | 85 | 90 | On Track | SUSTAIN MOMENTUM |
| P2 | Qiddiya Entertainment | 62 | ON TRACK | 30 | 40 | 90 | 85 | On Track | ENTERTAINMENT FOCUS |

#### 2.4.2 Zoning Approval Speed (`pri_2`)

**Description:** Automates routine permit approvals while flagging complex cases for human review.

| Metric | Value |
|---|---|
| Flagged (Manual Review) | **2** |
| Auto-Approved | **11K** |

#### 2.4.3 Infrastructure Urgency (`pri_3`)

**Description:** Ranks projects by impact on 2030 targets to optimize budget allocation.

| Metric | Value |
|---|---|
| Critical Projects | **4** |
| Aligned Projects | **18** |

---

### 2.5 Intervention Guide Agent

> Suggests urban interventions or upgrades to improve land use, accessibility, and service.

#### 2.5.1 Urban Development Potential (`mob_1`)

**Description:** Comprehensive index measuring urban upgrade potential based on land use efficiency, accessibility, service coverage, and infrastructure. AI identifies priority intervention areas to support Vision 2030 population growth targets.

| Metric | Value |
|---|---|
| Potential Score | **84** / 100 |
| Status | PRIORITY UPGRADE |
| Demand Intensity | 1.56× |
| Population Growth Target | 150K → 250K |

**Sub-dimensions:**

| Dimension | Weight | Current | Target | Gap |
|---|---|---|---|---|
| Efficiency | 30% | 85 | 100 | 15 |
| Accessibility | 25% | 73 | 100 | 27 |
| Service Coverage | 25% | 75 | 100 | 25 |
| Infrastructure | 20% | 98 | 100 | 2 |

**Intervention priorities:**

| Priority | Action | Investment | Impact | ROI |
|---|---|---|---|---|
| P0 | Traffic System Upgrade | 500M SAR | -8 min commute | HIGH |
| P1 | Service Facilities | 300M SAR | +12% coverage | MEDIUM |
| P2 | Land Use Optimization | 100M SAR | +15% efficiency | MEDIUM |

---

## 3. Impact Simulation and Feasibility Assessment

**Page route:** `/simulation`
**Full name:** Impact Simulation and Feasibility Assessment

This page runs "what-if" simulations for downtown Riyadh, testing traffic, mobility, planning trade-offs, financial viability, and environmental resilience under various parameter scenarios.

---

### 3.1 Urban Test Agent

> Runs simulations to test alternative zoning, road redesigns, or infrastructure proposals.

#### Indicators

| ID | Indicator | Current | Target | Unit | Description |
|---|---|---|---|---|---|
| UT-1 | Avg. Travel Speed | 18 | 35 | km/h | Average downtown travel speed during morning peak hours. |
| UT-2 | Peak Hour Delay | 45 | 15 | min ↓ | Average additional delay per trip during morning rush. Lower is better. |
| UT-3 | Vehicle Throughput | 12,400 | 18,000 | veh/hr | Downtown corridor capacity during peak hours. |
| UT-4 | CO₂ Reduction | 0 | 40 | % | Emission reduction from combined traffic optimization. |

#### Simulation Settings

| Setting | Slider Label | Range | Step | Default | Unit | Description |
|---|---|---|---|---|---|---|
| `additionalLanes` | Additional Lanes (Major Corridors) | 0 – 4 | 1 | 0 | lanes | Number of extra lanes added to 6 major downtown corridors (King Fahd Rd, Olaya St, King Abdullah Rd, Northern Ring, Makkah Rd, Eastern Ring). Methods: remove on-street parking (+1), road widening (+2), contraflow peak lanes (+1). Each lane adds ~800–1,000 veh/hr capacity per corridor. |
| `metroShift` | Metro Ridership Shift | 0 – 40 | 2 | 0 | % | Percentage of current car commuters shifting to Riyadh Metro Lines 1–6. Each 10% shift removes ~12,400 vehicles from downtown roads during peak hours. |
| `signalOptimization` | Signal Optimization Coverage | 30 – 100 | 5 | 30 | % | Percentage of downtown intersections upgraded with Adaptive Traffic Signal Control (ATSC). Baseline: 30% of 180 intersections already have SCATS/SCOOT systems. Slider adjusts coverage up to 100%. |
| `congestionPricing` | Proposed Peak-Hour Toll | 0 – 30 | 1 | 0 | SAR | New congestion charge for vehicles entering the downtown core zone during peak hours (7–9 AM, 4–7 PM). Currently: 0 SAR (no toll exists). Reference: London ~70 SAR, Stockholm ~15 SAR, Singapore ~14 SAR. |

#### Computation Formulas

```
gain = (lanes / 4) × 0.30  +  (metroShift / 40) × 0.40
     + ((signalOpt − 30) / 70) × 0.25  +  (pricing / 30) × 0.15

Avg. Travel Speed   = min(42,  18 × (1 + gain))                     km/h
Peak Hour Delay     = max(8,   45 / (1 + gain))                     min
Vehicle Throughput  = min(22000,  12400 × (1 + lane_part + signal_part + metro_part))   veh/hr
CO₂ Reduction       = min(45,  metro_part + pricing_part + signal_part)                 %
```

---

### 3.2 Mobility Impact Advisor Agent (Coming soon)

> Analyzes simulation results to recommend actions that improve accessibility and land-use.

#### Indicators

| ID | Indicator | Current | Target | Unit | Description |
|---|---|---|---|---|---|
| MI-1 | Pedestrian Mode Share | 10.2 | 18 | % | Suggests shade and cooling interventions to increase walking in desert climates. |
| MI-2 | Active Transit Score | 74 | 90 | Score | Monitors bike-lane safety and usage to optimize future cycling infrastructure. |
| MI-3 | Public Transit Accessibility | 78 | 95 | % | Ensures 80% of citizens live within 800m of a transport hub. |

#### Simulation Settings

| Setting | Slider Label | Range | Step | Default | Unit | Description |
|---|---|---|---|---|---|---|
| `shadeInfra` | Shade Infrastructure | 0.5 – 3.0 | 0.1 | 1.0 | × | Multiplier for shade and cooling interventions to increase walking in desert climates. Higher values represent increased shade canopy, misting systems, and covered walkways across pedestrian corridors. |
| `transitExpansion` | Transit Network Expansion | 0.5 – 3.0 | 0.1 | 1.0 | × | Multiplier for public transit network expansion scale. Higher values represent more metro extensions, bus routes, and transit hub coverage to bring more citizens within 800m of a transport stop. |
| `cyclingInvestment` | Cycling Investment | 0.5 – 3.0 | 0.1 | 1.0 | × | Multiplier for cycling infrastructure investment. Higher values represent more protected bike lanes, bike-sharing stations, and safety improvements to promote active transit. |

#### Computation Formulas

```
Pedestrian Mode Share       = 10.2 × shadeInfra                             %
Active Transit Score        = 74 × (cyclingInvestment × 0.4 + 0.6)          Score
Public Transit Accessibility = 78 × (transitExpansion × 0.4 + 0.6)          %
```

---

### 3.3 Scenario Optimizer Agent (Coming soon)

> Compares alternatives and identifies optimal trade-offs between cost and sustainability.

#### Indicators

| ID | Indicator | Current | Target | Unit | Description |
|---|---|---|---|---|---|
| SO-1 | Sustainability Alignment | 84 | 95 | % | Ranks planning scenarios based on their carbon footprint and water efficiency. |
| SO-2 | Cost-Benefit Ratio | 3.2 | 4.5 | Ratio | Analyzes long-term ROI of infrastructure vs. short-term construction costs. |
| SO-3 | Social Equity Score | 88 | 100 | Score | Ensures urban interventions are distributed fairly across all demographic groups. |

#### Simulation Settings

| Setting | Slider Label | Range | Step | Default | Unit | Description |
|---|---|---|---|---|---|---|
| `sustainabilityWeight` | Sustainability Weight | 0.5 – 3.0 | 0.1 | 1.0 | × | Multiplier weighting sustainability criteria (carbon footprint, water efficiency) in the scenario ranking model. Higher values prioritise greener outcomes over pure cost efficiency. |
| `investmentScale` | Investment Scale | 0.5 – 3.0 | 0.1 | 1.0 | × | Multiplier for overall infrastructure investment budget scale. Higher values increase CAPEX available for projects, improving cost-benefit ratios through economies of scale. |
| `equityPriority` | Equity Priority | 0.5 – 3.0 | 0.1 | 1.0 | × | Multiplier weighting equitable distribution of services across demographic groups. Higher values force the optimizer to favour socially balanced outcomes. |

#### Computation Formulas

```
Sustainability Alignment = min(100,  84 × (sustainabilityWeight × 0.3 + 0.7))   %
Cost-Benefit Ratio       = 3.2 × (investmentScale × 0.4 + 0.6)                  Ratio
Social Equity Score      = min(100,  88 × (equityPriority × 0.3 + 0.7))         Score
```

---

### 3.4 Economic and Financial Analyzer Agent

> Models feasibility, funding needs, and economic return (e.g., self-sustaining neighborhoods).

#### Indicators

| ID | Indicator | Current | Target | Unit | Description |
|---|---|---|---|---|---|
| EF-1 | Project IRR | 8 | 18 | % | Internal Rate of Return for the neighbourhood development. Accounts for construction, land, infrastructure, and mixed-use revenue. |
| EF-2 | Fiscal Self-Sufficiency | 25 | 75 | % | Percentage of neighbourhood costs covered by locally-generated revenue (property fees, rents, parking). |
| EF-3 | Funding Gap | 12 | 3 | SAR B ↓ | Unfunded infrastructure deficit. Reduced by PPP, land value capture, and developer contributions. Lower is better. |
| EF-4 | Job-Housing Balance | 0.6 | 1.2 | Ratio | Ratio of jobs to housing units. 1.0 = equilibrium. Mixed-use and anchor tenants drive this up. |
| EF-5 | Private Investment Leverage | 1.8 | 4.5 | × | SAR private capital per SAR public. Higher = more attractive market conditions. |

#### Simulation Settings

| Setting | Slider Label | Range | Step | Default | Unit | Description |
|---|---|---|---|---|---|---|
| `mixedUseRatio` | Mixed-Use Development Ratio | 15 – 60 | 5 | 15 | % | Percentage of new development zones designated as mixed-use (retail + residential + office). Higher mixed-use creates walkable, self-sustaining neighbourhoods with diverse local revenue streams. Riyadh baseline ~15% reflects legacy single-use zoning. |
| `pppShare` | PPP Financing Share | 10 – 70 | 5 | 20 | % | Share of total infrastructure cost funded through Public-Private Partnerships. PPPs transfer construction and operational risk to private developers in exchange for revenue-sharing concessions (e.g., toll roads, district cooling). Reduces government fiscal burden and funding gap. |
| `farBonus` | FAR Bonus (Developer Incentive) | 0 – 30 | 5 | 0 | % | Floor Area Ratio bonus granted to developers who include public amenities (affordable units, parks, schools). Developers get extra buildable area; the city gets infrastructure contributions and density revenue without public spending. |
| `landValueCapture` | Land Value Capture Rate | 0 – 40 | 5 | 5 | % | Percentage of infrastructure-driven land value uplift recovered by the municipality through betterment levies, special assessment districts, or tax increment financing. When a metro station raises nearby land values 30–80%, LVC channels part of that windfall back into further development. |
| `anchorIncentive` | Anchor Tenant Incentive | 0 – 50 | 5 | 0 | % | Tax or rent concessions offered to attract major employers (corporate HQs, universities, hospitals) to anchor a neighbourhood. Creates employment gravity, drives foot traffic for surrounding retail, and attracts follow-on private investment. |

#### Computation Formulas

```
# Normalize each gain to 0→1
mixedGain  = (mixedUseRatio − 15) / 45
pppGain    = (pppShare − 10) / 60
farGain    = farBonus / 30
lvcGain    = landValueCapture / 40
anchorGain = anchorIncentive / 50

Project IRR             = 8 + mixed×4.5 + ppp×2.5 + far×2.0 + lvc×0.5 + anchor×0.5     %
Fiscal Self-Sufficiency = min(85,  25 + mixed×25 + lvc×15 + far×8 + anchor×7)            %
Funding Gap             = max(1.5, 12 − ppp×4 − lvc×2.5 − far×1.5 − mixed×0.8)          SAR B
Job-Housing Balance     = min(1.4, 0.6 + mixed×0.3 + anchor×0.25 + far×0.1)              Ratio
Private Inv. Leverage   = min(5.5, 1.8 + ppp×1.2 + anchor×0.8 + mixed×0.4 + far×0.3)    ×
```

#### Funding Sources Breakdown (Bar Chart)

The agent also renders a stacked horizontal bar chart showing funding composition across 4 sources:

| Source | Color | Description |
|---|---|---|
| Government | #3b82f6 | Direct public budget allocation |
| PPP | #10b981 | Private sector via PPP concessions |
| LVC | #FCD34D | Municipal land value capture revenue |
| FAR/Dev | #f97316 | Developer contributions via FAR bonuses |

---

### 3.5 Environmental and Resilience Evaluator

> Assesses sustainability, and resilience to climate and flood risks.

#### Indicators

| ID | Indicator | Current | Target | Unit | Description |
|---|---|---|---|---|---|
| ER-1 | Flood Risk Index | 42 | 85 | Score | Composite score measuring flood resilience across wadi channels, basins, and 340km drain network. |
| ER-2 | Heat Island Reduction | 0 | 3.5 | °C | Reduction in urban heat island effect from vegetation, reflective surfaces, and shade. |
| ER-3 | Climate Resilience Score | 35 | 90 | % | Building stock meeting flood-proofing, heat-resistance, and water-efficiency standards. SBC baseline: 35%. |

#### Simulation Settings

| Setting | Slider Label | Range | Step | Default | Unit | Description |
|---|---|---|---|---|---|---|
| `drainageExpansion` | Drainage Infrastructure Expansion | 0 – 50 | 5 | 0 | km | Kilometres of new storm drain capacity added to Riyadh's existing 340km network. Targets wadi overflow zones (Hanifah, Al Aqiq) and low-lying urban basins. Each 10km reduces flood zone radius by ~12% in affected catchments. |
| `retentionBasins` | Retention Basins & Flood Barriers | 0 – 8 | 1 | 0 | facilities | Number of new retention basins and flood barrier facilities constructed at key flood-prone nodes (wadi confluences, highway underpasses, district outfall points). Each facility stores ~50,000m³ of stormwater runoff during peak events. |
| `greenCover` | Urban Green Cover | 8 – 30 | 1 | 8 | % | Percentage of city area under vegetation canopy (parks, street trees, green corridors). Baseline 8% is among the lowest globally for a major city. Each 1% increase reduces local surface temperature by ~0.15°C and improves stormwater absorption. |
| `coolRoof` | Cool Roof & Reflective Surface Coverage | 5 – 60 | 5 | 5 | % | Percentage of rooftops and paved surfaces treated with high-albedo (reflective) coatings or cool-roof materials. Reflects solar radiation instead of absorbing it, reducing building cooling loads by 10–20% and ambient air temperature by up to 2°C in dense districts. |
| `buildingCode` | Climate-Resilient Building Code | 35 – 100 | 5 | 35 | % | Adoption rate of updated Saudi Building Code (SBC 601/602) standards for flood-proofing, heat resistance, and water efficiency in new construction. Baseline ~35% reflects current MOMRA enforcement. Higher adoption reduces structural flood damage and cooling energy demand. |

#### Computation Formulas

```
drainGain = drainageExpansion / 50
basinGain = retentionBasins / 8
greenGain = (greenCover − 8) / 22
codeGain  = (buildingCode − 35) / 65
coolGain  = (coolRoof − 5) / 55

Flood Risk Index       = min(95,   42 + drainGain×28 + basinGain×18 + codeGain×7)                Score
Heat Island Reduction  = min(5.5,  greenGain×2.5 + coolGain×1.8 + codeGain×0.6)                  °C
Climate Resilience Score = min(95, 35 + codeGain×30 + drainGain×12 + basinGain×8 + greenGain×5 + coolGain×5)  %
```

#### Flood Spot Simulation

Each flood spot's radius and risk score react to parameter changes:

```
drainR = 1 − (drainageExpansion / 50) × 0.35
basinR = 1 − (retentionBasins / 8) × 0.40
codeR  = 1 − ((buildingCode − 35) / 65) × 0.15

simRadius = max(50, baseRadius × drainR × basinR × codeR)
simRisk   = max(8,  risk × drainR × basinR × codeR)
```

#### Heat Island Simulation

Heat island intensity per point reacts to green cover, cool roofs, and building codes:

```
greenR = 1 − ((greenCover − 8) / 22) × 0.35
coolR  = 1 − ((coolRoof − 5) / 55) × 0.30
codeR  = 1 − ((buildingCode − 35) / 65) × 0.15

simWeight = max(0.02,  baseWeight × (isUrban ? greenR × coolR : 1) × codeR)
```

#### Flood Risk Spot Markers (7 locations in Riyadh)

| Location | Base Drainage Radius | Risk Score |
|---|---|---|
| Wadi Hanifah — Al Diriyah | 850m | 92 |
| Wadi Hanifah — Al Aqiq | 750m | 88 |
| King Fahd Rd Underpass | 400m | 85 |
| South Basin — Exit 15 | 1,200m | 78 |
| Olaya Depression | 350m | 72 |
| Northern Ring Catchment | 600m | 68 |
| Eastern District Basin | 900m | 65 |

---

## 4. Monitoring and Improvement

**Page route:** `/act4`
**Full name:** Monitoring and Improvement

This page provides continuous monitoring of urban change, asset utilization, and development pipeline progress — using satellite/LiDAR AI to validate ground truth.

---

### 4.1 Urban Monitoring Module (Change Tracker Agent)

> Tracks spatial and development changes using geospatial and data to update the digital twin.

**Spatial Truth KPIs:**

| Metric | Value |
|---|---|
| Masterplan Approved Allocation | **500 KM²** |
| Footprint Drift (Deviation) | **+2.8%** |
| Urban Sprawl Discrepancy | **14.2 KM²** (LiDAR truth vs Amanah reports) |
| Financial Exposure | **2.4B SAR** (est. infrastructure cost if developed) |

**Urban sprawl trend data (Jan–Dec):**

Reported (Amanah): 490 → 500 KM²
Detected (LiDAR): 490 → 514.2 KM²

**Land use transformation (2017–2026):**

| Year | Residential | Commercial | Green | Industrial | Total (KM²) |
|---|---|---|---|---|---|
| 2017 | 438 | 89 | 9.0 | 125 | 661 |
| 2020 | 505 | 108 | 11.2 | 148 | 772 |
| 2023 | 595 | 134 | 13.5 | 175 | 918 |
| 2026 (proj.) | 705 | 172 | 15.0 | 218 | 1,110 |

**Green space by region:**

| Region | Current (KM²) | Target | Growth | Status |
|---|---|---|---|---|
| Riyadh | 12.8 | 15.0 | +0.6 | On Track |
| Jeddah | 11.5 | 15.0 | +0.5 | Attention |
| Mecca | 14.2 | 15.0 | +0.8 | Exceeding |
| Medina | 13.8 | 15.0 | +0.7 | On Track |
| Dammam | 10.8 | 15.0 | +0.4 | Critical |
| Tabuk | 15.5 | 15.0 | +1.2 | Exceeding |

---

### 4.2 Condition Watch Agent

> Monitors utilization and physical conditions of parking and infrastructure assets.

**CAPEX Utilization — Projects by idle rate:**

| Project | Code | Idle Rate | Budget (B SAR) | Spent (B SAR) | Recommendation |
|---|---|---|---|---|---|
| Riyadh Metro Extension PH2 | RME-PH2 | 78.5% | 4.2 | 1.8 | DEFER |
| Jeddah Waterfront Dev PH3 | JWD-PH3 | 68.4% | 3.8 | 2.1 | REVIEW |
| Dammam Industrial Zone | DIZ-01 | 52.3% | 2.5 | 1.9 | PROCEED |
| Mecca Transport Hub | MTH-02 | 41.8% | 5.1 | 4.2 | PROCEED |
| Medina Smart City PH1 | MSC-PH1 | 28.6% | 1.8 | 1.5 | PROCEED |
| Tabuk Renewable Energy | TRE-01 | 15.2% | 1.2 | 0.9 | PROCEED |

**Population pressure trend (quarterly):**

| Quarter | Influx Index | Capacity |
|---|---|---|
| 24 Q1 | 75 | 100 |
| 25 Q1 | 86 | 100 |
| 26 Q1 | 97 | 100 |
| 27 Q1 (proj.) | 108 | 100 ⚠️ OVER CAPACITY |

---

### 4.3 Development Pipeline (Change Tracker Agent)

> Monitors giga-project progress using satellite, LiDAR and AI detection.

**Progress calculation logic:**
```
Planned Progress = (Current Year - Start Year + 1) / (Deadline Year - Start Year + 1) × 100
AHEAD:   Actual > Planned + 5%
DELAYED: Actual < Planned - 5%
ON TRACK: Within ±5% of planned
```

**Projects tracked:**

| Project | Type | Location | Total Area | Progress | Budget (B SAR) | Deadline | Status |
|---|---|---|---|---|---|---|---|
| NEOM – The Line | Mega City | Tabuk | 170 KM | 72.4% | 500 | 2030 | AHEAD (+12.4%) |
| Diriyah Gate PH2 | Heritage | Riyadh | 22 KM² | 86.4% | 45 | 2028 | AHEAD (+15%) |
| New Murabba | Downtown | Riyadh | 19 KM² | 26.3% | 104 | 2030 | DELAYED (-33.7%) |
| Riyadh Metro PH3 | Infrastructure | Riyadh | 45 KM | 33.3% | 28 | 2029 | DELAYED (-29.2%) |
| Red Sea Global PH2 | Tourism | Red Sea | 35 KM² | 74.3% | 32 | 2028 | ON TRACK (+2.9%) |
| Qiddiya Entertainment | Entertainment | Riyadh | 366 KM² | 76.5% | 75 | 2028 | ON TRACK (+1.5%) |

---

## 5. Panorama (Home Page)

**Page route:** `/` (index)
**Full name:** Panorama

Overview dashboard providing at-a-glance KPIs across all four functional areas, with a Saudi Arabia macro map view.

### Summary KPIs shown on Panorama

| Section | KPI Card | Metric | Unit | Description |
|---|---|---|---|---|
| Diagnostics | Flow Agent (24H Commute) | Chart | — | Line chart with >45M threshold |
| Diagnostics | Demand Forecaster | -153K | UNITS | Housing Deficit by 2030 |
| Diagnostics | Idle Land Agent | 38 | % | White Land Activation |
| Optimization | Zoning Advisor | 35% | — | Over-limit (pie chart center) |
| Optimization | Intervention Guide | 47 | % | Optimal ROI |
| Optimization | Access & Parking | 13 | ZONES | Strain <5% |
| Simulation | Flood Risk Index | 42 | Score | Current · 2030 Target: 85 |
| Simulation | Project IRR | 8% | % | Current · 2030 Target: 18% |
| Monitoring | Change Tracker | 12 | SITES | Sat-AI Violations |
| Monitoring | Cont. Learning | +8.3 | % | Model Accuracy Lift |
| Monitoring | Sync Delay | Chart | — | Bar chart with >1H threshold |

### Map markers on Panorama

| Label | Metric | Description | Type |
|---|---|---|---|
| WHITE LAND | 4 YRS | Al Yasmin Untaxed | Warning |
| ZONING STRAIN | 35% | KAFD Commercial Overload | Alert |
| CRITICAL FLOW | 12 KM/H | King Fahd Speed Drop | Alert |
| FLOOD RISK | 98% | Wadi Hanifah Load | Warning |

---

## 6. Data Authenticity Reference

> Classification of all data in this demo as **REAL** (factual/verifiable) or **SAMPLE** (fabricated for demonstration purposes).

### 6.1 Real / Factual Data

These items are based on verifiable public information:

| Category | Examples | Source |
|---|---|---|
| **Vision 2030 targets** | 70% homeownership, RE 10% of GDP | Saudi Vision 2030 official documents |
| **Saudi geography** | City names, region names, wadi names (Wadi Hanifah, Al Aqiq) | Standard geographic references |
| **Government agencies** | MOMRAH, NHC, GASTAT, REGA, SAMA, SEC, MOH, MOE, CITC, RCRC, STB | Real Saudi government agencies |
| **Giga-project names** | NEOM – The Line, Diriyah Gate, New Murabba, Red Sea Global, Qiddiya, KAFD | Real Saudi giga-projects |
| **Standards & frameworks** | WHO 9 m²/person green space, Saudi Building Code (SBC 601/602), SAIFI/SAIDI reliability indices | Real international/national standards |
| **Infrastructure references** | Riyadh Metro Lines 1–6, SCATS/SCOOT signal systems, White Land Tax (2.5% levy) | Real infrastructure programs/policies |
| **Riyadh road names** | King Fahd Rd, Olaya St, King Abdullah Rd, Makkah Rd, Northern Ring, Eastern Ring, etc. | Real street names |
| **Benchmark references** | London congestion charge (~70 SAR), Stockholm (~15 SAR), Singapore (~14 SAR) | Approximate real-world congestion pricing |
| **Riyadh existing drain network** | 340km baseline network | Approximate real figure |

### 6.2 Sample / Dummy Data

All numerical values, indicators, map markers, project statuses, and simulation results are **fabricated for demo purposes**:

| Category | What is sample | Notes |
|---|---|---|
| **All indicator values** | 78/100 commute index, 38% activation, 54/100 infra score, 5.2% yield, etc. | Illustrative, not from real datasets |
| **All 2030 target values** | 92/100, 65%, 75/100, 7.5%, etc. | Realistic but not official per-indicator targets |
| **Map marker locations** | Al Yasmin Block 4A, Al Malqa Apex, KAFD North Buffer Zone, etc. | Location names are plausible but parcels/zones are fictional |
| **Map marker data** | Areas (14,500 SQM), idle years (4 yrs), severity levels, risk scores | All fabricated |
| **City congestion rankings** | Riyadh 78, Jeddah 72, Makkah 68, etc. | Fictional index values |
| **Road project data** | Riyadh–NEOM Corridor 4,200 KM, Jeddah–KAEC Expressway 1,800 KM, etc. | Fictional projects and lengths |
| **Housing deficit figures** | -153K total, -35K Riyadh, -42K Makkah, etc. | Illustrative, not from NHC data |
| **Regional yield data** | 5.8% Riyadh, 4.8% Makkah, zone-level forecasts, confidence % | All fabricated |
| **Agent/zone scores** | All sub-dimension scores, weighted calculations | Designed to look realistic but are dummy |
| **Project pipeline statuses** | NEOM 72.4%, New Murabba 26.3%, budget figures (500B, 104B, etc.) | Fictional progress and budget data |
| **Monitoring data** | Footprint drift +2.8%, urban sprawl 14.2 KM², CAPEX idle rates | All sample data |
| **Simulation formulas** | UT gain, MI multipliers, EF financial model, ER flood model | Simplified models for demo; not calibrated to real-world data |
| **Simulation defaults & ranges** | 0–4 lanes, 0–40% metro shift, 15–60% mixed-use, etc. | Plausible ranges but not from any urban planning study |
| **Flood spot base radii & risk scores** | 850m/92, 750m/88, etc. | Fictional baseline measurements |
| **Heat island point weights** | Per-point weights and urban flags | Fabricated for visualisation |
| **Funding source breakdowns** | Government vs PPP vs LVC vs FAR allocation bars | Computed from dummy formula, not real budgets |
| **Population/homeownership by region** | 8.6M Riyadh, 55% ownership, etc. | Approximate but not official GASTAT figures |

### 6.3 Summary Rule

> **If it is a number, score, percentage, area, budget, deficit, index, rank, progress, or map coordinate in this demo — it is SAMPLE data.**
> Only structural references (agency names, city names, policy names, project names, standards) are real.

---

## Appendix: Agent Index by Page

| # | Page | Agent Name | Description |
|---|---|---|---|
| 1 | Diagnostics | **Flow Agent** | Forecasts citizen movement patterns and changing demand for services |
| 2 | Diagnostics | **Demand Forecaster Agent** | Forecasts future needs for housing, roads, and amenities across regions |
| 3 | Diagnostics | **Idle Land Agent** | Identifies and maps underdeveloped or vacant parcels for redevelopment potential |
| 4 | Diagnostics | **Asset Evaluation Agent** | Analyzes site conditions to assess competitiveness and potential value of the area |
| 5 | Diagnostics | **Citizen Insight Agent** | Chat based assistant answering questions about mobility patterns and citizen behaviors. Powered by HiAgents |
| 6 | Optimization | **Zoning Mix Advisor Agent** | Optimizes land-use balance between residential, commercial, and services to support policy goals |
| 7 | Optimization | **Accessibility and Parking Optimizer Agent** | Suggests optimal road, transport, and parking planning to improve accessibility |
| 8 | Optimization | **Parks Selector Agent** | Ensures access to green spaces and parks, in line with goals and accessibility radius |
| 9 | Optimization | **Priority Classifier Agent** | Assesses and classifies land, highlighting urgent priority zones for action |
| 10 | Optimization | **Intervention Guide Agent** | Suggests urban interventions or upgrades to improve land use, accessibility, and service |
| 11 | Simulation | **Urban Test Agent** | Runs simulations to test alternative zoning, road redesigns, or infrastructure proposals |
| 12 | Simulation | **Mobility Impact Advisor Agent** | Analyzes simulation results to recommend actions that improve accessibility and land-use |
| 13 | Simulation | **Scenario Optimizer Agent** | Compares alternatives and identifies optimal trade-offs between cost and sustainability |
| 14 | Simulation | **Economic and Financial Analyzer Agent** | Models feasibility, funding needs, and economic return (e.g., self-sustaining neighborhoods) |
| 15 | Simulation | **Environmental and Resilience Evaluator** | Assesses sustainability, and resilience to climate and flood risks |
| 16 | Monitoring | **Urban Monitoring Module** | Tracks spatial and development changes using geospatial data to update the digital twin |
| 17 | Monitoring | **Condition Watch Agent** | Monitors utilization and physical conditions of parking and infrastructure assets |
| 18 | Monitoring | **Change Tracker Agent** | Detects and monitors spatial/urban land-use changes |
| 19 | Monitoring | **Continuous Learning Agent** | Ensures continuous learning and adjustments based on changes in policies, demographics, etc. |
