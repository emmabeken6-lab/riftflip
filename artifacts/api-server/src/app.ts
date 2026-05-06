import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import MemoryStore from "memorystore";
import router from "./routes";
import { logger } from "./lib/logger";
import { upsertUser, isAdmin } from "./lib/store";
import "./types/passport.d.ts";

const MemoryStoreSession = MemoryStore(session);

const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"] ?? "";
const DISCORD_CLIENT_SECRET = process.env["DISCORD_CLIENT_SECRET"] ?? "";
const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "riftflip-session-secret-change-me";

const domains = (process.env["REPLIT_DOMAINS"] ?? "").split(",");
const primaryDomain = domains[0]?.trim();
const port = process.env["PORT"] ?? "3001";

const callbackURL = primaryDomain
  ? `https://${primaryDomain}/api/auth/discord/callback`
  : `http://localhost:${port}/api/auth/discord/callback`;

type DiscordUser = Express.User;

if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
  passport.use(
    new DiscordStrategy(
      {
        clientID: DISCORD_CLIENT_ID,
        clientSecret: DISCORD_CLIENT_SECRET,
        callbackURL,
        scope: ["identify", "email"],
      },
      (_accessToken, _refreshToken, profile, done) => {
        const record = upsertUser({
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator ?? "0",
          avatar: profile.avatar ?? null,
          email: profile.email ?? null,
          balance: 0,
          joinedAt: new Date().toISOString(),
          isAdmin: isAdmin(profile.id),
        });
        const user: DiscordUser = {
          id: record.id,
          username: record.username,
          discriminator: record.discriminator,
          avatar: record.avatar,
          email: record.email,
          balance: record.balance,
          joinedAt: record.joinedAt,
        };
        return done(null, user);
      },
    ),
  );
  logger.info({ callbackURL }, "Discord OAuth strategy registered");
} else {
  logger.warn("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not set — Discord OAuth disabled");
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: DiscordUser, done) => {
  done(null, user);
});

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new MemoryStoreSession({ checkPeriod: 86400000 }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

export default app;
