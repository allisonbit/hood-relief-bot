import React, { useState, useEffect } from "react";
import {
  Wallet, MapPin, Upload, Check, ShieldCheck, ArrowUpRight, ArrowRight,
  HeartHandshake, Users, Vote, Landmark, Sparkles, Quote, AlertCircle,
} from "lucide-react";

// ---------- Palette: cream paper + lemon green, one accent, warm ink ----------
const C = {
  bg: "#F7F4E9",
  bgSoft: "#F0EBD8",
  card: "#FDFCF5",
  line: "rgba(28,28,20,0.12)",
  lineSoft: "rgba(28,28,20,0.07)",
  lemon: "#C4E538",
  lemonDeep: "#8FAE1F",
  ink: "#1C1C14",
  inkSoft: "rgba(28,28,20,0.64)",
  inkDim: "rgba(28,28,20,0.38)",
  red: "#C2492F",
};

const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// ---------- Hooks ----------
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return w;
}

// ---------- Helpers ----------
function getInitials(name) {
  if (!name) return "??";
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function generateWallet() {
  const hex = "0123456789ABCDEFabcdef";
  const pick = () => Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * hex.length)]).join("");
  return `0x${pick()}...${pick()}`;
}

function parseAmount(str) {
  const n = parseFloat(String(str).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatDate() {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- Data ----------
const CATEGORIES = ["Medical", "Crypto Loss", "Disaster", "Job Loss", "Other"];

const INITIAL_REQUESTS = [
  {
    id: 1, name: "Marcus Ade", wallet: "0x91Fa...4C2d", location: "Manchester, UK",
    category: "Crypto Loss", status: "Open", daysLeft: 2,
    story: "Lost my savings in a fake liquidity pool after trusting a promoted link. I have the transaction hash and the contract that pulled the funds. Asking for enough to cover rent this month.",
    amount: 3200, yesVotes: 322, noVotes: 90, evidence: "Transaction hash + 2 images",
  },
  {
    id: 2, name: "Priya N.", wallet: "0x3Bc7...A190", location: "Leicester, UK",
    category: "Medical", status: "Open", daysLeft: 4,
    story: "My daughter needs a course of physiotherapy after an accident that our insurance won't fully cover. Attaching the clinic invoice and referral letter.",
    amount: 1450, yesVotes: 237, noVotes: 23, evidence: "Invoice + referral letter",
  },
  {
    id: 3, name: "Femi O.", wallet: "0x7A44...6E19", location: "Lagos, Nigeria",
    category: "Disaster", status: "Under review", daysLeft: null,
    story: "Flooding damaged our shop's stock two weeks ago. Requesting partial relief to restock essentials. Photos attached.",
    amount: 800, yesVotes: 0, noVotes: 0, evidence: "6 photographs",
  },
];

const INITIAL_LEDGER = [
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

const CAT_ICON = { Medical: HeartHandshake, "Crypto Loss": Landmark, Disaster: Sparkles, "Job Loss": Users, Other: Vote };

// ---------- Primitives ----------
function Label({ children }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
      color: C.lemonDeep, marginBottom: 22, display: "flex", alignItems: "center", gap: 10, fontWeight: 600,
    }}>
      <span style={{ width: 22, height: 2, background: C.lemon }} />
      {children}
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, style, full, type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: SANS, fontWeight: 600, fontSize: 14.5,
    padding: "16px 30px", borderRadius: 2, border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s ease", letterSpacing: "-0.01em",
    width: full ? "100%" : undefined,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: C.ink, color: C.bg },
    accent: { background: C.lemon, color: C.ink },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (disabled) return; if (variant === "primary") e.currentTarget.style.background = C.lemonDeep; if (variant === "ghost") e.currentTarget.style.borderColor = C.ink; }}
      onMouseLeave={e => { if (disabled) return; if (variant === "primary") e.currentTarget.style.background = C.ink; if (variant === "ghost") e.currentTarget.style.borderColor = C.line; }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, ...style }}>{children}</div>;
}

function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: "block", fontSize: 12, fontWeight: 600, color: C.inkSoft,
      marginBottom: 10, marginTop: 26, fontFamily: MONO, letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      {children}
      {required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
    </label>
  );
}

function TextInput({ placeholder, prefix, value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          color: C.inkDim, fontSize: 15, fontFamily: MONO,
        }}>{prefix}</span>
      )}
      <input
        placeholder={placeholder}
        value={value || ""}
        onChange={e => onChange && onChange(e.target.value)}
        style={{
          width: "100%", border: "none", borderBottom: `1.5px solid ${C.line}`,
          padding: prefix ? "12px 0 12px 80px" : "12px 0", fontFamily: MONO, fontSize: 16,
          color: C.ink, background: "transparent", boxSizing: "border-box", outline: "none",
        }}
      />
    </div>
  );
}

