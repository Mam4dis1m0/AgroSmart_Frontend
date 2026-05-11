import type { UsuarioEmp } from '../DashboardEmpleado';

export default function KPIs({ usuario }: { usuario: UsuarioEmp }) {
  const kpis = [
    { icon: '🌴', label: 'Palmas Atendidas', val: '148', sub: 'de 160 asignadas' },
    { icon: '⚖️', label: 'Kg Recolectados',  val: '1.165', sub: 'meta: 1.200 kg' },
    { icon: '✓',  label: 'Tasa de Completado', val: '73%', sub: 'tareas del mes' },
    { icon: '⭐', label: 'Evaluación',        val: '4.4', sub: 'de 5.0 puntos' },
    { icon: '📅', label: 'Asistencia',        val: '95%', sub: '19 de 20 días' },
    { icon: '⏱️', label: 'Tareas a Tiempo',   val: '87%', sub: 'entregadas en plazo' },
  ];

  const comparativa = [
    { label: 'Productividad vs. promedio del equipo', tuVal: 92, equipoVal: 78 },
    { label: 'Kg recolectados vs. meta mensual',      tuVal: 81, equipoVal: 100 },
    { label: 'Tareas completadas vs. asignadas',      tuVal: 73, equipoVal: 68 },
  ];

  return (
    <>
      <div className="page-title">KPIs</div>
      <div className="page-sub">Indicadores clave de rendimiento — {usuario.nombre}</div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* COMPARATIVA */}
      <div className="table-card">
        <div className="table-header"><span>Tú vs. equipo</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {comparativa.map(c => (
            <div key={c.label}>
              <div style={{ fontSize: 13, color: 'black', marginBottom: 10 }}>{c.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'black' }}>Tú</span>
                    <span style={{ color: 'black' }}>{c.tuVal}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${c.tuVal}%` }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'black' }}>Equipo</span>
                    <span style={{ color: 'black' }}>{c.equipoVal}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill blue" style={{ width: `${c.equipoVal}%`, opacity: 0.5 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}