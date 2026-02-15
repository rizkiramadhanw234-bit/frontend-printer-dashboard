import { useEffect } from "react";
import { useAppStore } from "@/store/app.store";

export function useDashboard() {
  const store = useAppStore();
  
  // Auto refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      store.loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return store;
}