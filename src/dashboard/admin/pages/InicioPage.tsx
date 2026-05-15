import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import './InicioPage.css';

const API = 'http://localhost:3000';

/* ── CLIMA ── */
interface Clima {
  temperatura: number; viento: number; lluvia: number;
  humedad: number; descripcion: string;
}
function useClima() {
  const [clima, setClima]     = useState<Clima | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=10.4631&longitude=-73.2532&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=America%2FBogota')
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        setClima({
          temperatura: c.temperature_2m, viento: c.wind_speed_10m,
          lluvia: c.precipitation,       humedad: c.relative_humidity_2m,
          descripcion: c.temperature_2m > 30 ? 'Calor intenso' : c.temperature_2m > 24 ? 'Temperatura agradable' : 'Temperatura fresca',
        });
      })
      .finally(() => setCargando(false));
  }, []);
  return { clima, cargando };
}

/* ── DATOS BD ── */
interface Stats {
  lotes: number; palmas: number; cultivos: number;
  empleados: number; tareasActivas: number; tareasPendientes: number; tareasCompletadas: number;
}
interface TareaReciente {
  nombre: string; lote: string; empleado: string; estado: string;
}

function useDatos() {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [tareas, setTareas]         = useState<TareaReciente[]>([]);
  const [produccion, setProduccion] = useState<number[]>([42, 55, 38, 67, 71, 60]); // fallback
  const [cargando, setCargando]     = useState(true);

  useEffect(() => {
    const fetchTodo = async () => {
      try {
        const [resLotes, resPalmas, resCultivos, resEmpleados, resTareas] = await Promise.allSettled([
          fetch(`${API}/lotes`).then(r => r.json()),
          fetch(`${API}/palmas`).then(r => r.json()),
          fetch(`${API}/cultivos`).then(r => r.json()),
          fetch(`${API}/api/v1/empleados`).then(r => r.json()),
          fetch(`${API}/api/v1/tareas`).then(r => r.json()),
        ]);

        const lotes     = resLotes.status     === 'fulfilled' ? resLotes.value     : [];
        const palmas    = resPalmas.status    === 'fulfilled' ? resPalmas.value    : [];
        const cultivos  = resCultivos.status  === 'fulfilled' ? resCultivos.value  : [];
        const empleados = resEmpleados.status === 'fulfilled' ? resEmpleados.value : [];
        const tareasRaw = resTareas.status    === 'fulfilled' ? resTareas.value    : [];

        const activas    = Array.isArray(tareasRaw) ? tareasRaw.filter((t: any) => t.estado === 'en_progreso' || t.estado === 'activo').length    : 0;
        const pendientes = Array.isArray(tareasRaw) ? tareasRaw.filter((t: any) => t.estado === 'pendiente').length   : 0;
        const completadas= Array.isArray(tareasRaw) ? tareasRaw.filter((t: any) => t.estado === 'completada' || t.estado === 'completado').length : 0;

        setStats({
          lotes:     Array.isArray(lotes)     ? lotes.length     : 0,
          palmas:    Array.isArray(palmas)     ? palmas.length    : 0,
          cultivos:  Array.isArray(cultivos)   ? cultivos.length  : 0,
          empleados: Array.isArray(empleados)  ? empleados.length : 0,
          tareasActivas:    activas,
          tareasPendientes: pendientes,
          tareasCompletadas: completadas,
        });

        // Últimas 4 tareas
        if (Array.isArray(tareasRaw) && tareasRaw.length > 0) {
          const ultimas = tareasRaw.slice(-4).reverse().map((t: any) => ({
            nombre:   t.nombretarea   ?? t.nombre   ?? t.titulo ?? '—',
            lote:     t.idlote?.nombre ?? t.lote    ?? '—',
            empleado: t.idusuario?.primernombre
              ? `${t.idusuario.primernombre} ${t.idusuario.primerapellido ?? ''}`.trim()
              : t.empleado ?? '—',
            estado: t.estado ?? '—',
          }));
          setTareas(ultimas);
        }

      } catch {
        // mantiene fallback
      } finally {
        setCargando(false);
      }
    };
    fetchTodo();
  }, []);

  return { stats, tareas, produccion, cargando };
}

