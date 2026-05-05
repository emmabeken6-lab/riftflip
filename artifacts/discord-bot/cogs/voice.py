import discord
from discord import app_commands
from discord.ext import commands


class Voice(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    def require_voice(self, member: discord.Member):
        if not member.voice or not member.voice.channel:
            return False
        return True

    @app_commands.command(name="vmute", description="Server-mute a member in voice")
    @app_commands.describe(member="The member to mute", reason="Reason")
    @app_commands.checks.has_permissions(mute_members=True)
    async def vmute(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        if not self.require_voice(member):
            await interaction.response.send_message(f"{member.mention} is not in a voice channel.", ephemeral=True)
            return
        await member.edit(mute=True, reason=f"{reason} | By {interaction.user}")
        embed = discord.Embed(title="Voice Muted", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Channel", value=member.voice.channel.name, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="vunmute", description="Remove server-mute from a voice member")
    @app_commands.describe(member="The member to unmute")
    @app_commands.checks.has_permissions(mute_members=True)
    async def vunmute(self, interaction: discord.Interaction, member: discord.Member):
        if not self.require_voice(member):
            await interaction.response.send_message(f"{member.mention} is not in a voice channel.", ephemeral=True)
            return
        await member.edit(mute=False, reason=f"Voice unmuted by {interaction.user}")
        embed = discord.Embed(title="Voice Unmuted", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="deafen", description="Server-deafen a member in voice")
    @app_commands.describe(member="The member to deafen", reason="Reason")
    @app_commands.checks.has_permissions(deafen_members=True)
    async def deafen(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        if not self.require_voice(member):
            await interaction.response.send_message(f"{member.mention} is not in a voice channel.", ephemeral=True)
            return
        await member.edit(deafen=True, reason=f"{reason} | By {interaction.user}")
        embed = discord.Embed(title="Member Deafened", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Channel", value=member.voice.channel.name, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="undeafen", description="Remove server-deafen from a voice member")
    @app_commands.describe(member="The member to undeafen")
    @app_commands.checks.has_permissions(deafen_members=True)
    async def undeafen(self, interaction: discord.Interaction, member: discord.Member):
        if not self.require_voice(member):
            await interaction.response.send_message(f"{member.mention} is not in a voice channel.", ephemeral=True)
            return
        await member.edit(deafen=False, reason=f"Undeafened by {interaction.user}")
        embed = discord.Embed(title="Member Undeafened", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="vkick", description="Disconnect a member from their voice channel")
    @app_commands.describe(member="The member to disconnect", reason="Reason")
    @app_commands.checks.has_permissions(move_members=True)
    async def vkick(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        if not self.require_voice(member):
            await interaction.response.send_message(f"{member.mention} is not in a voice channel.", ephemeral=True)
            return
        channel_name = member.voice.channel.name
        await member.move_to(None, reason=f"{reason} | By {interaction.user}")
        embed = discord.Embed(title="Voice Kicked", color=discord.Color.red())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="From Channel", value=channel_name, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="move", description="Move a member to another voice channel")
    @app_commands.describe(member="The member to move", channel="The target voice channel", reason="Reason")
    @app_commands.checks.has_permissions(move_members=True)
    async def move(self, interaction: discord.Interaction, member: discord.Member, channel: discord.VoiceChannel, reason: str = "No reason provided"):
        if not self.require_voice(member):
            await interaction.response.send_message(f"{member.mention} is not in a voice channel.", ephemeral=True)
            return
        from_channel = member.voice.channel.name
        await member.move_to(channel, reason=f"{reason} | By {interaction.user}")
        embed = discord.Embed(title="Member Moved", color=discord.Color.blurple())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="From", value=from_channel, inline=True)
        embed.add_field(name="To", value=channel.name, inline=True)
        embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="vclock", description="Lock a voice channel (deny @everyone from joining)")
    @app_commands.describe(channel="The voice channel to lock")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def vclock(self, interaction: discord.Interaction, channel: discord.VoiceChannel):
        overwrite = channel.overwrites_for(interaction.guild.default_role)
        overwrite.connect = False
        await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"VC locked by {interaction.user}")
        embed = discord.Embed(
            title="Voice Channel Locked",
            description=f"**{channel.name}** is now locked. No one can join.",
            color=discord.Color.red()
        )
        embed.add_field(name="Moderator", value=str(interaction.user))
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="vcunlock", description="Unlock a locked voice channel")
    @app_commands.describe(channel="The voice channel to unlock")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def vcunlock(self, interaction: discord.Interaction, channel: discord.VoiceChannel):
        overwrite = channel.overwrites_for(interaction.guild.default_role)
        overwrite.connect = None
        await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"VC unlocked by {interaction.user}")
        embed = discord.Embed(
            title="Voice Channel Unlocked",
            description=f"**{channel.name}** is now unlocked.",
            color=discord.Color.green()
        )
        embed.add_field(name="Moderator", value=str(interaction.user))
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @vmute.error
    @vunmute.error
    @deafen.error
    @undeafen.error
    @vkick.error
    @move.error
    @vclock.error
    @vcunlock.error
    async def voice_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Voice(bot))
