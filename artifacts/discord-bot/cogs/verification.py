import discord
from discord import app_commands
from discord.ext import commands
import json
import os
import datetime
import re
from difflib import SequenceMatcher


DATA_PATH = "data/verification.json"
BANNED_PATH = "data/banned_users.json"


def load_data(path: str) -> dict:
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_data(path: str, data: dict):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def load_config() -> dict:
    try:
        with open("data/config.json", "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_config(config: dict):
    with open("data/config.json", "w") as f:
        json.dump(config, f, indent=2)


def get_user_flags(user: discord.User | discord.Member) -> list[str]:
    flags = []
    pf = user.public_flags
    if pf.staff:
        flags.append("Discord Staff")
    if pf.partner:
        flags.append("Discord Partner")
    if pf.hypesquad:
        flags.append("HypeSquad Events")
    if pf.bug_hunter:
        flags.append("Bug Hunter")
    if pf.hypesquad_bravery:
        flags.append("HypeSquad Bravery")
    if pf.hypesquad_brilliance:
        flags.append("HypeSquad Brilliance")
    if pf.hypesquad_balance:
        flags.append("HypeSquad Balance")
    if pf.early_supporter:
        flags.append("Early Supporter")
    if pf.bug_hunter_level_2:
        flags.append("Bug Hunter Level 2")
    if pf.verified_bot_developer:
        flags.append("Verified Bot Developer")
    if pf.active_developer:
        flags.append("Active Developer")
    if pf.discord_certified_moderator:
        flags.append("Certified Moderator")
    return flags


def account_age_days(user: discord.User | discord.Member) -> int:
    now = datetime.datetime.now(datetime.timezone.utc)
    return (now - user.created_at).days


def risk_level(member: discord.Member, banned_names: list[str]) -> tuple[str, list[str]]:
    reasons = []
    score = 0

    age = account_age_days(member)
    if age < 3:
        reasons.append(f"Account created **{age}d ago** (extremely new)")
        score += 5
    elif age < 7:
        reasons.append(f"Account created **{age}d ago** (very new)")
        score += 3
    elif age < 30:
        reasons.append(f"Account created **{age}d ago** (new)")
        score += 1

    if member.default_avatar == member.display_avatar:
        reasons.append("Using default avatar (no profile picture set)")
        score += 2

    if not member.public_flags.value:
        reasons.append("No Discord badges or flags")
        score += 1

    name_lower = member.name.lower()
    for banned in banned_names:
        ratio = SequenceMatcher(None, name_lower, banned.lower()).ratio()
        if ratio >= 0.80 and name_lower != banned.lower():
            reasons.append(f"Username similar to banned user `{banned}` ({int(ratio*100)}% match)")
            score += 4
            break

    if re.search(r"\d{4,}$", member.name):
        reasons.append("Username ends with many numbers (common alt pattern)")
        score += 1

    if score >= 6:
        level = "🔴 HIGH RISK"
    elif score >= 3:
        level = "🟡 MEDIUM RISK"
    else:
        level = "🟢 LOW RISK"

    return level, reasons


def build_member_info_embed(member: discord.Member, title: str, color: discord.Color, extra_fields: list[tuple] = None) -> discord.Embed:
    now = datetime.datetime.now(datetime.timezone.utc)
    age_days = account_age_days(member)
    age_str = f"{age_days} days ({age_days // 365}y {(age_days % 365) // 30}m {age_days % 30}d)"

    flags = get_user_flags(member)
    has_nitro = member.premium_since is not None
    is_boosting = member.premium_since is not None

    embed = discord.Embed(title=title, color=color, timestamp=now)
    embed.set_thumbnail(url=member.display_avatar.url)

    embed.add_field(name="👤 Username", value=str(member), inline=True)
    embed.add_field(name="🪪 Display Name", value=member.display_name, inline=True)
    embed.add_field(name="🆔 User ID", value=str(member.id), inline=True)

    embed.add_field(name="📅 Account Created", value=discord.utils.format_dt(member.created_at, style="F"), inline=True)
    embed.add_field(name="⏳ Account Age", value=age_str, inline=True)
    embed.add_field(name="📥 Joined Server", value=discord.utils.format_dt(member.joined_at, style="F") if member.joined_at else "Unknown", inline=True)

    embed.add_field(name="🖼️ Avatar Type", value="Default (no avatar set)" if member.default_avatar == member.display_avatar else "Custom avatar", inline=True)
    embed.add_field(name="🤖 Bot Account", value="Yes" if member.bot else "No", inline=True)
    embed.add_field(name="🎮 Boosting", value=f"Since {discord.utils.format_dt(member.premium_since, style='R')}" if is_boosting else "No", inline=True)

    embed.add_field(name="🏷️ Roles", value=", ".join(r.mention for r in member.roles[1:]) or "None", inline=False)

    embed.add_field(name="🏅 Badges / Flags", value=", ".join(flags) if flags else "None", inline=True)

    avatar_url = str(member.display_avatar.url)
    embed.add_field(name="🔗 Avatar URL", value=f"[Click here]({avatar_url})", inline=True)

    embed.add_field(
        name="📊 Account Info",
        value=(
            f"**Created:** <t:{int(member.created_at.timestamp())}:R>\n"
            f"**ID timestamp:** `{member.id}`\n"
            f"**Mention:** {member.mention}"
        ),
        inline=False
    )

    if extra_fields:
        for name, value, inline in extra_fields:
            embed.add_field(name=name, value=value, inline=inline)

    embed.set_footer(text=f"Guild: {member.guild.name} • {member.guild.id}")
    return embed


class VerifyButton(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="✅ Verify Me", style=discord.ButtonStyle.green, custom_id="verify_button")
    async def verify(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        cog = interaction.client.cogs.get("Verification")
        if cog:
            await cog.handle_verification(interaction)
        else:
            await interaction.followup.send("Verification system error. Contact an admin.", ephemeral=True)


class Verification(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.bot.add_view(VerifyButton())

    def get_guild_config(self, guild_id: int) -> dict:
        config = load_config()
        return config.get(str(guild_id), {}).get("verification", {})

    def set_guild_config(self, guild_id: int, vcfg: dict):
        config = load_config()
        gid = str(guild_id)
        if gid not in config:
            config[gid] = {}
        config[gid]["verification"] = vcfg
        save_config(config)

    async def handle_verification(self, interaction: discord.Interaction):
        member = interaction.user
        guild = interaction.guild
        vcfg = self.get_guild_config(guild.id)

        vdata = load_data(DATA_PATH)
        gid = str(guild.id)
        uid = str(member.id)

        if gid not in vdata:
            vdata[gid] = {}

        already = vdata[gid].get(uid, {}).get("verified", False)
        if already:
            await interaction.followup.send("You are already verified!", ephemeral=True)
            return

        verified_role_id = vcfg.get("verified_role")
        unverified_role_id = vcfg.get("unverified_role")

        if verified_role_id:
            vr = guild.get_role(int(verified_role_id))
            if vr:
                try:
                    await member.add_roles(vr, reason="Verified via verification panel")
                except discord.Forbidden:
                    pass

        # Always remove the unverified role explicitly
        to_remove = []
        if unverified_role_id:
            ur = guild.get_role(int(unverified_role_id))
            if ur and ur in member.roles:
                to_remove.append(ur)

        # Also sweep exclusive groups — remove any role that conflicts with
        # the verified role, including anything Discord onboarding may have added
        if verified_role_id:
            try:
                from cogs.autorole import load_autoroles
                autoroles = load_autoroles()
                exclusive_groups = autoroles.get(str(guild.id), {}).get("exclusive_groups", [])
                for group in exclusive_groups:
                    if int(verified_role_id) in group:
                        for other_id in group:
                            if other_id == int(verified_role_id):
                                continue
                            other_role = guild.get_role(other_id)
                            if other_role and other_role in member.roles and other_role not in to_remove:
                                to_remove.append(other_role)
            except Exception:
                pass

        if to_remove:
            try:
                await member.remove_roles(*to_remove, reason="Verified — removing conflicting/onboarding roles")
            except discord.Forbidden:
                pass

        now = datetime.datetime.now(datetime.timezone.utc)
        age_days = account_age_days(member)
        flags = get_user_flags(member)

        vdata[gid][uid] = {
            "verified": True,
            "verified_at": now.isoformat(),
            "username": str(member),
            "display_name": member.display_name,
            "account_created": member.created_at.isoformat(),
            "account_age_days": age_days,
            "joined_at": member.joined_at.isoformat() if member.joined_at else None,
            "avatar": str(member.display_avatar.url),
            "default_avatar": member.default_avatar == member.display_avatar,
            "bot": member.bot,
            "flags": flags,
            "roles": [str(r.id) for r in member.roles[1:]],
        }
        save_data(DATA_PATH, vdata)

        banned_data = load_data(BANNED_PATH)
        banned_names = [v.get("username", "").split("#")[0] for v in banned_data.get(gid, {}).values()]
        risk, reasons = risk_level(member, banned_names)

        log_channel_id = vcfg.get("log_channel")
        if log_channel_id:
            log_channel = guild.get_channel(int(log_channel_id))
            if log_channel:
                extra = [
                    ("🛡️ Risk Assessment", f"**{risk}**\n" + ("\n".join(f"• {r}" for r in reasons) if reasons else "No risk factors detected."), False),
                    ("✅ Verified At", discord.utils.format_dt(now, style="F"), True),
                ]
                embed = build_member_info_embed(
                    member,
                    title="✅ Member Verified",
                    color=discord.Color.green(),
                    extra_fields=extra
                )
                await log_channel.send(embed=embed)

        await interaction.followup.send("✅ You have been successfully verified! Welcome to the server.", ephemeral=True)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        if member.bot:
            return

        guild = member.guild
        vcfg = self.get_guild_config(guild.id)
        gid = str(guild.id)

        unverified_role_id = vcfg.get("unverified_role")
        if unverified_role_id:
            ur = guild.get_role(int(unverified_role_id))
            if ur:
                try:
                    await member.add_roles(ur, reason="Pending verification")
                except discord.Forbidden:
                    pass

        banned_data = load_data(BANNED_PATH)
        banned_names = [v.get("username", "").split("#")[0] for v in banned_data.get(gid, {}).values()]
        risk, reasons = risk_level(member, banned_names)

        vdata = load_data(DATA_PATH)
        prev_guilds = []
        uid = str(member.id)
        for g in self.bot.guilds:
            if g.id == guild.id:
                continue
            if str(g.id) in vdata and uid in vdata[str(g.id)]:
                prev_guilds.append(g.name)

        log_channel_id = vcfg.get("log_channel")
        if log_channel_id:
            log_channel = guild.get_channel(int(log_channel_id))
            if log_channel:
                age_days = account_age_days(member)
                flags = get_user_flags(member)
                extra = [
                    ("🛡️ Risk Assessment", f"**{risk}**\n" + ("\n".join(f"• {r}" for r in reasons) if reasons else "No risk factors detected."), False),
                    ("🌐 Seen in Other Bot Guilds", ", ".join(prev_guilds) if prev_guilds else "None detected", True),
                    ("📋 Status", "⏳ Pending Verification", True),
                ]
                embed = build_member_info_embed(
                    member,
                    title="📥 New Member Joined",
                    color=discord.Color.blue(),
                    extra_fields=extra
                )
                await log_channel.send(embed=embed)

        await self._alt_check_and_log(member, guild, vcfg, risk, reasons)

    async def _alt_check_and_log(self, member: discord.Member, guild: discord.Guild, vcfg: dict, risk: str, reasons: list[str]):
        if "HIGH" not in risk and "MEDIUM" not in risk:
            return

        alt_log_id = vcfg.get("alt_log_channel") or vcfg.get("log_channel")
        if not alt_log_id:
            return

        alt_channel = guild.get_channel(int(alt_log_id))
        if not alt_channel:
            return

        vdata = load_data(DATA_PATH)
        gid = str(guild.id)

        age_days = account_age_days(member)
        similar_accounts = []

        for uid, udata in vdata.get(gid, {}).items():
            if uid == str(member.id):
                continue
            try:
                existing_age = udata.get("account_age_days", 9999)
                existing_name = udata.get("username", "")
                ratio = SequenceMatcher(None, member.name.lower(), existing_name.split("#")[0].lower()).ratio()
                if ratio >= 0.75 or abs(existing_age - age_days) < 3:
                    similar_accounts.append(f"`{existing_name}` (ID: `{uid}`, age: {existing_age}d, name sim: {int(ratio*100)}%)")
            except Exception:
                continue

        embed = discord.Embed(
            title="⚠️ Potential Alt Account Detected",
            color=discord.Color.orange(),
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="User", value=f"{member.mention} (`{member}`)", inline=True)
        embed.add_field(name="User ID", value=str(member.id), inline=True)
        embed.add_field(name="Account Age", value=f"{age_days} days", inline=True)
        embed.add_field(name="Risk Level", value=risk, inline=True)
        embed.add_field(name="Risk Factors", value="\n".join(f"• {r}" for r in reasons) if reasons else "None", inline=False)
        if similar_accounts:
            embed.add_field(
                name="⚠️ Similar Accounts in Server",
                value="\n".join(similar_accounts[:5]) or "None",
                inline=False
            )
        embed.set_footer(text=f"Guild: {guild.name}")
        await alt_channel.send(embed=embed)

    verify_group = app_commands.Group(name="verify", description="Verification system commands")

    @verify_group.command(name="setup", description="Configure the verification system")
    @app_commands.describe(
        log_channel="Channel where verification logs are sent",
        verified_role="Role to give after verification",
        unverified_role="Role given on join (removed after verify)",
        verify_channel="The channel where the verification panel lives (unverified can only see this)",
        alt_log_channel="Separate channel for alt detection logs (optional, defaults to log channel)",
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def verify_setup(
        self,
        interaction: discord.Interaction,
        log_channel: discord.TextChannel,
        verified_role: discord.Role,
        unverified_role: discord.Role = None,
        verify_channel: discord.TextChannel = None,
        alt_log_channel: discord.TextChannel = None,
    ):
        vcfg = self.get_guild_config(interaction.guild.id)
        vcfg["log_channel"] = str(log_channel.id)
        vcfg["verified_role"] = str(verified_role.id)
        if unverified_role:
            vcfg["unverified_role"] = str(unverified_role.id)
        if verify_channel:
            vcfg["verify_channel"] = str(verify_channel.id)
        if alt_log_channel:
            vcfg["alt_log_channel"] = str(alt_log_channel.id)
        self.set_guild_config(interaction.guild.id, vcfg)

        lines = [
            "✅ Verification system configured!",
            f"**Log channel:** {log_channel.mention}",
            f"**Verified role:** {verified_role.mention}",
        ]
        if unverified_role:
            lines.append(f"**Unverified role:** {unverified_role.mention}")
        if verify_channel:
            lines.append(f"**Verify channel:** {verify_channel.mention}")
        if alt_log_channel:
            lines.append(f"**Alt log channel:** {alt_log_channel.mention}")
        lines.append("\nUse `/verify panel` to send the verification button.")
        lines.append("Use `/verify lockdown` to apply channel permissions across the server.")
        await interaction.response.send_message("\n".join(lines), ephemeral=True)

    @verify_group.command(name="panel", description="Send the verification panel to a channel")
    @app_commands.describe(channel="Channel to send the panel in", message="Custom message above the button")
    @app_commands.checks.has_permissions(administrator=True)
    async def verify_panel(
        self,
        interaction: discord.Interaction,
        channel: discord.TextChannel = None,
        message: str = None,
    ):
        dest = channel or interaction.channel
        embed = discord.Embed(
            title="✅ Server Verification",
            description=message or (
                "Welcome! To gain access to the server, please click the button below to verify your account.\n\n"
                "This helps us keep the server safe and free from bots and bad actors."
            ),
            color=discord.Color.green()
        )
        embed.set_footer(text=f"{interaction.guild.name} • Verification System")
        await dest.send(embed=embed, view=VerifyButton())
        await interaction.response.send_message(f"✅ Verification panel sent to {dest.mention}.", ephemeral=True)

    @verify_group.command(name="info", description="Look up full stored info on a verified member")
    @app_commands.describe(member="Member to look up")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def verify_info(self, interaction: discord.Interaction, member: discord.Member):
        vdata = load_data(DATA_PATH)
        gid = str(interaction.guild.id)
        uid = str(member.id)
        entry = vdata.get(gid, {}).get(uid)
        if not entry:
            await interaction.response.send_message(f"{member.mention} has no verification record.", ephemeral=True)
            return

        embed = build_member_info_embed(
            member,
            title=f"🔍 Verification Record — {member}",
            color=discord.Color.blurple(),
            extra_fields=[
                ("✅ Verified", "Yes" if entry.get("verified") else "No", True),
                ("📅 Verified At", entry.get("verified_at", "Unknown"), True),
                ("🏅 Badges at verify time", ", ".join(entry.get("flags", [])) or "None", True),
            ]
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @verify_group.command(name="altcheck", description="Manually run alt detection on a member")
    @app_commands.describe(member="Member to check")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def verify_altcheck(self, interaction: discord.Interaction, member: discord.Member):
        vdata = load_data(DATA_PATH)
        gid = str(interaction.guild.id)
        banned_data = load_data(BANNED_PATH)
        banned_names = [v.get("username", "").split("#")[0] for v in banned_data.get(gid, {}).values()]
        risk, reasons = risk_level(member, banned_names)
        age_days = account_age_days(member)

        similar = []
        for uid, udata in vdata.get(gid, {}).items():
            if uid == str(member.id):
                continue
            try:
                existing_name = udata.get("username", "")
                existing_age = udata.get("account_age_days", 9999)
                ratio = SequenceMatcher(None, member.name.lower(), existing_name.split("#")[0].lower()).ratio()
                if ratio >= 0.75 or abs(existing_age - age_days) < 3:
                    similar.append(f"`{existing_name}` (ID: `{uid}`, age: {existing_age}d, name sim: {int(ratio*100)}%)")
            except Exception:
                continue

        embed = discord.Embed(title=f"🔍 Alt Check — {member}", color=discord.Color.orange())
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="User ID", value=str(member.id), inline=True)
        embed.add_field(name="Account Age", value=f"{age_days} days", inline=True)
        embed.add_field(name="Risk Level", value=risk, inline=True)
        embed.add_field(name="Risk Factors", value="\n".join(f"• {r}" for r in reasons) if reasons else "✅ None", inline=False)
        embed.add_field(name="Similar Accounts in Server", value="\n".join(similar[:5]) if similar else "✅ None found", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @verify_group.command(name="unverify", description="Remove verification from a member")
    @app_commands.describe(member="Member to unverify")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def verify_unverify(self, interaction: discord.Interaction, member: discord.Member):
        vcfg = self.get_guild_config(interaction.guild.id)
        vdata = load_data(DATA_PATH)
        gid = str(interaction.guild.id)
        uid = str(member.id)

        if gid in vdata and uid in vdata[gid]:
            vdata[gid][uid]["verified"] = False
            save_data(DATA_PATH, vdata)

        verified_role_id = vcfg.get("verified_role")
        unverified_role_id = vcfg.get("unverified_role")
        if verified_role_id:
            vr = interaction.guild.get_role(int(verified_role_id))
            if vr and vr in member.roles:
                await member.remove_roles(vr, reason=f"Unverified by {interaction.user}")
        if unverified_role_id:
            ur = interaction.guild.get_role(int(unverified_role_id))
            if ur and ur not in member.roles:
                await member.add_roles(ur, reason=f"Unverified by {interaction.user}")

        await interaction.response.send_message(f"✅ {member.mention} has been unverified.", ephemeral=True)

    @verify_group.command(name="lockdown", description="Apply channel permissions: unverified can only see the verify channel")
    @app_commands.describe(
        verify_channel="The verify channel (overrides stored value)",
        unverified_role="The unverified role (overrides stored value)",
        verified_role="The verified role (overrides stored value)",
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def verify_lockdown(
        self,
        interaction: discord.Interaction,
        verify_channel: discord.TextChannel = None,
        unverified_role: discord.Role = None,
        verified_role: discord.Role = None,
    ):
        await interaction.response.defer(ephemeral=True)
        guild = interaction.guild
        vcfg = self.get_guild_config(guild.id)

        vc_id = vcfg.get("verify_channel")
        ur_id = vcfg.get("unverified_role")
        vr_id = vcfg.get("verified_role")

        if verify_channel:
            vc_id = str(verify_channel.id)
        if unverified_role:
            ur_id = str(unverified_role.id)
        if verified_role:
            vr_id = str(verified_role.id)

        if not ur_id:
            await interaction.followup.send("❌ No unverified role set. Run `/verify setup` first or pass the role here.", ephemeral=True)
            return
        if not vc_id:
            await interaction.followup.send("❌ No verify channel set. Run `/verify setup` first or pass the channel here.", ephemeral=True)
            return

        ur = guild.get_role(int(ur_id))
        vr = guild.get_role(int(vr_id)) if vr_id else None
        vc = guild.get_channel(int(vc_id))

        if not ur:
            await interaction.followup.send("❌ Unverified role not found in this server.", ephemeral=True)
            return
        if not vc:
            await interaction.followup.send("❌ Verify channel not found in this server.", ephemeral=True)
            return

        updated = 0
        skipped = 0
        errors = 0

        all_channels = list(guild.text_channels) + list(guild.voice_channels) + list(guild.categories)

        for channel in all_channels:
            try:
                if channel.id == int(vc_id):
                    await channel.set_permissions(
                        ur,
                        view_channel=True,
                        send_messages=True,
                        read_message_history=True,
                        reason="Verification lockdown: unverified can only access this channel"
                    )
                else:
                    await channel.set_permissions(
                        ur,
                        view_channel=False,
                        reason="Verification lockdown: hidden from unverified members"
                    )

                if vr:
                    await channel.set_permissions(
                        vr,
                        view_channel=True,
                        reason="Verification lockdown: verified members can see all channels"
                    )

                updated += 1
            except discord.Forbidden:
                skipped += 1
            except Exception:
                errors += 1

        vcfg["verify_channel"] = vc_id
        if ur_id:
            vcfg["unverified_role"] = ur_id
        if vr_id:
            vcfg["verified_role"] = vr_id
        self.set_guild_config(guild.id, vcfg)

        embed = discord.Embed(
            title="🔒 Verification Lockdown Applied",
            color=discord.Color.green()
        )
        embed.add_field(name="Unverified Role", value=ur.mention, inline=True)
        embed.add_field(name="Verified Role", value=vr.mention if vr else "Not set", inline=True)
        embed.add_field(name="Verify Channel", value=vc.mention, inline=True)
        embed.add_field(name="Channels Updated", value=str(updated), inline=True)
        embed.add_field(name="Skipped (no permission)", value=str(skipped), inline=True)
        embed.add_field(name="Errors", value=str(errors), inline=True)
        embed.add_field(
            name="Result",
            value=(
                f"• {ur.mention} can **only** see {vc.mention}\n"
                f"• {ur.mention} is **hidden** from all other channels\n"
                + (f"• {vr.mention} has **view access** to all channels" if vr else "")
            ),
            inline=False
        )
        await interaction.followup.send(embed=embed, ephemeral=True)

    ban_group = app_commands.Group(name="banid", description="Ban management with full logging")

    @ban_group.command(name="user", description="Ban a user and log all their information")
    @app_commands.describe(
        member="Member to ban",
        reason="Reason for the ban",
        delete_days="Days of messages to delete (0-7)",
    )
    @app_commands.checks.has_permissions(ban_members=True)
    async def ban_user(
        self,
        interaction: discord.Interaction,
        member: discord.Member,
        reason: str = "No reason provided",
        delete_days: int = 0,
    ):
        await interaction.response.defer(ephemeral=True)
        guild = interaction.guild
        vcfg = self.get_guild_config(guild.id)
        gid = str(guild.id)
        uid = str(member.id)

        age_days = account_age_days(member)
        flags = get_user_flags(member)
        now = datetime.datetime.now(datetime.timezone.utc)

        ban_record = {
            "username": str(member),
            "display_name": member.display_name,
            "user_id": uid,
            "account_created": member.created_at.isoformat(),
            "account_age_days": age_days,
            "joined_at": member.joined_at.isoformat() if member.joined_at else None,
            "avatar": str(member.display_avatar.url),
            "default_avatar": member.default_avatar == member.display_avatar,
            "flags": flags,
            "roles": [{"id": str(r.id), "name": r.name} for r in member.roles[1:]],
            "reason": reason,
            "banned_by": str(interaction.user),
            "banned_by_id": str(interaction.user.id),
            "banned_at": now.isoformat(),
        }

        banned_data = load_data(BANNED_PATH)
        if gid not in banned_data:
            banned_data[gid] = {}
        banned_data[gid][uid] = ban_record
        save_data(BANNED_PATH, banned_data)

        try:
            await member.ban(reason=f"Banned by {interaction.user}: {reason}", delete_message_days=min(max(delete_days, 0), 7))
        except discord.Forbidden:
            await interaction.followup.send("❌ I don't have permission to ban this member.", ephemeral=True)
            return

        log_channel_id = vcfg.get("log_channel")
        if log_channel_id:
            lc = guild.get_channel(int(log_channel_id))
            if lc:
                embed = discord.Embed(
                    title="🔨 Member Banned",
                    color=discord.Color.red(),
                    timestamp=now
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                embed.add_field(name="👤 User", value=f"{member} (`{member.id}`)", inline=True)
                embed.add_field(name="🏷️ Display Name", value=member.display_name, inline=True)
                embed.add_field(name="📅 Account Created", value=discord.utils.format_dt(member.created_at, style="F"), inline=True)
                embed.add_field(name="⏳ Account Age", value=f"{age_days} days", inline=True)
                embed.add_field(name="📥 Joined Server", value=discord.utils.format_dt(member.joined_at, style="F") if member.joined_at else "Unknown", inline=True)
                embed.add_field(name="🏅 Badges", value=", ".join(flags) if flags else "None", inline=True)
                embed.add_field(name="🏷️ Roles at ban", value=", ".join(r["name"] for r in ban_record["roles"]) or "None", inline=False)
                embed.add_field(name="📝 Reason", value=reason, inline=False)
                embed.add_field(name="🔨 Banned By", value=f"{interaction.user.mention} (`{interaction.user}`)", inline=True)
                embed.add_field(name="🖼️ Avatar", value=f"[View]({member.display_avatar.url})", inline=True)
                embed.set_footer(text=f"User ID: {member.id}")
                await lc.send(embed=embed)

        await interaction.followup.send(f"✅ **{member}** has been banned. Their information has been logged.", ephemeral=True)

    @ban_group.command(name="lookup", description="Look up a banned user's stored information")
    @app_commands.describe(user_id="The ID of the banned user")
    @app_commands.checks.has_permissions(ban_members=True)
    async def ban_lookup(self, interaction: discord.Interaction, user_id: str):
        gid = str(interaction.guild.id)
        banned_data = load_data(BANNED_PATH)
        record = banned_data.get(gid, {}).get(user_id)
        if not record:
            await interaction.response.send_message("No ban record found for that user ID.", ephemeral=True)
            return

        embed = discord.Embed(title=f"🔨 Ban Record — {record['username']}", color=discord.Color.red())
        embed.set_thumbnail(url=record.get("avatar", ""))
        embed.add_field(name="Username", value=record["username"], inline=True)
        embed.add_field(name="User ID", value=record["user_id"], inline=True)
        embed.add_field(name="Account Age at Ban", value=f"{record['account_age_days']} days", inline=True)
        embed.add_field(name="Account Created", value=record["account_created"][:10], inline=True)
        embed.add_field(name="Joined Server", value=record.get("joined_at", "Unknown")[:10] if record.get("joined_at") else "Unknown", inline=True)
        embed.add_field(name="Badges", value=", ".join(record.get("flags", [])) or "None", inline=True)
        embed.add_field(name="Roles at Ban", value=", ".join(r["name"] for r in record.get("roles", [])) or "None", inline=False)
        embed.add_field(name="Reason", value=record["reason"], inline=False)
        embed.add_field(name="Banned By", value=record["banned_by"], inline=True)
        embed.add_field(name="Banned At", value=record["banned_at"][:19].replace("T", " "), inline=True)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @ban_group.command(name="list", description="List all banned users with stored records")
    @app_commands.checks.has_permissions(ban_members=True)
    async def ban_list(self, interaction: discord.Interaction):
        gid = str(interaction.guild.id)
        banned_data = load_data(BANNED_PATH)
        records = banned_data.get(gid, {})
        if not records:
            await interaction.response.send_message("No ban records stored yet.", ephemeral=True)
            return

        lines = []
        for uid, r in list(records.items())[:25]:
            lines.append(f"• `{r['username']}` (ID: `{uid}`) — {r['reason'][:40]} — by {r['banned_by']}")

        embed = discord.Embed(title=f"🔨 Ban Records ({len(records)} total)", description="\n".join(lines), color=discord.Color.red())
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Verification(bot))
