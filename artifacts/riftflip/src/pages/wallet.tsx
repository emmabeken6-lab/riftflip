import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  Trophy, Gamepad2, Clock, Copy, CheckCircle,
  RefreshCw, Loader2, AlertCircle, ChevronRight, LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const USD_PER_TOKEN = 0.05;

const SUPPORTED_COINS = [
  { symbol: "BTC", name: "Bitcoin", emoji: "₿", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", emoji: "Ξ", color: "#627eea" },
  { symbol: "LTC", name: "Litecoin", emoji: "Ł", color: "#bfbbbb" },
  { symbol: "USDT", name: "Tether (TRC20)", emoji: "₮", color: "#26a17b" },
  { symbol: "SOL", name: "Solana", emoji: "◎", color: "#9945ff" },
  { symbol: "BNB", name: "BNB", emoji: "◆", color: "#f3ba2f" },
];

const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

interface PaymentData {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  status: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all"
      style={{ background: copied ? "#0a2a15" : "#222", border: copied ? "1px solid #1a5a2a" : "1px solid #333", color: copied ? "#4ade80" : "#666" }}
    >
      {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function TokenIcon() {
  return (
    <span className="font-black text-lg leading-none" style={{ color: "#6b7280" }}>T</span>
  );
}

function DepositFlow({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState<"amount" | "coin" | "address">("amount");
  const [tokenAmount, setTokenAmount] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<typeof SUPPORTED_COINS[0] | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payments/status", { credentials: "include" })
      .then((r) => r.json() as Promise<{ configured: boolean }>)
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, []);

  const createPayment = async () => {
    if (!selectedCoin || !tokenAmount) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/payments/create", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payCurrency: selectedCoin.symbol.toLowerCase(), tokenAmount: Number(tokenAmount) }),
      });
      const d = await r.json() as PaymentData & { error?: string };
      if (d.error) throw new Error(d.error);
      setPayment(d);
      setStep("address");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create payment");
    }
    setLoading(false);
  };

  const checkPayment = async () => {
    if (!payment) return;
    try {
      const r = await fetch(`/api/payments/check/${payment.paymentId}`, { credentials: "include" });
      const d = await r.json() as { status?: string };
      setCheckStatus(d.status ?? "unknown");
    } catch { setCheckStatus("error"); }
  };

  const usdValue = tokenAmount ? (Number(tokenAmount) * USD_PER_TOKEN).toFixed(2) : "0.00";

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors text-sm">← Back</button>
        <h2 className="text-white font-black text-lg">Deposit</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#0a1a2a", border: "1px solid #1a3a5a", color: "#60a5fa" }}>NowPayments</span>
      </div>

      {configured === false && (
        <div className="mb-4 p-4 rounded-xl flex gap-3" style={{ background: "#1a1000", border: "1px solid #3a2a00" }}>
          <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 text-sm font-semibold">NowPayments not configured</p>
            <p className="text-yellow-700 text-xs mt-0.5">Add <code className="text-yellow-500">NOWPAYMENTS_API_KEY</code> to Replit Secrets to enable deposits.</p>
          </div>
        </div>
      )}

      <div className="mb-4 p-3 rounded-xl flex gap-2" style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}>
        <p className="text-green-600 text-xs">Rate: <strong className="text-green-400">$1 USD = 20 tokens</strong>. Funds auto-credited after blockchain confirmation.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div key="amount" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-3">How many tokens to deposit?</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <TokenIcon />
              <input type="number" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-white text-2xl font-black outline-none" />
            </div>
            {tokenAmount && <p className="text-slate-600 text-xs text-center mb-3">≈ ${usdValue} USD</p>}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {QUICK_AMOUNTS.map((amt) => (
                <button key={amt} onClick={() => setTokenAmount(String(amt))}
                  className="py-2 rounded-lg text-xs font-bold"
                  style={{ background: tokenAmount === String(amt) ? "#2a1f44" : "#1a1a1a", border: tokenAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: tokenAmount === String(amt) ? "#c4b5fd" : "#555" }}>
                  {amt >= 1000 ? `${amt / 1000}K` : amt} tokens
                </button>
              ))}
            </div>
            <button onClick={() => setStep("coin")} disabled={!tokenAmount || !Number(tokenAmount)}
              className="w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
              style={{ background: tokenAmount ? "#7c3aed" : "#1e1e1e", color: tokenAmount ? "#fff" : "#444" }}>
              Choose Payment Method →
            </button>
          </motion.div>
        )}

        {step === "coin" && (
          <motion.div key="coin" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-1">Choose cryptocurrency</p>
            <p className="text-slate-600 text-xs mb-3">You will pay ≈ ${usdValue} USD for {Number(tokenAmount).toLocaleString()} tokens</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {SUPPORTED_COINS.map((coin) => (
                <button key={coin.symbol} onClick={() => setSelectedCoin(coin)}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: selectedCoin?.symbol === coin.symbol ? "#1e1530" : "#1a1a1a", border: selectedCoin?.symbol === coin.symbol ? "1px solid #7c3aed" : "1px solid #222" }}>
                  <span className="text-2xl font-black" style={{ color: coin.color }}>{coin.emoji}</span>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{coin.symbol}</p>
                    <p className="text-slate-600 text-xs">{coin.name}</p>
                  </div>
                </button>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
            <button onClick={createPayment} disabled={!selectedCoin || loading || configured === false}
              className="w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: selectedCoin && !loading && configured !== false ? "#7c3aed" : "#1e1e1e", color: selectedCoin ? "#fff" : "#444" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Generating address…</> : "Generate Address →"}
            </button>
          </motion.div>
        )}

        {step === "address" && payment && (
          <motion.div key="address" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <div className="p-4 rounded-xl mb-4 text-center" style={{ background: "#0a1f14", border: "1px solid #1a5a2a" }}>
              <p className="text-green-400 font-bold text-sm mb-0.5">Payment address generated!</p>
              <p className="text-slate-500 text-xs">Send exactly the amount shown. You will receive {Number(tokenAmount).toLocaleString()} tokens.</p>
            </div>
            <div className="p-4 rounded-xl mb-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-slate-500 text-xs mb-1">Send exactly</p>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-black text-2xl">{payment.payAmount} <span className="text-slate-400 text-base font-bold">{payment.payCurrency.toUpperCase()}</span></p>
                <CopyBtn text={String(payment.payAmount)} />
              </div>
              <p className="text-slate-500 text-xs mb-1">To this address</p>
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#222", border: "1px solid #333" }}>
                <code className="text-violet-300 text-xs font-mono break-all flex-1">{payment.payAddress}</code>
                <CopyBtn text={payment.payAddress} />
              </div>
              <p className="text-slate-700 text-xs mt-2">Payment ID: {payment.paymentId}</p>
            </div>
            <button onClick={checkPayment}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold mb-3 hover:opacity-80"
              style={{ background: "#1e1e1e", border: "1px solid #333", color: "#888" }}>
              <RefreshCw size={13} /> Check Status
            </button>
            {checkStatus && (
              <div className="p-3 rounded-xl mb-3 text-center" style={{
                background: checkStatus === "finished" ? "#0a1f14" : "#1a1a1a",
                border: checkStatus === "finished" ? "1px solid #1a5a2a" : "1px solid #222",
              }}>
                <p className="text-sm font-semibold" style={{ color: checkStatus === "finished" ? "#4ade80" : "#888" }}>
                  Status: {checkStatus}
                </p>
              </div>
            )}
            <p className="text-slate-700 text-xs text-center">Funds are credited automatically after blockchain confirmation.</p>
            <button onClick={onDone} className="w-full mt-4 py-3 rounded-xl text-white font-bold hover:opacity-90" style={{ background: "#7c3aed" }}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WithdrawFlow({ onBack, balance }: { onBack: () => void; balance: number }) {
  const [step, setStep] = useState<"amount" | "address" | "submitted">("amount");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [coin, setCoin] = useState<typeof SUPPORTED_COINS[0]>(SUPPORTED_COINS[0]!);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usdValue = amount ? (Number(amount) * USD_PER_TOKEN).toFixed(2) : "0.00";
  const maxAmount = balance;

  const submit = async () => {
    if (!amount || !address) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/payments/withdraw", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAmount: Number(amount), withdrawAddress: address, currency: coin.symbol.toLowerCase() }),
      });
      const d = await r.json() as { error?: string };
      if (d.error) throw new Error(d.error);
      setStep("submitted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
    }
    setLoading(false);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors text-sm">← Back</button>
        <h2 className="text-white font-black text-lg">Withdraw</h2>
      </div>

      <div className="mb-4 p-3 rounded-xl flex gap-2" style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}>
        <p className="text-green-600 text-xs">Rate: <strong className="text-green-400">20 tokens = $1 USD</strong></p>
      </div>

      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div key="amt" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-1">Amount to withdraw</p>
            <p className="text-slate-600 text-xs mb-3">Available: {balance.toLocaleString()} tokens (≈ ${(balance * USD_PER_TOKEN).toFixed(2)} USD)</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <span className="font-black text-lg" style={{ color: "#6b7280" }}>T</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} max={maxAmount}
                placeholder="0" className="flex-1 bg-transparent text-white text-2xl font-black outline-none" />
              <button onClick={() => setAmount(String(maxAmount))} className="text-violet-400 text-xs font-bold">MAX</button>
            </div>
            {amount && <p className="text-slate-600 text-xs text-center mb-3">≈ ${usdValue} USD</p>}
            {Number(amount) > maxAmount && <p className="text-red-400 text-xs text-center mb-3">Exceeds available balance</p>}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[500, 1000, 2500, 5000, 10000, 25000].map((amt) => (
                <button key={amt} onClick={() => setAmount(String(Math.min(amt, maxAmount)))}
                  className="py-2 rounded-lg text-xs font-bold"
                  style={{ background: amount === String(Math.min(amt, maxAmount)) ? "#2a1f44" : "#1a1a1a", border: amount === String(Math.min(amt, maxAmount)) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: amount === String(Math.min(amt, maxAmount)) ? "#c4b5fd" : "#555" }}>
                  {amt >= 1000 ? `${amt / 1000}K` : amt}
                </button>
              ))}
            </div>

            <p className="text-slate-400 text-sm mb-2">Receive as</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {SUPPORTED_COINS.map((c) => (
                <button key={c.symbol} onClick={() => setCoin(c)}
                  className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: coin.symbol === c.symbol ? "#1e1530" : "#1a1a1a", border: coin.symbol === c.symbol ? "1px solid #7c3aed" : "1px solid #222", color: coin.symbol === c.symbol ? "#c4b5fd" : "#555" }}>
                  <span style={{ color: c.color }}>{c.emoji}</span> {c.symbol}
                </button>
              ))}
            </div>

            <button onClick={() => setStep("address")}
              disabled={!amount || Number(amount) <= 0 || Number(amount) > maxAmount}
              className="w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
              style={{ background: amount && Number(amount) > 0 && Number(amount) <= maxAmount ? "#7c3aed" : "#1e1e1e", color: amount ? "#fff" : "#444" }}>
              Continue →
            </button>
          </motion.div>
        )}

        {step === "address" && (
          <motion.div key="addr" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-1">Your {coin.symbol} address</p>
            <p className="text-slate-600 text-xs mb-3">We will send {Number(amount).toLocaleString()} tokens (≈ ${usdValue} USD) to this address</p>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Enter your ${coin.symbol} wallet address`}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-mono outline-none resize-none mb-4"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
            <div className="p-3 rounded-xl mb-4 flex gap-2" style={{ background: "#1a1000", border: "1px solid #3a2a00" }}>
              <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-600 text-xs">Double-check your address. Withdrawals cannot be reversed.</p>
            </div>
            <button onClick={submit} disabled={!address.trim() || loading}
              className="w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: address && !loading ? "#7c3aed" : "#1e1e1e", color: address ? "#fff" : "#444" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : `Withdraw ${Number(amount).toLocaleString()} tokens`}
            </button>
          </motion.div>
        )}

        {step === "submitted" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#0a2a15", border: "2px solid #1a5a2a" }}>
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <p className="text-white font-black text-xl mb-1">Withdrawal submitted!</p>
            <p className="text-slate-500 text-sm mb-6">Your request is being processed. Funds will arrive within minutes.</p>
            <button onClick={onBack} className="px-8 py-3 rounded-xl text-white font-bold hover:opacity-90" style={{ background: "#7c3aed" }}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Wallet() {
  const [view, setView] = useState<"main" | "deposit" | "withdraw">("main");
  const { isSignedIn, isLoading, user, refetch } = useAuth();

  const balance = user?.balance ?? 0;
  const usdBalance = (balance * USD_PER_TOKEN).toFixed(2);

  if (!isLoading && !isSignedIn) {
    return (
      <div className="min-h-screen px-4 py-6" style={{ background: "#111" }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <WalletIcon size={16} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl">Wallet</h1>
            <p className="text-slate-500 text-xs">Manage your balance and withdraw your winnings.</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl mb-4 flex items-center gap-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
          <LogIn size={18} className="text-slate-600 flex-shrink-0" />
          <p className="text-slate-400 text-sm flex-1">Sign in with Discord to access your wallet.</p>
          <Link href="/sign-in">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ background: "#7c3aed" }}>Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "#111" }}>
      <AnimatePresence mode="wait">
        {view === "main" && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div className="px-4 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1a1a1a" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <WalletIcon size={16} className="text-violet-400" />
                </div>
                <div>
                  <h1 className="text-white font-black text-xl leading-none">Wallet</h1>
                  <p className="text-slate-500 text-xs mt-0.5">Manage your balance and withdraw your winnings.</p>
                </div>
              </div>
              {user && (
                <img src={avatarUrl(user)} alt={user.username} className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid #2a2a2a" }} />
              )}
            </div>

            <div className="px-4 pt-4">
              {/* Balance card — MM2Bet style */}
              <div
                className="p-5 rounded-2xl relative overflow-hidden mb-4"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
              >
                <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(124,58,237,0.12)", filter: "blur(30px)", pointerEvents: "none" }} />

                {/* Balance icon top-right */}
                <div className="flex items-start justify-between mb-3">
                  <p className="text-slate-500 text-sm">Available Balance</p>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2a1f44", border: "1px solid #3a2a64" }}>
                    <WalletIcon size={16} className="text-violet-400" />
                  </div>
                </div>

                {/* Large balance number */}
                <p className="font-black leading-none mb-1" style={{ fontSize: "2.5rem", color: "#fff" }}>
                  {isLoading ? "—" : balance.toLocaleString()}
                  <span className="text-base font-semibold ml-2" style={{ color: "#6b7280" }}>tokens</span>
                </p>
                <p className="text-sm mb-5" style={{ color: "#4b5563" }}>≈ ${isLoading ? "0.00" : usdBalance} USD</p>

                {/* Deposit / Withdraw buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setView("deposit")}
                    disabled={!isSignedIn}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                    style={{ background: "#252525", border: "1px solid #333", color: "#ccc" }}
                  >
                    <ArrowDownLeft size={15} />
                    Deposit
                  </button>
                  <button
                    onClick={() => setView("withdraw")}
                    disabled={!isSignedIn}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: "#ea580c", color: "#fff" }}
                  >
                    <ArrowUpRight size={15} />
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Menu links */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #222" }}>
                {[
                  {
                    href: "/wallet/tips",
                    icon: Clock,
                    iconColor: "#f59e0b",
                    iconBg: "#1a1000",
                    label: "Tips History",
                    desc: "View sent & received",
                  },
                  {
                    href: "/rewards",
                    icon: Trophy,
                    iconColor: "#4ade80",
                    iconBg: "#0a1a0a",
                    label: "Winnings",
                    desc: "View giveaway prizes",
                  },
                  {
                    href: "/games",
                    icon: Gamepad2,
                    iconColor: "#a78bfa",
                    iconBg: "#1a0a2a",
                    label: "Game History",
                    desc: "View PVP games",
                  },
                ].map((item, i, arr) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="flex items-center gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-[#1e1e1e]"
                      style={{
                        background: "#1a1a1a",
                        borderBottom: i < arr.length - 1 ? "1px solid #1e1e1e" : "none",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: item.iconBg, border: `1px solid ${item.iconColor}22` }}
                      >
                        <item.icon size={16} style={{ color: item.iconColor }} />
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
            </div>
          </motion.div>
        )}

        {view === "deposit" && (
          <motion.div key="deposit" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <DepositFlow onBack={() => { setView("main"); refetch(); }} onDone={() => { setView("main"); refetch(); }} />
          </motion.div>
        )}

        {view === "withdraw" && (
          <motion.div key="withdraw" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <WithdrawFlow onBack={() => { setView("main"); refetch(); }} balance={balance} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
