import { createContext, useContext } from 'react';

export const CanvasContext = createContext();

// ✅ CUSTOM HOOK
export const useCanvas = () => {
  const context = useContext(CanvasContext);

  if (!context) {
    throw new Error('useCanvas must be used inside CanvasProvider');
  }

  return context;
};