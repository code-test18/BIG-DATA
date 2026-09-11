import type { AnalysisResult } from './analysis';

export interface CsvFile {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  uploadedAt: string;
  isClean: boolean;
  origen?: 'propio' | 'otro'; // NUEVO — opcional, default se asume 'propio' si no viene
  sizeKB?: number;            // NUEVO — opcional, peso del archivo en KB
  urlArchivo?: string;        // NUEVO — URL en Cloudinary una vez persistido en el backend
  synced?: boolean;           // NUEVO — true si ya existe en el backend (id = id real del backend)
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
  loadingFiles: boolean;
  loadError: string | null;
}