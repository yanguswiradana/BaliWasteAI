"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function Header() {
  const t = useTranslations();
  const [locale, setLocale] = useState<"en" | "id">("id");
  const router = useRouter();

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith("locale="))
      ?.split("=")[1];
    if (cookie === "en" || cookie === "id") setLocale(cookie);
  }, []);

  const toggleLocale = async () => {
    const next = locale === "id" ? "en" : "id";
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    setLocale(next);
    router.refresh();
  };

  return (
    <header className="header">
      <div
        className="page-container"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
          id="header-logo"
        >
          {/* Inline mini tong icon */}
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path
              d="M1 4h18l-1.5 17.5H2.5L1 4z"
              fill="var(--bw-aman-light)"
              stroke="var(--bw-aman)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M1 4h18l-1.5 10.5H2.5L1 4z"
              fill="var(--bw-aman)"
              opacity="0.7"
            />
            <rect x="-1" y="2" width="22" height="3" rx="1" fill="var(--bw-aman)" />
            <line x1="10" y1="0" x2="10" y2="2" stroke="var(--bw-aman)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--bw-text)",
              letterSpacing: "-0.02em",
            }}
          >
            BaliWaste
          </span>
        </Link>

        {/* Lang toggle */}
        <button
          onClick={toggleLocale}
          className="btn btn-ghost"
          style={{ minHeight: "36px", padding: "0 0.75rem", gap: "0.35rem" }}
          id="lang-toggle"
          aria-label="Toggle language"
        >
          <span className="mono-label" style={{ color: "var(--bw-text-2)" }}>
            {locale === "id" ? "EN" : "ID"}
          </span>
        </button>
      </div>
    </header>
  );
}
