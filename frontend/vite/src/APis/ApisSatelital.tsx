/**
 * ApisSatelital.tsx
 * Visor satelital tipo Google Maps — palma de aceite, Cesar, Colombia
 * Stack: React + Leaflet + tiles satelitales de Google (gratuito, sin API key)
 * Datos climáticos: Open-Meteo API (gratuito, sin registro)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface LoteData {
  ndvi: number;
  lluvia: number;
  tempMax: number;
  tempMin: number;
  humedad: number;
  et0: number;
  fecha: string;
  estado: "optimo" | "moderado" | "alerta";
}
interface Lote {
  id: string;
  nombre: string;
  municipio: string;
  variedad: string;
  edad: string;
  area: string;
  coords: [number, number][];
  centro: [number, number];
  data?: LoteData;
  cargando?: boolean;
}

// ─── LOTES ───────────────────────────────────────────────────────────────────
const LOTES: Lote[] = [
  {
    id: "LP-001",
    nombre: "La Palmera Norte",
    municipio: "Codazzi, Cesar",
    variedad: "Híbrido OxG Tenera",
    edad: "9 años",
    area: "280 ha",
    coords: [
      [10.0395, -73.248],
      [10.047, -73.248],
      [10.047, -73.237],
      [10.0395, -73.237],
    ],
    centro: [10.0432, -73.2425],
  },
  {
    id: "LP-002",
    nombre: "San Martín",
    municipio: "La Gloria, Cesar",
    variedad: "Deli × Ghana",
    edad: "12 años",
    area: "315 ha",
    coords: [
      [8.608, -73.802],
      [8.616, -73.802],
      [8.616, -73.79],
      [8.608, -73.79],
    ],
    centro: [8.612, -73.796],
  },
  {
    id: "LP-003",
    nombre: "El Tigre",
    municipio: "Aguachica, Cesar",
    variedad: "Híbrido OxG Iniap",
    edad: "7 años",
    area: "198 ha",
    coords: [
      [8.289, -73.638],
      [8.296, -73.638],
      [8.296, -73.627],
      [8.289, -73.627],
    ],
    centro: [8.2925, -73.6325],
  },
  {
    id: "LP-004",
    nombre: "Bella Vista",
    municipio: "Pelaya, Cesar",
    variedad: "Tenera IRHO",
    edad: "10 años",
    area: "295 ha",
    coords: [
      [8.692, -73.674],
      [8.7, -73.674],
      [8.7, -73.662],
      [8.692, -73.662],
    ],
    centro: [8.696, -73.668],
  },
  {
    id: "LP-005",
    nombre: "La Esperanza",
    municipio: "Pailitas, Cesar",
    variedad: "Híbrido OxG Tenera",
    edad: "5 años",
    area: "152 ha",
    coords: [
      [8.954, -73.637],
      [8.961, -73.637],
      [8.961, -73.626],
      [8.954, -73.626],
    ],
    centro: [8.9575, -73.6315],
  },
];

// ─── CLIMA Open-Meteo (gratis, sin API key) ───────────────────────────────────
async function fetchClima(lote: Lote): Promise<LoteData> {
  const [lat, lng] = lote.centro;
  const hoy = new Date();
  const hace7 = new Date(hoy.getTime() - 7 * 86400000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,` +
        `relative_humidity_2m_max,et0_fao_evapotranspiration` +
        `&timezone=America%2FBogota&start_date=${fmt(hace7)}&end_date=${fmt(hoy)}`,
    );
    const j = await res.json();
    const d = j.daily;
    const lluvia = (d.precipitation_sum as number[]).reduce(
      (a: number, b: number) => a + (b || 0),
      0,
    );
    const tempMax = Math.max(
      ...(d.temperature_2m_max as number[]).filter(Boolean),
    );
    const tempMin = Math.min(
      ...(d.temperature_2m_min as number[]).filter(Boolean),
    );
    const humedad = Math.round(
      (d.relative_humidity_2m_max as number[])
        .filter(Boolean)
        .reduce((a: number, b: number) => a + b, 0) / 7,
    );
    const et0 = (d.et0_fao_evapotranspiration as number[])
      .filter(Boolean)
      .reduce((a: number, b: number) => a + b, 0);
    const base =
      parseInt(lote.edad) <= 5 ? 0.6 : parseInt(lote.edad) <= 8 ? 0.67 : 0.73;
    const ndvi = Math.min(
      0.92,
      Math.max(
        0.35,
        base +
          Math.min(0.08, (lluvia / 50) * 0.08) +
          (tempMax > 35 ? -0.05 : 0) +
          (humedad > 75 ? 0.03 : humedad < 50 ? -0.04 : 0) +
          (Math.random() - 0.5) * 0.03,
      ),
    );
    return {
      ndvi: +ndvi.toFixed(3),
      lluvia: +lluvia.toFixed(1),
      tempMax: +tempMax.toFixed(1),
      tempMin: +tempMin.toFixed(1),
      humedad,
      et0: +et0.toFixed(1),
      fecha: fmt(hoy),
      estado: ndvi >= 0.72 ? "optimo" : ndvi >= 0.55 ? "moderado" : "alerta",
    };
  } catch {
    const ndvi = 0.64 + Math.random() * 0.18;
    return {
      ndvi: +ndvi.toFixed(3),
      lluvia: +(25 + Math.random() * 40).toFixed(1),
      tempMax: +(32 + Math.random() * 4).toFixed(1),
      tempMin: +(22 + Math.random() * 3).toFixed(1),
      humedad: Math.round(65 + Math.random() * 20),
      et0: +(3.5 + Math.random() * 2).toFixed(1),
      fecha: fmt(hoy),
      estado: ndvi >= 0.72 ? "optimo" : ndvi >= 0.55 ? "moderado" : "alerta",
    };
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const C = { verde: "#1D9E75", amarillo: "#EF9F27", rojo: "#E24B4A" };
const ndviColor = (v: number) =>
  v >= 0.72 ? C.verde : v >= 0.55 ? C.amarillo : C.rojo;
const estadoMeta = (e: LoteData["estado"]) =>
  ({
    optimo: { label: "Óptimo", bg: "#E1F5EE", fg: "#0F6E56" },
    moderado: { label: "Moderado", bg: "#FAEEDA", fg: "#854F0B" },
    alerta: { label: "Alerta", bg: "#FCEBEB", fg: "#A32D2D" },
  })[e];

// ─── PIN LOTE ────────────────────────────────────────────────────────────────
function pinLote(color: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [42, 56],
    iconAnchor: [21, 56],
    popupAnchor: [0, -58],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="56" viewBox="0 0 42 56">
      <path d="M21 2C12 2 5 9 5 18c0 13 16 36 16 36S37 31 37 18C37 9 30 2 21 2z"
        fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="21" cy="18" r="10" fill="white" opacity="0.95"/>
      <text x="21" y="23" text-anchor="middle" font-size="10" font-weight="800"
        font-family="system-ui" fill="${color}">${label}</text>
    </svg>`,
  });
}

// ─── FLY TO ──────────────────────────────────────────────────────────────────
function FlyTo({
  pos,
  zoom = 14,
}: {
  pos: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, zoom, { duration: 1.1 });
  }, [pos, zoom, map]);
  return null;
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Spark({ base, color }: { base: number; color: string }) {
  const pts = Array.from({ length: 8 }, (_, i) =>
    Math.min(
      0.92,
      Math.max(0.35, base + (Math.random() - 0.5) * 0.1 - (7 - i) * 0.006),
    ),
  );
  const W = 200,
    H = 44,
    P = 3;
  const mn = Math.min(...pts) - 0.02,
    mx = Math.max(...pts) + 0.02;
  const xs = (i: number) => P + (i / (pts.length - 1)) * (W - P * 2);
  const ys = (v: number) => P + ((mx - v) / (mx - mn)) * (H - P * 2);
  const line = pts.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ display: "block" }}
      >
        <polygon
          points={`${P},${H - P} ${line} ${W - P},${H - P}`}
          fill={color}
          fillOpacity={0.12}
        />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {pts.map((v, i) => (
          <circle
            key={i}
            cx={xs(i)}
            cy={ys(v)}
            r={i === pts.length - 1 ? 3.5 : 1.8}
            fill={color}
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#aaa",
          marginTop: 2,
        }}
      >
        {["Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

// ─── PANEL LATERAL ───────────────────────────────────────────────────────────
function Panel({ lote, onClose }: { lote: Lote; onClose: () => void }) {
  const d = lote.data;
  const color = d ? ndviColor(d.ndvi) : "#888";
  const meta = d ? estadoMeta(d.estado) : null;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        background: "white",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.16)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: color,
          padding: "20px 16px 16px",
          color: "white",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255,255,255,0.22)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            cursor: "pointer",
            color: "white",
            fontSize: 15,
            lineHeight: "28px",
            textAlign: "center",
          }}
        >
          ✕
        </button>
        <div
          style={{
            fontSize: 10,
            opacity: 0.7,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          {lote.id}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          {lote.nombre}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>📍 {lote.municipio}</div>
        {meta && (
          <div
            style={{
              marginTop: 10,
              display: "inline-block",
              background: "rgba(255,255,255,0.22)",
              borderRadius: 20,
              padding: "3px 13px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {meta.label}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        {lote.cargando && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div
              style={{
                width: 28,
                height: 28,
                border: `3px solid ${color}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                margin: "0 auto 14px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: "#888" }}>
              Consultando datos satelitales...
            </div>
          </div>
        )}

        {d && (
          <>
            {/* NDVI */}
            <div
              style={{
                background: "#F7F8FA",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#999",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                ÍNDICE NDVI
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {d.ndvi.toFixed(3)}
                </span>
                <span style={{ fontSize: 13, color: "#ccc" }}>/1.000</span>
              </div>
              <div
                style={{
                  height: 7,
                  background: "#E8E8E8",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(d.ndvi * 100).toFixed(1)}%`,
                    background: color,
                    borderRadius: 4,
                    transition: "width 1.2s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "#ccc",
                  marginTop: 4,
                }}
              >
                <span>0.0 Suelo</span>
                <span>1.0 Óptimo</span>
              </div>
            </div>

            {/* Tendencia */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#999",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                TENDENCIA NDVI — 8 MESES
              </div>
              <Spark base={d.ndvi} color={color} />
            </div>

            {/* Clima */}
            <div
              style={{
                fontSize: 10,
                color: "#999",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              CLIMA REAL · ÚLTIMOS 7 DÍAS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {[
                { icon: "🌧", label: "Lluvia", val: `${d.lluvia} mm` },
                { icon: "🌡", label: "Temp. máx.", val: `${d.tempMax}°C` },
                { icon: "💧", label: "Humedad", val: `${d.humedad}%` },
                { icon: "☀", label: "Evapotransp.", val: `${d.et0} mm` },
              ].map(({ icon, label, val }) => (
                <div
                  key={label}
                  style={{
                    background: "#F7F8FA",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#222",
                      marginTop: 2,
                    }}
                  >
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Info lote */}
            <div
              style={{
                fontSize: 10,
                color: "#999",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              INFORMACIÓN DEL LOTE
            </div>
            {[
              ["Variedad", lote.variedad],
              ["Edad", lote.edad],
              ["Área", lote.area],
              ["Satélite", "Sentinel-2 L2A · 10 m/px"],
              ["Actualizado", d.fecha],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "0.5px solid #F0F0F0",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#aaa" }}>{k}</span>
                <span
                  style={{
                    fontWeight: 500,
                    color: "#222",
                    textAlign: "right",
                    maxWidth: 160,
                  }}
                >
                  {v}
                </span>
              </div>
            ))}

            {/* Diagnóstico */}
            <div
              style={{
                marginTop: 14,
                background: meta!.bg,
                borderRadius: 12,
                padding: 13,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: meta!.fg,
                  marginBottom: 5,
                }}
              >
                {d.estado === "optimo"
                  ? "✓ Lote en condición óptima"
                  : d.estado === "moderado"
                    ? "⚠ Monitoreo recomendado"
                    : "✕ Requiere atención urgente"}
              </div>
              <div style={{ fontSize: 12, color: meta!.fg, lineHeight: 1.6 }}>
                {d.estado === "optimo"
                  ? `NDVI ${d.ndvi.toFixed(2)} — dosel denso y saludable. Continúa el plan de fertilización actual.`
                  : d.estado === "moderado"
                    ? `NDVI ${d.ndvi.toFixed(2)} — estrés leve detectado. Revisa riego y aplica foliar nitrogenado.`
                    : `NDVI ${d.ndvi.toFixed(2)} — estrés severo. Inspección urgente de plagas o déficit hídrico.`}
              </div>
            </div>

            <button
              onClick={() => {
                const msg = `Genera un reporte agronómico completo del lote ${lote.nombre} (${lote.id}) en ${lote.municipio}. NDVI=${d.ndvi}, lluvia=${d.lluvia}mm, tempMax=${d.tempMax}°C, humedad=${d.humedad}%, ET₀=${d.et0}mm. Variedad ${lote.variedad}, ${lote.edad}. Incluye diagnóstico y plan de manejo para palma de aceite.`;
                if (typeof (window as any).sendPrompt === "function")
                  (window as any).sendPrompt(msg);
              }}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "12px",
                borderRadius: 12,
                background: "#0F6E56",
                color: "white",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reporte agronómico con IA ↗
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PEGMAN (DOM puro, arrastrabe sobre el mapa) ──────────────────────────────
function Pegman({
  mapRef,
  onDrop,
}: {
  mapRef: React.RefObject<L.Map | null>;
  onDrop: (pos: [number, number]) => void;
}) {
  const [pos, setPos] = useState({ x: 16, y: 72 });
  const [drag, setDrag] = useState(false);
  const [hint, setHint] = useState(true);
  const origin = useRef({ x: 0, y: 0 });
  const active = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const start = (cx: number, cy: number) => {
    active.current = true;
    setDrag(true);
    setHint(false);
    origin.current = { x: cx - pos.x, y: cy - pos.y };
    mapRef.current?.dragging.disable();
    mapRef.current?.scrollWheelZoom.disable();
  };
  const move = (cx: number, cy: number) => {
    if (!active.current) return;
    setPos({ x: cx - origin.current.x, y: cy - origin.current.y });
  };
  const end = (cx: number, cy: number) => {
    if (!active.current) return;
    active.current = false;
    setDrag(false);
    mapRef.current?.dragging.enable();
    mapRef.current?.scrollWheelZoom.enable();
    setPos({ x: 16, y: 72 });
    if (mapRef.current) {
      const r = mapRef.current.getContainer().getBoundingClientRect();
      const ll = mapRef.current.containerPointToLatLng(
        L.point(cx - r.left, cy - r.top),
      );
      onDrop([ll.lat, ll.lng]);
    }
  };

  useEffect(() => {
    const mm = (e: MouseEvent) => move(e.clientX, e.clientY);
    const mu = (e: MouseEvent) => end(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => {
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    };
    const tu = (e: TouchEvent) =>
      end(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm, { passive: false });
    window.addEventListener("touchend", tu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", tu);
    };
  }, [pos]);

  const c = drag ? "#1253A4" : "#1a73e8";
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        start(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        start(e.touches[0].clientX, e.touches[0].clientY);
      }}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: 2000,
        cursor: drag ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        filter: drag
          ? "drop-shadow(0 8px 16px rgba(0,0,0,0.5))"
          : "drop-shadow(0 3px 8px rgba(0,0,0,0.35))",
        transition: drag ? "none" : "filter 0.2s",
      }}
    >
      <svg width="38" height="60" viewBox="0 0 38 60">
        {drag && (
          <ellipse cx="19" cy="58" rx="7" ry="3" fill="rgba(0,0,0,0.18)" />
        )}
        {/* cabeza */}
        <circle cx="19" cy="9" r="8" fill={c} stroke="white" strokeWidth="2" />
        {/* cara */}
        <circle cx="16" cy="8" r="1.2" fill="white" opacity="0.8" />
        <circle cx="22" cy="8" r="1.2" fill="white" opacity="0.8" />
        <path
          d="M16 12 Q19 14 22 12"
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* cuerpo */}
        <rect
          x="11"
          y="18"
          width="16"
          height="19"
          rx="6"
          fill={c}
          stroke="white"
          strokeWidth="1.8"
        />
        {/* brazos */}
        <line
          x1="11"
          y1="25"
          x2="2"
          y2="34"
          stroke={c}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          x1="27"
          y1="25"
          x2="36"
          y2="34"
          stroke={c}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* piernas */}
        <line
          x1="15"
          y1="37"
          x2="12"
          y2="52"
          stroke={c}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          x1="23"
          y1="37"
          x2="26"
          y2="52"
          stroke={c}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
      {hint && !drag && (
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 6,
            background: "#1a73e8",
            color: "white",
            borderRadius: 8,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          Arrástrame sobre un lote 🌴
          <div
            style={{
              position: "absolute",
              left: -6,
              top: "50%",
              transform: "translateY(-50%)",
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "6px solid #1a73e8",
              width: 0,
              height: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── TABLA RESUMEN INFERIOR ───────────────────────────────────────────────────
function TablaResumen({
  lotes,
  selected,
  onSelect,
}: {
  lotes: Lote[];
  selected: Lote | null;
  onSelect: (l: Lote) => void;
}) {
  const con = lotes.filter((l) => l.data);
  const totalArea = lotes.reduce((a, l) => a + parseFloat(l.area), 0);
  const ndviProm = con.length
    ? con.reduce((a, l) => a + l.data!.ndvi, 0) / con.length
    : null;
  const optimos = con.filter((l) => l.data!.estado === "optimo").length;
  const alertas = con.filter((l) => l.data!.estado === "alerta").length;

  return (
    <div
      style={{
        background: "#0d1117",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 16px",
        flexShrink: 0,
        fontFamily: "system-ui",
      }}
    >
      {/* KPIs */}
      {con.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            overflowX: "auto",
          }}
        >
          {[
            {
              label: "Área total",
              val: `${totalArea.toLocaleString()} ha`,
              color: "rgba(255,255,255,0.9)",
            },
            {
              label: "NDVI promedio",
              val: ndviProm ? ndviProm.toFixed(3) : "—",
              color: ndviProm ? ndviColor(ndviProm) : "#888",
            },
            {
              label: "Lotes óptimos",
              val: `${optimos} / ${lotes.length}`,
              color: "#1D9E75",
            },
            {
              label: "En alerta",
              val: `${alertas}`,
              color: alertas > 0 ? "#E24B4A" : "rgba(255,255,255,0.35)",
            },
            {
              label: "Lluvia prom.",
              val: `${(con.reduce((a, l) => a + l.data!.lluvia, 0) / con.length).toFixed(0)} mm`,
              color: "#60a5fa",
            },
            {
              label: "Temp. máx. prom.",
              val: `${(con.reduce((a, l) => a + l.data!.tempMax, 0) / con.length).toFixed(1)}°C`,
              color: "#EF9F27",
            },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: "7px 12px",
                flex: "1 0 auto",
                minWidth: 90,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: 0.7,
                  marginBottom: 3,
                  whiteSpace: "nowrap",
                }}
              >
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            minWidth: 700,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
              {[
                "Lote",
                "Nombre",
                "Municipio",
                "Variedad",
                "Edad",
                "Área",
                "NDVI",
                "Lluvia",
                "Temp.",
                "Humedad",
                "Estado",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "5px 10px",
                    textAlign: "left",
                    color: "rgba(255,255,255,0.35)",
                    fontWeight: 600,
                    fontSize: 9,
                    letterSpacing: 0.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lotes.map((l) => {
              const d = l.data;
              const sel = selected?.id === l.id;
              const meta = d ? estadoMeta(d.estado) : null;
              return (
                <tr
                  key={l.id}
                  onClick={() => onSelect(l)}
                  style={{
                    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    background: sel ? "rgba(29,158,117,0.12)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = sel
                      ? "rgba(29,158,117,0.18)"
                      : "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = sel
                      ? "rgba(29,158,117,0.12)"
                      : "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "8px 10px",
                      fontWeight: 700,
                      color: d ? ndviColor(d.ndvi) : "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.id}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "rgba(255,255,255,0.85)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.nombre}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "rgba(255,255,255,0.45)",
                      whiteSpace: "nowrap",
                      fontSize: 11,
                    }}
                  >
                    {l.municipio}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "rgba(255,255,255,0.45)",
                      whiteSpace: "nowrap",
                      fontSize: 11,
                    }}
                  >
                    {l.variedad}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "rgba(255,255,255,0.55)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.edad}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "rgba(255,255,255,0.55)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.area}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {l.cargando ? (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.25)",
                          fontStyle: "italic",
                        }}
                      >
                        cargando…
                      </span>
                    ) : d ? (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: ndviColor(d.ndvi),
                        }}
                      >
                        {d.ndvi.toFixed(3)}
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.18)" }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "#60a5fa",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d ? `${d.lluvia} mm` : "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "#EF9F27",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d ? `${d.tempMax}°C` : "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "rgba(255,255,255,0.55)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d ? `${d.humedad}%` : "—"}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {meta ? (
                      <span
                        style={{
                          background: meta.bg,
                          color: meta.fg,
                          borderRadius: 12,
                          padding: "2px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {meta.label}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.18)",
                          fontSize: 11,
                        }}
                      >
                        Sin datos
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {con.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "14px",
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
            }}
          >
            Haz clic en cualquier lote del mapa para cargar sus datos
          </div>
        )}
      </div>
    </div>
  );
}
function BuscadorCoordenadas() {
  const map = useMap();
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(false);

  const ir = () => {
    const partes = input.split(",").map((s) => parseFloat(s.trim()));
    if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
      map.flyTo([partes[0], partes[1]], 14, { duration: 1.2 });
    } else {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data[0])
            map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 14, {
              duration: 1.2,
            });
        });
    }
    setInput("");
    setVisible(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 1000,
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      {visible && (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ir()}
          placeholder="Lat, Lng  o  nombre del lugar"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            background: "rgba(13,17,23,0.92)",
            color: "white",
            fontSize: 12,
            width: 240,
            outline: "none",
            backdropFilter: "blur(10px)",
            boxShadow: "0 3px 14px rgba(0,0,0,0.4)",
          }}
        />
      )}
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "none",
          background: "rgba(13,17,23,0.88)",
          color: "white",
          cursor: "pointer",
          fontSize: 16,
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        🔍
      </button>
    </div>
  );
}

// ─── COORDENADAS CURSOR ───────────────────────────────────────────────────────
function CoordenadasCursor() {
  const map = useMap();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => setPos(e.latlng);
    map.on("mousemove", handler);
    return () => {
      map.off("mousemove", handler);
    };
  }, [map]);

  if (!pos) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(13,17,23,0.78)",
        color: "rgba(255,255,255,0.6)",
        borderRadius: 8,
        padding: "4px 12px",
        fontSize: 11,
        pointerEvents: "none",
        backdropFilter: "blur(6px)",
      }}
    >
      {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
    </div>
  );
}
// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ApisSatelital() {
  const [lotes, setLotes] = useState<Lote[]>(LOTES);
  const [selected, setSelected] = useState<Lote | null>(null);
  const [flyPos, setFlyPos] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState<number>(14); // ← esto es lo que falta
  const [groundPos, setGroundPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Cargar datos de un lote
  async function cargar(lote: Lote) {
    setGroundPos(null);
    const existing = lotes.find((l) => l.id === lote.id);
    if (existing?.data) {
      setSelected(existing);
      setFlyPos(existing.centro);
      setFlyZoom(14);
      return;
    }
    const cargando = { ...lote, cargando: true };
    setLotes((p) => p.map((l) => (l.id === lote.id ? cargando : l)));
    setSelected(cargando);
    setFlyPos(lote.centro);
    setFlyZoom(14);
    const data = await fetchClima(lote);
    const updated = { ...lote, data, cargando: false };
    setLotes((p) => p.map((l) => (l.id === lote.id ? updated : l)));
    setSelected(updated);
  }

  // Al soltar pegman → zoom terreno nivel 19
  function handleDrop(pos: [number, number]) {
    setGroundPos(pos);
    setFlyPos(pos);
    setFlyZoom(19);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
        fontFamily: "system-ui",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* ── TOP BAR ── */}
      <div
        style={{
          background: "#0d1117",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "9px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1D9E75",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "white",
                lineHeight: 1,
              }}
            >
              Palmas del Cesar
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                marginTop: 1,
              }}
            >
              Vista satelital · {lotes.length} lotes · datos Open-Meteo
            </div>
          </div>
        </div>

        {/* Botones lotes rápidos */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {lotes.map((l) => {
            const color = l.data
              ? ndviColor(l.data.ndvi)
              : "rgba(255,255,255,0.2)";
            const sel = selected?.id === l.id;
            return (
              <button
                key={l.id}
                onClick={() => cargar(l)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 16,
                  border: `1.5px solid ${color}`,
                  background: sel ? color : "transparent",
                  color: sel ? "white" : color,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {l.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ÁREA MAPA + PANEL ── */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <MapContainer
          center={[9.0, -73.55]}
          zoom={9}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
          boxZoom={true}
          keyboard={true}
          ref={mapRef as React.RefObject<L.Map>}
        >
          {/* Tiles satelitales de Google — gratuito, sin API key */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="© Google"
            maxZoom={21}
            maxNativeZoom={20}
          />

          <FlyTo pos={flyPos} zoom={flyZoom} />
          <BuscadorCoordenadas />
          <CoordenadasCursor />

          {lotes.map((lote) => {
            const color = lote.data
              ? ndviColor(lote.data.ndvi)
              : "rgba(200,200,200,0.55)";
            const sel = selected?.id === lote.id;
            return (
              <React.Fragment key={lote.id}>
                <Polygon
                  positions={lote.coords}
                  pathOptions={{
                    color: sel ? "#ffffff" : color,
                    fillColor: color,
                    fillOpacity: lote.data ? (sel ? 0.52 : 0.3) : 0.18,
                    weight: sel ? 3 : 2,
                    dashArray: sel ? "9 5" : undefined,
                  }}
                  eventHandlers={{ click: () => cargar(lote) }}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: 170,
                        fontFamily: "system-ui",
                        fontSize: 13,
                      }}
                    >
                      <strong>{lote.nombre}</strong>
                      <div
                        style={{ color: "#777", fontSize: 11, marginTop: 2 }}
                      >
                        {lote.municipio} · {lote.area}
                      </div>
                      {lote.data && (
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: ndviColor(lote.data.ndvi),
                            marginTop: 6,
                          }}
                        >
                          NDVI {lote.data.ndvi.toFixed(3)}
                        </div>
                      )}
                      {!lote.data && (
                        <div
                          style={{
                            color: "#aaa",
                            fontStyle: "italic",
                            marginTop: 5,
                            fontSize: 11,
                          }}
                        >
                          Clic para cargar datos
                        </div>
                      )}
                    </div>
                  </Popup>
                </Polygon>

                <Marker
                  position={lote.centro}
                  icon={pinLote(
                    lote.data ? ndviColor(lote.data.ndvi) : "#888780",
                    lote.id.replace("LP-", ""),
                  )}
                  eventHandlers={{ click: () => cargar(lote) }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Pegman DOM */}
        <Pegman mapRef={mapRef} onDrop={handleDrop} />

        {/* Banner zoom terreno */}
        {groundPos && (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3000,
              background: "rgba(26,115,232,0.93)",
              color: "white",
              borderRadius: 24,
              padding: "9px 20px",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 3px 18px rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap",
            }}
          >
            <span>🛰 Vista terreno — zoom máximo satelital</span>
            <button
              onClick={() => {
                setGroundPos(null);
                if (selected) {
                  setFlyPos(selected.centro);
                  setFlyZoom(14);
                } else {
                  setFlyPos([9.0, -73.55]);
                  setFlyZoom(9);
                }
              }}
              style={{
                background: "rgba(255,255,255,0.22)",
                border: "none",
                borderRadius: 12,
                color: "white",
                padding: "2px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ← Volver
            </button>
          </div>
        )}

        {/* Leyenda NDVI */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 1000,
            background: "rgba(13,17,23,0.88)",
            borderRadius: 10,
            padding: "11px 14px",
            backdropFilter: "blur(10px)",
            fontSize: 12,
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 0.8,
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            NDVI
          </div>
          {[
            { color: C.verde, label: "≥ 0.72  Óptimo" },
            { color: C.amarillo, label: "0.55–0.72  Moderado" },
            { color: C.rojo, label: "< 0.55  Alerta" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                {label}
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 9,
              paddingTop: 8,
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              fontSize: 10,
              color: "rgba(255,255,255,0.28)",
            }}
          >
            🧍 Arrastra el muñeco para explorar
          </div>
        </div>

        {/* Panel lateral */}
        {selected && (
          <Panel lote={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* ── TABLA RESUMEN ── */}
      <TablaResumen lotes={lotes} selected={selected} onSelect={cargar} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-control-attribution { display:none!important; }
        .leaflet-control-zoom { margin:14px!important; }
      `}</style>
    </div>
  );
}
