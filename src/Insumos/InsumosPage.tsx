import { useState, useMemo } from 'react';
import './Insumos.css';

interface Insumo {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  unidad: string;
  precio: number;
  proveedor: string;
  fechaCaducidad?: string;
}

const INSUMOS_INICIALES: Insumo[] = [
  { id: 1, nombre: 'Fertilizante NPK 20-20-20', categoria: 'Fertilizantes', stock: 150, unidad: 'kg', precio: 25000, proveedor: 'AgroQuímicos S.A.', fechaCaducidad: '2025-12-31' },
  { id: 2, nombre: 'Herbicida Glifosato', categoria: 'Herbicidas', stock: 75, unidad: 'L', precio: 45000, proveedor: 'Pesticidas del Valle', fechaCaducidad: '2025-08-15' },
  { id: 3, nombre: 'Semillas de Maíz', categoria: 'Semillas', stock: 500, unidad: 'kg', precio: 120000, proveedor: 'Semillas Premium', fechaCaducidad: '2025-06-30' },
  { id: 4, nombre: 'Insecticida Orgánico', categoria: 'Insecticidas', stock: 25, unidad: 'L', precio: 35000, proveedor: 'BioAgro', fechaCaducidad: '2025-09-20' },
  { id: 5, nombre: 'Fertilizante Fosfato', categoria: 'Fertilizantes', stock: 200, unidad: 'kg', precio: 30000, proveedor: 'AgroQuímicos S.A.' },
];

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>(INSUMOS_INICIALES);
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Fertilizantes',
    stock: '',
    unidad: 'kg',
    precio: '',
    proveedor: '',
    fechaCaducidad: ''
  });

  const insumosFiltrados = filtro === 'todos'
    ? insumos
    : insumos.filter(i => i.categoria.toLowerCase() === filtro);

  const totalValor = insumos.reduce((sum, i) => sum + (i.stock * i.precio), 0);
  const [fechaLimite] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const bajoStock = useMemo(() => insumos.filter(i => i.stock < 50).length, [insumos]);
  const proximosCaducar = useMemo(() => insumos.filter(i =>
    i.fechaCaducidad && new Date(i.fechaCaducidad) < fechaLimite
  ).length, [insumos, fechaLimite]);

  const agregarInsumo = () => {
    if (!form.nombre.trim()) return;
    const nuevo: Insumo = {
      id: Math.max(...insumos.map(i => i.id)) + 1,
      nombre: form.nombre,
      categoria: form.categoria,
      stock: parseInt(form.stock) || 0,
      unidad: form.unidad,
      precio: parseFloat(form.precio) || 0,
      proveedor: form.proveedor,
      fechaCaducidad: form.fechaCaducidad || undefined
    };
    setInsumos([...insumos, nuevo]);
    setModal(false);
    setForm({
      nombre: '',
      categoria: 'Fertilizantes',
      stock: '',
      unidad: 'kg',
      precio: '',
      proveedor: '',
      fechaCaducidad: ''
    });
  };

  const eliminarInsumo = (id: number) => {
    setInsumos(insumos.filter(i => i.id !== id));
  };

  return (
    <>
      <p className="page-title">Gestión de Insumos</p>
      <p className="page-sub">Control de inventario y proveedores</p>

      {/* MÉTRICAS */}
      <div className="ins-metrics">
        <div className="ins-metric-card">
          <div className="ins-metric-label">Total insumos</div>
          <div className="ins-metric-val">{insumos.length}</div>
        </div>
        <div className="ins-metric-card">
          <div className="ins-metric-label">Valor total</div>
          <div className="ins-metric-val">${totalValor.toLocaleString()}</div>
        </div>
        <div className={`ins-metric-card ${bajoStock > 0 ? 'ins-metric-alert' : ''}`}>
          <div className="ins-metric-label">Bajo stock</div>
          <div className={`ins-metric-val ${bajoStock > 0 ? 'ins-metric-red' : ''}`}>{bajoStock}</div>
        </div>
        <div className={`ins-metric-card ${proximosCaducar > 0 ? 'ins-metric-alert' : ''}`}>
          <div className="ins-metric-label">Próximos a caducar</div>
          <div className={`ins-metric-val ${proximosCaducar > 0 ? 'ins-metric-red' : ''}`}>{proximosCaducar}</div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="ins-tabs">
        {['todos', 'fertilizantes', 'herbicidas', 'insecticidas', 'semillas'].map(cat => (
          <button
            key={cat}
            className={`ins-tab ${filtro === cat ? 'active' : ''}`}
            onClick={() => setFiltro(cat)}
          >
            {cat === 'todos' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* TABLA */}
      <div className="table-card">
        <div className="table-header">
          <span>Insumos registrados</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Nuevo insumo</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Proveedor</th><th>Caducidad</th><th></th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.map(i => (
              <tr key={i.id}>
                <td style={{ color: 'black' }}>{i.id}</td>
                <td style={{ color: 'black' }}>{i.nombre}</td>
                <td style={{ color: 'black' }}>{i.categoria}</td>
                <td style={{ color: 'black' }}>{i.stock} {i.unidad}</td>
                <td style={{ color: 'black' }}>${i.precio.toLocaleString()}</td>
                <td style={{ color: 'black' }}>{i.proveedor}</td>
                <td style={{ color: 'black' }}>{i.fechaCaducidad || 'N/A'}</td>
                <td>
                  <button className="act-btn" onClick={() => eliminarInsumo(i.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL AGREGAR */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>NUEVO INSUMO</h3>
            <input placeholder="Nombre del insumo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={{ color: 'black' }} />
            <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={{ color: 'black' }}>
              <option value="Fertilizantes">Fertilizantes</option>
              <option value="Herbicidas">Herbicidas</option>
              <option value="Insecticidas">Insecticidas</option>
              <option value="Semillas">Semillas</option>
              <option value="Otros">Otros</option>
            </select>
            <div className="form-row">
              <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} style={{ color: 'black' }} />
              <select value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})} style={{ color: 'black' }}>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="u">unidades</option>
              </select>
            </div>
            <input placeholder="Precio unitario" type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} style={{ color: 'black' }} />
            <input placeholder="Proveedor" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} style={{ color: 'black' }} />
            <input placeholder="Fecha caducidad (opcional)" type="date" value={form.fechaCaducidad} onChange={e => setForm({...form, fechaCaducidad: e.target.value})} style={{ color: 'black' }} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={agregarInsumo}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}