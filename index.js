
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} from "discord.js";

import fs from "fs";

const config = JSON.parse(
  fs.readFileSync("./config.json", "utf-8")
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", async () => {
  console.log(`🌿 Emerald Ticket v2 Online as ${client.user.tag}`);

  const panelChannel = await client.channels.fetch(config.panelChannel);

  const embed = new EmbedBuilder()
    .setColor("#00ff88")
    .setTitle("🎫 Emerald Ticket System")
    .setDescription("Nhấn nút bên dưới để tạo ticket.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Success)
  );

  await panelChannel.send({
    embeds: [embed],
    components: [row]
  });
});

client.on("interactionCreate", async interaction => {

  if (interaction.isButton()) {

    if (interaction.customId === "create_ticket") {

      const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username}`
      );

      if (existing) {
        return interaction.reply({
          content: "❌ Bạn đã có ticket rồi!",
          ephemeral: true
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: config.ticketCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          },
          {
            id: config.supportRole,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor("#00ff88")
        .setTitle("Chọn Mode Test")
        .setDescription("Hãy chọn mode bạn muốn test.");

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("ticket_select")
          .setPlaceholder("Chọn mode...")
          .addOptions([
            { label: "NETHERITE POT", value: "NETHERITE POT" },
            { label: "CRYSTAL PVP", value: "CRYSTAL PVP" },
            { label: "SMP KIT", value: "SMP KIT" }
          ])
      );

      await channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
        components: [menu]
      });

      await interaction.reply({
        content: `✅ Ticket đã tạo: ${channel}`,
        ephemeral: true
      });
    }

    if (interaction.customId === "close") {
      await interaction.reply("🔒 Ticket sẽ đóng sau 5 giây...");
      setTimeout(() => interaction.channel.delete(), 5000);
    }
  }

  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === "ticket_select") {

      const mode = interaction.values[0];

      const embed = new EmbedBuilder()
        .setColor("#00ff88")
        .setTitle("🎫 Emerald Ticket")
        .setDescription(`Mode đã chọn: **${mode}**`);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.update({
        embeds: [embed],
        components: [buttons]
      });
    }
  }
});

client.login(process.env.TOKEN);
