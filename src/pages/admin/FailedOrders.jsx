import { useEffect, useState, useRef, useCallback } from "react";
import PageWrapper from "../../components/admin/PageWrapper";
import Popup from "../../components/common/Popup";
import {
  updateOrderStatus,
  getAllFailedOrders,
  updatePaymentStatus,
  cleanupPendingOrders,
} from "../../services/ordreService";
import { getErrorMessage } from "../../utils/getErrorMessage";

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

/* ─── CONFIG ────────────────────────────────────────────────────── */
const STATUS_CFG = {
  received:   { label:"Received",   emoji:"📦", color:"#FB923C", rgb:"251,146,60",  step:1 },
  confirmed:  { label:"Confirmed",  emoji:"✅", color:"#34D399", rgb:"52,211,153",  step:2 },
  ready:      { label:"Ready",      emoji:"🎯", color:"#F472B6", rgb:"244,114,182", step:3 },
  dispatched: { label:"Dispatched", emoji:"🚚", color:"#FDE047", rgb:"253,224,71",  step:4 },
  delivered:  { label:"Delivered",  emoji:"🏠", color:"#818CF8", rgb:"129,140,248", step:5 },
};
const PAYMENT_STATUS_CFG = {
  pending:  { label:"Pending",  emoji:"⏳", color:"#FB923C", rgb:"251,146,60"  },
  paid:     { label:"Paid",     emoji:"💰", color:"#34D399", rgb:"52,211,153"  },
  failed:   { label:"Failed",   emoji:"❌", color:"#FB7185", rgb:"251,113,133" },
  refunded: { label:"Refunded", emoji:"↩️", color:"#F472B6", rgb:"244,114,182" },
};
const SK     = Object.keys(STATUS_CFG);
const PSK    = Object.keys(PAYMENT_STATUS_CFG);
const ALL_ST = ["all", ...SK];

/* ─── THEME ─────────────────────────────────────────────────────── */
const T = {
  bg:       "#0D0D0D",
  surface:  "#141414",
  card:     "#181818",
  border:   "#242424",
  border2:  "#2E2E2E",
  text:     "#EDEDED",
  muted:    "#555555",
  muted2:   "#383838",
  accent:   "#FF6B35",
  accentRgb:"255,107,53",
};

