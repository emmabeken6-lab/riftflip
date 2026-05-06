# Riftflip — Roblox-Themed Online Casino

## Overview

pnpm workspace monorepo. Riftflip is a dark cosmic-themed online casino web app with a connected Python Discord bot.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Wouter + Framer Motion + Tailwind v4

## Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| `artifacts/riftflip` | `/` | Riftflip casino frontend (React + Vite) |
| `artifacts/api-server` | `/api` | Express 5 REST API |
| `artifacts/mockup-sandbox` | `/preview` | Canvas component preview server |
| `artifacts/discord-bot` | — | Python Discord bot (background service) |

## Discord Bot (`artifacts/discord-bot`)

- **Runtime**: Python 3.11
- **Framework**: discord.py ≥ 2.3.0
- **Entry point**: `artifacts/discord-bot/bot.py`
- **Workflow command**: `cd artifacts/discord-bot && python3 bot.py`
- **Bot account**: Riftflip#1301 (ID: 1499613554481954866)
- **Guild**: 1478390666261299220
- **Web API**: aiohttp server on port 5001
- **Token**: `DISCORD_BOT_TOKEN` secret

### Cogs (18 loaded)
See previous notes — automod, autoresponder, autorole, casino, channels, coinflip_pvp, info, leveling, moderation, prefix_commands, profile_watch, security, sticky, tempactions, utility, verification, voice, website.

### Data Files (`artifacts/discord-bot/data/`)
config.json, balances.json, casino_stats.json, levels.json, warnings.json, banned_users.json, verification.json, autoroles.json, autoresponders.json, sticky.json, jailed.json, used_txs.json, profile_roles.json

## Frontend Pages (`artifacts/riftflip/src/pages/`)
- `home.tsx` — landing page
- `games.tsx` — compact games panel (Coinflip, Jackpot, Minefield)
- `chat.tsx` — live chat
- `profile.tsx` — user profile (Discord avatar, balance, stats)
- `wallet.tsx` — deposit/withdraw Robux
- `rewards.tsx` — daily login, VIP tiers, referrals
- `sign-in.tsx` — banner image + "Continue with Discord" button

## Game Pages
- `coinflip.tsx`, `jackpot.tsx`, `minefield.tsx`

## Authentication

- **Provider**: Custom Discord OAuth2 (passport-discord + express-session)
- **Secrets required**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, optional `SESSION_SECRET`
- **Callback URL** (add to Discord app): `https://<your-domain>/api/auth/discord/callback`
- **Routes**: `GET /api/auth/discord` → redirect, `GET /api/auth/discord/callback`, `GET /api/auth/me`, `POST /api/auth/logout`
- **Session storage**: In-memory (memorystore), 7-day cookie
- **Frontend context**: `useAuth()` from `src/contexts/AuthContext.tsx` — returns `{ user, isSignedIn, isLoading, refetch }`
- **DiscordUser shape**: `{ id, username, discriminator, avatar, email, balance, joinedAt }`
- **Avatar helper**: `avatarUrl(user)` from AuthContext
- **Sign-in page**: `/sign-in` — shows banner image + single "Continue with Discord" button
- **Cookie**: httpOnly, secure in prod, sameSite=none in prod / lax in dev
- **DO NOT use Clerk** — fully removed. Use `useAuth()` everywhere.

## Design System

- **bg**: `#111`, **cards**: `#1a1a1a`, **borders**: `#2a2a2a`/`#222`/`#333`
- **inputs**: bg `#222` + border `#333`
- **primary CTA**: `#7c3aed` (violet)
- **nav**: `#151515` bg + `#222` border
- **Discord brand**: `#5865F2`

## Admin

- **Admin ID**: `1456385131630563498` (set via `ADMIN_IDS` env var)
- **Admin URL**: `/admin`
- **Sections**: Overview, Users, Roles, Payments, Activity Logs, Login Logs, Anti-Alt
- **MowPayments confirm**: `POST /api/admin/payments/mow/confirm` `{ userId, robuxAmount, txId }`
- **Anti-alt check**: `GET /api/admin/anti-alt/:userId`
- **Login logs**: `GET /api/admin/login-logs`

## Payments

- **Deposit**: `POST /api/payments/create` via NowPayments — BTC, ETH, LTC, USDT, SOL, BNB. Requires `NOWPAYMENTS_API_KEY` secret.
- **Withdraw**: `POST /api/payments/withdraw` via NowPayments payout API. Falls back to manual queue if API key absent; balance is deducted immediately.
- **IPN webhook**: `POST /api/payments/ipn` — auto-credits user balance on confirmed crypto payments.
- **Admin MowPayments confirm** (legacy): `POST /api/admin/payments/mow/confirm` — still exists for manual Robux top-ups.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Gotchas

- API server guards Discord strategy registration — server boots fine without the secrets, but auth routes return 503 until secrets are set.
- In production, `cookie.secure = true` and `sameSite = "none"` — required for cross-path cookies through the Replit proxy.
- Discord OAuth callback URL must be registered in the Discord Developer Portal exactly as constructed from `REPLIT_DOMAINS`.
