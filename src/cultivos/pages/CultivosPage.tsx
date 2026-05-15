import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3000';

interface CultivoBackend {
  idcultivo: number;
  nombrelote: string | null;
  fechasiembra: string | null;
  fechacosechaestimada: string | null;
  alertan8n: string | null;
  idlote: { idlote: number; nombre: string | null; areahectareas?: number | null } | null;
  idadminsupervisor: { idusuario: number } | null;
}

interface LoteBackend {
  idlote: number;
  nombre: string;
}

interface Mensaje { rol: 'user' | 'assistant'; texto: string; }

/* ── SYSTEM PROMPT ───────────────────────────────────────────────────────── */
const SYSTEM_CULTIVOS = `Eres AgroBot, el asistente inteligente del módulo de Cultivos de AgroSmart.
Ayudas a los administradores a gestionar cultivos agrícolas.
Lo que puedes explicar:
- Cómo crear un nuevo cultivo (botón "+ Nuevo cultivo")
- Qué es la fecha de siembra y la fecha de cosecha estimada
- Qué significan los estados: Activo, Cosechado, Sin fecha
- Cómo asignar un lote a un cultivo
- Cómo eliminar un cultivo (botón ✕)
- Qué es el campo "nombre del cultivo"
- Cómo interpretar la tabla de cultivos registrados
Responde siempre en español, de forma breve y amigable. Máximo 3 oraciones por respuesta.`;

/* ── GUÍA RÁPIDA DATA ────────────────────────────────────────────────────── */
const GUIA_ITEMS = [
  {
    icon: '＋',
    titulo: 'Nuevo cultivo',
    desc: 'Haz clic en "+ Nuevo cultivo" (arriba a la derecha) para registrar un nuevo cultivo.',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    icon: '📅',
    titulo: 'Fecha de siembra',
    desc: 'Indica cuándo se sembró el cultivo. Sirve para llevar el historial y calcular tiempos.',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    icon: '🌾',
    titulo: 'Cosecha estimada',
    desc: 'Fecha en que se espera cosechar. Si es futura el estado es "Activo"; si ya pasó, "Cosechado".',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    icon: '🏷️',
    titulo: 'Estados',
    desc: 'Activo → cosecha futura. Cosechado → fecha de cosecha ya pasó. Sin fecha → no tiene fecha asignada.',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    icon: '🗺️',
    titulo: 'Asignar lote',
    desc: 'Puedes asociar el cultivo a un lote existente para ubicarlo geográficamente en la finca.',
    color: '#0f766e',
    bg: '#f0fdfa',
    border: '#99f6e4',
  },
  {
    icon: '✕',
    titulo: 'Eliminar cultivo',
    desc: 'Usa el botón ✕ al final de cada fila en la tabla para eliminar ese cultivo.',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  },
];

