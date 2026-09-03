export type ParsedDataset = {
  name: string;
  headers: string[];
  rows: string[][];
};

export type TopProduct = {
  producto: string;
  unidades: number;
  ingresos: number;
};

export type DatasetMetrics = {
  totalIngresos: number;
  totalUnidades: number;
  ticketPromedio: number;
  productosDistintos: number;
  categories: Record<string, number>;
  monthly: Record<string, number>;
  topProducts: TopProduct[];
  hasDescuentos: boolean;
  totalDescuentos: number;
  hasCanalVenta: boolean;
  canalVentaStats: Record<string, number>;
};

export type ComparisonRow = {
  column: string;
  state: 'Compartida' | 'Nueva en B' | 'Eliminada en B';
  typeA: string;
  typeB: string;
  mediaA: string;
  mediaB: string;
  nulosA: number | string;
  nulosB: number | string;
};

export type DatasetComparison = {
  datasetA: ParsedDataset;
  datasetB: ParsedDataset;
  sharedColumns: string[];
  newColumnsInB: string[];
  missingInB: string[];
  rowDifference: number;
  rowDifferencePct: number;
  columnDifference: number;
  qualityA: number;
  qualityB: number;
  qualityDelta: number;
  rowsA: number;
  rowsB: number;
  insights: string[];
  tableRows: ComparisonRow[];
};