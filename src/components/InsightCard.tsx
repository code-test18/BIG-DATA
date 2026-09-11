import { Check, ClipboardPlus } from 'lucide-react';
import { useState } from 'react';
import type { Insight, InsightLevel } from '../pages/dashboard/proceso/ProcesarTypes';
import { crearTarea } from '../services/tareaService';
import { getCurrentUser } from '../utils/auth';

const LEVEL_STYLES: Record<InsightLevel, { color: string; background: string; label: string }> = {
  critico: { color: '#dc2626', background: '#fef2f2', label: 'Crítico' },
  advertencia: { color: '#d97706', background: '#fffbeb', label: 'Advertencia' },
  correcto: { color: '#16a34a', background: '#f0fdf4', label: 'En regla' },
};

export function InsightCard({ insight, datasetPropioId }: { insight: Insight; datasetPropioId?: string }) {
  const style = LEVEL_STYLES[insight.nivel];
  const usuario = getCurrentUser();
  const [asignada, setAsignada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const asignarTarea = async () => {
    if (!usuario || guardando || asignada) return;
    setGuardando(true);
    try {
      await crearTarea({
        titulo: insight.titulo,
        descripcion: insight.mensaje,
        datasetPropioId,
        creadaPor: usuario.id,
      });
      setAsignada(true);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        borderLeft: `4px solid ${style.color}`,
        background: style.background,
        padding: '1rem 1.2rem',
        borderRadius: '0 10px 10px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
        <h5 style={{ margin: 0, color: style.color, fontSize: '0.9rem', fontWeight: 700 }}>{insight.titulo}</h5>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
          {style.label}{insight.origen === 'ia' ? ' · IA' : ''}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>{insight.mensaje}</p>
      {usuario && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void asignarTarea()}
          disabled={guardando || asignada}
          style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {asignada ? <Check size={14} /> : <ClipboardPlus size={14} />}
          {asignada ? 'Tarea creada' : guardando ? 'Creando...' : 'Asignar tarea'}
        </button>
      )}
    </div>
  );
}

export function InsightList({ insights, emptyMessage, datasetPropioId }: { insights: Insight[]; emptyMessage: string; datasetPropioId?: string }) {
  if (insights.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{emptyMessage}</p>;
  }
  const order: Record<InsightLevel, number> = { critico: 0, advertencia: 1, correcto: 2 };
  const sorted = [...insights].sort((a, b) => order[a.nivel] - order[b.nivel]);
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sorted.map((insight) => <InsightCard key={insight.id} insight={insight} datasetPropioId={datasetPropioId} />)}
    </div>
  );
}