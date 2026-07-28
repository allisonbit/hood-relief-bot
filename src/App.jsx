import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import {
  Wallet, MapPin, Upload, Check, ShieldCheck, ArrowRight,
  HeartHandshake, Users, Vote, Landmark, Sparkles, AlertCircle,
  LogOut, Plus, TrendingUp, Menu, X, Edit3,
  Home, BookOpen, BarChart3, User,
  DollarSign, Eye, ThumbsUp, ThumbsDown, ShieldAlert,
} from "lucide-react";
import * as api from "./api";
import { setToken, getStoredToken } from "./api";

const C = {
  bg: "#F7F4E9", bgSoft: "#EFEAD6", card: "#FFFFFF",
  line: "rgba(28,28,20,0.12)", lineSoft: "rgba(28,28,20,0.07)",
  lemon: "#C4E538", lemonDeep: "#8FAE1F", lemonSoft: "rgba(196,229,56,0.22)",
  ink: "#1C1C14", inkSoft: "rgba(28,28,20,0.64)", inkDim: "rgba(28,28,20,0.38)",
  red: "#C2492F", redSoft: "rgba(194,73,47,0.1)",
  green: "#2D7A3A", greenSoft: "rgba(45,122,58,0.1)",
};
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { duration: 0.15 } };

// Category values match the API exactly; labels are for display.
const CATEGORIES = [
  { value: "Medical", label: "Medical" },
  { value: "CryptoLoss", label: "Crypto Loss" },
  { value: "Disaster", label: "Disaster" },
  { value: "JobLoss", label: "Job Loss" },
  { value: "Other", label: "Other" },
];
const CAT_ICON = { Medical: HeartHandshake, CryptoLoss: Landmark, Disaster: Sparkles, JobLoss: Users, Other: Vote };
const catLabel = v => CATEGORIES.find(c => c.value === v)?.label || v;

function getInitials(name) { return (name || "??").split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2); }
function shortAddr(a) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ""; }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtMoney(n) { return `$${Number(n || 0).toLocaleString()}`; }

// Normalize an API request (+ optional vote summary) into the shape the UI renders.
function normalizeRequest(r, summary, fallbackUser) {
  const owner = r.user || fallbackUser || {};
  const closes = r.votingClosesAt ? new Date(r.votingClosesAt) : null;
  const daysLeft = closes ? Math.max(0, Math.ceil((closes.getTime() - Date.now()) / 86400000)) : null;
  let evidenceUrls = [];
  try { evidenceUrls = JSON.parse(r.evidenceUrls || "[]"); } catch {}
  return {
    id: r.id,
    name: owner.name || shortAddr(owner.walletAddress) || "Anonymous",
    ownerWallet: (owner.walletAddress || "").toLowerCase(),
    wallet: shortAddr(r.walletAddress),
    location: owner.location || "—",
    category: r.category,
    title: r.title,
    status: r.status,
    daysLeft,
    story: r.story,
    amount: r.amountRequested,
    yesVotes: summary?.votesYes ?? 0,
    noVotes: summary?.votesNo ?? 0,
    votesCast: summary?.votesCast ?? 0,
    userHasVoted: summary?.userHasVoted ?? false,
    evidence: evidenceUrls.length ? `${evidenceUrls.length} file${evidenceUrls.length > 1 ? "s" : ""}` : "None",
    evidenceUrls,
    txHash: r.transactionHash,
  };
}

function normalizeLedger(e) {
  return { id: e.id, wallet: shortAddr(e.walletAddress), amount: e.amount, category: e.category, note: e.note, date: fmtDate(e.releasedAt), txHash: e.payoutTxHash };
}

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children, center }) {
  return (
    <div style={{ display: center ? "flex" : "inline-flex", justifyContent: center ? "center" : undefined, marginBottom: 14 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.lemonDeep, display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, background: C.lemonSoft, padding: "5px 12px 5px 9px", borderRadius: 100 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.lemonDeep }} />
        {children}
      </span>
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, style, full, type = "button", disabled, size = "md" }) {
  const pad = size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px";
  const fs = size === "sm" ? 12.5 : size === "lg" ? 14.5 : 13.5;
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: SANS, fontWeight: 700, fontSize: fs, padding: pad, borderRadius: 100, border: "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all .18s ease", letterSpacing: "-0.01em", width: full ? "100%" : undefined, opacity: disabled ? 0.45 : 1 };
  const variants = { primary: { background: C.ink, color: C.bg }, accent: { background: C.lemon, color: C.ink, boxShadow: `0 3px 0 ${C.lemonDeep}` }, ghost: { background: C.card, color: C.ink, border: `1.5px solid ${C.line}` }, danger: { background: C.redSoft, color: C.red, border: `1px solid rgba(194,73,47,0.2)` }, soft: { background: C.bgSoft, color: C.ink, border: "none" } };
  return <motion.button type={type} onClick={disabled ? undefined : onClick} whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }} style={{ ...base, ...variants[variant], ...style }}>{children}</motion.button>;
}

function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background: C.card, borderRadius: 22, boxShadow: "0 1px 10px rgba(28,28,20,0.05)", border: `1px solid ${C.lineSoft}`, ...style }}>{children}</div>;
}

