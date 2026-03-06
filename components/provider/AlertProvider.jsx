"use client";

import { useEffect } from "react";
import { useAlertStore } from "@/store/alert.store";

export default function AlertProvider({ children }) {
  const initialize = useAlertStore(state => state.initialize);
  const cleanup = useAlertStore(state => state.cleanup);

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  return children;
}