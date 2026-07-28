import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useSignMessage, useSendTransaction } from "wagmi";
import { parseEther, isAddress } from "viem";
import {
  Wallet, MapPin, Upload, Check, ShieldCheck, ArrowRight,
  HeartHandshake, Users, Vote, Landmark, Sparkles, AlertCircle,
  LogOut, Plus, TrendingUp, Menu, X, Edit3,
  Home, BookOpen, BarChart3, User,
  DollarSign, Eye, ThumbsUp, ThumbsDown, ShieldAlert,
  Gift, MessageCircle, Copy, ExternalLink, Search, Send,
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

// Shareable deep link for a case — opens the detail view for anyone.
function caseUrl(c) { return `${window.location.origin}/?case=${c.id}`; }
function shareCase(c) {
  const url = caseUrl(c);
  const text = `Help decide: "${c.title}" — a ${fmtMoney(c.amount)} relief case on Hood Relief. One wallet, one vote.`;
  if (navigator.share) {
    navigator.share({ title: "Hood Relief", text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    toast.success("Case link copied — share it anywhere");
  }
}
function xShareUrl(c) {
  const text = `Help decide: "${c.title}" — a ${fmtMoney(c.amount)} relief case on Hood Relief.`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(caseUrl(c))}`;
}

// Normalize an API request (+ optional vote summary) into the shape the UI renders.
function normalizeRequest(r, summary, fallbackUser) {
  const owner = r.user || fallbackUser || {};
  const closes = r.votingClosesAt ? new Date(r.votingClosesAt) : null;
  const daysLeft = closes ? Math.max(0, Math.ceil((closes.getTime() - Date.now()) / 86400000)) : null;
  // Human countdown: hours when under a day, days otherwise.
  let timeLeft = null;
  if (closes) {
    const ms = closes.getTime() - Date.now();
    if (ms <= 0) timeLeft = "closing";
    else if (ms < 86400000) timeLeft = `${Math.max(1, Math.ceil(ms / 3600000))}h`;
    else timeLeft = `${Math.ceil(ms / 86400000)}d`;
  }
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
    timeLeft,
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

function StatusPill({ status, timeLeft }) {
  const open = status === "Open";
  const good = status === "Passed" || status === "Released";
  const color = open ? C.lemonDeep : good ? C.green : status === "Rejected" ? C.red : C.inkSoft;
  const bg = open ? C.lemonSoft : good ? C.greenSoft : status === "Rejected" ? C.redSoft : C.bgSoft;
  return <span style={{ fontFamily: MONO, fontSize: 10.5, color, fontWeight: 700, background: bg, padding: "5px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>{open ? `Open · ${timeLeft || "—"} left` : status}</span>;
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
function LandingPage({ onGoLogin, stats, requests, ledger, sharedCaseId, onClearShared }) {
  const w = useWidth();
  const mobile = w < 768;
  const poolPct = stats && stats.totalDonated > 0 ? Math.round((stats.poolBalance / stats.totalDonated) * 100) : 0;
  const openCases = (requests || []).filter(r => r.status === "Open");
  const sharedCase = sharedCaseId ? (requests || []).find(r => r.id === sharedCaseId) : null;
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

      {openCases.length > 0 && (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px 64px" : "0 32px 80px" }}>
          <Label>Live right now</Label>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 24 : 30, color: C.ink, margin: "12px 0 24px", letterSpacing: "-0.02em" }}>Open cases the community is deciding.</h2>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {openCases.slice(0, 3).map(c => (
              <Card key={c.id} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <CatTag cat={c.category} />
                  <StatusPill status={c.status} timeLeft={c.timeLeft} />
                </div>
                <h3 style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500, margin: 0 }}>{c.title}</h3>
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: 0, flex: 1 }}>{c.story.length > 110 ? `${c.story.slice(0, 110)}…` : c.story}</p>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: C.ink, fontWeight: 500 }}>{fmtMoney(c.amount)}</div>
                <VoteBar yes={c.yesVotes} no={c.noVotes} />
                <Btn variant="accent" size="sm" full onClick={onGoLogin}><ThumbsUp size={13} /> Connect to vote</Btn>
              </Card>
            ))}
          </div>
        </div>
      )}

      {ledger.length > 0 && (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px 64px" : "0 32px 80px" }}>
          <Label>Proof it works</Label>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 24 : 30, color: C.ink, margin: "12px 0 24px", letterSpacing: "-0.02em" }}>Latest releases from the pool.</h2>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {ledger.slice(0, 3).map(r => (
              <Card key={r.id} style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: MONO, fontSize: 11, color: C.inkDim, marginBottom: 10 }}>
                  <span>{r.wallet}</span>
                  <span>{r.date}</span>
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{fmtMoney(r.amount)}</div>
                <CatTag cat={r.category} />
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: "10px 0 0" }}>{r.note}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

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

      {sharedCase && (
        <RequestDetailModal
          c={sharedCase}
          user={null}
          onVote={async () => { onGoLogin(); throw new Error("Connect your wallet to vote"); }}
          onClose={onClearShared}
        />
      )}
    </div>
  );
}

// ─── Dashboard Sidebar ────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, user, onLogout, mobile, open, onClose }) {
  const navItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "votes", label: "Vote", icon: ThumbsUp },
    { id: "submit", label: "New Request", icon: Plus },
    { id: "donate", label: "Donate", icon: Gift },
    { id: "community", label: "Community", icon: Users },
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
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    api.getRecentDonations().then(({ donations: d }) => setDonations(d)).catch(() => {});
  }, []);

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

      {donations.length > 0 && (
        <>
          <Label>Recent supporters</Label>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "12px 0 28px", paddingBottom: 4 }}>
            {donations.map(d => (
              <Card key={d.id} style={{ padding: "12px 16px", minWidth: 170, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.lemonSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Gift size={13} color={C.lemonDeep} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.donor?.name || shortAddr(d.donorWalletAddress)}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim }}>{fmtDate(d.createdAt)}</div>
                  </div>
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, color: C.lemonDeep, marginTop: 8 }}>+{fmtMoney(d.amount)}</div>
              </Card>
            ))}
          </div>
        </>
      )}

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
                <StatusPill status={r.status} timeLeft={r.timeLeft} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Votes Panel ──────────────────────────────────────────────────────────────
function VotesPanel({ requests, user, onVote, initialDetailId }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState(initialDetailId || null);
  const q = query.trim().toLowerCase();
  const filtered = requests
    .filter(c => filter === "All" || c.category === filter)
    .filter(c => !q || `${c.title} ${c.story} ${c.name}`.toLowerCase().includes(q));
  const detail = requests.find(r => r.id === detailId) || null;
  const w = useWidth();
  const mobile = w < 768;

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 800 }}>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={14} color={C.inkDim} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
        <input placeholder="Search cases by title, story, or name..." value={query} onChange={e => setQuery(e.target.value)} style={{ width: "100%", border: `1.5px solid ${C.line}`, borderRadius: 100, padding: "12px 18px 12px 42px", fontFamily: SANS, fontSize: 13.5, color: C.ink, background: C.card, boxSizing: "border-box", outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        <Pill active={filter === "All"} onClick={() => setFilter("All")}>All</Pill>
        {CATEGORIES.map(c => <Pill key={c.value} active={filter === c.value} onClick={() => setFilter(c.value)}>{c.label}</Pill>)}
      </div>
      {filtered.length === 0 && <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No matching cases.</p>}
      {filtered.map(c => <VoteCardDash key={c.id} c={c} user={user} onVote={onVote} onOpen={() => setDetailId(c.id)} />)}
      <RequestDetailModal c={detail} user={user} onVote={onVote} onClose={() => setDetailId(null)} />
    </div>
  );
}

function VoteCardDash({ c, user, onVote, onOpen }) {
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
        <StatusPill status={c.status} timeLeft={c.timeLeft} />
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55, fontStyle: "italic", margin: "0 0 16px" }}>"{c.story}"</p>
      <div style={{ display: "flex", gap: mobile ? 14 : 28, marginBottom: 16, flexWrap: "wrap", background: C.bgSoft, padding: 14, borderRadius: 14 }}>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Requested</div><div style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500 }}>{fmtMoney(c.amount)}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Votes</div><div style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500 }}>{c.votesCast}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Evidence</div><div style={{ fontFamily: SANS, fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{c.evidence}</div></div>
      </div>
      {open && <VoteBar yes={c.yesVotes} no={c.noVotes} />}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {open && (isMine ? (
          <span style={{ fontSize: 12.5, color: C.inkDim, fontFamily: MONO }}>This is your request — you can't vote on it.</span>
        ) : c.userHasVoted ? (
          <span style={{ fontSize: 12.5, color: C.lemonDeep, fontFamily: MONO, fontWeight: 700 }}>Vote recorded</span>
        ) : (
          <>
            <Btn variant="accent" size="sm" disabled={busy} onClick={() => vote("Yes")}><ThumbsUp size={13} /> Yes</Btn>
            <Btn variant="ghost" size="sm" disabled={busy} onClick={() => vote("No")}><ThumbsDown size={13} /> No</Btn>
          </>
        ))}
        <Btn variant="soft" size="sm" onClick={onOpen} style={{ marginLeft: "auto" }}><MessageCircle size={13} /> Discussion</Btn>
      </div>
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

// ─── Comments ───────────────────────────────────────────────────────────────────
function CommentThread({ requestId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  function load() {
    api.getComments(requestId).then(({ comments: c }) => setComments(c)).catch(() => {});
  }
  useEffect(() => { load(); }, [requestId]);

  async function post() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api.addComment(requestId, text.trim());
      setText("");
      load();
    } catch (e) {
      toast.error(e.message || "Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim, margin: "20px 0 10px" }}>Discussion · {comments.length}</div>
      {comments.length === 0 && <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkDim, margin: "0 0 12px" }}>No comments yet — start the conversation.</p>}
      {comments.map(cm => (
        <div key={cm.id} style={{ background: C.bgSoft, borderRadius: 14, padding: "10px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: C.ink }}>{cm.user?.name || shortAddr(cm.user?.walletAddress)}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.inkDim }}>{fmtDate(cm.createdAt)}</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>{cm.body}</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input placeholder="Add a comment..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") post(); }} style={{ flex: 1, border: `1.5px solid ${C.line}`, borderRadius: 100, padding: "10px 16px", fontFamily: SANS, fontSize: 13, color: C.ink, background: C.bgSoft, outline: "none" }} />
        <Btn variant="accent" size="sm" onClick={post} disabled={posting || !text.trim()}><Send size={13} /></Btn>
      </div>
    </div>
  );
}

// ─── Request Detail Modal ──────────────────────────────────────────────────
function RequestDetailModal({ c, user, onVote, onClose }) {
  const [busy, setBusy] = useState(false);
  if (!c) return null;
  const open = c.status === "Open";
  const isMine = user && c.ownerWallet === (user.walletAddress || "").toLowerCase();

  async function vote(choice) {
    setBusy(true);
    try { await onVote(c.id, choice); toast.success(`Voted ${choice}`); }
    catch (e) { toast.error(e.message || "Vote failed"); }
    finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={c.title || c.name} width={600}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <CatTag cat={c.category} />
        <StatusPill status={c.status} timeLeft={c.timeLeft} />
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
          <Btn variant="soft" size="sm" onClick={() => shareCase(c)}><Copy size={12} /> Share</Btn>
          <a href={xShareUrl(c)} target="_blank" rel="noreferrer"><Btn variant="soft" size="sm"><ExternalLink size={12} /> Post on X</Btn></a>
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: C.inkDim, fontFamily: MONO, flexWrap: "wrap", marginBottom: 14 }}>
        <span>{c.name}</span>
        <span>payout → {c.wallet}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{c.location}</span>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 15, color: C.inkSoft, lineHeight: 1.6, fontStyle: "italic", margin: "0 0 16px" }}>"{c.story}"</p>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", background: C.bgSoft, padding: 14, borderRadius: 14, marginBottom: 16 }}>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Requested</div><div style={{ fontFamily: SERIF, fontSize: 18, color: C.ink, fontWeight: 500 }}>{fmtMoney(c.amount)}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Votes</div><div style={{ fontFamily: SERIF, fontSize: 18, color: C.ink, fontWeight: 500 }}>{c.votesCast}</div></div>
        {c.txHash && <div style={{ minWidth: 0 }}><div style={{ fontFamily: MONO, fontSize: 9.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 4 }}>Tx hash</div><div style={{ fontFamily: MONO, fontSize: 11.5, color: C.ink, wordBreak: "break-all" }}>{c.txHash}</div></div>}
      </div>
      {c.evidenceUrls.length > 0 && (
        <>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim, marginBottom: 8 }}>Evidence · {c.evidenceUrls.length}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {c.evidenceUrls.map((u, i) => (
              <a key={u} href={api.fileUrl(u)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11.5, color: C.lemonDeep, fontWeight: 700, background: C.lemonSoft, padding: "7px 12px", borderRadius: 100, textDecoration: "none" }}>
                <ExternalLink size={11} /> File {i + 1}
              </a>
            ))}
          </div>
        </>
      )}
      {open && (
        <>
          <VoteBar yes={c.yesVotes} no={c.noVotes} />
          <div style={{ marginTop: 12 }}>
            {isMine ? (
              <span style={{ fontSize: 12.5, color: C.inkDim, fontFamily: MONO }}>This is your request — you can't vote on it.</span>
            ) : c.userHasVoted ? (
              <span style={{ fontSize: 12.5, color: C.lemonDeep, fontFamily: MONO, fontWeight: 700 }}>Vote recorded</span>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="accent" size="sm" disabled={busy} onClick={() => vote("Yes")}><ThumbsUp size={13} /> Yes</Btn>
                <Btn variant="ghost" size="sm" disabled={busy} onClick={() => vote("No")}><ThumbsDown size={13} /> No</Btn>
              </div>
            )}
          </div>
        </>
      )}
      <CommentThread requestId={c.id} />
    </Modal>
  );
}

// ─── Donate Panel ─────────────────────────────────────────────────────────────
function DonatePanel({ onDonated }) {
  const [amount, setAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState([]);
  const { sendTransactionAsync } = useSendTransaction();
  const poolWallet = import.meta.env.VITE_POOL_WALLET || "";
  const hasPoolWallet = isAddress(poolWallet);
  const w = useWidth();
  const mobile = w < 768;

  function loadRecent() {
    api.getRecentDonations().then(({ donations }) => setRecent(donations)).catch(() => {});
  }
  useEffect(() => { loadRecent(); }, []);

  // Optional on-chain step: send ETH to the pool wallet and attach the tx hash.
  async function sendOnChain() {
    if (!ethAmount || parseFloat(ethAmount) <= 0) { toast.error("Enter a valid ETH amount"); return; }
    setSending(true);
    try {
      const hash = await sendTransactionAsync({ to: poolWallet, value: parseEther(ethAmount) });
      setTxHash(hash);
      toast.success("Transaction sent — hash attached below");
    } catch (e) {
      toast.error(e.shortMessage || e.message || "Transaction failed");
    } finally {
      setSending(false);
    }
  }

  async function confirm() {
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    setBusy(true);
    try {
      await api.confirmDonation(parseFloat(amount), txHash.trim() || null);
      toast.success("Thank you — donation recorded");
      setAmount(""); setEthAmount(""); setTxHash("");
      loadRecent();
      await onDonated();
    } catch (e) {
      toast.error(e.message || "Donation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 560 }}>
      <Card style={{ padding: mobile ? 20 : 28, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.inkSoft, lineHeight: 1.5, marginBottom: 22, background: C.bgSoft, padding: 14, borderRadius: 14, fontFamily: SANS }}>
          <Gift size={15} style={{ flexShrink: 0, marginTop: 1, color: C.lemonDeep }} />
          Donations fund the shared pool. Payouts only happen after a community vote and manual admin confirmation.
        </div>
        <FieldLabel required>Amount (USD)</FieldLabel>
        <TextInput placeholder="50" prefix="$" value={amount} onChange={setAmount} />
        {hasPoolWallet && (
          <>
            <FieldLabel>Send on-chain (optional)</FieldLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bgSoft, borderRadius: 14, padding: "10px 14px", marginBottom: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkSoft, wordBreak: "break-all", flex: 1 }}>{poolWallet}</span>
              <button onClick={() => { navigator.clipboard.writeText(poolWallet); toast.success("Pool address copied"); }} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.inkSoft, flexShrink: 0 }}><Copy size={13} /></button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><TextInput placeholder="0.05" prefix="Ξ" value={ethAmount} onChange={setEthAmount} /></div>
              <Btn variant="ghost" onClick={sendOnChain} disabled={sending}>{sending ? "Sending..." : "Send ETH"}</Btn>
            </div>
          </>
        )}
        <FieldLabel>Transaction hash (optional)</FieldLabel>
        <TextInput placeholder="0x..." value={txHash} onChange={setTxHash} />
        <Btn full variant="accent" onClick={confirm} disabled={busy} style={{ marginTop: 24 }}>{busy ? "Recording..." : <><HeartHandshake size={15} /> Confirm Donation</>}</Btn>
      </Card>

      {recent.length > 0 && (
        <>
          <Label>Recent supporters</Label>
          <div style={{ marginTop: 10 }}>
            {recent.map(d => (
              <Card key={d.id} style={{ padding: "12px 18px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.ink }}>{d.donor?.name || shortAddr(d.donorWalletAddress)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim }}>{fmtDate(d.createdAt)}</div>
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.lemonDeep, whiteSpace: "nowrap" }}>+{fmtMoney(d.amount)}</div>
              </Card>
            ))}
          </div>
        </>
      )}
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
      .then(async ({ requests }) => {
        const summaries = await Promise.all(requests.map(r => api.getVoteSummary(r.id).catch(() => null)));
        setMyRequests(requests.map((r, i) => normalizeRequest(r, summaries[i], user)));
      })
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
            ? <img src={api.fileUrl(user.photoUrl)} alt={user.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
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
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, whiteSpace: "nowrap" }}>{r.yesVotes}Y · {r.noVotes}N</span>
                  <StatusPill status={r.status} timeLeft={r.timeLeft} />
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

// ─── Admin: Overview ────────────────────────────────────────────────────────
function AdminOverview({ setSection }) {
  const [ov, setOv] = useState(null);
  const w = useWidth();
  const mobile = w < 768;

  useEffect(() => {
    api.getAdminOverview().then(setOv).catch(e => toast.error(e.message || "Failed to load overview"));
  }, []);

  if (!ov) return <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>Loading...</p>;

  return (
    <div>
      {ov.pendingReleases > 0 && (
        <Card style={{ padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", border: `1.5px solid ${C.lemonDeep}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={16} color={C.lemonDeep} />
            <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{ov.pendingReleases} case{ov.pendingReleases > 1 ? "s" : ""} awaiting your release</span>
          </div>
          <Btn variant="accent" size="sm" onClick={() => setSection("cases")}>Review now <ArrowRight size={12} /></Btn>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 12 }}>
        <StatTile label="Pool balance" value={fmtMoney(ov.poolBalance)} icon={DollarSign} accent />
        <StatTile label="Total donated" value={fmtMoney(ov.totalDonated)} icon={Gift} />
        <StatTile label="Total released" value={fmtMoney(ov.totalReleased)} icon={TrendingUp} />
        <StatTile label="Members" value={String(ov.members)} icon={Users} />
        <StatTile label="Open cases" value={String(ov.openCases)} icon={Eye} />
        <StatTile label="Awaiting release" value={String(ov.pendingReleases)} icon={ShieldAlert} accent />
        <StatTile label="Total requests" value={String(ov.totalRequests)} icon={BookOpen} />
        <StatTile label="Votes cast" value={String(ov.totalVotes)} icon={ThumbsUp} />
        <StatTile label="Comments" value={String(ov.totalComments)} icon={MessageCircle} />
      </div>
    </div>
  );
}

