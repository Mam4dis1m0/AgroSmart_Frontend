import { useState, useRef, useEffect, createContext, useContext } from 'react';
import type { ReactElement } from 'react';
import '../../shared/styles/Dashboard.css';
import Inicio from './pages/InicioPage';
import Tareas from '../../tareas/pages/TareasPage';
import Cultivos from '../../cultivos/pages/CultivosPage';
import Lotes from '../../lotes/pages/LotesPage';
import Palmas from '../../palmas/pages/PalmasPage';
import Empleados from '../../empleados/pages/EmpleadosPage';
import Graficas from './pages/GraficasPage';
import Insumos from '../../Insumos/InsumosPage';

/* ─────────────────────────────────────────────────────────────
   TIPOS
───────────────────────────────────────────────────────────── */
export type Role = 'admin' | 'empleado';
export interface Usuario {
  email: string;
  nombre: string;
  role: Role;
}

/* ─────────────────────────────────────────────────────────────
   CONTEXTO DE PERFIL
───────────────────────────────────────────────────────────── */
interface ProfileCtx {
  foto: string | null;
  nombre: string;
  email: string;
  setFoto: (f: string | null) => void;
  setNombre: (n: string) => void;
}
export const ProfileContext = createContext<ProfileCtx>({
  foto: null, nombre: '', email: '',
  setFoto: () => {}, setNombre: () => {},
});
export const useProfile = () => useContext(ProfileContext);

/* ─────────────────────────────────────────────────────────────
   ICONOS SVG — Outline minimalista
───────────────────────────────────────────────────────────── */
const Icons: { [key: string]: ReactElement } = {
  inicio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  tareas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  cultivos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12"/><path d="M5 12C5 7 8.5 3 12 3s7 4 7 9"/><path d="M5 12c2-2 4.5-3 7-3"/>
    </svg>
  ),
  lotes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  palmas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-9"/><path d="M7 8c0-3 2-5 5-5s5 2 5 5"/><path d="M4 11c1-3 4-4 6-3"/><path d="M20 11c-1-3-4-4-6-3"/>
    </svg>
  ),
  empleados: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  graficas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  insumos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   MENÚ
───────────────────────────────────────────────────────────── */
const MENU = [
  { id: 'inicio',    label: 'Inicio'    },
  { id: 'tareas',    label: 'Tareas'    },
  { id: 'cultivos',  label: 'Cultivos'  },
  { id: 'lotes',     label: 'Lotes'     },
  { id: 'palmas',    label: 'Palmas'    },
  { id: 'empleados', label: 'Empleados' },
  { id: 'graficas',  label: 'Gráficas'  },
  { id: 'insumos',   label: 'Insumos'   },
];

