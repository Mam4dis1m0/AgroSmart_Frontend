import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface Clima {
  temperatura: number;
  viento: number;
  lluvia: number;
  humedad: number;
  descripcion: string;
}

function useClima() {
  const [clima, setClima] = useState<Clima | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const lat = 10.4631;
    const lon = -73.2532;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=America%2FBogota`
    )
      .then(res => res.json())
      .then(data => {
        const c = data.current;
        setClima({
          temperatura: c.temperature_2m,
          viento:      c.wind_speed_10m,
          lluvia:      c.precipitation,
          humedad:     c.relative_humidity_2m,
          descripcion: c.temperature_2m > 30 ? 'Calor intenso' : c.temperature_2m > 24 ? 'Temperatura agradable' : 'Temperatura fresca',
        });
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  return { clima, cargando };
}

export default function Inicio() {
  const { clima, cargando } = useClima();
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

      {/* CLIMA EN TIEMPO REAL */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <div className="table-header">
          <span>Clima en tiempo real — Valledupar, Cesar</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Fuente: Open-Meteo</span>
        </div>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)' }}>Cargando datos del clima...</div>
        ) : clima ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { icon: '🌡️', label: 'Temperatura',  val: `${clima.temperatura}°C`, color: clima.temperatura > 30 ? '#ff8080' : '#90cc00' },
              { icon: '💧', label: 'Humedad',       val: `${clima.humedad}%`,      color: '#80b4ff' },
              { icon: '🌬️', label: 'Viento',        val: `${clima.viento} km/h`,   color: '#f0c000' },
              { icon: '🌧️', label: 'Precipitación', val: `${clima.lluvia} mm`,     color: '#80b4ff' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(106,170,0,0.15)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 24, fontFamily: 'Bebas Neue, sans-serif', color: item.color }}>{item.val}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {clima.descripcion} — Datos actualizados en tiempo real
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#ff8080' }}>No se pudo obtener el clima.</div>
        )}
      </div>

      <div className="metrics">
        {[
          { lbl: 'Lotes activos',        val: '18',    sub: '5 regiones'         },
          { lbl: 'Palmas registradas',   val: '2,340', sub: '↑ 12% este mes'     },
          { lbl: 'Cultivos activos',     val: '47',    sub: '8 tipos de cultivo' },
          { lbl: 'Empleados',            val: '12',    sub: '9 activos hoy'      },
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
