import discord
from discord import app_commands
from discord.ext import commands
import json
import asyncio
import aiohttp
import random
import datetime
import time

DEPOSIT_ADDRESS = "LagW6oTkbG1aBLjwnzPVZEPoWWPhW2HRFn"
BALANCES_PATH = "data/balances.json"
USED_TX_PATH = "data/used_txs.json"
STATS_PATH = "data/casino_stats.json"
CONFIG_PATH = "data/config.json"

SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣", "⭐"]
SLOT_WEIGHTS = [30, 25, 20, 15, 6, 3, 1]
SLOT_PAYOUTS = {
    "🍒": 2, "🍋": 2.5, "🍊": 3, "🍇": 4,
    "💎": 10, "7️⃣": 15, "⭐": 50
}

CARD_SUITS = ["♠️", "♥️", "♦️", "♣️"]
CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

GAME_BANNERS = {
    "slots":     "https://i.imgur.com/Qyk9VNF.gif",
    "coinflip":  "https://i.imgur.com/6dLJMsa.gif",
    "dice":      "https://i.imgur.com/hbGQImb.gif",
    "blackjack": "https://i.imgur.com/7KlhN5w.gif",
    "roulette":  "https://i.imgur.com/Oa2MZFS.gif",
    "crash":     "https://i.imgur.com/0uNBhj4.gif",
}

GAME_EMOJI = {
    "slots": "🎰", "coinflip": "🪙", "dice": "🎲",
    "blackjack": "🃏", "roulette": "🎡", "crash": "🚀"
}

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


def load_config() -> dict:
    return load_json(CONFIG_PATH)


def save_config(cfg: dict):
    save_json(CONFIG_PATH, cfg)


# ── Balance helpers ───────────────────────────────────────────────────────────

def get_balance(guild_id: int, user_id: int) -> float:
    data = load_json(BALANCES_PATH)
    return data.get(str(guild_id), {}).get(str(user_id), 0.0)


def set_balance(guild_id: int, user_id: int, amount: float):
    data = load_json(BALANCES_PATH)
    gid, uid = str(guild_id), str(user_id)
    if gid not in data:
        data[gid] = {}
    data[gid][uid] = round(max(0.0, amount), 8)
    save_json(BALANCES_PATH, data)


def add_balance(guild_id: int, user_id: int, amount: float):
    set_balance(guild_id, user_id, get_balance(guild_id, user_id) + amount)


def record_stat(guild_id: int, user_id: int, game: str, won: bool, profit: float):
    data = load_json(STATS_PATH)
    gid, uid = str(guild_id), str(user_id)
    if gid not in data:
        data[gid] = {}
    if uid not in data[gid]:
        data[gid][uid] = {"games": 0, "wins": 0, "losses": 0, "profit": 0.0}
    s = data[gid][uid]
    s["games"] += 1
    s["wins" if won else "losses"] += 1
    s["profit"] = round(s["profit"] + profit, 8)
    save_json(STATS_PATH, data)


# ── Card helpers ──────────────────────────────────────────────────────────────

def weighted_choice(symbols, weights):
    total = sum(weights)
    r = random.uniform(0, total)
    running = 0
    for sym, w in zip(symbols, weights):
        running += w
        if r <= running:
            return sym
    return symbols[-1]


def card_value(card: str) -> int:
    v = card.split(" ")[0]
    if v in ["J", "Q", "K"]:
        return 10
    if v == "A":
        return 11
    return int(v)


def hand_total(hand: list[str]) -> int:
    total = sum(card_value(c) for c in hand)
    aces = sum(1 for c in hand if c.startswith("A"))
    while total > 21 and aces:
        total -= 10
        aces -= 1
    return total


def render_hand(hand: list[str], hide_second: bool = False) -> str:
    if hide_second and len(hand) > 1:
        return f"{hand[0]}  🂠"
    return "  ".join(hand)


def new_deck() -> list[str]:
    deck = [f"{v} {s}" for s in CARD_SUITS for v in CARD_VALUES] * 6
    random.shuffle(deck)
    return deck


# ── Blockchain TX verify ──────────────────────────────────────────────────────

async def verify_ltc_tx(tx_hash: str) -> tuple[bool, float, str]:
    url = f"https://api.blockcypher.com/v1/ltc/main/txs/{tx_hash.strip()}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=12)) as resp:
                if resp.status == 404:
                    return False, 0.0, "Transaction not found. Double-check the TX hash."
                if resp.status != 200:
                    return False, 0.0, f"Blockchain API error (status {resp.status}). Try again shortly."
                data = await resp.json()
    except asyncio.TimeoutError:
        return False, 0.0, "Blockchain API timed out. Try again in a moment."
    except Exception as e:
        return False, 0.0, f"Network error: {e}"

    confirmations = data.get("confirmations", 0)
    if confirmations < 1:
        return False, 0.0, f"Transaction found but has **{confirmations} confirmations**. Please wait for at least 1 confirmation (~2.5 min) and try again."

    amount_ltc = 0.0
    for output in data.get("outputs", []):
        if DEPOSIT_ADDRESS in output.get("addresses", []):
            amount_ltc += output.get("value", 0) / 1e8

    if amount_ltc <= 0:
        return False, 0.0, "This transaction does **not** send LTC to our deposit address. Make sure you used the correct address."

    return True, amount_ltc, f"{confirmations} confirmation(s)"


# ── Modals & Views ────────────────────────────────────────────────────────────

