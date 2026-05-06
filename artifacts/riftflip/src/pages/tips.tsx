import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUpRight, ArrowDownLeft, Loader2, Send, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TipLog {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  createdAt: string;
}

export default function TipsPage() {
  const { user, isSignedIn, isLoading, refetch } = useAuth();
  const [tips, setTips] = useState<TipLog[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [toUsername, setToUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const balance = user?.balance ?? 0;

  const loadTips = async () => {
    setTipsLoading(true);
    try {
      const r = await fetch("/api/tips/history", { credentials: "include" });
      const d = await r.json() as { tips?: TipLog[] };
      setTips(d.tips ?? []);
    } catch { /* ignore */ }
    setTipsLoading(false);
  };

  useEffect(() => {
    if (isSignedIn) void loadTips();
    else setTipsLoading(false);
  }, [isSignedIn]);

  const sendTip = async () => {
    if (!toUsername || !amount || Number(amount) <= 0) return;
    setSending(true); setSendMsg("");
    try {
      const r = await fetch("/api/tips/send", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUsername, amount: Number(amount) }),
      });
      const d = await r.json() as { ok?: boolean; error?: string; tip?: TipLog };
      if (d.ok && d.tip) {
        setSendMsg(`✅ Sent 🪙 ${Number(amount).toLocaleString()} tokens to ${toUsername}!`);
        setToUsername(""); setAmount("");
        setShowSend(false);
        await loadTips();
        refetch();
      } else {
        setSendMsg(`❌ ${d.error ?? "Failed to send"}`);
      }
    } catch {
      setSendMsg("❌ Network error");
    }
    setSending(false);
  };

  const QUICK = [100, 500, 1000, 5000];

  if (!isLoading && !isSignedIn) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-center gap-4" style={{ background: "#111" }}>
        <p className="text-white font-bold">Sign in to send tips</p>
        <Link href="/sign-in">
          <button className="px-6 py-3 rounded-xl text-white font-bold" style={{ background: "#5865F2" }}>Sign In with Discord</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "#111" }}>
      <div className="px-4 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <Link href="/wallet">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1e1e1e]" style={{ border: "1px solid #222" }}>
            <ChevronRight size={15} className="text-slate-500 rotate-180" />
          </button>
        </Link>
        <div>
          <h1 className="text-white font-black text-xl leading-none">Tips</h1>
          <p className="text-slate-500 text-xs mt-0.5">Send tokens to other players</p>
        </div>
        <div className="ml-auto">
          <p className="text-violet-300 font-bold text-sm">🪙 {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={() => { setShowSend(true); setSendMsg(""); }}
          disabled={!isSignedIn}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90 mb-5"
          style={{ background: "#7c3aed" }}
        >
          <Send size={15} /> Send a Tip
        </button>

        {sendMsg && (
          <div className="mb-4 p-3 rounded-xl text-center text-sm font-semibold" style={{
            background: sendMsg.startsWith("✅") ? "#0a2a15" : "#2a0a0a",
            border: sendMsg.startsWith("✅") ? "1px solid #1a5a2a" : "1px solid #5a1a1a",
            color: sendMsg.startsWith("✅") ? "#4ade80" : "#f87171",
          }}>
            {sendMsg}
          </div>
        )}

        <p className="text-slate-400 text-sm font-semibold mb-3">History</p>

        {tipsLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-slate-700" /></div>
        ) : tips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm">No tips yet</p>
            <p className="text-slate-700 text-xs mt-1">Tips you send or receive will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tips.map((tip) => {
              const isSent = tip.fromId === user?.id;
              return (
                <div key={tip.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isSent ? "#2a0a0a" : "#0a2a15", border: `1px solid ${isSent ? "#5a1a1a" : "#1a5a2a"}` }}
                  >
                    {isSent
                      ? <ArrowUpRight size={16} className="text-red-400" />
                      : <ArrowDownLeft size={16} className="text-green-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">
                      {isSent ? `To ${tip.toName}` : `From ${tip.fromName}`}
                    </p>
                    <p className="text-slate-500 text-xs">{new Date(tip.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-black text-sm" style={{ color: isSent ? "#f87171" : "#4ade80" }}>
                    {isSent ? "-" : "+"}🪙 {tip.amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSend && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setShowSend(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10 max-w-xl mx-auto"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
              <h3 className="text-white font-black text-lg mb-4">Send Tip</h3>

              <p className="text-slate-400 text-xs mb-1">Recipient username</p>
              <input
                value={toUsername}
                onChange={(e) => setToUsername(e.target.value)}
                placeholder="e.g. Riftflip_King"
                className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none mb-4"
                style={{ background: "#222", border: "1px solid #333" }}
              />

              <p className="text-slate-400 text-xs mb-1">Amount</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
                <span className="text-violet-400">🪙</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-lg font-black outline-none"
                />
              </div>

              <div className="flex gap-2 mb-5">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => setAmount(String(Math.min(q, balance)))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: amount === String(Math.min(q, balance)) ? "#2a1f44" : "#222", border: amount === String(Math.min(q, balance)) ? "1px solid #7c3aed" : "1px solid #333", color: amount === String(Math.min(q, balance)) ? "#c4b5fd" : "#555" }}>
                    {q >= 1000 ? `${q / 1000}K` : q}
                  </button>
                ))}
              </div>

              <p className="text-slate-600 text-xs mb-4 text-center">Your balance: 🪙 {balance.toLocaleString()}</p>

              <button
                onClick={() => void sendTip()}
                disabled={!toUsername || !amount || Number(amount) <= 0 || Number(amount) > balance || sending}
                className="w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: toUsername && amount && Number(amount) > 0 && Number(amount) <= balance ? "#7c3aed" : "#1e1e1e" }}
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? "Sending…" : `Send 🪙 ${Number(amount || 0).toLocaleString()} tokens`}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
