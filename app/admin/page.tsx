"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import TongSampahGauge from "@/components/TongSampahGauge";
import StatusBadge from "@/components/StatusBadge";
import { Landfill } from "@/components/LandfillCard";
import { getLandfills, saveLandfills } from "@/lib/landfillsStore";
import { loginAction, checkAuthAction, logoutAction } from "./actions";

const REGIONS = ["Denpasar", "Badung", "Gianyar", "Tabanan", "Buleleng", "Karangasem", "Klungkung", "Bangli", "Jembrana"];


function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

// ─── Google Maps URL → Koordinat ─────────────────────────────
function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    // Pattern 1: @lat,lng,zoom — paling umum di /maps/place/
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    // Pattern 2: ?q=lat,lng atau ?query=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

    // Pattern 3: destination=lat,lng
    const destMatch = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (destMatch) return { lat: parseFloat(destMatch[1]), lng: parseFloat(destMatch[2]) };

    // Pattern 4: ll=lat,lng (format lama)
    const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

    // Pattern 5: /maps/@lat,lng atau standalone lat,lng pair
    const pairMatch = url.match(/(-?\d{1,2}\.\d{3,}),\s*(-?1[01]\d\.\d{3,})/);
    if (pairMatch) return { lat: parseFloat(pairMatch[1]), lng: parseFloat(pairMatch[2]) };

    return null;
  } catch {
    return null;
  }
}

// ─── GmapsInput Component ─────────────────────────────────────
interface GmapsInputProps {
  lat?: number;
  lng?: number;
  onParsed: (lat: number, lng: number) => void;
  inputId?: string;
  error?: string;
}

