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
            label: 'Palmas',
            data: [120,132,141,138,155,162,170,165,172,180,178,190],
            borderColor: '#2d6a4f',
            backgroundColor: 'rgba(45,106,79,0.08)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#40916c',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          },
          {
            label: 'Cultivos',
            data: [80,85,78,92,98,105,100,110,108,115,120,125],
            borderColor: '#c77b2a',
            backgroundColor: 'rgba(199,123,42,0.07)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#c77b2a',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#7a9485', font: { size: 12, family: 'Nunito' } },
            grid: { color: 'rgba(45,106,79,0.07)' },
            border: { display: false },
          },
          y: {
            ticks: { color: '#7a9485', font: { size: 12, family: 'Nunito' } },
            grid: { color: 'rgba(45,106,79,0.07)' },
            border: { display: false },
          },
        },
      },
    });

    const lotes = new Chart(lotesRef.current!, {
      type: 'bar',
      data: {
        labels: ['Lote A','Lote B','Lote C','Lote D','Lote E'],
        datasets: [{
          label: 'Ha',
          data: [45, 32, 28, 51, 38],
          backgroundColor: ['#2d6a4f','#40916c','#74c69d','#c77b2a','#95b8a3'],
          borderRadius: 8,
          hoverBackgroundColor: ['#1f4d39','#2d6a4f','#52a57e','#a3651f','#6e9c87'],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#7a9485', font: { size: 12, family: 'Nunito' } },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            ticks: { color: '#7a9485', font: { size: 12, family: 'Nunito' } },
            grid: { color: 'rgba(45,106,79,0.07)' },
            border: { display: false },
          },
        },
      },
    });

    return () => { anual.destroy(); lotes.destroy(); };
  }, []);

  return (
    <>
      <p className="page-title">Gráficas e Indicadores</p>
      <p className="page-sub">Visualización de datos de producción y rendimiento</p>

      <div className="chart-legend" style={{ marginBottom: 10 }}>
        {[['#2d6a4f','Palmas'],['#c77b2a','Cultivos']].map(([c,l]) => (
          <span key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>
        ))}
      </div>

      <div className="chart-card" style={{ marginBottom: 18 }}>
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