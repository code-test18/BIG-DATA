import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import type { CsvFile, DashboardContextType } from '../types/csv';

function DashboardLayout() {
  const [files, setFiles] = useState<CsvFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DashboardContextType['analysisResult']>(null);

  const addFile = (newFile: CsvFile) => {
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const updateFile = (updatedFile: CsvFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)));
  };

  const contextValue: DashboardContextType = {
    files,
    activeFileId,
    addFile,
    updateFile,
    setActiveFileId,
    analysisResult,
    setAnalysisResult,
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <Outlet context={contextValue} />
      </main>
    </div>
  );
}

export default DashboardLayout;