function CatTag({ cat }) {
  const Icon = CAT_ICON[cat] || Vote;
  return <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: C.ink, display: "inline-flex", alignItems: "center", gap: 5, background: C.lemonSoft, padding: "4px 10px", borderRadius: 100 }}><Icon size={11} color={C.lemonDeep} />{catLabel(cat)}</span>;
}

function StatusPill({ status, daysLeft }) {
  const open = status === "Open";
  const good = status === "Passed" || status === "Released";
  const color = open ? C.lemonDeep : good ? C.green : status === "Rejected" ? C.red : C.inkSoft;
  const bg = open ? C.lemonSoft : good ? C.greenSoft : status === "Rejected" ? C.redSoft : C.bgSoft;
  return <span style={{ fontFamily: MONO, fontSize: 10.5, color, fontWeight: 700, background: bg, padding: "5px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>{open ? `Open · ${daysLeft}d left` : status}</span>;
}

function Pill({ children, active, onClick }) {
  return <button onClick={onClick} style={{ padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontFamily: SANS, fontSize: 12.5, fontWeight: 700, background: active ? C.ink : C.card, color: active ? C.bg : C.inkSoft, border: `1.5px solid ${active ? C.ink : C.line}`, transition: "all .15s" }}>{children}</button>;
}

function FieldLabel({ children, required }) {
  return <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.inkSoft, marginBottom: 8, marginTop: 20, fontFamily: MONO, letterSpacing: "0.05em", textTransform: "uppercase" }}>{children}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}</label>;
}

function TextInput({ placeholder, prefix, value, onChange, error }) {
  return (
    <div>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: C.inkDim, fontSize: 13, fontFamily: MONO }}>{prefix}</span>}
        <input placeholder={placeholder} value={value || ""} onChange={e => onChange && onChange(e.target.value)} style={{ width: "100%", border: `1.5px solid ${error ? C.red : C.line}`, borderRadius: 14, padding: prefix ? "13px 16px 13px 56px" : "13px 16px", fontFamily: MONO, fontSize: 14, color: C.ink, background: C.bgSoft, boxSizing: "border-box", outline: "none", transition: "border-color .15s" }} onFocus={e => { e.target.style.borderColor = error ? C.red : C.lemonDeep; }} onBlur={e => { e.target.style.borderColor = error ? C.red : C.line; }} />
      </div>
      {error && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, color: C.red, fontSize: 11.5, fontFamily: SANS }}><AlertCircle size={11} />{error}</div>}
    </div>
  );
}

function TextArea({ placeholder, rows = 4, value, onChange, error }) {
  return (
    <div>
      <textarea placeholder={placeholder} rows={rows} value={value || ""} onChange={e => onChange && onChange(e.target.value)} style={{ width: "100%", border: `1.5px solid ${error ? C.red : C.line}`, borderRadius: 14, padding: "14px 16px", fontFamily: SERIF, fontSize: 15, color: C.ink, background: C.bgSoft, boxSizing: "border-box", resize: "vertical", outline: "none", lineHeight: 1.5, transition: "border-color .15s" }} onFocus={e => { e.target.style.borderColor = error ? C.red : C.lemonDeep; }} onBlur={e => { e.target.style.borderColor = error ? C.red : C.line; }} />
      {error && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, color: C.red, fontSize: 11.5, fontFamily: SANS }}><AlertCircle size={11} />{error}</div>}
    </div>
  );
}

// Passes the real File object up so it can be uploaded to the API.
function Dropzone({ label, file, onFile }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: `2px dashed ${file ? C.lemonDeep : C.line}`, padding: "22px 16px", textAlign: "center", color: file ? C.lemonDeep : C.inkDim, fontSize: 12.5, cursor: "pointer", fontFamily: MONO, borderRadius: 16, background: file ? C.lemonSoft : C.bgSoft, transition: "all .2s" }}>
      <input type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f && onFile) onFile(f); }} />
      {file ? <><Check size={13} /> {file.name}</> : <><Upload size={13} /> {label}</>}
    </label>
  );
}

