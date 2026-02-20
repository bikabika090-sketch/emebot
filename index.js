
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

import config from "./config.json" assert { type: "json" };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`🌿 Emerald Ticket Bot Online as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_select") {

      const mode = interaction.values[0];

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
        .setTitle("🎫 Emerald Ticket")
        .setDescription(`**Mode:** ${mode}

Support sẽ hỗ trợ bạn sớm nhất có thể.`);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("close_reason")
          .setLabel("Close With Reason")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("claim")
          .setLabel("Claim")
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
        components: [buttons]
      });

      await interaction.reply({
        content: `✅ Ticket đã tạo: ${channel}`,
        ephemeral: true
      });
    }
  }

  if (interaction.isButton()) {

    if (interaction.customId === "close") {
      await interaction.reply("🔒 Ticket sẽ đóng sau 5 giây...");
      setTimeout(() => interaction.channel.delete(), 5000);
    }

    if (interaction.customId === "claim") {
      await interaction.reply("🟢 Ticket đã được claim!");
    }

    if (interaction.customId === "close_reason") {
      await interaction.reply("🔒 Ticket đóng bởi staff.");
      setTimeout(() => interaction.channel.delete(), 5000);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "panel") {

    const embed = new EmbedBuilder()
      .setColor("#00ff88")
      .setTitle("Chọn 1 trong 3 mode để Test.")
      .setDescription(`━━━━━━━━━━━━━━━━━━

• NETHERITE POT  
• CRYSTAL PVP  
• SMP KIT  

━━━━━━━━━━━━━━━━━━

**Lưu ý: ( test sever Premium )**

• mcpvp.club  
• as.stray.gg  
• vnpvp.xyz  
• as.catpvp.com  
• as.strike.gg  
• Minemen.club  
• as.meowmc.fun  
• as.leafpvp.icu (cpvp)  
• teaamc.asia (cpvp)  
• asiaprac.xyz (cpvp)  

━━━━━━━━━━━━━━━━━━`);

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("Chọn mode test...")
        .addOptions([
          { label: "NETHERITE POT", value: "NETHERITE POT" },
          { label: "CRYSTAL PVP", value: "CRYSTAL PVP" },
          { label: "SMP KIT", value: "SMP KIT" }
        ])
    );

    await interaction.reply({
      embeds: [embed],
      components: [menu]
    });
  }
});

client.on("ready", async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.commands.create({
    name: "panel",
    description: "Gửi ticket panel"
  });
});

client.login(process.env.TOKEN);
