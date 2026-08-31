import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardContextType } from '../../types/csv';
import type { VentasSelection, VentaReporte } from '../../types/ventas';
import { calcularMetricasVentas, type ResultadoCalculoVentas } from '../../utils/calcularMetricasVentas';
import { guardarReporte } from '../../utils/reportesStorage';
import type { PuntoParticipacion } from '../../types/ventas';

const COLORES_TORTA = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

function Ventas() {
  const { files, activeFileId, setActiveFileId } = useOutletContext<DashboardContextType>();
  const [selection, setSelection] = useState<VentasSelection>({});
  const [guardado, setGuardado] = useState(false);

  const cleanFiles = files.filter((file) => file.isClean);
  const activeFile = cleanFiles.find((file) => file.id === activeFileId) ?? cleanFiles[0];

  const handleFileChange = (fileId: string) => {
    setActiveFileId(fileId);
    setSelection({});
    setGuardado(false);
  };

  const handleColumnChange = (role: keyof VentasSelection, value: string) => {
    setSelection((current) => ({ ...current, [role]: value }));
    setGuardado(false);
  };

  const mapeoCompleto =
    selection.fecha && selection.categoria && selection.monto
      ? { fecha: selection.fecha, categoria: selection.categoria, monto: selection.monto }
      : null;

  const resultado =
    activeFile && mapeoCompleto ? calcularMetricasVentas(activeFile, mapeoCompleto) : null;

  const handleGuardarReporte = () => {
    if (!activeFile || !resultado || !mapeoCompleto) return;

    const reporte: VentaReporte = {
      id: crypto.randomUUID(),
      tipo: 'ventas',
      nombreArchivo: activeFile.name,
      createdAt: new Date().toISOString(),
      mapeo: {
        ...mapeoCompleto,
        cantidad: selection.cantidad,
      },
      metricas: resultado.metricas,
      graficoPorCategoria: resultado.graficoPorCategoria,
      graficoPorFecha: resultado.graficoPorFecha,
      participacionCategoria: resultado.participacionCategoria,
    };

    guardarReporte(reporte);
    setGuardado(true);
  };

  return (
    <div className="dashboard-page">
      <h2>Ventas</h2>
      <p>Selecciona un CSV limpio y mapea las columnas para obtener un análisis comercial.</p>

      {cleanFiles.length === 0 ? (
        <div className="empty-state">
          <p>No hay CSV limpios disponibles. Primero carga y limpia un archivo.</p>
        </div>
      ) : (
        <section className="analysis-panel">
          <div className="step-heading">
            <span>01</span>
            <div>
              <h3>Selecciona el CSV limpio</h3>
              <p>Los encabezados se cargarán desde el archivo elegido.</p>
            </div>
          </div>
          <select
            className="form-input"
            value={activeFile?.id ?? ''}
            onChange={(event) => handleFileChange(event.target.value)}
          >
            {cleanFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name} · {file.rows.length} registros
              </option>
            ))}
          </select>

          <div className="step-heading">
            <span>02</span>
            <div>
              <h3>Mapea las columnas</h3>
              <p>Fecha, categoría y monto son obligatorios. Cantidad es opcional. Los resultados se actualizan automáticamente.</p>
            </div>
          </div>
          {activeFile && (
            <div className="analysis-fields">
              <label className="form-group">
                <span className="form-label">Columna de fecha</span>
                <select
                  className="form-input"
                  value={selection.fecha ?? ''}
                  onChange={(event) => handleColumnChange('fecha', event.target.value)}
                >
                  <option value="">Selecciona un header</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Columna de categoría</span>
                <select
                  className="form-input"
                  value={selection.categoria ?? ''}
                  onChange={(event) => handleColumnChange('categoria', event.target.value)}
                >
                  <option value="">Selecciona un header</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Columna de monto</span>
                <select
                  className="form-input"
                  value={selection.monto ?? ''}
                  onChange={(event) => handleColumnChange('monto', event.target.value)}
                >
                  <option value="">Selecciona un header</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Columna de cantidad (opcional)</span>
                <select
                  className="form-input"
                  value={selection.cantidad ?? ''}
                  onChange={(event) => handleColumnChange('cantidad', event.target.value)}
                >
                  <option value="">Sin seleccionar</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {!resultado && (
            <p className="hint-text">Selecciona fecha, categoría y monto para ver los resultados.</p>
          )}

          {resultado && (
            <ResultadoVentas
              resultado={resultado}
              onGuardar={handleGuardarReporte}
              guardado={guardado}
            />
          )}
        </section>
      )}
    </div>
  );
}

interface ResultadoVentasProps {
  resultado: ResultadoCalculoVentas;
  onGuardar: () => void;
  guardado: boolean;
}

function ResultadoVentas({ resultado, onGuardar, guardado }: ResultadoVentasProps) {
  const { metricas, graficoPorCategoria, graficoPorFecha, participacionCategoria } = resultado;

  return (
    <div className="resultado-ventas">
      <div className="metric-cards">
        <div className="metric-card">
          <span className="metric-label">Ingreso total</span>
          <span className="metric-value">${metricas.ingresoTotal.toFixed(2)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Ticket promedio</span>
          <span className="metric-value">${metricas.ticketPromedio.toFixed(2)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Categoría top</span>
          <span className="metric-value">{metricas.categoriaTop}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Transacciones</span>
          <span className="metric-value">{metricas.numeroTransacciones}</span>
        </div>
      </div>

      <div className="chart-block">
        <h4>Ingreso por categoría</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graficoPorCategoria}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-block">
        <h4>Tendencia de ingresos en el tiempo</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graficoPorFecha}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#06b6d4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-block">
        <h4>Participación por categoría</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={participacionCategoria}
              dataKey="porcentaje"
              nameKey="categoria"
              outerRadius={100}
              label={(entry) => {
                const punto = entry as unknown as PuntoParticipacion;
                return `${punto.categoria}: ${punto.porcentaje.toFixed(1)}%`;
            }}
            >
              {participacionCategoria.map((_, index) => (
                <Cell key={index} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <button className="btn btn-secondary report-cta" onClick={onGuardar} disabled={guardado}>
        {guardado ? 'Reporte guardado ✓' : 'Guardar Reporte'}
      </button>
    </div>
  );
}

export default Ventas;