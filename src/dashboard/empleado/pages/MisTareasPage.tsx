import { useState, useEffect, useCallback, useRef } from "react";
import type { UsuarioEmp } from "../DashboardEmpleado";

const API = "http://localhost:3000";

type Estado = "Pendiente" | "En progreso" | "Completado";

interface AsignacionTarea {
  idasigtarea: number;
  estado: string;
  idempleado: { idusuario: number };
}

interface TareaBackend {
  idtarea: number;
  tipoactividad: string;
  fechaprogramada: string;
  estado: string;
  costototal: number | null;
  esrecurrente: string;
  asignacionTareas: AsignacionTarea[];
}

const ESTADO_LABELS: Record<Estado, string> = {
  Pendiente: "Pendiente",
  "En progreso": "En progreso",
  Completado: "Completada",
};

const ESTADO_COLORS: Record<Estado, React.CSSProperties> = {
  Pendiente:    { background: "#fef9c3", color: "#ca8a04" },
  "En progreso":{ background: "#dbeafe", color: "#1d4ed8" },
  Completado:   { background: "#dcfce7", color: "#16a34a" },
};

const pill: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 99,
  fontSize: 11,
  fontWeight: 600,
};

function normalizeEstado(e: string): Estado {
  const s = (e ?? "").toLowerCase();
  if (s.includes("prog") || s.includes("proceso")) return "En progreso";
  if (s.includes("complet") || s.includes("finaliz")) return "Completado";
  return "Pendiente";
}

/* ── Estado UI por tarea ─────────────────────────────────────────── */
interface TareaUI {
  obsTexto: string;
  obsAbierta: boolean;
  obsSaved: boolean;
  evidencia: File | null;
  evidenciaPreview: string | null;
  enviando: boolean;
  enviado: boolean;
  errorEnvio: string | null;
}

const initUI = (): TareaUI => ({
  obsTexto: "",
  obsAbierta: false,
  obsSaved: false,
  evidencia: null,
  evidenciaPreview: null,
  enviando: false,
  enviado: false,
  errorEnvio: null,
});

