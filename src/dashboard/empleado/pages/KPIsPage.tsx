import type { UsuarioEmp } from '../DashboardEmpleado';

export default function KPIs({ usuario }: { usuario: UsuarioEmp }) {
  const kpis = [
    { label: 'Palmas Atendidas',    val: '148',   sub: 'de 160 asignadas',      color: '#16a34a', bg: '#dcfce7' },
    { label: 'Kg Recolectados',     val: '1.165', sub: 'meta: 1.200 kg',        color: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Tasa de Completado',  val: '73%',   sub: 'tareas del mes',         color: '#ca8a04', bg: '#fef9c3' },
    { label: 'Evaluación',          val: '4.4',   sub: 'de 5.0 puntos',         color: '#16a34a', bg: '#dcfce7' },
    { label: 'Asistencia',          val: '95%',   sub: '19 de 20 días',         color: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Tareas a Tiempo',     val: '87%',   sub: 'entregadas en plazo',   color: '#ca8a04', bg: '#fef9c3' },
  ];

  const comparativa = [
    { label: 'Productividad vs. promedio del equipo', tuVal: 92, equipoVal: 78 },
    { label: 'Kg recolectados vs. meta mensual',      tuVal: 81, equipoVal: 100 },
    { label: 'Tareas completadas vs. asignadas',      tuVal: 73, equipoVal: 68  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ENCABEZADO */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111' }}>KPIs</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Indicadores clave de rendimiento — {usuario.nombre}
        </p>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: '#fff',
            border: '0.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            {/* dot acento */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: k.color,
              boxShadow: `0 0 0 3px ${k.bg}`,
              marginBottom: 12,
            }} />
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* COMPARATIVA */}
      <div style={{
        background: '#fff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: '0.5px solid #e5e7eb',
          fontSize: 13, fontWeight: 600, color: '#111',
        }}>
          Tú vs. equipo
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {comparativa.map(c => (
            <div key={c.label}>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 10 }}>{c.label}</div>

              {/* Tú */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>
                  <span>Tú</span>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>{c.tuVal}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${c.tuVal}%`,
                    background: '#16a34a',
                    transition: 'width .4s ease',
                  }} />
                </div>
              </div>

              {/* Equipo */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>
                  <span>Equipo</span>
                  <span style={{ fontWeight: 600, color: '#1d4ed8' }}>{c.equipoVal}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${c.equipoVal}%`,
                    background: '#1d4ed8',
                    opacity: 0.45,
                    transition: 'width .4s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}