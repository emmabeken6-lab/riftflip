import discord
from discord import app_commands
from discord.ext import commands
import json
import asyncio
import datetime
import random
import time
import aiohttp

BALANCES_PATH = "data/balances.json"
CONFIG_PATH = "data/config.json"

active_games: dict[str, dict] = {}

# ── LTC price cache ───────────────────────────────────────────────────────────
_price_cache = {"price": 0.0, "ts": 0.0}


async def fetch_ltc_price() -> float:
    now = time.time()
    if now - _price_cache["ts"] < 60 and _price_cache["price"] > 0:
        return _price_cache["price"]
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as r:
                data = await r.json(content_type=None)
                p = float(data["litecoin"]["usd"])
                _price_cache["price"] = p
                _price_cache["ts"] = now
                return p
    except Exception:
        return _price_cache.get("price", 0.0)


def fmt(ltc: float, price: float) -> str:
    s = f"{ltc:.8f} LTC"
    if price > 0:
        s += f" (${ltc * price:,.2f})"
    return s


# ── JSON helpers ──────────────────────────────────────────────────────────────

def load_json(path: str) -> dict:
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_json(path: str, data: dict):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def get_balance(guild_id: int, user_id: int) -> float:
    data = load_json(BALANCES_PATH)
    return data.get(str(guild_id), {}).get(str(user_id), 0.0)


def add_balance(guild_id: int, user_id: int, amount: float):
    data = load_json(BALANCES_PATH)
    gid, uid = str(guild_id), str(user_id)
    if gid not in data:
        data[gid] = {}
    data[gid][uid] = round(data[gid].get(uid, 0.0) + amount, 8)
    save_json(BALANCES_PATH, data)


def get_cf_channel(guild_id: int) -> int | None:
    cfg = load_json(CONFIG_PATH)
    val = cfg.get(str(guild_id), {}).get("coinflip_channel")
    return int(val) if val else None


def set_cf_channel(guild_id: int, channel_id: int):
    cfg = load_json(CONFIG_PATH)
    gid = str(guild_id)
    if gid not in cfg:
        cfg[gid] = {}
    cfg[gid]["coinflip_channel"] = str(channel_id)
    save_json(CONFIG_PATH, cfg)


# ── Embeds ────────────────────────────────────────────────────────────────────

