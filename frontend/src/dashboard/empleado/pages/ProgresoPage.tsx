import type { UsuarioEmp } from '../DashboardEmpleado';

export default function Progreso({ usuario }: { usuario: UsuarioEmp }) {
  const semanas = [
    { sem: 'Semana 1', tareas: 8,  completadas: 8,  kg: 320 },
    { sem: 'Semana 2', tareas: 7,  completadas: 6,  kg: 295 },
    { sem: 'Semana 3', tareas: 9,  completadas: 7,  kg: 340 },
    { sem: 'Semana 4', tareas: 6,  completadas: 4,  kg: 210 },
  ];

  const areas = [
    { label: 'Tareas completadas este mes', pct: 73, color: '' },
    { label: 'Asistencia mensual',          pct: 95, color: '' },
    { label: 'Calidad de trabajo (eval.)',  pct: 88, color: 'blue' },
    { label: 'Producción vs. meta',         pct: 81, color: 'yellow' },
  ];

  return (
    <>
      <div className="page-title">PROGRESO</div>
      <div className="page-sub">{usuario.nombre} — {usuario.lote}</div>

      {/* MÉTRICAS GLOBALES */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Tareas Totales', val: '30', sub: 'este mes' },
          { label: 'Completadas',    val: '22', sub: '73% completado' },
          { label: 'Kg Recolectados',val: '1.165', sub: 'este mes' },
          { label: 'Días Trabajados',val: '19', sub: 'de 20 hábiles' },
        ].map(m => (
          <div className="metric-card" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-val">{m.val}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* BARRAS DE PROGRESO */}
      <div className="table-card" style={{ marginBottom: 20 }}>
        <div className="table-header"><span>Indicadores de desempeño</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {areas.map(a => (
            <div key={a.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'black' }}>{a.label}</span>
                <span style={{ color: 'black', fontWeight: 600 }}>{a.pct}%</span>
              </div>
              <div className="progress-bar-wrap">
                <div className={`progress-bar-fill ${a.color}`} style={{ width: `${a.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLA SEMANAL */}
      <div className="table-card">
        <div className="table-header"><span>Desempeño por semana</span></div>
        <table>
          <thead>
            <tr>
              <th>Semana</th>
              <th>Tareas asignadas</th>
              <th>Completadas</th>
              <th>% Cumplimiento</th>
              <th>Kg recolectados</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map(s => {
              const pct = Math.round((s.completadas / s.tareas) * 100);
              return (
                <tr key={s.sem}>
                  <td style={{ color: 'black' }}>{s.sem}</td>
                  <td style={{ color: 'black' }}>{s.tareas}</td>
                  <td style={{ color: 'black' }}>{s.completadas}</td>
                  <td>
                    <span className={`badge ${pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                      {pct}%
                    </span>
                  </td>
                  <td style={{ color: 'black' }}>{s.kg} kg</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}