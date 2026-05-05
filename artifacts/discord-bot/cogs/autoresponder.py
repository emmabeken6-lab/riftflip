import discord
from discord import app_commands
from discord.ext import commands
import json
import re


AR_PATH = "data/autoresponders.json"
MAX_RESPONDERS = 50


def load_ar():
    try:
        with open(AR_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def save_ar(data):
    with open(AR_PATH, "w") as f:
        json.dump(data, f, indent=2)


class AutoResponder(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        ar = load_ar()
        guild_responders = ar.get(str(message.guild.id), [])
        content_lower = message.content.lower()
        for entry in guild_responders:
            trigger = entry["trigger"].lower()
            match_type = entry.get("match", "contains")
            response = entry["response"]
            matched = False
            if match_type == "exact":
                matched = content_lower == trigger
            elif match_type == "startswith":
                matched = content_lower.startswith(trigger)
            elif match_type == "regex":
                try:
                    matched = bool(re.search(trigger, message.content, re.IGNORECASE))
                except re.error:
                    pass
            else:
                matched = trigger in content_lower
            if matched:
                resp = response.replace("{user}", message.author.mention).replace("{server}", message.guild.name)
                try:
                    if entry.get("reply"):
                        await message.reply(resp, mention_author=False)
                    else:
                        await message.channel.send(resp)
                except discord.Forbidden:
                    pass
                if entry.get("delete_trigger"):
                    try:
                        await message.delete()
                    except discord.Forbidden:
                        pass
                break

    ar_group = app_commands.Group(name="autoresponder", description="Manage auto-responses to trigger words/phrases")

    @ar_group.command(name="add", description="Add an auto-response trigger")
    @app_commands.describe(
        trigger="Word or phrase that triggers the response",
        response="The bot's response (use {user} and {server})",
        match="How to match the trigger (default: contains)",
        reply="Reply to the message instead of sending new one",
        delete_trigger="Delete the trigger message after responding"
    )
    @app_commands.choices(match=[
        app_commands.Choice(name="contains (default)", value="contains"),
        app_commands.Choice(name="exact match", value="exact"),
        app_commands.Choice(name="starts with", value="startswith"),
        app_commands.Choice(name="regex", value="regex"),
    ])
    @app_commands.checks.has_permissions(manage_messages=True)
    async def ar_add(self, interaction: discord.Interaction, trigger: str, response: str, match: str = "contains", reply: bool = False, delete_trigger: bool = False):
        ar = load_ar()
        gid = str(interaction.guild.id)
        if gid not in ar:
            ar[gid] = []
        if len(ar[gid]) >= MAX_RESPONDERS:
            await interaction.response.send_message(f"Maximum of {MAX_RESPONDERS} auto-responders reached.", ephemeral=True)
            return
        if any(e["trigger"].lower() == trigger.lower() for e in ar[gid]):
            await interaction.response.send_message(f"A responder for `{trigger}` already exists. Remove it first.", ephemeral=True)
            return
        ar[gid].append({"trigger": trigger, "response": response, "match": match, "reply": reply, "delete_trigger": delete_trigger})
        save_ar(ar)
        embed = discord.Embed(title="Auto-Responder Added", color=discord.Color.green())
        embed.add_field(name="Trigger", value=f"`{trigger}`", inline=True)
        embed.add_field(name="Match Type", value=match, inline=True)
        embed.add_field(name="Response", value=response[:200], inline=False)
        embed.add_field(name="Options", value=f"Reply: {'Yes' if reply else 'No'} | Delete trigger: {'Yes' if delete_trigger else 'No'}", inline=False)
        await interaction.response.send_message(embed=embed)

    @ar_group.command(name="remove", description="Remove an auto-responder by trigger")
    @app_commands.describe(trigger="The trigger to remove")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def ar_remove(self, interaction: discord.Interaction, trigger: str):
        ar = load_ar()
        gid = str(interaction.guild.id)
        before = len(ar.get(gid, []))
        ar[gid] = [e for e in ar.get(gid, []) if e["trigger"].lower() != trigger.lower()]
        if len(ar.get(gid, [])) == before:
            await interaction.response.send_message(f"No auto-responder found for `{trigger}`.", ephemeral=True)
            return
        save_ar(ar)
        await interaction.response.send_message(f"Removed auto-responder for `{trigger}`.")

    @ar_group.command(name="list", description="List all auto-responders for this server")
    async def ar_list(self, interaction: discord.Interaction):
        ar = load_ar()
        responders = ar.get(str(interaction.guild.id), [])
        if not responders:
            await interaction.response.send_message("No auto-responders set. Use `/autoresponder add` to create one.", ephemeral=True)
            return
        embed = discord.Embed(title=f"Auto-Responders ({len(responders)}/{MAX_RESPONDERS})", color=discord.Color.blurple())
        chunks = []
        for i, e in enumerate(responders, 1):
            chunks.append(f"**{i}.** `{e['trigger']}` ({e.get('match','contains')}) → {e['response'][:60]}{'...' if len(e['response']) > 60 else ''}")
        parts = []
        block = []
        for line in chunks:
            if sum(len(l) for l in block) + len(line) > 900:
                parts.append("\n".join(block))
                block = []
            block.append(line)
        if block:
            parts.append("\n".join(block))
        embed.description = parts[0] if parts else "None"
        if len(parts) > 1:
            embed.set_footer(text=f"Too many to show — {len(responders)} total")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @ar_group.command(name="clear", description="Delete all auto-responders for this server")
    @app_commands.checks.has_permissions(administrator=True)
    async def ar_clear(self, interaction: discord.Interaction):
        ar = load_ar()
        ar[str(interaction.guild.id)] = []
        save_ar(ar)
        await interaction.response.send_message("Cleared all auto-responders.")

    @ar_group.command(name="test", description="Test what an auto-responder returns for a given message")
    @app_commands.describe(message="Simulate a message to see if any responder triggers")
    async def ar_test(self, interaction: discord.Interaction, message: str):
        ar = load_ar()
        guild_responders = ar.get(str(interaction.guild.id), [])
        content_lower = message.lower()
        for entry in guild_responders:
            trigger = entry["trigger"].lower()
            match_type = entry.get("match", "contains")
            matched = False
            if match_type == "exact":
                matched = content_lower == trigger
            elif match_type == "startswith":
                matched = content_lower.startswith(trigger)
            elif match_type == "regex":
                try:
                    matched = bool(re.search(trigger, message, re.IGNORECASE))
                except re.error:
                    pass
            else:
                matched = trigger in content_lower
            if matched:
                resp = entry["response"].replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name)
                embed = discord.Embed(title="Match Found!", color=discord.Color.green())
                embed.add_field(name="Trigger", value=f"`{entry['trigger']}`", inline=True)
                embed.add_field(name="Match Type", value=match_type, inline=True)
                embed.add_field(name="Response", value=resp[:500], inline=False)
                await interaction.response.send_message(embed=embed, ephemeral=True)
                return
        await interaction.response.send_message(f"No auto-responder matched: `{message}`", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(AutoResponder(bot))
