"use client";

import { useTranslations } from "next-intl";

type Status = "low" | "half_full" | "full" | "unknown";

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG = {
  low: { cls: "badge-aman", dot: "var(--bw-aman)", icon: "●" },
  half_full: { cls: "badge-peringatan", dot: "var(--bw-peringatan)", icon: "◑" },
  full: { cls: "badge-kritis", dot: "var(--bw-kritis)", icon: "●" },
  unknown: { cls: "", dot: "var(--bw-text-3)", icon: "○" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("status");
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;

  return (
    <span className={`badge ${config.cls}`} role="status">
      <span style={{ fontSize: "0.5rem", color: config.dot }}>{config.icon}</span>
      {t(status)}
    </span>
  );
}
