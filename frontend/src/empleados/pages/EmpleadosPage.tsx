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

export default function Empleados() {
  const [empleados, setEmpleados] = useState<EmpleadoVista[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    primernombre: '',
    primerapellido: '',
    email: '',
    contrasena: '',
    telefono: '',
    montoporhora: '',
    montoporjornal: '',
  });

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError('');
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
    } catch (err) {
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
      <p className="page-title">Gestión de Empleados</p>
      <p className="page-sub">Administra el personal del sistema</p>

      {error && (
        <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo empleado</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          Cargando empleados...
        </div>
      ) : empleados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          No hay empleados registrados
        </div>
      ) : (
        <div className="emp-grid">
          {empleados.map(e => (
            <div className="emp-card" key={e.id}>
              <div className="emp-avatar">{e.nombre[0]}</div>
              <div className="emp-name" style={{ color: 'black' }}>{e.nombre}</div>
              <div className="emp-role" style={{ color: 'black' }}>{e.email}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>📞 {e.telefono}</div>
              <span className="badge badge-green" style={{ marginTop: 6 }}>Activo</span>
              <div className="emp-tasks" style={{ color: 'black', marginTop: 6 }}>
                ${e.montoporhora.toLocaleString()}/hora
              </div>
              <div className="emp-lote" style={{ color: 'black' }}>
                ${e.montoporjornal.toLocaleString()}/jornal
              </div>
              <button className="emp-delete" onClick={() => eliminar(e.id)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVO EMPLEADO</h3>

            <div className="form-row">
              <input
                placeholder="Primer nombre *"
                value={form.primernombre}
                onChange={e => setForm({ ...form, primernombre: e.target.value })}
                style={{ color: 'black' }}
              />
              <input
                placeholder="Primer apellido *"
                value={form.primerapellido}
                onChange={e => setForm({ ...form, primerapellido: e.target.value })}
                style={{ color: 'black' }}
              />
            </div>

            <input
              placeholder="Email *"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ color: 'black' }}
            />

            <input
              placeholder="Contraseña *"
              type="password"
              value={form.contrasena}
              onChange={e => setForm({ ...form, contrasena: e.target.value })}
              style={{ color: 'black' }}
            />

            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              style={{ color: 'black' }}
            />

            <div className="form-row">
              <input
                placeholder="Monto por hora"
                type="number"
                value={form.montoporhora}
                onChange={e => setForm({ ...form, montoporhora: e.target.value })}
                style={{ color: 'black' }}
              />
              <input
                placeholder="Monto por jornal"
                type="number"
                value={form.montoporjornal}
                onChange={e => setForm({ ...form, montoporjornal: e.target.value })}
                style={{ color: 'black' }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn-save" onClick={guardar} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}