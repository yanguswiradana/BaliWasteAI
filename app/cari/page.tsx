"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import LandfillCard, { Landfill } from "@/components/LandfillCard";
import TongSampahGauge from "@/components/TongSampahGauge";
import { getLandfills } from "@/lib/landfillsStore";

// Mock data for demo — replace with Supabase fetch
const ALL_LANDFILLS: Landfill[] = [
  {
    id: "1",
    name: "TPS Sanur",
    address: "Jl. Ngurah Rai No. 47, Sanur, Denpasar",
    region: "Denpasar",
    latitude: -8.7009,
    longitude: 115.2625,
    status: "low",
    capacity_level: 28,
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    distance_km: 1.2,
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
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    distance_km: 3.7,
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
    distance_km: 5.1,
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
    distance_km: 8.9,
  },
  {
    id: "5",
    name: "TPS Gianyar Sentral",
    address: "Jl. Ngurah Rai No. 12, Gianyar",
    region: "Gianyar",
    latitude: -8.5289,
    longitude: 115.3325,
    status: "half_full",
    capacity_level: 58,
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    distance_km: 11.3,
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
    distance_km: 6.4,
  },
];

type GeoState = "idle" | "loading" | "success" | "error";

export default function CariPage() {
  const t = useTranslations("find");
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [landfills, setLandfills] = useState<Landfill[]>([]);
  const [allLandfills, setAllLandfills] = useState<Landfill[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    const load = () => setAllLandfills(getLandfills());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setGeoState("loading");
    setGeoError(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // In real app: fetch from /api/landfills?lat=x&lng=y
        // For demo, sort mock data
        setGeoState("success");
        setHasSearched(true);
        setLandfills([...allLandfills].sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0)));
      },
      () => {
        setGeoState("error");
        setGeoError(true);
      }
    );
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    const q = searchQuery.toLowerCase();
    const filtered = allLandfills.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
    );
    setLandfills(filtered);
  };

  return (
    <div className="page-container section">
      {/* Header */}
      <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
        {t("eyebrow")}
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.6rem, 5vw, 2.25rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "1.75rem",
        }}
      >
        {t("title")}
      </h1>

      {/* Geolocation CTA */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: "1.25rem" }}
        onClick={handleUseLocation}
        disabled={geoState === "loading"}
        id="btn-use-location"
      >
        {geoState === "loading" ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
            </svg>
            {t("locating")}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
            </svg>
            {t("use_location")}
          </>
        )}
      </button>

      {/* Geo error */}
      {geoError && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--bw-kritis-light)",
            border: "1px solid var(--bw-kritis-mid)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: "var(--bw-kritis)",
          }}
        >
          {t("error_geo")}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--bw-border)" }} />
        <span className="mono-label" style={{ color: "var(--bw-text-3)" }}>
          {t("or")}
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--bw-border)" }} />
      </div>

      {/* Manual search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        <input
          type="text"
          className="input"
          placeholder={t("placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-input"
        />
        <button
          type="submit"
          className="btn btn-outline"
          style={{ flexShrink: 0 }}
          id="btn-search"
        >
          {t("search")}
        </button>
      </form>

      {/* Results */}
      {hasSearched && (
        <>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>
            {t("results_title")}
          </p>

          {landfills.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                background: "var(--bw-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--bw-border)",
              }}
            >
              <TongSampahGauge level={0} size="md" />
              <p style={{ marginTop: "1rem", color: "var(--bw-text-3)", fontSize: "0.9rem" }}>
                {t("no_results")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {landfills.map((lf) => (
                <LandfillCard key={lf.id} landfill={lf} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!hasSearched && (
        <div
          style={{
            padding: "3rem 1rem",
            textAlign: "center",
            color: "var(--bw-text-3)",
          }}
        >
          <TongSampahGauge level={0} size="lg" />
          <p className="mono-label" style={{ marginTop: "1rem", color: "var(--bw-text-3)" }}>
            USE LOCATION OR SEARCH ABOVE
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
