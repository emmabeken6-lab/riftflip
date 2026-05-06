import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, History, Users } from "lucide-react";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";

/* ─── Types ────────────────────────────────────────────────────── */
type Side = "heads" | "tails";
type GameStatus = "waiting" | "flipping" | "done";

interface CFGame {
  id: string;
  creator: { name: string; avatar: string; id: string };
  joiner?: { name: string; avatar: string; id: string } | null;
  creatorSide: Side;
  bet: number;
  status: GameStatus;
  winner?: Side | null;
  serverSeedHash?: string;
  clientSeed?: string;
  nonce?: number;
}

/* ─── Helpers ───────────────────────────────────────────────────── */
const SIDE_COLOR: Record<Side, { bg: string; border: string; text: string; label: string }> = {
  heads: { bg: "#1a1530", border: "#7c3aed", text: "#c4b5fd", label: "Heads" },
  tails: { bg: "#1a100a", border: "#ea580c", text: "#fdba74", label: "Tails" },
};

const QUICK = [500, 1000, 2500, 5000, 10000];

/* ─── Coin component ────────────────────────────────────────────── */
function Coin({ spinning, result, size = 120 }: { spinning: boolean; result: Side | null; size?: number }) {
  const targetY = spinning ? 1800 : result === "tails" ? 180 : 0;

  return (
    <div style={{ perspective: "600px", width: size, height: size }}>
      <motion.div
        animate={{ rotateY: targetY }}
        transition={spinning
          ? { duration: 2.8, ease: [0.2, 0.65, 0.3, 0.9] }
          : { duration: 0.01 }
        }
        style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
      >
        {/* Heads face */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #f5c842, #c9960a)",
          border: "4px solid #f5c842", boxShadow: "0 0 24px rgba(245,200,66,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <span style={{ fontSize: size * 0.38, lineHeight: 1, fontWeight: 900, color: "#7a5c00" }}>H</span>
          <span style={{ fontSize: size * 0.13, fontWeight: 900, color: "#7a5c00", letterSpacing: 1 }}>HEADS</span>
        </div>

        {/* Tails face */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #f87171, #c42020)",
          border: "4px solid #f87171", boxShadow: "0 0 24px rgba(248,113,113,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <span style={{ fontSize: size * 0.38, lineHeight: 1, fontWeight: 900, color: "#7a0000" }}>T</span>
          <span style={{ fontSize: size * 0.13, fontWeight: 900, color: "#7a0000", letterSpacing: 1 }}>TAILS</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Player slot ───────────────────────────────────────────────── */
function PlayerSlot({ player, side, isWinner, isYou }: {
  player?: { name: string; avatar: string } | null;
  side: Side;
  isWinner?: boolean;
  isYou?: boolean;
}) {
  const col = SIDE_COLOR[side];
  return (
    <div className="flex flex-col items-center gap-2" style={{ minWidth: 80 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: player ? col.bg : "#1a1a1a",
        border: `2px solid ${isWinner ? (side === "heads" ? "#f5c842" : "#f87171") : col.border}`,
        boxShadow: isWinner ? `0 0 16px ${side === "heads" ? "rgba(245,200,66,0.5)" : "rgba(248,113,113,0.5)"}` : "none",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        transition: "box-shadow 0.3s",
      }}>
        {player
          ? <img src={player.avatar} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 24, opacity: 0.3 }}>?</span>
        }
      </div>
      <div className="text-center">
        <p className="text-xs font-bold truncate max-w-20" style={{ color: player ? "#e5e5e5" : "#333" }}>
          {player ? player.name : "Empty"}
        </p>
        <p className="text-xs font-semibold" style={{ color: col.text }}>
          {col.label}
          {isYou && <span className="ml-1 text-slate-600">(you)</span>}
        </p>
      </div>
    </div>
  );
}

/* ─── Game card ─────────────────────────────────────────────────── */
function GameCard({
  game,
  onJoin,
  onWatch,
}: {
  game: CFGame;
  onJoin: (game: CFGame) => void;
  onWatch: (game: CFGame) => void;
}) {
  const joinerSide: Side = game.creatorSide === "heads" ? "tails" : "heads";
  const isDone = game.status === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-xl px-4 py-4"
      style={{
        background: "#1a1a1a",
        border: isDone ? "1px solid #222" : "1px solid #2a2a2a",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Creator side */}
        <PlayerSlot
          player={game.creator}
          side={game.creatorSide}
          isWinner={isDone && game.winner === game.creatorSide}
        />

        {/* Center */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <Coin spinning={false} result={isDone ? (game.winner ?? null) : null} size={60} />
          <p className="font-black text-lg leading-none" style={{ color: "#9ca3af" }}>
            <span style={{ color: "#6b7280", fontSize: "0.75em", fontWeight: 700, letterSpacing: 1 }}>T</span>{" "}{game.bet.toLocaleString()}
          </p>
          <span className="text-slate-600 text-xs">
            {isDone ? (game.winner === game.creatorSide ? game.creator.name + " won" : (game.joiner?.name ?? "?") + " won") : "vs"}
          </span>
        </div>

        {/* Joiner side */}
        <div className="flex flex-col items-center gap-2">
          <PlayerSlot
            player={game.joiner ?? null}
            side={joinerSide}
            isWinner={isDone && game.winner === joinerSide}
          />
          {!isDone && !game.joiner && (
            <button
              onClick={() => onJoin(game)}
              className="px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90"
              style={{ background: "#7c3aed" }}
            >
              Join
            </button>
          )}
          {isDone && (
            <button
              onClick={() => onWatch(game)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#222]"
              style={{ color: "#555", border: "1px solid #222" }}
            >
              View
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Flip modal ────────────────────────────────────────────────── */
function FlipModal({
  game,
  myName,
  mySide,
  onClose,
}: {
  game: CFGame;
  myName: string;
  mySide: Side;
  onClose: (winner: Side) => void;
}) {
  const [phase, setPhase] = useState<"countdown" | "flipping" | "result">("countdown");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<Side | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinerSide = game.creatorSide === "heads" ? "tails" : "heads";

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (count > 1) {
        setCount((c) => c - 1);
      } else {
        setPhase("flipping");
        fetch("/api/fairness/flip", { method: "POST", credentials: "include" })
          .then((r) => r.json() as Promise<{ result: Side }>)
          .then((d) => {
            setTimeout(() => {
              setResult(d.result);
              setPhase("result");
            }, 3200);
          })
          .catch(() => {
            const r: Side = Math.random() < 0.5 ? "heads" : "tails";
            setTimeout(() => {
              setResult(r);
              setPhase("result");
            }, 3200);
          });
      }
    }, 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [count]);

  const isWinner = result === mySide;
  const joiner = { name: myName, avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${myName}` };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center" style={{ borderBottom: "1px solid #222" }}>
          <p className="text-slate-400 text-sm">
            <span style={{ color: "#6b7280", fontWeight: 700 }}>T</span>{" "}{(game.bet * 2).toLocaleString()} pot
          </p>
        </div>

        {/* Arena */}
        <div className="px-5 py-8">
          {/* Players */}
          <div className="flex items-center justify-between mb-8">
            <PlayerSlot
              player={game.creator}
              side={game.creatorSide}
              isWinner={phase === "result" && result === game.creatorSide}
            />
            <PlayerSlot
              player={joiner}
              side={joinerSide}
              isWinner={phase === "result" && result === joinerSide}
              isYou
            />
          </div>

          {/* Coin */}
          <div className="flex justify-center mb-8">
            {phase === "countdown" && (
              <motion.div
                key={count}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center rounded-full font-black text-6xl"
                style={{ width: 120, height: 120, background: "#222", border: "2px solid #333", color: "#a78bfa" }}
              >
                {count}
              </motion.div>
            )}
            {phase === "flipping" && <Coin spinning result={null} size={120} />}
            {phase === "result" && result && <Coin spinning={false} result={result} size={120} />}
          </div>

          {/* Result */}
          <AnimatePresence>
            {phase === "result" && result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p
                  className="text-3xl font-black mb-1"
                  style={{ color: isWinner ? "#4ade80" : "#f87171" }}
                >
                  {isWinner ? "You Won!" : "You Lost"}
                </p>
                <p className="text-slate-500 text-sm mb-2">
                  Result: <span style={{ color: result === "heads" ? "#f5c842" : "#f87171", fontWeight: 700 }}>
                    {result.charAt(0).toUpperCase() + result.slice(1)}
                  </span>
                </p>
                {isWinner && (
                  <p className="text-green-400 font-bold text-lg">
                    +<span style={{ color: "#4ade80", fontWeight: 700 }}>T</span>{" "}{(game.bet * 2).toLocaleString()} tokens
                  </p>
                )}
                <button
                  onClick={() => onClose(result)}
                  className="mt-5 w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
                  style={{ background: "#7c3aed" }}
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "flipping" && (
            <p className="text-center text-slate-500 text-sm animate-pulse">Flipping coin…</p>
          )}
          {phase === "countdown" && (
            <p className="text-center text-slate-500 text-sm">Get ready…</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function CoinflipGame() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"open" | "history">("open");
  const [games, setGames] = useState<CFGame[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [side, setSide] = useState<Side>("heads");
  const [activeFlip, setActiveFlip] = useState<{ game: CFGame; mySide: Side } | null>(null);
  const [history, setHistory] = useState<CFGame[]>([]);

  const createGame = () => {
    if (!betAmount || !user) return;
    const newGame: CFGame = {
      id: `g${Date.now()}`,
      creator: { name: user.username, avatar: avatarUrl(user), id: user.id },
      creatorSide: side,
      bet: Number(betAmount),
      status: "waiting",
    };
    setGames((g) => [newGame, ...g]);
    setBetAmount("");
    setShowCreate(false);
  };

  const joinGame = (game: CFGame) => {
    const mySide: Side = game.creatorSide === "heads" ? "tails" : "heads";
    setGames((gs) => gs.map((g) => g.id === game.id
      ? {
        ...g, status: "flipping",
        joiner: user ? { name: user.username, avatar: avatarUrl(user), id: user.id } : { name: "You", avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=you`, id: "you" },
      } : g));
    setActiveFlip({ game, mySide });
  };

  const onFlipDone = (gameId: string, winner: Side) => {
    setGames((gs) => gs.map((g) => g.id === gameId ? { ...g, status: "done", winner } : g));
    const done = games.find((g) => g.id === gameId);
    if (done) setHistory((h) => [{ ...done, status: "done", winner }, ...h]);
    setActiveFlip(null);
  };

  const openGames = games.filter((g) => g.status === "waiting");

  return (
    <div className="min-h-screen" style={{ background: "#111" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #222" }}>
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#222]" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <ArrowLeft size={18} className="text-slate-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">Coinflip</h1>
            <p className="text-slate-500 text-xs">Player vs Player · 0% house edge</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90"
          style={{ background: "#7c3aed" }}
        >
          <Plus size={15} />
          Create
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2">
        {([["open", Users, "Open Games"], ["history", History, "History"]] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: tab === key ? "#1e1e1e" : "#161616",
              border: tab === key ? "1px solid #444" : "1px solid #2a2a2a",
              color: tab === key ? "#c4b5fd" : "#555",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "open" ? (
              openGames.length === 0 ? (
                <div className="rounded-xl p-12 flex flex-col items-center text-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <Coin spinning={false} result="heads" size={80} />
                  <p className="text-white font-bold mt-5 mb-1">No open games</p>
                  <p className="text-slate-500 text-sm mb-5">Be the first to create one</p>
                  <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-lg text-white font-bold text-sm hover:opacity-90" style={{ background: "#7c3aed" }}>
                    Create Game
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {openGames.map((g) => (
                      <GameCard key={g.id} game={g} onJoin={joinGame} onWatch={() => {}} />
                    ))}
                  </AnimatePresence>
                </div>
              )
            ) : (
              history.length === 0 ? (
                <div className="rounded-xl p-12 flex flex-col items-center text-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <History size={36} className="text-slate-700 mb-4" />
                  <p className="text-white font-bold mb-1">No history yet</p>
                  <p className="text-slate-500 text-sm">Completed games will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {history.map((g) => (
                      <GameCard key={g.id} game={g} onJoin={() => {}} onWatch={() => {}} />
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flip modal */}
      <AnimatePresence>
        {activeFlip && (
          <FlipModal
            game={activeFlip.game}
            myName={user?.username ?? "You"}
            mySide={activeFlip.mySide}
            onClose={(winner) => onFlipDone(activeFlip.game.id, winner)}
          />
        )}
      </AnimatePresence>

      {/* Create sheet */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.75)" }}
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}
            >
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-5" />
              <h2 className="text-white font-black text-xl mb-5">Create Coinflip</h2>

              {/* Side picker */}
              <p className="text-slate-400 text-sm mb-2">Choose your side</p>
              <div className="flex gap-3 mb-5">
                {(["heads", "tails"] as const).map((s) => {
                  const col = SIDE_COLOR[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setSide(s)}
                      className="flex-1 py-4 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: side === s ? col.bg : "#1e1e1e",
                        border: `2px solid ${side === s ? col.border : "#2a2a2a"}`,
                        color: side === s ? col.text : "#555",
                      }}
                    >
                      <Coin spinning={false} result={s} size={52} />
                      {col.label}
                    </button>
                  );
                })}
              </div>

              {/* Bet amount */}
              <p className="text-slate-400 text-sm mb-2">Bet amount (tokens)</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
                <span className="font-bold text-lg" style={{ color: "#6b7280" }}>T</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-5 gap-2 mb-5">
                {QUICK.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(String(amt))}
                    className="py-2 rounded-lg text-xs font-bold"
                    style={{
                      background: betAmount === String(amt) ? "#2a1f44" : "#222",
                      border: betAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a",
                      color: betAmount === String(amt) ? "#c4b5fd" : "#555",
                    }}
                  >
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {betAmount && (
                <p className="text-slate-600 text-xs mb-4 text-center">
                  Pot: T {(Number(betAmount) * 2).toLocaleString()} tokens · 0% house fee
                </p>
              )}

              <button
                onClick={createGame}
                disabled={!betAmount || !user}
                className="w-full py-3.5 rounded-lg text-white font-black text-base hover:opacity-90"
                style={{ background: betAmount && user ? "#7c3aed" : "#1e1e1e", color: betAmount && user ? "#fff" : "#444" }}
              >
                {!user ? "Sign in to play" : betAmount ? "Create Game" : "Enter amount"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
