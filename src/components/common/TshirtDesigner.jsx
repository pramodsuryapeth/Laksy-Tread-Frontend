import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanvas } from '../../context/CanvasContext';

// ─── Small reusable UI atoms ──────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
    {children}
  </h3>
);

const ToolBtn = ({ onClick, children, className = '', disabled = false, title = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center justify-center gap-1.5 rounded-md py-2.5 px-3 text-sm
      touch-manipulation transition-colors disabled:opacity-40 disabled:cursor-not-allowed
      ${className}`}
  >
    {children}
  </button>
);

const ColorSwatch = ({ value, onChange, label }) => (
  <label className="flex flex-col items-center gap-1 cursor-pointer" title={label}>
    <span className="text-[10px] text-gray-400">{label}</span>
    <div
      className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm"
      style={{ background: value }}
    />
    <input type="color" value={value} onChange={e => onChange(e.target.value)}
      className="sr-only" />
  </label>
);

const RangeRow = ({ label, value, min, max, step = 1, onChange, unit = '' }) => (
  <div>
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>{label}</span>
      <span className="font-mono">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-indigo-500" />
  </div>
);

const Divider = () => <div className="border-t border-gray-100 my-4" />;

// ─── Shadow sub-panel ─────────────────────────────────────────────────────────

const ShadowPanel = ({ onApply, onRemove }) => {
  const [blur, setBlur]   = useState(10);
  const [ox, setOx]       = useState(5);
  const [oy, setOy]       = useState(5);
  const [color, setColor] = useState('#000000');

  return (
    <div className="space-y-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
      <SectionTitle>Shadow</SectionTitle>
      <label className="flex items-center justify-between text-xs text-gray-600">
        Color
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="w-8 h-8 rounded border cursor-pointer" />
      </label>
      <RangeRow label="Blur"     value={blur} min={0}   max={50}  onChange={setBlur} unit="px" />
      <RangeRow label="Offset X" value={ox}   min={-30} max={30}  onChange={setOx}   unit="px" />
      <RangeRow label="Offset Y" value={oy}   min={-30} max={30}  onChange={setOy}   unit="px" />
      <div className="flex gap-2 pt-1">
        <ToolBtn onClick={() => onApply({ color, blur, offsetX: ox, offsetY: oy })}
          className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700">Apply</ToolBtn>
        <ToolBtn onClick={onRemove}
          className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300">Remove</ToolBtn>
      </div>
    </div>
  );
};

// ─── Gradient sub-panel ───────────────────────────────────────────────────────

const GradientPanel = ({ onApply }) => {
  const [type, setType] = useState('linear');
  const [c1, setC1]     = useState('#6366f1');
  const [c2, setC2]     = useState('#ec4899');

  return (
    <div className="space-y-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
      <SectionTitle>Gradient Fill</SectionTitle>
      <label className="flex items-center justify-between text-xs text-gray-600">
        Type
        <select value={type} onChange={e => setType(e.target.value)}
          className="text-xs border rounded px-1 py-0.5">
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
      </label>
      <div className="flex gap-4">
        <ColorSwatch value={c1} onChange={setC1} label="Start" />
        <ColorSwatch value={c2} onChange={setC2} label="End" />
      </div>
      <div className="h-5 rounded" style={{ background: `linear-gradient(to right,${c1},${c2})` }} />
      <ToolBtn onClick={() => onApply(type, c1, c2)}
        className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Apply Gradient</ToolBtn>
    </div>
  );
};

// ─── Drawer (mobile / tablet) ─────────────────────────────────────────────────

const Drawer = ({ isOpen, onClose, title, position = 'left', children }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className={`fixed top-0 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'}
        w-80 max-w-[85vw] bg-white shadow-2xl z-50 overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <span className="font-semibold text-gray-800">{title}</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
};

// ─── LEFT PANEL content ───────────────────────────────────────────────────────

const LeftPanel = ({ ctx, onClose }) => {
  const [customText, setCustomText]       = useState('Your Text');
  const [customColor, setCustomColor]     = useState('#000000');
  const [customSize, setCustomSize]       = useState(40);
  const [customFont, setCustomFont]       = useState('Arial');
  const [customBold, setCustomBold]       = useState(false);
  const [customItalic, setCustomItalic]   = useState(false);
  const [openSection, setOpenSection]     = useState('tools');

  const fileRef = useRef(null);

  const FONTS = ['Arial','Georgia','Courier New','Impact','Verdana','Trebuchet MS','Comic Sans MS'];
  const SHAPES = [
    { id: 'rect',     label: '▭ Rect' },
    { id: 'circle',   label: '○ Circle' },
    { id: 'triangle', label: '△ Triangle' },
    { id: 'ellipse',  label: '⬯ Ellipse' },
    { id: 'line',     label: '— Line' },
    { id: 'arrow',    label: '→ Arrow' },
    { id: 'star',     label: '★ Star' },
    { id: 'pentagon', label: '⬠ Penta' },
    { id: 'hexagon',  label: '⬡ Hex' },
  ];

  const section = (id, label, content) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold
          text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setOpenSection(s => s === id ? null : id)}
      >
        {label}
        <span className="text-gray-400">{openSection === id ? '▲' : '▼'}</span>
      </button>
      {openSection === id && <div className="p-4 space-y-3">{content}</div>}
    </div>
  );

  const close = (fn) => (...args) => { fn(...args); onClose?.(); };

  return (
    <div className="space-y-3">

      {/* TOOLS */}
      {section('tools', '🛠 Tools', <>
        <div className="grid grid-cols-2 gap-2">
          <ToolBtn onClick={close(() => ctx.addText())}
            className="bg-gray-50 hover:bg-gray-100 border">➕ Text</ToolBtn>
          <ToolBtn onClick={() => fileRef.current?.click()}
            className="bg-gray-50 hover:bg-gray-100 border">🖼 Image</ToolBtn>
          <ToolBtn onClick={close(ctx.duplicate)}
            className="bg-gray-50 hover:bg-gray-100 border">⧉ Duplicate</ToolBtn>
          <ToolBtn onClick={close(ctx.removeSelected)}
            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">🗑 Delete</ToolBtn>
          <ToolBtn onClick={close(ctx.clearCanvas)}
            className="col-span-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100">
            🧹 Clear All
          </ToolBtn>
        </div>
        <input ref={fileRef} type="file" accept="image/*"
          onChange={e => { ctx.addImage(e.target.files[0]); e.target.value=''; onClose?.(); }}
          className="hidden" />
      </>)}

      {/* SHAPES */}
      {section('shapes', '⬡ Shapes', <>
        <div className="grid grid-cols-3 gap-1.5">
          {SHAPES.map(s => (
            <ToolBtn key={s.id} onClick={close(() => ctx.addShape(s.id))}
              className="bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border text-xs py-2">
              {s.label}
            </ToolBtn>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <ColorSwatch value={ctx.activeColor} onChange={ctx.setActiveColor} label="Fill" />
          <ColorSwatch value={ctx.strokeColor} onChange={ctx.setStrokeColor} label="Stroke" />
          <div className="flex-1">
            <RangeRow label="Stroke W" value={ctx.strokeWidth} min={0} max={20}
              onChange={ctx.setStrokeWidth} unit="px" />
          </div>
        </div>
        <RangeRow label="Opacity" value={Math.round(ctx.fillOpacity * 100)} min={0} max={100}
          onChange={v => ctx.setFillOpacity(v / 100)} unit="%" />
      </>)}

      {/* CUSTOM TEXT */}
      {section('text', 'T Custom Text', <>
        <input value={customText} onChange={e => setCustomText(e.target.value)}
          placeholder="Type here…"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <div className="flex gap-3 items-end">
          <ColorSwatch value={customColor} onChange={setCustomColor} label="Color" />
          <div className="flex-1">
            <RangeRow label="Size" value={customSize} min={8} max={120} onChange={setCustomSize} unit="px" />
          </div>
        </div>
        <select value={customFont} onChange={e => setCustomFont(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none">
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex gap-2">
          <ToolBtn onClick={() => setCustomBold(b => !b)}
            className={`flex-1 border text-sm font-bold ${customBold ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-gray-50 border-gray-200'}`}>
            B Bold
          </ToolBtn>
          <ToolBtn onClick={() => setCustomItalic(i => !i)}
            className={`flex-1 border text-sm italic ${customItalic ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-gray-50 border-gray-200'}`}>
            I Italic
          </ToolBtn>
        </div>
        <div className="flex gap-2">
          <ToolBtn onClick={close(() => ctx.addText(customText, {
              fontSize: customSize, fill: customColor, fontFamily: customFont,
              fontWeight: customBold ? 'bold' : 'normal',
              fontStyle: customItalic ? 'italic' : 'normal',
            }))}
            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700">Add</ToolBtn>
          <ToolBtn onClick={() => {
              const o = ctx.getSelectedObject();
              if (o?.type === 'textbox' || o?.type === 'text') {
                o.set({ text: customText, fontSize: customSize, fill: customColor,
                  fontFamily: customFont,
                  fontWeight: customBold ? 'bold' : 'normal',
                  fontStyle: customItalic ? 'italic' : 'normal' });
                ctx.canvasRef.current?.renderAll();
              }
            }}
            className="flex-1 bg-amber-500 text-white hover:bg-amber-600">Update</ToolBtn>
        </div>
      </>)}

      {/* DRAW */}
      {section('draw', '✏ Drawing', <>
        <ToolBtn onClick={() => ctx.setIsDrawingMode(!ctx.isDrawingMode)}
          className={`w-full ${ctx.isDrawingMode
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-800 text-white hover:bg-gray-700'}`}>
          {ctx.isDrawingMode ? '✕ Exit Drawing Mode' : '✏ Enter Drawing Mode'}
        </ToolBtn>
        {ctx.isDrawingMode && (<>
          <div className="flex gap-2">
            {['pencil','spray','circle'].map(b => (
              <ToolBtn key={b} onClick={() => ctx.setBrushType(b)}
                className={`flex-1 text-xs border capitalize
                  ${ctx.brushType === b ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-gray-50'}`}>
                {b}
              </ToolBtn>
            ))}
          </div>
          <ColorSwatch value={ctx.activeColor} onChange={ctx.setActiveColor} label="Brush Color" />
          <RangeRow label="Brush Width" value={ctx.brushWidth} min={1} max={80} onChange={ctx.setBrushWidth} unit="px" />
        </>)}
      </>)}

      {/* EFFECTS */}
      {section('effects', '✨ Effects', <>
        <ShadowPanel onApply={ctx.setSelectedShadow} onRemove={ctx.removeShadow} />
        <GradientPanel onApply={ctx.applyGradient} />
      </>)}

      {/* OBJECT */}
      {section('object', '⚙ Object', <>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolBtn onClick={close(ctx.flipH)} className="bg-gray-50 hover:bg-gray-100 border text-xs">↔ Flip H</ToolBtn>
          <ToolBtn onClick={close(ctx.flipV)} className="bg-gray-50 hover:bg-gray-100 border text-xs">↕ Flip V</ToolBtn>
          <ToolBtn onClick={close(ctx.group)} className="bg-gray-50 hover:bg-gray-100 border text-xs">⛶ Group</ToolBtn>
          <ToolBtn onClick={close(ctx.ungroup)} className="bg-gray-50 hover:bg-gray-100 border text-xs">⛷ Ungroup</ToolBtn>
          <ToolBtn onClick={close(ctx.toggleLock)} className="bg-gray-50 hover:bg-gray-100 border text-xs">🔒 Lock</ToolBtn>
          <ToolBtn onClick={close(ctx.copy)} className="bg-gray-50 hover:bg-gray-100 border text-xs">⧉ Copy</ToolBtn>
          <ToolBtn onClick={close(ctx.paste)} className="bg-gray-50 hover:bg-gray-100 border text-xs col-span-2">📋 Paste</ToolBtn>
        </div>

        <Divider />
        <SectionTitle>Layers</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolBtn onClick={ctx.bringToFront} className="bg-gray-50 hover:bg-gray-100 border text-xs">⬆ Front</ToolBtn>
          <ToolBtn onClick={ctx.bringForward} className="bg-gray-50 hover:bg-gray-100 border text-xs">↑ Forward</ToolBtn>
          <ToolBtn onClick={ctx.sendBackward} className="bg-gray-50 hover:bg-gray-100 border text-xs">↓ Backward</ToolBtn>
          <ToolBtn onClick={ctx.sendToBack}   className="bg-gray-50 hover:bg-gray-100 border text-xs">⬇ Back</ToolBtn>
        </div>

        <Divider />
        <SectionTitle>Align</SectionTitle>
        <div className="grid grid-cols-3 gap-1.5">
          {[['left','⫷ Left'],['right','⫸ Right'],['top','⫴ Top'],
            ['bottom','⫵ Bottom'],['centerH','↔ Center H'],['centerV','↕ Center V']].map(([d,l]) => (
            <ToolBtn key={d} onClick={() => ctx.alignObject(d)}
              className="bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border text-[10px]">{l}</ToolBtn>
          ))}
        </div>

        <Divider />
        <SectionTitle>Selected Opacity</SectionTitle>
        <RangeRow label="" value={100} min={0} max={100}
          onChange={v => ctx.setSelectedOpacity(v / 100)} unit="%" />
      </>)}

    </div>
  );
};

// ─── RIGHT PANEL content ──────────────────────────────────────────────────────

// ✅ onBuyNow prop added — addToCart removed
const RightPanel = ({ ctx, onDownload, onBuyNow }) => {
  const jsonRef = useRef(null);
  const [openSection, setOpenSection] = useState('history');

  const section = (id, label, content) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold
          text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setOpenSection(s => s === id ? null : id)}
      >
        {label}
        <span className="text-gray-400">{openSection === id ? '▲' : '▼'}</span>
      </button>
      {openSection === id && <div className="p-4 space-y-3">{content}</div>}
    </div>
  );

  return (
    <div className="space-y-3">

      {/* HISTORY */}
      {section('history', '🕐 History', <>
        <div className="flex gap-2">
          <ToolBtn onClick={ctx.undo} disabled={!ctx.canUndo}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40">↩ Undo</ToolBtn>
          <ToolBtn onClick={ctx.redo} disabled={!ctx.canRedo}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40">↪ Redo</ToolBtn>
        </div>
      </>)}

      {/* ZOOM */}
      {section('zoom', '🔍 Zoom', <>
        <div className="flex items-center gap-2">
          <ToolBtn onClick={ctx.zoomOut} className="bg-gray-100 hover:bg-gray-200 px-4">－</ToolBtn>
          <span className="flex-1 text-center font-mono text-sm">
            {Math.round(ctx.zoom * 100)}%
          </span>
          <ToolBtn onClick={ctx.zoomIn}  className="bg-gray-100 hover:bg-gray-200 px-4">＋</ToolBtn>
        </div>
        <ToolBtn onClick={ctx.resetZoom} className="w-full bg-gray-50 hover:bg-gray-100 border text-sm">
          Reset Zoom
        </ToolBtn>
      </>)}

      {/* CANVAS */}
      {section('canvas', '🖼 Canvas', <>
        <ToolBtn onClick={ctx.toggleGrid}
          className={`w-full border ${ctx.snapToGrid ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
          {ctx.snapToGrid ? '✓ Grid On' : '⊞ Snap to Grid'}
        </ToolBtn>
        <label className="flex items-center justify-between text-sm text-gray-600">
          Background
          <input type="color" defaultValue="#ffffff"
            onChange={e => ctx.setCanvasBackground(e.target.value)}
            className="w-9 h-9 rounded border cursor-pointer" />
        </label>
        <label className="flex items-center justify-between text-sm text-gray-600">
          Select All
          <ToolBtn onClick={ctx.selectAll} className="bg-gray-100 hover:bg-gray-200 border text-xs px-3">
            ⊠ All
          </ToolBtn>
        </label>
      </>)}

      {/* EXPORT */}
      {section('export', '💾 Export', <>
        <div className="grid grid-cols-2 gap-2">
          {['png','jpeg','svg','json'].map(fmt => (
            <ToolBtn key={fmt} onClick={() => ctx.exportAs(fmt)}
              className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-xs font-mono uppercase">
              ⬇ {fmt}
            </ToolBtn>
          ))}
        </div>
        <ToolBtn onClick={() => jsonRef.current?.click()}
          className="w-full bg-gray-50 hover:bg-gray-100 border text-sm">
          📂 Import JSON
        </ToolBtn>
        <input ref={jsonRef} type="file" accept=".json" className="hidden"
          onChange={e => {
            const f = e.target.files[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = ev => ctx.importFromJSON(ev.target.result);
            r.readAsText(f);
            e.target.value = '';
          }} />
        <ToolBtn onClick={onDownload}
          className="w-full bg-teal-600 text-white hover:bg-teal-700">
          📸 Download PNG
        </ToolBtn>
      </>)}

      {/* PAGES */}
      {section('pages', '📄 Pages', <>
        <div className="space-y-1.5">
          {ctx.pages.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <button
                onClick={() => ctx.setActivePage(p.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm border transition-colors
                  ${ctx.activePage === p.id
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                {p.label}
              </button>
              {ctx.pages.length > 1 && (
                <button onClick={() => ctx.removePage(p.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
              )}
            </div>
          ))}
        </div>
        <ToolBtn onClick={ctx.addPage} className="w-full border border-dashed border-gray-300 hover:bg-gray-50 text-sm text-gray-500">
          + Add Page
        </ToolBtn>
      </>)}

      {/* ✅ BUY NOW — addToCart section removed, replaced with Buy Now */}
      {section('buynow', '⚡ Buy Now', <>
        <ToolBtn onClick={onBuyNow}
          className="w-full bg-green-600 text-white hover:bg-green-700 py-3">
          ⚡ Buy Now
        </ToolBtn>
        <p className="text-xs text-gray-400 text-center">All pages (front &amp; back) included</p>
      </>)}

    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TshirtDesigner = ({ product,variant, size, images }) => {
  const canvasElRef = useRef(null);
  const [leftDrawerOpen,  setLeftDrawerOpen]  = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const ctx = useCanvas();
  const { initCanvas, canvasRef, undo, redo, canUndo, canRedo } = ctx;

  // ✅ useNavigate inside component
  const navigate = useNavigate();

  // ── init fabric canvas ─────────────────────────────────────────────────────
  useEffect(() => {
    if (canvasElRef.current && !canvasRef.current) {
      initCanvas(canvasElRef.current);
    }
  }, [initCanvas, canvasRef]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const closeMobileDrawers = useCallback(() => {
    if (window.innerWidth < 1024) {
      setLeftDrawerOpen(false);
      setRightDrawerOpen(false);
    }
  }, []);

  // ✅ getAllDesignImages — reads page.json directly (no canvas switching needed)
  //    Works because switchPage() always saves current page JSON before switching
  const getAllDesignImages = useCallback(async () => {
    if (!canvasRef.current) return [];

    const fabric = canvasRef.current;
    const designImages = [];

    // 🔥 STEP 1: Save current active page JSON first (it may not be saved yet)
    const currentPageObj = ctx.pages.find(p => p.id === ctx.activePage);
    if (currentPageObj) {
      currentPageObj.json = fabric.toJSON();
    }

    // 🔥 STEP 2: Loop all pages, load each JSON into a temp offscreen render
    for (const page of ctx.pages) {
      const json = page.json;

      if (!json || !json.objects || json.objects.length === 0) {
        // Empty page — capture blank canvas
        fabric.clear();
        fabric.renderAll();
      } else {
        // Load this page's JSON into canvas
        await new Promise((resolve) => {
          fabric.loadFromJSON(json, () => {
            fabric.renderAll();
            resolve();
          });
        });
      }

      // Small wait to ensure paint is complete
      await new Promise((r) => setTimeout(r, 80));

      const url = fabric.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
      designImages.push(url);
    }

    // 🔒 STEP 3: Restore the original active page back on canvas
    if (currentPageObj?.json) {
      await new Promise((resolve) => {
        fabric.loadFromJSON(currentPageObj.json, () => {
          fabric.renderAll();
          resolve();
        });
      });
    }

    return designImages;
  }, [canvasRef, ctx]);

  // ✅ handleBuyNow
  const handleBuyNow = useCallback(async () => {
    const designImages = await getAllDesignImages();

    navigate('/checkout', {
      state: {
        selectedItems: [
          {
            productId: product?._id,
            variantId: variant?._id,
            name: product?.name,
            price: variant?.price,
            size,
            color: variant?.color,
            image: images?.[0],
            quantity: 1,
            designImage: designImages, // ✅ [page1.png, page2.png, ...]
          },
        ],
        fromCart: false,
      },
    });

    closeMobileDrawers();
  }, [getAllDesignImages, navigate, product, variant, size, images, closeMobileDrawers]);

  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tshirt-design.png';
    a.click();
    closeMobileDrawers();
  }, [canvasRef, closeMobileDrawers]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg md:text-xl font-semibold text-gray-800">T‑Shirt Studio</h1>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <span className="text-xs text-gray-500 hidden sm:inline">Design your own</span>
        </div>

        {/* Undo / Redo + Download + Buy Now */}
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md
              disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation">↩</button>
          <button onClick={redo} disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md
              disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation">↪</button>
          <div className="h-5 w-px bg-gray-300" />
          <button onClick={downloadImage}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md touch-manipulation">
            📸 Download
          </button>
          {/* ✅ Buy Now button in top bar */}
          <button onClick={handleBuyNow}
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md touch-manipulation">
            ⚡ Buy Now
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Mobile FABs ─────────────────────────────────────────────── */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30
          flex gap-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl px-5 py-2.5 border border-gray-200">
          <button onClick={() => setLeftDrawerOpen(true)}
            className="flex flex-col items-center px-3 py-1 rounded-full active:bg-gray-100 touch-manipulation">
            <span className="text-xl">🛠️</span>
            <span className="text-[11px] text-gray-600 font-medium">Tools</span>
          </button>
          <button onClick={() => setRightDrawerOpen(true)}
            className="flex flex-col items-center px-3 py-1 rounded-full active:bg-gray-100 touch-manipulation">
            <span className="text-xl">⚙️</span>
            <span className="text-[11px] text-gray-600 font-medium">Actions</span>
          </button>
        </div>

        {/* ── LEFT SIDEBAR (desktop) ───────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Design Tools</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <LeftPanel ctx={ctx} onClose={null} />
          </div>
        </aside>

        {/* ── LEFT DRAWER (mobile) ─────────────────────────────────────── */}
        <Drawer isOpen={leftDrawerOpen} onClose={() => setLeftDrawerOpen(false)}
          title="Design Tools" position="left">
          <LeftPanel ctx={ctx} onClose={closeMobileDrawers} />
        </Drawer>

        {/* ── CENTER CANVAS ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center
          p-4 md:p-8 bg-gradient-to-br from-gray-100 to-gray-200 overflow-auto">

          {/* Zoom indicator badge */}
          <div className="mb-3 flex items-center gap-2">
            <button onClick={ctx.zoomOut}
              className="w-7 h-7 rounded-full bg-white shadow text-sm hover:bg-gray-50">－</button>
            <span className="text-xs font-mono bg-white rounded-full px-3 py-1 shadow text-gray-600">
              {Math.round(ctx.zoom * 100)}%
            </span>
            <button onClick={ctx.zoomIn}
              className="w-7 h-7 rounded-full bg-white shadow text-sm hover:bg-gray-50">＋</button>
          </div>

          <div className="bg-white shadow-2xl rounded-2xl p-4 inline-block ring-1 ring-black/5">
            <div className="overflow-auto max-w-[calc(100vw-2rem)] md:max-w-full">
              <canvas
                ref={canvasElRef}
                className="block rounded shadow-inner"
                style={{ maxWidth: '100%' }}
              />
            </div>
            <p className="text-xs text-center text-gray-400 mt-2 md:hidden">
              👉 Scroll to see full design
            </p>
          </div>

          {/* Page tabs below canvas */}
          <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
            {ctx.pages.map(p => (
              <button key={p.id} onClick={() => ctx.setActivePage(p.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors
                  ${ctx.activePage === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
                {p.label}
              </button>
            ))}
            <button onClick={ctx.addPage}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border border-dashed
                border-gray-300 text-gray-500 hover:bg-white">+ Page</button>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR (desktop) ──────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <RightPanel ctx={ctx} onDownload={downloadImage} onBuyNow={handleBuyNow} />
          </div>
        </aside>

        {/* ── RIGHT DRAWER (mobile) ────────────────────────────────────── */}
        <Drawer isOpen={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)}
          title="Actions" position="right">
          <RightPanel ctx={ctx} onDownload={downloadImage} onBuyNow={handleBuyNow} />
        </Drawer>

      </div>
    </div>
  );
};

export default TshirtDesigner;