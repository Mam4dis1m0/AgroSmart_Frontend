import { useState, useRef } from 'react';
import './ApisIA.css';

const API_KEY = 'HizNGWSjrJ5xjKf9hkg6ubHiOMXt8SDkz10F9AifCgSz9LEK4F';
const KINDWISE_URL = 'https://crop.kindwise.com/api/v1/identification';

const FLUJO = [
  { paso: '1', icono: '📷', titulo: 'Captura foto',  desc: 'Toma foto de la palma de aceite con tu dispositivo' },
  { paso: '2', icono: '📤', titulo: 'Envío a API',   desc: 'La imagen se envía en base64 a Kindwise crop.health' },
  { paso: '3', icono: '🤖', titulo: 'Análisis IA',   desc: 'El modelo detecta enfermedades con nivel de confianza' },
  { paso: '4', icono: '📋', titulo: 'Diagnóstico',   desc: 'Nombre, síntomas y tratamiento recomendado' },
  { paso: '5', icono: '📄', titulo: 'Resultado',     desc: 'Estado sanitario de la palma en tiempo real' },
];

// Traducciones de enfermedades comunes en palma de aceite
const TRADUCCIONES: Record<string, string> = {
  'healthy': 'Palma sana',
  'crown disease': 'Enfermedad de la corona',
  'basal stem rot': 'Pudrición basal del tallo',
  'bud rot': 'Pudrición del cogollo',
  'brown germ': 'Germen marrón',
  'false smut': 'Carbón falso',
  'freckle': 'Pecas',
  'leaf blight': 'Tizón foliar',
  'leaf spot': 'Mancha foliar',
  'pestalotiopsis leaf blight': 'Tizón por Pestalotiopsis',
  'anthracnose': 'Antracnosis',
  'cercospora leaf spot': 'Mancha de Cercospora',
  'fusarium wilt': 'Marchitez por Fusarium',
  'ganoderma': 'Ganoderma (pudrición basal)',
  'lethal yellowing': 'Amarillamiento letal',
  'ring spot': 'Mancha anular',
  'rust': 'Roya',
  'sooty mold': 'Moho negro',
  'boron deficiency': 'Deficiencia de boro',
  'iron deficiency': 'Deficiencia de hierro',
  'magnesium deficiency': 'Deficiencia de magnesio',
  'nitrogen deficiency': 'Deficiencia de nitrógeno',
  'potassium deficiency': 'Deficiencia de potasio',
  'rhinoceros beetle': 'Escarabajo rinoceronte',
  'red ring': 'Anillo rojo',
  'coffee bee hawkmoth': 'Polilla halcón',
  'lemon tree borer': 'Barrenador del limonero',
  'rice earhead bug': 'Chinche del arroz',
  'leaf-footed bugs': 'Chinches de hoja',
  'grasshoppers': 'Saltamontes',
  'root-maggot flies': 'Moscas de raíz',
  'fruit flies': 'Moscas de la fruta',
  'broad-nosed weevils': 'Gorgojos',
};

const TRATAMIENTOS: Record<string, string> = {
  'healthy': 'Sin tratamiento requerido. Continuar con monitoreo regular y buenas prácticas agrícolas.',
  'bud rot': 'Aplicar fungicida a base de metalaxil. Eliminar tejido infectado. Notificar al administrador inmediatamente.',
  'ganoderma': 'No tiene cura definitiva. Aislar la palma afectada, eliminar tejido infectado y aplicar fungicidas preventivos a las palmas cercanas.',
  'red ring': 'No tiene cura. Erradicar la palma afectada para evitar propagación. Controlar el picudo Rhynchophorus con trampas.',
  'basal stem rot': 'Aplicar hexaconazol o tridemorph alrededor de la base. Eliminar tejido infectado. Mejorar el drenaje del suelo.',
  'lethal yellowing': 'Aplicar oxitetraciclina por inyección al tronco. Erradicar palmas severamente afectadas.',
  'fusarium wilt': 'No hay tratamiento curativo. Erradicar plantas afectadas y desinfectar herramientas. Usar variedades resistentes.',
  'leaf blight': 'Aplicar fungicida cúprico o mancozeb. Eliminar hojas infectadas. Mejorar la ventilación.',
  'rhinoceros beetle': 'Usar trampas con feromona. Aplicar insecticida en los puntos de infestación. Eliminar material vegetal en descomposición.',
};

function traducirNombre(nombre: string): string {
  const lower = nombre.toLowerCase();
  return TRADUCCIONES[lower] ?? nombre.replace(/_/g, ' ');
}

function obtenerTratamiento(nombre: string): string {
  const lower = nombre.toLowerCase();
  return TRATAMIENTOS[lower] ?? 'Consultar con un agrónomo especialista para diagnóstico y tratamiento adecuado.';
}

function colorConfianza(prob: number): string {
  if (prob >= 0.7) return '#16a34a';
  if (prob >= 0.4) return '#d97706';
  return '#dc2626';
}

interface Sugerencia {
  nombre: string;
  nombreEs: string;
  nombreCientifico: string;
  probabilidad: number;
  esSano: boolean;
  tratamiento: string;
}

