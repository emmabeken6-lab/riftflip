import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActivityType,
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_BASE = process.env.RIFTFLIP_API_URL ?? "http://localhost:80/api";
const BOT_SECRET = process.env.BOT_API_SECRET ?? "riftflip-bot-secret";

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set");
  process.exit(1);
}

async function apiCall(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-bot-secret": BOT_SECRET,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const PURPLE = 0x7c3aed;
const GREEN = 0x10b981;
const RED = 0xef4444;
const GOLD = 0xf59e0b;
const BLUE = 0x3b82f6;

const commands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check a user's Riftflip casino balance")
    .addStringOption((o) =>
      o.setName("username").setDescription("The site username to look up").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View overall Riftflip casino stats"),

  new SlashCommandBuilder()
    .setName("user")
    .setDescription("View a player's full site profile and win history")
    .addStringOption((o) =>
      o.setName("username").setDescription("The site username").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("wins")
    .setDescription("Show the latest wins on Riftflip"),

  new SlashCommandBuilder()
    .setName("event")
    .setDescription("Create a Riftflip casino event (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("title").setDescription("Event title").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("description").setDescription("Event description").setRequired(false)
    )
    .addStringOption((o) =>
      o.setName("ends").setDescription("When does it end? e.g. 2026-05-10").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("events")
    .setDescription("List all active Riftflip events"),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a player from Riftflip (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("username").setDescription("The site username to ban").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a player from Riftflip (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("username").setDescription("The site username to unban").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a win announcement to this channel (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("username").setDescription("Winner username").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("game").setDescription("Game name").setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName("amount").setDescription("Amount won (R$)").setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName("multiplier").setDescription("Multiplier e.g. 2.5").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("riftflip")
    .setDescription("Show Riftflip casino info and link"),
].map((c) => c.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async (c) => {
  console.log(`✅ Riftflip Bot ready as ${c.user.tag}`);

  c.user.setPresence({
    activities: [{ name: "Riftflip Casino 🎰", type: ActivityType.Watching }],
    status: "online",
  });

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    const guilds = c.guilds.cache.map((g) => g.id);
    for (const guildId of guilds) {
      await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), {
        body: commands,
      });
    }
    console.log(`✅ Slash commands registered in ${guilds.length} server(s)`);
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  await interaction.deferReply();

  try {
    if (commandName === "balance") {
      const username = interaction.options.getString("username", true);
      const { ok, data } = await apiCall(`/bot/balance/${encodeURIComponent(username)}`);

      if (!ok) {
        const embed = new EmbedBuilder()
          .setColor(RED)
          .setTitle("❌ User Not Found")
          .setDescription(`No Riftflip account found for **${username}**`)
          .setFooter({ text: "Riftflip Casino" });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(data.banned ? RED : PURPLE)
        .setTitle(`💰 Balance — ${data.username}`)
        .addFields(
          { name: "Balance", value: `**R$ ${data.balance.toLocaleString()}**`, inline: true },
          { name: "Status", value: data.banned ? "🔴 Banned" : "🟢 Active", inline: true }
        )
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "stats") {
      const { ok, data } = await apiCall("/bot/stats");
      if (!ok) {
        await interaction.editReply("❌ Could not fetch stats.");
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle("📊 Riftflip Casino — Site Stats")
        .addFields(
          { name: "👥 Total Players", value: `${data.totalUsers}`, inline: true },
          { name: "🎰 Total Wins", value: `${data.totalWins}`, inline: true },
          { name: "💸 Total Paid Out", value: `R$ ${(data.totalPaid ?? 0).toLocaleString()}`, inline: true },
          { name: "🏆 Biggest Win", value: data.biggestWin ? `**${data.biggestWin.username}** won R$ ${data.biggestWin.amount.toLocaleString()} on ${data.biggestWin.game}` : "None yet", inline: false },
          { name: "📅 Active Events", value: `${data.activeEvents}`, inline: true }
        )
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "user") {
      const username = interaction.options.getString("username", true);
      const { ok, data } = await apiCall(`/bot/user/${encodeURIComponent(username)}`);

      if (!ok) {
        await interaction.editReply(`❌ No Riftflip account found for **${username}**`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(data.banned ? RED : BLUE)
        .setTitle(`👤 Player Profile — ${data.username}`)
        .addFields(
          { name: "Balance", value: `R$ ${data.balance.toLocaleString()}`, inline: true },
          { name: "Status", value: data.banned ? "🔴 Banned" : "🟢 Active", inline: true },
          { name: "Total Wins", value: `${data.wins}`, inline: true },
          { name: "Total Won", value: `R$ ${(data.totalWon ?? 0).toLocaleString()}`, inline: true },
          { name: "Joined", value: new Date(data.joinedAt).toLocaleDateString(), inline: true }
        )
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "wins") {
      const { ok, data } = await apiCall("/bot/wins");
      if (!ok || !data.length) {
        const embed = new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎰 Latest Wins")
          .setDescription("No wins recorded yet. Be the first to win!")
          .setFooter({ text: "Riftflip Casino" });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const lines = data.slice(0, 10).map((w, i) => {
        const game = w.game === "coinflip" ? "🪙" : w.game === "jackpot" ? "🏆" : "💣";
        return `**${i + 1}.** ${game} **${w.username}** won **R$ ${w.amount.toLocaleString()}** (${w.multiplier}x) on ${w.game}`;
      });

      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle("🏆 Recent Wins on Riftflip")
        .setDescription(lines.join("\n"))
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "event") {
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description") ?? "";
      const endsAt = interaction.options.getString("ends") ?? "";
      const createdBy = interaction.user.tag;

      const { ok, data } = await apiCall("/bot/event", {
        method: "POST",
        body: JSON.stringify({ title, description, createdBy, endsAt }),
      });

      if (!ok) {
        await interaction.editReply("❌ Failed to create event.");
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle("📅 New Casino Event Created!")
        .addFields(
          { name: "Event", value: title, inline: false },
          { name: "Description", value: description || "No description provided", inline: false },
          { name: "Created By", value: createdBy, inline: true },
          { name: "Ends", value: endsAt || "No end date set", inline: true }
        )
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "events") {
      const { ok, data } = await apiCall("/bot/events");
      if (!ok || !data.length) {
        const embed = new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("📅 Active Events")
          .setDescription("No active events right now. Check back soon!")
          .setFooter({ text: "Riftflip Casino" });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const lines = data.map((e, i) => {
        return `**${i + 1}. ${e.title}**\n${e.description || "No description"}\n*Ends: ${e.endsAt || "TBD"} • By: ${e.createdBy}*`;
      });

      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle("📅 Riftflip Events")
        .setDescription(lines.join("\n\n"))
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "ban") {
      const username = interaction.options.getString("username", true);
      const { ok } = await apiCall(`/bot/ban/${encodeURIComponent(username)}`, { method: "POST" });

      if (!ok) {
        await interaction.editReply(`❌ Failed to ban **${username}**`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle("🔨 Player Banned")
        .setDescription(`**${username}** has been banned from Riftflip Casino.`)
        .addFields({ name: "Banned by", value: interaction.user.tag, inline: true })
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "unban") {
      const username = interaction.options.getString("username", true);
      const { ok } = await apiCall(`/bot/unban/${encodeURIComponent(username)}`, { method: "POST" });

      if (!ok) {
        await interaction.editReply(`❌ Failed to unban **${username}** — user not found`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle("✅ Player Unbanned")
        .setDescription(`**${username}** has been unbanned from Riftflip Casino.`)
        .addFields({ name: "Unbanned by", value: interaction.user.tag, inline: true })
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "announce") {
      const username = interaction.options.getString("username", true);
      const game = interaction.options.getString("game", true);
      const amount = interaction.options.getNumber("amount", true);
      const multiplier = interaction.options.getNumber("multiplier") ?? 1;

      await apiCall("/bot/announce-win", {
        method: "POST",
        body: JSON.stringify({ username, game, amount, multiplier }),
      });

      const gameEmoji = game === "coinflip" ? "🪙" : game === "jackpot" ? "🏆" : game === "minefield" ? "💣" : "🎰";
      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle(`${gameEmoji} Big Win on Riftflip!`)
        .setDescription(`🎉 **${username}** just won **R$ ${amount.toLocaleString()}** at **${game}**!`)
        .addFields(
          { name: "Game", value: `${gameEmoji} ${game}`, inline: true },
          { name: "Amount", value: `R$ ${amount.toLocaleString()}`, inline: true },
          { name: "Multiplier", value: `${multiplier}x`, inline: true }
        )
        .setFooter({ text: "Riftflip Casino • Play now!" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === "riftflip") {
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🚀 Riftflip Casino")
        .setDescription("The #1 Roblox-themed online casino. Play Coinflip, Jackpot & Minefield!")
        .addFields(
          { name: "🪙 Coinflip", value: "Flip a coin against another player", inline: true },
          { name: "🏆 Jackpot", value: "Pool tokens, winner takes all", inline: true },
          { name: "💣 Minefield", value: "Avoid mines, multiply your bet", inline: true },
          { name: "💚 House Edge", value: "0% — fair play guaranteed", inline: false }
        )
        .setFooter({ text: "Riftflip Casino" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error(`Error handling /${commandName}:`, err);
    await interaction.editReply("❌ Something went wrong. The site API may be unreachable.").catch(() => {});
  }
});

client.login(TOKEN);
