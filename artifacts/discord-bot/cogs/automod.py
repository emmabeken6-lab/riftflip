import discord
from discord import app_commands
from discord.ext import commands
import json
import time
from collections import defaultdict


CONFIG_PATH = "data/config.json"

DEFAULT_BAD_WORDS = [
    "nigger", "nigga", "faggot", "chink", "spic", "kike", "cunt"
]


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


class AutoMod(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.message_tracker: dict[int, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
        self.SPAM_WINDOW = 5
        self.SPAM_LIMIT = 5
        self.CAPS_THRESHOLD = 70
        self.CAPS_MIN_LENGTH = 10

    def get_guild_config(self, guild_id: int) -> dict:
        return load_config().get(str(guild_id), {})

    def set_guild_config(self, guild_id: int, key: str, value):
        config = load_config()
        gid = str(guild_id)
        if gid not in config:
            config[gid] = {}
        config[gid][key] = value
        save_config(config)

    async def warn_member(self, guild: discord.Guild, member: discord.Member, reason: str):
        try:
            await member.send(f"You received an automatic warning in **{guild.name}**.\nReason: {reason}")
        except discord.Forbidden:
            pass
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            embed = discord.Embed(title="AutoMod Warning", color=discord.Color.yellow())
            embed.add_field(name="User", value=str(member), inline=True)
            embed.add_field(name="Reason", value=reason, inline=False)
            await log_channel.send(embed=embed)

    @app_commands.command(name="automod-spam", description="Toggle spam detection (5 messages in 5 seconds)")
    @app_commands.describe(enabled="Enable or disable spam detection")
    @app_commands.checks.has_permissions(administrator=True)
    async def automod_spam(self, interaction: discord.Interaction, enabled: bool):
        self.set_guild_config(interaction.guild.id, "automod_spam", enabled)
        status = "enabled" if enabled else "disabled"
        embed = discord.Embed(
            title="AutoMod — Spam Detection",
            description=f"Spam detection has been **{status}**.\n\nTriggers when a member sends **{self.SPAM_LIMIT}+ messages in {self.SPAM_WINDOW}s**.",
            color=discord.Color.green() if enabled else discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="automod-caps", description="Toggle caps lock filter (70%+ caps in a message)")
    @app_commands.describe(enabled="Enable or disable caps filter")
    @app_commands.checks.has_permissions(administrator=True)
    async def automod_caps(self, interaction: discord.Interaction, enabled: bool):
        self.set_guild_config(interaction.guild.id, "automod_caps", enabled)
        status = "enabled" if enabled else "disabled"
        embed = discord.Embed(
            title="AutoMod — Caps Filter",
            description=f"Caps filter has been **{status}**.\n\nTriggers when **{self.CAPS_THRESHOLD}%+** of a message ({self.CAPS_MIN_LENGTH}+ chars) is uppercase.",
            color=discord.Color.green() if enabled else discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="automod-badwords", description="Toggle bad words filter")
    @app_commands.describe(enabled="Enable or disable bad words filter")
    @app_commands.checks.has_permissions(administrator=True)
    async def automod_badwords(self, interaction: discord.Interaction, enabled: bool):
        self.set_guild_config(interaction.guild.id, "automod_badwords", enabled)
        status = "enabled" if enabled else "disabled"
        embed = discord.Embed(
            title="AutoMod — Bad Words Filter",
            description=f"Bad words filter has been **{status}**.\nOffending messages are deleted and the user is warned.",
            color=discord.Color.green() if enabled else discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="badwords-add", description="Add a word to the bad words list")
    @app_commands.describe(word="The word to add")
    @app_commands.checks.has_permissions(administrator=True)
    async def badwords_add(self, interaction: discord.Interaction, word: str):
        config = load_config()
        gid = str(interaction.guild.id)
        if gid not in config:
            config[gid] = {}
        words = config[gid].get("bad_words", list(DEFAULT_BAD_WORDS))
        if word.lower() not in words:
            words.append(word.lower())
            config[gid]["bad_words"] = words
            save_config(config)
        await interaction.response.send_message(f"Added `{word}` to the bad words list.", ephemeral=True)

    @app_commands.command(name="badwords-remove", description="Remove a word from the bad words list")
    @app_commands.describe(word="The word to remove")
    @app_commands.checks.has_permissions(administrator=True)
    async def badwords_remove(self, interaction: discord.Interaction, word: str):
        config = load_config()
        gid = str(interaction.guild.id)
        words = config.get(gid, {}).get("bad_words", list(DEFAULT_BAD_WORDS))
        if word.lower() in words:
            words.remove(word.lower())
            if gid not in config:
                config[gid] = {}
            config[gid]["bad_words"] = words
            save_config(config)
            await interaction.response.send_message(f"Removed `{word}` from the bad words list.", ephemeral=True)
        else:
            await interaction.response.send_message(f"`{word}` is not in the bad words list.", ephemeral=True)

    @app_commands.command(name="automod-status", description="Show current AutoMod settings for this server")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def automod_status(self, interaction: discord.Interaction):
        cfg = self.get_guild_config(interaction.guild.id)
        embed = discord.Embed(title="AutoMod Status", color=discord.Color.blurple())
        def status(key): return "✅ Enabled" if cfg.get(key) else "❌ Disabled"
        embed.add_field(name="Spam Detection", value=status("automod_spam"), inline=True)
        embed.add_field(name="Caps Filter", value=status("automod_caps"), inline=True)
        embed.add_field(name="Bad Words", value=status("automod_badwords"), inline=True)
        embed.add_field(name="Anti-Link", value=status("anti_link"), inline=True)
        embed.add_field(name="Anti-Nuke", value=status("anti_nuke"), inline=True)
        words = cfg.get("bad_words", DEFAULT_BAD_WORDS)
        embed.add_field(name="Bad Words Count", value=str(len(words)), inline=True)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        if message.author.guild_permissions.administrator:
            return
        cfg = self.get_guild_config(message.guild.id)
        now = time.time()

        if cfg.get("automod_spam"):
            guild_tracker = self.message_tracker[message.guild.id]
            guild_tracker[message.author.id] = [
                t for t in guild_tracker[message.author.id]
                if now - t < self.SPAM_WINDOW
            ]
            guild_tracker[message.author.id].append(now)
            if len(guild_tracker[message.author.id]) >= self.SPAM_LIMIT:
                try:
                    await message.channel.purge(
                        limit=self.SPAM_LIMIT + 1,
                        check=lambda m: m.author == message.author
                    )
                except discord.Forbidden:
                    pass
                warning_msg = await message.channel.send(
                    f"{message.author.mention}, please stop spamming.",
                    delete_after=5
                )
                await self.warn_member(message.guild, message.author, "Spam detected")
                guild_tracker[message.author.id].clear()
                return

        if cfg.get("automod_caps"):
            content = message.content
            if len(content) >= self.CAPS_MIN_LENGTH:
                alpha = [c for c in content if c.isalpha()]
                if alpha:
                    caps_ratio = sum(1 for c in alpha if c.isupper()) / len(alpha) * 100
                    if caps_ratio >= self.CAPS_THRESHOLD:
                        try:
                            await message.delete()
                            await message.channel.send(
                                f"{message.author.mention}, please don't use excessive caps.",
                                delete_after=5
                            )
                        except discord.Forbidden:
                            pass
                        return

        if cfg.get("automod_badwords"):
            bad_words = cfg.get("bad_words", DEFAULT_BAD_WORDS)
            content_lower = message.content.lower()
            if any(word in content_lower for word in bad_words):
                try:
                    await message.delete()
                    await message.channel.send(
                        f"{message.author.mention}, that language is not allowed here.",
                        delete_after=5
                    )
                except discord.Forbidden:
                    pass
                await self.warn_member(message.guild, message.author, "Bad language detected")

    @automod_spam.error
    @automod_caps.error
    @automod_badwords.error
    @badwords_add.error
    @badwords_remove.error
    @automod_status.error
    async def automod_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You need administrator permissions to manage AutoMod.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(AutoMod(bot))