function VoteBar({ yes, no }) {
  const total = yes + no;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10.5, color: C.inkDim, marginBottom: 6 }}>
        <span style={{ color: C.green }}>YES {yesPct}%</span>
        <span style={{ color: C.red }}>NO {total > 0 ? 100 - yesPct : 0}%</span>
      </div>
      <div style={{ height: 6, background: C.bgSoft, borderRadius: 100, overflow: "hidden", display: "flex" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${yesPct}%` }} transition={{ duration: 0.6 }} style={{ background: C.lemon, borderRadius: "100px 0 0 100px" }} />
        <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? 100 - yesPct : 0}%` }} transition={{ duration: 0.6 }} style={{ background: C.red, borderRadius: "0 100px 100px 0" }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, marginTop: 5 }}>{total.toLocaleString()} votes</div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,28,20,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, boxShadow: "0 24px 80px rgba(28,28,20,0.2)", border: `1px solid ${C.lineSoft}`, width: "100%", maxWidth: width, maxHeight: "85vh", overflow: "auto", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.lineSoft}` }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: C.ink, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ background: C.bgSoft, border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.inkSoft }}><X size={16} /></button>
          </div>
          <div style={{ padding: 24 }}>{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, icon: Icon, accent }) {
  return (
    <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: accent ? C.lemonSoft : C.bgSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={accent ? C.lemonDeep : C.inkSoft} />
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim, marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: C.ink }}>{value}</div>
      </div>
    </Card>
  );
}

// ─── Landing (not logged in) ──────────────────────────────────────────────────
function LandingPage({ onGoLogin, stats }) {
  const w = useWidth();
  const mobile = w < 768;
  const poolPct = stats && stats.totalDonated > 0 ? Math.round((stats.poolBalance / stats.totalDonated) * 100) : 0;
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ padding: "16px 24px 0", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", background: C.card, borderRadius: 100, boxShadow: "0 4px 24px rgba(28,28,20,0.08)", border: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center" }}><HeartHandshake size={15} color={C.ink} /></div>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, color: C.ink }}>Hood Relief</span>
          </div>
          <Btn variant="accent" size="sm" onClick={onGoLogin}>Connect Wallet</Btn>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: mobile ? "56px 20px 40px" : "72px 32px 50px", textAlign: "center" }}>
        <Label center>Community-funded · Robinhood Chain</Label>
        <h1 style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink, margin: "10px 0 0", fontSize: mobile ? 38 : "clamp(40px,6vw,72px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>
          Whatever happened,<br /><span style={{ fontStyle: "italic", color: C.lemonDeep }}>the hood</span> shows up.
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.6, color: C.inkSoft, maxWidth: 520, margin: "24px auto 0" }}>
          A community relief pool for real people in real trouble — crypto losses, medical bills, disasters, job loss, anything at all.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="accent" onClick={onGoLogin} size="lg"><Wallet size={16} /> Connect & Join</Btn>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px 64px" : "0 32px 80px" }}>
        <Card style={{ padding: mobile ? 24 : 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 20, marginBottom: 24 }}>
            {[
              ["Pool balance", stats ? fmtMoney(stats.poolBalance) : "—"],
              ["Total released", stats ? fmtMoney(stats.totalReleased) : "—"],
              ["Open cases", stats ? String(stats.openCases) : "—"],
              ["Members", stats ? stats.members.toLocaleString() : "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim, marginBottom: 6 }}>{k}</div>
                <div style={{ fontFamily: SERIF, fontSize: mobile ? 20 : 26, color: C.ink, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 6, background: C.bgSoft, borderRadius: 100, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${poolPct}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: "100%", background: C.lemon, borderRadius: 100 }} />
          </div>
        </Card>
      </div>

      <div style={{ background: C.bgSoft, padding: mobile ? "56px 0" : "72px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px" : "0 32px" }}>
          <Label>How it works</Label>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 24 : 30, color: C.ink, margin: "12px 0 28px" }}>Five steps. The same, every time.</h2>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
            {[["01", "Connect wallet", "Sign in with MetaMask, WalletConnect, or Coinbase."], ["02", "Tell your story", "Choose a category and describe what happened."], ["03", "Attach evidence", "Upload documents, receipts, photos, or a tx hash."], ["04", "Community votes", "Every wallet gets one vote on every case."], ["05", "Manual release", "An admin confirms and sends funds by hand."]].map(([n, title, desc]) => (
              <Card key={n} style={{ padding: 22, minWidth: 200, flexShrink: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.lemonDeep, marginBottom: 12, fontWeight: 700 }}>{n}</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 16, color: C.ink, fontWeight: 500, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: 0 }}>{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "56px 20px" : "80px 32px" }}>
        <div style={{ background: C.ink, borderRadius: 28, padding: mobile ? "44px 24px" : "64px 44px", textAlign: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 26 : 32, color: C.bg, marginBottom: 20 }}>
            Something happened. <span style={{ fontStyle: "italic", color: C.lemon }}>Tell us.</span>
          </h2>
          <Btn variant="accent" size="lg" onClick={onGoLogin}><Wallet size={16} /> Connect & Join</Btn>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px 40px" }}>
        <p style={{ fontSize: 11, color: C.inkDim, lineHeight: 1.7, fontFamily: MONO, textAlign: "center" }}>
          Hood Relief Bot is a community mutual-aid pool, not a financial institution. Filing does not guarantee funding. All releases are decided by community vote and confirmed manually.
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard Sidebar ────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, user, onLogout, mobile, open, onClose }) {
  const navItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "votes", label: "Vote", icon: ThumbsUp },
    { id: "submit", label: "New Request", icon: Plus },
    { id: "ledger", label: "Ledger", icon: BookOpen },
    { id: "categories", label: "Categories", icon: BarChart3 },
    { id: "profile", label: "My Profile", icon: User },
    ...(user?.isAdmin ? [{ id: "admin", label: "Admin", icon: ShieldAlert }] : []),
  ];

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px", borderBottom: `1px solid ${C.lineSoft}`, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center" }}><HeartHandshake size={14} color={C.ink} /></div>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: C.ink }}>Hood Relief</span>
        {mobile && <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}><X size={18} /></button>}
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
        {navItems.map(n => {
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => { setTab(n.id); if (mobile) onClose(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? C.ink : C.inkSoft, background: active ? C.lemonSoft : "transparent", transition: "all .15s", textAlign: "left" }}>
              <n.icon size={17} color={active ? C.lemonDeep : C.inkDim} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 16, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 14, background: C.bgSoft, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: SANS, flexShrink: 0 }}>{getInitials(user?.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim }}>{shortAddr(user?.walletAddress)}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.red, background: "transparent", width: "100%" }}>
          <LogOut size={15} /> Disconnect
        </button>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,28,20,0.3)", zIndex: 50 }} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, background: C.card, zIndex: 51, boxShadow: "4px 0 24px rgba(28,28,20,0.1)", borderRight: `1px solid ${C.lineSoft}` }}>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div style={{ width: 240, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.lineSoft}`, position: "sticky", top: 0, height: "100vh", overflow: "auto" }}>
      {sidebarContent}
    </div>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────
