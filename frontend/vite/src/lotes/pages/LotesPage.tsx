import { useState } from 'react';

interface Lote { id:number; nombre:string; area:string; region:string; cultivo:string; estado:string; }

const INIT: Lote[] = [
  { id:1, nombre:'Lote A', area:'45 ha', region:'Norte', cultivo:'Palma de aceite', estado:'Activo'      },
  { id:2, nombre:'Lote B', area:'32 ha', region:'Sur',   cultivo:'Maíz',            estado:'Activo'      },
  { id:3, nombre:'Lote C', area:'28 ha', region:'Este',  cultivo:'Yuca',            estado:'En descanso' },
  { id:4, nombre:'Lote D', area:'51 ha', region:'Oeste', cultivo:'Sin asignar',     estado:'Disponible'  },
];

const estColor: Record<string,string> = { Activo:'badge-green', Disponible:'badge-blue', 'En descanso':'badge-yellow' };

export default function Lotes() {
  const [lotes, setLotes] = useState<Lote[]>(INIT);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ nombre:'', area:'', region:'', cultivo:'', estado:'Activo' });

  const save = () => {
    if (!form.nombre.trim()) return;
    setLotes(p => [...p, { id: p.length + 1, ...form }]);
    setModal(false);
    setForm({ nombre:'', area:'', region:'', cultivo:'', estado:'Activo' });
  };

  return (
    <>
      <p className="page-title">Gestión de Lotes</p>
      <p className="page-sub">Control de todos los lotes de la finca</p>

      <div className="table-card">
        <div className="table-header">
          <span>Lotes registrados</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo lote</button>
        </div>
        <table>
          <thead><tr><th>#</th><th>Lote</th><th>Área</th><th>Región</th><th>Cultivo actual</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {lotes.map(l => (
              <tr key={l.id}>
                <td style={{ color:'rgba(255,255,255,0.4)' }}>{l.id}</td>
                <td>{l.nombre}</td><td>{l.area}</td><td>{l.region}</td><td>{l.cultivo}</td>
                <td><span className={`badge ${estColor[l.estado] ?? 'badge-blue'}`}>{l.estado}</span></td>
                <td><button className="act-btn" onClick={() => setLotes(p => p.filter(x => x.id !== l.id))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVO LOTE</h3>
            <input placeholder="Nombre (Ej: Lote E)" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <div className="form-row">
              <input placeholder="Área (Ej: 30 ha)"  value={form.area}   onChange={e => setForm({...form, area: e.target.value})} />
              <input placeholder="Región"             value={form.region} onChange={e => setForm({...form, region: e.target.value})} />
            </div>
            <input placeholder="Cultivo actual (o 'Sin asignar')" value={form.cultivo} onChange={e => setForm({...form, cultivo: e.target.value})} />
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              {['Activo','Disponible','En descanso'].map(s => <option key={s}>{s}</option>)}
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