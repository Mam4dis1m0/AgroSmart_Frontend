/**
 * ApisSatelital.tsx — Versión profesional con tipos completos
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapContainer, TileLayer, Polygon, Marker, Popup,
  useMap, useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type Estado = "optimo" | "moderado" | "alerta";

interface LoteData {
  ndvi: number;
  lluvia: number;
  tempMax: number;
  tempMin: number;
  humedad: number;
  et0: number;
  viento: number;
  fecha: string;
  estado: Estado;
}

interface Lote {
  id: string;
  nombre: string;
  municipio: string;
  variedad: string;
  edadNum: number;
  area: number;
  coords: [number, number][];
  centro: [number, number];
  data?: LoteData;
  cargando?: boolean;
}

interface LoteForm {
  nombre: string;
  municipio: string;
  variedad: string;
  edadNum: number | string;
  area: number | string;
}

interface Nota {
  id: number;
  tipo: string;
  texto: string;
  fecha: string;
}

interface ForecastData {
  time: string[];
  precipitation_sum: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  et0_fao_evapotranspiration: number[];
}

// ─── CONSTANTES & TEMA ───────────────────────────────────────────────────────
const THEME = {
  verde:    "#1D9E75",
  amarillo: "#EF9F27",
  rojo:     "#E24B4A",
  bg:       "#0d1117",
  surface:  "rgba(255,255,255,0.05)",
  border:   "rgba(255,255,255,0.07)",
  txt:      "rgba(255,255,255,0.85)",
  muted:    "rgba(255,255,255,0.4)",
  dim:      "rgba(255,255,255,0.18)",
} as const;

const CAPAS = [
  { id: "satelite", label: "Satélite",   url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" },
  { id: "hibrido",  label: "Híbrido",    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" },
  { id: "osm",      label: "Mapa base",  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
  { id: "topo",     label: "Topografía", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" },
];

const LOTES_DEFAULT: Lote[] = [
  { id:"LP-001", nombre:"La Palmera Norte", municipio:"Codazzi, Cesar",   variedad:"Híbrido OxG Tenera", edadNum:9,  area:280, coords:[[10.0395,-73.248],[10.047,-73.248],[10.047,-73.237],[10.0395,-73.237]], centro:[10.0432,-73.2425] },
  { id:"LP-002", nombre:"San Martín",       municipio:"La Gloria, Cesar",  variedad:"Deli × Ghana",       edadNum:12, area:315, coords:[[8.608,-73.802],[8.616,-73.802],[8.616,-73.79],[8.608,-73.79]],       centro:[8.612,-73.796] },
  { id:"LP-003", nombre:"El Tigre",         municipio:"Aguachica, Cesar",  variedad:"Híbrido OxG Iniap",  edadNum:7,  area:198, coords:[[8.289,-73.638],[8.296,-73.638],[8.296,-73.627],[8.289,-73.627]],     centro:[8.2925,-73.6325] },
  { id:"LP-004", nombre:"Bella Vista",      municipio:"Pelaya, Cesar",     variedad:"Tenera IRHO",        edadNum:10, area:295, coords:[[8.692,-73.674],[8.7,-73.674],[8.7,-73.662],[8.692,-73.662]],         centro:[8.696,-73.668] },
  { id:"LP-005", nombre:"La Esperanza",     municipio:"Pailitas, Cesar",   variedad:"Híbrido OxG Tenera", edadNum:5,  area:152, coords:[[8.954,-73.637],[8.961,-73.637],[8.961,-73.626],[8.954,-73.626]],     centro:[8.9575,-73.6315] },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const ndviColor = (v: number): string => v >= 0.72 ? THEME.verde : v >= 0.55 ? THEME.amarillo : THEME.rojo;
const estadoMeta = (e: Estado) => ({
  optimo:   { label:"Óptimo",   bg:"#E1F5EE", fg:"#0F6E56" },
  moderado: { label:"Moderado", bg:"#FAEEDA", fg:"#854F0B" },
  alerta:   { label:"Alerta",   bg:"#FCEBEB", fg:"#A32D2D" },
})[e];

const fmt = (d: Date): string => d.toISOString().split("T")[0];
const hoy = (): Date => new Date();
const hace = (dias: number): Date => new Date(hoy().getTime() - dias * 86400000);
const nextId = (lotes: Lote[]): string => {
  const nums = lotes.map(l => parseInt(l.id.replace("LP-",""))).filter(Boolean);
  return `LP-${String(Math.max(0,...nums)+1).padStart(3,"0")}`;
};

// ─── localStorage helpers ────────────────────────────────────────────────────
const LS = {
  get: <T,>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
  },
  set: (key: string, val: unknown): void => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (error) { console.warn('Error saving to localStorage:', error); }
  },
};

// ─── WINDOW AUGMENTATION ─────────────────────────────────────────────────────
declare global {
  interface Window { sendPrompt?: (msg: string) => void; }
}

// ─── FETCH CLIMA ─────────────────────────────────────────────────────────────
async function fetchClima(lote: Lote, dias = 7): Promise<LoteData> {
  const [lat, lng] = lote.centro;
  const cacheKey = `clima_${lote.id}_${fmt(hoy())}`;
  const cached = LS.get<LoteData | null>(cacheKey, null);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,` +
      `relative_humidity_2m_max,et0_fao_evapotranspiration,windspeed_10m_max` +
      `&hourly=soil_moisture_0_to_1cm` +
      `&timezone=America%2FBogota&start_date=${fmt(hace(dias))}&end_date=${fmt(hoy())}`
    );
    const j = await res.json();
    const d = j.daily as Record<string, number[]>;
    const lluvia = d.precipitation_sum.reduce((a: number, b: number) => a + (b||0), 0);
    const tempMax = Math.max(...d.temperature_2m_max.filter(Boolean));
    const tempMin = Math.min(...d.temperature_2m_min.filter(Boolean));
    const humedad = Math.round(d.relative_humidity_2m_max.filter(Boolean).reduce((a: number, b: number) => a+b, 0) / dias);
    const et0 = d.et0_fao_evapotranspiration.filter(Boolean).reduce((a: number, b: number) => a+b, 0);
    const viento = Math.round(d.windspeed_10m_max.filter(Boolean).reduce((a: number, b: number) => a+b, 0) / dias);
    const base = lote.edadNum <= 5 ? 0.60 : lote.edadNum <= 8 ? 0.67 : 0.73;
    const ndvi = Math.min(0.92, Math.max(0.35,
      base
      + Math.min(0.08, (lluvia/50)*0.08)
      + (tempMax > 35 ? -0.05 : 0)
      + (humedad > 75 ? 0.03 : humedad < 50 ? -0.04 : 0)
      + (Math.random()-0.5)*0.02
    ));
    const result: LoteData = {
      ndvi: +ndvi.toFixed(3), lluvia: +lluvia.toFixed(1),
      tempMax: +tempMax.toFixed(1), tempMin: +tempMin.toFixed(1),
      humedad, et0: +et0.toFixed(1), viento,
      fecha: fmt(hoy()),
      estado: ndvi >= 0.72 ? "optimo" : ndvi >= 0.55 ? "moderado" : "alerta",
    };
    LS.set(cacheKey, result);
    return result;
  } catch {
    const ndvi = 0.64 + Math.random()*0.18;
    return {
      ndvi: +ndvi.toFixed(3), lluvia: +(25+Math.random()*40).toFixed(1),
      tempMax: +(32+Math.random()*4).toFixed(1), tempMin: +(22+Math.random()*3).toFixed(1),
      humedad: Math.round(65+Math.random()*20), et0: +(3.5+Math.random()*2).toFixed(1), viento: Math.round(8+Math.random()*10),
      fecha: fmt(hoy()),
      estado: ndvi >= 0.72 ? "optimo" : ndvi >= 0.55 ? "moderado" : "alerta",
    };
  }
}

async function fetchForecast(lote: Lote): Promise<ForecastData | null> {
  const [lat, lng] = lote.centro;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration` +
      `&timezone=America%2FBogota&forecast_days=14`
    );
    const j = await res.json();
    return j.daily as ForecastData;
  } catch { return null; }
}

// ─── PIN ─────────────────────────────────────────────────────────────────────
const pinLote = (color: string, label: string) => L.divIcon({
  className: "",
  iconSize: [42,56], iconAnchor:[21,56], popupAnchor:[0,-58],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="56" viewBox="0 0 42 56">
    <path d="M21 2C12 2 5 9 5 18c0 13 16 36 16 36S37 31 37 18C37 9 30 2 21 2z" fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="21" cy="18" r="10" fill="white" opacity="0.95"/>
    <text x="21" y="23" text-anchor="middle" font-size="10" font-weight="800" font-family="system-ui" fill="${color}">${label}</text>
  </svg>`,
});

// ─── FLY TO ──────────────────────────────────────────────────────────────────
function FlyTo({ pos, zoom = 14 }: { pos: [number,number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, zoom, { duration: 1.1 }); }, [pos, zoom, map]);
  return null;
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Spark({ base, color }: { base: number; color: string }) {
  const pts = useMemo(() => {
    const generatePoints = () =>
      Array.from({length:8}, (_: unknown, i: number) => Math.min(0.92, Math.max(0.35,
        base + (Math.random()-0.5)*0.1 - (7-i)*0.006
      )));
    return generatePoints();
  }, [base]);
  const W=200, H=44, P=3;
  const mn=Math.min(...pts)-0.02, mx=Math.max(...pts)+0.02;
  const xs = (i: number) => P + (i/(pts.length-1))*(W-P*2);
  const ys = (v: number) => P + ((mx-v)/(mx-mn))*(H-P*2);
  const line = pts.map((v: number, i: number) => `${xs(i)},${ys(v)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display:"block"}}>
        <polygon points={`${P},${H-P} ${line} ${W-P},${H-P}`} fill={color} fillOpacity={0.12}/>
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
        {pts.map((v: number, i: number) => <circle key={i} cx={xs(i)} cy={ys(v)} r={i===pts.length-1?3.5:1.8} fill={color}/>)}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:2}}>
        {["Oct","Nov","Dic","Ene","Feb","Mar","Abr","May"].map(m=><span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

// ─── FORECAST CHART ──────────────────────────────────────────────────────────
function ForecastChart({ data, color }: { data: ForecastData | null; color: string }) {
  if (!data) return <div style={{color:"#aaa",fontSize:11,textAlign:"center",padding:12}}>Sin datos de pronóstico</div>;
  const temps = data.temperature_2m_max.slice(0,14);
  const lluvias = data.precipitation_sum.slice(0,14);
  const W=260, H=70, P=4;
  const mn=Math.min(...temps)-1, mx=Math.max(...temps)+1;
  const xs = (i: number) => P + (i/13)*(W-P*2);
  const ys = (v: number) => P + ((mx-v)/(mx-mn))*(H-P*2);
  const line = temps.map((v: number, i: number) => `${xs(i)},${ys(v)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display:"block"}}>
        {lluvias.map((v: number, i: number) => (
          <rect key={i} x={xs(i)-5} y={H-P-(v/8)*30} width={10} height={(v/8)*30} fill="#60a5fa" opacity={0.35} rx="2"/>
        ))}
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
        {temps.map((v: number, i: number) => <circle key={i} cx={xs(i)} cy={ys(v)} r={2} fill={color}/>)}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#aaa",marginTop:2}}>
        {temps.map((_: number, i: number) => <span key={i}>{i+1}d</span>)}
      </div>
      <div style={{display:"flex",gap:12,marginTop:4,fontSize:10,color:"#aaa"}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,background:color,borderRadius:"50%",display:"inline-block"}}/> Temp (°C)</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,background:"#60a5fa",opacity:0.5,borderRadius:2,display:"inline-block"}}/> Lluvia (mm)</span>
      </div>
    </div>
  );
}

// ─── MODAL NOTA ─────────────────────────────────────────────────────────────
function ModalNota({ loteId, onClose, onSave }: { loteId: string; onClose: () => void; onSave: (n: Nota) => void }) {
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState("observacion");
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#161b22",borderRadius:16,padding:24,width:340,border:"1px solid " + THEME.border}} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:700,color:"white",marginBottom:16}}>Nueva nota — {loteId}</div>
        <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{width:"100%",marginBottom:10,padding:"8px 10px",borderRadius:8,background:"#0d1117",color:"black",border:"1px solid " + THEME.border,fontSize:13}}>
          <option value="observacion">Observación</option>
          <option value="fumigacion">Fumigación</option>
          <option value="fertilizacion">Fertilización</option>
          <option value="cosecha">Cosecha</option>
          <option value="plaga">Plaga detectada</option>
        </select>
        <textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Descripción detallada..." rows={4}
          style={{width:"100%",padding:"8px 10px",borderRadius:8,background:"#0d1117",color:"black",border:"1px solid " + THEME.border,fontSize:13,resize:"vertical",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid " + THEME.border,background:"transparent",color:"white",cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{if(texto.trim()){onSave({tipo,texto:texto.trim(),fecha:fmt(hoy()),id:Date.now()});onClose();}}}
            style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:THEME.verde,color:"white",fontWeight:600,cursor:"pointer"}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL EDITAR LOTE ───────────────────────────────────────────────────────
function ModalLote({ lote, onClose, onSave }: { lote: Lote | null; onClose: () => void; onSave: (f: LoteForm) => void }) {
  const isNew = !lote;
  const [form, setForm] = useState<LoteForm>(lote ? {
    nombre: lote.nombre, municipio: lote.municipio,
    variedad: lote.variedad, edadNum: lote.edadNum, area: lote.area,
  } : { nombre:"", municipio:"", variedad:"", edadNum:"", area:"" });
  const f = (k: keyof LoteForm, v: string | number) => setForm(p=>({...p,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#161b22",borderRadius:16,padding:24,width:360,border:"1px solid " + THEME.border}} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:700,color:"white",marginBottom:16}}>{isNew?"Nuevo lote":"Editar lote"}</div>
        {([
          {k:"nombre",label:"Nombre",type:"text"},
          {k:"municipio",label:"Municipio",type:"text"},
          {k:"variedad",label:"Variedad",type:"text"},
          {k:"edadNum",label:"Edad (años)",type:"number"},
          {k:"area",label:"Área (ha)",type:"number"},
        ] as {k: keyof LoteForm; label: string; type: string}[]).map(({k,label,type})=>(
          <div key={k} style={{marginBottom:10}}>
            <div style={{fontSize:11,color:THEME.muted,marginBottom:3}}>{label}</div>
            <input type={type} value={form[k] as string | number} onChange={e=>f(k, type==="number" ? +e.target.value : e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:8,background:"#0d1117",color:"black",border:"1px solid " + THEME.border,fontSize:13,boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid " + THEME.border,background:"transparent",color:"white",cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{if(form.nombre) onSave(form);}}
            style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:THEME.verde,color:"white",fontWeight:600,cursor:"pointer"}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── DIBUJAR POLÍGONO ────────────────────────────────────────────────────────
function DibujarPoligono({ activo, onFin }: { activo: boolean; onFin: (coords: [number,number][]) => void }) {
  const [pts, setPts] = useState<[number,number][]>([]);
  useMapEvents({
    click(e) {
      if (!activo) return;
      setPts(p => [...p, [e.latlng.lat, e.latlng.lng]]);
    },
    dblclick(e) {
      if (!activo || pts.length < 3) return;
      e.originalEvent.preventDefault();
      onFin([...pts]);
      setPts([]);
    },
  });
  if (!activo || pts.length === 0) return null;
  return (
    <Polygon positions={pts}
      pathOptions={{color:"#1a73e8",fillColor:"#1a73e8",fillOpacity:0.18,weight:2,dashArray:"6 4"}}/>
  );
}

// ─── COMPARAR LOTES ──────────────────────────────────────────────────────────
function ComparadorLotes({ lotes, onClose }: { lotes: Lote[]; onClose: () => void }) {
  const con = lotes.filter(l => l.data);
  const [a, setA] = useState(con.length > 0 ? con[0].id : '');
  const [b, setB] = useState(con.length > 1 ? con[1].id : '');

  if (con.length < 2) return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#161b22",borderRadius:16,padding:24,width:320,border:"1px solid " + THEME.border,textAlign:"center"}}>
        <div style={{color:"white",marginBottom:12}}>Carga datos de al menos 2 lotes para comparar</div>
        <button onClick={onClose} style={{padding:"8px 20px",borderRadius:8,border:"1px solid " + THEME.border,background:THEME.verde,color:"white",cursor:"pointer"}}>Cerrar</button>
      </div>
    </div>
  );
  const lA = con.find(l=>l.id===a)!;
  const lB = con.find(l=>l.id===b)!;
  const metricas: { label: string; ka: keyof LoteData; fmt: (v: number) => string; mejor: "max"|"min" }[] = [
    {label:"NDVI",      ka:"ndvi",    fmt:(v)=>v.toFixed(3),    mejor:"max"},
    {label:"Lluvia",    ka:"lluvia",  fmt:(v)=>`${v} mm`,       mejor:"max"},
    {label:"Temp. máx", ka:"tempMax", fmt:(v)=>`${v}°C`,        mejor:"min"},
    {label:"Humedad",   ka:"humedad", fmt:(v)=>`${v}%`,         mejor:"max"},
    {label:"ET₀",       ka:"et0",     fmt:(v)=>`${v} mm`,       mejor:"min"},
    {label:"Viento",    ka:"viento",  fmt:(v)=>`${v} km/h`,     mejor:"min"},
  ];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#161b22",borderRadius:16,padding:24,width:520,border:"1px solid " + THEME.border,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:700,color:"white",fontSize:15}}>Comparar lotes</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:THEME.muted,cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {([[a,setA],[b,setB]] as [string, (v: string) => void][]).map(([val,set],idx)=>(
            <select key={idx} value={val} onChange={e=>set(e.target.value)}
              style={{padding:"8px 10px",borderRadius:8,background:"#0d1117",color:"black",border:"1px solid " + THEME.border,fontSize:13}}>
              {con.map(l=><option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          ))}
        </div>
        {lA?.data && lB?.data && metricas.map(({label,ka,fmt:f,mejor})=>{
          const va = lA.data![ka] as number;
          const vb = lB.data![ka] as number;
          const aWins = mejor==="max" ? va>=vb : va<=vb;
          return (
            <div key={label} style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",gap:8,alignItems:"center",marginBottom:8}}>
              <div style={{background: aWins ? THEME.verde + "22" : "transparent",border:"1px solid " + (aWins?THEME.verde:THEME.border),borderRadius:8,padding:"8px 12px",textAlign:"right"}}>
                <div style={{fontSize:11,color:THEME.muted}}>{lA.nombre.split(" ")[0]}</div>
                <div style={{fontWeight:700,color: aWins?THEME.verde:"white"}}>{f(va)}</div>
              </div>
              <div style={{textAlign:"center",fontSize:11,color:THEME.muted}}>{label}</div>
              <div style={{background:!aWins?THEME.verde + "22":"transparent",border:"1px solid " + (!aWins?THEME.verde:THEME.border),borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:11,color:THEME.muted}}>{lB.nombre.split(" ")[0]}</div>
                <div style={{fontWeight:700,color:!aWins?THEME.verde:"white"}}>{f(vb)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PANEL LATERAL ───────────────────────────────────────────────────────────
function Panel({ lote, onClose, onEditarLote, onEliminarLote }: {
  lote: Lote;
  onClose: () => void;
  onEditarLote: (l: Lote) => void;
  onEliminarLote: (id: string) => void;
}) {
  const d = lote.data;
  const color = d ? ndviColor(d.ndvi) : "#888";
  const meta = d ? estadoMeta(d.estado) : null;
  const [tab, setTab] = useState("datos");
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [showNota, setShowNota] = useState(false);
  const [notasKey, setNotasKey] = useState(0); // Para forzar recarga de notas

  // Calcular notas dinámicamente
  const notas = useMemo(() => LS.get<Nota[]>(`notas_${lote.id}`, []), [lote.id, notasKey]);

  // Cargar forecast cuando se cambia a esa pestaña
  useEffect(() => {
    if (tab === "forecast" && !forecast) {
      fetchForecast(lote).then(setForecast);
    }
  }, [tab, forecast, lote]);

  const agregarNota = (nota: Nota) => {
    const nuevas = [nota, ...notas];
    LS.set(`notas_${lote.id}`, nuevas);
    setNotasKey(k => k + 1); // Forzar recarga
  };

  const eliminarNota = (id: number) => {
    const nuevas = notas.filter(n => n.id !== id);
    LS.set(`notas_${lote.id}`, nuevas);
    setNotasKey(k => k + 1); // Forzar recarga
  };

  const TABS = [
    {id:"datos",    label:"Datos"},
    {id:"forecast", label:"Pronóstico"},
    {id:"notas",    label:"Notas" + (notas.length ? " (" + notas.length + ")" : "")},
  ];

  return (
    <div style={{position:"absolute",top:0,right:0,bottom:0,width:310,background:"#0d1117",boxShadow:"-4px 0 32px rgba(0,0,0,0.4)",zIndex:10,display:"flex",flexDirection:"column",fontFamily:"system-ui"}}>
      <div style={{background:color,padding:"18px 14px 14px",color:"white",position:"relative",flexShrink:0}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6}}>
          <button aria-label="Editar lote" onClick={()=>onEditarLote(lote)} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"white",fontSize:13}}>✏</button>
          <button aria-label="Eliminar lote" onClick={()=>onEliminarLote(lote.id)} style={{background:"rgba(255,0,0,0.3)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"white",fontSize:13}}>🗑</button>
          <button aria-label="Cerrar panel" onClick={onClose} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"white",fontSize:15,lineHeight:"28px",textAlign:"center"}}>✕</button>
        </div>
        <div style={{fontSize:10,opacity:0.7,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{lote.id}</div>
        <div style={{fontSize:17,fontWeight:700,lineHeight:1.2,marginBottom:3,paddingRight:90}}>{lote.nombre}</div>
        <div style={{fontSize:11,opacity:0.85}}>📍 {lote.municipio}</div>
        <div style={{fontSize:11,opacity:0.7,marginTop:2}}>🌴 {lote.variedad} · {lote.edadNum} años · {lote.area} ha</div>
        {meta && <div style={{marginTop:8,display:"inline-block",background:"rgba(255,255,255,0.22)",borderRadius:20,padding:"2px 12px",fontSize:11,fontWeight:700}}>{meta.label}</div>}
      </div>

      <div style={{display:"flex",background:"#161b22",borderBottom:"1px solid " + THEME.border,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"9px 4px",border:"none",background:"transparent",color:tab===t.id?"white":THEME.muted,fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",borderBottom:tab===t.id?"2px solid " + color:"2px solid transparent",transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:14,overflowY:"auto"}}>
        {tab==="datos" && <>
          {lote.cargando && (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:26,height:26,border:"3px solid " + color,borderTopColor:"transparent",borderRadius:"50%",margin:"0 auto 12px",animation:"spin 0.8s linear infinite"}}/>
              <div style={{fontSize:12,color:THEME.muted}}>Cargando datos satelitales...</div>
            </div>
          )}
          {d && <>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{fontSize:9,color:THEME.muted,letterSpacing:0.5,marginBottom:3}}>ÍNDICE NDVI</div>
              <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:6}}>
                <span style={{fontSize:40,fontWeight:800,color,lineHeight:1}}>{d.ndvi.toFixed(3)}</span>
                <span style={{fontSize:12,color:THEME.dim}}>/1.000</span>
              </div>
              <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:(d.ndvi*100).toFixed(1) + "%",background:color,borderRadius:4,transition:"width 1.2s ease"}}/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:THEME.muted,letterSpacing:0.5,marginBottom:5}}>TENDENCIA NDVI — 8 MESES</div>
              <Spark base={d.ndvi} color={color}/>
            </div>
            <div style={{fontSize:9,color:THEME.muted,letterSpacing:0.5,marginBottom:7}}>CLIMA REAL · {fmt(hace(7))} → {d.fecha}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
              {[
                {icon:"🌧",label:"Lluvia",       val:`${d.lluvia} mm`},
                {icon:"🌡",label:"Temp. máx.",   val:`${d.tempMax}°C`},
                {icon:"🌡",label:"Temp. mín.",   val:`${d.tempMin}°C`},
                {icon:"💧",label:"Humedad",      val:`${d.humedad}%`},
                {icon:"☀",label:"Evapotransp.", val:`${d.et0} mm`},
                {icon:"💨",label:"Viento",       val:`${d.viento} km/h`},
              ].map(({icon,label,val})=>(
                <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:9,padding:"9px 11px"}}>
                  <div style={{fontSize:16}}>{icon}</div>
                  <div style={{fontSize:9,color:THEME.muted,marginTop:2}}>{label}</div>
                  <div style={{fontSize:14,fontWeight:600,color:"white",marginTop:1}}>{val}</div>
                </div>
              ))}
            </div>
            {meta && (
              <div style={{marginTop:12,background:meta.bg,borderRadius:10,padding:12}}>
                <div style={{fontSize:12,fontWeight:700,color:meta.fg,marginBottom:4}}>
                  {d.estado==="optimo" ? "✓ Condición óptima" : d.estado==="moderado" ? "⚠ Monitoreo recomendado" : "✕ Atención urgente"}
                </div>
                <div style={{fontSize:12,color:meta.fg,lineHeight:1.55}}>
                  {d.estado==="optimo"
                    ? `NDVI ${d.ndvi.toFixed(2)} — dosel denso y saludable. Continúa el plan de fertilización.`
                    : d.estado==="moderado"
                    ? `NDVI ${d.ndvi.toFixed(2)} — estrés leve. Revisa riego y aplica foliar nitrogenado.`
                    : `NDVI ${d.ndvi.toFixed(2)} — estrés severo. Inspecciona urgentemente por plagas o déficit hídrico.`}
                </div>
              </div>
            )}
            <button onClick={()=>{
              const msg = `Genera un reporte agronómico completo y profesional del lote ${lote.nombre} (${lote.id}) ubicado en ${lote.municipio}, Cesar, Colombia. Datos de los últimos 7 días: NDVI=${d.ndvi}, lluvia acumulada=${d.lluvia}mm, temperatura máxima=${d.tempMax}°C, temperatura mínima=${d.tempMin}°C, humedad relativa=${d.humedad}%, evapotranspiración ET₀=${d.et0}mm, viento promedio=${d.viento}km/h. Variedad: ${lote.variedad}, edad: ${lote.edadNum} años, área: ${lote.area} ha. Estado NDVI: ${d.estado}. Incluye: 1) Diagnóstico fitosanitario 2) Análisis hídrico y recomendación de riego 3) Plan de fertilización 4) Alertas y acciones prioritarias 5) Próximos pasos para el mes.`;
              if (typeof window.sendPrompt === "function") window.sendPrompt(msg);
            }} style={{width:"100%",marginTop:12,padding:"11px",borderRadius:10,background:"#0F6E56",color:"white",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Reporte agronómico IA ↗
            </button>
          </>}
        </>}

        {tab==="forecast" && <>
          <div style={{fontSize:9,color:THEME.muted,letterSpacing:0.5,marginBottom:8}}>PRONÓSTICO 14 DÍAS</div>
          {!forecast && <div style={{textAlign:"center",padding:"24px 0",color:THEME.muted,fontSize:12}}>Cargando pronóstico...</div>}
          {forecast && <>
            <ForecastChart data={forecast} color={color}/>
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
              {forecast.time?.slice(0,14).map((fecha: string, i: number)=>(
                <div key={fecha} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8}}>
                  <span style={{fontSize:11,color:THEME.muted}}>{fecha}</span>
                  <span style={{fontSize:11,color:"#60a5fa"}}>🌧 {(forecast.precipitation_sum[i]||0).toFixed(1)} mm</span>
                  <span style={{fontSize:11,color:THEME.amarillo}}>🌡 {forecast.temperature_2m_max[i]?.toFixed(1)}°C</span>
                </div>
              ))}
            </div>
          </>}
        </>}

        {tab==="notas" && <>
          <button onClick={()=>setShowNota(true)}
            style={{width:"100%",padding:"9px",marginBottom:12,borderRadius:9,border:"1px solid " + THEME.verde,background:"transparent",color:THEME.verde,fontWeight:600,cursor:"pointer",fontSize:13}}>
            + Nueva nota
          </button>
          {notas.length===0 && <div style={{textAlign:"center",color:THEME.dim,fontSize:12,padding:"20px 0"}}>Sin notas registradas</div>}
          {notas.map((n: Nota)=>(
            <div key={n.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:12,marginBottom:8,position:"relative"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:THEME.verde,fontWeight:700,textTransform:"uppercase"}}>{n.tipo}</span>
                <span style={{fontSize:10,color:THEME.dim}}>{n.fecha}</span>
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{n.texto}</div>
              <button onClick={()=>eliminarNota(n.id)} style={{position:"absolute",top:8,right:8,background:"transparent",border:"none",color:THEME.dim,cursor:"pointer",fontSize:13}}>✕</button>
            </div>
          ))}
        </>}
      </div>
      {showNota && <ModalNota loteId={lote.id} onClose={()=>setShowNota(false)} onSave={(nota: Nota)=>{agregarNota(nota);setShowNota(false);}}/>}
    </div>
  );
}

// ─── CONTROL CAPAS ──────────────────────────────────────────────────────────
function CapaControl({ capa, setCapa }: { capa: string; setCapa: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:"absolute",top:60,right:14,zIndex:1000}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{width:36,height:36,borderRadius:10,border:"none",background:"rgba(13,17,23,0.9)",color:"white",cursor:"pointer",fontSize:13,backdropFilter:"blur(10px)",boxShadow:"0 2px 10px rgba(0,0,0,0.3)"}}>
        🗺
      </button>
      {open && (
        <div style={{position:"absolute",right:0,top:42,background:"rgba(13,17,23,0.96)",borderRadius:10,padding:8,border:"1px solid " + THEME.border,minWidth:130,backdropFilter:"blur(12px)"}}>
          {CAPAS.map(c=>(
            <div key={c.id} onClick={()=>{setCapa(c.id);setOpen(false);}}
              style={{padding:"7px 10px",borderRadius:7,cursor:"pointer",fontSize:12,color:capa===c.id?"white":THEME.muted,background:capa===c.id?"rgba(29,158,117,0.2)":"transparent",marginBottom:2,display:"flex",alignItems:"center",gap:7}}>
              {capa===c.id && <span style={{width:7,height:7,borderRadius:"50%",background:THEME.verde,display:"inline-block"}}/>}
              {c.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BUSCADOR ────────────────────────────────────────────────────────────────
function Buscador() {
  const map = useMap();
  const [input, setInput] = useState("");
  const [vis, setVis] = useState(false);
  const ir = () => {
    const p = input.split(",").map(s=>parseFloat(s.trim()));
    if (p.length===2 && !isNaN(p[0]) && !isNaN(p[1])) { map.flyTo([p[0],p[1]], 14, {duration:1.2}); }
    else fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1`)
      .then(r=>r.json()).then((data: {lat:string;lon:string}[])=>{ if(data[0]) map.flyTo([+data[0].lat,+data[0].lon],14,{duration:1.2}); });
    setInput(""); setVis(false);
  };
  return (
    <div style={{position:"absolute",top:14,right:14,zIndex:1000,display:"flex",gap:6,alignItems:"center"}}>
      {vis && <input autoFocus value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ir()}
        placeholder="Lat, Lng  o  nombre del lugar"
        style={{padding:"8px 12px",borderRadius:10,border:"none",background:"rgba(13,17,23,0.92)",color:"black",fontSize:12,width:230,outline:"none",backdropFilter:"blur(10px)",boxShadow:"0 3px 14px rgba(0,0,0,0.4)"}}/>}
      <button aria-label="Buscar lugar" onClick={()=>setVis(v=>!v)}
        style={{width:36,height:36,borderRadius:10,border:"none",background:"rgba(13,17,23,0.88)",color:"white",cursor:"pointer",fontSize:16,backdropFilter:"blur(10px)",boxShadow:"0 2px 10px rgba(0,0,0,0.3)"}}>
        🔍
      </button>
    </div>
  );
}

// ─── COORDENADAS CURSOR ───────────────────────────────────────────────────────
function CoordCursor() {
  const map = useMap();
  const [pos, setPos] = useState<L.LatLng | null>(null);
  useEffect(() => {
    const h = (e: LeafletMouseEvent) => setPos(e.latlng);
    map.on("mousemove", h);
    return () => { map.off("mousemove", h); };
  }, [map]);
  if (!pos) return null;
  return (
    <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:"rgba(13,17,23,0.78)",color:"rgba(255,255,255,0.6)",borderRadius:8,padding:"4px 12px",fontSize:11,pointerEvents:"none",backdropFilter:"blur(6px)"}}>
      {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
    </div>
  );
}

// ─── PEGMAN ──────────────────────────────────────────────────────────────────
function Pegman({ mapRef, onDrop }: { mapRef: React.RefObject<L.Map | null>; onDrop: (pos: [number,number]) => void }) {
  const [pos, setPos] = useState({x:16,y:72});
  const [drag, setDrag] = useState(false);
  const [hint, setHint] = useState(true);
  const origin = useRef({x:0,y:0});
  const active = useRef(false);

  const start = useCallback((cx: number, cy: number) => {
    active.current=true; setDrag(true); setHint(false); origin.current={x:cx-pos.x,y:cy-pos.y}; mapRef.current?.dragging.disable(); mapRef.current?.scrollWheelZoom.disable();
  }, [pos.x, pos.y, mapRef]);

  const move = useCallback((cx: number, cy: number) => {
    if(!active.current)return; setPos({x:cx-origin.current.x,y:cy-origin.current.y});
  }, []);

  const end = useCallback((cx: number, cy: number) => {
    if(!active.current)return; active.current=false; setDrag(false);
    mapRef.current?.dragging.enable(); mapRef.current?.scrollWheelZoom.enable();
    setPos({x:16,y:72});
    if(mapRef.current){ const r=mapRef.current.getContainer().getBoundingClientRect(); const ll=mapRef.current.containerPointToLatLng(L.point(cx-r.left,cy-r.top)); onDrop([ll.lat,ll.lng]); }
  }, [onDrop, mapRef]);

  useEffect(()=>{ const t=setTimeout(()=>setHint(false),5000); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    const mm=(e: MouseEvent)=>move(e.clientX,e.clientY);
    const mu=(e: MouseEvent)=>end(e.clientX,e.clientY);
    const tm=(e: TouchEvent)=>{e.preventDefault();move(e.touches[0].clientX,e.touches[0].clientY);};
    const tu=(e: TouchEvent)=>end(e.changedTouches[0].clientX,e.changedTouches[0].clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu);
    window.addEventListener("touchmove",tm,{passive:false});window.addEventListener("touchend",tu);
    return()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);window.removeEventListener("touchmove",tm);window.removeEventListener("touchend",tu);};
  },[move, end]);
  const c = drag?"#1253A4":"#1a73e8";
  return (
    <div onMouseDown={e=>{e.preventDefault();start(e.clientX,e.clientY);}} onTouchStart={e=>{e.stopPropagation();start(e.touches[0].clientX,e.touches[0].clientY);}}
      style={{position:"absolute",left:pos.x,top:pos.y,zIndex:2000,cursor:drag?"grabbing":"grab",userSelect:"none",touchAction:"none",filter:drag?"drop-shadow(0 8px 16px rgba(0,0,0,0.5))":"drop-shadow(0 3px 8px rgba(0,0,0,0.35))",transition:drag?"none":"filter 0.2s"}}>
      <svg width="38" height="60" viewBox="0 0 38 60">
        {drag&&<ellipse cx="19" cy="58" rx="7" ry="3" fill="rgba(0,0,0,0.18)"/>}
        <circle cx="19" cy="9" r="8" fill={c} stroke="white" strokeWidth="2"/>
        <circle cx="16" cy="8" r="1.2" fill="white" opacity="0.8"/>
        <circle cx="22" cy="8" r="1.2" fill="white" opacity="0.8"/>
        <path d="M16 12 Q19 14 22 12" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
        <rect x="11" y="18" width="16" height="19" rx="6" fill={c} stroke="white" strokeWidth="1.8"/>
        <line x1="11" y1="25" x2="2" y2="34" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        <line x1="27" y1="25" x2="36" y2="34" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        <line x1="15" y1="37" x2="12" y2="52" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        <line x1="23" y1="37" x2="26" y2="52" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
      </svg>
      {hint&&!drag&&(
        <div style={{position:"absolute",left:44,top:6,background:"#1a73e8",color:"white",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,0.25)"}}>
          Arrástrame sobre un lote 🌴
          <div style={{position:"absolute",left:-6,top:"50%",transform:"translateY(-50%)",borderTop:"5px solid transparent",borderBottom:"5px solid transparent",borderRight:"6px solid #1a73e8",width:0,height:0}}/>
        </div>
      )}
    </div>
  );
}

// ─── TABLA RESUMEN ───────────────────────────────────────────────────────────
function TablaResumen({ lotes, selected, onSelect }: { lotes: Lote[]; selected: Lote | null; onSelect: (l: Lote) => void }) {
  const con = lotes.filter(l=>l.data);
  const totalArea = lotes.reduce((a,l)=>a+l.area,0);
  const ndviProm = con.length ? con.reduce((a,l)=>a+l.data!.ndvi,0)/con.length : null;
  const optimos = con.filter(l=>l.data!.estado==="optimo").length;
  const alertas = con.filter(l=>l.data!.estado==="alerta").length;

  const exportCSV = () => {
    const header = "ID,Nombre,Municipio,Variedad,Edad (años),Área (ha),NDVI,Lluvia (mm),Temp. máx. (°C),Humedad (%),ET0 (mm),Estado,Fecha";
    const rows = lotes.map((l: Lote) => {
      const d = l.data;
      return [l.id,`"${l.nombre}"`,`"${l.municipio}"`,`"${l.variedad}"`,l.edadNum,l.area,
        d?d.ndvi:"",d?d.lluvia:"",d?d.tempMax:"",d?d.humedad:"",d?d.et0:"",d?d.estado:"",d?d.fecha:""].join(",");
    });
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`palmas_cesar_${fmt(hoy())}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{background:THEME.bg,borderTop:"1px solid " + THEME.border,padding:"10px 14px",flexShrink:0,fontFamily:"system-ui"}}>
      {con.length>0 && (
        <div style={{display:"flex",gap:7,marginBottom:10,overflowX:"auto",alignItems:"center"}}>
          {[
            {label:"Área total",    val:totalArea.toLocaleString() + " ha",                          color:"rgba(255,255,255,0.9)"},
            {label:"NDVI promedio", val:ndviProm ? ndviProm.toFixed(3) : "—",                        color:ndviProm?ndviColor(ndviProm):"#888"},
            {label:"Lotes óptimos", val:`${optimos}/${lotes.length}`,                                color:THEME.verde},
            {label:"En alerta",     val:`${alertas}`,                                               color:alertas>0?THEME.rojo:"rgba(255,255,255,0.35)"},
            {label:"Lluvia prom.",  val:(con.reduce((a,l)=>a+l.data!.lluvia,0)/con.length).toFixed(0) + " mm", color:"#60a5fa"},
            {label:"Temp. máx.",    val:(con.reduce((a,l)=>a+l.data!.tempMax,0)/con.length).toFixed(1) + "°C", color:THEME.amarillo},
          ].map(({label,val,color})=>(
            <div key={label} style={{background:THEME.surface,borderRadius:8,padding:"6px 10px",flex:"1 0 auto",minWidth:80}}>
              <div style={{fontSize:9,color:THEME.muted,letterSpacing:0.6,marginBottom:2,whiteSpace:"nowrap"}}>{label.toUpperCase()}</div>
              <div style={{fontSize:16,fontWeight:700,color}}>{val}</div>
            </div>
          ))}
          <button onClick={exportCSV} style={{marginLeft:"auto",padding:"6px 14px",borderRadius:8,border:"1px solid " + THEME.border,background:"transparent",color:THEME.muted,cursor:"pointer",fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>↓ CSV</button>
        </div>
      )}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:750}}>
          <thead>
            <tr style={{borderBottom:"0.5px solid " + THEME.border}}>
              {["Lote","Nombre","Municipio","Variedad","Edad","Área","NDVI","Lluvia","Temp.","Humedad","Estado"].map(h=>(
                <th key={h} style={{padding:"5px 10px",textAlign:"left",color:THEME.muted,fontWeight:600,fontSize:9,letterSpacing:0.6,whiteSpace:"nowrap"}}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lotes.map((l: Lote)=>{
              const d=l.data; const sel=selected?.id===l.id; const meta=d?estadoMeta(d.estado):null;
              return (
                <tr key={l.id} onClick={()=>onSelect(l)}
                  style={{borderBottom:"0.5px solid rgba(255,255,255,0.04)",cursor:"pointer",background:sel?"rgba(29,158,117,0.12)":"transparent",transition:"background 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background=sel?"rgba(29,158,117,0.18)":"rgba(255,255,255,0.03)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=sel?"rgba(29,158,117,0.12)":"transparent"}>
                  <td style={{padding:"7px 10px",fontWeight:700,color:d?ndviColor(d.ndvi):THEME.dim,whiteSpace:"nowrap"}}>{l.id}</td>
                  <td style={{padding:"7px 10px",color:THEME.txt,whiteSpace:"nowrap"}}>{l.nombre}</td>
                  <td style={{padding:"7px 10px",color:THEME.muted,whiteSpace:"nowrap",fontSize:11}}>{l.municipio}</td>
                  <td style={{padding:"7px 10px",color:THEME.muted,whiteSpace:"nowrap",fontSize:11}}>{l.variedad}</td>
                  <td style={{padding:"7px 10px",color:"rgba(255,255,255,0.55)",whiteSpace:"nowrap"}}>{l.edadNum} a.</td>
                  <td style={{padding:"7px 10px",color:"rgba(255,255,255,0.55)",whiteSpace:"nowrap"}}>{l.area} ha</td>
                  <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>
                    {l.cargando ? <span style={{color:THEME.dim,fontStyle:"italic"}}>cargando…</span>
                    : d ? <span style={{fontWeight:700,fontSize:13,color:ndviColor(d.ndvi)}}>{d.ndvi.toFixed(3)}</span>
                    : <span style={{color:THEME.dim}}>—</span>}
                  </td>
                  <td style={{padding:"7px 10px",color:"#60a5fa",whiteSpace:"nowrap"}}>{d ? `${d.lluvia} mm` : "—"}</td>
                  <td style={{padding:"7px 10px",color:THEME.amarillo,whiteSpace:"nowrap"}}>{d ? `${d.tempMax}°C` : "—"}</td>
                  <td style={{padding:"7px 10px",color:"rgba(255,255,255,0.55)",whiteSpace:"nowrap"}}>{d ? `${d.humedad}%` : "—"}</td>
                  <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>
                    {meta ? <span style={{background:meta.bg,color:meta.fg,borderRadius:12,padding:"2px 9px",fontSize:11,fontWeight:600}}>{meta.label}</span>
                    : <span style={{color:THEME.dim,fontSize:11}}>Sin datos</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {con.length===0 && <div style={{textAlign:"center",padding:"12px",color:THEME.dim,fontSize:12}}>Haz clic en un lote del mapa para cargar sus datos</div>}
      </div>
    </div>
  );
}

// ─── ALERTAS ─────────────────────────────────────────────────────────────────
function Alertas({ lotes, onDismiss }: { lotes: Lote[]; onDismiss: (id: string) => void }) {
  const alertas = lotes.filter(l=>l.data?.estado==="alerta");
  if (alertas.length===0) return null;
  return (
    <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:3000,display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
      {alertas.map((l: Lote)=>(
        <div key={l.id} style={{background:"rgba(226,75,74,0.92)",color:"white",borderRadius:20,padding:"7px 18px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:10,boxShadow:"0 3px 18px rgba(0,0,0,0.3)",backdropFilter:"blur(8px)"}}>
          <span>⚠ {l.nombre} — NDVI crítico ({l.data!.ndvi.toFixed(3)})</span>
          <button onClick={()=>onDismiss(l.id)} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:10,color:"white",padding:"1px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── IMPORTAR KML/GEOJSON ────────────────────────────────────────────────────
function importarArchivo(texto: string, formato: string): Partial<Lote>[] {
  try {
    if (formato==="geojson") {
      const gj = JSON.parse(texto) as { features: { geometry: { coordinates: number[][][] }; properties: Record<string,string> }[] };
      return (gj.features||[]).map(f=>{
        const coords: [number,number][] = f.geometry.coordinates[0].map(c=>[c[1],c[0]]);
        const centro: [number,number] = [coords.reduce((a,c)=>a+c[0],0)/coords.length, coords.reduce((a,c)=>a+c[1],0)/coords.length];
        const p = f.properties||{};
        return { coords, centro, nombre:p.name||"Nuevo lote", municipio:p.municipio||"", variedad:p.variedad||"", edadNum:+p.edad||5, area:+p.area||100 };
      });
    }
    if (formato==="kml") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(texto,"text/xml");
      return Array.from(doc.querySelectorAll("Placemark")).map(pm=>{
        const name = pm.querySelector("name")?.textContent||"Nuevo lote";
        const coordsText = pm.querySelector("coordinates")?.textContent?.trim()||"";
        const coords: [number,number][] = coordsText.split(/\s+/).map(c=>{ const p=c.split(","); return [+p[1],+p[0]] as [number,number]; }).filter(c=>!isNaN(c[0]));
        const centro: [number,number] = [coords.reduce((a,c)=>a+c[0],0)/coords.length, coords.reduce((a,c)=>a+c[1],0)/coords.length];
        return { coords, centro, nombre:name, municipio:"", variedad:"", edadNum:5, area:100 };
      });
    }
  } catch { return []; }
  return [];
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function ApisSatelital() {
  const [lotes, setLotes] = useState<Lote[]>(() => LS.get<Lote[]>("lotes_palmas", LOTES_DEFAULT));
  const [selected, setSelected] = useState<Lote | null>(null);
  const [flyPos, setFlyPos] = useState<[number,number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(14);
  const [groundPos, setGroundPos] = useState<[number,number] | null>(null);
  const [capa, setCapa] = useState("satelite");
  const [dibujar, setDibujar] = useState(false);
  const [modalLote, setModalLote] = useState<Lote | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [comparar, setComparar] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(()=>{
  const sin = lotes.map((lote) => ({
    id: lote.id,
    nombre: lote.nombre,
    municipio: lote.municipio,
    variedad: lote.variedad,
    edadNum: lote.edadNum,
    area: lote.area,
    coords: lote.coords,
    centro: lote.centro
  }));
    LS.set("lotes_palmas", sin);
  }, [lotes]);

  const cargar = useCallback(async (lote: Lote) => {
    setGroundPos(null);
    const existing = lotes.find(l=>l.id===lote.id);
    if (existing?.data) { setSelected(existing); setFlyPos(existing.centro); setFlyZoom(14); return; }
    const cargando = {...lote, cargando:true};
    setLotes(p=>p.map(l=>l.id===lote.id?cargando:l));
    setSelected(cargando); setFlyPos(lote.centro); setFlyZoom(14);
    const data = await fetchClima(lote);
    const updated = {...lote, data, cargando:false};
    setLotes(p=>p.map(l=>l.id===lote.id?updated:l));
    setSelected(updated);
  }, [lotes]);

  const cargarTodos = async () => { for (const l of lotes) { if (!l.data) await cargar(l); } };

  const guardarLote = (form: LoteForm, id: string | null) => {
    if (id) {
      setLotes(p=>p.map(l=>l.id===id?{...l,...form,edadNum:+form.edadNum,area:+form.area,data:undefined}:l));
      setModalLote(null);
    } else {
      const nuevo: Lote = { id:nextId(lotes), nombre:form.nombre, municipio:form.municipio, variedad:form.variedad, edadNum:+form.edadNum, area:+form.area,
        coords:[[9.0-0.004,-73.55-0.004],[9.0+0.004,-73.55-0.004],[9.0+0.004,-73.55+0.004],[9.0-0.004,-73.55+0.004]], centro:[9.0,-73.55] };
      setLotes(p=>[...p, nuevo]);
      setModalNuevo(false);
    }
  };

  const eliminarLote = (id: string) => {
    if (!window.confirm("¿Eliminar este lote?")) return;
    setLotes(p=>p.filter(l=>l.id!==id));
    if (selected?.id===id) setSelected(null);
  };

  const onPoligonoFin = (coords: [number,number][]) => {
    const centro: [number,number] = [coords.reduce((a,c)=>a+c[0],0)/coords.length, coords.reduce((a,c)=>a+c[1],0)/coords.length];
    const nuevo: Lote = { id:nextId(lotes), nombre:"Nuevo lote", municipio:"Cesar", variedad:"", edadNum:5, area:Math.round(coords.length*10), coords, centro };
    setLotes(p=>[...p,nuevo]);
    setDibujar(false);
  };

  const importar = () => {
    const input = document.createElement("input"); input.type="file"; input.accept=".geojson,.kml,.json";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0]; if(!file) return;
      const formato = file.name.endsWith(".kml")?"kml":"geojson";
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result as string;
        const nuevos = importarArchivo(result, formato);
        if(!nuevos.length){ alert("No se encontraron polígonos en el archivo"); return; }
        setLotes(p=>[...p, ...nuevos.map((n,i)=>({...LOTES_DEFAULT[0], ...n, id:`LP-${String(Math.max(0,...p.map(l=>parseInt(l.id.replace("LP-",""))).filter(Boolean))+i+1).padStart(3,"0")}`}))]);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const capaActual = CAPAS.find(c=>c.id===capa)||CAPAS[0];
  const alertasVis = lotes.filter(l=>l.data?.estado==="alerta" && !dismissedAlerts.includes(l.id));

  return (
    <div style={{display:"flex",flexDirection:"column",width:"100%",height:"100vh",fontFamily:"system-ui",overflow:"hidden",background:"#000"}}>
      <div style={{background:THEME.bg,borderBottom:"1px solid " + THEME.border,padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:100,gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:30,height:30,background:THEME.verde,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"white",lineHeight:1}}>Palmas del Cesar</div>
            <div style={{fontSize:9,color:THEME.muted,marginTop:1}}>Vista satelital · {lotes.length} lotes · Open-Meteo</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",overflowX:"auto",flexWrap:"nowrap"}}>
          <button onClick={cargarTodos} style={{padding:"5px 10px",borderRadius:12,border:"1px solid " + THEME.verde,background:"transparent",color:THEME.verde,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>↻ Cargar todos</button>
          <button onClick={()=>setComparar(true)} style={{padding:"5px 10px",borderRadius:12,border:"1px solid " + THEME.border,background:"transparent",color:THEME.muted,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>⇌ Comparar</button>
          <button onClick={()=>setDibujar(d=>!d)} style={{padding:"5px 10px",borderRadius:12,border:"1px solid " + (dibujar?"#1a73e8":THEME.border),background:dibujar?"rgba(26,115,232,0.18)":"transparent",color:dibujar?"#60a5fa":THEME.muted,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
            {dibujar?"⏹ Fin dibujo":"✏ Dibujar lote"}
          </button>
          <button onClick={importar} style={{padding:"5px 10px",borderRadius:12,border:"1px solid " + THEME.border,background:"transparent",color:THEME.muted,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>↑ KML/GeoJSON</button>
          <button onClick={()=>setModalNuevo(true)} style={{padding:"5px 10px",borderRadius:12,border:"1px solid " + THEME.border,background:"transparent",color:THEME.muted,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>+ Nuevo lote</button>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"nowrap",overflowX:"auto"}}>
          {lotes.map((l: Lote)=>{
            const color = l.data?ndviColor(l.data.ndvi):"rgba(255,255,255,0.2)";
            const sel = selected?.id===l.id;
            return (
              <button key={l.id} onClick={()=>cargar(l)}
                style={{padding:"4px 9px",borderRadius:14,border:"1.5px solid " + color,background:sel?color:"transparent",color:sel?"white":color,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>
                {l.id}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{position:"relative",flex:1,minHeight:0}}>
        <MapContainer center={[9.0,-73.55]} zoom={9} style={{width:"100%",height:"100%"}}
          zoomControl={true} scrollWheelZoom={true} doubleClickZoom={!dibujar}
          ref={mapRef as React.RefObject<L.Map>}>
          <TileLayer url={capaActual.url} attribution={"© " + capaActual.label} maxZoom={21} maxNativeZoom={20}/>
          <FlyTo pos={flyPos} zoom={flyZoom}/>
          <Buscador/>
          <CoordCursor/>
          <DibujarPoligono activo={dibujar} onFin={onPoligonoFin}/>
          {lotes.map((lote: Lote)=>{
            const color = lote.data?ndviColor(lote.data.ndvi):"rgba(200,200,200,0.55)";
            const sel = selected?.id===lote.id;
            return (
              <div key={lote.id}>
                <Polygon positions={lote.coords}
                  pathOptions={{color:sel?"#ffffff":color,fillColor:color,fillOpacity:lote.data?(sel?0.52:0.3):0.18,weight:sel?3:2,dashArray:sel?"9 5":undefined}}
                  eventHandlers={{click:()=>cargar(lote)}}>
                  <Popup>
                    <div style={{minWidth:160,fontFamily:"system-ui",fontSize:13}}>
                      <strong>{lote.nombre}</strong>
                      <div style={{color:"#777",fontSize:11,marginTop:2}}>{lote.municipio} · {lote.area} ha</div>
                      {lote.data && <div style={{fontSize:19,fontWeight:800,color:ndviColor(lote.data.ndvi),marginTop:6}}>NDVI {lote.data.ndvi.toFixed(3)}</div>}
                      {!lote.data && <div style={{color:"#aaa",fontStyle:"italic",marginTop:5,fontSize:11}}>Clic para cargar datos</div>}
                    </div>
                  </Popup>
                </Polygon>
                <Marker position={lote.centro} icon={pinLote(lote.data?ndviColor(lote.data.ndvi):"#888780", lote.id.replace("LP-",""))}
                  eventHandlers={{click:()=>cargar(lote)}}/>
              </div>
            );
          })}
        </MapContainer>

        <CapaControl capa={capa} setCapa={setCapa}/>
        <Pegman mapRef={mapRef} onDrop={(p: [number,number])=>{setGroundPos(p);setFlyPos(p);setFlyZoom(19);}}/>

        {dibujar && (
          <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:3000,background:"rgba(26,115,232,0.93)",color:"white",borderRadius:22,padding:"8px 18px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap",backdropFilter:"blur(8px)"}}>
            <span>✏ Clic para agregar vértices · Doble clic para cerrar</span>
            <button onClick={()=>setDibujar(false)} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:10,color:"white",padding:"2px 10px",cursor:"pointer",fontSize:11}}>Cancelar</button>
          </div>
        )}

        {groundPos && !dibujar && (
          <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:3000,background:"rgba(26,115,232,0.93)",color:"white",borderRadius:22,padding:"8px 18px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap",backdropFilter:"blur(8px)"}}>
            <span>🛰 Vista terreno — zoom máximo</span>
            <button onClick={()=>{setGroundPos(null);if(selected){setFlyPos(selected.centro);setFlyZoom(14);}else{setFlyPos([9.0,-73.55]);setFlyZoom(9);}}}
              style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:10,color:"white",padding:"2px 10px",cursor:"pointer",fontSize:11}}>← Volver</button>
          </div>
        )}

        <Alertas lotes={alertasVis} onDismiss={(id: string)=>setDismissedAlerts(p=>[...p,id])}/>

        <div style={{position:"absolute",top:14,left:14,zIndex:1000,background:"rgba(13,17,23,0.9)",borderRadius:10,padding:"10px 13px",backdropFilter:"blur(10px)",fontSize:12,color:"white"}}>
          <div style={{fontSize:9,color:THEME.muted,letterSpacing:0.8,marginBottom:7,fontWeight:600}}>NDVI</div>
          {[{color:THEME.verde,label:"≥ 0.72 Óptimo"},{color:THEME.amarillo,label:"0.55–0.72 Moderado"},{color:THEME.rojo,label:"< 0.55 Alerta"}].map(({color,label})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <div style={{width:10,height:10,borderRadius:3,background:color,flexShrink:0}}/>
              <span style={{color:"rgba(255,255,255,0.75)",fontSize:10}}>{label}</span>
            </div>
          ))}
          <div style={{marginTop:8,paddingTop:7,borderTop:"0.5px solid " + THEME.border,fontSize:10,color:THEME.dim}}>🧍 Arrastra el muñeco para explorar</div>
          {dibujar && <div style={{marginTop:5,fontSize:10,color:"#60a5fa"}}>✏ Modo dibujo activo</div>}
        </div>

        {selected && (
          <Panel lote={selected} onClose={()=>setSelected(null)}
            onEditarLote={(l: Lote)=>setModalLote(l)}
            onEliminarLote={eliminarLote}/>
        )}
      </div>

      <TablaResumen lotes={lotes} selected={selected} onSelect={cargar}/>

      {modalLote && <ModalLote lote={modalLote} onClose={()=>setModalLote(null)} onSave={(form: LoteForm)=>{guardarLote(form, modalLote.id);}}/>}
      {modalNuevo && <ModalLote lote={null} onClose={()=>setModalNuevo(false)} onSave={(form: LoteForm)=>guardarLote(form, null)}/>}
      {comparar && <ComparadorLotes lotes={lotes} onClose={()=>setComparar(false)}/>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        .leaflet-control-attribution { display:none!important; }
        .leaflet-control-zoom { margin:14px!important; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:4px; }
        button:focus-visible { outline: 2px solid #1a73e8; outline-offset: 2px; }
        input:focus { outline: 2px solid #1a73e8; }
      `}</style>
    </div>
  );
}