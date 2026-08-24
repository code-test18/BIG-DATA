import { useState, type ChangeEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCsvCleaning } from '../../hooks/useCsvCleaning';
import { inspectCsvRows } from '../../services/csvCleaningService';
import type { DashboardContextType } from '../../types/csv';
import CsvCharts from '../../components/CsvCharts';

function LimpiarDatos() {
  const { files, activeFileId, setActiveFileId, addFile, updateFile } = useOutletContext<DashboardContextType>();
  const [fillValue, setFillValue] = useState('N/A');
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);

  const { inspectFile, cleanFile, status, error } = useCsvCleaning();
  const activeFile = files.find((file) => file.id === activeFileId);
  const qualitySummary = activeFile ? inspectCsvRows(activeFile.rows) : null;

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(null);
    const inspectedFile = await inspectFile(file);
    if (inspectedFile) {
      addFile(inspectedFile);
      setMessage('Diagnóstico listo. Revisa los datos y pulsa "Limpiar y guardar CSV" para continuar.');
    }
    event.target.value = '';
  };

  const handleClean = async () => {
    if (!activeFile || activeFile.isClean) return;
    setIsCleaning(true);
    setProgress(0);
    
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

    updateFile({ ...activeFile, rows: cleanedRows, isClean: true });
    setIsCleaning(false);
    setMessage('CSV limpio y guardado. Ya está disponible en Procesar.');
  };

  return (
    <div className="dashboard-page">
      <h2>Carga y limpieza</h2>
      <p>Sube un CSV para consultar su calidad antes de aplicar cambios.</p>
      <div className="upload-box">
        <label htmlFor="clean-csv-input" className="btn btn-primary upload-btn">📂 Subir CSV</label>
        <input id="clean-csv-input" type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
      </div>
      {status === 'loading' && <div className="alert-success">Analizando el archivo...</div>}
      {error && <div className="alert-error">{error}</div>}
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
        <div className="file-selector"><span>Archivos cargados:</span><div className="file-tabs">{files.map((file) => <button key={file.id} className={`tab-btn ${file.id === activeFileId ? 'active' : ''}`} onClick={() => { setActiveFileId(file.id); setMessage(null); }}>{file.name}{file.isClean ? ' · limpio' : ' · pendiente'}</button>)}</div></div>
        {activeFile && <>
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="card"><h3>Registros</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeFile.rows.length}</p></div>
            <div className="card"><h3>Valores vacíos</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{qualitySummary?.emptyValues ?? 0}</p></div>
            <div className="card"><h3>Valores nulos</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{qualitySummary?.nullValues ?? 0}</p></div>
            <div className="card"><h3>Filas duplicadas</h3><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{qualitySummary?.removedDuplicates ?? 0}</p></div>
          </div>
          
          <div className="card cleaning-actions"><h3>{activeFile.isClean ? 'CSV limpio' : 'Aplicar limpieza'}</h3><p>{activeFile.isClean ? 'Este archivo ya fue limpiado y está disponible para análisis.' : 'El diagnóstico no ha modificado el archivo. Escribe el valor para reemplazar los campos vacíos y confirma la limpieza.'}</p>{!activeFile.isClean && <div className="clean-action-row"><input className="form-input" value={fillValue} onChange={(event) => setFillValue(event.target.value)} placeholder="Valor de reemplazo" /><button className="btn btn-primary" onClick={handleClean}>Limpiar y guardar CSV</button></div>}</div>
          <CsvCharts
            headers={activeFile.headers}
            rows={activeFile.rows}
            summary={qualitySummary!}
          />

          <div className="table-wrapper"><div className="table-header-info"><h3>Vista previa: {activeFile.name}</h3><small>{activeFile.rows.length} filas · {activeFile.isClean ? 'limpias' : 'sin modificar'}</small></div><div className="table-scroll"><table className="data-table"><thead><tr>{activeFile.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{activeFile.rows.slice(0, 50).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell || <span className="empty-cell">(vacío)</span>}</td>)}</tr>)}</tbody></table></div></div>
        </>}
      </> : <div className="empty-state"><p>No hay archivos cargados. Sube un CSV para comenzar.</p></div>}
    </div>
  );
}

export default LimpiarDatos;