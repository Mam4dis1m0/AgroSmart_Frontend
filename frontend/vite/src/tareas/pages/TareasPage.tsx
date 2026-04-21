import { useState } from 'react';

interface Tarea {
  id: number; nombre: string; lote: string;
  empleado: string; prioridad: string; estado: string;
}

const INIT: Tarea[] = [
  { id:1, nombre:'Fumigación zona norte', lote:'Lote A', empleado:'Carlos R.', prioridad:'Alta',  estado:'Pendiente'  },
  { id:2, nombre:'Riego sistema 3',       lote:'Lote C', empleado:'María L.',  prioridad:'Media', estado:'Activo'     },
  { id:3, nombre:'Poda de palmas',        lote:'Lote B', empleado:'Pedro M.',  prioridad:'Media', estado:'Activo'     },
  { id:4, nombre:'Análisis de suelo',     lote:'Lote D', empleado:'Ana G.',    prioridad:'Baja',  estado:'Completado' },
];

const priColor: Record<string,string> = { Alta:'badge-red', Media:'badge-yellow', Baja:'badge-blue' };
const estColor: Record<string,string> = { Activo:'badge-green', Pendiente:'badge-yellow', Completado:'badge-blue' };

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>(INIT);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ nombre:'', lote:'Lote A', empleado:'', prioridad:'Alta', estado:'Pendiente' });

  const save = () => {
    if (!form.nombre.trim()) return;
    setTareas(prev => [...prev, { id: prev.length + 1, ...form }]);
    setModal(false);
    setForm({ nombre:'', lote:'Lote A', empleado:'', prioridad:'Alta', estado:'Pendiente' });
  };

  return (
    <>
      <p className="page-title">Gestión de Tareas</p>
      <p className="page-sub">Administra y asigna tareas a los empleados</p>

      <div className="table-card">
        <div className="table-header">
          <span>Todas las tareas</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nueva tarea</button>
        </div>
        <table>
          <thead><tr><th>#</th><th>Tarea</th><th>Lote</th><th>Empleado</th><th>Prioridad</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {tareas.map(t => (
              <tr key={t.id}>
                <td style={{ color:'rgba(255,255,255,0.4)' }}>{t.id}</td>
                <td>{t.nombre}</td><td>{t.lote}</td><td>{t.empleado}</td>
                <td><span className={`badge ${priColor[t.prioridad]}`}>{t.prioridad}</span></td>
                <td><span className={`badge ${estColor[t.estado]}`}>{t.estado}</span></td>
                <td><button className="act-btn" onClick={() => setTareas(p => p.filter(x => x.id !== t.id))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVA TAREA</h3>
            <input placeholder="Nombre de la tarea" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <div className="form-row">
              <select value={form.lote} onChange={e => setForm({...form, lote: e.target.value})}>
                {['Lote A','Lote B','Lote C','Lote D'].map(l => <option key={l}>{l}</option>)}
              </select>
              <select value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}>
                {['Alta','Media','Baja'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <input placeholder="Nombre del empleado" value={form.empleado} onChange={e => setForm({...form, empleado: e.target.value})} />
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              {['Pendiente','Activo','Completado'].map(s => <option key={s}>{s}</option>)}
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