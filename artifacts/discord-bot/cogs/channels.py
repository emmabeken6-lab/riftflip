import discord
from discord import app_commands
from discord.ext import commands
import json
import os


JAILED_PATH = "data/jailed.json"


def load_jailed():
    with open(JAILED_PATH, "r") as f:
        return json.load(f)


def save_jailed(data):
    with open(JAILED_PATH, "w") as f:
        json.dump(data, f, indent=2)


class Channels(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    async def get_or_create_jail_role(self, guild: discord.Guild) -> discord.Role:
        role = discord.utils.get(guild.roles, name="Jailed")
        if not role:
            role = await guild.create_role(name="Jailed", color=discord.Color.dark_gray(), reason="Auto-created for jail system")
            for channel in guild.channels:
                try:
                    await channel.set_permissions(role, view_channel=False, send_messages=False, speak=False)
                except Exception:
                    pass
        return role

    async def get_or_create_jail_channel(self, guild: discord.Guild, jail_role: discord.Role) -> discord.TextChannel:
        channel = discord.utils.get(guild.text_channels, name="jail")
        if not channel:
            overwrites = {
                guild.default_role: discord.PermissionOverwrite(view_channel=False),
                jail_role: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
                guild.me: discord.PermissionOverwrite(view_channel=True, send_messages=True)
            }
            channel = await guild.create_text_channel("jail", overwrites=overwrites, reason="Auto-created for jail system")
        return channel

    @app_commands.command(name="lock", description="Lock the current channel (no one can send messages)")
    @app_commands.describe(channel="Channel to lock (defaults to current)", reason="Reason for locking")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def lock(self, interaction: discord.Interaction, channel: discord.TextChannel = None, reason: str = "No reason provided"):
        target = channel or interaction.channel
        overwrite = target.overwrites_for(interaction.guild.default_role)
        overwrite.send_messages = False
        await target.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"Locked by {interaction.user}: {reason}")
        embed = discord.Embed(title="Channel Locked", color=discord.Color.red())
        embed.add_field(name="Channel", value=target.mention, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await target.send(embed=discord.Embed(description="🔒 This channel has been locked.", color=discord.Color.red()))
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="unlock", description="Unlock the current channel")
    @app_commands.describe(channel="Channel to unlock (defaults to current)", reason="Reason for unlocking")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def unlock(self, interaction: discord.Interaction, channel: discord.TextChannel = None, reason: str = "No reason provided"):
        target = channel or interaction.channel
        overwrite = target.overwrites_for(interaction.guild.default_role)
        overwrite.send_messages = None
        await target.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"Unlocked by {interaction.user}: {reason}")
        embed = discord.Embed(title="Channel Unlocked", color=discord.Color.green())
        embed.add_field(name="Channel", value=target.mention, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await target.send(embed=discord.Embed(description="🔓 This channel has been unlocked.", color=discord.Color.green()))
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="purge", description="Bulk delete messages in the current channel")
    @app_commands.describe(amount="Number of messages to delete (1-100)")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def purge(self, interaction: discord.Interaction, amount: int):
        if amount < 1 or amount > 100:
            await interaction.response.send_message("Please provide a number between 1 and 100.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        deleted = await interaction.channel.purge(limit=amount)
        embed = discord.Embed(title="Messages Purged", color=discord.Color.blurple())
        embed.add_field(name="Deleted", value=str(len(deleted)), inline=True)
        embed.add_field(name="Channel", value=interaction.channel.mention, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        await interaction.followup.send(embed=embed, ephemeral=True)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="jail", description="Jail a member — restricts them to the jail channel")
    @app_commands.describe(member="The member to jail", reason="Reason for jailing")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def jail(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        await interaction.response.defer()
        if member.top_role >= interaction.user.top_role:
            await interaction.followup.send("You cannot jail someone with an equal or higher role.", ephemeral=True)
            return

        jailed_data = load_jailed()
        guild_id = str(interaction.guild.id)
        user_id = str(member.id)

        if guild_id in jailed_data and user_id in jailed_data[guild_id]:
            await interaction.followup.send(f"{member.mention} is already jailed.", ephemeral=True)
            return

        jail_role = await self.get_or_create_jail_role(interaction.guild)
        jail_channel = await self.get_or_create_jail_channel(interaction.guild, jail_role)

        saved_roles = [r.id for r in member.roles if r != interaction.guild.default_role and r.name != "Jailed"]

        try:
            roles_to_remove = [r for r in member.roles if r != interaction.guild.default_role and not r.managed]
            if roles_to_remove:
                await member.remove_roles(*roles_to_remove, reason=f"Jailed: {reason}")
        except discord.Forbidden:
            pass

        await member.add_roles(jail_role, reason=f"Jailed by {interaction.user}: {reason}")

        if guild_id not in jailed_data:
            jailed_data[guild_id] = {}
        jailed_data[guild_id][user_id] = {"roles": saved_roles, "reason": reason}
        save_jailed(jailed_data)

        embed = discord.Embed(title="Member Jailed", color=discord.Color.dark_red())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.followup.send(embed=embed)
        await jail_channel.send(f"{member.mention}, you have been jailed. Reason: {reason}")
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="unjail", description="Release a member from jail and restore their roles")
    @app_commands.describe(member="The member to unjail")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def unjail(self, interaction: discord.Interaction, member: discord.Member):
        await interaction.response.defer()
        jailed_data = load_jailed()
        guild_id = str(interaction.guild.id)
        user_id = str(member.id)

        if guild_id not in jailed_data or user_id not in jailed_data[guild_id]:
            await interaction.followup.send(f"{member.mention} is not currently jailed.", ephemeral=True)
            return

        jail_role = discord.utils.get(interaction.guild.roles, name="Jailed")
        if jail_role and jail_role in member.roles:
            await member.remove_roles(jail_role, reason=f"Unjailed by {interaction.user}")

        saved_role_ids = jailed_data[guild_id][user_id].get("roles", [])
        roles_to_restore = []
        for role_id in saved_role_ids:
            role = interaction.guild.get_role(role_id)
            if role and role != interaction.guild.default_role and not role.managed:
                roles_to_restore.append(role)

        if roles_to_restore:
            try:
                await member.add_roles(*roles_to_restore, reason=f"Unjailed by {interaction.user}")
            except discord.Forbidden:
                pass

        del jailed_data[guild_id][user_id]
        save_jailed(jailed_data)

        embed = discord.Embed(title="Member Unjailed", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Roles Restored", value=str(len(roles_to_restore)), inline=True)
        await interaction.followup.send(embed=embed)
        await self.log_action(interaction.guild, embed)

    @lock.error
    @unlock.error
    @purge.error
    @jail.error
    @unjail.error
    async def channel_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Channels(bot))