/* ── WIDGET AGROBOT ──────────────────────────────────────────────────────── */
function AgrobotWidget() {
  const [abierto, setAbierto]     = useState(false);
  const [tab, setTab]             = useState<'guia' | 'chat'>('guia');
  const [mensajes, setMensajes]   = useState<Mensaje[]>([
    { rol: 'assistant', texto: '¡Hola! Soy AgroBot 🌿 ¿En qué te puedo ayudar con los cultivos?' },
  ]);
  const [input, setInput]         = useState('');
  const [cargando, setCargando]   = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);

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
          system: SYSTEM_CULTIVOS,
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
    '¿Cómo creo un cultivo?',
    '¿Qué significa "Cosechado"?',
    '¿Cómo asigno un lote?',
    '¿Para qué sirve la fecha de siembra?',
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

      {/* FAB */}
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

      {/* PANEL */}
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
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Asistente de Cultivos</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }} />
            </div>
          </div>

          <div className="aw-tabs">
            <button className={`aw-tab ${tab === 'guia' ? 'active' : ''}`} onClick={() => setTab('guia')}>
              📋 Guía rápida
            </button>
            <button className={`aw-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
              💬 Preguntar
            </button>
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

/* ── CULTIVOS PAGE ───────────────────────────────────────────────────────── */
export default function Cultivos() {
  const [cultivos, setCultivos] = useState<CultivoBackend[]>([]);
  const [lotes, setLotes]       = useState<LoteBackend[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [adminId, setAdminId]   = useState<number | null>(null);

  const [form, setForm] = useState({
    nombrelote: '',
    fechasiembra: '',
    fechacosechaestimada: '',
    idlote: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) setAdminId(JSON.parse(raw).id ?? null);
    } catch { /* nada */ }
  }, []);

  const cargarCultivos = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/cultivos`);
      if (!res.ok) throw new Error();
      setCultivos(await res.json());
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const cargarLotes = async () => {
    try {
      const res = await fetch(`${API}/lotes`);
      if (!res.ok) return;
      setLotes(await res.json());
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    cargarCultivos();
    cargarLotes();
  }, []);

  const guardar = async () => {
    if (!form.nombrelote.trim()) return;
    try {
      setSaving(true);
      const body: any = {
        nombrelote:           form.nombrelote,
        fechasiembra:         form.fechasiembra         || undefined,
        fechacosechaestimada: form.fechacosechaestimada || undefined,
        idlote:               form.idlote ? Number(form.idlote) : undefined,
        idadminsupervisor:    adminId ?? undefined,
      };
      const res = await fetch(`${API}/cultivos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al crear cultivo');
      setModal(false);
      setForm({ nombrelote: '', fechasiembra: '', fechacosechaestimada: '', idlote: '' });
      await cargarCultivos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este cultivo?')) return;
    try {
      await fetch(`${API}/cultivos/${id}`, { method: 'DELETE' });
      await cargarCultivos();
    } catch {
      setError('Error al eliminar');
    }
  };

  const formatFecha = (f: string | null) => f ? f.split('T')[0] : '—';

  const estadoBadge = (c: CultivoBackend) => {
    if (!c.fechacosechaestimada) return { label: 'Sin fecha', cls: 'badge-yellow' };
    const hoy = new Date();
    const cosecha = new Date(c.fechacosechaestimada);
    return cosecha > hoy
      ? { label: 'Activo',    cls: 'badge-green' }
      : { label: 'Cosechado', cls: 'badge-blue'  };
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };

  return (
    <>
      <p className="page-title">Gestión de Cultivos</p>
      <p className="page-sub">Registro y seguimiento de todos los cultivos</p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <span>Cultivos registrados</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo cultivo</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Cargando cultivos...</div>
        ) : cultivos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>No hay cultivos registrados</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th><th>Cultivo</th><th>Siembra</th><th>Lote</th><th>Estado</th><th>Cosecha est.</th><th></th>
              </tr>
            </thead>
            <tbody>
              {cultivos.map(c => {
                const badge = estadoBadge(c);
                return (
                  <tr key={c.idcultivo}>
                    <td style={{ color: 'black' }}>{c.idcultivo}</td>
                    <td style={{ color: 'black' }}>{c.nombrelote ?? '—'}</td>
                    <td style={{ color: 'black' }}>{formatFecha(c.fechasiembra)}</td>
                    <td style={{ color: 'black' }}>{c.idlote ? (c.idlote.nombre ?? `Lote #${c.idlote.idlote}`) : '—'}</td>
                    <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td style={{ color: 'black' }}>{formatFecha(c.fechacosechaestimada)}</td>
                    <td><button className="act-btn" onClick={() => eliminar(c.idcultivo)}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NUEVO CULTIVO */}
      {modal && (
        <div
          onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
        >
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>NUEVO CULTIVO</h3>

            <input
              placeholder="Nombre del cultivo *"
              value={form.nombrelote}
              onChange={e => setForm({ ...form, nombrelote: e.target.value })}
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>Fecha de siembra</label>
                <input
                  type="date"
                  value={form.fechasiembra}
                  onChange={e => setForm({ ...form, fechasiembra: e.target.value })}
                  style={{ ...inputStyle, width: 'auto' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>Cosecha estimada</label>
                <input
                  type="date"
                  value={form.fechacosechaestimada}
                  onChange={e => setForm({ ...form, fechacosechaestimada: e.target.value })}
                  style={{ ...inputStyle, width: 'auto' }}
                />
              </div>
            </div>

            {lotes.length > 0 && (
              <select
                value={form.idlote}
                onChange={e => setForm({ ...form, idlote: e.target.value })}
                style={inputStyle}
              >
                <option value="">— Seleccionar lote (opcional) —</option>
                {lotes.map(l => (
                  <option key={l.idlote} value={l.idlote}>{l.nombre ?? `Lote #${l.idlote}`}</option>
                ))}
              </select>
            )}

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

      <AgrobotWidget />
    </>
  );
}