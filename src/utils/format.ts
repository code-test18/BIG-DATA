export const money = (value: number) =>
  `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

export const pct = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;