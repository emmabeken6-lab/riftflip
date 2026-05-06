import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const GRID_SIZE = 25;
const MINE_OPTIONS = [1, 3, 5, 10, 15, 20, 24];

function getMultiplier(safeRevealed: number, mineCount: number): number {
  const totalSafe = GRID_SIZE - mineCount;
  if (safeRevealed === 0) return 1.0;
  let m = 1.0;
  for (let i = 0; i < safeRevealed; i++) {
    m *= (GRID_SIZE - mineCount - i) / (GRID_SIZE - i);
  }
  const houseEdge = 0.99;
  return Math.max(1.01, parseFloat((houseEdge / m).toFixed(2)));
}

export default function MinefieldGame() {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState("");
  const [mineCount, setMineCount] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<boolean[]>(Array(GRID_SIZE).fill(false));
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  const [safeCount, setSafeCount] = useState(0);
  const [showSetup, setShowSetup] = useState(false);

  const multiplier = getMultiplier(safeCount, mineCount);
  const profit = Math.round(Number(betAmount || 0) * multiplier);

  const [betError, setBetError] = useState("");

  const startGame = () => {
    if (!betAmount || !user) return;
    const bet = Number(betAmount);
    if (bet <= 0) { setBetError("Bet must be greater than 0."); return; }
    if (bet > user.balance) { setBetError(`Insufficient balance. You have ${user.balance.toLocaleString()} tokens.`); return; }
    setBetError("");
    const positions = new Set<number>();
    while (positions.size < mineCount) positions.add(Math.floor(Math.random() * GRID_SIZE));
    setMines(positions);
    setRevealed(Array(GRID_SIZE).fill(false));
    setGameOver(null);
    setSafeCount(0);
    setPlaying(true);
    setShowSetup(false);
  };

  const revealCell = (i: number) => {
    if (!playing || revealed[i] || gameOver) return;
    const next = [...revealed];
    next[i] = true;
    setRevealed(next);
    if (mines.has(i)) {
      setGameOver("lose");
      setPlaying(false);
    } else {
      setSafeCount((c) => c + 1);
    }
  };

  const cashOut = () => {
    setGameOver("win");
    setPlaying(false);
  };

  const reset = () => {
    setPlaying(false);
    setMines(new Set());
    setRevealed(Array(GRID_SIZE).fill(false));
    setGameOver(null);
    setSafeCount(0);
    setBetAmount("");
  };

  const QUICK = [100, 500, 1000, 5000];

  return (
    <div className="min-h-screen pb-24" style={{ background: "#111" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #222" }}>
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#222]" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <ArrowLeft size={18} className="text-slate-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">Minefield</h1>
            <p className="text-slate-500 text-xs">Avoid mines · cash out anytime</p>
          </div>
        </div>
        {playing ? (
          <button onClick={cashOut} className="px-4 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90" style={{ background: "#059669" }}>
            Cash Out {multiplier}x
          </button>
        ) : (
          <button onClick={() => setShowSetup(true)} className="px-4 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 flex items-center gap-1" style={{ background: "#7c3aed" }}>
            Play
          </button>
        )}
      </div>

      <div className="px-4 pt-4">
        {(playing || gameOver) ? (
          <div className="rounded-xl p-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Bet", val: `T ${Number(betAmount).toLocaleString()}` },
                { label: "Multiplier", val: `${multiplier}x`, highlight: gameOver === "win" ? "#4ade80" : gameOver === "lose" ? "#f87171" : "#a78bfa" },
                { label: "Profit", val: `T ${profit.toLocaleString()}`, highlight: gameOver === "win" ? "#4ade80" : undefined },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-slate-600 text-xs">{s.label}</p>
                  <p className="font-black text-base" style={{ color: s.highlight ?? "#e5e5e5" }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Result banner */}
            <AnimatePresence>
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 rounded-lg text-center font-bold text-sm"
                  style={{
                    background: gameOver === "win" ? "#0a1f14" : "#1f0a0a",
                    border: `1px solid ${gameOver === "win" ? "#1a4a2a" : "#4a1a1a"}`,
                    color: gameOver === "win" ? "#22c55e" : "#f87171",
                  }}
                >
                  {gameOver === "win" ? `Cashed out at ${multiplier}x! +T ${profit.toLocaleString()} tokens` : "BOOM! Hit a mine!"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {Array(GRID_SIZE).fill(null).map((_, i) => {
                const isRev = revealed[i];
                const isMine = mines.has(i);
                const showBoom = isRev && isMine;
                const showGem = isRev && !isMine;
                const revealAll = gameOver === "lose" && isMine && !revealed[i];

                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: playing && !isRev && !gameOver ? 0.88 : 1 }}
                    onClick={() => revealCell(i)}
                    className="aspect-square rounded-lg flex items-center justify-center text-lg font-bold"
                    style={{
                      background: showBoom || revealAll ? "#2a0a0a" : showGem ? "#0a2a15" : "#222",
                      border: showBoom || revealAll ? "1px solid #5a1a1a" : showGem ? "1px solid #1a5a2a" : "1px solid #333",
                      cursor: playing && !isRev && !gameOver ? "pointer" : "default",
                    }}
                    disabled={!!gameOver || isRev || !playing}
                  >
                    <AnimatePresence>
                      {(showBoom || revealAll) && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f87171" }}>✕</motion.span>
                      )}
                      {showGem && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: "1.1rem", fontWeight: 900, color: "#4ade80" }}>✓</motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Mines info */}
            <p className="text-center text-slate-600 text-xs mb-3">
              {mineCount} mines hidden · {safeCount} gems found
            </p>

            {gameOver && (
              <button onClick={reset} className="w-full py-3 rounded-lg text-white font-bold text-sm hover:opacity-90" style={{ background: "#7c3aed" }}>
                Play Again
              </button>
            )}

            {playing && (
              <button onClick={cashOut} className="w-full py-3 rounded-lg text-white font-bold text-sm hover:opacity-90" style={{ background: "#059669" }}>
                Cash Out {multiplier}x · T {profit.toLocaleString()} tokens
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-10 flex flex-col items-center justify-center text-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: "300px" }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", fontSize: "2rem", fontWeight: 900, color: "#f87171" }}>!</div>
            <p className="text-white font-bold mb-1">Minefield</p>
            <p className="text-slate-500 text-sm mb-6">Choose a bet and mine count to start</p>
            <button onClick={() => setShowSetup(true)} className="px-8 py-3 rounded-lg text-white font-bold hover:opacity-90" style={{ background: "#7c3aed" }}>
              Start Game
            </button>
          </div>
        )}
      </div>

      {/* Setup sheet */}
      <AnimatePresence>
        {showSetup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.75)" }}
              onClick={() => setShowSetup(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}
            >
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-1">Start Minefield</h2>
              <p className="text-slate-500 text-sm mb-5">More mines = higher multiplier</p>

              {/* Mine count picker */}
              <p className="text-slate-400 text-sm mb-2">Mine count</p>
              <div className="flex gap-2 flex-wrap mb-5">
                {MINE_OPTIONS.map((m) => (
                  <button key={m} onClick={() => setMineCount(m)}
                    className="px-4 py-2 rounded-lg text-sm font-bold"
                    style={{
                      background: mineCount === m ? "#2a1f44" : "#222",
                      border: mineCount === m ? "1px solid #7c3aed" : "1px solid #2a2a2a",
                      color: mineCount === m ? "#c4b5fd" : "#555",
                    }}>
                    {m} {m === 1 ? "mine" : "mines"}
                  </button>
                ))}
              </div>

              {/* Bet amount */}
              <p className="text-slate-400 text-sm mb-2">Bet amount (tokens)</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
                <span className="font-bold text-lg" style={{ color: "#6b7280" }}>T</span>
                <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none" />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {QUICK.map((amt) => (
                  <button key={amt} onClick={() => setBetAmount(String(amt))}
                    className="py-2 rounded-lg text-xs font-bold"
                    style={{ background: betAmount === String(amt) ? "#2a1f44" : "#222", border: betAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: betAmount === String(amt) ? "#c4b5fd" : "#555" }}>
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {betAmount && (
                <p className="text-center text-slate-600 text-xs mb-4">
                  First gem: {getMultiplier(1, mineCount)}x · Max: {getMultiplier(GRID_SIZE - mineCount, mineCount)}x
                </p>
              )}

              {user && (
                <p className="text-slate-500 text-xs mb-3">Balance: <span className="text-white font-semibold">{user.balance.toLocaleString()} tokens</span></p>
              )}
              {betError && (
                <p className="text-red-400 text-sm text-center mb-3">{betError}</p>
              )}
              <button onClick={startGame} disabled={!betAmount || !user}
                className="w-full py-3.5 rounded-lg text-white font-black text-base hover:opacity-90"
                style={{ background: betAmount && user ? "#7c3aed" : "#1e1e1e", color: betAmount && user ? "#fff" : "#444" }}>
                {!user ? "Sign in to play" : betAmount ? "Start Game" : "Enter amount"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