export default function MisTareas({ usuario }: { usuario: UsuarioEmp }) {
  const [tareas,  setTareas]  = useState<TareaBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState<Estado | "todas">("todas");
  const [saving,  setSaving]  = useState<number | null>(null);
  const [userId,  setUserId]  = useState<number | null>(null);
  const [ui,      setUi]      = useState<Record<number, TareaUI>>({});
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const patchUI = (id: number, patch: Partial<TareaUI>) =>
    setUi(prev => ({ ...prev, [id]: { ...(prev[id] ?? initUI()), ...patch } }));
  const getUI = (id: number): TareaUI => ui[id] ?? initUI();

  /* ── cargar userId ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (raw) { const u = JSON.parse(raw); setUserId(u.id ?? null); }
    } catch { /* nada */ }
  }, []);

  /* ── cargar tareas ── */
  const cargarTareas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/tareas`);
      if (!res.ok) throw new Error();
      const todas: TareaBackend[] = await res.json();
      setTareas(todas.filter(t =>
        t.asignacionTareas?.some(a => a.idempleado?.idusuario === userId)
      ));
    } catch { setTareas([]); }
    finally  { setLoading(false); }
  }, [userId]);

  useEffect(() => { if (userId !== null) cargarTareas(); }, [userId, cargarTareas]);

  /* ── cambiar estado (solo Pendiente / En progreso) ── */
  const cambiarEstado = async (id: number, nuevoEstado: Estado) => {
    if (nuevoEstado === "Completado") return;
    setSaving(id);
    setTareas(prev => prev.map(t => t.idtarea === id ? { ...t, estado: nuevoEstado } : t));
    try {
      await fetch(`${API}/api/v1/tareas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch { await cargarTareas(); }
    finally { setSaving(null); }
  };

  /* ── foto seleccionada ── */
  const onFoto = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    patchUI(id, { evidencia: file, evidenciaPreview: url, errorEnvio: null });
  };

  /* ── confirmar foto → completar + PDF + correo ── */
  const confirmar = async (tarea: TareaBackend) => {
    const state = getUI(tarea.idtarea);
    if (!state.evidencia) return;
    patchUI(tarea.idtarea, { enviando: true, errorEnvio: null });

    try {
      const asignacion = tarea.asignacionTareas?.find(
        a => a.idempleado?.idusuario === userId
      );
      const fd = new FormData();
      fd.append("evidencia",       state.evidencia);
      fd.append("observaciones",   state.obsTexto);
      fd.append("idtarea",         String(tarea.idtarea));
      fd.append("tipoactividad",   tarea.tipoactividad ?? "");
      fd.append("fechaprogramada", tarea.fechaprogramada?.split("T")[0] ?? "");
      fd.append("nombreEmpleado",  usuario.nombre ?? "");
      fd.append("lote",            usuario.lote   ?? "");
      if (asignacion) fd.append("idasigtarea", String(asignacion.idasigtarea));

      const res = await fetch(
        `${API}/api/v1/tareas/${tarea.idtarea}/completar-con-evidencia`,
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Error al procesar");
      }
      setTareas(prev =>
        prev.map(t => t.idtarea === tarea.idtarea ? { ...t, estado: "Completado" } : t)
      );
      patchUI(tarea.idtarea, { enviando: false, enviado: true, obsAbierta: false });
    } catch (err) {
      patchUI(tarea.idtarea, {
        enviando: false,
        errorEnvio: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  /* ── filtros ── */
  const tareasFiltradas = filtro === "todas"
    ? tareas
    : tareas.filter(t => normalizeEstado(t.estado) === filtro);

  const cnt = (e: Estado) => tareas.filter(t => normalizeEstado(t.estado) === e).length;
  const FILTROS: (Estado | "todas")[] = ["todas","Pendiente","En progreso","Completado"];

  if (loading)
    return <div style={{ textAlign:"center", padding:48, color:"#6b7280", fontSize:14 }}>
      Cargando tus tareas...
    </div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ENCABEZADO */}
      <div>
        <h2 style={{ fontSize:18, fontWeight:600, margin:0, color:"var(--db-text,#111)" }}>
          Mis Tareas
        </h2>
        <p style={{ fontSize:13, color:"#6b7280", margin:"4px 0 0" }}>
          {usuario.nombre} · {usuario.lote}
        </p>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Pendientes",  value:cnt("Pendiente"),  color:"#ca8a04", bg:"#fef9c3" },
          { label:"En progreso", value:cnt("En progreso"),color:"#1d4ed8", bg:"#dbeafe" },
          { label:"Completadas", value:cnt("Completado"), color:"#16a34a", bg:"#dcfce7" },
        ].map(m => (
          <div key={m.label} style={{
            background:"#fff", border:"0.5px solid #e5e7eb",
            borderRadius:12, padding:"14px 16px",
          }}>
            <div style={{ fontSize:12, color:"#6b7280", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:m.color }}>{m.value}</div>
            <div style={{ height:4, borderRadius:99, background:m.bg, marginTop:8 }} />
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {FILTROS.map(f => {
          const active = filtro === f;
          return (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding:"5px 14px", borderRadius:99,
              border: active ? "none" : "0.5px solid #e5e7eb",
              background: active ? "#16a34a" : "#fff",
              color: active ? "#fff" : "#6b7280",
              fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s",
            }}>
              {f === "todas" ? "Todas" : ESTADO_LABELS[f as Estado]}
            </button>
          );
        })}
      </div>

      {/* LISTA */}
      {tareasFiltradas.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:13 }}>
          No tienes tareas{filtro !== "todas" ? ` con estado "${ESTADO_LABELS[filtro as Estado]}"` : " asignadas"}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {tareasFiltradas.map(tarea => {
            const est   = normalizeEstado(tarea.estado);
            const fecha = tarea.fechaprogramada?.split("T")[0] ?? null;
            const state = getUI(tarea.idtarea);
            const completada = est === "Completado";

            return (
              <div key={tarea.idtarea} style={{
                background:"#fff",
                border:`0.5px solid ${state.errorEnvio ? "#fca5a5" : "#e5e7eb"}`,
                borderRadius:12,
                padding:"16px 18px",
                transition:"border-color .2s",
              }}>

                {/* ── TÍTULO + BADGE ── */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                  <span style={{
                    fontSize:14, fontWeight:600,
                    color: completada ? "#9ca3af" : "#111",
                    textDecoration: completada ? "line-through" : "none",
                  }}>
                    {tarea.tipoactividad ?? "—"}
                  </span>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    {state.enviado && (
                      <span style={{ ...pill, background:"#dcfce7", color:"#16a34a" }}>
                        ✅ Correo enviado
                      </span>
                    )}
                    <span style={{ ...pill, ...ESTADO_COLORS[est] }}>
                      {ESTADO_LABELS[est]}
                    </span>
                  </div>
                </div>

                {/* ── META ── */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                  {fecha && (
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#6b7280" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                        <line x1="3"  y1="10" x2="21" y2="10"/>
                      </svg>
                      {fecha}
                    </span>
                  )}
                  {tarea.esrecurrente === "Si" && (
                    <span style={{ ...pill, background:"#f0fdf4", color:"#16a34a" }}>🔁 Recurrente</span>
                  )}
                </div>

                {/* ── FILA DE ACCIONES ── */}
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>

                  {/* Selector estado (solo si no está completada) */}
                  {!completada && (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:"#6b7280" }}>Estado:</span>
                      <select
                        value={est}
                        disabled={saving === tarea.idtarea}
                        onChange={e => cambiarEstado(tarea.idtarea, e.target.value as Estado)}
                        style={{
                          padding:"5px 10px", border:"0.5px solid #e5e7eb",
                          borderRadius:8, fontSize:12, background:"#fff",
                          color:"#374151", cursor:"pointer", fontFamily:"inherit",
                        }}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En progreso">En progreso</option>
                      </select>
                      {saving === tarea.idtarea && (
                        <span style={{ fontSize:11, color:"#6b7280" }}>Guardando...</span>
                      )}
                    </div>
                  )}

                  {/* ── BOTÓN CÁMARA ── siempre visible */}
                  {!completada && (
                    <>
                      {/* input file oculto — capture=environment abre la cámara trasera en móvil */}
                      <input
                        ref={el => { fileRefs.current[tarea.idtarea] = el; }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display:"none" }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) onFoto(tarea.idtarea, f);
                          // reset para permitir volver a elegir la misma foto
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileRefs.current[tarea.idtarea]?.click()}
                        title="Tomar o elegir foto de evidencia"
                        style={{
                          display:"flex", alignItems:"center", gap:6,
                          padding:"6px 13px", borderRadius:8,
                          border: state.evidencia ? "1.5px solid #16a34a" : "0.5px solid #e5e7eb",
                          background: state.evidencia ? "#f0fdf4" : "#fff",
                          color: state.evidencia ? "#16a34a" : "#374151",
                          fontSize:12, fontWeight:600,
                          cursor:"pointer", fontFamily:"inherit",
                          transition:"all .15s",
                        }}
                      >
                        {/* ícono cámara */}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        {state.evidencia ? "📷 Foto lista" : "Tomar foto"}
                      </button>
                    </>
                  )}

                  {/* Botón observaciones */}
                  {!completada && (
                    <button
                      onClick={() => patchUI(tarea.idtarea, { obsAbierta: !state.obsAbierta })}
                      style={{
                        display:"flex", alignItems:"center", gap:5,
                        padding:"6px 13px", border:"0.5px solid #e5e7eb",
                        borderRadius:8, fontSize:12,
                        background: state.obsAbierta ? "#f3f4f6" : "#fff",
                        color:"#374151", cursor:"pointer", fontFamily:"inherit",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      {state.obsAbierta ? "Cerrar" : "Observaciones"}
                      {state.obsSaved && !state.obsAbierta && (
                        <span style={{ width:7, height:7, borderRadius:"50%", background:"#16a34a", display:"inline-block" }} />
                      )}
                    </button>
                  )}

                  {/* Botón confirmar (aparece solo cuando hay foto) */}
                  {!completada && state.evidencia && (
                    <button
                      disabled={state.enviando}
                      onClick={() => confirmar(tarea)}
                      style={{
                        display:"flex", alignItems:"center", gap:6,
                        padding:"6px 14px", borderRadius:8, border:"none",
                        background: state.enviando
                          ? "#e5e7eb"
                          : "linear-gradient(135deg,#16a34a,#15803d)",
                        color: state.enviando ? "#9ca3af" : "#fff",
                        fontSize:12, fontWeight:700,
                        cursor: state.enviando ? "not-allowed" : "pointer",
                        fontFamily:"inherit", transition:"all .2s",
                      }}
                    >
                      {state.enviando ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            style={{ animation:"spin 1s linear infinite" }}>
                            <path d="M21 12a9 9 0 11-6.219-8.56"/>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Completar y enviar
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* ── PREVIEW FOTO ── */}
                {state.evidenciaPreview && !completada && (
                  <div style={{ marginTop:12, position:"relative", display:"inline-block", width:"100%" }}>
                    <img
                      src={state.evidenciaPreview}
                      alt="Evidencia"
                      style={{
                        width:"100%", maxHeight:200, objectFit:"cover",
                        borderRadius:8, border:"1px solid #e2e8f0",
                      }}
                    />
                    {/* botón quitar foto */}
                    <button
                      onClick={() => patchUI(tarea.idtarea, { evidencia:null, evidenciaPreview:null })}
                      style={{
                        position:"absolute", top:7, right:7,
                        width:26, height:26, borderRadius:"50%",
                        background:"rgba(0,0,0,0.55)", border:"none",
                        color:"#fff", fontSize:16, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}
                    >×</button>
                    <div style={{ fontSize:11, color:"#6b7280", marginTop:4 }}>
                      📎 {state.evidencia?.name} · {((state.evidencia?.size ?? 0) / 1024).toFixed(0)} KB
                    </div>
                  </div>
                )}

                {/* ── ÁREA OBSERVACIONES ── */}
                {!completada && state.obsAbierta && (
                  <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                    <textarea
                      rows={3}
                      placeholder="Escribe tu observación sobre esta tarea..."
                      value={state.obsTexto}
                      onChange={e => patchUI(tarea.idtarea, { obsTexto: e.target.value })}
                      style={{
                        width:"100%", padding:"8px 12px",
                        border:"0.5px solid #e5e7eb", borderRadius:8,
                        fontSize:13, color:"#374151", resize:"vertical",
                        boxSizing:"border-box", fontFamily:"inherit",
                      }}
                    />
                    <button
                      onClick={() => patchUI(tarea.idtarea, { obsAbierta:false, obsSaved:true })}
                      style={{
                        alignSelf:"flex-end", padding:"6px 16px",
                        background:"#16a34a", color:"#fff", border:"none",
                        borderRadius:8, fontSize:13, fontWeight:600,
                        cursor:"pointer", fontFamily:"inherit",
                      }}
                    >
                      Guardar observación
                    </button>
                  </div>
                )}

                {/* ── ERROR ── */}
                {state.errorEnvio && (
                  <div style={{
                    marginTop:10, padding:"8px 12px",
                    background:"#fef2f2", border:"1px solid #fecaca",
                    borderRadius:8, fontSize:12, color:"#dc2626",
                  }}>
                    ⚠️ {state.errorEnvio}
                  </div>
                )}

                {/* ── FOTO + nota cuando ya está completada ── */}
                {completada && state.evidenciaPreview && (
                  <div style={{ marginTop:10 }}>
                    <img
                      src={state.evidenciaPreview}
                      alt="Evidencia registrada"
                      style={{
                        width:"100%", maxHeight:140,
                        objectFit:"cover", borderRadius:8, opacity:0.65,
                      }}
                    />
                    <p style={{ fontSize:11, color:"#9ca3af", margin:"4px 0 0" }}>
                      Evidencia registrada ✓
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}