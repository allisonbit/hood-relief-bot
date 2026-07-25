import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Wallet, MapPin, Upload, Check, ShieldCheck, ArrowUpRight, ArrowRight,
  HeartHandshake, Users, Vote, Landmark, Sparkles, Quote, AlertCircle,
  LogOut, Plus, Copy, TrendingUp, Clock, Menu, X,
} from "lucide-react";

// ─── Palette ──────────────────────────────────────────────────────────────────
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
const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.2 } };

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = ["Medical", "Crypto Loss", "Disaster", "Job Loss", "Other"];
const CAT_ICON = { Medical: HeartHandshake, "Crypto Loss": Landmark, Disaster: Sparkles, "Job Loss": Users, Other: Vote };

const SEED_REQUESTS = [
  { id: 1, name: "Marcus Ade", wallet: "0x91Fa...4C2d", location: "Manchester, UK", category: "Crypto Loss", status: "Open", daysLeft: 2, story: "Lost my savings in a fake liquidity pool after trusting a promoted link. I have the transaction hash and the contract that pulled the funds.", amount: 3200, yesVotes: 322, noVotes: 90, votesCast: 412, evidence: "Transaction hash + 2 images" },
  { id: 2, name: "Priya N.", wallet: "0x3Bc7...A190", location: "Leicester, UK", category: "Medical", status: "Open", daysLeft: 4, story: "My daughter needs physiotherapy after an accident our insurance won't fully cover. Attaching the clinic invoice and referral letter.", amount: 1450, yesVotes: 237, noVotes: 23, votesCast: 260, evidence: "Invoice + referral letter" },
  { id: 3, name: "Femi O.", wallet: "0x7A44...6E19", location: "Lagos, Nigeria", category: "Disaster", status: "Under review", daysLeft: null, story: "Flooding damaged our shop's stock two weeks ago. Requesting partial relief to restock essentials.", amount: 800, yesVotes: 0, noVotes: 0, votesCast: 0, evidence: "6 photographs" },
];

const SEED_LEDGER = [
  { wallet: "0x5Ec2...7B44", amount: 1900, category: "Crypto Loss", note: "Partial recovery after a rug-pulled token, cleared with 89% Yes.", date: "Jun 14, 2026" },
  { wallet: "0x1D9a...F02c", amount: 650, category: "Crypto Loss", note: "Gas-drain loss from a malicious approval on a spoofed dApp.", date: "Jun 3, 2026" },
  { wallet: "0x2F81...C773", amount: 1200, category: "Medical", note: "Emergency dental treatment not covered by insurance.", date: "May 30, 2026" },
  { wallet: "0x7A44...6E19", amount: 3000, category: "Disaster", note: "Partial relief after a bridge exploit wiped an overnight position.", date: "May 27, 2026" },
  { wallet: "0x9C12...D845", amount: 500, category: "Job Loss", note: "Bridging support after a sudden redundancy, covering one month rent.", date: "May 19, 2026" },
];

const TESTIMONIALS = [
  { name: "Priya N.", quote: "I filed on a Tuesday and had an answer from the community by the weekend. It felt real the whole way through.", cat: "Medical" },
  { name: "Marcus A.", quote: "Watching the vote count climb while people I'd never met decided to help me was something I didn't expect.", cat: "Crypto Loss" },
  { name: "Femi O.", quote: "The proof upload made it easy to show exactly what happened. No one had to just take my word for it.", cat: "Disaster" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) { return (name || "??").split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2); }
function generateWallet() { const h = "0123456789ABCDEFabcdef"; const p = () => Array.from({ length: 4 }, () => h[Math.floor(Math.random() * h.length)]).join(""); return `0x${p()}...${p()}`; }
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children, center }) {
  return (
    <div style={{ display: center ? "flex" : "inline-flex", justifyContent: center ? "center" : undefined, marginBottom: 18 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.lemonDeep, display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, background: C.lemonSoft, padding: "6px 14px 6px 10px", borderRadius: 100 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.lemonDeep }} />
        {children}
      </span>
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, style, full, type = "button", disabled, size = "md" }) {
  const pad = size === "sm" ? "10px 20px" : size === "lg" ? "18px 36px" : "14px 28px";
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontWeight: 700, fontSize: size === "sm" ? 13 : 14.5, padding: pad, borderRadius: 100, border: "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all .18s ease", letterSpacing: "-0.01em", width: full ? "100%" : undefined, opacity: disabled ? 0.45 : 1 };
  const variants = { primary: { background: C.ink, color: C.bg }, accent: { background: C.lemon, color: C.ink, boxShadow: `0 4px 0 ${C.lemonDeep}` }, ghost: { background: C.card, color: C.ink, border: `1.5px solid ${C.line}` }, danger: { background: C.redSoft, color: C.red, border: `1px solid rgba(194,73,47,0.2)` } };
  return <motion.button type={type} onClick={disabled ? undefined : onClick} whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }} style={{ ...base, ...variants[variant], ...style }}>{children}</motion.button>;
}