/* ── COMPONENTE ── */
export default function Inicio() {
  const { clima, cargando: cargandoClima } = useClima();
  const { stats, tareas, produccion, cargando: cargandoDatos } = useDatos();
  const prodRef = useRef<HTMLCanvasElement>(null);
  const estRef  = useRef<HTMLCanvasElement>(null);
  const prodChart = useRef<Chart | null>(null);
  const estChart  = useRef<Chart | null>(null);

  // Gráfica producción
  useEffect(() => {
    if (!prodRef.current) return;
    prodChart.current?.destroy();
    prodChart.current = new Chart(prodRef.current, {
      type: 'bar',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Toneladas',
          data: produccion,
          backgroundColor: '#40916c',
          borderRadius: 8,
          hoverBackgroundColor: '#2d6a4f',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a9485', font: { size: 12 } }, grid: { display: false }, border: { display: false } },
          y: { ticks: { color: '#7a9485', font: { size: 12 } }, grid: { color: 'rgba(45,106,79,0.08)' }, border: { display: false } },
        },
      },
    });
    return () => prodChart.current?.destroy();
  }, [produccion]);

  // Gráfica estado tareas
  useEffect(() => {
    if (!estRef.current || !stats) return;
    estChart.current?.destroy();
    estChart.current = new Chart(estRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Pendientes', 'Completados'],
        datasets: [{
          data: [stats.tareasActivas, stats.tareasPendientes, stats.tareasCompletadas],
          backgroundColor: ['#40916c', '#c77b2a', '#2d6a4f'],
          borderWidth: 0, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '65%',
      },
    });
    return () => estChart.current?.destroy();
  }, [stats]);

  const estadoBadge: Record<string, string> = {
    activo: 'badge-green', en_progreso: 'badge-green',
    pendiente: 'badge-yellow',
    completada: 'badge-blue', completado: 'badge-blue',
  };

  const totalTareas = (stats?.tareasActivas ?? 0) + (stats?.tareasPendientes ?? 0) + (stats?.tareasCompletadas ?? 0);
  const pctActivas    = totalTareas ? Math.round((stats!.tareasActivas     / totalTareas) * 100) : 27;
  const pctPendientes = totalTareas ? Math.round((stats!.tareasPendientes  / totalTareas) * 100) : 11;
  const pctCompletadas= totalTareas ? Math.round((stats!.tareasCompletadas / totalTareas) * 100) : 62;

  return (
    <>
      <p className="page-title">Panel de Control</p>
      <p className="page-sub">Resumen general del sistema — Agriculture Co.</p>

      {/* CLIMA */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <div className="table-header">
          <span>Clima en tiempo real — Valledupar, Cesar</span>
          <span style={{ fontSize: 12, color: '#7a9485', fontWeight: 600 }}>Fuente: Open-Meteo</span>
        </div>
        {cargandoClima ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#7a9485', fontWeight: 600 }}>Cargando datos del clima...</div>
        ) : clima ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { icon: '🌡️', label: 'Temperatura',  val: `${clima.temperatura}°C`, color: clima.temperatura > 30 ? '#b94040' : '#2d6a4f' },
              { icon: '💧', label: 'Humedad',       val: `${clima.humedad}%`,      color: '#1e40af' },
              { icon: '🌬️', label: 'Viento',        val: `${clima.viento} km/h`,   color: '#c77b2a' },
              { icon: '🌧️', label: 'Precipitación', val: `${clima.lluvia} mm`,     color: '#1e40af' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f5f0e8', border: '1.5px solid rgba(45,106,79,0.15)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: '#7a9485', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: item.color, fontWeight: 700 }}>{item.val}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 13, color: '#7a9485', paddingTop: 10, borderTop: '1px solid rgba(45,106,79,0.1)', fontWeight: 600 }}>
              {clima.descripcion} — Datos actualizados en tiempo real
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#b94040', fontWeight: 600 }}>No se pudo obtener el clima.</div>
        )}
      </div>

      {/* MÉTRICAS */}
      {cargandoDatos ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#7a9485', fontWeight: 600 }}>Cargando datos...</div>
      ) : (
        <div className="metrics">
          {[
            { lbl: 'Lotes activos',       val: stats?.lotes.toLocaleString()    ?? '—', sub: 'registrados en BD'   },
            { lbl: 'Palmas registradas',  val: stats?.palmas.toLocaleString()   ?? '—', sub: 'total en sistema'    },
            { lbl: 'Cultivos activos',    val: stats?.cultivos.toLocaleString() ?? '—', sub: 'tipos registrados'   },
            { lbl: 'Empleados',           val: stats?.empleados.toLocaleString()?? '—', sub: 'en el sistema'       },
          ].map(m => (
            <div className="metric-card" key={m.lbl}>
              <div className="metric-label">{m.lbl}</div>
              <div className="metric-val">{m.val}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* GRÁFICAS */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Producción mensual (ton)</div>
          <div className="chart-wrap"><canvas ref={prodRef} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Estado de tareas</div>
          <div className="chart-legend">
            {[
              ['#40916c', `Activos ${pctActivas}%`],
              ['#c77b2a', `Pendientes ${pctPendientes}%`],
              ['#2d6a4f', `Completados ${pctCompletadas}%`],
            ].map(([c, l]) => (
              <span key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>
            ))}
          </div>
          <div className="chart-wrap"><canvas ref={estRef} /></div>
        </div>
      </div>

      {/* TAREAS RECIENTES */}
      <div className="table-card">
        <div className="table-header"><span>Tareas recientes</span></div>
        {tareas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#7a9485' }}>No hay tareas registradas</div>
        ) : (
          <table>
            <thead>
              <tr><th>Tarea</th><th>Lote</th><th>Asignado a</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {tareas.map((t, i) => (
                <tr key={i}>
                  <td>{t.nombre}</td>
                  <td>{t.lote}</td>
                  <td>{t.empleado}</td>
                  <td><span className={`badge ${estadoBadge[t.estado] ?? 'badge-blue'}`}>{t.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}