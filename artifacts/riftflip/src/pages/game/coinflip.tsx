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
    <div className="min-h-screen" style={{ background: "#111" }} data-testid="coinflip-page">

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 md:pt-4"
        style={{ borderBottom: "1px solid #222" }}
      >
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
            <span className="text-3xl">🪙</span>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Coinflip</h1>
              <p className="text-slate-500 text-xs">Flip a coin against another player</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "#7c3aed" }}
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: tab === "open" ? "#1e1e1e" : "#161616",
            border: tab === "open" ? "1px solid #444" : "1px solid #2a2a2a",
            color: tab === "open" ? "#c4b5fd" : "#555",
          }}
          data-testid="tab-open"
        >
          <Users size={14} />
          Open Games
        </button>
        <button
          onClick={() => setTab("history")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: tab === "history" ? "#1e1e1e" : "#161616",
            border: tab === "history" ? "1px solid #444" : "1px solid #2a2a2a",
            color: tab === "history" ? "#c4b5fd" : "#555",
          }}
          data-testid="tab-history"
        >
          <History size={14} />
          History
        </button>
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
            {tab === "open" ? (
              <div
                className="rounded-xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: "300px" }}
                data-testid="open-games-empty"
              >
                <Loader2 size={36} className="text-slate-700 mb-4 animate-spin" />
                <p className="text-white font-bold mb-1">No open games right now</p>
                <p className="text-slate-500 text-sm mb-6">Create a game or check back later</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-2.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "#7c3aed" }}
                  data-testid="create-game-empty-btn"
                >
                  Create Game
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
              style={{ background: "rgba(0,0,0,0.75)" }}
              onClick={() => setShowCreate(false)}
              data-testid="sheet-backdrop"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}
              data-testid="create-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-5">Create Coinflip</h2>

              <p className="text-slate-400 text-sm mb-2">Choose your side</p>
              <div className="flex gap-3 mb-5">
                {(["heads", "tails"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className="flex-1 py-3 rounded-lg font-bold text-sm capitalize transition-colors"
                    style={{
                      background: side === s ? "#7c3aed" : "#222",
                      border: side === s ? "1px solid #9d6eff" : "1px solid #333",
                      color: side === s ? "#fff" : "#666",
                    }}
                    data-testid={`side-${s}`}
                  >
                    {s === "heads" ? "🪙 Heads" : "🔴 Tails"}
                  </button>
                ))}
              </div>

              <p className="text-slate-400 text-sm mb-2">Bet amount (R$)</p>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg mb-5"
                style={{ background: "#222", border: "1px solid #333" }}
              >
                <span className="text-violet-400 font-bold text-lg">R$</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none"
                  style={{ color: "#e5e5e5" }}
                  data-testid="bet-input"
                />
              </div>

              <button
                className="w-full py-3.5 rounded-lg text-white font-black text-base transition-all hover:opacity-90"
                style={{
                  background: betAmount ? "#7c3aed" : "#1e1e1e",
                  border: betAmount ? "none" : "1px solid #2a2a2a",
                  color: betAmount ? "#fff" : "#444",
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
