import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, History } from "lucide-react";

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
      {/* Tick marks */}
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
            stroke={i % 3 === 0 ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.25)"}
            strokeWidth={i % 3 === 0 ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}

      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(139,92,246,0.15)"
        strokeWidth={strokeWidth}
      />

      {/* Progress */}
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

      {/* Pointer at top */}
      <polygon
        points={`${cx},${cy - r - strokeWidth / 2 - 2} ${cx - 6},${cy - r - strokeWidth / 2 - 14} ${cx + 6},${cy - r - strokeWidth / 2 - 14}`}
        fill="#a78bfa"
      />

      {/* Center */}
      <circle cx={cx} cy={cy} r={50} fill="rgba(15,13,34,0.95)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="900">
        {tokens}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600" letterSpacing="2">
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
  const [tab, setTab] = useState<Tab>("current");
  const [tokens, setTokens] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [round] = useState(1);
  const [players] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: "#080614" }} data-testid="jackpot-page">

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              data-testid="back-btn"
            >
              <ArrowLeft size={18} className="text-slate-300" />
            </button>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏆</span>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Jackpot</h1>
              <p className="text-slate-500 text-xs">Round #{round}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowDeposit(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
          data-testid="deposit-btn"
        >
          <Plus size={15} />
          Deposit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2" data-testid="game-tabs">
        {([["current", "Current Round"], ["history", "History"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === key ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
              border: tab === key ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: tab === key ? "#a78bfa" : "#64748b",
            }}
            data-testid={`tab-${key}`}
          >
            {key === "history" && <History size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
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
                className="rounded-2xl p-6 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                data-testid="jackpot-wheel-area"
              >
                <div className="my-4">
                  <JackpotWheel tokens={tokens} />
                </div>

                <p className="text-slate-500 text-sm mb-6">
                  Waiting for players ({players}/2 minimum)
                </p>

                <button
                  onClick={() => setShowDeposit(true)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 w-full justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}
                  data-testid="deposit-tokens-btn"
                >
                  <Plus size={16} />
                  Deposit Tokens
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", minHeight: "300px" }}
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
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowDeposit(false)}
              data-testid="sheet-backdrop"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10"
              style={{ background: "#0f0d22", border: "1px solid rgba(139,92,246,0.3)", borderBottom: "none" }}
              data-testid="deposit-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-2">Deposit Tokens</h2>
              <p className="text-slate-500 text-sm mb-5">
                Enter the jackpot pool. The more you deposit, the better your odds.
              </p>

              <p className="text-slate-400 text-sm mb-2">Amount (R$)</p>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(139,92,246,0.3)" }}
              >
                <span className="text-violet-400 font-bold text-lg">R$</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-slate-700"
                  data-testid="deposit-input"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(String(amt))}
                    className="py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: depositAmount === String(amt) ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                      border: depositAmount === String(amt) ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: depositAmount === String(amt) ? "#a78bfa" : "#64748b",
                    }}
                    data-testid={`quick-${amt}`}
                  >
                    R${amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (depositAmount) {
                    setTokens((t) => t + Number(depositAmount));
                    setDepositAmount("");
                    setShowDeposit(false);
                  }
                }}
                className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: depositAmount ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
                  opacity: depositAmount ? 1 : 0.5,
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
