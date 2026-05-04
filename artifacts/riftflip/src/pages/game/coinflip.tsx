import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Loader2, History, Users } from "lucide-react";

type Tab = "open" | "history";

export default function CoinflipGame() {
  const [tab, setTab] = useState<Tab>("open");
  const [showCreate, setShowCreate] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [side, setSide] = useState<"heads" | "tails">("heads");

  return (
    <div className="min-h-screen" style={{ background: "#080614" }} data-testid="coinflip-page">

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 md:pt-4"
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
            <span className="text-3xl">🪙</span>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Coinflip</h1>
              <p className="text-slate-500 text-xs">Flip a coin against another player</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
          data-testid="create-game-btn"
        >
          <Plus size={15} />
          Create
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2" data-testid="game-tabs">
        <button
          onClick={() => setTab("open")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: tab === "open" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
            border: tab === "open" ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: tab === "open" ? "#a78bfa" : "#64748b",
          }}
          data-testid="tab-open"
        >
          <Users size={14} />
          Open Games
        </button>
        <button
          onClick={() => setTab("history")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: tab === "history" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
            border: tab === "history" ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: tab === "history" ? "#a78bfa" : "#64748b",
          }}
          data-testid="tab-history"
        >
          <History size={14} />
          History
        </button>
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
            {tab === "open" ? (
              <div
                className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", minHeight: "300px" }}
                data-testid="open-games-empty"
              >
                <Loader2 size={36} className="text-slate-700 mb-4 animate-spin" />
                <p className="text-white font-bold mb-1">No open games at the moment</p>
                <p className="text-slate-500 text-sm mb-6">Create a game or check back later</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  data-testid="create-game-empty-btn"
                >
                  Create Game
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
                <p className="text-slate-500 text-sm">Your coinflip results will appear here</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create Game Sheet */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowCreate(false)}
              data-testid="sheet-backdrop"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10"
              style={{ background: "#0f0d22", border: "1px solid rgba(139,92,246,0.3)", borderBottom: "none" }}
              data-testid="create-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-5">Create Coinflip</h2>

              {/* Coin side picker */}
              <p className="text-slate-400 text-sm mb-2">Choose your side</p>
              <div className="flex gap-3 mb-5">
                {(["heads", "tails"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm capitalize transition-all"
                    style={{
                      background: side === s ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
                      border: side === s ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: side === s ? "#fff" : "#64748b",
                    }}
                    data-testid={`side-${s}`}
                  >
                    {s === "heads" ? "🪙 Heads" : "🔴 Tails"}
                  </button>
                ))}
              </div>

              {/* Bet amount */}
              <p className="text-slate-400 text-sm mb-2">Bet amount (R$)</p>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(139,92,246,0.3)" }}
              >
                <span className="text-violet-400 font-bold text-lg">R$</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-slate-700"
                  data-testid="bet-input"
                />
              </div>

              <button
                className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: betAmount ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
                  opacity: betAmount ? 1 : 0.5,
                  cursor: betAmount ? "pointer" : "not-allowed",
                }}
                disabled={!betAmount}
                data-testid="confirm-create-btn"
              >
                Create Game
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