// ─── Admin: Members ─────────────────────────────────────────────────────────
function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminUsers()
      .then(({ users: u }) => setUsers(u))
      .catch(e => toast.error(e.message || "Failed to load members"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>Loading...</p>;
  if (users.length === 0) return <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No members yet.</p>;

  return (
    <div>
      {users.map(u => (
        <Card key={u.id} style={{ padding: "14px 18px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.isAdmin ? C.ink : C.lemon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: u.isAdmin ? C.lemon : C.ink, fontFamily: SANS, flexShrink: 0 }}>{getInitials(u.name)}</div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{u.name || "(no profile)"}</span>
                {u.isAdmin && <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.lemonDeep, background: C.lemonSoft, padding: "3px 8px", borderRadius: 100 }}>ADMIN</span>}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, marginTop: 2 }}>{shortAddr(u.walletAddress)} · joined {fmtDate(u.createdAt)}</div>
            </div>
            <div style={{ display: "flex", gap: 16, fontFamily: MONO, fontSize: 11, color: C.inkSoft, flexWrap: "wrap" }}>
              <span>{u._count.requests} cases</span>
              <span>{u._count.votes} votes</span>
              <span style={{ color: C.lemonDeep }}>gave {fmtMoney(u.totalDonated)}</span>
              <span style={{ color: C.green }}>got {fmtMoney(u.totalReceived)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Admin: Donations ─────────────────────────────────────────────────────
function AdminDonations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDonations()
      .then(({ donations }) => setRows(donations))
      .catch(e => toast.error(e.message || "Failed to load donations"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>Loading...</p>;
  if (rows.length === 0) return <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No donations recorded yet.</p>;

  return (
    <div>
      {rows.map(d => (
        <Card key={d.id} style={{ padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{d.donor?.name || shortAddr(d.donorWalletAddress)}</div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, marginTop: 2 }}>
              {shortAddr(d.donorWalletAddress)} · {fmtDate(d.createdAt)}{d.txHash ? ` · tx ${d.txHash.slice(0, 10)}…` : ""}
            </div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.lemonDeep, whiteSpace: "nowrap" }}>+{fmtMoney(d.amount)}</div>
        </Card>
      ))}
    </div>
  );
}

// ─── Admin: Action Log ───────────────────────────────────────────────────
function AdminLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminLogs()
      .then(({ logs: l }) => setLogs(l))
      .catch(e => toast.error(e.message || "Failed to load log"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>Loading...</p>;
  if (logs.length === 0) return <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No admin actions yet.</p>;

  return (
    <div>
      {logs.map(l => (
        <Card key={l.id} style={{ padding: "14px 18px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: l.action === "release" ? C.green : C.red, background: l.action === "release" ? C.greenSoft : C.redSoft, padding: "4px 10px", borderRadius: 100 }}>{l.action}</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim }}>{fmtDate(l.createdAt)}</span>
          </div>
          {l.reason && <p style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, margin: "8px 0 0" }}>{l.reason}</p>}
        </Card>
      ))}
    </div>
  );
}

// ─── Admin Dashboard (permanent admin only) ─────────────────────────────────────
function AdminPanel({ user, onChanged }) {
  const [section, setSection] = useState("overview");
  const w = useWidth();
  const mobile = w < 768;
  const sections = [["overview", "Overview"], ["cases", "Cases"], ["members", "Members"], ["donations", "Donations"], ["log", "Action Log"]];

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.lemonDeep, fontWeight: 700, marginBottom: 18, background: C.lemonSoft, padding: "12px 14px", borderRadius: 14, fontFamily: MONO }}>
        <ShieldCheck size={15} style={{ flexShrink: 0 }} />
        Permanent admin session · {shortAddr(user?.walletAddress)}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
        {sections.map(([id, label]) => <Pill key={id} active={section === id} onClick={() => setSection(id)}>{label}</Pill>)}
      </div>
      {section === "overview" && <AdminOverview setSection={setSection} />}
      {section === "cases" && <AdminCases onChanged={onChanged} />}
      {section === "members" && <AdminMembers />}
      {section === "donations" && <AdminDonations />}
      {section === "log" && <AdminLog />}
    </div>
  );
}

// ─── Admin: Case Management ───────────────────────────────────────────────
function AdminCases({ onChanged }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("Passed");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [txInputs, setTxInputs] = useState({});
  const w = useWidth();
  const mobile = w < 768;

  async function load(s = status) {
    setLoading(true);
    try {
      const { requests } = await api.getAdminRequests(s);
      setRows(requests);
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(status); }, [status]);

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
    <div>
      <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.inkSoft, lineHeight: 1.5, marginBottom: 20, background: C.bgSoft, padding: 14, borderRadius: 14, fontFamily: SANS }}>
        <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1, color: C.lemonDeep }} />
        Cases that passed the community vote and await a manual payout. Releasing creates a public ledger entry.
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {["Passed", "Open", "Released", "Rejected"].map(s => <Pill key={s} active={status === s} onClick={() => setStatus(s)}>{s}</Pill>)}
      </div>
      {loading && <p style={{ color: C.inkDim, fontFamily: SANS, fontSize: 13 }}>Loading...</p>}
      {!loading && rows.length === 0 && <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No {status.toLowerCase()} cases.</p>}
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
          {status === "Passed" ? (
            <>
              <TextInput placeholder="Payout tx hash (optional)" value={txInputs[r.id] || ""} onChange={v => setTxInputs(prev => ({ ...prev, [r.id]: v }))} />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <Btn variant="accent" size="sm" disabled={busyId === r.id} onClick={() => release(r.id)}><Check size={13} /> Release Funds</Btn>
                <Btn variant="danger" size="sm" disabled={busyId === r.id} onClick={() => reject(r.id)}><X size={13} /> Reject</Btn>
              </div>
            </>
          ) : (
            <StatusPill status={r.status} />
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Community Panel ─────────────────────────────────────────────────────────
function CommunityPanel({ stats, setTab }) {
  const [board, setBoard] = useState([]);
  const w = useWidth();
  const mobile = w < 768;
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    api.getLeaderboard().then(({ leaderboard }) => setBoard(leaderboard)).catch(() => {});
  }, []);

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 700 }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        <StatTile label="Members" value={stats ? stats.members.toLocaleString() : "—"} icon={Users} accent />
        <StatTile label="Total donated" value={stats ? fmtMoney(stats.totalDonated) : "—"} icon={Gift} />
        <StatTile label="Total released" value={stats ? fmtMoney(stats.totalReleased) : "—"} icon={TrendingUp} />
      </div>

      <Label>Top supporters</Label>
      <div style={{ marginTop: 12 }}>
        {board.length === 0 && (
          <Card style={{ padding: 32, textAlign: "center" }}>
            <Gift size={20} color={C.lemonDeep} style={{ marginBottom: 10 }} />
            <p style={{ fontFamily: SANS, fontSize: 13.5, color: C.inkSoft, marginBottom: 14 }}>No donations yet — be the first name on this board.</p>
            <Btn variant="accent" size="sm" onClick={() => setTab("donate")}><Gift size={13} /> Donate to the Pool</Btn>
          </Card>
        )}
        {board.map((u, i) => (
          <Card key={u.id} style={{ padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 34, textAlign: "center", fontFamily: SERIF, fontSize: i < 3 ? 20 : 14, color: C.inkSoft, flexShrink: 0 }}>{i < 3 ? medals[i] : `#${i + 1}`}</div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: SANS, flexShrink: 0 }}>{getInitials(u.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || shortAddr(u.walletAddress)}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim }}>{shortAddr(u.walletAddress)}</div>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.lemonDeep, whiteSpace: "nowrap" }}>{fmtMoney(u.totalDonated)}</div>
          </Card>
        ))}
      </div>

      <div style={{ background: C.ink, borderRadius: 22, padding: "28px 24px", textAlign: "center", marginTop: 24 }}>
        <p style={{ fontFamily: SERIF, fontSize: 17, color: C.bg, marginBottom: 14 }}>Grow the hood — <span style={{ fontStyle: "italic", color: C.lemon }}>share a case</span> or add to the pool.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="accent" size="sm" onClick={() => setTab("donate")}><Gift size={13} /> Donate</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setTab("votes")}><ThumbsUp size={13} /> Vote on Cases</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
