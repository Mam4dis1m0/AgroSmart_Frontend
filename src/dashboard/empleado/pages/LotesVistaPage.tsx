const LOTES = [
  { id: 'A-1', hectareas: 12.5, palmas: 312, cultivo: 'Palma africana', estado: 'Activo',       responsable: 'Juan Empleado',     ultima: '2026-04-06' },
  { id: 'A-2', hectareas: 10.0, palmas: 250, cultivo: 'Palma africana', estado: 'Activo',       responsable: 'María Trabajadora', ultima: '2026-04-05' },
  { id: 'B-1', hectareas: 8.0,  palmas: 200, cultivo: 'Palma africana', estado: 'Revisión',     responsable: 'Pedro Jornalero',   ultima: '2026-04-04' },
  { id: 'B-2', hectareas: 14.0, palmas: 350, cultivo: 'Palma africana', estado: 'Activo',       responsable: 'María Trabajadora', ultima: '2026-04-06' },
  { id: 'C-1', hectareas: 6.5,  palmas: 160, cultivo: 'Palma africana', estado: 'En descanso',  responsable: 'Luis Operario',     ultima: '2026-03-30' },
  { id: 'C-2', hectareas: 11.0, palmas: 275, cultivo: 'Palma africana', estado: 'Activo',       responsable: 'Carlos Encargado',  ultima: '2026-04-05' },
];

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  'Activo':       { background: '#dcfce7', color: '#16a34a' },
  'Revisión':     { background: '#fef9c3', color: '#ca8a04' },
  'En descanso':  { background: '#dbeafe', color: '#1d4ed8' },
};

const pill: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 99,
  fontSize: 11,
  fontWeight: 600,
};

export default function LotesVista() {
  const totalHa     = LOTES.reduce((s, l) => s + l.hectareas, 0);
  const totalPalmas = LOTES.reduce((s, l) => s + l.palmas, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ENCABEZADO */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111' }}>Lotes</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Vista general de la finca — solo lectura
        </p>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Total lotes',       value: LOTES.length },
          { label: 'Hectáreas totales', value: `${totalHa} ha` },
          { label: 'Total palmas',      value: totalPalmas.toLocaleString('es-CO') },
        ].map(m => (
          <div key={m.label} style={{
            background: '#fff',
            border: '0.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* GRID DE LOTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {LOTES.map(l => (
          <div key={l.id} style={{
            background: '#fff',
            border: '0.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            {/* cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Lote {l.id}</span>
              <span style={{ ...pill, ...ESTADO_STYLE[l.estado] }}>{l.estado}</span>
            </div>

            {/* filas de info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { k: 'Hectáreas',   v: `${l.hectareas} ha` },
                { k: 'Palmas',      v: l.palmas },
                { k: 'Cultivo',     v: l.cultivo },
                { k: 'Responsable', v: l.responsable },
                { k: 'Última act.', v: l.ultima },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#9ca3af' }}>{r.k}</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NOTA SOLO LECTURA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: '#f9fafb',
        border: '0.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: 12,
        color: '#6b7280',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Vista de solo lectura. Para modificar lotes, contacta al administrador.
      </div>

    </div>
  );
}