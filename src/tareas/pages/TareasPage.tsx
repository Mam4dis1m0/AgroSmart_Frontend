import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3000';

/* ── INTERFACES ─────────────────────────────────────────────────────────── */
interface EmpleadoAsignado {
  idusuario: number;
  idusuario2?: { primernombre: string; primerapellido: string; };
}
interface AsignacionTarea {
  idasigtarea: number; estado: string; idempleado: EmpleadoAsignado;
}
interface TareaBackend {
  idtarea: number; tipoactividad: string; fechaprogramada: string;
  estado: string; costototal: number; esrecurrente: string;
  asignacionTareas: AsignacionTarea[];
  idadmincreador?: { idusuario: number };
  idcultivo?: { idcultivo: number; nombre?: string };
}
interface EmpleadoAPI { idusuario: number; idusuario2?: { primernombre: string; primerapellido: string; }; }
interface EmpleadoLista { idusuario: number; nombre: string; }
interface Mensaje { rol: 'user' | 'assistant'; texto: string; }

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function nombreEmpleado(t: TareaBackend): string {
  if (!t.asignacionTareas?.length) return '—';
  const u = t.asignacionTareas[0].idempleado?.idusuario2;
  if (u) return `${u.primernombre} ${u.primerapellido}`;
  return `Emp. #${t.asignacionTareas[0].idempleado?.idusuario}`;
}

function normalizeEstado(e: string): 'Pendiente' | 'En progreso' | 'Completado' {
  const s = (e ?? '').toLowerCase();
  if (s.includes('prog') || s.includes('proceso')) return 'En progreso';
  if (s.includes('complet') || s.includes('finaliz')) return 'Completado';
  return 'Pendiente';
}

/* ── SYSTEM PROMPT ───────────────────────────────────────────────────────── */
const SYSTEM_TAREAS = `Eres AgroBot, el asistente inteligente del módulo de Tareas de AgroSmart.
Ayudas a los administradores a gestionar y asignar tareas agrícolas.
Lo que puedes explicar:
- Cómo crear una nueva tarea (botón "+ Nueva tarea")
- Cómo mover tareas entre columnas del tablero Kanban
- Qué significan los estados: Pendiente, En progreso, Completado
- Cómo asignar un empleado a una tarea al crearla
- Cómo filtrar tareas por fecha
- Cómo eliminar o editar una tarea
Responde siempre en español, de forma breve y amigable. Máximo 3 oraciones por respuesta.`;

