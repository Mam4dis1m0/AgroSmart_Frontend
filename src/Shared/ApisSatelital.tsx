
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ApisSatelital.css';

// Coordenadas de lotes de palma de ejemplo (Cesar, Colombia)
const LOTES = [
  {
    id: 'Lote A-1',
    color: '#2ecc71',
    estado: 'Saludable',
    ndvi: 0.82,
    area: '45 ha',
    coords: [
      [10.4630, -73.2510],
      [10.4650, -73.2510],
      [10.4650, -73.2480],
      [10.4630, -73.2480],
    ] as [number, number][],
  },
  {
    id: 'Lote B-2',
    color: '#f39c12',
    estado: 'Bajo monitoreo',
    ndvi: 0.61,
    area: '38 ha',
    coords: [
      [10.4600, -73.2550],
      [10.4620, -73.2550],
      [10.4620, -73.2520],
      [10.4600, -73.2520],
    ] as [number, number][],
  },
  {
    id: 'Lote C-3',
    color: '#e74c3c',
    estado: 'Alerta',
    ndvi: 0.38,
    area: '52 ha',
    coords: [
      [10.4570, -73.2490],
      [10.4590, -73.2490],
      [10.4590, -73.2460],
      [10.4570, -73.2460],
    ] as [number, number][],
  },
];

const NDVI_INFO = [
  { rango: '0.8 — 1.0', color: '#27ae60', estado: 'Vegetación densa y sana' },
  { rango: '0.6 — 0.8', color: '#f1c40f', estado: 'Vegetación moderada' },
  { rango: '0.4 — 0.6', color: '#e67e22', estado: 'Vegetación escasa' },
  { rango: '0.0 — 0.4', color: '#e74c3c', estado: 'Sin vegetación / Alerta' },
];

export default function ApisSatelital() {
  return (
    <div className="apis-page">
      <div className="apis-header">
        <h1>🛰️ Vista Satelital de Lotes</h1>
        <p>Monitoreo en tiempo real de los lotes mediante imágenes satelitales e índices de vegetación.</p>
      </div>

      {/* LEYENDA NDVI */}
      <div className="ndvi-leyenda">
        <h3>📊 Índice NDVI</h3>
        <div className="ndvi-items">
          {NDVI_INFO.map((n) => (
            <div className="ndvi-item" key={n.rango}>
              <div className="ndvi-color" style={{ background: n.color }} />
              <div>
                <div className="ndvi-rango">{n.rango}</div>
                <div className="ndvi-estado">{n.estado}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAPA */}
      <div className="mapa-wrap">
        <MapContainer
          center={[10.461, -73.249]}
          zoom={14}
          style={{ height: '480px', width: '100%', borderRadius: '12px' }}
        >
          {/* CAPA SATELITAL */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
          />

          {/* LOTES */}
          {LOTES.map((lote) => (
            <Polygon
              key={lote.id}
              positions={lote.coords}
              pathOptions={{ color: lote.color, fillColor: lote.color, fillOpacity: 0.35, weight: 2 }}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ fontSize: '1rem' }}>{lote.id}</strong>
                  <div style={{ marginTop: 6 }}>
                    <div>📍 Área: <strong>{lote.area}</strong></div>
                    <div>🌿 NDVI: <strong>{lote.ndvi}</strong></div>
                    <div>Estado: <span style={{ color: lote.color, fontWeight: 700 }}>{lote.estado}</span></div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>
      </div>

      {/* TARJETAS DE LOTES */}
      <div className="lotes-cards">
        {LOTES.map((lote) => (
          <div className="lote-card" key={lote.id} style={{ borderTop: `4px solid ${lote.color}` }}>
            <div className="lote-card-title">{lote.id}</div>
            <div className="lote-card-row"><span>Área</span><strong>{lote.area}</strong></div>
            <div className="lote-card-row"><span>NDVI</span><strong>{lote.ndvi}</strong></div>
            <div className="lote-card-row">
              <span>Estado</span>
              <strong style={{ color: lote.color }}>{lote.estado}</strong>
            </div>
            <div className="ndvi-bar-wrap">
              <div className="ndvi-bar" style={{ width: `${lote.ndvi * 100}%`, background: lote.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}