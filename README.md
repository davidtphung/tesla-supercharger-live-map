# Tesla Supercharger Intelligence Map

Live worldwide map for Tesla Supercharger occupancy, congestion, and energy portfolio intelligence.

## Features

- Worldwide Supercharger map with occupancy-colored markers
- Station detail drawer (stalls, power, reliability, congestion, attribution)
- Energy portfolio layer: solar, battery, grid, hybrid, unknown
- Congestion heat map
- Search and filters (occupancy, power, region, energy type)
- Watchlist (local persistence)
- Timeline playback for occupancy changes
- Summary cards: busiest, highest power, most resilient
- Provider abstraction with caching, retry, and stale-data handling
- Vercel cron refresh every 15 minutes

## Data sources

| Layer | Source | Confidence |
|-------|--------|------------|
| Station metadata | [supercharge.info](https://supercharge.info) | High |
| Live occupancy | Tesla Fleet API (optional) | High |
| Fallback occupancy | Deterministic modeled refresh (15 min buckets) | Low |

Set `TESLA_FLEET_TOKEN` for live occupancy. Without it, occupancy is modeled from station characteristics and time-of-day demand patterns — always labeled in the UI.

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
├── components/             # Map, panels, layout, UI primitives
├── lib/
│   ├── schema/             # Normalized StationRecord schema
│   ├── providers/          # Metadata + occupancy adapters, composite provider
│   ├── scoring/            # Congestion + reliability scoring
│   ├── cache/              # In-memory TTL cache + retry helper
│   └── hooks/              # Client data hooks
└── store/                  # Zustand filters + watchlist state
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local`:

- `TESLA_FLEET_TOKEN` — optional live occupancy
- `CRON_SECRET` — protects `/api/refresh` on Vercel
- `NEXT_PUBLIC_MAP_STYLE` — MapLibre style URL

## Deploy (Vercel)

```bash
npx vercel --prod
```

Cron job configured in `vercel.json` hits `/api/refresh` every 15 minutes.

## License

MIT