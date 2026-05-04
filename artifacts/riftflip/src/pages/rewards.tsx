import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Gift, Star, Check, ChevronRight, Copy } from "lucide-react";

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const CURRENT_DAY = 4;
const DAY_REWARDS = [100, 200, 350, 500, 750, 1200, 2500];

const VIP_TIERS = [
  { name: "Bronze", color: "#cd7f32", textColor: "#e8b88a", perks: ["5% Rakeback", "Weekly Bonus"], current: false },
  { name: "Silver", color: "#c0c0c0", textColor: "#d4d4d8", perks: ["8% Rakeback", "Priority Chat"], current: true },
  { name: "Gold", color: "#ffd700", textColor: "#fcd34d", perks: ["12% Rakeback", "Bonus Spins", "Priority Support"], current: false },
  { name: "Diamond", color: "#b9f2ff", textColor: "#93c5fd", perks: ["18% Rakeback", "All Perks", "VIP Manager"], current: false },
  { name: "Elite", color: "#a78bfa", textColor: "#c4b5fd", perks: ["25% Rakeback", "Custom Limits", "Dedicated Manager"], current: false },
];

const CHALLENGES = {
  daily: [
    { id: 1, title: "Win 3 Coinflips", progress: 2, total: 3, reward: 150, claimed: false },
    { id: 2, title: "Wager R$ 5,000", progress: 3200, total: 5000, reward: 300, claimed: false },
    { id: 3, title: "Play 5 Different Games", progress: 5, total: 5, reward: 500, claimed: true },
  ],
  weekly: [
    { id: 4, title: "Wager R$ 50,000", progress: 32000, total: 50000, reward: 2500, claimed: false },
    { id: 5, title: "Win 20 Games", progress: 14, total: 20, reward: 1500, claimed: false },
  ],
};

const BONUS_HISTORY = [
  { type: "Daily Login", amount: "+R$ 500", date: "Today", status: "Claimed" },
  { type: "Rakeback", amount: "+R$ 840", date: "Yesterday", status: "Claimed" },
  { type: "Challenge", amount: "+R$ 300", date: "2 days ago", status: "Claimed" },
  { type: "Referral", amount: "+R$ 1,200", date: "3 days ago", status: "Claimed" },
  { type: "Daily Login", amount: "+R$ 350", date: "4 days ago", status: "Claimed" },
];

