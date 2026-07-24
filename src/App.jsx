import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import {
  Wallet, MapPin, Upload, Check, ShieldCheck, ArrowUpRight, ArrowRight,
  HeartHandshake, Users, Vote, Landmark, Sparkles, ChevronRight,
  TrendingUp, Clock, Copy, LogOut, Plus, AlertCircle, X, Menu,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg0: "#070707", bg1: "#0f0f0f", bg2: "#161616", bg3: "#1e1e1e",
  border: "rgba(255,255,255,0.07)", borderHi: "rgba(255,255,255,0.14)",
  green: "#22c55e", greenDim: "rgba(34,197,94,0.12)", greenBrd: "rgba(34,197,94,0.25)",
  red: "#ef4444", redDim: "rgba(239,68,68,0.12)",
  amber: "#f59e0b", amberDim: "rgba(245,158,11,0.12)",
  purple: "#a855f7", blue: "#3b82f6",
  text: "#f0f0f0", textSoft: "rgba(240,240,240,0.55)", textDim: "rgba(240,240,240,0.28)",
  mono: "'JetBrains Mono', monospace",
  serif: "'Fraunces', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
};

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.22 } };
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = ["Medical", "Crypto Loss", "Disaster", "Job Loss", "Other"];
const CAT_ICON = { Medical: HeartHandshake, "Crypto Loss": Landmark, Disaster: Sparkles, "Job Loss": Users, Other: Vote };
const CAT_COLOR = { Medical: "#3b82f6", "Crypto Loss": "#a855f7", Disaster: "#f59e0b", "Job Loss": "#22c55e", Other: "#6b7280" };

const SEED_REQUESTS = [
  { id: 1, name: "Marcus Ade", wallet: "0x91Fa...4C2d", location: "Manchester, UK", category: "Crypto Loss", status: "Open", daysLeft: 2, story: "Lost my savings in a fake liquidity pool after trusting a promoted link. I have the transaction hash and the contract that pulled the funds. Asking for enough to cover rent this month.", amount: 3200, yesVotes: 322, noVotes: 90, evidence: "Transaction hash + 2 images" },
  { id: 2, name: "Priya N.", wallet: "0x3Bc7...A190", location: "Leicester, UK", category: "Medical", status: "Open", daysLeft: 4, story: "My daughter needs physiotherapy after an accident our insurance won't fully cover. Attaching the clinic invoice and referral letter.", amount: 1450, yesVotes: 237, noVotes: 23, evidence: "Invoice + referral letter" },
  { id: 3, name: "Femi O.", wallet: "0x7A44...6E19", location: "Lagos, Nigeria", category: "Disaster", status: "Under review", daysLeft: null, story: "Flooding damaged our shop's stock two weeks ago. Requesting partial relief to restock essentials. Photos attached.", amount: 800, yesVotes: 0, noVotes: 0, evidence: "6 photographs" },
];

const SEED_LEDGER = [
  { wallet: "0x5Ec2...7B44", amount: 1900, category: "Crypto Loss", note: "Partial recovery after a rug-pulled token, cleared with 89% Yes.", date: "Jun 14, 2026" },
  { wallet: "0x1D9a...F02c", amount: 650, category: "Crypto Loss", note: "Gas-drain loss from a malicious approval on a spoofed dApp.", date: "Jun 3, 2026" },
  { wallet: "0x2F81...C773", amount: 1200, category: "Medical", note: "Emergency dental treatment not covered by insurance.", date: "May 30, 2026" },
  { wallet: "0x7A44...6E19", amount: 3000, category: "Disaster", note: "Partial relief after a bridge exploit wiped an overnight position.", date: "May 27, 2026" },
  { wallet: "0x9C12...D845", amount: 500, category: "Job Loss", note: "Bridging support after a sudden redundancy, covering one month rent.", date: "May 19, 2026" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return (name || "??").split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function generateWallet() {
  const h = "0123456789ABCDEFabcdef";
  const p = () => Array.from({ length: 4 }, () => h[Math.floor(Math.random() * h.length)]).join("");
  return `0x${p()}...${p()}`;
}
function parseAmount(s) { const n = parseFloat(String(s).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }
function fmtDate() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Pill({ children, color = T.green }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: `${color}18`, border: `1px solid ${color}30`, fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function CatBadge({ cat }) {
  const Icon = CAT_ICON[cat] || Vote;
  const color = CAT_COLOR[cat] || T.textDim;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: `${color}14`, fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      <Icon size={11} /> {cat}
    </span>
  );
}

function Btn({ children, variant = "primary", onClick, style, full, type = "button", disabled, size = "md" }) {
  const sizes = { sm: "10px 18px", md: "13px 24px", lg: "16px 32px" };
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: T.sans, fontWeight: 600, fontSize: size === "sm" ? 13 : 14.5,
    padding: sizes[size], borderRadius: 8, border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .18s ease", letterSpacing: "-0.01em",
    width: full ? "100%" : undefined, opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary: { background: T.green, color: "#000" },
    dark: { background: T.bg3, color: T.text, border: `1px solid ${T.border}` },
    ghost: { background: "transparent", color: T.textSoft, border: `1px solid ${T.border}` },
    danger: { background: T.redDim, color: T.red, border: `1px solid rgba(239,68,68,0.2)` },
  };
  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.02, opacity: 0.92 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </motion.button>
  );
}

function Input({ label, placeholder, value, onChange, prefix, type = "text", required, error, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: "block", fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          {label}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: T.mono, fontSize: 13, color: T.textDim }}>{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value || ""}
          onChange={e => onChange && onChange(e.target.value)}
          style={{
            width: "100%", background: T.bg2, border: `1px solid ${error ? T.red : T.border}`,
            borderRadius: 8, padding: prefix ? "12px 14px 12px 52px" : "12px 14px",
            fontFamily: T.mono, fontSize: 14, color: T.text, outline: "none",
            boxSizing: "border-box", transition: "border-color .15s",
          }}
          onFocus={e => { e.target.style.borderColor = error ? T.red : T.green; }}
          onBlur={e => { e.target.style.borderColor = error ? T.red : T.border; }}
        />
      </div>
      {error && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: T.red, fontSize: 12, fontFamily: T.sans }}><AlertCircle size={12} />{error}</div>}
      {hint && !error && <div style={{ marginTop: 6, color: T.textDim, fontSize: 12, fontFamily: T.sans }}>{hint}</div>}
    </div>
  );
}

