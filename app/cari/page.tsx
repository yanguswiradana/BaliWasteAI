"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import LandfillCard, { Landfill } from "@/components/LandfillCard";
import TongSampahGauge from "@/components/TongSampahGauge";
import { getLandfills } from "@/lib/landfillsStore";


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
