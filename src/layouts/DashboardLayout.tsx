import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import type { CsvFile, DashboardContextType } from '../types/csv';
import { descargarYParsearCsv, listarCsvs, type BackendCsv } from '../services/csvService';

function backendCsvToLocal(csv: BackendCsv, origen: 'propio' | 'otro', headers: string[], rows: string[][]): CsvFile {
  return {
    id: csv.id,
    name: csv.nombre,
    headers,
    rows,
    uploadedAt: new Date(csv.createdAt).toLocaleTimeString(),
    isClean: csv.estado === 'LIMPIO',
    origen,
    sizeKB: csv.tamanioBytes / 1024,
    urlArchivo: csv.urlArchivo,
    synced: true,
  };
}

function DashboardLayout() {
  const [files, setFiles] = useState<CsvFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DashboardContextType['analysisResult']>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // GET /csv una sola vez al entrar al dashboard (recomendado por la guía de endpoints).
  useEffect(() => {
    let cancelled = false;

    async function cargarCsvsGuardados() {
      setLoadingFiles(true);
      setLoadError(null);
      try {
        const { propios, otros } = await listarCsvs();
        const todos = [
          ...propios.map((c) => ({ csv: c, origen: 'propio' as const })),
          ...otros.map((c) => ({ csv: c, origen: 'otro' as const })),
        ];

        // El backend solo guarda metadata + urlArchivo; hay que descargar y
        // parsear el contenido real para poder mostrar tablas/gráficos.
        const cargados = await Promise.all(
          todos.map(async ({ csv, origen }) => {
            try {
              const { headers, rows } = await descargarYParsearCsv(csv.urlArchivo);
              return backendCsvToLocal(csv, origen, headers, rows);
            } catch {
              // Si un archivo puntual falla al descargarse, no tumbamos todo el listado.
              return backendCsvToLocal(csv, origen, [], []);
            }
          }),
        );

        if (!cancelled) setFiles(cargados);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar tus CSVs.');
        }
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    }

    cargarCsvsGuardados();
    return () => { cancelled = true; };
  }, []);

  const addFile = (newFile: CsvFile) => {
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const updateFile = (updatedFile: CsvFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)));
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
    setActiveFileId((currentId) => {
      if (currentId !== fileId) return currentId;
      return files.find((file) => file.id !== fileId)?.id ?? null;
    });
  };

  const contextValue: DashboardContextType = {
    files,
    activeFileId,
    addFile,
    updateFile,
    removeFile,
    setActiveFileId,
    analysisResult,
    setAnalysisResult,
    loadingFiles,
    loadError,
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
