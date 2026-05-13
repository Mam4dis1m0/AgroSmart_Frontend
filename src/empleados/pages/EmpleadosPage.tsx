import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

interface EmpleadoBackend {
  idusuario: number;
  montoporhora: number;
  montoporjornal: number;
  idusuario2: {
    idusuario: number;
    primernombre: string;
    segundonombre: string | null;
    primerapellido: string;
    segundoapellido: string | null;
    email: string;
    telefono: string | null;
  };
}

interface EmpleadoVista {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  montoporhora: number;
  montoporjornal: number;
}

const css = `
  .ep-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .ep-sub   { font-size: 14px; color: #64748b; margin-bottom: 24px; }

  .ep-error {
    background: #fef2f2; color: #ef4444;
    padding: 10px 16px; border-radius: 8px;
    margin-bottom: 16px; font-size: 14px; font-weight: 500;
  }

  .ep-add-btn {
    background: #16a34a; color: #fff; border: none;
    padding: 9px 18px; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s;
  }
  .ep-add-btn:hover { background: #15803d; }

  .ep-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .ep-card {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 14px; padding: 20px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    box-shadow: 0 1px 4px rgba(0,0,0,.06); transition: box-shadow .2s;
  }
  .ep-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }

  .ep-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #16a34a, #059669);
    color: #fff; font-size: 22px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
  }

  .ep-name  { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .ep-email { font-size: 12px; color: #64748b; margin-bottom: 2px; word-break: break-all; }
  .ep-tel   { font-size: 13px; color: #64748b; margin-top: 4px; }

  .ep-badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 100px;
    font-size: 12px; font-weight: 600; margin-top: 6px;
    background: #dcfce7; color: #15803d;
  }

  .ep-hora   { font-size: 13px; font-weight: 600; color: #16a34a; margin-top: 6px; }
  .ep-jornal { font-size: 12px; color: #64748b; margin-top: 2px; }

  .ep-del {
    margin-top: 12px; background: #fef2f2; color: #ef4444;
    border: 1.5px solid #fecaca; border-radius: 8px;
    padding: 5px 14px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .ep-del:hover { background: #fee2e2; }

  .ep-overlay {
    position: fixed; inset: 0;
    background: rgba(15,23,42,.5); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 300; padding: 1rem;
  }
  .ep-modal {
    background: #fff; border-radius: 18px; padding: 28px;
    width: 100%; max-width: 460px;
    display: flex; flex-direction: column; gap: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.15);
    animation: epIn .2s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes epIn {
    from { opacity: 0; transform: scale(.93); }
    to   { opacity: 1; transform: none; }
  }
  .ep-modal h3 { font-size: 16px; font-weight: 700; color: #0f172a; }

  .ep-modal input {
    width: 100%; padding: 9px 12px;
    border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-size: 14px; color: #0f172a; outline: none;
    transition: border-color .2s; font-family: inherit;
  }
  .ep-modal input:focus { border-color: #22c55e; }

  .ep-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .ep-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

  .ep-cancel {
    padding: 9px 18px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    border: 1.5px solid #e2e8f0; color: #475569;
    background: transparent; cursor: pointer; transition: background .15s;
    font-family: inherit;
  }
  .ep-cancel:hover { background: #f1f5f9; }

  .ep-save {
    padding: 9px 18px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    background: #16a34a; color: #fff; border: none;
    cursor: pointer; transition: background .15s; font-family: inherit;
  }
  .ep-save:hover:not(:disabled) { background: #15803d; }
  .ep-save:disabled { opacity: .6; cursor: not-allowed; }
`;