function TextArea({ placeholder, rows = 4, value, onChange }) {
  return (
    <textarea
      placeholder={placeholder}
      rows={rows}
      value={value || ""}
      onChange={e => onChange && onChange(e.target.value)}
      style={{
        width: "100%", border: "none", borderBottom: `1.5px solid ${C.line}`,
        padding: "12px 0", fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: C.ink,
        background: "transparent", boxSizing: "border-box", resize: "vertical", outline: "none", lineHeight: 1.5,
      }}
    />
  );
}

function Dropzone({ label, fileName, onFile }) {
  const hasFile = !!fileName;
  return (
    <label style={{
      border: `1.5px dashed ${hasFile ? C.lemonDeep : C.line}`,
      padding: "28px 20px", textAlign: "center",
      color: hasFile ? C.lemonDeep : C.inkDim, fontSize: 13, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      fontFamily: MONO, borderRadius: 8,
      background: hasFile ? "rgba(196,229,56,0.06)" : "transparent",
      transition: "all .2s ease",
    }}>
      <input
        type="file"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && onFile) onFile(file.name);
        }}
      />
      {hasFile ? <><Check size={14} /> {fileName}</> : <><Upload size={14} /> {label}</>}
    </label>
  );
}

function CatTag({ cat }) {
  const Icon = CAT_ICON[cat] || Vote;
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
      color: C.inkSoft, display: "inline-flex", alignItems: "center", gap: 6,
    }}><Icon size={12} color={C.lemonDeep} />{cat}</span>
  );
}

function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      color: C.red, fontSize: 12, fontFamily: SANS, marginTop: 8,
    }}>
      <AlertCircle size={13} /> {children}
    </div>
  );
}

