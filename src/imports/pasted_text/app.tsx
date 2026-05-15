import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import DashboardApp from './dashboard/admin/DashboardAdmin';
import DashboardEmpleado from './dashboard/empleado/DashboardEmpleado';
import { authService, Usuario } from './APis/authService';

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Navbar({ sesion, onLogout, onLogin }: { sesion: Usuario | null; onLogout: () => void; onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`ag-nav ${scrolled ? 'ag-nav--solid' : ''}`}>
      <Link to="/" className="ag-nav__logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="#22c55e"/>
          <path d="M14 6c0 0-6 4-6 9a6 6 0 0012 0c0-5-6-9-6-9z" fill="#fff" fillOpacity=".9"/>
          <path d="M14 12v8M11 16l3-4 3 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>AgroSmart</span>
      </Link>

      <ul className="ag-nav__links">
        {[['/', 'Inicio'], ['/about', 'Nosotros'], ['/services', 'Servicios'], ['/gallery', 'Galería'], ['/contact', 'Contacto']].map(([to, label]) => (
          <li key={to}><Link to={to}>{label}</Link></li>
        ))}
      </ul>

      <div className="ag-nav__auth">
        {sesion ? (
          <>
            <span className="ag-nav__user">👤 {sesion.nombre}</span>
            <button className="ag-btn ag-btn--outline" onClick={onLogout}>Salir</button>
          </>
        ) : (
          <button className="ag-btn ag-btn--primary" onClick={onLogin}>Iniciar sesión</button>
        )}
      </div>
    </nav>
  );
}

