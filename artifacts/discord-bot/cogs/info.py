import discord
from discord import app_commands
from discord.ext import commands
import platform
import time


START_TIME = time.time()


class Info(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="userinfo", description="Get detailed info about a user")
    @app_commands.describe(member="The member to look up (defaults to yourself)")
    async def userinfo(self, interaction: discord.Interaction, member: discord.Member = None):
        member = member or interaction.user
        roles = [r.mention for r in reversed(member.roles) if r != interaction.guild.default_role]
        embed = discord.Embed(title=f"User Info — {member}", color=member.color)
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="ID", value=str(member.id), inline=True)
        embed.add_field(name="Nickname", value=member.nick or "None", inline=True)
        embed.add_field(name="Bot", value="Yes" if member.bot else "No", inline=True)
        embed.add_field(name="Account Created", value=discord.utils.format_dt(member.created_at, style="R"), inline=True)
        embed.add_field(name="Joined Server", value=discord.utils.format_dt(member.joined_at, style="R"), inline=True)
        status_map = {
            discord.Status.online: "Online",
            discord.Status.idle: "Idle",
            discord.Status.dnd: "Do Not Disturb",
            discord.Status.offline: "Offline"
        }
        embed.add_field(name="Status", value=status_map.get(member.status, "Unknown"), inline=True)
        if member.is_timed_out():
            embed.add_field(name="Timed Out Until", value=discord.utils.format_dt(member.timed_out_until, style="R"), inline=True)
        embed.add_field(
            name=f"Roles ({len(roles)})",
            value=", ".join(roles[:10]) + (" ..." if len(roles) > 10 else "") if roles else "None",
            inline=False
        )
        embed.set_footer(text=f"Requested by {interaction.user}")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="serverinfo", description="Get information about this server")
    async def serverinfo(self, interaction: discord.Interaction):
        guild = interaction.guild
        bots = sum(1 for m in guild.members if m.bot)
        humans = guild.member_count - bots
        text_channels = len(guild.text_channels)
        voice_channels = len(guild.voice_channels)
        categories = len(guild.categories)
        embed = discord.Embed(title=guild.name, color=discord.Color.blurple())
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        embed.add_field(name="Owner", value=guild.owner.mention, inline=True)
        embed.add_field(name="ID", value=str(guild.id), inline=True)
        embed.add_field(name="Created", value=discord.utils.format_dt(guild.created_at, style="R"), inline=True)
        embed.add_field(name="Members", value=f"{guild.member_count} total\n{humans} humans • {bots} bots", inline=True)
        embed.add_field(name="Channels", value=f"{text_channels} text • {voice_channels} voice\n{categories} categories", inline=True)
        embed.add_field(name="Roles", value=str(len(guild.roles)), inline=True)
        embed.add_field(name="Boosts", value=f"Level {guild.premium_tier} ({guild.premium_subscription_count} boosts)", inline=True)
        embed.add_field(name="Verification", value=str(guild.verification_level).title(), inline=True)
        embed.add_field(name="Emojis", value=f"{len(guild.emojis)}/{guild.emoji_limit}", inline=True)
        embed.set_footer(text=f"Requested by {interaction.user}")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="avatar", description="Get a user's avatar")
    @app_commands.describe(member="The member whose avatar to show")
    async def avatar(self, interaction: discord.Interaction, member: discord.Member = None):
        member = member or interaction.user
        embed = discord.Embed(title=f"{member}'s Avatar", color=member.color)
        embed.set_image(url=member.display_avatar.url)
        embed.add_field(name="Download", value=f"[PNG]({member.display_avatar.replace(format='png').url}) • [JPG]({member.display_avatar.replace(format='jpg').url}) • [WEBP]({member.display_avatar.replace(format='webp').url})")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="roleinfo", description="Get info about a role")
    @app_commands.describe(role="The role to inspect")
    async def roleinfo(self, interaction: discord.Interaction, role: discord.Role):
        perms = [p.replace("_", " ").title() for p, v in role.permissions if v]
        embed = discord.Embed(title=f"Role Info — {role.name}", color=role.color)
        embed.add_field(name="ID", value=str(role.id), inline=True)
        embed.add_field(name="Color", value=str(role.color), inline=True)
        embed.add_field(name="Position", value=str(role.position), inline=True)
        embed.add_field(name="Mentionable", value="Yes" if role.mentionable else "No", inline=True)
        embed.add_field(name="Hoisted", value="Yes" if role.hoist else "No", inline=True)
        embed.add_field(name="Members", value=str(len(role.members)), inline=True)
        embed.add_field(name="Created", value=discord.utils.format_dt(role.created_at, style="R"), inline=True)
        embed.add_field(name="Managed", value="Yes" if role.managed else "No", inline=True)
        if perms:
            embed.add_field(name="Key Permissions", value=", ".join(perms[:15]) + (" ..." if len(perms) > 15 else ""), inline=False)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="botinfo", description="Get info about this bot")
    async def botinfo(self, interaction: discord.Interaction):
        uptime_seconds = int(time.time() - START_TIME)
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{hours}h {minutes}m {seconds}s"
        embed = discord.Embed(title="Bot Info", color=discord.Color.blurple())
        embed.set_thumbnail(url=self.bot.user.display_avatar.url)
        embed.add_field(name="Name", value=str(self.bot.user), inline=True)
        embed.add_field(name="ID", value=str(self.bot.user.id), inline=True)
        embed.add_field(name="Servers", value=str(len(self.bot.guilds)), inline=True)
        embed.add_field(name="Members", value=str(sum(g.member_count for g in self.bot.guilds)), inline=True)
        embed.add_field(name="Uptime", value=uptime_str, inline=True)
        embed.add_field(name="Python", value=platform.python_version(), inline=True)
        embed.add_field(name="discord.py", value=discord.__version__, inline=True)
        embed.add_field(name="Ping", value=f"{round(self.bot.latency * 1000)}ms", inline=True)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="ping", description="Check the bot's latency")
    async def ping(self, interaction: discord.Interaction):
        latency = round(self.bot.latency * 1000)
        embed = discord.Embed(
            title="Pong!",
            description=f"Latency: **{latency}ms**",
            color=discord.Color.green() if latency < 100 else discord.Color.yellow() if latency < 200 else discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="membercount", description="Show the server member count")
    async def membercount(self, interaction: discord.Interaction):
        guild = interaction.guild
        bots = sum(1 for m in guild.members if m.bot)
        humans = guild.member_count - bots
        embed = discord.Embed(title=f"{guild.name} — Member Count", color=discord.Color.blurple())
        embed.add_field(name="Total", value=str(guild.member_count), inline=True)
        embed.add_field(name="Humans", value=str(humans), inline=True)
        embed.add_field(name="Bots", value=str(bots), inline=True)
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Info(bot))