// ---------- Nav ----------
function NavBar({ screen, setScreen, loggedIn, user }) {
  const w = useWindowWidth();
  const compact = w < 640;
  const initials = user ? getInitials(user.name) : "??";

  const links = [
    { id: "votes", label: "Votes" },
    { id: "ledger", label: "Ledger" },
    { id: "categories", label: "Categories" },
    ...(loggedIn ? [{ id: "submit", label: "Request" }] : []),
  ];

  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, background: C.bg, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: compact ? "16px 20px" : "24px 48px", maxWidth: 1280, margin: "0 auto", flexWrap: "wrap", gap: 16,
      }}>
        <div onClick={() => setScreen("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: C.lemon, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartHandshake size={16} color={C.ink} />
          </div>
          <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: C.ink, letterSpacing: "-0.01em" }}>Hood Relief</span>
        </div>
        <div style={{ display: "flex", gap: compact ? 16 : 34, alignItems: "center", fontSize: 13.5, fontFamily: SANS, fontWeight: 600, flexWrap: "wrap" }}>
          {links.map(l => (
            <div key={l.id} onClick={() => setScreen(l.id)} style={{
              cursor: "pointer", color: screen === l.id ? C.ink : C.inkSoft,
              borderBottom: screen === l.id ? `2px solid ${C.lemon}` : "2px solid transparent", paddingBottom: 4,
            }}>{l.label}</div>
          ))}
          {loggedIn ? (
            <div onClick={() => setScreen("profile")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: C.lemon,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: SANS,
              }}>{initials}</div>
              {!compact && <span style={{ color: screen === "profile" ? C.ink : C.inkSoft }}>Profile</span>}
            </div>
          ) : (
            <Btn onClick={() => setScreen("login")} variant="primary" style={{ padding: "10px 22px", fontSize: 13 }}>Sign up</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Screens ----------

function HomeScreen({ setScreen, requests, ledger, loggedIn }) {
  const w = useWindowWidth();
  const mobile = w < 768;
  const pad = mobile ? "20px" : "48px";
  const activeCount = requests.filter(r => r.status === "Open").length;
  const totalReleased = ledger.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      {/* Hero */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: `${mobile ? 60 : 100}px ${pad} 70px` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 40 : 60, alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 400px", minWidth: 280 }}>
            <Label>$RELIEF on Robinhood Chain</Label>
            <h1 style={{
              fontFamily: SERIF, fontWeight: 500, color: C.ink, margin: 0,
              fontSize: mobile ? 40 : "clamp(44px,6.4vw,92px)", lineHeight: 0.98, letterSpacing: "-0.03em",
            }}>
              Whatever happened,<br />
              <span style={{ fontStyle: "italic", color: C.lemonDeep }}>the hood</span> shows up.
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 18, lineHeight: 1.6, color: C.inkSoft, maxWidth: 520, marginTop: 32 }}>
              A community relief pool for real people in real trouble — crypto losses, medical bills, disasters, job loss, anything at all. One wallet, one vote. Every release confirmed by hand.
            </p>
            <div style={{ display: "flex", gap: 18, marginTop: 40, alignItems: "center", flexWrap: "wrap" }}>
              <Btn variant="accent" onClick={() => setScreen(loggedIn ? "submit" : "login")}>
                {loggedIn ? "File a request" : "Create your profile"} <ArrowRight size={16} />
              </Btn>
              <div onClick={() => setScreen("votes")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.inkSoft, fontFamily: SANS, fontSize: 14.5, fontWeight: 600 }}>
                See open cases <ArrowUpRight size={15} />
              </div>
            </div>
          </div>
          <div style={{ flex: "0 1 380px", minWidth: 280 }}>
            <Card style={{ padding: 28 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkDim, marginBottom: 10 }}>Pool balance — live</div>
              <div style={{ fontFamily: SERIF, fontSize: mobile ? 32 : 42, color: C.ink, fontWeight: 500, letterSpacing: "-0.02em" }}>
                84,200<span style={{ fontFamily: MONO, fontSize: 14, color: C.lemonDeep, marginLeft: 10 }}>$RELIEF</span>
              </div>
              <div style={{ height: 8, background: C.bgSoft, borderRadius: 100, margin: "18px 0 16px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "64%", background: C.lemon, borderRadius: 100 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                {[
                  ["Active cases", String(activeCount)],
                  ["Members", "1,842"],
                  ["Total released", `${totalReleased.toLocaleString()} $RELIEF`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: SANS }}>
                    <span style={{ color: C.inkSoft }}>{k}</span><span style={{ color: C.ink, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Category strip */}
      <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.bgSoft }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: `36px ${pad}`,
          display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20,
        }}>
          {CATEGORIES.map(c => {
            const Icon = CAT_ICON[c];
            return (
              <div key={c} onClick={() => setScreen("categories")} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                padding: "0 12px", textAlign: "center", cursor: "pointer",
              }}>
                <Icon size={20} color={C.lemonDeep} />
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.ink }}>{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Process — editorial list */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: `100px ${pad}` }}>
        <Label>How it works</Label>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 40, color: C.ink, marginBottom: 56, letterSpacing: "-0.02em" }}>Five steps. The same, every time.</h2>
        {[
          ["01", "Create a profile", "Sign up, connect your wallet, add your name, your location, and a photo. This is who the community will see and vote on."],
          ["02", "Tell your story", "Choose a category and describe what happened, in your own words. Specific, honest requests get more attention."],
          ["03", "Attach what you have", "Upload whatever supports your case — documents, receipts, photographs. Crypto losses can include a transaction hash."],
          ["04", "The community votes", "Every wallet holding $RELIEF gets exactly one vote. Holding more tokens never buys more say."],
          ["05", "A person signs off", "When voting closes, someone on the team confirms the outcome and sends the funds by hand."],
        ].map(([n, t, d], i) => (
          <div key={n} style={{
            display: "grid", gridTemplateColumns: mobile ? "40px 1fr" : "80px 1fr", gap: mobile ? 16 : 32,
            padding: "32px 0", borderTop: i === 0 ? `1px solid ${C.line}` : "none", borderBottom: `1px solid ${C.line}`,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 14, color: C.lemonDeep, paddingTop: 4, fontWeight: 700 }}>{n}</span>
            <div>
              <h3 style={{ fontFamily: SERIF, fontSize: mobile ? 18 : 22, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{t}</h3>
              <p style={{ fontFamily: SANS, fontSize: 15, color: C.inkSoft, lineHeight: 1.65, margin: 0, maxWidth: 560 }}>{d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Why manual release */}
      <div style={{ background: C.bgSoft, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: `90px ${pad}`, display: "flex", flexWrap: "wrap", gap: 56 }}>
          <div style={{ flex: "1 1 400px", minWidth: 280 }}>
            <Label>Why not automate it</Label>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 26 : 34, color: C.ink, marginBottom: 18, letterSpacing: "-0.02em" }}>A human signature is the safeguard.</h2>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: C.inkSoft, lineHeight: 1.7, maxWidth: 460 }}>
              A contract that auto-pays on a vote is also a contract that can be exploited or drained by a manipulated proposal. Keeping a person in the loop gives the pool a real backstop, while the vote itself stays fully public and on-chain.
            </p>
          </div>
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              "Every request and every vote is visible to anyone, in real time.",
              "The team can follow the vote outcome or hold a payout for review — never override it.",
              "Every completed payout is published on the public ledger, wallet and amount included.",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 16 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.lemonDeep, fontWeight: 700 }}>0{i + 1}</span>
                <p style={{ fontFamily: SANS, fontSize: 14.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: `100px ${pad}` }}>
        <Label>From the community</Label>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 26 : 36, color: C.ink, marginBottom: 48, letterSpacing: "-0.02em" }}>People who've been through it.</h2>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 28 }}>
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} style={{ padding: 28 }}>
              <Quote size={20} color={C.lemon} style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: SERIF, fontSize: 16.5, color: C.ink, lineHeight: 1.55, fontStyle: "italic", marginBottom: 20 }}>{t.quote}</p>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.ink }}>{t.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{t.cat}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA band */}
      <div style={{ background: C.ink, padding: `80px ${pad}`, textAlign: "center" }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 38, color: C.bg, marginBottom: 20, letterSpacing: "-0.02em" }}>
          Something happened. <span style={{ fontStyle: "italic", color: C.lemon }}>Tell us.</span>
        </h2>
        <Btn variant="accent" onClick={() => setScreen(loggedIn ? "submit" : "login")}>
          {loggedIn ? "File a request" : "Create your profile"} <ArrowRight size={16} />
        </Btn>
      </div>
    </div>
  );
}

