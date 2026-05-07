import { Router, type Request, type Response, type NextFunction } from "express";
import passport from "passport";
import { loginLogs, users, recordIpLogin } from "../lib/store";

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

function getDynamicCallbackURL(req: Request): string {
  const forwarded = req.headers["x-forwarded-host"] as string | undefined;
  const host = (forwarded?.split(",")[0]?.trim()) ?? req.headers["host"] ?? "localhost";
  return `https://${host}/api/auth/discord/callback`;
}

router.get("/auth/discord", requireDiscordConfigured, (req, res, next) => {
  const callbackURL = getDynamicCallbackURL(req);
  (passport.authenticate("discord", { callbackURL }) as (req: Request, res: Response, next: NextFunction) => void)(req, res, next);
});

router.get(
  "/auth/discord/callback",
  requireDiscordConfigured,
  (req, res, next) => {
    const callbackURL = getDynamicCallbackURL(req);
    (passport.authenticate("discord", {
      failureRedirect: "/sign-in?error=auth_failed",
      callbackURL,
    }) as (req: Request, res: Response, next: NextFunction) => void)(req, res, next);
  },
  (req, res) => {
    if (req.user) {
      const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
      loginLogs.unshift({
        id: `login-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar,
        ip,
        userAgent: req.headers["user-agent"] ?? "unknown",
        createdAt: new Date().toISOString(),
      });
      if (loginLogs.length > 500) loginLogs.splice(500);
      recordIpLogin(ip, req.user.id);

      const userRecord = users.get(req.user.id);
      if (userRecord?.banned) {
        req.logout(() => {});
        res.redirect("/sign-in?error=banned");
        return;
      }
    }
    res.redirect("/");
  },
);

router.get("/auth/me", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
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
