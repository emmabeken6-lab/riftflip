import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Home, Gamepad2, MessageCircle, Trophy, Wallet, Coins, Flame, Bomb, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Show } from "@clerk/react";

const GAMES = [
  { slug: "coinflip", name: "Coinflip", Icon: Coins },
  { slug: "jackpot", name: "Jackpot", Icon: Flame },
  { slug: "minefield", name: "Minefield", Icon: Bomb },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const [gamesOpen, setGamesOpen] = useState(false);

  const isGameActive = location.startsWith("/game/");

  useEffect(() => {
    if (!gamesOpen) return;
    const handler = () => setGamesOpen(false);
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [gamesOpen]);

  return (
    <>
      <AnimatePresence>
        {gamesOpen && (
          <>
            <div className="fixed inset-0 z-40" />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed z-50 left-1/2 -translate-x-1/2"
              style={{ bottom: "72px", minWidth: "248px" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, #0f0d22 0%, #0c0a1e 100%)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  boxShadow: "0 -4px 32px rgba(79,70,229,0.22), 0 16px 48px rgba(0,0,0,0.7)",
                }}
              >
                {GAMES.map((game, i) => {
                  const isActive = location === `/game/${game.slug}`;
                  return (
                    <div
                      key={game.slug}
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer relative select-none"
                      style={{
                        borderBottom: i < GAMES.length - 1 ? "1px solid rgba(99,102,241,0.13)" : "none",
                        background: isActive ? "rgba(99,102,241,0.16)" : "transparent",
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        navigate(`/game/${game.slug}`);
                        setGamesOpen(false);
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        navigate(`/game/${game.slug}`);
                        setGamesOpen(false);
                      }}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r" style={{ background: "#e97c2e" }} />
                      )}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isActive ? "rgba(233,124,46,0.18)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${isActive ? "rgba(233,124,46,0.38)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        <game.Icon size={20} strokeWidth={1.8} style={{ color: isActive ? "#f0a060" : "#c4c4d4" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base" style={{ color: isActive ? "#f0a060" : "#e2e8f0" }}>
                          {game.name}
                        </p>
                      </div>
                      {isActive && (
                        <span className="text-xs font-bold" style={{ color: "#4ade80" }}>1.1</span>
                      )}
                    </div>
                  );
                })}
                <div
                  className="flex items-center justify-center gap-2 px-5 py-3"
                  style={{ background: "rgba(16,185,129,0.07)", borderTop: "1px solid rgba(16,185,129,0.18)" }}
                >
                  <span className="text-green-400" style={{ fontSize: "15px" }}>🟢</span>
                  <span className="text-green-400 text-sm font-semibold">0% House Edge</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        data-testid="bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "linear-gradient(180deg, rgba(10,8,25,0.95) 0%, rgba(10,8,25,1) 100%)",
          borderTop: "1px solid rgba(139,92,246,0.3)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          <Link href="/" data-testid="nav-tab-home" className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative" onClick={() => setGamesOpen(false)}>
            <Home size={22} strokeWidth={location === "/" ? 2.5 : 1.8} style={{ color: location === "/" ? "#a78bfa" : "#64748b" }} />
            <span className="font-medium truncate" style={{ color: location === "/" ? "#a78bfa" : "#64748b", fontSize: "10px" }}>Home</span>
            {location === "/" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
            )}
          </Link>

          <button
            data-testid="nav-tab-games"
            className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setGamesOpen((v) => !v); }}
          >
            <Gamepad2 size={22} strokeWidth={isGameActive || gamesOpen ? 2.5 : 1.8} style={{ color: isGameActive || gamesOpen ? "#a78bfa" : "#64748b" }} />
            <span className="font-medium" style={{ color: isGameActive || gamesOpen ? "#a78bfa" : "#64748b", fontSize: "10px" }}>Games</span>
            {(isGameActive || gamesOpen) && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
            )}
          </button>

          <Link href="/chat" data-testid="nav-tab-chat" className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative" onClick={() => setGamesOpen(false)}>
            <MessageCircle size={22} strokeWidth={location === "/chat" ? 2.5 : 1.8} style={{ color: location === "/chat" ? "#a78bfa" : "#64748b" }} />
            <span className="font-medium truncate" style={{ color: location === "/chat" ? "#a78bfa" : "#64748b", fontSize: "10px" }}>Chat</span>
            {location === "/chat" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
            )}
          </Link>

          <Link href="/rewards" data-testid="nav-tab-rewards" className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative" onClick={() => setGamesOpen(false)}>
            <Trophy size={22} strokeWidth={location === "/rewards" ? 2.5 : 1.8} style={{ color: location === "/rewards" ? "#a78bfa" : "#64748b" }} />
            <span className="font-medium truncate" style={{ color: location === "/rewards" ? "#a78bfa" : "#64748b", fontSize: "10px" }}>Rewards</span>
            {location === "/rewards" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
            )}
          </Link>

          <Show when="signed-in">
            <Link href="/wallet" data-testid="nav-tab-wallet" className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative" onClick={() => setGamesOpen(false)}>
              <Wallet size={22} strokeWidth={location === "/wallet" ? 2.5 : 1.8} style={{ color: location === "/wallet" ? "#a78bfa" : "#64748b" }} />
              <span className="font-medium truncate" style={{ color: location === "/wallet" ? "#a78bfa" : "#64748b", fontSize: "10px" }}>Wallet</span>
              {location === "/wallet" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
              )}
            </Link>
          </Show>

          <Show when="signed-out">
            <Link href="/sign-in" data-testid="nav-tab-signin" className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative" onClick={() => setGamesOpen(false)}>
              <LogIn size={22} strokeWidth={location.startsWith("/sign") ? 2.5 : 1.8} style={{ color: location.startsWith("/sign") ? "#a78bfa" : "#64748b" }} />
              <span className="font-medium truncate" style={{ color: location.startsWith("/sign") ? "#a78bfa" : "#64748b", fontSize: "10px" }}>Sign In</span>
              {location.startsWith("/sign") && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
              )}
            </Link>
          </Show>
        </div>
      </nav>
    </>
  );
}
