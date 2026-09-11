/** Paleta fija — cada dataset recibe siempre el mismo color mientras no cambie su `id`. */
const PALETTE = [
  { base: '#2563eb', soft: '#eff6ff', label: 'azul' },
  { base: '#d946ef', soft: '#fdf4ff', label: 'magenta' },
  { base: '#059669', soft: '#ecfdf5', label: 'verde' },
  { base: '#d97706', soft: '#fffbeb', label: 'ámbar' },
  { base: '#7c3aed', soft: '#f5f3ff', label: 'violeta' },
  { base: '#0891b2', soft: '#ecfeff', label: 'cian' },
  { base: '#dc2626', soft: '#fef2f2', label: 'rojo' },
  { base: '#4338ca', soft: '#eef2ff', label: 'índigo' },
];

/** Hash simple y estable (no criptográfico) — mismo id siempre da el mismo índice. */
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export interface DatasetColor {
  base: string;
  soft: string;
}

export function getDatasetColor(id: string): DatasetColor {
  const entry = PALETTE[hashId(id) % PALETTE.length];
  return { base: entry.base, soft: entry.soft };
}