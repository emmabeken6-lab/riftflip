import { createHmac } from "crypto";

export interface UserRecord {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  balance: number;
  joinedAt: string;
  role: string;
  banned: boolean;
  banReason?: string;
  isAdmin: boolean;
}

export interface RoleRecord {
  id: string;
  name: string;
  color: string;
  icon: string;
  permissions: string[];
  createdAt: string;
}

export interface PaymentLog {
  id: string;
  userId: string;
  username: string;
  priceAmount: number;
  payCurrency: string;
  payAmount: number;
  status: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  adminId: string;
  adminName: string;
  targetId?: string;
  targetName?: string;
  details: string;
  createdAt: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface TipLog {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  createdAt: string;
}

export interface RainEvent {
  id: string;
  adminId: string;
  adminName: string;
  totalAmount: number;
  requirements: { minLevel?: number; minMessages?: number };
  durationMs: number;
  startedAt: string;
  endsAt: string;
  joiners: string[];
  joinerNames: Record<string, string>;
  status: "active" | "ended";
  tokensPerUser?: number;
}

export interface GiveawayRecord {
  id: string;
  adminId: string;
  adminName: string;
  prize: number;
  requirements: { minLevel?: number; minMessages?: number };
  endsAt: string;
  entrants: string[];
  entrantNames: Record<string, string>;
  winnerId?: string;
  winnerName?: string;
  status: "active" | "ended";
  createdAt: string;
}

export const users = new Map<string, UserRecord>();
export const roles = new Map<string, RoleRecord>();
export const paymentLogs: PaymentLog[] = [];
export const activityLogs: ActivityLog[] = [];
export const loginLogs: LoginLog[] = [];
export const tipLogs: TipLog[] = [];
export const rainEvents: RainEvent[] = [];
export const giveaways: GiveawayRecord[] = [];

// Seed default roles
roles.set("member", { id: "member", name: "Member", color: "#6b7280", icon: "👤", permissions: [], createdAt: new Date().toISOString() });
roles.set("vip", { id: "vip", name: "VIP", color: "#f59e0b", icon: "⭐", permissions: ["vip_perks"], createdAt: new Date().toISOString() });
roles.set("vip_plus", { id: "vip_plus", name: "VIP+", color: "#8b5cf6", icon: "💎", permissions: ["vip_perks", "vip_plus_perks"], createdAt: new Date().toISOString() });
roles.set("mvp", { id: "mvp", name: "MVP", color: "#ec4899", icon: "🏆", permissions: ["vip_perks", "vip_plus_perks", "mvp_perks"], createdAt: new Date().toISOString() });
roles.set("admin", { id: "admin", name: "Admin", color: "#ef4444", icon: "🛡️", permissions: ["admin"], createdAt: new Date().toISOString() });
roles.set("owner", { id: "owner", name: "Owner", color: "#f97316", icon: "👑", permissions: ["admin", "owner"], createdAt: new Date().toISOString() });

export function upsertUser(data: Omit<UserRecord, "role" | "banned" | "isAdmin"> & Partial<Pick<UserRecord, "role" | "banned" | "isAdmin">>) {
  const existing = users.get(data.id);
  users.set(data.id, {
    role: existing?.role ?? "member",
    banned: existing?.banned ?? false,
    isAdmin: existing?.isAdmin ?? isAdmin(data.id),
    banReason: existing?.banReason,
    ...existing,
    ...data,
  });
  return users.get(data.id)!;
}

export function addActivity(log: Omit<ActivityLog, "id" | "createdAt">) {
  activityLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...log,
  });
  if (activityLogs.length > 500) activityLogs.splice(500);
}

export function isAdmin(userId: string): boolean {
  const adminIds = (process.env["ADMIN_IDS"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return adminIds.includes(userId);
}

export function verifyIpnSignature(body: string, signature: string): boolean {
  const secret = process.env["NOWPAYMENTS_IPN_SECRET"] ?? "";
  if (!secret) return false;
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const sorted = JSON.stringify(
      Object.fromEntries(Object.keys(parsed).sort().map((k) => [k, parsed[k]]))
    );
    const computed = createHmac("sha512", secret).update(sorted).digest("hex");
    return computed === signature;
  } catch {
    return false;
  }
}

/** Auto-end rain events whose timer has expired and distribute tokens */
export function processExpiredRains() {
  const now = Date.now();
  for (const rain of rainEvents) {
    if (rain.status === "active" && new Date(rain.endsAt).getTime() <= now) {
      endRain(rain.id);
    }
  }
}

export function endRain(rainId: string) {
  const rain = rainEvents.find((r) => r.id === rainId);
  if (!rain || rain.status === "ended") return;
  rain.status = "ended";
  if (rain.joiners.length > 0) {
    const perUser = Math.floor(rain.totalAmount / rain.joiners.length);
    rain.tokensPerUser = perUser;
    for (const uid of rain.joiners) {
      const u = users.get(uid);
      if (u) u.balance += perUser;
    }
    addActivity({
      action: "rain_ended",
      adminId: rain.adminId,
      adminName: rain.adminName,
      details: `Rain ended: ${rain.joiners.length} users each received 🪙 ${perUser} tokens (total: 🪙 ${rain.totalAmount})`,
    });
  } else {
    rain.tokensPerUser = 0;
    addActivity({
      action: "rain_ended",
      adminId: rain.adminId,
      adminName: rain.adminName,
      details: `Rain ended with no participants — 🪙 ${rain.totalAmount} tokens returned`,
    });
  }
}
