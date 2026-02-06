import React, { createContext, useContext, ReactNode } from "react";
import { useDataStore } from "@/hooks/useDataStore";

type DataContextType = ReturnType<typeof useDataStore>;

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const store = useDataStore();
  
  return (
    <DataContext.Provider value={store}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
