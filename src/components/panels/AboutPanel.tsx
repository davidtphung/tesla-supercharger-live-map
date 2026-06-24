"use client";

import { ExternalLink, Zap } from "lucide-react";

const X_PROFILE_URL = "https://x.com/davidtphung";

export function AboutPanel({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={embedded ? "space-y-5" : "glass scroll-thin max-h-64 space-y-5 overflow-y-auto rounded-xl p-4"}
      aria-label="About this project"
    >
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
          <h2 className="text-[15px] font-semibold gradient-text">
            Supercharger Intelligence
          </h2>
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
            Occupancy is modeled on 15-minute refresh cycles unless a Tesla
            Fleet API token is configured.
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