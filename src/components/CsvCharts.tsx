import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Check } from 'lucide-react';

import type { CsvCleaningSummary } from '../services/csvCleaningService';

import './CsvCharts.css';

interface CsvChartsProps {
  headers: string[];
  rows: string[][];
  summary: CsvCleaningSummary;
}

interface NumericColumn {
  name: string;
  promedio: number;
}

interface CategoryValue {
  name: string;
  cantidad: number;
}

function isNullValue(value: string): boolean {
  return ['null', 'nil', 'none'].includes(
    value.trim().toLowerCase()
  );
}

function isNumeric(value: string): boolean {
  if (!value.trim() || isNullValue(value)) {
    return false;
  }

  const normalized = value
    .trim()
    .replace(',', '.');

  return !Number.isNaN(Number(normalized));
}

function CsvCharts({
  headers,
  rows,
  summary,
}: CsvChartsProps) {

  /*
   * =========================================================
   * 1. GRÁFICO DE CALIDAD DEL CSV
   * =========================================================
   */

  const qualityData = [
    {
      name: 'Vacíos',
      cantidad: summary.emptyValues,
    },
    {
      name: 'Nulos',
      cantidad: summary.nullValues,
    },
    {
      name: 'Duplicados',
      cantidad: summary.removedDuplicates,
    },
  ];

  /*
   * =========================================================
   * 2. DETECTAR COLUMNAS NUMÉRICAS
   * =========================================================
   */

  const numericColumns: NumericColumn[] = headers
    .map((header, columnIndex) => {

      const values = rows
        .map((row) => row[columnIndex] ?? '')
        .filter(
          (value) =>
            value.trim() !== '' &&
            !isNullValue(value)
        );

      if (values.length === 0) {
        return null;
      }

      const numericValues =
        values.filter(isNumeric);

      /*
       * Una columna se considera numérica si
       * al menos el 70% de sus valores son números.
       */

      if (
        numericValues.length / values.length <
        0.7
      ) {
        return null;
      }

      const total = numericValues.reduce(
        (sum, value) =>
          sum +
          Number(
            value.replace(',', '.')
          ),
        0
      );

      const promedio =
        total / numericValues.length;

      return {
        name: header,
        promedio: Number(
          promedio.toFixed(2)
        ),
      };
    })
    .filter(
      (
        column
      ): column is NumericColumn =>
        column !== null
    );

  /*
   * Limitamos a 10 columnas para mantener
   * el gráfico visualmente limpio.
   */

  const numericChartData =
    numericColumns.slice(0, 10);

  /*
   * =========================================================
   * 3. DETECTAR COLUMNA CATEGÓRICA
   * =========================================================
   */

  let categoryData: CategoryValue[] = [];

  const categoricalColumn =
    headers.findIndex(
      (_, columnIndex) => {

        const values = rows
          .map(
            (row) =>
              row[columnIndex] ?? ''
          )
          .filter(
            (value) =>
              value.trim() !== '' &&
              !isNullValue(value)
          );

        if (values.length === 0) {
          return false;
        }

        const numericCount =
          values.filter(isNumeric).length;

        return (
          numericCount / values.length <
          0.7
        );
      }
    );

  /*
   * Contamos las categorías.
   */

  if (categoricalColumn !== -1) {

    const counter =
      new Map<string, number>();

    rows.forEach((row) => {

      const value =
        (
          row[categoricalColumn] ?? ''
        ).trim();

      if (
        !value ||
        isNullValue(value)
      ) {
        return;
      }

      counter.set(
        value,
        (counter.get(value) ?? 0) + 1
      );
    });

    categoryData =
      Array.from(
        counter.entries()
      )
        .map(
          ([name, cantidad]) => ({
            name,
            cantidad,
          })
        )
        .sort(
          (a, b) =>
            b.cantidad - a.cantidad
        )
        .slice(0, 8);
  }

  /*
   * =========================================================
   * 4. COLORES DEL GRÁFICO CIRCULAR
   * =========================================================
   */

  const COLORS = [
    '#6366f1',
    '#06b6d4',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
  ];

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <section className="csv-charts">

      {/* ENCABEZADO */}

      <div className="charts-heading">

        <div>

          <span className="charts-eyebrow">
            ANÁLISIS
          </span>

          <h2>
            Visualización de datos
          </h2>

          <p>
            Resumen visual de la calidad
            y estructura del archivo CSV.
          </p>

        </div>

      </div>


      {/* CONTENEDOR DE GRÁFICOS */}

      <div className="charts-grid">


        {/* ===================================================
            GRÁFICO DE CALIDAD
        =================================================== */}

        <article className="chart-card">

          <div className="chart-card-header">

            <div>

              <h3>
                Calidad del archivo
              </h3>

              <p>
                Problemas encontrados durante
                el análisis.
              </p>

            </div>

            <div className="chart-icon quality-icon">
              <Check size={18} strokeWidth={2.5} />
            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={qualityData}
                margin={{
                  top: 15,
                  right: 10,
                  left: -15,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#6b7280',
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#6b7280',
                  }}
                />

                <Tooltip
                  cursor={{
                    fill: 'rgba(99, 102, 241, 0.05)',
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    boxShadow:
                      '0 8px 24px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />

                <Bar
                  dataKey="cantidad"
                  name="Cantidad"
                  fill="#6366f1"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                  barSize={42}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </article>


        {/* ===================================================
            GRÁFICO NUMÉRICO
        =================================================== */}

        {numericChartData.length > 0 && (

          <article className="chart-card">

            <div className="chart-card-header">

              <div>

                <h3>
                  Variables numéricas
                </h3>

                <p>
                  Promedio de las columnas
                  numéricas detectadas.
                </p>

              </div>

              <div className="chart-icon numeric-icon">
                #
              </div>

            </div>


            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={numericChartData}
                  margin={{
                    top: 15,
                    right: 10,
                    left: -15,
                    bottom: 35,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    tick={{
                      fontSize: 11,
                      fill: '#6b7280',
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: '#6b7280',
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: 'rgba(6, 182, 212, 0.05)',
                    }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      boxShadow:
                        '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />

                  <Bar
                    dataKey="promedio"
                    name="Promedio"
                    fill="#06b6d4"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                    barSize={40}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </article>

        )}


        {/* ===================================================
            GRÁFICO CATEGÓRICO
        =================================================== */}

        {categoryData.length > 0 && (

          <article className="chart-card chart-card-wide">

            <div className="chart-card-header">

              <div>

                <h3>
                  Distribución de categorías
                </h3>

                <p>
                  Valores más frecuentes
                  encontrados en el archivo.
                </p>

              </div>

              <div className="chart-icon category-icon">
                %
              </div>

            </div>


            <div className="chart-container pie-container">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="cantidad"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >

                    {categoryData.map(
                      (_, index) => (

                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>


                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border:
                        '1px solid #e5e7eb',
                      boxShadow:
                        '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />


                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '12px',
                      color: '#4b5563',
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </article>

        )}

      </div>

    </section>
  );
}

export default CsvCharts;