import { useState } from 'react';

interface Cultivo { id:number; nombre:string; area:string; lote:string; estado:string; cosecha:string; }

const INIT: Cultivo[] = [
  { id:1, nombre:'Palma de aceite', area:'45 ha', lote:'Lote A', estado:'Activo',   cosecha:'Jun 2026' },
  { id:2, nombre:'Maíz',           area:'12 ha', lote:'Lote B', estado:'Pendiente', cosecha:'Ago 2026' },
  { id:3, nombre:'Yuca',           area:'8 ha',  lote:'Lote C', estado:'Activo',    cosecha:'Sep 2026' },
];

export default function Cultivos() {
  const [cultivos, setCultivos] = useState<Cultivo[]>(INIT);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ nombre:'', area:'', lote:'Lote A', estado:'Activo', cosecha:'' });

  const save = () => {
    if (!form.nombre.trim()) return;
    setCultivos(p => [...p, { id: p.length + 1, ...form }]);
    setModal(false);
    setForm({ nombre:'', area:'', lote:'Lote A', estado:'Activo', cosecha:'' });
  };

  return (
    <>
      <p className="page-title">Gestión de Cultivos</p>
      <p className="page-sub">Registro y seguimiento de todos los cultivos</p>

      <div className="table-card">
        <div className="table-header">
          <span>Cultivos registrados</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo cultivo</button>
        </div>
        <table>
          <thead><tr><th>#</th><th>Cultivo</th><th>Área</th><th>Lote</th><th>Estado</th><th>Cosecha est.</th><th></th></tr></thead>
          <tbody>
            {cultivos.map(c => (
              <tr key={c.id}>
                <td style={{ color: 'black' }}>{c.id}</td>
                <td style={{ color: 'black' }}>{c.nombre}</td><td style={{ color: 'black' }}>{c.area}</td><td style={{ color: 'black' }}>{c.lote}</td>
                <td><span className={`badge ${c.estado==='Activo'?'badge-green':'badge-yellow'}`}>{c.estado}</span></td>
                <td style={{ color: 'black' }}>{c.cosecha}</td>
                <td><button className="act-btn" onClick={() => setCultivos(p => p.filter(x => x.id !== c.id))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVO CULTIVO</h3>
            <input placeholder="Nombre del cultivo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={{ color: 'black' }} />
            <div className="form-row">
              <input placeholder="Área (Ej: 20 ha)" value={form.area} onChange={e => setForm({...form, area: e.target.value})} style={{ color: 'black' }} />
              <select value={form.lote} onChange={e => setForm({...form, lote: e.target.value})} style={{ color: 'black' }}>
                {['Lote A','Lote B','Lote C','Lote D'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <input placeholder="Cosecha estimada (Ej: Jun 2026)" value={form.cosecha} onChange={e => setForm({...form, cosecha: e.target.value})} style={{ color: 'black' }} />
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} style={{ color: 'black' }}>
              {['Activo','Pendiente'].map(s => <option key={s}>{s}</option>)}
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