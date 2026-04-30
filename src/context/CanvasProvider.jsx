/**
 * Enhanced CanvasProvider
 * ───────────────────────
 * New features added on top of the original:
 *   • Shape library  (rect, circle, triangle, line, arrow, star, polygon)
 *   • Gradient fills (linear / radial) on any object
 *   • Opacity control per object
 *   • Layer management  (bring-to-front / send-to-back / move-up / move-down)
 *   • Object duplication
 *   • Canvas-level zoom & pan
 *   • Snap-to-grid toggle
 *   • Clipboard (copy / paste)
 *   • Multi-select helpers
 *   • Group / Ungroup
 *   • Flip H / Flip V
 *   • Object locking
 *   • Canvas export  (PNG, JPEG, SVG, JSON)
 *   • Canvas import from saved JSON
 *   • Background-color / gradient picker for the canvas
 *   • Canva connector: pull brand kits & existing designs
 *   • Per-object shadow controls
 *   • Stroke (border) colour + width
 *   • Keyboard shortcuts wiring helper
 *   • Page / frame system (multiple "pages")
 */

import {
  useRef, useState, useCallback, useMemo, useEffect,
} from 'react';
import * as fabric from 'fabric';
import { CanvasContext } from './CanvasContext';
import { loadShirtBackground } from '../utils/canvasHelpers';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const EXTRA_PROPS = [
  'src', 'text', 'fontSize', 'fill', 'scaleX', 'scaleY',
  'left', 'top', 'angle', 'opacity', 'strokeWidth', 'stroke',
  'shadow', 'flipX', 'flipY', 'locked', 'rx', 'ry',
  'gradientFill', 'name', 'id',
];

let _idCounter = 0;
const uid = () => `obj_${Date.now()}_${++_idCounter}`;

// ─── Canva API helpers (thin wrappers around fetch so you can swap in SDK) ───

