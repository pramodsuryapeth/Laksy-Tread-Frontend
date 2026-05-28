import { useEffect, useState, useRef, useCallback } from "react";
import PageWrapper from "../../components/admin/PageWrapper";
import Popup from "../../components/common/Popup";
import { updateOrderStatus, getAllOrders } from "../../services/ordreService";
import { getErrorMessage } from "../../utils/getErrorMessage";

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

/* ─── STATUS CONFIG ─────────────────────────────────────────────── */
const STATUS_CFG = {
  received:   { label:"Received",   emoji:"📦", color:"#D97706", rgb:"217,119,6",   step:1 },
  confirmed:  { label:"Confirmed",  emoji:"✅", color:"#2563EB", rgb:"37,99,235",   step:2 },
  ready:      { label:"Ready",      emoji:"🎯", color:"#7C3AED", rgb:"124,58,237",  step:3 },
  dispatched: { label:"Dispatched", emoji:"🚚", color:"#0891B2", rgb:"8,145,178",   step:4 },
  delivered:  { label:"Delivered",  emoji:"🏠", color:"#059669", rgb:"5,150,105",   step:5 },
};
const SK = Object.keys(STATUS_CFG);
const ALL_ST = ["all", ...SK];

function timeAgo(iso) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return `${Math.floor(s)}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

/* ─── PROGRESS STRIP ────────────────────────────────────────────── */
function ProgressStrip({ status }) {
  const cur = STATUS_CFG[status]?.step ?? 0;
  return (
    <div style={{ display:"flex", gap:3, margin:"12px 0 14px" }}>
      {SK.map((k) => {
        const { color, step } = STATUS_CFG[k];
        const filled = step <= cur;
        const active = step === cur;
        return (
          <div key={k} style={{
            flex:1, height:3, borderRadius:4,
            background: filled ? color : "#E5E7EB",
            boxShadow: active ? `0 0 8px ${color}88` : "none",
            transition:"background .35s, box-shadow .35s",
          }}/>
        );
      })}
    </div>
  );
}

/* ─── STATUS BADGE ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const c = STATUS_CFG[status];
  if (!c) return (
    <span style={{ fontSize:11, color:"#6B7280", padding:"3px 8px", borderRadius:100,
      background:"#F3F4F6", border:"1px solid #E5E7EB" }}>{status}</span>
  );
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:100,
      color: c.color,
      background:`rgba(${c.rgb},0.10)`,
      border:`1px solid rgba(${c.rgb},0.25)`,
      whiteSpace:"nowrap",
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.color,
        flexShrink:0, boxShadow:`0 0 5px ${c.color}66` }}/>
      {c.label}
    </span>
  );
}

/* ─── STAT CARD ─────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, rgb }) {
  return (
    <div style={{
      position:"relative", background:"#FFFFFF",
      border:"1px solid #E5E7EB", borderRadius:16,
      padding:"18px 20px", overflow:"hidden",
      boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
        background:color, borderRadius:"16px 16px 0 0" }}/>
      <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100,
        background:`radial-gradient(circle, rgba(${rgb},0.10), transparent 70%)`,
        borderRadius:"50%", pointerEvents:"none" }}/>
      <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
      <p style={{ fontSize:22, fontWeight:800, color:"#111827",
        fontFamily:"'DM Mono',monospace", lineHeight:1, marginBottom:5 }}>{value}</p>
      <p style={{ fontSize:10.5, color:"#6B7280", textTransform:"uppercase",
        letterSpacing:"0.07em", fontWeight:700 }}>{label}</p>
    </div>
  );
}

/* ─── ORDER CARD ────────────────────────────────────────────────── */
function OrderCard({ order, onSelect, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sc = STATUS_CFG[order.status];
  const isDelivery = order.deliveryType === "delivery";

  const handleChange = async (e) => {
    e.stopPropagation();
    setSaving(true);
    await onStatusChange(order._id, e.target.value);
    setSaving(false);
  };

  const shortId = safeStr(order.orderId || order._id).slice(-8);

  return (
    <div
      onClick={() => onSelect(order)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:"relative", overflow:"hidden", cursor:"pointer",
        background: hovered ? "#F9FAFB" : "#FFFFFF",
        border:`1px solid ${hovered ? "#D1D5DB" : "#E5E7EB"}`,
        borderRadius:16,
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px #E5E7EB"
          : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition:"all .22s ease",
      }}
    >
      {/* accent top line */}
      <div style={{ height:3, background: sc?.color ?? "#6366F1",
        borderRadius:"16px 16px 0 0" }}/>

      <div style={{ padding:"16px 18px 18px" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:0 }}>
          <div style={{
            width:40, height:40, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg, rgba(${sc?.rgb??"99,102,241"},0.15), rgba(${sc?.rgb??"99,102,241"},0.25))`,
            border:`1.5px solid rgba(${sc?.rgb??"99,102,241"},0.3)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:800, color: sc?.color ?? "#6366F1",
          }}>
            {(order.user?.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:14, fontWeight:700, color:"#111827",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>
              {order.user?.name ?? "Customer"}
            </p>
            <p style={{ fontSize:11, color:"#6B7280", fontFamily:"'DM Mono',monospace" }}>
              #{shortId}
            </p>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <span style={{
              display:"inline-block", fontSize:10.5, fontWeight:700,
              padding:"3px 9px", borderRadius:100,
              ...(isDelivery
                ? { background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#1D4ED8" }
                : { background:"#F3F4F6", border:"1px solid #E5E7EB", color:"#374151" }
              ),
            }}>
              {isDelivery ? "🚚 Delivery" : "🏪 Pickup"}
            </span>
            {order.createdAt && (
              <p style={{ fontSize:10, color:"#9CA3AF", marginTop:5 }}>
                {timeAgo(order.createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* ── Progress ── */}
        <ProgressStrip status={order.status} />

        {/* ── Footer: amount + controls ── */}
        <div
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            gap:8, flexWrap:"wrap" }}
          onClick={e => e.stopPropagation()}
        >
          <div>
            <p style={{ fontSize:10, color:"#6B7280", textTransform:"uppercase",
              letterSpacing:"0.07em", fontWeight:700, marginBottom:3 }}>Total</p>
            <p style={{ fontSize:18, fontWeight:800, color:"#111827",
              fontFamily:"'DM Mono',monospace", lineHeight:1 }}>
              ₹{(order.charges?.finalAmount ?? 0).toLocaleString()}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <StatusBadge status={order.status} />
            <div style={{ position:"relative" }}>
              <select
                value={order.status}
                onChange={handleChange}
                disabled={saving}
                style={{
                  appearance:"none", WebkitAppearance:"none",
                  background:"#F9FAFB", border:"1px solid #D1D5DB",
                  color:"#374151", fontSize:12, fontFamily:"'DM Sans',sans-serif",
                  padding:"6px 28px 6px 10px", borderRadius:9, outline:"none",
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.5 : 1, transition:"border .18s",
                  fontWeight:600,
                }}
              >
                {SK.map(s => (
                  <option key={s} value={s}>
                    {STATUS_CFG[s].emoji} {STATUS_CFG[s].label}
                  </option>
                ))}
              </select>
              <svg style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
                pointerEvents:"none", width:10, color:"#6B7280" }}
                fill="none" viewBox="0 0 10 6">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── Thumbnails + view link ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginTop:14, paddingTop:12, borderTop:"1px solid #F3F4F6" }}>
          <div style={{ display:"flex" }}>
            {(order.items ?? []).slice(0,4).map((item, i) => (
              <img key={i} src={item.image ?? "https://via.placeholder.com/28"} alt=""
                style={{ width:26, height:26, borderRadius:7,
                  border:"2px solid #fff", objectFit:"cover", marginLeft:i===0?0:-7,
                  boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }}/>
            ))}
            {(order.items?.length ?? 0) > 4 && (
              <div style={{ width:26, height:26, borderRadius:7, border:"2px solid #fff",
                background:"#F3F4F6", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:9, color:"#6B7280", fontWeight:700, marginLeft:-7 }}>
                +{order.items.length - 4}
              </div>
            )}
            <span style={{ marginLeft:10, fontSize:11, color:"#6B7280", alignSelf:"center" }}>
              {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSelect(order); }}
            style={{ background:"none", border:"none", cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
              color:"#4F46E5", padding:0, transition:"color .15s" }}
            onMouseEnter={e => e.target.style.color="#6366F1"}
            onMouseLeave={e => e.target.style.color="#4F46E5"}
          >
            Details →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SKELETON ──────────────────────────────────────────────────── */
const SK_LINE = {
  background:"linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)",
  backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite"
};

function SkeletonCard() {
  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB",
      borderRadius:16, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ height:3, background:"#E5E7EB" }}/>
      <div style={{ padding:"16px 18px 18px" }}>
        <div style={{ display:"flex", gap:12, marginBottom:14 }}>
          <div style={{ width:40, height:40, borderRadius:12, ...SK_LINE }}/>
          <div style={{ flex:1 }}>
            <div style={{ height:12, borderRadius:6, width:"55%", marginBottom:8, ...SK_LINE }}/>
            <div style={{ height:10, borderRadius:6, width:"35%", ...SK_LINE }}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:3, margin:"12px 0 14px" }}>
          {[...Array(5)].map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:4, ...SK_LINE }}/>)}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
          <div style={{ height:20, borderRadius:6, width:"25%", ...SK_LINE }}/>
          <div style={{ height:32, borderRadius:9, width:"42%", ...SK_LINE }}/>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL TIMELINE ────────────────────────────────────────────── */
function ModalTimeline({ status }) {
  const cur = STATUS_CFG[status]?.step ?? 0;
  return (
    <div style={{ display:"flex", overflowX:"auto", paddingBottom:4, gap:0 }}>
      {SK.map((k, i) => {
        const c = STATUS_CFG[k];
        const done = c.step < cur, active = c.step === cur;
        return (
          <div key={k} style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", position:"relative", minWidth:54 }}>
            {i < SK.length - 1 && (
              <div style={{
                position:"absolute", top:18, left:"50%", width:"100%", height:2,
                background: done || active ? c.color : "#E5E7EB",
                transition:"background .4s", zIndex:0,
              }}/>
            )}
            <div style={{
              position:"relative", zIndex:1, width:36, height:36, borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
              background: active ? `rgba(${c.rgb},0.12)` : done ? `rgba(${c.rgb},0.06)` : "#F9FAFB",
              border:`2px solid ${active ? c.color : done ? c.color+"88" : "#E5E7EB"}`,
              boxShadow: active ? `0 0 0 4px rgba(${c.rgb},0.12), 0 0 12px rgba(${c.rgb},0.3)` : "none",
              transition:"all .3s",
            }}>
              {done
                ? <span style={{ color:c.color, fontSize:13, fontWeight:700 }}>✓</span>
                : c.emoji}
            </div>
            <p style={{ fontSize:9.5, marginTop:7, textAlign:"center", fontWeight:700,
              whiteSpace:"nowrap",
              color: active ? c.color : done ? "#374151" : "#9CA3AF" }}>{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── INFO TILE ─────────────────────────────────────────────────── */
function InfoTile({ label, value, wide, accent }) {
  return (
    <div style={{
      gridColumn: wide ? "1/-1" : undefined,
      background: accent ? "#ECFDF5" : "#F9FAFB",
      border:`1px solid ${accent ? "#A7F3D0" : "#E5E7EB"}`,
      borderRadius:10, padding:"11px 13px",
    }}>
      <p style={{ fontSize:10, color:"#6B7280", textTransform:"uppercase",
        letterSpacing:"0.07em", fontWeight:700, marginBottom:5 }}>{label}</p>
      <p style={{ fontSize:13.5, fontWeight:600,
        color: accent ? "#065F46" : "#111827",
        fontFamily: accent ? "'DM Mono',monospace" : undefined,
        wordBreak:"break-word" }}>{value ?? "—"}</p>
    </div>
  );
}

/* ─── ORDER MODAL ───────────────────────────────────────────────── */
function OrderModal({ order, onClose }) {
  const ref = useRef();

  useEffect(() => {
    if (!order) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [order, onClose]);

  useEffect(() => {
    document.body.style.overflow = order ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [order]);

  if (!order) return null;

  const items    = order.items ?? [];
  const uploaded = order.uploadedImages ?? [];
  const sc       = STATUS_CFG[order.status];
  const fullId   = safeStr(order.orderId || order._id);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      padding:0, animation:"fadeIn .22s ease",
    }}>
      <style>{`@media(min-width:640px){ .ord-modal-wrap{ align-items:center !important; padding:16px !important; } .ord-modal{ border-radius:20px !important; max-height:90vh !important; } }`}</style>
      <div className="ord-modal-wrap" style={{ display:"flex", alignItems:"flex-end",
        justifyContent:"center", width:"100%", height:"100%", padding:0 }}>
        <div ref={ref} className="ord-modal" style={{
          background:"#FFFFFF", border:"1px solid #E5E7EB",
          borderRadius:"24px 24px 0 0", width:"100%", maxWidth:680,
          maxHeight:"94vh", display:"flex", flexDirection:"column",
          boxShadow:"0 -8px 60px rgba(0,0,0,0.15)",
          animation:"slideUp .3s cubic-bezier(.34,1.45,.64,1)",
        }}>
          {/* drag handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
            <div style={{ width:38, height:4, borderRadius:4, background:"#E5E7EB" }}/>
          </div>

          {/* accent line */}
          {sc && <div style={{ height:3, background:sc.color, margin:"10px 20px 0", borderRadius:4 }}/>}

          {/* header */}
          <div style={{ padding:"16px 22px 14px", borderBottom:"1px solid #F3F4F6", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"flex-start",
              justifyContent:"space-between", gap:12 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", lineHeight:1 }}>
                  Order Details
                </h2>
                <p style={{ fontSize:11.5, color:"#6B7280",
                  fontFamily:"'DM Mono',monospace", marginTop:5 }}>#{fullId}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <StatusBadge status={order.status} />
                <button
                  onClick={onClose}
                  style={{ width:32, height:32, borderRadius:9, background:"#F3F4F6",
                    border:"1px solid #E5E7EB", color:"#374151",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", flexShrink:0 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* body */}
          <div style={{ overflowY:"auto", padding:"18px 22px", flex:1 }}>

            {/* timeline */}
            <div style={{ marginBottom:24 }}>
              <p style={SECT_TITLE}>📍 Order Progress</p>
              <ModalTimeline status={order.status} />
            </div>

            {/* customer */}
            <div style={{ marginBottom:22 }}>
              <p style={SECT_TITLE}>👤 Customer Information</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <InfoTile label="Name"    value={order.user?.name} />
                <InfoTile label="Phone"   value={order.user?.phone} />
                <InfoTile label="Address" value={order.user?.address} wide />
                <InfoTile label="City"    value={order.user?.city} />
                <InfoTile label="State"   value={order.user?.state} />
                <InfoTile label="Pincode" value={order.user?.pincode} />
              </div>
            </div>

            {/* summary */}
            <div style={{ marginBottom:22 }}>
              <p style={SECT_TITLE}>🧾 Order Summary</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <InfoTile label="Delivery Type" value={order.deliveryType} />
                <InfoTile label="Total Amount"
                  value={`₹${(order.charges?.finalAmount??0).toLocaleString()}`} accent />
                <InfoTile label="Order ID"   value={`#${fullId}`} wide />
                <InfoTile label="Order Date" value={order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})
                  : null} wide />
              </div>
            </div>

            {/* items */}
            <div style={{ marginBottom:22 }}>
              <p style={SECT_TITLE}>
                🛒 Order Items
                <span style={{ marginLeft:8, fontSize:10, background:"#F3F4F6",
                  border:"1px solid #E5E7EB", color:"#6B7280",
                  padding:"2px 8px", borderRadius:100 }}>{items.length}</span>
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ background:"#F9FAFB", border:"1px solid #E5E7EB",
                    borderRadius:12, padding:14 }}>
                    <div style={{ display:"flex", gap:12 }}>
                      <img src={item.image ?? "https://via.placeholder.com/68"}
                        alt={item.name}
                        style={{ width:64, height:64, borderRadius:10, objectFit:"cover",
                          border:"1px solid #E5E7EB", flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:14, fontWeight:700, color:"#111827",
                          marginBottom:8, overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                          {item.size  && <span style={TAG}>{item.size}</span>}
                          {item.color && <span style={TAG}>{item.color}</span>}
                          <span style={TAG}>Qty: {item.quantity}</span>
                        </div>
                        <p style={{ fontSize:15, fontWeight:800, color:"#059669",
                          fontFamily:"'DM Mono',monospace" }}>
                          ₹{Number(item.price??0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {item.note && (
                      <div style={{ marginTop:10, display:"flex", gap:8,
                        background:"#FFFBEB", border:"1px solid #FDE68A",
                        borderRadius:8, padding:"9px 12px" }}>
                        <span style={{ fontSize:13 }}>📝</span>
                        <p style={{ fontSize:12, color:"#92400E", fontWeight:500 }}>
                          {item.note}
                        </p>
                      </div>
                    )}
                    {item.designImage?.length > 0 && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontSize:9.5, color:"#6B7280", textTransform:"uppercase",
                          letterSpacing:"0.07em", fontWeight:700, marginBottom:8 }}>
                          Design Images
                        </p>
                        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                          {item.designImage.map((src, j) => (
                            <a key={j} href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt="design"
                                style={{ width:50, height:50, borderRadius:8, objectFit:"cover",
                                  border:"1px solid #E5E7EB", transition:"transform .2s" }}
                                onMouseEnter={e=>e.target.style.transform="scale(1.08)"}
                                onMouseLeave={e=>e.target.style.transform="scale(1)"}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* uploaded files */}
            {uploaded.length > 0 && (
              <div style={{ marginBottom:22 }}>
                <p style={SECT_TITLE}>📎 Uploaded Files</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {uploaded.map((file, i) => {
                    const name  = file.split("/").pop().split("?")[0];
                    const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file);
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                        background:"#F9FAFB", border:"1px solid #E5E7EB",
                        borderRadius:10, padding:"10px 13px" }}>
                        {isImg
                          ? <img src={file} alt="" style={{ width:34, height:34,
                              borderRadius:7, objectFit:"cover", flexShrink:0 }}/>
                          : <div style={{ width:34, height:34, borderRadius:7,
                              background:"#F3F4F6", display:"flex", alignItems:"center",
                              justifyContent:"center", flexShrink:0 }}>📄</div>
                        }
                        <p style={{ flex:1, fontSize:11.5, color:"#374151",
                          fontFamily:"'DM Mono',monospace", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
                        <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                          <a href={file} target="_blank" rel="noreferrer"
                            style={{ fontSize:11, fontWeight:700, color:"#4F46E5",
                              background:"#EEF2FF", border:"1px solid #C7D2FE",
                              padding:"5px 11px", borderRadius:7, textDecoration:"none" }}>
                            View
                          </a>
                          <a href={file.replace("/upload/","/upload/fl_attachment/")} download
                            style={{ fontSize:11, fontWeight:700, color:"#065F46",
                              background:"#ECFDF5", border:"1px solid #A7F3D0",
                              padding:"5px 11px", borderRadius:7, textDecoration:"none" }}>
                            Save
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ padding:"14px 22px 20px", borderTop:"1px solid #F3F4F6", flexShrink:0 }}>
            <button
              onClick={onClose}
              style={{ width:"100%", padding:"12px",
                background:"linear-gradient(135deg,#4F46E5,#7C3AED)",
                color:"#fff", fontSize:13.5, fontWeight:700,
                border:"none", borderRadius:11, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                boxShadow:"0 4px 14px rgba(79,70,229,0.3)",
                transition:"opacity .15s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            >
              Close Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SECT_TITLE = {
  fontSize:10.5, fontWeight:800, color:"#374151",
  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12
};
const TAG = {
  fontSize:11, background:"#F3F4F6", border:"1px solid #E5E7EB",
  color:"#374151", padding:"2px 8px", borderRadius:6, fontWeight:600
};

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function Orders() {
  const [orders, setOrders]               = useState([]);
  const [activeTab, setActiveTab]         = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [popup, setPopup]                 = useState({ show:false, message:"", type:"success" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await getAllOrders();
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setOrders(data);
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showPopup = useCallback((message, type="success") => {
    setPopup({ show:true, message, type });
    setTimeout(() => setPopup(p => ({ ...p, show:false })), 3200);
  }, []);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      const safe = newStatus.trim().toLowerCase();
      await updateOrderStatus(orderId, safe);
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, status:safe } : o
      ));
      showPopup(`Updated to "${STATUS_CFG[safe]?.label ?? safe}"`, "success");
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
    }
  }, [showPopup]);

  const filtered = orders.filter(o => {
    if (activeTab !== "all" && o.deliveryType !== activeTab) return false;
    if (statusFilter !== "all" && o.status !== statusFilter)  return false;
    if (search) {
      const q    = search.toLowerCase();
      const id   = safeStr(o.orderId || o._id).toLowerCase();
      const name = safeStr(o.user?.name).toLowerCase();
      if (!id.includes(q) && !name.includes(q)) return false;
    }
    return true;
  });

  const revenue   = orders.reduce((a,o) => a + (o.charges?.finalAmount ?? 0), 0);
  const pending   = orders.filter(o => ["received","confirmed","ready"].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === "delivered").length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <PageWrapper title="Orders">
        <div style={{ maxWidth:1380, margin:"0 auto", padding:"28px 18px 70px",
          fontFamily:"'DM Sans',sans-serif", animation:"fadeIn .35s ease",
          background:"#F8FAFC", minHeight:"100vh" }}>

          {/* ── HEADER ── */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
            gap:16, marginBottom:28, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ fontSize:"clamp(20px,4vw,28px)", fontWeight:800, color:"#111827",
                display:"flex", alignItems:"center", gap:12, lineHeight:1,
                fontFamily:"'DM Sans',sans-serif" }}>
                Orders
                <span style={{ fontSize:12, fontWeight:700, background:"#F3F4F6",
                  border:"1px solid #E5E7EB", color:"#6B7280",
                  padding:"3px 10px", borderRadius:100,
                  fontFamily:"'DM Mono',monospace" }}>{orders.length}</span>
              </h1>
              <p style={{ fontSize:13, color:"#6B7280", marginTop:6 }}>
                Track and manage all customer orders
              </p>
            </div>

            {/* search */}
            <div style={{ position:"relative", width:"100%", maxWidth:300,
              minWidth:200, flexShrink:0 }}>
              <svg style={{ position:"absolute", left:12, top:"50%",
                transform:"translateY(-50%)", width:15, height:15,
                color:"#9CA3AF", pointerEvents:"none" }}
                fill="none" viewBox="0 0 20 20">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M15 15l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or order ID…"
                style={{
                  width:"100%", padding:"10px 36px 10px 36px",
                  background:"#FFFFFF", border:"1px solid #E5E7EB",
                  borderRadius:11, color:"#111827", fontSize:13,
                  fontFamily:"'DM Sans',sans-serif", outline:"none",
                  boxSizing:"border-box", transition:"border .18s",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
                }}
                onFocus={e=>e.target.style.borderColor="#6366F1"}
                onBlur={e=>e.target.style.borderColor="#E5E7EB"}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  style={{ position:"absolute", right:10, top:"50%",
                    transform:"translateY(-50%)", background:"#F3F4F6",
                    border:"none", color:"#6B7280", width:20, height:20,
                    borderRadius:6, fontSize:12, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
              )}
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
            gap:12, marginBottom:26 }}>
            <StatCard icon="📋" label="Total Orders" value={orders.length}
              color="#6366F1" rgb="99,102,241" />
            <StatCard icon="💰" label="Revenue"
              value={`₹${revenue.toLocaleString()}`}
              color="#059669" rgb="5,150,105" />
            <StatCard icon="⏳" label="Pending" value={pending}
              color="#D97706" rgb="217,119,6" />
            <StatCard icon="✅" label="Delivered" value={delivered}
              color="#2563EB" rgb="37,99,235" />
          </div>

          {/* ── DELIVERY TABS ── */}
          <div style={{ marginBottom:18, overflowX:"auto", paddingBottom:2 }}>
            <div style={{ display:"flex", gap:3, background:"#FFFFFF",
              border:"1px solid #E5E7EB", borderRadius:12, padding:4,
              width:"fit-content", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              {[
                { key:"all",      label:"All Orders", count:orders.length },
                { key:"pickup",   label:"🏪 Pickup",   count:orders.filter(o=>o.deliveryType==="pickup").length },
                { key:"delivery", label:"🚚 Delivery",  count:orders.filter(o=>o.deliveryType==="delivery").length },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  display:"flex", alignItems:"center", gap:7, padding:"8px 16px",
                  borderRadius:9, fontSize:12.5, fontWeight:700, whiteSpace:"nowrap",
                  fontFamily:"'DM Sans',sans-serif", border:"none", cursor:"pointer",
                  transition:"all .18s",
                  color: activeTab===t.key ? "#111827" : "#6B7280",
                  background: activeTab===t.key ? "#F3F4F6" : "none",
                }}>
                  {t.label}
                  <span style={{ fontSize:10, background: activeTab===t.key?"#E5E7EB":"#F3F4F6",
                    color: activeTab===t.key?"#374151":"#9CA3AF",
                    padding:"1px 7px", borderRadius:100,
                    fontFamily:"'DM Mono',monospace" }}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── STATUS PILLS ── */}
          <div style={{ overflowX:"auto", paddingBottom:4,
            marginBottom:20, scrollbarWidth:"none" }}>
            <div style={{ display:"flex", gap:6, width:"max-content" }}>
              {ALL_ST.map(s => {
                const c   = STATUS_CFG[s];
                const cnt = s==="all"
                  ? orders.length
                  : orders.filter(o=>o.status===s).length;
                const on  = statusFilter === s;
                return (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    display:"flex", alignItems:"center", gap:5, padding:"7px 14px",
                    borderRadius:100, fontSize:12, fontWeight:700, cursor:"pointer",
                    whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif",
                    transition:"all .18s",
                    background: on
                      ? (s==="all" ? "#111827" : `rgba(${c?.rgb},0.10)`)
                      : "#FFFFFF",
                    border: `1px solid ${on
                      ? (s==="all" ? "#111827" : `rgba(${c?.rgb},0.3)`)
                      : "#E5E7EB"}`,
                    color: on
                      ? (s==="all" ? "#FFFFFF" : c?.color)
                      : "#374151",
                    boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
                  }}>
                    {c && <span>{c.emoji}</span>}
                    {s === "all" ? "All Status" : c.label}
                    <span style={{ fontSize:9.5, background: on?"rgba(0,0,0,0.1)":"#F3F4F6",
                      padding:"1px 6px", borderRadius:100,
                      fontFamily:"'DM Mono',monospace",
                      color: on && s!=="all" ? c?.color : "#6B7280" }}>{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RESULT COUNT ── */}
          {!loading && (
            <p style={{ fontSize:11.5, color:"#6B7280", marginBottom:16, fontWeight:600 }}>
              {filtered.length === 0
                ? "No orders match the selected filters"
                : filtered.length === orders.length
                  ? `Showing all ${orders.length} orders`
                  : `${filtered.length} of ${orders.length} orders`}
            </p>
          )}

          {/* ── LOADING ── */}
          {loading && (
            <div style={{ display:"grid",
             gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,310px),1fr))", gap:14 }}>
              {[...Array(6)].map((_,i) => <SkeletonCard key={i}/>)}
            </div>
          )}

          {/* ── EMPTY ── */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"72px 20px",
              background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:18,
              boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize:46, marginBottom:14 }}>🔍</p>
              <h3 style={{ fontSize:16, fontWeight:800, color:"#111827", marginBottom:8 }}>
                No orders found
              </h3>
              <p style={{ fontSize:13, color:"#6B7280", marginBottom:20 }}>
                {search ? `Nothing matched "${search}"` : "Try adjusting your filters"}
              </p>
              <button
                onClick={() => { setActiveTab("all"); setStatusFilter("all"); setSearch(""); }}
                style={{ padding:"9px 22px", background:"#F3F4F6",
                  border:"1px solid #E5E7EB", borderRadius:10,
                  color:"#374151", fontSize:13, fontWeight:600,
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* ── GRID ── */}
          {!loading && filtered.length > 0 && (
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,310px),1fr))", gap:14 }}>
              {filtered.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={setSelectedOrder}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        <Popup show={popup.show} type={popup.type} message={popup.message}
          onClose={() => setPopup(p => ({ ...p, show:false }))} />
      </PageWrapper>
    </>
  );
}

/* ─── GLOBAL CSS ────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap');
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(0.975)} to{opacity:1;transform:none} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  * { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar        { width:4px; height:4px; }
  ::-webkit-scrollbar-track  { background:transparent; }
  ::-webkit-scrollbar-thumb  { background:#D1D5DB; border-radius:4px; }
  input::placeholder         { color:#9CA3AF; }
  @media(max-width:480px) {
    div[style*="padding: 28px 18px"] { padding: 16px 12px 60px !important; }
  }
`;