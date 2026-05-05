import discord
from discord import app_commands
from discord.ext import commands
import json
import re


PROFILE_PATH = "data/profile_roles.json"


def load_profile():
    try:
        with open(PROFILE_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def save_profile(data):
    with open(PROFILE_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_guild(data: dict, guild_id: str) -> dict:
    return data.get(guild_id, {
        "status_roles": [],
        "bio_roles": [],
        "bio_badwords": [],
        "bio_badword_action": "warn",
        "badge_role": None
    })


class ProfileWatch(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def log_action(self, guild: discord.Guild, embed: discord.Embed):
        log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
        if log_channel:
            await log_channel.send(embed=embed)

    @commands.Cog.listener()
    async def on_presence_update(self, before: discord.Member, after: discord.Member):
        if after.bot or not after.guild:
            return
        data = load_profile()
        cfg = get_guild(data, str(after.guild.id))
        status_roles = cfg.get("status_roles", [])
        if not status_roles:
            return
        after_status = ""
        for activity in after.activities:
            if isinstance(activity, discord.CustomActivity) and activity.name:
                after_status = activity.name.lower()
                break
            elif hasattr(activity, "name") and activity.name:
                after_status = activity.name.lower()
                break
        for entry in status_roles:
            trigger = entry["trigger"].lower()
            role = after.guild.get_role(entry["role_id"])
            if not role:
                continue
            has_role = role in after.roles
            should_have = trigger in after_status
            try:
                if should_have and not has_role:
                    await after.add_roles(role, reason=f"Status contains: {trigger}")
                elif not should_have and has_role and entry.get("remove_when_gone", True):
                    await after.remove_roles(role, reason=f"Status no longer contains: {trigger}")
            except discord.Forbidden:
                pass

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        if after.bot or not after.guild:
            return
        data = load_profile()
        cfg = get_guild(data, str(after.guild.id))
        badge_role_id = cfg.get("badge_role")
        if badge_role_id:
            role = after.guild.get_role(badge_role_id)
            if role:
                has_server_tag = after.flags.started_onboarding if hasattr(after.flags, "started_onboarding") else False
                try:
                    if has_server_tag and role not in after.roles:
                        await after.add_roles(role, reason="Has server tag/badge")
                    elif not has_server_tag and role in after.roles:
                        await after.remove_roles(role, reason="No longer has server tag/badge")
                except discord.Forbidden:
                    pass

    status_role_group = app_commands.Group(name="status-role", description="Give roles based on member status text")

    @status_role_group.command(name="add", description="Give a role to members whose status contains a keyword")
    @app_commands.describe(trigger="The keyword to look for in status", role="Role to give", remove_when_gone="Remove role when status no longer matches")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def status_role_add(self, interaction: discord.Interaction, trigger: str, role: discord.Role, remove_when_gone: bool = True):
        data = load_profile()
        gid = str(interaction.guild.id)
        if gid not in data:
            data[gid] = {"status_roles": [], "bio_roles": [], "bio_badwords": [], "bio_badword_action": "warn", "badge_role": None}
        if any(e["trigger"].lower() == trigger.lower() for e in data[gid].get("status_roles", [])):
            await interaction.response.send_message(f"A status-role for `{trigger}` already exists.", ephemeral=True)
            return
        data[gid].setdefault("status_roles", []).append({
            "trigger": trigger,
            "role_id": role.id,
            "remove_when_gone": remove_when_gone
        })
        save_profile(data)
        embed = discord.Embed(title="Status Role Added", color=discord.Color.green())
        embed.add_field(name="Trigger", value=f"`{trigger}`", inline=True)
        embed.add_field(name="Role", value=role.mention, inline=True)
        embed.add_field(name="Remove When Gone", value="Yes" if remove_when_gone else "No", inline=True)
        embed.set_footer(text="Members whose status contains this text will receive the role automatically.")
        await interaction.response.send_message(embed=embed)

    @status_role_group.command(name="remove", description="Remove a status-role rule")
    @app_commands.describe(trigger="The trigger to remove")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def status_role_remove(self, interaction: discord.Interaction, trigger: str):
        data = load_profile()
        gid = str(interaction.guild.id)
        before = len(data.get(gid, {}).get("status_roles", []))
        data.setdefault(gid, {}).setdefault("status_roles", [])
        data[gid]["status_roles"] = [e for e in data[gid]["status_roles"] if e["trigger"].lower() != trigger.lower()]
        if len(data[gid]["status_roles"]) == before:
            await interaction.response.send_message(f"No status-role found for `{trigger}`.", ephemeral=True)
            return
        save_profile(data)
        await interaction.response.send_message(f"Removed status-role rule for `{trigger}`.")

    @status_role_group.command(name="list", description="List all status-role rules")
    async def status_role_list(self, interaction: discord.Interaction):
        data = load_profile()
        rules = data.get(str(interaction.guild.id), {}).get("status_roles", [])
        if not rules:
            await interaction.response.send_message("No status-role rules set.", ephemeral=True)
            return
        embed = discord.Embed(title="Status Roles", color=discord.Color.blurple())
        for e in rules:
            role = interaction.guild.get_role(e["role_id"])
            embed.add_field(
                name=f"`{e['trigger']}`",
                value=f"Role: {role.mention if role else 'Deleted'} | Remove when gone: {'Yes' if e.get('remove_when_gone', True) else 'No'}",
                inline=False
            )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    bio_role_group = app_commands.Group(name="bio-role", description="Give roles based on member bio content")

    @bio_role_group.command(name="add", description="Give a role to members whose bio contains a keyword")
    @app_commands.describe(trigger="The keyword to look for in bio", role="Role to give")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def bio_role_add(self, interaction: discord.Interaction, trigger: str, role: discord.Role):
        data = load_profile()
        gid = str(interaction.guild.id)
        if gid not in data:
            data[gid] = {"status_roles": [], "bio_roles": [], "bio_badwords": [], "bio_badword_action": "warn", "badge_role": None}
        data[gid].setdefault("bio_roles", []).append({"trigger": trigger, "role_id": role.id})
        save_profile(data)
        embed = discord.Embed(title="Bio Role Added", color=discord.Color.green())
        embed.add_field(name="Trigger", value=f"`{trigger}`", inline=True)
        embed.add_field(name="Role", value=role.mention, inline=True)
        embed.set_footer(text="Note: Requires members to run /checkbio to verify their bio manually, as Discord limits bot bio access.")
        await interaction.response.send_message(embed=embed)

    @bio_role_group.command(name="remove", description="Remove a bio-role rule")
    @app_commands.describe(trigger="The trigger to remove")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def bio_role_remove(self, interaction: discord.Interaction, trigger: str):
        data = load_profile()
        gid = str(interaction.guild.id)
        data.setdefault(gid, {}).setdefault("bio_roles", [])
        data[gid]["bio_roles"] = [e for e in data[gid]["bio_roles"] if e["trigger"].lower() != trigger.lower()]
        save_profile(data)
        await interaction.response.send_message(f"Removed bio-role rule for `{trigger}`.")

    @bio_role_group.command(name="list", description="List all bio-role rules")
    async def bio_role_list(self, interaction: discord.Interaction):
        data = load_profile()
        rules = data.get(str(interaction.guild.id), {}).get("bio_roles", [])
        if not rules:
            await interaction.response.send_message("No bio-role rules set.", ephemeral=True)
            return
        embed = discord.Embed(title="Bio Roles", color=discord.Color.blurple())
        for e in rules:
            role = interaction.guild.get_role(e["role_id"])
            embed.add_field(name=f"`{e['trigger']}`", value=role.mention if role else "Deleted", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="checkbio", description="Verify your bio and claim any bio-based roles")
    @app_commands.describe(bio="Paste your Discord bio here to verify it")
    async def checkbio(self, interaction: discord.Interaction, bio: str):
        data = load_profile()
        gid = str(interaction.guild.id)
        cfg = get_guild(data, gid)
        bio_lower = bio.lower()
        bad_words = cfg.get("bio_badwords", [])
        bio_badword_action = cfg.get("bio_badword_action", "warn")
        for word in bad_words:
            if word.lower() in bio_lower:
                embed = discord.Embed(
                    title="Bio Violation",
                    description=f"Your bio contains a blacklisted word. Please update it before verifying.",
                    color=discord.Color.red()
                )
                await interaction.response.send_message(embed=embed, ephemeral=True)
                if bio_badword_action == "kick":
                    try:
                        await interaction.user.kick(reason="Bio contains blacklisted word")
                    except Exception:
                        pass
                elif bio_badword_action == "warn":
                    log_embed = discord.Embed(title="Bio Violation Detected", color=discord.Color.red())
                    log_embed.add_field(name="User", value=str(interaction.user), inline=True)
                    log_embed.add_field(name="Trigger Word", value=f"`{word}`", inline=True)
                    await self.log_action(interaction.guild, log_embed)
                return
        bio_roles = cfg.get("bio_roles", [])
        given_roles = []
        for entry in bio_roles:
            if entry["trigger"].lower() in bio_lower:
                role = interaction.guild.get_role(entry["role_id"])
                if role and role not in interaction.user.roles:
                    try:
                        await interaction.user.add_roles(role, reason="Bio verification match")
                        given_roles.append(role.mention)
                    except discord.Forbidden:
                        pass
        if given_roles:
            embed = discord.Embed(
                title="Bio Verified!",
                description=f"You received the following roles based on your bio:\n{', '.join(given_roles)}",
                color=discord.Color.green()
            )
        else:
            embed = discord.Embed(
                title="Bio Checked",
                description="No bio-role rules matched your bio, or you already have all matching roles.",
                color=discord.Color.blurple()
            )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    bio_badword_group = app_commands.Group(name="bio-badword", description="Manage blacklisted words for member bios")

    @bio_badword_group.command(name="add", description="Add a blacklisted word that triggers action if found in bio")
    @app_commands.describe(word="Word to blacklist from bios")
    @app_commands.checks.has_permissions(administrator=True)
    async def bio_badword_add(self, interaction: discord.Interaction, word: str):
        data = load_profile()
        gid = str(interaction.guild.id)
        if gid not in data:
            data[gid] = {"status_roles": [], "bio_roles": [], "bio_badwords": [], "bio_badword_action": "warn", "badge_role": None}
        words = data[gid].setdefault("bio_badwords", [])
        if word.lower() not in words:
            words.append(word.lower())
            save_profile(data)
        await interaction.response.send_message(f"Added `{word}` to bio blacklist.", ephemeral=True)

    @bio_badword_group.command(name="remove", description="Remove a blacklisted bio word")
    @app_commands.describe(word="Word to remove from the blacklist")
    @app_commands.checks.has_permissions(administrator=True)
    async def bio_badword_remove(self, interaction: discord.Interaction, word: str):
        data = load_profile()
        gid = str(interaction.guild.id)
        words = data.get(gid, {}).get("bio_badwords", [])
        if word.lower() in words:
            words.remove(word.lower())
            data.setdefault(gid, {})["bio_badwords"] = words
            save_profile(data)
            await interaction.response.send_message(f"Removed `{word}` from bio blacklist.", ephemeral=True)
        else:
            await interaction.response.send_message(f"`{word}` is not in the bio blacklist.", ephemeral=True)

    @bio_badword_group.command(name="action", description="Set what happens when a bio violation is detected")
    @app_commands.describe(action="Action to take")
    @app_commands.choices(action=[
        app_commands.Choice(name="warn (log to mod-logs)", value="warn"),
        app_commands.Choice(name="kick (kick the member)", value="kick"),
        app_commands.Choice(name="none (do nothing)", value="none"),
    ])
    @app_commands.checks.has_permissions(administrator=True)
    async def bio_badword_action(self, interaction: discord.Interaction, action: str):
        data = load_profile()
        gid = str(interaction.guild.id)
        data.setdefault(gid, {})["bio_badword_action"] = action
        save_profile(data)
        await interaction.response.send_message(f"Bio bad word action set to **{action}**.")

    @bio_badword_group.command(name="list", description="List all blacklisted bio words")
    @app_commands.checks.has_permissions(administrator=True)
    async def bio_badword_list(self, interaction: discord.Interaction):
        data = load_profile()
        words = data.get(str(interaction.guild.id), {}).get("bio_badwords", [])
        action = data.get(str(interaction.guild.id), {}).get("bio_badword_action", "warn")
        if not words:
            await interaction.response.send_message("No bio blacklisted words set.", ephemeral=True)
            return
        embed = discord.Embed(title="Bio Blacklisted Words", color=discord.Color.red())
        embed.description = " • ".join(f"`{w}`" for w in words)
        embed.add_field(name="Action on Violation", value=action.title())
        await interaction.response.send_message(embed=embed, ephemeral=True)

    badge_role_group = app_commands.Group(name="badge-role", description="Give a role to members with the server badge/tag")

    @badge_role_group.command(name="set", description="Set a role to give members who have the server tag/badge")
    @app_commands.describe(role="The role to assign")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def badge_role_set(self, interaction: discord.Interaction, role: discord.Role):
        data = load_profile()
        gid = str(interaction.guild.id)
        data.setdefault(gid, {})["badge_role"] = role.id
        save_profile(data)
        embed = discord.Embed(title="Badge Role Set", color=discord.Color.green())
        embed.description = f"Members with the **server tag/badge** will receive {role.mention}."
        embed.set_footer(text="This role is assigned automatically when the bot detects the server badge flag.")
        await interaction.response.send_message(embed=embed)

    @badge_role_group.command(name="remove", description="Remove the badge role assignment")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def badge_role_remove(self, interaction: discord.Interaction):
        data = load_profile()
        gid = str(interaction.guild.id)
        data.setdefault(gid, {})["badge_role"] = None
        save_profile(data)
        await interaction.response.send_message("Removed badge role assignment.")

    @badge_role_group.command(name="scan", description="Scan all members and assign badge roles retroactively")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def badge_role_scan(self, interaction: discord.Interaction):
        await interaction.response.defer()
        data = load_profile()
        gid = str(interaction.guild.id)
        badge_role_id = data.get(gid, {}).get("badge_role")
        if not badge_role_id:
            await interaction.followup.send("No badge role set. Use `/badge-role set` first.", ephemeral=True)
            return
        role = interaction.guild.get_role(badge_role_id)
        if not role:
            await interaction.followup.send("The badge role no longer exists.", ephemeral=True)
            return
        given = 0
        for member in interaction.guild.members:
            if member.bot:
                continue
            has_badge = member.flags.started_onboarding if hasattr(member.flags, "started_onboarding") else False
            if has_badge and role not in member.roles:
                try:
                    await member.add_roles(role, reason="Badge role scan")
                    given += 1
                except discord.Forbidden:
                    pass
        await interaction.followup.send(f"Scan complete. Assigned badge role to **{given}** members.")

    giveaway_group = app_commands.Group(name="giveaway", description="Manage server giveaways")

    @giveaway_group.command(name="start", description="Start a giveaway")
    @app_commands.describe(
        channel="Channel to host the giveaway",
        duration="Duration (e.g. 10m, 1h, 1d)",
        winners="Number of winners",
        prize="What to give away",
        required_role="Role required to enter (optional)"
    )
    @app_commands.checks.has_permissions(manage_guild=True)
    async def giveaway_start(self, interaction: discord.Interaction, channel: discord.TextChannel, duration: str, winners: int, prize: str, required_role: discord.Role = None):
        units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        try:
            seconds = int(duration[:-1]) * units[duration[-1].lower()]
        except (ValueError, KeyError):
            await interaction.response.send_message("Invalid duration. Use format like `10m`, `2h`, `1d`.", ephemeral=True)
            return
        import time
        import datetime
        end_time = int(time.time()) + seconds
        end_dt = datetime.datetime.utcfromtimestamp(end_time).replace(tzinfo=datetime.timezone.utc)
        embed = discord.Embed(title=f"🎉 GIVEAWAY — {prize}", color=discord.Color.gold())
        embed.add_field(name="Prize", value=prize, inline=True)
        embed.add_field(name="Winners", value=str(winners), inline=True)
        embed.add_field(name="Ends", value=discord.utils.format_dt(end_dt, style="R"), inline=True)
        if required_role:
            embed.add_field(name="Required Role", value=required_role.mention, inline=True)
        embed.add_field(name="Hosted by", value=interaction.user.mention, inline=True)
        embed.set_footer(text="React with 🎉 to enter!")
        msg = await channel.send(embed=embed)
        await msg.add_reaction("🎉")
        await interaction.response.send_message(f"Giveaway started in {channel.mention}!", ephemeral=True)
        await __import__("asyncio").sleep(seconds)
        try:
            msg = await channel.fetch_message(msg.id)
            reaction = discord.utils.get(msg.reactions, emoji="🎉")
            if not reaction:
                await channel.send("No one entered the giveaway.")
                return
            users = [u async for u in reaction.users() if not u.bot]
            if required_role:
                guild = interaction.guild
                users = [u for u in users if guild.get_member(u.id) and required_role in guild.get_member(u.id).roles]
            if not users:
                await channel.send("No valid entries for the giveaway.")
                return
            import random
            actual_winners = min(winners, len(users))
            selected = random.sample(users, actual_winners)
            winner_mentions = " ".join(w.mention for w in selected)
            result_embed = discord.Embed(title=f"🎉 Giveaway Ended — {prize}", color=discord.Color.green())
            result_embed.add_field(name="Winners", value=winner_mentions, inline=False)
            result_embed.add_field(name="Prize", value=prize, inline=True)
            result_embed.add_field(name="Hosted by", value=interaction.user.mention, inline=True)
            await channel.send(content=winner_mentions, embed=result_embed)
        except Exception as e:
            await channel.send(f"Giveaway ended but encountered an error: {e}")

    @giveaway_group.command(name="end", description="End a giveaway early by message ID")
    @app_commands.describe(message_id="The message ID of the giveaway", channel="The channel with the giveaway")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def giveaway_end(self, interaction: discord.Interaction, message_id: str, channel: discord.TextChannel = None):
        target_channel = channel or interaction.channel
        try:
            msg = await target_channel.fetch_message(int(message_id))
            reaction = discord.utils.get(msg.reactions, emoji="🎉")
            if not reaction:
                await interaction.response.send_message("No 🎉 entries found.", ephemeral=True)
                return
            users = [u async for u in reaction.users() if not u.bot]
            if not users:
                await interaction.response.send_message("No valid entries.", ephemeral=True)
                return
            import random
            winner = random.choice(users)
            prize = msg.embeds[0].title.replace("🎉 GIVEAWAY — ", "") if msg.embeds else "Unknown Prize"
            result_embed = discord.Embed(title=f"🎉 Giveaway Ended — {prize}", color=discord.Color.green())
            result_embed.add_field(name="Winner", value=winner.mention, inline=False)
            await target_channel.send(content=winner.mention, embed=result_embed)
            await interaction.response.send_message(f"Giveaway ended. Winner: {winner.mention}", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"Error: {e}", ephemeral=True)

    @giveaway_group.command(name="reroll", description="Reroll a giveaway winner by message ID")
    @app_commands.describe(message_id="The giveaway message ID", channel="The channel with the giveaway")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def giveaway_reroll(self, interaction: discord.Interaction, message_id: str, channel: discord.TextChannel = None):
        target_channel = channel or interaction.channel
        try:
            msg = await target_channel.fetch_message(int(message_id))
            reaction = discord.utils.get(msg.reactions, emoji="🎉")
            if not reaction:
                await interaction.response.send_message("No 🎉 entries found.", ephemeral=True)
                return
            users = [u async for u in reaction.users() if not u.bot]
            if not users:
                await interaction.response.send_message("No valid entries.", ephemeral=True)
                return
            import random
            winner = random.choice(users)
            await target_channel.send(f"🎉 Rerolled! New winner: {winner.mention}")
            await interaction.response.send_message(f"Rerolled. New winner: {winner.mention}", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"Error: {e}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(ProfileWatch(bot))
