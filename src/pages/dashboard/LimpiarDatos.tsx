import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType } from '../../types/csv';

function LimpiarDatos() {
  const { files, activeFileId, setActiveFileId, updateFile } = useOutletContext<DashboardContextType>();
  const [fillValue, setFillValue] = useState<string>('N/A');
  const [message, setMessage] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId);

  // Métricas de datos nulos/vacíos
  const totalRows = activeFile?.rows.length || 0;
  
  const rowsWithEmpty = activeFile
    ? activeFile.rows.filter((row) => row.some((cell) => cell.trim() === '')).length
    : 0;

  const totalEmptyCells = activeFile
    ? activeFile.rows.reduce(
        (acc, row) => acc + row.filter((cell) => cell.trim() === '').length,
        0
      )
    : 0;

  // Estrategia 1: Eliminar filas con campos vacíos
  const handleRemoveEmptyRows = () => {
    if (!activeFile) return;

    const cleanedRows = activeFile.rows.filter((row) =>
      row.every((cell) => cell.trim() !== '')
    );

    const removedCount = totalRows - cleanedRows.length;

    updateFile({
      ...activeFile,
      rows: cleanedRows,
    });

    setMessage(`Se eliminaron ${removedCount} filas que contenían campos vacíos.`);
  };

  // Estrategia 2: Rellenar campos vacíos con un texto por defecto
  const handleFillEmptyCells = () => {
    if (!activeFile) return;

    const cleanedRows = activeFile.rows.map((row) =>
      row.map((cell) => (cell.trim() === '' ? fillValue : cell))
    );

    updateFile({
      ...activeFile,
      rows: cleanedRows,
    });

    setMessage(`Se rellenaron ${totalEmptyCells} casillas vacías con "${fillValue}".`);
  };

  return (
    <div className="dashboard-page">
      <h2>Limpieza de Datos</h2>
      <p>Detecta y corrige valores vacíos o nulos en tus archivos CSV.</p>

      {/* Selector de archivo */}
      {files.length > 0 ? (
        <>
          <div className="file-selector" style={{ marginTop: '1.5rem' }}>
            <span>Selecciona el archivo a limpiar:</span>
            <div className="file-tabs">
              {files.map((file) => (
                <button
                  key={file.id}
                  className={`tab-btn ${file.id === activeFileId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFileId(file.id);
                    setMessage(null);
                  }}
                >
                  {file.name}
                </button>
              ))}
            </div>
          </div>

          {activeFile && (
            <div className="clean-section">
              {/* Tarjetas de Métricas */}
              <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <h3>Filas Totales</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalRows}</p>
                </div>
                <div className="card">
                  <h3>Filas Incompletas</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rowsWithEmpty > 0 ? '#dc2626' : '#16a34a' }}>
                    {rowsWithEmpty}
                  </p>
                </div>
                <div className="card">
                  <h3>Celdas Vacías</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: totalEmptyCells > 0 ? '#dc2626' : '#16a34a' }}>
                    {totalEmptyCells}
                  </p>
                </div>
              </div>

              {message && <div className="alert-success">{message}</div>}

              {/* Panel de Acciones de Limpieza */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Opciones de Limpieza</h3>
                <div className="clean-actions">
                  <div className="action-group">
                    <p><strong>Opción 1:</strong> Eliminar filas incompletas</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleRemoveEmptyRows}
                      disabled={rowsWithEmpty === 0}
                      style={{ width: 'auto', background: rowsWithEmpty === 0 ? '#cbd5e1' : '#dc2626' }}
                    >
                      Eliminar {rowsWithEmpty} filas vacías
                    </button>
                  </div>

                  <hr style={{ margin: '1rem 0', borderColor: '#e2e8f0' }} />

                  <div className="action-group">
                    <p><strong>Opción 2:</strong> Rellenar campos vacíos</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={fillValue}
                        onChange={(e) => setFillValue(e.target.value)}
                        placeholder="Valor de reemplazo (ej. N/A, 0)"
                        style={{ maxWidth: '200px' }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleFillEmptyCells}
                        disabled={totalEmptyCells === 0}
                        style={{ width: 'auto', background: totalEmptyCells === 0 ? '#cbd5e1' : '#2563eb' }}
                      >
                        Reemplazar vacíos
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Previsualización del estado actual de los datos */}
              <div className="table-wrapper">
                <div className="table-header-info">
                  <h3>Vista Previa: {activeFile.name}</h3>
                  <small>{activeFile.rows.length} filas actuales</small>
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
                            <td key={cIdx}>
                              {cell.trim() !== '' ? (
                                cell
                              ) : (
                                <span className="empty-cell" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                  (vacío)
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>No hay archivos para limpiar. Primero ve a la sección <strong>Procesar</strong> y sube un CSV.</p>
        </div>
      )}
    </div>
  );
}

export default LimpiarDatos;