export default function Rewards() {
  const [copied, setCopied] = useState(false);
  const [claimedDailyChallenges, setClaimedDailyChallenges] = useState<number[]>([3]);
  const referralCode = "RIFT-K9X4-MWQZ";

  const copyReferral = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const claimChallenge = (id: number) => {
    setClaimedDailyChallenges((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-6" style={{ background: "#080614" }} data-testid="rewards-page">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-2">
          <Crown size={28} className="text-yellow-400" />
          Rewards
        </h1>
        <p className="text-slate-500 text-sm">Claim bonuses and track your progress</p>
      </div>

      {/* Daily Login Streak */}
      <section
        className="mb-6 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)" }}
        data-testid="daily-streak"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-lg">Daily Login</h2>
            <p className="text-slate-500 text-sm">Day {CURRENT_DAY} streak</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(CURRENT_DAY)].map((_, i) => (
              <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((day) => {
            const claimed = day < CURRENT_DAY;
            const current = day === CURRENT_DAY;
            const future = day > CURRENT_DAY;
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1"
                data-testid={`day-${day}`}
              >
                <div
                  className="w-full aspect-square rounded-xl flex items-center justify-center relative"
                  style={{
                    background: claimed
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : current
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "rgba(255,255,255,0.05)",
                    border: current ? "2px solid rgba(167,139,250,0.8)" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: current ? "0 0 20px rgba(124,58,237,0.5)" : "none",
                  }}
                >
                  {claimed ? (
                    <Check size={14} className="text-white" />
                  ) : (
                    <span className="text-white text-xs font-bold opacity-60">{day}</span>
                  )}
                </div>
                <span
                  className="text-xs font-bold"
                  style={{ color: claimed ? "#10b981" : current ? "#a78bfa" : "#475569" }}
                >
                  R${DAY_REWARDS[day - 1] >= 1000 ? `${DAY_REWARDS[day - 1] / 1000}K` : DAY_REWARDS[day - 1]}
                </span>
              </div>
            );
          })}
        </div>
        {CURRENT_DAY < 7 && (
          <button
            className="w-full mt-4 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            data-testid="claim-daily-btn"
          >
            Claim Day {CURRENT_DAY} — R$ {DAY_REWARDS[CURRENT_DAY - 1].toLocaleString()}
          </button>
        )}
      </section>

      {/* VIP Progress */}
      <section
        className="mb-6 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.2)" }}
        data-testid="vip-progress"
      >
        <h2 className="text-white font-bold text-lg mb-1">VIP Status</h2>
        <p className="text-slate-500 text-sm mb-4">Currently: <span className="text-slate-300 font-semibold">Silver</span></p>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Silver — R$ 32,000 wagered</span>
            <span>Gold — R$ 50,000</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #c0c0c0, #ffd700)" }}
              initial={{ width: 0 }}
              animate={{ width: "64%" }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">R$ 18,000 more to reach Gold</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIP_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="flex-shrink-0 p-3 rounded-xl min-w-28"
              style={{
                background: tier.current ? `${tier.color}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${tier.current ? tier.color + "60" : "rgba(255,255,255,0.06)"}`,
              }}
              data-testid={`vip-${tier.name.toLowerCase()}`}
            >
              <div className="flex items-center gap-1 mb-2">
                <Crown size={12} style={{ color: tier.color }} />
                <span className="text-xs font-bold" style={{ color: tier.textColor }}>{tier.name}</span>
                {tier.current && (
                  <span className="text-xs px-1 rounded" style={{ background: tier.color + "30", color: tier.color, fontSize: "9px" }}>
                    CURRENT
                  </span>
                )}
              </div>
              {tier.perks.map((perk) => (
                <p key={perk} className="text-xs text-slate-500 flex items-center gap-1">
                  <span style={{ color: tier.color }}>•</span> {perk}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Daily Challenges */}
      <section className="mb-6" data-testid="daily-challenges">
        <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <Gift size={18} className="text-violet-400" />
          Daily Challenges
        </h2>
        <div className="space-y-3">
          {CHALLENGES.daily.map((ch) => {
            const isClaimed = claimedDailyChallenges.includes(ch.id);
            const pct = Math.min(100, (ch.progress / ch.total) * 100);
            const done = pct >= 100;
            return (
              <div
                key={ch.id}
                className="p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${isClaimed ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.2)"}`,
                }}
                data-testid={`challenge-${ch.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{ch.title}</p>
                    <p className="text-violet-400 text-xs font-bold">+R$ {ch.reward.toLocaleString()} reward</p>
                  </div>
                  {isClaimed ? (
                    <span className="px-3 py-1 rounded-lg text-green-400 text-xs font-bold" style={{ background: "rgba(16,185,129,0.15)" }}>
                      Claimed
                    </span>
                  ) : done ? (
                    <button
                      onClick={() => claimChallenge(ch.id)}
                      className="px-3 py-1 rounded-lg text-white text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                      data-testid={`claim-challenge-${ch.id}`}
                    >
                      Claim
                    </button>
                  ) : null}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isClaimed ? "#10b981" : "linear-gradient(90deg, #7c3aed, #a78bfa)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <p className="text-slate-600 text-xs">
                  {typeof ch.progress === "number" && ch.total > 100
                    ? `R$ ${ch.progress.toLocaleString()} / R$ ${ch.total.toLocaleString()}`
                    : `${ch.progress} / ${ch.total}`}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly Challenges */}
      <section className="mb-6" data-testid="weekly-challenges">
        <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <Star size={18} className="text-yellow-400" />
          Weekly Challenges
        </h2>
        <div className="space-y-3">
          {CHALLENGES.weekly.map((ch) => {
            const pct = Math.min(100, (ch.progress / ch.total) * 100);
            return (
              <div
                key={ch.id}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}
                data-testid={`weekly-challenge-${ch.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{ch.title}</p>
                    <p className="text-yellow-400 text-xs font-bold">+R$ {ch.reward.toLocaleString()} reward</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <p className="text-slate-600 text-xs">
                  {ch.total > 100
                    ? `R$ ${ch.progress.toLocaleString()} / R$ ${ch.total.toLocaleString()}`
                    : `${ch.progress} / ${ch.total}`}
                  {" "}<span className="text-violet-400">({Math.round(pct)}%)</span>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Referral */}
      <section
        className="mb-6 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.3)" }}
        data-testid="referral-section"
      >
        <h2 className="text-white font-bold text-lg mb-1">Refer a Friend</h2>
        <p className="text-slate-400 text-sm mb-4">Earn <span className="text-green-400 font-bold">10%</span> of your friends' deposits forever</p>
        <div className="flex gap-2 mb-4">
          <div
            className="flex-1 px-4 py-3 rounded-xl font-mono text-sm text-violet-300"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}
            data-testid="referral-code"
          >
            {referralCode}
          </div>
          <button
            onClick={copyReferral}
            className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }}
            data-testid="copy-referral-btn"
          >
            <Copy size={15} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Friends Referred", value: "7" },
            { label: "Total Earned", value: "R$ 4,200" },
            { label: "This Month", value: "R$ 840" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)" }}>
              <p className="text-green-400 font-bold text-lg">{stat.value}</p>
              <p className="text-slate-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bonus History */}
      <section className="mb-8" data-testid="bonus-history">
        <h2 className="text-white font-bold text-lg mb-3">Bonus History</h2>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {BONUS_HISTORY.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: i < BONUS_HISTORY.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              }}
              data-testid={`history-row-${i}`}
            >
              <div>
                <p className="text-white text-sm font-medium">{item.type}</p>
                <p className="text-slate-500 text-xs">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-sm">{item.amount}</p>
                <p className="text-slate-600 text-xs">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
