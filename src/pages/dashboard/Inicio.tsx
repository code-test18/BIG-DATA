import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useCsvCleaning } from '../../hooks/useCsvCleaning';
import { eliminarCsv, subirCsv } from '../../services/csvService';
import type { CsvFile, DashboardContextType } from '../../types/csv';

const COLORS = ['#2563eb', '#0f766e', '#d97706', '#dc2626', '#0891b2', '#7c3aed'];

type TipoDato = 'Número' | 'Texto' | 'Fecha';
type Origen = 'propio' | 'otro';

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
  const { files, addFile, removeFile, loadingFiles, loadError } = useOutletContext<DashboardContextType>();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(files[0]?.id ?? null);

  const [pendingOrigin, setPendingOrigin] = useState<Origen | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { inspectFile } = useCsvCleaning();

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedFileId) ?? files[0] ?? null,
    [files, selectedFileId],
  );

  const propios = useMemo(() => files.filter((f) => (f.origen ?? 'propio') === 'propio'), [files]);
  const otros = useMemo(() => files.filter((f) => f.origen === 'otro'), [files]);
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

  // Cada grupo (propios/otros) llama esto con su origen fijo; abre el explorador directo.
  const handleUploadClick = (origen: Origen) => {
    setUploadError(null);
    setPendingOrigin(origen);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !pendingOrigin) return;

    setUploadError(null);
    const inspectedFile = await inspectFile(file);
    if (!inspectedFile) {
      setPendingOrigin(null);
      return;
    }

    setIsUploading(true);
    try {
      const { csv } = await subirCsv(file, {
        filasCount: inspectedFile.rows.length,
        columnCount: inspectedFile.headers.length,
        tipo: pendingOrigin === 'propio' ? 'PROPIO' : 'OTRO',
      });

      addFile({
        ...inspectedFile,
        id: csv.id,
        urlArchivo: csv.urlArchivo,
        sizeKB: csv.tamanioBytes / 1024,
        synced: true,
        origen: pendingOrigin,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo guardar el CSV en el servidor.');
    } finally {
      setIsUploading(false);
      setPendingOrigin(null);
    }
  };

  const handleDeleteFile = async (file: CsvFile) => {
    if (!window.confirm(`¿Eliminar el archivo "${file.name}"?`)) return;
    try {
      await eliminarCsv(file.id);
      removeFile(file.id);
      if (selectedFile?.id === file.id) setSelectedFileId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar el archivo en el servidor.');
    }
  };

  return (
    <>
      <style>{`
        .dataset-group {
          margin-top: 1.25rem;
        }

        .dataset-group-heading {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
          margin-bottom: 0.6rem;
        }

        .dataset-group-count {
          background: #eef2ff;
          color: #4338ca;
          border-radius: 999px;
          padding: 0.1rem 0.55rem;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .dataset-group-add {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #475569;
          cursor: pointer;
          padding: 0;
        }

        .dataset-group-add:hover {
          background: #eef2ff;
          border-color: #6366f1;
          color: #4338ca;
        }

        .dataset-group-empty {
          font-size: 0.82rem;
          color: #94a3b8;
          padding: 0.5rem 0;
        }
      `}</style>
      <div className="dashboard-page home-dashboard">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Resumen del espacio de trabajo</p>
            <h2>Inicio</h2>
            <p>Una vista rápida de tus datasets cargados.</p>
          </div>
          <div className="dashboard-date">Actualizado hoy</div>
        </div>

        {loadingFiles && <div className="alert-success">Cargando tus CSVs guardados...</div>}
        {loadError && <div className="alert-error">{loadError}</div>}
        {isUploading && <div className="alert-success">Subiendo CSV...</div>}
        {uploadError && <div className="alert-error">{uploadError}</div>}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

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
              <div className="type-chart-body">
                <div className="type-chart-visual" aria-label="Distribución de tipos de dato">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={tiposData} dataKey="count" nameKey="tipo" innerRadius={38} outerRadius={58} paddingAngle={2}>
                        {tiposData.map((item, index) => <Cell key={item.tipo} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} columna(s)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="type-chart-legend">
                  {tiposData.map((item, index) => (
                    <div className="type-chart-legend-item" key={item.tipo}>
                      <span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
                      <span>{item.tipo}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : <ChartEmpty message="Carga un CSV para ver su estructura." />}
          </section>

          <section className="dashboard-card dataset-card">
            <div className="card-heading">
              <div>
                <h3>Datasets</h3>
                <p>Selecciona uno para ver su detalle.</p>
              </div>
            </div>

            <DatasetGroup
              title="Datasets propios"
              icon={User}
              files={propios}
              selectedFileId={selectedFile?.id}
              onSelect={setSelectedFileId}
              onDelete={handleDeleteFile}
              onUpload={() => handleUploadClick('propio')}
              emptyMessage="Aún no subiste ningún CSV propio."
            />

            <DatasetGroup
              title="Otros datasets"
              icon={Building2}
              files={otros}
              selectedFileId={selectedFile?.id}
              onSelect={setSelectedFileId}
              onDelete={handleDeleteFile}
              onUpload={() => handleUploadClick('otro')}
              emptyMessage="Aún no subiste CSVs de otros orígenes."
            />
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
    </>
  );
}

interface DatasetGroupProps {
  title: string;
  icon: typeof User;
  files: CsvFile[];
  selectedFileId?: string;
  onSelect: (id: string) => void;
  onDelete: (file: CsvFile) => void;
  onUpload: () => void;
  emptyMessage: string;
}

function DatasetGroup({ title, icon: Icon, files, selectedFileId, onSelect, onDelete, onUpload, emptyMessage }: DatasetGroupProps) {
  return (
    <div className="dataset-group">
      <div className="dataset-group-heading">
        <Icon size={14} />
        <span>{title}</span>
        <span className="dataset-group-count">{files.length}</span>
        <button type="button" className="dataset-group-add" aria-label={`Agregar a ${title}`} title="Subir CSV aquí" onClick={onUpload}>
          <Plus size={14} />
        </button>
      </div>

      {files.length === 0 ? (
        <p className="dataset-group-empty">{emptyMessage}</p>
      ) : (
        files.map((file) => (
          <DatasetRow
            key={file.id}
            file={file}
            isActive={file.id === selectedFileId}
            onSelect={() => onSelect(file.id)}
            onDelete={() => onDelete(file)}
          />
        ))
      )}
    </div>
  );
}

interface DatasetRowProps {
  file: CsvFile;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function DatasetRow({ file, isActive, onSelect, onDelete }: DatasetRowProps) {
  return (
    <button
      type="button"
      className={`dataset-row dataset-row-selectable${isActive ? ' dataset-row-active' : ''}`}
      onClick={onSelect}
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
            onDelete();
          }}
        />
      </div>
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, accent = false }: { icon: typeof Database; label: string; value: string; accent?: boolean }) {
  return <div className={`metric-card${accent ? ' metric-card-accent' : ''}`}><span><Icon size={16} />{label}</span><strong>{value}</strong></div>;
}

function ChartEmpty({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`chart-empty${compact ? ' chart-empty-compact' : ''}`}><BarChart3 size={compact ? 22 : 28} /><span>{message}</span></div>;
}

export default Inicio;