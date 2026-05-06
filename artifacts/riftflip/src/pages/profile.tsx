import { Link } from "wouter";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";
import { LogOut, Wallet, Trophy, Gamepad2, Calendar, Copy, CheckCircle, ChevronRight, Shield, Settings, Crown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

function SignedInProfile() {
  const { user, refetch } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const joinedAt = new Date(user.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const copyId = () => {
    navigator.clipboard.writeText(user.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
  };

  return (
    <div className="min-h-screen" style={{ background: "#111" }}>

      {/* Banner */}
      <div className="relative h-32" style={{ background: "linear-gradient(135deg, #1a0a3a 0%, #0d1a3a 40%, #0a1a2a 70%, #111 100%)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.3) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(88,101,242,0.2) 0%, transparent 60%)" }} />
        <Link href="/"><button className="absolute top-4 left-4 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ChevronRight size={16} className="text-white rotate-180" />
        </button></Link>
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-4" style={{ marginTop: -48 }}>
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            {/* Outer glow ring */}
            <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: "conic-gradient(from 0deg, #5865F2, #7c3aed, #a855f7, #5865F2)", padding: 3, borderRadius: 999 }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#111" }} />
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              style={{ position: "relative" }}
            >
              <img
                src={avatarUrl(user)}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: "4px solid #111", position: "relative", zIndex: 1 }}
              />
              {/* Discord badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#5865F2", border: "3px solid #111", zIndex: 2 }}>
                <DiscordIcon />
              </div>
            </motion.div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[#2a1010]"
            style={{ background: "#1a1010", border: "1px solid #2a1010", color: "#ef4444" }}
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>

        {/* Name + ID */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-white font-black text-2xl">{user.username}</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#5865F233", border: "1px solid #5865F255", color: "#7c8df0" }}>
              <DiscordIcon />
              Discord
            </div>
          </div>
          <button onClick={copyId} className="flex items-center gap-1.5 text-slate-600 text-xs hover:text-slate-400 transition-colors">
            <span className="font-mono">{user.id}</span>
            {copied ? <CheckCircle size={11} className="text-green-500" /> : <Copy size={11} />}
          </button>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar size={11} className="text-slate-700" />
            <span className="text-slate-700 text-xs">Member since {joinedAt}</span>
          </div>
        </div>

        {/* Balance highlight card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-5 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a0a3a, #1a1a2a)", border: "1px solid #3a1a6a" }}
        >
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(124,58,237,0.15)", filter: "blur(20px)" }} />
          <p className="text-slate-500 text-xs mb-1">Available Balance</p>
          <p className="text-4xl font-black text-white mb-3">
            R$ <span style={{ color: "#c4b5fd" }}>{user.balance.toLocaleString()}</span>
          </p>
          <Link href="/wallet">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90" style={{ background: "#7c3aed" }}>
              <Wallet size={14} />
              Manage Wallet
            </button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Won", value: "R$ 0", icon: Trophy, color: "#f59e0b" },
            { label: "Games", value: "0", icon: Gamepad2, color: "#a78bfa" },
            { label: "Level", value: "1", icon: Crown, color: "#fb923c" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
              <s.icon size={14} style={{ color: s.color }} className="mx-auto mb-1.5" />
              <p className="text-white font-black text-base leading-none">{s.value}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #222" }}>
          {[
            { label: "Wallet", desc: "Deposit & withdraw", icon: Wallet, href: "/wallet", color: "#7c3aed" },
            { label: "Rewards", desc: "Daily login & VIP perks", icon: Trophy, href: "/rewards", color: "#f59e0b" },
            { label: "Games", desc: "Coinflip · Jackpot · Minefield", icon: Gamepad2, href: "/games", color: "#a78bfa" },
            { label: "Admin Panel", desc: "Manage users & settings", icon: Shield, href: "/admin", color: "#ef4444" },
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#1e1e1e]"
                style={{ background: "#1a1a1a", borderBottom: i < arr.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + "22" }}>
                  <item.icon size={14} style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-slate-600 text-xs">{item.desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-700" />
              </div>
            </Link>
          ))}
        </div>

        {/* Security badge */}
        <div className="mb-10 p-4 rounded-xl flex items-center gap-3" style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}>
          <Shield size={14} className="text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-500 text-sm font-semibold">Verified via Discord OAuth2</p>
            <p className="text-slate-700 text-xs">Your account is protected</p>
          </div>
          <Settings size={13} className="text-slate-700" />
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
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #1a0a3a, #0a1a3a)", border: "2px solid #3a1a6a" }}>
          <DiscordIcon />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Your Riftflip Profile</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in with Discord to view your account</p>
        <Link href="/sign-in">
          <button className="px-8 py-3 rounded-lg text-white font-bold hover:opacity-90" style={{ background: "#5865F2" }}>
            <span className="flex items-center gap-2"><DiscordIcon /> Continue with Discord</span>
          </button>
        </Link>
      </div>
    </div>
  );

  return <SignedInProfile />;
}
