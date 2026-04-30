/**
 * CanvasToolbar.jsx
 * ─────────────────
 * A production-grade toolbar UI that wires up every feature
 * exposed by the enhanced CanvasProvider.
 *
 * Drop this next to your <CanvasProvider> and render it inside it.
 *
 * Usage:
 *   <CanvasProvider shirtImageUrl={url} imageKey={key} onProviderReady={fn}>
 *     <CanvasToolbar />
 *     <YourCanvasComponent />
 *   </CanvasProvider>
 */

import { useState, useRef, useCallback } from 'react';
import { useCanvas } from './CanvasContext'; // adjust path as needed

// ─── tiny icon stubs – replace with your icon library ──────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    undo:       '↩', redo:      '↪',
    trash:      '🗑', copy:      '⧉',
    paste:      '📋', duplicate: '⊞',
    front:      '⬆', back:      '⬇',
    fwd:        '↑',  bwd:      '↓',
    group:      '⛶', ungroup:  '⛷',
    flipH:      '↔', flipV:    '↕',
    lock:       '🔒', unlock:   '🔓',
    alignL:     '⫷', alignR:   '⫸',
    alignT:     '⫴', alignB:   '⫵',
    alignCH:    '⊕', alignCV:  '⊗',
    zoomIn:     '＋', zoomOut:  '－',
    grid:       '⊞', export:   '⬇',
    pencil:     '✏', spray:    '💨',
    circle:     '○', text:     'T',
    image:      '🖼', clear:    '✕',
    canva:      '🎨', pages:    '📄',
    shadow:     '◑', grad:     '▦',
    stroke:     '◻',
  };
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icons[name] || '?'}</span>;
};

const Btn = ({ icon, label, onClick, active, danger, disabled, size = 16 }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            2,
      padding:        '6px 8px',
      borderRadius:   8,
      border:         'none',
      cursor:         disabled ? 'not-allowed' : 'pointer',
      background:     active  ? '#e8f0fe'
                    : danger  ? '#fff0f0'
                    : 'transparent',
      color:          active  ? '#1a73e8'
                    : danger  ? '#d93025'
                    : disabled ? '#bbb'
                    : '#333',
      fontSize:       10,
      fontFamily:     "'DM Mono', monospace",
      fontWeight:     600,
      transition:     'background 0.15s',
      minWidth:       36,
    }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.background = active ? '#d2e3fc' : '#f1f3f4')}
    onMouseLeave={e => !disabled && (e.currentTarget.style.background = active ? '#e8f0fe' : 'transparent')}
  >
    <Icon name={icon} size={size} />
    <span style={{ fontSize: 9, opacity: 0.8 }}>{label}</span>
  </button>
);

const Sep = () => (
  <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 4px', flexShrink: 0 }} />
);

