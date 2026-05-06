import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Star, CreditCard, FileText,
  Ban, Coins, ChevronRight, Search, Plus, Trash2,
  BarChart3, CheckCircle, XCircle, Crown,
  RefreshCw, Activity, Loader2, LogIn, AlertTriangle,
  Eye, Key, CloudRain, Gift, Clock,
} from "lucide-react";

interface UserRecord { id: string; username: string; avatar: string | null; balance: number; role: string; banned: boolean; banReason?: string; isAdmin: boolean; joinedAt: string; }
interface RoleRecord { id: string; name: string; color: string; icon: string; permissions: string[]; createdAt: string; }
interface PaymentLog { id: string; userId: string; username: string; priceAmount: number; payCurrency: string; payAmount: number; status: string; createdAt: string; }
interface ActivityLog { id: string; action: string; adminId: string; adminName: string; targetId?: string; targetName?: string; details: string; createdAt: string; }
interface LoginLog { id: string; userId: string; username: string; avatar: string | null; ip: string; userAgent: string; createdAt: string; }
interface AntiAltResult { userId: string; username: string; accountAgeDays: number; isNewAccount: boolean; loginCount: number; uniqueIps: string[]; sharedIpAccounts: { userId: string; username: string; ip: string }[]; riskLevel: "low" | "medium" | "high"; }
interface RainEvent { id: string; adminName: string; totalAmount: number; endsAt: string; joiners: string[]; requirements: { minLevel?: number; minMessages?: number }; status: "active" | "ended"; tokensPerUser?: number; startedAt: string; }
interface GiveawayRecord { id: string; adminName: string; prize: number; endsAt: string; entrants: string[]; requirements: { minLevel?: number; minMessages?: number }; status: "active" | "ended"; winnerId?: string; winnerName?: string; createdAt: string; }

type Section = "overview" | "users" | "roles" | "payments" | "logs" | "login-logs" | "anti-alt" | "events" | "giveaways";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  finished: { bg: "#0a2a15", text: "#4ade80" },
  waiting: { bg: "#1a1500", text: "#fbbf24" },
  confirming: { bg: "#0d1a2a", text: "#60a5fa" },
  failed: { bg: "#2a0a0a", text: "#f87171" },
  expired: { bg: "#1a1a1a", text: "#6b7280" },
  partially_paid: { bg: "#1a100a", text: "#fb923c" },
  pending_manual: { bg: "#1a100a", text: "#fb923c" },
  processing: { bg: "#0d1a2a", text: "#60a5fa" },
};

const ACTION_ICONS: Record<string, string> = {
  ban: "🚫", unban: "✅", give_tokens: "💰", set_role: "🎭",
  make_admin: "🛡️", create_role: "➕", delete_role: "🗑️",
  deposit_confirmed: "💳", withdrawal_created: "💸", withdrawal_requested: "📋",
  tip_sent: "🎁", rain_started: "🌧", rain_ended: "☀️",
  giveaway_created: "🎁", giveaway_ended: "🏆",
};

const AVAILABLE_PERMISSIONS = [
  "vip_perks", "vip_plus_perks", "mvp_perks", "admin",
  "owner", "chat_mod", "bypass_cooldown", "custom_badge",
];

