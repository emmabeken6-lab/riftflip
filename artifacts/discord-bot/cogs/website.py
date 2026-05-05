import discord
from discord import app_commands
from discord.ext import commands


SITE_URL = "https://d884c1c1-d9a5-421a-a4dd-0c386292c491-00-3shwy7ie5x5zs.janeway.replit.dev"
SITE_API = f"{SITE_URL}/api"
CONNECTED = True


def site_offline_embed(feature_url: str = None) -> discord.Embed:
    embed = discord.Embed(
        title="Website Not Connected Yet",
        description="This command will be fully functional once the website is connected to the bot.\n\n**Website:** " + SITE_URL + ("\n**Feature:** " + feature_url if feature_url else ""),
        color=discord.Color.yellow()
    )
    embed.set_footer(text="Connection coming soon — stay tuned!")
    return embed


async def fetch_site(endpoint: str) -> dict | None:
    if not CONNECTED:
        return None
    try:
        import aiohttp
        async with aiohttp.ClientSession() as s:
            async with s.get(f"{SITE_API}{endpoint}", timeout=aiohttp.ClientTimeout(total=5)) as r:
                if r.status == 200:
                    return await r.json()
    except Exception:
        pass
    return None


async def post_site(endpoint: str, data: dict) -> dict | None:
    if not CONNECTED:
        return None
    try:
        import aiohttp
        async with aiohttp.ClientSession() as s:
            async with s.post(f"{SITE_API}{endpoint}", json=data, timeout=aiohttp.ClientTimeout(total=5)) as r:
                if r.status == 200:
                    return await r.json()
    except Exception:
        pass
    return None


class Website(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="tip", description="Tip a user from your wallet balance")
    @app_commands.describe(user="The user to tip", amount="Amount to tip (e.g. 5.00)")
    async def tip(self, interaction: discord.Interaction, user: discord.Member, amount: float):
        if user == interaction.user:
            await interaction.response.send_message("You can't tip yourself.", ephemeral=True)
            return
        if amount <= 0:
            await interaction.response.send_message("Amount must be greater than 0.", ephemeral=True)
            return
        data = await post_site("/wallet/tip", {
            "from_user_id": str(interaction.user.id),
            "to_user_id": str(user.id),
            "amount": amount
        })
        if data is None:
            embed = site_offline_embed(f"{SITE_URL}/wallet")
            embed.add_field(name="Attempted Tip", value=f"**{interaction.user.mention}** → **{user.mention}**: ${amount:,.2f}", inline=False)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        if data.get("error"):
            embed = discord.Embed(description=f"❌ {data['error']}", color=discord.Color.red())
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        embed = discord.Embed(title="Tip Sent!", color=discord.Color.green())
        embed.add_field(name="From", value=interaction.user.mention, inline=True)
        embed.add_field(name="To", value=user.mention, inline=True)
        embed.add_field(name="Amount", value=f"**${amount:,.2f}**", inline=True)
        embed.add_field(name="Your New Balance", value=f"${data.get('new_balance', 0):,.2f}", inline=False)
        await interaction.response.send_message(embed=embed)
        try:
            await user.send(embed=discord.Embed(
                title="You received a tip!",
                description=f"**{interaction.user}** tipped you **${amount:,.2f}** in **{interaction.guild.name}**!\nCheck your wallet: {SITE_URL}/wallet",
                color=discord.Color.green()
            ))
        except discord.Forbidden:
            pass

    @app_commands.command(name="webstats", description="View live website statistics")
    async def webstats(self, interaction: discord.Interaction):
        data = await fetch_site("/stats")
        if data is None:
            embed = site_offline_embed(SITE_URL)
            embed.add_field(
                name="What this will show",
                value="• Total users registered\n• Total transactions\n• Total volume traded\n• Active games\n• Online players",
                inline=False
            )
            await interaction.response.send_message(embed=embed)
            return
        embed = discord.Embed(title=f"{SITE_URL} — Statistics", color=discord.Color.blurple())
        embed.add_field(name="Total Users", value=f"{data.get('total_users', 0):,}", inline=True)
        embed.add_field(name="Active Now", value=f"{data.get('active_users', 0):,}", inline=True)
        embed.add_field(name="Total Transactions", value=f"{data.get('total_transactions', 0):,}", inline=True)
        embed.add_field(name="Total Volume", value=f"${data.get('total_volume', 0):,.2f}", inline=True)
        embed.add_field(name="Active Games", value=f"{data.get('active_games', 0):,}", inline=True)
        embed.add_field(name="Total Winnings Paid", value=f"${data.get('total_winnings', 0):,.2f}", inline=True)
        embed.set_footer(text=f"Live data from {SITE_URL}")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="active", description="View active members in the website chat")
    async def active(self, interaction: discord.Interaction):
        data = await fetch_site("/chat/active")
        if data is None:
            embed = site_offline_embed(f"{SITE_URL}/chat")
            embed.add_field(
                name="What this will show",
                value="• Currently active users in website chat\n• Messages sent in last hour\n• Top chatters today",
                inline=False
            )
            await interaction.response.send_message(embed=embed)
            return
        embed = discord.Embed(title="Active Website Chat Members", color=discord.Color.blurple())
        embed.add_field(name="Online Now", value=f"{data.get('online', 0):,}", inline=True)
        embed.add_field(name="Messages (1h)", value=f"{data.get('messages_1h', 0):,}", inline=True)
        embed.add_field(name="Messages (24h)", value=f"{data.get('messages_24h', 0):,}", inline=True)
        if data.get("top_chatters"):
            chatters = "\n".join([f"**{i+1}.** {u['name']} — {u['messages']} msgs" for i, u in enumerate(data["top_chatters"][:5])])
            embed.add_field(name="Top Chatters Today", value=chatters, inline=False)
        embed.set_footer(text=f"Chat at: {SITE_URL}/chat")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="leaderboard-wallet", description="View the website richest users leaderboard")
    async def leaderboard_wallet(self, interaction: discord.Interaction):
        data = await fetch_site("/wallet/leaderboard")
        if data is None:
            embed = site_offline_embed(f"{SITE_URL}/wallet")
            embed.add_field(name="What this will show", value="Top 10 richest users on the website by wallet balance.", inline=False)
            await interaction.response.send_message(embed=embed)
            return
        embed = discord.Embed(title="Richest Users", color=discord.Color.gold())
        medals = ["🥇", "🥈", "🥉"]
        entries = []
        for i, user in enumerate(data.get("leaderboard", [])[:10]):
            medal = medals[i] if i < 3 else f"{i+1}."
            entries.append(f"{medal} **{user['name']}** — ${user['balance']:,.2f}")
        embed.description = "\n".join(entries) if entries else "No data yet."
        embed.set_footer(text=f"{SITE_URL}/wallet")
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Website(bot))
