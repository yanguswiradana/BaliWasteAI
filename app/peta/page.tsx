"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import TongSampahGauge from "@/components/TongSampahGauge";
import { Landfill } from "@/components/LandfillCard";

// Leaflet must be dynamically imported (no SSR)
const BaliMap = dynamic(() => import("@/components/BaliMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "60vh",
        background: "var(--bw-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--bw-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <TongSampahGauge level={50} size="md" />
      <p className="mono-label" style={{ color: "var(--bw-text-3)" }}>LOADING MAP…</p>
    </div>
  ),
});

const REGIONS = ["Denpasar", "Badung", "Gianyar", "Tabanan", "Buleleng", "Karangasem"];

export default function PetaPage() {
  const t = useTranslations("map");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  return (
    <div style={{ padding: "1.5rem 0 2rem" }}>
      <div className="page-container" style={{ marginBottom: "1rem" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>{t("eyebrow")}</p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 5vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "1.25rem",
          }}
        >
          {t("title")}
        </h1>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <select
            className="input"
            style={{ flex: 1, minWidth: "140px" }}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            id="filter-region"
          >
            <option value="all">{t("all_regions")}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            className="input"
            style={{ flex: 1, minWidth: "140px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="filter-status"
          >
            <option value="all">{t("all_statuses")}</option>
            <option value="low">Available</option>
            <option value="half_full">Half Full</option>
            <option value="full">Full</option>
          </select>
        </div>
      </div>

      {/* Map */}
      <div style={{ padding: "0 1.25rem" }}>
        <BaliMap regionFilter={regionFilter} statusFilter={statusFilter} />
      </div>

      {/* Legend */}
      <div className="page-container" style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            padding: "0.75rem 1rem",
            background: "var(--bw-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--bw-border)",
          }}
        >
          {(["low", "half_full", "full"] as const).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
