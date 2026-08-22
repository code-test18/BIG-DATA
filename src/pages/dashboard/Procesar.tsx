import { useState, type ChangeEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import Papa from 'papaparse';
import type { DashboardContextType, CsvFile } from '../../types/csv';

function Procesar() {
  const { files, activeFileId, addFile, setActiveFileId } = useOutletContext<DashboardContextType>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const activeFile = files.find((f) => f.id === activeFileId);

  // Lógica de carga utilizando PapaParse
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data;
        if (rawData.length === 0) return;

        // Extraer encabezados y filas
        const headers = rawData[0].map((h) => h.trim());
        const rows = rawData.slice(1).map((row) => row.map((cell) => cell.trim()));

        const newCsvFile: CsvFile = {
          id: crypto.randomUUID(),
          name: file.name,
          headers,
          rows,
          uploadedAt: new Date().toLocaleTimeString(),
        };

        addFile(newCsvFile);
      },
      error: (error) => {
        console.error('Error al procesar el archivo CSV:', error);
      },
    });

    e.target.value = ''; // Limpiar el input de archivos
  };

  // Solo tomar las primeras 50 filas para la vista previa
  const previewRows = activeFile ? activeFile.rows.slice(0, 50) : [];
  const totalRows = activeFile ? activeFile.rows.length : 0;

  return (
    <div className="dashboard-page">
      <h2>Procesar Archivos CSV</h2>
      <p>Carga y visualiza tus conjuntos de datos masivos.</p>

      {/* Carga de archivo */}
      <div className="upload-box">
        <label htmlFor="csv-input" className="btn btn-primary upload-btn">
          📂 Subir archivo CSV
        </label>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Selector de archivos cargados */}
      {files.length > 0 && (
        <div className="file-selector">
          <span>Archivos cargados:</span>
          <div className="file-tabs">
            {files.map((file) => (
              <button
                key={file.id}
                className={`tab-btn ${file.id === activeFileId ? 'active' : ''}`}
                onClick={() => {
                  setActiveFileId(file.id);
                  setIsModalOpen(false);
                }}
              >
                {file.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vista Previa Limitada */}
      {activeFile ? (
        <div className="table-wrapper">
          <div className="table-header-info">
            <div>
              <h3>{activeFile.name}</h3>
              <small>
                Mostrando {previewRows.length} de {totalRows} filas | {activeFile.headers.length} columnas
              </small>
            </div>

            {totalRows > 50 && (
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                Ver completo ({totalRows} filas)
              </button>
            )}
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {activeFile.headers.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell || <span className="empty-cell">(vacío)</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No hay datos cargados. Sube un archivo CSV para previsualizar su contenido.</p>
        </div>
      )}

      {/* Modal para Visualización Completa */}
      {isModalOpen && activeFile && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Dataset Completo: {activeFile.name}</h3>
                <small>{totalRows} filas registradas</small>
              </div>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="table-scroll" style={{ maxHeight: '60vh' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {activeFile.headers.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeFile.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{cell || <span className="empty-cell">(vacío)</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Procesar;