function avatarSrc(user: UserRecord): string {
  if (!user.avatar) return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.username}`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;
}

function api<T>(path: string, opts?: RequestInit): Promise<T> {
  return fetch(`/api${path}`, { credentials: "include", ...opts }).then((r) => r.json() as Promise<T>);
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <p className="text-slate-500 text-xs">{label}</p>
      </div>
      <p className="text-white font-black text-2xl">{value}</p>
    </div>
  );
}

function UsersSection({ roles }: { roles: RoleRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [giveAmount, setGiveAmount] = useState("");
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api<{ users: UserRecord[] }>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    setUsers(d.users ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  const doAction = async (action: string, body?: object) => {
    if (!selected) return;
    setActionLoading(true);
    await api(`/admin/users/${selected.id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    await load();
    setSelected(null);
    setActionLoading(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
          <Search size={14} className="text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="flex-1 bg-transparent text-white text-sm outline-none" />
        </div>
        <button onClick={() => void load()} className="p-2.5 rounded-lg hover:bg-[#222]" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}><RefreshCw size={14} className="text-slate-500" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="text-slate-700 animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No users found. Users appear after they sign in.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const role = roles.find((r) => r.id === u.role);
            return (
              <button key={u.id} onClick={() => setSelected(u)} className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[#1e1e1e] transition-colors" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                <div className="relative flex-shrink-0">
                  <img src={avatarSrc(u)} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                  {u.banned && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white" style={{ fontSize: 8 }}>🚫</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm truncate">{u.username}</p>
                    {u.isAdmin && <Shield size={11} className="text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {role && <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: role.color + "22", color: role.color }}>{role.icon} {role.name}</span>}
                    {u.banned && <span className="text-xs text-red-400">Banned</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-sm font-bold">🪙 {u.balance.toLocaleString()}</p>
                </div>
                <ChevronRight size={14} className="text-slate-700" />
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setSelected(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10 max-w-xl mx-auto"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
              <div className="flex items-center gap-3 mb-5">
                <img src={avatarSrc(selected)} alt={selected.username} className="w-12 h-12 rounded-full" />
                <div>
                  <p className="text-white font-black text-lg">{selected.username}</p>
                  <p className="text-slate-500 text-xs font-mono">{selected.id}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-violet-300 font-bold">🪙 {selected.balance.toLocaleString()}</p>
                  <p className="text-slate-600 text-xs">{selected.banned ? "🚫 Banned" : "✅ Active"}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs mb-1">Give Tokens</p>
              <div className="flex gap-2 mb-4">
                <input type="number" value={giveAmount} onChange={(e) => setGiveAmount(e.target.value)} placeholder="Token amount"
                  className="flex-1 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#222", border: "1px solid #333" }} />
                <button onClick={() => doAction("give-tokens", { amount: Number(giveAmount) })} disabled={!giveAmount || actionLoading}
                  className="px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 flex items-center gap-1.5" style={{ background: "#7c3aed" }}>
                  <Coins size={13} /> Give
                </button>
              </div>

              <p className="text-slate-400 text-xs mb-1">Set Role</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {roles.map((r) => (
                  <button key={r.id} onClick={() => doAction("set-role", { role: r.id })} disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: r.color + "22", border: `1px solid ${r.color}55`, color: r.color }}>
                    {r.icon} {r.name}
                  </button>
                ))}
              </div>

              <p className="text-slate-400 text-xs mb-1">Ban Reason (optional)</p>
              <input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason for ban…"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none mb-3" style={{ background: "#222", border: "1px solid #333" }} />

              <div className="grid grid-cols-2 gap-2">
                {selected.banned ? (
                  <button onClick={() => doAction("unban")} disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold"
                    style={{ background: "#0a2a15", border: "1px solid #1a5a2a", color: "#4ade80" }}>
                    <CheckCircle size={13} /> Unban
                  </button>
                ) : (
                  <button onClick={() => doAction("ban", { reason: banReason || "Banned by admin" })} disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold"
                    style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", color: "#f87171" }}>
                    <Ban size={13} /> Ban
                  </button>
                )}
                <button onClick={() => doAction("make-admin")} disabled={actionLoading || selected.isAdmin}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold"
                  style={{ background: "#1a0a2a", border: "1px solid #3a1a5a", color: selected.isAdmin ? "#555" : "#c4b5fd" }}>
                  <Shield size={13} /> {selected.isAdmin ? "Already Admin" : "Make Admin"}
                </button>
              </div>
              {actionLoading && <p className="text-center text-slate-500 text-xs mt-3 animate-pulse">Processing…</p>}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function RolesSection() {
  const [roleList, setRoles] = useState<RoleRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7c3aed");
  const [icon, setIcon] = useState("🎭");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const EMOJI_PICKS = ["👤", "⭐", "💎", "🏆", "🛡️", "👑", "🎭", "🔥", "⚡", "🌙", "🎯", "🦋", "🐉", "🌟", "💫", "🚀"];

  const load = async () => { setLoading(true); const d = await api<{ roles: RoleRecord[] }>("/admin/roles"); setRoles(d.roles ?? []); setLoading(false); };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!name || !color || !icon) return;
    await api("/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color, icon, permissions: selectedPerms }) });
    setShowCreate(false); setName(""); setIcon("🎭"); setSelectedPerms([]);
    await load();
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    await api(`/admin/roles/${id}`, { method: "DELETE" });
    await load();
  };

  const togglePerm = (p: string) => setSelectedPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">{roleList.length} roles</p>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90" style={{ background: "#7c3aed" }}>
          <Plus size={13} /> Create Role
        </button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-700" /></div> : (
        <div className="space-y-2">
          {roleList.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#1a1a1a", border: `1px solid ${r.color}33` }}>
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: r.color }}>{r.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {r.permissions.length > 0 ? r.permissions.map((p) => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "#222", color: "#888" }}>{p}</span>
                  )) : <span className="text-slate-700 text-xs">No special permissions</span>}
                </div>
              </div>
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: r.color }} />
              {!["member", "vip", "admin", "owner"].includes(r.id) && (
                <button onClick={() => void deleteRole(r.id)} className="p-1.5 rounded-lg hover:bg-[#222] text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setShowCreate(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10 overflow-y-auto"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a", maxHeight: "90vh" }}>
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
              <h3 className="text-white font-black text-lg mb-4">Create Role</h3>
              <p className="text-slate-400 text-xs mb-1">Name</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none mb-4" style={{ background: "#222", border: "1px solid #333" }} />
              <p className="text-slate-400 text-xs mb-2">Icon</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EMOJI_PICKS.map((e) => <button key={e} onClick={() => setIcon(e)} className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all" style={{ background: icon === e ? "#2a1f44" : "#222", border: icon === e ? "1px solid #7c3aed" : "1px solid #2a2a2a" }}>{e}</button>)}
              </div>
              <p className="text-slate-400 text-xs mb-2">Color</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#7c3aed", "#6b7280"].map((c) => (
                  <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full transition-all" style={{ background: c, border: color === c ? "2px solid #fff" : "2px solid transparent" }} />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0" style={{ background: "transparent" }} />
              </div>
              <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5"><Key size={11} /> Permissions</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVAILABLE_PERMISSIONS.map((p) => (
                  <button key={p} onClick={() => togglePerm(p)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all"
                    style={{ background: selectedPerms.includes(p) ? "#2a1f44" : "#222", border: selectedPerms.includes(p) ? "1px solid #7c3aed" : "1px solid #2a2a2a", color: selectedPerms.includes(p) ? "#c4b5fd" : "#555" }}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: color + "22", border: `1px solid ${color}55` }}>
                <span className="text-2xl">{icon}</span>
                <div>
                  <span className="font-bold" style={{ color }}>{name || "Preview"}</span>
                  {selectedPerms.length > 0 && <p className="text-xs text-slate-500 mt-0.5">{selectedPerms.join(", ")}</p>}
                </div>
              </div>
              <button onClick={() => void create()} disabled={!name} className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90" style={{ background: name ? "#7c3aed" : "#1e1e1e", color: name ? "#fff" : "#444" }}>Create Role</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentsSection() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmUserId, setConfirmUserId] = useState("");
  const [confirmTokens, setConfirmTokens] = useState("");
  const [confirmTx, setConfirmTx] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = () => {
    api<{ payments: PaymentLog[] }>("/admin/payments").then((d) => { setPayments(d.payments ?? []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const confirmManual = async () => {
    if (!confirmUserId || !confirmTokens || !confirmTx) return;
    setConfirmLoading(true);
    try {
      const r = await api<{ ok?: boolean; newBalance?: number; error?: string }>("/admin/payments/mow/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: confirmUserId, tokenAmount: Number(confirmTokens), txId: confirmTx }),
      });
      setConfirmMsg(r.ok ? `✅ Confirmed! New balance: 🪙 ${r.newBalance?.toLocaleString()}` : `❌ ${r.error}`);
      load();
    } catch { setConfirmMsg("❌ Failed"); }
    setConfirmLoading(false);
  };

  return (
    <div>
      <div className="mb-5 p-4 rounded-xl" style={{ background: "#1a0a2a", border: "1px solid #3a1a5a" }}>
        <p className="text-violet-300 text-sm font-bold mb-3 flex items-center gap-2"><CreditCard size={13} /> Confirm Manual Deposit</p>
        <div className="space-y-2">
          <input value={confirmUserId} onChange={(e) => setConfirmUserId(e.target.value)} placeholder="User Discord ID"
            className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none font-mono" style={{ background: "#222", border: "1px solid #333" }} />
          <input type="number" value={confirmTokens} onChange={(e) => setConfirmTokens(e.target.value)} placeholder="Token amount"
            className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#222", border: "1px solid #333" }} />
          <input value={confirmTx} onChange={(e) => setConfirmTx(e.target.value)} placeholder="Transaction / Order ID"
            className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none font-mono" style={{ background: "#222", border: "1px solid #333" }} />
          <button onClick={() => void confirmManual()} disabled={!confirmUserId || !confirmTokens || !confirmTx || confirmLoading}
            className="w-full py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "#7c3aed" }}>
            {confirmLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Confirm & Credit
          </button>
          {confirmMsg && <p className="text-xs text-center mt-1" style={{ color: confirmMsg.startsWith("✅") ? "#4ade80" : "#f87171" }}>{confirmMsg}</p>}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-700" /></div> : payments.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No payment records yet</div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const col = STATUS_COLORS[p.status] ?? STATUS_COLORS["expired"]!;
            return (
              <div key={p.id} className="p-3 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-bold">{p.username}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.text }}>{p.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-slate-400 text-xs">
                    🪙 {p.priceAmount.toLocaleString()} tokens {p.payCurrency !== "manual" ? `· ${p.payAmount} ${p.payCurrency.toUpperCase()}` : ""}
                  </p>
                  <p className="text-slate-600 text-xs ml-auto">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-slate-700 text-xs font-mono mt-1 truncate">{p.id}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LogsSection() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ logs: ActivityLog[] }>("/admin/logs").then((d) => { setLogs(d.logs ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-700" /></div> : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No activity yet</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <span className="text-lg flex-shrink-0 mt-0.5">{ACTION_ICONS[log.action] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{log.details}</p>
                <p className="text-slate-500 text-xs mt-0.5">by <span className="text-violet-400">{log.adminName}</span>{log.targetName ? ` → ${log.targetName}` : ""}</p>
              </div>
              <p className="text-slate-700 text-xs flex-shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoginLogsSection() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api<{ logs: LoginLog[] }>(`/admin/login-logs${filterUser ? `?userId=${encodeURIComponent(filterUser)}` : ""}`);
    setLogs(d.logs ?? []);
    setLoading(false);
  }, [filterUser]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
          <Search size={14} className="text-slate-600" />
          <input value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="Filter by Discord ID…" className="flex-1 bg-transparent text-white text-sm outline-none font-mono" />
        </div>
        <button onClick={() => void load()} className="p-2.5 rounded-lg hover:bg-[#222]" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}><RefreshCw size={14} className="text-slate-500" /></button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-700" /></div> : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No login records yet</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#222" }}>
                  {log.avatar
                    ? <img src={`https://cdn.discordapp.com/avatars/${log.userId}/${log.avatar}.webp?size=32`} alt={log.username} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">{log.username[0]}</div>}
                </div>
                <p className="text-white text-sm font-bold">{log.username}</p>
                <p className="text-slate-600 text-xs ml-auto">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-slate-500 text-xs font-mono">ID: {log.userId}</p>
              <p className="text-slate-600 text-xs mt-0.5">IP: <span className="text-slate-500">{log.ip}</span></p>
              <p className="text-slate-700 text-xs mt-0.5 truncate">{log.userAgent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AntiAltSection() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<AntiAltResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    if (!userId.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const d = await api<AntiAltResult & { error?: string }>(`/admin/anti-alt/${userId.trim()}`);
      if (d.error) { setError(d.error); } else { setResult(d); }
    } catch { setError("Failed to check"); }
    setLoading(false);
  };

  const RISK_COLORS = { low: "#4ade80", medium: "#fbbf24", high: "#f87171" };
  const RISK_BG = { low: "#0a2a15", medium: "#1a1500", high: "#2a0a0a" };

  return (
    <div>
      <div className="mb-4 p-3 rounded-xl flex items-start gap-3" style={{ background: "#1a1200", border: "1px solid #3a2a00" }}>
        <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-600 text-xs">Anti-alt checks shared IPs and account age to detect potential alt accounts. Enter a Discord user ID to analyze.</p>
      </div>
      <div className="flex gap-2 mb-5">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void check()} placeholder="Discord User ID…"
          className="flex-1 px-3 py-2.5 rounded-lg text-white text-sm outline-none font-mono" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }} />
        <button onClick={() => void check()} disabled={!userId || loading}
          className="px-4 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 flex items-center gap-1.5" style={{ background: "#7c3aed" }}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Check
        </button>
      </div>
      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
      {result && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: RISK_BG[result.riskLevel], border: `1px solid ${RISK_COLORS[result.riskLevel]}44` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black" style={{ background: RISK_COLORS[result.riskLevel] + "22", color: RISK_COLORS[result.riskLevel] }}>
              {result.riskLevel === "low" ? "✓" : result.riskLevel === "medium" ? "!" : "⚠"}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: RISK_COLORS[result.riskLevel] }}>{result.username}</p>
              <p className="text-xs capitalize" style={{ color: RISK_COLORS[result.riskLevel] + "cc" }}>{result.riskLevel} risk</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-white font-black text-xl">{result.accountAgeDays}</p>
              <p className="text-slate-600 text-xs">Days Old</p>
              {result.isNewAccount && <p className="text-yellow-500 text-xs mt-0.5">⚠ New</p>}
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-white font-black text-xl">{result.loginCount}</p>
              <p className="text-slate-600 text-xs">Logins</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-white font-black text-xl">{result.uniqueIps.length}</p>
              <p className="text-slate-600 text-xs">Unique IPs</p>
            </div>
          </div>
          {result.sharedIpAccounts.length > 0 && (
            <div className="p-3 rounded-xl" style={{ background: "#2a0a0a", border: "1px solid #5a1a1a" }}>
              <p className="text-red-400 text-xs font-semibold mb-2">⚠ Shared IP Accounts (potential alts)</p>
              {result.sharedIpAccounts.map((u) => (
                <div key={u.userId} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#2a2a2a" }}>
                  <div>
                    <p className="text-white text-sm font-semibold">{u.username}</p>
                    <p className="text-slate-600 text-xs font-mono">{u.userId}</p>
                  </div>
                  <p className="text-slate-500 text-xs font-mono">{u.ip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventsSection() {
  const [rains, setRains] = useState<RainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [duration, setDuration] = useState("5");
  const [minLevel, setMinLevel] = useState("");
  const [minMessages, setMinMessages] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const d = await api<{ rains: RainEvent[] }>("/events/rain");
    setRains(d.rains ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const startRain = async () => {
    if (!totalAmount || !duration) return;
    setSubmitLoading(true); setMsg("");
    try {
      const r = await api<{ ok?: boolean; error?: string }>("/admin/events/rain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: Number(totalAmount),
          durationMinutes: Number(duration),
          minLevel: minLevel ? Number(minLevel) : 0,
          minMessages: minMessages ? Number(minMessages) : 0,
        }),
      });
      if (r.ok) { setMsg("✅ Rain started!"); setCreating(false); setTotalAmount(""); setDuration("5"); setMinLevel(""); setMinMessages(""); await load(); }
      else { setMsg(`❌ ${r.error}`); }
    } catch { setMsg("❌ Failed"); }
    setSubmitLoading(false);
  };

  const endRain = async (id: string) => {
    await api(`/admin/events/rain/${id}/end`, { method: "POST" });
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm flex items-center gap-2"><CloudRain size={14} className="text-blue-400" /> Token Rain Events</p>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90" style={{ background: "#1a5a8a" }}>
          <Plus size={13} /> Start Rain
        </button>
      </div>

      {msg && <p className="text-center text-sm mb-3" style={{ color: msg.startsWith("✅") ? "#4ade80" : "#f87171" }}>{msg}</p>}

      {loading ? <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-700" /></div> : rains.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No rain events yet</div>
      ) : (
        <div className="space-y-2">
          {rains.map((r) => (
            <div key={r.id} className="p-4 rounded-xl" style={{ background: "#1a1a1a", border: r.status === "active" ? "1px solid #1a4a7a" : "1px solid #2a2a2a" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CloudRain size={14} className={r.status === "active" ? "text-blue-400" : "text-slate-600"} />
                  <p className="text-white font-bold text-sm">🪙 {r.totalAmount.toLocaleString()} tokens</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: r.status === "active" ? "#0a2a4a" : "#1a1a1a", color: r.status === "active" ? "#60a5fa" : "#555" }}>
                    {r.status}
                  </span>
                </div>
                {r.status === "active" && (
                  <button onClick={() => void endRain(r.id)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", color: "#f87171" }}>
                    End Rain
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>By {r.adminName}</span>
                <span>{r.joiners.length} joined</span>
                {r.tokensPerUser !== undefined && <span>🪙 {r.tokensPerUser} each</span>}
                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(r.startedAt).toLocaleTimeString()}</span>
              </div>
              {(r.requirements.minLevel ?? 0) > 0 && (
                <p className="text-slate-600 text-xs mt-1">Req: Level {r.requirements.minLevel}+</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setCreating(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
              <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2"><CloudRain size={18} className="text-blue-400" /> Start Token Rain</h3>
              <p className="text-slate-500 text-xs mb-4">Tokens deducted from your admin balance and split equally among all users who join.</p>

              <p className="text-slate-400 text-xs mb-1">Total Token Pool</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
                <span className="text-violet-400">🪙</span>
                <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="e.g. 5000" className="flex-1 bg-transparent text-white text-sm outline-none" />
              </div>

              <p className="text-slate-400 text-xs mb-1">Duration (minutes)</p>
              <div className="flex gap-2 mb-3">
                {["1", "3", "5", "10", "15", "30"].map((d) => (
                  <button key={d} onClick={() => setDuration(d)} className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: duration === d ? "#0a2a4a" : "#222", border: duration === d ? "1px solid #1a5a8a" : "1px solid #333", color: duration === d ? "#60a5fa" : "#555" }}>
                    {d}m
                  </button>
                ))}
              </div>

              <p className="text-slate-400 text-xs mb-2">Requirements (optional)</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div>
                  <p className="text-slate-600 text-xs mb-1">Min Level</p>
                  <input type="number" value={minLevel} onChange={(e) => setMinLevel(e.target.value)} placeholder="0 = any"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#222", border: "1px solid #333" }} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs mb-1">Min Messages</p>
                  <input type="number" value={minMessages} onChange={(e) => setMinMessages(e.target.value)} placeholder="0 = any"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#222", border: "1px solid #333" }} />
                </div>
              </div>

              <button onClick={() => void startRain()} disabled={!totalAmount || !duration || submitLoading}
                className="w-full py-3 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: totalAmount ? "#1a5a8a" : "#1e1e1e" }}>
                {submitLoading ? <Loader2 size={15} className="animate-spin" /> : <CloudRain size={15} />} Start Rain
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function GiveawaysSection() {
  const [giveawayList, setGiveaways] = useState<GiveawayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [prize, setPrize] = useState("");
  const [duration, setDuration] = useState("10");
  const [minLevel, setMinLevel] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [drawLoading, setDrawLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const d = await api<{ giveaways: GiveawayRecord[] }>("/events/giveaways");
    setGiveaways(d.giveaways ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const createGiveaway = async () => {
    if (!prize || !duration) return;
    setSubmitLoading(true); setMsg("");
    try {
      const r = await api<{ ok?: boolean; error?: string }>("/admin/events/giveaway", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prize: Number(prize),
          durationMinutes: Number(duration),
          minLevel: minLevel ? Number(minLevel) : 0,
        }),
      });
      if (r.ok) { setMsg("✅ Giveaway created!"); setCreating(false); setPrize(""); setDuration("10"); setMinLevel(""); await load(); }
      else { setMsg(`❌ ${r.error}`); }
    } catch { setMsg("❌ Failed"); }
    setSubmitLoading(false);
  };

  const drawWinner = async (id: string) => {
    setDrawLoading(id);
    try {
      const r = await api<{ ok?: boolean; winnerName?: string | null; prize?: number }>(`/admin/events/giveaway/${id}/draw`, { method: "POST" });
      if (r.winnerName) setMsg(`🏆 Winner: ${r.winnerName} won 🪙 ${r.prize?.toLocaleString()} tokens!`);
      else setMsg("No entrants — tokens refunded.");
      await load();
    } catch { /* ignore */ }
    setDrawLoading(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm flex items-center gap-2"><Gift size={14} className="text-violet-400" /> Giveaways</p>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90" style={{ background: "#5a1a8a" }}>
          <Plus size={13} /> Create Giveaway
        </button>
      </div>

      {msg && <p className="text-center text-sm mb-3" style={{ color: msg.startsWith("❌") ? "#f87171" : "#4ade80" }}>{msg}</p>}

      {loading ? <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-700" /></div> : giveawayList.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">No giveaways yet</div>
      ) : (
        <div className="space-y-2">
          {giveawayList.map((g) => (
            <div key={g.id} className="p-4 rounded-xl" style={{ background: "#1a1a1a", border: g.status === "active" ? "1px solid #5a1a8a" : "1px solid #2a2a2a" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gift size={14} className={g.status === "active" ? "text-violet-400" : "text-slate-600"} />
                  <p className="text-white font-bold text-sm">🪙 {g.prize.toLocaleString()} tokens</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: g.status === "active" ? "#2a0a4a" : "#1a1a1a", color: g.status === "active" ? "#c4b5fd" : "#555" }}>
                    {g.status}
                  </span>
                </div>
                {g.status === "active" && (
                  <button onClick={() => void drawWinner(g.id)} disabled={drawLoading === g.id}
                    className="text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                    style={{ background: "#2a0a4a", border: "1px solid #5a1a8a", color: "#c4b5fd" }}>
                    {drawLoading === g.id ? <Loader2 size={10} className="animate-spin" /> : "🎰"} Draw Winner
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>By {g.adminName}</span>
                <span>{g.entrants.length} entered</span>
                <span className="flex items-center gap-1"><Clock size={10} /> ends {new Date(g.endsAt).toLocaleTimeString()}</span>
              </div>
              {g.winnerName && (
                <p className="text-yellow-400 text-xs font-bold mt-2">🏆 Winner: {g.winnerName}</p>
              )}
              {(g.requirements.minLevel ?? 0) > 0 && (
                <p className="text-slate-600 text-xs mt-1">Req: Level {g.requirements.minLevel}+</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setCreating(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
              <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2"><Gift size={18} className="text-violet-400" /> Create Giveaway</h3>
              <p className="text-slate-500 text-xs mb-4">Tokens deducted from your balance. A random winner is picked when you draw.</p>

              <p className="text-slate-400 text-xs mb-1">Prize Amount</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "#222", border: "1px solid #333" }}>
                <span className="text-violet-400">🪙</span>
                <input type="number" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="e.g. 10000" className="flex-1 bg-transparent text-white text-sm outline-none" />
              </div>

              <p className="text-slate-400 text-xs mb-1">Duration (minutes)</p>
              <div className="flex gap-2 mb-3">
                {["5", "10", "15", "30", "60"].map((d) => (
                  <button key={d} onClick={() => setDuration(d)} className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: duration === d ? "#2a0a4a" : "#222", border: duration === d ? "1px solid #5a1a8a" : "1px solid #333", color: duration === d ? "#c4b5fd" : "#555" }}>
                    {d}m
                  </button>
                ))}
              </div>

              <p className="text-slate-400 text-xs mb-1">Min Level (optional)</p>
              <input type="number" value={minLevel} onChange={(e) => setMinLevel(e.target.value)} placeholder="0 = any level"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none mb-5" style={{ background: "#222", border: "1px solid #333" }} />

              <button onClick={() => void createGiveaway()} disabled={!prize || !duration || submitLoading}
                className="w-full py-3 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: prize ? "#5a1a8a" : "#1e1e1e" }}>
                {submitLoading ? <Loader2 size={15} className="animate-spin" /> : <Gift size={15} />} Create Giveaway
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function OverviewSection() {
  const [stats, setStats] = useState<{ totalUsers: number; totalBanned: number; totalBalance: number; totalPayments: number; totalVolume: number; totalLogins: number } | null>(null);
  useEffect(() => { api<typeof stats>("/admin/stats").then(setStats).catch(() => {}); }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="text-violet-400" />
        <StatCard label="Banned" value={stats?.totalBanned ?? 0} icon={Ban} color="text-red-400" />
        <StatCard label="Total Balance" value={`🪙 ${(stats?.totalBalance ?? 0).toLocaleString()}`} icon={Coins} color="text-yellow-400" />
        <StatCard label="Total Logins" value={stats?.totalLogins ?? 0} icon={LogIn} color="text-blue-400" />
      </div>
      <div className="p-4 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><BarChart3 size={12} /> Total Volume</p>
        <p className="text-white font-black text-2xl">🪙 {((stats?.totalVolume ?? 0)).toLocaleString()}</p>
        <p className="text-slate-600 text-xs mt-0.5">≈ ${((stats?.totalVolume ?? 0) * 0.05).toFixed(2)} USD</p>
      </div>
      <div className="p-4 rounded-xl" style={{ background: "#0d1f10", border: "1px solid #1a4a2a" }}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={13} className="text-green-500" />
          <p className="text-green-500 text-xs font-bold">All systems operational</p>
        </div>
        <p className="text-slate-600 text-xs">NowPayments · IPN · Tips · Rain · Giveaways · Discord OAuth</p>
      </div>
    </div>
  );
}

const NAV: { key: Section; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "roles", label: "Roles", icon: Star },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "events", label: "Rain", icon: CloudRain },
  { key: "giveaways", label: "Giveaways", icon: Gift },
  { key: "logs", label: "Logs", icon: Activity },
  { key: "login-logs", label: "Login Logs", icon: LogIn },
  { key: "anti-alt", label: "Anti-Alt", icon: Shield },
];

export default function AdminPanel() {
  const { user, isSignedIn, isLoading } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [roles, setRoles] = useState<RoleRecord[]>([]);

  useEffect(() => {
    api<{ roles: RoleRecord[] }>("/admin/roles").then((d) => setRoles(d.roles ?? [])).catch(() => {});
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen" style={{ background: "#111" }}><Loader2 size={24} className="animate-spin text-violet-500" /></div>;

  if (!isSignedIn || !user) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#111" }}>
      <Shield size={40} className="text-slate-700" />
      <p className="text-white font-bold">Sign in to access admin</p>
      <Link href="/sign-in"><button className="px-6 py-3 rounded-lg text-white font-bold" style={{ background: "#5865F2" }}>Sign In with Discord</button></Link>
    </div>
  );

  const isUserAdmin = user.id === "1456385131630563498" || user.isAdmin;

  if (!isUserAdmin) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center" style={{ background: "#111" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#1a0a0a", border: "1px solid #3a1a1a" }}>
        <XCircle size={32} className="text-red-500" />
      </div>
      <p className="text-white font-black text-xl">Access Denied</p>
      <p className="text-slate-500 text-sm">You don't have admin privileges.</p>
      <Link href="/"><button className="px-6 py-2.5 rounded-lg text-white font-bold text-sm" style={{ background: "#222", border: "1px solid #333" }}>← Go Home</button></Link>
    </div>
  );

  const sectionTitle = NAV.find((n) => n.key === section)?.label ?? "Admin";

  return (
    <div className="min-h-screen" style={{ background: "#111" }}>
      <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/profile">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1e1e1e]" style={{ border: "1px solid #222" }}>
            <ChevronRight size={15} className="text-slate-500 rotate-180" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ef444422" }}>
            <Shield size={14} className="text-red-400" />
          </div>
          <h1 className="text-white font-black text-lg">Admin Panel</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <img src={avatarUrl(user)} alt={user.username} className="w-7 h-7 rounded-full" />
          <Crown size={12} className="text-yellow-500" />
        </div>
      </div>

      <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid #1e1e1e" }}>
        {NAV.map((n) => (
          <button key={n.key} onClick={() => setSection(n.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
            style={{ background: section === n.key ? "#2a1f44" : "transparent", color: section === n.key ? "#c4b5fd" : "#555", border: section === n.key ? "1px solid #4a2a7a" : "1px solid transparent" }}>
            <n.icon size={11} />
            {n.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        <h2 className="text-white font-bold mb-4">{sectionTitle}</h2>
        {section === "overview" && <OverviewSection />}
        {section === "users" && <UsersSection roles={roles} />}
        {section === "roles" && <RolesSection />}
        {section === "payments" && <PaymentsSection />}
        {section === "events" && <EventsSection />}
        {section === "giveaways" && <GiveawaysSection />}
        {section === "logs" && <LogsSection />}
        {section === "login-logs" && <LoginLogsSection />}
        {section === "anti-alt" && <AntiAltSection />}
      </div>
    </div>
  );
}