const Section = ({ title, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace', padding: '0 4px', letterSpacing: 1 }}>{title}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{children}</div>
  </div>
);

const ColorDot = ({ color, onChange, label }) => (
  <label title={label} style={{ position: 'relative', cursor: 'pointer' }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: color, border: '2px solid #ddd',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
    <input type="color" value={color} onChange={e => onChange(e.target.value)}
      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
  </label>
);

const Slider = ({ value, min = 0, max = 1, step = 0.01, onChange, label, width = 70 }) => (
  <label title={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width, accentColor: '#1a73e8' }} />
  </label>
);

// ─── PANELS ──────────────────────────────────────────────────────────────────

const ShadowPanel = ({ onApply, onRemove }) => {
  const [blur, setBlur]       = useState(10);
  const [ox, setOx]           = useState(5);
  const [oy, setOy]           = useState(5);
  const [color, setColor]     = useState('rgba(0,0,0,0.5)');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
      background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      minWidth: 200, fontSize: 12 }}>
      <strong>Shadow</strong>
      <label>Color <input type="color" onChange={e => setColor(e.target.value)} /></label>
      <Slider label="Blur"    value={blur} min={0} max={50} step={1} onChange={setBlur} width={160} />
      <Slider label="Offset X" value={ox}  min={-50} max={50} step={1} onChange={setOx} width={160} />
      <Slider label="Offset Y" value={oy}  min={-50} max={50} step={1} onChange={setOy} width={160} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onApply({ color, blur, offsetX: ox, offsetY: oy })}
          style={{ flex: 1, padding: '6px 0', background: '#1a73e8', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Apply</button>
        <button onClick={onRemove}
          style={{ flex: 1, padding: '6px 0', background: '#f1f3f4',
            border: 'none', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
      </div>
    </div>
  );
};

const GradientPanel = ({ onApply }) => {
  const [type, setType]     = useState('linear');
  const [c1, setC1]         = useState('#ff6b6b');
  const [c2, setC2]         = useState('#4ecdc4');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
      background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      minWidth: 200, fontSize: 12 }}>
      <strong>Gradient Fill</strong>
      <label>Type: &nbsp;
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Color 1 <input type="color" value={c1} onChange={e => setC1(e.target.value)} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Color 2 <input type="color" value={c2} onChange={e => setC2(e.target.value)} />
      </label>
      <div style={{
        height: 20, borderRadius: 4,
        background: `linear-gradient(to right, ${c1}, ${c2})`,
      }} />
      <button onClick={() => onApply(type, c1, c2)}
        style={{ padding: '6px 0', background: '#1a73e8', color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Apply</button>
    </div>
  );
};

const CanvaPanel = ({ onSearch, designs, loading, error, onImport }) => {
  const [q, setQ] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
      background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      minWidth: 260, maxHeight: 380, overflow: 'hidden', fontSize: 12 }}>
      <strong style={{ fontSize: 13 }}>🎨 Canva Library</strong>
      <div style={{ display: 'flex', gap: 4 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search designs…"
          style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd' }} />
        <button onClick={() => onSearch(q)}
          style={{ padding: '4px 10px', background: '#7c4dff', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Go</button>
      </div>
      {loading && <div style={{ textAlign: 'center', color: '#888' }}>Loading…</div>}
      {error   && <div style={{ color: '#d93025', fontSize: 11 }}>{error}</div>}
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {designs.length === 0 && !loading && (
          <div style={{ color: '#888', textAlign: 'center', padding: 16 }}>
            Click Go to search your Canva designs
          </div>
        )}
        {designs.map(d => (
          <div key={d.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              borderRadius: 8, cursor: 'pointer', border: '1px solid #eee',
              background: '#fafafa' }}
            onClick={() => onImport(d.id)}>
            {d.thumbnail?.url && (
              <img src={d.thumbnail.url} alt="" width={40} height={40}
                style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 11 }}>{d.title || 'Untitled'}</div>
              <div style={{ color: '#888', fontSize: 10 }}>{d.design_type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN TOOLBAR ─────────────────────────────────────────────────────────────

export const CanvasToolbar = () => {
  const ctx = useCanvas();

  const [activePanel, setActivePanel] = useState(null); // 'shadow' | 'gradient' | 'canva'
  const [brushTypeLocal, setBrushTypeLocal] = useState('pencil');

  const fileInputRef  = useRef(null);
  const jsonInputRef  = useRef(null);

  const togglePanel = (name) => setActivePanel(p => p === name ? null : name);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) { ctx.addImage(file); e.target.value = ''; }
  }, [ctx]);

  const handleJSONImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => ctx.importFromJSON(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }, [ctx]);

  const setBrush = (type) => {
    setBrushTypeLocal(type);
    ctx.setBrushType(type);
  };

  // ─── styles ────────────────────────────────────────────────────────────────
  const toolbarStyle = {
    display:        'flex',
    alignItems:     'flex-start',
    gap:            12,
    padding:        '10px 16px',
    background:     '#fff',
    borderRadius:   14,
    boxShadow:      '0 2px 12px rgba(0,0,0,0.12)',
    flexWrap:       'wrap',
    userSelect:     'none',
    fontFamily:     "'DM Mono', 'Courier New', monospace",
    position:       'relative',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* ── MAIN BAR ────────────────────────────────────────────────────── */}
      <div style={toolbarStyle}>

        {/* History */}
        <Section title="HISTORY">
          <Btn icon="undo"  label="Undo"  onClick={ctx.undo} disabled={!ctx.canUndo} />
          <Btn icon="redo"  label="Redo"  onClick={ctx.redo} disabled={!ctx.canRedo} />
        </Section>

        <Sep />

        {/* Colors */}
        <Section title="COLORS">
          <ColorDot color={ctx.activeColor} onChange={ctx.setActiveColor} label="Fill / Brush color" />
          <ColorDot color={ctx.strokeColor} onChange={ctx.setStrokeColor} label="Stroke color" />
          <Slider label="Opacity" value={ctx.fillOpacity} onChange={ctx.setFillOpacity} />
        </Section>

        <Sep />

        {/* Draw */}
        <Section title="DRAW">
          <Btn icon="pencil" label="Draw"  onClick={() => ctx.setIsDrawingMode(!ctx.isDrawingMode)}
            active={ctx.isDrawingMode} />
          {ctx.isDrawingMode && (
            <>
              <button onClick={() => setBrush('pencil')}
                style={{ padding: '3px 7px', borderRadius: 6,
                  background: brushTypeLocal === 'pencil' ? '#e8f0fe' : '#f1f3f4',
                  border: 'none', cursor: 'pointer', fontSize: 11 }}>✏ Pencil</button>
              <button onClick={() => setBrush('spray')}
                style={{ padding: '3px 7px', borderRadius: 6,
                  background: brushTypeLocal === 'spray' ? '#e8f0fe' : '#f1f3f4',
                  border: 'none', cursor: 'pointer', fontSize: 11 }}>💨 Spray</button>
              <button onClick={() => setBrush('circle')}
                style={{ padding: '3px 7px', borderRadius: 6,
                  background: brushTypeLocal === 'circle' ? '#e8f0fe' : '#f1f3f4',
                  border: 'none', cursor: 'pointer', fontSize: 11 }}>○ Circle</button>
              <Slider label="Size" value={ctx.brushWidth} min={1} max={80} step={1}
                onChange={ctx.setBrushWidth} />
            </>
          )}
        </Section>

        <Sep />

        {/* Shapes */}
        <Section title="SHAPES">
          {['rect','circle','triangle','line','arrow','star','pentagon','hexagon','ellipse'].map(s => (
            <button key={s} onClick={() => ctx.addShape(s)} title={s}
              style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid #e0e0e0',
                background: '#f9f9f9', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </Section>

        <Sep />

        {/* Text */}
        <Section title="TEXT">
          <Btn icon="text" label="Add Text" onClick={() => ctx.addText()} size={20} />
        </Section>

        <Sep />

        {/* Image */}
        <Section title="IMAGE">
          <Btn icon="image" label="Upload" onClick={() => fileInputRef.current?.click()} />
          <input ref={fileInputRef} type="file" accept="image/*"
            onChange={handleFileChange} style={{ display: 'none' }} />
        </Section>

        <Sep />

        {/* Object ops */}
        <Section title="OBJECT">
          <Btn icon="duplicate" label="Dup"     onClick={ctx.duplicate} />
          <Btn icon="copy"      label="Copy"    onClick={ctx.copy} />
          <Btn icon="paste"     label="Paste"   onClick={ctx.paste} />
          <Btn icon="trash"     label="Delete"  onClick={ctx.removeSelected} danger />
          <Btn icon="lock"      label="Lock"    onClick={ctx.toggleLock} />
          <Btn icon="flipH"     label="Flip H"  onClick={ctx.flipH} />
          <Btn icon="flipV"     label="Flip V"  onClick={ctx.flipV} />
          <Btn icon="group"     label="Group"   onClick={ctx.group} />
          <Btn icon="ungroup"   label="Ungroup" onClick={ctx.ungroup} />
        </Section>

        <Sep />

        {/* Layers */}
        <Section title="LAYERS">
          <Btn icon="front" label="Front"   onClick={ctx.bringToFront} />
          <Btn icon="fwd"   label="Fwd"     onClick={ctx.bringForward} />
          <Btn icon="bwd"   label="Bwd"     onClick={ctx.sendBackward} />
          <Btn icon="back"  label="Back"    onClick={ctx.sendToBack} />
        </Section>

        <Sep />

        {/* Align */}
        <Section title="ALIGN">
          {[['⫷','left'],['⫸','right'],['⫴','top'],
            ['⫵','bottom'],['↔','centerH'],['↕','centerV']].map(([ico, dir]) => (
            <button key={dir} onClick={() => ctx.alignObject(dir)} title={`Align ${dir}`}
              style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid #e0e0e0',
                background: '#f9f9f9', cursor: 'pointer', fontSize: 13 }}>{ico}</button>
          ))}
        </Section>

        <Sep />

        {/* Effects */}
        <Section title="EFFECTS">
          <Btn icon="shadow" label="Shadow"  onClick={() => togglePanel('shadow')} active={activePanel === 'shadow'} />
          <Btn icon="grad"   label="Gradient" onClick={() => togglePanel('gradient')} active={activePanel === 'gradient'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace', letterSpacing: 1 }}>STROKE W</span>
            <input type="number" min={0} max={20} value={ctx.strokeWidth}
              onChange={e => ctx.setStrokeWidth(parseInt(e.target.value))}
              style={{ width: 44, padding: '3px 5px', borderRadius: 6,
                border: '1px solid #ddd', fontFamily: 'monospace', fontSize: 12 }} />
          </div>
        </Section>

        <Sep />

        {/* Zoom */}
        <Section title="ZOOM">
          <Btn icon="zoomOut" label="Out"   onClick={ctx.zoomOut} />
          <span style={{ fontFamily: 'monospace', fontSize: 11, minWidth: 40, textAlign: 'center' }}>
            {Math.round(ctx.zoom * 100)}%
          </span>
          <Btn icon="zoomIn"  label="In"    onClick={ctx.zoomIn} />
          <button onClick={ctx.resetZoom}
            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0',
              background: '#f9f9f9', cursor: 'pointer', fontFamily: 'monospace' }}>Reset</button>
        </Section>

        <Sep />

        {/* Canvas ops */}
        <Section title="CANVAS">
          <Btn icon="grid"  label="Grid"  onClick={ctx.toggleGrid} active={ctx.snapToGrid} />
          <label title="Canvas BG" style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>BG</span>
            <input type="color" defaultValue="#ffffff"
              onChange={e => ctx.setCanvasBackground(e.target.value)}
              style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
          </label>
          <Btn icon="clear"  label="Clear"  onClick={ctx.clearCanvas} danger />
        </Section>

        <Sep />

        {/* Export / Import */}
        <Section title="EXPORT">
          {['png','jpeg','svg','json'].map(fmt => (
            <button key={fmt} onClick={() => ctx.exportAs(fmt)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0',
                background: '#f9f9f9', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {fmt}
            </button>
          ))}
          <button onClick={() => jsonInputRef.current?.click()}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #1a73e8',
              color: '#1a73e8', background: '#fff', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace' }}>
            Import JSON
          </button>
          <input ref={jsonInputRef} type="file" accept=".json"
            onChange={handleJSONImport} style={{ display: 'none' }} />
        </Section>

        <Sep />

        {/* Canva */}
        <Section title="CANVA">
          <Btn icon="canva" label="Library" onClick={() => {
            togglePanel('canva');
            if (activePanel !== 'canva') ctx.fetchCanvaDesigns();
          }} active={activePanel === 'canva'} />
        </Section>

      </div>

      {/* ── FLOATING PANELS ──────────────────────────────────────────────── */}
      {activePanel === 'shadow' && (
        <div style={{ position: 'absolute', top: 90, left: 16, zIndex: 999 }}>
          <ShadowPanel onApply={ctx.setSelectedShadow} onRemove={ctx.removeShadow} />
        </div>
      )}
      {activePanel === 'gradient' && (
        <div style={{ position: 'absolute', top: 90, left: 16, zIndex: 999 }}>
          <GradientPanel onApply={ctx.applyGradient} />
        </div>
      )}
      {activePanel === 'canva' && (
        <div style={{ position: 'absolute', top: 90, right: 16, zIndex: 999 }}>
          <CanvaPanel
            designs={ctx.canvaDesigns}
            loading={ctx.canvaLoading}
            error={ctx.canvaError}
            onSearch={ctx.fetchCanvaDesigns}
            onImport={ctx.importCanvaDesignAsImage}
          />
        </div>
      )}

      {/* ── PAGE TABS ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
        {ctx.pages.map(p => (
          <button key={p.id}
            onClick={() => ctx.setActivePage(p.id)}
            style={{
              padding: '4px 14px', borderRadius: 20,
              border: ctx.activePage === p.id ? '2px solid #1a73e8' : '1px solid #ddd',
              background: ctx.activePage === p.id ? '#e8f0fe' : '#f9f9f9',
              color: ctx.activePage === p.id ? '#1a73e8' : '#555',
              cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
            }}>
            {p.label}
          </button>
        ))}
        <button onClick={ctx.addPage}
          style={{ padding: '4px 12px', borderRadius: 20, border: '1px dashed #ccc',
            background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#888' }}>
          + Page
        </button>
      </div>

    </div>
  );
};

export default CanvasToolbar;