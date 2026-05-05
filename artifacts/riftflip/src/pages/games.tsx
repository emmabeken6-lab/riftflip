import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Coins, Flame, Bomb } from "lucide-react";

const GAMES = [
  { slug: "coinflip", name: "Coinflip", Icon: Coins },
  { slug: "jackpot", name: "Jackpot", Icon: Flame },
  { slug: "minefield", name: "Minefield", Icon: Bomb },
];

export default function Games() {
  const [location] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "#111" }}
      data-testid="games-page"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        data-testid="games-menu"
      >
        {GAMES.map((game, i) => {
          const isActive = location === `/game/${game.slug}`;
          return (
            <a key={game.slug} href={`/game/${game.slug}`}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer relative transition-colors hover:bg-[#222]"
                style={{
                  borderBottom: i < GAMES.length - 1 ? "1px solid #222" : "none",
                  background: isActive ? "#222" : "transparent",
                }}
                data-testid={`game-row-${game.slug}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: "#7c3aed" }} />
                )}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive ? "#2a1f44" : "#222",
                    border: "1px solid #333",
                  }}
                >
                  <game.Icon
                    size={20}
                    strokeWidth={1.8}
                    style={{ color: isActive ? "#a78bfa" : "#666" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base" style={{ color: isActive ? "#e2e8f0" : "#ccc" }}>
                    {game.name}
                  </p>
                  <p className="text-xs" style={{ color: "#555" }}>0% house edge</p>
                </div>
                {isActive && (
                  <span className="text-xs font-bold text-violet-400">Playing</span>
                )}
              </motion.div>
            </a>
          );
        })}
        <div
          className="flex items-center justify-center gap-2 px-5 py-3"
          style={{ background: "#161616", borderTop: "1px solid #222" }}
        >
          <span className="text-green-500 text-xs">●</span>
          <span className="text-green-600 text-xs font-medium">0% House Edge on all games</span>
        </div>
      </motion.div>
    </div>
  );
}
