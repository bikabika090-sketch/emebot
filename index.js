import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  REST,
  Routes
} from "discord.js";

import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

const DATA_FILE = "./data.json";
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const TOKEN    = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commandsList = [
  { name: "panel",      description: "Gửi ticket panel (legacy)" },
  { name: "setbotoday", description: "Đặt bot ticket vào kênh này" },
  { name: "close",      description: "Đóng ticket hiện tại" }
];

client.once("ready", async () => {
  console.log(`🌿 Bot Online: ${client.user.tag} (ID: ${client.user.id})`);

  // Dùng client.user.id làm CLIENT_ID — luôn đúng 100%
  const CLIENT_ID = client.user.id;
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commandsList }
      );
      console.log(`✅ Guild commands đã đăng ký thành công!`);
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commandsList }
      );
      console.log("✅ Global commands đã đăng ký!");
    }
  } catch (err) {
    console.error("❌ Lỗi đăng ký commands:", err);
  }
});

// ─────────────────────────────────────────────
function buildPanelEmbed() {
  return new EmbedBuilder()
    .setColor("#00ff88")
    .setTitle("🎮 Emerald Test Ticket")
    .setDescription(
      `╔══════════════════════════╗\n` +
      `          🎫 **HỆ THỐNG TICKET TEST**\n` +
      `╚══════════════════════════╝\n\n` +
      `Chọn **1 trong 3 mode** để Test.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️  **NETHERITE POT**\n` +
      `💎  **CRYSTAL PVP**\n` +
      `🗡️  **SMP KIT**\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `**📌 Server Test Premium:**\n` +
      `> • mcpvp.club\n` +
      `> • as.stray.gg\n` +
      `> • vnpvp.xyz\n` +
      `> • as.catpvp.com\n` +
      `> • as.strike.gg\n` +
      `> • Minemen.club\n` +
      `> • as.meowmc.fun\n` +
      `> • as.leafpvp.icu *(cpvp)*\n\n` +
      `**📌 Server Crack:**\n` +
      `> • teaamc.asia *(cpvp)*\n\n` +
      `**📌 Server Premium:**\n` +
      `> • asiaprac.xyz *(cpvp)*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `Bấm nút bên dưới để tạo ticket! 👇`
    )
    .setFooter({ text: "Emerald Ticket System • Test PvP" })
    .setTimestamp();
}

function buildCreateTicketButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_ticket")
      .setLabel("🎫  Tạo Ticket")
      .setStyle(ButtonStyle.Success)
  );
}

// ─────────────────────────────────────────────
client.on("interactionCreate", async interaction => {

  // ══ SLASH COMMANDS ══
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "setbotoday") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return interaction.reply({ content: "❌ Bạn không có quyền dùng lệnh này.", ephemeral: true });
      }
      const panelMsg = await interaction.channel.send({
        embeds: [buildPanelEmbed()],
        components: [buildCreateTicketButton()]
      });
      const data = loadData();
      data.panelChannel   = interaction.channelId;
      data.panelMessageId = panelMsg.id;
      saveData(data);
      return interaction.reply({
        content: `✅ Bot ticket đã được đặt tại ${interaction.channel}!`,
        ephemeral: true
      });
    }

    if (interaction.commandName === "close") {
      if (!interaction.channel.name.startsWith("ticket-")) {
        return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong kênh ticket.", ephemeral: true });
      }
      await interaction.reply("🔒 Ticket sẽ đóng sau 5 giây...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }

    if (interaction.commandName === "panel") {
      await interaction.reply({
        embeds: [buildPanelEmbed()],
        components: [buildCreateTicketButton()]
      });
    }
  }

  // ══ BUTTONS ══
  if (interaction.isButton()) {

    if (interaction.customId === "open_ticket") {
      const safeName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "");
      const existing  = interaction.guild.channels.cache.find(c => c.name === `ticket-${safeName}`);
      if (existing) {
        return interaction.reply({ content: `⚠️ Bạn đã có ticket rồi: ${existing}`, ephemeral: true });
      }
      const selectEmbed = new EmbedBuilder()
        .setColor("#00ff88")
        .setTitle("🎮 Chọn Mode Test")
        .setDescription(
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚔️  **NETHERITE POT** — PvP kiểu pot\n` +
          `💎  **CRYSTAL PVP** — PvP crystal\n` +
          `🗡️  **SMP KIT** — Kit trên SMP\n` +
          `━━━━━━━━━━━━━━━━━━━━━`
        );
      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("ticket_select")
          .setPlaceholder("🎯 Chọn mode test của bạn...")
          .addOptions([
            { label: "NETHERITE POT", description: "PvP kiểu pot với netherite", emoji: "⚔️", value: "NETHERITE POT" },
            { label: "CRYSTAL PVP",   description: "PvP bằng crystal",           emoji: "💎", value: "CRYSTAL PVP"   },
            { label: "SMP KIT",       description: "Kit trên server SMP",         emoji: "🗡️", value: "SMP KIT"       }
          ])
      );
      return interaction.reply({ embeds: [selectEmbed], components: [menu], ephemeral: true });
    }

    if (interaction.customId === "close") {
      await interaction.reply("🔒 Ticket sẽ đóng sau 5 giây...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === "close_reason") {
      await interaction.reply("🔒 Ticket đóng bởi staff.");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === "claim") {
      await interaction.reply(`🟢 Ticket đã được claim bởi <@${interaction.user.id}>!`);
    }
  }

  // ══ SELECT MENU → Tạo channel ticket ══
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_select") {
      const mode        = interaction.values[0];
      const safeName    = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "");
      const channelName = `ticket-${safeName}`;

      const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: config.ticketCategory || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny:  [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id,  allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          ...(config.supportRole ? [{ id: config.supportRole, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }] : [])
        ]
      });

      const modeEmoji = { "NETHERITE POT": "⚔️", "CRYSTAL PVP": "💎", "SMP KIT": "🗡️" }[mode] || "🎮";

      const ticketEmbed = new EmbedBuilder()
        .setColor("#00ff88")
        .setTitle(`${modeEmoji} Ticket Test — ${mode}`)
        .setDescription(
          `Chào <@${interaction.user.id}>! 👋\n\n` +
          `**Mode đã chọn:** ${modeEmoji} \`${mode}\`\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 **Server Test:**\n\n` +
          `**Premium:**\n` +
          `> mcpvp.club • as.stray.gg • vnpvp.xyz\n` +
          `> as.catpvp.com • as.strike.gg • Minemen.club\n` +
          `> as.meowmc.fun • as.leafpvp.icu *(cpvp)*\n\n` +
          `**Crack:** teaamc.asia *(cpvp)*\n` +
          `**Premium:** asiaprac.xyz *(cpvp)*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `Support sẽ hỗ trợ bạn sớm nhất có thể! ⚡`
        )
        .setFooter({ text: `Ticket tạo bởi ${interaction.user.tag}` })
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close")        .setLabel("🔒 Close")             .setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("close_reason") .setLabel("📝 Close With Reason") .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("claim")        .setLabel("✅ Claim")              .setStyle(ButtonStyle.Success)
      );

      await channel.send({
        content: `<@${interaction.user.id}>${config.supportRole ? ` <@&${config.supportRole}>` : ""}`,
        embeds: [ticketEmbed],
        components: [buttons]
      });

      await interaction.update({
        content: `✅ Ticket của bạn đã được tạo: ${channel}`,
        embeds: [],
        components: []
      });
    }
  }
});

client.login(TOKEN);