function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background: C.card, borderRadius: 28, boxShadow: "0 2px 16px rgba(28,28,20,0.06)", border: `1px solid ${C.lineSoft}`, ...style }}>{children}</div>;
}

function CatTag({ cat }) {
  const Icon = CAT_ICON[cat] || Vote;
  return <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: C.ink, display: "inline-flex", alignItems: "center", gap: 6, background: C.lemonSoft, padding: "5px 12px", borderRadius: 100 }}><Icon size={12} color={C.lemonDeep} />{cat}</span>;
}

function StatusPill({ status, daysLeft }) {
  const open = status === "Open";
  return <span style={{ fontFamily: MONO, fontSize: 11, color: open ? C.lemonDeep : C.inkSoft, fontWeight: 700, background: open ? C.lemonSoft : C.bgSoft, padding: "6px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>{open ? `Open · ${daysLeft}d left` : status}</span>;
}

function Pill({ children, active, onClick }) {
  return <button onClick={onClick} style={{ padding: "10px 18px", borderRadius: 100, cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 700, background: active ? C.ink : C.card, color: active ? C.bg : C.inkSoft, border: `1.5px solid ${active ? C.ink : C.line}` }}>{children}</button>;
}

function FieldLabel({ children, required }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 10, marginTop: 24, fontFamily: MONO, letterSpacing: "0.05em", textTransform: "uppercase" }}>{children}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}</label>;
}

function TextInput({ placeholder, prefix, value, onChange, error }) {
  return (
    <div>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: C.inkDim, fontSize: 14, fontFamily: MONO }}>{prefix}</span>}
        <input placeholder={placeholder} value={value || ""} onChange={e => onChange && onChange(e.target.value)} style={{ width: "100%", border: `1.5px solid ${error ? C.red : C.line}`, borderRadius: 16, padding: prefix ? "15px 18px 15px 70px" : "15px 18px", fontFamily: MONO, fontSize: 15, color: C.ink, background: C.bgSoft, boxSizing: "border-box", outline: "none", transition: "border-color .15s" }} onFocus={e => { e.target.style.borderColor = error ? C.red : C.lemonDeep; }} onBlur={e => { e.target.style.borderColor = error ? C.red : C.line; }} />
      </div>
      {error && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: C.red, fontSize: 12, fontFamily: SANS }}><AlertCircle size={12} />{error}</div>}
    </div>
  );
}

function TextArea({ placeholder, rows = 4, value, onChange, error }) {
  return (
    <div>
      <textarea placeholder={placeholder} rows={rows} value={value || ""} onChange={e => onChange && onChange(e.target.value)} style={{ width: "100%", border: `1.5px solid ${error ? C.red : C.line}`, borderRadius: 16, padding: "16px 18px", fontFamily: SERIF, fontSize: 16.5, color: C.ink, background: C.bgSoft, boxSizing: "border-box", resize: "vertical", outline: "none", lineHeight: 1.5, transition: "border-color .15s" }} onFocus={e => { e.target.style.borderColor = error ? C.red : C.lemonDeep; }} onBlur={e => { e.target.style.borderColor = error ? C.red : C.line; }} />
      {error && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: C.red, fontSize: 12, fontFamily: SANS }}><AlertCircle size={12} />{error}</div>}
    </div>
  );
}

function Dropzone({ label, fileName, onFile }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: `2px dashed ${fileName ? C.lemonDeep : C.line}`, padding: "26px 20px", textAlign: "center", color: fileName ? C.lemonDeep : C.inkDim, fontSize: 13, cursor: "pointer", fontFamily: MONO, borderRadius: 18, background: fileName ? C.lemonSoft : C.bgSoft, transition: "all .2s" }}>
      <input type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f && onFile) onFile(f.name); }} />
      {fileName ? <><Check size={14} /> {fileName}</> : <><Upload size={14} /> {label}</>}
    </label>
  );
}