function DashHeader({ title, subtitle, onMenuOpen, mobile, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mobile ? "16px 16px 12px" : "24px 28px 16px", borderBottom: `1px solid ${C.lineSoft}`, background: C.card, position: "sticky", top: 0, zIndex: 10, gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {mobile && <button onClick={onMenuOpen} style={{ background: C.bgSoft, border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.inkSoft, flexShrink: 0 }}><Menu size={18} /></button>}
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: mobile ? 20 : 24, fontWeight: 500, color: C.ink, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
          {subtitle && <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkSoft, margin: "2px 0 0" }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Feed Panel ───────────────────────────────────────────────────────────────
function FeedPanel({ requests, ledger, stats, setTab }) {
  const w = useWidth();
  const mobile = w < 768;
  const activeCount = requests.filter(r => r.status === "Open").length;

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 900 }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <StatTile label="Pool balance" value={stats ? fmtMoney(stats.poolBalance) : "—"} icon={DollarSign} accent />
        <StatTile label="Released" value={stats ? fmtMoney(stats.totalReleased) : "—"} icon={TrendingUp} />
        <StatTile label="Open cases" value={String(activeCount)} icon={Eye} />
        <StatTile label="Members" value={stats ? stats.members.toLocaleString() : "—"} icon={Users} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Label>Your quick actions</Label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
        <Card onClick={() => setTab("submit")} style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.lemonSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} color={C.lemonDeep} /></div>
          <div><div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink }}>New Request</div><div style={{ fontFamily: SANS, fontSize: 11.5, color: C.inkDim }}>File a relief case</div></div>
        </Card>
        <Card onClick={() => setTab("votes")} style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><ThumbsUp size={16} color={C.green} /></div>
          <div><div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink }}>Vote on Cases</div><div style={{ fontFamily: SANS, fontSize: 11.5, color: C.inkDim }}>{activeCount} open now</div></div>
        </Card>
        <Card onClick={() => setTab("ledger")} style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bgSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={16} color={C.inkSoft} /></div>
          <div><div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink }}>Public Ledger</div><div style={{ fontFamily: SANS, fontSize: 11.5, color: C.inkDim }}>{ledger.length} releases</div></div>
        </Card>
      </div>

      <Label>Recent cases</Label>
      <div style={{ marginTop: 12 }}>
        {requests.length === 0 && <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>No cases filed yet. Be the first to put one on the record.</p>}
        {requests.slice(0, 3).map(r => (
          <Card key={r.id} onClick={() => setTab("votes")} style={{ padding: "16px 20px", marginBottom: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <CatTag cat={r.category} />
                <span style={{ fontFamily: SERIF, fontSize: 14.5, fontWeight: 500, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title || r.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, color: C.ink }}>{fmtMoney(r.amount)}</span>
                <StatusPill status={r.status} daysLeft={r.daysLeft} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Votes Panel ──────────────────────────────────────────────────────────────
function VotesPanel({ requests, user, onVote }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? requests : requests.filter(c => c.category === filter);
  const w = useWidth();
  const mobile = w < 768;

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 800 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        <Pill active={filter === "All"} onClick={() => setFilter("All")}>All</Pill>
        {CATEGORIES.map(c => <Pill key={c.value} active={filter === c.value} onClick={() => setFilter(c.value)}>{c.label}</Pill>)}
      </div>
      {filtered.length === 0 && <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No cases in this category yet.</p>}
      {filtered.map(c => <VoteCardDash key={c.id} c={c} user={user} onVote={onVote} />)}
    </div>
  );
}

function VoteCardDash({ c, user, onVote }) {
  const [busy, setBusy] = useState(false);
  const open = c.status === "Open";
  const isMine = user && c.ownerWallet === (user.walletAddress || "").toLowerCase();
  const w = useWidth();
  const mobile = w < 768;

  async function vote(choice) {
    setBusy(true);
    try {
      await onVote(c.id, choice);
      toast.success(`Voted ${choice}`);
    } catch (e) {
      toast.error(e.message || "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ padding: mobile ? 18 : 24, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <CatTag cat={c.category} />
          <h3 style={{ fontFamily: SERIF, fontSize: mobile ? 17 : 19, color: C.ink, fontWeight: 500, marginTop: 8, marginBottom: 4 }}>{c.title || c.name}</h3>
          <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: C.inkDim, fontFamily: MONO, flexWrap: "wrap" }}>
            <span>{c.name}</span>
            <span>{c.wallet}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{c.location}</span>
          </div>
        </div>
        <StatusPill status={c.status} daysLeft={c.daysLeft} />
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55, fontStyle: "italic", margin: "0 0 16px" }}>"{c.story}"</p>
      <div style={{ display: "flex", gap: mobile ? 14 : 28, marginBottom: 16, flexWrap: "wrap", background: C.bgSoft, padding: 14, borderRadius: 14 }}>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Requested</div><div style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500 }}>{fmtMoney(c.amount)}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Votes</div><div style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500 }}>{c.votesCast}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Evidence</div><div style={{ fontFamily: SANS, fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{c.evidence}</div></div>
      </div>
      {open && (
        <>
          <VoteBar yes={c.yesVotes} no={c.noVotes} />
          <div style={{ marginTop: 12 }}>
            {isMine ? (
              <div style={{ fontSize: 12.5, color: C.inkDim, fontFamily: MONO }}>This is your request — you can't vote on it.</div>
            ) : c.userHasVoted ? (
              <div style={{ fontSize: 12.5, color: C.lemonDeep, fontFamily: MONO, fontWeight: 700 }}>Vote recorded</div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="accent" size="sm" disabled={busy} onClick={() => vote("Yes")}><ThumbsUp size={13} /> Yes</Btn>
                <Btn variant="ghost" size="sm" disabled={busy} onClick={() => vote("No")}><ThumbsDown size={13} /> No</Btn>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Submit Panel ─────────────────────────────────────────────────────────────
function SubmitPanel({ user, onSubmitted, setTab }) {
  const [cat, setCat] = useState("CryptoLoss");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [amount, setAmount] = useState("");
  const [walletAddr, setWalletAddr] = useState(user?.walletAddress || "");
  const [txHash, setTxHash] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const w = useWidth();
  const mobile = w < 768;

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Required";
    if (!story.trim()) e.story = "Tell us what happened";
    if (!amount || parseFloat(amount) <= 0) e.amount = "Enter a valid amount";
    if (!walletAddr.trim()) e.wallet = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) { toast.error("Fix the errors above"); return; }
    setSubmitting(true);
    try {
      const { request } = await api.createRequest({
        category: cat,
        title: title.trim(),
        story: story.trim(),
        amountRequested: parseFloat(amount),
        walletAddress: walletAddr.trim(),
        transactionHash: cat === "CryptoLoss" ? (txHash.trim() || null) : null,
      });
      if (evidenceFile) {
        try { await api.uploadEvidence(request.id, [evidenceFile]); }
        catch { toast.error("Request filed, but evidence upload failed"); }
      }
      await onSubmitted();
      setSubmitted(true);
      toast.success("Request filed");
    } catch (e) {
      toast.error(e.message || "Failed to file request");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: mobile ? 16 : 28, maxWidth: 500 }}>
        <Card style={{ padding: 36, textAlign: "center" }}>
          <Check size={24} color={C.lemonDeep} style={{ marginBottom: 14 }} />
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 24, color: C.ink, marginBottom: 8 }}>Filed.</h2>
          <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 13.5, marginBottom: 20 }}>Your request is open for community voting.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn variant="accent" size="sm" onClick={() => setTab("votes")}>View Cases</Btn>
            <Btn variant="ghost" size="sm" onClick={() => { setSubmitted(false); setTitle(""); setStory(""); setAmount(""); setTxHash(""); setEvidenceFile(null); }}>File Another</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 560 }}>
      <Card style={{ padding: mobile ? 20 : 28 }}>
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.inkSoft, lineHeight: 1.5, marginBottom: 22, background: C.bgSoft, padding: 14, borderRadius: 14, fontFamily: SANS }}>
          <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1, color: C.lemonDeep }} />
          Filing does not guarantee funding. Every case is decided by community vote.
        </div>
        <FieldLabel required>Category</FieldLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {CATEGORIES.map(c => <Pill key={c.value} active={cat === c.value} onClick={() => setCat(c.value)}>{c.label}</Pill>)}
        </div>
        <FieldLabel required>Title</FieldLabel>
        <TextInput placeholder="Short summary of your case" value={title} onChange={setTitle} error={errors.title} />
        <FieldLabel required>Payout wallet</FieldLabel>
        <TextInput placeholder="0x..." value={walletAddr} onChange={setWalletAddr} error={errors.wallet} />
        <FieldLabel required>Amount</FieldLabel>
        <TextInput placeholder="2,500" prefix="$" value={amount} onChange={setAmount} error={errors.amount} />
        <FieldLabel required>What happened</FieldLabel>
        <TextArea placeholder="Describe your situation..." value={story} onChange={setStory} error={errors.story} />
        {cat === "CryptoLoss" && (<><FieldLabel>Transaction hash</FieldLabel><TextInput placeholder="0x..." value={txHash} onChange={setTxHash} /></>)}
        <FieldLabel>Evidence</FieldLabel>
        <div style={{ marginTop: 4 }}><Dropzone label="Upload photos, docs, receipts" file={evidenceFile} onFile={setEvidenceFile} /></div>
        <Btn full variant="accent" onClick={handleSubmit} disabled={submitting} style={{ marginTop: 24 }}>{submitting ? "Filing..." : <>Submit for Vote <ArrowRight size={13} /></>}</Btn>
      </Card>
    </div>
  );
}

