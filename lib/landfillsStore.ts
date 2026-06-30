/**
 * Shared in-memory + localStorage store for TPS landfill data.
 * Admin writes here; Map and Cari pages read from here.
 * Falls back to DEFAULT_LANDFILLS if localStorage is empty/unavailable.
 */

import { Landfill } from "@/components/LandfillCard";

export const DEFAULT_LANDFILLS: Landfill[] = [
  {
    id: "1",
    name: "TPS Sanur",
    address: "Jl. Ngurah Rai No. 47, Sanur, Denpasar",
    region: "Denpasar",
    latitude: -8.7009,
    longitude: 115.2625,
    status: "low",
    capacity_level: 28,
    notes: "",
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "TPS Ubud Kaja",
    address: "Jl. Raya Ubud, Ubud, Gianyar",
    region: "Gianyar",
    latitude: -8.5069,
    longitude: 115.2625,
    status: "half_full",
    capacity_level: 62,
    notes: "",
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "TPS Kuta Selatan",
    address: "Jl. Raya Kuta, Kuta, Badung",
    region: "Badung",
    latitude: -8.7185,
    longitude: 115.1686,
    status: "full",
    capacity_level: 97,
    notes: "Truck arrives at 15:00",
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "TPS Tabanan Kota",
    address: "Jl. Gatot Subroto, Tabanan",
    region: "Tabanan",
    latitude: -8.5383,
    longitude: 115.1278,
    status: "low",
    capacity_level: 15,
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "TPS Singaraja",
    address: "Jl. Ahmad Yani, Singaraja",
    region: "Buleleng",
    latitude: -8.1126,
    longitude: 115.0879,
    status: "half_full",
    capacity_level: 55,
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    name: "TPS Canggu",
    address: "Jl. Batu Bolong, Canggu, Badung",
    region: "Badung",
    latitude: -8.6508,
    longitude: 115.1307,
    status: "low",
    capacity_level: 33,
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

const LS_KEY = "baliwasteai_landfills";

export function getLandfills(): Landfill[] {
  if (typeof window === "undefined") return DEFAULT_LANDFILLS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_LANDFILLS;
    return JSON.parse(raw) as Landfill[];
  } catch {
    return DEFAULT_LANDFILLS;
  }
}

export function saveLandfills(landfills: Landfill[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(landfills));
    // Broadcast to other tabs/pages on same origin
    window.dispatchEvent(new StorageEvent("storage", { key: LS_KEY }));
  } catch {
    // localStorage not available — silent fail
  }
}
