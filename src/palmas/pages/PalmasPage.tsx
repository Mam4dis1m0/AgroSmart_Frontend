import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';

const API = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : `http://${window.location.hostname}:3000`;

interface PalmaBackend {
  idpalma: number;
  codigo: string | null;
  variedad: string | null;
  fechasiembra: string | null;
  estadosanitario: string | null;
  observaciones: string | null;
  idlote?: { idlote: number; nombre?: string };
}

interface Diagnostico {
  nombre: string;
  descripcion: string;
  tratamiento: string;
  confianza: number;
  saludable: boolean;
  otrasSugerencias: { nombre: string; probabilidad: number }[];
}

interface Mensaje { rol: 'user' | 'assistant'; texto: string; }

const KINDWISE_KEY = 'HizNGWSjrJ5xjKf9hkg6ubHiOMXt8SDkz10F9AifCgSz9LEK4F';
const KINDWISE_URL = 'https://crop.kindwise.com/api/v1/identification';

// ── Umbral mínimo para considerar una enfermedad real ────────────────────────
// Por debajo de esto → palma saludable (la IA no está segura)
const UMBRAL_ENFERMEDAD = 0.50;  // 50%

const KEYWORDS_PALMA = [
  'palm', 'palma', 'coconut', 'date palm', 'oil palm',
  'elaeis', 'cocos', 'arecaceae', 'areca', 'arenga', 'livistona',
  'washingtonia', 'syagrus', 'dypsis', 'chamaedorea', 'phoenix',
  'roystonea', 'sabal', 'trachycarpus', 'bismarckia', 'butia',
  'caryota', 'ceroxylon', 'hyphaene', 'latania', 'licuala',
  'nypa', 'pritchardia', 'ptychosperma', 'raphia', 'rhapis',
  'bud rot', 'ganoderma', 'red ring', 'basal stem rot',
  'lethal yellowing', 'fusarium wilt', 'crown disease',
  'rhinoceros beetle', 'rhynchophorus', 'oryctes',
  'bursaphelenchus', 'palmivora',
  'healthy',
];

const TRADUCCIONES: Record<string, string> = {
  'healthy':              'Palma Saludable',
  'bud rot':              'Pudrición del Cogollo',
  'ganoderma':            'Ganoderma (Pudrición Basal)',
  'red ring':             'Anillo Rojo',
  'basal stem rot':       'Pudrición Basal del Tallo',
  'lethal yellowing':     'Amarillamiento Letal',
  'fusarium wilt':        'Marchitez por Fusarium',
  'leaf blight':          'Tizón Foliar',
  'leaf spot':            'Mancha Foliar',
  'crown disease':        'Enfermedad de la Corona',
  'anthracnose':          'Antracnosis',
  'rust':                 'Roya',
  'rhinoceros beetle':    'Escarabajo Rinoceronte',
  'coffee bee hawkmoth':  'Polilla Halcón',
  'leaf-footed bugs':     'Chinche de Hoja',
  'grasshoppers':         'Saltamontes',
  'fruit flies':          'Moscas de la Fruta',
  'broad-nosed weevils':  'Gorgojos',
  'root-maggot flies':    'Moscas de Raíz',
  'lemon tree borer':     'Barrenador',
  'rice earhead bug':     'Chinche',
  'sooty mold':           'Moho Negro',
  'boron deficiency':     'Deficiencia de Boro',
  'nitrogen deficiency':  'Deficiencia de Nitrógeno',
  'potassium deficiency': 'Deficiencia de Potasio',
  'nutrient deficiency':  'Deficiencia de Nutrientes',
};

const TRATAMIENTOS: Record<string, string> = {
  'healthy':               'Sin tratamiento requerido. Continuar con monitoreo regular y buenas prácticas agrícolas.',
  'bud rot':               'Aplicar fungicida a base de metalaxil. Eliminar tejido infectado. Notificar al administrador inmediatamente.',
  'ganoderma':             'No tiene cura definitiva. Aislar la palma afectada y aplicar fungicidas preventivos a las palmas cercanas.',
  'red ring':              'No tiene cura. Erradicar la palma afectada para evitar propagación. Controlar el picudo Rhynchophorus con trampas.',
  'basal stem rot':        'Aplicar hexaconazol alrededor de la base. Eliminar tejido infectado. Mejorar el drenaje del suelo.',
  'lethal yellowing':      'Aplicar oxitetraciclina por inyección al tronco. Erradicar palmas severamente afectadas.',
  'fusarium wilt':         'No hay tratamiento curativo. Erradicar plantas afectadas y desinfectar herramientas.',
  'leaf blight':           'Aplicar fungicida cúprico o mancozeb. Eliminar hojas infectadas. Mejorar la ventilación.',
  'rhinoceros beetle':     'Usar trampas con feromona. Aplicar insecticida en puntos de infestación.',
  'sooty mold':            'Controlar insectos productores de melaza (pulgones, cochinillas). Lavar hojas con agua jabonosa.',
  'boron deficiency':      'Aplicar ácido bórico foliar o al suelo. Dosis recomendada: 1–2 kg de borato por palma/año.',
  'nitrogen deficiency':   'Aplicar urea o nitrato de amonio. Revisar pH del suelo para asegurar absorción adecuada.',
  'potassium deficiency':  'Aplicar cloruro de potasio o sulfato de potasio. Ajustar plan de fertilización.',
  'nutrient deficiency':   'Realizar análisis foliar para identificar el nutriente deficiente. Ajustar el plan de fertilización según resultados.',
};

