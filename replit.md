# Riftflip — Dark Cosmic-Themed Online Casino

## Overview

pnpm workspace monorepo. Riftflip is a dark cosmic-themed online casino web app with Discord OAuth login, token economy, games, admin panel, and Python Discord bot.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: In-memory Maps (no external DB required)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Wouter + Framer Motion + Tailwind v4

## Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| `artifacts/riftflip` | `/` | Riftflip casino frontend (React + Vite) |
| `artifacts/api-server` | `/api` | Express 5 REST API |
| `artifacts/mockup-sandbox` | `/preview` | Canvas component preview server |
| `artifacts/discord-bot` | — | Python Discord bot (background service) |

## Token Economy

- **Rate**: $1 USD = 30 tokens (1 token ≈ $0.033)
- **Constant**: `USD_PER_TOKEN = 1/30` in wallet.tsx/profile.tsx; `TOKENS_PER_USD = 30` in payments.ts
- **Never use "Robux" or "R$"** — always "tokens" and 🪙 emoji

## Frontend Pages (`artifacts/riftflip/src/pages/`)
- `home.tsx` — landing page
- `games.tsx` — compact games panel (Coinflip, Jackpot, Minefield)
- `chat.tsx` — live chat + rain/giveaway event banners (polls `/api/events/active` every 5s)
- `profile.tsx` — user profile (Discord avatar, balance, stats)
- `wallet.tsx` — deposit/withdraw tokens, links to tips history
- `tips.tsx` — send tips to other users, tip history (`/wallet/tips`)
- `rewards.tsx` — daily login, VIP tiers, referrals
- `sign-in.tsx` — banner image + "Continue with Discord" button
- `admin.tsx` — admin panel (Overview, Users, Roles, Payments, Rain, Giveaways, Logs, Login Logs, Anti-Alt)

## Authentication

- **Provider**: Custom Discord OAuth2 (passport-discord + express-session)
- **Secrets required**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, optional `SESSION_SECRET`
- **Callback URL** (add to Discord app): `https://<your-domain>/api/auth/discord/callback`
- **Routes**: `GET /api/auth/discord` → redirect, `GET /api/auth/discord/callback`, `GET /api/auth/me`, `POST /api/auth/logout`
- **Frontend context**: `useAuth()` from `src/contexts/AuthContext.tsx` — returns `{ user, isSignedIn, isLoading, refetch }`
- **DO NOT use Clerk** — fully removed. Use `useAuth()` everywhere.

## Design System

- **bg**: `#111`, **cards**: `#1a1a1a`, **borders**: `#2a2a2a`/`#222`/`#333`
- **primary CTA**: `#7c3aed` (violet), **Discord brand**: `#5865F2`

## Admin

- **Admin ID**: `1456385131630563498` (set via `ADMIN_IDS` env var)
- **Admin URL**: `/admin`
- **Sections**: Overview, Users, Roles, Payments, Rain Events, Giveaways, Logs, Login Logs, Anti-Alt
- **Manual deposit confirm**: `POST /api/admin/payments/mow/confirm` `{ userId, tokenAmount, txId }`
- **Start rain**: `POST /api/admin/events/rain` `{ totalAmount, durationMinutes, minLevel?, minMessages? }`
- **End rain**: `POST /api/admin/events/rain/:id/end`
- **Create giveaway**: `POST /api/admin/events/giveaway` `{ prize, durationMinutes, minLevel? }`
- **Draw winner**: `POST /api/admin/events/giveaway/:id/draw`

## Payments

- **Rate**: $1 USD = 20 tokens (TOKENS_PER_USD = 20)
- **Deposit**: `POST /api/payments/create` `{ payCurrency, tokenAmount }` via NowPayments. Requires `NOWPAYMENTS_API_KEY`.
- **Withdraw**: `POST /api/payments/withdraw` `{ tokenAmount, withdrawAddress, currency }` via NowPayments payout. Falls back to manual queue.
- **IPN webhook**: `POST /api/payments/ipn` — auto-credits `Math.floor(priceUsd * 20)` tokens on `payment_status === "finished"`.
- Requires `NOWPAYMENTS_IPN_SECRET` for signature verification — without it IPN is rejected.

## Tips

- **Send**: `POST /api/tips/send` `{ toUsername, amount }` — deducts from sender, credits recipient
- **History**: `GET /api/tips/history` — last 50 tips involving authenticated user
- **Frontend**: `/wallet/tips` page with full send form + history

## Rain & Giveaway Events

- **Active events**: `GET /api/events/active` — returns `{ rain, giveaways }` (public, polled by chat every 5s)
- **Join rain**: `POST /api/events/rain/:id/join`
- **Enter giveaway**: `POST /api/events/giveaway/:id/enter`
- Rain tokens deducted from admin balance upfront; distributed equally to joiners when ended
- Giveaway prize deducted upfront; winner gets full amount on draw; refunded if no entrants

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Discord Bot (`artifacts/discord-bot`)

- **Runtime**: Python 3.11, discord.py ≥ 2.3.0
- **Entry point**: `artifacts/discord-bot/bot.py`
- **Bot account**: Riftflip#1301 (ID: 1499613554481954866)
- **Token**: `DISCORD_BOT_TOKEN` secret

## Gotchas

- API server guards Discord strategy registration — boots fine without secrets, but auth routes return 503.
- In production, `cookie.secure = true` and `sameSite = "none"` — required for cross-path cookies through the Replit proxy.
- Discord OAuth callback URL must be registered in Discord Developer Portal exactly as constructed from `REPLIT_DOMAINS`.
- All data is in-memory — restarts clear all users/payments/events. For persistence, wire up a DB.
