import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType } from '../types/csv';
import type { ParsedDataset } from '../pages/dashboard/proceso/ProcesarTypes';

export type CleanDatasetOption = {
  id: string;
  name: string;
  data: ParsedDataset;
};

export function useDatasets() {
  const { files } = useOutletContext<DashboardContextType>();

  const cleanDatasets = useMemo<CleanDatasetOption[]>(
    () =>
      files
        .filter((file) => file.isClean)
        .map((file) => ({
          id: file.id,
          name: file.name,
          data: {
            name: file.name,
            headers: file.headers,
            rows: file.rows,
          },
        })),
    [files]
  );

  return { cleanDatasets };
}
