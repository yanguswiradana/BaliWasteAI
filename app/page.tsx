import { getTranslations } from "next-intl/server";
import Link from "next/link";
import TongSampahGauge from "@/components/TongSampahGauge";
import LandfillCard from "@/components/LandfillCard";
import { Landfill } from "@/components/LandfillCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BaliWasteAI — Know Before You Go",
  description: "Real-time TPS landfill capacity status across Bali. Find the nearest available waste disposal site before making the trip.",
};

// Mock data — replace with Supabase fetch in Phase 2
const MOCK_LANDFILLS: Landfill[] = [
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
];

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "3rem 0 2.5rem",
          borderBottom: "1px solid var(--bw-border)",
        }}
      >
        <div className="page-container">
          {/* Eyebrow */}
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>
            {t("hero.eyebrow")}
          </p>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem, 8vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
              color: "var(--bw-text)",
            }}
          >
            {t("hero.title")}
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--bw-text-2)",
              lineHeight: 1.65,
              maxWidth: "38ch",
              marginBottom: "2rem",
            }}
          >
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "3rem" }}>
            <Link href="/cari" className="btn btn-primary" id="hero-cta-find">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" strokeLinecap="round" />
              </svg>
              {t("hero.cta_find")}
            </Link>
            <Link href="/klasifikasi" className="btn btn-outline" id="hero-cta-classify">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4h16l-2 13H6L4 4z" strokeLinejoin="round" />
                <path d="M4 4H2M20 4h2" strokeLinecap="round" />
                <path d="M12 2v2" strokeLinecap="round" />
              </svg>
              {t("hero.cta_classify")}
            </Link>
          </div>

          {/* Signature Gauge Trio */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: "2rem",
              padding: "2rem 1rem",
              background: "var(--bw-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--bw-border)",
            }}
            aria-label="TPS capacity level examples"
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <TongSampahGauge level={22} size="lg" />
              <div style={{ textAlign: "center" }}>
                <p className="mono-label" style={{ color: "var(--bw-aman)", marginBottom: "0.1rem" }}>RENDAH</p>
                <p style={{ fontSize: "0.75rem", color: "var(--bw-text-3)" }}>22% penuh</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <TongSampahGauge level={55} size="lg" />
              <div style={{ textAlign: "center" }}>
                <p className="mono-label" style={{ color: "var(--bw-peringatan)", marginBottom: "0.1rem" }}>SETENGAH</p>
                <p style={{ fontSize: "0.75rem", color: "var(--bw-text-3)" }}>55% penuh</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <TongSampahGauge level={90} size="lg" />
              <div style={{ textAlign: "center" }}>
                <p className="mono-label" style={{ color: "var(--bw-kritis)", marginBottom: "0.1rem" }}>PENUH</p>
                <p style={{ fontSize: "0.75rem", color: "var(--bw-text-3)" }}>90% penuh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section style={{ padding: "2.5rem 0" }}>
        <div className="page-container">
          <p className="eyebrow" style={{ marginBottom: "1.5rem" }}>
            {t("how.eyebrow")}
          </p>

          <div>
            {[
              {
                label: t("how.step1_label"),
                title: t("how.step1_title"),
                desc: t("how.step1_desc"),
                level: 30,
              },
              {
                label: t("how.step2_label"),
                title: t("how.step2_title"),
                desc: t("how.step2_desc"),
                level: 60,
              },
              {
                label: t("how.step3_label"),
                title: t("how.step3_title"),
                desc: t("how.step3_desc"),
                level: 15,
              },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <TongSampahGauge level={step.level} size="sm" />
                  <div>
                    <p className="mono-label" style={{ color: "var(--bw-text-3)", marginBottom: "0.3rem" }}>
                      {step.label}
                    </p>
                    <h3 style={{ fontSize: "1.05rem", marginBottom: "0.4rem" }}>{step.title}</h3>
                    <p style={{ fontSize: "0.9rem" }}>{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Status Strip ────────────────────────────────── */}
      <section
        style={{
          padding: "2rem 0 3rem",
          borderTop: "1px solid var(--bw-border)",
        }}
      >
        <div className="page-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "1.25rem",
            }}
          >
            <p className="eyebrow">{t("find.results_title")}</p>
            <Link
              href="/cari"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--bw-text-3)",
                textDecoration: "none",
              }}
              id="home-see-all"
            >
              See all →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {MOCK_LANDFILLS.map((lf) => (
              <LandfillCard key={lf.id} landfill={lf} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--bw-border)",
          padding: "1.5rem 0",
        }}
      >
        <div className="page-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="mono-label" style={{ color: "var(--bw-text-3)" }}>
              {t("footer.tagline")}
            </p>
            <p className="mono-label" style={{ color: "var(--bw-text-3)" }}>
              BALI · 2025
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
