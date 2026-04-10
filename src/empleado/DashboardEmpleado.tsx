import { useState } from 'react';
import '../dashboard/Dashboard.css';
import './DashboardEmpleado.css';
import MisTareas from './pages/MisTareas';
import Progreso from './pages/Progreso';
import Actividad from './pages/Actividad';
import KPIs from './pages/KPIs';
import LotesVista from './pages/LotesVista';

export type RoleEmp = 'empleado';

export interface UsuarioEmp {
  email: string;
  nombre: string;
  role: RoleEmp;
  lote: string;
}

/* ── USUARIOS DEMO EMPLEADO ── */
const EMPLEADOS: Record<string, { pass: string; nombre: string; lote: string }> = {
  'empleado@agri.co':  { pass: 'emp123',  nombre: 'Juan Empleado',   lote: 'Lote A-1' },
  'empleado2@agri.co': { pass: 'emp456',  nombre: 'María Trabajadora', lote: 'Lote B-2' },
};

const MENU_EMP = [
  { id: 'tareas',    icon: '✓',  label: 'Mis Tareas'  },
  { id: 'progreso',  icon: '📈', label: 'Progreso'    },
  { id: 'actividad', icon: '🕐', label: 'Actividad'   },
  { id: 'kpis',      icon: '📊', label: 'KPIs'        },
  { id: 'lotes',     icon: '▦',  label: 'Lotes'       },
];

/* ── LOGIN EMPLEADO ── */
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

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button className="login-btn emp-login-btn" onClick={handleLogin}>Ingresar</button>

        {error && (
          <div className="login-err">Credenciales incorrectas. Intente de nuevo.</div>
        )}

        <p className="login-hint">
          Empleado 1: empleado@agri.co / emp123<br />
          Empleado 2: empleado2@agri.co / emp456
        </p>
      </div>
    </div>
  );
}

/* ── SIDEBAR EMPLEADO ── */
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

/* ── APP EMPLEADO ── */
export default function DashboardEmpleado() {
  const [usuario, setUsuario] = useState<UsuarioEmp | null>(null);
  const [pagina,  setPagina]  = useState('tareas');

  if (!usuario) {
    return <div className="dash-root"><LoginEmpleado onLogin={setUsuario} /></div>;
  }

  const renderPage = () => {
    switch (pagina) {
      case 'tareas':    return <MisTareas usuario={usuario} />;
      case 'progreso':  return <Progreso  usuario={usuario} />;
      case 'actividad': return <Actividad usuario={usuario} />;
      case 'kpis':      return <KPIs      usuario={usuario} />;
      case 'lotes':     return <LotesVista />;
      default:          return <MisTareas usuario={usuario} />;
    }
  };

  return (
    <div className="dash-root">
      {/* TOPBAR */}
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

      {/* BODY */}
      <div className="dash-body">
        <SidebarEmp activePage={pagina} onNav={setPagina} />
        <main className="dash-main">{renderPage()}</main>
      </div>
    </div>
  );
}