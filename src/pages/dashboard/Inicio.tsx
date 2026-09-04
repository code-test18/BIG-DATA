import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CsvFile, DashboardContextType } from '../../types/csv';

const COLORS = ['#2563eb', '#0f766e', '#d97706', '#dc2626', '#0891b2', '#7c3aed'];

type TipoDato = 'Número' | 'Texto' | 'Fecha';

interface ColumnaEstructura {
  columna: string;
  tipo: TipoDato;
  min: string;
  max: string;
  media: string;
  mediana: string;
}

// Heurística simple para detectar el tipo de una columna a partir de sus valores
function detectarTipo(valores: string[]): TipoDato {
  const noVacios = valores.filter((v) => v.trim() !== '');
  if (noVacios.length === 0) return 'Texto';

  const esFecha = noVacios.every((v) => !Number.isNaN(Date.parse(v)) && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(v));
  if (esFecha) return 'Fecha';

  const esNumero = noVacios.every((v) => !Number.isNaN(Number(v.replace(',', '.'))));
  if (esNumero) return 'Número';

  return 'Texto';
}

function calcularEstructura(file: CsvFile): ColumnaEstructura[] {
  return file.headers.map((header, colIndex) => {
    const valores = file.rows.map((row) => row[colIndex] ?? '');
    const tipo = detectarTipo(valores);

    if (tipo !== 'Número') {
      return { columna: header, tipo, min: '—', max: '—', media: '—', mediana: '—' };
    }

    const numeros = valores
      .filter((v) => v.trim() !== '')
      .map((v) => Number(v.replace(',', '.')))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    if (numeros.length === 0) {
      return { columna: header, tipo, min: '—', max: '—', media: '—', mediana: '—' };
    }

    const min = numeros[0];
    const max = numeros[numeros.length - 1];
    const media = numeros.reduce((acc, n) => acc + n, 0) / numeros.length;
    const mitad = Math.floor(numeros.length / 2);
    const mediana = numeros.length % 2 === 0
      ? (numeros[mitad - 1] + numeros[mitad]) / 2
      : numeros[mitad];

    const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

    return { columna: header, tipo, min: fmt(min), max: fmt(max), media: fmt(media), mediana: fmt(mediana) };
  });
}

function formatSize(sizeKB?: number) {
  if (!sizeKB) return '—';
  if (sizeKB < 1024) return `${sizeKB.toFixed(0)} KB`;
  return `${(sizeKB / 1024).toFixed(2)} MB`;
}

function Inicio() {
  const { files, removeFile } = useOutletContext<DashboardContextType>();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(files[0]?.id ?? null);

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedFileId) ?? files[0] ?? null,
    [files, selectedFileId],
  );

  const propios = files.filter((f) => (f.origen ?? 'propio') === 'propio');
  const otros = files.filter((f) => f.origen === 'otro');
  const pendientes = files.filter((f) => !f.isClean);

  const estructura = useMemo(
    () => (selectedFile ? calcularEstructura(selectedFile) : []),
    [selectedFile],
  );

  const tiposData = useMemo(() => {
    if (estructura.length === 0) return [];
    const conteo: Record<TipoDato, number> = { 'Número': 0, 'Texto': 0, 'Fecha': 0 };
    estructura.forEach((col) => { conteo[col.tipo] += 1; });
    return (Object.entries(conteo) as [TipoDato, number][])
      .filter(([, count]) => count > 0)
      .map(([tipo, count]) => ({ tipo, count }));
  }, [estructura]);

  return (
    <div className="dashboard-page home-dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Resumen del espacio de trabajo</p>
          <h2>Inicio</h2>
          <p>Una vista rápida de tus datasets cargados.</p>
        </div>
        <div className="dashboard-date">Actualizado hoy</div>
      </div>

      <div className="dashboard-kpis">
        <MetricCard icon={Database} label="Datasets cargados" value={files.length.toString()} accent />
        <MetricCard icon={FileSpreadsheet} label="Propios" value={propios.length.toString()} />
        <MetricCard icon={FileSpreadsheet} label="Otros" value={otros.length.toString()} />
        <MetricCard icon={AlertCircle} label="Pendientes de limpiar" value={pendientes.length.toString()} />
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-card chart-card">
          <div className="card-heading">
            <div>
              <h3>Tipos de dato por columna</h3>
              <p>Estructura del dataset seleccionado.</p>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </div>
          {tiposData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tiposData} dataKey="count" nameKey="tipo" innerRadius={62} outerRadius={92} paddingAngle={2}>
                  {tiposData.map((item, index) => <Cell key={item.tipo} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} columna(s)`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartEmpty message="Carga un CSV para ver su estructura." />}
        </section>

        <section className="dashboard-card dataset-card">
          <div className="card-heading">
            <div>
              <h3>Datasets</h3>
              <p>Selecciona uno para ver su detalle.</p>
            </div>
            <button type="button" className="icon-button-round" aria-label="Agregar CSV" title="Agregar CSV (próximamente)">
              <Plus size={16} />
            </button>
          </div>
          {files.length > 0 ? files.map((file) => (
            <button
              type="button"
              className={`dataset-row dataset-row-selectable${file.id === selectedFile?.id ? ' dataset-row-active' : ''}`}
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!window.confirm(`¿Eliminar el archivo "${file.name}"?`)) return;
                    removeFile(file.id);
                    if (selectedFile?.id === file.id) setSelectedFileId(null);
                  }}
                />
              </div>
            </button>
          )) : <ChartEmpty message="Aún no hay archivos cargados." compact />}
        </section>
      </div>

      <section className="dashboard-card participation-card">
        <div className="card-heading">
          <div>
            <h3>Estructura del dataset</h3>
            <p>Detalle por columna del archivo seleccionado.</p>
          </div>
        </div>
        {estructura.length > 0 ? (
          <div className="estructura-table-wrapper">
            <table className="estructura-table">
              <thead>
                <tr>
                  <th>Columna</th>
                  <th>Tipo</th>
                  <th>Mín.</th>
                  <th>Máx.</th>
                  <th>Media</th>
                  <th>Mediana</th>
                </tr>
              </thead>
              <tbody>
                {estructura.map((col) => (
                  <tr key={col.columna}>
                    <td>{col.columna}</td>
                    <td>{col.tipo}</td>
                    <td>{col.min}</td>
                    <td>{col.max}</td>
                    <td>{col.media}</td>
                    <td>{col.mediana}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <ChartEmpty message="Selecciona un dataset para ver su estructura." />}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent = false }: { icon: typeof Database; label: string; value: string; accent?: boolean }) {
  return <div className={`metric-card${accent ? ' metric-card-accent' : ''}`}><span><Icon size={16} />{label}</span><strong>{value}</strong></div>;
}

function ChartEmpty({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`chart-empty${compact ? ' chart-empty-compact' : ''}`}><BarChart3 size={compact ? 22 : 28} /><span>{message}</span></div>;
}

export default Inicio;