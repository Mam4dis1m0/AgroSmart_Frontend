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
            borderColor: '#1B5E20',
            backgroundColor: 'rgba(27,94,32,0.08)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#2E7D32',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            borderWidth: 3,
          },
          {
            label: 'Cultivos',
            data: [80,85,78,92,98,105,100,110,108,115,120,125],
            borderColor: '#C77B2A',
            backgroundColor: 'rgba(199,123,42,0.07)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#C77B2A',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            ticks: { color: '#8A9A8F', font: { size: 12, family: 'Inter' } },
            grid: { color: 'rgba(27,94,32,0.05)' },
            border: { display: false },
          },
          y: {
            ticks: { color: '#8A9A8F', font: { size: 12, family: 'Inter' } },
            grid: { color: 'rgba(27,94,32,0.05)' },
            border: { display: false },
          },
        },
        elements: {
          line: { borderJoinStyle: 'round' },
        },
      },
    });

    const lotes = new Chart(lotesRef.current!, {
      type: 'bar',
      data: {
        labels: ['Lote A','Lote B','Lote C','Lote D','Lote E'],
        datasets: [{
          label: 'Hectáreas',
          data: [45, 32, 28, 51, 38],
          backgroundColor: ['#1B5E20','#2E7D32','#4CAF50','#C77B2A','#81C784'],
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: ['#145A15','#1B5E20','#2E7D32','#A3651F','#66BB6A'],
          barThickness: 40,
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
            grid: { color: 'rgba(27,94,32,0.05)' },
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

      {/* KPI Cards */}
      <div className="metrics" style={{ marginBottom: 24 }}>
        {[
          { label: 'Producción total', value: '1,893', sub: 'toneladas este año', color: '#1B5E20' },
          { label: 'Rendimiento promedio', value: '38.2', sub: 'ton/ha', color: '#2E7D32' },
          { label: 'Lotes activos', value: '5', sub: 'en producción', color: '#4CAF50' },
          { label: 'Eficiencia', value: '94%', sub: 'vs año anterior', color: '#C77B2A' },
        ].map(kpi => (
          <div className="metric-card" key={kpi.label} style={{ borderTop: `3px solid ${kpi.color}` }}>
            <div className="metric-label" style={{ color: kpi.color }}>{kpi.label}</div>
            <div className="metric-val" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="chart-legend" style={{ marginBottom: 16 }}>
        {[['#1B5E20','Palmas'],['#C77B2A','Cultivos']].map(([c,l]) => (
          <span key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>
        ))}
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Producción anual — palmas vs cultivos</div>
        <div className="chart-wrap" style={{ height: 280 }}>
          <canvas ref={anualRef} />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Área por lote (hectáreas)</div>
        <div className="chart-wrap" style={{ height: 240 }}>
          <canvas ref={lotesRef} />
        </div>
      </div>
    </>
  );
}