function Dashboard({ user, setUser, onLogout, requests, ledger, stats, onSubmitted, onVote, onDataChanged, initialCaseId }) {
  const [tab, setTab] = useState(initialCaseId ? "votes" : "feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const w = useWidth();
  const mobile = w < 900;

  const titles = { feed: "Dashboard", votes: "Vote on Cases", submit: "New Request", donate: "Donate to the Pool", community: "Community", ledger: "Public Ledger", categories: "Categories", profile: "My Profile", admin: "Admin — Releases" };
  const subtitles = { feed: `Welcome back, ${user?.name?.split(" ")[0]}`, votes: "One wallet, one vote — always", submit: "Put your case on the record", donate: "Every dollar goes to someone the community voted in", community: "The people who keep the pool alive", ledger: "Every payout confirmed by hand", categories: "Whatever kind of trouble it is", profile: "Manage your account", admin: "Confirm and release passed cases" };

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
              {tab === "votes" && <VotesPanel requests={requests} user={user} onVote={onVote} initialDetailId={initialCaseId} />}
              {tab === "submit" && <SubmitPanel user={user} onSubmitted={onSubmitted} setTab={setTab} />}
              {tab === "donate" && <DonatePanel onDonated={onDataChanged} />}
              {tab === "community" && <CommunityPanel stats={stats} setTab={setTab} />}
              {tab === "ledger" && <LedgerPanel ledger={ledger} />}
              {tab === "categories" && <CategoriesPanel setTab={setTab} />}
              {tab === "profile" && <ProfilePanel user={user} setUser={setUser} />}
              {tab === "admin" && user?.isAdmin && <AdminPanel user={user} onChanged={onDataChanged} />}
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
  // Deep link support: /?case=<id> opens that case for anyone.
  const [sharedCaseId, setSharedCaseId] = useState(() => new URLSearchParams(window.location.search).get("case"));

  function clearShared() {
    setSharedCaseId(null);
    window.history.replaceState({}, "", window.location.pathname);
  }

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
      {view === "landing" && <LandingPage onGoLogin={() => setView("login")} stats={stats} requests={requests} ledger={ledger} sharedCaseId={sharedCaseId} onClearShared={clearShared} />}
      {view === "login" && <LoginScreen onLogin={handleLogin} />}
      {view === "dashboard" && user && <Dashboard user={user} setUser={setUser} onLogout={handleLogout} requests={requests} ledger={ledger} stats={stats} onSubmitted={handleSubmitted} onVote={handleVote} onDataChanged={refreshAll} initialCaseId={sharedCaseId} />}
    </div>
  );
}
