export interface CsvFile {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  uploadedAt: string;
}

export interface DashboardContextType {
  files: CsvFile[];
  activeFileId: string | null;
  addFile: (file: CsvFile) => void;
  updateFile: (updatedFile: CsvFile) => void;
  setActiveFileId: (id: string) => void;
}