function Textarea({ label, placeholder, value, onChange, rows = 4, required, error }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: "block", fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          {label}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value || ""}
        onChange={e => onChange && onChange(e.target.value)}
        style={{
          width: "100%", background: T.bg2, border: `1px solid ${error ? T.red : T.border}`,
          borderRadius: 8, padding: "12px 14px", fontFamily: T.sans, fontSize: 14.5,
          color: T.text, outline: "none", resize: "vertical", lineHeight: 1.6,
          boxSizing: "border-box", transition: "border-color .15s",
        }}
        onFocus={e => { e.target.style.borderColor = error ? T.red : T.green; }}
        onBlur={e => { e.target.style.borderColor = error ? T.red : T.border; }}
      />
      {error && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: T.red, fontSize: 12, fontFamily: T.sans }}><AlertCircle size={12} />{error}</div>}
    </div>
  );
}

function Dropzone({ label, fileName, onFile }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      border: `1.5px dashed ${fileName ? T.green : T.border}`, borderRadius: 10,
      padding: "24px 20px", cursor: "pointer", textAlign: "center",
      background: fileName ? T.greenDim : "transparent", transition: "all .2s",
      fontFamily: T.mono, fontSize: 12, color: fileName ? T.green : T.textDim,
    }}>
      <input type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f && onFile) onFile(f.name); }} />
      {fileName ? <><Check size={14} /> {fileName}</> : <><Upload size={14} /> {label}</>}
    </label>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = T.green }) {
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        {Icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={accent} /></div>}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 600, color: T.text, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textDim, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Submit ───────────────────────────────────────────────────────────────────
function SubmitScreen({ user, initialCategory, onSubmit, setScreen }) {
  const [cat, setCat] = useState(initialCategory || "Crypto Loss");
  const [amount, setAmount] = useState("");
  const [story, setStory] = useState("");
  const [txHash, setTxHash] = useState("");
  const [evidenceFile, setEvidenceFile] = useState("");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => { if (initialCategory) setCat(initialCategory); }, [initialCategory]);

  if (!user) return (
    <motion.div {...fade} style={{ maxWidth: 560, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: T.greenDim, border: `1px solid ${T.greenBrd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
        <ShieldCheck size={24} color={T.green} />
      </div>
      <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 32, color: T.text, marginBottom: 12 }}>Create a profile first.</h1>
      <p style={{ fontFamily: T.sans, color: T.textSoft, fontSize: 15, marginBottom: 28 }}>You need a connected wallet and profile before filing a request.</p>
      <Btn variant="primary" onClick={() => setScreen("login")}>Sign up <ArrowRight size={15} /></Btn>
    </motion.div>
  );

  if (done) return (
    <motion.div {...fade} style={{ maxWidth: 560, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} style={{ width: 64, height: 64, borderRadius: "50%", background: T.greenDim, border: `1px solid ${T.greenBrd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
        <Check size={28} color={T.green} />
      </motion.div>
      <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 36, color: T.text, marginBottom: 12 }}>Filed.</h1>
      <p style={{ fontFamily: T.sans, color: T.textSoft, fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Your case is now open for community vote. Track it from your profile or the votes page.</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn variant="primary" onClick={() => setScreen("votes")}>View open cases</Btn>
        <Btn variant="ghost" onClick={() => setScreen("profile")}>Go to profile</Btn>
      </div>
    </motion.div>
  );

  function validate() {
    const e = {};
    if (!amount.trim() || parseAmount(amount) <= 0) e.amount = "Enter a valid amount.";
    if (!story.trim() || story.trim().length < 20) e.story = "Please describe your situation (at least 20 characters).";
    setErrors(e);
    return !Object.keys(e).length;
  }

  function submit() {
    if (!validate()) return;
    onSubmit({ id: Date.now(), name: user.name, wallet: user.wallet, location: user.location, category: cat, status: "Open", daysLeft: 7, story: story.trim(), amount: parseAmount(amount), yesVotes: 0, noVotes: 0, evidence: evidenceFile || (txHash.trim() ? "Transaction hash" : "None") });
    toast.success("Request filed", { description: "Your case is now open for community vote." });
    setDone(true);
  }

  return (
    <motion.div {...fade} style={{ maxWidth: 600, margin: "0 auto", padding: "72px 24px 120px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>File a request</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 38, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>Put your case on the record.</h1>
        <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: T.amberDim, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 8, fontSize: 13, color: T.amber, fontFamily: T.sans, lineHeight: 1.5 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          Filing does not guarantee funding. Every case is decided by community vote and confirmed manually.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={{ display: "block", fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Category</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => {
            const Icon = CAT_ICON[c];
            const color = CAT_COLOR[c];
            const active = cat === c;
            return (
              <motion.button key={c} whileTap={{ scale: 0.96 }} onClick={() => setCat(c)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, border: `1px solid ${active ? color + "50" : T.border}`, background: active ? `${color}14` : T.bg2, cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: active ? color : T.textSoft, transition: "all .15s" }}>
                <Icon size={13} /> {c}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Input label="Amount requested" placeholder="2,500" prefix="$RELIEF" value={amount} onChange={setAmount} required error={errors.amount} />
      <Textarea label="What happened" placeholder="Describe your situation clearly — what happened, when, and what this would help cover." value={story} onChange={setStory} rows={5} required error={errors.story} />

      {cat === "Crypto Loss" && (
        <Input label="Transaction hash — recommended" placeholder="0x..." value={txHash} onChange={setTxHash} hint="Providing a tx hash significantly increases community trust." />
      )}

      <div style={{ marginBottom: 28 }}>
        <label style={{ display: "block", fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Supporting evidence — optional</label>
        <Dropzone label="Upload photos, documents, receipts" fileName={evidenceFile} onFile={setEvidenceFile} />
      </div>

      <Btn full variant="primary" onClick={submit} size="lg">Submit for community vote <ArrowRight size={15} /></Btn>
    </motion.div>
  );
}

// ─── Votes ────────────────────────────────────────────────────────────────────
function VoteCard({ r, userVote, onVote, loggedIn, setScreen }) {
  const open = r.status === "Open";
  const total = r.yesVotes + r.noVotes;
  const color = CAT_COLOR[r.category] || T.textDim;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 28px 24px", transition: "border-color .15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <CatBadge cat={r.category} />
            {open ? <Pill color={T.amber}>{r.daysLeft}d left</Pill> : <Pill color={T.textDim}>{r.status}</Pill>}
          </div>
          <h3 style={{ fontFamily: T.serif, fontSize: 22, color: T.text, fontWeight: 500, marginBottom: 4 }}>{r.name}</h3>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: T.textDim, fontFamily: T.mono, flexWrap: "wrap" }}>
            <span>{r.wallet}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} />{r.location}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textDim, marginBottom: 4 }}>REQUESTED</div>
          <div style={{ fontFamily: T.serif, fontSize: 24, color: T.text, fontWeight: 600 }}>{r.amount.toLocaleString()}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>$RELIEF</div>
        </div>
      </div>

      <p style={{ fontFamily: T.sans, fontSize: 15, color: T.textSoft, lineHeight: 1.65, fontStyle: "italic", margin: "0 0 22px", borderLeft: `3px solid ${color}40`, paddingLeft: 16 }}>"{r.story}"</p>

      <div style={{ display: "flex", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ background: T.bg3, borderRadius: 8, padding: "10px 16px" }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", marginBottom: 4 }}>Evidence</div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: 600 }}>{r.evidence}</div>
        </div>
        <div style={{ background: T.bg3, borderRadius: 8, padding: "10px 16px" }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", marginBottom: 4 }}>Votes cast</div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: 600 }}>{(r.yesVotes + r.noVotes).toLocaleString()}</div>
        </div>
      </div>

      {open && (
        <>
          {(r.yesVotes + r.noVotes) > 0 && <div style={{ marginBottom: 20 }}><VoteBar yes={r.yesVotes} no={r.noVotes} /></div>}
          {userVote ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: T.greenDim, border: `1px solid ${T.greenBrd}`, fontFamily: T.mono, fontSize: 12, color: T.green, fontWeight: 600 }}>
              <Check size={13} /> You voted {userVote}
            </div>
          ) : loggedIn ? (
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="primary" size="sm" onClick={() => onVote(r.id, "Yes")}>Vote Yes <Check size={13} /></Btn>
              <Btn variant="danger" size="sm" onClick={() => onVote(r.id, "No")}>Vote No <X size={13} /></Btn>
            </div>
          ) : (
            <button onClick={() => setScreen("login")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, background: T.bg3, border: `1px solid ${T.border}`, cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSoft }}>
              <Wallet size={13} /> Connect wallet to vote
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}

function VotesScreen({ requests, userVotes, onVote, loggedIn, setScreen }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? requests : requests.filter(r => r.category === filter);

  return (
    <motion.div {...fade} style={{ maxWidth: 820, margin: "0 auto", padding: "72px 24px 120px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Open cases</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 38, color: T.text, letterSpacing: "-0.02em", marginBottom: 10 }}>Cases awaiting the community.</h1>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.textSoft }}>
          {loggedIn ? "Cast your vote. One wallet, one vote — always." : "Connect a wallet holding $RELIEF to vote."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${filter === c ? T.borderHi : T.border}`, background: filter === c ? T.bg3 : "transparent", cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: filter === c ? T.text : T.textDim, transition: "all .15s" }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.textDim, fontFamily: T.sans, fontSize: 14 }}>No cases in this category right now.</div>
        ) : (
          filtered.map(r => <VoteCard key={r.id} r={r} userVote={userVotes[r.id]} onVote={onVote} loggedIn={loggedIn} setScreen={setScreen} />)
        )}
      </div>
    </motion.div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesScreen({ setScreen, onSelectCategory }) {
  const descriptions = { Medical: "Bills, treatment, and care costs insurance won't cover.", "Crypto Loss": "Rug pulls, exploits, phishing, and wallet drains on-chain.", Disaster: "Fire, flood, storm damage, and sudden displacement.", "Job Loss": "Bridging support after redundancy or sudden income loss.", Other: "Anything real that doesn't fit neatly into a category." };

  return (
    <motion.div {...fade} style={{ maxWidth: 860, margin: "0 auto", padding: "72px 24px 120px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Categories</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 38, color: T.text, letterSpacing: "-0.02em", marginBottom: 10 }}>Whatever kind of trouble it is.</h1>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.textSoft, maxWidth: 480 }}>These are starting points, not restrictions — the "what happened" field is always open text.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {CATEGORIES.map(c => {
          const Icon = CAT_ICON[c];
          const color = CAT_COLOR[c];
          return (
            <motion.div key={c} whileHover={{ y: -2 }} onClick={() => { onSelectCategory(c); setScreen("submit"); }} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px 22px", cursor: "pointer", display: "flex", gap: 18, alignItems: "flex-start", transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color + "50"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: T.serif, fontSize: 19, color: T.text, fontWeight: 500, marginBottom: 6 }}>{c}</h3>
                <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.textSoft, margin: 0, lineHeight: 1.5 }}>{descriptions[c]}</p>
              </div>
              <ChevronRight size={16} color={T.textDim} style={{ flexShrink: 0, marginTop: 4 }} />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Ledger ───────────────────────────────────────────────────────────────────
function LedgerScreen({ ledger }) {
  const w = useWidth();
  const mobile = w < 640;
  const total = ledger.reduce((s, r) => s + r.amount, 0);

  return (
    <motion.div {...fade} style={{ maxWidth: 960, margin: "0 auto", padding: mobile ? "48px 20px 100px" : "72px 40px 120px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Public ledger</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 38, color: T.text, letterSpacing: "-0.02em", marginBottom: 10 }}>Relief already released.</h1>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.textSoft }}>Every row cleared a community vote and was confirmed and paid out by hand.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 40 }}>
        <StatCard label="Total released" value={total.toLocaleString()} sub="$RELIEF" icon={TrendingUp} />
        <StatCard label="Cases funded" value={String(ledger.length)} sub="completed" icon={Check} />
        <StatCard label="Avg payout" value={Math.round(total / ledger.length).toLocaleString()} sub="$RELIEF" icon={Wallet} accent={T.purple} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ledger.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: mobile ? "18px 16px" : "20px 24px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textDim, marginBottom: 6 }}>{r.wallet}</div>
              <CatBadge cat={r.category} />
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 22, color: T.text, fontWeight: 600, flex: "0 0 auto" }}>
              {r.amount.toLocaleString()} <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>$RELIEF</span>
            </div>
            <div style={{ flex: 1, minWidth: 180, fontFamily: T.sans, fontSize: 13.5, color: T.textSoft, lineHeight: 1.5 }}>{r.note}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textDim, whiteSpace: "nowrap" }}>{r.date}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [ledger] = useState(SEED_LEDGER);
  const [userVotes, setUserVotes] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [screen]);

  function handleVote(id, vote) {
    setUserVotes(p => ({ ...p, [id]: vote }));
    setRequests(p => p.map(r => r.id !== id ? r : { ...r, yesVotes: vote === "Yes" ? r.yesVotes + 1 : r.yesVotes, noVotes: vote === "No" ? r.noVotes + 1 : r.noVotes }));
    toast.success(`Voted ${vote}`, { description: "Your vote has been recorded." });
  }

  function handleSubmit(req) {
    setRequests(p => [req, ...p]);
    setSelectedCategory(null);
  }

  function handleLogout() {
    setLoggedIn(false);
    setUser(null);
    setUserVotes({});
    setScreen("home");
    toast.success("Logged out");
  }

  function go(s) {
    if (s !== "submit") setSelectedCategory(null);
    setScreen(s);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, color: T.text, fontFamily: T.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&display=swap');
      `}</style>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <NavBar screen={screen} setScreen={go} loggedIn={loggedIn} user={user} />
      <AnimatePresence mode="wait">
        {screen === "home" && <HomeScreen key="home" setScreen={go} requests={requests} ledger={ledger} loggedIn={loggedIn} />}
        {screen === "login" && <LoginScreen key="login" setScreen={go} setLoggedIn={setLoggedIn} setUser={setUser} />}
        {screen === "profile" && (user ? <ProfileScreen key="profile" user={user} setScreen={go} requests={requests} onLogout={handleLogout} /> : <LoginScreen key="login2" setScreen={go} setLoggedIn={setLoggedIn} setUser={setUser} />)}
        {screen === "submit" && <SubmitScreen key="submit" user={user} initialCategory={selectedCategory} onSubmit={handleSubmit} setScreen={go} />}
        {screen === "votes" && <VotesScreen key="votes" requests={requests} userVotes={userVotes} onVote={handleVote} loggedIn={loggedIn} setScreen={go} />}
        {screen === "categories" && <CategoriesScreen key="categories" setScreen={go} onSelectCategory={setSelectedCategory} />}
        {screen === "ledger" && <LedgerScreen key="ledger" ledger={ledger} />}
      </AnimatePresence>
      <div style={{ borderTop: `1px solid ${T.border}`, background: T.bg1, padding: "32px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontFamily: T.mono, fontSize: 11, color: T.textDim, lineHeight: 1.7, maxWidth: 680 }}>
            Hood Relief Bot is a community mutual-aid pool, not a financial institution, insurer, or guaranteed refund service. Filing a request does not guarantee funding. All releases are decided by community vote and confirmed manually. This is a sample interface — no accounts, wallets, or funds are real.
          </p>
        </div>
      </div>
    </div>
  );
}
function LoginScreen({ setScreen, setLoggedIn, setUser }) {
  const [mode, setMode] = useState("signup");
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [errors, setErrors] = useState({});

  function connectWallet() {
    const addr = generateWallet();
    setWallet(addr);
    toast.success("Wallet connected", { description: addr });
  }

  function validate() {
    const e = {};
    if (!wallet) e.wallet = "Connect your wallet first.";
    if (mode === "signup" && !name.trim()) e.name = "Name is required.";
    if (mode === "signup" && !location.trim()) e.location = "Location is required.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  function submit() {
    if (!validate()) return;
    if (mode === "signup") {
      setUser({ name: name.trim(), location: location.trim(), wallet, bio: bio.trim() || "No bio yet.", photo, totalReceived: 0, totalDonated: 0 });
    } else {
      setUser({ name: "Marcus Ade", location: "Manchester, UK", wallet, bio: "Father of two. Lost my emergency fund to a fake liquidity pool in May. Rebuilding.", totalReceived: 1900, totalDonated: 350 });
    }
    setLoggedIn(true);
    toast.success(mode === "signup" ? "Profile created!" : "Welcome back!");
    setScreen("profile");
  }

  return (
    <motion.div {...fade} style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px 120px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {mode === "signup" ? "Create profile" : "Welcome back"}
          </span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 40, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>
          {mode === "signup" ? "Set up your profile." : "Log in."}
        </h1>
        <p style={{ fontFamily: T.sans, color: T.textSoft, fontSize: 15, lineHeight: 1.6 }}>
          A wallet connection is required so relief can reach you directly and your vote counts.
        </p>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 36, borderBottom: `1px solid ${T.border}` }}>
        {["signup", "login"].map(m => (
          <button key={m} onClick={() => { setMode(m); setErrors({}); }} style={{
            padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontSize: 14, fontWeight: 700,
            color: mode === m ? T.text : T.textDim,
            borderBottom: mode === m ? `2px solid ${T.green}` : "2px solid transparent",
            marginBottom: -1, transition: "all .15s",
          }}>{m === "signup" ? "Sign up" : "Log in"}</button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={wallet ? undefined : connectWallet}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", background: wallet ? T.greenDim : T.bg2,
          border: `1px solid ${wallet ? T.greenBrd : T.border}`, borderRadius: 10,
          cursor: wallet ? "default" : "pointer", marginBottom: 6, transition: "all .2s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: wallet ? T.green : T.text }}>
          <Wallet size={16} color={wallet ? T.green : T.textSoft} />
          {wallet ? wallet : "Connect wallet"}
        </span>
        {wallet ? <Check size={16} color={T.green} /> : <ArrowRight size={16} color={T.textDim} />}
      </motion.button>
      {errors.wallet && <div style={{ color: T.red, fontSize: 12, fontFamily: T.sans, marginBottom: 16, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={12} />{errors.wallet}</div>}

      {mode === "signup" && (
        <div style={{ marginTop: 24 }}>
          <Input label="Full name" placeholder="e.g. Marcus Ade" value={name} onChange={setName} required error={errors.name} />
          <Input label="Location" placeholder="City, Country" value={location} onChange={setLocation} required error={errors.location} />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Profile photo</label>
            <Dropzone label="Upload a photo (optional)" fileName={photo} onFile={setPhoto} />
          </div>
          <Textarea label="Short bio" placeholder="A line or two about you..." rows={2} value={bio} onChange={setBio} />
        </div>
      )}

      {mode === "login" && (
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.textSoft, marginTop: 20, lineHeight: 1.6 }}>
          Connect your wallet above. If your address matches an existing profile, you're in.
        </p>
      )}

      <Btn full variant="primary" onClick={submit} disabled={!wallet} style={{ marginTop: 32 }}>
        {mode === "signup" ? "Create profile" : "Log in"} <ArrowRight size={15} />
      </Btn>
      <p style={{ fontFamily: T.mono, fontSize: 11, color: T.textDim, textAlign: "center", marginTop: 16 }}>
        Sample flow — no real wallet or account is created.
      </p>
    </motion.div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileScreen({ user, setScreen, requests, onLogout }) {
  const w = useWidth();
  const mobile = w < 768;
  const userRequests = requests.filter(r => r.wallet === user.wallet);

  function copyWallet() {
    navigator.clipboard?.writeText(user.wallet).catch(() => {});
    toast.success("Wallet address copied");
  }

  return (
    <motion.div {...fade} style={{ maxWidth: 860, margin: "0 auto", padding: mobile ? "48px 20px 100px" : "72px 40px 120px" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 48, paddingBottom: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${T.green}, #86efac)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: "#000", flexShrink: 0 }}>
          {getInitials(user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: mobile ? 28 : 34, color: T.text, letterSpacing: "-0.02em", marginBottom: 10 }}>{user.name}</h1>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: T.textSoft, fontFamily: T.sans }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} />{user.location}</span>
            <button onClick={copyWallet} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: T.textSoft, fontFamily: T.mono, fontSize: 12, padding: 0 }}>
              <Copy size={11} />{user.wallet}
            </button>
          </div>
          {user.bio && <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.textSoft, lineHeight: 1.6, marginTop: 12, maxWidth: 440 }}>{user.bio}</p>}
        </div>
        <Btn variant="ghost" size="sm" onClick={onLogout} style={{ flexShrink: 0 }}><LogOut size={13} /> Log out</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 48 }}>
        <StatCard label="Received" value={`${(user.totalReceived || 0).toLocaleString()}`} sub="$RELIEF" icon={TrendingUp} />
        <StatCard label="Donated" value={`${(user.totalDonated || 0).toLocaleString()}`} sub="$RELIEF" icon={HeartHandshake} accent={T.blue} />
        <StatCard label="Requests" value={String(userRequests.length)} sub="filed" icon={Vote} accent={T.purple} />
        <StatCard label="Open" value={String(userRequests.filter(r => r.status === "Open").length)} sub="active" icon={Clock} accent={T.amber} />
      </div>

      {/* Requests */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Request history</span>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setScreen("submit")}><Plus size={13} /> New request</Btn>
      </div>

      {userRequests.length === 0 ? (
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: T.sans, fontSize: 14, color: T.textDim }}>No requests filed yet.</p>
          <Btn variant="ghost" size="sm" onClick={() => setScreen("submit")} style={{ marginTop: 16 }}>File your first request</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {userRequests.map(r => {
            const total = r.yesVotes + r.noVotes;
            const yesPct = total > 0 ? Math.round((r.yesVotes / total) * 100) : 0;
            return (
              <div key={r.id} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <CatBadge cat={r.category} />
                    <Pill color={r.status === "Open" ? T.green : T.amber}>{r.status}</Pill>
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 13, color: T.text, fontWeight: 700 }}>{r.amount.toLocaleString()} <span style={{ color: T.green }}>$RELIEF</span></span>
                </div>
                <p style={{ fontFamily: T.sans, fontSize: 14, color: T.textSoft, lineHeight: 1.55, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.story}</p>
                {total > 0 && <VoteBar yes={r.yesVotes} no={r.noVotes} />}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
function HomeScreen({ setScreen, requests, ledger, loggedIn }) {
  const w = useWidth();
  const mobile = w < 768;
  const p = mobile ? "0 20px" : "0 40px";
  const activeCount = requests.filter(r => r.status === "Open").length;
  const totalReleased = ledger.reduce((s, r) => s + r.amount, 0);

  return (
    <motion.div {...fade}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "64px 20px 48px" : "100px 40px 72px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 40 : 64, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 420px", minWidth: 280 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: T.greenDim, border: `1px solid ${T.greenBrd}`, marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.08em" }}>$RELIEF · ROBINHOOD CHAIN</span>
              </div>
              <h1 style={{ fontFamily: T.serif, fontWeight: 600, color: T.text, margin: "0 0 24px", fontSize: mobile ? 44 : "clamp(52px,6vw,88px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
                Whatever happened,<br />
                <span style={{ color: T.green, fontStyle: "italic" }}>the hood</span> shows up.
              </h1>
              <p style={{ fontFamily: T.sans, fontSize: 17, lineHeight: 1.65, color: T.textSoft, maxWidth: 500, margin: "0 0 36px" }}>
                A community relief pool for real people in real trouble. Crypto losses, medical bills, disasters, job loss — one wallet, one vote, every release confirmed by hand.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Btn variant="primary" onClick={() => setScreen(loggedIn ? "submit" : "login")} size="lg">
                  {loggedIn ? "File a request" : "Create profile"} <ArrowRight size={16} />
                </Btn>
                <Btn variant="ghost" onClick={() => setScreen("votes")} size="lg">
                  See open cases <ArrowUpRight size={15} />
                </Btn>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={{ flex: "0 1 360px", minWidth: 280 }}>
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Pool balance — live</div>
              <div style={{ fontFamily: T.serif, fontSize: mobile ? 36 : 46, fontWeight: 600, color: T.text, letterSpacing: "-0.02em", marginBottom: 4 }}>
                84,200
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.green, marginBottom: 20 }}>$RELIEF</div>
              <div style={{ height: 4, background: T.bg3, borderRadius: 100, marginBottom: 20, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} style={{ height: "100%", background: `linear-gradient(90deg, ${T.green}, #86efac)`, borderRadius: 100 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                {[["Active cases", String(activeCount)], ["Members", "1,842"], ["Total released", `${totalReleased.toLocaleString()} $RELIEF`]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontFamily: T.sans }}>
                    <span style={{ color: T.textSoft }}>{k}</span>
                    <span style={{ color: T.text, fontWeight: 700, fontFamily: T.mono, fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.bg1 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `28px ${mobile ? "20px" : "40px"}`, display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24 }}>
          {CATEGORIES.map(c => {
            const Icon = CAT_ICON[c];
            const color = CAT_COLOR[c];
            return (
              <div key={c} onClick={() => setScreen("categories")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", padding: "0 8px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={color} />
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.textSoft }}>{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "64px 20px" : "96px 40px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: T.green }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>How it works</span>
        </div>
        <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: mobile ? 30 : 40, color: T.text, marginBottom: 52, letterSpacing: "-0.02em" }}>Five steps. The same, every time.</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            ["01", "Create a profile", "Sign up, connect your wallet, add your name and location. This is who the community will see and vote on."],
            ["02", "Tell your story", "Choose a category and describe what happened in your own words. Specific, honest requests get more attention."],
            ["03", "Attach what you have", "Upload documents, receipts, photographs. Crypto losses can include a transaction hash."],
            ["04", "The community votes", "Every wallet holding $RELIEF gets exactly one vote. More tokens never buys more say."],
            ["05", "A person signs off", "When voting closes, someone on the team confirms the outcome and sends the funds by hand."],
          ].map(([n, title, desc], i) => (
            <motion.div key={n} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} style={{ display: "grid", gridTemplateColumns: mobile ? "44px 1fr" : "72px 1fr", gap: mobile ? 16 : 28, padding: "28px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.green, fontWeight: 700, paddingTop: 3 }}>{n}</span>
              <div>
                <h3 style={{ fontFamily: T.serif, fontSize: mobile ? 18 : 21, color: T.text, fontWeight: 500, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.textSoft, lineHeight: 1.65, margin: 0, maxWidth: 520 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent cases preview */}
      <div style={{ background: T.bg1, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "64px 20px" : "80px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 20, height: 2, background: T.green }} />
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Open cases</span>
              </div>
              <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: mobile ? 26 : 34, color: T.text, letterSpacing: "-0.02em" }}>Cases awaiting the community.</h2>
            </div>
            <Btn variant="ghost" onClick={() => setScreen("votes")} size="sm">View all <ChevronRight size={14} /></Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {requests.filter(r => r.status === "Open").slice(0, 3).map(r => {
              const total = r.yesVotes + r.noVotes;
              const yesPct = total > 0 ? Math.round((r.yesVotes / total) * 100) : 0;
              return (
                <motion.div key={r.id} whileHover={{ y: -2 }} onClick={() => setScreen("votes")} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22, cursor: "pointer", transition: "border-color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <CatBadge cat={r.category} />
                    <Pill color={T.amber}>{r.daysLeft}d left</Pill>
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 17, color: T.text, fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>{r.name}</div>
                  <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.textSoft, lineHeight: 1.55, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.story}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: T.mono, fontSize: 13, color: T.text, fontWeight: 600 }}>{r.amount.toLocaleString()} <span style={{ color: T.green }}>$RELIEF</span></span>
                    {total > 0 && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>{yesPct}% yes</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "64px 20px" : "96px 40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: mobile ? 32 : 48, color: T.text, marginBottom: 20, letterSpacing: "-0.03em" }}>
          Something happened.<br /><span style={{ color: T.green, fontStyle: "italic" }}>Tell us.</span>
        </h2>
        <p style={{ fontFamily: T.sans, fontSize: 16, color: T.textSoft, marginBottom: 36, maxWidth: 440, margin: "0 auto 36px" }}>
          The community decides. A person confirms. Relief reaches you directly.
        </p>
        <Btn variant="primary" size="lg" onClick={() => setScreen(loggedIn ? "submit" : "login")}>
          {loggedIn ? "File a request" : "Get started"} <ArrowRight size={16} />
        </Btn>
      </div>
    </motion.div>
  );
}
function NavBar({ screen, setScreen, loggedIn, user }) {
  const w = useWidth();
  const mobile = w < 700;
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { id: "votes", label: "Votes" },
    { id: "ledger", label: "Ledger" },
    { id: "categories", label: "Categories" },
    ...(loggedIn ? [{ id: "submit", label: "Request" }] : []),
  ];
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(7,7,7,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "0 16px" : "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div onClick={() => setScreen("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartHandshake size={17} color="#000" />
          </div>
          <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 18, color: T.text, letterSpacing: "-0.01em" }}>Hood Relief</span>
        </div>
        {mobile ? (
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSoft, padding: 4 }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {links.map(l => (
              <button key={l.id} onClick={() => setScreen(l.id)} style={{
                background: screen === l.id ? T.bg3 : "transparent",
                border: `1px solid ${screen === l.id ? T.borderHi : "transparent"}`,
                borderRadius: 7, padding: "7px 14px", cursor: "pointer",
                fontFamily: T.sans, fontSize: 13.5, fontWeight: 600,
                color: screen === l.id ? T.text : T.textSoft, transition: "all .15s",
              }}>{l.label}</button>
            ))}
            {loggedIn ? (
              <div onClick={() => setScreen("profile")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginLeft: 8, padding: "5px 12px", borderRadius: 7, background: T.bg2, border: `1px solid ${T.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#000", fontFamily: T.sans }}>
                  {getInitials(user?.name)}
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSoft }}>{user?.name?.split(" ")[0]}</span>
              </div>
            ) : (
              <Btn onClick={() => setScreen("login")} size="sm" style={{ marginLeft: 8 }}>Sign up</Btn>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {mobile && menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", borderTop: `1px solid ${T.border}`, background: T.bg1 }}>
            <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              {links.map(l => (
                <button key={l.id} onClick={() => { setScreen(l.id); setMenuOpen(false); }} style={{
                  background: screen === l.id ? T.bg3 : "transparent", border: "none", borderRadius: 7,
                  padding: "10px 14px", cursor: "pointer", fontFamily: T.sans, fontSize: 14, fontWeight: 600,
                  color: screen === l.id ? T.text : T.textSoft, textAlign: "left",
                }}>{l.label}</button>
              ))}
              {loggedIn ? (
                <button onClick={() => { setScreen("profile"); setMenuOpen(false); }} style={{ background: "transparent", border: "none", borderRadius: 7, padding: "10px 14px", cursor: "pointer", fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.textSoft, textAlign: "left" }}>
                  Profile
                </button>
              ) : (
                <Btn onClick={() => { setScreen("login"); setMenuOpen(false); }} full style={{ marginTop: 8 }}>Sign up</Btn>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VoteBar({ yes, no }) {
  const total = yes + no;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 11, color: T.textDim, marginBottom: 6 }}>
        <span style={{ color: T.green }}>YES {yesPct}%</span>
        <span style={{ color: T.red }}>NO {100 - yesPct}%</span>
      </div>
      <div style={{ height: 5, background: T.bg3, borderRadius: 100, overflow: "hidden", display: "flex" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${yesPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ background: T.green, borderRadius: "100px 0 0 100px" }} />
        <motion.div initial={{ width: 0 }} animate={{ width: `${100 - yesPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ background: T.red, borderRadius: "0 100px 100px 0" }} />
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textDim, marginTop: 6 }}>{total.toLocaleString()} votes cast</div>
    </div>
  );
}
