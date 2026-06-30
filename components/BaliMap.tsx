"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Landfill } from "@/components/LandfillCard";
import StatusBadge from "@/components/StatusBadge";
import TongSampahGauge from "@/components/TongSampahGauge";
import { getLandfills } from "@/lib/landfillsStore";

// Fix leaflet default icon path (Next.js asset issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create colored pin icons for each status
function createStatusIcon(status: string): L.DivIcon {
  const colors: Record<string, string> = {
    low: "#4A7C59",
    half_full: "#B89A3E",
    full: "#9B4A3A",
    unknown: "#7A8479",
  };
  const color = colors[status] ?? colors.unknown;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

// Mock data
const FALLBACK_LANDFILLS: Landfill[] = [
  {
    id: "1",
    name: "TPS Sanur",
    address: "Jl. Ngurah Rai No. 47, Sanur",
    region: "Denpasar",
    latitude: -8.7009,
    longitude: 115.2625,
    status: "low",
    capacity_level: 28,
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "TPS Ubud Kaja",
    address: "Jl. Raya Ubud, Ubud",
    region: "Gianyar",
    latitude: -8.5069,
    longitude: 115.2625,
    status: "half_full",
    capacity_level: 62,
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "TPS Kuta Selatan",
    address: "Jl. Raya Kuta, Kuta",
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
    address: "Jl. Batu Bolong, Canggu",
    region: "Badung",
    latitude: -8.6508,
    longitude: 115.1307,
    status: "low",
    capacity_level: 33,
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

interface BaliMapProps {
  regionFilter: string;
  statusFilter: string;
}

export default function BaliMap({ regionFilter, statusFilter }: BaliMapProps) {
  const t = useTranslations("map");
  const [allLandfills, setAllLandfills] = useState<Landfill[]>([]);

  useEffect(() => {
    // Load from shared store (falls back to defaults if empty)
    setAllLandfills(getLandfills());

    // Re-read when admin saves changes in another tab/component
    const handleStorage = () => setAllLandfills(getLandfills());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filtered = allLandfills.filter((lf) => {
    const matchRegion = regionFilter === "all" || lf.region === regionFilter;
    const matchStatus = statusFilter === "all" || lf.status === statusFilter;
    return matchRegion && matchStatus;
  });

  const googleMapsUrl = (lf: Landfill) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lf.latitude},${lf.longitude}`;

  return (
    <MapContainer
      center={[-8.62, 115.17]}
      zoom={10}
      style={{
        height: "60vh",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--bw-border)",
        zIndex: 0,
      }}
      id="bali-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filtered.map((lf) => (
        <Marker
          key={lf.id}
          position={[lf.latitude, lf.longitude]}
          icon={createStatusIcon(lf.status)}
        >
          <Popup minWidth={220}>
            <div style={{ fontFamily: "var(--font-body)", padding: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.55rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--bw-text-3)",
                      marginBottom: "0.15rem",
                    }}
                  >
                    {lf.region}
                  </p>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "var(--bw-text)" }}>
                    {lf.name}
                  </strong>
                </div>
                <TongSampahGauge level={lf.capacity_level} size="sm" />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--bw-text-3)", marginBottom: "0.5rem" }}>
                {lf.address}
              </p>
              <StatusBadge status={lf.status} />
              <div style={{ marginTop: "0.75rem" }}>
                <a
                  href={googleMapsUrl(lf)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.8rem",
                    color: "var(--bw-aman)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  {t("directions")} →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
