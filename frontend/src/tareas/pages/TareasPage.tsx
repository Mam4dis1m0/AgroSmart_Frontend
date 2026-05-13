import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

interface EmpleadoAsignado {
  idusuario: number;
  idusuario2?: {
    primernombre: string;
    primerapellido: string;
  };
}

interface AsignacionTarea {
  idasigtarea: number;
  estado: string;
  idempleado: EmpleadoAsignado;
}

interface TareaBackend {
  idtarea: number;
  tipoactividad: string;
  fechaprogramada: string;
  estado: string;
  costototal: number;
  esrecurrente: string;
  asignacionTareas: AsignacionTarea[];
  idadmincreador?: { idusuario: number };
  idcultivo?: { idcultivo: number; nombre?: string };
}

interface EmpleadoLista {
  idusuario: number;
  nombre: string;
}

const priColor: Record<string, string> = {
  Alta: 'badge-red', Media: 'badge-yellow', Baja: 'badge-blue',
};
const estColor: Record<string, string> = {
  Activo: 'badge-green', Pendiente: 'badge-yellow',
  Completado: 'badge-blue', Asignado: 'badge-green',
  'En progreso': 'badge-yellow',
};

function nombreEmpleado(t: TareaBackend): string {
  if (!t.asignacionTareas || t.asignacionTareas.length === 0) return '—';
  const a = t.asignacionTareas[0];
  const u = a.idempleado?.idusuario2;
  if (u) return `${u.primernombre} ${u.primerapellido}`;
  return `Emp. #${a.idempleado?.idusuario}`;
}

export default function Tareas() {
  const [tareas, setTareas]       = useState<TareaBackend[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoLista[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);

  // admin logueado — viene de localStorage igual que en authService
  const [adminId, setAdminId]     = useState<number | null>(null);

  const [form, setForm] = useState({
    tipoactividad: '',
    fechaprogramada: '',
    estado: 'Pendiente',
    esrecurrente: 'No',
    costototal: '',
    idempleado: '',        // para asignar al crear
  });

  // ── Cargar admin del localStorage ───────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) {
        const u = JSON.parse(raw);
        setAdminId(u.id ?? null);
      }
    } catch { /* nada */ }
  }, []);

  // ── Cargar tareas y empleados ────────────────────────────────────────────
  const cargarTareas = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/api/v1/tareas`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTareas(data);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const res = await fetch(`${API}/api/v1/empleados`);
      if (!res.ok) return;
      const data = await res.json();
      setEmpleados(data.map((e: any) => ({
        idusuario: e.idusuario,
        nombre: `${e.idusuario2.primernombre} ${e.idusuario2.primerapellido}`,
      })));
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    cargarTareas();
    cargarEmpleados();
  }, []);

  // ── Guardar tarea nueva ─────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.tipoactividad.trim()) return;
    try {
      setSaving(true);

      // 1. Crear la tarea
      const body: any = {
        tipoactividad:   form.tipoactividad,
        fechaprogramada: form.fechaprogramada || undefined,
        estado:          form.estado,
        esrecurrente:    form.esrecurrente,
        costototal:      form.costototal ? Number(form.costototal) : undefined,
        idadmincreador:  adminId ?? undefined,
      };

      const res = await fetch(`${API}/api/v1/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al crear tarea');
      const nueva: TareaBackend = await res.json();

      // 2. Asignar empleado si se seleccionó uno
      if (form.idempleado && adminId) {
        await fetch(`${API}/api/v1/tareas/${nueva.idtarea}/asignar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempleado:       Number(form.idempleado),
            idadminasignador: adminId,
            estado:           'Asignado',
          }),
        });
      }

      setModal(false);
      setForm({ tipoactividad: '', fechaprogramada: '', estado: 'Pendiente', esrecurrente: 'No', costototal: '', idempleado: '' });
      await cargarTareas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar tarea ───────────────────────────────────────────────────────
  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await fetch(`${API}/api/v1/tareas/${id}`, { method: 'DELETE' });
      await cargarTareas();
    } catch {
      setError('Error al eliminar');
    }
  };

  return (
    <>
      <p className="page-title">Gestión de Tareas</p>
      <p className="page-sub">Administra y asigna tareas a los empleados</p>

      {error && (
        <div style={{
          background: 'var(--color-background-danger)',
          color: 'var(--color-text-danger)',
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <span>Todas las tareas</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nueva tarea</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
            Cargando tareas...
          </div>
        ) : tareas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
            No hay tareas registradas
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tarea</th>
                <th>Fecha</th>
                <th>Empleado</th>
                <th>Costo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tareas.map(t => (
                <tr key={t.idtarea}>
                  <td style={{ color: 'black' }}>{t.idtarea}</td>
                  <td style={{ color: 'black' }}>{t.tipoactividad ?? '—'}</td>
                  <td style={{ color: 'black' }}>{t.fechaprogramada ? t.fechaprogramada.split('T')[0] : '—'}</td>
                  <td style={{ color: 'black' }}>{nombreEmpleado(t)}</td>
                  <td style={{ color: 'black' }}>
                    {t.costototal != null ? `$${Number(t.costototal).toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${estColor[t.estado] ?? 'badge-yellow'}`}>
                      {t.estado ?? '—'}
                    </span>
                  </td>
                  <td>
                    <button className="act-btn" onClick={() => eliminar(t.idtarea)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVA TAREA</h3>

            <input
              placeholder="Tipo de actividad *"
              value={form.tipoactividad}
              onChange={e => setForm({ ...form, tipoactividad: e.target.value })}
              style={{ color: 'black' }}
            />

            <div className="form-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666' }}>Fecha programada</label>
                <input
                  type="date"
                  value={form.fechaprogramada}
                  onChange={e => setForm({ ...form, fechaprogramada: e.target.value })}
                  style={{ color: 'black' }}
                />
              </div>
              <select
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
                style={{ color: 'black' }}
              >
                {['Pendiente', 'En progreso', 'Completado'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <input
                placeholder="Costo total"
                type="number"
                value={form.costototal}
                onChange={e => setForm({ ...form, costototal: e.target.value })}
                style={{ color: 'black' }}
              />
              <select
                value={form.esrecurrente}
                onChange={e => setForm({ ...form, esrecurrente: e.target.value })}
                style={{ color: 'black' }}
              >
                <option value="No">No recurrente</option>
                <option value="Si">Recurrente</option>
              </select>
            </div>

            <select
              value={form.idempleado}
              onChange={e => setForm({ ...form, idempleado: e.target.value })}
              style={{ color: 'black' }}
            >
              <option value="">— Asignar empleado (opcional) —</option>
              {empleados.map(emp => (
                <option key={emp.idusuario} value={emp.idusuario}>
                  {emp.nombre}
                </option>
              ))}
            </select>

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