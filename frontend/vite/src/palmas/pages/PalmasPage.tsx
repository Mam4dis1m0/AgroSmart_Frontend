import { useState } from 'react';

interface Palma { id:number; codigo:string; lote:string; edad:string; altura:string; estado:string; revision:string; }

interface Diagnostico {
  nombre: string;
  descripcion: string;
  tratamiento: string;
  confianza: number;
  saludable: boolean;
}

const KINDWISE_KEY = 'nl9k3l47CDfEXPqff80WkCzRKSCJ2aJqeNlyu59woLPQ4QxDsp';
const KINDWISE_URL = 'https://crop.kindwise.com/api/v1/identification';

const INIT: Palma[] = [
  { id:1, codigo:'PAL-001', lote:'Lote A', edad:'4 años', altura:'8 m',  estado:'Saludable',      revision:'15 Mar 2026' },
  { id:2, codigo:'PAL-002', lote:'Lote A', edad:'6 años', altura:'12 m', estado:'Saludable',      revision:'15 Mar 2026' },
  { id:3, codigo:'PAL-003', lote:'Lote B', edad:'2 años', altura:'4 m',  estado:'En observación', revision:'10 Mar 2026' },
  { id:4, codigo:'PAL-004', lote:'Lote C', edad:'8 años', altura:'15 m', estado:'Saludable',      revision:'20 Mar 2026' },
];

