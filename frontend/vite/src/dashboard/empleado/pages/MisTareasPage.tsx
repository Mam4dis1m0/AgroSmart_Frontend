import { useState } from 'react';
import type { UsuarioEmp } from '../DashboardEmpleado';

type Estado = 'pendiente' | 'en_progreso' | 'completada';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  lote: string;
  prioridad: 'alta' | 'media' | 'baja';
  fecha: string;
  estado: Estado;
  observacion: string;
}

const TAREAS_INIT: Tarea[] = [
  { id: 1, titulo: 'Aplicar fertilizante zona norte', descripcion: 'Aplicar fertilizante NPK en las primeras 3 filas del lote A-1. Usar dosis de 150g por palma.', lote: 'Lote A-1', prioridad: 'alta', fecha: '2026-04-06', estado: 'pendiente', observacion: '' },
  { id: 2, titulo: 'Inspección de plagas', descripcion: 'Revisar síntomas de gualpa y marchitez en palmas señaladas con cinta roja.', lote: 'Lote A-1', prioridad: 'alta', fecha: '2026-04-06', estado: 'en_progreso', observacion: 'Se encontraron 3 palmas con síntomas leves en fila 5.' },
  { id: 3, titulo: 'Poda de palmas sector 2', descripcion: 'Realizar poda de hojas secas y evacines en el sector 2 del lote asignado.', lote: 'Lote A-1', prioridad: 'media', fecha: '2026-04-07', estado: 'pendiente', observacion: '' },
  { id: 4, titulo: 'Recolección de racimos', descripcion: 'Cortar y recolectar racimos maduros identificados en recorrido anterior.', lote: 'Lote A-1', prioridad: 'media', fecha: '2026-04-08', estado: 'pendiente', observacion: '' },
  { id: 5, titulo: 'Registro de producción diaria', descripcion: 'Completar el formato de registro de kg recolectados y condición de palmas.', lote: 'Lote A-1', prioridad: 'baja', fecha: '2026-04-06', estado: 'completada', observacion: 'Registro completado. Total: 340kg recolectados.' },
];

const ESTADO_LABELS: Record<Estado, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

export default function MisTareas({ usuario }: { usuario: UsuarioEmp }) {
  const [tareas, setTareas] = useState<Tarea[]>(TAREAS_INIT);
  const [obsAbiertas, setObsAbiertas] = useState<Set<number>>(new Set());
  const [obsTemp, setObsTemp] = useState<Record<number, string>>({});
  const [obsSaved, setObsSaved] = useState<Set<number>>(new Set());
  const [filtro, setFiltro] = useState<Estado | 'todas'>('todas');

  const tareasFiltradas = filtro === 'todas' ? tareas : tareas.filter(t => t.estado === filtro);

  const cambiarEstado = (id: number, estado: Estado) => {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado } : t));
  };

  const toggleObs = (id: number) => {
    const t = tareas.find(t => t.id === id)!;
    setObsTemp(prev => ({ ...prev, [id]: t.observacion }));
    setObsAbiertas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const guardarObs = (id: number) => {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, observacion: obsTemp[id] || '' } : t));
    setObsAbiertas(prev => { const n = new Set(prev); n.delete(id); return n; });
    setObsSaved(prev => { const n = new Set(prev); n.add(id); return n; });
    setTimeout(() => setObsSaved(prev => { const n = new Set(prev); n.delete(id); return n; }), 2500);
  };

  const pendientes  = tareas.filter(t => t.estado === 'pendiente').length;
  const enProgreso  = tareas.filter(t => t.estado === 'en_progreso').length;
  const completadas = tareas.filter(t => t.estado === 'completada').length;

  return (
    <>
      <div className="page-title">MIS TAREAS</div>
      <div className="page-sub">Hola {usuario.nombre} — {usuario.lote}</div>

      {/* RESUMEN */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-label">Pendientes</div>
          <div className="metric-val" style={{ color: '#f0c000' }}>{pendientes}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">En Progreso</div>
          <div className="metric-val" style={{ color: '#80b4ff' }}>{enProgreso}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completadas</div>
          <div className="metric-val">{completadas}</div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['todas', 'pendiente', 'en_progreso', 'completada'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: filtro === f ? 'none' : '1.5px solid rgba(100, 70, 40, 0.18)',
              background: filtro === f ? 'var(--g3)' : 'none',
              color: filtro === f ? '#fff' : 'var(--text-muted)',
              fontSize: 12,
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: filtro === f ? '0 2px 8px rgba(46, 109, 164, 0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {f === 'todas' ? 'Todas' : ESTADO_LABELS[f]}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {tareasFiltradas.map(tarea => (
        <div key={tarea.id} className={`tarea-card ${tarea.estado === 'completada' ? 'completada' : ''}`}>
          <div className="tarea-header">
            <div className="tarea-title">{tarea.titulo}</div>
            <span className={`badge ${tarea.prioridad === 'alta' ? 'badge-red' : tarea.prioridad === 'media' ? 'badge-yellow' : 'badge-blue'}`}>
              {tarea.prioridad}
            </span>
          </div>

          <div className="tarea-meta">
            <span>📍 {tarea.lote}</span>
            <span>📅 {tarea.fecha}</span>
            <span className={`badge ${tarea.estado === 'completada' ? 'badge-green' : tarea.estado === 'en_progreso' ? 'badge-blue' : 'badge-yellow'}`}>
              {ESTADO_LABELS[tarea.estado]}
            </span>
          </div>

          <div className="tarea-desc">{tarea.descripcion}</div>

          <div className="tarea-actions">
            <select
              className="estado-select"
              value={tarea.estado}
              onChange={e => cambiarEstado(tarea.id, e.target.value as Estado)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
            </select>

            <button className="obs-toggle" onClick={() => toggleObs(tarea.id)}>
              {obsAbiertas.has(tarea.id) ? '▲ Cerrar obs.' : '✏️ Observaciones'}
            </button>

            {tarea.observacion && !obsAbiertas.has(tarea.id) && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                "{tarea.observacion.slice(0, 40)}{tarea.observacion.length > 40 ? '…' : ''}"
              </span>
            )}

            {obsSaved.has(tarea.id) && (
              <span className="obs-saved">✓ Observación guardada</span>
            )}
          </div>

          {obsAbiertas.has(tarea.id) && (
            <div className="obs-area">
              <textarea
                placeholder="Escribe tu observación sobre esta tarea..."
                value={obsTemp[tarea.id] ?? tarea.observacion}
                onChange={e => setObsTemp(prev => ({ ...prev, [tarea.id]: e.target.value }))}
              />
              <button className="obs-save" onClick={() => guardarObs(tarea.id)}>
                Guardar observación
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}