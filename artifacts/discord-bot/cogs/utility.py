import discord
from discord import app_commands
from discord.ext import commands
import json
import asyncio


CONFIG_PATH = "data/config.json"


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


class Utility(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    @app_commands.command(name="slowmode", description="Set the slowmode delay for a channel")
    @app_commands.describe(seconds="Slowmode delay in seconds (0 to disable, max 21600)", channel="Channel to apply to (defaults to current)")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def slowmode(self, interaction: discord.Interaction, seconds: int, channel: discord.TextChannel = None):
        if seconds < 0 or seconds > 21600:
            await interaction.response.send_message("Seconds must be between 0 and 21600 (6 hours).", ephemeral=True)
            return
        target = channel or interaction.channel
        await target.edit(slowmode_delay=seconds)
        if seconds == 0:
            desc = f"Slowmode disabled in {target.mention}."
        else:
            desc = f"Slowmode set to **{seconds}s** in {target.mention}."
        embed = discord.Embed(description=desc, color=discord.Color.blurple())
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, discord.Embed(
            title="Slowmode Updated",
            description=desc,
            color=discord.Color.blurple()
        ).add_field(name="Moderator", value=str(interaction.user)))

    @app_commands.command(name="nickname", description="Change a member's nickname")
    @app_commands.describe(member="The member", nickname="New nickname (leave empty to reset)")
    @app_commands.checks.has_permissions(manage_nicknames=True)
    async def nickname(self, interaction: discord.Interaction, member: discord.Member, nickname: str = None):
        if member.top_role >= interaction.user.top_role and interaction.user != interaction.guild.owner:
            await interaction.response.send_message("You cannot change the nickname of someone with an equal or higher role.", ephemeral=True)
            return
        old_nick = member.display_name
        await member.edit(nick=nickname, reason=f"Nickname changed by {interaction.user}")
        embed = discord.Embed(title="Nickname Changed", color=discord.Color.blurple())
        embed.add_field(name="Member", value=str(member), inline=True)
        embed.add_field(name="Old Nickname", value=old_nick, inline=True)
        embed.add_field(name="New Nickname", value=nickname or member.name, inline=True)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="hide", description="Hide a channel from @everyone")
    @app_commands.describe(channel="Channel to hide (defaults to current)", reason="Reason")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def hide(self, interaction: discord.Interaction, channel: discord.TextChannel = None, reason: str = "No reason provided"):
        target = channel or interaction.channel
        overwrite = target.overwrites_for(interaction.guild.default_role)
        overwrite.view_channel = False
        await target.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"Hidden by {interaction.user}: {reason}")
        embed = discord.Embed(title="Channel Hidden", description=f"{target.mention} is now hidden from @everyone.", color=discord.Color.dark_gray())
        embed.add_field(name="Moderator", value=str(interaction.user))
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="show", description="Make a hidden channel visible to @everyone")
    @app_commands.describe(channel="Channel to show (defaults to current)", reason="Reason")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def show(self, interaction: discord.Interaction, channel: discord.TextChannel = None, reason: str = "No reason provided"):
        target = channel or interaction.channel
        overwrite = target.overwrites_for(interaction.guild.default_role)
        overwrite.view_channel = None
        await target.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"Shown by {interaction.user}: {reason}")
        embed = discord.Embed(title="Channel Visible", description=f"{target.mention} is now visible to @everyone.", color=discord.Color.green())
        embed.add_field(name="Moderator", value=str(interaction.user))
        await interaction.response.send_message(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="nuke", description="Wipe a channel by cloning it and deleting the original")
    @app_commands.describe(channel="Channel to nuke (defaults to current)", reason="Reason")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def nuke(self, interaction: discord.Interaction, channel: discord.TextChannel = None, reason: str = "No reason provided"):
        target = channel or interaction.channel
        await interaction.response.send_message(f"Nuking {target.mention}...", ephemeral=True)
        new_channel = await target.clone(reason=f"Nuked by {interaction.user}: {reason}")
        await new_channel.edit(position=target.position)
        await target.delete(reason=f"Nuked by {interaction.user}")
        embed = discord.Embed(
            title="Channel Nuked",
            description=f"This channel was wiped by {interaction.user.mention}.",
            color=discord.Color.red()
        )
        await new_channel.send(embed=embed)
        log_embed = discord.Embed(title="Channel Nuked", color=discord.Color.red())
        log_embed.add_field(name="Channel", value=f"#{target.name}", inline=True)
        log_embed.add_field(name="Moderator", value=str(interaction.user), inline=True)
        log_embed.add_field(name="Reason", value=reason, inline=False)
        await self.log_action(interaction.guild, log_embed)

    @app_commands.command(name="serverlock", description="Lock ALL channels in the server (emergency lockdown)")
    @app_commands.describe(reason="Reason for lockdown")
    @app_commands.checks.has_permissions(administrator=True)
    async def serverlock(self, interaction: discord.Interaction, reason: str = "Emergency lockdown"):
        await interaction.response.defer()
        locked = 0
        for channel in interaction.guild.text_channels:
            try:
                overwrite = channel.overwrites_for(interaction.guild.default_role)
                if overwrite.send_messages is not False:
                    overwrite.send_messages = False
                    await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"Server lockdown by {interaction.user}")
                    locked += 1
            except Exception:
                pass
        embed = discord.Embed(
            title="Server Lockdown Active",
            description=f"**{locked}** channels have been locked.\nReason: {reason}",
            color=discord.Color.dark_red()
        )
        embed.add_field(name="Moderator", value=str(interaction.user))
        await interaction.followup.send(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="serverunlock", description="Unlock ALL channels after a lockdown")
    @app_commands.describe(reason="Reason for unlocking")
    @app_commands.checks.has_permissions(administrator=True)
    async def serverunlock(self, interaction: discord.Interaction, reason: str = "Lockdown lifted"):
        await interaction.response.defer()
        unlocked = 0
        for channel in interaction.guild.text_channels:
            try:
                overwrite = channel.overwrites_for(interaction.guild.default_role)
                if overwrite.send_messages is False:
                    overwrite.send_messages = None
                    await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite, reason=f"Lockdown lifted by {interaction.user}")
                    unlocked += 1
            except Exception:
                pass
        embed = discord.Embed(
            title="Server Lockdown Lifted",
            description=f"**{unlocked}** channels have been unlocked.\nReason: {reason}",
            color=discord.Color.green()
        )
        embed.add_field(name="Moderator", value=str(interaction.user))
        await interaction.followup.send(embed=embed)
        await self.log_action(interaction.guild, embed)

    @app_commands.command(name="announce", description="Send an announcement embed to a channel")
    @app_commands.describe(channel="Channel to send to", title="Announcement title", message="Announcement body", color="Embed color: red/green/blue/yellow/purple/orange (default blue)", ping_everyone="Whether to @everyone ping")
    @app_commands.choices(color=[
        app_commands.Choice(name="blue", value="blue"),
        app_commands.Choice(name="green", value="green"),
        app_commands.Choice(name="red", value="red"),
        app_commands.Choice(name="yellow", value="yellow"),
        app_commands.Choice(name="purple", value="purple"),
        app_commands.Choice(name="orange", value="orange"),
    ])
    @app_commands.checks.has_permissions(manage_messages=True)
    async def announce(self, interaction: discord.Interaction, channel: discord.TextChannel, title: str, message: str, color: str = "blue", ping_everyone: bool = False):
        color_map = {
            "blue": discord.Color.blue(),
            "green": discord.Color.green(),
            "red": discord.Color.red(),
            "yellow": discord.Color.yellow(),
            "purple": discord.Color.purple(),
            "orange": discord.Color.orange(),
        }
        embed = discord.Embed(title=title, description=message, color=color_map.get(color, discord.Color.blue()))
        embed.set_footer(text=f"Announced by {interaction.user}")
        content = "@everyone" if ping_everyone else None
        await channel.send(content=content, embed=embed)
        await interaction.response.send_message(f"Announcement sent to {channel.mention}.", ephemeral=True)

    @app_commands.command(name="say", description="Make the bot send a message")
    @app_commands.describe(channel="Where to send", message="What to say")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def say(self, interaction: discord.Interaction, message: str, channel: discord.TextChannel = None):
        target = channel or interaction.channel
        await target.send(message)
        await interaction.response.send_message("Message sent.", ephemeral=True)

    @app_commands.command(name="embed", description="Send a custom embed message")
    @app_commands.describe(channel="Where to send", title="Embed title", description="Embed body", color="Embed color hex (e.g. #ff0000)")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def embed_cmd(self, interaction: discord.Interaction, title: str, description: str, channel: discord.TextChannel = None, color: str = "#5865F2"):
        target = channel or interaction.channel
        try:
            color_int = int(color.strip("#"), 16)
        except ValueError:
            color_int = 0x5865F2
        embed = discord.Embed(title=title, description=description, color=color_int)
        embed.set_footer(text=f"By {interaction.user}")
        await target.send(embed=embed)
        await interaction.response.send_message("Embed sent.", ephemeral=True)

    @app_commands.command(name="poll", description="Create a yes/no poll")
    @app_commands.describe(question="The poll question", channel="Where to post it")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def poll(self, interaction: discord.Interaction, question: str, channel: discord.TextChannel = None):
        target = channel or interaction.channel
        embed = discord.Embed(title="Poll", description=question, color=discord.Color.blurple())
        embed.set_footer(text=f"Poll by {interaction.user}")
        msg = await target.send(embed=embed)
        await msg.add_reaction("✅")
        await msg.add_reaction("❌")
        await interaction.response.send_message(f"Poll posted in {target.mention}.", ephemeral=True)

    @app_commands.command(name="dehoist", description="Remove hoist characters (! # etc.) from member nicknames")
    @app_commands.checks.has_permissions(manage_nicknames=True)
    async def dehoist(self, interaction: discord.Interaction):
        await interaction.response.defer()
        hoist_chars = "!#$%^&*()_+-=[]{}|;':\",./<>?`~@\\"
        count = 0
        for member in interaction.guild.members:
            if member.display_name[0] in hoist_chars:
                try:
                    await member.edit(nick=f"Dehoisted {member.name[:20]}", reason=f"Dehoist by {interaction.user}")
                    count += 1
                except discord.Forbidden:
                    pass
        embed = discord.Embed(
            title="Dehoist Complete",
            description=f"Fixed **{count}** hoisted nicknames.",
            color=discord.Color.green()
        )
        await interaction.followup.send(embed=embed)

    @slowmode.error
    @nickname.error
    @hide.error
    @show.error
    @nuke.error
    @serverlock.error
    @serverunlock.error
    @announce.error
    @say.error
    async def utility_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        else:
            await interaction.response.send_message(f"An error occurred: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Utility(bot))
