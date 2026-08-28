import { useState } from 'react';

// Interfaz para controlar los datasets cargados
interface DatasetItem {
  id: string;
  nombre: string;
  archivoNombre: string;
  filas: number;
  columnas: number;
  fecha: string;
}

const Ventas = () => {
  const [pestanaActiva, setPestanaActiva] = useState('Datasets');
  const pestanas = ['Inicio', 'Datasets', 'Pipeline', 'Insights', 'Inteligencia'];

  // Estados de Datasets
  const [nombreDataset, setNombreDataset] = useState('');
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);

  // Funciones de tarjetas de la pestaña Inicio
  const handlePipelineClick = () => console.log('Clic en Pipeline');
  const handleOfertasClick = () => console.log('Clic en Ofertas');
  const handleClaroOscuroClick = () => console.log('Clic en Claro u Oscuro');

  // Procesar archivo CSV para contar filas y columnas
  const procesarArchivoCSV = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo con extensión .csv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const contenido = e.target?.result as string;
      if (!contenido) return;

      const lineas = contenido.trim().split(/\r\n|\n/);
      const filasCount = lineas.length > 0 ? lineas.length - 1 : 0; // Excluye cabecera
      const columnasCount = lineas[0] ? lineas[0].split(',').length : 0;

      const fechaHoy = new Date();
      const fechaFormateada = `${fechaHoy.getDate()}/${fechaHoy.getMonth() + 1}/${fechaHoy.getFullYear()}`;

      const nuevoItem: DatasetItem = {
        id: Date.now().toString(),
        nombre: nombreDataset.trim() !== '' ? nombreDataset : file.name.replace('.csv', ''),
        archivoNombre: file.name,
        filas: filasCount,
        columnas: columnasCount,
        fecha: fechaFormateada,
      };

      setDatasets((prev) => [...prev, nuevoItem]);
      setNombreDataset('');
    };

    reader.readAsText(file);
  };

 // Evento al seleccionar archivo desde el Input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivoCSV(e.target.files[0]);
    }
  };

  // Eventos Drag & Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivoCSV(e.dataTransfer.files[0]);
    }
  };
  // Eliminar tarjeta de Dataset
  const handleEliminarDataset = (id: string) => {
    setDatasets((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Pestañas superiores */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '24px' }}>
        {pestanas.map((pestana) => (
          <button
            key={pestana}
            onClick={() => setPestanaActiva(pestana)}
            style={{
              padding: '6px 16px',
              fontSize: '14px',
              fontWeight: pestanaActiva === pestana ? '600' : '500',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: pestanaActiva === pestana ? '#d1fae5' : '#f3f4f6',
              color: pestanaActiva === pestana ? '#065f46' : '#4b5563',
              transition: 'all 0.2s',
            }}
          >
            {pestana}
          </button>
        ))}
      </div>

      {/* Pestaña: INICIO */}
      {pestanaActiva === 'Inicio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '650px' }}>
          <div
            onClick={handlePipelineClick}
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #d1fae5',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              cursor: 'pointer',
              alignItems: 'flex-start',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ backgroundColor: '#d1fae5', padding: '10px', borderRadius: '12px', display: 'flex', color: '#047857' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Pipeline de ventas</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                Mapea etapa, monto, responsable y fecha de cierre para obtener embudo, ticket promedio y proyección de ingresos.
              </p>
            </div>
          </div>

          <div
            onClick={handleOfertasClick}
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #d1fae5',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              cursor: 'pointer',
              alignItems: 'flex-start',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ backgroundColor: '#d1fae5', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857', fontWeight: 'bold', fontSize: '20px' }}>
              %
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Ofertas y promociones</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                Crea nuevas tablas de ofertas y campañas desde el front end, con descuentos, presupuesto y objetivos de ingreso.
              </p>
            </div>
          </div>

          <div
            onClick={handleClaroOscuroClick}
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #d1fae5',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              cursor: 'pointer',
              alignItems: 'flex-start',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ backgroundColor: '#d1fae5', padding: '10px', borderRadius: '12px', display: 'flex', color: '#047857' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Claro y oscuro</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                Interfaz profesional con tema claro y oscuro conmutable, tipografía técnica y tarjetas informativas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña: DATASETS */}
      {pestanaActiva === 'Datasets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Formulario / Zona de Carga */}
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151', fontWeight: '600' }}>Nuevo dataset</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '60%' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ventas Q3 2026"
                  value={nombreDataset}
                  onChange={(e) => setNombreDataset(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <label
                htmlFor="input-csv"
                style={{
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Seleccionar archivo
              </label>
              <input
                id="input-csv"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Arrastrar y soltar */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <div style={{ color: '#9ca3af', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Arrastra uno o varios archivos CSV aquí
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                Se detectan automáticamente separadores (...) y tabulación
              </p>
            </div>
          </div>

          {/* Listado de archivos agregados (Tarjetas) */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151', fontWeight: '600' }}>Tus archivos</h3>

            {datasets.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>No hay archivos agregados aún.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {datasets.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
                    {/* Encabezado con Icono CSV + Título + Basura */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{item.nombre}</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{item.archivoNombre}</p>
                        </div>
                      </div>

                      {/* Botón de Basura para Eliminar */}
                      <button
                        onClick={() => handleEliminarDataset(item.id)}
                        title="Eliminar dataset"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9ca3af',
                          padding: '4px',
                          display: 'flex',
                          borderRadius: '6px',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Metadatos (Filas, Columnas, Fecha) */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: '#e5e7eb', color: '#374151', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                        {item.filas} filas
                      </span>
                      <span style={{ backgroundColor: '#e5e7eb', color: '#374151', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                        {item.columnas} columnas
                      </span>
                      <span style={{ backgroundColor: '#e5e7eb', color: '#374151', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                        {item.fecha}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demás pestañas */}
      {pestanaActiva === 'Pipeline' && <div>{/* Contenido Pipeline */}</div>}
      {pestanaActiva === 'Insights' && <div>{/* Contenido Insights */}</div>}
      {pestanaActiva === 'Inteligencia' && <div>{/* Contenido Inteligencia */}</div>}
    </div>
  );
};

export default Ventas;