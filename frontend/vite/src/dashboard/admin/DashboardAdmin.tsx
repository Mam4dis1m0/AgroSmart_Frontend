import { useState } from 'react';
import '../../shared/styles/Dashboard.css';
import Inicio from './pages/InicioPage';
import Tareas from '../../tareas/pages/TareasPage';
import Cultivos from '../../cultivos/pages/CultivosPage';
import Lotes from '../../lotes/pages/LotesPage';
import Palmas from '../../palmas/pages/PalmasPage';
import Empleados from '../../empleados/pages/EmpleadosPage';
import Graficas from './pages/GraficasPage';
import ApisSatelital from '../../APis/ApisSatelital';

export type Role = 'admin' | 'empleado';

export interface Usuario {
  email: string;
  nombre: string;
  role: Role;
}

const MENU_ADMIN = [
  { id: 'inicio',    icon: '◈',  label: 'Inicio'    },
  { id: 'tareas',    icon: '✓',  label: 'Tareas'    },
  { id: 'cultivos',  icon: '🌱', label: 'Cultivos'  },
  { id: 'lotes',     icon: '▦',  label: 'Lotes'     },
  { id: 'palmas',    icon: '🌴', label: 'Palmas'    },
  { id: 'empleados', icon: '👥', label: 'Empleados' },
  { id: 'graficas',  icon: '📊', label: 'Gráficas'  },
  { id: 'satelital', icon: '🛰️', label: 'Satelital' },
];

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

export default function DashboardApp({
  usuario,
  onLogout,
}: {
  usuario: Usuario;
  onLogout: () => void;
}) {
  const [pagina, setPagina] = useState('inicio');

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
      default:          return <Inicio />;
    }
  };

  return (
    <div className="dash-root">
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🌿 AGRI</span>
          <span className="topbar-badge">Administrador</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-user">
            <div className="top-avatar">{usuario.nombre[0]}</div>
            <span>{usuario.nombre}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>
      <div className="dash-body">
        <Sidebar activePage={pagina} onNav={setPagina} />
        <main className="dash-main">{renderPage()}</main>
      </div>
    </div>
  );
}