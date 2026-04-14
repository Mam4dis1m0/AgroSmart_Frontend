import { useState } from 'react';
import '../dashboard/Dashboard.css';
import './DashboardEmpleado.css';
import MisTareas from './pages/MisTareas';
import ApisIA from '../Shared/ApisIA';

export type RoleEmp = 'empleado';

export interface UsuarioEmp {
  email: string;
  nombre: string;
  role: RoleEmp;
  lote: string;
}

const EMPLEADOS: Record<string, { pass: string; nombre: string; lote: string }> = {
  'empleado@agri.co':  { pass: 'emp123',  nombre: 'Juan Empleado',    lote: 'Lote A-1' },
  'empleado2@agri.co': { pass: 'emp456',  nombre: 'María Trabajadora', lote: 'Lote B-2' },
};

const MENU_EMP = [
  { id: 'tareas',    icon: '✓',  label: 'Mis Tareas'   },
  { id: 'estado',    icon: '📝', label: 'Estado Tarea' },
  { id: 'palmas',    icon: '🌴', label: 'Palmas'       },
  { id: 'deteccion', icon: '🤖', label: 'Detección IA' },
];

// ── PÁGINA ESTADO TAREA ──
const TAREAS_DEMO = [
  { id: 1, nombre: 'Fumigación Lote A-1', tipo: 'FUMIGACION', fecha: '2026-04-10', estado: 'PENDIENTE' },
  { id: 2, nombre: 'Cosecha Lote B-2',    tipo: 'COSECHA',    fecha: '2026-04-11', estado: 'EN_PROCESO' },
  { id: 3, nombre: 'Poda Lote A-1',       tipo: 'PODA',       fecha: '2026-04-12', estado: 'PENDIENTE' },
];

const ESTADO_COLORES: Record<string, string> = {
  PENDIENTE:  '#f39c12',
  EN_PROCESO: '#2e86ab',
  TERMINADA:  '#27ae60',
};

