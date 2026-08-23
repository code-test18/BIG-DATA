export type AnalysisTarget =
  | 'dynamic_mapping';

export type FieldRole =
  | 'category'
  | 'metric';

export type Grouping =
  | 'none'
  | 'sum'
  | 'average'
  | 'count';

export type AnalysisSelection =
  Partial<Record<FieldRole, string>>;

export interface AnalysisRequest {

  target: AnalysisTarget;

  columns: AnalysisSelection;

  grouping?: Grouping;

}

export interface AnalysisSeriesItem {

  label: string;

  value: number;

}

export interface AnalysisResult {

  target: AnalysisTarget;

  title: string;

  sourceFileName: string;

  configuration: AnalysisRequest;

  metrics: Array<{
    label: string;
    value: string | number;
  }>;

  series: AnalysisSeriesItem[];

  processedRows: number;

  generatedAt: string;

}

export interface AnalysisValidation {

  valid: boolean;

  message?: string;

}