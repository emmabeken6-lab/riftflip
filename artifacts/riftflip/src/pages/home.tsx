import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Trophy, Wallet, Coins, Flame, Bomb } from "lucide-react";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

const GAMES = [
  { slug: "coinflip", name: "Coinflip", Icon: Coins },
  { slug: "jackpot", name: "Jackpot", Icon: Flame },
  { slug: "minefield", name: "Minefield", Icon: Bomb },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#111" }}>

      <div
        className="md:hidden flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid #222" }}
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

      {/* Banner */}
      <section className="px-3 pt-3 pb-4" data-testid="hero-banner">
        <div className="relative rounded-xl overflow-hidden">
          <img
            src="/banner.png"
            alt="Riftflip Casino"
            className="w-full object-cover"
            style={{ display: "block", maxHeight: "220px", objectPosition: "center" }}
            data-testid="hero-banner-img"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, transparent 70%)" }}
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Link href="/games" data-testid="play-games-btn">
              <button aria-label="Play Games" className="px-10 py-5 rounded-xl" style={{ background: "transparent", border: "none", cursor: "pointer" }} />
            </Link>
            <Link href="/rewards" data-testid="rewards-btn">
              <button aria-label="How it works" className="px-10 py-5 rounded-xl" style={{ background: "transparent", border: "none", cursor: "pointer" }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Current Event */}
      <section className="px-3 mb-4" data-testid="current-event-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-base">Current Event</h2>
          <Link href="/rewards" className="flex items-center gap-1 text-slate-500 text-xs font-medium" data-testid="view-all-winners-link">
            View all winners <ChevronRight size={14} />
          </Link>
        </div>
        <div
          className="p-8 rounded-xl flex flex-col items-center justify-center text-center"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: "160px" }}
          data-testid="current-event-card"
        >
          <Sparkles size={32} className="text-slate-600 mb-3" />
          <p className="text-white font-bold mb-1">No Active Event</p>
          <p className="text-slate-500 text-sm mb-4">Check back soon for the next giveaway!</p>
          <Link href="/rewards" data-testid="view-previous-winners-btn">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[#2a2a2a]"
              style={{ background: "#222", border: "1px solid #333", color: "#aaa" }}
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
          <Link href="/games" className="flex items-center gap-1 text-slate-500 text-xs font-medium" data-testid="live-wins-view-all">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }} data-testid="live-wins-card">
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: "1px solid #222", background: "#161616" }}
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
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href={`/game/${game.slug}`} data-testid={`home-game-${game.slug}`}>
                <div
                  className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-colors hover:bg-[#222]"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                >
                  <game.Icon size={28} strokeWidth={1.6} style={{ color: "#a78bfa" }} />
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
              className="p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#222]"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <Trophy size={20} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">Rewards</p>
                <p className="text-slate-500 text-xs">Claim bonuses</p>
              </div>
            </div>
          </Link>
          <Link href="/wallet" data-testid="quick-wallet-link">
            <div
              className="p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#222]"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <Wallet size={20} className="text-blue-400 flex-shrink-0" />
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
