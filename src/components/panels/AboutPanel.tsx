"use client";

import {
  Activity,
  BatteryCharging,
  ExternalLink,
  Globe2,
  Zap,
} from "lucide-react";

const X_PROFILE_URL = "https://x.com/davidtphung";

const FEATURES = [
  {
    icon: Globe2,
    title: "Live map",
    description: "Worldwide Supercharger occupancy, congestion heat maps, and energy portfolio markers.",
  },
  {
    icon: Activity,
    title: "Watts in / out",
    description: "Grid, solar, and battery input vs vehicle charging output with 24-hour history charts.",
  },
  {
    icon: BatteryCharging,
    title: "Stall intelligence",
    description: "Available, occupied, and down stall counts with modeled 15-minute refresh cycles.",
  },
  {
    icon: Zap,
    title: "Watchlist & filters",
    description: "Search, region filters, occupancy chips, and saved stations for trip planning.",
  },
];

export function AboutPanel({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      id="panel-about"
      role="tabpanel"
      aria-label="About this project"
      className={
        embedded
          ? "space-y-5"
          : "glass scroll-thin max-h-[calc(100vh-14rem)] space-y-5 overflow-y-auto rounded-xl p-4"
      }
    >
      <div>
        <h2 className="text-[15px] font-semibold gradient-text">About</h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          How this works and where the data comes from.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "color-mix(in srgb, var(--accent-strong) 22%, transparent)",
            color: "var(--accent)",
          }}
          aria-hidden="true"
        >
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
            Supercharger Intelligence
          </p>
          <p className="text-[11px] tracking-[0.08em] uppercase" style={{ color: "var(--text-muted)" }}>
            Live EV infrastructure map
          </p>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Real-time Tesla Supercharger occupancy, congestion signals, and energy
        portfolio context — treating EV charging as live infrastructure
        intelligence, not a static directory.
      </p>

      <section>
        <h3 className="section-label">Capabilities</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="rounded-xl p-3"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} aria-hidden="true" />
                <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                  {title}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="section-label">Data sources</h3>
        <ul className="space-y-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          <li>
            Station metadata from{" "}
            <a
              href="https://supercharge.info"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              supercharge.info
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </li>
          <li>
            Occupancy and energy flow are modeled on 15-minute refresh cycles unless a
            Tesla Fleet API token is configured.
          </li>
          <li>
            Watts in/out estimates combine grid, solar canopy, and battery portfolio
            signals with live stall utilization.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="section-label">Built by</h3>
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Built by{" "}
          <a
            href={X_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer me"
            className="font-medium hover:underline"
            style={{ color: "var(--accent)" }}
          >
            David T Phung
          </a>
        </p>
      </section>
    </div>
  );
}