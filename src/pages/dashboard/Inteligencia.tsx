import React, { useState } from 'react';

const Inteligencia: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<'ofertas' | 'promociones'>('ofertas');

  // Estado del formulario de Oferta
  const [ofertaForm, setOfertaForm] = useState({
    nombre: '',
    segmento: 'Verano',
    producto: '',
    descuento: '',
    estado: 'Activo',
    inicioOferta: '',
    finPromocion: '',
    descripcion: '',
  });

  // Estado del formulario de Promoción
  const [promocionForm, setPromocionForm] = useState({
    nombreCampana: '',
    canal: 'venta directa física',
    tipo: '2x1',
    presupuesto: '',
    objetivoIngreso: '',
    fechaInicio: '',
    finPromocion: '',
    estado: 'Activo',
  });

  const handleOfertaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Oferta Creada:', ofertaForm);
    alert('¡Oferta creada exitosamente!');
  };

  const handlePromocionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Promoción Creada:', promocionForm);
    alert('¡Promoción creada exitosamente!');
  };

  // Estilos comunes reutilizables
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      {/* Sub-navegación estilo píldora */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <button
          onClick={() => setTabActiva('ofertas')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: tabActiva === 'ofertas' ? '#00b4d8' : '#e0e0e0',
            color: tabActiva === 'ofertas' ? '#ffffff' : '#333333',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Ofertas
        </button>
        <button
          onClick={() => setTabActiva('promociones')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: tabActiva === 'promociones' ? '#00b4d8' : '#e0e0e0',
            color: tabActiva === 'promociones' ? '#ffffff' : '#333333',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Promociones
        </button>
      </div>

      {/* APARTADO: OFERTAS */}
      {tabActiva === 'ofertas' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2536', marginBottom: '20px' }}>Nueva Oferta</h2>

          <form onSubmit={handleOfertaSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  placeholder="Escribe el nombre de la oferta"
                  value={ofertaForm.nombre}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, nombre: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Segmento */}
              <div>
                <label style={labelStyle}>Segmento</label>
                <select
                  value={ofertaForm.segmento}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, segmento: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Verano">Verano</option>
                  <option value="Invierno">Invierno</option>
                  <option value="Otoño">Otoño</option>
                  <option value="Primavera">Primavera</option>
                  <option value="Navidad">Navidad</option>
                  <option value="Año Nuevo">Año Nuevo</option>
                  <option value="Black Friday">Black Friday</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              {/* Producto */}
              <div>
                <label style={labelStyle}>Producto</label>
                <input
                  type="number"
                  placeholder="Cantidad de productos"
                  value={ofertaForm.producto}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, producto: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Descuento con el signo % fuera */}
              <div>
                <label style={labelStyle}>Descuento</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="0"
                    value={ofertaForm.descuento}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, descuento: e.target.value })}
                    style={inputStyle}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>%</span>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  value={ofertaForm.estado}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, estado: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Activo">Activo</option>
                  <option value="inactivo">inactivo</option>
                  <option value="Descatalogado">Descatalogado</option>
                  <option value="Obsoleto">Obsoleto</option>
                  <option value="Fin de vida útil">Fin de vida útil</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              {/* Inicio de Oferta */}
              <div>
                <label style={labelStyle}>Inicio de oferta</label>
                <input
                  type="date"
                  value={ofertaForm.inicioOferta}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, inicioOferta: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Fin de Promoción */}
              <div>
                <label style={labelStyle}>Fin de promoción</label>
                <input
                  type="date"
                  value={ofertaForm.finPromocion}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, finPromocion: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea
                rows={4}
                placeholder="Escribe la descripción de la oferta..."
                value={ofertaForm.descripcion}
                onChange={(e) => setOfertaForm({ ...ofertaForm, descripcion: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              ></textarea>
            </div>

            {/* Botón Crear Oferta */}
            <button
              type="submit"
              style={{
                backgroundColor: '#00b4d8',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Crear Oferta
            </button>
          </form>
        </div>
      )}

      {/* APARTADO: PROMOCIONES */}
      {tabActiva === 'promociones' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2536', marginBottom: '20px' }}>Nueva Promoción</h2>

          <form onSubmit={handlePromocionSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              {/* Nombre de la campaña */}
              <div>
                <label style={labelStyle}>Nombre de la campaña</label>
                <input
                  type="text"
                  placeholder="Nombre de la campaña"
                  value={promocionForm.nombreCampana}
                  onChange={(e) => setPromocionForm({ ...promocionForm, nombreCampana: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Canal */}
              <div>
                <label style={labelStyle}>Canal</label>
                <select
                  value={promocionForm.canal}
                  onChange={(e) => setPromocionForm({ ...promocionForm, canal: e.target.value })}
                  style={inputStyle}
                >
                  <option value="venta directa física">Venta directa física</option>
                  <option value="tienda online">Tienda online</option>
                  <option value="marketplaces">Marketplaces</option>
                  <option value="distribución indirecta">Distribución indirecta</option>
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label style={labelStyle}>Tipo</label>
                <select
                  value={promocionForm.tipo}
                  onChange={(e) => setPromocionForm({ ...promocionForm, tipo: e.target.value })}
                  style={inputStyle}
                >
                  <option value="2x1">2x1</option>
                  <option value="3x2">3x2</option>
                  <option value="Segunda unidad al 50%">Segunda unidad al 50%</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              {/* Presupuesto */}
              <div>
                <label style={labelStyle}>Presupuesto</label>
                <input
                  type="number"
                  placeholder="Monto de presupuesto"
                  value={promocionForm.presupuesto}
                  onChange={(e) => setPromocionForm({ ...promocionForm, presupuesto: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Objetivo de Ingreso */}
              <div>
                <label style={labelStyle}>Objetivo de ingreso</label>
                <input
                  type="number"
                  placeholder="Monto objetivo"
                  value={promocionForm.objetivoIngreso}
                  onChange={(e) => setPromocionForm({ ...promocionForm, objetivoIngreso: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Estado */}
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  value={promocionForm.estado}
                  onChange={(e) => setPromocionForm({ ...promocionForm, estado: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Activo">Activo</option>
                  <option value="inactivo">inactivo</option>
                  <option value="Descatalogado">Descatalogado</option>
                  <option value="Obsoleto">Obsoleto</option>
                  <option value="Fin de vida útil">Fin de vida útil</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Fecha de Inicio */}
              <div>
                <label style={labelStyle}>Fecha de inicio</label>
                <input
                  type="date"
                  value={promocionForm.fechaInicio}
                  onChange={(e) => setPromocionForm({ ...promocionForm, fechaInicio: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Fin de Promoción */}
              <div>
                <label style={labelStyle}>Fin de promoción</label>
                <input
                  type="date"
                  value={promocionForm.finPromocion}
                  onChange={(e) => setPromocionForm({ ...promocionForm, finPromocion: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Botón Crear Promoción */}
            <button
              type="submit"
              style={{
                backgroundColor: '#00b4d8',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Crear Promoción
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inteligencia;