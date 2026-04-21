import type { UsuarioEmp } from '../DashboardEmpleado';

const ACTIVIDAD = [
  { color: 'green',  texto: 'Completaste la tarea "Registro de producción diaria"', tiempo: 'Hace 1 hora' },
  { color: 'blue',   texto: 'Cambiaste el estado de "Inspección de plagas" a En progreso', tiempo: 'Hace 2 horas' },
  { color: 'yellow', texto: 'Agregaste observación: "Se encontraron 3 palmas con síntomas leves en fila 5."', tiempo: 'Hace 2 horas' },
  { color: 'green',  texto: 'Completaste la tarea "Riego zona sur — Lote A-1"', tiempo: 'Ayer, 4:30 PM' },
  { color: 'blue',   texto: 'Iniciaste turno — Check-in registrado', tiempo: 'Ayer, 6:00 AM' },
  { color: 'green',  texto: 'Completaste la tarea "Poda sector 1"', tiempo: 'Hace 2 días' },
  { color: 'yellow', texto: 'Agregaste observación en "Fertilización zona norte": "Se usaron 2 bolsas extra"', tiempo: 'Hace 2 días' },
  { color: 'blue',   texto: 'Cambiaste el estado de "Recolección racimos" a Completada', tiempo: 'Hace 3 días' },
  { color: 'green',  texto: 'Completaste la tarea "Limpieza de canales de drenaje"', tiempo: 'Hace 3 días' },
  { color: 'blue',   texto: 'Iniciaste turno — Check-in registrado', tiempo: 'Hace 3 días, 6:00 AM' },
];

export default function Actividad({ usuario }: { usuario: UsuarioEmp }) {
  return (
    <>
      <div className="page-title">ACTIVIDAD</div>
      <div className="page-sub">Historial reciente de {usuario.nombre}</div>

      {/* RESUMEN RÁPIDO */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-label">Acciones hoy</div>
          <div className="metric-val">3</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Esta semana</div>
          <div className="metric-val">12</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Este mes</div>
          <div className="metric-val">47</div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="table-card">
        <div className="table-header"><span>Registro de actividad</span></div>
        <div className="actividad-list">
          {ACTIVIDAD.map((a, i) => (
            <div className="act-item" key={i}>
              <div className={`act-dot ${a.color}`} />
              <div className="act-text">{a.texto}</div>
              <div className="act-time">{a.tiempo}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}