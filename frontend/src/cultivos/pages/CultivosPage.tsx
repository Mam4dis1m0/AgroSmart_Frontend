import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

interface CultivoBackend {
  idcultivo: number;
  nombrelote: string | null;
  fechasiembra: string | null;
  fechacosechaestimada: string | null;
  alertan8n: string | null;
 idlote: { idlote: number; nombre: string | null; areahectareas?: number | null } | null;
  idadminsupervisor: { idusuario: number } | null;
}

interface LoteBackend {
  idlote: number;
  nombre: string;
}

export default function Cultivos() {
  const [cultivos, setCultivos] = useState<CultivoBackend[]>([]);
  const [lotes, setLotes]       = useState<LoteBackend[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [adminId, setAdminId]   = useState<number | null>(null);

  const [form, setForm] = useState({
    nombrelote: '',
    fechasiembra: '',
    fechacosechaestimada: '',
    idlote: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) setAdminId(JSON.parse(raw).id ?? null);
    } catch { /* nada */ }
  }, []);

  const cargarCultivos = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/cultivos`);
      if (!res.ok) throw new Error();
      setCultivos(await res.json());
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const cargarLotes = async () => {
    try {
      const res = await fetch(`${API}/lotes`);
      if (!res.ok) return;
      setLotes(await res.json());
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    cargarCultivos();
    cargarLotes();
  }, []);

  const guardar = async () => {
    if (!form.nombrelote.trim()) return;
    try {
      setSaving(true);
      const body: any = {
        nombrelote:           form.nombrelote,
        fechasiembra:         form.fechasiembra         || undefined,
        fechacosechaestimada: form.fechacosechaestimada || undefined,
        idlote:               form.idlote ? Number(form.idlote) : undefined,
        idadminsupervisor:    adminId ?? undefined,
      };
      const res = await fetch(`${API}/cultivos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al crear cultivo');
      setModal(false);
      setForm({ nombrelote: '', fechasiembra: '', fechacosechaestimada: '', idlote: '' });
      await cargarCultivos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este cultivo?')) return;
    try {
      await fetch(`${API}/cultivos/${id}`, { method: 'DELETE' });
      await cargarCultivos();
    } catch {
      setError('Error al eliminar');
    }
  };

  const formatFecha = (f: string | null) =>
    f ? f.split('T')[0] : '—';

  const estadoBadge = (c: CultivoBackend) => {
    if (!c.fechacosechaestimada) return { label: 'Sin fecha', cls: 'badge-yellow' };
    const hoy = new Date();
    const cosecha = new Date(c.fechacosechaestimada);
    return cosecha > hoy
      ? { label: 'Activo',    cls: 'badge-green'  }
      : { label: 'Cosechado', cls: 'badge-blue'   };
  };

  return (
    <>
      <p className="page-title">Gestión de Cultivos</p>
      <p className="page-sub">Registro y seguimiento de todos los cultivos</p>

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
          <span>Cultivos registrados</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo cultivo</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
            Cargando cultivos...
          </div>
        ) : cultivos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
            No hay cultivos registrados
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cultivo</th>
                <th>Siembra</th>
                <th>Lote</th>
                <th>Estado</th>
                <th>Cosecha est.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cultivos.map(c => {
                const badge = estadoBadge(c);
                return (
                  <tr key={c.idcultivo}>
                    <td style={{ color: 'black' }}>{c.idcultivo}</td>
                    <td style={{ color: 'black' }}>{c.nombrelote ?? '—'}</td>
                    <td style={{ color: 'black' }}>{formatFecha(c.fechasiembra)}</td>
                    <td style={{ color: 'black' }}>
                     {c.idlote ? (c.idlote.nombre ?? `Lote #${c.idlote.idlote}`) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td style={{ color: 'black' }}>{formatFecha(c.fechacosechaestimada)}</td>
                    <td>
                      <button className="act-btn" onClick={() => eliminar(c.idcultivo)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVO CULTIVO</h3>

            <input
              placeholder="Nombre del cultivo *"
              value={form.nombrelote}
              onChange={e => setForm({ ...form, nombrelote: e.target.value })}
              style={{ color: 'black' }}
            />

            <div className="form-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666' }}>Fecha de siembra</label>
                <input
                  type="date"
                  value={form.fechasiembra}
                  onChange={e => setForm({ ...form, fechasiembra: e.target.value })}
                  style={{ color: 'black' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666' }}>Cosecha estimada</label>
                <input
                  type="date"
                  value={form.fechacosechaestimada}
                  onChange={e => setForm({ ...form, fechacosechaestimada: e.target.value })}
                  style={{ color: 'black' }}
                />
              </div>
            </div>

            {lotes.length > 0 && (
              <select
                value={form.idlote}
                onChange={e => setForm({ ...form, idlote: e.target.value })}
                style={{ color: 'black' }}
              >
                <option value="">— Seleccionar lote (opcional) —</option>
                {lotes.map(l => (
                  <option key={l.idlote} value={l.idlote}>
                    {l.nombre ?? `Lote #${l.idlote}`}
                  </option>
                ))}
              </select>
            )}

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