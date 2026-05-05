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
    <div className="min-h-screen" style={{ background: "#111" }} data-testid="minefield-page">

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
            <span className="text-3xl">💣</span>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Minefield</h1>
              <p className="text-slate-500 text-xs">Avoid mines, collect gems</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => (playing ? cashOut() : setShowPlay(true))}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90"
          style={{ background: playing ? "#059669" : "#7c3aed" }}
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
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  data-testid="game-board"
                >
                  {/* Stats row */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-600 text-xs">Bet</p>
                      <p className="text-white font-bold">R$ {betAmount || "0"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-600 text-xs">Multiplier</p>
                      <p
                        className="text-2xl font-black"
                        style={{ color: gameOver === "win" ? "#22c55e" : gameOver === "lose" ? "#ef4444" : "#a78bfa" }}
                      >
                        {multiplier}x
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 text-xs">Profit</p>
                      <p className="text-green-500 font-bold">
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
                        className="mb-4 p-3 rounded-lg text-center font-bold text-sm"
                        style={{
                          background: gameOver === "win" ? "#0a1f14" : "#1f0a0a",
                          border: `1px solid ${gameOver === "win" ? "#1a4a2a" : "#4a1a1a"}`,
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
                          className="aspect-square rounded-lg flex items-center justify-center text-xl transition-colors"
                          style={{
                            background: isRevealed
                              ? showMine ? "#2a0a0a" : "#0a1f0a"
                              : showAll ? "#1f0a0a" : "#222",
                            border: isRevealed
                              ? showMine ? "1px solid #5a1a1a" : "1px solid #1a5a1a"
                              : showAll ? "1px solid #3a1a1a" : "1px solid #333",
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
                      className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
                      style={{ background: "#7c3aed" }}
                      data-testid="play-again-btn"
                    >
                      Play Again
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-xl p-10 flex flex-col items-center justify-center text-center"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: "300px" }}
                  data-testid="active-empty"
                >
                  <Loader2 size={36} className="text-slate-700 mb-4 animate-spin" />
                  <p className="text-white font-bold mb-1">No active games</p>
                  <p className="text-slate-500 text-sm mb-6">Start a new game to begin playing</p>
                  <button
                    onClick={() => setShowPlay(true)}
                    className="px-6 py-2.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: "#7c3aed" }}
                    data-testid="start-game-btn"
                  >
                    Start Game
                  </button>
                </div>
              )
            ) : (
              <div
                className="rounded-xl p-10 flex flex-col items-center justify-center text-center"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: "300px" }}
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
              style={{ background: "rgba(0,0,0,0.75)" }}
              onClick={() => setShowPlay(false)}
              data-testid="sheet-backdrop"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}
              data-testid="play-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-1">Start Minefield</h2>
              <p className="text-slate-500 text-sm mb-5">Reveal cells to find gems. Hit a mine and lose everything!</p>

              <p className="text-slate-400 text-sm mb-2">Bet amount (R$)</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4" style={{ background: "#222", border: "1px solid #333" }}>
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

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(String(amt))}
                    className="py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      background: betAmount === String(amt) ? "#2a1f44" : "#222",
                      border: betAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a",
                      color: betAmount === String(amt) ? "#c4b5fd" : "#555",
                    }}
                    data-testid={`quick-${amt}`}
                  >
                    R${amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              <button
                onClick={startGame}
                className="w-full py-3.5 rounded-lg text-white font-black text-base transition-all hover:opacity-90"
                style={{
                  background: betAmount ? "#7c3aed" : "#1e1e1e",
                  border: betAmount ? "none" : "1px solid #2a2a2a",
                  color: betAmount ? "#fff" : "#444",
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
