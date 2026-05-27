import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3000';

// ── INTERFACES ───────────────────────────────────────────────────────────────
// Campos reales que devuelve el backend (palma.entity.ts)
interface PalmaBackend {
  idpalma: number;
  codigo: string | null;
  variedad: string | null;
  fechasiembra: string | null;
  estadosanitario: string | null;
  observaciones: string | null;
  idlote?: { idlote: number; nombre?: string };
}

interface Diagnostico {
  nombre: string; descripcion: string; tratamiento: string;
  confianza: number; saludable: boolean;
}

interface Mensaje { rol: 'user' | 'assistant'; texto: string; }

const KINDWISE_KEY = 'nl9k3l47CDfEXPqff80WkCzRKSCJ2aJqeNlyu59woLPQ4QxDsp';
const KINDWISE_URL = 'https://crop.kindwise.com/api/v1/identification';

/* ── SYSTEM PROMPT ───────────────────────────────────────────────────────── */
const SYSTEM_PALMAS = `Eres AgroBot, el asistente inteligente del módulo de Palmas de AgroSmart.
Ayudas a los administradores a gestionar el registro individual de palmas por lote.
Lo que puedes explicar:
- Cómo registrar una nueva palma (botón "+ Registrar palma")
- Qué es el código de palma y cómo asignarlo (Ej: PAL-005)
- Qué es la variedad de la palma
- Cómo asignar un lote a una palma
- Qué significa el estado sanitario: Saludable y En observación
- Cómo usar el análisis de enfermedades con IA (botón "Analizar palma con IA")
- Cómo interpretar los resultados del diagnóstico de enfermedades
- Cómo eliminar una palma (botón ✕)
- Cómo interpretar las métricas: total de palmas, saludables y en observación
Responde siempre en español, de forma breve y amigable. Máximo 3 oraciones por respuesta.`;

/* ── GUÍA RÁPIDA DATA ────────────────────────────────────────────────────── */
const GUIA_ITEMS = [
  {
    icon: '＋',
    titulo: 'Registrar palma',
    desc: 'Haz clic en "+ Registrar palma" (arriba a la derecha de la tabla) para añadir una nueva palma al sistema.',
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
  },
  {
    icon: '🏷️',
    titulo: 'Código de palma',
    desc: 'Cada palma tiene un código único (Ej: PAL-005). Sirve para identificarla individualmente dentro del lote.',
    color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd',
  },
  {
    icon: '🌴',
    titulo: 'Variedad',
    desc: 'Registra la variedad genética de la palma (Ej: Deli x Ghana). Útil para diferenciar comportamientos productivos.',
    color: '#b45309', bg: '#fffbeb', border: '#fde68a',
  },
  {
    icon: '🌿',
    titulo: 'Estado sanitario',
    desc: 'Saludable → la palma está en buen estado. En observación → presenta alguna anomalía que requiere seguimiento.',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
  },
  {
    icon: '🤖',
    titulo: 'Análisis con IA',
    desc: 'Sube una foto de la palma y la IA detectará enfermedades o plagas automáticamente usando Kindwise crop.health.',
    color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4',
  },
  {
    icon: '✕',
    titulo: 'Eliminar palma',
    desc: 'Usa el botón ✕ al final de cada fila en la tabla para eliminar esa palma del registro.',
    color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
  },
];

