import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3000';
const CACHE_KEY_TAREAS    = 'agrosmart_tareas_cache';
const CACHE_KEY_EMPLEADOS = 'agrosmart_empleados_cache';

interface EmpleadoAsignado {
  idusuario: number;
  idusuario2?: { primernombre: string; primerapellido: string; };
}
interface AsignacionTarea {
  idasigtarea: number; estado: string; idempleado: EmpleadoAsignado;
}
interface TareaBackend {
  idtarea: number | string;
  tipoactividad: string;
  fechaprogramada: string;
  estado: string;
  costototal: number;
  esrecurrente: string;
  asignacionTareas: AsignacionTarea[];
  idadmincreador?: { idusuario: number };
  idcultivo?: { idcultivo: number; nombre?: string };
  _offline?: boolean;
  _nombreEmpleado?: string | null;
}
interface EmpleadoLista { idusuario: number; nombre: string; }
interface Mensaje { rol: 'user' | 'assistant'; texto: string; }

function getTareasCache(): TareaBackend[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY_TAREAS) ?? '[]'); } catch { return []; }
}
function setTareasCache(d: TareaBackend[]) {
  localStorage.setItem(CACHE_KEY_TAREAS, JSON.stringify(d));
}

// Lee el caché de empleados (guardado como lista de EmpleadoLista)
function getEmpleadosCache(): EmpleadoLista[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY_EMPLEADOS) ?? '[]'); } catch { return []; }
}

const estColor: Record<string, string> = {
  Activo: 'badge-green', Pendiente: 'badge-yellow',
  Completado: 'badge-blue', Asignado: 'badge-green',
  'En progreso': 'badge-yellow',
};

function nombreEmpleado(t: TareaBackend): string {
  if (t._nombreEmpleado) return t._nombreEmpleado;

  if (t.asignacionTareas?.length) {
    const asig = t.asignacionTareas[0];
    const emp  = asig.idempleado;

    if (emp?.idusuario2?.primernombre) {
      return `${emp.idusuario2.primernombre} ${emp.idusuario2.primerapellido ?? ''}`.trim();
    }

    const idEmp = emp?.idusuario;
    if (idEmp) {
      // Busca en caché de empleados (guardado como {idusuario, nombre})
      const empCache = getEmpleadosCache();
      const found = empCache.find(e => e.idusuario === idEmp);
      if (found?.nombre) return found.nombre;
      return `Emp. #${idEmp}`;
    }
  }
  return '—';
}

const SYSTEM_TAREAS = `Eres AgroBot, el asistente inteligente del módulo de Tareas de AgroSmart.
Ayudas a los administradores a gestionar y asignar tareas agrícolas.
Lo que puedes explicar:
- Cómo crear una nueva tarea (botón "+ Nueva tarea")
- Cómo asignar un empleado a una tarea al crearla
- Qué significan los estados: Pendiente, En progreso, Completado, Asignado
- Cómo eliminar una tarea (botón ✕)
- Qué es el campo "tipo de actividad", "costo total", "recurrente"
- Cómo ver qué empleado tiene asignada cada tarea
Responde siempre en español, de forma breve y amigable. Máximo 3 oraciones por respuesta.`;

