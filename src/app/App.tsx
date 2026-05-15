import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { Leaf, Droplets, Satellite, FlaskConical, TrendingUp, Sprout, ArrowRight, Menu, X, Search, CheckCircle2, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-[#f0f4f1] font-['Inter'] overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(22, 163, 74, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(45, 80, 22, 0.2) 0%, transparent 40%)
            `,
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        />
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        />
      </div>

      {/* Navigation */}
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} scrollY={scrollY} />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Cultivos Section */}
      <CultivosSection />

      {/* CTA Section */}
      <CTASection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Navbar({ isMenuOpen, setIsMenuOpen, scrollY }: { isMenuOpen: boolean; setIsMenuOpen: (v: boolean) => void; scrollY: number }) {
  const navItems = ['Inicio', 'Nosotros', 'Servicios', 'Galería', 'Contacto'];
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50 ? 'bg-[#0a0f0d]/95 backdrop-blur-xl shadow-lg border-b border-[#22c55e]/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3 cursor-pointer"
          whileHover={{ scale: 1.05 }}
        >
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full blur-sm opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
            AgroSmart
          </span>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item, i) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-[#f0f4f1]/70 hover:text-[#22c55e] transition-colors relative group"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#22c55e] to-[#4ade80] group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          className="hidden md:block px-6 py-2.5 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#22c55e]/50 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Iniciar sesión
        </motion.button>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-[#22c55e] p-2"
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-[#121816] border-t border-[#22c55e]/20"
        >
          <div className="px-6 py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block py-2 text-[#f0f4f1]/70 hover:text-[#22c55e] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <button className="w-full py-3 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold">
              Iniciar sesión
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

/* ─── HERO SECTION ─────────────────────────────────────────── */
function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const servicios = [
    { icon: Leaf, label: 'Optimización de Cultivos' },
    { icon: Droplets, label: 'Riego Inteligente' },
    { icon: Satellite, label: 'Agricultura de Precisión' },
    { icon: FlaskConical, label: 'Análisis de Suelo' },
  ];

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d]/50 via-[#0a0f0d]/80 to-[#0a0f0d] z-10" />
        <motion.img
          src="/palmas-africanas.jpg"
          alt="Palmas Africanas"
          className="w-full h-full object-cover"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#22c55e] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.p 
            className="text-[#4ade80] text-sm font-semibold tracking-wider uppercase mb-6 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sprout className="w-4 h-4" />
            Agricultura Sostenible desde 1989
          </motion.p>

          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 font-['Space_Grotesk'] leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-[#f0f4f1] via-[#22c55e] to-[#f0f4f1] bg-clip-text text-transparent">
              Tecnología para
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
              el campo colombiano
            </span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-[#f0f4f1]/70 max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Optimizamos cada proceso agrícola con datos, IA y experiencia de campo
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/20 to-[#16a34a]/20 rounded-2xl blur-xl" />
              <div className="relative bg-[#121816]/80 backdrop-blur-xl rounded-2xl p-2 border border-[#22c55e]/30 shadow-2xl">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-[#22c55e] ml-4" />
                  <input
                    type="text"
                    placeholder="¿Qué servicio necesitas?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[#f0f4f1] placeholder-[#8b9d8f] py-3"
                  />
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Buscar
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Service Tags */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {servicios.map((servicio, i) => (
                <motion.button
                  key={i}
                  className="px-4 py-2 rounded-full bg-[#1a2820]/60 backdrop-blur-sm border border-[#22c55e]/30 text-sm text-[#f0f4f1] flex items-center gap-2 hover:bg-[#22c55e]/20 hover:border-[#22c55e] transition-all"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSearchQuery(servicio.label)}
                >
                  <servicio.icon className="w-4 h-4 text-[#22c55e]" />
                  {servicio.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[
              { icon: CheckCircle2, text: 'Mejores prácticas agronómicas' },
              { icon: Phone, text: 'Soporte 24/7 en campo' },
              { icon: TrendingUp, text: 'Miles de agricultores satisfechos' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-sm text-[#8b9d8f]"
                whileHover={{ scale: 1.05, color: '#22c55e' }}
              >
                <item.icon className="w-4 h-4 text-[#22c55e]" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-[#22c55e]/50 rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 bg-[#22c55e] rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ─── STATS SECTION ─────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { num: '35+', label: 'Años de experiencia' },
    { num: '7K+', label: 'Agricultores atendidos' },
    { num: '500K', label: 'Hectáreas gestionadas' },
    { num: '40+', label: 'Países con presencia' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative py-20 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="text-center group cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-[#121816]/50 backdrop-blur-sm border border-[#22c55e]/20 rounded-2xl p-6 group-hover:border-[#22c55e]/50 transition-all">
                  <motion.div 
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent mb-2 font-['Space_Grotesk']"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: i * 0.1 + 0.3, type: 'spring' }}
                  >
                    {stat.num}
                  </motion.div>
                  <div className="text-sm text-[#8b9d8f] group-hover:text-[#f0f4f1] transition-colors">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES SECTION ─────────────────────────────────────── */
function ServicesSection() {
  const services = [
    { 
      icon: Leaf, 
      title: 'Optimización de Cultivos', 
      desc: 'Selección de semillas y estrategias basadas en datos, adaptadas a las condiciones de suelo y clima.',
      color: '#22c55e'
    },
    { 
      icon: Droplets, 
      title: 'Riego Inteligente', 
      desc: 'Sistemas de riego con IA que reducen el consumo de agua hasta un 40% maximizando el rendimiento.',
      color: '#0ea5e9'
    },
    { 
      icon: Satellite, 
      title: 'Agricultura de Precisión', 
      desc: 'Imágenes satelitales y drones para evaluación en tiempo real de la salud de los cultivos.',
      color: '#8b5cf6'
    },
    { 
      icon: FlaskConical, 
      title: 'Análisis de Suelo', 
      desc: 'Análisis de laboratorio completo para conocer los nutrientes, pH y materia orgánica del suelo.',
      color: '#ef4444'
    },
    { 
      icon: TrendingUp, 
      title: 'Pronóstico de Rendimiento', 
      desc: 'Analítica predictiva con machine learning para proyectar volúmenes de cosecha.',
      color: '#f59e0b'
    },
    { 
      icon: Sprout, 
      title: 'Prácticas Sostenibles', 
      desc: 'Consultoría ecológica para reducir la huella de carbono y obtener certificaciones orgánicas.',
      color: '#10b981'
    },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="servicios" ref={ref} className="relative py-32 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Space_Grotesk']">
            <span className="bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
              Nuestros servicios
            </span>
          </h2>
          <p className="text-lg text-[#8b9d8f] max-w-2xl mx-auto">
            Soluciones agrícolas integrales para cada necesidad
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={i} service={service} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index, isInView }: { service: any; index: number; isInView: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500"
        style={{ 
          background: `radial-gradient(circle at center, ${service.color}20, transparent)`,
          opacity: isHovered ? 1 : 0 
        }}
      />

      {/* Card */}
      <motion.div
        className="relative bg-gradient-to-br from-[#121816] to-[#0a0f0d] border border-[#22c55e]/20 rounded-2xl p-8 h-full overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 flex items-center justify-center mb-6 relative"
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <service.icon className="w-7 h-7 text-[#22c55e]" />
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-bold text-[#f0f4f1] mb-3 font-['Space_Grotesk']">
          {service.title}
        </h3>
        <p className="text-[#8b9d8f] text-sm leading-relaxed mb-4">
          {service.desc}
        </p>

        {/* Arrow */}
        <motion.div
          className="flex items-center gap-2 text-[#22c55e] text-sm font-semibold"
          animate={{ x: isHovered ? 5 : 0 }}
        >
          Conocer más
          <ArrowRight className="w-4 h-4" />
        </motion.div>

        {/* Decorative Circle */}
        <div 
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-10 transition-all duration-500"
          style={{ 
            background: `radial-gradient(circle, ${service.color}, transparent)`,
            transform: isHovered ? 'scale(1.5)' : 'scale(1)'
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── CULTIVOS SECTION ─────────────────────────────────────── */
function CultivosSection() {
  const cultivos = [
    { src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800', label: 'Campos de Trigo', tag: 'Cereales' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800', label: 'Cosecha Fresca', tag: 'Hortalizas' },
    { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800', label: 'Maquinaria', tag: 'Tecnología' },
    { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800', label: 'Precisión Aérea', tag: 'Drones' },
    { src: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?q=80&w=800', label: 'Invernaderos', tag: 'Smart Farm' },
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800', label: 'Girasoles', tag: 'Oleaginosas' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="galería" ref={ref} className="relative py-32 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Space_Grotesk']">
            <span className="bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
              Principales cultivos
            </span>
          </h2>
          <p className="text-lg text-[#8b9d8f] max-w-2xl mx-auto">
            Soluciones especializadas según tu tipo de producción
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cultivos.map((cultivo, i) => (
            <CultivoCard key={i} cultivo={cultivo} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CultivoCard({ cultivo, index, isInView }: { cultivo: any; index: number; isInView: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden">
        <motion.img
          src={cultivo.src}
          alt={cultivo.label}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-[#0a0f0d]/50 to-transparent" />

      {/* Tag */}
      <motion.div
        className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#22c55e]/90 backdrop-blur-sm text-xs font-semibold text-white"
        initial={{ x: 100 }}
        animate={isInView ? { x: 0 } : {}}
        transition={{ delay: index * 0.1 + 0.3 }}
      >
        {cultivo.tag}
      </motion.div>

      {/* Content */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-6"
        animate={{ y: isHovered ? -5 : 0 }}
      >
        <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
          {cultivo.label}
        </h3>
        <motion.div
          className="flex items-center gap-2 text-[#22c55e] text-sm font-semibold"
          animate={{ x: isHovered ? 5 : 0 }}
        >
          Explorar
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* Border Glow */}
      <div 
        className="absolute inset-0 border-2 border-[#22c55e]/0 rounded-2xl transition-all duration-300"
        style={{ borderColor: isHovered ? 'rgba(34, 197, 94, 0.5)' : 'transparent' }}
      />
    </motion.div>
  );
}

/* ─── CTA SECTION ─────────────────────────────────────────── */
function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative py-32 z-10">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          className="relative overflow-hidden rounded-3xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#14532d]" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Content */}
          <div className="relative px-8 py-16 md:py-20 text-center">
            <motion.h2 
              className="text-3xl md:text-5xl font-bold text-white mb-4 font-['Space_Grotesk']"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
            >
              ¿Listo para transformar tu campo?
            </motion.h2>
            <motion.p 
              className="text-lg text-white/90 mb-8 max-w-2xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
            >
              Únete a más de 7.000 agricultores que ya confían en AgroSmart
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                className="px-8 py-4 rounded-full bg-white text-[#16a34a] font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contáctanos
              </motion.button>
              <motion.button
                className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver servicios
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CONTACT SECTION ─────────────────────────────────────── */
function ContactSection() {
  const [sent, setSent] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <section id="contacto" ref={ref} className="relative py-32 z-10">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Space_Grotesk']">
            <span className="bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
              Contáctanos
            </span>
          </h2>
          <p className="text-lg text-[#8b9d8f]">
            Construyamos algo grande juntos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-[#f0f4f1] mb-6 font-['Space_Grotesk']">
              Comunícate con nosotros
            </h3>
            <p className="text-[#8b9d8f] mb-8">
              Ya seas una pequeña finca o una gran agroindustria, estamos listos para ayudarte.
            </p>

            <div className="space-y-6">
              {[
                { icon: MapPin, text: 'Universidad Popular del Cesar' },
                { icon: Phone, text: '+57 (4) 321-456-789' },
                { icon: Mail, text: 'hola@agrosmart.co' },
                { icon: Clock, text: 'Lun – Vie, 8:00 AM – 6:00 PM' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-4 group cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 flex items-center justify-center group-hover:from-[#22c55e]/30 group-hover:to-[#16a34a]/30 transition-all">
                    <item.icon className="w-5 h-5 text-[#22c55e]" />
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-[#f0f4f1] group-hover:text-[#22c55e] transition-colors">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#121816]/50 border border-[#22c55e]/20 text-[#f0f4f1] placeholder-[#8b9d8f] focus:border-[#22c55e] focus:outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#121816]/50 border border-[#22c55e]/20 text-[#f0f4f1] placeholder-[#8b9d8f] focus:border-[#22c55e] focus:outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Empresa / Nombre de la finca"
                  className="w-full px-4 py-3 rounded-xl bg-[#121816]/50 border border-[#22c55e]/20 text-[#f0f4f1] placeholder-[#8b9d8f] focus:border-[#22c55e] focus:outline-none transition-all"
                />
              </div>
              <div>
                <textarea
                  placeholder="¿Cómo podemos ayudarte?"
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#121816]/50 border border-[#22c55e]/20 text-[#f0f4f1] placeholder-[#8b9d8f] focus:border-[#22c55e] focus:outline-none transition-all resize-none"
                />
              </div>
              <motion.button
                type="submit"
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold text-lg hover:shadow-lg hover:shadow-[#22c55e]/50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enviar mensaje
              </motion.button>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-[#22c55e]/20 border border-[#22c55e]/50 text-[#22c55e] text-center"
                >
                  ✅ Mensaje enviado. Te responderemos en menos de 24 horas.
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="relative border-t border-[#22c55e]/20 bg-[#0a0f0d] z-10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-['Space_Grotesk'] bg-gradient-to-r from-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
                AgroSmart
              </span>
            </div>
            <p className="text-sm text-[#8b9d8f]">
              Tecnología avanzada para el campo colombiano. Optimizamos cada semilla para un futuro sostenible.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-[#f0f4f1] mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-[#8b9d8f]">
              {['Nosotros', 'Servicios', 'Galería', 'Contacto'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="hover:text-[#22c55e] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#f0f4f1] mb-4">Servicios</h4>
            <ul className="space-y-2 text-sm text-[#8b9d8f]">
              {['Riego Inteligente', 'Análisis de Suelo', 'Drones Agrícolas', 'Consultoría'].map((item) => (
                <li key={item}>
                  <a href="#servicios" className="hover:text-[#22c55e] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#f0f4f1] mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-[#8b9d8f]">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#22c55e]" />
                Valledupar, Colombia
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#22c55e]" />
                +57 321-456-789
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#22c55e]" />
                hola@agrosmart.co
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#22c55e]/20 text-center text-sm text-[#8b9d8f]">
          © 2026 AgroSmart. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