/* ─────────────────────────────────────────────────────────────
   AVATAR HELPER
───────────────────────────────────────────────────────────── */
function Avatar({ size = 36, className = '' }: { size?: number; className?: string }) {
  const { foto, nombre } = useProfile();
  if (foto) {
    return (
      <img
        src={foto} alt="Avatar"
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.38,
        userSelect: 'none',
        boxShadow: '0 2px 8px rgba(27, 94, 32, 0.25)',
      }}
    >
      {nombre?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODAL CONFIGURACIÓN DE PERFIL
───────────────────────────────────────────────────────────── */
function ProfileModal({ usuario, onClose, onLogout }: {
  usuario: Usuario; onClose: () => void; onLogout: () => void;
}) {
  const { foto, nombre, setFoto, setNombre } = useProfile();
  const [tab, setTab] = useState<'perfil' | 'password'>('perfil');
  const [displayName, setDisplayName] = useState(nombre);
  const [oldPass, setOldPass]         = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg]                 = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsg({ text: 'La imagen no debe superar 2 MB', ok: false }); return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFoto(result);
      localStorage.setItem(`agrosmart_avatar_${usuario.email}`, result);
      setMsg({ text: 'Foto Actualizada Correctamente', ok: true });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFoto(null);
    localStorage.removeItem(`agrosmart_avatar_${usuario.email}`);
    setMsg({ text: 'Foto eliminada', ok: true });
  };

  const saveName = () => {
    if (!displayName.trim()) return;
    setNombre(displayName.trim());
    localStorage.setItem(`agrosmart_nombre_${usuario.email}`, displayName.trim());
    setMsg({ text: 'Nombre Actualizado Correctamente', ok: true });
  };

  const savePassword = () => {
    if (!oldPass || !newPass || !confirmPass) {
      setMsg({ text: 'Completa todos los campos', ok: false }); return;
    }
    if (newPass !== confirmPass) {
      setMsg({ text: 'Las contraseñas no coinciden', ok: false }); return;
    }
    if (newPass.length < 6) {
      setMsg({ text: 'Mínimo 6 caracteres', ok: false }); return;
    }
    setOldPass(''); setNewPass(''); setConfirmPass('');
    setMsg({ text: 'Contraseña actualizada correctamente', ok: true });
  };

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  return (
    <div className="db-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal__header">
          <h2>Mi cuenta</h2>
          <button className="db-modal__x" onClick={onClose}>✕</button>
        </div>

        <div className="db-modal__tabs">
          <button className={tab === 'perfil' ? 'active' : ''} onClick={() => setTab('perfil')}>Perfil</button>
          <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}>Contraseña</button>
        </div>

        {tab === 'perfil' && (
          <div className="db-modal__body">
            <div className="db-profile-photo">
              <div className="db-photo-ring">
                <Avatar size={90} />
                <button className="db-photo-edit" onClick={() => fileRef.current?.click()} title="Cambiar foto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <div className="db-photo-actions">
                <button className="db-btn db-btn--sm db-btn--outline" onClick={() => fileRef.current?.click()}>
                  Subir foto
                </button>
                {foto && (
                  <button className="db-btn db-btn--sm db-btn--danger" onClick={removePhoto}>
                    Eliminar
                  </button>
                )}
              </div>
              <p className="db-photo-hint">JPG, PNG · Máximo 2 MB</p>
            </div>

            <div className="db-field">
              <label>Nombre de usuario</label>
              <div className="db-field__row">
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" />
                <button className="db-btn db-btn--primary" onClick={saveName}>Guardar</button>
              </div>
            </div>

            <div className="db-field">
              <label>Correo electrónico</label>
              <input value={usuario.email} disabled />
            </div>

            <div className="db-field">
              <label>Rol</label>
              <div className="db-role-badge">
                {usuario.role === 'admin' ? 'Administrador' : 'Empleado'}
              </div>
            </div>
          </div>
        )}

        {tab === 'password' && (
          <div className="db-modal__body">
            <div className="db-field">
              <label>Contraseña actual</label>
              <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="db-field">
              <label>Nueva contraseña</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="db-field">
              <label>Confirmar nueva contraseña</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="db-btn db-btn--primary db-btn--full" onClick={savePassword}>
              Actualizar contraseña
            </button>
            <div className="db-password-rules">
              <p>La contraseña debe tener:</p>
              <ul>
                <li className={newPass.length >= 6 ? 'ok' : ''}>✓ Mínimo 6 caracteres</li>
                <li className={newPass === confirmPass && newPass ? 'ok' : ''}>✓ Las contraseñas coinciden</li>
              </ul>
            </div>
          </div>
        )}

        {msg && (
          <div className={`db-toast ${msg.ok ? 'db-toast--ok' : 'db-toast--err'}`}>{msg.text}</div>
        )}

        <div className="db-modal__footer">
          <button className="db-btn db-btn--logout" onClick={() => { onClose(); onLogout(); }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TOPBAR — Navegación superior minimalista
───────────────────────────────────────────────────────────── */
function Topbar({
  usuario, activePage, setPage, onLogout,
}: {
  usuario: Usuario;
  activePage: string;
  setPage: (id: string) => void;
  onLogout: () => void;
}) {
  const { nombre } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <>
      <header className="db-topbar">
        <div className="db-topbar__left">
          <div className="db-topbar__logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1B5E20"/>
                  <stop offset="100%" stopColor="#2E7D32"/>
                </linearGradient>
                <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1B5E20" floodOpacity="0.3"/>
                </filter>
              </defs>
              <circle cx="16" cy="16" r="14" fill="url(#logoGrad)" filter="url(#logoShadow)"/>
              <path d="M16 6s-7 5-7 10a7 7 0 0014 0c0-5-7-10-7-10z" fill="#fff" fillOpacity=".95"/>
              <path d="M16 12v9M13 17l3-4 3 4" stroke="#1B5E20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>AgroSmart</span>
          </div>

          <nav className="db-top-links">
            {MENU.map(item => (
              <button
                key={item.id}
                className={`db-top-link ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                {Icons[item.id]}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="db-topbar__right">
          <button className="db-icon-btn" title="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className="db-notif-dot" />
          </button>

          <div className="db-user-menu" ref={menuRef}>
            <button className="db-user-trigger" onClick={() => setUserMenuOpen(v => !v)}>
              <Avatar size={32} />
              <span className="db-user-name">{nombre}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {userMenuOpen && (
              <div className="db-user-dropdown">
                <div className="db-user-dropdown__info">
                  <Avatar size={44} />
                  <div>
                    <strong>{nombre}</strong>
                    <span>{usuario.email}</span>
                  </div>
                </div>
                <div className="db-user-dropdown__divider" />
                <button onClick={() => { setUserMenuOpen(false); setProfileOpen(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Mi perfil
                </button>
                <button onClick={() => { setUserMenuOpen(false); setProfileOpen(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  Configuración
                </button>
                <div className="db-user-dropdown__divider" />
                <button className="db-user-dropdown__logout" onClick={onLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {profileOpen && (
        <ProfileModal usuario={usuario} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR (modo lateral)
───────────────────────────────────────────────────────────── */
function Sidebar({ activePage, onNav }: { activePage: string; onNav: (id: string) => void }) {
  return (
    <aside className="db-sidebar">
      <div className="db-sidebar__section-label">Navegación</div>
      {MENU.map(item => (
        <button
          key={item.id}
          className={`db-sidebar__item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNav(item.id)}
        >
          <span className="db-sidebar__icon">{Icons[item.id]}</span>
          <span className="db-sidebar__label">{item.label}</span>
          {activePage === item.id && <span className="db-sidebar__dot" />}
        </button>
      ))}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD PRINCIPAL
───────────────────────────────────────────────────────────── */
export default function DashboardAdmin({
  usuario,
  onLogout,
}: {
  usuario: Usuario;
  onLogout: () => void;
}) {
  const [pagina, setPagina]   = useState('inicio');
  const navMode = 'top';

  const [foto,   setFotoState]   = useState<string | null>(() =>
    localStorage.getItem(`agrosmart_avatar_${usuario.email}`) ?? null
  );
  const [nombre, setNombreState] = useState<string>(() =>
    localStorage.getItem(`agrosmart_nombre_${usuario.email}`) ?? usuario.nombre
  );

  const setFoto   = (f: string | null) => setFotoState(f);
  const setNombre = (n: string)        => setNombreState(n);

  const renderPage = () => {
    switch (pagina) {
      case 'inicio':    return <Inicio />;
      case 'tareas':    return <Tareas />;
      case 'cultivos':  return <Cultivos />;
      case 'lotes':     return <Lotes />;
      case 'palmas':    return <Palmas />;
      case 'empleados': return <Empleados />;
      case 'graficas':  return <Graficas />;
      case 'insumos':   return <Insumos />;
      default:          return <Inicio />;
    }
  };

  return (
    <ProfileContext.Provider value={{ foto, nombre, email: usuario.email, setFoto, setNombre }}>
      <div className="db-root db-root--top">
        <Topbar
           usuario={usuario}
            activePage={pagina}
            setPage={setPagina}
            onLogout={onLogout}
        />

        <div className="db-body">
          <main className="db-main">
            <div className="db-main__inner">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </ProfileContext.Provider>
  );
}