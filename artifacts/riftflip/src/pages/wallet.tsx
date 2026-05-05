import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/react";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  History,
  LogIn,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export default function Wallet() {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <div className="min-h-screen px-3 py-4" style={{ background: "#080614" }} data-testid="wallet-page">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white mb-0.5 flex items-center gap-2">
          <WalletIcon size={24} className="text-violet-400" />
          Wallet
        </h1>
        <p className="text-slate-500 text-sm">Manage your Robux balance</p>
      </div>

      {/* Sign-in required notice (signed out only) */}
      {isLoaded && !isSignedIn && (
        <div
          className="mb-5 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}
          data-testid="signin-notice"
        >
          <LogIn size={18} className="text-violet-400 flex-shrink-0" />
          <p className="text-slate-300 text-sm flex-1">
            <span className="text-violet-300 font-semibold">Sign in</span> to see your balance, deposit, and withdraw Robux.
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

      {/* Balance Card */}
      <section
        className="mb-5 p-6 rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(79,70,229,0.15) 100%)",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
        data-testid="balance-card"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
        </div>
        {isSignedIn && user?.imageUrl && (
          <div className="flex items-center gap-2 mb-3 relative">
            <img src={user.imageUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            <span className="text-slate-400 text-sm font-medium">{user.username ?? user.firstName ?? "Player"}</span>
          </div>
        )}
        <p className="text-slate-400 text-sm font-medium mb-1 relative">Available Balance</p>
        <motion.p
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-black mb-4 relative"
          style={{ color: isSignedIn ? "#fff" : "#334155" }}
          data-testid="balance-amount"
        >
          R$ 0
        </motion.p>
        <div className="flex gap-3">
          <button
            onClick={() => setTab("deposit")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              opacity: isSignedIn ? 1 : 0.4,
              cursor: isSignedIn ? "pointer" : "not-allowed",
            }}
            disabled={!isSignedIn}
            data-testid="deposit-btn"
          >
            <ArrowDownLeft size={16} />
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              opacity: isSignedIn ? 1 : 0.4,
              cursor: isSignedIn ? "pointer" : "not-allowed",
            }}
            disabled={!isSignedIn}
            data-testid="withdraw-btn"
          >
            <ArrowUpRight size={16} />
            Withdraw
          </button>
        </div>
      </section>

      {/* Deposit / Withdraw Panel */}
      <section
        className="mb-5 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}
        data-testid="action-panel"
      >
        <div className="flex gap-2 mb-4">
          {(["deposit", "withdraw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all"
              style={{
                background: tab === t ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.05)",
                color: tab === t ? "#fff" : "#64748b",
              }}
              data-testid={`tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-slate-400 text-sm mb-2 block">Amount (Robux)</label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            <span className="text-violet-500 font-bold text-lg">R$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-slate-700"
              disabled={!isSignedIn}
              data-testid="amount-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5" data-testid="quick-amounts">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => isSignedIn && setAmount(String(amt))}
              className="py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{
                background: amount === String(amt) ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                border: amount === String(amt) ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: amount === String(amt) ? "#a78bfa" : "#64748b",
                opacity: isSignedIn ? 1 : 0.5,
                cursor: isSignedIn ? "pointer" : "not-allowed",
              }}
              data-testid={`quick-${amt}`}
            >
              R${amt >= 1000 ? `${amt / 1000}K` : amt}
            </button>
          ))}
        </div>

        {isSignedIn ? (
          <button
            className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", opacity: amount ? 1 : 0.5, cursor: amount ? "pointer" : "not-allowed" }}
            disabled={!amount}
            data-testid="confirm-action-btn"
          >
            {tab === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        ) : (
          <Link href="/sign-in">
            <button
              className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              data-testid="confirm-action-btn"
            >
              Sign In to {tab === "deposit" ? "Deposit" : "Withdraw"}
            </button>
          </Link>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 mb-5" data-testid="wallet-stats">
        {[
          { label: "Total Deposited", value: "R$ 0", icon: ArrowDownLeft, color: "#22c55e" },
          { label: "Total Won", value: "R$ 0", icon: TrendingUp, color: "#3b82f6" },
          { label: "Total Wagered", value: "R$ 0", icon: TrendingDown, color: "#a78bfa" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-2xl text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <stat.icon size={18} style={{ color: stat.color }} className="mx-auto mb-1 opacity-30" />
            <p className="text-slate-700 font-bold text-sm">{stat.value}</p>
            <p className="text-slate-700 text-xs">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Transaction History */}
      <section className="mb-8" data-testid="transaction-history">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <History size={16} className="text-slate-500" />
          Transaction History
        </h2>
        <div
          className="p-10 rounded-2xl flex flex-col items-center justify-center text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          data-testid="transactions-empty"
        >
          <History size={32} className="text-slate-700 mb-3" />
          <p className="text-slate-500 font-medium text-sm">No transactions yet</p>
          <p className="text-slate-700 text-xs mt-1">
            {isSignedIn ? "Your deposit and win history will appear here" : "Sign in to view your history"}
          </p>
        </div>
      </section>
    </div>
  );
}