// ─── Ledger Panel ─────────────────────────────────────────────────────────────
function LedgerPanel({ ledger }) {
  const w = useWidth();
  const mobile = w < 768;
  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 800 }}>
      {ledger.length === 0 && <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No releases yet. The ledger fills up as the community approves cases.</p>}
      {ledger.map(r => (
        <Card key={r.id} style={{ padding: "16px 20px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkSoft, marginBottom: 6 }}>{r.wallet}</div>
              <CatTag cat={r.category} />
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C.ink, fontWeight: 500 }}>{fmtMoney(r.amount)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, maxWidth: 420 }}>{r.note}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, whiteSpace: "nowrap" }}>{r.date}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Categories Panel ─────────────────────────────────────────────────────────
function CategoriesPanel({ setTab }) {
  const w = useWidth();
  const mobile = w < 768;
  const descriptions = { Medical: "Bills, treatment, and care costs.", CryptoLoss: "Rug pulls, exploits, phishing, wallet drains.", Disaster: "Fire, flood, storm, displacement.", JobLoss: "Bridging support after redundancy.", Other: "Anything that doesn't fit neatly." };
  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 700 }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {CATEGORIES.map(c => {
          const Icon = CAT_ICON[c.value];
          return (
            <Card key={c.value} onClick={() => setTab("submit")} style={{ padding: 20, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.lemonSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={18} color={C.lemonDeep} /></div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: SERIF, fontSize: 16, color: C.ink, fontWeight: 500, marginBottom: 3 }}>{c.label}</h3>
                  <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkSoft, margin: 0 }}>{descriptions[c.value]}</p>
                </div>
                <ArrowRight size={14} color={C.inkDim} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Profile Panel ────────────────────────────────────────────────────────────
function ProfilePanel({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [location, setLocation] = useState(user.location || "");
  const [bio, setBio] = useState(user.bio || "");
  const [saving, setSaving] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const w = useWidth();
  const mobile = w < 768;

  useEffect(() => {
    api.getMyRequests()
      .then(({ requests }) => setMyRequests(requests.map(r => normalizeRequest(r, null, user))))
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { user: updated } = await api.updateMe({ name: name.trim(), location: location.trim(), bio: bio.trim() });
      setUser(updated);
      setEditing(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 700 }}>
      <Card style={{ padding: mobile ? 20 : 28, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          {user.photoUrl
            ? <img src={user.photoUrl} alt={user.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.ink, flexShrink: 0 }}>{getInitials(user.name)}</div>}
          <div style={{ flex: 1, minWidth: 180 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 20 : 24, color: C.ink, margin: 0 }}>{user.name}</h2>
            <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12.5, color: C.inkSoft, fontFamily: SANS }}>
              {user.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{user.location}</span>}
              <span style={{ fontFamily: MONO, display: "flex", alignItems: "center", gap: 4 }}><Wallet size={12} />{shortAddr(user.walletAddress)}</span>
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit3 size={13} /> Edit</Btn>
        </div>
        {user.bio && <p style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.55, marginTop: 16, fontFamily: SANS }}>{user.bio}</p>}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatTile label="Total received" value={fmtMoney(user.totalReceived)} icon={TrendingUp} accent />
        <StatTile label="Total donated" value={fmtMoney(user.totalDonated)} icon={DollarSign} />
      </div>

      {myRequests.length > 0 && (
        <>
          <Label>My requests</Label>
          <div style={{ marginTop: 10 }}>
            {myRequests.map(r => (
              <Card key={r.id} style={{ padding: "14px 18px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <CatTag cat={r.category} />
                    <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 500, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
                  </div>
                  <StatusPill status={r.status} daysLeft={r.daysLeft} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Profile">
        <FieldLabel required>Name</FieldLabel>
        <TextInput value={name} onChange={setName} placeholder="Your name" />
        <FieldLabel>Location</FieldLabel>
        <TextInput value={location} onChange={setLocation} placeholder="City, Country" />
        <FieldLabel>Bio</FieldLabel>
        <TextArea value={bio} onChange={setBio} placeholder="A line or two about you..." rows={3} />
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Btn variant="accent" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Btn>
          <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [txInputs, setTxInputs] = useState({});
  const w = useWidth();
  const mobile = w < 768;

  async function load() {
    setLoading(true);
    try {
      const { requests } = await api.getAdminRequests("Passed");
      setRows(requests);
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function release(id) {
    setBusyId(id);
    try {
      await api.releaseRequest(id, (txInputs[id] || "").trim() || null);
      toast.success("Released and added to the public ledger");
      await load();
      onChanged();
    } catch (e) {
      toast.error(e.message || "Release failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    const reason = window.prompt("Reason for rejection:");
    if (!reason || !reason.trim()) return;
    setBusyId(id);
    try {
      await api.rejectRequest(id, reason.trim());
      toast.success("Request rejected");
      await load();
      onChanged();
    } catch (e) {
      toast.error(e.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 800 }}>
      <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.inkSoft, lineHeight: 1.5, marginBottom: 20, background: C.bgSoft, padding: 14, borderRadius: 14, fontFamily: SANS }}>
        <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1, color: C.lemonDeep }} />
        Cases that passed the community vote and await a manual payout. Releasing creates a public ledger entry.
      </div>
      {loading && <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>Loading...</p>}
      {!loading && rows.length === 0 && <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>Nothing awaiting release.</p>}
      {rows.map(r => (
        <Card key={r.id} style={{ padding: mobile ? 18 : 24, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div>
              <CatTag cat={r.category} />
              <h3 style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500, marginTop: 8, marginBottom: 4 }}>{r.title}</h3>
              <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: C.inkDim, fontFamily: MONO, flexWrap: "wrap" }}>
                <span>{r.user?.name || shortAddr(r.user?.walletAddress)}</span>
                <span>payout → {shortAddr(r.walletAddress)}</span>
              </div>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C.ink, fontWeight: 500 }}>{fmtMoney(r.amountRequested)}</div>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5, fontStyle: "italic", margin: "0 0 14px" }}>"{r.story}"</p>
          <TextInput placeholder="Payout tx hash (optional)" value={txInputs[r.id] || ""} onChange={v => setTxInputs(prev => ({ ...prev, [r.id]: v }))} />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Btn variant="accent" size="sm" disabled={busyId === r.id} onClick={() => release(r.id)}><Check size={13} /> Release Funds</Btn>
            <Btn variant="danger" size="sm" disabled={busyId === r.id} onClick={() => reject(r.id)}><X size={13} /> Reject</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
function Dashboard({ user, setUser, onLogout, requests, ledger, stats, onSubmitted, onVote, onDataChanged }) {
  const [tab, setTab] = useState("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const w = useWidth();
  const mobile = w < 900;

  const titles = { feed: "Dashboard", votes: "Vote on Cases", submit: "New Request", ledger: "Public Ledger", categories: "Categories", profile: "My Profile", admin: "Admin — Releases" };
  const subtitles = { feed: `Welcome back, ${user?.name?.split(" ")[0]}`, votes: "One wallet, one vote — always", submit: "Put your case on the record", ledger: "Every payout confirmed by hand", categories: "Whatever kind of trouble it is", profile: "Manage your account", admin: "Confirm and release passed cases" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={onLogout} mobile={mobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DashHeader title={titles[tab]} subtitle={subtitles[tab]} mobile={mobile} onMenuOpen={() => setSidebarOpen(true)}>
          {tab === "feed" && <Btn variant="accent" size="sm" onClick={() => setTab("submit")}><Plus size={13} /> New Request</Btn>}
        </DashHeader>
        <div style={{ flex: 1, overflow: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} {...fade}>
              {tab === "feed" && <FeedPanel requests={requests} ledger={ledger} stats={stats} setTab={setTab} />}
              {tab === "votes" && <VotesPanel requests={requests} user={user} onVote={onVote} />}
              {tab === "submit" && <SubmitPanel user={user} onSubmitted={onSubmitted} setTab={setTab} />}
              {tab === "ledger" && <LedgerPanel ledger={ledger} />}
              {tab === "categories" && <CategoriesPanel setTab={setTab} />}
              {tab === "profile" && <ProfilePanel user={user} setUser={setUser} />}
              {tab === "admin" && user?.isAdmin && <AdminPanel onChanged={onDataChanged} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [authedUser, setAuthedUser] = useState(null);
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const w = useWidth();
  const mobile = w < 768;

  const needsProfile = authedUser && !authedUser.profileComplete;

  // Real sign-in: nonce → wallet signature → JWT from the API.
  async function handleSignIn() {
    setSigning(true);
    try {
      const { message } = await api.authNonce(address);
      const signature = await signMessageAsync({ message });
      const { token, user } = await api.authVerify(address, signature);
      setToken(token);
      setAuthedUser(user);
      if (user.profileComplete) {
        toast.success("Welcome back");
        onLogin(user);
      }
    } catch (e) {
      toast.error(e.message || "Sign-in failed");
    } finally {
      setSigning(false);
    }
  }

  async function handleProfile() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      let { user } = await api.completeProfile(name.trim(), location.trim(), bio.trim());
      if (photoFile) {
        try { const r = await api.uploadPhoto(photoFile); user = r.user; }
        catch { toast.error("Profile saved, but photo upload failed"); }
      }
      toast.success("Welcome to Hood Relief");
      onLogin(user);
    } catch (e) {
      toast.error(e.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div {...fade} style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.lemon, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><HeartHandshake size={24} color={C.ink} /></div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 34, color: C.ink, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {needsProfile ? "Complete your profile" : isConnected ? "Verify your wallet" : "Join Hood Relief"}
          </h1>
          <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 14.5, lineHeight: 1.5 }}>
            {needsProfile ? "Fill in your details to get started." : isConnected ? "Sign a message to prove you own this wallet." : "Connect your wallet to sign in."}
          </p>
        </div>

        <Card style={{ padding: mobile ? 24 : 32 }}>
          {!isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Btn variant="accent" full onClick={openConnectModal} size="lg"><Wallet size={16} /> Connect Wallet</Btn>
                )}
              </ConnectButton.Custom>
              <p style={{ fontSize: 11.5, color: C.inkDim, fontFamily: MONO, textAlign: "center" }}>One wallet = one identity. No passwords.</p>
            </div>
          ) : !authedUser ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${C.lemonDeep}`, background: C.lemonSoft, width: "100%", boxSizing: "border-box" }}>
                <Check size={14} color={C.lemonDeep} />
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.lemonDeep, fontWeight: 700 }}>{shortAddr(address)}</span>
                <button onClick={() => disconnect()} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkDim, fontSize: 11, fontFamily: MONO, marginLeft: 6 }}>disconnect</button>
              </div>
              <Btn variant="accent" full size="lg" onClick={handleSignIn} disabled={signing}><ShieldCheck size={16} /> {signing ? "Waiting for signature..." : "Sign In"}</Btn>
              <p style={{ fontSize: 11.5, color: C.inkDim, fontFamily: MONO, textAlign: "center" }}>Signing is free — no gas, no transaction.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${C.lemonDeep}`, background: C.lemonSoft, marginBottom: 20 }}>
                <Check size={14} color={C.lemonDeep} />
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.lemonDeep, fontWeight: 700 }}>{shortAddr(address)} verified</span>
              </div>
              <FieldLabel required>Full name</FieldLabel>
              <TextInput placeholder="Your full name" value={name} onChange={setName} />
              <FieldLabel>Location</FieldLabel>
              <TextInput placeholder="City, Country" value={location} onChange={setLocation} />
              <FieldLabel>Profile photo</FieldLabel>
              <div style={{ marginTop: 4 }}><Dropzone label="Upload a photo" file={photoFile} onFile={setPhotoFile} /></div>
              <FieldLabel>Short bio</FieldLabel>
              <TextArea placeholder="A line or two about you..." rows={2} value={bio} onChange={setBio} />
              <Btn full variant="accent" onClick={handleProfile} disabled={saving} style={{ marginTop: 24 }}>{saving ? "Saving..." : <>Enter Dashboard <ArrowRight size={14} /></>}</Btn>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [stats, setStats] = useState(null);
  const wasConnected = useRef(false);

  async function refreshRequests() {
    try {
      const { requests: raw } = await api.getRequests({ limit: 50 });
      const summaries = await Promise.all(raw.map(r => api.getVoteSummary(r.id).catch(() => null)));
      setRequests(raw.map((r, i) => normalizeRequest(r, summaries[i])));
    } catch (e) {
      console.error("Failed to load requests:", e);
    }
  }

  async function refreshLedger() {
    try {
      const { entries } = await api.getLedger();
      setLedger(entries.map(normalizeLedger));
    } catch (e) {
      console.error("Failed to load ledger:", e);
    }
  }

  async function refreshStats() {
    try {
      setStats(await api.getPoolStats());
    } catch (e) {
      console.error("Failed to load pool stats:", e);
    }
  }

  function refreshAll() {
    return Promise.all([refreshRequests(), refreshLedger(), refreshStats()]);
  }

  // Boot: load public data, then restore session from a stored JWT.
  useEffect(() => {
    refreshAll();
    const token = getStoredToken();
    if (token) {
      api.getMe()
        .then(({ user: me }) => {
          setUser(me);
          setView(me.profileComplete ? "dashboard" : "login");
        })
        .catch(() => setToken(null));
    }
  }, []);

  // Only log out on a real connected → disconnected transition,
  // not while wagmi is still reconnecting on page load.
  useEffect(() => {
    if (isConnected) {
      wasConnected.current = true;
    } else if (wasConnected.current && user) {
      setToken(null);
      setUser(null);
      setView("landing");
      toast("Wallet disconnected");
    }
  }, [isConnected]);

  function handleLogin(userData) {
    setUser(userData);
    setView("dashboard");
    refreshAll();
  }

  function handleLogout() {
    disconnect();
    setToken(null);
    setUser(null);
    setView("landing");
  }

  async function handleSubmitted() {
    await Promise.all([refreshRequests(), refreshStats()]);
  }

  async function handleVote(requestId, choice) {
    await api.castVote(requestId, choice);
    const summary = await api.getVoteSummary(requestId).catch(() => null);
    setRequests(prev => prev.map(r => r.id === requestId
      ? { ...r, yesVotes: summary?.votesYes ?? r.yesVotes + (choice === "Yes" ? 1 : 0), noVotes: summary?.votesNo ?? r.noVotes + (choice === "No" ? 1 : 0), votesCast: summary?.votesCast ?? r.votesCast + 1, userHasVoted: true }
      : r));
  }

  return (
    <div style={{ fontFamily: SANS }}>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: SANS, fontSize: 13, borderRadius: 14 } }} />
      {view === "landing" && <LandingPage onGoLogin={() => setView("login")} stats={stats} />}
      {view === "login" && <LoginScreen onLogin={handleLogin} />}
      {view === "dashboard" && user && <Dashboard user={user} setUser={setUser} onLogout={handleLogout} requests={requests} ledger={ledger} stats={stats} onSubmitted={handleSubmitted} onVote={handleVote} onDataChanged={refreshAll} />}
    </div>
  );
}
