import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Star, CreditCard, FileText,
  Ban, Coins, ChevronRight, Search, Plus, Trash2,
  ArrowLeft, BarChart3, CheckCircle, XCircle, Crown,
  RefreshCw, Activity, Loader2,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────── */
interface UserRecord { id: string; username: string; avatar: string | null; balance: number; role: string; banned: boolean; banReason?: string; isAdmin: boolean; joinedAt: string; }
interface RoleRecord { id: string; name: string; color: string; icon: string; permissions: string[]; createdAt: string; }
interface PaymentLog { id: string; userId: string; username: string; priceAmount: number; payCurrency: string; payAmount: number; status: string; createdAt: string; }
interface ActivityLog { id: string; action: string; adminId: string; adminName: string; targetId?: string; targetName?: string; details: string; createdAt: string; }

type Section = "overview" | "users" | "roles" | "payments" | "logs";

/* ─── Helpers ─────────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  finished: { bg: "#0a2a15", text: "#4ade80" },
  waiting: { bg: "#1a1500", text: "#fbbf24" },
  confirming: { bg: "#0d1a2a", text: "#60a5fa" },
  failed: { bg: "#2a0a0a", text: "#f87171" },
  expired: { bg: "#1a1a1a", text: "#6b7280" },
  partially_paid: { bg: "#1a100a", text: "#fb923c" },
};

const ACTION_ICONS: Record<string, string> = {
  ban: "🚫", unban: "✅", give_tokens: "💰", set_role: "🎭",
  make_admin: "🛡️", create_role: "➕", delete_role: "🗑️",
  deposit_confirmed: "💳",
};

function avatarSrc(user: UserRecord): string {
  if (!user.avatar) return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.username}`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;
}

function api<T>(path: string, opts?: RequestInit): Promise<T> {
  return fetch(`/api${path}`, { credentials: "include", ...opts }).then((r) => r.json() as Promise<T>);
}

/* ─── Stat card ───────────────────────────────────────────────── */
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

