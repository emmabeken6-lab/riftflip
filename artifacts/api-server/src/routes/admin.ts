import { Router, type Request, type Response, type NextFunction } from "express";
import { users, roles, paymentLogs, activityLogs, addActivity, isAdmin, type RoleRecord } from "../lib/store";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!isAdmin(req.user.id)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/admin/stats", requireAdmin, (_req, res) => {
  const allUsers = [...users.values()];
  res.json({
    totalUsers: allUsers.length,
    totalBanned: allUsers.filter((u) => u.banned).length,
    totalBalance: allUsers.reduce((s, u) => s + u.balance, 0),
    totalPayments: paymentLogs.length,
    totalVolume: paymentLogs.filter((p) => p.status === "finished").reduce((s, p) => s + p.priceAmount, 0),
  });
});

router.get("/admin/users", requireAdmin, (req, res) => {
  const { search } = req.query as { search?: string };
  let list = [...users.values()];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((u) => u.username.toLowerCase().includes(q) || u.id.includes(q));
  }
  res.json({ users: list });
});

router.post("/admin/users/:id/ban", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body as { reason?: string };
  const user = users.get(id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  user.banned = true;
  user.banReason = reason ?? "No reason provided";
  addActivity({ action: "ban", adminId: req.user!.id, adminName: req.user!.username, targetId: id, targetName: user.username, details: `Banned: ${user.banReason}` });
  res.json({ ok: true, user });
});

router.post("/admin/users/:id/unban", requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = users.get(id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  user.banned = false;
  user.banReason = undefined;
  addActivity({ action: "unban", adminId: req.user!.id, adminName: req.user!.username, targetId: id, targetName: user.username, details: "Unbanned" });
  res.json({ ok: true, user });
});

router.post("/admin/users/:id/give-tokens", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { amount } = req.body as { amount?: number };
  if (!amount || isNaN(Number(amount))) { res.status(400).json({ error: "Invalid amount" }); return; }
  const user = users.get(id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  user.balance += Number(amount);
  addActivity({ action: "give_tokens", adminId: req.user!.id, adminName: req.user!.username, targetId: id, targetName: user.username, details: `Gave R$ ${amount} tokens (new balance: R$ ${user.balance})` });
  res.json({ ok: true, user });
});

router.post("/admin/users/:id/set-role", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };
  if (!role) { res.status(400).json({ error: "Role required" }); return; }
  const user = users.get(id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const prevRole = user.role;
  user.role = role;
  addActivity({ action: "set_role", adminId: req.user!.id, adminName: req.user!.username, targetId: id, targetName: user.username, details: `Role changed: ${prevRole} → ${role}` });
  res.json({ ok: true, user });
});

router.post("/admin/users/:id/make-admin", requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = users.get(id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  user.isAdmin = true;
  addActivity({ action: "make_admin", adminId: req.user!.id, adminName: req.user!.username, targetId: id, targetName: user.username, details: "Granted admin access" });
  res.json({ ok: true, user });
});

router.get("/admin/roles", requireAdmin, (_req, res) => {
  res.json({ roles: [...roles.values()] });
});

router.post("/admin/roles", requireAdmin, (req, res) => {
  const { name, color, icon, permissions } = req.body as { name?: string; color?: string; icon?: string; permissions?: string[] };
  if (!name || !color || !icon) { res.status(400).json({ error: "name, color, and icon are required" }); return; }
  const id = `role-${Date.now()}`;
  const role: RoleRecord = { id, name, color, icon: icon ?? "🎭", permissions: permissions ?? [], createdAt: new Date().toISOString() };
  roles.set(id, role);
  addActivity({ action: "create_role", adminId: req.user!.id, adminName: req.user!.username, details: `Created role: ${name}` });
  res.json({ ok: true, role });
});

router.delete("/admin/roles/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (["member", "vip", "admin", "owner"].includes(id)) { res.status(400).json({ error: "Cannot delete built-in roles" }); return; }
  roles.delete(id);
  addActivity({ action: "delete_role", adminId: req.user!.id, adminName: req.user!.username, details: `Deleted role: ${id}` });
  res.json({ ok: true });
});

router.get("/admin/payments", requireAdmin, (_req, res) => {
  res.json({ payments: paymentLogs.slice(0, 200) });
});

router.get("/admin/logs", requireAdmin, (_req, res) => {
  res.json({ logs: activityLogs.slice(0, 200) });
});

export default router;
