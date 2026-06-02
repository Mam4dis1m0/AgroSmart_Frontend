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
        const temp = c.temperature_2m;
        let desc = 'Temperatura fresca';
        if (temp > 30) desc = 'Calor intenso';
        else if (temp > 24) desc = 'Temperatura agradable';

        setClima({
          temperatura: temp,
          viento: c.wind_speed_10m,
          lluvia: c.precipitation,
          humedad: c.relative_humidity_2m,
          descripcion: desc,
        });
      })
      .catch(() => setClima(null))
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

// ✅ FIX: Normaliza el estado para comparar sin importar mayúsculas/tildes
function normalizarEstado(estado: string | null | undefined): string {
  if (!estado) return '';
  const s = estado.toLowerCase().trim();
  if (s === 'en progreso' || s === 'en_progreso' || s === 'activo') return 'en_progreso';
  if (s === 'pendiente')                                             return 'pendiente';
  if (s === 'completado' || s === 'completada')                     return 'completado';
  return s;
}

function useDatos() {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [tareas, setTareas]         = useState<TareaReciente[]>([]);
  const [produccion, setProduccion] = useState<number[]>([42, 55, 38, 67, 71, 60]);
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

        // ✅ FIX: usar normalizarEstado() para que 'En progreso', 'Pendiente', 'Completado' funcionen
        const activas     = Array.isArray(tareasRaw) ? tareasRaw.filter((t: any) => normalizarEstado(t.estado) === 'en_progreso').length    : 0;
        const pendientes  = Array.isArray(tareasRaw) ? tareasRaw.filter((t: any) => normalizarEstado(t.estado) === 'pendiente').length      : 0;
        const completadas = Array.isArray(tareasRaw) ? tareasRaw.filter((t: any) => normalizarEstado(t.estado) === 'completado').length     : 0;

        setStats({
          lotes:     Array.isArray(lotes)    ? lotes.length    : 0,
          palmas:    Array.isArray(palmas)   ? palmas.length   : 0,
          cultivos:  Array.isArray(cultivos) ? cultivos.length : 0,
          empleados: Array.isArray(empleados)? empleados.length: 0,
          tareasActivas:     activas,
          tareasPendientes:  pendientes,
          tareasCompletadas: completadas,
        });

        // ✅ FIX: mapear usando la estructura real de la BD
        // Estructura: tarea.tipoactividad, tarea.estado
        //             tarea.asignacionTareas[0].idempleado.idusuario2.primernombre
        //             tarea.idcultivo?.idlote?.nombre (muchas veces null)
        if (Array.isArray(tareasRaw) && tareasRaw.length > 0) {
          const ultimas = [...tareasRaw]
            .reverse()
            .slice(0, 4)
            .map((t: any) => {
              // Nombre de la tarea
              const nombre = t.tipoactividad ?? t.nombretarea ?? t.nombre ?? t.titulo ?? '—';

              // Lote: viene dentro de idcultivo.idlote
              const lote =
                t.idcultivo?.idlote?.nombre ??
                t.idcultivo?.nombre ??
                t.lote ??
                '—';

              // Empleado: está en asignacionTareas[0].idempleado.idusuario2
              let empleado = '—';
              const asig = Array.isArray(t.asignacionTareas) ? t.asignacionTareas[0] : null;
              if (asig) {
                const emp2 = asig.idempleado?.idusuario2;
                if (emp2?.primernombre) {
                  empleado = `${emp2.primernombre} ${emp2.primerapellido ?? ''}`.trim();
                } else if (asig.idempleado?.primernombre) {
                  empleado = `${asig.idempleado.primernombre} ${asig.idempleado.primerapellido ?? ''}`.trim();
                }
              }

              return { nombre, lote, empleado, estado: t.estado ?? '—' };
            });
          setTareas(ultimas);
        }
      } catch {
        // fallback silencioso
      } finally {
        setCargando(false);
      }
    };
    fetchTodo();
  }, []);

  return { stats, tareas, produccion, cargando };
}