function LoginScreen({ setScreen, setLoggedIn, setUser }) {
  const [mode, setMode] = useState("signup");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddr, setWalletAddr] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [errors, setErrors] = useState({});

  function connectWallet() {
    const addr = generateWallet();
    setWalletAddr(addr);
    setWalletConnected(true);
  }

  function validate() {
    const errs = {};
    if (!walletConnected) errs.wallet = "Connect your wallet first.";
    if (mode === "signup") {
      if (!name.trim()) errs.name = "Name is required.";
      if (!location.trim()) errs.location = "Location is required.";
    } else {
      if (!walletConnected) errs.wallet = "Connect your wallet to log in.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (mode === "signup") {
      setUser({
        name: name.trim(),
        location: location.trim(),
        wallet: walletAddr,
        bio: bio.trim() || "No bio yet.",
        photo: photoName,
        totalReceived: 0,
        totalDonated: 0,
      });
    } else {
      // Login — simulate returning user
      setUser({
        name: "Marcus Ade",
        location: "Manchester, UK",
        wallet: walletAddr || "0x91Fa...4C2d",
        bio: "Father of two. Lost my emergency fund to a fake liquidity pool in May. Rebuilding.",
        totalReceived: 1900,
        totalDonated: 350,
      });
    }
    setLoggedIn(true);
    setScreen("profile");
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "90px 48px 120px" }}>
      <Label>{mode === "signup" ? "Create your profile" : "Welcome back"}</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 44, color: C.ink, marginBottom: 16, letterSpacing: "-0.02em" }}>
        {mode === "signup" ? "Set up your profile" : "Log in"}
      </h1>
      <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 15.5, marginBottom: 44, lineHeight: 1.6, maxWidth: 460 }}>
        A wallet connection is required so relief can reach you directly, and so your vote counts.
      </p>

      <div style={{ display: "flex", gap: 32, marginBottom: 36, borderBottom: `1px solid ${C.line}` }}>
        {["signup", "login"].map(m => (
          <div key={m} onClick={() => { setMode(m); setErrors({}); }} style={{
            paddingBottom: 14, cursor: "pointer", fontFamily: SANS, fontSize: 14.5, fontWeight: 700,
            color: mode === m ? C.ink : C.inkDim,
            borderBottom: mode === m ? `2px solid ${C.lemon}` : "2px solid transparent", marginBottom: -1,
          }}>{m === "signup" ? "Sign up" : "Log in"}</div>
        ))}
      </div>

      <button
        onClick={connectWallet}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          padding: "20px 0", border: "none", borderBottom: `1.5px solid ${walletConnected ? C.lemonDeep : C.line}`,
          background: "transparent", color: walletConnected ? C.lemonDeep : C.ink,
          fontWeight: 600, fontSize: 16, cursor: walletConnected ? "default" : "pointer", marginBottom: 12, fontFamily: SANS,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Wallet size={17} />
          {walletConnected ? `Wallet connected — ${walletAddr}` : "Connect wallet"}
        </span>
        {walletConnected ? <Check size={17} /> : <ArrowRight size={17} />}
      </button>
      <ErrorMsg>{errors.wallet}</ErrorMsg>

      {mode === "signup" && (
        <>
          <FieldLabel required>Full name</FieldLabel>
          <TextInput placeholder="e.g. Marcus Ade" value={name} onChange={setName} />
          <ErrorMsg>{errors.name}</ErrorMsg>

          <FieldLabel required>Location</FieldLabel>
          <TextInput placeholder="City, Country" value={location} onChange={setLocation} />
          <ErrorMsg>{errors.location}</ErrorMsg>

          <FieldLabel>Profile photo</FieldLabel>
          <div style={{ marginTop: 4 }}>
            <Dropzone label="Upload a photo" fileName={photoName} onFile={setPhotoName} />
          </div>

          <FieldLabel>Short bio</FieldLabel>
          <TextArea placeholder="A line or two about you..." rows={2} value={bio} onChange={setBio} />
        </>
      )}

      {mode === "login" && (
        <>
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.inkSoft, marginTop: 20, lineHeight: 1.6 }}>
            Connect your wallet above. If your address matches an existing profile, you're in.
          </p>
        </>
      )}

      <Btn full variant="accent" onClick={handleSubmit} style={{ marginTop: 44 }} disabled={!walletConnected}>
        {mode === "signup" ? "Create profile" : "Log in"}
      </Btn>
      <p style={{ fontSize: 12, color: C.inkDim, textAlign: "center", marginTop: 18, fontFamily: MONO }}>
        Sample flow — no real account or wallet connection is created.
      </p>
    </div>
  );
}

