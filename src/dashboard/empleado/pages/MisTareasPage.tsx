import { useState, useEffect, useCallback } from 'react';
import type { UsuarioEmp } from '../DashboardEmpleado';

const API = 'http://localhost:3000';

type Estado = 'Pendiente' | 'En progreso' | 'Completado';

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
  'Pendiente':   'Pendiente',
  'En progreso': 'En progreso',
  'Completado':  'Completada',
};

const ESTADO_COLORS: Record<Estado, React.CSSProperties> = {
  'Pendiente':   { background: '#fef9c3', color: '#ca8a04' },
  'En progreso': { background: '#dbeafe', color: '#1d4ed8' },
  'Completado':  { background: '#dcfce7', color: '#16a34a' },
};

const pill: React.CSSProperties = {
  display: 'inline-block', padding: '2px 10px',
  borderRadius: 99, fontSize: 11, fontWeight: 600,
};

function normalizeEstado(e: string): Estado {
  const s = (e ?? '').toLowerCase();
  if (s.includes('prog') || s.includes('proceso')) return 'En progreso';
  if (s.includes('complet') || s.includes('finaliz')) return 'Completado';
  return 'Pendiente';
}

export default function MisTareas({ usuario }: { usuario: UsuarioEmp }) {
  const [tareas, setTareas]       = useState<TareaBackend[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState<Estado | 'todas'>('todas');
  const [saving, setSaving]       = useState<number | null>(null);
  const [obsAbiertas, setObsAbiertas] = useState<Set<number>>(new Set());
  const [obsTemp, setObsTemp]     = useState<Record<number, string>>({});
  const [obsSaved, setObsSaved]   = useState<Set<number>>(new Set());
  const [userId, setUserId]       = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) { const u = JSON.parse(raw); setUserId(u.id ?? null); }
    } catch { /* nada */ }
  }, []);

  const cargarTareas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/tareas`);
      if (!res.ok) throw new Error();
      const todas: TareaBackend[] = await res.json();
      // Filtrar solo las asignadas a este empleado
      const mias = todas.filter(t =>
        t.asignacionTareas?.some(a => a.idempleado?.idusuario === userId)
      );
      setTareas(mias);
    } catch {
      setTareas([]);
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (userId !== null) cargarTareas();
  }, [userId, cargarTareas]);

  const cambiarEstado = async (id: number, nuevoEstado: Estado) => {
    setSaving(id);
    // Optimista
    setTareas(prev => prev.map(t => t.idtarea === id ? { ...t, estado: nuevoEstado } : t));
    try {
      await fetch(`${API}/api/v1/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {
      await cargarTareas();
    } finally { setSaving(null); }
  };

  const toggleObs = (id: number) => {
    setObsTemp(prev => ({ ...prev, [id]: prev[id] ?? '' }));
    setObsAbiertas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const guardarObs = (id: number) => {
    setObsAbiertas(prev => { const n = new Set(prev); n.delete(id); return n; });
    setObsSaved(prev => { const n = new Set(prev); n.add(id); return n; });
    setTimeout(() => setObsSaved(prev => { const n = new Set(prev); n.delete(id); return n; }), 2500);
  };

  const tareasFiltradas = filtro === 'todas'
    ? tareas
    : tareas.filter(t => normalizeEstado(t.estado) === filtro);

  const pendientes  = tareas.filter(t => normalizeEstado(t.estado) === 'Pendiente').length;
  const enProgreso  = tareas.filter(t => normalizeEstado(t.estado) === 'En progreso').length;
  const completadas = tareas.filter(t => normalizeEstado(t.estado) === 'Completado').length;

  const FILTROS: (Estado | 'todas')[] = ['todas', 'Pendiente', 'En progreso', 'Completado'];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>
      Cargando tus tareas...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ENCABEZADO */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--db-text, #111)' }}>
          Mis Tareas
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          {usuario.nombre} · {usuario.lote}
        </p>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Pendientes',  value: pendientes,  color: '#ca8a04', bg: '#fef9c3' },
          { label: 'En progreso', value: enProgreso,  color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'Completadas', value: completadas, color: '#16a34a', bg: '#dcfce7' },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ height: 4, borderRadius: 99, background: m.bg, marginTop: 8 }} />
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTROS.map(f => {
          const active = filtro === f;
          return (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '5px 14px', borderRadius: 99,
              border: active ? 'none' : '0.5px solid #e5e7eb',
              background: active ? '#16a34a' : '#fff',
              color: active ? '#fff' : '#6b7280',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            }}>
              {f === 'todas' ? 'Todas' : ESTADO_LABELS[f as Estado]}
            </button>
          );
        })}
      </div>

      {/* LISTA */}
      {tareasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
          No tienes tareas {filtro !== 'todas' ? `con estado "${ESTADO_LABELS[filtro as Estado]}"` : 'asignadas'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tareasFiltradas.map(tarea => {
            const est = normalizeEstado(tarea.estado);
            const fecha = tarea.fechaprogramada ? tarea.fechaprogramada.split('T')[0] : null;
            return (
              <div key={tarea.idtarea} style={{
                background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12,
                padding: '16px 18px', opacity: est === 'Completado' ? 0.75 : 1, transition: 'opacity .2s',
              }}>

                {/* título */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: est === 'Completado' ? '#9ca3af' : '#111', textDecoration: est === 'Completado' ? 'line-through' : 'none' }}>
                    {tarea.tipoactividad ?? '—'}
                  </span>
                  <span style={{ ...pill, ...ESTADO_COLORS[est], flexShrink: 0 }}>
                    {ESTADO_LABELS[est]}
                  </span>
                </div>

                {/* meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  {fecha && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {fecha}
                    </span>
                  )}
                  {tarea.esrecurrente === 'Si' && (
                    <span style={{ ...pill, background: '#f0fdf4', color: '#16a34a' }}>🔁 Recurrente</span>
                  )}
                </div>

                {/* acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* selector de estado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Estado:</span>
                    <select
                      value={est}
                      disabled={saving === tarea.idtarea}
                      onChange={e => cambiarEstado(tarea.idtarea, e.target.value as Estado)}
                      style={{
                        padding: '5px 10px', border: '0.5px solid #e5e7eb', borderRadius: 8,
                        fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Completado">Completada</option>
                    </select>
                    {saving === tarea.idtarea && (
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Guardando...</span>
                    )}
                  </div>

                  {/* botón observaciones */}
                  <button onClick={() => toggleObs(tarea.idtarea)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                    border: '0.5px solid #e5e7eb', borderRadius: 8, fontSize: 12,
                    background: obsAbiertas.has(tarea.idtarea) ? '#f3f4f6' : '#fff',
                    color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {obsAbiertas.has(tarea.idtarea) ? 'Cerrar' : 'Observaciones'}
                  </button>

                  {obsSaved.has(tarea.idtarea) && (
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Guardado</span>
                  )}
                </div>

                {/* área observación */}
                {obsAbiertas.has(tarea.idtarea) && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      rows={3}
                      placeholder="Escribe tu observación sobre esta tarea..."
                      value={obsTemp[tarea.idtarea] ?? ''}
                      onChange={e => setObsTemp(prev => ({ ...prev, [tarea.idtarea]: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 12px', border: '0.5px solid #e5e7eb',
                        borderRadius: 8, fontSize: 13, color: '#374151', resize: 'vertical',
                        boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                    />
                    <button onClick={() => guardarObs(tarea.idtarea)} style={{
                      alignSelf: 'flex-end', padding: '6px 16px', background: '#16a34a',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 13,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Guardar observación
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}