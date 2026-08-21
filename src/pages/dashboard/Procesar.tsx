import { type ChangeEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType, CsvFile } from '../../types/csv';

function Procesar() {
  const { files, activeFileId, addFile, setActiveFileId } = useOutletContext<DashboardContextType>();

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Dividir por líneas y detectar delimitador (, o ;)
      const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== '');
      if (lines.length === 0) return;

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map((line) =>
        line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''))
      );

      const newCsvFile: CsvFile = {
        id: crypto.randomUUID(),
        name: file.name,
        headers,
        rows,
        uploadedAt: new Date().toLocaleTimeString(),
      };

      addFile(newCsvFile);
      e.target.value = ''; // Limpiar el input file
    };

    reader.readAsText(file);
  };

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

      {/* Selector de archivos activos */}
      {files.length > 0 && (
        <div className="file-selector">
          <span>Archivos cargados:</span>
          <div className="file-tabs">
            {files.map((file) => (
              <button
                key={file.id}
                className={`tab-btn ${file.id === activeFileId ? 'active' : ''}`}
                onClick={() => setActiveFileId(file.id)}
              >
                {file.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visualización de la tabla */}
      {activeFile ? (
        <div className="table-wrapper">
          <div className="table-header-info">
            <h3>{activeFile.name}</h3>
            <small>{activeFile.rows.length} filas | {activeFile.headers.length} columnas</small>
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
      ) : (
        <div className="empty-state">
          <p>No hay datos cargados. Sube un archivo CSV para previsualizar su contenido.</p>
        </div>
      )}
    </div>
  );
}

export default Procesar;