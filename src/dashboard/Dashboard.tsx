import ApisSatelital from '../Shared/ApisSatelital';
import ApisIA from '../Shared/ApisIA';
import { useState } from 'react';
import './Dashboard.css';
import Inicio from './pages/inicio';
import Tareas from './pages/tareas';
import Cultivos from './pages/cultivos';
import Lotes from './pages/lotes';
import Palmas from './pages/palmas';
import Empleados from './pages/empleados';
import Graficas from './pages/graficas';

/* ── TIPOS ── */
export type Role = 'admin' | 'empleado';

export interface Usuario {
  email: string;
  nombre: string;
  role: Role;
}

/* ── USUARIOS DEMO ── */
const USUARIOS: Record<string, { pass: string; nombre: string; role: Role }> = {
  'admin@agri.co':    { pass: 'admin123', nombre: 'Admin General',  role: 'admin'    },
  'empleado@agri.co': { pass: 'emp123',   nombre: 'Juan Empleado',  role: 'empleado' },
};

/* ── MENU ── */
const MENU_ADMIN = [
  { id: 'inicio',    icon: '◈',  label: 'Inicio'       },
  { id: 'tareas',    icon: '✓',  label: 'Tareas'       },
  { id: 'cultivos',  icon: '🌱', label: 'Cultivos'     },
  { id: 'lotes',     icon: '▦',  label: 'Lotes'        },
  { id: 'palmas',    icon: '🌴', label: 'Palmas'       },
  { id: 'empleados', icon: '👥', label: 'Empleados'    },
  { id: 'graficas',  icon: '📊', label: 'Gráficas'     },
  { id: 'satelital', icon: '🛰️', label: 'Satelital'    },
  { id: 'deteccion', icon: '🤖', label: 'Detección IA' },
];

/* ── LOGIN ── */
function Login({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    const u = USUARIOS[email];
    if (u && u.pass === pass) {
      onLogin({ email, nombre: u.nombre, role: u.role });
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-logo">
          <div className="logo-icon">🌿</div>
          <h2>AGRICULTURE CO.</h2>
          <p>Sistema de gestión agrícola</p>
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
        <button className="login-btn" onClick={handleLogin}>Ingresar</button>

        {error && (
          <div className="login-err">Credenciales incorrectas. Intente de nuevo.</div>
        )}

        <p className="login-hint">
          Admin: admin@agri.co / admin123<br />
          Empleado: empleado@agri.co / emp123
        </p>
      </div>
    </div>
  );
}

/* ── SIDEBAR ── */
function Sidebar({ activePage, onNav }: { activePage: string; onNav: (id: string) => void }) {
  return (
    <aside className="sidebar">
      {MENU_ADMIN.map((item, i) => (
        <div key={item.id}>
          <button
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
          {i < MENU_ADMIN.length - 1 && <div className="nav-divider" />}
        </div>
      ))}
    </aside>
  );
}

/* ── APP PRINCIPAL ── */
export default function DashboardApp() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pagina,  setPagina]  = useState('inicio');

  if (!usuario) {
    return <div className="dash-root"><Login onLogin={setUsuario} /></div>;
  }

 const renderPage = () => {
  switch (pagina) {
    case 'inicio':    return <Inicio />;
    case 'tareas':    return <Tareas />;
    case 'cultivos':  return <Cultivos />;
    case 'lotes':     return <Lotes />;
    case 'palmas':    return <Palmas />;
    case 'empleados': return <Empleados />;
    case 'graficas':  return <Graficas />;
    case 'satelital': return <ApisSatelital />;
    case 'deteccion': return <ApisIA />;
    default:          return <Inicio />;
  }
};
  return (
    <div className="dash-root">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🌿 AGRI</span>
          <span className="topbar-badge">
            {usuario.role === 'admin' ? 'Administrador' : 'Empleado'}
          </span>
        </div>
        <div className="topbar-right">
          <div className="topbar-user">
            <div className="top-avatar">{usuario.nombre[0]}</div>
            <span>{usuario.nombre}</span>
          </div>
          <button className="logout-btn" onClick={() => { setUsuario(null); setPagina('inicio'); }}>
            Salir
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="dash-body">
        <Sidebar activePage={pagina} onNav={setPagina} />
        <main className="dash-main">{renderPage()}</main>
      </div>
    </div>
  );
}