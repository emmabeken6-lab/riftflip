import discord
from discord import app_commands
from discord.ext import commands
import json
import re
import time
import os
from collections import defaultdict


CONFIG_PATH = "data/config.json"

URL_PATTERN = re.compile(
    r"(https?://[^\s]+|discord\.gg/[^\s]+|www\.[^\s]+\.[a-z]{2,})",
    re.IGNORECASE
)

NUKE_WINDOW = 10
NUKE_BAN_THRESHOLD = 3
NUKE_CHANNEL_DELETE_THRESHOLD = 3
NUKE_ROLE_DELETE_THRESHOLD = 3


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


class Security(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.ban_tracker: dict[int, list[float]] = defaultdict(list)
        self.channel_delete_tracker: dict[int, list[float]] = defaultdict(list)
        self.role_delete_tracker: dict[int, list[float]] = defaultdict(list)
        self.nuke_punished: set[int] = set()

    def get_guild_config(self, guild_id: int) -> dict:
        config = load_config()
        return config.get(str(guild_id), {})

    def set_guild_config(self, guild_id: int, key: str, value):
        config = load_config()
        gid = str(guild_id)
        if gid not in config:
            config[gid] = {}
        config[gid][key] = value
        save_config(config)

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    @app_commands.command(name="anti-link", description="Toggle anti-link protection (auto-delete links)")
    @app_commands.describe(enabled="Enable or disable anti-link")
    @app_commands.checks.has_permissions(administrator=True)
    async def anti_link(self, interaction: discord.Interaction, enabled: bool):
        self.set_guild_config(interaction.guild.id, "anti_link", enabled)
        status = "enabled" if enabled else "disabled"
        embed = discord.Embed(
            title="Anti-Link Protection",
            description=f"Anti-link has been **{status}**.",
            color=discord.Color.green() if enabled else discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="anti-nuke", description="Toggle anti-nuke protection")
    @app_commands.describe(enabled="Enable or disable anti-nuke")
    @app_commands.checks.has_permissions(administrator=True)
    async def anti_nuke(self, interaction: discord.Interaction, enabled: bool):
        self.set_guild_config(interaction.guild.id, "anti_nuke", enabled)
        status = "enabled" if enabled else "disabled"
        embed = discord.Embed(
            title="Anti-Nuke Protection",
            description=f"Anti-nuke has been **{status}**.\n\nThis monitors:\n- Mass bans (>{NUKE_BAN_THRESHOLD} in {NUKE_WINDOW}s)\n- Mass channel deletions (>{NUKE_CHANNEL_DELETE_THRESHOLD} in {NUKE_WINDOW}s)\n- Mass role deletions (>{NUKE_ROLE_DELETE_THRESHOLD} in {NUKE_WINDOW}s)",
            color=discord.Color.green() if enabled else discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        if message.author.guild_permissions.administrator:
            return
        config = self.get_guild_config(message.guild.id)
        if not config.get("anti_link", False):
            return
        if URL_PATTERN.search(message.content):
            try:
                await message.delete()
                warning = await message.channel.send(
                    f"{message.author.mention}, links are not allowed in this server.",
                    delete_after=5
                )
            except discord.Forbidden:
                pass

    @commands.Cog.listener()
    async def on_member_ban(self, guild: discord.Guild, user: discord.User):
        config = self.get_guild_config(guild.id)
        if not config.get("anti_nuke", False):
            return
        now = time.time()
        self.ban_tracker[guild.id] = [t for t in self.ban_tracker[guild.id] if now - t < NUKE_WINDOW]
        self.ban_tracker[guild.id].append(now)
        if len(self.ban_tracker[guild.id]) >= NUKE_BAN_THRESHOLD:
            await self._handle_nuke(guild, "mass ban detected")
            self.ban_tracker[guild.id].clear()

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        guild = channel.guild
        config = self.get_guild_config(guild.id)
        if not config.get("anti_nuke", False):
            return
        now = time.time()
        self.channel_delete_tracker[guild.id] = [t for t in self.channel_delete_tracker[guild.id] if now - t < NUKE_WINDOW]
        self.channel_delete_tracker[guild.id].append(now)
        if len(self.channel_delete_tracker[guild.id]) >= NUKE_CHANNEL_DELETE_THRESHOLD:
            await self._handle_nuke(guild, "mass channel deletion detected")
            self.channel_delete_tracker[guild.id].clear()

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        guild = role.guild
        config = self.get_guild_config(guild.id)
        if not config.get("anti_nuke", False):
            return
        now = time.time()
        self.role_delete_tracker[guild.id] = [t for t in self.role_delete_tracker[guild.id] if now - t < NUKE_WINDOW]
        self.role_delete_tracker[guild.id].append(now)
        if len(self.role_delete_tracker[guild.id]) >= NUKE_ROLE_DELETE_THRESHOLD:
            await self._handle_nuke(guild, "mass role deletion detected")
            self.role_delete_tracker[guild.id].clear()

    async def _handle_nuke(self, guild: discord.Guild, reason: str):
        if guild.id in self.nuke_punished:
            return
        self.nuke_punished.add(guild.id)

        try:
            entry = None
            async for log_entry in guild.audit_logs(limit=5, action=discord.AuditLogAction.ban):
                entry = log_entry
                break
            if not entry:
                async for log_entry in guild.audit_logs(limit=5, action=discord.AuditLogAction.channel_delete):
                    entry = log_entry
                    break
            if not entry:
                async for log_entry in guild.audit_logs(limit=5, action=discord.AuditLogAction.role_delete):
                    entry = log_entry
                    break

            embed = discord.Embed(
                title="ANTI-NUKE TRIGGERED",
                description=f"**Reason:** {reason}\n**Action:** Server locked down.",
                color=discord.Color.dark_red()
            )

            if entry and entry.user:
                nuker = entry.user
                if nuker != guild.owner and not nuker.bot:
                    try:
                        await guild.ban(nuker, reason=f"Anti-nuke: {reason}")
                        embed.add_field(name="Banned", value=str(nuker), inline=False)
                    except Exception:
                        pass

            log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
            if log_channel:
                await log_channel.send(embed=embed)

        except Exception as e:
            print(f"Anti-nuke handler error: {e}")
        finally:
            self.nuke_punished.discard(guild.id)

    @anti_link.error
    @anti_nuke.error
    async def security_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You need administrator permissions to use this command.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Security(bot))
