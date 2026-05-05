import discord
from discord import app_commands
from discord.ext import commands
import json
import os
from datetime import timedelta


CONFIG_PATH = "data/config.json"
DEFAULT_PREFIX = "?"


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


def load_warnings():
    with open("data/warnings.json", "r") as f:
        return json.load(f)


def save_warnings(data):
    with open("data/warnings.json", "w") as f:
        json.dump(data, f, indent=2)


def load_jailed():
    with open("data/jailed.json", "r") as f:
        return json.load(f)


def save_jailed(data):
    with open("data/jailed.json", "w") as f:
        json.dump(data, f, indent=2)


class PrefixCommands(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    async def send_error(self, ctx: commands.Context, message: str):
        await ctx.send(embed=discord.Embed(description=f"❌ {message}", color=discord.Color.red()))

    @app_commands.command(name="prefix", description="Set the bot's command prefix for this server")
    @app_commands.describe(new_prefix="The new prefix to use (e.g. !, ?, $, .)")
    @app_commands.checks.has_permissions(administrator=True)
    async def set_prefix_slash(self, interaction: discord.Interaction, new_prefix: str):
        if len(new_prefix) > 5:
            await interaction.response.send_message("Prefix must be 5 characters or less.", ephemeral=True)
            return
        config = load_config()
        gid = str(interaction.guild.id)
        if gid not in config:
            config[gid] = {}
        config[gid]["prefix"] = new_prefix
        save_config(config)
        embed = discord.Embed(
            title="Prefix Updated",
            description=f"The command prefix is now `{new_prefix}`\nExample: `{new_prefix}ban @user reason`",
            color=discord.Color.green()
        )
        await interaction.response.send_message(embed=embed)

    @commands.command(name="prefix", help="Set the bot prefix for this server")
    @commands.has_permissions(administrator=True)
    async def set_prefix(self, ctx: commands.Context, new_prefix: str):
        if len(new_prefix) > 5:
            await self.send_error(ctx, "Prefix must be 5 characters or less.")
            return
        config = load_config()
        gid = str(ctx.guild.id)
        if gid not in config:
            config[gid] = {}
        config[gid]["prefix"] = new_prefix
        save_config(config)
        embed = discord.Embed(
            title="Prefix Updated",
            description=f"The command prefix is now `{new_prefix}`\nExample: `{new_prefix}ban @user reason`",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)

    @commands.command(name="ban", help="Ban a member. Usage: [prefix]ban @user [reason]")
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        if member.top_role >= ctx.author.top_role:
            await self.send_error(ctx, "You cannot ban someone with an equal or higher role.")
            return
        await member.ban(reason=f"{reason} | Banned by {ctx.author}")
        embed = discord.Embed(title="Member Banned", color=discord.Color.red())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(ctx.author), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await ctx.send(embed=embed)
        await self.log_action(ctx.guild, embed)

    @commands.command(name="kick", help="Kick a member. Usage: [prefix]kick @user [reason]")
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        if member.top_role >= ctx.author.top_role:
            await self.send_error(ctx, "You cannot kick someone with an equal or higher role.")
            return
        await member.kick(reason=f"{reason} | Kicked by {ctx.author}")
        embed = discord.Embed(title="Member Kicked", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(ctx.author), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await ctx.send(embed=embed)
        await self.log_action(ctx.guild, embed)

    @commands.command(name="warn", help="Warn a member. Usage: [prefix]warn @user [reason]")
    @commands.has_permissions(kick_members=True)
    async def warn(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        warnings = load_warnings()
        gid = str(ctx.guild.id)
        uid = str(member.id)
        if gid not in warnings:
            warnings[gid] = {}
        if uid not in warnings[gid]:
            warnings[gid][uid] = []
        warnings[gid][uid].append({"reason": reason, "moderator": str(ctx.author), "moderator_id": str(ctx.author.id)})
        save_warnings(warnings)
        count = len(warnings[gid][uid])
        embed = discord.Embed(title="Member Warned", color=discord.Color.yellow())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(ctx.author), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        embed.add_field(name="Total Warnings", value=str(count), inline=False)
        await ctx.send(embed=embed)
        await self.log_action(ctx.guild, embed)
        try:
            await member.send(f"You have been warned in **{ctx.guild.name}**.\nReason: {reason}\nTotal warnings: {count}")
        except discord.Forbidden:
            pass

    @commands.command(name="warnings", help="View warnings. Usage: [prefix]warnings @user")
    @commands.has_permissions(kick_members=True)
    async def warnings(self, ctx: commands.Context, member: discord.Member):
        warnings = load_warnings()
        user_warnings = warnings.get(str(ctx.guild.id), {}).get(str(member.id), [])
        if not user_warnings:
            await ctx.send(f"{member.mention} has no warnings.")
            return
        embed = discord.Embed(title=f"Warnings for {member}", color=discord.Color.yellow())
        for i, w in enumerate(user_warnings, 1):
            embed.add_field(name=f"Warning #{i}", value=f"Reason: {w['reason']}\nBy: {w['moderator']}", inline=False)
        await ctx.send(embed=embed)

    @commands.command(name="mute", help="Mute a member. Usage: [prefix]mute @user [reason]")
    @commands.has_permissions(manage_roles=True)
    async def mute(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
        if not muted_role:
            muted_role = await ctx.guild.create_role(name="Muted")
            for channel in ctx.guild.channels:
                try:
                    await channel.set_permissions(muted_role, send_messages=False, speak=False, add_reactions=False)
                except Exception:
                    pass
        if muted_role in member.roles:
            await self.send_error(ctx, f"{member.mention} is already muted.")
            return
        await member.add_roles(muted_role, reason=f"{reason} | Muted by {ctx.author}")
        embed = discord.Embed(title="Member Muted", color=discord.Color.dark_gray())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(ctx.author), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await ctx.send(embed=embed)
        await self.log_action(ctx.guild, embed)

    @commands.command(name="unmute", help="Unmute a member. Usage: [prefix]unmute @user")
    @commands.has_permissions(manage_roles=True)
    async def unmute(self, ctx: commands.Context, member: discord.Member):
        muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
        if not muted_role or muted_role not in member.roles:
            await self.send_error(ctx, f"{member.mention} is not muted.")
            return
        await member.remove_roles(muted_role)
        embed = discord.Embed(title="Member Unmuted", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Moderator", value=str(ctx.author), inline=True)
        await ctx.send(embed=embed)

    @commands.command(name="timeout", help="Timeout a member. Usage: [prefix]timeout @user [minutes] [reason]")
    @commands.has_permissions(moderate_members=True)
    async def timeout(self, ctx: commands.Context, member: discord.Member, minutes: int = 10, *, reason: str = "No reason provided"):
        if member.top_role >= ctx.author.top_role:
            await self.send_error(ctx, "You cannot timeout someone with an equal or higher role.")
            return
        await member.timeout(timedelta(minutes=min(minutes, 40320)), reason=f"{reason} | By {ctx.author}")
        embed = discord.Embed(title="Member Timed Out", color=discord.Color.orange())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Duration", value=f"{minutes} minutes", inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await ctx.send(embed=embed)
        await self.log_action(ctx.guild, embed)

    @commands.command(name="purge", help="Bulk delete messages. Usage: [prefix]purge [amount]")
    @commands.has_permissions(manage_messages=True)
    async def purge(self, ctx: commands.Context, amount: int = 10):
        if amount < 1 or amount > 100:
            await self.send_error(ctx, "Amount must be between 1 and 100.")
            return
        await ctx.message.delete()
        deleted = await ctx.channel.purge(limit=amount)
        msg = await ctx.send(embed=discord.Embed(description=f"Deleted **{len(deleted)}** messages.", color=discord.Color.blurple()))
        import asyncio
        await asyncio.sleep(3)
        await msg.delete()

    @commands.command(name="lock", help="Lock a channel. Usage: [prefix]lock [reason]")
    @commands.has_permissions(manage_channels=True)
    async def lock(self, ctx: commands.Context, *, reason: str = "No reason provided"):
        overwrite = ctx.channel.overwrites_for(ctx.guild.default_role)
        overwrite.send_messages = False
        await ctx.channel.set_permissions(ctx.guild.default_role, overwrite=overwrite)
        embed = discord.Embed(title="Channel Locked", description=f"Reason: {reason}", color=discord.Color.red())
        embed.add_field(name="Moderator", value=str(ctx.author))
        await ctx.send(embed=embed)

    @commands.command(name="unlock", help="Unlock a channel. Usage: [prefix]unlock [reason]")
    @commands.has_permissions(manage_channels=True)
    async def unlock(self, ctx: commands.Context, *, reason: str = "No reason provided"):
        overwrite = ctx.channel.overwrites_for(ctx.guild.default_role)
        overwrite.send_messages = None
        await ctx.channel.set_permissions(ctx.guild.default_role, overwrite=overwrite)
        embed = discord.Embed(title="Channel Unlocked", description=f"Reason: {reason}", color=discord.Color.green())
        embed.add_field(name="Moderator", value=str(ctx.author))
        await ctx.send(embed=embed)

    @commands.command(name="slowmode", help="Set slowmode. Usage: [prefix]slowmode [seconds]")
    @commands.has_permissions(manage_channels=True)
    async def slowmode(self, ctx: commands.Context, seconds: int = 0):
        if seconds < 0 or seconds > 21600:
            await self.send_error(ctx, "Seconds must be between 0 and 21600.")
            return
        await ctx.channel.edit(slowmode_delay=seconds)
        if seconds == 0:
            await ctx.send(embed=discord.Embed(description="Slowmode disabled.", color=discord.Color.blurple()))
        else:
            await ctx.send(embed=discord.Embed(description=f"Slowmode set to **{seconds}s**.", color=discord.Color.blurple()))

    @commands.command(name="jail", help="Jail a member. Usage: [prefix]jail @user [reason]")
    @commands.has_permissions(manage_roles=True)
    async def jail(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        if member.top_role >= ctx.author.top_role:
            await self.send_error(ctx, "You cannot jail someone with an equal or higher role.")
            return
        jailed_data = load_jailed()
        gid = str(ctx.guild.id)
        uid = str(member.id)
        if gid in jailed_data and uid in jailed_data[gid]:
            await self.send_error(ctx, f"{member.mention} is already jailed.")
            return
        jail_role = discord.utils.get(ctx.guild.roles, name="Jailed")
        if not jail_role:
            jail_role = await ctx.guild.create_role(name="Jailed", color=discord.Color.dark_gray())
            for channel in ctx.guild.channels:
                try:
                    await channel.set_permissions(jail_role, view_channel=False, send_messages=False, speak=False)
                except Exception:
                    pass
        jail_channel = discord.utils.get(ctx.guild.text_channels, name="jail")
        if not jail_channel:
            overwrites = {
                ctx.guild.default_role: discord.PermissionOverwrite(view_channel=False),
                jail_role: discord.PermissionOverwrite(view_channel=True, send_messages=True),
                ctx.guild.me: discord.PermissionOverwrite(view_channel=True, send_messages=True)
            }
            jail_channel = await ctx.guild.create_text_channel("jail", overwrites=overwrites)
        saved_roles = [r.id for r in member.roles if r != ctx.guild.default_role and not r.managed]
        roles_to_remove = [r for r in member.roles if r != ctx.guild.default_role and not r.managed]
        if roles_to_remove:
            await member.remove_roles(*roles_to_remove)
        await member.add_roles(jail_role)
        if gid not in jailed_data:
            jailed_data[gid] = {}
        jailed_data[gid][uid] = {"roles": saved_roles, "reason": reason}
        save_jailed(jailed_data)
        embed = discord.Embed(title="Member Jailed", color=discord.Color.dark_red())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        await ctx.send(embed=embed)
        await jail_channel.send(f"{member.mention}, you have been jailed. Reason: {reason}")

    @commands.command(name="unjail", help="Unjail a member. Usage: [prefix]unjail @user")
    @commands.has_permissions(manage_roles=True)
    async def unjail(self, ctx: commands.Context, member: discord.Member):
        jailed_data = load_jailed()
        gid = str(ctx.guild.id)
        uid = str(member.id)
        if gid not in jailed_data or uid not in jailed_data[gid]:
            await self.send_error(ctx, f"{member.mention} is not jailed.")
            return
        jail_role = discord.utils.get(ctx.guild.roles, name="Jailed")
        if jail_role and jail_role in member.roles:
            await member.remove_roles(jail_role)
        saved_role_ids = jailed_data[gid][uid].get("roles", [])
        roles_to_restore = [ctx.guild.get_role(rid) for rid in saved_role_ids if ctx.guild.get_role(rid) and not ctx.guild.get_role(rid).managed]
        roles_to_restore = [r for r in roles_to_restore if r]
        if roles_to_restore:
            await member.add_roles(*roles_to_restore)
        del jailed_data[gid][uid]
        save_jailed(jailed_data)
        embed = discord.Embed(title="Member Unjailed", color=discord.Color.green())
        embed.add_field(name="User", value=str(member), inline=True)
        embed.add_field(name="Roles Restored", value=str(len(roles_to_restore)), inline=True)
        await ctx.send(embed=embed)

    @commands.command(name="userinfo", help="Get user info. Usage: [prefix]userinfo [@user]")
    async def userinfo(self, ctx: commands.Context, member: discord.Member = None):
        member = member or ctx.author
        roles = [r.mention for r in reversed(member.roles) if r != ctx.guild.default_role]
        embed = discord.Embed(title=f"User Info — {member}", color=member.color)
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="ID", value=str(member.id), inline=True)
        embed.add_field(name="Joined", value=discord.utils.format_dt(member.joined_at, style="R"), inline=True)
        embed.add_field(name="Created", value=discord.utils.format_dt(member.created_at, style="R"), inline=True)
        embed.add_field(name="Roles", value=", ".join(roles[:8]) + (" ..." if len(roles) > 8 else "") if roles else "None", inline=False)
        await ctx.send(embed=embed)

    @commands.command(name="serverinfo", help="Get server info.")
    async def serverinfo(self, ctx: commands.Context):
        guild = ctx.guild
        bots = sum(1 for m in guild.members if m.bot)
        embed = discord.Embed(title=guild.name, color=discord.Color.blurple())
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        embed.add_field(name="Members", value=f"{guild.member_count} ({guild.member_count - bots} humans)", inline=True)
        embed.add_field(name="Channels", value=f"{len(guild.text_channels)} text / {len(guild.voice_channels)} voice", inline=True)
        embed.add_field(name="Owner", value=str(guild.owner), inline=True)
        embed.add_field(name="Boosts", value=f"Level {guild.premium_tier} ({guild.premium_subscription_count})", inline=True)
        await ctx.send(embed=embed)

    @commands.command(name="avatar", help="Get avatar. Usage: [prefix]avatar [@user]")
    async def avatar(self, ctx: commands.Context, member: discord.Member = None):
        member = member or ctx.author
        embed = discord.Embed(title=f"{member}'s Avatar", color=member.color)
        embed.set_image(url=member.display_avatar.url)
        await ctx.send(embed=embed)

    @commands.command(name="ping", help="Check bot latency.")
    async def ping(self, ctx: commands.Context):
        latency = round(self.bot.latency * 1000)
        await ctx.send(embed=discord.Embed(description=f"Pong! **{latency}ms**", color=discord.Color.green()))

    @commands.command(name="help", help="Show all available commands.")
    async def help_cmd(self, ctx: commands.Context):
        config = load_config()
        prefix = config.get(str(ctx.guild.id), {}).get("prefix", DEFAULT_PREFIX)
        embed = discord.Embed(title="Command Help", description=f"Current prefix: `{prefix}`\nAll commands also available as slash commands.", color=discord.Color.blurple())
        embed.add_field(name="Moderation", value=f"`{prefix}ban` `{prefix}kick` `{prefix}warn` `{prefix}warnings` `{prefix}mute` `{prefix}unmute` `{prefix}timeout`", inline=False)
        embed.add_field(name="Channels", value=f"`{prefix}lock` `{prefix}unlock` `{prefix}purge` `{prefix}slowmode` `{prefix}jail` `{prefix}unjail`", inline=False)
        embed.add_field(name="Info", value=f"`{prefix}userinfo` `{prefix}serverinfo` `{prefix}avatar` `{prefix}ping`", inline=False)
        embed.add_field(name="Config", value=f"`{prefix}prefix <newprefix>`", inline=False)
        embed.set_footer(text="Use /help or type a command for more details.")
        await ctx.send(embed=embed)

    @commands.Cog.listener()
    async def on_command_error(self, ctx: commands.Context, error):
        if isinstance(error, commands.MissingPermissions):
            await self.send_error(ctx, "You don't have permission to use this command.")
        elif isinstance(error, commands.MemberNotFound):
            await self.send_error(ctx, "Member not found. Make sure you mention them or use their ID.")
        elif isinstance(error, commands.MissingRequiredArgument):
            await self.send_error(ctx, f"Missing argument: `{error.param.name}`. Check `{ctx.prefix}help` for usage.")
        elif isinstance(error, commands.CommandNotFound):
            pass
        else:
            await self.send_error(ctx, f"An error occurred: {error}")


async def setup(bot: commands.Bot):
    await bot.add_cog(PrefixCommands(bot))
