import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import DashboardApp from './dashboard/admin/DashboardAdmin';
import DashboardEmpleado from './dashboard/empleado/DashboardEmpleado';

const USUARIOS: Record<string, { pass: string; nombre: string; role: 'admin' | 'empleado'; lote?: string }> = {
  'admin@agri.co':     { pass: 'admin123', nombre: 'Admin General',     role: 'admin'                      },
  'empleado@agri.co':  { pass: 'emp123',   nombre: 'Juan Empleado',     role: 'empleado', lote: 'Lote A-1' },
  'empleado2@agri.co': { pass: 'emp456',   nombre: 'María Trabajadora', role: 'empleado', lote: 'Lote B-2' },
};

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            <span>Agricultura Sostenible desde 1989</span>
          </div>
          <h1 className="hero-title">AGRI<br /><span>CULTURE</span></h1>
          <p className="hero-subtitle">ES NUESTRO NEGOCIO</p>
          <p className="hero-desc">
            Tecnología avanzada para el campo. Optimizamos cada semilla para
            un futuro sostenible y productivo, conectando tradición con innovación.
          </p>
          <div className="hero-actions">
            <Link to="/contact"><button className="cta-primary">Contáctanos <span className="cta-play">▶</span></button></Link>
            <Link to="/services"><button className="cta-secondary">Nuestros Servicios</button></Link>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-img-wrap">
            <img src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=500" alt="Campo" />
          </div>
          <div className="stat-badge badge-1"><span className="num">35+</span><span className="lbl">Años de Experiencia</span></div>
          <div className="stat-badge badge-2"><span className="num">7K</span><span className="lbl">Clientes Satisfechos</span></div>
          <div className="stat-badge badge-3"><span className="num">120+</span><span className="lbl">Expertos en Campo</span></div>
        </div>
      </section>

      <div className="stats-strip">
        {[
          { num: '98%',  lbl: 'Satisfacción del Cliente' },
          { num: '500K', lbl: 'Hectáreas Gestionadas'    },
          { num: '40+',  lbl: 'Países Atendidos'         },
          { num: '18',   lbl: 'Premios Ganados'          },
        ].map((s) => (
          <div className="stat" key={s.lbl}>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <section className="gallery-section">
        <h2 className="section-heading">NUESTROS CAMPOS</h2>
        <p className="section-sub">Una muestra de la naturaleza y la tecnología trabajando juntas</p>
        <div className="gallery-grid">
          <div className="g-item tall">
            <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600" alt="Trigo" />
            <div className="g-label">Campos Dorados</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="g-item"><img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600" alt="Vegetales" /><div className="g-label">Cosecha Fresca</div></div>
            <div className="g-item"><img src="https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=600" alt="Invernadero" /><div className="g-label">Invernaderos Inteligentes</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="g-item"><img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600" alt="Tractor" /><div className="g-label">Maquinaria Moderna</div></div>
            <div className="g-item"><img src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600" alt="Aérea" /><div className="g-label">Precisión Aérea</div></div>
          </div>
        </div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <div className="inner-page">
      <h2 className="section-heading">QUIÉNES SOMOS</h2>
      <p className="section-sub">Arraigados en la tradición, creciendo con la innovación</p>
      <div className="about-grid">
        <div className="about-img"><img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800" alt="Equipo" /></div>
        <div className="about-text">
          <p>Fundada en 1989, <span className="highlight">Agriculture Co.</span> ha pasado más de tres décadas transformando la forma en que el mundo cultiva.</p>
          <p>Nuestro equipo de <span className="highlight">más de 120 especialistas</span> colaboran para crear estrategias personalizadas para cada cliente.</p>
          <p>Con presencia en más de <span className="highlight">40 países</span> y más de 7.000 clientes satisfechos.</p>
          <div style={{ marginTop: 28 }}>
            <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800" alt="Sostenible" style={{ width: '100%', borderRadius: 12, height: 180, objectFit: 'cover' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesPage() {
  const services = [
    { icon: '🌱', title: 'Optimización de Cultivos',  desc: 'Selección de semillas y estrategias basadas en datos, adaptadas a las condiciones de suelo y clima.',  color: '#4a9e2f' },
    { icon: '💧', title: 'Riego Inteligente',          desc: 'Sistemas de riego con IA que reducen el consumo de agua hasta un 40% maximizando el rendimiento.',     color: '#2980b9' },
    { icon: '🛰️', title: 'Agricultura de Precisión',  desc: 'Imágenes satelitales y drones para evaluación en tiempo real de la salud de los cultivos.',             color: '#8e44ad' },
    { icon: '🧪', title: 'Análisis de Suelo',          desc: 'Análisis de laboratorio completo para conocer los nutrientes, pH y materia orgánica del suelo.',        color: '#c0392b' },
    { icon: '📊', title: 'Pronóstico de Rendimiento',  desc: 'Analítica predictiva con machine learning para proyectar volúmenes de cosecha.',                        color: '#d35400' },
    { icon: '🌿', title: 'Prácticas Sostenibles',      desc: 'Consultoría ecológica para reducir la huella de carbono y obtener certificaciones orgánicas.',           color: '#27ae60' },
  ];
  return (
    <div className="inner-page">
      <h2 className="section-heading">NUESTROS SERVICIOS</h2>
      <p className="section-sub">Soluciones agrícolas integrales para cada necesidad</p>
      <div className="services-grid">
        {services.map((s) => (
          <div className="service-card" key={s.title}>
            <div className="service-icon" style={{ background: `${s.color}22`, border: `1px solid ${s.color}55` }}><span>{s.icon}</span></div>
            <div className="service-accent" style={{ background: s.color }} />
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <div className="service-arrow">→</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40 }}>
        <img src="https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=1200" alt="Dron" style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 14 }} />
      </div>
    </div>
  );
}

function GalleryPage() {
  const photos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600', label: 'Campos de Trigo' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600', label: 'Vegetales Frescos' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600', label: 'Tractor Moderno' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600', label: 'Vista Aérea' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=600', label: 'Invernadero Inteligente' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600', label: 'Cultivo de Girasoles' },
    { src: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600', label: 'Temporada de Cosecha' },
    { src: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=600', label: 'Inspección con Dron' },
    { src: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600', label: 'Cultivos Orgánicos' },
  ];
  return (
    <div className="inner-page">
      <h2 className="section-heading">GALERÍA</h2>
      <p className="section-sub">Momentos del campo — donde la naturaleza se une a la innovación</p>
      <div className="gallery-grid">
        {photos.map((p) => (
          <div className="g-item" key={p.label}><img src={p.src} alt={p.label} /><div className="g-label">{p.label}</div></div>
        ))}
      </div>
    </div>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSent(false), 5000);
  };
  return (
    <div className="inner-page">
      <h2 className="section-heading">CONTÁCTANOS</h2>
      <p className="section-sub">Construyamos algo grande juntos</p>
      <div className="contact-wrap">
        <div className="contact-info">
          <h3>Comunícate con nosotros</h3>
          <p>Ya seas una pequeña finca o una gran empresa agroindustrial, nuestro equipo está listo para ayudarte.</p>
          {[
            { icon: '📍', text: 'Avenida El Poblado 45-12, Medellín, Colombia' },
            { icon: '📞', text: '+57 (4) 321-456-789' },
            { icon: '✉️', text: 'hola@agriculture.co' },
            { icon: '🕐', text: 'Lun – Vie, 8:00 AM – 6:00 PM' },
          ].map((d) => (
            <div className="contact-detail" key={d.text}>
              <div className="contact-detail-icon">{d.icon}</div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{d.text}</span>
            </div>
          ))}
          <img src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=600" alt="Equipo" style={{ width: '100%', borderRadius: 12, height: 180, objectFit: 'cover', marginTop: 24 }} />
        </div>
        <div>
          <form className="contact-form-box" onSubmit={handleSubmit}>
            <input type="text" placeholder="Tu nombre completo" required />
            <input type="email" placeholder="Correo electrónico" required />
            <input type="text" placeholder="Empresa / Nombre de la finca" />
            <textarea placeholder="¿Cómo podemos ayudarte?" required />
            <button type="submit">Enviar mensaje</button>
            {sent && <div className="success-msg" style={{ display: 'block' }}>Mensaje enviado. Te responderemos en menos de 24 horas.</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = USUARIOS[email];
    if (u && u.pass === pass) {
      onSuccess(email);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3>INICIAR SESIÓN</h3>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="modal-submit">Ingresar</button>
        </form>
        {error && <div className="modal-error">Credenciales incorrectas. Intenta de nuevo.</div>}
        <div className="modal-hint">
          Admin: admin@agri.co / admin123<br />
          Empleado: empleado@agri.co / emp123
        </div>
        <button className="modal-close" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">AGRICULTURE CO.</div>
      <span>© 2026 Agriculture Co. Todos los derechos reservados.</span>
      <span>Medellín, Colombia</span>
    </footer>
  );
}

function AppContent() {
  const [modal,  setModal]  = useState(false);
  const [sesion, setSesion] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSuccess = (email: string) => {
    setSesion(email);
    setModal(false);
    const u = USUARIOS[email];
    navigate(u.role === 'admin' ? '/dashboard' : '/empleado');
  };

  const handleLogout = () => {
    setSesion(null);
    navigate('/');
  };

  if (sesion) {
    const u = USUARIOS[sesion];
    return (
      <Routes>
        <Route path="/dashboard" element={
          u.role === 'admin'
            ? <DashboardApp
                usuario={{ email: sesion, nombre: u.nombre, role: 'admin' }}
                onLogout={handleLogout}
              />
            : null
        } />
        <Route path="/empleado" element={
          u.role === 'empleado'
            ? <DashboardEmpleado
                usuario={{ email: sesion, nombre: u.nombre, role: 'empleado', lote: u.lote ?? 'Lote A-1' }}
                onLogout={handleLogout}
              />
            : null
        } />
        <Route path="*" element={
          <>
            <nav className="navbar">
              <Link to="/" className="nav-logo"><div className="nav-logo-icon">🌿</div>AGRI</Link>
              <ul className="nav-links">
                <li><Link to="/">Inicio</Link></li>
                <li><Link to="/about">Nosotros</Link></li>
                <li><Link to="/services">Servicios</Link></li>
                <li><Link to="/gallery">Galería</Link></li>
                <li><Link to="/contact">Contacto</Link></li>
              </ul>
              <div className="logged-badge">
                <span>👤 {u.nombre}</span>
                <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
              </div>
            </nav>
            <Routes>
              <Route path="/"         element={<HomePage />} />
              <Route path="/about"    element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/gallery"  element={<GalleryPage />} />
              <Route path="/contact"  element={<ContactPage />} />
            </Routes>
            <Footer />
          </>
        } />
      </Routes>
    );
  }

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-logo"><div className="nav-logo-icon">🌿</div>AGRI</Link>
        <ul className="nav-links">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/about">Nosotros</Link></li>
          <li><Link to="/services">Servicios</Link></li>
          <li><Link to="/gallery">Galería</Link></li>
          <li><Link to="/contact">Contacto</Link></li>
        </ul>
        <div className="auth-zone">
          <button onClick={() => setModal(true)}>Iniciar sesión</button>
        </div>
      </nav>

      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/about"    element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/gallery"  element={<GalleryPage />} />
        <Route path="/contact"  element={<ContactPage />} />
      </Routes>

      <Footer />

      {modal && <AuthModal onClose={() => setModal(false)} onSuccess={handleSuccess} />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