function ProfileScreen({ user, setScreen, requests, onLogout }) {
  const w = useWindowWidth();
  const mobile = w < 768;
  const initials = getInitials(user.name);
  const userRequests = requests.filter(r => r.wallet === user.wallet);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: `90px ${mobile ? "20px" : "48px"} 120px` }}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 56 }}>
        <div style={{
          width: 88, height: 88, borderRadius: "50%", background: C.lemon,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: C.ink, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 34, color: C.ink, letterSpacing: "-0.02em" }}>{user.name}</h1>
          <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap", fontSize: 13.5, color: C.inkSoft, fontFamily: SANS }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {user.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO }}><Wallet size={13} /> {user.wallet}</span>
          </div>
          <p style={{ color: C.inkSoft, fontSize: 15, lineHeight: 1.6, marginTop: 16, maxWidth: 460, fontFamily: SANS }}>{user.bio}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: mobile ? 30 : 60, marginBottom: 60, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "30px 0", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Total received</div>
          <div style={{ fontFamily: SERIF, fontSize: mobile ? 24 : 32, fontWeight: 500, color: C.ink }}>
            {(user.totalReceived || 0).toLocaleString()} <span style={{ fontSize: 14, fontFamily: MONO, color: C.lemonDeep, fontWeight: 500 }}>$RELIEF</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Total donated</div>
          <div style={{ fontFamily: SERIF, fontSize: mobile ? 24 : 32, fontWeight: 500, color: C.ink }}>
            {(user.totalDonated || 0).toLocaleString()} <span style={{ fontSize: 14, fontFamily: MONO, color: C.inkSoft, fontWeight: 500 }}>$RELIEF</span>
          </div>
        </div>
      </div>

      <Label>Request history</Label>
      {userRequests.length === 0 && (
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.inkDim, padding: "20px 0" }}>
          You haven't filed any requests yet.
        </p>
      )}
      {userRequests.map(r => {
        const total = r.yesVotes + r.noVotes;
        const yesPct = total > 0 ? Math.round((r.yesVotes / total) * 100) : 0;
        return (
          <div key={r.id} style={{ padding: "22px 0", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <CatTag cat={r.category} />
                <span style={{ color: C.ink, fontSize: 16, fontWeight: 500, fontFamily: SERIF }}>
                  {r.story ? r.story.slice(0, 50) + (r.story.length > 50 ? "..." : "") : r.category + " request"}
                </span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.lemonDeep, fontWeight: 700 }}>{r.status}</span>
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 14, fontSize: 13, fontFamily: MONO, color: C.inkSoft, flexWrap: "wrap" }}>
              <span>{r.amount.toLocaleString()} $RELIEF requested</span>
              <span>{total > 0 ? `${yesPct}% yes` : "No votes yet"}</span>
              {r.daysLeft != null && <span>{r.daysLeft}d left</span>}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 16, marginTop: 36, flexWrap: "wrap" }}>
        <Btn variant="accent" onClick={() => setScreen("submit")}>File a new request</Btn>
        <Btn variant="ghost" onClick={onLogout}>Log out</Btn>
      </div>
    </div>
  );
}

