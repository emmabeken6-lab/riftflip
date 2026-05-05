import discord
from discord import app_commands
from discord.ext import commands
import json
import random
import time
from typing import Optional


LEVELS_PATH = "data/levels.json"
XP_COOLDOWN = 60
XP_MIN = 15
XP_MAX = 25


def load_levels():
    try:
        with open(LEVELS_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def save_levels(data):
    with open(LEVELS_PATH, "w") as f:
        json.dump(data, f, indent=2)


def xp_for_level(level: int) -> int:
    return 5 * (level ** 2) + 50 * level + 100


def total_xp_for_level(level: int) -> int:
    return sum(xp_for_level(l) for l in range(level))


def level_from_xp(xp: int) -> int:
    level = 0
    while xp >= xp_for_level(level):
        xp -= xp_for_level(level)
        level += 1
    return level


def xp_progress(total_xp: int) -> tuple[int, int, int]:
    level = level_from_xp(total_xp)
    spent = total_xp_for_level(level)
    current_xp = total_xp - spent
    needed = xp_for_level(level)
    return level, current_xp, needed


def make_progress_bar(current: int, total: int, length: int = 12) -> str:
    filled = int((current / total) * length)
    bar = "█" * filled + "░" * (length - filled)
    return f"[{bar}]"


class Leveling(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._cooldowns: dict[tuple[int, int], float] = {}

    def get_config(self, guild_id: int) -> dict:
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
            return config.get(str(guild_id), {})
        except Exception:
            return {}

    def set_config_key(self, guild_id: int, key: str, value):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        gid = str(guild_id)
        if gid not in config:
            config[gid] = {}
        config[gid][key] = value
        with open("data/config.json", "w") as f:
            json.dump(config, f, indent=2)

    def get_user_data(self, levels: dict, guild_id: str, user_id: str) -> dict:
        return levels.get(guild_id, {}).get(user_id, {"xp": 0, "messages": 0})

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        guild_id = str(message.guild.id)
        user_id = str(message.author.id)
        key = (message.guild.id, message.author.id)
        now = time.time()
        if now - self._cooldowns.get(key, 0) < XP_COOLDOWN:
            return
        self._cooldowns[key] = now
        xp_gain = random.randint(XP_MIN, XP_MAX)
        levels = load_levels()
        if guild_id not in levels:
            levels[guild_id] = {}
        if user_id not in levels[guild_id]:
            levels[guild_id][user_id] = {"xp": 0, "messages": 0}
        old_xp = levels[guild_id][user_id]["xp"]
        levels[guild_id][user_id]["xp"] += xp_gain
        levels[guild_id][user_id]["messages"] = levels[guild_id][user_id].get("messages", 0) + 1
        new_xp = levels[guild_id][user_id]["xp"]
        save_levels(levels)
        old_level = level_from_xp(old_xp)
        new_level = level_from_xp(new_xp)
        if new_level > old_level:
            config = self.get_config(message.guild.id)
            level_channel_id = config.get("level_channel")
            channel = message.guild.get_channel(level_channel_id) if level_channel_id else message.channel
            embed = discord.Embed(
                title="Level Up!",
                description=f"🎉 {message.author.mention} reached **Level {new_level}**!",
                color=discord.Color.gold()
            )
            embed.set_thumbnail(url=message.author.display_avatar.url)
            if channel:
                await channel.send(embed=embed)
            level_roles = config.get("level_roles", {})
            role_id = level_roles.get(str(new_level))
            if role_id:
                role = message.guild.get_role(int(role_id))
                if role:
                    try:
                        await message.author.add_roles(role, reason=f"Reached level {new_level}")
                    except Exception:
                        pass

    @app_commands.command(name="rank", description="Check your level and XP")
    @app_commands.describe(member="Member to check (defaults to yourself)")
    async def rank(self, interaction: discord.Interaction, member: discord.Member = None):
        member = member or interaction.user
        levels = load_levels()
        guild_id = str(interaction.guild.id)
        user_id = str(member.id)
        data = self.get_user_data(levels, guild_id, user_id)
        total_xp = data["xp"]
        level, current_xp, needed_xp = xp_progress(total_xp)
        guild_data = levels.get(guild_id, {})
        sorted_users = sorted(guild_data.items(), key=lambda x: x[1].get("xp", 0), reverse=True)
        rank = next((i + 1 for i, (uid, _) in enumerate(sorted_users) if uid == user_id), len(sorted_users))
        bar = make_progress_bar(current_xp, needed_xp)
        embed = discord.Embed(title=f"{member.display_name}'s Rank", color=member.color)
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Level", value=str(level), inline=True)
        embed.add_field(name="Server Rank", value=f"#{rank}", inline=True)
        embed.add_field(name="Total XP", value=f"{total_xp:,}", inline=True)
        embed.add_field(name="Messages", value=f"{data.get('messages', 0):,}", inline=True)
        embed.add_field(name="Progress", value=f"{bar}\n{current_xp:,} / {needed_xp:,} XP", inline=False)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="leaderboard", description="Show the XP leaderboard for this server")
    async def leaderboard(self, interaction: discord.Interaction):
        levels = load_levels()
        guild_data = levels.get(str(interaction.guild.id), {})
        if not guild_data:
            await interaction.response.send_message("No XP data yet — start chatting!", ephemeral=True)
            return
        sorted_users = sorted(guild_data.items(), key=lambda x: x[1].get("xp", 0), reverse=True)[:10]
        embed = discord.Embed(title=f"{interaction.guild.name} — XP Leaderboard", color=discord.Color.gold())
        medals = ["🥇", "🥈", "🥉"]
        entries = []
        for i, (user_id, data) in enumerate(sorted_users):
            member = interaction.guild.get_member(int(user_id))
            name = member.display_name if member else f"User {user_id}"
            xp = data.get("xp", 0)
            level = level_from_xp(xp)
            medal = medals[i] if i < 3 else f"`{i+1}.`"
            entries.append(f"{medal} **{name}** — Level {level} ({xp:,} XP)")
        embed.description = "\n".join(entries)
        embed.set_footer(text="XP earned by chatting | 15-25 XP per minute")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="setxp", description="Set a member's XP (Admin only)")
    @app_commands.describe(member="The member", xp="XP amount to set")
    @app_commands.checks.has_permissions(administrator=True)
    async def setxp(self, interaction: discord.Interaction, member: discord.Member, xp: int):
        if xp < 0:
            await interaction.response.send_message("XP cannot be negative.", ephemeral=True)
            return
        levels = load_levels()
        gid = str(interaction.guild.id)
        uid = str(member.id)
        if gid not in levels:
            levels[gid] = {}
        if uid not in levels[gid]:
            levels[gid][uid] = {"xp": 0, "messages": 0}
        levels[gid][uid]["xp"] = xp
        save_levels(levels)
        level = level_from_xp(xp)
        embed = discord.Embed(description=f"Set {member.mention}'s XP to **{xp:,}** (Level {level}).", color=discord.Color.green())
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="resetxp", description="Reset a member's XP and level (Admin only)")
    @app_commands.describe(member="The member to reset (leave empty to reset the entire server)")
    @app_commands.checks.has_permissions(administrator=True)
    async def resetxp(self, interaction: discord.Interaction, member: discord.Member = None):
        levels = load_levels()
        gid = str(interaction.guild.id)
        if member:
            if gid in levels and str(member.id) in levels[gid]:
                del levels[gid][str(member.id)]
            save_levels(levels)
            await interaction.response.send_message(f"Reset {member.mention}'s XP.", ephemeral=True)
        else:
            levels[gid] = {}
            save_levels(levels)
            await interaction.response.send_message("Reset all XP for this server.", ephemeral=True)

    @app_commands.command(name="level-channel", description="Set the channel where level-up messages are sent")
    @app_commands.describe(channel="The channel (leave empty to use message channel)")
    @app_commands.checks.has_permissions(administrator=True)
    async def level_channel(self, interaction: discord.Interaction, channel: discord.TextChannel = None):
        self.set_config_key(interaction.guild.id, "level_channel", channel.id if channel else None)
        if channel:
            await interaction.response.send_message(f"Level-up messages will be sent to {channel.mention}.")
        else:
            await interaction.response.send_message("Level-up messages will be sent in the same channel as the message.")

    @app_commands.command(name="level-role", description="Give a role when a member reaches a specific level")
    @app_commands.describe(level="The level number", role="The role to give")
    @app_commands.checks.has_permissions(administrator=True)
    async def level_role(self, interaction: discord.Interaction, level: int, role: discord.Role):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        gid = str(interaction.guild.id)
        if gid not in config:
            config[gid] = {}
        if "level_roles" not in config[gid]:
            config[gid]["level_roles"] = {}
        config[gid]["level_roles"][str(level)] = role.id
        with open("data/config.json", "w") as f:
            json.dump(config, f, indent=2)
        await interaction.response.send_message(f"Members who reach **Level {level}** will receive {role.mention}.")

    @app_commands.command(name="level-role-remove", description="Remove a level role reward")
    @app_commands.describe(level="The level to remove the reward from")
    @app_commands.checks.has_permissions(administrator=True)
    async def level_role_remove(self, interaction: discord.Interaction, level: int):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        gid = str(interaction.guild.id)
        level_roles = config.get(gid, {}).get("level_roles", {})
        if str(level) in level_roles:
            del level_roles[str(level)]
            config[gid]["level_roles"] = level_roles
            with open("data/config.json", "w") as f:
                json.dump(config, f, indent=2)
            await interaction.response.send_message(f"Removed level {level} role reward.")
        else:
            await interaction.response.send_message(f"No role set for level {level}.", ephemeral=True)

    @rank.error
    @leaderboard.error
    @setxp.error
    @resetxp.error
    async def level_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You don't have permission for that.", ephemeral=True)
        else:
            await interaction.response.send_message(f"Error: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Leveling(bot))
