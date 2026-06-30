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
          <img 
            src="/logo.png" 
            alt="BaliWasteAI Logo" 
            style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }} 
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--bw-text)",
              letterSpacing: "-0.02em",
            }}
          >
            BaliWasteAI
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
