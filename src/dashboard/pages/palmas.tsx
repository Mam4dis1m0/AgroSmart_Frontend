import { useState } from 'react';

interface Palma { id:number; codigo:string; lote:string; edad:string; altura:string; estado:string; revision:string; }

const INIT: Palma[] = [
  { id:1, codigo:'PAL-001', lote:'Lote A', edad:'4 años', altura:'8 m',  estado:'Saludable',      revision:'15 Mar 2026' },
  { id:2, codigo:'PAL-002', lote:'Lote A', edad:'6 años', altura:'12 m', estado:'Saludable',      revision:'15 Mar 2026' },
  { id:3, codigo:'PAL-003', lote:'Lote B', edad:'2 años', altura:'4 m',  estado:'En observación', revision:'10 Mar 2026' },
  { id:4, codigo:'PAL-004', lote:'Lote C', edad:'8 años', altura:'15 m', estado:'Saludable',      revision:'20 Mar 2026' },
];

export default function Palmas() {
  const [palmas, setPalmas] = useState<Palma[]>(INIT);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ codigo:'', lote:'Lote A', edad:'', altura:'', estado:'Saludable' });

  const save = () => {
    if (!form.codigo.trim()) return;
    const hoy = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
    setPalmas(p => [...p, { id: p.length + 1, revision: hoy, ...form }]);
    setModal(false);
    setForm({ codigo:'', lote:'Lote A', edad:'', altura:'', estado:'Saludable' });
  };

  return (
    <>
      <p className="page-title">Gestión de Palmas</p>
      <p className="page-sub">Registro individual de palmas por lote</p>

      <div className="metrics" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {[
          { lbl:'Total palmas',    val:'2,340', sub:'En todos los lotes', color:'' },
          { lbl:'Saludables',      val:'2,280', sub:'97.4%',             color:'#90cc00' },
          { lbl:'En observación',  val:'60',    sub:'2.6%',              color:'#f0c000' },
        ].map(m => (
          <div className="metric-card" key={m.lbl}>
            <div className="metric-label">{m.lbl}</div>
            <div className="metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span>Registro de palmas</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Registrar palma</button>
        </div>
        <table>
          <thead><tr><th>Código</th><th>Lote</th><th>Edad</th><th>Altura</th><th>Estado</th><th>Última revisión</th><th></th></tr></thead>
          <tbody>
            {palmas.map(p => (
              <tr key={p.id}>
                <td style={{ color:'#90cc00', fontFamily:'monospace' }}>{p.codigo}</td>
                <td>{p.lote}</td><td>{p.edad}</td><td>{p.altura}</td>
                <td><span className={`badge ${p.estado==='Saludable'?'badge-green':'badge-yellow'}`}>{p.estado}</span></td>
                <td style={{ color:'rgba(255,255,255,0.5)' }}>{p.revision}</td>
                <td><button className="act-btn" onClick={() => setPalmas(prev => prev.filter(x => x.id !== p.id))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>REGISTRAR PALMA</h3>
            <div className="form-row">
              <input placeholder="Código (Ej: PAL-005)" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
              <select value={form.lote} onChange={e => setForm({...form, lote: e.target.value})}>
                {['Lote A','Lote B','Lote C','Lote D'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-row">
              <input placeholder="Edad (Ej: 3 años)"  value={form.edad}   onChange={e => setForm({...form, edad: e.target.value})} />
              <input placeholder="Altura (Ej: 7 m)"   value={form.altura} onChange={e => setForm({...form, altura: e.target.value})} />
            </div>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              {['Saludable','En observación'].map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}