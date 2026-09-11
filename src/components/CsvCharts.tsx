import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Check, Hash } from 'lucide-react';

import type { CsvCleaningSummary } from '../services/csvCleaningService';
import { getDatasetColor } from '../utils/datasetColors';

import './CsvCharts.css';

interface CsvChartsProps {
  /** id del dataset (para color determinístico) y nombre visible en el encabezado. */
  datasetId: string;
  datasetName: string;
  headers: string[];
  rows: string[][];
  summary: CsvCleaningSummary;
}

interface NumericColumn {
  name: string;
  promedio: number;
}

function isNullValue(value: string): boolean {
  return ['null', 'nil', 'none'].includes(value.trim().toLowerCase());
}

function isNumeric(value: string): boolean {
  if (!value.trim() || isNullValue(value)) return false;
  const normalized = value.trim().replace(',', '.');
  return !Number.isNaN(Number(normalized));
}

function CsvCharts({ datasetId, datasetName, headers, rows, summary }: CsvChartsProps) {
  const color = getDatasetColor(datasetId);

  const numericColumns: NumericColumn[] = headers
    .map((header, columnIndex) => {
      const values = rows
        .map((row) => row[columnIndex] ?? '')
        .filter((value) => value.trim() !== '' && !isNullValue(value));

      if (values.length === 0) return null;

      const numericValues = values.filter(isNumeric);
      // Una columna se considera numérica si al menos el 70% de sus valores son números.
      if (numericValues.length / values.length < 0.7) return null;

      const total = numericValues.reduce((sum, value) => sum + Number(value.replace(',', '.')), 0);
      const promedio = total / numericValues.length;

      return { name: header, promedio: Number(promedio.toFixed(2)) };
    })
    .filter((column): column is NumericColumn => column !== null);

  const totalCells = rows.length * headers.length;
  const validCells = Math.max(totalCells - summary.emptyValues - summary.nullValues, 0);
  const qualityData = [
    { name: 'Celdas válidas', cantidad: validCells, color: '#0f766e' },
    { name: 'Celdas vacías', cantidad: summary.emptyValues, color: '#d97706' },
    { name: 'Valores nulos', cantidad: summary.nullValues, color: '#dc2626' },
    { name: 'Duplicados', cantidad: summary.removedDuplicates, color: '#64748b' },
  ];

  const numericChartData = numericColumns.slice(0, 10);
  const qualityScore = totalCells > 0 ? Math.round((validCells / totalCells) * 100) : 0;

  return (
    <section className="csv-charts" style={{ ['--dataset-accent' as string]: color.base }}>
      <div className="charts-heading">
        <div className="charts-heading-badge" style={{ background: color.soft, color: color.base }}>
          {datasetName}
        </div>
        <div>
          <span className="charts-eyebrow">ANÁLISIS</span>
          <h2>Visualización de datos</h2>
          <p>Resumen visual de la calidad y estructura del archivo CSV.</p>
        </div>
        <div className="quality-score-pill" data-level={qualityScore >= 90 ? 'good' : qualityScore >= 70 ? 'warn' : 'bad'}>
          <span className="quality-score-value">{qualityScore}%</span>
          <span className="quality-score-label">calidad</span>
        </div>
      </div>

      <div className="charts-grid">
        <article className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Calidad del archivo</h3>
              <p>Problemas encontrados durante el análisis.</p>
            </div>
            <div className="chart-icon quality-icon">
              <Check size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => Number(value).toLocaleString('es-PE')}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '13px' }}
                />
                <Bar dataKey="cantidad" name="Cantidad" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={42}>
                  {qualityData.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {numericChartData.length > 0 && (
          <article className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Variables numéricas</h3>
                <p>Promedio de las columnas numéricas detectadas.</p>
              </div>
              <div className="chart-icon numeric-icon">
                <Hash size={16} strokeWidth={2.5} />
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={numericChartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => Number(value).toLocaleString('es-PE')}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '13px' }}
                  />
                  <Bar dataKey="promedio" name="Promedio" fill="#0891b2" radius={[0, 6, 6, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

export default CsvCharts;