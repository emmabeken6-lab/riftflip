import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Trophy, Wallet } from "lucide-react";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

const GAMES = [
  { slug: "coinflip", name: "Coinflip", icon: "🪙" },
  { slug: "jackpot", name: "Jackpot", icon: "🔥" },
  { slug: "minefield", name: "Minefield", icon: "💣" },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#080614" }}>

      <div
        className="md:hidden flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
        data-testid="mobile-home-header"
      >
        <img src={riftflipLogo} alt="Riftflip" className="w-8 h-8 object-contain" />
        <span
          className="text-lg font-black tracking-tight"
          style={{
            background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          RIFTFLIP
        </span>
      </div>

      {/* Banner hero */}
      <section className="px-3 pt-3 pb-4" data-testid="hero-banner">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 8px 40px rgba(124,58,237,0.3)" }}
        >
          <img
            src="/banner.png"
            alt="Riftflip Casino"
            className="w-full object-cover"
            style={{ display: "block", maxHeight: "220px", objectPosition: "center" }}
            data-testid="hero-banner-img"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
            }}
          />
          {/* Invisible overlay buttons over "Play" and "How it works" in banner image */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Link href="/games" data-testid="play-games-btn">
              <button
                aria-label="Play Games"
                className="px-10 py-5 rounded-xl"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              />
            </Link>
            <Link href="/rewards" data-testid="rewards-btn">
              <button
                aria-label="How it works"
                className="px-10 py-5 rounded-xl"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Current Event */}
      <section className="px-3 mb-4" data-testid="current-event-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-base">Current Event</h2>
          <Link
            href="/rewards"
            className="flex items-center gap-1 text-slate-500 text-xs font-medium"
            data-testid="view-all-winners-link"
          >
            View all winners <ChevronRight size={14} />
          </Link>
        </div>
        <div
          className="p-8 rounded-2xl flex flex-col items-center justify-center text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            minHeight: "160px",
          }}
          data-testid="current-event-card"
        >
          <Sparkles size={32} className="text-slate-600 mb-3" />
          <p className="text-white font-bold mb-1">No Active Event</p>
          <p className="text-slate-500 text-sm mb-4">
            Check back soon for the next giveaway!
          </p>
          <Link href="/rewards" data-testid="view-previous-winners-btn">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 transition-all hover:text-white"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Trophy size={14} />
              View Previous Winners
            </button>
          </Link>
        </div>
      </section>

      {/* Live Wins */}
      <section className="px-3 mb-4" data-testid="live-wins-section">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-base">Live Wins</h2>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <Link
            href="/games"
            className="flex items-center gap-1 text-slate-500 text-xs font-medium"
            data-testid="live-wins-view-all"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          data-testid="live-wins-card"
        >
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <span className="text-green-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live Wins
            </span>
            <span className="text-slate-600 text-xs">Real-time</span>
          </div>
          <div className="px-4 py-10 text-center">
            <p className="text-slate-600 text-sm">No wins recorded yet</p>
            <p className="text-slate-700 text-xs mt-1">Be the first to win!</p>
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="px-3 mb-4" data-testid="games-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-base">Games</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href={`/game/${game.slug}`} data-testid={`home-game-${game.slug}`}>
                <div
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(139,92,246,0.2)",
                  }}
                >
                  <span className="text-3xl">{game.icon}</span>
                  <span className="text-white text-xs font-bold text-center">{game.name}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-3 mb-6" data-testid="quick-links-section">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/rewards" data-testid="quick-rewards-link">
            <div
              className="p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <Trophy size={22} className="text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">Rewards</p>
                <p className="text-slate-500 text-xs">Claim bonuses</p>
              </div>
            </div>
          </Link>
          <Link href="/wallet" data-testid="quick-wallet-link">
            <div
              className="p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
            >
              <Wallet size={22} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">Wallet</p>
                <p className="text-slate-500 text-xs">Deposit & withdraw</p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
