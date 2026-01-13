import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TableSettings {
  pageSize: number;
  sorting: Array<{ id: string; desc: boolean }>;
  columnFilters: Array<{ id: string; value: any }>;
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  columnSizing: Record<string, number>;
}

interface TableStore {
  // Request table settings
  requestSettings: TableSettings;
  
  // Task table settings
  taskSettings: TableSettings;
  
  // Actions
  updateRequestSettings: (settings: Partial<TableSettings>) => void;
  updateTaskSettings: (settings: Partial<TableSettings>) => void;
  resetRequestSettings: () => void;
  resetTaskSettings: () => void;
}

const defaultSettings: TableSettings = {
  pageSize: 10,
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
  columnOrder: [],
  columnSizing: {},
};

export const useTableStore = create<TableStore>()(
  persist(
    (set) => ({
      requestSettings: defaultSettings,
      taskSettings: defaultSettings,
      
      updateRequestSettings: (settings) =>
        set((state) => ({
          requestSettings: { ...state.requestSettings, ...settings },
        })),
      
      updateTaskSettings: (settings) =>
        set((state) => ({
          taskSettings: { ...state.taskSettings, ...settings },
        })),
      
      resetRequestSettings: () =>
        set({ requestSettings: defaultSettings }),
      
      resetTaskSettings: () =>
        set({ taskSettings: defaultSettings }),
    }),
    {
      name: "table-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
