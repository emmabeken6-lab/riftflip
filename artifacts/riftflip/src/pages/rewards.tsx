import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Gift, Star, Trophy, Copy, LogIn, CheckCircle, Flame, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const VIP_TIERS = [
  { name: "Bronze", color: "#cd7f32", bg: "#1a0e00", border: "#3a2200", perks: ["5% Rakeback", "Weekly Bonus"] },
  { name: "Silver", color: "#c0c0c0", bg: "#1a1a1a", border: "#333", perks: ["8% Rakeback", "Priority Chat"] },
  { name: "Gold", color: "#ffd700", bg: "#1a1500", border: "#3a3000", perks: ["12% Rakeback", "Bonus Spins"] },
  { name: "Diamond", color: "#7dd3fc", bg: "#0a1a2a", border: "#1a3a5a", perks: ["18% Rakeback", "VIP Manager"] },
  { name: "Elite", color: "#a78bfa", bg: "#1a0a2a", border: "#3a1a5a", perks: ["25% Rakeback", "Dedicated Manager"] },
];

const DAILY_REWARDS = [
  { day: 1, tokens: 0, xp: 20 },
  { day: 2, tokens: 1, xp: 30 },
  { day: 3, tokens: 1, xp: 30 },
  { day: 4, tokens: 2, xp: 50 },
  { day: 5, tokens: 2, xp: 50 },
  { day: 6, tokens: 3, xp: 75 },
  { day: 7, tokens: 4, xp: 100 },
];

const TABS = [
  { id: "daily", label: "Daily", icon: Gift },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "challenges", label: "Challenges", icon: Star },
  { id: "referral", label: "Refer", icon: Trophy },
] as const;

type Tab = typeof TABS[number]["id"];

function formatTokens(n: number): string {
  if (n >= 1000) return `${n / 1000}K tokens`;
  return `${n} tokens`;
}

