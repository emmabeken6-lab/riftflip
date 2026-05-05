import discord
from discord import app_commands
from discord.ext import commands
import json
import os
from datetime import timedelta


DATA_PATH = "data/warnings.json"


def load_warnings():
    with open(DATA_PATH, "r") as f:
        return json.load(f)


def save_warnings(data):
    with open(DATA_PATH, "w") as f:
        json.dump(data, f, indent=2)


def has_mod_role():
    async def predicate(interaction: discord.Interaction):
        if interaction.user.guild_permissions.administrator:
            return True
        mod_roles = ["Moderator", "Admin", "Staff", "Mod"]
        return any(r.name in mod_roles for r in interaction.user.roles)
    return app_commands.check(predicate)


class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    @app_commands.command(name="ban", description="Ban a member from the server")
    @app_commands.describe(member="The member to ban", reason="Reason for the ban", delete_days="Days of messages to delete (0-7)")
    @app_commands.checks.has_permissions(ban_members=True)
    async def ban(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided", delete_days: int = 0):
        if member.top_role >= interaction.user.top_role:
            await interaction.response.send_message("You cannot ban someone with an equal or higher role.", ephemeral=True)
            return
        await member.ban(reason=f"{reason} | Banned by {interaction.user}", delete_message_days=min(delete_days, 7))
        embed = discord.Embed(title="Member Banned", color=discord.Color.red())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="kick", description="Kick a member from the server")
    @app_commands.describe(member="The member to kick", reason="Reason for the kick")
    @app_commands.checks.has_permissions(kick_members=True)
    async def kick(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        if member.top_role >= interaction.user.top_role:
            await interaction.response.send_message("You cannot kick someone with an equal or higher role.", ephemeral=True)
            return
        await member.kick(reason=f"{reason} | Kicked by {interaction.user}")
        embed = discord.Embed(title="Member Kicked", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="warn", description="Warn a member")
    @app_commands.describe(member="The member to warn", reason="Reason for the warning")
    @app_commands.checks.has_permissions(kick_members=True)
    async def warn(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        warnings = load_warnings()
        guild_id = str(interaction.guild.id)
        user_id = str(member.id)
        if guild_id not in warnings:
            warnings[guild_id] = {}
        if user_id not in warnings[guild_id]:
            warnings[guild_id][user_id] = []
        warnings[guild_id][user_id].append({
            "reason": reason,
            "moderator": str(interaction.user),
            "moderator_id": str(interaction.user.id)
        })
        save_warnings(warnings)
        count = len(warnings[guild_id][user_id])
        embed = discord.Embed(title="Member Warned", color=discord.Color.yellow())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        embed.add_field(name="Total Warnings", value=str(count), inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)
        try:
            await member.send(f"You have been warned in **{interaction.guild.name}**.\nReason: {reason}\nTotal warnings: {count}")
        except discord.Forbidden:
            pass

    @app_commands.command(name="warnings", description="View warnings for a member")
    @app_commands.describe(member="The member to check warnings for")
    @app_commands.checks.has_permissions(kick_members=True)
    async def warnings(self, interaction: discord.Interaction, member: discord.Member):
        warnings = load_warnings()
        guild_id = str(interaction.guild.id)
        user_id = str(member.id)
        user_warnings = warnings.get(guild_id, {}).get(user_id, [])
        if not user_warnings:
            await interaction.response.send_message(f"{member.mention} has no warnings.", ephemeral=True)
            return
        embed = discord.Embed(title=f"Warnings for {member}", color=discord.Color.yellow())
        for i, w in enumerate(user_warnings, 1):
            embed.add_field(
                name=f"Warning #{i}",
                value=f"Reason: {w['reason']}\nBy: {w['moderator']}",
                inline=False
            )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="clearwarnings", description="Clear all warnings for a member")
    @app_commands.describe(member="The member to clear warnings for")
    @app_commands.checks.has_permissions(administrator=True)
    async def clearwarnings(self, interaction: discord.Interaction, member: discord.Member):
        warnings = load_warnings()
        guild_id = str(interaction.guild.id)
        user_id = str(member.id)
        if guild_id in warnings and user_id in warnings[guild_id]:
            warnings[guild_id][user_id] = []
            save_warnings(warnings)
        await interaction.response.send_message(f"Cleared all warnings for {member.mention}.", ephemeral=True)

    @app_commands.command(name="mute", description="Mute a member using a Muted role")
    @app_commands.describe(member="The member to mute", reason="Reason for the mute")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def mute(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        await interaction.response.defer()
        muted_role = discord.utils.get(interaction.guild.roles, name="Muted")
        if not muted_role:
            muted_role = await interaction.guild.create_role(name="Muted", reason="Auto-created for mute command")
            for channel in interaction.guild.channels:
                try:
                    await channel.set_permissions(muted_role, send_messages=False, speak=False, add_reactions=False)
                except Exception:
                    pass
        if muted_role in member.roles:
            await interaction.followup.send(f"{member.mention} is already muted.", ephemeral=True)
            return
        await member.add_roles(muted_role, reason=f"{reason} | Muted by {interaction.user}")
        embed = discord.Embed(title="Member Muted", color=discord.Color.dark_gray())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.followup.send(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="unmute", description="Unmute a member")
    @app_commands.describe(member="The member to unmute")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def unmute(self, interaction: discord.Interaction, member: discord.Member):
        muted_role = discord.utils.get(interaction.guild.roles, name="Muted")
        if not muted_role or muted_role not in member.roles:
            await interaction.response.send_message(f"{member.mention} is not muted.", ephemeral=True)
            return
        await member.remove_roles(muted_role, reason=f"Unmuted by {interaction.user}")
        embed = discord.Embed(title="Member Unmuted", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="timeout", description="Timeout a member (Discord built-in)")
    @app_commands.describe(member="The member to timeout", minutes="Duration in minutes (max 40320)", reason="Reason for the timeout")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def timeout(self, interaction: discord.Interaction, member: discord.Member, minutes: int = 10, reason: str = "No reason provided"):
        if member.top_role >= interaction.user.top_role:
            await interaction.response.send_message("You cannot timeout someone with an equal or higher role.", ephemeral=True)
            return
        duration = timedelta(minutes=min(minutes, 40320))
        await member.timeout(duration, reason=f"{reason} | By {interaction.user}")
        embed = discord.Embed(title="Member Timed Out", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Duration", value=f"{minutes} minutes", inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="untimeout", description="Remove timeout from a member")
    @app_commands.describe(member="The member to remove timeout from")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def untimeout(self, interaction: discord.Interaction, member: discord.Member):
        await member.timeout(None, reason=f"Timeout removed by {interaction.user}")
        embed = discord.Embed(title="Timeout Removed", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="role", description="Add or remove a role from a member")
    @app_commands.describe(member="The member", role="The role to add or remove", action="add or remove")
    @app_commands.choices(action=[
        app_commands.Choice(name="add", value="add"),
        app_commands.Choice(name="remove", value="remove"),
    ])
    @app_commands.checks.has_permissions(manage_roles=True)
    async def role(self, interaction: discord.Interaction, member: discord.Member, role: discord.Role, action: str = "add"):
        if role >= interaction.user.top_role:
            await interaction.response.send_message("You cannot assign a role equal to or higher than your own.", ephemeral=True)
            return
        if action == "add":
            if role in member.roles:
                await interaction.response.send_message(f"{member.mention} already has {role.mention}.", ephemeral=True)
                return
            await member.add_roles(role, reason=f"Role added by {interaction.user}")
            await interaction.response.send_message(f"Added {role.mention} to {member.mention}.")
        else:
            if role not in member.roles:
                await interaction.response.send_message(f"{member.mention} does not have {role.mention}.", ephemeral=True)
                return
            await member.remove_roles(role, reason=f"Role removed by {interaction.user}")
            await interaction.response.send_message(f"Removed {role.mention} from {member.mention}.")

    @ban.error
    @kick.error
    @warn.error
    @mute.error
    @timeout.error
    @role.error
    async def permission_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
