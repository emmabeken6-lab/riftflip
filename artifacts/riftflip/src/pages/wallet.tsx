import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, History, LogIn } from "lucide-react";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export default function Wallet() {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <div className="min-h-screen px-3 py-4" style={{ background: "#111" }} data-testid="wallet-page">
      <div className="mb-5">
        <h1 className="text-xl font-black text-white mb-0.5 flex items-center gap-2">
          <WalletIcon size={20} className="text-violet-400" />
          Wallet
        </h1>
        <p className="text-slate-500 text-sm">Manage your Robux balance</p>
      </div>

      {/* Sign-in notice */}
      {isLoaded && !isSignedIn && (
        <div
          className="mb-5 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          data-testid="signin-notice"
        >
          <LogIn size={16} className="text-slate-500 flex-shrink-0" />
          <p className="text-slate-400 text-sm flex-1">
            Sign in to deposit and withdraw Robux.
          </p>
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

      {/* Balance Card */}
      <section
        className="mb-5 p-5 rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        data-testid="balance-card"
      >
        {isSignedIn && user?.imageUrl && (
          <div className="flex items-center gap-2 mb-3">
            <img src={user.imageUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-slate-400 text-sm">{user.username ?? user.firstName ?? "Player"}</span>
          </div>
        )}
        <p className="text-slate-500 text-sm mb-1">Available Balance</p>
        <p
          className="text-4xl font-black mb-4"
          style={{ color: isSignedIn ? "#fff" : "#333" }}
          data-testid="balance-amount"
        >
          R$ 0
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setTab("deposit")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: isSignedIn ? "#7c3aed" : "#1e1e1e", color: isSignedIn ? "#fff" : "#333", cursor: isSignedIn ? "pointer" : "not-allowed" }}
            disabled={!isSignedIn}
            data-testid="deposit-btn"
          >
            <ArrowDownLeft size={15} />
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors hover:bg-[#222]"
            style={{ background: "#1e1e1e", border: "1px solid #333", color: isSignedIn ? "#ccc" : "#333", cursor: isSignedIn ? "pointer" : "not-allowed" }}
            disabled={!isSignedIn}
            data-testid="withdraw-btn"
          >
            <ArrowUpRight size={15} />
            Withdraw
          </button>
        </div>
      </section>

      {/* Deposit / Withdraw panel */}
      <section
        className="mb-5 p-5 rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        data-testid="action-panel"
      >
        <div className="flex gap-2 mb-4">
          {(["deposit", "withdraw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-colors"
              style={{
                background: tab === t ? "#7c3aed" : "#222",
                color: tab === t ? "#fff" : "#555",
                border: "none",
              }}
              data-testid={`tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-slate-500 text-sm mb-2 block">Amount (Robux)</label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: "#222", border: "1px solid #333" }}
          >
            <span className="text-slate-500 font-bold text-lg">R$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-white text-xl font-bold outline-none"
              style={{ color: "#e5e5e5" }}
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
              className="py-2 rounded-lg text-sm font-bold transition-colors hover:bg-[#2a2a2a]"
              style={{
                background: amount === String(amt) ? "#2a1f44" : "#222",
                border: amount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a",
                color: amount === String(amt) ? "#c4b5fd" : "#555",
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
            className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: amount ? "#7c3aed" : "#1e1e1e", color: amount ? "#fff" : "#333", cursor: amount ? "pointer" : "not-allowed" }}
            disabled={!amount}
            data-testid="confirm-action-btn"
          >
            {tab === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        ) : (
          <Link href="/sign-in">
            <button
              className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "#7c3aed" }}
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
          { label: "Deposited", value: "R$ 0", icon: ArrowDownLeft },
          { label: "Total Won", value: "R$ 0", icon: TrendingUp },
          { label: "Wagered", value: "R$ 0", icon: TrendingDown },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl text-center"
            style={{ background: "#1a1a1a", border: "1px solid #222" }}
          >
            <stat.icon size={16} className="mx-auto mb-1 text-slate-700" />
            <p className="text-slate-600 font-bold text-sm">{stat.value}</p>
            <p className="text-slate-700 text-xs">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Transaction History */}
      <section className="mb-8" data-testid="transaction-history">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
          <History size={15} className="text-slate-600" />
          Transaction History
        </h2>
        <div
          className="p-10 rounded-xl flex flex-col items-center justify-center text-center"
          style={{ background: "#1a1a1a", border: "1px solid #222" }}
          data-testid="transactions-empty"
        >
          <History size={28} className="text-slate-700 mb-3" />
          <p className="text-slate-600 text-sm">No transactions yet</p>
          <p className="text-slate-700 text-xs mt-1">
            {isSignedIn ? "Deposit and win history will appear here" : "Sign in to view your history"}
          </p>
        </div>
      </section>
    </div>
  );
}