function EstadoTarea() {
  const [tareas, setTareas] = useState(TAREAS_DEMO);

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
  };

  return (
    <div className="estado-page">
      <h1>📝 Modificar Estado de Tareas</h1>
      <p>Actualiza el estado de tus tareas asignadas.</p>
      <div className="estado-lista">
        {tareas.map(t => (
          <div className="estado-card" key={t.id}>
            <div className="estado-card-header">
              <div>
                <div className="estado-card-nombre">{t.nombre}</div>
                <div className="estado-card-meta">{t.tipo} — {t.fecha}</div>
              </div>
              <span
                className="estado-badge"
                style={{ background: ESTADO_COLORES[t.estado] }}
              >
                {t.estado}
              </span>
            </div>
            <div className="estado-botones">
              {['PENDIENTE', 'EN_PROCESO', 'TERMINADA'].map(e => (
                <button
                  key={e}
                  className={`estado-btn ${t.estado === e ? 'estado-btn--active' : ''}`}
                  style={{ borderColor: ESTADO_COLORES[e], color: t.estado === e ? '#fff' : ESTADO_COLORES[e], background: t.estado === e ? ESTADO_COLORES[e] : 'transparent' }}
                  onClick={() => cambiarEstado(t.id, e)}
                >
                  {e === 'PENDIENTE' ? '⏳ Pendiente' : e === 'EN_PROCESO' ? '🔄 En proceso' : '✅ Terminada'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PÁGINA PALMAS (solo lectura) ──
const PALMAS_DEMO = [
  { id: 'P-001', variedad: 'Híbrido OxG', lote: 'Lote A-1', estado: 'SANO',            fechaSiembra: '2020-03-15' },
  { id: 'P-002', variedad: 'Híbrido OxG', lote: 'Lote A-1', estado: 'EN_TRATAMIENTO',  fechaSiembra: '2020-03-15' },
  { id: 'P-003', variedad: 'Dura',        lote: 'Lote B-2', estado: 'SANO',            fechaSiembra: '2019-06-20' },
  { id: 'P-004', variedad: 'Dura',        lote: 'Lote B-2', estado: 'BAJO_OBSERVACION', fechaSiembra: '2019-06-20' },
];

const ESTADO_PALMA_COLOR: Record<string, string> = {
  SANO:             '#27ae60',
  EN_TRATAMIENTO:   '#e74c3c',
  BAJO_OBSERVACION: '#f39c12',
};

function PalmasVista() {
  return (
    <div className="palmas-page">
      <h1>🌴 Mis Palmas</h1>
      <p>Vista de las palmas asignadas a tu lote.</p>
      <div className="palmas-grid">
        {PALMAS_DEMO.map(p => (
          <div className="palma-card" key={p.id} style={{ borderTop: `4px solid ${ESTADO_PALMA_COLOR[p.estado]}` }}>
            <div className="palma-codigo">{p.id}</div>
            <div className="palma-row"><span>Variedad</span><strong>{p.variedad}</strong></div>
            <div className="palma-row"><span>Lote</span><strong>{p.lote}</strong></div>
            <div className="palma-row"><span>Siembra</span><strong>{p.fechaSiembra}</strong></div>
            <div className="palma-row">
              <span>Estado</span>
              <strong style={{ color: ESTADO_PALMA_COLOR[p.estado] }}>{p.estado}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LOGIN ──
function LoginEmpleado({ onLogin }: { onLogin: (u: UsuarioEmp) => void }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    const u = EMPLEADOS[email];
    if (u && u.pass === pass) {
      onLogin({ email, nombre: u.nombre, role: 'empleado', lote: u.lote });
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="login-screen emp-login-screen">
      <div className="login-box emp-login-box">
        <div className="login-logo">
          <div className="logo-icon">👷</div>
          <h2>PORTAL EMPLEADO</h2>
          <p>Agriculture Co. — Acceso de campo</p>
        </div>
        <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button className="login-btn emp-login-btn" onClick={handleLogin}>Ingresar</button>
        {error && <div className="login-err">Credenciales incorrectas. Intente de nuevo.</div>}
        <p className="login-hint">
          Empleado 1: empleado@agri.co / emp123<br />
          Empleado 2: empleado2@agri.co / emp456
        </p>
      </div>
    </div>
  );
}

// ── SIDEBAR ──
function SidebarEmp({ activePage, onNav }: { activePage: string; onNav: (id: string) => void }) {
  return (
    <aside className="sidebar emp-sidebar">
      {MENU_EMP.map((item, i) => (
        <div key={item.id}>
          <button
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
          {i < MENU_EMP.length - 1 && <div className="nav-divider" />}
        </div>
      ))}
    </aside>
  );
}

// ── APP EMPLEADO ──
export default function DashboardEmpleado() {
  const [usuario, setUsuario] = useState<UsuarioEmp | null>(null);
  const [pagina,  setPagina]  = useState('tareas');

  if (!usuario) {
    return <div className="dash-root"><LoginEmpleado onLogin={setUsuario} /></div>;
  }

  const renderPage = () => {
    switch (pagina) {
      case 'tareas':    return <MisTareas  usuario={usuario} />;
      case 'estado':    return <EstadoTarea />;
      case 'palmas':    return <PalmasVista />;
      case 'deteccion': return <ApisIA />;
      default:          return <MisTareas  usuario={usuario} />;
    }
  };

  return (
    <div className="dash-root">
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🌿 AGRI</span>
          <span className="topbar-badge emp-badge">Empleado</span>
          <span className="topbar-lote">📍 {usuario.lote}</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-user">
            <div className="top-avatar emp-avatar-color">{usuario.nombre[0]}</div>
            <span>{usuario.nombre}</span>
          </div>
          <button className="logout-btn" onClick={() => { setUsuario(null); setPagina('tareas'); }}>
            Salir
          </button>
        </div>
      </header>
      <div className="dash-body">
        <SidebarEmp activePage={pagina} onNav={setPagina} />
        <main className="dash-main">{renderPage()}</main>
      </div>
    </div>
  );
}