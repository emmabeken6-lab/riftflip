import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { Crown, Gift, Star, Trophy, Copy, LogIn } from "lucide-react";

const VIP_TIERS = [
  { name: "Bronze", color: "#cd7f32", perks: ["5% Rakeback", "Weekly Bonus"] },
  { name: "Silver", color: "#c0c0c0", perks: ["8% Rakeback", "Priority Chat"] },
  { name: "Gold", color: "#ffd700", perks: ["12% Rakeback", "Bonus Spins"] },
  { name: "Diamond", color: "#b9f2ff", perks: ["18% Rakeback", "VIP Manager"] },
  { name: "Elite", color: "#a78bfa", perks: ["25% Rakeback", "Dedicated Manager"] },
];

const DAILY_REWARDS = [100, 200, 350, 500, 750, 1200, 2500];

export default function Rewards() {
  const [copied, setCopied] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const referralCode = isSignedIn ? `RIFT-${(user?.id ?? "").slice(-8).toUpperCase()}` : "RIFT-????-????";

  const copyReferral = () => {
    if (!isSignedIn) return;
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-3 py-4" style={{ background: "#080614" }} data-testid="rewards-page">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white mb-0.5 flex items-center gap-2">
          <Crown size={24} className="text-yellow-400" />
          Rewards
        </h1>
        <p className="text-slate-500 text-sm">
          {isSignedIn ? `Welcome back, ${user?.username ?? user?.firstName ?? "Player"}!` : "Sign in to claim bonuses and track progress"}
        </p>
      </div>

      {/* Sign-in prompt (signed-out only) */}
      {isLoaded && !isSignedIn && (
        <div
          className="mb-5 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}
          data-testid="signin-notice"
        >
          <LogIn size={18} className="text-violet-400 flex-shrink-0" />
          <p className="text-slate-300 text-sm flex-1">
            <span className="text-violet-300 font-semibold">Sign in</span> to track your streak, claim challenges, and earn referral bonuses.
          </p>
          <Link href="/sign-in">
            <button
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              Sign In
            </button>
          </Link>
        </div>
      )}

      {/* Daily Login Streak */}
      <section
        className="mb-5 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)" }}
        data-testid="daily-streak"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold">Daily Login</h2>
            <p className="text-slate-500 text-sm">Log in every day to earn Robux</p>
          </div>
          <Gift size={20} className="text-violet-400" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {DAILY_REWARDS.map((reward, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center"
                style={{
                  background: isSignedIn && i === 0 ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                  border: isSignedIn && i === 0 ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className={`text-xs font-bold ${isSignedIn && i === 0 ? "text-violet-300" : "text-slate-600"}`}>{i + 1}</span>
              </div>
              <span className={`text-xs font-bold ${isSignedIn && i === 0 ? "text-violet-400" : "text-slate-600"}`}>
                R${reward >= 1000 ? `${reward / 1000}K` : reward}
              </span>
            </div>
          ))}
        </div>
        {isSignedIn ? (
          <button
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            data-testid="claim-daily-btn"
          >
            Claim Day 1 Reward — R$100
          </button>
        ) : (
          <Link href="/sign-in">
            <button
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              data-testid="claim-daily-btn"
            >
              Sign In to Claim
            </button>
          </Link>
        )}
      </section>

      {/* VIP Tiers */}
      <section
        className="mb-5 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.2)" }}
        data-testid="vip-section"
      >
        <div className="flex items-center gap-2 mb-1">
          <Crown size={18} className="text-yellow-400" />
          <h2 className="text-white font-bold">VIP Club</h2>
        </div>
        <p className="text-slate-500 text-sm mb-4">Unlock exclusive perks as you play more</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIP_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="flex-shrink-0 p-3 rounded-xl min-w-28"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${tier.color}30` }}
              data-testid={`vip-tier-${tier.name.toLowerCase()}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Crown size={12} style={{ color: tier.color }} />
                <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.name}</span>
              </div>
              {tier.perks.map((perk) => (
                <p key={perk} className="text-xs text-slate-600 flex items-center gap-1">
                  <span style={{ color: tier.color }}>•</span> {perk}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Daily Challenges */}
      <section className="mb-5" data-testid="daily-challenges">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <Star size={16} className="text-violet-400" />
          Daily Challenges
        </h2>
        <div
          className="p-8 rounded-2xl flex flex-col items-center justify-center text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          data-testid="challenges-empty"
        >
          <Trophy size={32} className="text-slate-700 mb-3" />
          <p className="text-slate-500 font-medium text-sm">No challenges available</p>
          <p className="text-slate-700 text-xs mt-1">
            {isSignedIn ? "Check back tomorrow for new challenges" : "Sign in to unlock daily challenges"}
          </p>
        </div>
      </section>

      {/* Referral */}
      <section
        className="mb-6 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.25)" }}
        data-testid="referral-section"
      >
        <h2 className="text-white font-bold mb-1">Refer a Friend</h2>
        <p className="text-slate-400 text-sm mb-4">
          Earn <span className="text-green-400 font-bold">10%</span> of your friends' deposits forever
        </p>
        <div className="flex gap-2 mb-2">
          <div
            className="flex-1 px-4 py-3 rounded-xl font-mono text-sm"
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: isSignedIn ? "#a78bfa" : "#334155",
            }}
            data-testid="referral-code"
          >
            {referralCode}
          </div>
          <button
            onClick={copyReferral}
            className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff",
              opacity: isSignedIn ? 1 : 0.5,
              cursor: isSignedIn ? "pointer" : "not-allowed",
            }}
            disabled={!isSignedIn}
            data-testid="copy-referral-btn"
          >
            <Copy size={15} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-slate-600 text-xs">
          {isSignedIn ? "Share your code and earn when friends deposit" : "Sign in to get your unique referral link"}
        </p>
      </section>
    </div>
  );
}