/* ── 3D WEATHER ICONS (SVG) ── */
const WeatherIconTemp = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tempGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DC2626"/>
        <stop offset="100%" stopColor="#EF4444"/>
      </linearGradient>
      <filter id="tempShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#DC2626" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#tempGrad)" filter="url(#tempShadow)" opacity="0.15"/>
    <circle cx="24" cy="24" r="12" fill="url(#tempGrad)" filter="url(#tempShadow)"/>
    <path d="M24 12V16M24 32V36M12 24H16M32 24H36M16.7 16.7L19.5 19.5M28.5 28.5L31.3 31.3M16.7 31.3L19.5 28.5M28.5 19.5L31.3 16.7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WeatherIconHumidity = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="humGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E40AF"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
      <filter id="humShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1E40AF" floodOpacity="0.3"/>
      </filter>
    </defs>
    <ellipse cx="24" cy="28" rx="14" ry="10" fill="url(#humGrad)" filter="url(#humShadow)" opacity="0.15"/>
    <path d="M24 8C24 8 14 18 14 28C14 34 18 38 24 38C30 38 34 34 34 28C34 18 24 8 24 8Z" fill="url(#humGrad)" filter="url(#humShadow)"/>
    <ellipse cx="20" cy="24" rx="3" ry="2" fill="white" opacity="0.4"/>
  </svg>
);

const WeatherIconWind = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="windGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C77B2A"/>
        <stop offset="100%" stopColor="#D97706"/>
      </linearGradient>
      <filter id="windShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C77B2A" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#windGrad)" filter="url(#windShadow)" opacity="0.15"/>
    <path d="M10 20H28C30 20 32 18 32 16C32 14 30 12 28 12" stroke="url(#windGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#windShadow)"/>
    <path d="M10 28H34C36 28 38 30 38 32C38 34 36 36 34 36" stroke="url(#windGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#windShadow)"/>
    <path d="M10 36H24" stroke="url(#windGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#windShadow)"/>
    <circle cx="36" cy="16" r="4" fill="url(#windGrad)" filter="url(#windShadow)"/>
  </svg>
);

