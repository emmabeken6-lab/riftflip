import { Link, useLocation } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";
import { motion } from "framer-motion";
import {
  LogOut,
  Wallet,
  Trophy,
  Gamepad2,
  Calendar,
  ExternalLink,
  Copy,
  CheckCircle,
  User,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

function ProfileProtected() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const discordAccount = user?.externalAccounts?.find(
    (a) => a.provider === "discord"
  );
  const discordUsername =
    discordAccount?.username ?? user?.username ?? user?.firstName ?? "Player";
  const discordId = discordAccount?.externalId;
  const avatarUrl = user?.imageUrl;
  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const copyId = () => {
    if (!discordId) return;
    navigator.clipboard.writeText(discordId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto" style={{ background: "#080614" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <User size={22} className="text-violet-400" />
          Profile
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Your Riftflip account</p>
      </div>

      {/* Avatar + Name Card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5 p-6 rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(79,70,229,0.15) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
        }}
      >
        {/* glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

        <div className="flex items-center gap-4 relative">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={discordUsername}
                className="w-20 h-20 rounded-full object-cover ring-4"
                style={{ ringColor: "rgba(139,92,246,0.6)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                {discordUsername.charAt(0).toUpperCase()}
              </div>
            )}
            {discordAccount && (
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#5865F2", border: "2px solid #080614" }}
              >
                <DiscordIcon />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-white truncate">{discordUsername}</h2>
            {discordAccount && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-semibold" style={{ color: "#5865F2" }}>
                  Connected via Discord
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <Calendar size={13} className="text-slate-600" />
              <span className="text-slate-500 text-xs">Joined {joinedAt}</span>
            </div>
          </div>
        </div>

        {/* Discord ID row */}
        {discordId && (
          <div
            className="mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(88,101,242,0.12)", border: "1px solid rgba(88,101,242,0.25)" }}
          >
            <DiscordIcon />
            <span className="text-slate-400 text-sm flex-1 font-mono truncate">ID: {discordId}</span>
            <button
              onClick={copyId}
              className="flex items-center gap-1 text-xs font-bold transition-all hover:scale-105"
              style={{ color: copied ? "#4ade80" : "#7c8df0" }}
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </motion.section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-3 gap-3 mb-5"
      >
        {[
          { label: "Balance", value: "R$ 0", icon: Wallet, color: "#a78bfa" },
          { label: "Total Won", value: "R$ 0", icon: Trophy, color: "#fbbf24" },
          { label: "Games", value: "0", icon: Gamepad2, color: "#34d399" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-2xl flex flex-col items-center gap-1.5 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <s.icon size={18} style={{ color: s.color }} />
            <span className="text-white font-black text-lg leading-none">{s.value}</span>
            <span className="text-slate-600 text-xs">{s.label}</span>
          </div>
        ))}
      </motion.section>

      {/* Quick links */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="mb-5 rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {[
          { label: "Wallet", desc: "Deposit & withdraw Robux", icon: Wallet, href: "/wallet", color: "#a78bfa" },
          { label: "Rewards", desc: "Daily login & VIP perks", icon: Trophy, href: "/rewards", color: "#fbbf24" },
          { label: "Games", desc: "Play Coinflip, Jackpot, Minefield", icon: Gamepad2, href: "/games", color: "#34d399" },
        ].map((item, i) => (
          <Link key={item.href} href={item.href}>
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
              >
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-slate-600 text-xs">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-700" />
            </div>
          </Link>
        ))}
      </motion.section>

      {/* Discord connection info */}
      {discordAccount && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-5 p-4 rounded-2xl"
          style={{ background: "rgba(88,101,242,0.08)", border: "1px solid rgba(88,101,242,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <Shield size={16} style={{ color: "#5865F2" }} />
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Discord Verified</p>
              <p className="text-slate-500 text-xs">Account linked via Discord OAuth · Session auto-renews</p>
            </div>
            <a
              href="https://discord.com/channels/@me"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#7c8df0" }}
            >
              Open <ExternalLink size={11} />
            </a>
          </div>
        </motion.section>
      )}

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="mb-10"
      >
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}

export default function Profile() {
  return (
    <>
      <Show when="signed-in">
        <ProfileProtected />
      </Show>
      <Show when="signed-out">
        <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#080614" }}>
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              <User size={28} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Sign in to view your profile</h2>
            <p className="text-slate-500 text-sm mb-6">Log in with Discord to see your account details</p>
            <Link href="/sign-in">
              <button
                className="px-8 py-3 rounded-xl text-white font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                Sign In with Discord
              </button>
            </Link>
          </div>
        </div>
      </Show>
    </>
  );
}
