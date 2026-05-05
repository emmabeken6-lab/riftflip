import discord
from discord import app_commands
from discord.ext import commands
import json
import asyncio

STICKY_PATH = "data/sticky.json"


def load_sticky() -> dict:
    try:
        with open(STICKY_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_sticky(data: dict):
    with open(STICKY_PATH, "w") as f:
        json.dump(data, f, indent=2)


class Sticky(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._locks: dict[int, asyncio.Lock] = {}

    def _lock_for(self, channel_id: int) -> asyncio.Lock:
        if channel_id not in self._locks:
            self._locks[channel_id] = asyncio.Lock()
        return self._locks[channel_id]

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        data = load_sticky()
        gid = str(message.guild.id)
        cid = str(message.channel.id)

        entry = data.get(gid, {}).get(cid)
        if not entry:
            return

        async with self._lock_for(message.channel.id):
            old_id = entry.get("last_message_id")
            if old_id:
                try:
                    old_msg = await message.channel.fetch_message(int(old_id))
                    await old_msg.delete()
                except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                    pass

            embed = discord.Embed(
                description=entry["message"],
                color=discord.Color.from_str(entry.get("color", "#f5a623"))
            )
            embed.set_footer(text="📌 Sticky Message")

            new_msg = await message.channel.send(embed=embed)

            data[gid][cid]["last_message_id"] = str(new_msg.id)
            save_sticky(data)

    sticky_group = app_commands.Group(name="sticky", description="Manage sticky messages that stay at the bottom of a channel")

    @sticky_group.command(name="set", description="Set a sticky message in a channel")
    @app_commands.describe(
        channel="Channel to stick the message in",
        message="The message to keep at the bottom",
        color="Embed color in hex (e.g. #ff0000). Default: orange",
    )
    @app_commands.checks.has_permissions(manage_messages=True)
    async def sticky_set(
        self,
        interaction: discord.Interaction,
        message: str,
        channel: discord.TextChannel = None,
        color: str = "#f5a623",
    ):
        dest = channel or interaction.channel

        try:
            embed_color = discord.Color.from_str(color)
        except ValueError:
            await interaction.response.send_message("Invalid color. Use hex format like `#ff0000`.", ephemeral=True)
            return

        data = load_sticky()
        gid = str(interaction.guild.id)
        cid = str(dest.id)

        if gid not in data:
            data[gid] = {}

        old_entry = data[gid].get(cid)
        if old_entry and old_entry.get("last_message_id"):
            try:
                old_msg = await dest.fetch_message(int(old_entry["last_message_id"]))
                await old_msg.delete()
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                pass

        embed = discord.Embed(description=message, color=embed_color)
        embed.set_footer(text="📌 Sticky Message")
        sent = await dest.send(embed=embed)

        data[gid][cid] = {
            "message": message,
            "color": color,
            "last_message_id": str(sent.id),
            "set_by": str(interaction.user.id),
        }
        save_sticky(data)

        await interaction.response.send_message(
            f"📌 Sticky message set in {dest.mention}.", ephemeral=True
        )

    @sticky_group.command(name="remove", description="Remove the sticky message from a channel")
    @app_commands.describe(channel="Channel to remove the sticky from (default: current channel)")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def sticky_remove(self, interaction: discord.Interaction, channel: discord.TextChannel = None):
        dest = channel or interaction.channel
        data = load_sticky()
        gid = str(interaction.guild.id)
        cid = str(dest.id)

        entry = data.get(gid, {}).get(cid)
        if not entry:
            await interaction.response.send_message(f"No sticky message in {dest.mention}.", ephemeral=True)
            return

        if entry.get("last_message_id"):
            try:
                old_msg = await dest.fetch_message(int(entry["last_message_id"]))
                await old_msg.delete()
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                pass

        del data[gid][cid]
        save_sticky(data)
        await interaction.response.send_message(f"✅ Sticky message removed from {dest.mention}.", ephemeral=True)

    @sticky_group.command(name="list", description="List all sticky messages in this server")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def sticky_list(self, interaction: discord.Interaction):
        data = load_sticky()
        guild_stickies = data.get(str(interaction.guild.id), {})

        if not guild_stickies:
            await interaction.response.send_message("No sticky messages set in this server.", ephemeral=True)
            return

        embed = discord.Embed(title="📌 Sticky Messages", color=discord.Color.orange())
        for cid, entry in guild_stickies.items():
            channel = interaction.guild.get_channel(int(cid))
            ch_name = channel.mention if channel else f"#deleted-channel ({cid})"
            preview = entry["message"][:80] + ("..." if len(entry["message"]) > 80 else "")
            embed.add_field(name=ch_name, value=f"`{preview}`", inline=False)

        embed.set_footer(text=f"{len(guild_stickies)} sticky message(s)")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @sticky_group.command(name="edit", description="Edit an existing sticky message")
    @app_commands.describe(
        message="New sticky message content",
        channel="Channel with the sticky (default: current channel)",
        color="New embed color in hex (optional)",
    )
    @app_commands.checks.has_permissions(manage_messages=True)
    async def sticky_edit(
        self,
        interaction: discord.Interaction,
        message: str,
        channel: discord.TextChannel = None,
        color: str = None,
    ):
        dest = channel or interaction.channel
        data = load_sticky()
        gid = str(interaction.guild.id)
        cid = str(dest.id)

        entry = data.get(gid, {}).get(cid)
        if not entry:
            await interaction.response.send_message(f"No sticky message in {dest.mention}. Use `/sticky set` first.", ephemeral=True)
            return

        new_color = color or entry.get("color", "#f5a623")
        try:
            embed_color = discord.Color.from_str(new_color)
        except ValueError:
            await interaction.response.send_message("Invalid color. Use hex format like `#ff0000`.", ephemeral=True)
            return

        if entry.get("last_message_id"):
            try:
                old_msg = await dest.fetch_message(int(entry["last_message_id"]))
                await old_msg.delete()
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                pass

        embed = discord.Embed(description=message, color=embed_color)
        embed.set_footer(text="📌 Sticky Message")
        sent = await dest.send(embed=embed)

        data[gid][cid]["message"] = message
        data[gid][cid]["color"] = new_color
        data[gid][cid]["last_message_id"] = str(sent.id)
        save_sticky(data)

        await interaction.response.send_message(f"✅ Sticky message updated in {dest.mention}.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Sticky(bot))
