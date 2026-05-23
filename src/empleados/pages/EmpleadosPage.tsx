import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000';
const CACHE_KEY   = 'agrosmart_empleados_cache';
const PENDING_KEY = 'agrosmart_empleados_pending';

interface EmpleadoBackend {
  idusuario: number;
  montoporhora: number;
  montoporjornal: number;
  _offline?: boolean;
  idusuario2?: {
    idusuario: number;
    primernombre: string;
    segundonombre: string | null;
    primerapellido: string;
    segundoapellido: string | null;
    email: string;
    telefono: string | null;
  };
  primernombre?: string;
  segundonombre?: string | null;
  primerapellido?: string;
  segundoapellido?: string | null;
  email?: string;
  telefono?: string | null;
}

interface EmpleadoVista {
  id: string;          // ← ahora siempre string: "123" o "offline_..."
  nombre: string;
  email: string;
  telefono: string;
  montoporhora: number;
  montoporjornal: number;
  offline: boolean;
}

interface PendingOp {
  id: string;
  data: any;
  timestamp: string;
}

// ── Detecta si un id es temporal offline ────────────────────────────────────
function esTemporal(id: string | number): boolean {
  const s = String(id);
  return s.startsWith('offline_') || (s.startsWith('-') && !isNaN(Number(s)));
}

// ── Normaliza la respuesta del backend a EmpleadoVista ──────────────────────
function normalizar(e: EmpleadoBackend): EmpleadoVista | null {
  try {
    if (e.idusuario2) {
      const u = e.idusuario2;
      return {
        id:             String(e.idusuario),
        nombre:         [u.primernombre, u.segundonombre, u.primerapellido, u.segundoapellido].filter(Boolean).join(' '),
        email:          u.email ?? '—',
        telefono:       u.telefono ?? '—',
        montoporhora:   Number(e.montoporhora)   ?? 0,
        montoporjornal: Number(e.montoporjornal) ?? 0,
        offline:        false,
      };
    }
    if (e.primernombre || e.email) {
      const id = String(e.idusuario);
      return {
        id,
        nombre:         [e.primernombre, e.segundonombre, e.primerapellido, e.segundoapellido].filter(Boolean).join(' ') || 'Sin nombre',
        email:          e.email    ?? '—',
        telefono:       e.telefono ?? '—',
        montoporhora:   Number(e.montoporhora)   ?? 0,
        montoporjornal: Number(e.montoporjornal) ?? 0,
        offline:        esTemporal(id),
      };
    }
    return null;
  } catch { return null; }
}

// ── Helpers localStorage ────────────────────────────────────────────────────
function getCached(): EmpleadoVista[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'); } catch { return []; }
}
function setCache(d: EmpleadoVista[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(d));
}
function getPending(): PendingOp[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]'); } catch { return []; }
}
function addPending(data: any) {
  const q = getPending();
  q.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, data, timestamp: new Date().toISOString() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(q));
}
function removePending(id: string) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(getPending().filter(p => p.id !== id)));
}

// ── Migración: limpia IDs negativos corruptos del localStorage ──────────────
// Los XY ZX / XY ZZ quedaron con ids negativos gigantes que nunca llegan a Supabase.
// Si están en el PENDING_KEY también los descartamos porque el backend ya los rechazó.
function migrarCacheViejo() {
  const cache = getCached();
  const pending = getPending();

  // IDs negativos que siguen en pending = irrecuperables (el backend ya los descartó)
  const emailsPendientesViejos = new Set(
    cache.filter(e => esTemporal(e.id)).map(e => e.email)
  );

  // Solo conservamos los que NO son temporales viejos en la caché
  // (los offline_ nuevos sí se conservan, solo los negativos numéricos se van)
  const cacheClean = cache.filter(e => {
    const s = String(e.id);
    return !s.startsWith('-'); // elimina ids negativos numéricos viejos
  });

  // En pending eliminamos los que correspondan a esos emails corruptos
  const pendingClean = pending.filter(p => !emailsPendientesViejos.has(p.data?.email));

  if (cacheClean.length !== cache.length || pendingClean.length !== pending.length) {
    console.warn(`[AgroSmart] Migración: eliminados ${cache.length - cacheClean.length} empleados temporales corruptos del localStorage`);
    setCache(cacheClean);
    localStorage.setItem(PENDING_KEY, JSON.stringify(pendingClean));
  }
}

