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

const PRIORIDAD_COLORS: Record<string, React.CSSProperties> = {
  alta:  { background: '#fee2e2', color: '#dc2626' },
  media: { background: '#fef9c3', color: '#ca8a04' },
  baja:  { background: '#dcfce7', color: '#16a34a' },
};

const ESTADO_COLORS: Record<Estado, React.CSSProperties> = {
  pendiente:   { background: '#fef9c3', color: '#ca8a04' },
  en_progreso: { background: '#dbeafe', color: '#1d4ed8' },
  completada:  { background: '#dcfce7', color: '#16a34a' },
};

const pill: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 99,
  fontSize: 11,
  fontWeight: 600,
};

export default function MisTareas({ usuario }: { usuario: UsuarioEmp }) {
  const [tareas, setTareas]       = useState<Tarea[]>(TAREAS_INIT);
  const [obsAbiertas, setObsAbiertas] = useState<Set<number>>(new Set());
  const [obsTemp, setObsTemp]     = useState<Record<number, string>>({});
  const [obsSaved, setObsSaved]   = useState<Set<number>>(new Set());
  const [filtro, setFiltro]       = useState<Estado | 'todas'>('todas');

  const tareasFiltradas = filtro === 'todas' ? tareas : tareas.filter(t => t.estado === filtro);

  const cambiarEstado = (id: number, estado: Estado) =>
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado } : t));

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

  const FILTROS = ['todas', 'pendiente', 'en_progreso', 'completada'] as const;

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
          <div key={m.label} style={{
            background: '#fff',
            border: '0.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '14px 16px',
          }}>
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
              padding: '5px 14px',
              borderRadius: 99,
              border: active ? 'none' : '0.5px solid #e5e7eb',
              background: active ? '#16a34a' : '#fff',
              color: active ? '#fff' : '#6b7280',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .15s',
            }}>
              {f === 'todas' ? 'Todas' : ESTADO_LABELS[f]}
            </button>
          );
        })}
      </div>

      {/* LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tareasFiltradas.map(tarea => (
          <div key={tarea.id} style={{
            background: '#fff',
            border: '0.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 18px',
            opacity: tarea.estado === 'completada' ? 0.75 : 1,
            transition: 'opacity .2s',
          }}>

            {/* fila título + prioridad */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: tarea.estado === 'completada' ? '#9ca3af' : '#111',
                textDecoration: tarea.estado === 'completada' ? 'line-through' : 'none',
              }}>
                {tarea.titulo}
              </span>
              <span style={{ ...pill, ...PRIORIDAD_COLORS[tarea.prioridad], flexShrink: 0 }}>
                {tarea.prioridad}
              </span>
            </div>

            {/* meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {tarea.lote}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {tarea.fecha}
              </span>
              <span style={{ ...pill, ...ESTADO_COLORS[tarea.estado] }}>
                {ESTADO_LABELS[tarea.estado]}
              </span>
            </div>

            {/* descripción */}
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
              {tarea.descripcion}
            </p>

            {/* acciones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={tarea.estado}
                onChange={e => cambiarEstado(tarea.id, e.target.value as Estado)}
                style={{
                  padding: '5px 10px',
                  border: '0.5px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12,
                  background: '#fff',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completada</option>
              </select>

              <button
                onClick={() => toggleObs(tarea.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  border: '0.5px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12,
                  background: obsAbiertas.has(tarea.id) ? '#f3f4f6' : '#fff',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {obsAbiertas.has(tarea.id) ? 'Cerrar' : 'Observaciones'}
              </button>

              {tarea.observacion && !obsAbiertas.has(tarea.id) && (
                <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                  "{tarea.observacion.slice(0, 45)}{tarea.observacion.length > 45 ? '…' : ''}"
                </span>
              )}

              {obsSaved.has(tarea.id) && (
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Guardado</span>
              )}
            </div>

            {/* área observación */}
            {obsAbiertas.has(tarea.id) && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  rows={3}
                  placeholder="Escribe tu observación sobre esta tarea..."
                  value={obsTemp[tarea.id] ?? tarea.observacion}
                  onChange={e => setObsTemp(prev => ({ ...prev, [tarea.id]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '0.5px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#374151',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => guardarObs(tarea.id)}
                  style={{
                    alignSelf: 'flex-end',
                    padding: '6px 16px',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Guardar observación
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}