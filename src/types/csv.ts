import type { AnalysisResult } from './analysis';

export interface CsvFile {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  uploadedAt: string;
  isClean: boolean;
}

export interface DashboardContextType {
  files: CsvFile[];
  activeFileId: string | null;
  addFile: (file: CsvFile) => void;
  updateFile: (updatedFile: CsvFile) => void;
  removeFile: (fileId: string) => void;
  setActiveFileId: (id: string) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
}