import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, History, LogIn, Copy,
  CheckCircle, RefreshCw, ExternalLink, Loader2, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUPPORTED_COINS = [
  { symbol: "BTC", name: "Bitcoin", emoji: "₿", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", emoji: "Ξ", color: "#627eea" },
  { symbol: "LTC", name: "Litecoin", emoji: "Ł", color: "#bfbbbb" },
  { symbol: "USDT", name: "Tether (TRC20)", emoji: "₮", color: "#26a17b" },
  { symbol: "SOL", name: "Solana", emoji: "◎", color: "#9945ff" },
  { symbol: "BNB", name: "BNB", emoji: "◆", color: "#f3ba2f" },
];

const ROBUX_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];
const ROBUX_TO_USD = 0.0035;

interface PaymentData {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  status: string;
}

interface MowPaymentData {
  orderId: string;
  robuxAmount: number;
  status: string;
  tradeUrl?: string;
  instructions?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
      style={{ background: copied ? "#0a2a15" : "#222", border: copied ? "1px solid #1a5a2a" : "1px solid #333", color: copied ? "#4ade80" : "#888" }}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function MowDepositFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"amount" | "confirm">("amount");
  const [robuxAmount, setRobuxAmount] = useState("");
  const [payment, setPayment] = useState<MowPaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  const createPayment = async () => {
    if (!robuxAmount || !Number(robuxAmount)) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/payments/mow/create", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robuxAmount: Number(robuxAmount) }),
      });
      const d = await r.json() as MowPaymentData & { error?: string };
      if (d.error) throw new Error(d.error);
      setPayment(d);
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order");
    }
    setLoading(false);
  };

  const checkOrder = async () => {
    if (!payment) return;
    try {
      const r = await fetch(`/api/payments/mow/check/${payment.orderId}`, { credentials: "include" });
      const d = await r.json() as { status?: string };
      setCheckStatus(d.status ?? "unknown");
    } catch { setCheckStatus("error"); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition-colors text-sm">← Back</button>
        <h2 className="text-white font-black text-lg">Robux Deposit</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#1a0a2a", border: "1px solid #5a2a8a", color: "#c4b5fd" }}>MowPayments</span>
      </div>

      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div key="amount" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-2">How many Robux to deposit?</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
              <span className="text-violet-400 font-bold text-lg">R$</span>
              <input type="number" value={robuxAmount} onChange={(e) => setRobuxAmount(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-white text-xl font-bold outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {ROBUX_AMOUNTS.map((amt) => (
                <button key={amt} onClick={() => setRobuxAmount(String(amt))}
                  className="py-2 rounded-lg text-xs font-bold"
                  style={{ background: robuxAmount === String(amt) ? "#2a1f44" : "#222", border: robuxAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: robuxAmount === String(amt) ? "#c4b5fd" : "#555" }}>
                  R${amt >= 1000 ? `${amt / 1000}K` : amt}
                </button>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
            <button onClick={createPayment} disabled={!robuxAmount || !Number(robuxAmount) || loading}
              className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: robuxAmount ? "#7c3aed" : "#1e1e1e", color: robuxAmount ? "#fff" : "#444" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating order…</> : "Continue →"}
            </button>
          </motion.div>
        )}

        {step === "confirm" && payment && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <div className="p-4 rounded-xl mb-4 text-center" style={{ background: "#0a1f14", border: "1px solid #1a5a2a" }}>
              <p className="text-green-400 font-bold text-sm mb-1">Order created!</p>
              <p className="text-slate-500 text-xs">Follow the instructions below to complete your deposit</p>
            </div>

            <div className="p-4 rounded-xl mb-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-slate-500 text-xs mb-1">Amount to send</p>
              <p className="text-white font-black text-3xl mb-3">R$ <span style={{ color: "#c4b5fd" }}>{Number(payment.robuxAmount).toLocaleString()}</span></p>

              <p className="text-slate-500 text-xs mb-1">Order ID (include in trade note)</p>
              <div className="flex items-center gap-2 p-3 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
                <code className="text-violet-300 text-xs font-mono flex-1 break-all">{payment.orderId}</code>
                <CopyButton text={payment.orderId} />
              </div>

              {payment.tradeUrl && (
                <>
                  <p className="text-slate-500 text-xs mb-1">Trade Link</p>
                  <a href={payment.tradeUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg mb-3 hover:opacity-80 transition-opacity"
                    style={{ background: "#222", border: "1px solid #333" }}>
                    <ExternalLink size={13} className="text-violet-400" />
                    <span className="text-violet-300 text-xs font-mono flex-1 truncate">{payment.tradeUrl}</span>
                  </a>
                </>
              )}

              {payment.instructions && (
                <div className="p-3 rounded-lg" style={{ background: "#111", border: "1px solid #222" }}>
                  <p className="text-slate-400 text-xs leading-relaxed">{payment.instructions}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <button onClick={checkOrder}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"
                style={{ background: "#1e1e1e", border: "1px solid #333", color: "#888" }}>
                <RefreshCw size={13} /> Check Status
              </button>
            </div>

            {checkStatus && (
              <div className="p-3 rounded-lg mb-3 text-center" style={{
                background: checkStatus === "finished" ? "#0a1f14" : "#1a1a1a",
                border: checkStatus === "finished" ? "1px solid #1a5a2a" : "1px solid #222",
              }}>
                <p className="text-sm font-semibold" style={{ color: checkStatus === "finished" ? "#4ade80" : "#888" }}>
                  Status: {checkStatus}
                </p>
              </div>
            )}

            <p className="text-slate-700 text-xs text-center leading-relaxed">
              After sending, an admin will verify and credit your balance.
              Keep your Order ID safe as proof of payment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CryptoDepositFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"amount" | "coin" | "address">("amount");
  const [robuxAmount, setRobuxAmount] = useState("");
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
    if (!selectedCoin || !robuxAmount) return;
    setLoading(true); setError("");
    const usdAmount = Math.max(1, Math.round(Number(robuxAmount) * ROBUX_TO_USD * 100) / 100);
    try {
      const r = await fetch("/api/payments/create", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payCurrency: selectedCoin.symbol.toLowerCase(), priceAmount: usdAmount }),
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

  const usdValue = robuxAmount ? (Number(robuxAmount) * ROBUX_TO_USD).toFixed(2) : "0.00";

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition-colors text-sm">← Back</button>
        <h2 className="text-white font-black text-lg">Crypto Deposit</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#0a1a2a", border: "1px solid #1a3a5a", color: "#60a5fa" }}>NowPayments</span>
      </div>

      {configured === false && (
        <div className="mb-4 p-4 rounded-xl flex gap-3" style={{ background: "#1a1000", border: "1px solid #3a2a00" }}>
          <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 text-sm font-semibold">NowPayments not configured</p>
            <p className="text-yellow-700 text-xs mt-0.5">Add <code className="text-yellow-500">NOWPAYMENTS_API_KEY</code> to Replit Secrets to enable crypto deposits.</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div key="amount" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-2">How many Robux to deposit?</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
              <span className="text-violet-400 font-bold text-lg">R$</span>
              <input type="number" value={robuxAmount} onChange={(e) => setRobuxAmount(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-white text-xl font-bold outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {ROBUX_AMOUNTS.map((amt) => (
                <button key={amt} onClick={() => setRobuxAmount(String(amt))}
                  className="py-2 rounded-lg text-xs font-bold"
                  style={{ background: robuxAmount === String(amt) ? "#2a1f44" : "#222", border: robuxAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: robuxAmount === String(amt) ? "#c4b5fd" : "#555" }}>
                  R${amt >= 1000 ? `${amt / 1000}K` : amt}
                </button>
              ))}
            </div>
            {robuxAmount && <p className="text-slate-600 text-xs text-center mb-4">≈ ${usdValue} USD at current rate</p>}
            <button onClick={() => setStep("coin")} disabled={!robuxAmount || !Number(robuxAmount)}
              className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90"
              style={{ background: robuxAmount ? "#7c3aed" : "#1e1e1e", color: robuxAmount ? "#fff" : "#444" }}>
              Continue →
            </button>
          </motion.div>
        )}

        {step === "coin" && (
          <motion.div key="coin" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="text-slate-400 text-sm mb-3">Choose payment currency</p>
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
              className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: selectedCoin && !loading && configured !== false ? "#7c3aed" : "#1e1e1e", color: selectedCoin ? "#fff" : "#444" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Generating address…</> : "Generate Address →"}
            </button>
          </motion.div>
        )}

        {step === "address" && payment && (
          <motion.div key="address" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <div className="p-4 rounded-xl mb-4 text-center" style={{ background: "#0a1f14", border: "1px solid #1a5a2a" }}>
              <p className="text-green-400 font-bold text-sm mb-1">Payment address generated!</p>
              <p className="text-slate-500 text-xs">Send exactly the amount shown to this address</p>
            </div>
            <div className="p-4 rounded-xl mb-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-slate-500 text-xs mb-1">Send exactly</p>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-black text-2xl">{payment.payAmount} <span className="text-slate-400 text-lg font-bold">{payment.payCurrency.toUpperCase()}</span></p>
                <CopyButton text={String(payment.payAmount)} />
              </div>
              <p className="text-slate-500 text-xs mb-1">To this address</p>
              <div className="flex items-start gap-2 p-3 rounded-lg mb-1" style={{ background: "#222", border: "1px solid #333" }}>
                <code className="text-violet-300 text-xs font-mono break-all flex-1">{payment.payAddress}</code>
                <CopyButton text={payment.payAddress} />
              </div>
              <p className="text-slate-700 text-xs">Payment ID: {payment.paymentId}</p>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={checkPayment}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"
                style={{ background: "#1e1e1e", border: "1px solid #333", color: "#888" }}>
                <RefreshCw size={13} /> Check Status
              </button>
              <a href="https://nowpayments.io" target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"
                style={{ background: "#1e1e1e", border: "1px solid #333", color: "#888" }}>
                <ExternalLink size={13} /> Track
              </a>
            </div>
            {checkStatus && (
              <div className="p-3 rounded-lg mb-3 text-center" style={{ background: checkStatus === "finished" ? "#0a1f14" : "#1a1a1a", border: checkStatus === "finished" ? "1px solid #1a5a2a" : "1px solid #222" }}>
                <p className="text-sm font-semibold" style={{ color: checkStatus === "finished" ? "#4ade80" : "#888" }}>Status: {checkStatus}</p>
              </div>
            )}
            <p className="text-slate-700 text-xs text-center leading-relaxed">Funds are credited automatically after blockchain confirmation.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type DepositMethod = "mow" | "crypto";

function DepositSelector({ onSelect }: { onSelect: (m: DepositMethod) => void }) {
  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">Choose deposit method</p>
      <div className="space-y-3">
        <button onClick={() => onSelect("mow")}
          className="w-full flex items-center gap-4 p-4 rounded-xl text-left hover:bg-[#1e1e1e] transition-colors"
          style={{ background: "#1a1a1a", border: "1px solid #3a1a5a" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#2a1f44" }}>
            R$
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">Robux (MowPayments)</p>
            <p className="text-slate-500 text-xs mt-0.5">Pay directly with Robux via Roblox trade</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#2a1f44", color: "#c4b5fd" }}>Recommended</span>
        </button>

        <button onClick={() => onSelect("crypto")}
          className="w-full flex items-center gap-4 p-4 rounded-xl text-left hover:bg-[#1e1e1e] transition-colors"
          style={{ background: "#1a1a1a", border: "1px solid #1a2a3a" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0a1a2a" }}>
            <span className="text-lg">₿</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">Crypto (NowPayments)</p>
            <p className="text-slate-500 text-xs mt-0.5">BTC, ETH, LTC, USDT, SOL, BNB</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function Wallet() {
  const [view, setView] = useState<"main" | "deposit" | "deposit-mow" | "deposit-crypto" | "withdraw">("main");
  const [robuxAmount, setRobuxAmount] = useState("");
  const { isSignedIn, isLoading, user } = useAuth();

  const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

  return (
    <div className="min-h-screen px-3 py-4" style={{ background: "#111" }}>
      <div className="mb-5">
        <h1 className="text-xl font-black text-white mb-0.5 flex items-center gap-2">
          <WalletIcon size={20} className="text-violet-400" />
          Wallet
        </h1>
        <p className="text-slate-500 text-sm">Manage your Robux balance</p>
      </div>

      {!isLoading && !isSignedIn && (
        <div className="mb-5 p-4 rounded-xl flex items-center gap-3" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
          <LogIn size={16} className="text-slate-500 flex-shrink-0" />
          <p className="text-slate-400 text-sm flex-1">Sign in to manage your balance.</p>
          <Link href="/sign-in">
            <button className="px-4 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90" style={{ background: "#7c3aed" }}>Sign In</button>
          </Link>
        </div>
      )}

      <section className="mb-5 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        {isSignedIn && user && <p className="text-slate-500 text-xs mb-1">{user.username}</p>}
        <p className="text-slate-500 text-sm">Available Balance</p>
        <p className="text-4xl font-black mb-4" style={{ color: isSignedIn ? "#fff" : "#333" }}>
          R$ {isSignedIn && user ? user.balance.toLocaleString() : "0"}
        </p>
        <div className="flex gap-3">
          <button onClick={() => setView("deposit")} disabled={!isSignedIn}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm hover:opacity-90"
            style={{ background: isSignedIn ? "#7c3aed" : "#1e1e1e", color: isSignedIn ? "#fff" : "#333", cursor: isSignedIn ? "pointer" : "not-allowed" }}>
            <ArrowDownLeft size={15} />
            Deposit
          </button>
          <button onClick={() => setView("withdraw")} disabled={!isSignedIn}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#222]"
            style={{ background: "#1e1e1e", border: "1px solid #333", color: isSignedIn ? "#ccc" : "#333", cursor: isSignedIn ? "pointer" : "not-allowed" }}>
            <ArrowUpRight size={15} />
            Withdraw
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {view === "deposit" && (
          <motion.section key="deposit-select"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView("main")} className="text-slate-500 hover:text-slate-300 transition-colors text-sm">← Back</button>
              <h2 className="text-white font-black text-lg">Deposit</h2>
            </div>
            <DepositSelector onSelect={(m) => setView(m === "mow" ? "deposit-mow" : "deposit-crypto")} />
          </motion.section>
        )}

        {view === "deposit-mow" && (
          <motion.section key="deposit-mow"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <MowDepositFlow onBack={() => setView("deposit")} />
          </motion.section>
        )}

        {view === "deposit-crypto" && (
          <motion.section key="deposit-crypto"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <CryptoDepositFlow onBack={() => setView("deposit")} />
          </motion.section>
        )}

        {view === "withdraw" && (
          <motion.section key="withdraw"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView("main")} className="text-slate-500 hover:text-slate-300 text-sm">← Back</button>
              <h2 className="text-white font-black text-lg">Withdraw</h2>
            </div>
            <p className="text-slate-400 text-sm mb-2">Amount (R$)</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
              <span className="text-violet-400 font-bold text-lg">R$</span>
              <input type="number" value={robuxAmount} onChange={(e) => setRobuxAmount(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-white text-xl font-bold outline-none" />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {QUICK_AMOUNTS.map((amt) => (
                <button key={amt} onClick={() => setRobuxAmount(String(amt))}
                  className="py-2 rounded-lg text-xs font-bold"
                  style={{ background: robuxAmount === String(amt) ? "#2a1f44" : "#222", border: robuxAmount === String(amt) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: robuxAmount === String(amt) ? "#c4b5fd" : "#555" }}>
                  R${amt >= 1000 ? `${amt / 1000}K` : amt}
                </button>
              ))}
            </div>
            <p className="text-slate-400 text-sm mb-2">Withdraw to (crypto address)</p>
            <input type="text" placeholder="Your BTC / ETH / LTC address"
              className="w-full px-4 py-3 rounded-lg font-mono text-sm outline-none mb-5"
              style={{ background: "#222", border: "1px solid #333", color: "#e5e5e5" }} />
            <p className="text-slate-400 text-sm mb-2">Currency</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {SUPPORTED_COINS.slice(0, 3).map((coin) => (
                <button key={coin.symbol}
                  className="flex flex-col items-center py-3 rounded-lg hover:bg-[#1e1e1e] transition-colors"
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>
                  <span className="font-black" style={{ color: coin.color }}>{coin.symbol}</span>
                </button>
              ))}
            </div>
            <button disabled={!robuxAmount}
              className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90"
              style={{ background: robuxAmount ? "#7c3aed" : "#1e1e1e", color: robuxAmount ? "#fff" : "#444" }}>
              Request Withdrawal
            </button>
          </motion.section>
        )}

        {view === "main" && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <section className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Deposited", value: "R$ 0", icon: ArrowDownLeft },
                { label: "Total Won", value: "R$ 0", icon: TrendingUp },
                { label: "Wagered", value: "R$ 0", icon: TrendingDown },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                  <stat.icon size={16} className="mx-auto mb-1 text-slate-700" />
                  <p className="text-slate-600 font-bold text-sm">{stat.value}</p>
                  <p className="text-slate-700 text-xs">{stat.label}</p>
                </div>
              ))}
            </section>

            <section className="mb-5 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <h2 className="text-white font-bold text-sm mb-3">Accepted Payment Methods</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#222", border: "1px solid #2a2a2a" }}>
                  <span className="text-violet-400 font-black text-sm w-8 text-center">R$</span>
                  <div>
                    <p className="text-white text-sm font-bold">Robux via MowPayments</p>
                    <p className="text-slate-600 text-xs">Direct Roblox trade · Admin-verified</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#2a1f44", color: "#c4b5fd" }}>Main</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {SUPPORTED_COINS.map((coin) => (
                    <div key={coin.symbol} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                      <span className="font-black text-sm" style={{ color: coin.color }}>{coin.emoji}</span>
                      <span className="text-slate-400 text-xs font-semibold">{coin.symbol}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-700 text-xs">Crypto powered by NowPayments · Instant confirmation tracking</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                <History size={15} className="text-slate-600" />
                Transaction History
              </h2>
              <div className="p-10 rounded-xl flex flex-col items-center justify-center text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <History size={28} className="text-slate-700 mb-3" />
                <p className="text-slate-600 text-sm">No transactions yet</p>
                <p className="text-slate-700 text-xs mt-1">
                  {isSignedIn ? "Deposits will appear here after confirmation" : "Sign in to view your history"}
                </p>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