/* ─── Users section ───────────────────────────────────────────── */
function UsersSection({ roles }: { roles: RoleRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
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
                  <p className="text-white text-sm font-bold">R$ {u.balance.toLocaleString()}</p>
                </div>
                <ChevronRight size={14} className="text-slate-700" />
              </button>
            );
          })}
        </div>
      )}

      {/* User action panel */}
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
                  <p className="text-violet-300 font-bold">R$ {selected.balance.toLocaleString()}</p>
                  <p className="text-slate-600 text-xs">{selected.banned ? "🚫 Banned" : "✅ Active"}</p>
                </div>
              </div>

              {/* Give Tokens */}
              <p className="text-slate-400 text-xs mb-1">Give Tokens</p>
              <div className="flex gap-2 mb-4">
                <input type="number" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} placeholder="R$ amount"
                  className="flex-1 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#222", border: "1px solid #333" }} />
                <button onClick={() => doAction("give-tokens", { amount: Number(tokenAmount) })} disabled={!tokenAmount || actionLoading}
                  className="px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 flex items-center gap-1.5" style={{ background: "#7c3aed" }}>
                  <Coins size={13} /> Give
                </button>
              </div>

              {/* Set Role */}
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

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {selected.banned ? (
                  <button onClick={() => doAction("unban")} disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold"
                    style={{ background: "#0a2a15", border: "1px solid #1a5a2a", color: "#4ade80" }}>
                    <CheckCircle size={13} /> Unban
                  </button>
                ) : (
                  <button onClick={() => { if (banReason || confirm("Ban without reason?")) doAction("ban", { reason: banReason || "Banned by admin" }); }} disabled={actionLoading}
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

/* ─── Roles section ───────────────────────────────────────────── */
function RolesSection() {
  const [roleList, setRoles] = useState<RoleRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7c3aed");
  const [icon, setIcon] = useState("🎭");
  const [loading, setLoading] = useState(true);

  const EMOJI_PICKS = ["👤", "⭐", "💎", "🏆", "🛡️", "👑", "🎭", "🔥", "⚡", "🌙", "🎯", "🦋", "🐉", "🌟", "💫", "🚀"];

  const load = async () => { setLoading(true); const d = await api<{ roles: RoleRecord[] }>("/admin/roles"); setRoles(d.roles ?? []); setLoading(false); };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!name || !color || !icon) return;
    await api("/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color, icon }) });
    setShowCreate(false); setName(""); setIcon("🎭");
    await load();
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    await api(`/admin/roles/${id}`, { method: "DELETE" });
    await load();
  };

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
                <p className="text-slate-600 text-xs">{r.permissions.length > 0 ? r.permissions.join(", ") : "No special permissions"}</p>
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pt-5 pb-10"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
              <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
              <h3 className="text-white font-black text-lg mb-4">Create Role</h3>
              <p className="text-slate-400 text-xs mb-1">Name</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none mb-4" style={{ background: "#222", border: "1px solid #333" }} />
              <p className="text-slate-400 text-xs mb-2">Icon</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EMOJI_PICKS.map((e) => <button key={e} onClick={() => setIcon(e)} className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all" style={{ background: icon === e ? "#2a1f44" : "#222", border: icon === e ? "1px solid #7c3aed" : "1px solid #2a2a2a" }}>{e}</button>)}
              </div>
              <p className="text-slate-400 text-xs mb-2">Color</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#7c3aed", "#6b7280"].map((c) => (
                  <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full transition-all" style={{ background: c, border: color === c ? "2px solid #fff" : "2px solid transparent" }} />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0" style={{ background: "transparent" }} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: color + "22", border: `1px solid ${color}55` }}>
                <span className="text-2xl">{icon}</span>
                <span className="font-bold" style={{ color }}>{name || "Preview"}</span>
              </div>
              <button onClick={() => void create()} disabled={!name} className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90" style={{ background: name ? "#7c3aed" : "#1e1e1e", color: name ? "#fff" : "#444" }}>Create Role</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Payments section ────────────────────────────────────────── */
function PaymentsSection() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ payments: PaymentLog[] }>("/admin/payments").then((d) => { setPayments(d.payments ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
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
                  <p className="text-slate-400 text-xs">${p.priceAmount} USD → {p.payAmount} {p.payCurrency.toUpperCase()}</p>
                  <p className="text-slate-600 text-xs ml-auto">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-slate-700 text-xs font-mono mt-1">{p.id}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Logs section ────────────────────────────────────────────── */
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

/* ─── Overview section ────────────────────────────────────────── */
function OverviewSection() {
  const [stats, setStats] = useState<{ totalUsers: number; totalBanned: number; totalBalance: number; totalPayments: number; totalVolume: number } | null>(null);
  useEffect(() => { api<typeof stats>("/admin/stats").then(setStats).catch(() => {}); }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="text-violet-400" />
        <StatCard label="Banned" value={stats?.totalBanned ?? 0} icon={Ban} color="text-red-400" />
        <StatCard label="Total Balance" value={`R$ ${(stats?.totalBalance ?? 0).toLocaleString()}`} icon={Coins} color="text-yellow-400" />
        <StatCard label="Payments" value={stats?.totalPayments ?? 0} icon={CreditCard} color="text-blue-400" />
      </div>
      <div className="p-4 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><BarChart3 size={12} /> Total Volume</p>
        <p className="text-white font-black text-2xl">${((stats?.totalVolume ?? 0)).toFixed(2)} USD</p>
      </div>
      <div className="p-4 rounded-xl" style={{ background: "#0d1f10", border: "1px solid #1a4a2a" }}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={13} className="text-green-500" />
          <p className="text-green-500 text-xs font-bold">All systems operational</p>
        </div>
        <p className="text-slate-600 text-xs">NowPayments · IPN webhook · Provably Fair · Discord OAuth</p>
      </div>
    </div>
  );
}

/* ─── Nav items ───────────────────────────────────────────────── */
const NAV: { key: Section; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "roles", label: "Roles", icon: Star },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "logs", label: "Logs", icon: Activity },
];

/* ─── Main admin page ─────────────────────────────────────────── */
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
      <Link href="/sign-in"><button className="px-6 py-2.5 rounded-lg text-white font-bold" style={{ background: "#7c3aed" }}>Sign In</button></Link>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#111" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #222" }}>
        <div className="flex items-center gap-3">
          <Link href="/"><button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#222]" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}><ArrowLeft size={16} className="text-slate-400" /></button></Link>
          <div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-red-400" />
              <h1 className="text-white font-black text-lg">Admin Panel</h1>
            </div>
            <p className="text-slate-600 text-xs">Riftflip Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img src={avatarUrl(user)} alt={user.username} className="w-8 h-8 rounded-full" style={{ border: "2px solid #7c3aed" }} />
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-bold">{user.username}</p>
            <p className="text-red-400 text-xs flex items-center gap-0.5 justify-end"><Crown size={9} /> Owner</p>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 px-4 pt-4 overflow-x-auto pb-1">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
            style={{ background: section === key ? "#1e1e1e" : "#161616", border: section === key ? "1px solid #444" : "1px solid #2a2a2a", color: section === key ? "#c4b5fd" : "#555" }}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {section === "overview" && <OverviewSection />}
            {section === "users" && <UsersSection roles={roles} />}
            {section === "roles" && <RolesSection />}
            {section === "payments" && <PaymentsSection />}
            {section === "logs" && <LogsSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