const GUIA_ITEMS = [
  { icon: '＋', titulo: 'Nueva tarea', desc: 'Haz clic en "+ Nueva tarea" para abrir el formulario de creación.', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: '🗂️', titulo: 'Tablero Kanban', desc: 'Las tareas se organizan en 3 columnas: Pendiente, En progreso y Completado. Muévelas con los botones de flecha.', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: '📅', titulo: 'Filtrar por fecha', desc: 'Usa los campos de fecha para ver solo las tareas dentro de un rango específico.', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { icon: '👤', titulo: 'Asignar empleado', desc: 'Al crear una tarea puedes seleccionar un empleado en el formulario.', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: '✏️', titulo: 'Editar tarea', desc: 'Haz clic en el botón de editar (lápiz) para modificar los datos de una tarea.', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { icon: '🗑️', titulo: 'Eliminar tarea', desc: 'Usa el botón de eliminar (papelera) para borrar una tarea definitivamente.', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

/* ── WIDGET AGROBOT ──────────────────────────────────────────────────────── */
function AgrobotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<'guia' | 'chat'>('guia');
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', texto: '¡Hola! Soy AgroBot 🌿 ¿En qué te puedo ayudar con las tareas?' },
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ system: SYSTEM_TAREAS, messages: nuevos.map(m => ({ role: m.rol, content: m.texto })) }),
      });
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'assistant', texto: data.content?.[0]?.text ?? 'No pude responder.' }]);
    } catch {
      setMensajes(prev => [...prev, { rol: 'assistant', texto: 'Error al conectar.' }]);
    } finally { setCargando(false); }
  };

  const SUGERENCIAS = ['¿Cómo muevo una tarea?', '¿Cómo creo una tarea?', '¿Cómo filtro por fecha?', '¿Cómo asigno un empleado?'];

  return (
    <>
      <style>{`
        @keyframes widgetIn{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:none}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .aw-fab{position:fixed;bottom:28px;right:28px;z-index:999;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);border:none;cursor:pointer;box-shadow:0 4px 24px rgba(22,163,74,0.45);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
        .aw-fab:hover{transform:scale(1.1)}
        .aw-panel{position:fixed;bottom:94px;right:28px;z-index:998;width:352px;border-radius:18px;background:#fff;border:0.5px solid #e5e7eb;box-shadow:0 8px 40px rgba(0,0,0,0.16);display:flex;flex-direction:column;overflow:hidden;animation:widgetIn .22s cubic-bezier(.34,1.56,.64,1)}
        .aw-header{background:linear-gradient(135deg,#16a34a,#059669);padding:13px 16px;display:flex;align-items:center;gap:10px}
        .aw-tabs{display:flex;border-bottom:0.5px solid #e5e7eb}
        .aw-tab{flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;background:transparent;cursor:pointer;color:#94a3b8;transition:color .15s;border-bottom:2px solid transparent;font-family:inherit}
        .aw-tab.active{color:#16a34a;border-bottom-color:#16a34a}
        .aw-guia-scroll{overflow-y:auto;max-height:360px;padding:12px;display:flex;flex-direction:column;gap:8px}
        .aw-guia-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;border:1px solid}
        .aw-guia-ask{margin-top:5px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid;cursor:pointer;font-family:inherit}
        .aw-chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;max-height:320px}
        .aw-bubble-wrap{display:flex}
        .aw-bubble{max-width:82%;padding:8px 12px;font-size:13px;line-height:1.5}
        .aw-bubble.user{background:#16a34a;color:#fff;border-radius:14px 14px 4px 14px;margin-left:auto}
        .aw-bubble.bot{background:#f3f4f6;color:#111;border-radius:14px 14px 14px 4px}
        .aw-input-row{padding:10px 14px;border-top:0.5px solid #e5e7eb;display:flex;gap:8px;align-items:center}
        .aw-input{flex:1;padding:8px 12px;border:1px solid #e5e7eb;border-radius:99px;font-size:13px;color:#111;outline:none;font-family:inherit}
        .aw-send{width:34px;height:34px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .aw-chips{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:6px}
        .aw-chip{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:500;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;cursor:pointer;font-family:inherit}
        .aw-chip:hover{background:#dcfce7}
      `}</style>
      <button className="aw-fab" onClick={() => setAbierto(v => !v)}>
        {abierto
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/><circle cx="8.5" cy="11" r="1" fill="#fff"/><circle cx="12" cy="11" r="1" fill="#fff"/><circle cx="15.5" cy="11" r="1" fill="#fff"/></svg>
        }
      </button>
      {abierto && (
        <div className="aw-panel">
          <div className="aw-header">
            <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/></svg>
            </div>
            <div><div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>AgroBot</div><div style={{ fontSize:11,color:'rgba(255,255,255,0.75)' }}>Asistente de Tareas</div></div>
            <div style={{ marginLeft:'auto' }}><div style={{ width:8,height:8,borderRadius:'50%',background:'#86efac' }} /></div>
          </div>
          <div className="aw-tabs">
            <button className={`aw-tab ${tab==='guia'?'active':''}`} onClick={() => setTab('guia')}>📋 Guía rápida</button>
            <button className={`aw-tab ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>💬 Preguntar</button>
          </div>
          {tab === 'guia' && (
            <div className="aw-guia-scroll">
              {GUIA_ITEMS.map(item => (
                <div key={item.titulo} className="aw-guia-item" style={{ background:item.bg,borderColor:item.border }}>
                  <span style={{ fontSize:18,lineHeight:1,flexShrink:0,marginTop:1 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:item.color,marginBottom:2 }}>{item.titulo}</div>
                    <div style={{ fontSize:12,color:'#374151',lineHeight:1.4 }}>{item.desc}</div>
                    <button className="aw-guia-ask" style={{ background:'transparent',color:item.color,borderColor:item.border,marginTop:6 }} onClick={() => enviar(`Explícame más sobre: ${item.titulo}`)}>Saber más →</button>
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
                    <div className={`aw-bubble ${m.rol==='user'?'user':'bot'}`}>{m.texto}</div>
                  </div>
                ))}
                {cargando && (
                  <div className="aw-bubble-wrap">
                    <div className="aw-bubble bot" style={{ display:'flex',gap:4,alignItems:'center',padding:'10px 14px' }}>
                      {[0,1,2].map(i => <div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#9ca3af',animation:`bounce .9s ${i*0.15}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {mensajes.length <= 1 && (
                <div className="aw-chips">{SUGERENCIAS.map(s => <button key={s} className="aw-chip" onClick={() => enviar(s)}>{s}</button>)}</div>
              )}
            </>
          )}
          <div className="aw-input-row">
            <input className="aw-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&enviar()} placeholder="Escribe tu pregunta..." />
            <button className="aw-send" onClick={() => enviar()} disabled={cargando||!input.trim()} style={{ background:input.trim()?'#16a34a':'#e5e7eb' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── KANBAN COLUMN ───────────────────────────────────────────────────────── */
const COLUMNAS = [
  { key: 'Pendiente',   label: 'Pendientes',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  { key: 'En progreso', label: 'En Proceso',   color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  { key: 'Completado',  label: 'Completadas',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a' },
] as const;

type ColKey = typeof COLUMNAS[number]['key'];

function TareaCard({
  tarea, colKey, onMover, onEliminar, onEditar,
}: {
  tarea: TareaBackend;
  colKey: ColKey;
  onMover: (id: number, dir: 'left' | 'right') => void;
  onEliminar: (id: number) => void;
  onEditar: (t: TareaBackend) => void;
}) {
  const colIdx = COLUMNAS.findIndex(c => c.key === colKey);
  const canLeft  = colIdx > 0;
  const canRight = colIdx < COLUMNAS.length - 1;
  const empleado = nombreEmpleado(tarea);
  const fecha = tarea.fechaprogramada ? tarea.fechaprogramada.split('T')[0] : null;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '14px 14px 12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow .2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
    >
      {/* título */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
        {tarea.tipoactividad ?? '—'}
      </div>

      {/* meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {empleado !== '—' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {empleado}
          </div>
        )}
        {fecha && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {fecha}
          </div>
        )}
        {tarea.costototal != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            ${Number(tarea.costototal).toLocaleString()}
          </div>
        )}
      </div>

      {/* acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {/* mover izquierda */}
          <button
            onClick={() => onMover(tarea.idtarea, 'left')}
            disabled={!canLeft}
            title="Mover a columna anterior"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e7eb',
              background: canLeft ? '#f8fafc' : '#f1f5f9',
              color: canLeft ? '#374151' : '#cbd5e1',
              cursor: canLeft ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          {/* mover derecha */}
          <button
            onClick={() => onMover(tarea.idtarea, 'right')}
            disabled={!canRight}
            title="Mover a columna siguiente"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e7eb',
              background: canRight ? '#f8fafc' : '#f1f5f9',
              color: canRight ? '#374151' : '#cbd5e1',
              cursor: canRight ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
          {/* editar */}
          <button
            onClick={() => onEditar(tarea)}
            title="Editar tarea"
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: '1px solid #bfdbfe', background: '#eff6ff', color: '#3b82f6',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#dbeafe'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          {/* eliminar */}
          <button
            onClick={() => onEliminar(tarea.idtarea)}
            title="Eliminar tarea"
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── TAREAS PAGE ─────────────────────────────────────────────────────────── */
export default function Tareas() {
  const [tareas, setTareas]       = useState<TareaBackend[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoLista[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [adminId, setAdminId]     = useState<number | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [form, setForm] = useState({
    tipoactividad: '', fechaprogramada: '', estado: 'Pendiente',
    esrecurrente: 'No', costototal: '', idempleado: '',
  });
  const [editForm, setEditForm] = useState({
    idtarea: 0, tipoactividad: '', fechaprogramada: '', estado: 'Pendiente',
    esrecurrente: 'No', costototal: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) { const u = JSON.parse(raw); setAdminId(u.id ?? null); }
    } catch { /* nada */ }
  }, []);

  const cargarTareas = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${API}/api/v1/tareas`);
      if (!res.ok) throw new Error();
      setTareas(await res.json());
    } catch { setError('No se pudo conectar con el servidor'); }
    finally { setLoading(false); }
  };

  const cargarEmpleados = async () => {
    try {
      const res = await fetch(`${API}/api/v1/empleados`);
      if (!res.ok) return;
      const data = await res.json() as EmpleadoAPI[];
      setEmpleados(data.map(e => ({
        idusuario: e.idusuario,
        nombre: e.idusuario2
          ? `${e.idusuario2.primernombre} ${e.idusuario2.primerapellido}`
          : `Empleado #${e.idusuario}`,
      })));
    } catch { /* silencioso */ }
  };

  useEffect(() => { cargarTareas(); cargarEmpleados(); }, []);

  /* filtro por fecha */
  const tareasFiltradas = tareas.filter(t => {
    if (!fechaDesde && !fechaHasta) return true;
    const f = t.fechaprogramada ? t.fechaprogramada.split('T')[0] : null;
    if (!f) return false;
    if (fechaDesde && f < fechaDesde) return false;
    if (fechaHasta && f > fechaHasta) return false;
    return true;
  });

  /* agrupar por columna */
  const porColumna = (col: ColKey) =>
    tareasFiltradas.filter(t => normalizeEstado(t.estado) === col);

  /* mover tarea entre columnas */
  const moverTarea = async (id: number, dir: 'left' | 'right') => {
    const tarea = tareas.find(t => t.idtarea === id);
    if (!tarea) return;
    const colActual = normalizeEstado(tarea.estado);
    const idx = COLUMNAS.findIndex(c => c.key === colActual);
    const nuevoIdx = dir === 'right' ? idx + 1 : idx - 1;
    if (nuevoIdx < 0 || nuevoIdx >= COLUMNAS.length) return;
    const nuevoEstado = COLUMNAS[nuevoIdx].key;

    // Optimista: actualizar UI de inmediato
    setTareas(prev => prev.map(t => t.idtarea === id ? { ...t, estado: nuevoEstado } : t));

    try {
      await fetch(`${API}/api/v1/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {
      // Revertir si falla
      await cargarTareas();
    }
  };

  const guardar = async () => {
    if (!form.tipoactividad.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/api/v1/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoactividad:   form.tipoactividad,
          fechaprogramada: form.fechaprogramada || undefined,
          estado:          form.estado,
          esrecurrente:    form.esrecurrente,
          costototal:      form.costototal ? Number(form.costototal) : undefined,
          idadmincreador:  adminId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al crear tarea');
      const nueva: TareaBackend = await res.json();
      if (form.idempleado && adminId) {
        await fetch(`${API}/api/v1/tareas/${nueva.idtarea}/asignar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idempleado: Number(form.idempleado), idadminasignador: adminId, estado: 'Asignado' }),
        });
      }
      setModal(false);
      setForm({ tipoactividad: '', fechaprogramada: '', estado: 'Pendiente', esrecurrente: 'No', costototal: '', idempleado: '' });
      await cargarTareas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally { setSaving(false); }
  };

  const abrirEditar = (t: TareaBackend) => {
    setEditForm({
      idtarea: t.idtarea,
      tipoactividad: t.tipoactividad ?? '',
      fechaprogramada: t.fechaprogramada ? t.fechaprogramada.split('T')[0] : '',
      estado: normalizeEstado(t.estado),
      esrecurrente: t.esrecurrente ?? 'No',
      costototal: t.costototal != null ? String(t.costototal) : '',
    });
    setEditModal(true);
  };

  const guardarEdicion = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API}/api/v1/tareas/${editForm.idtarea}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoactividad:   editForm.tipoactividad,
          fechaprogramada: editForm.fechaprogramada || undefined,
          estado:          editForm.estado,
          esrecurrente:    editForm.esrecurrente,
          costototal:      editForm.costototal ? Number(editForm.costototal) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al editar');
      setEditModal(false);
      await cargarTareas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al editar');
      setTimeout(() => setError(''), 4000);
    } finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await fetch(`${API}/api/v1/tareas/${id}`, { method: 'DELETE' });
      await cargarTareas();
    } catch { setError('Error al eliminar'); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  /* ── RENDER ── */
  return (
    <>
      <p className="page-title">Gestión de Tareas</p>
      <p className="page-sub">Tablero Kanban — organiza y mueve tareas entre estados</p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* BARRA SUPERIOR: filtros + botón nueva tarea */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Desde</span>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', background: 'transparent' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', background: 'transparent' }} />
        </div>
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Limpiar filtro
          </button>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setModal(true)} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(22,163,74,0.35)', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all .2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva tarea
          </button>
        </div>
      </div>

      {/* KANBAN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b', fontSize: 14 }}>Cargando tareas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
          {COLUMNAS.map(col => {
            const items = porColumna(col.key);
            return (
              <div key={col.key} style={{
                background: col.bg,
                border: `1.5px solid ${col.border}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                {/* cabecera columna */}
                <div style={{
                  padding: '14px 16px 12px',
                  borderBottom: `1.5px solid ${col.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.dot }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                  <span style={{
                    marginLeft: 'auto', minWidth: 22, height: 22, borderRadius: '50%',
                    background: col.dot, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{items.length}</span>
                </div>

                {/* tarjetas */}
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
                  {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 12 }}>
                      Sin tareas
                    </div>
                  ) : (
                    items.map(t => (
                      <TareaCard
                        key={t.idtarea}
                        tarea={t}
                        colKey={col.key}
                        onMover={moverTarea}
                        onEliminar={eliminar}
                        onEditar={abrirEditar}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL — NUEVA TAREA */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem' }}>
          <div style={{ background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:460,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)' }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#0f172a',margin:0 }}>NUEVA TAREA</h3>
            <input placeholder="Tipo de actividad *" value={form.tipoactividad} onChange={e => setForm({...form,tipoactividad:e.target.value})} style={inputStyle} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                <label style={{ fontSize:12,color:'#64748b' }}>Fecha programada</label>
                <input type="date" value={form.fechaprogramada} onChange={e => setForm({...form,fechaprogramada:e.target.value})} style={{...inputStyle,width:'auto'}} />
              </div>
              <select value={form.estado} onChange={e => setForm({...form,estado:e.target.value})} style={{...inputStyle,width:'auto'}}>
                {['Pendiente','En progreso','Completado'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <input placeholder="Costo total" type="number" value={form.costototal} onChange={e => setForm({...form,costototal:e.target.value})} style={{...inputStyle,width:'auto'}} />
              <select value={form.esrecurrente} onChange={e => setForm({...form,esrecurrente:e.target.value})} style={{...inputStyle,width:'auto'}}>
                <option value="No">No recurrente</option>
                <option value="Si">Recurrente</option>
              </select>
            </div>
            <select value={form.idempleado} onChange={e => setForm({...form,idempleado:e.target.value})} style={inputStyle}>
              <option value="">— Asignar empleado (opcional) —</option>
              {empleados.map(emp => <option key={emp.idusuario} value={emp.idusuario}>{emp.nombre}</option>)}
            </select>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:4 }}>
              <button onClick={() => setModal(false)} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#16a34a',color:'#fff',border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,fontFamily:'inherit' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — EDITAR TAREA */}
      {editModal && (
        <div onClick={e => e.target === e.currentTarget && setEditModal(false)}
          style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem' }}>
          <div style={{ background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:460,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)' }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#0f172a',margin:0 }}>EDITAR TAREA #{editForm.idtarea}</h3>
            <input placeholder="Tipo de actividad *" value={editForm.tipoactividad} onChange={e => setEditForm({...editForm,tipoactividad:e.target.value})} style={inputStyle} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                <label style={{ fontSize:12,color:'#64748b' }}>Fecha programada</label>
                <input type="date" value={editForm.fechaprogramada} onChange={e => setEditForm({...editForm,fechaprogramada:e.target.value})} style={{...inputStyle,width:'auto'}} />
              </div>
              <select value={editForm.estado} onChange={e => setEditForm({...editForm,estado:e.target.value})} style={{...inputStyle,width:'auto'}}>
                {['Pendiente','En progreso','Completado'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <input placeholder="Costo total" type="number" value={editForm.costototal} onChange={e => setEditForm({...editForm,costototal:e.target.value})} style={{...inputStyle,width:'auto'}} />
              <select value={editForm.esrecurrente} onChange={e => setEditForm({...editForm,esrecurrente:e.target.value})} style={{...inputStyle,width:'auto'}}>
                <option value="No">No recurrente</option>
                <option value="Si">Recurrente</option>
              </select>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:4 }}>
              <button onClick={() => setEditModal(false)} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#3b82f6',color:'#fff',border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,fontFamily:'inherit' }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AgrobotWidget />
    </>
  );
}