import { useState, useMemo, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import './Insumos.css';

const API = 'http://localhost:3000';

interface Insumo {
  idinsumo: number;
  nombre: string | null;
  tipo: string | null;
  stockactual: number | null;
  stockminimo: number | null;
  costounitario: number | null;
  unidadmedida: string | null;
  fechaultimaactualizacion: string | null;
}

interface Mensaje { rol: 'user' | 'assistant'; texto: string; }

interface XLSXLibrary {
  utils: {
    aoa_to_sheet(data: unknown[][]): object;
    book_new(): object;
    book_append_sheet(wb: object, ws: object, name: string): void;
  };
  writeFile(wb: object, filename: string): void;
}

declare global {
  interface Window { XLSX?: XLSXLibrary; }
}

type BaseForm = {
  nombre: string;
  tipo: string;
  stockactual: string;
  stockminimo: string;
  costounitario: string;
  unidadmedida: string;
  fechaultimaactualizacion: string;
};

type InsumoPayload = {
  nombre: string;
  tipo: string;
  stockactual?: number;
  stockminimo?: number;
  costounitario?: number;
  unidadmedida?: string;
  fechaultimaactualizacion?: string;
  idadminregistro?: number;
};

type InsumoUpdatePayload = Omit<InsumoPayload, 'idadminregistro'>;

const SYSTEM_INSUMOS = `Eres AgroBot, el asistente inteligente del módulo de Insumos de AgroSmart.
Ayudas a los administradores a gestionar el inventario de insumos agrícolas.
Lo que puedes explicar:
- Cómo agregar un nuevo insumo (botón "+ Nuevo insumo")
- Cómo editar un insumo existente (botón lápiz)
- Cómo actualizar el stock, precio o fecha de caducidad
- Cómo filtrar insumos por tipo y por rango de fechas
- Qué significa "bajo stock" (stockactual menor que stockminimo)
- Cómo eliminar un insumo (botón papelera)
- Cómo descargar el inventario en Excel
Responde siempre en español, de forma breve y amigable. Máximo 3 oraciones por respuesta.`;

const GUIA_ITEMS = [
  { icon: '＋', titulo: 'Nuevo insumo',    desc: 'Haz clic en "+ Nuevo insumo" para registrar un fertilizante, herbicida, semilla u otro producto.', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: '✏️', titulo: 'Editar insumo',   desc: 'Haz clic en el botón de lápiz para modificar stock, precio, fecha de caducidad y más campos.', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { icon: '🔍', titulo: 'Filtrar',          desc: 'Usa las pestañas de tipo y los campos de fecha para filtrar los insumos que necesitas ver.', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: '⚠️', titulo: 'Bajo stock',       desc: 'Se alerta cuando el stock actual es menor que el stock mínimo. El valor aparece en rojo.', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { icon: '📊', titulo: 'Descargar Excel',  desc: 'Haz clic en "Descargar Excel" para exportar el inventario actual a un archivo .xlsx.', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: '🗑️', titulo: 'Eliminar insumo', desc: 'Usa el botón de papelera al final de cada fila para eliminar ese insumo del inventario.', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

const SUGERENCIAS = ['¿Cómo edito un insumo?', '¿Qué es bajo stock?', '¿Cómo filtro por fecha?', '¿Cómo descargo el Excel?'];
const TIPOS = ['Fertilizante', 'Herbicida', 'Insecticida', 'Semilla', 'Otro'];

/* ── WIDGET AGROBOT ─────────────────────────────────────────────────────── */
function AgrobotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<'guia' | 'chat'>('guia');
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', texto: '¡Hola! Soy AgroBot 🌿 ¿En qué te puedo ayudar con los insumos?' },
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, tab]);

  const enviar = async (textoDirecto?: string) => {
    const texto = (textoDirecto ?? input).trim();
    if (!texto || cargando) return;
    setInput('');
    if (tab !== 'chat') setTab('chat');
    const nuevos: Mensaje[] = [...mensajes, { rol: 'user', texto }];
    setMensajes(nuevos);
    setCargando(true);
    try {
      const res = await fetch(`${API}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_INSUMOS, messages: nuevos.map(m => ({ role: m.rol, content: m.texto })) }),
      });
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'assistant', texto: data.content?.[0]?.text ?? 'No pude responder.' }]);
    } catch {
      setMensajes(prev => [...prev, { rol: 'assistant', texto: 'Error al conectar.' }]);
    } finally { setCargando(false); }
  };

  return (
    <>
      <style>{`
        @keyframes widgetIn{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:none}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .aw-fab{position:fixed;bottom:28px;right:28px;z-index:999;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);border:none;cursor:pointer;box-shadow:0 4px 24px rgba(22,163,74,0.45);display:flex;align-items:center;justify-content:center;transition:transform .2s}
        .aw-fab:hover{transform:scale(1.1)}
        .aw-panel{position:fixed;bottom:94px;right:28px;z-index:998;width:352px;border-radius:18px;background:#fff;border:0.5px solid #e5e7eb;box-shadow:0 8px 40px rgba(0,0,0,0.16);display:flex;flex-direction:column;overflow:hidden;animation:widgetIn .22s cubic-bezier(.34,1.56,.64,1)}
        .aw-header{background:linear-gradient(135deg,#16a34a,#059669);padding:13px 16px;display:flex;align-items:center;gap:10px}
        .aw-tabs{display:flex;border-bottom:0.5px solid #e5e7eb}
        .aw-tab{flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;background:transparent;cursor:pointer;color:#94a3b8;border-bottom:2px solid transparent;font-family:inherit}
        .aw-tab.active{color:#16a34a;border-bottom-color:#16a34a}
        .aw-guia-scroll{overflow-y:auto;max-height:360px;padding:12px;display:flex;flex-direction:column;gap:8px}
        .aw-guia-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;border:1px solid}
        .aw-guia-ask{margin-top:5px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid;cursor:pointer;font-family:inherit}
        .aw-chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;max-height:320px}
        .aw-bubble-wrap{display:flex}
        .aw-bubble{max-width:82%;padding:8px 12px;font-size:13px;line-height:1.5}
        .aw-bubble.user{background:#16a34a;color:#fff;border-radius:14px 14px 4px 14px;margin-left:auto}
        .aw-bubble.bot{background:#f3f4f6;color:#111;border-radius:14px 14px 14px 4px}
        .aw-input-row{padding:10px 14px;border-top:0.5px solid #e5e7eb;display:flex;gap:8px;align-items:center}
        .aw-input{flex:1;padding:8px 12px;border:1px solid #e5e7eb;border-radius:99px;font-size:13px;color:#111;outline:none;font-family:inherit}
        .aw-send{width:34px;height:34px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .aw-chips{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:6px}
        .aw-chip{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:500;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;cursor:pointer;font-family:inherit}
        .aw-chip:hover{background:#dcfce7}
      `}</style>

      <button className="aw-fab" onClick={() => setAbierto(v => !v)}>
        {abierto
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/><circle cx="8.5" cy="11" r="1" fill="#fff"/><circle cx="12" cy="11" r="1" fill="#fff"/><circle cx="15.5" cy="11" r="1" fill="#fff"/></svg>
        }
      </button>

      {abierto && (
        <div className="aw-panel">
          <div className="aw-header">
            <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/></svg>
            </div>
            <div><div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>AgroBot</div><div style={{ fontSize:11,color:'rgba(255,255,255,0.75)' }}>Asistente de Insumos</div></div>
            <div style={{ marginLeft:'auto' }}><div style={{ width:8,height:8,borderRadius:'50%',background:'#86efac' }} /></div>
          </div>
          <div className="aw-tabs">
            <button className={`aw-tab ${tab==='guia'?'active':''}`} onClick={() => setTab('guia')}>📋 Guía rápida</button>
            <button className={`aw-tab ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>💬 Preguntar</button>
          </div>
          {tab === 'guia' && (
            <div className="aw-guia-scroll">
              {GUIA_ITEMS.map(item => (
                <div key={item.titulo} className="aw-guia-item" style={{ background:item.bg,borderColor:item.border }}>
                  <span style={{ fontSize:18,lineHeight:1,flexShrink:0,marginTop:1 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:item.color,marginBottom:2 }}>{item.titulo}</div>
                    <div style={{ fontSize:12,color:'#374151',lineHeight:1.4 }}>{item.desc}</div>
                    <button className="aw-guia-ask" style={{ background:'transparent',color:item.color,borderColor:item.border,marginTop:6 }} onClick={() => enviar(`Explícame más sobre: ${item.titulo}`)}>Saber más →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'chat' && (
            <>
              <div className="aw-chat-body">
                {mensajes.map((m, i) => (
                  <div key={i} className="aw-bubble-wrap">
                    <div className={`aw-bubble ${m.rol==='user'?'user':'bot'}`}>{m.texto}</div>
                  </div>
                ))}
                {cargando && (
                  <div className="aw-bubble-wrap">
                    <div className="aw-bubble bot" style={{ display:'flex',gap:4,alignItems:'center',padding:'10px 14px' }}>
                      {[0,1,2].map(i => <div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#9ca3af',animation:`bounce .9s ${i*0.15}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {mensajes.length <= 1 && (
                <div className="aw-chips">{SUGERENCIAS.map(s => <button key={s} className="aw-chip" onClick={() => enviar(s)}>{s}</button>)}</div>
              )}
            </>
          )}
          <div className="aw-input-row">
            <input className="aw-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&enviar()} placeholder="Escribe tu pregunta..." />
            <button className="aw-send" onClick={() => enviar()} disabled={cargando||!input.trim()} style={{ background:input.trim()?'#16a34a':'#e5e7eb' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── DESCARGA EXCEL ─────────────────────────────────────────────────────── */
function descargarExcel(insumos: Insumo[]) {
  const encabezados = ['ID', 'Nombre', 'Tipo', 'Stock Actual', 'Stock Mínimo', 'Costo Unitario', 'Unidad', 'Última Actualización'];
  const filas = insumos.map(i => [i.idinsumo, i.nombre ?? '', i.tipo ?? '', i.stockactual ?? 0, i.stockminimo ?? 0, i.costounitario ?? 0, i.unidadmedida ?? '', i.fechaultimaactualizacion ?? '']);
  if (window.XLSX) {
    const XLSX = window.XLSX;
    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...filas]) as Record<string, unknown>;
    ws['!cols'] = [{wch:5},{wch:28},{wch:14},{wch:12},{wch:12},{wch:14},{wch:10},{wch:20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Insumos');
    XLSX.writeFile(wb, `Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
    const bom = '\uFEFF';
    const csv = bom + [encabezados, ...filas].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
    a.download = `Insumos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
}

/* ── INSUMOS PAGE ───────────────────────────────────────────────────────── */
const FORM_VACIO = { nombre:'', tipo:'Fertilizante', stockactual:'', stockminimo:'', costounitario:'', unidadmedida:'kg', fechaultimaactualizacion:'' };

export default function Insumos() {
  const [insumos, setInsumos]     = useState<Insumo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState('todos');
  const [modal, setModal]         = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [adminId, setAdminId]     = useState<number | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [form, setForm]           = useState(FORM_VACIO);
  const [editForm, setEditForm]   = useState({ ...FORM_VACIO, idinsumo: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) { const u = JSON.parse(raw); setAdminId(u.id ?? null); }
    } catch { /* nada */ }
  }, []);

  useEffect(() => {
    if (!window.XLSX) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      document.head.appendChild(s);
    }
  }, []);

  const cargarInsumos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/insumos`);
      if (!res.ok) throw new Error();
      setInsumos(await res.json());
    } catch { setInsumos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarInsumos(); }, []);

  /* filtros combinados: tipo + fecha */
  const insumosFiltrados = useMemo(() => {
    return insumos.filter(i => {
      if (filtro !== 'todos' && (i.tipo ?? '').toLowerCase() !== filtro.toLowerCase()) return false;
      const f = i.fechaultimaactualizacion ? i.fechaultimaactualizacion.split('T')[0] : null;
      if (fechaDesde || fechaHasta) {
        if (!f) return false;
        if (fechaDesde && f < fechaDesde) return false;
        if (fechaHasta && f > fechaHasta) return false;
      }
      return true;
    });
  }, [insumos, filtro, fechaDesde, fechaHasta]);

  const totalValor = useMemo(() => insumos.reduce((s, i) => s + Number(i.stockactual ?? 0) * Number(i.costounitario ?? 0), 0), [insumos]);
  const bajoStock  = useMemo(() => insumos.filter(i => Number(i.stockactual ?? 0) < Number(i.stockminimo ?? 0)).length, [insumos]);

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    try {
      setSaving(true);
      const body: InsumoPayload = {
        nombre: form.nombre,
        tipo: form.tipo,
        stockactual:   form.stockactual   ? Number(form.stockactual)   : undefined,
        stockminimo:   form.stockminimo   ? Number(form.stockminimo)   : undefined,
        costounitario: form.costounitario ? Number(form.costounitario) : undefined,
        unidadmedida:  form.unidadmedida  || undefined,
        fechaultimaactualizacion: form.fechaultimaactualizacion || undefined,
        idadminregistro: adminId ?? undefined,
      };
      const res = await fetch(`${API}/api/v1/insumos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Error al guardar');
      await cargarInsumos();
      setModal(false);
      setForm(FORM_VACIO);
    } catch (e) { alert(e instanceof Error ? e.message : 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const abrirEditar = (i: Insumo) => {
    setEditForm({
      idinsumo: i.idinsumo,
      nombre: i.nombre ?? '',
      tipo: i.tipo ?? 'Fertilizante',
      stockactual: i.stockactual != null ? String(i.stockactual) : '',
      stockminimo: i.stockminimo != null ? String(i.stockminimo) : '',
      costounitario: i.costounitario != null ? String(i.costounitario) : '',
      unidadmedida: i.unidadmedida ?? 'kg',
      fechaultimaactualizacion: i.fechaultimaactualizacion ? i.fechaultimaactualizacion.split('T')[0] : '',
    });
    setEditModal(true);
  };

  const guardarEdicion = async () => {
    if (!editForm.nombre.trim()) return;
    try {
      setSaving(true);
      const body: InsumoUpdatePayload = {
        nombre: editForm.nombre,
        tipo: editForm.tipo,
        stockactual:   editForm.stockactual   ? Number(editForm.stockactual)   : undefined,
        stockminimo:   editForm.stockminimo   ? Number(editForm.stockminimo)   : undefined,
        costounitario: editForm.costounitario ? Number(editForm.costounitario) : undefined,
        unidadmedida:  editForm.unidadmedida  || undefined,
        fechaultimaactualizacion: editForm.fechaultimaactualizacion || undefined,
      };
      const res = await fetch(`${API}/api/v1/insumos/${editForm.idinsumo}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Error al actualizar');
      await cargarInsumos();
      setEditModal(false);
    } catch (e) { alert(e instanceof Error ? e.message : 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este insumo?')) return;
    try {
      await fetch(`${API}/api/v1/insumos/${id}`, { method: 'DELETE' });
      await cargarInsumos();
    } catch { setInsumos(prev => prev.filter(i => i.idinsumo !== id)); }
  };

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
  };

  /* botones de acción reutilizables */
  const BtnEditar = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} title="Editar" style={{
      width: 30, height: 30, borderRadius: 8,
      border: '1px solid #bfdbfe', background: '#eff6ff', color: '#3b82f6',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s', marginRight: 6,
    }}
      onMouseEnter={e => { e.currentTarget.style.background='#dbeafe'; }}
      onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
  );

  const BtnEliminar = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} title="Eliminar" style={{
      width: 30, height: 30, borderRadius: 8,
      border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; }}
      onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
    </button>
  );

  /* ── FORM FIELDS compartido ── */
  const FormFields = <T extends BaseForm>({ f, set }: { f: T; set: Dispatch<SetStateAction<T>> }) => (
    <>
      <input placeholder="Nombre del insumo *" value={f.nombre} onChange={e => set({...f,nombre:e.target.value})} style={iStyle} />
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
          <label style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Tipo</label>
          <select value={f.tipo} onChange={e => set({...f,tipo:e.target.value})} style={{...iStyle,width:'auto'}}>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
          <label style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Unidad de medida</label>
          <select value={f.unidadmedida} onChange={e => set({...f,unidadmedida:e.target.value})} style={{...iStyle,width:'auto'}}>
            <option value="kg">kg</option><option value="L">Litros (L)</option>
            <option value="g">g</option><option value="mL">mL</option>
            <option value="u">Unidades</option><option value="t">Toneladas</option>
          </select>
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
          <label style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Stock actual</label>
          <input type="number" placeholder="0" value={f.stockactual} onChange={e => set({...f,stockactual:e.target.value})} style={{...iStyle,width:'auto'}} />
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
          <label style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Stock mínimo</label>
          <input type="number" placeholder="0" value={f.stockminimo} onChange={e => set({...f,stockminimo:e.target.value})} style={{...iStyle,width:'auto'}} />
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
        <label style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Costo unitario</label>
        <input type="number" placeholder="0" value={f.costounitario} onChange={e => set({...f,costounitario:e.target.value})} style={iStyle} />
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
        <label style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Fecha última actualización</label>
        <input type="date" value={f.fechaultimaactualizacion} onChange={e => set({...f,fechaultimaactualizacion:e.target.value})} style={iStyle} />
      </div>
    </>
  );

  return (
    <>
      <p className="page-title">Gestión de Insumos</p>
      <p className="page-sub">Control de inventario y proveedores</p>

      {/* MÉTRICAS */}
      <div className="ins-metrics">
        <div className="ins-metric-card"><div className="ins-metric-label">Total insumos</div><div className="ins-metric-val">{insumos.length}</div></div>
        <div className="ins-metric-card"><div className="ins-metric-label">Valor total</div><div className="ins-metric-val">${totalValor.toLocaleString()}</div></div>
        <div className={`ins-metric-card ${bajoStock > 0 ? 'ins-metric-alert' : ''}`}>
          <div className="ins-metric-label">Bajo stock</div>
          <div className={`ins-metric-val ${bajoStock > 0 ? 'ins-metric-red' : ''}`}>{bajoStock}</div>
        </div>
        <div className="ins-metric-card"><div className="ins-metric-label">Tipos distintos</div><div className="ins-metric-val">{new Set(insumos.map(i => i.tipo).filter(Boolean)).size}</div></div>
      </div>

      {/* FILTROS TIPO */}
      <div className="ins-tabs">
        {['todos', ...TIPOS].map(t => (
          <button key={t} className={`ins-tab ${filtro === t ? 'active' : ''}`} onClick={() => setFiltro(t)}>
            {t === 'todos' ? 'Todos' : t}
          </button>
        ))}
      </div>

      {/* FILTRO FECHAS */}
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:'7px 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize:12,color:'#6b7280',fontWeight:500 }}>Desde</span>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ border:'none',outline:'none',fontSize:13,color:'#0f172a',fontFamily:'inherit',background:'transparent' }} />
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:'7px 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize:12,color:'#6b7280',fontWeight:500 }}>Hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ border:'none',outline:'none',fontSize:13,color:'#0f172a',fontFamily:'inherit',background:'transparent' }} />
        </div>
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} style={{ padding:'7px 14px',borderRadius:10,border:'1px solid #fecaca',background:'#fef2f2',color:'#ef4444',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
            Limpiar fechas
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="table-card">
        <div className="table-header">
          <span>Insumos registrados ({insumosFiltrados.length})</span>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={() => descargarExcel(insumosFiltrados)} style={{
              padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:600,
              border:'1.5px solid #16a34a',color:'#16a34a',background:'#fff',
              cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar Excel
            </button>
            <button onClick={() => setModal(true)} style={{
              padding:'8px 16px',borderRadius:10,fontSize:12,fontWeight:700,
              border:'none',color:'#fff',background:'linear-gradient(135deg,#16a34a,#15803d)',
              cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,
              boxShadow:'0 2px 8px rgba(22,163,74,0.3)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo insumo
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:32,color:'#64748b' }}>Cargando insumos...</div>
        ) : insumosFiltrados.length === 0 ? (
          <div style={{ textAlign:'center',padding:32,color:'#64748b' }}>No hay insumos con ese filtro</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Tipo</th>
                <th>Stock actual</th><th>Stock mín.</th>
                <th>Costo unitario</th><th>Unidad</th>
                <th>Última act.</th><th></th>
              </tr>
            </thead>
            <tbody>
              {insumosFiltrados.map(i => {
                const bajo = Number(i.stockactual ?? 0) < Number(i.stockminimo ?? 0);
                return (
                  <tr key={i.idinsumo}>
                    <td style={{ color:'black' }}>{i.idinsumo}</td>
                    <td style={{ color:'black' }}>{i.nombre ?? '—'}</td>
                    <td style={{ color:'black' }}>{i.tipo ?? '—'}</td>
                    <td style={{ color: bajo ? '#dc2626' : 'black', fontWeight: bajo ? 600 : 400 }}>
                      {i.stockactual ?? '—'} {i.unidadmedida ?? ''}
                    </td>
                    <td style={{ color:'black' }}>{i.stockminimo ?? '—'}</td>
                    <td style={{ color:'black' }}>{i.costounitario != null ? `$${Number(i.costounitario).toLocaleString()}` : '—'}</td>
                    <td style={{ color:'black' }}>{i.unidadmedida ?? '—'}</td>
                    <td style={{ color:'black' }}>{i.fechaultimaactualizacion ? i.fechaultimaactualizacion.split('T')[0] : '—'}</td>
                    <td style={{ whiteSpace:'nowrap' }}>
                      <BtnEditar onClick={() => abrirEditar(i)} />
                      <BtnEliminar onClick={() => eliminar(i.idinsumo)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL — NUEVO INSUMO */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem' }}>
          <div style={{ background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:480,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)',maxHeight:'90vh',overflowY:'auto' }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#0f172a',margin:0 }}>NUEVO INSUMO</h3>
            <FormFields f={form} set={setForm} />
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:4 }}>
              <button onClick={() => { setModal(false); setForm(FORM_VACIO); }} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#16a34a',color:'#fff',border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,fontFamily:'inherit' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — EDITAR INSUMO */}
      {editModal && (
        <div onClick={e => e.target === e.currentTarget && setEditModal(false)}
          style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem' }}>
          <div style={{ background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:480,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)',maxHeight:'90vh',overflowY:'auto' }}>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#0f172a',margin:0 }}>EDITAR INSUMO #{editForm.idinsumo}</h3>
            <FormFields f={editForm} set={setEditForm} />
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:4 }}>
              <button onClick={() => setEditModal(false)} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={saving} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#3b82f6',color:'#fff',border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,fontFamily:'inherit' }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AgrobotWidget />
    </>
  );
}