import { useLocation } from "wouter";
import { motion } from "framer-motion";

const GAMES = [
  { slug: "coinflip", name: "Coinflip", icon: "🪙" },
  { slug: "jackpot", name: "Jackpot", icon: "🔥" },
  { slug: "minefield", name: "Minefield", icon: "💣" },
];

export default function Games() {
  const [location] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "#080614" }}
      data-testid="games-page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0f0d22 0%, #0c0a1e 100%)",
          border: "1px solid rgba(99,102,241,0.35)",
          boxShadow: "0 8px 40px rgba(79,70,229,0.25)",
        }}
        data-testid="games-menu"
      >
        {GAMES.map((game, i) => {
          const isActive = location === `/game/${game.slug}`;
          return (
            <a key={game.slug} href={`/game/${game.slug}`}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer relative transition-colors"
                style={{
                  borderBottom:
                    i < GAMES.length - 1
                      ? "1px solid rgba(99,102,241,0.15)"
                      : "none",
                  background: isActive
                    ? "rgba(99,102,241,0.18)"
                    : "transparent",
                }}
                data-testid={`game-row-${game.slug}`}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                    style={{ background: "#e97c2e" }}
                  />
                )}

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    fontSize: "20px",
                    background: isActive
                      ? "rgba(233,124,46,0.18)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isActive ? "rgba(233,124,46,0.38)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {game.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-base"
                    style={{ color: isActive ? "#f0a060" : "#e2e8f0" }}
                  >
                    {game.name}
                  </p>
                </div>

                {isActive && (
                  <span className="text-xs font-bold" style={{ color: "#4ade80" }}>
                    1.1
                  </span>
                )}
              </motion.div>
            </a>
          );
        })}

        <div
          className="flex items-center justify-center gap-2 px-5 py-3"
          style={{
            background: "rgba(16,185,129,0.08)",
            borderTop: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <span className="text-green-400" style={{ fontSize: "15px" }}>🟢</span>
          <span className="text-green-400 text-sm font-semibold">
            0% House Edge
          </span>
        </div>
      </motion.div>
    </div>
  );
}
