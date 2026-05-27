import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import './App.css';
import DashboardApp from './dashboard/admin/DashboardAdmin';
import DashboardEmpleado from './dashboard/empleado/DashboardEmpleado';
import { authService } from './APis/authService';
import type { Usuario } from './APis/authService';

// ------------------------------------------------------------------
// ANIMATION VARIANTS
// ------------------------------------------------------------------
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
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
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } }
};

// ------------------------------------------------------------------
// PARTICLE BACKGROUND (floating green particles)
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// FLOATING LEAVES (decorativas alrededor del hero)
// ------------------------------------------------------------------
function FloatingLeaves() {
  const leaves = [
    { x: '5%', y: '20%', delay: 0, duration: 6, rotate: -15 },
    { x: '85%', y: '15%', delay: 1, duration: 8, rotate: 10 },
    { x: '10%', y: '70%', delay: 2, duration: 7, rotate: 20 },
    { x: '90%', y: '65%', delay: 0.5, duration: 9, rotate: -10 },
    { x: '50%', y: '85%', delay: 1.5, duration: 5, rotate: 5 },
    { x: '20%', y: '40%', delay: 2.5, duration: 7.5, rotate: -5 },
    { x: '75%', y: '45%', delay: 0.8, duration: 6.5, rotate: 15 },
  ];

  return (
    <>
      {leaves.map((leaf, i) => (
        <motion.div
          key={i}
          className="floating-leaf-svg"
          initial={{ x: leaf.x, y: leaf.y, rotate: leaf.rotate, opacity: 0 }}
          animate={{
            y: [leaf.y, `calc(${leaf.y} - 40px)`, leaf.y],
            rotate: [leaf.rotate, leaf.rotate + 15, leaf.rotate],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ left: leaf.x, top: leaf.y }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            <path d="M12 22V12" />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

// ------------------------------------------------------------------
// NAVBAR
// ------------------------------------------------------------------
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
      transition={{ duration: 0.6 }}
    >
      <Link to="/" className="ag-nav__logo">
        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#22c55e" />
            <path d="M14 6c0 0-6 4-6 9a6 6 0 0012 0c0-5-6-9-6-9z" fill="#fff" fillOpacity=".9" />
            <path d="M14 12v8M11 16l3-4 3 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
            <motion.span className="ag-nav__user" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              👤 {sesion.nombre}
            </motion.span>
            <motion.button className="ag-btn ag-btn--outline" onClick={onLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Salir
            </motion.button>
          </>
        ) : (
          <motion.button className="ag-btn ag-btn--primary" onClick={onLogin} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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

// ------------------------------------------------------------------
// HERO SECTION (con hojas flotantes y título enorme)
// ------------------------------------------------------------------
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.05]);

  const scrollToNext = () => {
    const nextSection = document.getElementById('problem-solution');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="ag-hero" ref={ref}>
      <ParticleBackground />
      <FloatingLeaves />

      <motion.div className="ag-hero__bg" style={{ scale }}>
        <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1600&h=900" alt="Campos agrícolas" />
        <div className="ag-hero__overlay" />
        <div className="ag-hero__gradient" />
      </motion.div>

      <motion.div className="ag-hero__content" style={{ y, opacity }}>
        <motion.h1
          className="ag-hero__title ag-hero__title--centered"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 0.4 }}
        >
          <span className="ag-hero__title-line ag-hero__title-line--highlight">AGROSMART</span>
        </motion.h1>
        <motion.p
          className="ag-hero__sub"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Gestión inteligente para tu producción agrícola
        </motion.p>
        <motion.p
          className="ag-hero__desc"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Digitaliza tus cultivos, optimiza tareas, controla insumos y cosechas con tecnología de punta.
          Toma decisiones basadas en datos reales.
        </motion.p>

        {/* Botón Conoce más */}
        <motion.button
          className="ag-hero__cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          whileHover={{ scale: 1.05, y: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToNext}
        >
          <span>Conoce más</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.button>
      </motion.div>
    </section>
  );
}
// ------------------------------------------------------------------
// PROBLEMA / SOLUCIÓN (basado en la documentación)
// ------------------------------------------------------------------
function ProblemSolution() {
  const ref = useRef(null);

  return (
    <section id="problem-solution" ref={ref} className="ag-problem-solution">
      <div className="ag-section__head">
        <h2>El desafío agrícola</h2>
        <p>¿Por qué AgroSmart es la solución que estabas buscando?</p>
      </div>

      <div className="ag-ps-grid">
        <div className="ag-ps-card ag-ps-card--problem">
          <div className="ag-ps-icon">⚠️</div>
          <h3>Problemas actuales</h3>
          <ul>
            <li>• Gestión manual con cuadernos → pérdida de información crítica</li>
            <li>• Sin alertas tempranas de plagas o enfermedades</li>
            <li>• Inventario de insumos sin control → desabastecimiento</li>
            <li>• Dificultad para planificar cosechas y calcular costos</li>
          </ul>
        </div>

        <div className="ag-ps-card ag-ps-card--solution">
          <div className="ag-ps-icon">✅</div>
          <h3>Solución AgroSmart</h3>
          <ul>
            <li>✓ Centralización digital de cultivos, tareas e insumos</li>
            <li>✓ Alertas automáticas de stock bajo y cosecha próxima</li>
            <li>✓ Generación de reportes y KPIs en tiempo real</li>
            <li>✓ Asignación de tareas a empleados + control de horas trabajadas</li>
          </ul>
        </div>
      </div>

      <div className="ag-ps-stats">
        {[
          { value: '+40%', label: 'Productividad' },
          { value: '-30%', label: 'Tiempos muertos' },
          { value: '100%', label: 'Control de inventario' },
          { value: '24/7', label: 'Monitoreo' },
        ].map((stat) => (
           <div key={stat.label} className="ag-ps-stat">
            <span className="ag-ps-stat-value">{stat.value}</span>
            <span className="ag-ps-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// TRUST STRIP (confianza)
// ------------------------------------------------------------------
function TrustStrip() {
  const items = [
    { icon: '🌱', text: 'Agricultura sostenible' },
    { icon: '📊', text: 'Decisiones basadas en datos' },
    { icon: '⭐', text: 'Miles de agricultores confían' },
    { icon: '💡', text: 'Innovación constante' },
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
        <motion.div key={t.text} className="ag-trust__item" variants={fadeInUp} whileHover={{ y: -5, scale: 1.02 }}>
          <motion.span className="ag-trust__icon" whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
            {t.icon}
          </motion.span>
          <span>{t.text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ------------------------------------------------------------------
// STATS SECTION
// ------------------------------------------------------------------
function StatsSection() {
  const stats = [
    { num: '35+', lbl: 'Años de experiencia' },
    { num: '7K+', lbl: 'Agricultores atendidos' },
    { num: '500K', lbl: 'Hectáreas gestionadas' },
    { num: '40+', lbl: 'Países con presencia' },
  ];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div ref={ref} className="ag-stats" variants={staggerContainer} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
      {stats.map((s, i) => (
        <motion.div key={s.lbl} className="ag-stats__item" variants={scaleIn} whileHover={{ y: -10, scale: 1.05 }}>
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

// ------------------------------------------------------------------
// CULTIVOS SECTION (imágenes originales)
// ------------------------------------------------------------------
function CultivosSection() {
  const destinos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800', label: 'Campos de Trigo', tag: 'Cereales', icon: '🌾' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800', label: 'Cosecha Fresca', tag: 'Hortalizas', icon: '🥬' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800', label: 'Maquinaria Moderna', tag: 'Tecnología', icon: '🚜' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800', label: 'Precisión Aérea', tag: 'Drones', icon: '✈️' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=800', label: 'Invernaderos Inteligentes', tag: 'Smart Farm', icon: '🌿' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800', label: 'Cultivo de Girasoles', tag: 'Oleaginosas', icon: '🌻' },
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
          Pasa el mouse sobre cada imagen para ver más detalles
        </motion.p>
      </div>

      <div className="ag-cards-horizontal">
        {destinos.map((d, i) => (
          <motion.div
            key={d.label}
            className="ag-card-expanding"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="ag-card-expanding__img">
              <img src={d.src} alt={d.label} loading="lazy" />
              <div className="ag-card-expanding__overlay" />
              <span className="ag-card-expanding__tag">{d.tag}</span>
              <div className="ag-card-expanding__label">
                {d.label}
              </div>
              <div className="ag-card-expanding__badge">
                {d.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// FEATURES SECTION
// ------------------------------------------------------------------
function FeaturesSection() {
  const features = [
    { icon: '📋', title: 'Gestión de Tareas', desc: 'Asigna actividades a empleados, monitorea avances y registra horas trabajadas.', color: '#22c55e' },
    { icon: '📦', title: 'Control de Insumos', desc: 'Inventario con alertas automáticas de stock mínimo para fertilizantes y herbicidas.', color: '#0284c7' },
    { icon: '📊', title: 'KPIs y Reportes', desc: 'Visualiza costos por cultivo, productividad y rendimiento de cosecha.', color: '#d97706' },
    { icon: '🔔', title: 'Alertas Inteligentes', desc: 'Notificaciones de cosecha próxima, tareas vencidas y niveles críticos.', color: '#059669' },
  ];

  return (
    <section className="ag-section ag-section--features">
      <div className="ag-section__head">
        <motion.h2 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          Tecnología de Vanguardia
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}>
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
            <motion.div className="ag-feature-card__icon" style={{ backgroundColor: `${f.color}15`, color: f.color }} whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
              {f.icon}
            </motion.div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <motion.div className="ag-feature-card__glow" style={{ backgroundColor: f.color }} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// CTA BANNER
// ------------------------------------------------------------------
function CTABanner() {
  return (
    <section className="ag-cta-banner">
      <div className="ag-cta-banner__bg">
        <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1400" alt="" />
        <div className="ag-cta-banner__overlay" />
      </div>
      <motion.div className="ag-cta-banner__inner" initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          ¿Listo para transformar tu campo?
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          Únete a más de 7.000 agricultores que ya confían en AgroSmart
        </motion.p>
        <motion.div className="ag-cta-banner__btns" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <Link to="/contact"><motion.button className="ag-btn ag-btn--white" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Contáctanos</motion.button></Link>
          <Link to="/services"><motion.button className="ag-btn ag-btn--ghost" whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}>Ver servicios →</motion.button></Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ------------------------------------------------------------------
// HOME PAGE
// ------------------------------------------------------------------
function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSolution />
      
      {/* SECCIÓN OFFLINE FIRST - CON ANIMACIONES  */}
      <motion.section 
        className="ag-offline-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="ag-offline-grid">
          <motion.div 
            className="ag-offline-content"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.span 
              className="ag-offline-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Modo Offline
            </motion.span>
            <h2>Tu campo, siempre conectado <span>incluso sin internet</span></h2>
            <p>Sabemos que en zonas rurales la señal falla. Por eso AgroSmart fue construido desde cero para funcionar sin conexión. Tomas notas, asignas tareas, controlas inventario... y cuando vuelves a tener señal, todo se sincroniza automáticamente.</p>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="ag-offline-feature">
                <span className="check">✓</span> 
                <span><strong>Sincronización inteligente</strong> — Trabaja offline, sincroniza cuando recuperes datos móviles o wifi</span>
              </div>
              <div className="ag-offline-feature">
                <span className="check">✓</span> 
                <span><strong>Alertas automáticas por email</strong> — Nosotros enviamos los reportes de stock bajo, tareas vencidas y cosechas próximas. Tú solo preocúpate de cultivar.</span>
              </div>
              <div className="ag-offline-feature">
                <span className="check">✓</span> 
                <span><strong>Cero pérdida de datos</strong> — Tu información se guarda localmente y se respalda en la nube cuando hay conexión.</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="ag-offline-visual"
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <motion.div 
              className="icon"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              📡
            </motion.div>
            <h3>Modo <strong style={{ color: '#22c55e' }}>Offline</strong> activado</h3>
            <p>Sigue trabajando aunque no tengas señal. Tus datos están seguros en tu dispositivo hasta que se sincronicen.</p>
            <div className="ag-offline-tags">
              <span className="ag-offline-tag">📱 App offline</span>
              <span className="ag-offline-tag">🔄 Sincronización automática</span>
              <span className="ag-offline-tag">📧 Alertas por email</span>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      <TrustStrip />
      <StatsSection />
      <CultivosSection />
      <FeaturesSection />
      <CTABanner />
    </>
  );
}

// ------------------------------------------------------------------
// ABOUT PAGE (mejorada con tarjetas y estructura)
// ------------------------------------------------------------------
function AboutPage() {
  return (
    <div className="ag-inner-page">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay" />
        <div className="ag-page-hero__text">
          <h1>Quiénes somos</h1>
          <p>Arraigados en la tradición, creciendo con innovación</p>
        </div>
      </div>

      <div className="ag-page-content">
        <div className="ag-about-cards">
          <motion.div 
            className="ag-about-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="ag-about-icon">🌱</span>
            <h3>Misión</h3>
            <p>Empoderar a los productores agrícolas con tecnología accesible que optimice sus recursos y aumente su rentabilidad sostenible, incluso en zonas remotas.</p>
          </motion.div>
          <motion.div 
            className="ag-about-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="ag-about-icon">🔭</span>
            <h3>Visión</h3>
            <p>Ser la plataforma líder en gestión agrícola inteligente de Latinoamérica, transformando el campo con IA, datos en tiempo real y tecnología offline-first.</p>
          </motion.div>
          <motion.div 
            className="ag-about-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="ag-about-icon">⭐</span>
            <h3>Valores</h3>
            <p>Innovación, sostenibilidad, transparencia y compromiso con el agricultor colombiano. La tecnología debe adaptarse al campo, no al revés.</p>
          </motion.div>
        </div>

        <div className="ag-about-team">
          <h2>Nuestro equipo</h2>
          <p>Más de 120 especialistas entre ingenieros agrónomos, desarrolladores y expertos en IA trabajando para ti.</p>
          <div className="ag-team-grid">
            <motion.div 
              className="ag-team-member"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Fundador" />
              <h4>Juan Pérez</h4>
              <span>CEO & Fundador</span>
            </motion.div>
            <motion.div 
              className="ag-team-member"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Agrónoma" />
              <h4>María Gómez</h4>
              <span>Directora Agronómica</span>
            </motion.div>
            <motion.div 
              className="ag-team-member"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="CTO" />
              <h4>Carlos López</h4>
              <span>CTO</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// SERVICES PAGE (servicios reales de AgroSmart)
// ------------------------------------------------------------------
function ServicesPage() {
  const services = [
    { icon: '🌱', title: 'Gestión de Cultivos', desc: 'Registra lotes, fechas de siembra, cosecha estimada y asigna responsables. Todo sincronizado cuando tengas señal.' },
    { icon: '✅', title: 'Control de Tareas', desc: 'Crea tareas agrícolas, asígnalas a empleados y monitorea avances y horas trabajadas, incluso sin internet.' },
    { icon: '📦', title: 'Inventario de Insumos', desc: 'Control de fertilizantes, herbicidas con alertas automáticas de stock bajo. Funciona offline y se sincroniza después.' },
    { icon: '📅', title: 'Registro de Cosechas', desc: 'Historial de producción por lote y alertas de cosecha próxima. Tus datos siempre seguros.' },
    { icon: '📊', title: 'Reportes y KPIs', desc: 'Visualiza costos, productividad, eficiencia de tareas en tiempo real cuando recuperes conectividad.' },
    { icon: '🔔', title: 'Alertas Automáticas', desc: 'Notificaciones por stock mínimo, fechas críticas y tareas atrasadas. Nosotros enviamos los emails automáticamente.' },
  ];
  
  return (
    <div className="ag-inner-page">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay" />
        <div className="ag-page-hero__text">
          <h1>Nuestros servicios</h1>
          <p>Soluciones agrícolas integrales que funcionan CON o SIN internet</p>
        </div>
      </div>
      
      <div className="ag-page-content">
        <div className="ag-services-grid">
          {services.map((s, idx) => (
            <motion.div 
              className="ag-service-card" 
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <span className="ag-service-card__icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="ag-service-card__arrow">Explorar →</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// GALLERY PAGE (imágenes originales)
// ------------------------------------------------------------------
function GalleryPage() {
  const photos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800', label: 'Campos de Trigo', icon: '🌾' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800', label: 'Vegetales Frescos', icon: '🥬' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800', label: 'Tractor Moderno', icon: '🚜' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800', label: 'Vista Aérea con Drone', icon: '✈️' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=800', label: 'Invernadero Inteligente', icon: '🌿' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800', label: 'Girasoles', icon: '🌻' },
    { src: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800', label: 'Cosecha', icon: '🌽' },
    { src: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?q=80&w=800', label: 'Dron en Campo', icon: '📡' },
    { src: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=800', label: 'Cultivos Orgánicos', icon: '🍅' },
  ];
  
  return (
    <div className="ag-inner-page">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay" />
        <div className="ag-page-hero__text">
          <h1>Galería</h1>
          <p>Momentos del campo — donde la naturaleza se une a la innovación</p>
        </div>
      </div>
      
      <div className="ag-gallery-expanding-section">
        <div className="ag-gallery-header">
          <h2>Nuestro mundo agrícola</h2>
          <p>Pasa el mouse sobre cada imagen para explorar</p>
        </div>
        
        <div className="ag-gallery-horizontal">
          {photos.map((p, idx) => (
            <motion.div
              key={p.label}
              className="ag-gallery-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <div className="ag-gallery-card__img">
                <img src={p.src} alt={p.label} loading="lazy" />
                <div className="ag-gallery-card__overlay" />
                <div className="ag-gallery-card__label">{p.label}</div>
                <div className="ag-gallery-card__icon">{p.icon}</div>
                <div className="ag-gallery-card__counter">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// CONTACT PAGE (estructura limpia)
// ------------------------------------------------------------------
function ContactPage() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSent(false), 5000);
  };
  
  return (
    <div className="ag-inner-page">
      <div className="ag-page-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1400)' }}>
        <div className="ag-page-hero__overlay" />
        <div className="ag-page-hero__text">
          <h1>Contáctanos</h1>
          <p>Estamos listos para ayudarte a transformar tu campo</p>
        </div>
      </div>
      
      <div className="ag-page-content">
        <div className="ag-contact-grid">
          <motion.div 
            className="ag-contact-info"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3>¿Hablamos?</h3>
            <p>Ya sea que tengas 1 hectárea o 10,000, tenemos una solución para ti. Déjanos tus datos y uno de nuestros asesores te contactará.</p>
            <div className="ag-contact-details">
              <div className="ag-contact-detail"><span className="ag-contact-icon">📍</span> Calle 15 # 8-45, Valledupar, Cesar</div>
              <div className="ag-contact-detail"><span className="ag-contact-icon">📞</span> +57 (5) 321 456 7890</div>
              <div className="ag-contact-detail"><span className="ag-contact-icon">✉️</span> hola@agrosmart.co</div>
              <div className="ag-contact-detail"><span className="ag-contact-icon">🕐</span> Lun – Vie, 8:00 AM – 6:00 PM</div>
            </div>
            <div className="ag-contact-map">
              <iframe
                title="mapa"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-73.235%2C10.41%2C-73.155%2C10.46&layer=mapnik&marker=10.435%2C-73.195"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: '16px' }}
                allowFullScreen
              />
            </div>
          </motion.div>

          <motion.form 
            className="ag-contact-form" 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3>Envíanos un mensaje</h3>
            <input type="text" placeholder="Tu nombre completo" required />
            <input type="email" placeholder="Correo electrónico" required />
            <input type="text" placeholder="Empresa / Nombre de la finca" />
            <textarea placeholder="¿Cómo podemos ayudarte?" rows={5} required />
            <button type="submit" className="ag-btn ag-btn--primary ag-btn--full">Enviar mensaje</button>
            {sent && <div className="ag-success">✅ Mensaje enviado. Te responderemos en menos de 24 horas.</div>}
          </motion.form>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// AUTH MODAL
// ------------------------------------------------------------------
function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (u: Usuario) => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.login(email, pass);
      onSuccess(response.usuario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setRecoverySent(true);
      setLoading(false);
      setTimeout(() => {
        setShowRecovery(false);
        setRecoverySent(false);
        setRecoveryEmail('');
      }, 3000);
    }, 1500);
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
        className="ag-modal ag-modal--login" 
        initial={{ opacity: 0, scale: 0.8, y: 50 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.8, y: 50 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className="ag-modal__close" onClick={onClose}>✕</button>
        
        <div className="ag-modal__logo">
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
            <svg width="45" height="45" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#22c55e" />
              <path d="M14 6c0 0-6 4-6 9a6 6 0 0012 0c0-5-6-9-6-9z" fill="#fff" fillOpacity=".9" />
              <path d="M14 12v8M11 16l3-4 3 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <span>AgroSmart</span>
        </div>

        {!showRecovery ? (
          <>
            <h3>Bienvenido de vuelta</h3>
            <p className="ag-modal__sub">Ingresa tus credenciales para acceder a tu cuenta</p>
            
            <form onSubmit={handleLogin}>
              {/* Campo de Email con Float Label que se mueve FUERA */}
              <div className="ag-float-wrapper">
                <div className={`ag-float-content ${email ? 'ag-float-content--active' : ''}`}>
                  <span className="ag-float-icon">📧</span>
                  <label className="ag-float-text">Correo electrónico</label>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                  onBlur={(e) => {
                    if (!email) {
                      e.target.parentElement?.classList.remove('focused');
                    }
                  }}
                  className="ag-float-input"
                  required
                  disabled={loading}
                />
              </div>

              {/* Campo de Contraseña con Float Label que se mueve FUERA */}
              <div className="ag-float-wrapper">
                <div className={`ag-float-content ${pass ? 'ag-float-content--active' : ''}`}>
                  <span className="ag-float-icon">🔒</span>
                  <label className="ag-float-text">Contraseña</label>
                </div>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                  onBlur={(e) => {
                    if (!pass) {
                      e.target.parentElement?.classList.remove('focused');
                    }
                  }}
                  className="ag-float-input"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="ag-modal__options">
                <label className="ag-modal__checkbox">
                  <input type="checkbox" /> Recordarme
                </label>
                <button type="button" className="ag-modal__forgot" onClick={() => setShowRecovery(true)}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" className="ag-btn ag-btn--primary ag-btn--full" disabled={loading}>
                {loading ? <span className="ag-modal__spinner"></span> : 'Ingresar'}
              </button>
            </form>

            <div className="ag-modal__info">
              <p>👨‍🌾 ¿Eres administrador? <strong>Registra nuevos empleados</strong> desde el panel de control</p>
            </div>
          </>
        ) : (
          <>
            <h3>Recuperar contraseña</h3>
            <p className="ag-modal__sub">Ingresa tu correo y te enviaremos instrucciones</p>
            <form onSubmit={handleRecovery}>
              <div className="ag-float-wrapper">
                <div className={`ag-float-content ${recoveryEmail ? 'ag-float-content--active' : ''}`}>
                  <span className="ag-float-icon">📧</span>
                  <label className="ag-float-text">Tu correo electrónico</label>
                </div>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                  onBlur={(e) => {
                    if (!recoveryEmail) {
                      e.target.parentElement?.classList.remove('focused');
                    }
                  }}
                  className="ag-float-input"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="ag-btn ag-btn--primary ag-btn--full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>
              <button type="button" className="ag-btn ag-btn--ghost ag-btn--full" onClick={() => { setShowRecovery(false); setRecoverySent(false); setRecoveryEmail(''); }}>
                Volver al inicio de sesión
              </button>
            </form>
            {recoverySent && <div className="ag-modal__success">✅ ¡Correo enviado! Revisa tu bandeja de entrada.</div>}
          </>
        )}

        {error && (
          <motion.div className="ag-modal__error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
// ------------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------------
function Footer() {
  return (
    <footer className="ag-footer">
      <div className="ag-footer__inner">
        <div className="ag-footer__brand">
          <span className="ag-footer__logo">🌱 AgroSmart</span>
          <p>Tecnología avanzada para el campo colombiano. Optimizamos cada cultivo para un futuro sostenible.</p>
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
          <a href="#">Gestión de cultivos</a>
          <a href="#">Control de tareas</a>
          <a href="#">Inventario de insumos</a>
          <a href="#">Reportes y KPIs</a>
        </div>
        <div className="ag-footer__links">
          <strong>Contacto</strong>
          <span>📍 Valledupar, Colombia</span>
          <span>📞 +57 321-456-7890</span>
          <span>✉️ hola@agrosmart.co</span>
        </div>
      </div>
      <div className="ag-footer__bottom">© 2026 AgroSmart. Todos los derechos reservados.</div>
    </footer>
  );
}

// ------------------------------------------------------------------
// LAYOUT WRAPPER
// ------------------------------------------------------------------
function WithLayout({ children, sesion, onLogout, onLogin, modal, onClose, onSuccess }: any) {
  return (
    <>
      <Navbar sesion={sesion} onLogout={onLogout} onLogin={onLogin} />
      {children}
      <Footer />
      <AnimatePresence>{modal && <AuthModal onClose={onClose} onSuccess={onSuccess} />}</AnimatePresence>
    </>
  );
}

// ------------------------------------------------------------------
// APP CONTENT
// ------------------------------------------------------------------
function AppContent() {
  const [modal, setModal] = useState(false);
  const [sesion, setSesion] = useState<Usuario | null>(null);
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
      {sesion?.role === 'admin' && <Route path="/dashboard" element={<DashboardApp usuario={{ email: sesion.email, nombre: sesion.nombre, role: 'admin' }} onLogout={handleLogout} />} />}
      {sesion?.role === 'empleado' && <Route path="/empleado" element={<DashboardEmpleado usuario={{ email: sesion.email, nombre: sesion.nombre, role: 'empleado', lote: 'Lote Asignado' }} onLogout={handleLogout} />} />}
      <Route path="/" element={<WithLayout {...layoutProps}><HomePage /></WithLayout>} />
      <Route path="/about" element={<WithLayout {...layoutProps}><AboutPage /></WithLayout>} />
      <Route path="/services" element={<WithLayout {...layoutProps}><ServicesPage /></WithLayout>} />
      <Route path="/gallery" element={<WithLayout {...layoutProps}><GalleryPage /></WithLayout>} />
      <Route path="/contact" element={<WithLayout {...layoutProps}><ContactPage /></WithLayout>} />
    </Routes>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}