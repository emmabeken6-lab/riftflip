import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Users, TrendingUp, Star, ChevronRight, Play, Crown, Gift, Flame } from "lucide-react";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

const WINNERS = [
  { user: "CrashKing99", game: "Crash", amount: "R$ 48,200", avatar: "C" },
  { user: "LuckyRoller", game: "Coinflip", amount: "R$ 12,500", avatar: "L" },
  { user: "StarPlayer44", game: "Mines", amount: "R$ 7,800", avatar: "S" },
  { user: "DiamondHands", game: "Slots", amount: "R$ 23,100", avatar: "D" },
  { user: "NeonWarrior", game: "Jackpot", amount: "R$ 94,500", avatar: "N" },
  { user: "BluePhoenix", game: "Roulette", amount: "R$ 15,300", avatar: "B" },
  { user: "GoldRusher", game: "Crash", amount: "R$ 31,700", avatar: "G" },
  { user: "VoidWalker", game: "Dice", amount: "R$ 9,400", avatar: "V" },
];

const FEATURED_GAMES = [
  { name: "Crash", players: 1247, tag: "HOT", color: "from-red-600 to-orange-500", icon: "🚀" },
  { name: "Coinflip", players: 892, tag: "POPULAR", color: "from-yellow-500 to-amber-600", icon: "🪙" },
  { name: "Mines", players: 634, tag: "NEW", color: "from-emerald-600 to-green-500", icon: "💎" },
  { name: "Slots", players: 2103, tag: "HOT", color: "from-purple-600 to-violet-500", icon: "🎰" },
  { name: "Jackpot", players: 445, tag: "LIVE", color: "from-blue-600 to-cyan-500", icon: "🏆" },
  { name: "Roulette", players: 778, tag: "LIVE", color: "from-pink-600 to-rose-500", icon: "🎯" },
];

const CATEGORIES = [
  { name: "Slots", icon: "🎰", count: 48 },
  { name: "Crash Games", icon: "📈", count: 12 },
  { name: "Card Games", icon: "🃏", count: 23 },
  { name: "Live Games", icon: "🔴", count: 8 },
  { name: "Coinflip", icon: "🪙", count: 6 },
  { name: "Jackpot", icon: "🏆", count: 5 },
];

const VIP_TIERS = [
  { name: "Bronze", color: "#cd7f32", perks: "5% Rakeback" },
  { name: "Silver", color: "#c0c0c0", perks: "8% Rakeback" },
  { name: "Gold", color: "#ffd700", perks: "12% Rakeback + Bonus" },
  { name: "Diamond", color: "#b9f2ff", perks: "18% + Priority Support" },
  { name: "Elite", color: "#a78bfa", perks: "25% + Dedicated Manager" },
];