const DESCRIPCIONES: Record<string, string> = {
  'healthy':               'La palma no presenta síntomas de enfermedades ni plagas. Follaje verde y vigoroso, sin manchas, pudriciones ni deformaciones.',
  'bud rot':               'La Pudrición del Cogollo (PC) es causada por Phytophthora palmivora. Se manifiesta como pudrición café del meristemo apical, olor fétido y colapso de la flecha. Es la enfermedad más devastadora en zonas húmedas.',
  'ganoderma':             'El Ganoderma boninense causa la Pudrición Basal del Tallo. Se identifica por cuerpos fructíferos (concha de hongo) en la base del tronco, amarillamiento de hojas externas y pudrición interna.',
  'red ring':              'El Anillo Rojo es causado por el nematodo Bursaphelenchus cocophilus, transmitido por el picudo Rhynchophorus palmarum. Produce un anillo rojizo-café en el tronco al corte transversal.',
  'basal stem rot':        'Pudrición de la base del tallo causada por hongos del suelo. Se observa oscurecimiento y ablandamiento de tejidos en la zona del suelo, con posible emisión de exudados.',
  'lethal yellowing':      'Enfermedad causada por fitoplasma (MLO). Produce amarillamiento progresivo de hojas desde las inferiores hacia arriba, caída prematura de frutos y muerte de la palma en semanas.',
  'fusarium wilt':         'Causada por Fusarium oxysporum. Produce marchitez y amarillamiento de hojas, con decoloración vascular interna al corte. Se transmite por suelo y herramientas.',
  'leaf blight':           'Tizón foliar causado por hongos como Pestalotiopsis o Helminthosporium. Produce manchas necróticas con bordes cloróticos en los folíolos, comenzando por las hojas más viejas.',
  'leaf spot':             'Manchas foliares de origen fúngico o bacteriano. Lesiones circulares u ovaladas, con centro grisáceo y halo amarillo. Afecta la eficiencia fotosintética de la palma.',
  'rhinoceros beetle':     'El escarabajo Oryctes rhinoceros perfora el cogollo de la palma, causando daño en forma de V en las hojas jóvenes. Puede transmitir el virus de la enfermedad de la mancha de aceite.',
  'boron deficiency':      'Deficiencia de boro produce hojas jóvenes deformadas (hoja anzuelo), folíolos enrollados y reducción en la producción. Común en suelos muy lluviosos o ácidos.',
  'nitrogen deficiency':   'Deficiencia de nitrógeno produce hojas pálidas de color verde-amarillo, comenzando por las hojas más viejas. Reduce el crecimiento y la producción de racimos.',
  'potassium deficiency':  'Deficiencia de potasio produce manchas anaranjadas o necróticas en los bordes de los folíolos de hojas medias. Es la deficiencia más común en palma aceitera.',
  'nutrient deficiency':   'Se detectó una deficiencia nutricional general en la palma. Se requiere análisis foliar para determinar el nutriente específico afectado.',
};

function traducir(nombre: string): string {
  return TRADUCCIONES[nombre.toLowerCase()] ?? nombre;
}

function tratamiento(nombre: string): string {
  return TRATAMIENTOS[nombre.toLowerCase()] ?? 'Consultar con un agrónomo especialista para diagnóstico y tratamiento adecuado.';
}

function descripcion(nombre: string, scientific_name?: string): string {
  const desc = DESCRIPCIONES[nombre.toLowerCase()];
  if (desc) return desc;
  const sci = scientific_name ? ` (${scientific_name})` : '';
  return `Se detectó: ${traducir(nombre)}${sci}. Consulte con un especialista para mayor información sobre esta condición.`;
}