def make_lobby_embed(creator: discord.Member, bet: float, side: str, price: float) -> discord.Embed:
    embed = discord.Embed(
        title="🪙 New Coinflip Challenge!",
        color=discord.Color.gold(),
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.set_thumbnail(url=creator.display_avatar.url)
    embed.add_field(name="🎮 Created By", value=creator.mention, inline=True)
    embed.add_field(name="💰 Bet", value=fmt(bet, price), inline=True)
    embed.add_field(name="🪙 Creator's Side", value="🟡 **Heads**" if side == "heads" else "⚫ **Tails**", inline=True)
    joiner_side = "⚫ Tails" if side == "heads" else "🟡 Heads"
    embed.add_field(
        name="🎯 Your Side (if you join)",
        value=joiner_side,
        inline=True
    )
    embed.add_field(
        name="📋 How to Enter",
        value=f"Click **Join Game** below to match the bet of **{fmt(bet, price)}**.",
        inline=False
    )
    embed.set_footer(text="⏰ Game expires in 10 minutes if nobody joins.")
    return embed


# ── View ──────────────────────────────────────────────────────────────────────

class JoinView(discord.ui.View):
    def __init__(self, game_id: str, cog: "CoinflipPvP"):
        super().__init__(timeout=600)
        self.game_id = game_id
        self.cog = cog
        self.message: discord.Message | None = None

    async def on_timeout(self):
        game = active_games.pop(self.game_id, None)
        if not game:
            return
        add_balance(game["guild_id"], game["creator_id"], game["bet"])
        try:
            if self.message:
                embed = discord.Embed(
                    title="⏰ Coinflip Expired",
                    description="No one joined in time. The creator's bet has been refunded.",
                    color=discord.Color.greyple()
                )
                await self.message.edit(embed=embed, view=None)
        except Exception:
            pass

    @discord.ui.button(label="Join Game", style=discord.ButtonStyle.green, emoji="🪙")
    async def join_game(self, interaction: discord.Interaction, button: discord.ui.Button):
        game = active_games.get(self.game_id)
        if not game:
            await interaction.response.send_message("This game no longer exists.", ephemeral=True)
            return

        if interaction.user.id == game["creator_id"]:
            await interaction.response.send_message("You can't join your own game!", ephemeral=True)
            return

        if game.get("locked"):
            await interaction.response.send_message("Someone already joined this game!", ephemeral=True)
            return

        bet = game["bet"]
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if bal < bet:
            price = game.get("price", 0.0)
            await interaction.response.send_message(
                f"You need **{fmt(bet, price)}** to join. Your balance: **{fmt(bal, price)}**",
                ephemeral=True
            )
            return

        game["locked"] = True
        active_games[self.game_id] = game

        add_balance(interaction.guild.id, interaction.user.id, -bet)

        button.disabled = True
        button.label = "Game in progress..."

        await interaction.response.defer()

        price = game.get("price", 0.0)
        creator_side = game["side"]
        joiner_side = "tails" if creator_side == "heads" else "heads"
        creator = interaction.guild.get_member(game["creator_id"])

        # ── Animation ─────────────────────────────────────────────────────────
        frames = [
            "🌀 Flipping the coin...",
            "🪙 Spinning through the air...",
            "✨ Almost there...",
            "💨 Landing...",
        ]

        for frame in frames:
            anim = discord.Embed(
                title="🪙 Coinflip in Progress!",
                color=discord.Color.blurple(),
                timestamp=datetime.datetime.now(datetime.timezone.utc)
            )
            anim.add_field(
                name="🎮 Creator",
                value=f"{creator.mention if creator else 'Unknown'}\n{'🟡 Heads' if creator_side == 'heads' else '⚫ Tails'}",
                inline=True
            )
            anim.add_field(
                name="🎮 Challenger",
                value=f"{interaction.user.mention}\n{'🟡 Heads' if joiner_side == 'heads' else '⚫ Tails'}",
                inline=True
            )
            anim.add_field(name="💰 Total Pot", value=fmt(bet * 2, price), inline=False)
            anim.add_field(name="Status", value=frame, inline=False)
            try:
                if self.message:
                    await self.message.edit(embed=anim, view=self)
            except Exception:
                pass
            await asyncio.sleep(0.8)

        # ── Result ────────────────────────────────────────────────────────────
        result = random.choice(["heads", "tails"])
        result_emoji = "🟡 Heads" if result == "heads" else "⚫ Tails"

        if result == creator_side:
            winner = creator
            loser = interaction.user
        else:
            winner = interaction.user
            loser = creator if creator else None

        winnings = round(bet * 2, 8)
        profit = round(bet, 8)

        if winner:
            add_balance(interaction.guild.id, winner.id, winnings)

        winner_bal = get_balance(interaction.guild.id, winner.id) if winner else 0.0
        loser_bal = get_balance(interaction.guild.id, loser.id) if loser else 0.0

        result_embed = discord.Embed(
            title=f"🪙 Coin Landed — {result_emoji}!",
            color=discord.Color.green(),
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        result_embed.add_field(
            name="🏆 Winner",
            value=f"{winner.mention if winner else 'Unknown'}\n+**{fmt(profit, price)}**",
            inline=True
        )
        result_embed.add_field(
            name="😞 Loser",
            value=f"{loser.mention if loser else 'Unknown'}\n-**{fmt(bet, price)}**",
            inline=True
        )
        result_embed.add_field(name="🪙 Result", value=result_emoji, inline=False)
        result_embed.add_field(
            name="💳 Updated Balances",
            value=(
                f"{winner.mention if winner else 'Winner'}: **{fmt(winner_bal, price)}**\n"
                f"{loser.mention if loser else 'Loser'}: **{fmt(loser_bal, price)}**"
            ),
            inline=False
        )
        result_embed.set_footer(text=f"Total pot: {fmt(winnings, price)}")

        try:
            if self.message:
                await self.message.edit(embed=result_embed, view=None)
        except Exception:
            pass

        active_games.pop(self.game_id, None)
        self.stop()


# ── Cog ───────────────────────────────────────────────────────────────────────

class CoinflipPvP(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._game_counter = 0

    def new_game_id(self) -> str:
        self._game_counter += 1
        return f"cf_{self._game_counter}_{random.randint(1000, 9999)}"

    cf_group = app_commands.Group(name="cf", description="Player vs Player coinflip games")

    @cf_group.command(name="setup", description="Set the channel where coinflip games are posted")
    @app_commands.describe(channel="Channel for coinflip game lobbies and results")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def cf_setup(self, interaction: discord.Interaction, channel: discord.TextChannel):
        set_cf_channel(interaction.guild.id, channel.id)
        await interaction.response.send_message(
            f"✅ Coinflip PvP games will be posted in {channel.mention}.", ephemeral=True
        )

    @cf_group.command(name="create", description="Create a PvP coinflip — another user bets against you")
    @app_commands.describe(
        amount="Amount in LTC to bet",
        side="Which side you pick",
    )
    @app_commands.choices(side=[
        app_commands.Choice(name="🟡 Heads", value="heads"),
        app_commands.Choice(name="⚫ Tails", value="tails"),
    ])
    async def cf_create(self, interaction: discord.Interaction, amount: float, side: str):
        if amount <= 0:
            await interaction.response.send_message("Bet must be greater than 0.", ephemeral=True)
            return

        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if bal < amount:
            await interaction.response.send_message(
                f"Insufficient balance. You have **{fmt(bal, price)}**.", ephemeral=True
            )
            return

        cf_channel_id = get_cf_channel(interaction.guild.id)
        if not cf_channel_id:
            await interaction.response.send_message(
                "No coinflip channel set. Ask an admin to run `/cf setup #channel`.", ephemeral=True
            )
            return

        cf_channel = interaction.guild.get_channel(cf_channel_id)
        if not cf_channel:
            await interaction.response.send_message(
                "The configured coinflip channel no longer exists. Ask an admin to re-run `/cf setup`.",
                ephemeral=True
            )
            return

        add_balance(interaction.guild.id, interaction.user.id, -amount)

        game_id = self.new_game_id()
        view = JoinView(game_id, self)
        embed = make_lobby_embed(interaction.user, amount, side, price)

        msg = await cf_channel.send(
            content=f"🎰 {interaction.user.mention} created a new coinflip game! Anyone can join below.",
            embed=embed,
            view=view
        )
        view.message = msg

        active_games[game_id] = {
            "creator_id": interaction.user.id,
            "guild_id": interaction.guild.id,
            "bet": amount,
            "side": side,
            "price": price,
            "message": msg,
            "locked": False,
        }

        if interaction.channel.id == cf_channel_id:
            await interaction.response.send_message("✅ Game posted above!", ephemeral=True)
        else:
            await interaction.response.send_message(
                f"✅ Your coinflip game has been posted in {cf_channel.mention}!", ephemeral=True
            )

    @cf_group.command(name="cancel", description="Cancel your pending coinflip game and get your bet back")
    async def cf_cancel(self, interaction: discord.Interaction):
        for game_id, game in list(active_games.items()):
            if game["creator_id"] == interaction.user.id and game["guild_id"] == interaction.guild.id:
                if game.get("locked"):
                    await interaction.response.send_message(
                        "Your game is already in progress — can't cancel.", ephemeral=True
                    )
                    return
                add_balance(interaction.guild.id, interaction.user.id, game["bet"])
                active_games.pop(game_id, None)
                try:
                    msg = game.get("message")
                    if msg:
                        price = game.get("price", 0.0)
                        cancel_embed = discord.Embed(
                            title="❌ Coinflip Cancelled",
                            description=(
                                f"{interaction.user.mention} cancelled this game.\n"
                                f"Bet of **{fmt(game['bet'], price)}** has been refunded."
                            ),
                            color=discord.Color.red()
                        )
                        await msg.edit(embed=cancel_embed, view=None)
                except Exception:
                    pass
                await interaction.response.send_message(
                    "✅ Game cancelled. Your bet has been refunded.", ephemeral=True
                )
                return
        await interaction.response.send_message(
            "You have no active coinflip game to cancel.", ephemeral=True
        )

    @cf_group.command(name="active", description="Show all active coinflip games waiting for a challenger")
    async def cf_active(self, interaction: discord.Interaction):
        price = await fetch_ltc_price()
        guild_games = [
            (gid, g) for gid, g in active_games.items()
            if g["guild_id"] == interaction.guild.id and not g.get("locked")
        ]
        if not guild_games:
            await interaction.response.send_message("No open coinflip games right now.", ephemeral=True)
            return

        embed = discord.Embed(
            title="🪙 Open Coinflip Games",
            color=discord.Color.gold(),
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        for game_id, game in guild_games[:10]:
            creator = interaction.guild.get_member(game["creator_id"])
            name = creator.display_name if creator else f"User {game['creator_id']}"
            side_emoji = "🟡 Heads" if game["side"] == "heads" else "⚫ Tails"
            embed.add_field(
                name=name,
                value=f"Bet: **{fmt(game['bet'], price)}**\nSide: {side_emoji}",
                inline=True
            )
        embed.set_footer(text=f"{len(guild_games)} game(s) waiting • Go to the coinflip channel to join")
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(CoinflipPvP(bot))