function JackpotTicker() {
  const [amount, setAmount] = useState(2847392);

  useEffect(() => {
    const interval = setInterval(() => {
      setAmount((prev) => prev + Math.floor(Math.random() * 150 + 50));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-center gap-4 py-3 px-6"
      style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.2), rgba(99,102,241,0.2))", borderBottom: "1px solid rgba(139,92,246,0.3)" }}
      data-testid="jackpot-ticker"
    >
      <Zap size={16} className="text-yellow-400 animate-pulse" />
      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Live Jackpot</span>
      <span
        className="text-2xl font-black tabular-nums"
        style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        R$ {amount.toLocaleString()}
      </span>
      <Zap size={16} className="text-yellow-400 animate-pulse" />
    </div>
  );
}

function LiveWinnersScrolling() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % WINNERS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const winner = WINNERS[index];

  return (
    <div className="overflow-hidden h-10 flex items-center" data-testid="live-winners-feed">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 w-full"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {winner.avatar}
          </div>
          <span className="text-slate-300 text-sm">
            <span className="font-bold text-violet-300">{winner.user}</span>
            {" won "}
            <span className="font-bold text-green-400">{winner.amount}</span>
            {" on "}
            <span className="font-medium text-slate-200">{winner.game}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#080614" }}>
      <JackpotTicker />

      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-16 md:py-24 text-center"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.35) 0%, transparent 70%)",
        }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1 + "px",
                height: Math.random() * 2 + 1 + "px",
                background: "rgba(167,139,250,0.7)",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: Math.random() * 3 + "s",
              }}
            />
          ))}
        </div>

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
          <img
            src={riftflipLogo}
            alt="Riftflip"
            className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-6 drop-shadow-2xl"
            data-testid="hero-logo"
            style={{ filter: "drop-shadow(0 0 40px rgba(124,58,237,0.8))" }}
          />
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl md:text-7xl font-black mb-4 tracking-tight"
          style={{ background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          data-testid="hero-title"
        >
          RIFTFLIP
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-slate-400 text-lg md:text-xl mb-8 max-w-md mx-auto"
        >
          The Ultimate Roblox Casino Experience
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/games">
            <button
              className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                boxShadow: "0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)",
              }}
              data-testid="play-now-btn"
            >
              Play Now
            </button>
          </Link>
          <Link href="/rewards">
            <button
              className="px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.4)",
                color: "#a78bfa",
              }}
              data-testid="claim-bonus-btn"
            >
              Claim Bonus
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Live Winners */}
      <section
        className="mx-4 md:mx-6 mb-6 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}
        data-testid="winners-section"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-semibold uppercase tracking-widest">Live Winners</span>
        </div>
        <LiveWinnersScrolling />
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-3 gap-3 mx-4 md:mx-6 mb-8" data-testid="stats-bar">
        {[
          { label: "Online Now", value: "8,492", icon: Users, color: "#22c55e" },
          { label: "Wagered Today", value: "R$ 2.4M", icon: TrendingUp, color: "#3b82f6" },
          { label: "Biggest Win", value: "R$ 94,500", icon: Star, color: "#fbbf24" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            data-testid={`stat-${stat.label.replace(" ", "-").toLowerCase()}`}
          >
            <stat.icon size={18} style={{ color: stat.color }} />
            <span className="text-white font-bold text-sm md:text-base">{stat.value}</span>
            <span className="text-slate-500 text-xs text-center">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Featured Games Carousel */}
      <section className="mb-8 px-4 md:px-6" data-testid="featured-games-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Flame size={20} className="text-orange-400" />
            Featured Games
          </h2>
          <Link href="/games" className="flex items-center gap-1 text-violet-400 text-sm font-medium">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {FEATURED_GAMES.map((game, i) => (
            <motion.div
              key={game.name}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.04, y: -3 }}
              className="flex-shrink-0 snap-start cursor-pointer group"
              style={{ width: "160px" }}
              data-testid={`featured-game-${game.name.toLowerCase()}`}
            >
              <div
                className="w-full h-40 rounded-2xl flex flex-col items-center justify-center mb-2 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${game.color.split(" ")[0].replace("from-", "")} 0%, ${game.color.split(" ")[1]?.replace("to-", "") || "#1e1b4b"} 100%)`,
                }}
              >
                <span className="text-5xl mb-2">{game.icon}</span>
                <span
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-white text-xs font-bold"
                  style={{
                    background:
                      game.tag === "HOT"
                        ? "rgba(239,68,68,0.9)"
                        : game.tag === "NEW"
                        ? "rgba(16,185,129,0.9)"
                        : game.tag === "LIVE"
                        ? "rgba(59,130,246,0.9)"
                        : "rgba(139,92,246,0.9)",
                  }}
                >
                  {game.tag}
                </span>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                  <Play size={32} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
              </div>
              <p className="text-white font-bold text-sm text-center">{game.name}</p>
              <p className="text-slate-500 text-xs text-center flex items-center justify-center gap-1">
                <Users size={11} />{game.players.toLocaleString()} playing
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Categories */}
      <section className="mb-8 px-4 md:px-6" data-testid="game-categories-section">
        <h2 className="text-white font-bold text-xl mb-4">Game Categories</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.05 }}
              className="p-4 rounded-2xl text-center cursor-pointer transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
              data-testid={`category-${cat.name.toLowerCase().replace(" ", "-")}`}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="text-white text-xs font-semibold">{cat.name}</p>
              <p className="text-slate-500 text-xs">{cat.count} games</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Promotions */}
      <section className="mb-8 px-4 md:px-6" data-testid="promotions-section">
        <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
          <Gift size={20} className="text-violet-400" />
          Promotions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Daily Bonus",
              desc: "Log in every day to claim your free Robux bonus",
              cta: "Claim",
              gradient: "from-violet-600 to-indigo-600",
              icon: "🎁",
            },
            {
              title: "Weekend Jackpot",
              desc: "R$ 500,000 jackpot every weekend. Enter now!",
              cta: "Enter",
              gradient: "from-yellow-500 to-orange-600",
              icon: "💰",
            },
            {
              title: "Refer a Friend",
              desc: "Earn 10% of your friend's deposits forever",
              cta: "Share",
              gradient: "from-emerald-600 to-teal-600",
              icon: "👥",
            },
          ].map((promo) => (
            <div
              key={promo.title}
              className="p-5 rounded-2xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))`,
                border: "1px solid rgba(139,92,246,0.3)",
              }}
              data-testid={`promo-${promo.title.toLowerCase().replace(" ", "-")}`}
            >
              <div className="text-4xl mb-3">{promo.icon}</div>
              <h3 className="text-white font-bold text-lg mb-1">{promo.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{promo.desc}</p>
              <button
                className="px-5 py-2 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                data-testid={`promo-${promo.title.toLowerCase().replace(" ", "-")}-btn`}
              >
                {promo.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* VIP Club */}
      <section className="mb-8 px-4 md:px-6" data-testid="vip-section">
        <div
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(79,70,229,0.2) 100%)",
            border: "1px solid rgba(139,92,246,0.4)",
          }}
        >
          <Crown size={28} className="text-yellow-400 mb-3" />
          <h2 className="text-white font-bold text-2xl mb-2">VIP Club</h2>
          <p className="text-slate-400 text-sm mb-6">Unlock exclusive perks as you play more</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {VIP_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="flex-shrink-0 p-4 rounded-xl text-center min-w-24"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${tier.color}40`,
                }}
                data-testid={`vip-tier-${tier.name.toLowerCase()}`}
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: tier.color }}
                >
                  <Crown size={14} className="text-black" />
                </div>
                <p className="text-white text-xs font-bold mb-1">{tier.name}</p>
                <p className="text-slate-400 text-xs">{tier.perks}</p>
              </div>
            ))}
          </div>
          <button
            className="mt-4 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
            data-testid="join-vip-btn"
          >
            Join VIP Club
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-8 px-4 md:px-6" data-testid="how-it-works-section">
        <h2 className="text-white font-bold text-xl mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "1", title: "Sign Up", desc: "Create your free account in seconds", icon: "👤" },
            { step: "2", title: "Deposit", desc: "Add Robux to your casino wallet", icon: "💳" },
            { step: "3", title: "Play & Win", desc: "Choose a game and start winning", icon: "🏆" },
          ].map((item) => (
            <div key={item.step} className="text-center" data-testid={`step-${item.step}`}>
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" }}
              >
                {item.icon}
              </div>
              <p className="text-violet-400 text-xs font-bold mb-1">STEP {item.step}</p>
              <p className="text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-slate-500 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center"
        style={{ borderTop: "1px solid rgba(139,92,246,0.2)" }}
        data-testid="footer"
      >
        <img src={riftflipLogo} alt="Riftflip" className="w-10 h-10 mx-auto mb-3 opacity-60" />
        <p className="text-slate-600 text-xs mb-2">2024 Riftflip Casino. All rights reserved.</p>
        <p className="text-slate-700 text-xs">Play responsibly. For entertainment purposes only.</p>
        <div className="flex justify-center gap-4 mt-4">
          {["Terms", "Privacy", "Responsible Gaming", "Support"].map((link) => (
            <span key={link} className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors">
              {link}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