function esSugerenciaDePalma(suggestions: any[]): boolean {
  return suggestions.slice(0, 3).some(s => {
    const nombre = (s.name ?? '').toLowerCase();
    const sci    = (s.scientific_name ?? '').toLowerCase();
    const tags   = ((s.tags ?? []) as string[]).join(' ').toLowerCase();
    return KEYWORDS_PALMA.some(kw =>
      nombre.includes(kw) || sci.includes(kw) || tags.includes(kw)
    );
  });
}

// ── GENERAR PDF ──────────────────────────────────────────────────────────────
function generarPDF(diagnostico: Diagnostico, imagenBase64: string | null) {
  const doc = new jsPDF();
  const verde = [22, 163, 74] as [number, number, number];
  const rojo  = [220, 38, 38] as [number, number, number];
  const gris  = [100, 116, 139] as [number, number, number];
  const negro = [15, 23, 42] as [number, number, number];

  doc.setFillColor(...verde);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('AgroSmart', 14, 14);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Diagnóstico de Palma', 14, 23);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 140, 23);

  doc.setDrawColor(...verde); doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  const color = diagnostico.saludable ? verde : rojo;
  doc.setFillColor(...color);
  doc.roundedRect(14, 42, 182, 22, 4, 4, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(diagnostico.saludable ? '✓  PALMA SALUDABLE' : '⚠  ENFERMEDAD / PLAGA DETECTADA', 105, 51, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Confianza: ${diagnostico.confianza}%`, 105, 59, { align: 'center' });

  let y = 74;
  doc.setTextColor(...negro); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico Principal', 14, y); y += 7;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris);
  doc.text(diagnostico.nombre, 14, y); y += 10;

  doc.setTextColor(...negro); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Descripción', 14, y); y += 6;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris);
  const descLines = doc.splitTextToSize(diagnostico.descripcion || 'Sin descripción disponible.', 182);
  doc.text(descLines, 14, y); y += descLines.length * 5 + 6;

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 2, 182, 6 + Math.ceil(diagnostico.tratamiento.length / 90) * 5 + 6, 3, 3, 'F');
  doc.setDrawColor(...verde); doc.setLineWidth(0.3);
  doc.roundedRect(14, y - 2, 182, 6 + Math.ceil(diagnostico.tratamiento.length / 90) * 5 + 6, 3, 3, 'S');
  doc.setTextColor(...verde); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Tratamiento Recomendado', 18, y + 4); y += 10;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(21, 128, 61);
  const tratLines = doc.splitTextToSize(diagnostico.tratamiento, 174);
  doc.text(tratLines, 18, y); y += tratLines.length * 5 + 10;

  if (diagnostico.otrasSugerencias.length > 0) {
    doc.setTextColor(...negro); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Otras Posibilidades Detectadas', 14, y); y += 7;
    diagnostico.otrasSugerencias.forEach((s, i) => {
      doc.setFillColor(248, 250, 252); doc.rect(14, y - 3, 182, 10, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...negro);
      doc.text(`${i + 1}. ${s.nombre}`, 18, y + 3);
      doc.setTextColor(...gris);
      doc.text(`${Math.round(s.probabilidad * 100)}%`, 185, y + 3, { align: 'right' });
      const barW = 60, barX = 120;
      doc.setFillColor(229, 231, 235); doc.roundedRect(barX, y, barW, 3, 1, 1, 'F');
      const fill = Math.round(s.probabilidad * barW);
      const barColor = s.probabilidad >= 0.5 ? verde : s.probabilidad >= 0.3 ? [217,119,6] as [number,number,number] : rojo;
      doc.setFillColor(...barColor); doc.roundedRect(barX, y, fill, 3, 1, 1, 'F');
      y += 12;
    });
    y += 4;
  }

  if (imagenBase64 && y < 220) {
    try {
      doc.setTextColor(...negro); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Imagen Analizada', 14, y); y += 6;
      const ext = imagenBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imagenBase64, ext, 14, y, 80, 60); y += 68;
    } catch { /* imagen no válida */ }
  }

  doc.setFillColor(248, 250, 252); doc.rect(0, 277, 210, 20, 'F');
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(0, 277, 210, 277);
  doc.setTextColor(...gris); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('AgroSmart — Sistema de Gestión Agrícola', 105, 284, { align: 'center' });
  doc.text('Este diagnóstico es orientativo. Consulte con un agrónomo para decisiones críticas.', 105, 290, { align: 'center' });

  doc.save(`diagnostico-palma-${Date.now()}.pdf`);
}

const SYSTEM_PALMAS = `Eres AgroBot, el asistente inteligente del módulo de Palmas de AgroSmart.
Ayudas a los administradores a gestionar el registro individual de palmas por lote.
Responde siempre en español, de forma breve y amigable. Máximo 3 oraciones por respuesta.`;

const GUIA_ITEMS = [
  { icon: '＋',  titulo: 'Registrar palma',  desc: 'Haz clic en "+ Registrar palma" para añadir una nueva palma al sistema.',                color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: '🏷️', titulo: 'Código de palma',   desc: 'Cada palma tiene un código único (Ej: PAL-005). Sirve para identificarla individualmente.', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: '🌴',  titulo: 'Variedad',          desc: 'Registra la variedad genética de la palma (Ej: Deli x Ghana).',                            color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { icon: '🌿',  titulo: 'Estado sanitario',  desc: 'Saludable → buen estado. En observación → presenta anomalía que requiere seguimiento.',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: '🤖',  titulo: 'Análisis con IA',   desc: 'Sube una foto de la palma y la IA detectará enfermedades usando Kindwise crop.health.',    color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { icon: '✕',   titulo: 'Eliminar palma',    desc: 'Usa el botón ✕ al final de cada fila para eliminar esa palma del registro.',              color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

function AgrobotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<'guia' | 'chat'>('guia');
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: 'assistant', texto: '¡Hola! Soy AgroBot 🌴 ¿En qué te puedo ayudar con las palmas?' }]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes, tab]);

  const enviar = async (textoDirecto?: string) => {
    const texto = (textoDirecto ?? input).trim();
    if (!texto || cargando) return;
    setInput(''); if (tab !== 'chat') setTab('chat');
    const nuevos: Mensaje[] = [...mensajes, { rol: 'user', texto }];
    setMensajes(nuevos); setCargando(true);
    try {
      const res = await fetch(`${API}/api/v1/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system: SYSTEM_PALMAS, messages: nuevos.map(m => ({ role: m.rol, content: m.texto })) }) });
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'assistant', texto: data.content?.[0]?.text ?? 'No pude responder.' }]);
    } catch { setMensajes(prev => [...prev, { rol: 'assistant', texto: 'Error al conectar.' }]); }
    finally { setCargando(false); }
  };

  return (
    <>
      <style>{`
        @keyframes widgetIn{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:none}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .aw-fab{position:fixed;bottom:28px;right:28px;z-index:999;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);border:none;cursor:pointer;box-shadow:0 4px 24px rgba(22,163,74,0.45);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
        .aw-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(22,163,74,0.55)}
        .aw-panel{position:fixed;bottom:94px;right:28px;z-index:998;width:352px;border-radius:18px;background:#fff;border:0.5px solid #e5e7eb;box-shadow:0 8px 40px rgba(0,0,0,0.16);display:flex;flex-direction:column;overflow:hidden;animation:widgetIn .22s cubic-bezier(.34,1.56,.64,1)}
        .aw-header{background:linear-gradient(135deg,#16a34a,#059669);padding:13px 16px;display:flex;align-items:center;gap:10px}
        .aw-tabs{display:flex;border-bottom:0.5px solid #e5e7eb}
        .aw-tab{flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;background:transparent;cursor:pointer;color:#94a3b8;transition:color .15s,border-color .15s;border-bottom:2px solid transparent;font-family:inherit}
        .aw-tab.active{color:#16a34a;border-bottom-color:#16a34a}
        .aw-guia-scroll{overflow-y:auto;max-height:360px;padding:12px;display:flex;flex-direction:column;gap:8px}
        .aw-guia-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;border:1px solid;cursor:default}
        .aw-chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;max-height:320px}
        .aw-bubble-wrap{display:flex}
        .aw-bubble{max-width:82%;padding:8px 12px;font-size:13px;line-height:1.5}
        .aw-bubble.user{background:#16a34a;color:#fff;border-radius:14px 14px 4px 14px;margin-left:auto}
        .aw-bubble.bot{background:#f3f4f6;color:#111;border-radius:14px 14px 14px 4px}
        .aw-input-row{padding:10px 14px;border-top:0.5px solid #e5e7eb;display:flex;gap:8px;align-items:center}
        .aw-input{flex:1;padding:8px 12px;border:1px solid #e5e7eb;border-radius:99px;font-size:13px;color:#111;outline:none;font-family:inherit}
        .aw-send{width:34px;height:34px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .aw-chips{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:6px}
        .aw-chip{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:500;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;cursor:pointer;font-family:inherit}
      `}</style>
      <button className="aw-fab" onClick={() => setAbierto(v => !v)}>
        {abierto
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/><circle cx="8.5" cy="11" r="1" fill="#fff"/><circle cx="12" cy="11" r="1" fill="#fff"/><circle cx="15.5" cy="11" r="1" fill="#fff"/></svg>
        }
      </button>
      {abierto && (
        <div className="aw-panel">
          <div className="aw-header">
            <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a9 9 0 019 9c0 3.5-2 6.5-5 8l1 3-4-2a9 9 0 01-1 0A9 9 0 013 11a9 9 0 019-9z"/></svg>
            </div>
            <div><div style={{fontSize:14,fontWeight:700,color:'#fff'}}>AgroBot</div><div style={{fontSize:11,color:'rgba(255,255,255,0.75)'}}>Asistente de Palmas</div></div>
            <div style={{marginLeft:'auto'}}><div style={{width:8,height:8,borderRadius:'50%',background:'#86efac'}}/></div>
          </div>
          <div className="aw-tabs">
            <button className={`aw-tab ${tab==='guia'?'active':''}`} onClick={() => setTab('guia')}>📋 Guía rápida</button>
            <button className={`aw-tab ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>💬 Preguntar</button>
          </div>
          {tab === 'guia' && (
            <div className="aw-guia-scroll">
              {GUIA_ITEMS.map(item => (
                <div key={item.titulo} className="aw-guia-item" style={{background:item.bg,borderColor:item.border}}>
                  <span style={{fontSize:18,lineHeight:1,flexShrink:0,marginTop:1}}>{item.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:item.color,marginBottom:2}}>{item.titulo}</div>
                    <div style={{fontSize:12,color:'#374151',lineHeight:1.4}}>{item.desc}</div>
                    <button style={{marginTop:6,padding:'3px 9px',borderRadius:99,fontSize:11,fontWeight:600,border:`1px solid ${item.border}`,background:'transparent',color:item.color,cursor:'pointer',fontFamily:'inherit'}} onClick={() => enviar(`Explícame más sobre: ${item.titulo}`)}>Saber más →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'chat' && (
            <>
              <div className="aw-chat-body">
                {mensajes.map((m,i) => <div key={i} className="aw-bubble-wrap"><div className={`aw-bubble ${m.rol==='user'?'user':'bot'}`}>{m.texto}</div></div>)}
                {cargando && <div className="aw-bubble-wrap"><div className="aw-bubble bot" style={{display:'flex',gap:4,alignItems:'center',padding:'10px 14px'}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#9ca3af',animation:`bounce .9s ${i*0.15}s infinite`}}/>)}</div></div>}
                <div ref={bottomRef}/>
              </div>
              {mensajes.length <= 1 && <div className="aw-chips">{['¿Cómo registro una palma?','¿Cómo funciona la IA?','¿Qué es el estado sanitario?'].map(s=><button key={s} className="aw-chip" onClick={() => enviar(s)}>{s}</button>)}</div>}
            </>
          )}
          <div className="aw-input-row">
            <input className="aw-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enviar()} placeholder="Escribe tu pregunta..."/>
            <button className="aw-send" onClick={() => enviar()} disabled={cargando||!input.trim()} style={{background:input.trim()?'#16a34a':'#e5e7eb'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Palmas() {
  const [palmas, setPalmas]           = useState<PalmaBackend[]>([]);
  const [lotes, setLotes]             = useState<{ idlote: number; nombre: string }[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [modal, setModal]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [modalIA, setModalIA]         = useState(false);
  const [imagen, setImagen]           = useState<string | null>(null);
  const [imagenFile, setImagenFile]   = useState<File | null>(null);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [analizando, setAnalizando]   = useState(false);
  const [errorIA, setErrorIA]         = useState('');
  const [noEsPalma, setNoEsPalma]     = useState(false);

  const [form, setForm] = useState({
    codigo: '', idlote: '', variedad: '', fechasiembra: '',
    estadosanitario: 'Saludable', observaciones: '',
  });

  const cargarPalmas = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${API}/palmas`);
      if (!res.ok) throw new Error();
      setPalmas(await res.json());
    } catch { setError('No se pudo conectar con el servidor'); }
    finally { setLoading(false); }
  };

  const cargarLotes = async () => {
    try {
      const res = await fetch(`${API}/lotes`);
      if (!res.ok) return;
      const data = await res.json();
      setLotes(data.map((l: any) => ({ idlote: l.idlote, nombre: l.nombre ?? `Lote ${l.idlote}` })));
    } catch { /* silencioso */ }
  };

  useEffect(() => { cargarPalmas(); cargarLotes(); }, []);

  const guardar = async () => {
    if (!form.codigo.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/palmas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: form.codigo,
          variedad: form.variedad || undefined,
          fechasiembra: form.fechasiembra || undefined,
          estadosanitario: form.estadosanitario || undefined,
          observaciones: form.observaciones || undefined,
          idlote: form.idlote ? Number(form.idlote) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setModal(false);
      setForm({ codigo: '', idlote: '', variedad: '', fechasiembra: '', estadosanitario: 'Saludable', observaciones: '' });
      await cargarPalmas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setTimeout(() => setError(''), 4000);
    } finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta palma?')) return;
    try { await fetch(`${API}/palmas/${id}`, { method: 'DELETE' }); await cargarPalmas(); }
    catch { setError('Error al eliminar'); }
  };

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImagenFile(file); setDiagnostico(null); setErrorIA(''); setNoEsPalma(false);
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analizarPalma = async () => {
    if (!imagen) return;
    setAnalizando(true); setErrorIA(''); setDiagnostico(null); setNoEsPalma(false);

    try {
      const res = await fetch(KINDWISE_URL, {
        method: 'POST',
        headers: { 'Api-Key': KINDWISE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [imagen] }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Error ${res.status}: ${text}`);
      const data = JSON.parse(text);

      const suggestions: any[] = data.result?.disease?.suggestions ?? [];

      // ── PASO 1: verificar que es una palma ───────────────────────────────
      if (suggestions.length === 0 || !esSugerenciaDePalma(suggestions)) {
        setNoEsPalma(true);
        return;
      }

      // ── PASO 2: buscar la primera enfermedad con confianza >= 50% ─────────
      // Si ninguna supera el umbral → la palma está saludable
      const enfermedadTop = suggestions.find(
        s => s.name?.toLowerCase() !== 'healthy' && s.probability >= UMBRAL_ENFERMEDAD
      );

      if (!enfermedadTop) {
        // Ninguna enfermedad supera el 50% → saludable
        setDiagnostico({
          nombre:      'Palma Saludable',
          descripcion: DESCRIPCIONES['healthy'],
          tratamiento: TRATAMIENTOS['healthy'],
          confianza:   100 - Math.round((suggestions[0]?.probability ?? 0) * 100),
          saludable:   true,
          otrasSugerencias: suggestions.slice(0, 3).map((s: any) => ({
            nombre:       traducir(s.name),
            probabilidad: s.probability,
          })),
        });
        return;
      }

      // ── PASO 3: hay una enfermedad con suficiente confianza ───────────────
      setDiagnostico({
        nombre:      traducir(enfermedadTop.name),
        descripcion: descripcion(enfermedadTop.name, enfermedadTop.scientific_name),
        tratamiento: tratamiento(enfermedadTop.name),
        confianza:   Math.round(enfermedadTop.probability * 100),
        saludable:   false,
        otrasSugerencias: suggestions
          .filter(s => s !== enfermedadTop)
          .slice(0, 3)
          .map((s: any) => ({ nombre: traducir(s.name), probabilidad: s.probability })),
      });

    } catch (err: any) {
      setErrorIA(err?.message ?? 'Error al conectar con el servicio de IA.');
    } finally {
      setAnalizando(false);
    }
  };

  const abrirModalIA = () => {
    setModalIA(true); setImagen(null); setImagenFile(null);
    setDiagnostico(null); setErrorIA(''); setNoEsPalma(false);
  };

  const total       = palmas.length;
  const saludables  = palmas.filter(p => !p.estadosanitario || p.estadosanitario === 'Saludable').length;
  const observacion = palmas.filter(p => p.estadosanitario && p.estadosanitario !== 'Saludable').length;
  const pctSalud    = total > 0 ? ((saludables / total) * 100).toFixed(1) : '0';

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };

  return (
    <>
      <style>{`
        .add-btn{padding:10px 18px;border-radius:999px;border:none;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(135deg,#16a34a,#059669);box-shadow:0 14px 32px rgba(22,163,74,0.2);cursor:pointer;transition:transform .18s,box-shadow .18s;display:inline-flex;align-items:center;justify-content:center}
        .add-btn:hover{transform:translateY(-1px);box-shadow:0 18px 38px rgba(22,163,74,0.24)}
        .act-btn{width:38px;height:38px;min-width:38px;border-radius:50%;border:1px solid rgba(239,68,68,0.25);background:#fee2e2;color:#b91c1c;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform .15s,background .15s}
        .act-btn:hover{background:#fecaca;transform:scale(1.06)}
      `}</style>

      <p className="page-title">Gestión de Palmas</p>
      <p className="page-sub">Registro individual de palmas por lote</p>

      {error && <div style={{background:'#fef2f2',color:'#ef4444',padding:'10px 16px',borderRadius:8,marginBottom:16,fontSize:14}}>{error}</div>}

      <div className="metrics" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[
          { lbl: 'Total palmas',   val: total.toLocaleString(),       sub: 'En todos los lotes', color: '' },
          { lbl: 'Saludables',     val: saludables.toLocaleString(),  sub: `${pctSalud}%`,       color: '#90cc00' },
          { lbl: 'En observación', val: observacion.toLocaleString(), sub: `${total > 0 ? (100 - Number(pctSalud)).toFixed(1) : 0}%`, color: '#f0c000' },
        ].map(m => (
          <div className="metric-card" key={m.lbl}>
            <div className="metric-label">{m.lbl}</div>
            <div className="metric-val" style={m.color ? {color:m.color} : {}}>{m.val}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="table-card" style={{marginBottom:24,marginTop:24}}>
        <div className="table-header">
          <span>Detección de enfermedades con IA</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.35)'}}>Powered by Kindwise crop.health</span>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <p style={{fontSize:13,color:'black',maxWidth:500}}>Toma una foto de una palma y nuestra IA detectará enfermedades, plagas y su estado sanitario en segundos.</p>
          <button className="add-btn" onClick={abrirModalIA}>Analizar palma con IA</button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span>Registro de palmas</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Registrar palma</button>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:32,color:'#64748b'}}>Cargando palmas...</div>
          : palmas.length === 0
            ? <div style={{textAlign:'center',padding:32,color:'#64748b'}}>No hay palmas registradas</div>
            : (
              <table>
                <thead><tr><th>Código</th><th>Lote</th><th>Variedad</th><th>Fecha siembra</th><th>Estado sanitario</th><th></th></tr></thead>
                <tbody>
                  {palmas.map(p => (
                    <tr key={p.idpalma}>
                      <td style={{color:'black',fontFamily:'monospace'}}>{p.codigo ?? '—'}</td>
                      <td style={{color:'black'}}>{p.idlote?.nombre ?? `Lote ${p.idlote?.idlote ?? '—'}`}</td>
                      <td style={{color:'black'}}>{p.variedad ?? '—'}</td>
                      <td style={{color:'black'}}>{p.fechasiembra ?? '—'}</td>
                      <td><span className={`badge ${!p.estadosanitario || p.estadosanitario === 'Saludable' ? 'badge-green' : 'badge-yellow'}`}>{p.estadosanitario ?? 'Saludable'}</span></td>
                      <td><button className="act-btn" onClick={() => eliminar(p.idpalma)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>

      {/* MODAL REGISTRAR */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem'}}>
          <div style={{background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:460,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)'}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a',margin:0}}>REGISTRAR PALMA</h3>
            <input placeholder="Código (Ej: PAL-005) *" value={form.codigo} onChange={e => setForm({...form,codigo:e.target.value})} style={inputStyle}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:12,color:'#64748b'}}>Variedad</label>
                <input placeholder="Ej: Deli x Ghana" value={form.variedad} onChange={e => setForm({...form,variedad:e.target.value})} style={{...inputStyle,width:'auto'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:12,color:'#64748b'}}>Fecha de siembra</label>
                <input type="date" value={form.fechasiembra} onChange={e => setForm({...form,fechasiembra:e.target.value})} style={{...inputStyle,width:'auto'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <select value={form.estadosanitario} onChange={e => setForm({...form,estadosanitario:e.target.value})} style={{...inputStyle,width:'auto'}}>
                <option value="Saludable">Saludable</option>
                <option value="En observación">En observación</option>
              </select>
              <select value={form.idlote} onChange={e => setForm({...form,idlote:e.target.value})} style={{...inputStyle,width:'auto'}}>
                <option value="">— Seleccionar lote —</option>
                {lotes.map(l => <option key={l.idlote} value={l.idlote}>{l.nombre}</option>)}
              </select>
            </div>
            <textarea placeholder="Observaciones (opcional)" value={form.observaciones} onChange={e => setForm({...form,observaciones:e.target.value})} rows={2} style={{...inputStyle,resize:'vertical'}}/>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={() => setModal(false)} disabled={saving} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#16a34a',color:'#fff',border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,fontFamily:'inherit'}}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {modalIA && (
        <div onClick={e => e.target === e.currentTarget && setModalIA(false)} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'1rem',overflowY:'auto'}}>
          <div style={{background:'#fff',borderRadius:18,padding:28,width:'100%',maxWidth:520,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 12px 40px rgba(0,0,0,.15)',margin:'auto'}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a',margin:0}}>ANÁLISIS DE PALMA CON IA</h3>

            {/* Nota de confianza mínima */}
            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#1e40af'}}>
              ℹ️ Solo se reportan enfermedades con confianza ≥ 50%. Por debajo de ese umbral la palma se considera saludable.
            </div>

            <div
              style={{border:'2px dashed #e2e8f0',borderRadius:12,padding:20,textAlign:'center',cursor:'pointer',background:'#f8fafc'}}
              onClick={() => document.getElementById('input-imagen-ia')?.click()}
            >
              {imagen
                ? <img src={imagen} alt="Palma" style={{width:'100%',maxHeight:200,objectFit:'cover',borderRadius:8}}/>
                : <>
                    <div style={{fontSize:36,marginBottom:8}}>📷</div>
                    <div style={{fontSize:13,color:'#64748b'}}>Haz clic para subir una foto de la palma</div>
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>JPG, PNG — máx 5MB</div>
                  </>
              }
            </div>
            <input id="input-imagen-ia" type="file" accept="image/*" style={{display:'none'}} onChange={handleImagen}/>

            {noEsPalma && (
              <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:12,padding:16,display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontSize:28,lineHeight:1}}>🌴</span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#c2410c',marginBottom:4}}>Imagen no reconocida como palma</div>
                  <div style={{fontSize:13,color:'#78350f',lineHeight:1.5}}>
                    La IA no detectó una palma en esta imagen. Por favor sube una foto clara de la palma que deseas analizar.
                  </div>
                  <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
                    {['✅ Hoja de palma','✅ Tronco de palma','✅ Vista general','❌ Personas','❌ Animales','❌ Otras plantas','❌ Objetos'].map(tip => (
                      <span key={tip} style={{fontSize:11,padding:'3px 8px',borderRadius:99,background:tip.startsWith('✅')?'#f0fdf4':'#fef2f2',color:tip.startsWith('✅')?'#16a34a':'#dc2626',border:`1px solid ${tip.startsWith('✅')?'#bbf7d0':'#fecaca'}`}}>{tip}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {diagnostico && (
              <div style={{background:diagnostico.saludable?'#f0fdf4':'#fef2f2',border:`1px solid ${diagnostico.saludable?'#bbf7d0':'#fecaca'}`,borderRadius:12,padding:16,display:'flex',flexDirection:'column',gap:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:15,fontWeight:700,color:diagnostico.saludable?'#16a34a':'#dc2626'}}>
                    {diagnostico.saludable ? '✅ Palma Saludable' : '⚠️ Enfermedad / Plaga Detectada'}
                  </span>
                  <span style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:99,background:diagnostico.saludable?'#dcfce7':'#fee2e2',color:diagnostico.saludable?'#16a34a':'#dc2626'}}>
                    {diagnostico.confianza}% confianza
                  </span>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:'#0f172a'}}>{diagnostico.nombre}</div>
                <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>{diagnostico.descripcion}</div>
                <div style={{fontSize:12,color:'#475569',borderTop:'1px solid #e2e8f0',paddingTop:10}}>
                  <strong style={{color:'#0f172a'}}>Tratamiento recomendado:</strong><br/>{diagnostico.tratamiento}
                </div>
                {diagnostico.otrasSugerencias.length > 0 && (
                  <div style={{borderTop:'1px solid #e2e8f0',paddingTop:10}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#64748b',marginBottom:8}}>OTRAS POSIBILIDADES</div>
                    {diagnostico.otrasSugerencias.map((s,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:12,color:'#374151',flex:1}}>{s.nombre}</span>
                        <div style={{width:80,height:5,background:'#f3f4f6',borderRadius:99,overflow:'hidden'}}>
                          <div style={{width:`${Math.round(s.probabilidad*100)}%`,height:'100%',background:s.probabilidad>=0.5?'#16a34a':s.probabilidad>=0.3?'#d97706':'#dc2626',borderRadius:99}}/>
                        </div>
                        <span style={{fontSize:11,color:'#6b7280',minWidth:30}}>{Math.round(s.probabilidad*100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errorIA && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,fontSize:13,color:'#dc2626'}}>{errorIA}</div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4,flexWrap:'wrap'}}>
              <button onClick={() => setModalIA(false)} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1.5px solid #e2e8f0',color:'#475569',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>Cerrar</button>
              {diagnostico && (
                <button onClick={() => generarPDF(diagnostico, imagen)} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#0369a1',color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
                  📄 Descargar PDF
                </button>
              )}
              <button onClick={analizarPalma} disabled={!imagen||analizando} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,background:'#16a34a',color:'#fff',border:'none',cursor:(!imagen||analizando)?'not-allowed':'pointer',opacity:(!imagen||analizando)?0.5:1,fontFamily:'inherit'}}>
                {analizando ? 'Analizando...' : '🤖 Analizar con IA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AgrobotWidget/>
    </>
  );
}