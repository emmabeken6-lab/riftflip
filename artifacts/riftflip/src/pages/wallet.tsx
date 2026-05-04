import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";

const TRANSACTIONS = [
  { type: "Deposit", amount: "+R$ 5,000", date: "Today 2:30 PM", status: "completed", game: null },
  { type: "Win", amount: "+R$ 12,400", date: "Today 1:15 PM", status: "completed", game: "Crash" },
  { type: "Bet", amount: "-R$ 2,500", date: "Today 1:14 PM", status: "completed", game: "Crash" },
  { type: "Win", amount: "+R$ 3,200", date: "Today 11:22 AM", status: "completed", game: "Mines" },
  { type: "Bet", amount: "-R$ 1,000", date: "Today 11:20 AM", status: "completed", game: "Mines" },
  { type: "Withdraw", amount: "-R$ 10,000", date: "Yesterday 6:00 PM", status: "pending", game: null },
  { type: "Deposit", amount: "+R$ 10,000", date: "Yesterday 3:00 PM", status: "completed", game: null },
  { type: "Win", amount: "+R$ 48,200", date: "Yesterday 2:45 PM", status: "completed", game: "Jackpot" },
  { type: "Bet", amount: "-R$ 5,000", date: "Yesterday 2:44 PM", status: "completed", game: "Jackpot" },
  { type: "Withdraw", amount: "-R$ 20,000", date: "2 days ago", status: "completed", game: null },
];

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export default function Wallet() {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const balance = 12450;
  const totalDeposited = 47500;
  const totalWon = 89200;
  const totalWagered = 124000;

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle size={14} className="text-green-400" />;
    if (status === "pending") return <Clock size={14} className="text-yellow-400" />;
    return <XCircle size={14} className="text-red-400" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "Win" || type === "Deposit") return "#22c55e";
    if (type === "Bet" || type === "Withdraw") return "#f87171";
    return "#94a3b8";
  };

  const getTypeIcon = (type: string) => {
    if (type === "Win" || type === "Deposit") return <ArrowDownLeft size={14} />;
    return <ArrowUpRight size={14} />;
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-6" style={{ background: "#080614" }} data-testid="wallet-page">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-2">
          <WalletIcon size={28} className="text-violet-400" />
          Wallet
        </h1>
        <p className="text-slate-500 text-sm">Manage your Robux balance</p>
      </div>

      {/* Balance Card */}
      <section
        className="mb-6 p-6 rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(79,70,229,0.3) 50%, rgba(37,99,235,0.2) 100%)",
          border: "1px solid rgba(139,92,246,0.4)",
        }}
        data-testid="balance-card"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }}
          />
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1 relative">Available Balance</p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <span
            className="text-5xl font-black"
            style={{
              background: "linear-gradient(135deg, #fff, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
            }}
            data-testid="balance-amount"
          >
            R$ {balance.toLocaleString()}
          </span>
        </motion.div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setTab("deposit")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            data-testid="deposit-btn"
          >
            <ArrowDownLeft size={16} />
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
            data-testid="withdraw-btn"
          >
            <ArrowUpRight size={16} />
            Withdraw
          </button>
        </div>
      </section>

      {/* Deposit / Withdraw Panel */}
      <section
        className="mb-6 p-5 rounded-2xl"
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
            <span className="text-violet-400 font-bold text-lg">R$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-slate-700"
              data-testid="amount-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5" data-testid="quick-amounts">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(String(amt))}
              className="py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{
                background: amount === String(amt) ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                border: amount === String(amt) ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: amount === String(amt) ? "#a78bfa" : "#64748b",
              }}
              data-testid={`quick-${amt}`}
            >
              R${amt >= 1000 ? `${amt / 1000}K` : amt}
            </button>
          ))}
        </div>

        <button
          className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            opacity: amount ? 1 : 0.5,
          }}
          disabled={!amount}
          data-testid="confirm-action-btn"
        >
          {tab === "deposit" ? "Deposit" : "Withdraw"} {amount ? `R$ ${Number(amount).toLocaleString()}` : ""}
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 mb-6" data-testid="wallet-stats">
        {[
          { label: "Total Deposited", value: `R$ ${(totalDeposited / 1000).toFixed(1)}K`, icon: ArrowDownLeft, color: "#22c55e" },
          { label: "Total Won", value: `R$ ${(totalWon / 1000).toFixed(1)}K`, icon: TrendingUp, color: "#3b82f6" },
          { label: "Total Wagered", value: `R$ ${(totalWagered / 1000).toFixed(0)}K`, icon: TrendingDown, color: "#a78bfa" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-2xl text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            data-testid={`wallet-stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}
          >
            <stat.icon size={18} style={{ color: stat.color }} className="mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{stat.value}</p>
            <p className="text-slate-600 text-xs">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Transaction History */}
      <section className="mb-8" data-testid="transaction-history">
        <h2 className="text-white font-bold text-lg mb-3">Transaction History</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-4 py-3.5"
              style={{
                borderBottom: i < TRANSACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              }}
              data-testid={`transaction-${i}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${getTypeColor(tx.type)}15`,
                    color: getTypeColor(tx.type),
                  }}
                >
                  {getTypeIcon(tx.type)}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {tx.type}{tx.game ? ` — ${tx.game}` : ""}
                  </p>
                  <p className="text-slate-600 text-xs">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p
                    className="font-bold text-sm"
                    style={{ color: getTypeColor(tx.type) }}
                  >
                    {tx.amount}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {getStatusIcon(tx.status)}
                    <span
                      className="text-xs capitalize"
                      style={{
                        color: tx.status === "completed" ? "#4ade80" : tx.status === "pending" ? "#facc15" : "#f87171",
                      }}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
