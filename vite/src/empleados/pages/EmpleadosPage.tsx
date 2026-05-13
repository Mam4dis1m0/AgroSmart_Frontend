import { useState } from 'react';

interface Empleado { id:number; nombre:string; rol:string; lote:string; tareas:number; estado:string; }

const INIT: Empleado[] = [
  { id:1, nombre:'Carlos Rodríguez', rol:'Campo',   lote:'Lote A', tareas:3, estado:'Activo'   },
  { id:2, nombre:'María López',      rol:'Riego',   lote:'Lote C', tareas:2, estado:'Activo'   },
  { id:3, nombre:'Pedro Martínez',   rol:'Poda',    lote:'Lote B', tareas:4, estado:'Activo'   },
  { id:4, nombre:'Ana García',       rol:'Análisis',lote:'Lote D', tareas:1, estado:'Inactivo' },
];

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>(INIT);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ nombre:'', rol:'', lote:'Lote A', estado:'Activo' });

  const save = () => {
    if (!form.nombre.trim()) return;
    setEmpleados(p => [...p, { id: p.length + 1, tareas: 0, ...form }]);
    setModal(false);
    setForm({ nombre:'', rol:'', lote:'Lote A', estado:'Activo' });
  };

  return (
    <>
      <p className="page-title">Gestión de Empleados</p>
      <p className="page-sub">Administra el personal del sistema</p>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo empleado</button>
      </div>

      <div className="emp-grid">
        {empleados.map(e => (
          <div className="emp-card" key={e.id}>
            <div className="emp-avatar">{e.nombre[0]}</div>
            <div className="emp-name" style={{ color: 'black' }}>{e.nombre}</div>
            <div className="emp-role" style={{ color: 'black' }}>{e.rol}</div>
            <span className={`badge ${e.estado==='Activo'?'badge-green':'badge-red'}`} style={{ marginTop:4 }}>
              {e.estado}
            </span>
            <div className="emp-tasks" style={{ color: 'black' }}>{e.tareas} tareas asignadas</div>
            <div className="emp-lote" style={{ color: 'black' }}>{e.lote}</div>
            <button className="emp-delete" onClick={() => setEmpleados(p => p.filter(x => x.id !== e.id))}>
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVO EMPLEADO</h3>
            <input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={{ color: 'black' }} />
            <div className="form-row">
              <input placeholder="Rol (Ej: Campo, Riego)" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} style={{ color: 'black' }} />
              <select value={form.lote} onChange={e => setForm({...form, lote: e.target.value})} style={{ color: 'black' }}>
                {['Lote A','Lote B','Lote C','Lote D'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} style={{ color: 'black' }}>
              {['Activo','Inactivo'].map(s => <option key={s}>{s}</option>)}
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