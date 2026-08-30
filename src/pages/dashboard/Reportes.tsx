import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType } from '../../types/csv';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Reportes() {
  const { files, activeFileId } = useOutletContext<DashboardContextType>();

  const cleanFiles = files.filter((f) => f.isClean);
  const activeFile = cleanFiles.find((f) => f.id === activeFileId) ?? cleanFiles[0];

  const defaultHeaderX = activeFile?.headers?.[0] ?? '';
  const defaultHeaderY = activeFile?.headers?.[1] ?? activeFile?.headers?.[0] ?? '';

  const [ejeX, setEjeX] = useState<string>(defaultHeaderX);
  const [ejeY, setEjeY] = useState<string>(defaultHeaderY);
  const [tipoGrafico, setTipoGrafico] = useState<'Barra' | 'Línea'>('Barra');

  const currentEjeX = ejeX || defaultHeaderX;
  const currentEjeY = ejeY || defaultHeaderY;

  // Tipado correcto (Unknown / Record) para evitar la regla de 'any'
  const getValueFromRow = (
    row: unknown,
    targetHeader: string,
    headers: string[]
  ): string | number | undefined => {
    if (!row || !targetHeader) return undefined;

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    const targetNorm = normalize(targetHeader);

    if (Array.isArray(row)) {
      const index = headers.findIndex((h) => normalize(h) === targetNorm);
      return index !== -1 ? row[index] : undefined;
    }

    if (typeof row === 'object' && row !== null) {
      const obj = row as Record<string, string | number>;
      if (obj[targetHeader] !== undefined) return obj[targetHeader];
      const matchedKey = Object.keys(obj).find((k) => normalize(k) === targetNorm);
      return matchedKey ? obj[matchedKey] : undefined;
    }

    return undefined;
  };

  const { labels, numericValues, totalRegistros } = useMemo(() => {
    if (!activeFile || !activeFile.rows || !currentEjeX) {
      return { labels: [], numericValues: [], totalRegistros: 0 };
    }

    const counts: Record<string, number> = {};
    let total = 0;

    activeFile.rows.forEach((row) => {
      const rawX = getValueFromRow(row, currentEjeX, activeFile.headers);
      const labelStr =
        rawX !== undefined && rawX !== null && String(rawX).trim() !== ''
          ? String(rawX).trim()
          : 'Sin Clasificar';

      counts[labelStr] = (counts[labelStr] || 0) + 1;
      total++;
    });

    const entries = Object.entries(counts).slice(0, 25);

    return {
      labels: entries.map(([label]) => label),
      numericValues: entries.map(([, count]) => count),
      totalRegistros: total,
    };
  }, [activeFile, currentEjeX]);

  const stats = useMemo(() => {
    if (!numericValues.length) return { promedio: '0', suma: 0, max: 0, min: 0 };
    const sumaValues = numericValues.reduce((a, b) => a + b, 0);
    return {
      promedio: (sumaValues / numericValues.length).toFixed(1),
      suma: totalRegistros,
      max: Math.max(...numericValues),
      min: Math.min(...numericValues),
    };
  }, [numericValues, totalRegistros]);

  if (!activeFile || !activeFile.rows || activeFile.rows.length === 0) {
    return (
      <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>Informes y Visualización</h2>
        <p style={{ color: '#64748b' }}>No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* Tarjetas Superiores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Promedio / Categoría</span>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>
            {stats.promedio}
          </h3>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Registros totales</span>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
            {stats.suma}
          </h3>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Máx. por Categoría</span>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
            {stats.max}
          </h3>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Mín. por Categoría</span>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {stats.min}
          </h3>
        </div>
      </div>

      {/* Contenedor del Gráfico */}
      <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          Configuración del Gráfico
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '8px' }}>
              Eje X (Agrupar por):
            </label>
            <select
              value={currentEjeX}
              onChange={(e) => setEjeX(e.target.value)}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 14px',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
              }}
            >
              {activeFile.headers.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '8px' }}>
              Métrica / Conteo:
            </label>
            <select
              value={currentEjeY}
              onChange={(e) => setEjeY(e.target.value)}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 14px',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
              }}
            >
              {activeFile.headers.map((col) => (
                <option key={col} value={col}>Cantidad de {col}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '8px' }}>
              Tipo de Gráfico:
            </label>
            <select
              value={tipoGrafico}
              onChange={(e) => setTipoGrafico(e.target.value as 'Barra' | 'Línea')}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 14px',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
              }}
            >
              <option value="Barra">Barra</option>
              <option value="Línea">Línea</option>
            </select>
          </div>
        </div>

        <div style={{ height: '420px', width: '100%' }}>
          {tipoGrafico === 'Barra' ? (
            <Bar
              data={{
                labels,
                datasets: [
                  {
                    label: `Cantidad de registros por ${currentEjeX}`,
                    data: numericValues,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#334155', font: { size: 12 } } } },
                scales: {
                  x: { ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 }, grid: { color: '#f1f5f9' } },
                  y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: '#e2e8f0' }, beginAtZero: true },
                },
              }}
            />
          ) : (
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: `Cantidad de registros por ${currentEjeX}`,
                    data: numericValues,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 2,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#334155', font: { size: 12 } } } },
                scales: {
                  x: { ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 }, grid: { color: '#f1f5f9' } },
                  y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: '#e2e8f0' }, beginAtZero: true },
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}