export default function Rewards() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const { isSignedIn, isLoading, user } = useAuth();

  const referralCode = isSignedIn && user ? `RIFT-${user.id.slice(-8).toUpperCase()}` : "RIFT-????????";
  const streak = 0;

  const copyReferral = () => {
    if (!isSignedIn) return;
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#111" }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-white font-black text-xl flex items-center gap-2">
            <Trophy size={20} className="text-violet-400" />
            Rewards
          </h1>
          {isSignedIn && user && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <Flame size={13} className="text-orange-400" />
              <span className="text-white font-black text-sm">{streak}</span>
              <span className="text-slate-500 text-xs">day streak</span>
            </div>
          )}
        </div>
        <p className="text-slate-500 text-sm">
          {isSignedIn && user ? `Welcome back, ${user.username}` : "Sign in to claim bonuses"}
        </p>
      </div>

      {/* Sign-in prompt */}
      {!isLoading && !isSignedIn && (
        <div className="mx-4 mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
          <LogIn size={16} className="text-slate-500 flex-shrink-0" />
          <p className="text-slate-400 text-sm flex-1">Sign in to track your streak and claim rewards.</p>
          <Link href="/sign-in">
            <button className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "#7c3aed" }}>Sign In</button>
          </Link>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mx-4 mt-4 p-1 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeTab === tab.id ? "#7c3aed" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#555",
            }}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">

        {/* Daily Rewards Tab */}
        {activeTab === "daily" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold">Daily Rewards</p>
              {isSignedIn && (
                <div className="flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" />
                  <span className="text-orange-400 text-xs font-bold">{streak} day streak</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid #222" }}>
              {DAILY_REWARDS.map((reward, i) => {
                const claimed = isSignedIn && i < streak;
                const isToday = isSignedIn && i === streak;
                return (
                  <div
                    key={reward.day}
                    className="flex items-center gap-4 px-4 py-3.5"
                    style={{
                      background: isToday ? "#1e1530" : claimed ? "#0d1a0d" : "#1a1a1a",
                      borderBottom: i < DAILY_REWARDS.length - 1 ? "1px solid #1e1e1e" : "none",
                    }}
                  >
                    {/* Check / Day circle */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: claimed ? "#14532d" : isToday ? "#2a1f44" : "#222",
                        border: claimed ? "2px solid #16a34a" : isToday ? "2px solid #7c3aed" : "2px solid #2a2a2a",
                      }}
                    >
                      {claimed ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <span className="text-xs font-black" style={{ color: isToday ? "#c4b5fd" : "#444" }}>
                          {reward.day}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: claimed ? "#4ade80" : isToday ? "#c4b5fd" : "#888" }}>
                        Day {reward.day}
                      </p>
                      <p className="text-xs" style={{ color: claimed ? "#166534" : "#444" }}>
                        {claimed ? "Claimed" : isToday ? "Ready to claim" : "Locked"}
                      </p>
                    </div>

                    {/* Rewards — plain text, no emoji */}
                    <div className="text-right">
                      <p className="text-sm font-black" style={{ color: isToday ? "#a78bfa" : claimed ? "#4ade80" : "#555" }}>
                        {formatTokens(reward.tokens)}
                      </p>
                      <p className="text-xs" style={{ color: isToday ? "#7c3aed" : "#333" }}>
                        +{reward.xp} XP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isSignedIn ? (
              <button
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ background: streak < 7 ? "#7c3aed" : "#1e1e1e", color: streak < 7 ? "#fff" : "#444" }}
              >
                {streak < 7
                  ? `Claim Day ${streak + 1} — ${formatTokens(DAILY_REWARDS[streak]?.tokens ?? 0)}`
                  : "All days claimed — come back tomorrow!"}
              </button>
            ) : (
              <Link href="/sign-in">
                <button className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90" style={{ background: "#7c3aed" }}>
                  Sign In to Claim
                </button>
              </Link>
            )}
          </motion.div>
        )}

        {/* VIP Tab */}
        {activeTab === "vip" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-white font-bold mb-1">VIP Club</p>
            <p className="text-slate-500 text-sm mb-4">Unlock exclusive perks as you wager more</p>
            <div className="space-y-3">
              {VIP_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl"
                  style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tier.bg, border: `2px solid ${tier.color}` }}>
                    <Crown size={16} style={{ color: tier.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: tier.color }}>{tier.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      {tier.perks.map((perk) => (
                        <p key={perk} className="text-xs text-slate-600">• {perk}</p>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-700" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-white font-bold mb-3">Daily Challenges</p>
            <div
              className="p-10 rounded-2xl flex flex-col items-center justify-center text-center"
              style={{ background: "#1a1a1a", border: "1px solid #222" }}
            >
              <Trophy size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm font-semibold">No challenges available</p>
              <p className="text-slate-700 text-xs mt-1">
                {isSignedIn ? "Check back tomorrow" : "Sign in to unlock daily challenges"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Referral Tab */}
        {activeTab === "referral" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-white font-bold mb-1">Refer a Friend</p>
            <p className="text-slate-500 text-sm mb-5">
              Earn <span className="text-green-400 font-bold">10%</span> of your friends' deposits forever
            </p>

            <div className="p-5 rounded-2xl mb-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-slate-500 text-xs mb-2">Your referral code</p>
              <div className="flex gap-2 mb-3">
                <div
                  className="flex-1 px-4 py-3 rounded-xl font-mono text-sm font-bold"
                  style={{ background: "#222", border: "1px solid #333", color: isSignedIn ? "#a78bfa" : "#333" }}
                >
                  {referralCode}
                </div>
                <button
                  onClick={copyReferral}
                  disabled={!isSignedIn}
                  className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all hover:opacity-90"
                  style={{
                    background: isSignedIn ? "#7c3aed" : "#1e1e1e",
                    color: isSignedIn ? "#fff" : "#333",
                    cursor: isSignedIn ? "pointer" : "not-allowed",
                  }}
                >
                  <Copy size={14} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-slate-700 text-xs">
                {isSignedIn ? "Share your code and earn when friends deposit" : "Sign in to get your referral code"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Friends Referred", value: "0", color: "#a78bfa" },
                { label: "Tokens Earned", value: "0 tokens", color: "#4ade80" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                  <p className="text-2xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-slate-600 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
