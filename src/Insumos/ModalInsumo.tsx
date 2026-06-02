import { useState, useEffect } from 'react';

interface BaseForm {
  nombre: string;
  tipo: string;
  stockactual: string;
  stockminimo: string;
  costounitario: string;
  unidadmedida: string;
  fechaultimaactualizacion: string;
}

interface ModalInsumoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: BaseForm) => Promise<void>;
  titulo: string;
  initialData: BaseForm;
  saving: boolean;
}

const TIPOS = ['Fertilizante', 'Herbicida', 'Insecticida', 'Semilla', 'Otro'];

export default function ModalInsumo({ 
  isOpen, 
  onClose, 
  onSave, 
  titulo, 
  initialData, 
  saving 
}: ModalInsumoProps) {
  const [localForm, setLocalForm] = useState<BaseForm>(initialData);

  useEffect(() => {
    if (isOpen) {
      setLocalForm(initialData);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!localForm.nombre.trim()) {
      alert('El nombre del insumo es requerido');
      return;
    }
    onSave(localForm);
  };

  const isEditing = titulo.includes('EDITAR');

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        {/* Título */}
        <div style={{
          padding: '20px 24px 12px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {titulo}
          </h2>
        </div>

        {/* Formulario */}
        <div style={{ padding: '20px 24px' }}>
          {/* Nombre */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Nombre del insumo <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={localForm.nombre}
              onChange={(e) => setLocalForm({ ...localForm, nombre: e.target.value })}
              placeholder="Ej: Fertilizante NPK"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              autoFocus
            />
          </div>

          {/* Tipo y Unidad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151'
              }}>
                Tipo de insumo
              </label>
              <select
                value={localForm.tipo}
                onChange={(e) => setLocalForm({ ...localForm, tipo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151'
              }}>
                Unidad de medida
              </label>
              <select
                value={localForm.unidadmedida}
                onChange={(e) => setLocalForm({ ...localForm, unidadmedida: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="L">Litros (L)</option>
                <option value="g">Gramos (g)</option>
                <option value="mL">Mililitros (mL)</option>
                <option value="u">Unidades (u)</option>
                <option value="t">Toneladas (t)</option>
              </select>
            </div>
          </div>

          {/* Stock Actual y Mínimo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151'
              }}>
                Stock actual
              </label>
              <input
                type="number"
                value={localForm.stockactual}
                onChange={(e) => setLocalForm({ ...localForm, stockactual: e.target.value })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151'
              }}>
                Stock mínimo
              </label>
              <input
                type="number"
                value={localForm.stockminimo}
                onChange={(e) => setLocalForm({ ...localForm, stockminimo: e.target.value })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          {/* Costo unitario */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Costo unitario
            </label>
            <input
              type="number"
              step="0.01"
              value={localForm.costounitario}
              onChange={(e) => setLocalForm({ ...localForm, costounitario: e.target.value })}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Fecha */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Fecha última actualización
            </label>
            <input
              type="date"
              value={localForm.fechaultimaactualizacion}
              onChange={(e) => setLocalForm({ ...localForm, fechaultimaactualizacion: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        </div>

        {/* Botones */}
        <div style={{
          padding: '16px 24px 20px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '13px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isEditing ? '#3b82f6' : '#16a34a',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: saving ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = isEditing ? '#2563eb' : '#059669';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isEditing ? '#3b82f6' : '#16a34a';
            }}
          >
            {saving ? 'Guardando...' : 'Guardar insumo'}
          </button>
        </div>
      </div>
    </div>
  );
}