import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function Graficas() {
  const anualRef = useRef<HTMLCanvasElement>(null);
  const lotesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const anual = new Chart(anualRef.current!, {
      type: 'line',
      data: {
        labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
        datasets: [
          {
            label: 'Palmas', data: [120,132,141,138,155,162,170,165,172,180,178,190],
            borderColor: '#6aaa00', backgroundColor: 'rgba(106,170,0,0.1)',
            tension: 0.4, fill: true, pointBackgroundColor: '#90cc00', pointRadius: 4,
          },
          {
            label: 'Cultivos', data: [80,85,78,92,98,105,100,110,108,115,120,125],
            borderColor: '#f0c000', backgroundColor: 'rgba(240,192,0,0.08)',
            tension: 0.4, fill: true, pointBackgroundColor: '#f0c000', pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }, grid: { color: 'rgba(106,170,0,0.08)' } },
          y: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }, grid: { color: 'rgba(106,170,0,0.08)' } },
        },
      },
    });

    const lotes = new Chart(lotesRef.current!, {
      type: 'bar',
      data: {
        labels: ['Lote A','Lote B','Lote C','Lote D','Lote E'],
        datasets: [{
          label: 'Ha', data: [45, 32, 28, 51, 38],
          backgroundColor: ['#6aaa00','#90cc00','#3d7a00','#f0c000','#6aaa00'],
          borderRadius: 6,
        }],
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

    return () => { anual.destroy(); lotes.destroy(); };
  }, []);

  return (
    <>
      <p className="page-title">Gráficas e Indicadores</p>
      <p className="page-sub">Visualización de datos de producción y rendimiento</p>

      <div className="chart-legend" style={{ marginBottom: 8 }}>
        {[['#6aaa00','Palmas'],['#f0c000','Cultivos']].map(([c,l]) => (
          <span key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>
        ))}
      </div>

      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-title">Producción anual — palmas vs cultivos</div>
        <div className="chart-wrap" style={{ height: 240 }}>
          <canvas ref={anualRef} />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Área por lote (hectáreas)</div>
        <div className="chart-wrap" style={{ height: 200 }}>
          <canvas ref={lotesRef} />
        </div>
      </div>
    </>
  );
}