function GmapsInput({ lat, lng, onParsed, inputId, error }: GmapsInputProps) {
  const [rawUrl, setRawUrl] = useState("");
  const [parseStatus, setParseStatus] = useState<"idle" | "ok" | "fail" | "shortlink" | "resolving">("idle");

  const handleChange = async (val: string) => {
    setRawUrl(val);
    if (!val.trim()) { setParseStatus("idle"); return; }

    // Short link — resolve server-side
    if (val.includes("goo.gl") || val.includes("maps.app.goo.gl")) {
      setParseStatus("resolving");
      try {
        const res = await fetch(`/api/resolve-gmaps?url=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.finalUrl) {
          const result = parseGoogleMapsUrl(data.finalUrl);
          if (result) {
            onParsed(result.lat, result.lng);
            setParseStatus("ok");
            return;
          }
        }
      } catch {}
      setParseStatus("fail");
      return;
    }

    const result = parseGoogleMapsUrl(val);
    if (result) {
      onParsed(result.lat, result.lng);
      setParseStatus("ok");
    } else {
      setParseStatus("fail");
    }
  };

  return (
    <div>
      <input
        className="input"
        type="url"
        value={rawUrl}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tempel link Google Maps di sini…"
        id={inputId}
        style={{ borderColor: parseStatus === "ok" ? "var(--bw-aman)" : parseStatus === "fail" ? "var(--bw-kritis)" : undefined }}
      />

      {/* Status feedback */}
      {parseStatus === "ok" && lat && lng && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.4rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--bw-aman)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Terdeteksi: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.72rem", color: "var(--bw-aman)", textDecoration: "none", fontWeight: 600 }}
          >
            Verifikasi →
          </a>
        </div>
      )}

      {parseStatus === "resolving" && (
        <p style={{ fontSize: "0.72rem", color: "var(--bw-peringatan)", marginTop: "0.4rem" }}>
          ⏳ Membuka short link… tunggu sebentar
        </p>
      )}

      {parseStatus === "fail" && (
        <p style={{ fontSize: "0.72rem", color: "var(--bw-kritis)", marginTop: "0.4rem" }}>
          ⚠ Koordinat tidak terbaca. Pastikan menggunakan link lengkap dari browser.
        </p>
      )}

      {parseStatus === "shortlink" && (
        <p style={{ fontSize: "0.72rem", color: "var(--bw-peringatan)", marginTop: "0.4rem" }}>
          ⚠ Short link (goo.gl) tidak bisa diparse langsung. Buka link dulu di browser → salin URL lengkapnya dari address bar.
        </p>
      )}

      {parseStatus === "idle" && (
        <p style={{ fontSize: "0.72rem", color: "var(--bw-text-3)", marginTop: "0.4rem" }}>
          💡 Tempel link Google Maps (termasuk short link goo.gl) — koordinat diekstrak otomatis
        </p>
      )}

      {error && parseStatus !== "ok" && (
        <p style={{ fontSize: "0.75rem", color: "var(--bw-kritis)", marginTop: "0.2rem" }}>{error}</p>
      )}
    </div>
  );
}

const EMPTY_FORM: Partial<Landfill> = {
  name: "",
  address: "",
  region: "Denpasar",
  status: "low",
  capacity_level: 20,
  notes: "",
  latitude: -8.67,
  longitude: 115.21,
};

// ─── Add TPS Modal ────────────────────────────────────────────
interface AddModalProps {
  onClose: () => void;
  onSave: (lf: Landfill) => void;
}

function AddTPSModal({ onClose, onSave }: AddModalProps) {
  const t = useTranslations("admin");
  const [form, setForm] = useState<Partial<Landfill>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Landfill, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Nama TPS wajib diisi";
    if (!form.address?.trim()) e.address = "Alamat wajib diisi";
    if (!form.latitude || isNaN(Number(form.latitude))) e.latitude = "Latitude tidak valid";
    if (!form.longitude || isNaN(Number(form.longitude))) e.longitude = "Longitude tidak valid";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const statusToLevel: Record<string, number> = { low: 20, half_full: 60, full: 95 };
    const newLf: Landfill = {
      id: String(Date.now()),
      name: form.name!.trim(),
      address: form.address!.trim(),
      region: form.region ?? "Denpasar",
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      status: (form.status as Landfill["status"]) ?? "low",
      capacity_level: statusToLevel[form.status ?? "low"],
      notes: form.notes?.trim() ?? "",
      updated_at: new Date().toISOString(),
    };
    onSave(newLf);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(28,33,29,0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 200,
        }}
      />

      {/* Sheet / Modal */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: "var(--bw-bg)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          borderTop: "1px solid var(--bw-border)",
          zIndex: 201,
          maxHeight: "90svh",
          overflowY: "auto",
          padding: "1.5rem 1.25rem 2.5rem",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Tambah TPS Baru"
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "var(--bw-border-2)",
          margin: "0 auto 1.25rem",
        }} />

        <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>Admin · Tambah TPS</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          TPS Baru
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Nama */}
          <div>
            <label className="mono-label" style={{ color: "var(--bw-text-3)", display: "block", marginBottom: "0.3rem" }}>
              Nama TPS *
            </label>
            <input
              className="input"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Contoh: TPS Seminyak"
              id="add-name"
            />
            {errors.name && <p style={{ fontSize: "0.75rem", color: "var(--bw-kritis)", marginTop: "0.2rem" }}>{errors.name}</p>}
          </div>

          {/* Alamat */}
          <div>
            <label className="mono-label" style={{ color: "var(--bw-text-3)", display: "block", marginBottom: "0.3rem" }}>
              Alamat *
            </label>
            <input
              className="input"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Jl. Raya Seminyak No. 1"
              id="add-address"
            />
            {errors.address && <p style={{ fontSize: "0.75rem", color: "var(--bw-kritis)", marginTop: "0.2rem" }}>{errors.address}</p>}
          </div>

          {/* Wilayah */}
          <div>
            <label className="mono-label" style={{ color: "var(--bw-text-3)", display: "block", marginBottom: "0.3rem" }}>
              Wilayah / Kabupaten
            </label>
            <select
              className="input"
              value={form.region ?? "Denpasar"}
              onChange={(e) => set("region", e.target.value)}
              id="add-region"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mono-label" style={{ color: "var(--bw-text-3)", display: "block", marginBottom: "0.3rem" }}>
              Status Kapasitas
            </label>
            <select
              className="input"
              value={form.status ?? "low"}
              onChange={(e) => set("status", e.target.value)}
              id="add-status"
            >
              <option value="low">Tersedia (Rendah)</option>
              <option value="half_full">Setengah Penuh</option>
              <option value="full">Penuh</option>
            </select>
          </div>

          {/* Koordinat via Google Maps URL */}
          <div>
            <label className="mono-label" style={{ color: "var(--bw-text-3)", display: "block", marginBottom: "0.3rem" }}>
              Koordinat — Tempel Link Google Maps *
            </label>
            <GmapsInput
              lat={form.latitude}
              lng={form.longitude}
              onParsed={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
              inputId="add-gmaps-url"
              error={errors.latitude || errors.longitude}
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="mono-label" style={{ color: "var(--bw-text-3)", display: "block", marginBottom: "0.3rem" }}>
              Catatan (opsional)
            </label>
            <input
              className="input"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Contoh: Truk datang pukul 14.00"
              id="add-notes"
            />
          </div>

          {/* Preview gauge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0.875rem 1rem",
            background: "var(--bw-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--bw-border)",
          }}>
            <TongSampahGauge
              level={form.status === "low" ? 20 : form.status === "half_full" ? 60 : 95}
              size="sm"
            />
            <div>
              <p className="mono-label" style={{ color: "var(--bw-text-3)", marginBottom: "0.15rem" }}>Preview</p>
              <p style={{ fontSize: "0.85rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--bw-text)" }}>
                {form.name || "Nama TPS"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--bw-text-3)" }}>{form.region}</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.5rem" }}>
            <button className="btn btn-aman" style={{ flex: 1 }} onClick={handleSave} id="btn-confirm-add">
              Simpan TPS
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} id="btn-cancel-add">
              Batal
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────
export default function AdminPage() {
  const t = useTranslations("admin");
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [landfills, setLandfills] = useState<Landfill[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Landfill>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Load from shared localStorage store on mount
  useEffect(() => {
    setLandfills(getLandfills());
  }, []);

  // Auto-save to store whenever landfills change
  useEffect(() => {
    if (landfills.length > 0) saveLandfills(landfills);
  }, [landfills]);

  // Check if session cookie exists on mount
  useEffect(() => {
    checkAuthAction().then((isAuth) => {
      if (isAuth) setLoggedIn(true);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Please enter credentials.");
      return;
    }
    const res = await loginAction(email, password);
    if (res.success) {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError(res.error || "Login failed");
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    setLoggedIn(false);
  };

  const handleEdit = (lf: Landfill) => {
    setEditingId(lf.id);
    setEditForm({ ...lf });
  };

  const handleSave = () => {
    if (!editingId) return;
    setLandfills((prev) =>
      prev.map((lf) =>
        lf.id === editingId
          ? { ...lf, ...editForm, updated_at: new Date().toISOString() }
          : lf
      )
    );
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm(t("confirm_delete"))) {
      setLandfills((prev) => prev.filter((lf) => lf.id !== id));
    }
  };

  const handleAddTPS = (newLf: Landfill) => {
    setLandfills((prev) => [newLf, ...prev]);
  };

  // LOGIN SCREEN
  if (!loggedIn) {
    return (
      <div className="page-container" style={{ paddingBlock: "3rem" }}>
        <div style={{
          maxWidth: "380px",
          margin: "0 auto",
          background: "var(--bw-surface)",
          border: "1px solid var(--bw-border)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "0.75rem" }}>
            <TongSampahGauge level={50} size="md" />
            <div style={{ textAlign: "center" }}>
              <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>{t("eyebrow")}</p>
              <h1 style={{ fontSize: "1.35rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                {t("login_title")}
              </h1>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="email"
              className="input"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="admin-email"
            />
            <input
              type="password"
              className="input"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="admin-password"
            />
            {loginError && (
              <p style={{ fontSize: "0.85rem", color: "var(--bw-kritis)" }}>{loginError}</p>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} id="btn-admin-login">
              {t("login")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <>
      {showAddModal && (
        <AddTPSModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTPS}
        />
      )}

      <div className="page-container section">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>{t("eyebrow")}</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700 }}>
              {t("title")}
            </h1>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} id="btn-logout">
            <span className="mono-label">{t("logout")}</span>
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: "0.5rem",
          marginBottom: "1.5rem",
          padding: "0.875rem 1rem",
          background: "var(--bw-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--bw-border)",
          flexWrap: "wrap",
        }}>
          {(["low", "half_full", "full"] as const).map((s) => {
            const count = landfills.filter((l) => l.status === s).length;
            const color = s === "low" ? "var(--bw-aman)" : s === "half_full" ? "var(--bw-peringatan)" : "var(--bw-kritis)";
            const label = s === "low" ? "Tersedia" : s === "half_full" ? "Setengah" : "Penuh";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color }}>{count}</span>
                <span className="mono-label" style={{ color: "var(--bw-text-3)" }}>{label}</span>
              </div>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--bw-text)" }}>{landfills.length}</span>
            <span className="mono-label" style={{ color: "var(--bw-text-3)" }}>Total TPS</span>
          </div>
        </div>

        {/* Add TPS button */}
        <button
          className="btn btn-aman"
          style={{ marginBottom: "1.5rem", width: "100%" }}
          onClick={() => setShowAddModal(true)}
          id="btn-add-tps"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
          {t("add_tps")}
        </button>

        {/* Landfill list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {landfills.map((lf) => (
            <div key={lf.id} className="card" style={{ padding: "1rem" }}>
              {editingId === lf.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <input className="input" value={editForm.name ?? ""} placeholder={t("tps_name")}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} id={`edit-name-${lf.id}`} />
                  <input className="input" value={editForm.address ?? ""} placeholder={t("address")}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} id={`edit-address-${lf.id}`} />
                  <select className="input" value={editForm.status ?? "low"}
                    onChange={(e) => {
                      const s = e.target.value as Landfill["status"];
                      const lvl = s === "low" ? 25 : s === "half_full" ? 60 : 95;
                      setEditForm((f) => ({ ...f, status: s, capacity_level: lvl }));
                    }} id={`edit-status-${lf.id}`}>
                    <option value="low">Tersedia (Rendah)</option>
                    <option value="half_full">Setengah Penuh</option>
                    <option value="full">Penuh</option>
                  </select>
                  <input className="input" value={editForm.notes ?? ""} placeholder={t("capacity_notes")}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} id={`edit-notes-${lf.id}`} />

                  {/* Koordinat via Google Maps URL */}
                  <div>
                    <p className="mono-label" style={{ color: "var(--bw-text-3)", marginBottom: "0.35rem" }}>
                      Koordinat — Tempel Link Google Maps
                    </p>
                    <GmapsInput
                      lat={editForm.latitude}
                      lng={editForm.longitude}
                      onParsed={(lat, lng) => setEditForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
                      inputId={`edit-gmaps-${lf.id}`}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} id={`btn-save-${lf.id}`}>{t("save")}</button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingId(null)} id={`btn-cancel-${lf.id}`}>{t("cancel")}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <TongSampahGauge level={lf.capacity_level} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div>
                        <p className="eyebrow" style={{ marginBottom: "0.15rem" }}>{lf.region}</p>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--bw-text)", marginBottom: "0.35rem" }}>
                          {lf.name}
                        </p>
                      </div>
                      <StatusBadge status={lf.status} />
                    </div>
                    <p className="mono-label" style={{ color: "var(--bw-text-3)", marginBottom: "0.5rem" }}>
                      {t("updated_by")} admin · {formatDate(lf.updated_at)}
                    </p>
                    {lf.notes && (
                      <p style={{ fontSize: "0.8rem", color: "var(--bw-text-3)", marginBottom: "0.5rem", fontStyle: "italic" }}>
                        {lf.notes}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.8rem", minHeight: "40px" }}
                        onClick={() => handleEdit(lf)} id={`btn-edit-${lf.id}`}>{t("edit")}</button>
                      <button className="btn" style={{
                        flex: 1, fontSize: "0.8rem", minHeight: "40px",
                        background: "var(--bw-kritis-light)", color: "var(--bw-kritis)",
                        border: "1px solid var(--bw-kritis-mid)",
                      }} onClick={() => handleDelete(lf.id)} id={`btn-delete-${lf.id}`}>{t("delete")}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