const GUIA_ITEMS = [
  { icon: '＋', titulo: 'Nueva tarea',      desc: 'Haz clic en "+ Nueva tarea" (arriba a la derecha) para abrir el formulario de creación.',                       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: '👤', titulo: 'Asignar empleado', desc: 'Al crear una tarea puedes seleccionar un empleado en el campo inferior del formulario.',                          color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: '🏷️', titulo: 'Estados',          desc: 'Pendiente → sin iniciar. En progreso → en ejecución. Completado → finalizada. Asignado → tiene empleado.',       color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { icon: '✕',  titulo: 'Eliminar tarea',   desc: 'Usa el botón ✕ al final de cada fila en la tabla para eliminar esa tarea.',                                      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { icon: '💰', titulo: 'Costo total',       desc: 'Ingresa el costo estimado de la tarea. Es opcional y se muestra en la tabla principal.',                         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: '🔁', titulo: 'Recurrente',        desc: 'Marca "Recurrente" si la tarea se repite periódicamente (ej. riego semanal, poda mensual).',                    color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
];

function AgrobotWidget() {
  const [abierto, setAbierto]   = useState(false);
  const [tab, setTab]           = useState<'guia' | 'chat'>('guia');
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', texto: '¡Hola! Soy AgroBot 🌿 ¿En qué te puedo ayudar con las tareas?' },
  ]);
  const [input, setInput]       = useState('');
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
        body: JSON.stringify({
          system: SYSTEM_TAREAS,
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
    '¿Cómo creo una tarea?', '¿Qué significa "Asignado"?',
    '¿Cómo asigno un empleado?', '¿Puedo hacer tareas recurrentes?',
  ];

  return (
    <>
      <style>{`
        @keyframes widgetIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:none} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        .aw-fab{position:fixed;bottom:28px;right:28px;z-index:999;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);border:none;cursor:pointer;box-shadow:0 4px 24px rgba(22,163,74,0.45);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
        .aw-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(22,163,74,0.55)}
        .aw-panel{position:fixed;bottom:94px;right:28px;z-index:998;width:352px;border-radius:18px;background:#fff;border:0.5px solid #e5e7eb;box-shadow:0 8px 40px rgba(0,0,0,0.16);display:flex;flex-direction:column;overflow:hidden;animation:widgetIn .22s cubic-bezier(.34,1.56,.64,1)}
        .aw-header{background:linear-gradient(135deg,#16a34a,#059669);padding:13px 16px;display:flex;align-items:center;gap:10px}
        .aw-tabs{display:flex;border-bottom:0.5px solid #e5e7eb}
        .aw-tab{flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;background:transparent;cursor:pointer;color:#94a3b8;transition:color .15s,border-color .15s;border-bottom:2px solid transparent;font-family:inherit}
        .aw-tab.active{color:#16a34a;border-bottom-color:#16a34a}
        .aw-guia-scroll{overflow-y:auto;max-height:360px;padding:12px;display:flex;flex-direction:column;gap:8px}
        .aw-guia-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;border:1px solid;cursor:default;transition:filter .15s}
        .aw-guia-item:hover{filter:brightness(.97)}
        .aw-guia-icon{font-size:18px;line-height:1;flex-shrink:0;margin-top:1px}
        .aw-guia-ask{margin-top:5px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid;cursor:pointer;font-family:inherit;transition:opacity .15s}
        .aw-guia-ask:hover{opacity:.75}
        .aw-chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;max-height:320px}
        .aw-bubble-wrap{display:flex}
        .aw-bubble{max-width:82%;padding:8px 12px;font-size:13px;line-height:1.5}
        .aw-bubble.user{background:#16a34a;color:#fff;border-radius:14px 14px 4px 14px;margin-left:auto}
        .aw-bubble.bot{background:#f3f4f6;color:#111;border-radius:14px 14px 14px 4px}
        .aw-input-row{padding:10px 14px;border-top:0.5px solid #e5e7eb;display:flex;gap:8px;align-items:center}
        .aw-input{flex:1;padding:8px 12px;border:1px solid #e5e7eb;border-radius:99px;font-size:13px;color:#111;outline:none;font-family:inherit}
        .aw-send{width:34px;height:34px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;transition:background .15s;cursor:pointer;flex-shrink:0}
        .aw-chips{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:6px}
        .aw-chip{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:500;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;cursor:pointer;font-family:inherit;transition:background .15s}
        .aw-chip:hover{background:#dcfce7}
      `}</style>

      <button className="aw-fab" onClick={() => setAbierto(v => !v)} title="AgroBot — Ayuda">
        {abierto
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/><circle cx="8.5" cy="11" r="1" fill="#fff"/><circle cx="12" cy="11" r="1" fill="#fff"/><circle cx="15.5" cy="11" r="1" fill="#fff"/></svg>
        }
      </button>

      {abierto && (
        <div className="aw-panel">
          <div className="aw-header">
            <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/></svg>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>AgroBot</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.75)'}}>Asistente de Tareas</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#86efac'}}/>
            </div>
          </div>

          <div className="aw-tabs">
            <button className={`aw-tab ${tab==='guia'?'active':''}`} onClick={() => setTab('guia')}>📋 Guía rápida</button>
            <button className={`aw-tab ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>💬 Preguntar</button>
          </div>

          {tab === 'guia' && (
            <div className="aw-guia-scroll">
              {GUIA_ITEMS.map(item => (
                <div key={item.titulo} className="aw-guia-item" style={{background:item.bg,borderColor:item.border}}>
                  <span className="aw-guia-icon">{item.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:item.color,marginBottom:2}}>{item.titulo}</div>
                    <div style={{fontSize:12,color:'#374151',lineHeight:1.4}}>{item.desc}</div>
                    <button className="aw-guia-ask" style={{background:'transparent',color:item.color,borderColor:item.border,marginTop:6}} onClick={() => enviar(`Explícame más sobre: ${item.titulo}`)}>Saber más →</button>
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
                    <div className="aw-bubble bot" style={{display:'flex',gap:4,alignItems:'center',padding:'10px 14px'}}>
                      {[0,1,2].map(i => <div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#9ca3af',animation:`bounce .9s ${i*0.15}s infinite`}}/>)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>
              {mensajes.length <= 1 && (
                <div className="aw-chips">
                  {SUGERENCIAS.map(s => <button key={s} className="aw-chip" onClick={() => enviar(s)}>{s}</button>)}
                </div>
              )}
            </>
          )}

          <div className="aw-input-row">
            <input className="aw-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && enviar()} placeholder="Escribe tu pregunta..."/>
            <button className="aw-send" onClick={() => enviar()} disabled={cargando || !input.trim()} style={{background:input.trim()?'#16a34a':'#e5e7eb',cursor:input.trim()?'pointer':'default'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Tareas() {
  const [tareas, setTareas]         = useState<TareaBackend[]>([]);
  const [empleados, setEmpleados]   = useState<EmpleadoLista[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline]       = useState(false);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [adminId, setAdminId]       = useState<number | null>(null);
  const [form, setForm] = useState({
    tipoactividad: '', fechaprogramada: '', estado: 'Pendiente',
    esrecurrente: 'No', costototal: '', idempleado: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) { const u = JSON.parse(raw); setAdminId(u.id ?? null); }
    } catch { /* nada */ }
  }, []);

  const cargarEmpleados = async () => {
    try {
      const res = await fetch(`${API}/api/v1/empleados`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const data = await res.json();
      const lista: EmpleadoLista[] = data
        .filter((e: any) => e.idusuario2)
        .map((e: any) => ({
          idusuario: e.idusuario,
          nombre: `${e.idusuario2.primernombre} ${e.idusuario2.primerapellido}`,
        }));
      setEmpleados(lista);
      // ✅ FIX: guarda en localStorage para que nombreEmpleado() lo encuentre
      localStorage.setItem(CACHE_KEY_EMPLEADOS, JSON.stringify(lista));
    } catch {
      // Sin internet: carga desde localStorage
      const cached = getEmpleadosCache();
      if (cached.length > 0) setEmpleados(cached);
    }
  };

  const cargarTareas = async (esActualizacion = false) => {
    if (esActualizacion) { setRefreshing(true); } else { setLoading(true); }
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/tareas`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error();
      const data: TareaBackend[] = await res.json();

      // Enriquece el nombre del empleado si el backend no trae idusuario2 populado
      const empCache = getEmpleadosCache();
      const dataMerged = data.map(t => {
        const asig = t.asignacionTareas?.[0];
        if (asig?.idempleado?.idusuario2?.primernombre) return t; // ya tiene nombre
        if (asig?.idempleado?.idusuario) {
          const found = empCache.find(e => e.idusuario === asig.idempleado.idusuario);
          if (found?.nombre) return { ...t, _nombreEmpleado: found.nombre };
        }
        // Conserva _nombreEmpleado del caché anterior (tareas offline)
        const enCache = getTareasCache().find(c => String(c.idtarea) === String(t.idtarea));
        if (enCache?._nombreEmpleado) return { ...t, _nombreEmpleado: enCache._nombreEmpleado };
        return t;
      });

      setTareas(dataMerged);
      setTareasCache(dataMerged);
      setOffline(false);
    } catch {
      const cached = getTareasCache();
      if (cached.length > 0) {
        setTareas(cached);
        setOffline(true);
        if (esActualizacion) {
          setError('Sin conexión — mostrando datos guardados');
          setTimeout(() => setError(''), 3000);
        }
      } else {
        setError('Sin conexión y sin datos guardados localmente');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargarTareas(); cargarEmpleados(); }, []);

  const guardar = async () => {
    if (!form.tipoactividad.trim()) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/api/v1/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(6000),
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

      // Resuelve nombre del empleado seleccionado
      const empSeleccionado = empleados.find(e => e.idusuario === Number(form.idempleado));
      const nombreEmp = empSeleccionado?.nombre ?? (form.idempleado ? `Emp. #${form.idempleado}` : null);

      if (form.idempleado && adminId && !nueva._offline) {
        await fetch(`${API}/api/v1/tareas/${nueva.idtarea}/asignar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempleado:       Number(form.idempleado),
            idadminasignador: adminId,
            estado:           'Asignado',
          }),
        });
      }

      // Guarda el nombre en caché para que cargarTareas() lo encuentre
      if (nombreEmp) {
        const tareasActuales = getTareasCache();
        const idx = tareasActuales.findIndex(t => String(t.idtarea) === String(nueva.idtarea));
        if (idx >= 0) {
          tareasActuales[idx] = { ...tareasActuales[idx], _nombreEmpleado: nombreEmp };
          setTareasCache(tareasActuales);
        } else {
          setTareasCache([...tareasActuales, { ...nueva, _nombreEmpleado: nombreEmp }]);
        }
      }

      setModal(false);
      setForm({ tipoactividad:'', fechaprogramada:'', estado:'Pendiente', esrecurrente:'No', costototal:'', idempleado:'' });
      await cargarTareas();
    } catch (err: any) {
      const sinRed = err?.name === 'TimeoutError' || err?.name === 'TypeError';
      if (sinRed) {
        setError('Sin conexión — la tarea se guardará cuando vuelva el internet');
        setTimeout(() => setError(''), 5000);
        setModal(false);
        setForm({ tipoactividad:'', fechaprogramada:'', estado:'Pendiente', esrecurrente:'No', costototal:'', idempleado:'' });
        await cargarTareas();
      } else {
        setError(err?.message ?? 'Error al guardar');
        setTimeout(() => setError(''), 4000);
      }
    } finally { setSaving(false); }
  };

  const eliminar = async (id: number | string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    if (String(id).startsWith('offline_') || Number(id) < 0) {
      const upd = getTareasCache().filter(t => t.idtarea !== id);
      setTareasCache(upd); setTareas(upd); return;
    }
    try {
      await fetch(`${API}/api/v1/tareas/${id}`, { method: 'DELETE' });
      await cargarTareas();
    } catch { setError('Error al eliminar'); }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };

  return (
    <>
      <p className="page-title">Gestión de Tareas</p>
      <p className="page-sub">Administra y asigna tareas a los empleados</p>

      {offline && (
        <div style={{background:'#fefce8',color:'#a16207',padding:'10px 16px',borderRadius:8,marginBottom:16,fontSize:14,border:'1.5px solid #fde68a'}}>
          📴 Sin conexión — mostrando datos guardados localmente
        </div>
      )}
      {error && (
        <div style={{background:'#fef2f2',color:'#ef4444',padding:'10px 16px',borderRadius:8,marginBottom:16,fontSize:14}}>
          {error}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <span>Todas las tareas</span>
          <div style={{display:'flex',gap:8}}>
            <button
              onClick={() => cargarTareas(true)} disabled={refreshing || loading}
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',background:'#fff',color:'#475569',cursor:refreshing?'not-allowed':'pointer',opacity:refreshing?0.6:1,fontFamily:'inherit',transition:'background .15s,border-color .15s'}}
              onMouseEnter={e => { if (!refreshing) (e.currentTarget as HTMLButtonElement).style.borderColor='#16a34a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#e2e8f0'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={refreshing?{animation:'spin 0.7s linear infinite'}:{}}>
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button className="add-btn" onClick={() => setModal(true)}>+ Nueva tarea</button>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:32,color:'#64748b'}}>Cargando tareas...</div>
        ) : tareas.length === 0 ? (
          <div style={{textAlign:'center',padding:32,color:'#64748b'}}>No hay tareas registradas</div>
        ) : (
          <table>
            <thead>
              <tr><th>#</th><th>Tarea</th><th>Fecha</th><th>Empleado</th><th>Costo</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {tareas.map(t => (
                <tr key={t.idtarea} style={t._offline?{background:'#fffbeb'}:{}}>
                  <td style={{color:'black'}}>{String(t.idtarea).startsWith('offline_')?'⏳':t.idtarea}</td>
                  <td style={{color:'black'}}>{t.tipoactividad??'—'}</td>
                  <td style={{color:'black'}}>{t.fechaprogramada?t.fechaprogramada.split('T')[0]:'—'}</td>
                  <td style={{color:'black'}}>{nombreEmpleado(t)}</td>
                  <td style={{color:'black'}}>{t.costototal!=null?`$${Number(t.costototal).toLocaleString()}`:'—'}</td>
                  <td><span className={`badge ${estColor[t.estado]??'badge-yellow'}`}>{t._offline?'⏳ ':''}{t.estado??'—'}</span></td>
                  <td><button className="act-btn" onClick={() => eliminar(t.idtarea)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div onClick={e => e.target===e.currentTarget && setModal(false)}
          style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem'}}>
          <div style={{background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:460,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)'}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a',margin:0}}>
              NUEVA TAREA{offline?' (sin internet)':''}
            </h3>
            <input placeholder="Tipo de actividad *" value={form.tipoactividad} onChange={e => setForm({...form,tipoactividad:e.target.value})} style={inputStyle}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:12,color:'#64748b'}}>Fecha programada</label>
                <input type="date" value={form.fechaprogramada} onChange={e => setForm({...form,fechaprogramada:e.target.value})} style={{...inputStyle,width:'auto'}}/>
              </div>
              <select value={form.estado} onChange={e => setForm({...form,estado:e.target.value})} style={{...inputStyle,width:'auto'}}>
                {['Pendiente','En progreso','Completado'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <input placeholder="Costo total" type="number" value={form.costototal} onChange={e => setForm({...form,costototal:e.target.value})} style={{...inputStyle,width:'auto'}}/>
              <select value={form.esrecurrente} onChange={e => setForm({...form,esrecurrente:e.target.value})} style={{...inputStyle,width:'auto'}}>
                <option value="No">No recurrente</option>
                <option value="Si">Recurrente</option>
              </select>
            </div>
            <select value={form.idempleado} onChange={e => setForm({...form,idempleado:e.target.value})} style={inputStyle}>
              <option value="">— Asignar empleado (opcional) —</option>
              {empleados.map(emp => <option key={emp.idusuario} value={emp.idusuario}>{emp.nombre}</option>)}
            </select>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={() => setModal(false)} disabled={saving} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#16a34a',color:'#fff',border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,fontFamily:'inherit'}}>
                {saving?'Guardando...':'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AgrobotWidget/>
    </>
  );
}