export default function Palmas() {
  const [palmas, setPalmas]           = useState<Palma[]>(INIT);
  const [modal, setModal]             = useState(false);
  const [modalIA, setModalIA]         = useState(false);
  const [form, setForm]               = useState({ codigo:'', lote:'Lote A', edad:'', altura:'', estado:'Saludable' });
  const [imagen, setImagen]           = useState<string | null>(null);
  const [imagenFile, setImagenFile]   = useState<File | null>(null);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [analizando, setAnalizando]   = useState(false);
  const [errorIA, setErrorIA]         = useState('');

  const save = () => {
    if (!form.codigo.trim()) return;
    const hoy = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
    setPalmas(p => [...p, { id: p.length + 1, revision: hoy, ...form }]);
    setModal(false);
    setForm({ codigo:'', lote:'Lote A', edad:'', altura:'', estado:'Saludable' });
  };

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setDiagnostico(null);
    setErrorIA('');
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analizarPalma = async () => {
    if (!imagenFile) return;
    setAnalizando(true);
    setErrorIA('');
    setDiagnostico(null);

    try {
      const formData = new FormData();
      formData.append('images', imagenFile);
      formData.append('similar_images', 'true');

      const response = await fetch(KINDWISE_URL, {
        method: 'POST',
        headers: { 'Api-Key': KINDWISE_KEY },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Error Kindwise:', errText);
        setErrorIA(`Error del servidor: ${response.status}`);
        setAnalizando(false);
        return;
      }

      const data = await response.json();
      console.log('Respuesta Kindwise:', data);

      if (data?.result) {
        const isHealthy = data.result.is_healthy?.binary ?? true;
        const disease   = data.result.disease?.suggestions?.[0];
        setDiagnostico({
          nombre:      isHealthy ? 'Palma Saludable' : (disease?.name ?? 'Enfermedad detectada'),
          descripcion: isHealthy ? 'No se detectaron enfermedades visibles en la palma.' : (disease?.details?.description ?? 'Se detectaron anomalias en la palma.'),
          tratamiento: isHealthy ? 'Continuar con mantenimiento regular.' : (disease?.details?.treatment?.biological?.[0] ?? 'Consultar con agronomo.'),
          confianza:   Math.round((disease?.probability ?? (isHealthy ? 0.95 : 0.5)) * 100),
          saludable:   isHealthy,
        });
      } else {
        setErrorIA('No se pudo analizar la imagen. Intenta con otra foto.');
      }
      setAnalizando(false);
    } catch (err) {
      console.error('Error:', err);
      setErrorIA('Error al conectar con el servicio de IA.');
      setAnalizando(false);
    }
  };

  const abrirModalIA = () => {
    setModalIA(true);
    setImagen(null);
    setImagenFile(null);
    setDiagnostico(null);
    setErrorIA('');
  };

  return (
    <>
      <p className="page-title">Gestión de Palmas</p>
      <p className="page-sub">Registro individual de palmas por lote</p>

      <div className="metrics" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {[
          { lbl:'Total palmas',   val:'2,340', sub:'En todos los lotes', color:''        },
          { lbl:'Saludables',     val:'2,280', sub:'97.4%',              color:'#90cc00' },
          { lbl:'En observación', val:'60',    sub:'2.6%',               color:'#f0c000' },
        ].map(m => (
          <div className="metric-card" key={m.lbl}>
            <div className="metric-label">{m.lbl}</div>
            <div className="metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="table-card" style={{ marginBottom: 24, marginTop: 24 }}>
        <div className="table-header">
          <span>Detección de enfermedades con IA</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Powered by Kindwise crop.health</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 500 }}>
            Toma una foto de una palma y nuestra IA detectará enfermedades, plagas y su estado sanitario en segundos.
          </p>
          <button className="add-btn" onClick={abrirModalIA}>Analizar palma con IA</button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span>Registro de palmas</span>
          <button className="add-btn" onClick={() => setModal(true)}>+ Registrar palma</button>
        </div>
        <table>
          <thead><tr><th>Código</th><th>Lote</th><th>Edad</th><th>Altura</th><th>Estado</th><th>Última revisión</th><th></th></tr></thead>
          <tbody>
            {palmas.map(p => (
              <tr key={p.id}>
                <td style={{ color:'#90cc00', fontFamily:'monospace' }}>{p.codigo}</td>
                <td>{p.lote}</td><td>{p.edad}</td><td>{p.altura}</td>
                <td><span className={`badge ${p.estado==='Saludable'?'badge-green':'badge-yellow'}`}>{p.estado}</span></td>
                <td style={{ color:'rgba(255,255,255,0.5)' }}>{p.revision}</td>
                <td><button className="act-btn" onClick={() => setPalmas(prev => prev.filter(x => x.id !== p.id))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>REGISTRAR PALMA</h3>
            <div className="form-row">
              <input placeholder="Código (Ej: PAL-005)" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
              <select value={form.lote} onChange={e => setForm({...form, lote: e.target.value})}>
                {['Lote A','Lote B','Lote C','Lote D'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-row">
              <input placeholder="Edad (Ej: 3 años)" value={form.edad} onChange={e => setForm({...form, edad: e.target.value})} />
              <input placeholder="Altura (Ej: 7 m)" value={form.altura} onChange={e => setForm({...form, altura: e.target.value})} />
            </div>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              {['Saludable','En observación'].map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {modalIA && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalIA(false)}>
          <div className="modal-box" style={{ width: 500 }}>
            <h3>ANALISIS DE PALMA CON IA</h3>
            <div style={{ border: '2px dashed rgba(106,170,0,0.3)', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 16, cursor: 'pointer', background: 'rgba(106,170,0,0.04)' }}
              onClick={() => document.getElementById('input-imagen')?.click()}>
              {imagen ? (
                <img src={imagen} alt="Palma" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Haz clic para subir una foto de la palma</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>JPG, PNG — máx 5MB</div>
                </>
              )}
            </div>
            <input id="input-imagen" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />

            {diagnostico && (
              <div style={{ background: diagnostico.saludable ? 'rgba(106,170,0,0.1)' : 'rgba(255,80,80,0.1)', border: `1px solid ${diagnostico.saludable ? 'rgba(106,170,0,0.4)' : 'rgba(255,80,80,0.4)'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: diagnostico.saludable ? '#90cc00' : '#ff8080' }}>
                    {diagnostico.saludable ? 'Palma Saludable' : 'Enfermedad Detectada'}
                  </span>
                  <span className={`badge ${diagnostico.saludable ? 'badge-green' : 'badge-red'}`}>{diagnostico.confianza}% confianza</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'white' }}>{diagnostico.nombre}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.5 }}>{diagnostico.descripcion}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                  <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Tratamiento recomendado:</strong><br />{diagnostico.tratamiento}
                </div>
              </div>
            )}

            {errorIA && (
              <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: 12, fontSize: 13, color: '#ff8080', marginBottom: 16 }}>
                {errorIA}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModalIA(false)}>Cerrar</button>
              <button className="btn-save" onClick={analizarPalma} disabled={!imagenFile || analizando} style={{ opacity: (!imagenFile || analizando) ? 0.5 : 1 }}>
                {analizando ? 'Analizando...' : 'Analizar con IA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