function SubmitScreen({ user, initialCategory, onSubmit, setScreen }) {
  const [cat, setCat] = useState(initialCategory || "Crypto Loss");
  const [walletAddr, setWalletAddr] = useState(user?.wallet || "");
  const [amount, setAmount] = useState("");
  const [story, setStory] = useState("");
  const [txHash, setTxHash] = useState("");
  const [evidenceFile, setEvidenceFile] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Sync if initialCategory changes (e.g. navigating from categories)
  useEffect(() => {
    if (initialCategory) setCat(initialCategory);
  }, [initialCategory]);

  if (!user) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "140px 48px", textAlign: "center" }}>
        <ShieldCheck size={28} color={C.lemonDeep} style={{ marginBottom: 20 }} />
        <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 32, color: C.ink, marginBottom: 12 }}>Create a profile first.</h1>
        <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 15, marginBottom: 30 }}>You need a connected wallet and profile before you can file a request.</p>
        <Btn variant="accent" onClick={() => setScreen("login")}>Sign up <ArrowRight size={16} /></Btn>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "140px 48px", textAlign: "center" }}>
        <Check size={28} color={C.lemonDeep} style={{ marginBottom: 20 }} />
        <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 32, color: C.ink, marginBottom: 12 }}>Filed.</h1>
        <p style={{ fontFamily: SANS, color: C.inkSoft, fontSize: 15, marginBottom: 30 }}>
          Your case is now open for community vote. You can track it from your profile or the votes page.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="accent" onClick={() => setScreen("votes")}>View open cases</Btn>
          <Btn variant="ghost" onClick={() => setScreen("profile")}>Go to profile</Btn>
        </div>
      </div>
    );
  }

  function validate() {
    const errs = {};
    if (!amount.trim() || parseAmount(amount) <= 0) errs.amount = "Enter a valid amount.";
    if (!story.trim()) errs.story = "Describe your situation.";
    if (story.trim().length > 0 && story.trim().length < 20) errs.story = "Please provide more detail (at least 20 characters).";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const newRequest = {
      id: Date.now(),
      name: user.name,
      wallet: user.wallet,
      location: user.location,
      category: cat,
      status: "Open",
      daysLeft: 7,
      story: story.trim(),
      amount: parseAmount(amount),
      yesVotes: 0,
      noVotes: 0,
      evidence: evidenceFile || (txHash.trim() ? "Transaction hash" : "None"),
    };
    onSubmit(newRequest);
    setSubmitted(true);
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "90px 48px 140px" }}>
      <Label>File a request</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 40, color: C.ink, marginBottom: 20, letterSpacing: "-0.02em" }}>Put your case on the record.</h1>
      <div style={{ display: "flex", gap: 10, fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 40, fontFamily: SANS }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 2, color: C.lemonDeep }} />
        Filing does not guarantee funding. Every case is decided by community vote and confirmed manually before release.
      </div>

      <FieldLabel>Category</FieldLabel>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 6 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: "0 0 8px", background: "none", border: "none", cursor: "pointer",
            fontFamily: SANS, fontSize: 14, fontWeight: 700,
            color: cat === c ? C.ink : C.inkDim,
            borderBottom: cat === c ? `2px solid ${C.lemon}` : "2px solid transparent",
          }}>{c}</button>
        ))}
      </div>

      <FieldLabel>Wallet address</FieldLabel>
      <TextInput placeholder="0x..." value={walletAddr} onChange={setWalletAddr} />

      <FieldLabel required>Amount requested</FieldLabel>
      <TextInput placeholder="2,500" prefix="$RELIEF" value={amount} onChange={setAmount} />
      <ErrorMsg>{errors.amount}</ErrorMsg>

      <FieldLabel required>What happened</FieldLabel>
      <TextArea
        placeholder="Describe your situation clearly — what happened, when, and what this would help cover."
        value={story}
        onChange={setStory}
      />
      <ErrorMsg>{errors.story}</ErrorMsg>

      {cat === "Crypto Loss" && (
        <>
          <FieldLabel>Transaction hash — recommended</FieldLabel>
          <TextInput placeholder="0x..." value={txHash} onChange={setTxHash} />
        </>
      )}

      <FieldLabel>Supporting evidence — optional</FieldLabel>
      <div style={{ marginTop: 4 }}>
        <Dropzone
          label="Upload whatever you have — photos, documents, receipts"
          fileName={evidenceFile}
          onFile={setEvidenceFile}
        />
      </div>

      <Btn full variant="accent" onClick={handleSubmit} style={{ marginTop: 44 }}>Submit for community vote</Btn>
    </div>
  );
}