const WeatherIconRain = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E40AF"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
      <filter id="rainShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1E40AF" floodOpacity="0.3"/>
      </filter>
    </defs>
    <ellipse cx="24" cy="20" rx="14" ry="10" fill="url(#rainGrad)" filter="url(#rainShadow)" opacity="0.15"/>
    <path d="M16 20C16 14 20 10 24 10C28 10 32 14 32 20" fill="url(#rainGrad)" filter="url(#rainShadow)"/>
    <path d="M18 26L16 34" stroke="url(#rainGrad)" strokeWidth="2.5" strokeLinecap="round" filter="url(#rainShadow)"/>
    <path d="M24 26L22 34" stroke="url(#rainGrad)" strokeWidth="2.5" strokeLinecap="round" filter="url(#rainShadow)"/>
    <path d="M30 26L28 34" stroke="url(#rainGrad)" strokeWidth="2.5" strokeLinecap="round" filter="url(#rainShadow)"/>
  </svg>
);

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
          backgroundColor: '#2E7D32',
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: '#1B5E20',
          barThickness: 32,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#8A9A8F', font: { size: 12, family: 'Inter' } },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            ticks: { color: '#8A9A8F', font: { size: 12, family: 'Inter' } },
            grid: { color: 'rgba(27,94,32,0.06)' },
            border: { display: false },
          },
        },
      },
    });
    return () => prodChart.current?.destroy();
  }, [produccion]);

  // Gráfica estado tareas — Doughnut
  useEffect(() => {
    if (!estRef.current || !stats) return;
    estChart.current?.destroy();
    estChart.current = new Chart(estRef.current, {
      type: 'doughnut',
      data: {
        labels: ['En progreso', 'Pendientes', 'Completados'],
        datasets: [{
          data: [stats.tareasActivas, stats.tareasPendientes, stats.tareasCompletadas],
          backgroundColor: ['#2E7D32', '#D97706', '#1B5E20'],
          borderWidth: 0,
          hoverOffset: 8,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '68%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
    });
    return () => estChart.current?.destroy();
  }, [stats]);

  // ✅ FIX: badge usando el estado real de la BD (con mayúsculas)
  const estadoBadge: Record<string, string> = {
    'En progreso': 'badge-green',
    'en progreso': 'badge-green',
    'Pendiente':   'badge-yellow',
    'pendiente':   'badge-yellow',
    'Completado':  'badge-blue',
    'completado':  'badge-blue',
    'Completada':  'badge-blue',
    'completada':  'badge-blue',
  };

  const totalTareas = (stats?.tareasActivas ?? 0) + (stats?.tareasPendientes ?? 0) + (stats?.tareasCompletadas ?? 0);
  const pctActivas     = totalTareas ? Math.round((stats!.tareasActivas     / totalTareas) * 100) : 0;
  const pctPendientes  = totalTareas ? Math.round((stats!.tareasPendientes  / totalTareas) * 100) : 0;
  const pctCompletadas = totalTareas ? Math.round((stats!.tareasCompletadas / totalTareas) * 100) : 0;

  const getTempClass = (temp: number) => {
    if (temp > 30) return 'hot';
    if (temp > 24) return 'warm';
    if (temp < 18) return 'cool';
    return 'normal';
  };

  return (
    <>
      <p className="page-title">Panel de Control</p>
      <p className="page-sub">Resumen general del sistema — Agriculture Co.</p>

      {/* CLIMA — Glassmorphism */}
      <div className="weather-section">
        <div className="weather-header">
          <div className="weather-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19"/>
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M19.07 4.93l-1.41 1.41M22 12h-2"/>
            </svg>
            Clima en tiempo real — Valledupar, Cesar
          </div>
          <span className="weather-source">Fuente: Open-Meteo</span>
        </div>

        {cargandoClima ? (
          <div className="weather-loading">Cargando datos del clima...</div>
        ) : clima ? (
          <div className="weather-grid">
            <div className="weather-card">
              <div className="weather-icon"><WeatherIconTemp /></div>
              <div className="weather-label">Temperatura</div>
              <div className={`weather-value ${getTempClass(clima.temperatura)}`}>
                {clima.temperatura}°C
              </div>
              <div className="weather-desc">{clima.descripcion}</div>
            </div>

            <div className="weather-card">
              <div className="weather-icon"><WeatherIconHumidity /></div>
              <div className="weather-label">Humedad</div>
              <div className="weather-value normal">{clima.humedad}%</div>
              <div className="weather-desc">Relativa del aire</div>
            </div>

            <div className="weather-card">
              <div className="weather-icon"><WeatherIconWind /></div>
              <div className="weather-label">Viento</div>
              <div className="weather-value normal">{clima.viento} km/h</div>
              <div className="weather-desc">Velocidad actual</div>
            </div>

            <div className="weather-card">
              <div className="weather-icon"><WeatherIconRain /></div>
              <div className="weather-label">Precipitación</div>
              <div className="weather-value normal">{clima.lluvia} mm</div>
              <div className="weather-desc">Acumulado hoy</div>
            </div>

            <div className="weather-footer">
              {clima.descripcion} — Datos actualizados en tiempo real desde Open-Meteo
            </div>
          </div>
        ) : (
          <div className="weather-error">No se pudo obtener el clima. Intente más tarde.</div>
        )}
      </div>

      {/* MÉTRICAS */}
      {cargandoDatos ? (
        <div className="loading-overlay">Cargando datos del sistema...</div>
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
          <div className="chart-title">Producción mensual (toneladas)</div>
          <div className="chart-wrap"><canvas ref={prodRef} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Estado de tareas</div>
          <div className="chart-legend">
            {[
              ['#2E7D32', `En progreso ${pctActivas}%`],
              ['#D97706', `Pendientes ${pctPendientes}%`],
              ['#1B5E20', `Completados ${pctCompletadas}%`],
            ].map(([c, l]) => (
              <span key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>
            ))}
          </div>
          <div className="chart-wrap"><canvas ref={estRef} /></div>
        </div>
      </div>

      {/* TAREAS RECIENTES */}
      <div className="tasks-section">
        <div className="tasks-header">
          <div className="tasks-header-title">Tareas recientes</div>
        </div>
        {tareas.length === 0 ? (
          <div className="empty-state">No hay tareas registradas en el sistema</div>
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