/* ─── HOME ────────────────────────────────────────────────── */
function HomePage() {
  const [query, setQuery] = useState('');

  const servicios = [
    { icon: '🌱', label: 'Optimización de Cultivos', slug: 'optimizacion' },
    { icon: '💧', label: 'Riego Inteligente',         slug: 'riego'        },
    { icon: '🛰️', label: 'Agricultura de Precisión', slug: 'precision'    },
    { icon: '🧪', label: 'Análisis de Suelo',         slug: 'suelo'        },
  ];

  const destinos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800', label: 'Campos de Trigo', tag: 'Cereales' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800', label: 'Cosecha Fresca',  tag: 'Hortalizas' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800', label: 'Maquinaria',      tag: 'Tecnología' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800', label: 'Precisión Aérea', tag: 'Drones' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=800', label: 'Invernaderos',    tag: 'Smart Farm' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800', label: 'Girasoles',       tag: 'Oleaginosas' },
  ];

  return (
    <>
      {/* HERO */}
      <section className="ag-hero">
        <div className="ag-hero__bg">
          <img src="/palmas-africanas.jpg" alt="Campos agrícolas" />
          <div className="ag-hero__overlay" />
        </div>

        <div className="ag-hero__content">
          <p className="ag-hero__eyebrow">Agricultura Sostenible desde 1989</p>
          <h1 className="ag-hero__title">Tecnología para<br />el campo colombiano</h1>
          <p className="ag-hero__sub">Optimizamos cada proceso agrícola con datos, IA y experiencia de campo</p>

          {/* BUSCADOR */}
          <div className="ag-search">
            <div className="ag-search__inner">
              <svg className="ag-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                className="ag-search__input"
                placeholder="¿Qué servicio necesitas?"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button className="ag-search__btn">Buscar →</button>
            </div>

            <div className="ag-search__tags">
              {servicios.map(s => (
                <button key={s.slug} className="ag-tag" onClick={() => setQuery(s.label)}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className="ag-trust">
          {[
            { icon: '🏆', text: 'Mejores prácticas agronómicas' },
            { icon: '📞', text: 'Soporte 24/7 en campo' },
            { icon: '⭐', text: 'Miles de agricultores satisfechos' },
            { icon: '💵', text: 'Precios transparentes' },
          ].map(t => (
            <div key={t.text} className="ag-trust__item">
              <span>{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <div className="ag-stats">
        {[
          { num: '35+',  lbl: 'Años de experiencia' },
          { num: '7K+',  lbl: 'Agricultores atendidos' },
          { num: '500K', lbl: 'Hectáreas gestionadas' },
          { num: '40+',  lbl: 'Países con presencia' },
        ].map(s => (
          <div key={s.lbl} className="ag-stats__item">
            <span className="ag-stats__num">{s.num}</span>
            <span className="ag-stats__lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* PRINCIPALES CULTIVOS */}
      <section className="ag-section">
        <div className="ag-section__head">
          <h2>Principales cultivos</h2>
          <p>Soluciones especializadas según tu tipo de producción</p>
        </div>
        <div className="ag-cards">
          {destinos.map(d => (
            <Link to="/services" key={d.label} className="ag-card">
              <div className="ag-card__img">
                <img src={d.src} alt={d.label} />
                <span className="ag-card__tag">{d.tag}</span>
              </div>
              <div className="ag-card__label">{d.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="ag-cta-banner">
        <div className="ag-cta-banner__inner">
          <h2>¿Listo para transformar tu campo?</h2>
          <p>Únete a más de 7.000 agricultores que ya confían en AgroSmart</p>
          <div className="ag-cta-banner__btns">
            <Link to="/contact"><button className="ag-btn ag-btn--white">Contáctanos</button></Link>
            <Link to="/services"><button className="ag-btn ag-btn--ghost">Ver servicios →</button></Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── ABOUT ───────────────────────────────────────────────── */
function AboutPage() {
  return (
    <div className="ag-inner">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay"/>
        <div className="ag-page-hero__text">
          <h1>Quiénes somos</h1>
          <p>Arraigados en la tradición, creciendo con la innovación</p>
        </div>
      </div>
      <div className="ag-about-grid">
        <div className="ag-about-text">
          <p>Fundada en 1989, <strong>AgroSmart</strong> ha pasado más de tres décadas transformando la forma en que el mundo cultiva.</p>
          <p>Nuestro equipo de <strong>más de 120 especialistas</strong> colaboran para crear estrategias personalizadas para cada cliente.</p>
          <p>Con presencia en más de <strong>40 países</strong> y más de 7.000 clientes satisfechos, somos el aliado tecnológico del campo colombiano.</p>
        </div>
        <div className="ag-about-img">
          <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800" alt="Sostenible"/>
        </div>
      </div>
    </div>
  );
}

/* ─── SERVICES ────────────────────────────────────────────── */
function ServicesPage() {
  const services = [
    { icon: '🌱', title: 'Optimización de Cultivos',  desc: 'Selección de semillas y estrategias basadas en datos, adaptadas a las condiciones de suelo y clima.',  color: '#16a34a' },
    { icon: '💧', title: 'Riego Inteligente',          desc: 'Sistemas de riego con IA que reducen el consumo de agua hasta un 40% maximizando el rendimiento.',     color: '#0284c7' },
    { icon: '🛰️', title: 'Agricultura de Precisión',  desc: 'Imágenes satelitales y drones para evaluación en tiempo real de la salud de los cultivos.',             color: '#7c3aed' },
    { icon: '🧪', title: 'Análisis de Suelo',          desc: 'Análisis de laboratorio completo para conocer los nutrientes, pH y materia orgánica del suelo.',        color: '#b91c1c' },
    { icon: '📊', title: 'Pronóstico de Rendimiento',  desc: 'Analítica predictiva con machine learning para proyectar volúmenes de cosecha.',                        color: '#d97706' },
    { icon: '🌿', title: 'Prácticas Sostenibles',      desc: 'Consultoría ecológica para reducir la huella de carbono y obtener certificaciones orgánicas.',           color: '#059669' },
  ];
  return (
    <div className="ag-inner">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay"/>
        <div className="ag-page-hero__text">
          <h1>Nuestros servicios</h1>
          <p>Soluciones agrícolas integrales para cada necesidad</p>
        </div>
      </div>
      <div className="ag-services-grid">
        {services.map(s => (
          <div className="ag-service-card" key={s.title} style={{ '--accent': s.color } as any}>
            <span className="ag-service-card__icon">{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <span className="ag-service-card__arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── GALLERY ─────────────────────────────────────────────── */
function GalleryPage() {
  const photos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600', label: 'Campos de Trigo' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600', label: 'Vegetales Frescos' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600', label: 'Tractor Moderno' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600', label: 'Vista Aérea' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=600', label: 'Invernadero Inteligente' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600', label: 'Girasoles' },
    { src: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600', label: 'Cosecha' },
    { src: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=600', label: 'Dron en Campo' },
    { src: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600', label: 'Cultivos Orgánicos' },
  ];
  return (
    <div className="ag-inner">
      <div className="ag-section__head" style={{ padding: '3rem 2rem 1rem' }}>
        <h2>Galería</h2>
        <p>Momentos del campo — donde la naturaleza se une a la innovación</p>
      </div>
      <div className="ag-gallery-grid">
        {photos.map(p => (
          <div className="ag-gallery-item" key={p.label}>
            <img src={p.src} alt={p.label}/>
            <div className="ag-gallery-item__label">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CONTACT ─────────────────────────────────────────────── */
function ContactPage() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSent(false), 5000);
  };
  return (
    <div className="ag-inner">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay"/>
        <div className="ag-page-hero__text">
          <h1>Contáctanos</h1>
          <p>Construyamos algo grande juntos</p>
        </div>
      </div>

      <div className="ag-contact-grid">
        <div className="ag-contact-info">
          <h3>Comunícate con nosotros</h3>
          <p>Ya seas una pequeña finca o una gran agroindustria, estamos listos para ayudarte.</p>
          {[
            { icon: '📍', text: 'Universidad Popular del Cesar' },
            { icon: '📞', text: '+57 (4) 321-456-789' },
            { icon: '✉️', text: 'hola@agrosmart.co' },
            { icon: '🕐', text: 'Lun – Vie, 8:00 AM – 6:00 PM' },
          ].map(d => (
            <div className="ag-contact-detail" key={d.text}>
              <span className="ag-contact-detail__icon">{d.icon}</span>
              <span>{d.text}</span>
            </div>
          ))}
        </div>

        <form className="ag-contact-form" onSubmit={handleSubmit}>
          <h3>Envíanos un mensaje</h3>
          <input type="text"  placeholder="Tu nombre completo" required />
          <input type="email" placeholder="Correo electrónico"  required />
          <input type="text"  placeholder="Empresa / Nombre de la finca" />
          <textarea placeholder="¿Cómo podemos ayudarte?" required />
          <button type="submit" className="ag-btn ag-btn--primary ag-btn--full">Enviar mensaje</button>
          {sent && <div className="ag-success">✅ Mensaje enviado. Te responderemos en menos de 24 horas.</div>}
        </form>
      </div>
    </div>
  );
}

/* ─── AUTH MODAL ──────────────────────────────────────────── */
function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (u: Usuario) => void }) {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await authService.login(email, pass);
      onSuccess(response.usuario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
      setTimeout(() => setError(''), 3000);
    } finally { setLoading(false); }
  };

  return (
    <div className="ag-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ag-modal">
        <button className="ag-modal__close" onClick={onClose}>✕</button>
        <div className="ag-modal__logo">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#22c55e"/>
            <path d="M14 6c0 0-6 4-6 9a6 6 0 0012 0c0-5-6-9-6-9z" fill="#fff" fillOpacity=".9"/>
          </svg>
          <span>AgroSmart</span>
        </div>
        <h3>Bienvenido de vuelta</h3>
        <p className="ag-modal__sub">Ingresa tus credenciales para continuar</p>
        <form onSubmit={handleSubmit}>
          <input type="email"    placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
          <input type="password" placeholder="Contraseña"         value={pass}  onChange={e => setPass(e.target.value)}  required disabled={loading} />
          <button type="submit" className="ag-btn ag-btn--primary ag-btn--full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        {error && <div className="ag-modal__error">{error}</div>}
      </div>
    </div>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="ag-footer">
      <div className="ag-footer__inner">
        <div className="ag-footer__brand">
          <span className="ag-footer__logo">🌿 AgroSmart</span>
          <p>Tecnología avanzada para el campo colombiano. Optimizamos cada semilla para un futuro sostenible.</p>
        </div>
        <div className="ag-footer__links">
          <strong>Empresa</strong>
          <Link to="/about">Nosotros</Link>
          <Link to="/services">Servicios</Link>
          <Link to="/gallery">Galería</Link>
          <Link to="/contact">Contacto</Link>
        </div>
        <div className="ag-footer__links">
          <strong>Servicios</strong>
          <a href="#">Riego Inteligente</a>
          <a href="#">Análisis de Suelo</a>
          <a href="#">Drones Agrícolas</a>
          <a href="#">Consultoría</a>
        </div>
        <div className="ag-footer__links">
          <strong>Contacto</strong>
          <span>📍 Valledupar, Colombia</span>
          <span>📞 +57 321-456-789</span>
          <span>✉️ hola@agrosmart.co</span>
        </div>
      </div>
      <div className="ag-footer__bottom">
        © 2026 AgroSmart. Todos los derechos reservados.
      </div>
    </footer>
  );
}

/* ─── LAYOUT WRAPPER ──────────────────────────────────────── */
function WithLayout({ children, sesion, onLogout, onLogin, modal, onClose, onSuccess }: any) {
  return (
    <>
      <Navbar sesion={sesion} onLogout={onLogout} onLogin={onLogin} />
      {children}
      <Footer />
      {modal && <AuthModal onClose={onClose} onSuccess={onSuccess} />}
    </>
  );
}

/* ─── APP CONTENT ─────────────────────────────────────────── */
function AppContent() {
  const [modal,   setModal]   = useState(false);
  const [sesion,  setSesion]  = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = authService.getUsuario();
    setSesion(usuario);
    setLoading(false);
    if (usuario) navigate(usuario.role === 'admin' ? '/dashboard' : '/empleado');
  }, [navigate]);

  const handleSuccess = (usuario: Usuario) => {
    setSesion(usuario); setModal(false);
    navigate(usuario.role === 'admin' ? '/dashboard' : '/empleado');
  };
  const handleLogout = () => { authService.logout(); setSesion(null); navigate('/'); };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>;

  const layoutProps = {
    sesion, onLogout: handleLogout, onLogin: () => setModal(true),
    modal, onClose: () => setModal(false), onSuccess: handleSuccess,
  };

  return (
    <Routes>
      {sesion?.role === 'admin' && (
        <Route path="/dashboard" element={
          <DashboardApp usuario={{ email: sesion.email, nombre: sesion.nombre, role: 'admin' }} onLogout={handleLogout} />
        } />
      )}
      {sesion?.role === 'empleado' && (
        <Route path="/empleado" element={
          <DashboardEmpleado usuario={{ email: sesion.email, nombre: sesion.nombre, role: 'empleado', lote: 'Lote Asignado' }} onLogout={handleLogout} />
        } />
      )}
      <Route path="/"        element={<WithLayout {...layoutProps}><HomePage /></WithLayout>} />
      <Route path="/about"   element={<WithLayout {...layoutProps}><AboutPage /></WithLayout>} />
      <Route path="/services"element={<WithLayout {...layoutProps}><ServicesPage /></WithLayout>} />
      <Route path="/gallery" element={<WithLayout {...layoutProps}><GalleryPage /></WithLayout>} />
      <Route path="/contact" element={<WithLayout {...layoutProps}><ContactPage /></WithLayout>} />
    </Routes>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}

este es mi pagina de inicio , quisiera : Quiero rediseñar la página de inicio de mi sistema web para que se vea moderna, dinámica e interactiva visualmente.
La página debe transmitir tecnología, innovación y una experiencia fluida mientras el usuario hace scroll.

Objetivo visual

No quiero una página estática como una imagen.
Quiero una landing page dinámica donde los elementos tengan movimiento suave y elegante al hacer scroll.

Estilo deseado
Diseño moderno y profesional
Animaciones suaves tipo Apple, Tesla o páginas SaaS modernas
Sensación futurista y tecnológica
Interfaz limpia, minimalista y visualmente impactante
Efectos de profundidad y movimiento
Comportamiento al hacer scroll

Mientras el usuario baja:

Los elementos deben aparecer con animaciones suaves (fade, slide, zoom)
Algunas secciones deben tener efecto parallax
El fondo puede moverse lentamente
Imágenes o ilustraciones pueden reaccionar al scroll
Las tarjetas deben tener hover animations
Transiciones fluidas entre secciones
Sensación inmersiva y viva
Hero section

Al entrar a la página quiero:

Una imagen o video dinámico relacionado con palma de aceite y tecnología
Texto principal grande e impactante
Botones modernos con animaciones
Fondo con gradientes suaves y partículas/líneas animadas
Posible efecto de iluminación o glassmorphism
Paleta de colores inicial

Mantener y mejorar esta línea visual:

Verde palma oscuro
Verde natural
Tonos tierra
Negro elegante
Blanco limpio
Detalles en dorado suave o verde neón tecnológico

solamente modifica ese codigo