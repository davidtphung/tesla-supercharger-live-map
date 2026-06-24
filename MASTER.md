# Tesla Supercharger Intelligence Map — Master Reference

**Document date:** June 24, 2026  
**Project version:** 1.0.0  
**Maintainer:** David T Phung ([@davidtphung](https://x.com/davidtphung))

---

## Live deployment

| Resource | URL |
|----------|-----|
| **Production app** | https://tesla-supercharger-live-map-v1.vercel.app |
| **GitHub repository** | https://github.com/davidtphung/tesla-supercharger-live-map |
| **Vercel project** | `david-t-phungs-projects/tesla-supercharger-live-map-v1` |
| **Data source (primary)** | https://supercharge.info |
| **Charts reference** | https://supercharge.info/charts |

---

## What this project is

A **live worldwide Tesla Supercharger intelligence map** built with Next.js 15, React 19, MapLibre GL, and Tailwind CSS 4. The UI follows a **Starlink-inspired** design system (dark/light themes, glass panels, HUD badges).

Users can explore Supercharger sites on a full-bleed map, view live stall occupancy and estimated energy flow (watts in / watts out), filter by region and energy portfolio, watchlist stations, and review network growth charts from supercharge.info.

---

## Feature summary (as of June 24, 2026)

### Map & navigation
- Full-bleed MapLibre map with occupancy-colored markers
- Congestion heatmap layer
- Energy portfolio emphasis layer (solar, battery, grid, hybrid)
- Station selection with detail drawer
- Search, region filters, occupancy chips, power filters
- Mobile bottom sheets + desktop sidebar layout

### Live data HUD (header)
- Available stalls
- Occupied stalls + utilization %
- **Watts in** (grid + solar + battery)
- **Watts out** (vehicle charging)
- Total stalls + open site count
- Refreshes every **15 seconds**

### Data tab
- **supercharge.info charts** panel:
  - Open stall history (worldwide line chart)
  - Network changes by year (stacked bars)
  - **Sites by status table:** Open · Constr · Plan · Closed (world + regions)
  - Summary stat tiles for each status bucket
- **Live stats bar** (same metrics as header)
- **Energy flow panel** — watts in/out with 24h SVG chart
- **Summary cards** — busiest, highest power, most resilient stations
- **Timeline player** — per-station occupancy playback
- **Feed status** — source, confidence, last updated

### About tab
- Project description and feature overview
- Data attribution (supercharge.info, modeled occupancy)
- Built by David T Phung with X profile link

### Other
- Watchlist (localStorage persistence)
- Theme toggle: **Dark / Light** only (System option removed)
- Accessibility: skip link, focus trap, reduced motion, ARIA live regions
- Vercel cron: daily cache refresh via `/api/refresh`

---

## Network status breakdown (live snapshot — June 24, 2026)

Sourced from supercharge.info `allSites`, grouped to match [supercharge.info/charts](https://supercharge.info/charts):

| Region | Open | Constr | Plan | Closed |
|--------|------|--------|------|--------|
| **World** | 8,756 sites (82,576 stalls) | 508 (5,935) | 1,076 (7,408) | 338 (2,243) |
| North America | 3,459 | 317 | 546 | 61 |
| Europe | 1,732 | 150 | 435 | 69 |
| Asia Pacific | 3,561 | 41 | 82 | 208 |
| South America | 4 | 0 | 13 | 0 |

**Status bucket mapping:**
- **Open** — `OPEN` + `EXPANDING`
- **Constr** — `CONSTRUCTION` + `PERMIT`
- **Plan** — `PLAN` + `VOTING`
- **Closed** — `CLOSED_TEMP` + `CLOSED_PERM`

---

## Energy model (watts in / watts out)

> **Important:** There is no public API for true metered kW at Supercharger sites. Values are **estimated** from modeled stall occupancy and labeled as such in the UI.

### Watts out (vehicle charging)
```
occupied_stalls × (max_power_kw / stall_total) × 0.72
```

### Watts in (site supply)
```
gross_need = power_out_kw × 1.08   # ~8% site loss
solar_in   = time-of-day solar curve × portfolio type
battery    = discharge or charge depending on surplus
grid_in    = remainder after solar + battery
power_in   = solar + grid + max(0, battery_discharge)
```

### Live refresh pipeline
1. Client polls `/api/stations` every **15s** (`cache: no-store`)
2. Composite provider re-models occupancy with **1-minute buckets** even when metadata cache is warm (15 min TTL)
3. Energy snapshots recorded in memory on every fetch (`energy-snapshots.ts`)
4. Charts merge **recorded live history** + modeled backfill for gaps
5. `/api/energy/live` exposes current network watts + recent snapshots

**Production sample (June 24, 2026):** ~441 MW in · ~408 MW out across ~22k occupied stalls.

---

## Data sources

| Layer | Source | Endpoint / adapter | Confidence |
|-------|--------|-------------------|------------|
| Station metadata | supercharge.info | `allSites` via `supercharge-info.ts` | High |
| Network charts | supercharge.info | `stallCount`, `changesByDate`, `databaseInfo` | High |
| Status breakdown | supercharge.info | `allSites` aggregated in `supercharge-charts.ts` | High |
| Live occupancy | Tesla Fleet API (optional) | `tesla-fleet.ts` | High |
| Fallback occupancy | Modeled (deterministic) | `modeled-occupancy.ts` | Low |
| Energy flow | Computed | `energy-flow.ts` + `power.ts` | Low (estimated) |

### Map vs. full database
- **Map markers** show open sites with GPS + stalls > 0 (~10,053 stations)
- **Status table** uses the full supercharge.info database (~10,678 sites including construction, planned, closed)

---

## API routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/stations` | All open map stations + network stats. `?force=1` bypasses cache |
| `GET` | `/api/stations/[id]` | Single station record |
| `GET` | `/api/energy/live` | Current network watts in/out + recent snapshots |
| `GET` | `/api/energy/network?hours=24` | Network energy timeline (recorded + modeled) |
| `GET` | `/api/energy/station/[id]?hours=24` | Per-station energy timeline |
| `GET` | `/api/supercharge/charts` | Stall history, yearly changes, status breakdown. `?force=1` bypasses cache |
| `GET` | `/api/timeline/[id]` | Station occupancy timeline |
| `GET` | `/api/refresh` | Cron-protected cache warm (Vercel daily cron) |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Main map shell
│   ├── layout.tsx                  # Root layout + theme
│   └── api/
│       ├── stations/               # Station list + detail
│       ├── energy/
│       │   ├── live/                 # Live network watts
│       │   ├── network/              # Network energy timeline
│       │   └── station/[id]/       # Per-station energy timeline
│       ├── supercharge/charts/       # supercharge.info proxy
│       ├── timeline/[id]/          # Occupancy timeline
│       └── refresh/                # Cron cache refresh
├── components/
│   ├── map/SuperchargerMap.tsx     # MapLibre map + layers
│   ├── charts/                     # EnergyFlowChart, SuperchargeLineChart
│   ├── layout/                     # AppShell, Header, MobileToolbar
│   ├── panels/                     # Data, About, Filter, Watchlist, Detail
│   └── ui/                         # ThemeToggle, PanelTabs, BottomSheet
├── lib/
│   ├── schema/station.ts           # StationRecord types
│   ├── providers/
│   │   ├── composite.ts            # Orchestrates metadata + occupancy
│   │   └── adapters/
│   │       ├── supercharge-info.ts # Station metadata
│   │       ├── supercharge-charts.ts # Charts + status breakdown
│   │       ├── modeled-occupancy.ts  # Fallback occupancy model
│   │       └── tesla-fleet.ts        # Optional live occupancy
│   ├── scoring/
│   │   ├── congestion.ts           # Congestion + reliability scores
│   │   ├── energy-flow.ts          # Watts in/out estimation
│   │   └── power.ts                # Network stats aggregation
│   ├── cache/
│   │   ├── memory-cache.ts         # TTL in-memory cache
│   │   └── energy-snapshots.ts     # Live energy history recording
│   └── hooks/                      # useStations, useEnergyTimeline, etc.
└── store/
    ├── filters.ts                  # Zustand filter state
    ├── watchlist.ts                # Saved stations
    ├── ui.ts                       # Panel tabs, mobile sheets
    └── theme.ts                    # Dark/light theme
```

### Provider pipeline (`composite.ts`)
1. Fetch metadata from supercharge.info (cached 15 min)
2. Try Tesla Fleet occupancy patches (if `TESLA_FLEET_TOKEN` set)
3. Fall back to modeled occupancy (1-min buckets for live refresh)
4. Finalize stations: scores, power, energy flow
5. Record energy snapshots + timeline snapshots
6. Return payload with `network_stats` (stalls + watts)

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `TESLA_FLEET_TOKEN` | No | Tesla Fleet API token for real occupancy |
| `CRON_SECRET` | Prod | Protects `/api/refresh` on Vercel |
| `NEXT_PUBLIC_MAP_STYLE` | No | MapLibre style URL (default: CARTO dark matter) |

---

## Local development

```bash
git clone https://github.com/davidtphung/tesla-supercharger-live-map.git
cd tesla-supercharger-live-map
npm install
cp .env.example .env.local   # optional
npm run dev                   # http://localhost:3000
```

### Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

---

## Deployment (Vercel)

```bash
npx vercel deploy --prod --yes
```

- **Framework:** Next.js 15 (App Router)
- **Cron:** `vercel.json` → `/api/refresh` daily at 12:00 UTC
- **Auto-deploy:** Pushes to `main` trigger Vercel builds

---

## Git commit history

| Commit | Summary |
|--------|---------|
| `a50932d` | Add Open/Constr/Plan/Closed site breakdown from supercharge.info |
| `fbdc4d5` | Add live watts in/out pipeline with recorded energy snapshots |
| `c4dc435` | Add live supercharge.info charts to Data tab |
| `aa3eb20` | Add Data and About tabs with Starlink-style panel layout |
| `8996d1b` | Add live watts in/out charts with 24h energy flow history |
| `50738df` | Add prominent live stall and charging power stats across the map |
| `e3f1cfd` | Remove System option from theme toggle |
| `681e1a5` | Revert map scrolling and data behavior while keeping Starlink UI |
| `93965f7` | Add About tab with Built by David T Phung X link |
| `226979d` | Starlink globe design system with dark and light mode |
| `927bb21` | Optimize UX for desktop and mobile with accessibility |
| `b560adb` | Use daily cron schedule for Vercel Hobby plan |
| `f18088b` | Tesla Supercharger live intelligence map (initial feature) |
| `5021207` | Add GitHub connection info to README |
| `bc7ad6c` | Add README and tighten .gitignore |
| `a057c52` | Initialize repository |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.5, React 19 |
| Map | MapLibre GL 5.6 |
| Styling | Tailwind CSS 4, CSS custom properties (Starlink tokens) |
| State | Zustand 5 |
| Icons | Lucide React |
| Dates | date-fns 4 |
| Language | TypeScript 5.8 |
| Hosting | Vercel |
| License | MIT |

---

## UI panels reference

| Panel | Location | Purpose |
|-------|----------|---------|
| **Data** | Sidebar / mobile sheet | Live stats, charts, energy flow, summary |
| **About** | Sidebar / mobile sheet | Project info, attribution, author link |
| **Filters** | Left sidebar | Search, region, occupancy, energy filters |
| **Watchlist** | Left sidebar | Saved stations |
| **Station detail** | Right drawer | Per-station stalls, power, energy chart |
| **Header HUD** | Top overlay | Live network stats + refresh indicator |

---

## Key files added in recent sessions

| File | Role |
|------|------|
| `src/lib/cache/energy-snapshots.ts` | Record/merge live energy history |
| `src/app/api/energy/live/route.ts` | Lightweight live watts endpoint |
| `src/app/api/energy/station/[id]/route.ts` | Per-station energy API |
| `src/app/api/energy/network/route.ts` | Network energy timeline API |
| `src/app/api/supercharge/charts/route.ts` | supercharge.info charts proxy |
| `src/lib/providers/adapters/supercharge-charts.ts` | Charts fetch + status aggregation |
| `src/components/panels/SuperchargeChartsPanel.tsx` | Charts UI + status table |
| `src/components/panels/EnergyFlowPanel.tsx` | Watts in/out live chart |
| `src/components/panels/LiveStatsBar.tsx` | Header/Data stat tiles |
| `src/components/panels/DataPanel.tsx` | Data tab composition |
| `src/components/ui/PanelTabs.tsx` | Data \| About tab switcher |

---

## Disclaimer

Information displayed in this app is **not provided or validated by Tesla**. Occupancy and energy values may be modeled estimates. For official Supercharger information, refer to:

- https://www.tesla.com/trips
- https://www.tesla.com/findus

Station metadata and charts are sourced from the [supercharge.info](https://supercharge.info) community database.

---

## Document maintenance

This file (`MASTER.md`) is the single source of truth for project state as of the date in the header. Update it when:

- New features ship
- API routes change
- Deployment URLs change
- Data source integrations change

**Last updated:** June 24, 2026  
**Last deployed commit:** `07c9e89`