import { useState, useRef } from 'react';
import './ApisIA.css';

const FLUJO = [
  { paso: '1', icono: '📷', titulo: 'Captura foto', desc: 'El empleado toma foto de la palma con su dispositivo móvil' },
  { paso: '2', icono: '📤', titulo: 'Envío a API', desc: 'La imagen se envía en base64 al endpoint de Kindwise crop.health' },
  { paso: '3', icono: '🤖', titulo: 'Análisis IA', desc: 'El modelo analiza la imagen y detecta enfermedades con nivel de confianza' },
  { paso: '4', icono: '📋', titulo: 'Diagnóstico', desc: 'Se devuelve nombre de enfermedad, síntomas y tratamiento recomendado en español' },
  { paso: '5', icono: '📄', titulo: 'Reporte PDF', desc: 'El sistema genera un reporte y actualiza el estado sanitario de la palma' },
];

const ENFERMEDADES_DEMO = [
  { nombre: 'Pudrición del cogollo (PC)', confianza: 92, estado: 'ENFERMO', tratamiento: 'Aplicar fungicida a base de metalaxil. Eliminar tejido infectado. Notificar al administrador inmediatamente.' },
  { nombre: 'Anillo rojo', confianza: 87, estado: 'ENFERMO', tratamiento: 'No tiene cura. Erradicar la palma afectada para evitar propagación. Controlar picudo Rhynchophorus.' },
  { nombre: 'Palma sana', confianza: 96, estado: 'SANO', tratamiento: 'Sin tratamiento requerido. Continuar monitoreo regular.' },
];

export default function ApisIA() {
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<typeof ENFERMEDADES_DEMO[0] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultado(null);
  };

  const simularDeteccion = () => {
    if (!preview) return;
    setSimulando(true);
    setResultado(null);
    setTimeout(() => {
      const random = ENFERMEDADES_DEMO[Math.floor(Math.random() * ENFERMEDADES_DEMO.length)];
      setResultado(random);
      setSimulando(false);
    }, 2200);
  };

  return (
    <div className="ia-page">

      <div className="ia-header">
        <h1>🤖 Detección IA de Enfermedades en Palmas</h1>
        <p>Toma una foto de la palma y el sistema detecta enfermedades automáticamente.</p>
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

      {/* SIMULADOR */}
      <div className="ia-simulador">
        <h2>🧪 Simulador de Detección</h2>
        <p>Sube una foto de una palma para simular la detección de enfermedades.</p>

        <div className="simulador-body">
          <div className="simulador-upload">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleImagen}
              style={{ display: 'none' }}
            />
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
            <button
              className="simulador-btn"
              onClick={simularDeteccion}
              disabled={!preview || simulando}
            >
              {simulando ? '🔍 Analizando...' : '🤖 Detectar Enfermedad'}
            </button>
          </div>

          {simulando && (
            <div className="simulador-loading">
              <div className="loading-spinner" />
              <p>Analizando imagen con IA...</p>
            </div>
          )}

          {resultado && !simulando && (
            <div className={`simulador-resultado ${resultado.estado === 'SANO' ? 'resultado--sano' : 'resultado--enfermo'}`}>
              <div className="resultado-estado">
                {resultado.estado === 'SANO' ? '✅ PALMA SANA' : '⚠️ ENFERMEDAD DETECTADA'}
              </div>
              <div className="resultado-nombre">{resultado.nombre}</div>
              <div className="resultado-confianza">
                <span>Confianza:</span>
                <div className="confianza-bar">
                  <div className="confianza-fill" style={{ width: `${resultado.confianza}%` }} />
                </div>
                <span>{resultado.confianza}%</span>
              </div>
              <div className="resultado-tratamiento">
                <strong>Tratamiento recomendado:</strong>
                <p>{resultado.tratamiento}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}