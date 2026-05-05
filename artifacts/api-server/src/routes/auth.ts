import { Router } from "express";
import passport from "passport";

const router = Router();

const BASE_PATH = process.env.BASE_PATH ?? "";

router.get(
  "/auth/discord",
  passport.authenticate("discord"),
);

router.get(
  "/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: `${BASE_PATH}/sign-in?error=auth_failed`,
  }),
  (_req, res) => {
    res.redirect(`${BASE_PATH}/`);
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
