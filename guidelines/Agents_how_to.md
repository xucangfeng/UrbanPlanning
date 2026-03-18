Economic Forecast Agent

**Land Value Capture (LVC)** is a public finance mechanism where the government recovers a portion of the increase in land/property values that results from public infrastructure investments.

**How it works in practice:**

When a city builds a new metro station, highway interchange, or park, surrounding land values rise — sometimes dramatically. For example, land near Riyadh Metro stations has appreciated 30–80% since construction was announced. That value increase was created by *public* investment, but captured by *private* landowners who did nothing.

LVC says: the government should recoup some of that windfall to fund further infrastructure.

**Common LVC mechanisms:**
- **Betterment levies** — one-time charge on landowners whose property value rose due to nearby infrastructure (e.g., 10% of the assessed value increase)
- **Special assessment districts** — properties within X meters of new infrastructure pay a recurring surcharge
- **Developer exactions** — developers must contribute infrastructure (roads, parks) or cash-in-lieu when benefiting from rezoning
- **Tax increment financing (TIF)** — future property tax revenue increases in a designated zone are ring-fenced to repay infrastructure bonds

**In the simulation context:**

At 5% baseline (Riyadh's current minimal LVC), almost all value uplift goes to private landowners. Sliding to 40% means the municipality captures up to 40% of assessed land value increases near new infrastructure — generating revenue that reduces the funding gap and increases fiscal self-sufficiency.

**Real-world reference:** Hong Kong's MTR funds ~70% of transit construction through LVC (rail + property development model). Bogotá captures ~30% via betterment levies. Saudi Arabia's White Land Tax (introduced 2016) is an early form of LVC — taxing undeveloped urban land to discourage speculation and generate revenue.

This is how the total investment is measured

Correct. The total is fixed at 12B SAR. The chart shows how that 12B is funded — as you increase PPP, LVC, FAR, and anchor contributions, the government budget share shrinks to make up the difference. The stacked bar always sums to 12B (or close — govAmount is floored at 0 so it can't go negative).

Current baseline: Gov 9.6B + PPP 2.4B = 12B (everything else is 0).

When you tweak settings: PPP, LVC, FAR, and anchor slices grow, and Gov shrinks accordingly — showing how diverse funding sources reduce the government's fiscal burden without changing the total programme cost.

One thing worth noting: at extreme settings (e.g., PPP 70% + LVC 40% + FAR 30% + Anchor 50%), the non-gov sources can exceed 12B, which would push govAmount to 0 — meaning the project is fully privately funded. The Math.max(0, ...) prevents it from going negative, but the stacked bar would then exceed 12B total. Want me to cap the total so it always sums to exactly 12B?

This is how the demand forecast (diagnostic agent) work

Let me review what we currently show to assess the data methodology and timeframes. 

### What changed

**Card descriptions** now explicitly state the forecast methodology:
- **Housing**: "PROJECTED HOUSING UNIT SHORTFALL **BY 2030** BASED ON NHC SAKANI PROGRAM DATA (2016–2025) AND POPULATION GROWTH MODELS"
- **Road Network**: "FORECAST BASED ON **NATIONAL TRANSPORT STRATEGY (2021–2030)** AND GIGA-PROJECT CORRIDOR STUDIES"

**Stat labels** now include timeframe context:
- "DEFICIT" → "BY-2030 DEFICIT"
- "OWNERSHIP" → "Q1 2026" (snapshot date)
- "CURRENT" → "Q1 2026" (snapshot date)
- "GAP" → "BY-2030 GAP"

**Housing map markers** — each region's `delay` label now shows the timeframe (e.g., "-35K BY 2030" instead of "-35K UNITS"). Each `cause` field now starts with "Forecast horizon: 2030" and explains the data basis (population CAGR, NHC delivery pipeline). Recommendations include phased milestones (e.g., "20,000 units by 2028, remaining 15,000 by 2030").

**Road map markers** — each marker's `delay` label now shows both the km and target year (e.g., "4.2K KM · 2029" instead of "4,200 KM GAP"). Each `cause` starts with its specific target completion date. Completions range from **2027** (Madinah–Yanbu, earliest) to **2030** (Eastern Province Ring Road, latest). Progress percentages included where applicable (e.g., "45% complete", "60% complete").

**Mini-chart tooltips** now say "By-2030 Deficit" and "By-2030 Gap" instead of generic labels.

### Data logic summary
| Data Point | Type | Timeframe | Basis |
|---|---|---|---|
| -153K units deficit | Forecast | By 2030 | NHC Sakani 2016–2025 data + population growth models |
| 63% ownership | Snapshot | Q1 2026 | Trajectory from 47% (2016) baseline |
| 70% ownership | Target | 2030 | Vision 2030 Housing pillar |
| 76K km roads | Snapshot | Q1 2026 | MOT current network |
| 24K km gap | Forecast | By 2030 | National Transport Strategy 2021 |
| Per-project completion | Varies | 2027–2030 | Individual project timelines |


Great question. Let me break down how the data maps to the Demand Forecaster agent's role:

### What the agent does (3-step pipeline)

**Step 1: Data Ingestion** (not shown directly, implicit)
- Historical data: NHC Sakani program (2016–2025), MOT road network census, population registry, building permits
- Real-time feeds: construction progress, migration patterns, giga-project timelines

**Step 2: Forecast** (the numbers)
- The **deficit values** (-35K, -42K, etc.) and **km gaps** (4.2K, 1.8K, etc.) — these ARE the agent's forecast output
- The **ownership %** per region — this is the agent's current-state assessment
- The **mini-charts** — regional comparison of forecasted demand

**Step 3: Recommendation** (the `recommendation` field)
- AI-generated action plans: "Fast-track 15,000 housing permits", "Release 12,000 NHC units by 2028"
- These are what the agent suggests municipal planners should do based on the forecast

### What the `cause` field currently represents

Right now, the `cause` fields are doing **double duty** — they mix:
1. **Environmental/structural causes** — "Rapid population growth driven by Vision 2030 corporate HQ relocations", "Hajj/Umrah seasonal demand creates dual housing market"
2. **Forecast methodology** — "Forecast horizon: 2030", "Based on 2016–2025 population growth rate (4.2% CAGR)"

This makes sense because when a planner clicks a map marker and opens the analysis modal, they need to understand **why** the demand exists (the structural cause) AND **how confident** the forecast is (the methodology).

### The agent's job in context

The "Demand Forecaster" agent's job is specifically:

| Role | Example | Where shown |
|---|---|---|
| **Detect** current supply-demand gaps | "Makkah ownership at 52%, lowest nationally" | Stats on card + alert data |
| **Forecast** future shortfalls | "-42K units deficit by 2030" | Deficit numbers, mini-chart bars |
| **Explain** why demand exists | "Hajj/Umrah seasonal demand..." | `cause` field in analysis modal |
| **Recommend** interventions | "Zone 20,000 units in Al Awali by 2028" | `recommendation` field in analysis modal |
| **Prioritize** by severity | CRITICAL vs HIGH markers | Marker color (red vs yellow) |

The agent is NOT an event monitor (that's Flow Agent's job) or a sentiment tracker. It specifically forecasts **future needs** for housing and infrastructure across regions, then recommends supply-side actions to close the predicted gaps before they materialize.

### Summary

The `cause` = **why demand is growing** (environmental/economic drivers + methodology context). The `recommendation` = **what the AI agent suggests** to close the gap. The **numbers** (deficit, km gap, ownership %) = **the actual forecast output**. The agent's core job is predicting where supply won't meet demand by 2030 and telling planners where to act first.

## IDLE Land agent

**Map markers now work for both indicators** — clicking either card zooms to Saudi-wide view and shows distinct markers at specific locations (not just region centers).

### What the AI Agent Actually Does

**White Land Activation Rate** — The agent doesn't just report a percentage. It:
1. **Scans** MOMRAH's White Land Registry cross-referenced with satellite change-detection imagery (72 monthly scans per plot)
2. **Identifies specific idle parcels** — 12 spots across 6 regions, each pinned to real coordinates
3. **Diagnoses WHY** each plot is idle (speculative holding, ownership disputes, expired permits, environmental remediation, bureaucratic stalemate)
4. **Recommends action** — from "issue final warning under White Land Tax Phase 2" to "expedite Sharia court partition ruling" to "offer MODON co-development partnership"
5. **Quantifies impact** — estimated housing units each plot can deliver, SAR value, Sakani waitlist families served

**Urban Land Utilization Index** — The agent:
1. **Analyzes satellite urban footprint** against zoning registers to find zones where zoned capacity far exceeds actual development
2. **Flags 13 underutilized zones** with specific km² measurements and exact reasons (expired temp-use permits, height restriction perceptions, fragmented ownership, missing water infrastructure)
3. **Calculates index score impact** — e.g., "developing KAFD North Buffer alone lifts Riyadh's score from 62 to 67 (+5 points)"
4. **Recommends policy interventions** — rezoning, plot consolidation programs, agricultural transition bonds, heritage-compatible development guides

### Value to the Ministry

| What the Ministry Gets | White Land Activation | Urban Utilization |
|---|---|---|
| **Actionable intelligence** | Specific plots with owner status, tax penalty amounts, and building permit history | Specific zones with km², why blocked, what to build |
| **Policy enforcement** | White Land Tax escalation decisions backed by satellite evidence | Rezoning and infrastructure priority decisions |
| **Housing delivery** | Direct link to Sakani waitlist — "this plot serves 320 families within 2 km" | "This zone can deliver 37,500 units at medium density" |
| **Accountability** | Track each plot from "idle" → "permit issued" → "construction started" | Track index score improvement per zone per quarter |
| **Vision 2030 alignment** | 38% → 65% activation target with specific parcels mapped to close the gap | Score 58 → 80 with each zone's contribution quantified |

### Examples of AI-Identified Spots

- **Al Yasmin Block 4A, Riyadh** — 14,500 sqm idle 4 years, 400m from metro station, owner holding for appreciation (SAR 2,200→3,100/sqm). Can deliver 145 units for 320 Sakani families
- **Haramain Station District, Madinah** — 5 km² around high-speed rail station 70% undeveloped because 3 landowners can't coordinate. Could be Saudi's model TOD (+6 index points)
- **Buraidah–Unaizah Corridor, Qassim** — 14 km² of date farms between two cities. Converting creates a 750K metro area with BRT (+9 index points — largest single opportunity in Qassim)

## ASSET Evaluation

Here's my analysis and proposed design for the **Asset Evaluation Agent** with 2 Vision 2030-aligned indicators:

## Asset Evaluation Agent — 2 New Vision 2030 Indicators

### 1. **Infrastructure Competitiveness Index (PICI)** — `ast_1`

**Vision 2030 Link**: "Vibrant Society" pillar — move Saudi cities into **global top-40 livability ranking** by 2030.

| Metric | Value |
|--------|-------|
| Current Score (Q1 2026) | **54/100** |
| 2030 Target | **75/100** |
| Zones Flagged | **11** |

**How the score is calculated**: Each zone is scored 0–100 across 6 weighted sub-dimensions:
- **Transit access** (20%) — % of population within 800m of public transit
- **Utility reliability** (20%) — SEC grid uptime (SAIFI/SAIDI) + water supply hours
- **Healthcare proximity** (15%) — hospital beds per 1,000 + distance to primary care
- **Education coverage** (15%) — school seats vs school-age population ratio
- **Green space** (15%) — sqm of public parks per capita vs WHO standard (9 sqm/person)
- **Digital connectivity** (15%) — fiber-to-home penetration + 5G coverage %

**Data sources**: MOMRA municipal services database, GASTAT infrastructure census, SEC reliability metrics, MOH facility registry, MOE school density maps, RCRC green space GIS layers.

**AI Role**:
- **Computer vision** on satellite imagery verifies on-ground infrastructure delivery vs planned timelines
- **NLP parsing** of municipal permits and project completion certificates to auto-update scores
- **Anomaly detection** flags zones where improvement rate has stalled vs projection
- **Automated benchmarking** against 50 global peer cities (Dubai, Singapore, Seoul, Barcelona, etc.) to calibrate score thresholds

**11 map markers** across 6 regions flagging specific infrastructure gaps:
- **Riyadh** (2): North Metro Corridor (42/100 — healthcare/parks deficit despite SAR 200B metro), South Industrial Belt (51/100 — no transit for 180K workers)
- **Makkah** (2): East Jeddah Sprawl (38/100 — lowest score nationally, intermittent water), Taif Gateway (48/100 — no public transport)
- **Eastern** (2): Jubail Residential (56/100 — transit isolation from Dammam), Al Khobar Waterfront (63/100 — at risk of degrading with growth)
- **Madinah** (2): Knowledge Economic City (35/100 — "giga-project island" syndrome), Yanbu Heritage Coast (47/100 — aging infrastructure)
- **Asir** (1): Abha Center (52/100 — mountain topography needs cable car transit)
- **Qassim** (2): Buraidah Central (49/100 — zero public transit), Unaizah Heritage (44/100 — overlooked in regional plans)

---

### 2. **Real Estate Yield Forecast (REAYF)** — `ast_2`

**Vision 2030 Link**: "Thriving Economy" pillar — grow **real estate sector from 5.8% to 10% of GDP** by 2030.

| Metric | Value |
|--------|-------|
| Current Avg Yield (Q1 2026) | **5.2%** |
| 2030 Target | **7.5%** |
| Zones Tracked | **9** |

**How yields are projected**: ML model trained on 10 years of REGA transaction data combines:
1. **Current gross yield** — observed annual rental income / market value
2. **Demand multiplier** — population growth + corporate HQ relocation rate + tourism projections
3. **Supply pressure** — NHC housing pipeline + commercial permits (higher supply = yield compression)
4. **Infrastructure premium** — proximity to giga-projects (KAFD, Diriyah Gate, Jeddah Central, NEOM) adds 1.5–3.0% premium
5. **Risk discount** — oversupply risk or single-sector dependency gets yield haircut

**AI Role**:
- **ML yield prediction** model trained on REGA data + satellite-detected construction activity
- **Sentiment analysis** (NLP) scanning thousands of broker reports and tenant reviews
- **Geospatial K-means clustering** identifying micro-zones with outsized appreciation potential
- **Risk scoring** comparing each zone's demand drivers against global real estate bubble patterns
- **Seasonal variance analysis** (e.g., Makkah's 40% Hajj premium factored into annual projections)

**9 map markers** showing yield trajectories:
- **Riyadh**: KAFD–Diriyah corridor (6.1%→9.4%, #1 appreciation zone nationally), East Logistics Hub (4.8%→7.2%)
- **Makkah**: Jeddah Central Waterfront (5.4%→8.8%), Makkah Southern Residential (4.5%→6.8%)
- **Eastern**: Dhahran Techno Valley (5.8%→8.5%, #1 in Eastern Province), Dammam Al Shatie (5.2%→7.0%)
- **Madinah**: Haramain Station District (4.2%→7.1%, highest growth rate at 69%)
- **Asir**: Soudah Peaks (3.2%→6.5%, 103% appreciation — speculative)
- **Qassim**: Buraidah Agri-Tech district (3.5%→5.8%, long-term play)

---
