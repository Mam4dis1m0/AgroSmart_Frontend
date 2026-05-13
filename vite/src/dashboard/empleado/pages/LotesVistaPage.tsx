const LOTES = [
  { id: 'A-1', hectareas: 12.5, palmas: 312, cultivo: 'Palma africana', estado: 'Activo',    responsable: 'Juan Empleado',    ultima: '2026-04-06' },
  { id: 'A-2', hectareas: 10.0, palmas: 250, cultivo: 'Palma africana', estado: 'Activo',    responsable: 'María Trabajadora', ultima: '2026-04-05' },
  { id: 'B-1', hectareas: 8.0,  palmas: 200, cultivo: 'Palma africana', estado: 'Revisión',  responsable: 'Pedro Jornalero',   ultima: '2026-04-04' },
  { id: 'B-2', hectareas: 14.0, palmas: 350, cultivo: 'Palma africana', estado: 'Activo',    responsable: 'María Trabajadora', ultima: '2026-04-06' },
  { id: 'C-1', hectareas: 6.5,  palmas: 160, cultivo: 'Palma africana', estado: 'En descanso', responsable: 'Luis Operario',   ultima: '2026-03-30' },
  { id: 'C-2', hectareas: 11.0, palmas: 275, cultivo: 'Palma africana', estado: 'Activo',    responsable: 'Carlos Encargado',  ultima: '2026-04-05' },
];

export default function LotesVista() {
  return (
    <>
      <div className="page-title">LOTES</div>
      <div className="page-sub">Vista general de la finca — solo lectura</div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-label">Total Lotes</div>
          <div className="metric-val">6</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Hectáreas totales</div>
          <div className="metric-val">62</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Palmas</div>
          <div className="metric-val">1.547</div>
        </div>
      </div>

      <div className="lote-readonly-grid">
        {LOTES.map(l => (
          <div className="lote-card-ro" key={l.id}>
            <div className="lote-num">LOTE {l.id}</div>
            <div style={{ marginBottom: 10 }}>
              <span className={`badge ${l.estado === 'Activo' ? 'badge-green' : l.estado === 'Revisión' ? 'badge-yellow' : 'badge-blue'}`}>
                {l.estado}
              </span>
            </div>
            {[
              { k: 'Hectáreas',    v: `${l.hectareas} ha` },
              { k: 'Palmas',       v: l.palmas },
              { k: 'Cultivo',      v: l.cultivo },
              { k: 'Responsable',  v: l.responsable },
              { k: 'Última act.',  v: l.ultima },
            ].map(r => (
              <div className="lote-info-row" key={r.k}>
                <span>{r.k}</span>
                <span className="lote-info-val">{r.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="readonly-note">🔒 Esta vista es de solo lectura. Para modificar lotes, contacta al administrador.</p>
    </>
  );
}