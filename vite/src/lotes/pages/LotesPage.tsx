import { useState } from 'react';
import ApisSatelital from '../pages/ApisSatelital';

interface Lote { id:number; nombre:string; area:string; region:string; cultivo:string; estado:string; }

const INIT: Lote[] = [
  { id:1, nombre:'Lote A', area:'45 ha', region:'Norte', cultivo:'Palma de aceite', estado:'Activo'      },
  { id:2, nombre:'Lote B', area:'32 ha', region:'Sur',   cultivo:'Maíz',            estado:'Activo'      },
  { id:3, nombre:'Lote C', area:'28 ha', region:'Este',  cultivo:'Yuca',            estado:'En descanso' },
  { id:4, nombre:'Lote D', area:'51 ha', region:'Oeste', cultivo:'Sin asignar',     estado:'Disponible'  },
];

const estColor: Record<string,string> = { Activo:'badge-green', Disponible:'badge-blue', 'En descanso':'badge-yellow' };

export default function Lotes() {
  const [lotes, setLotes]     = useState<Lote[]>(INIT);
  const [modal, setModal]     = useState(false);
  const [vistasat, setVistaSat] = useState(false);
  const [form, setForm]       = useState({ nombre:'', area:'', region:'', cultivo:'', estado:'Activo' });

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

      {/* BOTONES DE VISTA */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setVistaSat(false)}
          style={{
            padding: '8px 20px',
            borderRadius: 20,
            border: !vistasat ? 'none' : '1.5px solid rgba(100, 70, 40, 0.18)',
            background: !vistasat ? 'var(--g3)' : 'none',
            color: !vistasat ? '#fff' : 'var(--text-muted)',
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 700,
            boxShadow: !vistasat ? '0 2px 8px rgba(46, 109, 164, 0.25)' : 'none',
          }}
        >
          Lista de lotes
        </button>
        <button
          onClick={() => setVistaSat(true)}
          style={{
            padding: '8px 20px',
            borderRadius: 20,
            border: vistasat ? 'none' : '1.5px solid rgba(100, 70, 40, 0.18)',
            background: vistasat ? 'var(--g3)' : 'none',
            color: vistasat ? '#fff' : 'var(--text-muted)',
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 700,
            boxShadow: vistasat ? '0 2px 8px rgba(46, 109, 164, 0.25)' : 'none',
          }}
        >
          Vista satelital
        </button>
      </div>

      {/* VISTA SATELITAL */}
      {vistasat ? (
        <div style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(106,170,0,0.2)',
          height: '75vh',
        }}>
          <ApisSatelital />
        </div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-header">
              <span>Lotes registrados</span>
              <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo lote</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Lote</th><th>Área</th><th>Región</th><th>Cultivo actual</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {lotes.map(l => (
                  <tr key={l.id}>
                    <td style={{ color: 'black' }}>{l.id}</td>
                    <td style={{ color: 'black' }}>{l.nombre}</td>
                    <td style={{ color: 'black' }}>{l.area}</td>
                    <td style={{ color: 'black' }}>{l.region}</td>
                    <td style={{ color: 'black' }}>{l.cultivo}</td>
                    <td>
                      <span className={`badge ${estColor[l.estado] ?? 'badge-blue'}`}>{l.estado}</span>
                    </td>
                    <td>
                      <button className="act-btn" onClick={() => setLotes(p => p.filter(x => x.id !== l.id))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {modal && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
              <div className="modal-box">
                <h3>NUEVO LOTE</h3>
                <input placeholder="Nombre (Ej: Lote E)" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={{ color: 'black' }} />
                <div className="form-row">
                  <input placeholder="Área (Ej: 30 ha)"  value={form.area}   onChange={e => setForm({...form, area: e.target.value})} style={{ color: 'black' }} />
                  <input placeholder="Región"             value={form.region} onChange={e => setForm({...form, region: e.target.value})} style={{ color: 'black' }} />
                </div>
                <input placeholder="Cultivo actual (o 'Sin asignar')" value={form.cultivo} onChange={e => setForm({...form, cultivo: e.target.value})} style={{ color: 'black' }} />
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} style={{ color: 'black' }}>
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
      )}
    </>
  );
}