/* ── Avatar: foto de localStorage o inicial ── */
function AvatarEmpleado({ email, nombre }: { email: string; nombre: string }) {
  const foto = localStorage.getItem(`agrosmart_avatar_${email}`);
  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          objectFit: 'cover', marginBottom: 12, flexShrink: 0,
        }}
      />
    );
  }
  return <div className="ep-avatar">{nombre[0]}</div>;
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState<EmpleadoVista[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    primernombre: '', primerapellido: '', email: '',
    contrasena: '', telefono: '', montoporhora: '', montoporjornal: '',
  });

  const cargarEmpleados = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${API}/api/v1/empleados`);
      if (!res.ok) throw new Error('Error al cargar empleados');
      const data: EmpleadoBackend[] = await res.json();
      setEmpleados(data.map(e => ({
        id: e.idusuario,
        nombre: `${e.idusuario2.primernombre}${e.idusuario2.segundonombre ? ' ' + e.idusuario2.segundonombre : ''} ${e.idusuario2.primerapellido}${e.idusuario2.segundoapellido ? ' ' + e.idusuario2.segundoapellido : ''}`.trim(),
        email: e.idusuario2.email,
        telefono: e.idusuario2.telefono ?? '—',
        montoporhora: e.montoporhora,
        montoporjornal: e.montoporjornal,
      })));
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEmpleados(); }, []);

  const guardar = async () => {
    if (!form.primernombre.trim() || !form.primerapellido.trim() || !form.email.trim() || !form.contrasena.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/usuarios/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primernombre: form.primernombre,
          primerapellido: form.primerapellido,
          email: form.email,
          contrasena: form.contrasena,
          telefono: form.telefono,
          role: 'empleado',
          montoporhora: Number(form.montoporhora) || 0,
          montoporjornal: Number(form.montoporjornal) || 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Error al registrar');
      }
      setModal(false);
      setForm({ primernombre: '', primerapellido: '', email: '', contrasena: '', telefono: '', montoporhora: '', montoporjornal: '' });
      await cargarEmpleados();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    try {
      await fetch(`${API}/usuarios/${id}`, { method: 'DELETE' });
      await cargarEmpleados();
    } catch {
      setError('Error al eliminar');
    }
  };

  return (
    <>
      <style>{css}</style>

      <p className="ep-title">Gestión de Empleados</p>
      <p className="ep-sub">Administra el personal del sistema</p>

      {error && <div className="ep-error">{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="ep-add-btn" onClick={() => setModal(true)}>+ Nuevo empleado</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando empleados...</div>
      ) : empleados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No hay empleados registrados</div>
      ) : (
        <div className="ep-grid">
          {empleados.map(e => (
            <div className="ep-card" key={e.id}>

              {/* ← único cambio visible */}
              <AvatarEmpleado email={e.email} nombre={e.nombre} />

              <div className="ep-name">{e.nombre}</div>
              <div className="ep-email">{e.email}</div>
              <div className="ep-tel">📞 {e.telefono}</div>
              <span className="ep-badge">Activo</span>
              <div className="ep-hora">${e.montoporhora.toLocaleString()}/hora</div>
              <div className="ep-jornal">${e.montoporjornal.toLocaleString()}/jornal</div>
              <button className="ep-del" onClick={() => eliminar(e.id)}>Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="ep-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ep-modal">
            <h3>NUEVO EMPLEADO</h3>

            <div className="ep-row">
              <input placeholder="Primer nombre *"    value={form.primernombre}    onChange={e => setForm({ ...form, primernombre: e.target.value })} />
              <input placeholder="Primer apellido *"  value={form.primerapellido}  onChange={e => setForm({ ...form, primerapellido: e.target.value })} />
            </div>

            <input placeholder="Email *"       type="email"    value={form.email}          onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Contraseña *"  type="password" value={form.contrasena}     onChange={e => setForm({ ...form, contrasena: e.target.value })} />
            <input placeholder="Teléfono"                      value={form.telefono}        onChange={e => setForm({ ...form, telefono: e.target.value })} />

            <div className="ep-row">
              <input placeholder="Monto por hora"   type="number" value={form.montoporhora}   onChange={e => setForm({ ...form, montoporhora: e.target.value })} />
              <input placeholder="Monto por jornal" type="number" value={form.montoporjornal} onChange={e => setForm({ ...form, montoporjornal: e.target.value })} />
            </div>

            <div className="ep-actions">
              <button className="ep-cancel" onClick={() => setModal(false)} disabled={saving}>Cancelar</button>
              <button className="ep-save"   onClick={guardar}               disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}