/* ─── HELPERS ───────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return `${Math.floor(s)}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── CONFIRM MODAL ─────────────────────────────────────────────── */
function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1200,
      background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"20px", animation:"fadeIn .18s ease",
    }}>
      <div style={{
        background:T.surface,
        border:`1px solid ${danger ? "rgba(251,113,133,0.3)" : "rgba(255,107,53,0.3)"}`,
        borderRadius:22, width:"100%", maxWidth:420,
        boxShadow: danger
          ? "0 32px 80px rgba(251,113,133,0.15), 0 0 0 1px rgba(251,113,133,0.1)"
          : "0 32px 80px rgba(255,107,53,0.15), 0 0 0 1px rgba(255,107,53,0.1)",
        animation:"popIn .24s cubic-bezier(.34,1.45,.64,1)",
        overflow:"hidden",
      }}>
        <div style={{ height:2, background: danger
          ? "linear-gradient(90deg,#FB7185,#FB923C)"
          : `linear-gradient(90deg,${T.accent},#FBBF24)` }}/>
        <div style={{ padding:"30px 28px 26px" }}>
          <div style={{
            width:52, height:52, borderRadius:16,
            background: danger ? "rgba(251,113,133,0.1)" : `rgba(${T.accentRgb},0.1)`,
            border:`1px solid ${danger ? "rgba(251,113,133,0.2)" : `rgba(${T.accentRgb},0.2)`}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, marginBottom:20,
          }}>
            {danger ? "🗑️" : "⚡"}
          </div>
          <h3 style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:10,
            fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em" }}>{title}</h3>
          <p style={{ fontSize:13.5, color:T.muted, lineHeight:1.65 }}>{message}</p>
          <div style={{ display:"flex", gap:10, marginTop:26 }}>
            <button onClick={onCancel} style={{
              flex:1, padding:"12px 0", borderRadius:12, fontSize:13, fontWeight:700,
              background:T.card, border:`1px solid ${T.border2}`,
              color:"#888", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
              transition:"all .15s",
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background=T.border2; e.currentTarget.style.color=T.text; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=T.card; e.currentTarget.style.color="#888"; }}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{
              flex:1, padding:"12px 0", borderRadius:12, fontSize:13, fontWeight:700,
              background: danger
                ? "linear-gradient(135deg,#E11D48,#FB7185)"
                : `linear-gradient(135deg,${T.accent},#FBBF24)`,
              border:"none", color: danger ? "#fff" : "#0D0D0D",
              cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
              transition:"opacity .15s",
              boxShadow: danger
                ? "0 4px 20px rgba(225,29,72,0.35)"
                : `0 4px 20px rgba(${T.accentRgb},0.4)`,
            }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PROGRESS STRIP ────────────────────────────────────────────── */
function ProgressStrip({ status }) {
  const cur = STATUS_CFG[status]?.step ?? 0;
  return (
    <div style={{ display:"flex", gap:3, margin:"11px 0 13px" }}>
      {SK.map((k) => {
        const { color, step } = STATUS_CFG[k];
        const filled = step <= cur;
        const active = step === cur;
        return (
          <div key={k} style={{
            flex:1, height:3, borderRadius:4,
            background: filled ? color : T.border2,
            boxShadow: active ? `0 0 10px ${color}CC` : "none",
            transition:"background .35s, box-shadow .35s",
          }}/>
        );
      })}
    </div>
  );
}

/* ─── BADGES ────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const c = STATUS_CFG[status];
  if (!c) return (
    <span style={{ fontSize:10.5, color:T.muted, padding:"3px 9px", borderRadius:100,
      background:T.surface, border:`1px solid ${T.border}` }}>{status}</span>
  );
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:10.5, fontWeight:700, padding:"4px 10px", borderRadius:100,
      color:c.color, background:`rgba(${c.rgb},0.08)`,
      border:`1px solid rgba(${c.rgb},0.22)`, whiteSpace:"nowrap",
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.color,
        flexShrink:0, boxShadow:`0 0 6px ${c.color}` }}/>
      {c.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const c = PAYMENT_STATUS_CFG[status];
  if (!c) return (
    <span style={{ fontSize:10, color:T.muted, padding:"2px 8px", borderRadius:100,
      background:T.surface, border:`1px solid ${T.border}` }}>{status ?? "—"}</span>
  );
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:100,
      color:c.color, background:`rgba(${c.rgb},0.08)`,
      border:`1px solid rgba(${c.rgb},0.22)`, whiteSpace:"nowrap",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.color, flexShrink:0 }}/>
      {c.emoji} {c.label}
    </span>
  );
}

/* ─── STAT CARD ─────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, rgb }) {
  return (
    <div style={{
      position:"relative", background:T.surface,
      border:`1px solid ${T.border}`, borderRadius:16,
      padding:"20px 18px 18px", overflow:"hidden",
      transition:"border-color .2s",
    }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=`rgba(${rgb},0.35)`}
      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg, ${color}, transparent)` }}/>
      <div style={{ position:"absolute", top:-10, right:-10, width:80, height:80,
        background:`radial-gradient(circle, rgba(${rgb},0.1) 0%, transparent 70%)`,
        pointerEvents:"none" }}/>
      <div style={{ fontSize:22, marginBottom:14, lineHeight:1 }}>{icon}</div>
      <p style={{ fontSize:26, fontWeight:800, color:T.text, lineHeight:1,
        fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.03em",
        marginBottom:7 }}>{value}</p>
      <p style={{ fontSize:10, color:T.muted, textTransform:"uppercase",
        letterSpacing:"0.1em", fontWeight:700 }}>{label}</p>
    </div>
  );
}

/* ─── SELECT STYLE ──────────────────────────────────────────────── */
const SEL_BASE = {
  appearance:"none", WebkitAppearance:"none",
  background:T.card, border:`1px solid ${T.border2}`,
  color:"#AAAAAA", fontSize:11.5, fontFamily:"'Plus Jakarta Sans',sans-serif",
  padding:"5px 26px 5px 10px", borderRadius:9, outline:"none",
  cursor:"pointer", fontWeight:600, transition:"border .15s",
};

/* ─── ORDER CARD ────────────────────────────────────────────────── */
function OrderCard({ order, onSelect, onStatusChange, onPaymentStatusChange }) {
  const [saving, setSaving]       = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [hovered, setHovered]     = useState(false);
  const sc = STATUS_CFG[order.status];
  const isDelivery = order.deliveryType === "delivery";
  const shortId = safeStr(order.orderId || order._id).slice(-8);

  const handleStatusChange = async (e) => {
    e.stopPropagation(); setSaving(true);
    await onStatusChange(order._id, e.target.value); setSaving(false);
  };
  const handlePayChange = async (e) => {
    e.stopPropagation(); setSavingPay(true);
    await onPaymentStatusChange(order._id, e.target.value); setSavingPay(false);
  };

  return (
    <div
      onClick={() => onSelect(order)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:"relative", overflow:"hidden", cursor:"pointer",
        background: hovered ? "#1C1C1C" : T.card,
        border:`1px solid ${hovered ? T.border2 : T.border}`,
        borderRadius:16,
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
          : "0 2px 12px rgba(0,0,0,0.25)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition:"all .22s ease",
      }}
    >
      {/* top accent line */}
      <div style={{
        height:2,
        background: sc ? `linear-gradient(90deg,${sc.color},transparent)` : `linear-gradient(90deg,${T.accent},transparent)`,
        borderRadius:"16px 16px 0 0",
      }}/>

      <div style={{ padding:"15px 16px 16px" }}>
        {/* Header */}
        <div style={{ display:"flex", gap:11, alignItems:"flex-start" }}>
          <div style={{
            width:42, height:42, borderRadius:13, flexShrink:0,
            background: sc ? `rgba(${sc.rgb},0.1)` : `rgba(${T.accentRgb},0.1)`,
            border:`1px solid ${sc ? `rgba(${sc.rgb},0.18)` : `rgba(${T.accentRgb},0.18)`}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:800,
            color: sc?.color ?? T.accent,
            fontFamily:"'Plus Jakarta Sans',sans-serif",
          }}>
            {(order.user?.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:14, fontWeight:700, color:T.text,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              marginBottom:3, fontFamily:"'Plus Jakarta Sans',sans-serif",
              letterSpacing:"-0.01em" }}>
              {order.user?.name ?? "Customer"}
            </p>
            <p style={{ fontSize:10.5, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>
              #{shortId}
            </p>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <span style={{
              display:"inline-block", fontSize:10, fontWeight:700,
              padding:"3px 9px", borderRadius:8,
              ...(isDelivery
                ? { background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", color:"#34D399" }
                : { background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.2)", color:"#FB923C" }),
            }}>
              {isDelivery ? "🚚 Delivery" : "🏪 Pickup"}
            </span>
            {order.createdAt && (
              <p style={{ fontSize:9.5, color:T.muted, marginTop:5 }}>{timeAgo(order.createdAt)}</p>
            )}
          </div>
        </div>

        <ProgressStrip status={order.status} />

        {/* Amount + Order Status */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:8, flexWrap:"wrap", marginBottom:11 }}
          onClick={e => e.stopPropagation()}>
          <div>
            <p style={{ fontSize:9.5, color:T.muted, textTransform:"uppercase",
              letterSpacing:"0.1em", fontWeight:700, marginBottom:4 }}>Total</p>
            <p style={{ fontSize:19, fontWeight:800, color:T.text,
              fontFamily:"'JetBrains Mono',monospace", lineHeight:1,
              letterSpacing:"-0.02em" }}>
              ₹{(order.charges?.finalAmount ?? 0).toLocaleString()}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
            <StatusBadge status={order.status} />
            <div style={{ position:"relative" }}>
              <select value={order.status} onChange={handleStatusChange} disabled={saving}
                style={{ ...SEL_BASE, opacity:saving?0.4:1 }}>
                {SK.map(s => <option key={s} value={s}>{STATUS_CFG[s].emoji} {STATUS_CFG[s].label}</option>)}
              </select>
              <ChevronDown />
            </div>
          </div>
        </div>

        {/* Payment row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:8, flexWrap:"wrap", paddingTop:11, borderTop:`1px solid ${T.border}`,
          marginBottom:11 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:9.5, color:T.muted, textTransform:"uppercase",
              letterSpacing:"0.1em", fontWeight:700 }}>Payment</span>
            <PaymentBadge status={order.paymentStatus} />
          </div>
          <div style={{ position:"relative" }}>
            <select
              value={order.paymentStatus ?? "pending"}
              onChange={handlePayChange}
              disabled={savingPay}
              style={{
                ...SEL_BASE, opacity:savingPay?0.4:1,
                color: PAYMENT_STATUS_CFG[order.paymentStatus]?.color ?? "#AAAAAA",
                borderColor:`rgba(${PAYMENT_STATUS_CFG[order.paymentStatus]?.rgb??"100,100,100"},0.3)`,
              }}>
              {PSK.map(s => <option key={s} value={s}>{PAYMENT_STATUS_CFG[s].emoji} {PAYMENT_STATUS_CFG[s].label}</option>)}
            </select>
            <ChevronDown />
          </div>
        </div>

        {/* Thumbnails */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          paddingTop:11, borderTop:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center" }}>
            {(order.items ?? []).slice(0,4).map((item, i) => (
              <img key={i} src={item.image ?? "https://via.placeholder.com/28"} alt=""
                style={{ width:24, height:24, borderRadius:7,
                  border:`2px solid ${T.card}`, objectFit:"cover", marginLeft:i===0?0:-6 }}/>
            ))}
            {(order.items?.length ?? 0) > 4 && (
              <div style={{ width:24, height:24, borderRadius:7, border:`2px solid ${T.card}`,
                background:T.border2, display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:8, color:T.muted, fontWeight:700, marginLeft:-6 }}>
                +{order.items.length - 4}
              </div>
            )}
            <span style={{ marginLeft:9, fontSize:10.5, color:T.muted }}>
              {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSelect(order); }}
            style={{ background:"none", border:"none", cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, fontWeight:700,
              color:T.accent, padding:0, transition:"opacity .15s" }}
            onMouseEnter={e=>e.target.style.opacity="0.7"}
            onMouseLeave={e=>e.target.style.opacity="1"}>
            Details →
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
      pointerEvents:"none", width:9, color:T.muted }} fill="none" viewBox="0 0 10 6">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── SKELETON ──────────────────────────────────────────────────── */
const SK_L = {
  background:"linear-gradient(90deg,#1A1A1A 25%,#222222 50%,#1A1A1A 75%)",
  backgroundSize:"200% 100%", animation:"shimmer 1.6s infinite",
};
function SkeletonCard() {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:16, overflow:"hidden" }}>
      <div style={{ height:2, background:T.border2 }}/>
      <div style={{ padding:"15px 16px 16px" }}>
        <div style={{ display:"flex", gap:11, marginBottom:12 }}>
          <div style={{ width:42, height:42, borderRadius:13, ...SK_L }}/>
          <div style={{ flex:1 }}>
            <div style={{ height:13, borderRadius:6, width:"55%", marginBottom:8, ...SK_L }}/>
            <div style={{ height:10, borderRadius:6, width:"28%", ...SK_L }}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:3, margin:"11px 0 13px" }}>
          {[...Array(5)].map((_,i)=><div key={i} style={{ flex:1, height:3, borderRadius:4, ...SK_L }}/>)}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
          <div style={{ height:22, borderRadius:6, width:"25%", ...SK_L }}/>
          <div style={{ height:30, borderRadius:9, width:"46%", ...SK_L }}/>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL TIMELINE ────────────────────────────────────────────── */
function ModalTimeline({ status }) {
  const cur = STATUS_CFG[status]?.step ?? 0;
  return (
    <div style={{ display:"flex", overflowX:"auto", paddingBottom:4 }}>
      {SK.map((k, i) => {
        const c = STATUS_CFG[k];
        const done = c.step < cur, active = c.step === cur;
        return (
          <div key={k} style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", position:"relative", minWidth:54 }}>
            {i < SK.length - 1 && (
              <div style={{ position:"absolute", top:18, left:"50%", width:"100%", height:2, zIndex:0,
                background: done || active ? c.color : T.border2, transition:"background .4s" }}/>
            )}
            <div style={{
              position:"relative", zIndex:1, width:36, height:36, borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
              background: active ? `rgba(${c.rgb},0.12)` : done ? `rgba(${c.rgb},0.06)` : T.surface,
              border:`2px solid ${active ? c.color : done ? c.color+"88" : T.border2}`,
              boxShadow: active ? `0 0 0 4px rgba(${c.rgb},0.1), 0 0 20px rgba(${c.rgb},0.4)` : "none",
              transition:"all .3s",
            }}>
              {done ? <span style={{ color:c.color, fontSize:12, fontWeight:800 }}>✓</span> : c.emoji}
            </div>
            <p style={{ fontSize:9, marginTop:6, textAlign:"center", fontWeight:700,
              whiteSpace:"nowrap", color: active ? c.color : done ? "#777" : T.muted }}>
              {c.label}
            </p>
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
      background: accent ? `rgba(${T.accentRgb},0.06)` : T.surface,
      border:`1px solid ${accent ? `rgba(${T.accentRgb},0.2)` : T.border}`,
      borderRadius:10, padding:"10px 13px",
    }}>
      <p style={{ fontSize:9.5, color:T.muted, textTransform:"uppercase",
        letterSpacing:"0.1em", fontWeight:700, marginBottom:5 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:600, wordBreak:"break-word",
        color: accent ? T.accent : T.text,
        fontFamily: accent ? "'JetBrains Mono',monospace" : undefined }}>{value ?? "—"}</p>
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
  const pc       = PAYMENT_STATUS_CFG[order.paymentStatus];
  const fullId   = safeStr(order.orderId || order._id);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(0,0,0,0.88)", backdropFilter:"blur(14px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      animation:"fadeIn .2s ease",
    }}>
      <style>{`@media(min-width:640px){ .om-wrap{ align-items:center !important; padding:20px !important; } .om{ border-radius:22px !important; max-height:90vh !important; } }`}</style>
      <div className="om-wrap" style={{ display:"flex", alignItems:"flex-end",
        justifyContent:"center", width:"100%", height:"100%", padding:0 }}>
        <div ref={ref} className="om" style={{
          background:T.surface,
          border:`1px solid ${T.border2}`,
          borderRadius:"22px 22px 0 0", width:"100%", maxWidth:680,
          maxHeight:"94vh", display:"flex", flexDirection:"column",
          boxShadow:"0 -20px 80px rgba(0,0,0,0.7)",
          animation:"slideUp .3s cubic-bezier(.34,1.45,.64,1)",
        }}>
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
            <div style={{ width:36, height:4, borderRadius:4, background:T.border2 }}/>
          </div>
          {sc && <div style={{ height:2,
            background:`linear-gradient(90deg,${sc.color},transparent)`,
            margin:"10px 22px 0", borderRadius:4 }}/>}

          {/* Header */}
          <div style={{ padding:"16px 22px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:800, color:T.text, lineHeight:1,
                  fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em" }}>
                  Order Details
                </h2>
                <p style={{ fontSize:10.5, color:T.muted,
                  fontFamily:"'JetBrains Mono',monospace", marginTop:5 }}>#{fullId}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <StatusBadge status={order.status} />
                {pc && <PaymentBadge status={order.paymentStatus} />}
                <button onClick={onClose}
                  style={{ width:32, height:32, borderRadius:9, background:T.card,
                    border:`1px solid ${T.border2}`, color:"#666",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", flexShrink:0, transition:"all .15s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=T.border2; e.currentTarget.style.color=T.text; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=T.card; e.currentTarget.style.color="#666"; }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ overflowY:"auto", padding:"18px 22px", flex:1 }}>
            <div style={{ marginBottom:24 }}>
              <SectTitle>📍 Order Progress</SectTitle>
              <ModalTimeline status={order.status} />
            </div>
            <div style={{ marginBottom:20 }}>
              <SectTitle>👤 Customer</SectTitle>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                <InfoTile label="Name"    value={order.user?.name} />
                <InfoTile label="Phone"   value={order.user?.phone} />
                <InfoTile label="Address" value={order.user?.address} wide />
                <InfoTile label="City"    value={order.user?.city} />
                <InfoTile label="State"   value={order.user?.state} />
                <InfoTile label="Pincode" value={order.user?.pincode} />
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <SectTitle>🧾 Summary</SectTitle>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                <InfoTile label="Delivery Type"  value={order.deliveryType} />
                <InfoTile label="Total Amount"   value={`₹${(order.charges?.finalAmount??0).toLocaleString()}`} accent />
                <InfoTile label="Payment Status" value={pc ? `${pc.emoji} ${pc.label}` : order.paymentStatus ?? "—"} />
                <InfoTile label="Payment Method" value={order.paymentMethod ?? "—"} />
                <InfoTile label="Order ID"       value={`#${fullId}`} wide />
                <InfoTile label="Order Date"     value={order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})
                  : null} wide />
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <SectTitle>
                🛒 Items
                <span style={{ marginLeft:8, fontSize:9.5, background:T.card,
                  border:`1px solid ${T.border2}`, color:T.muted,
                  padding:"2px 7px", borderRadius:100 }}>{items.length}</span>
              </SectTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`,
                    borderRadius:12, padding:13 }}>
                    <div style={{ display:"flex", gap:12 }}>
                      <img src={item.image ?? "https://via.placeholder.com/64"} alt={item.name}
                        style={{ width:60, height:60, borderRadius:10, objectFit:"cover",
                          border:`1px solid ${T.border}`, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13.5, fontWeight:700, color:T.text,
                          marginBottom:7, overflow:"hidden", textOverflow:"ellipsis",
                          whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif",
                          letterSpacing:"-0.01em" }}>{item.name}</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:7 }}>
                          {item.size  && <span style={TAG}>{item.size}</span>}
                          {item.color && <span style={TAG}>{item.color}</span>}
                          <span style={TAG}>Qty: {item.quantity}</span>
                        </div>
                        <p style={{ fontSize:14, fontWeight:800, color:T.accent,
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          ₹{Number(item.price??0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {item.note && (
                      <div style={{ marginTop:9, display:"flex", gap:8,
                        background:"rgba(251,146,60,0.06)", border:"1px solid rgba(251,146,60,0.15)",
                        borderRadius:9, padding:"8px 11px" }}>
                        <span style={{ fontSize:12 }}>📝</span>
                        <p style={{ fontSize:12, color:"#FB923C", fontWeight:500 }}>{item.note}</p>
                      </div>
                    )}
                    {item.designImage?.length > 0 && (
                      <div style={{ marginTop:9 }}>
                        <p style={{ fontSize:9, color:T.muted, textTransform:"uppercase",
                          letterSpacing:"0.1em", fontWeight:700, marginBottom:7 }}>Design Images</p>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {item.designImage.map((src, j) => (
                            <a key={j} href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt="design"
                                style={{ width:46, height:46, borderRadius:8, objectFit:"cover",
                                  border:`1px solid ${T.border}`, transition:"transform .2s" }}
                                onMouseEnter={e=>e.target.style.transform="scale(1.1)"}
                                onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {uploaded.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <SectTitle>📎 Files</SectTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {uploaded.map((file, i) => {
                    const name  = file.split("/").pop().split("?")[0];
                    const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file);
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                        background:T.card, border:`1px solid ${T.border}`,
                        borderRadius:10, padding:"9px 12px" }}>
                        {isImg
                          ? <img src={file} alt="" style={{ width:32, height:32, borderRadius:7, objectFit:"cover", flexShrink:0 }}/>
                          : <div style={{ width:32, height:32, borderRadius:7, background:T.border,
                              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📄</div>
                        }
                        <p style={{ flex:1, fontSize:11, color:T.muted,
                          fontFamily:"'JetBrains Mono',monospace", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
                        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                          <a href={file} target="_blank" rel="noreferrer"
                            style={{ fontSize:10.5, fontWeight:700, color:"#FB923C",
                              background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.2)",
                              padding:"4px 10px", borderRadius:7, textDecoration:"none" }}>View</a>
                          <a href={file.replace("/upload/","/upload/fl_attachment/")} download
                            style={{ fontSize:10.5, fontWeight:700, color:"#34D399",
                              background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)",
                              padding:"4px 10px", borderRadius:7, textDecoration:"none" }}>Save</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:"13px 22px 22px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <button onClick={onClose}
              style={{ width:"100%", padding:"12px",
                background:T.card,
                border:`1px solid ${T.border2}`,
                color:"#888", fontSize:13, fontWeight:700,
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                borderRadius:12, cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=T.border2; e.currentTarget.style.color=T.text; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=T.card; e.currentTarget.style.color="#888"; }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectTitle({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:800, color:T.muted,
      textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12,
      display:"flex", alignItems:"center", gap:6,
      fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</p>
  );
}
const TAG = {
  fontSize:10.5, background:T.border, border:`1px solid ${T.border2}`,
  color:"#888", padding:"2px 8px", borderRadius:6, fontWeight:600,
};

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function FailedOrderList() {
  const [orders, setOrders]               = useState([]);
  const [activeTab, setActiveTab]         = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [cleaning, setCleaning]           = useState(false);
  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [popup, setPopup] = useState({ show:false, message:"", type:"success" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await getAllFailedOrders();
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setOrders(data);
      } catch (err) {
        console.error(err); setOrders([]);
      } finally { setLoading(false); }
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
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status:safe } : o));
      showPopup(`Order status → "${STATUS_CFG[safe]?.label ?? safe}"`, "success");
    } catch (err) { showPopup(getErrorMessage(err), "error"); }
  }, [showPopup]);

  const handlePaymentStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      const safe = newStatus.trim().toLowerCase();
      await updatePaymentStatus(orderId, safe);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus:safe } : o));
      showPopup(`Payment → "${PAYMENT_STATUS_CFG[safe]?.label ?? safe}"`, "success");
    } catch (err) { showPopup(getErrorMessage(err), "error"); }
  }, [showPopup]);

  const handleCleanupPending = useCallback(async () => {
    setCleaning(true);
    setConfirmOpen(false);
    try {
      const res   = await cleanupPendingOrders();
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? "?";
      showPopup(`Cleaned up ${count} pending order${count !== 1 ? "s" : ""}`, "success");
      const fresh = await getAllFailedOrders();
      const data  = Array.isArray(fresh?.data) ? fresh.data : Array.isArray(fresh) ? fresh : [];
      setOrders(data);
    } catch (err) { showPopup(getErrorMessage(err), "error"); }
    finally { setCleaning(false); }
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
  const pendingCt = orders.filter(o => ["received","confirmed","ready"].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === "delivered").length;
  const failedPay = orders.filter(o => o.paymentStatus === "failed").length;
  const tabCount  = (key) => key === "all" ? orders.length : orders.filter(o => o.deliveryType === key).length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <PageWrapper title="Failed Order List">
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"28px 18px 80px",
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          background:T.bg, minHeight:"100vh" }}>

          {/* ── HEADER ── */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
            gap:16, marginBottom:30, flexWrap:"wrap" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:7 }}>
                {/* flame icon */}
                <div style={{ width:38, height:38, borderRadius:11,
                  background:`rgba(${T.accentRgb},0.1)`,
                  border:`1px solid rgba(${T.accentRgb},0.2)`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                  🔥
                </div>
                <h1 style={{ fontSize:"clamp(20px,4vw,26px)", fontWeight:800, color:T.text,
                  lineHeight:1, margin:0, letterSpacing:"-0.03em" }}>
                  Failed Orders
                </h1>
                <span style={{ fontSize:11, fontWeight:700, background:T.surface,
                  border:`1px solid ${T.border}`, color:T.muted,
                  padding:"3px 11px", borderRadius:100,
                  fontFamily:"'JetBrains Mono',monospace" }}>{orders.length}</span>
              </div>
              <p style={{ fontSize:12.5, color:T.muted, margin:0 }}>
                Review and manage failed or pending payment orders
              </p>
            </div>

            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              {/* Clean Pending */}
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={cleaning}
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"9px 16px", borderRadius:11,
                  background: cleaning ? T.surface : "rgba(251,113,133,0.07)",
                  border:"1px solid rgba(251,113,133,0.22)",
                  color: cleaning ? T.muted : "#FB7185",
                  fontSize:12, fontWeight:700,
                  cursor: cleaning ? "wait" : "pointer",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  whiteSpace:"nowrap", transition:"all .18s",
                }}
                onMouseEnter={e => { if (!cleaning) e.currentTarget.style.background="rgba(251,113,133,0.14)"; }}
                onMouseLeave={e => { e.currentTarget.style.background= cleaning ? T.surface : "rgba(251,113,133,0.07)"; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                {cleaning ? "Cleaning…" : "Clean Pending"}
              </button>

              {/* Search */}
              <div style={{ position:"relative", width:"100%", maxWidth:290, minWidth:180 }}>
                <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)",
                  width:14, height:14, color:T.muted2, pointerEvents:"none" }}
                  fill="none" viewBox="0 0 20 20">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M15 15l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or order ID…"
                  style={{
                    width:"100%", padding:"9px 34px 9px 34px",
                    background:T.surface, border:`1px solid ${T.border}`,
                    borderRadius:11, color:T.text, fontSize:12.5,
                    fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none",
                    boxSizing:"border-box", transition:"border .18s",
                  }}
                  onFocus={e=>e.target.style.borderColor=T.accent}
                  onBlur={e=>e.target.style.borderColor=T.border}
                />
                {search && (
                  <button onClick={() => setSearch("")}
                    style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
                      background:T.border2, border:"none", color:T.muted,
                      width:18, height:18, borderRadius:5, fontSize:11,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",
            gap:10, marginBottom:24 }}>
            <StatCard icon="📋" label="Total Orders"    value={orders.length}                    color={T.accent}  rgb={T.accentRgb} />
            <StatCard icon="💰" label="Revenue"          value={`₹${revenue.toLocaleString()}`}  color="#34D399"   rgb="52,211,153"  />
            <StatCard icon="⏳" label="Pending"          value={pendingCt}                        color="#FBBF24"   rgb="251,191,36"  />
            <StatCard icon="✅" label="Delivered"        value={delivered}                        color="#818CF8"   rgb="129,140,248" />
            <StatCard icon="❌" label="Failed Payments"  value={failedPay}                        color="#FB7185"   rgb="251,113,133" />
          </div>

          {/* ── DELIVERY TABS ── */}
          <div style={{ marginBottom:15, overflowX:"auto", paddingBottom:2 }}>
            <div style={{ display:"flex", gap:2, background:T.surface,
              border:`1px solid ${T.border}`, borderRadius:13, padding:4, width:"fit-content" }}>
              {[
                { key:"all",      label:"All Orders" },
                { key:"pickup",   label:"🏪 Pickup" },
                { key:"delivery", label:"🚚 Delivery" },
              ].map(t => {
                const on = activeTab === t.key;
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                    display:"flex", alignItems:"center", gap:6, padding:"7px 15px",
                    borderRadius:10, fontSize:12, fontWeight:700, whiteSpace:"nowrap",
                    fontFamily:"'Plus Jakarta Sans',sans-serif", border:"none", cursor:"pointer",
                    transition:"all .18s",
                    color: on ? T.text : T.muted,
                    background: on ? T.card : "none",
                    boxShadow: on ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.3)` : "none",
                  }}>
                    {t.label}
                    <span style={{ fontSize:9.5,
                      background: on ? T.border2 : T.border,
                      color: on ? "#999" : T.muted,
                      padding:"1px 7px", borderRadius:100,
                      fontFamily:"'JetBrains Mono',monospace" }}>{tabCount(t.key)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── STATUS PILLS ── */}
          <div style={{ overflowX:"auto", paddingBottom:4, marginBottom:18, scrollbarWidth:"none" }}>
            <div style={{ display:"flex", gap:5, width:"max-content" }}>
              {ALL_ST.map(s => {
                const c   = STATUS_CFG[s];
                const cnt = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
                const on  = statusFilter === s;
                return (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    display:"flex", alignItems:"center", gap:5, padding:"6px 13px",
                    borderRadius:100, fontSize:11.5, fontWeight:700, cursor:"pointer",
                    whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    transition:"all .18s",
                    background: on
                      ? (s==="all" ? T.text : `rgba(${c?.rgb},0.1)`)
                      : T.surface,
                    border:`1px solid ${on
                      ? (s==="all" ? T.text : `rgba(${c?.rgb},0.28)`)
                      : T.border}`,
                    color: on ? (s==="all" ? T.bg : c?.color) : T.muted,
                  }}>
                    {c && <span>{c.emoji}</span>}
                    {s === "all" ? "All" : c.label}
                    <span style={{ fontSize:9, background:"rgba(0,0,0,0.3)", padding:"1px 6px",
                      borderRadius:100, fontFamily:"'JetBrains Mono',monospace",
                      color: on && s!=="all" ? c?.color : "#666" }}>{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result count */}
          {!loading && (
            <p style={{ fontSize:11, color:T.muted, marginBottom:14, fontWeight:600 }}>
              {filtered.length === 0
                ? "No orders match the selected filters"
                : filtered.length === orders.length
                  ? `Showing all ${orders.length} orders`
                  : `${filtered.length} of ${orders.length} orders`}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,305px),1fr))", gap:12 }}>
              {[...Array(6)].map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"72px 20px",
              background:T.surface, border:`1px solid ${T.border}`, borderRadius:18 }}>
              <p style={{ fontSize:44, marginBottom:12 }}>📭</p>
              <h3 style={{ fontSize:15, fontWeight:800, color:T.text, marginBottom:7,
                letterSpacing:"-0.02em" }}>No orders found</h3>
              <p style={{ fontSize:12.5, color:T.muted, marginBottom:18 }}>
                {search ? `Nothing matched "${search}"` : "Try adjusting your filters"}
              </p>
              <button onClick={() => { setActiveTab("all"); setStatusFilter("all"); setSearch(""); }}
                style={{ padding:"9px 22px", background:T.card,
                  border:`1px solid ${T.border2}`, borderRadius:11,
                  color:"#888", fontSize:12.5, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                  transition:"all .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=T.border2; e.currentTarget.style.color=T.text; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=T.card; e.currentTarget.style.color="#888"; }}>
                Reset Filters
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,305px),1fr))", gap:12 }}>
              {filtered.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={setSelectedOrder}
                  onStatusChange={handleStatusChange}
                  onPaymentStatusChange={handlePaymentStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          open={confirmOpen}
          title="Clean Pending Orders"
          message="This will permanently delete all stuck pending orders. This action cannot be undone."
          confirmLabel="Yes, Clean Up"
          danger
          onConfirm={handleCleanupPending}
          onCancel={() => setConfirmOpen(false)}
        />
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        <Popup show={popup.show} type={popup.type} message={popup.message}
          onClose={() => setPopup(p => ({ ...p, show:false }))} />
      </PageWrapper>
    </>
  );
}

/* ─── GLOBAL CSS ────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes popIn   { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  * { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar        { width:4px; height:4px; }
  ::-webkit-scrollbar-track  { background:transparent; }
  ::-webkit-scrollbar-thumb  { background:#2E2E2E; border-radius:4px; }
  input::placeholder         { color:#383838; }
  select option              { background:#141414; color:#EDEDED; }
  @media(max-width:480px){
    div[style*="padding: 28px 18px"]{ padding:14px 12px 64px !important; }
  }
`;