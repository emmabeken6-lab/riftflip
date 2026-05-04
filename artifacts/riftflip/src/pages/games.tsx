import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const GAMES = [
  {
    slug: "coinflip",
    name: "Coinflip",
    icon: "🪙",
    desc: "Flip a coin against another player",
  },
  {
    slug: "jackpot",
    name: "Jackpot",
    icon: "🏆",
    desc: "Pool your Robux for a chance to win it all",
  },
  {
    slug: "minefield",
    name: "Minefield",
    icon: "💣",
    desc: "Avoid mines, collect gems",
  },
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
            <Link key={game.slug} href={`/game/${game.slug}`}>
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
                {/* Left accent bar when active */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                    style={{ background: "#818cf8" }}
                  />
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{
                    background: isActive
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isActive ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {game.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-base"
                    style={{ color: isActive ? "#a5b4fc" : "#e2e8f0" }}
                  >
                    {game.name}
                  </p>
                  <p className="text-slate-500 text-xs truncate">{game.desc}</p>
                </div>

                {/* Arrow */}
                <span
                  className="text-lg"
                  style={{ color: isActive ? "#818cf8" : "#334155" }}
                >
                  ›
                </span>
              </motion.div>
            </Link>
          );
        })}

        {/* Footer badge */}
        <div
          className="flex items-center justify-center gap-2 px-5 py-3"
          style={{
            background: "rgba(16,185,129,0.08)",
            borderTop: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <CheckCircle size={15} className="text-green-400" />
          <span className="text-green-400 text-sm font-semibold">
            0% House Edge
          </span>
        </div>
      </motion.div>
    </div>
  );
}
