import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import type { AnalysisRequest, AnalysisSelection } from '../../types/analysis';
import type { DashboardContextType } from '../../types/csv';

function Procesar() {
  // Estado de selección: el usuario escoge el CSV y dos headers reales.
  const { files, activeFileId, setActiveFileId, setAnalysisResult } = useOutletContext<DashboardContextType>();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<AnalysisSelection>({});
  const [hasProcessed, setHasProcessed] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { runAnalysis, status, error, clearError } = useAnalysis();

  // Solo los CSV que el usuario confirmó como limpios pueden entrar en este flujo.
  const cleanFiles = files.filter((file) => file.isClean);
  const activeFile = cleanFiles.find((file) => file.id === activeFileId) ?? cleanFiles[0];

  // Cambiar de archivo reinicia el mapeo porque sus headers pueden ser distintos.
  const handleFileChange = (fileId: string) => {
    setActiveFileId(fileId);
    setSelection({});
    setHasProcessed(false);
    setSelectionError(null);
    clearError();
  };

  // Cada select actualiza únicamente el rol que representa.
  const handleColumnChange = (role: 'category' | 'metric', value: string) => {
    setSelection((current) => ({ ...current, [role]: value }));
    setHasProcessed(false);
    setSelectionError(null);
    clearError();
  };

  // El hook valida y el servicio agrupa la métrica seleccionada por la categoría.
  const handleProcess = async () => {
    if (!activeFile) return;
    if (!selection.category || !selection.metric) {
      setSelectionError('Selecciona una categoría y una métrica antes de iniciar el análisis.');
      return;
    }
    const request: AnalysisRequest = { target: 'dynamic_mapping', columns: selection };
    const result = await runAnalysis(activeFile, request);
    if (result) {
      setAnalysisResult(result);
      setHasProcessed(true);
    }
  };

  // Renderiza el selector del dataset, los headers dinámicos y el CTA al reporte.
  return (
    <div className="dashboard-page">
      <h2>Procesar y analizar</h2>
      <p>Selecciona un CSV limpio y relaciona una categoría con una métrica numérica.</p>
      {cleanFiles.length === 0 ? <div className="empty-state"><p>No hay CSV limpios disponibles. Primero carga y limpia un archivo.</p></div> : <section className="analysis-panel">
        <div className="step-heading"><span>01</span><div><h3>Selecciona el CSV limpio</h3><p>Los encabezados se cargarán desde el archivo elegido.</p></div></div>
        <select className="form-input" value={activeFile?.id ?? ''} onChange={(event) => handleFileChange(event.target.value)}>{cleanFiles.map((file) => <option key={file.id} value={file.id}>{file.name} · {file.rows.length} registros</option>)}</select>

        <div className="step-heading"><span>02</span><div><h3>Define el objetivo</h3><p>Usa cualquier columna categórica y cualquier columna numérica del CSV.</p></div></div>
        {activeFile && <div className="analysis-fields"><label className="form-group"><span className="form-label">Agrupar por / Categoría</span><select className="form-input" value={selection.category ?? ''} onChange={(event) => handleColumnChange('category', event.target.value)}><option value="">Selecciona un header</option>{activeFile.headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label><label className="form-group"><span className="form-label">Medir / Métrica</span><select className="form-input" value={selection.metric ?? ''} onChange={(event) => handleColumnChange('metric', event.target.value)}><option value="">Selecciona un header</option>{activeFile.headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label></div>}

        <div className="step-heading compact"><span>03</span><div><h3>Ejecuta el análisis</h3><p>La métrica se sumará para cada valor de la categoría.</p></div></div>
        {(error || selectionError) && <div className="alert-error">{error || selectionError}</div>}
        <button className="btn btn-primary process-btn" onClick={handleProcess} disabled={status === 'loading'}>{status === 'loading' ? 'Procesando...' : 'Iniciar Análisis'}</button>
        {status === 'success' && hasProcessed && <button className="btn btn-secondary report-cta" onClick={() => navigate('/dashboard/reportes')}>Generar Reporte →</button>}
      </section>}
    </div>
  );
}

export default Procesar;