function VoteBar({ yes, no }) {
  const total = yes + no;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: C.inkDim, marginBottom: 8 }}>
        <span style={{ color: C.green }}>YES {yesPct}%</span>
        <span style={{ color: C.red }}>NO {100 - yesPct}%</span>
      </div>
      <div style={{ height: 8, background: C.bgSoft, borderRadius: 100, overflow: "hidden", display: "flex" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${yesPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ background: C.lemon, borderRadius: "100px 0 0 100px" }} />
        <motion.div initial={{ width: 0 }} animate={{ width: `${100 - yesPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ background: C.red, borderRadius: "0 100px 100px 0" }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, marginTop: 6 }}>{total.toLocaleString()} votes cast</div>
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
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
    <div style={{ padding: "16px 24px 0", position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", background: C.card, borderRadius: 100, boxShadow: "0 4px 24px rgba(28,28,20,0.08)", border: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 20px", flexWrap: "wrap", gap: 10 }}>
        <div onClick={() => setScreen("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartHandshake size={15} color={C.ink} />
          </div>
          <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, color: C.ink, letterSpacing: "-0.01em" }}>Hood Relief</span>
        </div>
        {mobile ? (
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, padding: 8, borderRadius: 100 }}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {links.map(l => (
              <button key={l.id} onClick={() => setScreen(l.id)} style={{ cursor: "pointer", color: screen === l.id ? C.ink : C.inkSoft, background: screen === l.id ? C.lemonSoft : "transparent", padding: "9px 16px", borderRadius: 100, border: "none", fontFamily: SANS, fontSize: 13.5, fontWeight: 700, transition: "all .15s" }}>{l.label}</button>
            ))}
            {loggedIn ? (
              <div onClick={() => setScreen("profile")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "4px 14px 4px 4px", borderRadius: 100, background: screen === "profile" ? C.lemonSoft : "transparent", marginLeft: 4 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: SANS }}>{getInitials(user?.name)}</div>
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.inkSoft }}>{user?.name?.split(" ")[0]}</span>
              </div>
            ) : (
              <Btn onClick={() => setScreen("login")} variant="accent" size="sm" style={{ marginLeft: 6 }}>Sign up</Btn>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {mobile && menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ maxWidth: 1240, margin: "8px auto 0", background: C.card, borderRadius: 24, boxShadow: "0 4px 24px rgba(28,28,20,0.08)", border: `1px solid ${C.lineSoft}`, padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            {links.map(l => (
              <button key={l.id} onClick={() => { setScreen(l.id); setMenuOpen(false); }} style={{ background: screen === l.id ? C.lemonSoft : "transparent", border: "none", borderRadius: 14, padding: "11px 16px", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 700, color: screen === l.id ? C.ink : C.inkSoft, textAlign: "left" }}>{l.label}</button>
            ))}
            {loggedIn
              ? <button onClick={() => { setScreen("profile"); setMenuOpen(false); }} style={{ background: "transparent", border: "none", borderRadius: 14, padding: "11px 16px", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 700, color: C.inkSoft, textAlign: "left" }}>Profile</button>
              : <Btn onClick={() => { setScreen("login"); setMenuOpen(false); }} variant="accent" full style={{ marginTop: 6 }}>Sign up</Btn>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
function HomeScreen({ setScreen, requests, ledger, loggedIn }) {
  const w = useWidth();
  const mobile = w < 768;
  const activeCount = requests.filter(r => r.status === "Open").length;
  const totalReleased = ledger.reduce((s, r) => s + r.amount, 0);

  return (
    <motion.div {...fade}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: mobile ? "56px 20px 40px" : "72px 32px 50px", textAlign: "center" }}>
        <Label center>Community-funded · Robinhood Chain</Label>
        <h1 style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink, margin: "10px 0 0", fontSize: mobile ? 40 : "clamp(40px,6vw,72px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>
          Whatever happened,<br /><span style={{ fontStyle: "italic", color: C.lemonDeep }}>the hood</span> shows up.
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.6, color: C.inkSoft, maxWidth: 520, margin: "24px auto 0" }}>
          A community relief pool for real people in real trouble — crypto losses, medical bills, disasters, job loss, anything at all.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="accent" onClick={() => setScreen(loggedIn ? "submit" : "login")} size="lg">
            {loggedIn ? "File a request" : "Create your profile"} <ArrowRight size={16} />
          </Btn>
          <Btn variant="ghost" onClick={() => setScreen("votes")} size="lg">See open cases</Btn>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px 64px" : "0 32px 80px" }}>
        <Card style={{ padding: mobile ? 24 : 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 24, marginBottom: 28 }}>
            {[["Pool balance", "$84,200"], ["Total released", `$${totalReleased.toLocaleString()}`], ["Open cases", String(activeCount)], ["Members", "1,842"]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim, marginBottom: 8 }}>{k}</div>
                <div style={{ fontFamily: SERIF, fontSize: mobile ? 22 : 28, color: C.ink, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 8, background: C.bgSoft, borderRadius: 100, overflow: "hidden", marginBottom: 28 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} style={{ height: "100%", background: C.lemon, borderRadius: 100 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3,1fr)" : "repeat(5,1fr)", gap: 10 }}>
            {CATEGORIES.map(c => {
              const Icon = CAT_ICON[c];
              return (
                <div key={c} onClick={() => setScreen("categories")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px", borderRadius: 18, background: C.bgSoft, cursor: "pointer", textAlign: "center" }}>
                  <Icon size={18} color={C.lemonDeep} />
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: C.ink }}>{c}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px 64px" : "0 32px 80px" }}>
        <Label>From the community</Label>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 26 : 32, color: C.ink, margin: "16px 0 28px", letterSpacing: "-0.02em" }}>People who've been through it.</h2>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 18 }}>
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} style={{ padding: 26 }}>
              <Quote size={18} color={C.lemon} style={{ marginBottom: 14 }} />
              <p style={{ fontFamily: SERIF, fontSize: 16, color: C.ink, lineHeight: 1.55, fontStyle: "italic", marginBottom: 18 }}>{t.quote}</p>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.ink }}>{t.name}</div>
              <div style={{ marginTop: 8 }}><CatTag cat={t.cat} /></div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ background: C.bgSoft, padding: "72px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px" : "0 32px" }}>
          <Label>How it works</Label>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 26 : 32, color: C.ink, margin: "16px 0 32px", letterSpacing: "-0.02em" }}>Five steps. The same, every time.</h2>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {[["01", "Create a profile", "Sign up, connect your wallet, add your name, location, and photo."], ["02", "Tell your story", "Choose a category and describe what happened, in your own words."], ["03", "Attach what you have", "Upload documents, receipts, photographs — or a transaction hash."], ["04", "Community votes", "Every connected wallet gets one vote on every case."], ["05", "A person signs off", "Someone confirms the outcome and sends funds by hand."]].map(([n, title, desc]) => (
              <Card key={n} style={{ padding: 24, minWidth: 220, flexShrink: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.lemonDeep, marginBottom: 14, fontWeight: 700 }}>{n}</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "64px 20px" : "80px 32px" }}>
        <Card style={{ padding: mobile ? 28 : 44 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
            <div style={{ flex: "1 1 320px" }}>
              <Label>Why not automate it</Label>
              <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 24 : 30, color: C.ink, margin: "16px 0", letterSpacing: "-0.02em" }}>A human signature is the safeguard.</h2>
              <p style={{ fontFamily: SANS, fontSize: 15, color: C.inkSoft, lineHeight: 1.7, maxWidth: 440 }}>A contract that auto-pays on a vote is also a contract that can be exploited. Keeping a person in the loop gives the pool a real backstop.</p>
            </div>
            <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
              {["Every request and every vote is visible to anyone, in real time.", "The team can follow the vote outcome or hold a payout for review — never override it.", "Every completed payout is published on the public ledger."].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: C.bgSoft, padding: 18, borderRadius: 16 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.lemonDeep, fontWeight: 700, flexShrink: 0 }}>0{i + 1}</span>
                  <p style={{ fontFamily: SANS, fontSize: 13.5, color: C.ink, lineHeight: 1.55, margin: 0 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px 72px" : "0 32px 90px" }}>
        <div style={{ background: C.ink, borderRadius: 32, padding: mobile ? "48px 28px" : "70px 48px", textAlign: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 34, color: C.bg, marginBottom: 24, letterSpacing: "-0.02em" }}>
            Something happened. <span style={{ fontStyle: "italic", color: C.lemon }}>Tell us.</span>
          </h2>
          <Btn variant="accent" size="lg" onClick={() => setScreen(loggedIn ? "submit" : "login")}>
            {loggedIn ? "File a request" : "Create your profile"} <ArrowRight size={16} />
          </Btn>
        </div>
      </div>
    </motion.div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ setScreen, onLogin }) {
  const [mode, setMode] = useState("signup");
  const [walletConnected, setWalletConnected] = useState(false);
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const w = useWidth();
  const mobile = w < 768;

  function handleConnect() {
    const wAddr = generateWallet();
    setWallet(wAddr);
    setWalletConnected(true);
    toast.success("Wallet connected");
  }

  function handleSubmit() {
    if (!walletConnected) { toast.error("Connect your wallet first"); return; }
    if (mode === "signup" && !name.trim()) { toast.error("Name is required"); return; }
    onLogin({ name: name.trim() || "Anon", location: location.trim() || "Unknown", wallet, bio: bio.trim(), totalReceived: 0, totalDonated: 0, requests: [] });
    toast.success(mode === "signup" ? "Profile created" : "Logged in");
    setScreen("profile");
  }

  return (
    <motion.div {...fade} style={{ maxWidth: 560, margin: "0 auto", padding: mobile ? "50px 20px 80px" : "70px 32px 100px" }}>
      <Label center>{mode === "signup" ? "Create your profile" : "Welcome back"}</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 30 : 38, color: C.ink, margin: "16px 0 12px", letterSpacing: "-0.02em", textAlign: "center" }}>
        {mode === "signup" ? "Set up your profile" : "Log in"}
      </h1>
      <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 15, marginBottom: 36, lineHeight: 1.6, textAlign: "center" }}>
        A wallet connection is required so relief can reach you directly.
      </p>

      <Card style={{ padding: mobile ? 24 : 36 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 28, background: C.bgSoft, borderRadius: 100, padding: 5 }}>
          <button onClick={() => setMode("signup")} style={{ flex: 1, padding: 10, borderRadius: 100, border: "none", background: mode === "signup" ? C.ink : "transparent", color: mode === "signup" ? C.bg : C.inkSoft, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: SANS }}>Sign up</button>
          <button onClick={() => setMode("login")} style={{ flex: 1, padding: 10, borderRadius: 100, border: "none", background: mode === "login" ? C.ink : "transparent", color: mode === "login" ? C.bg : C.inkSoft, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: SANS }}>Log in</button>
        </div>

        <button onClick={handleConnect} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px", borderRadius: 16, border: `1.5px solid ${walletConnected ? C.lemonDeep : C.line}`, background: walletConnected ? C.lemonSoft : C.bgSoft, color: walletConnected ? C.lemonDeep : C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20, fontFamily: SANS }}>
          {walletConnected ? <Check size={16} /> : <Wallet size={16} />}
          {walletConnected ? `Wallet connected — ${wallet}` : "Connect wallet"}
        </button>

        {mode === "signup" && (
          <>
            <FieldLabel required>Full name</FieldLabel>
            <TextInput placeholder="e.g. Marcus Ade" value={name} onChange={setName} />
            <FieldLabel>Location</FieldLabel>
            <TextInput placeholder="City, Country" value={location} onChange={setLocation} />
            <FieldLabel>Profile photo</FieldLabel>
            <div style={{ marginTop: 4 }}><Dropzone label="Upload a photo" fileName={photo} onFile={setPhoto} /></div>
            <FieldLabel>Short bio</FieldLabel>
            <TextArea placeholder="A line or two about you..." rows={2} value={bio} onChange={setBio} />
          </>
        )}

        <Btn full variant="accent" onClick={handleSubmit} style={{ marginTop: 28 }}>
          {mode === "signup" ? "Create profile" : "Log in"} <ArrowRight size={14} />
        </Btn>
      </Card>
    </motion.div>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────
function ProfileScreen({ user, setScreen, onLogout }) {
  const w = useWidth();
  const mobile = w < 768;
  return (
    <motion.div {...fade} style={{ maxWidth: 880, margin: "0 auto", padding: mobile ? "50px 20px 80px" : "70px 32px 100px" }}>
      <Card style={{ padding: mobile ? 24 : 36, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.ink, flexShrink: 0 }}>{getInitials(user.name)}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 24 : 28, color: C.ink, letterSpacing: "-0.02em" }}>{user.name}</h1>
            <div style={{ display: "flex", gap: 18, marginTop: 8, flexWrap: "wrap", fontSize: 13, color: C.inkSoft, fontFamily: SANS }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {user.location}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO }}><Wallet size={13} /> {user.wallet}</span>
            </div>
          </div>
        </div>
        {user.bio && <p style={{ color: C.inkSoft, fontSize: 14.5, lineHeight: 1.6, marginTop: 20, fontFamily: SANS }}>{user.bio}</p>}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Card style={{ padding: 26 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Total received</div>
          <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: C.ink }}>${user.totalReceived.toLocaleString()}</div>
        </Card>
        <Card style={{ padding: 26 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Total donated</div>
          <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: C.ink }}>${user.totalDonated.toLocaleString()}</div>
        </Card>
      </div>

      {user.requests.length > 0 && (
        <>
          <Label>Request history</Label>
          <div style={{ marginTop: 16 }}>
            {user.requests.map(r => (
              <Card key={r.id} style={{ padding: 22, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <CatTag cat={r.category} />
                    <span style={{ color: C.ink, fontSize: 15, fontWeight: 600, fontFamily: SERIF }}>{r.title}</span>
                  </div>
                  <StatusPill status={r.status} daysLeft={r.daysLeft} />
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 14, fontSize: 12.5, fontFamily: MONO, color: C.inkSoft }}>
                  <span>${r.amount.toLocaleString()} requested</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
        <Btn variant="accent" onClick={() => setScreen("submit")}>File a new request <Plus size={14} /></Btn>
        <Btn variant="ghost" onClick={() => { onLogout(); setScreen("home"); }}>Log out <LogOut size={14} /></Btn>
      </div>
    </motion.div>
  );
}

// ─── SubmitScreen ─────────────────────────────────────────────────────────────
function SubmitScreen({ user, onSubmit, setScreen }) {
  const [cat, setCat] = useState("Crypto Loss");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [amount, setAmount] = useState("");
  const [walletAddr, setWalletAddr] = useState(user?.wallet || "");
  const [txHash, setTxHash] = useState("");
  const [evidence, setEvidence] = useState("");
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

  function handleSubmit() {
    if (!validate()) { toast.error("Fix the errors above"); return; }
    const req = {
      id: Date.now(),
      name: user.name,
      wallet: walletAddr,
      location: user.location,
      category: cat,
      title: title.trim(),
      story: story.trim(),
      amount: parseFloat(amount),
      status: "Open",
      daysLeft: 5,
      yesVotes: 0,
      noVotes: 0,
      votesCast: 0,
      evidence: evidence || "None",
      txHash: cat === "Crypto Loss" ? txHash : null,
    };
    onSubmit(req);
    setSubmitted(true);
    toast.success("Request filed successfully");
  }

  if (submitted) {
    return (
      <motion.div {...fade} style={{ maxWidth: 560, margin: "0 auto", padding: "120px 32px", textAlign: "center" }}>
        <Card style={{ padding: 44 }}>
          <Check size={26} color={C.lemonDeep} style={{ marginBottom: 16 }} />
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 28, color: C.ink, marginBottom: 10 }}>Filed.</h1>
          <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>Your request is now open for community voting.</p>
          <Btn variant="accent" onClick={() => setScreen("votes")}>View open cases</Btn>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...fade} style={{ maxWidth: 580, margin: "0 auto", padding: mobile ? "50px 20px 100px" : "70px 32px 120px" }}>
      <Label center>File a request</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 34, color: C.ink, margin: "16px 0 30px", letterSpacing: "-0.02em", textAlign: "center" }}>Put your case on the record.</h1>

      <Card style={{ padding: mobile ? 24 : 34 }}>
        <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 26, background: C.bgSoft, padding: 16, borderRadius: 16, fontFamily: SANS }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 2, color: C.lemonDeep }} />
          Filing does not guarantee funding. Every case is decided by community vote and confirmed manually.
        </div>

        <FieldLabel required>Category</FieldLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {CATEGORIES.map(c => <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>)}
        </div>

        <FieldLabel required>Title</FieldLabel>
        <TextInput placeholder="Short summary of your case" value={title} onChange={setTitle} error={errors.title} />

        <FieldLabel required>Wallet address (for payout)</FieldLabel>
        <TextInput placeholder="0x..." value={walletAddr} onChange={setWalletAddr} error={errors.wallet} />

        <FieldLabel required>Amount requested</FieldLabel>
        <TextInput placeholder="2,500" prefix="$" value={amount} onChange={setAmount} error={errors.amount} />

        <FieldLabel required>What happened</FieldLabel>
        <TextArea placeholder="Describe your situation clearly — what happened, when, and what this would help cover." value={story} onChange={setStory} error={errors.story} />

        {cat === "Crypto Loss" && (
          <>
            <FieldLabel>Transaction hash</FieldLabel>
            <TextInput placeholder="0x..." value={txHash} onChange={setTxHash} />
          </>
        )}

        <FieldLabel>Supporting evidence</FieldLabel>
        <div style={{ marginTop: 4 }}><Dropzone label="Upload photos, documents, receipts" fileName={evidence} onFile={setEvidence} /></div>

        <Btn full variant="accent" onClick={handleSubmit} style={{ marginTop: 30 }}>Submit for community vote <ArrowRight size={14} /></Btn>
      </Card>
    </motion.div>
  );
}

// ─── VoteCard ─────────────────────────────────────────────────────────────────
function VoteCard({ c, onVote, loggedIn }) {
  const [voted, setVoted] = useState(null);
  const open = c.status === "Open";
  const w = useWidth();
  const mobile = w < 768;

  function handleVote(choice) {
    if (!loggedIn) { toast.error("Connect a wallet to vote"); return; }
    setVoted(choice);
    if (onVote) onVote(c.id, choice);
    toast.success(`Voted ${choice}`);
  }

  return (
    <Card style={{ padding: mobile ? 22 : 28, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
        <div>
          <CatTag cat={c.category} />
          <h3 style={{ fontFamily: SERIF, fontSize: mobile ? 18 : 21, color: C.ink, fontWeight: 500, marginTop: 10, marginBottom: 6 }}>{c.name}</h3>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.inkDim, fontFamily: MONO, flexWrap: "wrap" }}>
            <span>{c.wallet}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{c.location}</span>
          </div>
        </div>
        <StatusPill status={c.status} daysLeft={c.daysLeft} />
      </div>

      <p style={{ fontFamily: SERIF, fontSize: 16, color: C.inkSoft, lineHeight: 1.6, fontStyle: "italic", margin: "0 0 22px" }}>"{c.story}"</p>

      <div style={{ display: "flex", gap: mobile ? 16 : 32, marginBottom: 22, flexWrap: "wrap", background: C.bgSoft, padding: 18, borderRadius: 16 }}>
        <div><div style={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, textTransform: "uppercase", marginBottom: 6 }}>Requested</div><div style={{ fontFamily: SERIF, fontSize: 19, color: C.ink, fontWeight: 500 }}>${c.amount.toLocaleString()}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, textTransform: "uppercase", marginBottom: 6 }}>Votes cast</div><div style={{ fontFamily: SERIF, fontSize: 19, color: C.ink, fontWeight: 500 }}>{c.votesCast}</div></div>
        <div><div style={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, textTransform: "uppercase", marginBottom: 6 }}>Evidence</div><div style={{ fontFamily: SANS, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{c.evidence}</div></div>
      </div>

      {open && (
        <>
          <VoteBar yes={c.yesVotes} no={c.noVotes} />
          <div style={{ marginTop: 16 }}>
            {voted ? (
              <div style={{ fontSize: 13, color: C.lemonDeep, fontFamily: MONO, fontWeight: 700 }}>✓ You voted {voted}</div>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                <Btn variant="accent" onClick={() => handleVote("Yes")} size="sm">Vote Yes</Btn>
                <Btn variant="ghost" onClick={() => handleVote("No")} size="sm">Vote No</Btn>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

// ─── VotesScreen ──────────────────────────────────────────────────────────────
function VotesScreen({ requests, onVote, loggedIn }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? requests : requests.filter(c => c.category === filter);
  const w = useWidth();
  const mobile = w < 768;

  return (
    <motion.div {...fade} style={{ maxWidth: 760, margin: "0 auto", padding: mobile ? "50px 20px 80px" : "70px 32px 100px" }}>
      <Label center>Open cases</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 36, color: C.ink, margin: "16px 0 12px", letterSpacing: "-0.02em", textAlign: "center" }}>Cases awaiting the community.</h1>
      <p style={{ color: C.inkSoft, fontSize: 14.5, marginBottom: 28, fontFamily: SANS, textAlign: "center" }}>Connect any wallet to vote. One wallet, one vote — always.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, justifyContent: "center" }}>
        {["All", ...CATEGORIES].map(c => <Pill key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Pill>)}
      </div>
      {filtered.length === 0 && <p style={{ textAlign: "center", color: C.inkDim, fontFamily: SANS, marginTop: 40 }}>No cases in this category yet.</p>}
      {filtered.map(c => <VoteCard key={c.id} c={c} onVote={onVote} loggedIn={loggedIn} />)}
    </motion.div>
  );
}

// ─── CategoriesScreen ─────────────────────────────────────────────────────────
function CategoriesScreen({ setScreen }) {
  const w = useWidth();
  const mobile = w < 768;
  const descriptions = {
    "Medical": "Bills, treatment, and care costs insurance won't cover.",
    "Crypto Loss": "Rug pulls, exploits, phishing, and wallet drains on-chain.",
    "Disaster": "Fire, flood, storm damage, and sudden displacement.",
    "Job Loss": "Bridging support after redundancy or sudden income loss.",
    "Other": "Anything real that doesn't fit neatly into a category.",
  };
  return (
    <motion.div {...fade} style={{ maxWidth: 800, margin: "0 auto", padding: mobile ? "50px 20px 80px" : "70px 32px 100px" }}>
      <Label center>Categories</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 36, color: C.ink, margin: "16px 0 12px", letterSpacing: "-0.02em", textAlign: "center" }}>Whatever kind of trouble it is.</h1>
      <p style={{ color: C.inkSoft, fontSize: 14.5, marginBottom: 36, fontFamily: SANS, textAlign: "center" }}>These are starting points — the "what happened" field is always open text.</p>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {CATEGORIES.map(c => {
          const Icon = CAT_ICON[c];
          return (
            <Card key={c} onClick={() => setScreen("submit")} style={{ padding: 24, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: C.lemonSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={C.lemonDeep} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: SERIF, fontSize: 18, color: C.ink, fontWeight: 500, marginBottom: 4 }}>{c}</h3>
                  <p style={{ fontFamily: SANS, fontSize: 13, color: C.inkSoft, margin: 0 }}>{descriptions[c]}</p>
                </div>
                <ArrowRight size={16} color={C.inkDim} />
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── LedgerScreen ─────────────────────────────────────────────────────────────
function LedgerScreen({ ledger }) {
  const w = useWidth();
  const mobile = w < 768;
  return (
    <motion.div {...fade} style={{ maxWidth: 900, margin: "0 auto", padding: mobile ? "50px 20px 80px" : "70px 32px 100px" }}>
      <Label center>Public ledger</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 36, color: C.ink, margin: "16px 0 12px", letterSpacing: "-0.02em", textAlign: "center" }}>Relief already released.</h1>
      <p style={{ color: C.inkSoft, fontSize: 14.5, marginBottom: 32, fontFamily: SANS, textAlign: "center" }}>Every entry cleared a community vote and was confirmed and paid out by hand.</p>
      {ledger.map((r, i) => (
        <Card key={i} style={{ padding: 22, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 12.5, color: C.inkSoft, marginBottom: 8 }}>{r.wallet}</div>
              <CatTag cat={r.category} />
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, fontWeight: 500 }}>${r.amount.toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, gap: 14, flexWrap: "wrap" }}>
            <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5, maxWidth: 460 }}>{r.note}</div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkDim, whiteSpace: "nowrap" }}>{r.date}</div>
          </div>
        </Card>
      ))}
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

  function handleLogin(userData) {
    setUser(userData);
    setLoggedIn(true);
  }

  function handleLogout() {
    setUser(null);
    setLoggedIn(false);
  }

  function handleSubmitRequest(req) {
    setRequests(prev => [req, ...prev]);
    if (user) {
      setUser(prev => ({ ...prev, requests: [...(prev.requests || []), req] }));
    }
  }

  function handleVote(requestId, choice) {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          yesVotes: choice === "Yes" ? r.yesVotes + 1 : r.yesVotes,
          noVotes: choice === "No" ? r.noVotes + 1 : r.noVotes,
          votesCast: r.votesCast + 1,
        };
      }
      return r;
    }));
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS }}>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: SANS, fontSize: 13, borderRadius: 14 } }} />
      <NavBar screen={screen} setScreen={setScreen} loggedIn={loggedIn} user={user} />
      <AnimatePresence mode="wait">
        {screen === "home" && <HomeScreen key="home" setScreen={setScreen} requests={requests} ledger={ledger} loggedIn={loggedIn} />}
        {screen === "login" && <LoginScreen key="login" setScreen={setScreen} onLogin={handleLogin} />}
        {screen === "profile" && user && <ProfileScreen key="profile" user={user} setScreen={setScreen} onLogout={handleLogout} />}
        {screen === "submit" && <SubmitScreen key="submit" user={user || { name: "Anon", wallet: "", location: "" }} onSubmit={handleSubmitRequest} setScreen={setScreen} />}
        {screen === "votes" && <VotesScreen key="votes" requests={requests} onVote={handleVote} loggedIn={loggedIn} />}
        {screen === "categories" && <CategoriesScreen key="cats" setScreen={setScreen} />}
        {screen === "ledger" && <LedgerScreen key="ledger" ledger={ledger} />}
      </AnimatePresence>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px 50px" }}>
        <p style={{ fontSize: 11, color: C.inkDim, lineHeight: 1.7, fontFamily: MONO, textAlign: "center" }}>
          Hood Relief Bot is a community mutual-aid pool, not a financial institution, insurer, or guaranteed refund service. Filing a request does not guarantee funding. All releases are decided by community vote and confirmed manually.
        </p>
      </div>
    </div>
  );
}