// ── Estilos ─────────────────────────────────────────────────────────────────
const css = `
  .ep-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .ep-sub   { font-size: 14px; color: #64748b; margin-bottom: 24px; }
  .ep-banner {
    padding: 10px 16px; border-radius: 8px; margin-bottom: 16px;
    font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px;
  }
  .ep-banner.offline { background:#fefce8; color:#a16207; border:1.5px solid #fde68a; }
  .ep-banner.sync    { background:#f0fdf4; color:#15803d; border:1.5px solid #bbf7d0; }
  .ep-banner.error   { background:#fef2f2; color:#ef4444; border:1.5px solid #fecaca; }
  .ep-add-btn {
    background:#16a34a; color:#fff; border:none; padding:9px 18px;
    border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;
  }
  .ep-add-btn:hover { background:#15803d; }
  .ep-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
  .ep-card {
    background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px;
    display:flex; flex-direction:column; align-items:center; text-align:center;
    box-shadow:0 1px 4px rgba(0,0,0,.06); transition:box-shadow .2s;
  }
  .ep-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); }
  .ep-card.pending { border:1.5px dashed #fde68a; background:#fffbeb; }
  .ep-avatar {
    width:52px; height:52px; border-radius:50%;
    background:linear-gradient(135deg,#16a34a,#059669);
    color:#fff; font-size:22px; font-weight:700;
    display:flex; align-items:center; justify-content:center; margin-bottom:12px;
  }
  .ep-name   { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:2px; }
  .ep-email  { font-size:12px; color:#64748b; margin-bottom:2px; word-break:break-all; }
  .ep-tel    { font-size:13px; color:#64748b; margin-top:4px; }
  .ep-hora   { font-size:13px; font-weight:600; color:#16a34a; margin-top:6px; }
  .ep-jornal { font-size:12px; color:#64748b; margin-top:2px; }
  .ep-badge  { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; font-size:12px; font-weight:600; margin-top:6px; background:#dcfce7; color:#15803d; }
  .ep-badge.pending { background:#fef9c3; color:#a16207; }
  .ep-del {
    margin-top:12px; background:#fef2f2; color:#ef4444;
    border:1.5px solid #fecaca; border-radius:8px;
    padding:5px 14px; font-size:12px; font-weight:600; cursor:pointer;
  }
  .ep-del:hover { background:#fee2e2; }
  .ep-overlay {
    position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center; z-index:300; padding:1rem;
  }
  .ep-modal {
    background:#fff; border-radius:18px; padding:28px; width:100%; max-width:460px;
    display:flex; flex-direction:column; gap:14px; box-shadow:0 12px 40px rgba(0,0,0,.15);
    animation:epIn .2s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes epIn { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:none} }
  .ep-modal h3 { font-size:16px; font-weight:700; color:#0f172a; margin:0; }
  .ep-modal input {
    width:100%; padding:9px 12px; border:1.5px solid #e2e8f0; border-radius:8px;
    font-size:14px; color:#0f172a; outline:none; transition:border-color .2s;
    font-family:inherit; box-sizing:border-box;
  }
  .ep-modal input:focus { border-color:#22c55e; }
  .ep-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .ep-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:4px; }
  .ep-cancel {
    padding:9px 18px; border-radius:8px; font-size:13px; font-weight:600;
    border:1.5px solid #e2e8f0; color:#475569; background:transparent;
    cursor:pointer; font-family:inherit;
  }
  .ep-cancel:hover { background:#f1f5f9; }
  .ep-save {
    padding:9px 18px; border-radius:8px; font-size:13px; font-weight:600;
    background:#16a34a; color:#fff; border:none; cursor:pointer; font-family:inherit;
  }
  .ep-save:hover:not(:disabled) { background:#15803d; }
  .ep-save:disabled { opacity:.6; cursor:not-allowed; }
`;

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ email, nombre }: { email: string; nombre: string }) {
  const foto = localStorage.getItem(`agrosmart_avatar_${email}`);
  if (foto) return <img src={foto} alt={nombre} style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', marginBottom:12 }} />;
  return <div className="ep-avatar">{(nombre[0] ?? 'E').toUpperCase()}</div>;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Empleados() {
  const [empleados, setEmpleados] = useState<EmpleadoVista[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isOnline, setIsOnline]   = useState(true);
  const [banner, setBanner]       = useState<{ type:'offline'|'sync'|'error'; msg:string } | null>(null);
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    primernombre:'', primerapellido:'', email:'',
    contrasena:'', telefono:'', montoporhora:'', montoporjornal:'',
  });

  // Migración automática al montar: limpia IDs corruptos viejos
  useEffect(() => { migrarCacheViejo(); }, []);

  const showBanner = (type: 'offline'|'sync'|'error', msg: string, ms = 0) => {
    setBanner({ type, msg });
    if (ms > 0) setTimeout(() => setBanner(null), ms);
  };

  // ── Carga empleados ────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);

    const cached = getCached();
    if (cached.length > 0) {
      setEmpleados(cached);
      setLoading(false);
    }

    try {
      const res = await fetch(`${API}/api/v1/empleados`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('no ok');
      const raw: EmpleadoBackend[] = await res.json();

      const lista = raw.map(normalizar).filter((e): e is EmpleadoVista => e !== null);

      // Emails que ya están en Supabase (id real, no temporal)
      const emailsBackend = new Set(lista.filter(e => !esTemporal(e.id)).map(e => e.email));

      // Solo conserva temporales locales cuyo email NO llegó a Supabase todavía
      const temporalesPuros = getCached().filter(
        e => esTemporal(e.id) && !emailsBackend.has(e.email)
      );

      const merged = [...lista, ...temporalesPuros];
      setEmpleados(merged);
      setCache(merged);
      setIsOnline(true);

    } catch {
      setIsOnline(false);
      const fallback = getCached();
      setEmpleados(fallback);
      if (fallback.length === 0) {
        showBanner('error', 'Sin conexión y sin datos guardados localmente');
      } else {
        const pendientes = getPending().length;
        showBanner('offline',
          `📴 Sin conexión — ${fallback.length} empleados en caché` +
          (pendientes > 0 ? ` · ${pendientes} pendientes de subir` : '')
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sincroniza cola de localStorage con el backend ────────────────────────
  const sincronizar = useCallback(async () => {
    const pending = getPending();
    if (pending.length === 0) return;

    let ok = 0;
    for (const op of pending) {
      try {
        const res = await fetch(`${API}/usuarios/register`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(op.data),
          signal:  AbortSignal.timeout(5000),
        });
        if (res.ok || res.status === 409) { removePending(op.id); ok++; }
      } catch { break; }
    }

    if (ok > 0) {
      showBanner('sync', `✅ ${ok} empleado(s) sincronizados con Supabase`, 4000);
      await new Promise(r => setTimeout(r, 1500));
      await cargar();
    }
  }, [cargar]);

  useEffect(() => {
    cargar();
    const iv = setInterval(sincronizar, 30_000);
    window.addEventListener('online', sincronizar);
    return () => { clearInterval(iv); window.removeEventListener('online', sincronizar); };
  }, [cargar, sincronizar]);

  // ── Guardar nuevo empleado ─────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.primernombre.trim() || !form.primerapellido.trim() ||
        !form.email.trim()        || !form.contrasena.trim()) return;

    const payload = {
      primernombre:   form.primernombre,
      primerapellido: form.primerapellido,
      email:          form.email,
      contrasena:     form.contrasena,
      telefono:       form.telefono,
      role:           'empleado',
      montoporhora:   Number(form.montoporhora)   || 0,
      montoporjornal: Number(form.montoporjornal) || 0,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API}/usuarios/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(5000),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Error al registrar');

      setModal(false);
      resetForm();

      // El backend indica modo offline cuando devuelve _offline:true o id temporal
      const idRespuesta = String(body.id ?? body.idusuario ?? '');
      const esOfflineBackend = body._offline === true || esTemporal(idRespuesta);

      if (esOfflineBackend) {
        const tempId = `offline_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        const tempEmp: EmpleadoVista = {
          id:             tempId,
          nombre:         `${payload.primernombre} ${payload.primerapellido}`,
          email:          payload.email,
          telefono:       payload.telefono || '—',
          montoporhora:   payload.montoporhora,
          montoporjornal: payload.montoporjornal,
          offline:        true,
        };
        const updated = [...getCached(), tempEmp];
        setCache(updated);
        setEmpleados(updated);
        addPending(payload);
        showBanner('offline', '📴 Guardado sin internet — se subirá automáticamente al reconectar', 5000);
      } else {
        await cargar();
        showBanner('sync', '✅ Empleado guardado correctamente', 3000);
      }

    } catch (err: any) {
      const sinRed = err.name === 'TimeoutError' || err.name === 'TypeError';
      if (sinRed) {
        const tempId = `offline_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        const tempEmp: EmpleadoVista = {
          id:             tempId,
          nombre:         `${form.primernombre} ${form.primerapellido}`,
          email:          form.email,
          telefono:       form.telefono || '—',
          montoporhora:   Number(form.montoporhora)   || 0,
          montoporjornal: Number(form.montoporjornal) || 0,
          offline:        true,
        };
        const updated = [...getCached(), tempEmp];
        setCache(updated);
        setEmpleados(updated);
        addPending(payload);
        setModal(false);
        resetForm();
        showBanner('offline', '📴 Sin conexión al servidor — empleado guardado localmente', 5000);
      } else {
        showBanner('error', err.message || 'Error al guardar', 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    if (esTemporal(id)) {
      // Temporal local — solo borrar de localStorage y estado
      const upd = getCached().filter(e => e.id !== id);
      setCache(upd);
      setEmpleados(upd);
      return;
    }
    try {
      await fetch(`${API}/usuarios/${id}`, { method: 'DELETE' });
      await cargar();
    } catch {
      showBanner('error', 'Error al eliminar', 3000);
    }
  };

  const resetForm = () =>
    setForm({ primernombre:'', primerapellido:'', email:'', contrasena:'', telefono:'', montoporhora:'', montoporjornal:'' });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      <p className="ep-title">Gestión de Empleados</p>
      <p className="ep-sub">Administra el personal del sistema</p>

      {banner && <div className={`ep-banner ${banner.type}`}>{banner.msg}</div>}

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button className="ep-add-btn" onClick={() => setModal(true)}>+ Nuevo empleado</button>
      </div>

      {loading && empleados.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>Cargando empleados...</div>
      ) : empleados.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>No hay empleados registrados</div>
      ) : (
        <div className="ep-grid">
          {empleados.map(e => (
            <div className={`ep-card${e.offline ? ' pending' : ''}`} key={e.id}>
              <Avatar email={e.email} nombre={e.nombre} />
              <div className="ep-name">{e.nombre}</div>
              <div className="ep-email">{e.email}</div>
              <div className="ep-tel">📞 {e.telefono}</div>
              <span className={`ep-badge${e.offline ? ' pending' : ''}`}>
                {e.offline ? '⏳ Pendiente' : 'Activo'}
              </span>
              <div className="ep-hora">${Number(e.montoporhora).toLocaleString()}/hora</div>
              <div className="ep-jornal">${Number(e.montoporjornal).toLocaleString()}/jornal</div>
              <button className="ep-del" onClick={() => eliminar(e.id)}>Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="ep-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ep-modal">
            <h3>NUEVO EMPLEADO{!isOnline ? ' (sin internet)' : ''}</h3>
            <div className="ep-row">
              <input placeholder="Primer nombre *"   value={form.primernombre}   onChange={f('primernombre')} />
              <input placeholder="Primer apellido *" value={form.primerapellido} onChange={f('primerapellido')} />
            </div>
            <input placeholder="Email *"      type="email"    value={form.email}      onChange={f('email')} />
            <input placeholder="Contraseña *" type="password" value={form.contrasena} onChange={f('contrasena')} />
            <input placeholder="Teléfono"                     value={form.telefono}   onChange={f('telefono')} />
            <div className="ep-row">
              <input placeholder="Monto/hora"   type="number" value={form.montoporhora}   onChange={f('montoporhora')} />
              <input placeholder="Monto/jornal" type="number" value={form.montoporjornal} onChange={f('montoporjornal')} />
            </div>
            <div className="ep-actions">
              <button className="ep-cancel" onClick={() => setModal(false)} disabled={saving}>Cancelar</button>
              <button className="ep-save"   onClick={guardar}               disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}