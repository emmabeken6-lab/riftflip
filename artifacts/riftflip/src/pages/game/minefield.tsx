import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, History, Loader2 } from "lucide-react";

type Tab = "active" | "history";

const GRID_SIZE = 5;
const MINE_COUNT = 5;

function generateGrid() {
  const cells = Array(GRID_SIZE * GRID_SIZE).fill(false);
  const mines = new Set<number>();
  while (mines.size < MINE_COUNT) {
    mines.add(Math.floor(Math.random() * cells.length));
  }
  return cells.map((_, i) => mines.has(i));
}

export default function MinefieldGame() {
  const [tab, setTab] = useState<Tab>("active");
  const [showPlay, setShowPlay] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [playing, setPlaying] = useState(false);
  const [grid, setGrid] = useState<boolean[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  const [multiplier, setMultiplier] = useState(1.0);

  const startGame = () => {
    const newGrid = generateGrid();
    setGrid(newGrid);
    setRevealed(Array(GRID_SIZE * GRID_SIZE).fill(false));
    setGameOver(null);
    setMultiplier(1.0);
    setPlaying(true);
    setShowPlay(false);
  };

  const revealCell = (i: number) => {
    if (!playing || revealed[i] || gameOver) return;
    const newRevealed = [...revealed];
    newRevealed[i] = true;
    setRevealed(newRevealed);
    if (grid[i]) {
      setGameOver("lose");
      setPlaying(false);
    } else {
      const safeCount = newRevealed.filter((r, idx) => r && !grid[idx]).length;
      setMultiplier(parseFloat((1 + safeCount * 0.15).toFixed(2)));
    }
  };

  const cashOut = () => {
    setGameOver("win");
    setPlaying(false);
  };

  const reset = () => {
    setPlaying(false);
    setGrid([]);
    setRevealed([]);
    setGameOver(null);
    setMultiplier(1.0);
    setBetAmount("");
  };

  return (
    <div className="min-h-screen" style={{ background: "#080614" }} data-testid="minefield-page">

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
            <span className="text-3xl">💣</span>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Minefield</h1>
              <p className="text-slate-500 text-xs">Avoid mines, collect gems</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => (playing ? cashOut() : setShowPlay(true))}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            background: playing
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: playing ? "0 0 16px rgba(16,185,129,0.4)" : "0 0 16px rgba(124,58,237,0.4)",
          }}
          data-testid={playing ? "cashout-btn" : "play-btn"}
        >
          {playing ? `Cash Out ${multiplier}x` : <><Plus size={15} /> Play</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2" data-testid="game-tabs">
        {([["active", "Active Games"], ["history", "History"]] as const).map(([key, label]) => (
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

      {/* Content */}
      <div className="px-4 pt-4" data-testid="tab-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "active" ? (
              playing || gameOver ? (
                /* Game board */
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  data-testid="game-board"
                >
                  {/* Multiplier bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-500 text-xs">Bet</p>
                      <p className="text-white font-bold">R$ {betAmount || "0"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs">Multiplier</p>
                      <p
                        className="text-2xl font-black"
                        style={{ color: gameOver === "win" ? "#22c55e" : gameOver === "lose" ? "#ef4444" : "#a78bfa" }}
                      >
                        {multiplier}x
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Profit</p>
                      <p className="text-green-400 font-bold">
                        R$ {Math.round(Number(betAmount || 0) * multiplier).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Result banner */}
                  <AnimatePresence>
                    {gameOver && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 p-3 rounded-xl text-center font-bold"
                        style={{
                          background: gameOver === "win" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                          border: `1px solid ${gameOver === "win" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                          color: gameOver === "win" ? "#22c55e" : "#f87171",
                        }}
                        data-testid="game-result"
                      >
                        {gameOver === "win" ? `Cashed out at ${multiplier}x!` : "Boom! You hit a mine!"}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Grid */}
                  <div
                    className="grid gap-2 mb-4"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                    data-testid="mine-grid"
                  >
                    {Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => {
                      const isRevealed = revealed[i];
                      const isMine = grid[i];
                      const showMine = isRevealed && isMine;
                      const showGem = isRevealed && !isMine;
                      const showAll = gameOver === "lose" && isMine && !revealed[i];

                      return (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => revealCell(i)}
                          className="aspect-square rounded-xl flex items-center justify-center text-xl transition-all"
                          style={{
                            background: isRevealed
                              ? showMine ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.2)"
                              : showAll ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)",
                            border: isRevealed
                              ? showMine ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(16,185,129,0.4)"
                              : showAll ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.1)",
                            cursor: playing && !isRevealed && !gameOver ? "pointer" : "default",
                          }}
                          disabled={!!gameOver || isRevealed || !playing}
                          data-testid={`cell-${i}`}
                        >
                          {showMine || showAll ? "💣" : showGem ? "💎" : ""}
                        </motion.button>
                      );
                    })}
                  </div>

                  {gameOver && (
                    <button
                      onClick={reset}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                      data-testid="play-again-btn"
                    >
                      Play Again
                    </button>
                  )}
                </div>
              ) : (
                /* Empty / start state */
                <div
                  className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", minHeight: "300px" }}
                  data-testid="active-empty"
                >
                  <Loader2 size={36} className="text-slate-700 mb-4 animate-spin" />
                  <p className="text-white font-bold mb-1">No active games</p>
                  <p className="text-slate-500 text-sm mb-6">Start a new game to begin playing</p>
                  <button
                    onClick={() => setShowPlay(true)}
                    className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                    data-testid="start-game-btn"
                  >
                    Start Game
                  </button>
                </div>
              )
            ) : (
              <div
                className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", minHeight: "300px" }}
                data-testid="history-empty"
              >
                <History size={36} className="text-slate-700 mb-4" />
                <p className="text-white font-bold mb-1">No history yet</p>
                <p className="text-slate-500 text-sm">Your minefield results will appear here</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Play Sheet */}
      <AnimatePresence>
        {showPlay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowPlay(false)}
              data-testid="sheet-backdrop"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10"
              style={{ background: "#0f0d22", border: "1px solid rgba(139,92,246,0.3)", borderBottom: "none" }}
              data-testid="play-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-1">Start Minefield</h2>
              <p className="text-slate-500 text-sm mb-5">
                Reveal cells to find gems. Hit a mine and you lose everything!
              </p>

              <p className="text-slate-400 text-sm mb-2">Bet amount (R$)</p>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
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

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(String(amt))}
                    className="py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: betAmount === String(amt) ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                      border: betAmount === String(amt) ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: betAmount === String(amt) ? "#a78bfa" : "#64748b",
                    }}
                    data-testid={`quick-${amt}`}
                  >
                    R${amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: betAmount ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
                  opacity: betAmount ? 1 : 0.5,
                  cursor: betAmount ? "pointer" : "not-allowed",
                }}
                disabled={!betAmount}
                data-testid="confirm-play-btn"
              >
                Start Game
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
