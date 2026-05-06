import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "current" | "history";

function JackpotWheel({ tokens }: { tokens: number }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 108;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;
  const pct = tokens > 0 ? Math.min(tokens / 1000, 1) : 0;
  const dashOffset = circumference * (1 - pct);
  const tickCount = 36;
  const ticks = Array.from({ length: tickCount });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {ticks.map((_, i) => {
        const angle = (i / tickCount) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const inner = r + strokeWidth / 2 + 4;
        const outer = r + strokeWidth / 2 + 10;
        const x1 = cx + inner * Math.cos(rad);
        const y1 = cy + inner * Math.sin(rad);
        const x2 = cx + outer * Math.cos(rad);
        const y2 = cy + outer * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i % 3 === 0 ? "#333" : "#222"}
            strokeWidth={i % 3 === 0 ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}

      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e1e" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#wheelGrad)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />

      <polygon
        points={`${cx},${cy - r - strokeWidth / 2 - 2} ${cx - 6},${cy - r - strokeWidth / 2 - 14} ${cx + 6},${cy - r - strokeWidth / 2 - 14}`}
        fill="#7c3aed"
      />

      <circle cx={cx} cy={cy} r={50} fill="#1a1a1a" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="900">
        {tokens}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#555" fontSize="10" fontWeight="600" letterSpacing="2">
        TOKENS
      </text>

      <defs>
        <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function JackpotGame() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("current");
  const [tokens, setTokens] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState("");
  const [round] = useState(1);
  const [players] = useState(0);

  const openDeposit = () => {
    if (!user) { navigate("/sign-in"); return; }
    setDepositError("");
    setShowDeposit(true);
  };

  return (
    <div className="min-h-screen" style={{ background: "#111" }} data-testid="jackpot-page">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #222" }}>
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[#222]"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
              data-testid="back-btn"
            >
              <ArrowLeft size={18} className="text-slate-400" />
            </button>
          </Link>
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Jackpot</h1>
              <p className="text-slate-500 text-xs">Round #{round}</p>
            </div>
          </div>
        </div>
        <button
          onClick={openDeposit}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "#7c3aed" }}
          data-testid="deposit-btn"
        >
          <Plus size={15} />
          {user ? "Deposit" : "Sign In"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2" data-testid="game-tabs">
        {([["current", "Current Round"], ["history", "History"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: tab === key ? "#1e1e1e" : "#161616",
              border: tab === key ? "1px solid #444" : "1px solid #2a2a2a",
              color: tab === key ? "#c4b5fd" : "#555",
            }}
            data-testid={`tab-${key}`}
          >
            {key === "history" && <History size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4" data-testid="tab-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "current" ? (
              <div
                className="rounded-xl p-6 flex flex-col items-center"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                data-testid="jackpot-wheel-area"
              >
                <div className="my-4">
                  <JackpotWheel tokens={tokens} />
                </div>
                <p className="text-slate-500 text-sm mb-6">
                  Waiting for players ({players}/2 minimum)
                </p>
                <button
                  onClick={openDeposit}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 w-full justify-center"
                  style={{ background: "#7c3aed" }}
                  data-testid="deposit-tokens-btn"
                >
                  <Plus size={16} />
                  Deposit Tokens
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: "300px" }}
                data-testid="history-empty"
              >
                <History size={36} className="text-slate-700 mb-4" />
                <p className="text-white font-bold mb-1">No history yet</p>
                <p className="text-slate-500 text-sm">Past jackpot rounds will appear here</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Deposit Sheet */}
      <AnimatePresence>
        {showDeposit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.75)" }}
              onClick={() => setShowDeposit(false)}
              data-testid="sheet-backdrop"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}
              data-testid="deposit-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-1">Deposit Tokens</h2>
              {user && (
                <p className="text-slate-500 text-xs mb-1">Balance: <span className="text-white font-semibold">{user.balance.toLocaleString()} tokens</span></p>
              )}
              <p className="text-slate-500 text-sm mb-5">Enter the jackpot pool. The more you deposit, the better your odds.</p>

              <p className="text-slate-400 text-sm mb-2">Amount (tokens)</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-5" style={{ background: "#222", border: "1px solid #333" }}>
                <span className="font-bold text-lg" style={{ color: "#6b7280" }}>T</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none"
                  style={{ color: "#e5e5e5" }}
                  data-testid="deposit-input"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(String(amt))}
                    className="py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      background: depositAmount === String(amt) ? "#2a1f44" : "#222",
                      border: depositAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a",
                      color: depositAmount === String(amt) ? "#c4b5fd" : "#555",
                    }}
                    data-testid={`quick-${amt}`}
                  >
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {depositError && (
                <p className="text-red-400 text-sm text-center mb-3">{depositError}</p>
              )}
              <button
                onClick={() => {
                  if (!depositAmount || !user) return;
                  const amt = Number(depositAmount);
                  if (amt <= 0) { setDepositError("Amount must be greater than 0."); return; }
                  if (amt > user.balance) { setDepositError(`Insufficient balance. You have ${user.balance.toLocaleString()} tokens.`); return; }
                  setDepositError("");
                  setTokens((t) => t + amt);
                  setDepositAmount("");
                  setShowDeposit(false);
                }}
                className="w-full py-3.5 rounded-lg text-white font-black text-base transition-all hover:opacity-90"
                style={{
                  background: depositAmount ? "#7c3aed" : "#1e1e1e",
                  border: depositAmount ? "none" : "1px solid #2a2a2a",
                  color: depositAmount ? "#fff" : "#444",
                  cursor: depositAmount ? "pointer" : "not-allowed",
                }}
                disabled={!depositAmount}
                data-testid="confirm-deposit-btn"
              >
                Deposit Tokens
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
