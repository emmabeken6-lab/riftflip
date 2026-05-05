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
- **Web API**: aiohttp server on port 5000 (endpoints: `/api/health`, `/api/guilds`, `/api/guild/{id}/stats`, etc.)
- **Token**: `DISCORD_BOT_TOKEN` secret

### Cogs (18 loaded)
- `automod` — anti-link, anti-nuke, bad words, spam, caps filtering
- `autoresponder` — keyword-triggered auto replies
- `autorole` — auto assign roles on join, exclusive role groups
- `casino` — slots, coinflip vs house, dice, blackjack, roulette, crash; LTC deposit/withdraw
- `channels` — channel management utilities
- `coinflip_pvp` — player-vs-player coinflip with lobbies and 10-min timeouts
- `info` — userinfo, serverinfo, avatar, roleinfo, botinfo, ping, membercount
- `leveling` — XP system, rank, leaderboard, level channels and roles
- `moderation` — ban, kick, warn, warnings, mute, timeout, role management
- `prefix_commands` — classic prefix command support (default prefix: `.`)
- `profile_watch` — username/avatar change monitoring
- `security` — anti-nuke and server security
- `sticky` — sticky messages per channel
- `tempactions` — temporary bans/mutes with auto-expiry
- `utility` — slowmode, nuke, serverlock, announce, poll, embed builder
- `verification` — button verification panel, alt detection, risk assessment
- `voice` — voice channel management
- `website` — `/tip`, `/webstats`, `/active`, `/leaderboard-wallet` (connected to Riftflip site)

### Data Files (`artifacts/discord-bot/data/`)
- `config.json` — per-guild settings (prefix, channels, automod config)
- `balances.json` — LTC balances per guild/user
- `casino_stats.json` — game stats
- `levels.json` — XP and level data
- `warnings.json` — moderation warnings
- `banned_users.json` — ban records
- `verification.json` — verification records
- `autoroles.json`, `autoresponders.json`, `sticky.json`, `jailed.json`, `used_txs.json`, `profile_roles.json`

### LTC Casino
- Deposit address: `LagW6oTkbG1aBLjwnzPVZEPoWWPhW2HRFn`
- Deposits verified against blockchain; `used_txs.json` prevents double-spend

## Frontend Pages (`artifacts/riftflip/src/pages/`)
- `home.tsx` — landing page
- `games.tsx` — compact games panel (Coinflip, Jackpot, Minefield)
- `leaderboard.tsx` — top players
- `chat.tsx` — live chat
- `profile.tsx` — user profile

## Game Pages (`artifacts/riftflip/src/pages/`)
- `coinflip.tsx` — heads/tails vs house
- `jackpot.tsx` — jackpot wheel
- `minefield.tsx` — minesweeper-style

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure details.
