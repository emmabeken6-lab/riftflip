import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Play } from "lucide-react";

const GAMES = [
  { name: "Crash", players: 1247, tag: "HOT", icon: "🚀", color: "#ef4444", desc: "Watch the multiplier climb — cash out before it crashes!" },
  { name: "Coinflip", players: 892, tag: "POPULAR", icon: "🪙", color: "#f59e0b", desc: "50/50 coin flip with up to 2x your bet" },
  { name: "Mines", players: 634, tag: "NEW", icon: "💎", color: "#10b981", desc: "Avoid the mines, collect the gems, multiply your Robux" },
  { name: "Slots", players: 2103, tag: "HOT", icon: "🎰", color: "#8b5cf6", desc: "Classic slots with massive jackpots up to 500x" },
  { name: "Jackpot", players: 445, tag: "LIVE", icon: "🏆", color: "#3b82f6", desc: "Drop in your Robux — the more you bet, the better odds" },
  { name: "Roulette", players: 778, tag: "LIVE", icon: "🎯", color: "#ec4899", desc: "European roulette with real-time action" },
  { name: "Blackjack", players: 312, tag: "LIVE", icon: "🃏", color: "#06b6d4", desc: "Beat the dealer to 21. Classic blackjack rules." },
  { name: "Dice", players: 567, tag: "POPULAR", icon: "🎲", color: "#f97316", desc: "Set your target number and roll to win" },
  { name: "Wheel", players: 891, tag: "HOT", icon: "🎡", color: "#a855f7", desc: "Spin the wheel of fortune for instant prizes" },
  { name: "Plinko", players: 423, tag: "NEW", icon: "🔵", color: "#0ea5e9", desc: "Drop the ball and watch it bounce to big multipliers" },
  { name: "Tower", players: 289, tag: "NEW", icon: "🏗️", color: "#84cc16", desc: "Climb the tower floor by floor — how high dare you go?" },
  { name: "Cases", players: 1584, tag: "HOT", icon: "📦", color: "#f43f5e", desc: "Open Roblox-inspired cases for rare item wins" },
];

const FILTERS = ["All", "Popular", "New", "Live", "Slots"];

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
    <div className="min-h-screen px-4 md:px-6 py-6" style={{ background: "#080614" }}>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1">Games</h1>
        <p className="text-slate-500 text-sm">{GAMES.length} games available</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide" data-testid="game-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="games-grid">
        {filtered.map((game, i) => (
          <motion.div
            key={game.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="group cursor-pointer rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.2s ease",
            }}
            data-testid={`game-card-${game.name.toLowerCase()}`}
          >
            <div
              className="relative h-32 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${game.color}30, ${game.color}15)` }}
            >
              <span className="text-5xl">{game.icon}</span>
              <span
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-bold"
                style={{
                  background:
                    game.tag === "HOT" ? "rgba(239,68,68,0.9)" :
                    game.tag === "NEW" ? "rgba(16,185,129,0.9)" :
                    game.tag === "LIVE" ? "rgba(59,130,246,0.9)" : "rgba(139,92,246,0.9)",
                }}
              >
                {game.tag === "LIVE" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1 animate-pulse" />}
                {game.tag}
              </span>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.9)", boxShadow: "0 0 20px rgba(124,58,237,0.6)" }}
                >
                  <Play size={20} className="text-white ml-1" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold text-sm">{game.name}</h3>
                <Zap size={12} style={{ color: game.color }} />
              </div>
              <p className="text-slate-500 text-xs mb-2 line-clamp-2">{game.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-xs flex items-center gap-1">
                  <Users size={10} />{game.players.toLocaleString()}
                </span>
                <button
                  className="px-3 py-1 rounded-lg text-white text-xs font-bold transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  data-testid={`play-${game.name.toLowerCase()}-btn`}
                >
                  Play
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