function VoteCard({ c, userVote, onVote, loggedIn, setScreen }) {
  const open = c.status === "Open";
  const total = c.yesVotes + c.noVotes;
  const yesPct = total > 0 ? Math.round((c.yesVotes / total) * 100) : 0;
  const noPct = total > 0 ? 100 - yesPct : 0;

  return (
    <div style={{ padding: "36px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
        <div>
          <CatTag cat={c.category} />
          <h3 style={{ fontFamily: SERIF, fontSize: 23, color: C.ink, fontWeight: 500, marginTop: 8, marginBottom: 6 }}>{c.name}</h3>
          <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: C.inkDim, fontFamily: MONO, flexWrap: "wrap" }}>
            <span>{c.wallet}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{c.location}</span>
          </div>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: open ? C.lemonDeep : C.inkSoft, whiteSpace: "nowrap", fontWeight: 700 }}>
          {open ? `Open · ${c.daysLeft}d left` : c.status}
        </span>
      </div>

      <p style={{ fontFamily: SERIF, fontSize: 17, color: C.inkSoft, lineHeight: 1.6, fontStyle: "italic", margin: "0 0 24px", maxWidth: 620 }}>"{c.story}"</p>

      <div style={{ display: "flex", gap: 40, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 6 }}>Requested</div>
          <div style={{ fontFamily: SERIF, fontSize: 21, color: C.ink, fontWeight: 500 }}>{c.amount.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 6 }}>Votes cast</div>
          <div style={{ fontFamily: SERIF, fontSize: 21, color: C.ink, fontWeight: 500 }}>{total}</div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, textTransform: "uppercase", marginBottom: 6 }}>Evidence</div>
          <div style={{ fontFamily: SANS, fontSize: 14.5, color: C.ink, fontWeight: 600 }}>{c.evidence}</div>
        </div>
      </div>

      {open && (
        <>
          {total > 0 && (
            <div style={{ marginBottom: 22, maxWidth: 400 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: C.inkDim, marginBottom: 8 }}>
                <span>YES {yesPct}%</span><span>NO {noPct}%</span>
              </div>
              <div style={{ height: 6, background: C.bgSoft, borderRadius: 100, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${yesPct}%`, background: C.lemon, transition: "width .3s ease" }} />
                <div style={{ width: `${noPct}%`, background: C.red, transition: "width .3s ease" }} />
              </div>
            </div>
          )}
          {total === 0 && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.inkDim, marginBottom: 22 }}>
              No votes yet — be the first.
            </div>
          )}

          {userVote ? (
            <div style={{ fontSize: 13, color: C.lemonDeep, fontFamily: MONO, fontWeight: 700 }}>
              You voted {userVote}.
            </div>
          ) : loggedIn ? (
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={() => onVote(c.id, "Yes")} style={{
                background: C.lemon, border: "none", padding: "10px 20px", borderRadius: 100,
                color: C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: SANS,
                display: "flex", alignItems: "center", gap: 6,
              }}>Vote Yes <ArrowRight size={13} /></button>
              <button onClick={() => onVote(c.id, "No")} style={{
                background: "transparent", border: `1px solid ${C.line}`, padding: "10px 20px", borderRadius: 100,
                color: C.inkSoft, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: SANS,
              }}>Vote No</button>
            </div>
          ) : (
            <button onClick={() => setScreen("login")} style={{
              background: "transparent", border: `1px solid ${C.line}`, padding: "10px 20px", borderRadius: 100,
              color: C.inkSoft, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: SANS,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Wallet size={13} /> Connect wallet to vote
            </button>
          )}
        </>
      )}
    </div>
  );
}

function VotesScreen({ requests, userVotes, onVote, loggedIn, setScreen }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? requests : requests.filter(c => c.category === filter);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "90px 48px 120px" }}>
      <Label>Open cases</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 40, color: C.ink, marginBottom: 14, letterSpacing: "-0.02em" }}>Cases awaiting the community.</h1>
      <p style={{ color: C.inkSoft, fontSize: 15, marginBottom: 32, fontFamily: SANS }}>
        {loggedIn
          ? "Cast your vote below. One wallet, one vote — always."
          : "Connect a wallet holding $RELIEF to vote. One wallet, one vote — always."}
      </p>
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 20 }}>
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontFamily: SANS, fontSize: 13, fontWeight: 700,
            color: filter === c ? C.ink : C.inkDim,
          }}>{c}</button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.inkDim, padding: "40px 0", textAlign: "center" }}>
          No cases in this category right now.
        </p>
      )}
      {filtered.map(c => (
        <VoteCard
          key={c.id}
          c={c}
          userVote={userVotes[c.id]}
          onVote={onVote}
          loggedIn={loggedIn}
          setScreen={setScreen}
        />
      ))}
    </div>
  );
}

function CategoriesScreen({ setScreen, onSelectCategory }) {
  const descriptions = {
    Medical: "Bills, treatment, and care costs insurance won't cover.",
    "Crypto Loss": "Rug pulls, exploits, phishing, and wallet drains on-chain.",
    Disaster: "Fire, flood, storm damage, and sudden displacement.",
    "Job Loss": "Bridging support after redundancy or sudden income loss.",
    Other: "Anything real that doesn't fit neatly into a category.",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "90px 48px 120px" }}>
      <Label>Categories</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 40, color: C.ink, marginBottom: 14, letterSpacing: "-0.02em" }}>Whatever kind of trouble it is.</h1>
      <p style={{ color: C.inkSoft, fontSize: 15, marginBottom: 44, fontFamily: SANS, maxWidth: 520 }}>These are starting points, not restrictions — the "what happened" field is always open text.</p>
      {CATEGORIES.map((c, i) => {
        const Icon = CAT_ICON[c];
        return (
          <div key={c} onClick={() => { onSelectCategory(c); setScreen("submit"); }} style={{
            display: "flex", alignItems: "center", gap: 24, padding: "26px 0", cursor: "pointer",
            borderTop: i === 0 ? `1px solid ${C.line}` : "none", borderBottom: `1px solid ${C.line}`,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: C.bgSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={22} color={C.lemonDeep} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, color: C.ink, fontWeight: 500, marginBottom: 4 }}>{c}</h3>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.inkSoft, margin: 0 }}>{descriptions[c]}</p>
            </div>
            <ArrowRight size={18} color={C.inkDim} />
          </div>
        );
      })}
    </div>
  );
}

function LedgerScreen({ ledger }) {
  const w = useWindowWidth();
  const mobile = w < 768;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: `90px ${mobile ? "20px" : "48px"} 120px` }}>
      <Label>Public ledger</Label>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mobile ? 28 : 40, color: C.ink, marginBottom: 14, letterSpacing: "-0.02em" }}>Relief already released.</h1>
      <p style={{ color: C.inkSoft, fontSize: 15, marginBottom: 40, fontFamily: SANS }}>Every row cleared a community vote and was confirmed and paid out by hand.</p>

      {ledger.length === 0 && (
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.inkDim, padding: "40px 0", textAlign: "center" }}>
          No payouts yet.
        </p>
      )}

      {ledger.map((r, i) => (
        <div key={i} style={mobile ? {
          padding: "24px 0",
          borderTop: i === 0 ? `1px solid ${C.line}` : "none", borderBottom: `1px solid ${C.line}`,
          display: "flex", flexDirection: "column", gap: 12,
        } : {
          display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 24, alignItems: "center",
          padding: "24px 0",
          borderTop: i === 0 ? `1px solid ${C.line}` : "none", borderBottom: `1px solid ${C.line}`,
        }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: C.inkSoft, marginBottom: 6 }}>{r.wallet}</div>
            <CatTag cat={r.category} />
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: C.ink, fontWeight: 500 }}>
            {r.amount.toLocaleString()} <span style={{ fontFamily: MONO, fontSize: 11, color: C.lemonDeep }}>$RELIEF</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.inkSoft, lineHeight: 1.5 }}>{r.note}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.inkDim, whiteSpace: "nowrap" }}>{r.date}</div>
        </div>
      ))}
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const [screen, setScreen] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [ledger] = useState(INITIAL_LEDGER);
  const [userVotes, setUserVotes] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  function handleVote(requestId, vote) {
    setUserVotes(prev => ({ ...prev, [requestId]: vote }));
    setRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          yesVotes: vote === "Yes" ? r.yesVotes + 1 : r.yesVotes,
          noVotes: vote === "No" ? r.noVotes + 1 : r.noVotes,
        };
      })
    );
  }

  function handleSubmitRequest(newRequest) {
    setRequests(prev => [newRequest, ...prev]);
    setSelectedCategory(null);
  }

  function handleLogout() {
    setLoggedIn(false);
    setUser(null);
    setUserVotes({});
    setScreen("home");
  }

  function handleSetScreen(s) {
    // Clear selected category when navigating away from submit
    if (s !== "submit") setSelectedCategory(null);
    setScreen(s);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500;0,9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: ${C.lemon}; color: ${C.ink}; }
        input::placeholder, textarea::placeholder { color: ${C.inkDim}; }
        input:focus, textarea:focus { border-color: ${C.lemonDeep} !important; }
        button:focus-visible { outline: 2px solid ${C.lemonDeep}; outline-offset: 3px; }
      `}</style>

      <NavBar screen={screen} setScreen={handleSetScreen} loggedIn={loggedIn} user={user} />

      {screen === "home" && (
        <HomeScreen setScreen={handleSetScreen} requests={requests} ledger={ledger} loggedIn={loggedIn} />
      )}
      {screen === "login" && (
        <LoginScreen setScreen={handleSetScreen} setLoggedIn={setLoggedIn} setUser={setUser} />
      )}
      {screen === "profile" && user && (
        <ProfileScreen user={user} setScreen={handleSetScreen} requests={requests} onLogout={handleLogout} />
      )}
      {screen === "profile" && !user && (
        <LoginScreen setScreen={handleSetScreen} setLoggedIn={setLoggedIn} setUser={setUser} />
      )}
      {screen === "submit" && (
        <SubmitScreen
          user={user}
          initialCategory={selectedCategory}
          onSubmit={handleSubmitRequest}
          setScreen={handleSetScreen}
        />
      )}
      {screen === "votes" && (
        <VotesScreen
          requests={requests}
          userVotes={userVotes}
          onVote={handleVote}
          loggedIn={loggedIn}
          setScreen={handleSetScreen}
        />
      )}
      {screen === "categories" && (
        <CategoriesScreen setScreen={handleSetScreen} onSelectCategory={setSelectedCategory} />
      )}
      {screen === "ledger" && (
        <LedgerScreen ledger={ledger} />
      )}

      <div style={{ borderTop: `1px solid ${C.line}`, background: C.bgSoft }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px" }}>
          <p style={{ fontSize: 11.5, color: C.inkDim, lineHeight: 1.7, fontFamily: MONO, maxWidth: 720 }}>
            Hood Relief Bot is a community mutual-aid pool, not a financial institution, insurer, or guaranteed refund service. Filing a request does not guarantee funding. All releases are decided by community vote and confirmed manually. This is a sample interface — no accounts, wallets, or funds are real.
          </p>
        </div>
      </div>
    </div>
  );
}
