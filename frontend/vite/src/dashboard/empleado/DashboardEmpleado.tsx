import { useState } from 'react';
import '../../shared/styles/Dashboard.css';
import '../../shared/styles/DashboardEmpleado.css';
import MisTareas from './pages/MisTareasPage';
import Progreso from './pages/ProgresoPage';
import Actividad from './pages/ActividadPage';
import KPIs from './pages/KPIsPage';
import LotesVista from './pages/LotesVistaPage';

export type RoleEmp = 'empleado';

export interface UsuarioEmp {
  email: string;
  nombre: string;
  role: RoleEmp;
  lote: string;
}

const MENU_EMP = [
  { id: 'tareas',    icon: '✓',  label: 'Mis Tareas' },
  { id: 'progreso',  icon: '📈', label: 'Progreso'   },
  { id: 'actividad', icon: '🕐', label: 'Actividad'  },
  { id: 'kpis',      icon: '📊', label: 'KPIs'       },
  { id: 'lotes',     icon: '▦',  label: 'Lotes'      },
];

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

export default function DashboardEmpleado({
  usuario,
  onLogout,
}: {
  usuario: UsuarioEmp;
  onLogout: () => void;
}) {
  const [pagina, setPagina] = useState('tareas');

  const renderPage = () => {
    switch (pagina) {
      case 'tareas':    return <MisTareas  usuario={usuario} />;
      case 'progreso':  return <Progreso   usuario={usuario} />;
      case 'actividad': return <Actividad  usuario={usuario} />;
      case 'kpis':      return <KPIs       usuario={usuario} />;
      case 'lotes':     return <LotesVista />;
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
          <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>
      <div className="dash-body">
        <SidebarEmp activePage={pagina} onNav={setPagina} />
        <main className="dash-main">{renderPage()}</main>
      </div>
    </div>
  );
}