class TxModal(discord.ui.Modal, title="Submit Deposit TX Hash"):
    tx_hash = discord.ui.TextInput(
        label="Transaction Hash (TX ID)",
        placeholder="e.g. a1b2c3d4e5f6...",
        min_length=20,
        max_length=100,
        style=discord.TextStyle.short,
    )

    def __init__(self, cog: "Casino"):
        super().__init__()
        self.cog = cog

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        tx = self.tx_hash.value.strip()
        guild_id = interaction.guild.id
        user_id = interaction.user.id

        used = load_json(USED_TX_PATH)
        if tx in used.get(str(guild_id), {}):
            await interaction.followup.send("❌ This TX has already been used for a deposit.", ephemeral=True)
            return

        checking = discord.Embed(
            title="🔍 Verifying Transaction...",
            description=f"Checking `{tx[:20]}...` on the Litecoin blockchain.\nThis may take a few seconds.",
            color=discord.Color.yellow()
        )
        await interaction.followup.send(embed=checking, ephemeral=True)

        valid, amount, detail = await verify_ltc_tx(tx)
        price = await fetch_ltc_price()

        if not valid:
            fail = discord.Embed(
                title="❌ Deposit Failed",
                description=detail,
                color=discord.Color.red()
            )
            fail.add_field(name="TX Hash", value=f"`{tx}`", inline=False)
            await interaction.edit_original_response(embed=fail)
            return

        used_data = load_json(USED_TX_PATH)
        gid = str(guild_id)
        if gid not in used_data:
            used_data[gid] = {}
        used_data[gid][tx] = {
            "user_id": str(user_id),
            "amount": amount,
            "confirmed_at": datetime.datetime.utcnow().isoformat(),
        }
        save_json(USED_TX_PATH, used_data)

        add_balance(guild_id, user_id, amount)
        new_bal = get_balance(guild_id, user_id)

        success = discord.Embed(
            title="✅ Deposit Confirmed!",
            color=discord.Color.green(),
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        success.add_field(name="💰 Amount Received", value=fmt(amount, price), inline=True)
        success.add_field(name="💳 New Balance", value=fmt(new_bal, price), inline=True)
        success.add_field(name="🔗 TX Hash", value=f"`{tx}`", inline=False)
        success.add_field(name="✅ Confirmations", value=detail, inline=True)
        await interaction.edit_original_response(embed=success)

        await self.cog.send_deposit_log(interaction.guild, interaction.user, amount, tx, new_bal, price)


class DepositView(discord.ui.View):
    def __init__(self, cog: "Casino"):
        super().__init__(timeout=300)
        self.cog = cog

    @discord.ui.button(label="Submit TX Hash", style=discord.ButtonStyle.green, emoji="🔗")
    async def submit_tx(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(TxModal(self.cog))


class BlackjackView(discord.ui.View):
    def __init__(self, cog: "Casino", player: discord.Member, bet: float, deck: list,
                 player_hand: list, dealer_hand: list, price: float):
        super().__init__(timeout=60)
        self.cog = cog
        self.player = player
        self.bet = bet
        self.deck = deck
        self.player_hand = player_hand
        self.dealer_hand = dealer_hand
        self.doubled = False
        self.price = price

    def build_embed(self, status: str = "playing", result: str = None) -> discord.Embed:
        color = (discord.Color.blurple() if status == "playing"
                 else (discord.Color.green() if result in ("win", "dealer_bust", "blackjack")
                       else (discord.Color.gold() if result == "push"
                             else discord.Color.red())))
        embed = discord.Embed(title="🃏 Blackjack", color=color)
        embed.set_thumbnail(url=GAME_BANNERS["blackjack"])

        hide = status == "playing"
        dealer_total = hand_total([self.dealer_hand[0]]) if hide else hand_total(self.dealer_hand)
        embed.add_field(
            name=f"🏦 Dealer {'(hidden)' if hide else ''}",
            value=f"{render_hand(self.dealer_hand, hide)}\n**Total: {dealer_total}{'?' if hide else ''}**",
            inline=False
        )
        embed.add_field(
            name="🧑 You",
            value=f"{render_hand(self.player_hand)}\n**Total: {hand_total(self.player_hand)}**",
            inline=False
        )
        embed.add_field(name="💰 Bet", value=fmt(self.bet, self.price), inline=True)

        if status != "playing" and result:
            if result == "win":
                embed.add_field(name="🏆 Result", value=f"You won **+{fmt(self.bet, self.price)}**!", inline=False)
            elif result == "push":
                embed.add_field(name="🤝 Result", value="Push — bet returned.", inline=False)
            elif result == "bust":
                embed.add_field(name="💥 Result", value=f"Busted! Lost **{fmt(self.bet, self.price)}**.", inline=False)
            elif result == "dealer_bust":
                embed.add_field(name="🏆 Result", value=f"Dealer busted! You won **+{fmt(self.bet, self.price)}**!", inline=False)
            elif result == "blackjack":
                winnings = round(self.bet * 1.5, 8)
                embed.add_field(name="🎉 Result", value=f"Blackjack! You won **+{fmt(winnings, self.price)}**!", inline=False)
            else:
                embed.add_field(name="😞 Result", value=f"Dealer wins. Lost **{fmt(self.bet, self.price)}**.", inline=False)
        return embed

    async def end_game(self, interaction: discord.Interaction, result: str):
        for item in self.children:
            item.disabled = True

        guild_id = interaction.guild.id
        user_id = self.player.id
        profit = 0.0

        if result in ("win", "dealer_bust"):
            add_balance(guild_id, user_id, self.bet * 2)
            profit = self.bet
        elif result == "blackjack":
            winnings = round(self.bet * 1.5, 8)
            add_balance(guild_id, user_id, self.bet + winnings)
            profit = winnings
        elif result == "push":
            add_balance(guild_id, user_id, self.bet)
            profit = 0.0
        else:
            profit = -self.bet

        won = profit > 0
        record_stat(guild_id, user_id, "blackjack", won, profit)

        embed = self.build_embed(status="done", result=result)
        bal = get_balance(guild_id, user_id)
        embed.set_footer(text=f"Balance: {fmt(bal, self.price)}")
        await interaction.response.edit_message(embed=embed, view=self)

        result_label = {
            "win": "Win", "dealer_bust": "Dealer Bust", "blackjack": "Blackjack!",
            "push": "Push", "bust": "Bust", "lose": "Loss"
        }.get(result, result)
        await self.cog.post_game_result(
            interaction.guild, self.player, "blackjack",
            self.bet, profit, result_label, self.price
        )
        self.stop()

    @discord.ui.button(label="Hit", style=discord.ButtonStyle.green, emoji="👊")
    async def hit(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.player.id:
            await interaction.response.send_message("This isn't your game!", ephemeral=True)
            return
        self.player_hand.append(self.deck.pop())
        total = hand_total(self.player_hand)
        if total > 21:
            await self.end_game(interaction, "bust")
        elif total == 21:
            await self.stand.callback(self, interaction)
        else:
            await interaction.response.edit_message(embed=self.build_embed(), view=self)

    @discord.ui.button(label="Stand", style=discord.ButtonStyle.red, emoji="✋")
    async def stand(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.player.id:
            await interaction.response.send_message("This isn't your game!", ephemeral=True)
            return
        while hand_total(self.dealer_hand) < 17:
            self.dealer_hand.append(self.deck.pop())
        pt = hand_total(self.player_hand)
        dt = hand_total(self.dealer_hand)
        if dt > 21:
            result = "dealer_bust"
        elif pt > dt:
            result = "win"
        elif pt == dt:
            result = "push"
        else:
            result = "lose"
        await self.end_game(interaction, result)

    @discord.ui.button(label="Double Down", style=discord.ButtonStyle.blurple, emoji="💰")
    async def double_down(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.player.id:
            await interaction.response.send_message("This isn't your game!", ephemeral=True)
            return
        bal = get_balance(interaction.guild.id, self.player.id)
        if bal < self.bet:
            await interaction.response.send_message("Not enough balance to double down.", ephemeral=True)
            return
        add_balance(interaction.guild.id, self.player.id, -self.bet)
        self.bet *= 2
        self.doubled = True
        self.player_hand.append(self.deck.pop())
        self.double_down.disabled = True
        total = hand_total(self.player_hand)
        if total > 21:
            await self.end_game(interaction, "bust")
        else:
            await self.stand.callback(self, interaction)


class CrashView(discord.ui.View):
    def __init__(self, cog: "Casino", player: discord.Member, bet: float, guild_id: int, price: float):
        super().__init__(timeout=120)
        self.cog = cog
        self.player = player
        self.bet = bet
        self.guild_id = guild_id
        self.price = price
        self.cashed_out = False
        self.multiplier = 1.0
        self.crashed = False

    @discord.ui.button(label="💸 Cash Out", style=discord.ButtonStyle.green)
    async def cashout(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.player.id:
            await interaction.response.send_message("This isn't your game!", ephemeral=True)
            return
        if self.crashed:
            await interaction.response.send_message("Too late — already crashed!", ephemeral=True)
            return
        self.cashed_out = True
        button.disabled = True
        winnings = round(self.bet * self.multiplier, 8)
        add_balance(self.guild_id, self.player.id, winnings)
        profit = winnings - self.bet
        record_stat(self.guild_id, self.player.id, "crash", profit > 0, profit)
        bal = get_balance(self.guild_id, self.player.id)
        embed = discord.Embed(
            title="💸 Cashed Out!",
            description=(
                f"You cashed out at **{self.multiplier:.2f}x**\n\n"
                f"Won: **+{fmt(profit, self.price)}**\n"
                f"Balance: **{fmt(bal, self.price)}**"
            ),
            color=discord.Color.green()
        )
        embed.set_thumbnail(url=GAME_BANNERS["crash"])
        await interaction.response.edit_message(embed=embed, view=self)

        guild = interaction.guild
        await self.cog.post_game_result(
            guild, self.player, "crash",
            self.bet, profit, f"Cashed out at {self.multiplier:.2f}x", self.price
        )
        self.stop()


# ── Main Cog ──────────────────────────────────────────────────────────────────

class Casino(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # ── Channel helpers ───────────────────────────────────────────────────────

    def get_log_channel(self, guild: discord.Guild) -> discord.TextChannel | None:
        cid = load_config().get(str(guild.id), {}).get("casino_log_channel")
        return guild.get_channel(int(cid)) if cid else None

    def get_game_channel(self, guild: discord.Guild, game: str) -> discord.TextChannel | None:
        cid = load_config().get(str(guild.id), {}).get(f"game_channel_{game}")
        return guild.get_channel(int(cid)) if cid else None

    async def post_game_result(
        self, guild: discord.Guild, user: discord.Member,
        game: str, bet: float, profit: float, detail: str, price: float
    ):
        ch = self.get_game_channel(guild, game)
        if not ch:
            return
        won = profit > 0
        emoji = GAME_EMOJI.get(game, "🎮")
        color = discord.Color.green() if won else (discord.Color.gold() if profit == 0 else discord.Color.red())
        embed = discord.Embed(
            title=f"{emoji} {game.capitalize()} — {'🏆 Win!' if won else ('🤝 Push' if profit == 0 else '😞 Loss')}",
            color=color,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_thumbnail(url=user.display_avatar.url)
        embed.add_field(name="Player", value=user.mention, inline=True)
        embed.add_field(name="Bet", value=fmt(bet, price), inline=True)
        embed.add_field(name="Result", value=detail, inline=True)
        sign = "+" if won else ("" if profit == 0 else "")
        embed.add_field(
            name="Profit/Loss",
            value=f"{'+'if profit>0 else ''}{fmt(profit, price)}" if profit != 0 else "±0 (Push)",
            inline=True
        )
        await ch.send(embed=embed)

    async def send_deposit_log(self, guild, user, amount, tx, new_bal, price):
        lc = self.get_log_channel(guild)
        if not lc:
            return
        embed = discord.Embed(
            title="💰 New Deposit",
            color=discord.Color.green(),
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_thumbnail(url=user.display_avatar.url)
        embed.add_field(name="User", value=f"{user.mention} (`{user}`)", inline=True)
        embed.add_field(name="User ID", value=str(user.id), inline=True)
        embed.add_field(name="Amount", value=fmt(amount, price), inline=True)
        embed.add_field(name="New Balance", value=fmt(new_bal, price), inline=True)
        embed.add_field(name="TX Hash", value=f"`{tx}`", inline=False)
        embed.add_field(name="Deposit Address", value=f"`{DEPOSIT_ADDRESS}`", inline=False)
        await lc.send(embed=embed)

    async def send_game_log(self, guild, user, game, bet, result, profit, bal, price):
        lc = self.get_log_channel(guild)
        if not lc:
            return
        won = profit > 0
        embed = discord.Embed(
            title=f"🎰 Game Log — {game}",
            color=discord.Color.green() if won else discord.Color.red(),
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_thumbnail(url=user.display_avatar.url)
        embed.add_field(name="Player", value=f"{user.mention} (`{user}`)", inline=True)
        embed.add_field(name="Game", value=game, inline=True)
        embed.add_field(name="Bet", value=fmt(bet, price), inline=True)
        embed.add_field(name="Result", value=result, inline=True)
        embed.add_field(name="Profit/Loss", value=f"{'+'if won else ''}{fmt(profit, price)}", inline=True)
        embed.add_field(name="New Balance", value=fmt(bal, price), inline=True)
        await lc.send(embed=embed)

    # ── Admin commands ────────────────────────────────────────────────────────

    casino_group = app_commands.Group(name="casino", description="Casino management")

    @casino_group.command(name="setup", description="Set casino log channel")
    @app_commands.describe(log_channel="Channel where deposits and game results are logged")
    @app_commands.checks.has_permissions(administrator=True)
    async def casino_setup(self, interaction: discord.Interaction, log_channel: discord.TextChannel):
        cfg = load_config()
        gid = str(interaction.guild.id)
        if gid not in cfg:
            cfg[gid] = {}
        cfg[gid]["casino_log_channel"] = str(log_channel.id)
        save_config(cfg)
        await interaction.response.send_message(f"✅ Casino logs → {log_channel.mention}", ephemeral=True)

    @casino_group.command(name="setchannel", description="Set a dedicated announcement channel for a specific game")
    @app_commands.describe(game="Which game to configure", channel="Channel where game results are announced")
    @app_commands.choices(game=[
        app_commands.Choice(name="🎰 Slots", value="slots"),
        app_commands.Choice(name="🪙 Coinflip (House)", value="coinflip"),
        app_commands.Choice(name="🎲 Dice", value="dice"),
        app_commands.Choice(name="🃏 Blackjack", value="blackjack"),
        app_commands.Choice(name="🎡 Roulette", value="roulette"),
        app_commands.Choice(name="🚀 Crash", value="crash"),
    ])
    @app_commands.checks.has_permissions(administrator=True)
    async def casino_setchannel(self, interaction: discord.Interaction, game: str, channel: discord.TextChannel):
        cfg = load_config()
        gid = str(interaction.guild.id)
        if gid not in cfg:
            cfg[gid] = {}
        cfg[gid][f"game_channel_{game}"] = str(channel.id)
        save_config(cfg)
        emoji = GAME_EMOJI.get(game, "🎮")
        await interaction.response.send_message(
            f"✅ {emoji} **{game.capitalize()}** results will be announced in {channel.mention}.",
            ephemeral=True
        )

    @casino_group.command(name="channels", description="View all configured game channels")
    @app_commands.checks.has_permissions(administrator=True)
    async def casino_channels(self, interaction: discord.Interaction):
        cfg = load_config().get(str(interaction.guild.id), {})
        games = ["slots", "coinflip", "dice", "blackjack", "roulette", "crash"]
        embed = discord.Embed(title="🎮 Game Channel Setup", color=discord.Color.gold())
        lines = []
        for g in games:
            cid = cfg.get(f"game_channel_{g}")
            ch = interaction.guild.get_channel(int(cid)) if cid else None
            status = ch.mention if ch else "❌ Not set"
            lines.append(f"{GAME_EMOJI.get(g, '🎮')} **{g.capitalize()}** → {status}")
        pvp_cid = cfg.get("coinflip_channel")
        pvp_ch = interaction.guild.get_channel(int(pvp_cid)) if pvp_cid else None
        lines.append(f"🪙 **Coinflip PvP** → {pvp_ch.mention if pvp_ch else '❌ Not set — use /cf setup'}")
        log_cid = cfg.get("casino_log_channel")
        log_ch = interaction.guild.get_channel(int(log_cid)) if log_cid else None
        lines.append(f"📋 **Log Channel** → {log_ch.mention if log_ch else '❌ Not set — use /casino setup'}")
        embed.description = "\n".join(lines)
        embed.set_footer(text="Use /casino setchannel to configure each game")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @casino_group.command(name="addbalance", description="Admin: manually add balance to a user")
    @app_commands.describe(member="User to credit", amount="Amount in LTC")
    @app_commands.checks.has_permissions(administrator=True)
    async def casino_addbalance(self, interaction: discord.Interaction, member: discord.Member, amount: float):
        price = await fetch_ltc_price()
        add_balance(interaction.guild.id, member.id, amount)
        bal = get_balance(interaction.guild.id, member.id)
        await interaction.response.send_message(
            f"✅ Added **{fmt(amount, price)}** to {member.mention}. New balance: **{fmt(bal, price)}**",
            ephemeral=True
        )

    @casino_group.command(name="stats", description="View your casino stats")
    @app_commands.describe(member="Member to check (default: yourself)")
    async def casino_stats(self, interaction: discord.Interaction, member: discord.Member = None):
        target = member or interaction.user
        price = await fetch_ltc_price()
        data = load_json(STATS_PATH)
        s = data.get(str(interaction.guild.id), {}).get(str(target.id), {})
        bal = get_balance(interaction.guild.id, target.id)
        embed = discord.Embed(title=f"🎰 Casino Stats — {target.display_name}", color=discord.Color.gold())
        embed.set_thumbnail(url=target.display_avatar.url)
        embed.add_field(name="💳 Balance", value=fmt(bal, price), inline=True)
        embed.add_field(name="🎮 Games Played", value=str(s.get("games", 0)), inline=True)
        embed.add_field(name="🏆 Wins", value=str(s.get("wins", 0)), inline=True)
        embed.add_field(name="😞 Losses", value=str(s.get("losses", 0)), inline=True)
        profit = s.get("profit", 0.0)
        embed.add_field(name="💰 Net Profit", value=f"{'+'if profit>=0 else ''}{fmt(profit, price)}", inline=True)
        wr = round(s.get("wins", 0) / max(s.get("games", 1), 1) * 100, 1)
        embed.add_field(name="📊 Win Rate", value=f"{wr}%", inline=True)
        await interaction.response.send_message(embed=embed)

    @casino_group.command(name="leaderboard", description="Top balances in the casino")
    async def casino_leaderboard(self, interaction: discord.Interaction):
        price = await fetch_ltc_price()
        data = load_json(BALANCES_PATH)
        guild_data = data.get(str(interaction.guild.id), {})
        sorted_users = sorted(guild_data.items(), key=lambda x: x[1], reverse=True)[:10]
        embed = discord.Embed(title="🏆 Casino Leaderboard — Top Balances", color=discord.Color.gold())
        medals = ["🥇", "🥈", "🥉"] + ["🔹"] * 7
        lines = []
        for i, (uid, bal) in enumerate(sorted_users):
            member = interaction.guild.get_member(int(uid))
            name = member.display_name if member else f"User {uid}"
            lines.append(f"{medals[i]} **{name}** — {fmt(bal, price)}")
        embed.description = "\n".join(lines) if lines else "No players yet."
        await interaction.response.send_message(embed=embed)

    # ── Player commands ───────────────────────────────────────────────────────

    @app_commands.command(name="balance", description="Check your casino balance")
    @app_commands.describe(member="Member to check (default: yourself)")
    async def balance(self, interaction: discord.Interaction, member: discord.Member = None):
        target = member or interaction.user
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, target.id)
        embed = discord.Embed(title="💳 Casino Balance", color=discord.Color.blurple())
        embed.set_thumbnail(url=target.display_avatar.url)
        embed.add_field(name="User", value=target.mention, inline=True)
        embed.add_field(name="Balance", value=fmt(bal, price), inline=True)
        embed.set_footer(text="Use /deposit to top up your balance.")
        await interaction.response.send_message(embed=embed, ephemeral=(target == interaction.user))

    @app_commands.command(name="deposit", description="Deposit Litecoin to your casino balance")
    async def deposit(self, interaction: discord.Interaction):
        price = await fetch_ltc_price()
        price_line = f"\n\n💵 Current rate: **1 LTC = ${price:,.2f}**" if price > 0 else ""
        embed = discord.Embed(
            title="💰 Deposit Litecoin",
            description=(
                "Send **Litecoin (LTC)** to the address below, then click the button to submit your TX hash for instant verification.\n\n"
                "Your balance will be credited automatically after **1 confirmation** (~2.5 minutes)."
                + price_line
            ),
            color=discord.Color.gold()
        )
        embed.add_field(name="📬 Deposit Address", value=f"```{DEPOSIT_ADDRESS}```", inline=False)
        embed.add_field(name="⚠️ Important", value="• Only send **LTC** to this address\n• Minimum deposit: any amount\n• Funds are credited after 1 confirmation", inline=False)
        embed.set_footer(text="Click the button below once your transaction is sent.")
        await interaction.response.send_message(embed=embed, view=DepositView(self), ephemeral=True)

    @app_commands.command(name="withdraw", description="Request a withdrawal from your casino balance")
    @app_commands.describe(amount="Amount in LTC to withdraw", address="Your Litecoin address")
    async def withdraw(self, interaction: discord.Interaction, amount: float, address: str):
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0:
            await interaction.response.send_message("Amount must be greater than 0.", ephemeral=True)
            return
        if amount > bal:
            await interaction.response.send_message(
                f"Insufficient balance. You have **{fmt(bal, price)}**.", ephemeral=True
            )
            return

        add_balance(interaction.guild.id, interaction.user.id, -amount)
        new_bal = get_balance(interaction.guild.id, interaction.user.id)

        embed = discord.Embed(
            title="📤 Withdrawal Requested",
            description="Your withdrawal has been submitted and will be processed manually.",
            color=discord.Color.orange()
        )
        embed.add_field(name="Amount", value=fmt(amount, price), inline=True)
        embed.add_field(name="To Address", value=f"`{address}`", inline=True)
        embed.add_field(name="Remaining Balance", value=fmt(new_bal, price), inline=True)
        await interaction.response.send_message(embed=embed, ephemeral=True)

        lc = self.get_log_channel(interaction.guild)
        if lc:
            log = discord.Embed(title="📤 Withdrawal Request", color=discord.Color.orange(),
                                timestamp=datetime.datetime.now(datetime.timezone.utc))
            log.set_thumbnail(url=interaction.user.display_avatar.url)
            log.add_field(name="User", value=f"{interaction.user.mention} (`{interaction.user}`)", inline=True)
            log.add_field(name="Amount", value=fmt(amount, price), inline=True)
            log.add_field(name="To Address", value=f"`{address}`", inline=False)
            log.add_field(name="Remaining Balance", value=fmt(new_bal, price), inline=True)
            await lc.send(embed=log)

    # ── Games ─────────────────────────────────────────────────────────────────

    @app_commands.command(name="slots", description="Spin the slot machine")
    @app_commands.describe(amount="Amount in LTC to bet")
    async def slots(self, interaction: discord.Interaction, amount: float):
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0 or amount > bal:
            await interaction.response.send_message(
                f"Invalid bet. Balance: **{fmt(bal, price)}**", ephemeral=True
            )
            return
        add_balance(interaction.guild.id, interaction.user.id, -amount)

        spin_frames = [
            "🎰  [ 🔄 | 🔄 | 🔄 ]",
            "🎰  [ {} | 🔄 | 🔄 ]",
            "🎰  [ {} | {} | 🔄 ]",
        ]
        reels = [weighted_choice(SLOT_SYMBOLS, SLOT_WEIGHTS) for _ in range(3)]

        embed = discord.Embed(title="🎰 Slot Machine", color=discord.Color.blurple())
        embed.set_image(url=GAME_BANNERS["slots"])
        embed.add_field(name="Spinning...", value=spin_frames[0], inline=False)
        embed.add_field(name="Bet", value=fmt(amount, price), inline=True)
        await interaction.response.send_message(embed=embed)
        msg = await interaction.original_response()

        await asyncio.sleep(1.0)
        embed.set_field_at(0, name="Spinning...", value=spin_frames[1].format(reels[0]))
        await msg.edit(embed=embed)

        await asyncio.sleep(0.8)
        embed.set_field_at(0, name="Spinning...", value=spin_frames[2].format(reels[0], reels[1]))
        await msg.edit(embed=embed)

        await asyncio.sleep(0.8)

        if reels[0] == reels[1] == reels[2]:
            multiplier = SLOT_PAYOUTS[reels[0]]
            winnings = round(amount * multiplier, 8)
            add_balance(interaction.guild.id, interaction.user.id, winnings)
            profit = winnings - amount
            result_text = f"🎉 **JACKPOT!** {multiplier}x — Won **+{fmt(profit, price)}**!"
            color = discord.Color.gold()
            detail = f"Jackpot {multiplier}x"
        elif reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]:
            winnings = round(amount * 1.5, 8)
            add_balance(interaction.guild.id, interaction.user.id, winnings)
            profit = winnings - amount
            result_text = f"✨ **Two of a kind!** 1.5x — Won **+{fmt(profit, price)}**!"
            color = discord.Color.green()
            detail = "Two of a kind (1.5x)"
        else:
            profit = -amount
            result_text = f"😞 No match. Lost **{fmt(amount, price)}**."
            color = discord.Color.red()
            detail = "No match"

        bal = get_balance(interaction.guild.id, interaction.user.id)
        record_stat(interaction.guild.id, interaction.user.id, "slots", profit > 0, profit)

        embed.color = color
        embed.set_field_at(0, name="Result", value=f"🎰  [ {reels[0]} | {reels[1]} | {reels[2]} ]")
        embed.add_field(name="Outcome", value=result_text, inline=False)
        embed.add_field(name="Balance", value=fmt(bal, price), inline=True)
        await msg.edit(embed=embed)
        await self.send_game_log(interaction.guild, interaction.user, "Slots", amount, " | ".join(reels), profit, bal, price)
        await self.post_game_result(interaction.guild, interaction.user, "slots", amount, profit, detail, price)

    @app_commands.command(name="coinflip", description="Flip a coin against the house and bet on the outcome")
    @app_commands.describe(amount="Amount in LTC to bet", choice="Heads or Tails")
    @app_commands.choices(choice=[
        app_commands.Choice(name="Heads", value="heads"),
        app_commands.Choice(name="Tails", value="tails"),
    ])
    async def coinflip(self, interaction: discord.Interaction, amount: float, choice: str):
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0 or amount > bal:
            await interaction.response.send_message(
                f"Invalid bet. Balance: **{fmt(bal, price)}**", ephemeral=True
            )
            return
        add_balance(interaction.guild.id, interaction.user.id, -amount)

        embed = discord.Embed(title="🪙 Coin Flip", color=discord.Color.blurple())
        embed.set_image(url=GAME_BANNERS["coinflip"])
        embed.add_field(name="Your Pick", value=choice.capitalize(), inline=True)
        embed.add_field(name="Bet", value=fmt(amount, price), inline=True)
        embed.add_field(name="Flipping...", value="🪙 **Tossing the coin...**", inline=False)
        await interaction.response.send_message(embed=embed)
        msg = await interaction.original_response()

        await asyncio.sleep(0.7)
        for frame in ["🌀 Spinning...", "🪙 Almost...", "✨ Landing..."]:
            embed.set_field_at(2, name="Flipping...", value=frame)
            await msg.edit(embed=embed)
            await asyncio.sleep(0.6)

        result = random.choice(["heads", "tails"])
        won = result == choice
        coin_emoji = "🟡 Heads" if result == "heads" else "⚫ Tails"

        if won:
            add_balance(interaction.guild.id, interaction.user.id, amount * 2)
            profit = amount
            outcome = f"✅ You won **+{fmt(profit, price)}**!"
            color = discord.Color.green()
        else:
            profit = -amount
            outcome = f"❌ You lost **{fmt(amount, price)}**."
            color = discord.Color.red()

        bal = get_balance(interaction.guild.id, interaction.user.id)
        record_stat(interaction.guild.id, interaction.user.id, "coinflip", won, profit)

        embed.color = color
        embed.set_field_at(2, name="Result", value=f"{coin_emoji}\n{outcome}")
        embed.add_field(name="Balance", value=fmt(bal, price), inline=True)
        await msg.edit(embed=embed)
        await self.send_game_log(interaction.guild, interaction.user, "Coinflip", amount, coin_emoji, profit, bal, price)
        await self.post_game_result(interaction.guild, interaction.user, "coinflip", amount, profit, coin_emoji, price)

    @app_commands.command(name="dice", description="Roll a dice and bet on the outcome")
    @app_commands.describe(amount="Amount in LTC to bet", target="Guess the dice roll (1-6). Correct = 5x win!")
    async def dice(self, interaction: discord.Interaction, amount: float, target: int):
        if target < 1 or target > 6:
            await interaction.response.send_message("Target must be between 1 and 6.", ephemeral=True)
            return
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0 or amount > bal:
            await interaction.response.send_message(
                f"Invalid bet. Balance: **{fmt(bal, price)}**", ephemeral=True
            )
            return
        add_balance(interaction.guild.id, interaction.user.id, -amount)

        dice_faces = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"]
        embed = discord.Embed(title="🎲 Dice Roll", color=discord.Color.blurple())
        embed.set_image(url=GAME_BANNERS["dice"])
        embed.add_field(name="Your Guess", value=dice_faces[target - 1], inline=True)
        embed.add_field(name="Bet", value=fmt(amount, price), inline=True)
        embed.add_field(name="Rolling...", value="🎲 Rolling the dice...", inline=False)
        await interaction.response.send_message(embed=embed)
        msg = await interaction.original_response()

        for _ in range(3):
            fake = random.randint(1, 6)
            embed.set_field_at(2, name="Rolling...", value=f"🎲 {dice_faces[fake-1]}")
            await msg.edit(embed=embed)
            await asyncio.sleep(0.5)

        roll = random.randint(1, 6)
        won = roll == target

        if won:
            winnings = round(amount * 5, 8)
            add_balance(interaction.guild.id, interaction.user.id, winnings)
            profit = winnings - amount
            outcome = f"🎉 Correct! Won **+{fmt(profit, price)}** (5x)!"
            color = discord.Color.green()
        else:
            profit = -amount
            outcome = f"❌ Wrong! The dice showed {dice_faces[roll-1]}. Lost **{fmt(amount, price)}**."
            color = discord.Color.red()

        bal = get_balance(interaction.guild.id, interaction.user.id)
        record_stat(interaction.guild.id, interaction.user.id, "dice", won, profit)

        embed.color = color
        embed.set_field_at(2, name="Result", value=f"{dice_faces[roll-1]}\n{outcome}")
        embed.add_field(name="Balance", value=fmt(bal, price), inline=True)
        await msg.edit(embed=embed)
        await self.send_game_log(interaction.guild, interaction.user, "Dice", amount, str(roll), profit, bal, price)
        await self.post_game_result(interaction.guild, interaction.user, "dice", amount, profit, f"Rolled {dice_faces[roll-1]}", price)

    @app_commands.command(name="blackjack", description="Play a game of blackjack")
    @app_commands.describe(amount="Amount in LTC to bet")
    async def blackjack(self, interaction: discord.Interaction, amount: float):
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0 or amount > bal:
            await interaction.response.send_message(
                f"Invalid bet. Balance: **{fmt(bal, price)}**", ephemeral=True
            )
            return
        add_balance(interaction.guild.id, interaction.user.id, -amount)

        deck = new_deck()
        player_hand = [deck.pop(), deck.pop()]
        dealer_hand = [deck.pop(), deck.pop()]

        view = BlackjackView(self, interaction.user, amount, deck, player_hand, dealer_hand, price)

        if hand_total(player_hand) == 21:
            winnings = round(amount * 1.5, 8)
            add_balance(interaction.guild.id, interaction.user.id, amount + winnings)
            profit = winnings
            record_stat(interaction.guild.id, interaction.user.id, "blackjack", True, profit)
            embed = view.build_embed(status="done", result="blackjack")
            new_bal = get_balance(interaction.guild.id, interaction.user.id)
            embed.set_footer(text=f"Balance: {fmt(new_bal, price)}")
            for item in view.children:
                item.disabled = True
            await interaction.response.send_message(embed=embed, view=view)
            await self.post_game_result(interaction.guild, interaction.user, "blackjack", amount, profit, "Blackjack!", price)
        else:
            embed = view.build_embed()
            await interaction.response.send_message(embed=embed, view=view)

    @app_commands.command(name="roulette", description="Play roulette — bet on color or number")
    @app_commands.describe(
        amount="Amount in LTC to bet",
        bet_type="What to bet on",
        number="Specific number (0-36, only if bet_type is number)"
    )
    @app_commands.choices(bet_type=[
        app_commands.Choice(name="Red (2x)", value="red"),
        app_commands.Choice(name="Black (2x)", value="black"),
        app_commands.Choice(name="Green/Zero (14x)", value="green"),
        app_commands.Choice(name="Even (2x)", value="even"),
        app_commands.Choice(name="Odd (2x)", value="odd"),
        app_commands.Choice(name="Low 1-18 (2x)", value="low"),
        app_commands.Choice(name="High 19-36 (2x)", value="high"),
        app_commands.Choice(name="Specific Number (35x)", value="number"),
    ])
    async def roulette(self, interaction: discord.Interaction, amount: float, bet_type: str, number: int = None):
        if bet_type == "number" and (number is None or number < 0 or number > 36):
            await interaction.response.send_message("Provide a number between 0 and 36.", ephemeral=True)
            return
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0 or amount > bal:
            await interaction.response.send_message(
                f"Invalid bet. Balance: **{fmt(bal, price)}**", ephemeral=True
            )
            return
        add_balance(interaction.guild.id, interaction.user.id, -amount)

        red_numbers = {1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36}

        embed = discord.Embed(title="🎡 Roulette", color=discord.Color.blurple())
        embed.set_image(url=GAME_BANNERS["roulette"])
        embed.add_field(
            name="Your Bet",
            value=f"{bet_type.capitalize()}" + (f" ({number})" if bet_type == "number" else ""),
            inline=True
        )
        embed.add_field(name="Amount", value=fmt(amount, price), inline=True)
        embed.add_field(name="Spinning...", value="🎡 The wheel is spinning...", inline=False)
        await interaction.response.send_message(embed=embed)
        msg = await interaction.original_response()

        for _ in range(4):
            fake = random.randint(0, 36)
            fc = "🔴" if fake in red_numbers else ("🟢" if fake == 0 else "⚫")
            embed.set_field_at(2, name="Spinning...", value=f"{fc} **{fake}**")
            await msg.edit(embed=embed)
            await asyncio.sleep(0.5)

        spin = random.randint(0, 36)
        is_red = spin in red_numbers
        is_green = spin == 0
        spin_color = "🔴" if is_red else ("🟢" if is_green else "⚫")

        multiplier = 0
        if bet_type == "red" and is_red:
            multiplier = 2
        elif bet_type == "black" and not is_red and not is_green:
            multiplier = 2
        elif bet_type == "green" and is_green:
            multiplier = 14
        elif bet_type == "even" and spin != 0 and spin % 2 == 0:
            multiplier = 2
        elif bet_type == "odd" and spin % 2 == 1:
            multiplier = 2
        elif bet_type == "low" and 1 <= spin <= 18:
            multiplier = 2
        elif bet_type == "high" and 19 <= spin <= 36:
            multiplier = 2
        elif bet_type == "number" and spin == number:
            multiplier = 35

        if multiplier > 0:
            winnings = round(amount * multiplier, 8)
            add_balance(interaction.guild.id, interaction.user.id, winnings)
            profit = winnings - amount
            outcome = f"✅ You won **+{fmt(profit, price)}** ({multiplier}x)!"
            color = discord.Color.green()
            detail = f"{spin_color} {spin} — {multiplier}x win"
        else:
            profit = -amount
            outcome = f"❌ Lost **{fmt(amount, price)}**."
            color = discord.Color.red()
            detail = f"{spin_color} {spin} — Loss"

        bal = get_balance(interaction.guild.id, interaction.user.id)
        record_stat(interaction.guild.id, interaction.user.id, "roulette", profit > 0, profit)

        embed.color = color
        embed.set_field_at(2, name="Result", value=f"{spin_color} **{spin}**\n{outcome}")
        embed.add_field(name="Balance", value=fmt(bal, price), inline=True)
        await msg.edit(embed=embed)
        await self.send_game_log(interaction.guild, interaction.user, "Roulette", amount, f"{spin_color} {spin}", profit, bal, price)
        await self.post_game_result(interaction.guild, interaction.user, "roulette", amount, profit, detail, price)

    @app_commands.command(name="crash", description="Watch the multiplier rise — cash out before it crashes!")
    @app_commands.describe(amount="Amount in LTC to bet")
    async def crash(self, interaction: discord.Interaction, amount: float):
        price = await fetch_ltc_price()
        bal = get_balance(interaction.guild.id, interaction.user.id)
        if amount <= 0 or amount > bal:
            await interaction.response.send_message(
                f"Invalid bet. Balance: **{fmt(bal, price)}**", ephemeral=True
            )
            return
        add_balance(interaction.guild.id, interaction.user.id, -amount)

        crash_point = round(max(1.0, random.expovariate(0.6) + 1.0), 2)
        view = CrashView(self, interaction.user, amount, interaction.guild.id, price)

        embed = discord.Embed(title="🚀 Crash", color=discord.Color.blurple())
        embed.set_image(url=GAME_BANNERS["crash"])
        embed.add_field(name="Multiplier", value="**1.00x** 🚀", inline=True)
        embed.add_field(name="Bet", value=fmt(amount, price), inline=True)
        embed.add_field(name="Potential Win", value=fmt(amount, price), inline=True)
        embed.set_footer(text="Click Cash Out before it crashes!")
        await interaction.response.send_message(embed=embed, view=view)
        msg = await interaction.original_response()

        multiplier = 1.0
        step = 0.1
        while multiplier < crash_point and not view.cashed_out:
            await asyncio.sleep(0.8)
            multiplier = round(multiplier + step, 2)
            if multiplier > 2.0:
                step = 0.2
            if multiplier > 5.0:
                step = 0.5
            view.multiplier = multiplier
            potential = round(amount * multiplier, 8)
            embed.set_field_at(0, name="Multiplier", value=f"**{multiplier:.2f}x** 🚀")
            embed.set_field_at(2, name="Potential Win", value=fmt(potential, price))
            try:
                await msg.edit(embed=embed, view=view)
            except Exception:
                break

        if not view.cashed_out:
            view.crashed = True
            for item in view.children:
                item.disabled = True

            profit = -amount
            record_stat(interaction.guild.id, interaction.user.id, "crash", False, profit)
            bal = get_balance(interaction.guild.id, interaction.user.id)

            embed.color = discord.Color.red()
            embed.title = "💥 CRASHED!"
            embed.set_field_at(0, name="Crashed At", value=f"**{crash_point:.2f}x** 💥")
            embed.set_field_at(2, name="Result", value=f"Lost **{fmt(amount, price)}**")
            embed.set_footer(text=f"Balance: {fmt(bal, price)}")
            try:
                await msg.edit(embed=embed, view=view)
            except Exception:
                pass
            await self.send_game_log(interaction.guild, interaction.user, "Crash", amount, f"Crashed at {crash_point:.2f}x", profit, bal, price)
            await self.post_game_result(interaction.guild, interaction.user, "crash", amount, profit, f"Crashed at {crash_point:.2f}x", price)
        else:
            bal = get_balance(interaction.guild.id, interaction.user.id)
            actual_profit = view.bet * view.multiplier - amount
            await self.send_game_log(interaction.guild, interaction.user, "Crash", amount, f"Cashed at {view.multiplier:.2f}x", actual_profit, bal, price)


async def setup(bot: commands.Bot):
    await bot.add_cog(Casino(bot))
