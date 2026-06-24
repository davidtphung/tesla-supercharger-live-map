import { modelOccupancy } from "@/lib/providers/adapters/modeled-occupancy";
import type { EnergyPortfolioType, StationRecord } from "@/lib/schema/station";
import { estimateCurrentPowerKw } from "@/lib/scoring/power";

export interface EnergyFlow {
  power_out_kw: number;
  power_in_kw: number;
  solar_in_kw: number;
  grid_in_kw: number;
  battery_net_kw: number;
}

export interface EnergySnapshot extends EnergyFlow {
  timestamp: string;
}

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function solarAvailability(hour: number, portfolio: EnergyPortfolioType): number {
  if (portfolio === "grid" || portfolio === "unknown") return 0;
  const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  return portfolio === "solar" ? daylight * 0.9 : daylight * 0.55;
}

export function estimateEnergyFlow(
  station: Pick<
    StationRecord,
    | "station_id"
    | "stall_occupied"
    | "stall_total"
    | "max_power_kw"
    | "solar_present"
    | "battery_present"
    | "energy_portfolio_type"
  >,
  timestamp = new Date().toISOString()
): EnergyFlow {
  const power_out_kw = estimateCurrentPowerKw(station);

  if (power_out_kw <= 0) {
    return {
      power_out_kw: 0,
      power_in_kw: 0,
      solar_in_kw: 0,
      grid_in_kw: 0,
      battery_net_kw: 0,
    };
  }

  const hour = new Date(timestamp).getUTCHours();
  const rand = seededRandom(`${station.station_id}:energy:${timestamp}`);
  const siteLoss = 1.08;
  const grossNeed = power_out_kw * siteLoss;

  const solarCap =
    station.max_power_kw *
    solarAvailability(hour, station.energy_portfolio_type) *
    (0.35 + rand() * 0.2);

  const solar_in_kw = station.solar_present
    ? Math.round(Math.min(grossNeed * 0.45, solarCap))
    : 0;

  let remaining = Math.max(0, grossNeed - solar_in_kw);
  let battery_net_kw = 0;

  if (station.battery_present && remaining > 0) {
    const discharge = Math.min(
      remaining * (0.2 + rand() * 0.15),
      station.max_power_kw * 0.12
    );
    battery_net_kw = Math.round(discharge);
    remaining = Math.max(0, remaining - battery_net_kw);
  } else if (station.battery_present && solar_in_kw > grossNeed * 0.6) {
    battery_net_kw = -Math.round(Math.min(station.max_power_kw * 0.08, solar_in_kw * 0.25));
  }

  const grid_in_kw = Math.round(Math.max(0, remaining));
  const power_in_kw = Math.round(solar_in_kw + grid_in_kw + Math.max(0, battery_net_kw));

  return {
    power_out_kw,
    power_in_kw,
    solar_in_kw,
    grid_in_kw,
    battery_net_kw,
  };
}

export function aggregateEnergyFlow(stations: StationRecord[]): EnergyFlow {
  return stations
    .filter((s) => s.station_status === "OPEN")
    .reduce(
      (acc, station) => ({
        power_out_kw: acc.power_out_kw + station.power_out_kw,
        power_in_kw: acc.power_in_kw + station.power_in_kw,
        solar_in_kw: acc.solar_in_kw + station.solar_in_kw,
        grid_in_kw: acc.grid_in_kw + station.grid_in_kw,
        battery_net_kw: acc.battery_net_kw + station.battery_net_kw,
      }),
      {
        power_out_kw: 0,
        power_in_kw: 0,
        solar_in_kw: 0,
        grid_in_kw: 0,
        battery_net_kw: 0,
      }
    );
}

export function buildNetworkEnergyTimeline(
  stations: StationRecord[],
  hours = 24,
  stepMinutes = 15
): EnergySnapshot[] {
  const open = stations.filter((s) => s.station_status === "OPEN");
  const now = Date.now();
  const steps = Math.floor((hours * 60) / stepMinutes);
  const snapshots: EnergySnapshot[] = [];

  for (let i = steps; i >= 0; i--) {
    const ts = new Date(now - i * stepMinutes * 60 * 1000).toISOString();
    const totals = open.reduce(
      (acc, station) => {
        const patch = modelOccupancy(station, ts);
        const flow = estimateEnergyFlow(
          {
            ...station,
            stall_occupied: patch.stall_occupied ?? station.stall_occupied,
          },
          ts
        );
        return {
          power_out_kw: acc.power_out_kw + flow.power_out_kw,
          power_in_kw: acc.power_in_kw + flow.power_in_kw,
          solar_in_kw: acc.solar_in_kw + flow.solar_in_kw,
          grid_in_kw: acc.grid_in_kw + flow.grid_in_kw,
          battery_net_kw: acc.battery_net_kw + flow.battery_net_kw,
        };
      },
      {
        power_out_kw: 0,
        power_in_kw: 0,
        solar_in_kw: 0,
        grid_in_kw: 0,
        battery_net_kw: 0,
      }
    );

    snapshots.push({ timestamp: ts, ...totals });
  }

  return snapshots;
}