/* ── WIDGET AGROBOT ──────────────────────────────────────────────────────── */
function AgrobotWidget() {
  const [abierto, setAbierto]   = useState(false);
  const [tab, setTab]           = useState<'guia' | 'chat'>('guia');
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', texto: '¡Hola! Soy AgroBot 🌴 ¿En qué te puedo ayudar con las palmas?' },
  ]);
  const [input, setInput]       = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, tab]);

  const enviar = async (textoDirecto?: string) => {
    const texto = (textoDirecto ?? input).trim();
    if (!texto || cargando) return;
    setInput('');
    if (tab !== 'chat') setTab('chat');
    const nuevos: Mensaje[] = [...mensajes, { rol: 'user', texto }];
    setMensajes(nuevos);
    setCargando(true);
    try {
      const res = await fetch(`${API}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PALMAS,
          messages: nuevos.map(m => ({ role: m.rol, content: m.texto })),
        }),
      });
      const data = await res.json();
      setMensajes(prev => [...prev, {
        rol: 'assistant',
        texto: data.content?.[0]?.text ?? 'No pude responder, intenta de nuevo.',
      }]);
    } catch {
      setMensajes(prev => [...prev, { rol: 'assistant', texto: 'Error al conectar con el asistente.' }]);
    } finally { setCargando(false); }
  };

  const SUGERENCIAS = [
    '¿Cómo registro una palma?',
    '¿Qué significa "En observación"?',
    '¿Cómo funciona el análisis con IA?',
    '¿Para qué sirve el código de palma?',
  ];

  return (
    <>
      <style>{`
        @keyframes widgetIn {
          from { opacity:0; transform: scale(.93) translateY(14px); }
          to   { opacity:1; transform: none; }
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .aw-fab {
          position: fixed; bottom: 28px; right: 28px; z-index: 999;
          width: 54px; height: 54px; border-radius: 50%;
          background: linear-gradient(135deg,#16a34a,#059669);
          border: none; cursor: pointer;
          box-shadow: 0 4px 24px rgba(22,163,74,0.45);
          display: flex; align-items: center; justify-content: center;
          transition: transform .2s, box-shadow .2s;
        }
        .aw-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(22,163,74,0.55); }
        .aw-panel {
          position: fixed; bottom: 94px; right: 28px; z-index: 998;
          width: 352px; border-radius: 18px; background: #fff;
          border: 0.5px solid #e5e7eb;
          box-shadow: 0 8px 40px rgba(0,0,0,0.16);
          display: flex; flex-direction: column; overflow: hidden;
          animation: widgetIn .22s cubic-bezier(.34,1.56,.64,1);
        }
        .aw-header {
          background: linear-gradient(135deg,#16a34a,#059669);
          padding: 13px 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .aw-tabs { display: flex; border-bottom: 0.5px solid #e5e7eb; }
        .aw-tab {
          flex: 1; padding: 10px 0; font-size: 13px; font-weight: 600;
          border: none; background: transparent; cursor: pointer;
          color: #94a3b8; transition: color .15s, border-color .15s;
          border-bottom: 2px solid transparent; font-family: inherit;
        }
        .aw-tab.active { color: #16a34a; border-bottom-color: #16a34a; }
        .aw-guia-scroll {
          overflow-y: auto; max-height: 360px; padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .aw-guia-item {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 10px 12px; border-radius: 10px; border: 1px solid;
          cursor: default; transition: filter .15s;
        }
        .aw-guia-item:hover { filter: brightness(.97); }
        .aw-guia-icon { font-size: 18px; line-height: 1; flex-shrink: 0; margin-top: 1px; }
        .aw-guia-ask {
          margin-top: 5px; padding: 3px 9px; border-radius: 99px;
          font-size: 11px; font-weight: 600; border: 1px solid;
          cursor: pointer; font-family: inherit; transition: opacity .15s;
        }
        .aw-guia-ask:hover { opacity: .75; }
        .aw-chat-body {
          flex: 1; overflow-y: auto; padding: 14px;
          display: flex; flex-direction: column; gap: 10px; max-height: 320px;
        }
        .aw-bubble-wrap { display: flex; }
        .aw-bubble { max-width: 82%; padding: 8px 12px; font-size: 13px; line-height: 1.5; }
        .aw-bubble.user {
          background: #16a34a; color: #fff;
          border-radius: 14px 14px 4px 14px; margin-left: auto;
        }
        .aw-bubble.bot { background: #f3f4f6; color: #111; border-radius: 14px 14px 14px 4px; }
        .aw-input-row {
          padding: 10px 14px; border-top: 0.5px solid #e5e7eb;
          display: flex; gap: 8px; align-items: center;
        }
        .aw-input {
          flex: 1; padding: 8px 12px; border: 1px solid #e5e7eb;
          border-radius: 99px; font-size: 13px; color: #111;
          outline: none; font-family: inherit;
        }
        .aw-send {
          width: 34px; height: 34px; border-radius: 50%; border: none;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s; cursor: pointer; flex-shrink: 0;
        }
        .aw-chips { padding: 0 14px 10px; display: flex; flex-wrap: wrap; gap: 6px; }
        .aw-chip {
          padding: 4px 10px; border-radius: 99px; font-size: 11px;
          font-weight: 500; background: #f0fdf4; color: #16a34a;
          border: 1px solid #bbf7d0; cursor: pointer; font-family: inherit;
          transition: background .15s;
        }
        .aw-chip:hover { background: #dcfce7; }
      `}</style>

      <button className="aw-fab" onClick={() => setAbierto(v => !v)} title="AgroBot — Ayuda">
        {abierto
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/>
              <circle cx="8.5" cy="11" r="1" fill="#fff"/>
              <circle cx="12" cy="11" r="1" fill="#fff"/>
              <circle cx="15.5" cy="11" r="1" fill="#fff"/>
            </svg>
        }
      </button>

      {abierto && (
        <div className="aw-panel">
          <div className="aw-header">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AgroBot</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Asistente de Palmas</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }} />
            </div>
          </div>

          <div className="aw-tabs">
            <button className={`aw-tab ${tab === 'guia' ? 'active' : ''}`} onClick={() => setTab('guia')}>📋 Guía rápida</button>
            <button className={`aw-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>💬 Preguntar</button>
          </div>

          {tab === 'guia' && (
            <div className="aw-guia-scroll">
              {GUIA_ITEMS.map((item) => (
                <div key={item.titulo} className="aw-guia-item" style={{ background: item.bg, borderColor: item.border }}>
                  <span className="aw-guia-icon">{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.titulo}</div>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{item.desc}</div>
                    <button
                      className="aw-guia-ask"
                      style={{ background: 'transparent', color: item.color, borderColor: item.border, marginTop: 6 }}
                      onClick={() => enviar(`Explícame más sobre: ${item.titulo}`)}
                    >
                      Saber más →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'chat' && (
            <>
              <div className="aw-chat-body">
                {mensajes.map((m, i) => (
                  <div key={i} className="aw-bubble-wrap">
                    <div className={`aw-bubble ${m.rol === 'user' ? 'user' : 'bot'}`}>{m.texto}</div>
                  </div>
                ))}
                {cargando && (
                  <div className="aw-bubble-wrap">
                    <div className="aw-bubble bot" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', animation: `bounce .9s ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {mensajes.length <= 1 && (
                <div className="aw-chips">
                  {SUGERENCIAS.map(s => (
                    <button key={s} className="aw-chip" onClick={() => enviar(s)}>{s}</button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="aw-input-row">
            <input
              className="aw-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder="Escribe tu pregunta..."
            />
            <button
              className="aw-send"
              onClick={() => enviar()}
              disabled={cargando || !input.trim()}
              style={{ background: input.trim() ? '#16a34a' : '#e5e7eb', cursor: input.trim() ? 'pointer' : 'default' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── PALMAS PAGE ─────────────────────────────────────────────────────────── */
export default function Palmas() {
  const [palmas, setPalmas]           = useState<PalmaBackend[]>([]);
  const [lotes, setLotes]             = useState<{ idlote: number; nombre: string }[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [modal, setModal]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [modalIA, setModalIA]         = useState(false);
  const [imagen, setImagen]           = useState<string | null>(null);
  const [imagenFile, setImagenFile]   = useState<File | null>(null);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [analizando, setAnalizando]   = useState(false);
  const [errorIA, setErrorIA]         = useState('');

  const [form, setForm] = useState({
    codigo: '', idlote: '', variedad: '', fechasiembra: '',
    estadosanitario: 'Saludable', observaciones: '',
  });

  // ── Cargar palmas ────────────────────────────────────────────────────────
  // CORREGIDO: URL correcta sin /api/v1 (palmas no tiene globalPrefix)
  const cargarPalmas = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${API}/palmas`);
      if (!res.ok) throw new Error();
      setPalmas(await res.json());
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ── Cargar lotes para el select ──────────────────────────────────────────
  // CORREGIDO: URL correcta sin /api/v1
  const cargarLotes = async () => {
    try {
      const res = await fetch(`${API}/lotes`);
      if (!res.ok) return;
      const data = await res.json();
      setLotes(data.map((l: any) => ({ idlote: l.idlote, nombre: l.nombre ?? `Lote ${l.idlote}` })));
    } catch { /* silencioso */ }
  };

  useEffect(() => { cargarPalmas(); cargarLotes(); }, []);

  // ── Guardar palma ────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.codigo.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/palmas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo:          form.codigo,
          variedad:        form.variedad      || undefined,
          fechasiembra:    form.fechasiembra  || undefined,
          estadosanitario: form.estadosanitario || undefined,
          observaciones:   form.observaciones  || undefined,
          idlote:          form.idlote ? Number(form.idlote) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setModal(false);
      setForm({ codigo: '', idlote: '', variedad: '', fechasiembra: '', estadosanitario: 'Saludable', observaciones: '' });
      await cargarPalmas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar palma ───────────────────────────────────────────────────────
  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta palma?')) return;
    try {
      await fetch(`${API}/palmas/${id}`, { method: 'DELETE' });
      await cargarPalmas();
    } catch {
      setError('Error al eliminar');
    }
  };

  // ── IA ───────────────────────────────────────────────────────────────────
  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setDiagnostico(null); setErrorIA('');
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analizarPalma = async () => {
    if (!imagenFile) return;
    setAnalizando(true); setErrorIA(''); setDiagnostico(null);
    try {
      const formData = new FormData();
      formData.append('images', imagenFile);
      formData.append('similar_images', 'true');
      const response = await fetch(KINDWISE_URL, {
        method: 'POST',
        headers: { 'Api-Key': KINDWISE_KEY },
        body: formData,
      });
      if (!response.ok) { setErrorIA(`Error del servidor: ${response.status}`); return; }
      const data = await response.json();
      if (data?.result) {
        const isHealthy = data.result.is_healthy?.binary ?? true;
        const disease   = data.result.disease?.suggestions?.[0];
        setDiagnostico({
          nombre:      isHealthy ? 'Palma Saludable' : (disease?.name ?? 'Enfermedad detectada'),
          descripcion: isHealthy ? 'No se detectaron enfermedades visibles.' : (disease?.details?.description ?? 'Se detectaron anomalías.'),
          tratamiento: isHealthy ? 'Continuar con mantenimiento regular.' : (disease?.details?.treatment?.biological?.[0] ?? 'Consultar con agrónomo.'),
          confianza:   Math.round((disease?.probability ?? (isHealthy ? 0.95 : 0.5)) * 100),
          saludable:   isHealthy,
        });
      } else {
        setErrorIA('No se pudo analizar la imagen. Intenta con otra foto.');
      }
    } catch {
      setErrorIA('Error al conectar con el servicio de IA.');
    } finally {
      setAnalizando(false);
    }
  };

  const abrirModalIA = () => {
    setModalIA(true); setImagen(null);
    setImagenFile(null); setDiagnostico(null); setErrorIA('');
  };

  // ── Métricas ─────────────────────────────────────────────────────────────
  // CORREGIDO: usa estadosanitario (campo real del backend)
  const total       = palmas.length;
  const saludables  = palmas.filter(p => !p.estadosanitario || p.estadosanitario === 'Saludable').length;
  const observacion = palmas.filter(p => p.estadosanitario && p.estadosanitario !== 'Saludable').length;
  const pctSalud    = total > 0 ? ((saludables / total) * 100).toFixed(1) : '0';

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };

  return (
    <>
      <style>{`
        .add-btn {
          padding: 10px 18px;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          font-size: 14px;
          color: #ffffff;
          background: linear-gradient(135deg, #16a34a, #059669);
          box-shadow: 0 14px 32px rgba(22, 163, 74, 0.2);
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 38px rgba(22, 163, 74, 0.24);
        }
        .add-btn:active {
          transform: translateY(0);
        }
        .act-btn {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50%;
          border: 1px solid rgba(239, 68, 68, 0.25);
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
        }
        .act-btn:hover {
          background: #fecaca;
          border-color: #f87171;
          transform: scale(1.06);
          box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.12);
        }
        .act-btn:active {
          transform: scale(0.96);
        }
      `}</style>
      <p className="page-title">Gestión de Palmas</p>
      <p className="page-sub">Registro individual de palmas por lote</p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { lbl: 'Total palmas',   val: total.toLocaleString(),       sub: 'En todos los lotes', color: '' },
          { lbl: 'Saludables',     val: saludables.toLocaleString(),  sub: `${pctSalud}%`,       color: '#90cc00' },
          { lbl: 'En observación', val: observacion.toLocaleString(), sub: `${total > 0 ? (100 - Number(pctSalud)).toFixed(1) : 0}%`, color: '#f0c000' },
        ].map(m => (
          <div className="metric-card" key={m.lbl}>
            <div className="metric-label">{m.lbl}</div>
            <div className="metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* IA */}
      <div className="table-card" style={{ marginBottom: 24, marginTop: 24 }}>
        <div className="table-header">
          <span>Detección de enfermedades con IA</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Powered by Kindwise crop.health</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'black', maxWidth: 500 }}>
            Toma una foto de una palma y nuestra IA detectará enfermedades, plagas y su estado sanitario en segundos.
          </p>
          <button className="add-btn" onClick={abrirModalIA}>Analizar palma con IA</button>
        </div>
      </div>

      {/* TABLA */}
      <div className="table-card">
        <div className="table-header">
          <span>Registro de palmas</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Registrar palma</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Cargando palmas...</div>
        ) : palmas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>No hay palmas registradas</div>
        ) : (
          <table>
            <thead>
              {/* CORREGIDO: encabezados con campos reales del backend */}
              <tr>
                <th>Código</th>
                <th>Lote</th>
                <th>Variedad</th>
                <th>Fecha siembra</th>
                <th>Estado sanitario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {palmas.map(p => (
                <tr key={p.idpalma}>
                  {/* CORREGIDO: campos reales del backend */}
                  <td style={{ color: 'black', fontFamily: 'monospace' }}>{p.codigo ?? '—'}</td>
                  <td style={{ color: 'black' }}>{p.idlote?.nombre ?? `Lote ${p.idlote?.idlote ?? '—'}`}</td>
                  <td style={{ color: 'black' }}>{p.variedad ?? '—'}</td>
                  <td style={{ color: 'black' }}>{p.fechasiembra ?? '—'}</td>
                  <td>
                    <span className={`badge ${
                      !p.estadosanitario || p.estadosanitario === 'Saludable'
                        ? 'badge-green'
                        : 'badge-yellow'
                    }`}>
                      {p.estadosanitario ?? 'Saludable'}
                    </span>
                  </td>
                  <td><button className="act-btn" onClick={() => eliminar(p.idpalma)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL REGISTRAR */}
      {modal && (
        <div
          onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
        >
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>REGISTRAR PALMA</h3>

            <input
              placeholder="Código (Ej: PAL-005) *"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value })}
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>Variedad</label>
                <input
                  placeholder="Ej: Deli x Ghana"
                  value={form.variedad}
                  onChange={e => setForm({ ...form, variedad: e.target.value })}
                  style={{ ...inputStyle, width: 'auto' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>Fecha de siembra</label>
                <input
                  type="date"
                  value={form.fechasiembra}
                  onChange={e => setForm({ ...form, fechasiembra: e.target.value })}
                  style={{ ...inputStyle, width: 'auto' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select
                value={form.estadosanitario}
                onChange={e => setForm({ ...form, estadosanitario: e.target.value })}
                style={{ ...inputStyle, width: 'auto' }}
              >
                <option value="Saludable">Saludable</option>
                <option value="En observación">En observación</option>
              </select>
              <select
                value={form.idlote}
                onChange={e => setForm({ ...form, idlote: e.target.value })}
                style={{ ...inputStyle, width: 'auto' }}
              >
                <option value="">— Seleccionar lote —</option>
                {lotes.map(l => <option key={l.idlote} value={l.idlote}>{l.nombre}</option>)}
              </select>
            </div>

            <textarea
              placeholder="Observaciones (opcional)"
              value={form.observaciones}
              onChange={e => setForm({ ...form, observaciones: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => setModal(false)}
                disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', color: '#475569', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#16a34a', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {modalIA && (
        <div
          onClick={e => e.target === e.currentTarget && setModalIA(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
        >
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>ANÁLISIS DE PALMA CON IA</h3>
            <div
              style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
              onClick={() => document.getElementById('input-imagen')?.click()}
            >
              {imagen ? (
                <img src={imagen} alt="Palma" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Haz clic para subir una foto de la palma</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>JPG, PNG — máx 5MB</div>
                </>
              )}
            </div>
            <input id="input-imagen" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />

            {diagnostico && (
              <div style={{ background: diagnostico.saludable ? '#f0fdf4' : '#fef2f2', border: `1px solid ${diagnostico.saludable ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: diagnostico.saludable ? '#16a34a' : '#dc2626' }}>
                    {diagnostico.saludable ? 'Palma Saludable' : 'Enfermedad Detectada'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: diagnostico.saludable ? '#dcfce7' : '#fee2e2', color: diagnostico.saludable ? '#16a34a' : '#dc2626' }}>
                    {diagnostico.confianza}% confianza
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>{diagnostico.nombre}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>{diagnostico.descripcion}</div>
                <div style={{ fontSize: 12, color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                  <strong style={{ color: '#0f172a' }}>Tratamiento recomendado:</strong><br />{diagnostico.tratamiento}
                </div>
              </div>
            )}

            {errorIA && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, fontSize: 13, color: '#dc2626' }}>
                {errorIA}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => setModalIA(false)}
                style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', color: '#475569', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cerrar
              </button>
              <button
                onClick={analizarPalma}
                disabled={!imagenFile || analizando}
                style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#16a34a', color: '#fff', border: 'none', cursor: (!imagenFile || analizando) ? 'not-allowed' : 'pointer', opacity: (!imagenFile || analizando) ? 0.5 : 1, fontFamily: 'inherit' }}
              >
                {analizando ? 'Analizando...' : 'Analizar con IA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AgrobotWidget />
    </>
  );
}