import discord
from discord import app_commands
from discord.ext import commands
import asyncio
import json


class TempActions(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    def parse_duration(self, duration: str) -> int:
        """Parse duration string like '1h', '30m', '2d' into seconds."""
        units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        try:
            unit = duration[-1].lower()
            value = int(duration[:-1])
            return value * units.get(unit, 60)
        except (ValueError, IndexError):
            return 0

    def format_duration(self, seconds: int) -> str:
        if seconds >= 86400:
            return f"{seconds // 86400}d"
        elif seconds >= 3600:
            return f"{seconds // 3600}h"
        elif seconds >= 60:
            return f"{seconds // 60}m"
        return f"{seconds}s"

    @app_commands.command(name="tempban", description="Temporarily ban a member")
    @app_commands.describe(member="The member to tempban", duration="Duration e.g. 10m, 2h, 1d", reason="Reason", delete_days="Days of messages to delete (0-7)")
    @app_commands.checks.has_permissions(ban_members=True)
    async def tempban(self, interaction: discord.Interaction, member: discord.Member, duration: str, reason: str = "No reason provided", delete_days: int = 0):
        if member.top_role >= interaction.user.top_role:
            await interaction.response.send_message("You cannot tempban someone with an equal or higher role.", ephemeral=True)
            return
        seconds = self.parse_duration(duration)
        if seconds <= 0:
            await interaction.response.send_message("Invalid duration. Use format like `10m`, `2h`, `1d`.", ephemeral=True)
            return
        user_id = member.id
        guild_id = interaction.guild.id
        await member.ban(reason=f"[Tempban {duration}] {reason} | By {interaction.user}", delete_message_days=min(delete_days, 7))
        embed = discord.Embed(title="Member Tempbanned", color=discord.Color.red())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Duration", value=duration, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)
        await asyncio.sleep(seconds)
        guild = self.bot.get_guild(guild_id)
        if guild:
            try:
                user = await self.bot.fetch_user(user_id)
                await guild.unban(user, reason=f"Tempban expired ({duration})")
                unban_embed = discord.Embed(
                    title="Tempban Expired",
                    description=f"{user} has been automatically unbanned after {duration}.",
                    color=discord.Color.green()
                )
                await self.log_action(guild, unban_embed)
            except Exception:
                pass

    @app_commands.command(name="softban", description="Ban and immediately unban to delete messages without removing the member")
    @app_commands.describe(member="The member to softban", reason="Reason", delete_days="Days of messages to delete (1-7)")
    @app_commands.checks.has_permissions(ban_members=True)
    async def softban(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided", delete_days: int = 1):
        if member.top_role >= interaction.user.top_role:
            await interaction.response.send_message("You cannot softban someone with an equal or higher role.", ephemeral=True)
            return
        delete_days = max(1, min(delete_days, 7))
        await member.ban(reason=f"[Softban] {reason} | By {interaction.user}", delete_message_days=delete_days)
        await interaction.guild.unban(member, reason=f"[Softban unban] {reason}")
        embed = discord.Embed(title="Member Softbanned", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Messages Deleted", value=f"{delete_days} day(s)", inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="unban", description="Unban a user by their ID or username")
    @app_commands.describe(user_id="The user's ID to unban", reason="Reason for unbanning")
    @app_commands.checks.has_permissions(ban_members=True)
    async def unban(self, interaction: discord.Interaction, user_id: str, reason: str = "No reason provided"):
        try:
            uid = int(user_id)
        except ValueError:
            await interaction.response.send_message("Please provide a valid user ID.", ephemeral=True)
            return
        try:
            user = await self.bot.fetch_user(uid)
            await interaction.guild.unban(user, reason=f"{reason} | By {interaction.user}")
            embed = discord.Embed(title="User Unbanned", color=discord.Color.green())
            embed.add_field(name="User", value=str(user), inline=True)
            embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
            embed.add_field(name="Reason", value=reason, inline=False)
            await interaction.response.send_message(embed=embed)
            await self.log_action(interaction.guild, embed)
        except discord.NotFound:
            await interaction.response.send_message("User not found or is not banned.", ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message("I don't have permission to unban members.", ephemeral=True)

    @app_commands.command(name="banlist", description="Show the list of banned users")
    @app_commands.checks.has_permissions(ban_members=True)
    async def banlist(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        bans = [entry async for entry in interaction.guild.bans()]
        if not bans:
            await interaction.followup.send("No banned users.", ephemeral=True)
            return
        pages = []
        per_page = 15
        for i in range(0, len(bans), per_page):
            chunk = bans[i:i+per_page]
            desc = "\n".join(f"• `{b.user.id}` — **{b.user}** ({b.reason or 'No reason'})" for b in chunk)
            pages.append(desc)
        embed = discord.Embed(
            title=f"Banned Users ({len(bans)} total)",
            description=pages[0],
            color=discord.Color.red()
        )
        if len(pages) > 1:
            embed.set_footer(text=f"Showing 1/{len(pages)} pages")
        await interaction.followup.send(embed=embed, ephemeral=True)

    @app_commands.command(name="massban", description="Ban multiple users by their IDs (space-separated)")
    @app_commands.describe(user_ids="Space-separated user IDs", reason="Reason for mass ban")
    @app_commands.checks.has_permissions(ban_members=True, administrator=True)
    async def massban(self, interaction: discord.Interaction, user_ids: str, reason: str = "Mass ban"):
        await interaction.response.defer()
        ids = user_ids.strip().split()
        banned = []
        failed = []
        for uid in ids:
            try:
                user = await self.bot.fetch_user(int(uid))
                await interaction.guild.ban(user, reason=f"{reason} | By {interaction.user}")
                banned.append(str(user))
            except Exception:
                failed.append(uid)
        embed = discord.Embed(title="Mass Ban Complete", color=discord.Color.dark_red())
        embed.add_field(name="Banned", value=str(len(banned)), inline=True)
        embed.add_field(name="Failed", value=str(len(failed)), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        if banned:
            embed.add_field(name="Users Banned", value="\n".join(banned[:10]) + (" ..." if len(banned) > 10 else ""), inline=False)
        await interaction.followup.send(embed=embed)
        await self.log_action(interaction.guild, embed)

    @tempban.error
    @softban.error
    @unban.error
    @banlist.error
    @massban.error
    async def temp_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(TempActions(bot))
