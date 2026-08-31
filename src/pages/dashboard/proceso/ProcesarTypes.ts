export type ParsedDataset = {
  name: string;
  headers: string[];
  rows: string[][];
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