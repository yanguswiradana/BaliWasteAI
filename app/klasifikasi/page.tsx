"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState, useCallback, useEffect } from "react";
import TongSampahGauge from "@/components/TongSampahGauge";

type Classification = "organic" | "non_organic" | "uncertain" | null;

interface ClassifyResult {
  classification: Classification;
  confidence: number;
  tip: string;
}

const RESULT_STYLES: Record<
  NonNullable<Classification>,
  { cls: string; color: string; gaugeLevel: number }
> = {
  organic: { cls: "result-card-organic", color: "var(--bw-aman)", gaugeLevel: 20 },
  non_organic: { cls: "result-card-nonorganic", color: "var(--bw-peringatan)", gaugeLevel: 55 },
  uncertain: { cls: "result-card-uncertain", color: "var(--bw-text-3)", gaugeLevel: 50 },
};

// ─── Image Compression Utility (Token Saver) ───────────────────
async function compressImage(file: File, maxDim = 512): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) resolve(file);
          else resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.8 // 80% quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}


// ─── WebRTC Camera Component ──────────────────────────────────
interface CameraViewfinderProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

function CameraViewfinder({ onCapture, onClose }: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCamIndex, setCurrentCamIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (modeOrDeviceId: string) => {
    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setReady(false);
    setError(null);
    try {
      const isDeviceId = modeOrDeviceId !== "environment" && modeOrDeviceId !== "user";
      
      const constraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      if (isDeviceId) {
        constraints.deviceId = { exact: modeOrDeviceId };
      } else {
        constraints.facingMode = modeOrDeviceId;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setReady(true);
        };
      }

      // After permission is granted, enumerate devices to find all cameras (e.g. virtual cameras)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
      
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Akses kamera ditolak. Izinkan kamera di pengaturan browser kamu.");
      } else if (err.name === "NotFoundError") {
        setError("Kamera tidak ditemukan di perangkat ini.");
      } else {
        setError("Gagal membuka kamera. Coba refresh halaman.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera("environment");
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleFlip = () => {
    if (cameras.length > 1) {
      // Cycle through available devices (supports laptop webcam + virtual Android camera)
      const nextIndex = (currentCamIndex + 1) % cameras.length;
      setCurrentCamIndex(nextIndex);
      startCamera(cameras[nextIndex].deviceId);
    } else {
      // Fallback for simple mobile browsers
      const next = facingMode === "environment" ? "user" : "environment";
      setFacingMode(next);
      startCamera(next);
    }
  };

  const handleShoot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      
      // Compress the captured image before yielding
      const compressed = await compressImage(file);
      onCapture(compressed);
    }, "image/jpeg", 0.92);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "#0a0e0b",
        zIndex: 300,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 1.25rem",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
      }}>
        <button
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onClose();
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "0.5rem" }}
          id="btn-close-camera"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
          </svg>
        </button>

        {cameras.length > 1 ? (
          <select
            value={cameras[currentCamIndex]?.deviceId || ""}
            onChange={(e) => {
              const deviceId = e.target.value;
              const idx = cameras.findIndex(c => c.deviceId === deviceId);
              if (idx !== -1) setCurrentCamIndex(idx);
              startCamera(deviceId);
            }}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
              padding: "0.4rem 0.6rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              outline: "none",
              maxWidth: "55%",
              textOverflow: "ellipsis",
            }}
          >
            {cameras.map((cam, i) => (
              <option key={cam.deviceId} value={cam.deviceId} style={{ color: "#000" }}>
                {cam.label || `Kamera ${i + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
            Kamera · BaliWasteAI
          </span>
        )}

        {/* Flip camera */}
        <button
          onClick={handleFlip}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "0.5rem" }}
          id="btn-flip-camera"
          aria-label="Ganti kamera"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: ready ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        />

        {/* Corner guides */}
        {ready && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "70%", aspectRatio: "4/3", position: "relative" }}>
              {[
                { top: 0, left: 0, borderTop: "2px solid rgba(255,255,255,0.7)", borderLeft: "2px solid rgba(255,255,255,0.7)", borderRadius: "4px 0 0 0" },
                { top: 0, right: 0, borderTop: "2px solid rgba(255,255,255,0.7)", borderRight: "2px solid rgba(255,255,255,0.7)", borderRadius: "0 4px 0 0" },
                { bottom: 0, left: 0, borderBottom: "2px solid rgba(255,255,255,0.7)", borderLeft: "2px solid rgba(255,255,255,0.7)", borderRadius: "0 0 0 4px" },
                { bottom: 0, right: 0, borderBottom: "2px solid rgba(255,255,255,0.7)", borderRight: "2px solid rgba(255,255,255,0.7)", borderRadius: "0 0 4px 0" },
              ].map((style, i) => (
                <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style }} />
              ))}
            </div>
          </div>
        )}

        {/* Loading / error overlay */}
        {!ready && !error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <TongSampahGauge level={50} size="md" />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
              Membuka kamera…
            </p>
          </div>
        )}

        {error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", gap: "1rem" }}>
            <div style={{ fontSize: "2rem" }}>📷</div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", lineHeight: 1.6 }}>{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="btn btn-outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
              id="btn-retry-camera"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>

      {/* Bottom: shutter */}
      <div style={{
        padding: "1.5rem",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Shutter button */}
        <button
          onClick={handleShoot}
          disabled={!ready}
          id="btn-shutter"
          aria-label="Ambil foto"
          style={{
            width: 72, height: 72,
            borderRadius: "50%",
            background: ready ? "#fff" : "rgba(255,255,255,0.3)",
            border: "3px solid rgba(255,255,255,0.5)",
            cursor: ready ? "pointer" : "not-allowed",
            transition: "transform 120ms ease, background 120ms ease",
            boxShadow: ready ? "0 0 0 6px rgba(255,255,255,0.12)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            width: 54, height: 54,
            borderRadius: "50%",
            background: ready ? "var(--bw-text)" : "rgba(255,255,255,0.2)",
            transition: "background 120ms ease",
          }} />
        </button>
      </div>

      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

// ─── Main Klasifikasi Page ────────────────────────────────────
export default function KlasifikasiPage() {
  const t = useTranslations("classify");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleFile = async (f: File) => {
    // Tampilkan state loading jika file besar, karena kompresi butuh waktu per sekian milidetik
    const compressed = await compressImage(f);
    setFile(compressed);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(compressed);
    setPreview(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const handleCameraCapture = (capturedFile: File) => {
    setShowCamera(false);
    handleFile(capturedFile);
  };

  const handleClassify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("locale", locale);
      const res = await fetch("/api/classify", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resultStyle = result?.classification ? RESULT_STYLES[result.classification] : null;

  return (
    <>
      {/* WebRTC Camera Fullscreen */}
      {showCamera && (
        <CameraViewfinder
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="page-container section">
        {/* Page header */}
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>{t("eyebrow")}</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.6rem, 5vw, 2.25rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "0.5rem",
        }}>
          {t("title")}
        </h1>
        <p style={{ marginBottom: "2rem", fontSize: "0.95rem" }}>{t("subtitle")}</p>

        {!result && (
          <>
            {/* Drop Zone */}
            <div
              className={`upload-zone${dragOver ? " drag-over" : ""}`}
              onClick={() => !preview && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && !preview && fileInputRef.current?.click()}
              id="upload-dropzone"
              style={{ cursor: preview ? "default" : "pointer" }}
            >
              {preview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      maxHeight: "240px", maxWidth: "100%",
                      borderRadius: "var(--radius-md)",
                      objectFit: "contain",
                      margin: "0 auto", display: "block",
                    }}
                  />
                  {/* Remove preview button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    style={{
                      position: "absolute", top: -8, right: -8,
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--bw-text)", color: "var(--bw-bg)",
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    id="btn-remove-preview"
                    aria-label="Hapus foto"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                  <TongSampahGauge level={0} size="md" />
                  <p className="mono-label" style={{ color: "var(--bw-text-3)" }}>
                    {t("upload")} · drag & drop
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--bw-text-3)" }}>JPG · PNG · WEBP</p>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleInputChange}
              id="file-upload-input"
            />

            {/* Action buttons — stacked, full-width */}
            {!preview && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginTop: "1rem" }}>
                <button
                  className="btn btn-outline"
                  style={{ width: "100%" }}
                  onClick={() => fileInputRef.current?.click()}
                  id="btn-upload-photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t("upload")}
                </button>

                {/* WebRTC Camera button */}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => setShowCamera(true)}
                  id="btn-open-camera"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {t("capture")}
                </button>
              </div>
            )}

            {/* Classify button — show when file selected */}
            {file && !loading && (
              <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.875rem" }}>
                <button
                  className="btn btn-aman"
                  style={{ flex: 1 }}
                  onClick={handleClassify}
                  id="btn-classify"
                >
                  Klasifikasi sekarang →
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleReset}
                  id="btn-retake"
                  style={{ flexShrink: 0, minWidth: 52, padding: "0 0.75rem" }}
                  aria-label="Ambil ulang foto"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{
                marginTop: "1.5rem", padding: "1.5rem",
                background: "var(--bw-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--bw-border)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
              }}>
                <TongSampahGauge level={50} size="md" />
                <p className="mono-label" style={{ color: "var(--bw-text-3)" }}>{t("analyzing")}</p>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton" style={{ height: "14px", width: "60%" }} />
                  <div className="skeleton" style={{ height: "14px", width: "80%" }} />
                  <div className="skeleton" style={{ height: "14px", width: "45%" }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                marginTop: "1rem", padding: "1rem",
                background: "var(--bw-kritis-light)",
                border: "1px solid var(--bw-kritis-mid)",
                borderRadius: "var(--radius-md)",
                color: "var(--bw-kritis)", fontSize: "0.9rem",
              }}>
                {error}
              </div>
            )}
          </>
        )}

        {/* Result Card */}
        {result && resultStyle && (
          <div className={`card ${resultStyle.cls}`} role="region" aria-label="Classification result" id="classify-result">
            {preview && (
              <img src={preview} alt="Classified item" style={{
                width: "100%", height: "180px", objectFit: "cover",
                borderRadius: "var(--radius-md)", marginBottom: "1rem",
              }} />
            )}
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <TongSampahGauge level={resultStyle.gaugeLevel} size="sm" />
              <div style={{ flex: 1 }}>
                <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>{t("eyebrow")}</p>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontSize: "1.35rem",
                  fontWeight: 700, color: resultStyle.color, marginBottom: "0.5rem",
                }}>
                  {result.classification === "organic" ? t("result_organic")
                    : result.classification === "non_organic" ? t("result_nonorganic")
                    : t("result_uncertain")}
                </h2>
                <p className="mono-label" style={{ color: "var(--bw-text-3)", marginBottom: "0.75rem" }}>
                  {t("confidence")}: {Math.round(result.confidence * 100)}%
                </p>
                <p style={{ fontSize: "0.9rem", color: "var(--bw-text-2)", lineHeight: 1.65 }}>
                  {result.tip}
                </p>
              </div>
            </div>
            <button className="btn btn-outline" style={{ width: "100%", marginTop: "1.25rem" }}
              onClick={handleReset} id="btn-classify-again">
              {t("try_again")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
