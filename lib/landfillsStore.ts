/**
 * Shared in-memory + localStorage store for TPS landfill data.
 * Admin writes here; Map and Cari pages read from here.
 * Falls back to DEFAULT_LANDFILLS if localStorage is empty/unavailable.
 */

import { Landfill } from "@/components/LandfillCard";

export const DEFAULT_LANDFILLS: Landfill[] = [
  {
    id: "1",
    name: "TPA Suwung",
    address: "Jl. TPA Suwung, Pedungan, Denpasar Selatan",
    region: "Denpasar",
    latitude: -8.72177,
    longitude: 115.22019,
    status: "half_full",
    capacity_level: 62,
    notes: "TPA regional Sarbagita — tutup direncanakan Maret 2026",
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "TPS3R Sekar Tanjung",
    address: "Jl. Danau Tempe I, Sanur Kauh, Denpasar Selatan",
    region: "Denpasar",
    latitude: -8.70321,
    longitude: 115.24572,
    status: "low",
    capacity_level: 28,
    notes: "",
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "TPST Temesi",
    address: "Jl. Raya Temesi, Gianyar",
    region: "Gianyar",
    latitude: -8.54437,
    longitude: 115.34973,
    status: "half_full",
    capacity_level: 55,
    notes: "Hanya melayani sampah Gianyar",
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "TPS 3R Belalang",
    address: "Kedungu, Belalang, Kediri, Tabanan",
    region: "Tabanan",
    latitude: -8.60297,
    longitude: 115.0899,
    status: "low",
    capacity_level: 33,
    notes: "",
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "TPA Jagaraga",
    address: "Bungkulan, Sawan, Buleleng",
    region: "Buleleng",
    latitude: -8.09039,
    longitude: 115.16996,
    status: "half_full",
    capacity_level: 58,
    notes: "",
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    name: "TPS 3R Sudha Pertiwi",
    address: "Munggu, Mengwi, Badung",
    region: "Badung",
    latitude: -8.63341,
    longitude: 115.1281,
    status: "low",
    capacity_level: 15,
    notes: "",
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

const LS_KEY = "baliwasteai_landfills";

export type LandfillStatus = Landfill["status"];

/** Derive display status from fill percentage. Single source of truth — mirrors TongSampahGauge thresholds. */
export function statusForLevel(level: number): Exclude<LandfillStatus, "unknown"> {
  if (level <= 40) return "low";
  if (level <= 70) return "half_full";
  return "full";
}

/** Clamp level to 0–100 and re-derive status so stored rows stay consistent. */
export function normalizeLandfill(lf: Landfill): Landfill {
  const capacity_level = Math.min(100, Math.max(0, Math.round(lf.capacity_level ?? 0)));
  return { ...lf, capacity_level, status: statusForLevel(capacity_level) };
}

export function getLandfills(): Landfill[] {
  if (typeof window === "undefined") return DEFAULT_LANDFILLS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_LANDFILLS;
    return (JSON.parse(raw) as Landfill[]).map(normalizeLandfill);
  } catch {
    return DEFAULT_LANDFILLS;
  }
}
export function saveLandfills(landfills: Landfill[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(landfills.map(normalizeLandfill)));
    // Broadcast to other tabs/pages on same origin
    window.dispatchEvent(new StorageEvent("storage", { key: LS_KEY }));
  } catch {
    // localStorage not available — silent fail
  }
}
