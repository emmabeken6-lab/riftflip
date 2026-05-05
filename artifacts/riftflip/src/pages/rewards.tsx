import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { Crown, Gift, Star, Trophy, Copy, LogIn } from "lucide-react";

const VIP_TIERS = [
  { name: "Bronze", color: "#cd7f32", perks: ["5% Rakeback", "Weekly Bonus"] },
  { name: "Silver", color: "#c0c0c0", perks: ["8% Rakeback", "Priority Chat"] },
  { name: "Gold", color: "#ffd700", perks: ["12% Rakeback", "Bonus Spins"] },
  { name: "Diamond", color: "#7dd3fc", perks: ["18% Rakeback", "VIP Manager"] },
  { name: "Elite", color: "#a78bfa", perks: ["25% Rakeback", "Dedicated Manager"] },
];

const DAILY_REWARDS = [100, 200, 350, 500, 750, 1200, 2500];

export default function Rewards() {
  const [copied, setCopied] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const referralCode = isSignedIn ? `RIFT-${(user?.id ?? "").slice(-8).toUpperCase()}` : "RIFT-????????";

  const copyReferral = () => {
    if (!isSignedIn) return;
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-3 py-4" style={{ background: "#111" }} data-testid="rewards-page">
      <div className="mb-5">
        <h1 className="text-xl font-black text-white mb-0.5 flex items-center gap-2">
          <Crown size={20} className="text-yellow-500" />
          Rewards
        </h1>
        <p className="text-slate-500 text-sm">
          {isSignedIn ? `Hey, ${user?.username ?? user?.firstName ?? "Player"}` : "Sign in to claim bonuses"}
        </p>
      </div>

      {/* Sign-in notice */}
      {isLoaded && !isSignedIn && (
        <div
          className="mb-5 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          data-testid="signin-notice"
        >
          <LogIn size={16} className="text-slate-500 flex-shrink-0" />
          <p className="text-slate-400 text-sm flex-1">Sign in to track your streak and claim rewards.</p>
          <Link href="/sign-in">
            <button
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "#7c3aed" }}
            >
              Sign In
            </button>
          </Link>
        </div>
      )}

      {/* Daily Login */}
      <section
        className="mb-5 p-5 rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        data-testid="daily-streak"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold">Daily Login</h2>
            <p className="text-slate-600 text-xs mt-0.5">Log in every day to earn Robux</p>
          </div>
          <Gift size={18} className="text-slate-500" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {DAILY_REWARDS.map((reward, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center"
                style={{
                  background: isSignedIn && i === 0 ? "#2a1f44" : "#1e1e1e",
                  border: isSignedIn && i === 0 ? "1px solid #7c3aed" : "1px solid #2a2a2a",
                }}
              >
                <span className="text-xs font-bold" style={{ color: isSignedIn && i === 0 ? "#c4b5fd" : "#444" }}>{i + 1}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: isSignedIn && i === 0 ? "#a78bfa" : "#444" }}>
                R${reward >= 1000 ? `${reward / 1000}K` : reward}
              </span>
            </div>
          ))}
        </div>
        {isSignedIn ? (
          <button
            className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "#7c3aed" }}
            data-testid="claim-daily-btn"
          >
            Claim Day 1 — R$100
          </button>
        ) : (
          <Link href="/sign-in">
            <button
              className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "#7c3aed" }}
              data-testid="claim-daily-btn"
            >
              Sign In to Claim
            </button>
          </Link>
        )}
      </section>

      {/* VIP Tiers */}
      <section
        className="mb-5 p-5 rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        data-testid="vip-section"
      >
        <h2 className="text-white font-bold mb-1">VIP Club</h2>
        <p className="text-slate-500 text-sm mb-4">Unlock exclusive perks as you play more</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIP_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="flex-shrink-0 p-3 rounded-lg min-w-28"
              style={{ background: "#222", border: "1px solid #2a2a2a" }}
              data-testid={`vip-tier-${tier.name.toLowerCase()}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Crown size={11} style={{ color: tier.color }} />
                <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.name}</span>
              </div>
              {tier.perks.map((perk) => (
                <p key={perk} className="text-xs text-slate-600">• {perk}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Daily Challenges */}
      <section className="mb-5" data-testid="daily-challenges">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
          <Star size={15} className="text-slate-500" />
          Daily Challenges
        </h2>
        <div
          className="p-8 rounded-xl flex flex-col items-center justify-center text-center"
          style={{ background: "#1a1a1a", border: "1px solid #222" }}
          data-testid="challenges-empty"
        >
          <Trophy size={28} className="text-slate-700 mb-3" />
          <p className="text-slate-600 text-sm">No challenges available</p>
          <p className="text-slate-700 text-xs mt-1">
            {isSignedIn ? "Check back tomorrow" : "Sign in to unlock daily challenges"}
          </p>
        </div>
      </section>

      {/* Referral */}
      <section
        className="mb-6 p-5 rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        data-testid="referral-section"
      >
        <h2 className="text-white font-bold mb-1">Refer a Friend</h2>
        <p className="text-slate-500 text-sm mb-4">
          Earn <span className="text-green-500 font-bold">10%</span> of your friends' deposits forever
        </p>
        <div className="flex gap-2 mb-2">
          <div
            className="flex-1 px-4 py-3 rounded-lg font-mono text-sm"
            style={{ background: "#222", border: "1px solid #333", color: isSignedIn ? "#a78bfa" : "#333" }}
            data-testid="referral-code"
          >
            {referralCode}
          </div>
          <button
            onClick={copyReferral}
            className="px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold transition-all hover:opacity-90"
            style={{ background: isSignedIn ? "#7c3aed" : "#1e1e1e", color: isSignedIn ? "#fff" : "#333", cursor: isSignedIn ? "pointer" : "not-allowed" }}
            disabled={!isSignedIn}
            data-testid="copy-referral-btn"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-slate-700 text-xs">
          {isSignedIn ? "Share your code and earn when friends deposit" : "Sign in to get your referral code"}
        </p>
      </section>
    </div>
  );
}
