import discord
from discord import app_commands
from discord.ext import commands
import os
import json
import asyncio
from aiohttp import web


intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.guilds = True

CONFIG_PATH = "data/config.json"
DEFAULT_PREFIX = "?"


def load_config():
    try:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def get_prefix(bot, message: discord.Message):
    if not message.guild:
        return DEFAULT_PREFIX
    config = load_config()
    return config.get(str(message.guild.id), {}).get("prefix", DEFAULT_PREFIX)


class Bot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix=get_prefix, intents=intents, help_command=None)
        self.web_app = web.Application()
        self._setup_routes()

    def _setup_routes(self):
        self.web_app.router.add_get("/api/health", self._health)
        self.web_app.router.add_get("/api/guilds", self._guilds)
        self.web_app.router.add_get("/api/guild/{guild_id}/stats", self._guild_stats)
        self.web_app.router.add_get("/api/guild/{guild_id}/warnings/{user_id}", self._user_warnings)
        self.web_app.router.add_get("/api/guild/{guild_id}/warnings", self._guild_warnings)
        self.web_app.router.add_get("/api/guild/{guild_id}/config", self._guild_config)

    def _require_auth(self, request: web.Request) -> bool:
        api_key = os.environ.get("BOT_API_KEY", "")
        if not api_key:
            return True
        return request.headers.get("Authorization") == f"Bearer {api_key}"

    def _cors_headers(self):
        allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
        return {
            "Access-Control-Allow-Origin": allowed_origins,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
        }

    async def _health(self, request: web.Request):
        data = {
            "status": "online",
            "bot": str(self.user) if self.user else None,
            "guilds": len(self.guilds),
            "latency_ms": round(self.latency * 1000, 2),
        }
        return web.json_response(data, headers=self._cors_headers())

    async def _guilds(self, request: web.Request):
        if not self._require_auth(request):
            return web.json_response({"error": "Unauthorized"}, status=401)
        guilds = [
            {"id": str(g.id), "name": g.name, "member_count": g.member_count,
             "icon": str(g.icon.url) if g.icon else None}
            for g in self.guilds
        ]
        return web.json_response({"guilds": guilds}, headers=self._cors_headers())

    async def _guild_stats(self, request: web.Request):
        if not self._require_auth(request):
            return web.json_response({"error": "Unauthorized"}, status=401)
        guild_id = int(request.match_info["guild_id"])
        guild = self.get_guild(guild_id)
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404)
        bots = sum(1 for m in guild.members if m.bot)
        data = {
            "id": str(guild.id),
            "name": guild.name,
            "icon": str(guild.icon.url) if guild.icon else None,
            "member_count": guild.member_count,
            "human_count": guild.member_count - bots,
            "bot_count": bots,
            "text_channels": len(guild.text_channels),
            "voice_channels": len(guild.voice_channels),
            "roles": len(guild.roles),
            "owner": str(guild.owner) if guild.owner else None,
            "boost_level": guild.premium_tier,
            "boosts": guild.premium_subscription_count,
        }
        return web.json_response(data, headers=self._cors_headers())

    async def _user_warnings(self, request: web.Request):
        if not self._require_auth(request):
            return web.json_response({"error": "Unauthorized"}, status=401)
        guild_id = request.match_info["guild_id"]
        user_id = request.match_info["user_id"]
        warnings_data = {}
        try:
            with open("data/warnings.json", "r") as f:
                warnings_data = json.load(f)
        except Exception:
            pass
        user_warnings = warnings_data.get(guild_id, {}).get(user_id, [])
        return web.json_response({
            "guild_id": guild_id,
            "user_id": user_id,
            "warnings": user_warnings,
            "count": len(user_warnings)
        }, headers=self._cors_headers())

    async def _guild_warnings(self, request: web.Request):
        if not self._require_auth(request):
            return web.json_response({"error": "Unauthorized"}, status=401)
        guild_id = request.match_info["guild_id"]
        warnings_data = {}
        try:
            with open("data/warnings.json", "r") as f:
                warnings_data = json.load(f)
        except Exception:
            pass
        guild_warnings = warnings_data.get(guild_id, {})
        return web.json_response({
            "guild_id": guild_id,
            "users": guild_warnings
        }, headers=self._cors_headers())

    async def _guild_config(self, request: web.Request):
        if not self._require_auth(request):
            return web.json_response({"error": "Unauthorized"}, status=401)
        guild_id = request.match_info["guild_id"]
        config = load_config().get(guild_id, {})
        safe_config = {k: v for k, v in config.items() if k != "bad_words"}
        safe_config["prefix"] = config.get("prefix", DEFAULT_PREFIX)
        return web.json_response(safe_config, headers=self._cors_headers())

    async def start_web_server(self):
        port = int(os.environ.get("BOT_API_PORT", 5001))
        runner = web.AppRunner(self.web_app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", port)
        await site.start()
        print(f"Web API running on port {port}")

    async def setup_hook(self):
        for filename in os.listdir("./cogs"):
            if filename.endswith(".py") and not filename.startswith("_"):
                await self.load_extension(f"cogs.{filename[:-3]}")
                print(f"Loaded cog: {filename[:-3]}")
        await self.tree.sync()
        print("Slash commands synced.")
        asyncio.create_task(self.start_web_server())

    async def on_ready(self):
        print(f"Logged in as {self.user} (ID: {self.user.id})")
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="over the server"
            )
        )


def ensure_data_files():
    os.makedirs("data", exist_ok=True)
    files = {
        "data/warnings.json": {},
        "data/config.json": {},
        "data/jailed.json": {},
        "data/levels.json": {},
        "data/autoroles.json": {},
        "data/autoresponders.json": {},
        "data/profile_roles.json": {},
        "data/verification.json": {},
        "data/banned_users.json": {},
        "data/balances.json": {},
        "data/used_txs.json": {},
        "data/casino_stats.json": {},
        "data/sticky.json": {},
    }
    for path, default in files.items():
        if not os.path.exists(path):
            with open(path, "w") as f:
                json.dump(default, f)


if __name__ == "__main__":
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("DISCORD_BOT_TOKEN environment variable not set.")
    ensure_data_files()
    bot = Bot()
    asyncio.run(bot.start(token))
