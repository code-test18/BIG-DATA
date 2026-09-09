import { CheckCircle2, AlertCircle, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCsvCleaning } from '../../hooks/useCsvCleaning';
import { buildCsvFile, inspectCsvRows } from '../../services/csvCleaningService';
import { eliminarCsv, marcarComoLimpio } from '../../services/csvService';
import type { DashboardContextType } from '../../types/csv';
import CsvCharts from '../../components/CsvCharts';

function formatSize(sizeKB?: number) {
  if (!sizeKB) return '—';
  if (sizeKB < 1024) return `${sizeKB.toFixed(0)} KB`;
  return `${(sizeKB / 1024).toFixed(2)} MB`;
}

function LimpiarDatos() {
  const { files, activeFileId, setActiveFileId, updateFile, removeFile } = useOutletContext<DashboardContextType>();
  const [fillValue, setFillValue] = useState('N/A');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);

  const { cleanFile, error } = useCsvCleaning();
  const activeFile = files.find((file) => file.id === activeFileId);
  const qualitySummary = activeFile ? inspectCsvRows(activeFile.rows) : null;

  const filteredRows = useMemo(() => {
    if (!activeFile) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return activeFile.rows;
    return activeFile.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(term)));
  }, [activeFile, searchTerm]);

  const handleClean = async () => {
    if (!activeFile || activeFile.isClean) return;
    setIsCleaning(true);
    setProgress(0);
    setErrorMsg(null);

    const chunkSize = 2000;
    const total = activeFile.rows.length;
    const cleanedRows: string[][] = [];

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = activeFile.rows.slice(i, i + chunkSize);
      cleanedRows.push(...cleanFile({ ...activeFile, rows: chunk }, fillValue).rows);

      const currentProgress = Math.round((Math.min(i + chunkSize, total) / total) * 100);
      setProgress(currentProgress);

      // Mantiene el hilo libre para que el DOM muestre la animación
      await new Promise((r) => setTimeout(r, 20));
    }

    try {
      // Reconstruimos un File real con las filas ya limpias y lo mandamos
      // a PUT /csv/:id/limpiar (multipart/form-data, sin campo "tipo").
      const cleanedFile = buildCsvFile(activeFile.name, activeFile.headers, cleanedRows);
      const { csv } = await marcarComoLimpio(activeFile.id, cleanedFile, {
        filasCount: cleanedRows.length,
        columnCount: activeFile.headers.length,
      });

      // Importante: la urlArchivo puede cambiar (Cloudinary invalida caché),
      // así que actualizamos el estado local con lo que venga en la respuesta.
      updateFile({
        ...activeFile,
        rows: cleanedRows,
        isClean: true,
        urlArchivo: csv.urlArchivo,
        sizeKB: csv.tamanioBytes / 1024,
      });
      setMessage('CSV limpio y guardado en el servidor. Ya está disponible en Procesar.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar el CSV limpio en el servidor.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRemoveFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`¿Eliminar el archivo "${fileName}"?`)) return;
    setErrorMsg(null);
    try {
      await eliminarCsv(fileId);
      removeFile(fileId);
      setMessage('Archivo eliminado.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar el archivo en el servidor.');
    }
  };

  return (
    <div className="dashboard-page">
      <h2>Carga y limpieza</h2>
      <p>Selecciona un dataset para revisar su calidad y aplicar la limpieza.</p>

      {error && <div className="alert-error">{error}</div>}
      {errorMsg && <div className="alert-error">{errorMsg}</div>}
      {message && <div className="alert-success">{message}</div>}

      {/* Barra de progreso real en tiempo real */}
      {isCleaning && (
        <div style={{ margin: '1rem 0', padding: '1rem', background: '#1e293b', borderRadius: '8px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            <span>Limpiando filas...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '12px', backgroundColor: '#334155', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.1s ease' }} />
          </div>
        </div>
      )}

      {files.length > 0 ? <>
        <div className="dataset-card">
          <span className="file-selector-label">Archivos cargados:</span>
          <div className="dataset-row-horizontal-list">
          {files.map((file) => (
            <button
              type="button"
              key={file.id}
              className={`dataset-row dataset-row-selectable${file.id === activeFileId ? ' dataset-row-active' : ''}`}
              onClick={() => { setActiveFileId(file.id); setMessage(null); }}
            >
              <div>
                <strong>{file.name}</strong>
                <span>
                  {file.rows.length.toLocaleString('en-US')} filas · {file.headers.length} columnas · {formatSize(file.sizeKB)} · {file.isClean ? 'limpio' : 'pendiente'}
                </span>
              </div>
              <div className="dataset-row-actions">
                {file.isClean ? <CheckCircle2 size={18} className="status-success" /> : <AlertCircle size={18} className="status-warning" />}
                <Trash2
                  size={16}
                  className="dataset-delete-icon"
                  aria-label={`Eliminar ${file.name}`}
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id, file.name); }}
                />
              </div>
            </button>
          ))}
          </div>
        </div>
        {activeFile && <>
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="card"><h3>Registros</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeFile.rows.length}</p></div>
            <div className="card"><h3>Valores vacíos</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{qualitySummary?.emptyValues ?? 0}</p></div>
            <div className="card"><h3>Valores nulos</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{qualitySummary?.nullValues ?? 0}</p></div>
            <div className="card"><h3>Filas duplicadas</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{qualitySummary?.removedDuplicates ?? 0}</p></div>
          </div>

          <div className="card cleaning-actions"><h3>{activeFile.isClean ? 'CSV limpio' : 'Aplicar limpieza'}</h3><p>{activeFile.isClean ? 'Este archivo ya fue limpiado y está disponible para análisis.' : 'El diagnóstico no ha modificado el archivo. Escribe el valor para reemplazar los campos vacíos y confirma la limpieza.'}</p>{!activeFile.isClean && <div className="clean-action-row"><input className="form-input" value={fillValue} onChange={(event) => setFillValue(event.target.value)} placeholder="Valor de reemplazo" /><button className="btn btn-primary" onClick={handleClean} disabled={isCleaning}>{isCleaning ? 'Guardando...' : 'Limpiar y guardar CSV'}</button></div>}</div>
          <CsvCharts
            headers={activeFile.headers}
            rows={activeFile.rows}
            summary={qualitySummary!}
          />

          <div className="table-wrapper">
            <div className="table-header-info">
              <h3>Vista previa: {activeFile.name}</h3>
              <small>{filteredRows.length} de {activeFile.rows.length} filas · {activeFile.isClean ? 'limpias' : 'sin modificar'}</small>
            </div>
            <div className="table-search-row">
              <Search size={16} />
              <input
                type="text"
                className="table-search-input"
                placeholder="Buscar en las filas..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr>{activeFile.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>
                  {filteredRows.slice(0, 50).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell.trim() !== '' ? cell : <span className="empty-cell" role="status">[VACÍO]</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}
      </> : <div className="empty-state"><p>No hay archivos cargados. Sube uno desde Inicio para comenzar.</p></div>}
    </div>
  );
}

export default LimpiarDatos;