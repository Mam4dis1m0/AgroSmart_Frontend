import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import DashboardApp from './dashboard/Dashboard';
import DashboardEmpleado from './empleado/DashboardEmpleado';

/* ─── ROLES ──────────────────────────────────── */
const ADMINS_EMAILS = ['admin@agri.co'];
const EMPLEADOS_EMAILS = ['empleado@agri.co', 'empleado2@agri.co'];

/* ─── PÁGINAS ────────────────────────────────── */
function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            <span>Sustainable Farming Since 1989</span>
          </div>
          <h1 className="hero-title">
            AGRI<br /><span>CULTURE</span>
          </h1>
          <p className="hero-subtitle">IS OUR BUSINESS</p>
          <p className="hero-desc">
            Tecnología avanzada para el campo. Optimizamos cada semilla para
            un futuro sostenible y productivo, conectando tradición con innovación.
          </p>
          <div className="hero-actions">
            <Link to="/contact">
              <button className="cta-primary">
                Contact us <span className="cta-play">▶</span>
              </button>
            </Link>
            <Link to="/services">
              <button className="cta-secondary">Our Services</button>
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=500"
              alt="Farmer"
            />
          </div>
          <div className="stat-badge badge-1">
            <span className="num">35+</span>
            <span className="lbl">Years Experience</span>
          </div>
          <div className="stat-badge badge-2">
            <span className="num">7K</span>
            <span className="lbl">Satisfied Clients</span>
          </div>
          <div className="stat-badge badge-3">
            <span className="num">120+</span>
            <span className="lbl">Expert Members</span>
          </div>
        </div>
      </section>

      <div className="carousel-dots">
        <div className="dot active" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>

      <div className="stats-strip">
        {[
          { num: '98%', lbl: 'Client Satisfaction' },
          { num: '500K', lbl: 'Hectares Managed' },
          { num: '40+', lbl: 'Countries Served' },
          { num: '18', lbl: 'Awards Won' },
        ].map((s) => (
          <div className="stat" key={s.lbl}>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <section className="gallery-section">
        <h2 className="section-heading">OUR FIELDS</h2>
        <p className="section-sub">A glimpse of nature and technology working together</p>
        <div className="gallery-grid">
          <div className="g-item tall">
            <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600" alt="Wheat field" />
            <div className="g-label">Golden Wheat Fields</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="g-item">
              <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600" alt="Fresh vegetables" />
              <div className="g-label">Fresh Harvest</div>
            </div>
            <div className="g-item">
              <img src="https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=600" alt="Greenhouse" />
              <div className="g-label">Smart Greenhouses</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="g-item">
              <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600" alt="Tractor" />
              <div className="g-label">Modern Machinery</div>
            </div>
            <div className="g-item">
              <img src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600" alt="Aerial farm" />
              <div className="g-label">Aerial Precision</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <div className="inner-page">
      <h2 className="section-heading">ABOUT US</h2>
      <p className="section-sub">Rooted in tradition, growing with innovation</p>
      <div className="about-grid">
        <div className="about-img">
          <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800" alt="Team" />
        </div>
        <div className="about-text">
          <p>
            Founded in 1989, <span className="highlight">Agriculture Co.</span> has spent over
            three decades transforming the way the world farms.
          </p>
          <p>
            Our team of <span className="highlight">120+ specialists</span> — agronomists,
            engineers, data scientists, and field experts — collaborate to create personalized
            strategies for every client.
          </p>
          <p>
            With a presence in over <span className="highlight">40 countries</span> and a
            portfolio of 7,000+ satisfied clients, we are proud to be a driving force behind
            a more food-secure, environmentally responsible world.
          </p>
          <div style={{ marginTop: 28 }}>
            <img
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800"
              alt="Sustainable farming"
              style={{ width: '100%', borderRadius: 12, height: 180, objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesPage() {
  const services = [
    { icon: '🌱', title: 'Crop Optimization', desc: 'Data-driven seed selection and planting strategies tailored to your soil and climate conditions.' },
    { icon: '💧', title: 'Smart Irrigation', desc: 'AI-powered irrigation systems that reduce water usage by up to 40% while maximizing yield.' },
    { icon: '🛰️', title: 'Precision Agriculture', desc: 'Satellite imagery and drone monitoring for real-time crop health assessment and analysis.' },
    { icon: '🧪', title: 'Soil Analysis', desc: "Comprehensive laboratory testing to understand your soil's nutrients, pH, and organic matter levels." },
    { icon: '📊', title: 'Yield Forecasting', desc: 'Predictive analytics powered by machine learning to forecast harvest volumes and plan logistics.' },
    { icon: '🌿', title: 'Sustainable Practices', desc: 'Eco-friendly consulting to reduce carbon footprint and obtain organic and sustainability certifications.' },
  ];

  return (
    <div className="inner-page">
      <h2 className="section-heading">OUR SERVICES</h2>
      <p className="section-sub">Comprehensive agricultural solutions for every need</p>
      <div className="services-grid">
        {services.map((s) => (
          <div className="service-card" key={s.title}>
            <div className="service-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40 }}>
        <img
          src="https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=1200"
          alt="Drone agriculture"
          style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 14 }}
        />
      </div>
    </div>
  );
}

function GalleryPage() {
  const photos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600', label: 'Wheat Fields' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600', label: 'Fresh Vegetables' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600', label: 'Modern Tractor' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600', label: 'Aerial View' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=600', label: 'Smart Greenhouse' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600', label: 'Sunflower Farm' },
    { src: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600', label: 'Harvest Season' },
    { src: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=600', label: 'Drone Survey' },
    { src: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600', label: 'Organic Crops' },
  ];

  return (
    <div className="inner-page">
      <h2 className="section-heading">GALLERY</h2>
      <p className="section-sub">Moments from the field — where nature meets innovation</p>
      <div className="gallery-grid">
        {photos.map((p) => (
          <div className="g-item" key={p.label}>
            <img src={p.src} alt={p.label} />
            <div className="g-label">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="inner-page">
      <h2 className="section-heading">CONTACT US</h2>
      <p className="section-sub">Let's grow something great together</p>
      <div className="contact-wrap">
        <div className="contact-info">
          <h3>Get in touch</h3>
          <p>Whether you're a small farm or a large agro-enterprise, our team is ready to help you find the right solution.</p>
          {[
            { icon: '📍', text: 'Avenida El Poblado 45-12, Medellín, Colombia' },
            { icon: '📞', text: '+57 (4) 321-456-789' },
            { icon: '✉️', text: 'hello@agriculture.co' },
            { icon: '🕐', text: 'Mon – Fri, 8:00 AM – 6:00 PM' },
          ].map((d) => (
            <div className="contact-detail" key={d.text}>
              <div className="contact-detail-icon">{d.icon}</div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{d.text}</span>
            </div>
          ))}
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=600"
            alt="Our team"
            style={{ width: '100%', borderRadius: 12, height: 180, objectFit: 'cover', marginTop: 24 }}
          />
        </div>
        <div>
          <form className="contact-form-box" onSubmit={handleSubmit}>
            <input type="text" placeholder="Your full name" required />
            <input type="email" placeholder="Email address" required />
            <input type="text" placeholder="Company / Farm name" />
            <textarea placeholder="How can we help you?" required />
            <button type="submit">Send message</button>
            {sent && (
              <div className="success-msg" style={{ display: 'block' }}>
                ✓ Message sent! We'll get back to you within 24 hours.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL ──────────────────────────────────── */
function AuthModal({
  mode,
  onClose,
  onSwitch,
  onLogin,
}: {
  mode: 'signup' | 'login';
  onClose: () => void;
  onSwitch: () => void;
  onLogin: (name: string, email: string) => void; // ✅ ahora recibe email
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const name =
      mode === 'signup'
        ? (form.elements.namedItem('name') as HTMLInputElement).value || email.split('@')[0]
        : email.split('@')[0];
    onLogin(name, email); // ✅ pasa el email para detectar el rol
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3>{mode === 'signup' ? 'SIGN UP' : 'LOG IN'}</h3>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input name="name" type="text" placeholder="Full name" />
          )}
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" required />
          {mode === 'signup' && (
            <input name="confirm" type="password" placeholder="Confirm password" required />
          )}
          <button type="submit" className="modal-submit">
            {mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>
        <div className="modal-switch">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={onSwitch}>{mode === 'signup' ? 'Log in' : 'Sign up'}</button>
        </div>
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── FOOTER COMPARTIDO ──────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">AGRICULTURE CO.</div>
      <span>© 2026 Agriculture Co. All rights reserved.</span>
      <span>Medellín, Colombia 🌿</span>
    </footer>
  );
}

/* ─── APP CONTENT ────────────────────────────── */
function AppContent() {
  const [modal, setModal] = useState<'signup' | 'login' | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  // ✅ Detecta el rol por email y redirige al dashboard correcto
  const handleLogin = (name: string, email: string) => {
    setUser(name);
    setModal(null);
    if (ADMINS_EMAILS.includes(email)) {
      navigate('/dashboard');        // → admin
    } else if (EMPLEADOS_EMAILS.includes(email)) {
      navigate('/empleado');         // → empleado
    } else {
      navigate('/dashboard');        // por defecto
    }
  };

  return (
    <>
      {/* SOCIAL SIDEBAR */}
      <aside className="social-sidebar">
        {['𝕏', 'f', 'in', '▶'].map((s) => (
          <button className="social-btn" key={s}>{s}</button>
        ))}
      </aside>

      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">🌿</div>
          AGRI
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About us</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/gallery">Gallery</Link></li>
          <li><Link to="/contact">Contact us</Link></li>
        </ul>

        {user ? (
          <div className="logged-badge">
            <span>👤 {user}</span>
            <button className="logout-btn" onClick={() => { setUser(null); navigate('/'); }}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-zone">
            <button onClick={() => setModal('signup')}>Sign up</button>
            <span className="auth-sep">|</span>
            <button onClick={() => setModal('login')}>Log in</button>
          </div>
        )}
      </nav>

      {/* ROUTES */}
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/about"     element={<AboutPage />} />
        <Route path="/services"  element={<ServicesPage />} />
        <Route path="/gallery"   element={<GalleryPage />} />
        <Route path="/contact"   element={<ContactPage />} />
        <Route path="/dashboard" element={<DashboardApp />} />
        <Route path="/empleado"  element={<DashboardEmpleado />} />
      </Routes>

      {/* FOOTER — solo en páginas del sitio principal, no en dashboards */}
      <Routes>
        <Route path="/"         element={<Footer />} />
        <Route path="/about"    element={<Footer />} />
        <Route path="/services" element={<Footer />} />
        <Route path="/gallery"  element={<Footer />} />
        <Route path="/contact"  element={<Footer />} />
      </Routes>

      {/* AUTH MODAL */}
      {modal && (
        <AuthModal
          mode={modal}
          onClose={() => setModal(null)}
          onSwitch={() => setModal(modal === 'signup' ? 'login' : 'signup')}
          onLogin={handleLogin}
        />
      )}
    </>
  );
}

/* ─── APP ROOT ───────────────────────────────── */
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}