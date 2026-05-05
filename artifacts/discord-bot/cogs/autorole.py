import discord
from discord import app_commands
from discord.ext import commands
import json
import os


AUTOROLES_PATH = "data/autoroles.json"
MAX_AUTOROLES = 10


def load_autoroles():
    try:
        with open(AUTOROLES_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def save_autoroles(data):
    with open(AUTOROLES_PATH, "w") as f:
        json.dump(data, f, indent=2)


class AutoRole(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        autoroles = load_autoroles()
        role_ids = autoroles.get(str(member.guild.id), {}).get("join_roles", [])
        roles = [member.guild.get_role(rid) for rid in role_ids if member.guild.get_role(rid)]
        if roles:
            try:
                await member.add_roles(*roles, reason="Auto-role on join")
            except discord.Forbidden:
                pass
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        welcome_channel_id = config.get(str(member.guild.id), {}).get("welcome_channel")
        welcome_msg = config.get(str(member.guild.id), {}).get("welcome_message")
        if welcome_channel_id and welcome_msg:
            channel = member.guild.get_channel(welcome_channel_id)
            if channel:
                msg = welcome_msg.replace("{user}", member.mention).replace("{server}", member.guild.name).replace("{count}", str(member.guild.member_count))
                embed = discord.Embed(description=msg, color=discord.Color.green())
                embed.set_thumbnail(url=member.display_avatar.url)
                await channel.send(embed=embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        leave_channel_id = config.get(str(member.guild.id), {}).get("leave_channel")
        leave_msg = config.get(str(member.guild.id), {}).get("leave_message")
        if leave_channel_id and leave_msg:
            channel = member.guild.get_channel(leave_channel_id)
            if channel:
                msg = leave_msg.replace("{user}", str(member)).replace("{server}", member.guild.name)
                embed = discord.Embed(description=msg, color=discord.Color.red())
                embed.set_thumbnail(url=member.display_avatar.url)
                await channel.send(embed=embed)

    autorole_group = app_commands.Group(name="autorole", description="Manage auto-roles given on member join")

    @autorole_group.command(name="add", description=f"Add a role to give new members on join (max {MAX_AUTOROLES})")
    @app_commands.describe(role="The role to auto-assign")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def autorole_add(self, interaction: discord.Interaction, role: discord.Role):
        if role.managed or role == interaction.guild.default_role:
            await interaction.response.send_message("Cannot auto-assign that role.", ephemeral=True)
            return
        if role >= interaction.guild.me.top_role:
            await interaction.response.send_message("That role is above my highest role — I can't assign it.", ephemeral=True)
            return
        autoroles = load_autoroles()
        gid = str(interaction.guild.id)
        if gid not in autoroles:
            autoroles[gid] = {"join_roles": []}
        if role.id in autoroles[gid]["join_roles"]:
            await interaction.response.send_message(f"{role.mention} is already an auto-role.", ephemeral=True)
            return
        if len(autoroles[gid]["join_roles"]) >= MAX_AUTOROLES:
            await interaction.response.send_message(f"Maximum of {MAX_AUTOROLES} auto-roles reached. Remove one first.", ephemeral=True)
            return
        autoroles[gid]["join_roles"].append(role.id)
        save_autoroles(autoroles)
        await interaction.response.send_message(f"Added {role.mention} as an auto-role. New members will receive it on join.")

    @autorole_group.command(name="remove", description="Remove an auto-role from the join list")
    @app_commands.describe(role="The role to remove")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def autorole_remove(self, interaction: discord.Interaction, role: discord.Role):
        autoroles = load_autoroles()
        gid = str(interaction.guild.id)
        join_roles = autoroles.get(gid, {}).get("join_roles", [])
        if role.id not in join_roles:
            await interaction.response.send_message(f"{role.mention} is not an auto-role.", ephemeral=True)
            return
        join_roles.remove(role.id)
        autoroles[gid]["join_roles"] = join_roles
        save_autoroles(autoroles)
        await interaction.response.send_message(f"Removed {role.mention} from auto-roles.")

    @autorole_group.command(name="list", description="List all auto-roles")
    async def autorole_list(self, interaction: discord.Interaction):
        autoroles = load_autoroles()
        join_roles = autoroles.get(str(interaction.guild.id), {}).get("join_roles", [])
        if not join_roles:
            await interaction.response.send_message("No auto-roles set. Use `/autorole add` to add one.", ephemeral=True)
            return
        embed = discord.Embed(title="Auto-Roles (On Join)", color=discord.Color.blurple())
        roles_text = []
        for rid in join_roles:
            role = interaction.guild.get_role(rid)
            roles_text.append(role.mention if role else f"~~Deleted role ({rid})~~")
        embed.description = "\n".join(f"• {r}" for r in roles_text)
        embed.set_footer(text=f"{len(join_roles)}/{MAX_AUTOROLES} slots used")
        await interaction.response.send_message(embed=embed)

    @autorole_group.command(name="clear", description="Remove all auto-roles")
    @app_commands.checks.has_permissions(administrator=True)
    async def autorole_clear(self, interaction: discord.Interaction):
        autoroles = load_autoroles()
        gid = str(interaction.guild.id)
        if gid in autoroles:
            autoroles[gid]["join_roles"] = []
            save_autoroles(autoroles)
        await interaction.response.send_message("Cleared all auto-roles.")

    exclusive_group = app_commands.Group(name="exclusive", description="Mutually exclusive roles — getting one removes the others")

    def _get_exclusive_groups(self, guild_id: int) -> list[list[int]]:
        autoroles = load_autoroles()
        return autoroles.get(str(guild_id), {}).get("exclusive_groups", [])

    def _save_exclusive_groups(self, guild_id: int, groups: list[list[int]]):
        autoroles = load_autoroles()
        gid = str(guild_id)
        if gid not in autoroles:
            autoroles[gid] = {}
        autoroles[gid]["exclusive_groups"] = groups
        save_autoroles(autoroles)

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        added = [r for r in after.roles if r not in before.roles]
        if not added:
            return
        groups = self._get_exclusive_groups(after.guild.id)
        to_remove = []
        for role in added:
            for group in groups:
                if role.id in group:
                    for other_id in group:
                        if other_id == role.id:
                            continue
                        other_role = after.guild.get_role(other_id)
                        if other_role and other_role in after.roles:
                            to_remove.append(other_role)
        if to_remove:
            try:
                await after.remove_roles(*to_remove, reason="Exclusive role group — auto-removed conflicting roles")
            except discord.Forbidden:
                pass

    @exclusive_group.command(name="add", description="Make two roles mutually exclusive (getting one removes the other)")
    @app_commands.describe(role1="First role", role2="Second role")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def exclusive_add(self, interaction: discord.Interaction, role1: discord.Role, role2: discord.Role):
        if role1 == role2:
            await interaction.response.send_message("Both roles are the same.", ephemeral=True)
            return
        groups = self._get_exclusive_groups(interaction.guild.id)
        for group in groups:
            if role1.id in group and role2.id in group:
                await interaction.response.send_message(f"{role1.mention} and {role2.mention} are already in the same exclusive group.", ephemeral=True)
                return
            if role1.id in group:
                if role2.id not in group:
                    group.append(role2.id)
                self._save_exclusive_groups(interaction.guild.id, groups)
                await interaction.response.send_message(f"Added {role2.mention} to the existing group containing {role1.mention}.")
                return
            if role2.id in group:
                if role1.id not in group:
                    group.append(role1.id)
                self._save_exclusive_groups(interaction.guild.id, groups)
                await interaction.response.send_message(f"Added {role1.mention} to the existing group containing {role2.mention}.")
                return
        groups.append([role1.id, role2.id])
        self._save_exclusive_groups(interaction.guild.id, groups)
        await interaction.response.send_message(f"✅ {role1.mention} and {role2.mention} are now mutually exclusive. Getting one will automatically remove the other.")

    @exclusive_group.command(name="group", description="Create a group of mutually exclusive roles (up to 10)")
    @app_commands.describe(
        role1="Role 1", role2="Role 2", role3="Role 3 (optional)",
        role4="Role 4 (optional)", role5="Role 5 (optional)",
    )
    @app_commands.checks.has_permissions(manage_roles=True)
    async def exclusive_group_cmd(
        self,
        interaction: discord.Interaction,
        role1: discord.Role,
        role2: discord.Role,
        role3: discord.Role = None,
        role4: discord.Role = None,
        role5: discord.Role = None,
    ):
        all_roles = [r for r in [role1, role2, role3, role4, role5] if r is not None]
        unique_ids = list(dict.fromkeys(r.id for r in all_roles))
        if len(unique_ids) < 2:
            await interaction.response.send_message("Need at least 2 different roles.", ephemeral=True)
            return
        groups = self._get_exclusive_groups(interaction.guild.id)
        groups = [g for g in groups if not any(rid in g for rid in unique_ids)]
        groups.append(unique_ids)
        self._save_exclusive_groups(interaction.guild.id, groups)
        mentions = " | ".join(interaction.guild.get_role(rid).mention for rid in unique_ids if interaction.guild.get_role(rid))
        await interaction.response.send_message(f"✅ Exclusive role group created:\n{mentions}\n\nAssigning any one of these will automatically remove the others.")

    @exclusive_group.command(name="list", description="Show all exclusive role groups")
    async def exclusive_list(self, interaction: discord.Interaction):
        groups = self._get_exclusive_groups(interaction.guild.id)
        if not groups:
            await interaction.response.send_message("No exclusive role groups set. Use `/exclusive add` or `/exclusive group`.", ephemeral=True)
            return
        embed = discord.Embed(title="🔄 Exclusive Role Groups", color=discord.Color.blurple())
        embed.description = "Members can only hold **one** role from each group at a time.\n\n"
        for i, group in enumerate(groups, 1):
            mentions = []
            for rid in group:
                role = interaction.guild.get_role(rid)
                mentions.append(role.mention if role else f"~~Deleted ({rid})~~")
            embed.add_field(name=f"Group {i}", value=" | ".join(mentions), inline=False)
        await interaction.response.send_message(embed=embed)

    @exclusive_group.command(name="remove", description="Remove a role from its exclusive group (deletes the group if only 2 remain)")
    @app_commands.describe(role="The role to remove from exclusive groups")
    @app_commands.checks.has_permissions(manage_roles=True)
    async def exclusive_remove(self, interaction: discord.Interaction, role: discord.Role):
        groups = self._get_exclusive_groups(interaction.guild.id)
        new_groups = []
        found = False
        for group in groups:
            if role.id in group:
                found = True
                group.remove(role.id)
                if len(group) >= 2:
                    new_groups.append(group)
            else:
                new_groups.append(group)
        if not found:
            await interaction.response.send_message(f"{role.mention} is not in any exclusive group.", ephemeral=True)
            return
        self._save_exclusive_groups(interaction.guild.id, new_groups)
        await interaction.response.send_message(f"✅ {role.mention} removed from its exclusive group.")

    @exclusive_group.command(name="clear", description="Delete all exclusive role groups")
    @app_commands.checks.has_permissions(administrator=True)
    async def exclusive_clear(self, interaction: discord.Interaction):
        self._save_exclusive_groups(interaction.guild.id, [])
        await interaction.response.send_message("✅ All exclusive role groups cleared.")

    welcome_group = app_commands.Group(name="welcome", description="Configure welcome and leave messages")

    @welcome_group.command(name="set", description="Set the welcome message for new members")
    @app_commands.describe(channel="Channel to send welcome messages in", message="Welcome message (use {user}, {server}, {count})")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def welcome_set(self, interaction: discord.Interaction, channel: discord.TextChannel, message: str):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        gid = str(interaction.guild.id)
        if gid not in config:
            config[gid] = {}
        config[gid]["welcome_channel"] = channel.id
        config[gid]["welcome_message"] = message
        with open("data/config.json", "w") as f:
            json.dump(config, f, indent=2)
        preview = message.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name).replace("{count}", str(interaction.guild.member_count))
        embed = discord.Embed(title="Welcome Message Set", color=discord.Color.green())
        embed.add_field(name="Channel", value=channel.mention)
        embed.add_field(name="Preview", value=preview, inline=False)
        await interaction.response.send_message(embed=embed)

    @welcome_group.command(name="leave", description="Set the leave message when members leave")
    @app_commands.describe(channel="Channel to send leave messages in", message="Leave message (use {user}, {server})")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def welcome_leave(self, interaction: discord.Interaction, channel: discord.TextChannel, message: str):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        gid = str(interaction.guild.id)
        if gid not in config:
            config[gid] = {}
        config[gid]["leave_channel"] = channel.id
        config[gid]["leave_message"] = message
        with open("data/config.json", "w") as f:
            json.dump(config, f, indent=2)
        await interaction.response.send_message(f"Leave message set in {channel.mention}.")

    @welcome_group.command(name="disable", description="Disable welcome or leave messages")
    @app_commands.describe(which="Which message to disable")
    @app_commands.choices(which=[
        app_commands.Choice(name="welcome", value="welcome"),
        app_commands.Choice(name="leave", value="leave"),
        app_commands.Choice(name="both", value="both"),
    ])
    @app_commands.checks.has_permissions(manage_guild=True)
    async def welcome_disable(self, interaction: discord.Interaction, which: str = "both"):
        try:
            with open("data/config.json", "r") as f:
                config = json.load(f)
        except Exception:
            config = {}
        gid = str(interaction.guild.id)
        if gid in config:
            if which in ("welcome", "both"):
                config[gid].pop("welcome_channel", None)
                config[gid].pop("welcome_message", None)
            if which in ("leave", "both"):
                config[gid].pop("leave_channel", None)
                config[gid].pop("leave_message", None)
        with open("data/config.json", "w") as f:
            json.dump(config, f, indent=2)
        await interaction.response.send_message(f"Disabled {which} message(s).")


async def setup(bot: commands.Bot):
    await bot.add_cog(AutoRole(bot))
