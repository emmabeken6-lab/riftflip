import { Link } from "wouter";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";
import {
  LogOut, Wallet, Trophy, Gamepad2, Calendar, Copy, CheckCircle,
  ChevronRight, Shield, Crown, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const USD_PER_TOKEN = 1 / 30;

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

function SignedInProfile() {
  const { user, refetch } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const joinedAt = new Date(user.joinedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const copyId = () => {
    navigator.clipboard.writeText(user.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
  };

  const balance = user.balance;
  const usdBalance = (balance * USD_PER_TOKEN).toFixed(2);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#111" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <h1 className="text-white font-black text-xl">Profile</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[#2a1010]"
          style={{ background: "#1a1010", border: "1px solid #2a1010", color: "#ef4444" }}
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>

      <div className="px-4 pt-4">

        {/* Avatar + user info card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl mb-4 relative overflow-hidden"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          {/* Subtle glow */}
          <div style={{ position: "absolute", top: -30, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(88,101,242,0.12)", filter: "blur(40px)", pointerEvents: "none" }} />

          <div className="flex items-center gap-4">
            {/* Avatar with Discord badge */}
            <div className="relative flex-shrink-0">
              <img
                src={avatarUrl(user)}
                alt={user.username}
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: "3px solid #2a2a2a" }}
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#5865F2", border: "3px solid #1a1a1a" }}>
                <DiscordIcon />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h2 className="text-white font-black text-xl leading-none">{user.username}</h2>
                {user.isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0" style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", color: "#f87171" }}>Admin</span>
                )}
              </div>
              <button onClick={copyId} className="flex items-center gap-1.5 text-slate-600 text-xs hover:text-slate-400 transition-colors mb-1.5">
                <span className="font-mono truncate max-w-32">{user.id}</span>
                {copied ? <CheckCircle size={10} className="text-green-500 flex-shrink-0" /> : <Copy size={10} className="flex-shrink-0" />}
              </button>
              <div className="flex items-center gap-1.5">
                <Calendar size={10} className="text-slate-700 flex-shrink-0" />
                <span className="text-slate-700 text-xs">Since {joinedAt}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl mb-4 relative overflow-hidden"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(124,58,237,0.12)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div className="flex items-start justify-between mb-2">
            <p className="text-slate-500 text-sm">Available Balance</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2a1f44", border: "1px solid #3a2a64" }}>
              <Wallet size={16} className="text-violet-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-white leading-none mb-1">
            {balance.toLocaleString()}
            <span className="text-lg text-slate-500 font-semibold ml-2">tokens</span>
          </p>
          <p className="text-slate-600 text-sm mb-5">≈ ${usdBalance} USD</p>
          <div className="flex gap-3">
            <Link href="/wallet" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                style={{ background: "#222", border: "1px solid #333", color: "#ccc" }}>
                <Wallet size={14} /> Wallet
              </button>
            </Link>
            <Link href="/wallet" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: "#7c3aed", color: "#fff" }}>
                <ArrowUpRight size={14} /> Withdraw
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          {[
            { label: "Won", value: "0", icon: Trophy, color: "#f59e0b", bg: "#1a1300" },
            { label: "Games", value: "0", icon: Gamepad2, color: "#a78bfa", bg: "#1a0a2a" },
            { label: "Level", value: "1", icon: Crown, color: "#fb923c", bg: "#1a0e00" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: s.bg }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <p className="text-white font-black text-xl leading-none">{s.value}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{ border: "1px solid #222" }}
        >
          {[
            { label: "Wallet", desc: "Deposit & withdraw", icon: Wallet, href: "/wallet", color: "#7c3aed", bg: "#1a0a2a" },
            { label: "Rewards", desc: "Daily login & VIP perks", icon: Trophy, href: "/rewards", color: "#f59e0b", bg: "#1a1300" },
            { label: "Games", desc: "Coinflip · Jackpot · Minefield", icon: Gamepad2, href: "/games", color: "#a78bfa", bg: "#1a0a2a" },
            ...(user.isAdmin
              ? [{ label: "Admin Panel", desc: "Manage users & settings", icon: Shield, href: "/admin", color: "#ef4444", bg: "#1a0a0a" }]
              : []),
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href}>
              <div
                className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-[#1e1e1e]"
                style={{ background: "#1a1a1a", borderBottom: i < arr.length - 1 ? "1px solid #1e1e1e" : "none" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  <item.icon size={15} style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-slate-600 text-xs">{item.desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-700" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Discord verified badge */}
        <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: "#0a0f1a", border: "1px solid #1a2a4a" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#5865F222" }}>
            <DiscordIcon />
          </div>
          <div className="flex-1">
            <p className="text-blue-400 text-sm font-semibold">Verified via Discord OAuth2</p>
            <p className="text-slate-700 text-xs">Your account is protected</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Profile() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#111" }}>
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!isSignedIn) return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#111" }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
          <DiscordIcon />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Your Riftflip Profile</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in with Discord to view your account</p>
        <Link href="/sign-in">
          <button className="px-8 py-3 rounded-xl text-white font-bold hover:opacity-90" style={{ background: "#5865F2" }}>
            <span className="flex items-center gap-2"><DiscordIcon /> Continue with Discord</span>
          </button>
        </Link>
      </div>
    </div>
  );

  return <SignedInProfile />;
}
