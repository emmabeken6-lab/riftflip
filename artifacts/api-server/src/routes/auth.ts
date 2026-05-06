import { Router, type Request, type Response, type NextFunction } from "express";
import passport from "passport";
import { loginLogs } from "../lib/store";

const router = Router();

function requireDiscordConfigured(_req: Request, res: Response, next: NextFunction) {
  const clientId = process.env["DISCORD_CLIENT_ID"];
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    res.status(503).json({ error: "Discord OAuth not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET." });
    return;
  }
  next();
}

router.get("/auth/discord", requireDiscordConfigured, passport.authenticate("discord"));

router.get(
  "/auth/discord/callback",
  requireDiscordConfigured,
  passport.authenticate("discord", { failureRedirect: "/sign-in?error=auth_failed" }),
  (req, res) => {
    if (req.user) {
      loginLogs.unshift({
        id: `login-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar,
        ip: (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown",
        userAgent: req.headers["user-agent"] ?? "unknown",
        createdAt: new Date().toISOString(),
      });
      if (loginLogs.length > 500) loginLogs.splice(500);
    }
    res.redirect("/");
  },
);

router.get("/auth/me", (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

router.post("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

export default router;
