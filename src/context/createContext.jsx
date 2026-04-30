import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { fabric } from 'fabric';
import { loadShirtBackground } from '../utils/canvasHelpers';
import { CanvasContext } from './CanvasContext';

export const CanvasProvider = ({ children, shirtImageUrl = '/tshirt-mockup.png' }) => {
  // --- Core refs & state ---
  const canvasRef = useRef(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(5);

  // --- Undo/Redo stacks ---
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // --- Save canvas state for undo ---
  const saveState = useCallback(() => {
    if (!canvasRef.current) return;
    const json = canvasRef.current.toJSON();
    setUndoStack(prev => [...prev.slice(-49), json]); // keep last 50
    setRedoStack([]);
  }, []);

  // --- Undo ---
  const undo = useCallback(() => {
    if (!canvasRef.current || undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, canvasRef.current.toJSON()]);
    canvasRef.current.loadFromJSON(prevState, () => {
      canvasRef.current.renderAll();
      // restore background image if needed (loadShirtBackground re-applies)
      loadShirtBackground(canvasRef.current, shirtImageUrl);
    });
  }, [undoStack, shirtImageUrl]);

  // --- Redo ---
  const redo = useCallback(() => {
    if (!canvasRef.current || redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, canvasRef.current.toJSON()]);
    canvasRef.current.loadFromJSON(nextState, () => {
      canvasRef.current.renderAll();
      loadShirtBackground(canvasRef.current, shirtImageUrl);
    });
  }, [redoStack, shirtImageUrl]);

  // --- Initialize canvas (keeps your original logic + adds event listeners for undo) ---
  const initCanvas = useCallback((canvasElement) => {
    if (!canvasElement || canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasElement, {
      width: 500,
      height: 600,
      backgroundColor: '#f8f9fa',
    });

    canvasRef.current = canvas;

    // Load shirt background (your helper)
    loadShirtBackground(canvas, shirtImageUrl);

    // Setup drawing brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.isDrawingMode = isDrawingMode;

    // Auto-save state on modifications
    canvas.on('object:added', saveState);
    canvas.on('object:removed', saveState);
    canvas.on('object:modified', saveState);

    canvas.renderAll();
  }, [shirtImageUrl, activeColor, brushWidth, isDrawingMode, saveState]);

  // --- Add image from file ---
  const addImage = useCallback((file) => {
    if (!file || !canvasRef.current) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgElement = document.createElement('img');
      imgElement.src = e.target.result;
      imgElement.onload = () => {
        const imgInstance = new fabric.Image(imgElement, {
          left: 50,
          top: 50,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true,
        });
        canvasRef.current.add(imgInstance);
        canvasRef.current.setActiveObject(imgInstance);
        canvasRef.current.renderAll();
        saveState();
      };
    };
    reader.readAsDataURL(file);
  }, [saveState]);

  // --- Add text box ---
  const addText = useCallback((text = 'Edit me', left = 100, top = 100) => {
    if (!canvasRef.current) return;
    const textbox = new fabric.Textbox(text, {
      left,
      top,
      fontSize: 40,
      fill: activeColor,
      width: 200,
      editable: true,
    });
    canvasRef.current.add(textbox);
    canvasRef.current.setActiveObject(textbox);
    canvasRef.current.renderAll();
    saveState();
  }, [activeColor, saveState]);

  // --- Delete selected object ---
  const removeSelected = useCallback(() => {
    if (!canvasRef.current) return;
    const activeObj = canvasRef.current.getActiveObject();
    if (activeObj) {
      canvasRef.current.remove(activeObj);
      canvasRef.current.renderAll();
      saveState();
    }
  }, [saveState]);

  // --- Clear entire canvas (except background) ---
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.getObjects().forEach(obj => {
      if (obj !== canvas.backgroundImage) canvas.remove(obj);
    });
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // --- Download canvas as PNG ---
  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = 'tshirt-design.png';
    link.href = dataURL;
    link.click();
  }, []);

  // --- Sync brush when drawing mode/color/width changes ---
  const updateBrush = useCallback(() => {
    if (!canvasRef.current) return;
    const brush = canvasRef.current.freeDrawingBrush;
    if (brush) {
      brush.color = activeColor;
      brush.width = brushWidth;
    }
    canvasRef.current.isDrawingMode = isDrawingMode;
    canvasRef.current.renderAll();
  }, [activeColor, brushWidth, isDrawingMode]);

  useEffect(() => {
    updateBrush();
  }, [updateBrush]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, []);

  // --- Memoized context value (includes all new functions) ---
  const value = useMemo(() => ({
    canvasRef,
    isDrawingMode, setIsDrawingMode,
    activeColor, setActiveColor,
    brushWidth, setBrushWidth,
    initCanvas,
    addImage,
    addText,
    removeSelected,
    clearCanvas,
    downloadImage,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  }), [
    isDrawingMode, activeColor, brushWidth, initCanvas,
    addImage, addText, removeSelected, clearCanvas, downloadImage,
    undo, redo, undoStack.length, redoStack.length
  ]);

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};