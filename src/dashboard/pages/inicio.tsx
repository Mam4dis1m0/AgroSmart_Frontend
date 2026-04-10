import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function Inicio() {
  const prodRef = useRef<HTMLCanvasElement>(null);
  const estRef  = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prod = new Chart(prodRef.current!, {
      type: 'bar',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{ label: 'Toneladas', data: [42, 55, 38, 67, 71, 60], backgroundColor: '#6aaa00', borderRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }, grid: { color: 'rgba(106,170,0,0.1)' } },
        },
      },
    });

    const est = new Chart(estRef.current!, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Pendientes', 'Completados'],
        datasets: [{ data: [12, 5, 28], backgroundColor: ['#6aaa00', '#f0c000', '#3d7a00'], borderWidth: 0 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '65%' },
    });

    return () => { prod.destroy(); est.destroy(); };
  }, []);

  const tareas = [
    { nombre: 'Fumigación zona norte', lote: 'Lote A', empleado: 'Carlos R.', estado: 'Pendiente' },
    { nombre: 'Riego sistema 3',       lote: 'Lote C', empleado: 'María L.',  estado: 'Activo'    },
    { nombre: 'Poda de palmas',         lote: 'Lote B', empleado: 'Pedro M.', estado: 'Activo'    },
    { nombre: 'Análisis de suelo',      lote: 'Lote D', empleado: 'Ana G.',   estado: 'Completado'},
  ];

  const estadoBadge: Record<string, string> = {
    Activo: 'badge-green', Pendiente: 'badge-yellow', Completado: 'badge-blue',
  };

  return (
    <>
      <p className="page-title">Panel de Control</p>
      <p className="page-sub">Resumen general del sistema — Agriculture Co.</p>

      <div className="metrics">
        {[
          { lbl: 'Lotes activos',        val: '18',   sub: '5 regiones'        },
          { lbl: 'Palmas registradas',   val: '2,340', sub: '↑ 12% este mes'  },
          { lbl: 'Cultivos activos',     val: '47',   sub: '8 tipos de cultivo'},
          { lbl: 'Empleados',            val: '12',   sub: '9 activos hoy'     },
        ].map(m => (
          <div className="metric-card" key={m.lbl}>
            <div className="metric-label">{m.lbl}</div>
            <div className="metric-val">{m.val}</div>
            <div className={`metric-sub ${m.sub.startsWith('↑') ? 'trend-up' : ''}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Producción mensual (ton)</div>
          <div className="chart-wrap"><canvas ref={prodRef} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Estado de tareas</div>
          <div className="chart-legend">
            {[['#6aaa00','Activos 27%'],['#f0c000','Pendientes 11%'],['#3d7a00','Completados 62%']].map(([c,l]) => (
              <span key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>
            ))}
          </div>
          <div className="chart-wrap"><canvas ref={estRef} /></div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header"><span>Tareas recientes</span></div>
        <table>
          <thead><tr><th>Tarea</th><th>Lote</th><th>Asignado a</th><th>Estado</th></tr></thead>
          <tbody>
            {tareas.map(t => (
              <tr key={t.nombre}>
                <td>{t.nombre}</td><td>{t.lote}</td><td>{t.empleado}</td>
                <td><span className={`badge ${estadoBadge[t.estado]}`}>{t.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}