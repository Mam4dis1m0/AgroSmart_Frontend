import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import './App.css';
import DashboardApp from './dashboard/admin/DashboardAdmin';
import DashboardEmpleado from './dashboard/empleado/DashboardEmpleado';
import { authService, Usuario } from './APis/authService';

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════ */
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

/* ─── PARTICLE BACKGROUND ───────────────────────────────── */
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = Math.floor(window.innerWidth / 15);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - p.x;
          const dy = particles[j].y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => { resize(); createParticles(); });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Navbar({ sesion, onLogout, onLogin }: { sesion: Usuario | null; onLogout: () => void; onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav 
      className={`ag-nav ${scrolled ? 'ag-nav--solid' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="ag-nav__logo">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.8 }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#22c55e"/>
            <path d="M14 6c0 0-6 4-6 9a6 6 0 0012 0c0-5-6-9-6-9z" fill="#fff" fillOpacity=".9"/>
            <path d="M14 12v8M11 16l3-4 3 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        <span>AgroSmart</span>
      </Link>

      <ul className={`ag-nav__links ${menuOpen ? 'ag-nav__links--open' : ''}`}>
        {[
          ['/', 'Inicio'], 
          ['/about', 'Nosotros'], 
          ['/services', 'Servicios'], 
          ['/gallery', 'Galería'], 
          ['/contact', 'Contacto']
        ].map(([to, label], i) => (
          <motion.li 
            key={to}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.3 }}
          >
            <Link to={to} onClick={() => setMenuOpen(false)}>{label}</Link>
          </motion.li>
        ))}
      </ul>

      <div className="ag-nav__auth">
        {sesion ? (
          <>
            <motion.span 
              className="ag-nav__user"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              👤 {sesion.nombre}
            </motion.span>
            <motion.button 
              className="ag-btn ag-btn--outline" 
              onClick={onLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Salir
            </motion.button>
          </>
        ) : (
          <motion.button 
            className="ag-btn ag-btn--primary" 
            onClick={onLogin}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34,197,94,0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Iniciar sesión
          </motion.button>
        )}
      </div>

      <button className="ag-nav__menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        <span></span><span></span><span></span>
      </button>
    </motion.nav>
  );
}

/* ─── HERO SECTION ───────────────────────────────────────── */
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  const [query, setQuery] = useState('');

  const servicios = [
    { icon: '🌱', label: 'Optimización de Cultivos', slug: 'optimizacion' },
    { icon: '💧', label: 'Riego Inteligente',         slug: 'riego'        },
    { icon: '🛰️', label: 'Agricultura de Precisión', slug: 'precision'    },
    { icon: '🧪', label: 'Análisis de Suelo',         slug: 'suelo'        },
  ];

  return (
    <section className="ag-hero" ref={ref}>
      <ParticleBackground />

      <motion.div className="ag-hero__bg" style={{ scale }}>
        <img src="/palmas-africanas.jpg" alt="Campos agrícolas" />
        <div className="ag-hero__overlay" />
        <div className="ag-hero__gradient" />
      </motion.div>

      <motion.div className="ag-hero__content" style={{ y, opacity }}>
        <motion.p 
          className="ag-hero__eyebrow"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="ag-hero__eyebrow-line" />
          Agricultura Sostenible desde 1989
          <span className="ag-hero__eyebrow-line" />
        </motion.p>

        <motion.h1 
          className="ag-hero__title"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="ag-hero__title-line">Tecnología para</span>
          <span className="ag-hero__title-line ag-hero__title-line--highlight">
            el campo colombiano
          </span>
        </motion.h1>

        <motion.p 
          className="ag-hero__sub"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Optimizamos cada proceso agrícola con datos, IA y experiencia de campo
        </motion.p>

        <motion.div 
          className="ag-search"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="ag-search__inner">
            <svg className="ag-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="ag-search__input"
              placeholder="¿Qué servicio necesitas?"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <motion.button 
              className="ag-search__btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Buscar →
            </motion.button>
          </div>

          <motion.div 
            className="ag-search__tags"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {servicios.map((s, i) => (
              <motion.button 
                key={s.slug} 
                className="ag-tag" 
                onClick={() => setQuery(s.label)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                {s.icon} {s.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          className="ag-hero__scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="ag-hero__mouse">
            <div className="ag-hero__wheel" />
          </div>
          <span>Desplázate para explorar</span>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── TRUST STRIP ────────────────────────────────────────── */
function TrustStrip() {
  const items = [
    { icon: '🏆', text: 'Mejores prácticas agronómicas' },
    { icon: '📞', text: 'Soporte 24/7 en campo' },
    { icon: '⭐', text: 'Miles de agricultores satisfechos' },
    { icon: '💵', text: 'Precios transparentes' },
  ];

  return (
    <motion.div 
      className="ag-trust"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {items.map(t => (
        <motion.div 
          key={t.text} 
          className="ag-trust__item"
          variants={fadeInUp}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <motion.span 
            className="ag-trust__icon"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {t.icon}
          </motion.span>
          <span>{t.text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── STATS SECTION ──────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { num: '35+',  lbl: 'Años de experiencia' },
    { num: '7K+',  lbl: 'Agricultores atendidos' },
    { num: '500K', lbl: 'Hectáreas gestionadas' },
    { num: '40+',  lbl: 'Países con presencia' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div 
      ref={ref}
      className="ag-stats"
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {stats.map((s, i) => (
        <motion.div 
          key={s.lbl} 
          className="ag-stats__item"
          variants={scaleIn}
          whileHover={{ y: -10, scale: 1.05 }}
          transition={{ delay: i * 0.1 }}
        >
          <motion.span 
            className="ag-stats__num"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.6, type: 'spring' }}
          >
            {s.num}
          </motion.span>
          <span className="ag-stats__lbl">{s.lbl}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── CULTIVOS SECTION ───────────────────────────────────── */
function CultivosSection() {
  const destinos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800', label: 'Campos de Trigo', tag: 'Cereales' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800', label: 'Cosecha Fresca',  tag: 'Hortalizas' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800', label: 'Maquinaria',      tag: 'Tecnología' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800', label: 'Precisión Aérea', tag: 'Drones' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=800', label: 'Invernaderos',    tag: 'Smart Farm' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800', label: 'Girasoles',       tag: 'Oleaginosas' },
  ];

  return (
    <section className="ag-section ag-section--cultivos">
      <div className="ag-section__head">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Principales cultivos
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Soluciones especializadas según tu tipo de producción
        </motion.p>
      </div>

      <motion.div 
        className="ag-cards"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {destinos.map((d, i) => (
          <motion.div
            key={d.label}
            variants={fadeInUp}
            whileHover={{ y: -15, scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/services" className="ag-card">
              <div className="ag-card__img">
                <motion.img 
                  src={d.src} 
                  alt={d.label}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                />
                <motion.span 
                  className="ag-card__tag"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {d.tag}
                </motion.span>
                <div className="ag-card__overlay" />
              </div>
              <motion.div 
                className="ag-card__label"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {d.label}
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ─── FEATURES SECTION ───────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { 
      icon: '🤖', 
      title: 'Inteligencia Artificial', 
      desc: 'Algoritmos de aprendizaje automático que analizan patrones climáticos y del suelo para optimizar rendimientos.',
      color: '#22c55e'
    },
    { 
      icon: '📡', 
      title: 'IoT en Tiempo Real', 
      desc: 'Sensores conectados que monitorean humedad, temperatura y nutrientes las 24 horas del día.',
      color: '#0284c7'
    },
    { 
      icon: '📊', 
      title: 'Análisis Predictivo', 
      desc: 'Proyecciones de cosecha basadas en datos históricos y condiciones actuales del mercado.',
      color: '#d97706'
    },
    { 
      icon: '🌿', 
      title: 'Sostenibilidad', 
      desc: 'Prácticas agrícolas que reducen el impacto ambiental y maximizan la eficiencia de recursos.',
      color: '#059669'
    },
  ];

  return (
    <section className="ag-section ag-section--features">
      <div className="ag-section__head">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Tecnología de Vanguardia
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Herramientas innovadoras para la agricultura del futuro
        </motion.p>
      </div>

      <div className="ag-features-grid">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="ag-feature-card"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.15 }}
            whileHover={{ y: -10, boxShadow: `0 20px 40px ${f.color}20` }}
          >
            <motion.div 
              className="ag-feature-card__icon"
              style={{ backgroundColor: `${f.color}15`, color: f.color }}
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              {f.icon}
            </motion.div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <motion.div 
              className="ag-feature-card__glow"
              style={{ backgroundColor: f.color }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA BANNER ─────────────────────────────────────────── */
function CTABanner() {
  return (
    <section className="ag-cta-banner">
      <div className="ag-cta-banner__bg">
        <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1400" alt="" />
        <div className="ag-cta-banner__overlay" />
      </div>
      <motion.div 
        className="ag-cta-banner__inner"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          ¿Listo para transformar tu campo?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Únete a más de 7.000 agricultores que ya confían en AgroSmart
        </motion.p>
        <motion.div 
          className="ag-cta-banner__btns"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link to="/contact">
            <motion.button 
              className="ag-btn ag-btn--white"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Contáctanos
            </motion.button>
          </Link>
          <Link to="/services">
            <motion.button 
              className="ag-btn ag-btn--ghost"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver servicios →
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── HOME ────────────────────────────────────────────────── */
function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <StatsSection />
      <CultivosSection />
      <FeaturesSection />
      <CTABanner />
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
    <motion.div 
      className="ag-modal-overlay" 
      onClick={e => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="ag-modal"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
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
        {error && <motion.div 
          className="ag-modal__error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>}
      </motion.div>
    </motion.div>
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
      <AnimatePresence>
        {modal && <AuthModal onClose={onClose} onSuccess={onSuccess} />}
      </AnimatePresence>
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