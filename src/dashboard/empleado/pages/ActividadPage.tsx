import type { UsuarioEmp } from '../DashboardEmpleado';

const ACTIVIDAD = [
  { color: '#16a34a', bg: '#dcfce7', texto: 'Completaste la tarea "Registro de producción diaria"', tiempo: 'Hace 1 hora' },
  { color: '#1d4ed8', bg: '#dbeafe', texto: 'Cambiaste el estado de "Inspección de plagas" a En progreso', tiempo: 'Hace 2 horas' },
  { color: '#ca8a04', bg: '#fef9c3', texto: 'Agregaste observación: "Se encontraron 3 palmas con síntomas leves en fila 5."', tiempo: 'Hace 2 horas' },
  { color: '#16a34a', bg: '#dcfce7', texto: 'Completaste la tarea "Riego zona sur — Lote A-1"', tiempo: 'Ayer, 4:30 PM' },
  { color: '#1d4ed8', bg: '#dbeafe', texto: 'Iniciaste turno — Check-in registrado', tiempo: 'Ayer, 6:00 AM' },
  { color: '#16a34a', bg: '#dcfce7', texto: 'Completaste la tarea "Poda sector 1"', tiempo: 'Hace 2 días' },
  { color: '#ca8a04', bg: '#fef9c3', texto: 'Agregaste observación en "Fertilización zona norte": "Se usaron 2 bolsas extra"', tiempo: 'Hace 2 días' },
  { color: '#1d4ed8', bg: '#dbeafe', texto: 'Cambiaste el estado de "Recolección racimos" a Completada', tiempo: 'Hace 3 días' },
  { color: '#16a34a', bg: '#dcfce7', texto: 'Completaste la tarea "Limpieza de canales de drenaje"', tiempo: 'Hace 3 días' },
  { color: '#1d4ed8', bg: '#dbeafe', texto: 'Iniciaste turno — Check-in registrado', tiempo: 'Hace 3 días, 6:00 AM' },
];

export default function Actividad({ usuario }: { usuario: UsuarioEmp }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ENCABEZADO */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111' }}>Actividad</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Historial reciente de {usuario.nombre}
        </p>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Acciones hoy', value: 3  },
          { label: 'Esta semana',  value: 12 },
          { label: 'Este mes',     value: 47 },
        ].map(m => (
          <div key={m.label} style={{
            background: '#fff',
            border: '0.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#111' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* TIMELINE */}
      <div style={{
        background: '#fff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: '0.5px solid #e5e7eb',
          fontSize: 13,
          fontWeight: 600,
          color: '#111',
        }}>
          Registro de actividad
        </div>

        <div style={{ padding: '8px 0' }}>
          {ACTIVIDAD.map((a, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 18px',
              borderBottom: i < ACTIVIDAD.length - 1 ? '0.5px solid #f3f4f6' : 'none',
            }}>
              {/* dot */}
              <div style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: a.color,
                flexShrink: 0,
                marginTop: 5,
                boxShadow: `0 0 0 3px ${a.bg}`,
              }} />

              {/* texto */}
              <span style={{ fontSize: 13, color: '#374151', flex: 1, lineHeight: 1.5 }}>
                {a.texto}
              </span>

              {/* tiempo */}
              <span style={{
                fontSize: 11,
                color: '#9ca3af',
                flexShrink: 0,
                marginTop: 2,
                whiteSpace: 'nowrap',
              }}>
                {a.tiempo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}