export default function ApisIA() {
  const [analizando, setAnalizando] = useState(false);
  const [resultado,  setResultado]  = useState<{
    esPlanta: boolean;
    cultivo: string | null;
    sugerencias: Sugerencia[];
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64,  setBase64]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe superar 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setBase64(reader.result as string);
      setResultado(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analizar = async () => {
    if (!base64) return;
    setAnalizando(true);
    setResultado(null);
    setError(null);

    try {
      const res = await fetch(KINDWISE_URL, {
        method: 'POST',
        headers: {
          'Api-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: [base64] }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Error ${res.status}: ${text}`);

      const data = JSON.parse(text);

      // ── Parsear respuesta real de Kindwise ────────────────────────────────
      const esPlanta = data.result?.is_plant?.binary ?? false;

      // Cultivo detectado
      const cultivoRaw = data.result?.crop?.suggestions?.[0]?.name ?? null;
      const cultivo = cultivoRaw ? traducirNombre(cultivoRaw) : null;

      // Enfermedades/plagas
      const suggestions: any[] = data.result?.disease?.suggestions ?? [];
      const sugerencias: Sugerencia[] = suggestions.slice(0, 4).map((s: any) => ({
        nombre: s.name,
        nombreEs: traducirNombre(s.name),
        nombreCientifico: s.scientific_name ?? '',
        probabilidad: s.probability ?? 0,
        esSano: s.name?.toLowerCase() === 'healthy',
        tratamiento: obtenerTratamiento(s.name),
      }));

      setResultado({ esPlanta, cultivo, sugerencias });

    } catch (err: any) {
      setError(err?.message ?? 'Error al conectar con la API.');
    } finally {
      setAnalizando(false);
    }
  };

  const limpiar = () => {
    setPreview(null); setBase64(null); setResultado(null); setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Mejor sugerencia (mayor probabilidad)
  const mejorSugerencia = resultado?.sugerencias?.[0];

  return (
    <div className="ia-page">

      <div className="ia-header">
        <h1>🤖 Detección IA de Enfermedades en Palmas</h1>
        <p>Sube una foto real de la palma y el sistema detecta enfermedades automáticamente con Kindwise AI.</p>
      </div>

      {/* FLUJO */}
      <div className="ia-flujo-section">
        <h2>⚙️ Flujo de Detección</h2>
        <div className="ia-flujo">
          {FLUJO.map((f, i) => (
            <div className="flujo-step" key={f.paso}>
              <div className="flujo-icono">{f.icono}</div>
              <div className="flujo-paso">Paso {f.paso}</div>
              <div className="flujo-titulo">{f.titulo}</div>
              <div className="flujo-desc">{f.desc}</div>
              {i < FLUJO.length - 1 && <div className="flujo-arrow">›</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ANALIZADOR */}
      <div className="ia-simulador">
        <h2>🔬 Análisis Real con Kindwise AI</h2>
        <p>Sube una foto clara de la palma de aceite para obtener un diagnóstico real.</p>

        <div className="simulador-body">
          <div className="simulador-upload">
            <input ref={inputRef} type="file" accept="image/*" onChange={handleImagen} style={{ display: 'none' }} />

            <div className="upload-zone" onClick={() => inputRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="Palma" className="upload-preview" />
              ) : (
                <>
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">Haz clic para subir una foto</div>
                  <div className="upload-sub">JPG, PNG — máx 5MB</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="simulador-btn" onClick={analizar} disabled={!preview || analizando} style={{ flex: 1 }}>
                {analizando ? '🔍 Analizando...' : '🤖 Analizar Palma'}
              </button>
              {preview && (
                <button onClick={limpiar} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {analizando && (
            <div className="simulador-loading">
              <div className="loading-spinner" />
              <p>Analizando imagen con Kindwise AI...</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Esto puede tomar unos segundos</p>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: '#dc2626', fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {resultado && !analizando && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Alerta si no es planta */}
              {!resultado.esPlanta && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 18px', color: '#c2410c', fontSize: 14 }}>
                  ⚠️ La imagen no parece ser una planta. Para mejores resultados, sube una foto clara y cercana de la palma.
                </div>
              )}

              {/* Cultivo detectado */}
              {resultado.cultivo && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', fontSize: 13, color: '#15803d' }}>
                  🌱 Cultivo detectado: <strong>{resultado.cultivo}</strong>
                </div>
              )}

              {/* Diagnóstico principal */}
              {mejorSugerencia && (
                <div className={`simulador-resultado ${mejorSugerencia.esSano ? 'resultado--sano' : 'resultado--enfermo'}`}>
                  <div className="resultado-estado">
                    {mejorSugerencia.esSano ? '✅ PALMA SANA' : '⚠️ POSIBLE ENFERMEDAD O PLAGA'}
                  </div>
                  <div className="resultado-nombre">{mejorSugerencia.nombreEs}</div>
                  {mejorSugerencia.nombreCientifico && mejorSugerencia.nombreCientifico !== 'healthy' && (
                    <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginBottom: 8 }}>
                      {mejorSugerencia.nombreCientifico}
                    </div>
                  )}
                  <div className="resultado-confianza">
                    <span>Confianza:</span>
                    <div className="confianza-bar">
                      <div className="confianza-fill" style={{ width: `${Math.round(mejorSugerencia.probabilidad * 100)}%`, background: colorConfianza(mejorSugerencia.probabilidad) }} />
                    </div>
                    <span>{Math.round(mejorSugerencia.probabilidad * 100)}%</span>
                  </div>
                  <div className="resultado-tratamiento">
                    <strong>Tratamiento recomendado:</strong>
                    <p>{mejorSugerencia.tratamiento}</p>
                  </div>
                </div>
              )}

              {/* Otras posibilidades */}
              {resultado.sugerencias.length > 1 && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Otras posibilidades detectadas:</div>
                  {resultado.sugerencias.slice(1).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{s.nombreEs}</div>
                        {s.nombreCientifico && s.nombreCientifico !== 'healthy' && (
                          <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>{s.nombreCientifico}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 99 }}>
                          <div style={{ width: `${Math.round(s.probabilidad * 100)}%`, height: '100%', background: colorConfianza(s.probabilidad), borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#6b7280', minWidth: 32 }}>{Math.round(s.probabilidad * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}