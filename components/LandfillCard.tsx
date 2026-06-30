"use client";

import { useTranslations } from "next-intl";
import StatusBadge from "./StatusBadge";
import TongSampahGauge from "./TongSampahGauge";

export interface Landfill {
  id: string;
  name: string;
  address: string;
  region: string;
  latitude: number;
  longitude: number;
  status: "low" | "half_full" | "full" | "unknown";
  capacity_level: number; // 0–100
  notes?: string;
  updated_at?: string;
  distance_km?: number;
}

interface LandfillCardProps {
  landfill: Landfill;
  compact?: boolean;
}

function formatDistance(km?: number): string {
  if (km === undefined) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatUpdated(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString();
}

export default function LandfillCard({ landfill, compact = false }: LandfillCardProps) {
  const t = useTranslations("find");

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${landfill.latitude},${landfill.longitude}`;

  const isFull = landfill.status === "full";

  return (
    <article
      className="card"
      style={{
        opacity: isFull ? 0.65 : 1,
        transition: "opacity 120ms ease",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        {/* Tong Sampah Gauge — Signature Element */}
        <div style={{ flexShrink: 0, paddingTop: "0.2rem" }}>
          <TongSampahGauge level={landfill.capacity_level} size="sm" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <div style={{ minWidth: 0 }}>
              <p className="eyebrow" style={{ marginBottom: "0.2rem" }}>
                {landfill.region}
              </p>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: compact ? "nowrap" : "normal",
                }}
              >
                {landfill.name}
              </h3>
            </div>
            <StatusBadge status={landfill.status} />
          </div>

          {/* Address */}
          {!compact && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--bw-text-3)",
                marginBottom: "0.5rem",
                lineHeight: 1.4,
              }}
            >
              {landfill.address}
            </p>
          )}

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            {landfill.distance_km !== undefined && (
              <span className="mono-label" style={{ color: "var(--bw-text-3)" }}>
                {formatDistance(landfill.distance_km)} {t("distance")}
              </span>
            )}
            {landfill.updated_at && (
              <span className="mono-label" style={{ color: "var(--bw-text-3)" }}>
                {t("last_updated")} {formatUpdated(landfill.updated_at)}
              </span>
            )}
            <span className="mono-label" style={{ color: "var(--bw-text-3)" }}>
              {landfill.capacity_level}% full
            </span>
          </div>

          {/* Notes */}
          {landfill.notes && !compact && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--bw-text-3)",
                padding: "0.5rem 0.75rem",
                background: "var(--bw-surface-2)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "0.75rem",
                fontStyle: "italic",
              }}
            >
              <span className="mono-label" style={{ color: "var(--bw-text-3)", fontStyle: "normal", marginRight: "0.4rem" }}>
                {t("notes")}:
              </span>
              {landfill.notes}
            </p>
          )}

          {/* CTA */}
          {!isFull && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ width: "100%", fontSize: "0.85rem", minHeight: "44px" }}
              id={`directions-${landfill.id}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              {t("directions")}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
