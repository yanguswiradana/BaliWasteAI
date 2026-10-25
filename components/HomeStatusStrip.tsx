"use client";

import { useEffect, useState } from "react";
import LandfillCard, { Landfill } from "./LandfillCard";
import { getLandfills } from "@/lib/landfillsStore";

// Live status strip for the homepage — reads the shared store so admin edits show up.
export default function HomeStatusStrip() {
  const [landfills, setLandfills] = useState<Landfill[]>([]);

  useEffect(() => {
    const load = () => setLandfills(getLandfills().slice(0, 3));
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {landfills.map((lf) => (
        <LandfillCard key={lf.id} landfill={lf} />
      ))}
    </div>
  );
}