async function canvaApiFetch(path, options = {}) {
  // Replace with your actual Canva OAuth token logic.
  // We read from sessionStorage so the parent app can inject it.
  const token = sessionStorage.getItem('canva_access_token') || '';
  const base = 'https://api.canva.com/rest/v1';
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Canva API ${path} → ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────

export const CanvasProvider = ({
  children,
  shirtImageUrl,
  imageKey,
  onProviderReady,
  gridSize = 20,
}) => {
  // ── canvas ref ──────────────────────────────────────────────────────────────
  const canvasRef = useRef(null);

  // ── drawing / brush ─────────────────────────────────────────────────────────
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeColor, setActiveColor]     = useState('#000000');
  const [brushWidth, setBrushWidth]       = useState(5);
  const [brushType, setBrushType]         = useState('pencil'); // pencil | spray | circle

  // ── stroke / fill extras ────────────────────────────────────────────────────
  const [strokeColor, setStrokeColor]     = useState('#000000');
  const [strokeWidth, setStrokeWidth]     = useState(0);
  const [fillOpacity, setFillOpacity]     = useState(1);

  // ── zoom ────────────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);

  // ── snap grid ───────────────────────────────────────────────────────────────
  const [snapToGrid, setSnapToGrid] = useState(false);

  // ── clipboard ───────────────────────────────────────────────────────────────
  const clipboardRef = useRef(null);

  // ── pages ───────────────────────────────────────────────────────────────────
  const [pages, setPages]           = useState([{ id: 'page_1', label: 'Page 1' }]);
  const [activePage, setActivePage] = useState('page_1');

  // ── Canva connector state ────────────────────────────────────────────────────
  const [canvaBrandKits, setCanvaBrandKits]   = useState([]);
  const [canvaDesigns, setCanvaDesigns]       = useState([]);
  const [canvaLoading, setCanvaLoading]       = useState(false);
  const [canvaError, setCanvaError]           = useState(null);

  // ── per-image design storage ─────────────────────────────────────────────────
  const designsMap        = useRef(new Map());
  const currentImageUrl   = useRef(null);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ────────────────────────────────────────────────────────────────────────────
  // CORE: state capture
  // ────────────────────────────────────────────────────────────────────────────

  const getDesignState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas
      .getObjects()
      .filter(obj => !obj.isBackground)
      .map(obj => obj.toJSON(EXTRA_PROPS));
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // CORE: save / restore / undo / redo
  // ────────────────────────────────────────────────────────────────────────────

  const saveState = useCallback(() => {
    const state = getDesignState();
    if (!state || state.length === 0) return;
    setUndoStack(prev => [...prev.slice(-49), state]);
    setRedoStack([]);
    if (currentImageUrl.current) {
      designsMap.current.set(currentImageUrl.current, state);
    }
  }, [getDesignState]);

  const restoreDesignState = useCallback((state) => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;

    canvas.getObjects().filter(o => !o.isBackground).forEach(o => canvas.remove(o));
    canvas.off('object:added');
    canvas.off('object:removed');
    canvas.off('object:modified');
    canvas.off('path:created');

    fabric.util.enlivenObjects(state).then((objects) => {
      objects.forEach(obj => canvas.add(obj));
      canvas.requestRenderAll();
      const h = () => saveState();
      canvas.on('object:added',    h);
      canvas.on('object:removed',  h);
      canvas.on('object:modified', h);
      canvas.on('path:created',    h);
    });
  }, [saveState]);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const prev    = undoStack[undoStack.length - 1];
    const current = getDesignState();
    setUndoStack(s => s.slice(0, -1));
    if (current) setRedoStack(s => [...s, current]);
    restoreDesignState(prev);
    if (currentImageUrl.current) designsMap.current.set(currentImageUrl.current, prev);
  }, [undoStack, getDesignState, restoreDesignState]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next    = redoStack[redoStack.length - 1];
    const current = getDesignState();
    setRedoStack(s => s.slice(0, -1));
    if (current) setUndoStack(s => [...s, current]);
    restoreDesignState(next);
    if (currentImageUrl.current) designsMap.current.set(currentImageUrl.current, next);
  }, [redoStack, getDesignState, restoreDesignState]);

  // ────────────────────────────────────────────────────────────────────────────
  // INIT & BACKGROUND SWITCH
  // ────────────────────────────────────────────────────────────────────────────

  const changeBackground = useCallback(async (newImageUrl, newKey) => {
    const canvas = canvasRef.current;
    if (!canvas || !newImageUrl) return;

    if (currentImageUrl.current) {
      const cs = getDesignState();
      if (cs?.length) designsMap.current.set(currentImageUrl.current, cs);
    }

    await loadShirtBackground(canvas, newImageUrl);
    canvas.renderAll();
    currentImageUrl.current = newKey;

    const saved = designsMap.current.get(newKey);
    if (saved) {
      restoreDesignState(saved);
    } else {
      canvas.getObjects().filter(o => !o.isBackground).forEach(o => canvas.remove(o));
      canvas.renderAll();
    }

    setUndoStack([]);
    setRedoStack([]);
  }, [getDesignState, restoreDesignState]);

  const initCanvas = useCallback(async (canvasElement) => {
    if (!canvasElement || canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasElement, {
      width: 500,
      height: 600,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });

    canvasRef.current       = canvas;
    currentImageUrl.current = imageKey;

    // brush
    const brush = new fabric.PencilBrush(canvas);
    brush.color = activeColor;
    brush.width = brushWidth;
    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode    = isDrawingMode;

    if (shirtImageUrl) await loadShirtBackground(canvas, shirtImageUrl);

    const saved = designsMap.current.get(imageKey);
    if (saved) restoreDesignState(saved);

    const h = () => saveState();
    canvas.on('object:added',    h);
    canvas.on('object:removed',  h);
    canvas.on('object:modified', h);
    canvas.on('path:created',    h);

    // snap-to-grid
    canvas.on('object:moving', ({ target }) => {
      if (!snapToGrid) return;
      target.set({
        left: Math.round(target.left / gridSize) * gridSize,
        top:  Math.round(target.top  / gridSize) * gridSize,
      });
    });

    canvas.requestRenderAll();
  }, [shirtImageUrl, activeColor, brushWidth, isDrawingMode, saveState, restoreDesignState, imageKey, snapToGrid, gridSize]);

  // ────────────────────────────────────────────────────────────────────────────
  // BRUSH EFFECTS
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = isDrawingMode;

    let brush;
    if (brushType === 'spray') {
      brush = new fabric.SprayBrush(canvas);
    } else if (brushType === 'circle') {
      brush = new fabric.CircleBrush(canvas);
    } else {
      brush = new fabric.PencilBrush(canvas);
    }

    brush.color          = activeColor;
    brush.width          = brushWidth;
    canvas.freeDrawingBrush = brush;
    canvas.requestRenderAll();
  }, [isDrawingMode, activeColor, brushWidth, brushType]);

  // ────────────────────────────────────────────────────────────────────────────
  // SHAPES
  // ────────────────────────────────────────────────────────────────────────────

  const _sharedStyle = useCallback(() => ({
    fill:        activeColor,
    stroke:      strokeColor,
    strokeWidth: strokeWidth,
    opacity:     fillOpacity,
    id:          uid(),
  }), [activeColor, strokeColor, strokeWidth, fillOpacity]);

  // polygon helpers — declared BEFORE addShape so they're in scope
  const _starPoints = (numPoints, outerRadius, innerRadius) => {
    const pts = [];
    for (let i = 0; i < numPoints * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = (Math.PI / numPoints) * i - Math.PI / 2;
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return pts;
  };

  const _regularPolygon = (sides, radius) => {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (2 * Math.PI / sides) * i - Math.PI / 2;
      pts.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
    }
    return pts;
  };

  const addShape = useCallback((type, options = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const shared = _sharedStyle();

    let obj;

    switch (type) {
      case 'rect':
        obj = new fabric.Rect({ ...shared, left: cx - 60, top: cy - 40, width: 120, height: 80, rx: 4, ry: 4, ...options });
        break;
      case 'circle':
        obj = new fabric.Circle({ ...shared, left: cx - 50, top: cy - 50, radius: 50, ...options });
        break;
      case 'triangle':
        obj = new fabric.Triangle({ ...shared, left: cx - 50, top: cy - 60, width: 100, height: 100, ...options });
        break;
      case 'line':
        obj = new fabric.Line([cx - 80, cy, cx + 80, cy], {
          stroke: strokeColor || activeColor,
          strokeWidth: Math.max(strokeWidth, 2),
          opacity: fillOpacity,
          id: uid(),
          ...options,
        });
        break;
      case 'arrow': {
        // Arrow = line + triangle tip
        const group = new fabric.Group([
          new fabric.Line([0, 0, 120, 0], { stroke: activeColor, strokeWidth: 3 }),
          new fabric.Triangle({ left: 115, top: -8, width: 16, height: 16, fill: activeColor, angle: 90 }),
        ], { left: cx - 60, top: cy, ...options });
        obj = group;
        break;
      }
      case 'star': {
        const points = _starPoints(5, 50, 25);
        obj = new fabric.Polygon(points, { ...shared, left: cx - 50, top: cy - 50, ...options });
        break;
      }
      case 'pentagon': {
        const pts = _regularPolygon(5, 50);
        obj = new fabric.Polygon(pts, { ...shared, left: cx - 50, top: cy - 50, ...options });
        break;
      }
      case 'hexagon': {
        const pts = _regularPolygon(6, 50);
        obj = new fabric.Polygon(pts, { ...shared, left: cx - 50, top: cy - 50, ...options });
        break;
      }
      case 'ellipse':
        obj = new fabric.Ellipse({ ...shared, left: cx - 70, top: cy - 40, rx: 70, ry: 40, ...options });
        break;
      default:
        console.warn('Unknown shape type:', type);
        return;
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    saveState();
  }, [_sharedStyle, activeColor, strokeColor, strokeWidth, fillOpacity, saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // TEXT
  // ────────────────────────────────────────────────────────────────────────────

  const addText = useCallback((text = 'Your Text', options = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = new fabric.Textbox(text, {
      left:     canvas.width  / 2,
      top:      canvas.height / 2,
      originX:  'center',
      originY:  'center',
      fontSize: options.fontSize || 30,
      fill:     activeColor,
      fontFamily: options.fontFamily || 'Arial',
      fontWeight: options.fontWeight || 'normal',
      fontStyle:  options.fontStyle  || 'normal',
      underline:  options.underline  || false,
      textAlign:  options.textAlign  || 'left',
      stroke:     strokeColor,
      strokeWidth: strokeWidth,
      opacity:    fillOpacity,
      id:         uid(),
      ...options,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    saveState();
  }, [activeColor, strokeColor, strokeWidth, fillOpacity, saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // IMAGE
  // ────────────────────────────────────────────────────────────────────────────

  const addImage = useCallback((file) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result).then((img) => {
        img.scaleToWidth(200);
        img.set({
          left:    canvas.width  / 2,
          top:     canvas.height / 2,
          originX: 'center',
          originY: 'center',
          opacity: fillOpacity,
          id:      uid(),
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveState();
      }).catch(err => console.error('Image load failed', err));
    };
    reader.readAsDataURL(file);
  }, [fillOpacity, saveState]);

  /** Add image from a remote URL (e.g. Canva asset URL) */
  const addImageFromURL = useCallback((url) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      img.scaleToWidth(200);
      img.set({
        left:    canvas.width  / 2,
        top:     canvas.height / 2,
        originX: 'center',
        originY: 'center',
        opacity: fillOpacity,
        id:      uid(),
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveState();
    }).catch(err => console.error('URL image load failed', err));
  }, [fillOpacity, saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // LAYER MANAGEMENT
  // ────────────────────────────────────────────────────────────────────────────

  const bringToFront   = useCallback(() => { const c = canvasRef.current; c?.getActiveObject() && (c.bringObjectToFront(c.getActiveObject()), saveState()); }, [saveState]);
  const sendToBack     = useCallback(() => { const c = canvasRef.current; const o = c?.getActiveObject(); if (o) { c.sendObjectToBack(o); /* keep bg at bottom */ c.getObjects().filter(x => x.isBackground).forEach(b => c.sendObjectToBack(b)); saveState(); }}, [saveState]);
  const bringForward   = useCallback(() => { const c = canvasRef.current; c?.getActiveObject() && (c.bringObjectForward(c.getActiveObject()), saveState()); }, [saveState]);
  const sendBackward   = useCallback(() => { const c = canvasRef.current; c?.getActiveObject() && (c.sendObjectBackwards(c.getActiveObject()), saveState()); }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // DUPLICATE / DELETE
  // ────────────────────────────────────────────────────────────────────────────

  const duplicate = useCallback(async () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!active) return;
    const clone = await active.clone(EXTRA_PROPS);
    clone.set({ left: active.left + 20, top: active.top + 20, id: uid() });
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.renderAll();
    saveState();
  }, [saveState]);

  const removeSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!active) return;
    if (active.type === 'activeSelection') {
      active.forEachObject(o => canvas.remove(o));
      canvas.discardActiveObject();
    } else {
      canvas.remove(active);
    }
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // CLIPBOARD
  // ────────────────────────────────────────────────────────────────────────────

  const copy = useCallback(async () => {
    const active = canvasRef.current?.getActiveObject();
    if (!active) return;
    clipboardRef.current = await active.clone(EXTRA_PROPS);
  }, []);

  const paste = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clipboardRef.current) return;
    clipboardRef.current.clone(EXTRA_PROPS).then((obj) => {
      obj.set({ left: obj.left + 20, top: obj.top + 20, id: uid() });
      if (obj.type === 'activeSelection') {
        obj.canvas = canvas;
        obj.forEachObject(o => canvas.add(o));
        obj.setCoords();
      } else {
        canvas.add(obj);
      }
      canvas.setActiveObject(obj);
      canvas.renderAll();
      saveState();
    });
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // GROUP / UNGROUP
  // ────────────────────────────────────────────────────────────────────────────

  const group = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    const grp = active.toGroup();
    grp.set({ id: uid() });
    canvas.setActiveObject(grp);
    canvas.renderAll();
    saveState();
  }, [saveState]);

  const ungroup = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!active || active.type !== 'group') return;
    const sel = active.toActiveSelection();
    canvas.setActiveObject(sel);
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // FLIP
  // ────────────────────────────────────────────────────────────────────────────

  const flipH = useCallback(() => {
    const o = canvasRef.current?.getActiveObject();
    if (!o) return;
    o.set('flipX', !o.flipX);
    canvasRef.current.renderAll();
    saveState();
  }, [saveState]);

  const flipV = useCallback(() => {
    const o = canvasRef.current?.getActiveObject();
    if (!o) return;
    o.set('flipY', !o.flipY);
    canvasRef.current.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // LOCK
  // ────────────────────────────────────────────────────────────────────────────

  const toggleLock = useCallback(() => {
    const o = canvasRef.current?.getActiveObject();
    if (!o) return;
    const locked = !o.locked;
    o.set({
      locked,
      selectable:      !locked,
      evented:         !locked,
      lockMovementX:   locked,
      lockMovementY:   locked,
      lockRotation:    locked,
      lockScalingX:    locked,
      lockScalingY:    locked,
    });
    canvasRef.current.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // OPACITY
  // ────────────────────────────────────────────────────────────────────────────

  const setSelectedOpacity = useCallback((val) => {
    const o = canvasRef.current?.getActiveObject();
    if (!o) return;
    o.set('opacity', val);
    canvasRef.current.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // SHADOW
  // ────────────────────────────────────────────────────────────────────────────

  const setSelectedShadow = useCallback((opts = {}) => {
    const canvas = canvasRef.current;
    const o = canvas?.getActiveObject();
    if (!o) return;
    o.set('shadow', new fabric.Shadow({
      color:   opts.color   || 'rgba(0,0,0,0.5)',
      blur:    opts.blur    ?? 10,
      offsetX: opts.offsetX ?? 5,
      offsetY: opts.offsetY ?? 5,
    }));
    canvas.renderAll();
    saveState();
  }, [saveState]);

  const removeShadow = useCallback(() => {
    const canvas = canvasRef.current;
    const o = canvas?.getActiveObject();
    if (!o) return;
    o.set('shadow', null);
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // GRADIENT
  // ────────────────────────────────────────────────────────────────────────────

  const applyGradient = useCallback((type = 'linear', color1 = '#ff0000', color2 = '#0000ff') => {
    const canvas = canvasRef.current;
    const o = canvas?.getActiveObject();
    if (!o) return;

    const grad = type === 'radial'
      ? new fabric.Gradient({
          type: 'radial',
          coords: { r1: 0, r2: o.width / 2, x1: o.width / 2, y1: o.height / 2, x2: o.width / 2, y2: o.height / 2 },
          colorStops: [{ offset: 0, color: color1 }, { offset: 1, color: color2 }],
        })
      : new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: o.width, y2: 0 },
          colorStops: [{ offset: 0, color: color1 }, { offset: 1, color: color2 }],
        });

    o.set('fill', grad);
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // STROKE (border)
  // ────────────────────────────────────────────────────────────────────────────

  const applyStroke = useCallback((color, width) => {
    const canvas = canvasRef.current;
    const o = canvas?.getActiveObject();
    if (!o) return;
    o.set({ stroke: color ?? strokeColor, strokeWidth: width ?? strokeWidth });
    canvas.renderAll();
    saveState();
  }, [strokeColor, strokeWidth, saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // ZOOM & PAN
  // ────────────────────────────────────────────────────────────────────────────

  const zoomTo = useCallback((level) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const clamped = Math.min(Math.max(level, 0.1), 5);
    canvas.setZoom(clamped);
    setZoom(clamped);
    canvas.renderAll();
  }, []);

  const zoomIn  = useCallback(() => zoomTo(zoom + 0.1), [zoom, zoomTo]);
  const zoomOut = useCallback(() => zoomTo(zoom - 0.1), [zoom, zoomTo]);
  const resetZoom = useCallback(() => zoomTo(1), [zoomTo]);

  // ────────────────────────────────────────────────────────────────────────────
  // GRID
  // ────────────────────────────────────────────────────────────────────────────

  const toggleGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (snapToGrid) {
      // remove existing grid lines
      canvas.getObjects().filter(o => o._isGrid).forEach(o => canvas.remove(o));
      setSnapToGrid(false);
    } else {
      const w = canvas.width, h = canvas.height;
      const lines = [];
      for (let x = 0; x <= w; x += gridSize) {
        lines.push(new fabric.Line([x, 0, x, h], {
          stroke: 'rgba(0,0,0,0.12)', strokeWidth: 1,
          selectable: false, evented: false, _isGrid: true,
        }));
      }
      for (let y = 0; y <= h; y += gridSize) {
        lines.push(new fabric.Line([0, y, w, y], {
          stroke: 'rgba(0,0,0,0.12)', strokeWidth: 1,
          selectable: false, evented: false, _isGrid: true,
        }));
      }
      lines.forEach(l => canvas.add(l));
      lines.forEach(l => canvas.sendObjectToBack(l));
      canvas.getObjects().filter(o => o.isBackground).forEach(b => canvas.sendObjectToBack(b));
      setSnapToGrid(true);
    }
    canvas.renderAll();
  }, [snapToGrid, gridSize]);

  // ────────────────────────────────────────────────────────────────────────────
  // CANVAS BACKGROUND COLOR
  // ────────────────────────────────────────────────────────────────────────────

  const setCanvasBackground = useCallback((color) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // EXPORT
  // ────────────────────────────────────────────────────────────────────────────

  const exportAs = useCallback((format = 'png', quality = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dataURL;
    if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      dataURL = URL.createObjectURL(blob);
    } else if (format === 'json') {
      const json = JSON.stringify(canvas.toJSON(EXTRA_PROPS));
      const blob = new Blob([json], { type: 'application/json' });
      dataURL = URL.createObjectURL(blob);
    } else {
      dataURL = canvas.toDataURL({ format, quality, multiplier: 2 });
    }

    const a = document.createElement('a');
    a.href     = dataURL;
    a.download = `design.${format}`;
    a.click();
    if (format === 'svg' || format === 'json') URL.revokeObjectURL(dataURL);
  }, []);

  /** Returns a base64 PNG thumbnail for UI previews */
  const getThumbnail = useCallback((width = 200) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const scale = width / canvas.width;
    return canvas.toDataURL({ format: 'png', multiplier: scale });
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // IMPORT from JSON
  // ────────────────────────────────────────────────────────────────────────────

  const importFromJSON = useCallback((jsonString) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      canvas.loadFromJSON(data, () => {
        canvas.renderAll();
        saveState();
      });
    } catch (e) {
      console.error('importFromJSON failed', e);
    }
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // SELECTION HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  const selectAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = canvas.getObjects().filter(o => !o.isBackground && !o._isGrid);
    const sel  = new fabric.ActiveSelection(objs, { canvas });
    canvas.setActiveObject(sel);
    canvas.renderAll();
  }, []);

  const deselect = useCallback(() => {
    canvasRef.current?.discardActiveObject();
    canvasRef.current?.renderAll();
  }, []);

  const getSelectedObject = useCallback(() => canvasRef.current?.getActiveObject(), []);

  // ────────────────────────────────────────────────────────────────────────────
  // ALIGNMENT helpers
  // ────────────────────────────────────────────────────────────────────────────

  const alignObject = useCallback((direction) => {
    const canvas = canvasRef.current;
    const o = canvas?.getActiveObject();
    if (!o || !canvas) return;
    const w = canvas.width, h = canvas.height;
    switch (direction) {
      case 'left':   o.set('left', 0); break;
      case 'right':  o.set('left', w - o.getScaledWidth()); break;
      case 'top':    o.set('top', 0); break;
      case 'bottom': o.set('top', h - o.getScaledHeight()); break;
      case 'centerH': o.set('left', (w - o.getScaledWidth())  / 2); break;
      case 'centerV': o.set('top',  (h - o.getScaledHeight()) / 2); break;
    }
    o.setCoords();
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // CLEAR
  // ────────────────────────────────────────────────────────────────────────────

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getObjects().filter(o => !o.isBackground).forEach(o => canvas.remove(o));
    canvas.renderAll();
    saveState();
  }, [saveState]);

  // ────────────────────────────────────────────────────────────────────────────
  // PAGES
  // ────────────────────────────────────────────────────────────────────────────

  const addPage = useCallback(() => {
    const id = `page_${Date.now()}`;
    setPages(prev => [...prev, { id, label: `Page ${prev.length + 1}` }]);
  }, []);

  const removePage = useCallback((id) => {
    setPages(prev => prev.filter(p => p.id !== id));
    designsMap.current.delete(id);
    if (activePage === id) setActivePage(pages[0]?.id);
  }, [activePage, pages]);

  // ────────────────────────────────────────────────────────────────────────────
  // CANVA CONNECTOR INTEGRATION
  // ────────────────────────────────────────────────────────────────────────────

  /** Fetch brand kits from Canva. Token must be in sessionStorage['canva_access_token'] */
  const fetchCanvaBrandKits = useCallback(async () => {
    setCanvaLoading(true);
    setCanvaError(null);
    try {
      const data = await canvaApiFetch('/brand-templates?query=');
      setCanvaBrandKits(data.items || []);
    } catch (e) {
      setCanvaError(e.message);
    } finally {
      setCanvaLoading(false);
    }
  }, []);

  /** Fetch user's recent designs from Canva */
  const fetchCanvaDesigns = useCallback(async (query = '') => {
    setCanvaLoading(true);
    setCanvaError(null);
    try {
      const data = await canvaApiFetch(`/designs?query=${encodeURIComponent(query)}&ownership=any`);
      setCanvaDesigns(data.items || []);
    } catch (e) {
      setCanvaError(e.message);
    } finally {
      setCanvaLoading(false);
    }
  }, []);

  /**
   * Pull the thumbnail of a Canva design and add it to the fabric canvas
   * as an image object.
   */
  const importCanvaDesignAsImage = useCallback(async (designId) => {
    setCanvaLoading(true);
    setCanvaError(null);
    try {
      const data = await canvaApiFetch(`/designs/${designId}`);
      const thumbUrl = data.thumbnail?.url;
      if (thumbUrl) addImageFromURL(thumbUrl);
    } catch (e) {
      setCanvaError(e.message);
    } finally {
      setCanvaLoading(false);
    }
  }, [addImageFromURL]);

  // ────────────────────────────────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS wiring
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const isMac = navigator.platform.startsWith('Mac');
      const mod   = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === 'Z' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if (mod && e.key === 'c') { e.preventDefault(); copy(); }
      if (mod && e.key === 'v') { e.preventDefault(); paste(); }
      if (mod && e.key === 'd') { e.preventDefault(); duplicate(); }
      if (mod && e.key === 'a') { e.preventDefault(); selectAll(); }
      if (mod && e.key === 'g') { e.preventDefault(); group(); }
      if (mod && e.shiftKey && e.key === 'G') { e.preventDefault(); ungroup(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { removeSelected(); }
      if (mod && e.key === '+' || mod && e.key === '=') { e.preventDefault(); zoomIn(); }
      if (mod && e.key === '-') { e.preventDefault(); zoomOut(); }
      if (mod && e.key === '0') { e.preventDefault(); resetZoom(); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, copy, paste, duplicate, selectAll, group, ungroup, removeSelected, zoomIn, zoomOut, resetZoom]);

  // ────────────────────────────────────────────────────────────────────────────
  // DISPOSE
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.off();
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (onProviderReady && changeBackground) onProviderReady(changeBackground);
  }, [onProviderReady, changeBackground]);

  // ────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ────────────────────────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // refs
    canvasRef,

    // init
    initCanvas,
    changeBackground,

    // drawing
    isDrawingMode, setIsDrawingMode,
    activeColor,   setActiveColor,
    brushWidth,    setBrushWidth,
    brushType,     setBrushType,

    // stroke / fill
    strokeColor, setStrokeColor,
    strokeWidth, setStrokeWidth,
    fillOpacity, setFillOpacity,
    applyStroke,

    // shapes
    addShape,

    // text
    addText,

    // images
    addImage,
    addImageFromURL,

    // layers
    bringToFront, sendToBack, bringForward, sendBackward,

    // edit
    duplicate, removeSelected, clearCanvas,

    // clipboard
    copy, paste,

    // group
    group, ungroup,

    // flip / lock
    flipH, flipV, toggleLock,

    // opacity / shadow / gradient
    setSelectedOpacity,
    setSelectedShadow, removeShadow,
    applyGradient,

    // zoom
    zoom, zoomIn, zoomOut, zoomTo, resetZoom,

    // grid
    snapToGrid, toggleGrid,

    // canvas bg
    setCanvasBackground,

    // export / import
    exportAs, getThumbnail, importFromJSON,

    // selection
    selectAll, deselect, getSelectedObject,

    // alignment
    alignObject,

    // undo / redo
    undo, redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,

    // pages
    pages, activePage, setActivePage, addPage, removePage,

    // Canva connector
    canvaBrandKits, canvaDesigns, canvaLoading, canvaError,
    fetchCanvaBrandKits, fetchCanvaDesigns, importCanvaDesignAsImage,
  }), [
    initCanvas, changeBackground,
    isDrawingMode, activeColor, brushWidth, brushType,
    strokeColor, strokeWidth, fillOpacity, applyStroke,
    addShape, addText, addImage, addImageFromURL,
    bringToFront, sendToBack, bringForward, sendBackward,
    duplicate, removeSelected, clearCanvas,
    copy, paste, group, ungroup,
    flipH, flipV, toggleLock,
    setSelectedOpacity, setSelectedShadow, removeShadow, applyGradient,
    zoom, zoomIn, zoomOut, zoomTo, resetZoom,
    snapToGrid, toggleGrid,
    setCanvasBackground,
    exportAs, getThumbnail, importFromJSON,
    selectAll, deselect, getSelectedObject,
    alignObject,
    undo, redo, undoStack.length, redoStack.length,
    pages, activePage, addPage, removePage,
    canvaBrandKits, canvaDesigns, canvaLoading, canvaError,
    fetchCanvaBrandKits, fetchCanvaDesigns, importCanvaDesignAsImage,
  ]);

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};