import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronRight } from "lucide-react";

const GAMES = [
  { name: "Crash", icon: "🚀", desc: "Watch the multiplier climb — cash out before it crashes!", tag: "HOT", color: "#ef4444" },
  { name: "Coinflip", icon: "🪙", desc: "50/50 coin flip. Double your Robux or go home.", tag: "POPULAR", color: "#f59e0b" },
  { name: "Mines", icon: "💎", desc: "Avoid the mines, collect the gems, multiply your bet.", tag: "NEW", color: "#10b981" },
  { name: "Slots", icon: "🎰", desc: "Classic slots with massive jackpots up to 500x.", tag: "HOT", color: "#8b5cf6" },
  { name: "Jackpot", icon: "🏆", desc: "Drop in Robux — the more you bet, the better your odds.", tag: "LIVE", color: "#3b82f6" },
  { name: "Roulette", icon: "🎯", desc: "European roulette with real-time action.", tag: "LIVE", color: "#ec4899" },
  { name: "Blackjack", icon: "🃏", desc: "Beat the dealer to 21. Classic rules.", tag: "LIVE", color: "#06b6d4" },
  { name: "Dice", icon: "🎲", desc: "Set your target number and roll to win.", tag: "POPULAR", color: "#f97316" },
  { name: "Wheel", icon: "🎡", desc: "Spin the wheel of fortune for instant prizes.", tag: "HOT", color: "#a855f7" },
  { name: "Plinko", icon: "🔵", desc: "Drop the ball and watch it bounce to big multipliers.", tag: "NEW", color: "#0ea5e9" },
  { name: "Tower", icon: "🏗️", desc: "Climb floor by floor — how high dare you go?", tag: "NEW", color: "#84cc16" },
  { name: "Cases", icon: "📦", desc: "Open Roblox-inspired cases for rare item wins.", tag: "HOT", color: "#f43f5e" },
];

const FILTERS = ["All", "Popular", "New", "Live", "Slots"];

const TAG_COLORS: Record<string, string> = {
  HOT: "rgba(239,68,68,0.9)",
  NEW: "rgba(16,185,129,0.9)",
  LIVE: "rgba(59,130,246,0.9)",
  POPULAR: "rgba(139,92,246,0.9)",
};

export default function Games() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = GAMES.filter((g) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Popular") return g.tag === "POPULAR" || g.tag === "HOT";
    if (activeFilter === "New") return g.tag === "NEW";
    if (activeFilter === "Live") return g.tag === "LIVE";
    if (activeFilter === "Slots") return g.name === "Slots" || g.name === "Cases";
    return true;
  });

  return (
    <div className="min-h-screen px-3 py-4" style={{ background: "#080614" }}>
      <div className="mb-4">
        <h1 className="text-2xl font-black text-white mb-0.5">Games</h1>
        <p className="text-slate-500 text-sm">{GAMES.length} games available</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" data-testid="game-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background: activeFilter === f ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
              color: activeFilter === f ? "#fff" : "#64748b",
              boxShadow: activeFilter === f ? "0 0 16px rgba(124,58,237,0.4)" : "none",
            }}
            data-testid={`filter-${f.toLowerCase()}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="games-grid">
        {filtered.map((game, i) => (
          <motion.div
            key={game.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.03, y: -3 }}
            className="group cursor-pointer rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            data-testid={`game-card-${game.name.toLowerCase()}`}
          >
            <div
              className="relative h-28 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${game.color}28, ${game.color}10)` }}
            >
              <span className="text-5xl">{game.icon}</span>
              <span
                className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg text-white font-bold"
                style={{ background: TAG_COLORS[game.tag] ?? "rgba(139,92,246,0.9)", fontSize: "10px" }}
              >
                {game.tag === "LIVE" && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-300 mr-1 animate-pulse" />
                )}
                {game.tag}
              </span>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.95)", boxShadow: "0 0 16px rgba(124,58,237,0.7)" }}
                >
                  <Play size={16} className="text-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-white font-bold text-sm mb-1">{game.name}</h3>
              <p className="text-slate-500 text-xs mb-2 line-clamp-2">{game.desc}</p>
              <button
                className="w-full py-1.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                data-testid={`play-${game.name.toLowerCase()}-btn`}
              >
                Play
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coming soon teaser */}
      <div className="mt-6 p-5 rounded-2xl text-center" style={{ border: "1px dashed rgba(139,92,246,0.3)" }}>
        <ChevronRight size={24} className="text-violet-600 mx-auto mb-2 rotate-90" />
        <p className="text-slate-600 text-sm">More games coming soon</p>
      </div>
    </div>
  );
}
