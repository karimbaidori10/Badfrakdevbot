require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function getLogoUrl() {
  return process.env.AOD_LOGO_URL || client.user?.displayAvatarURL();
}

function makeInput(id, label, placeholder, style, required = true) {
  const input = new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setPlaceholder(placeholder)
    .setStyle(style)
    .setRequired(required);

  return new ActionRowBuilder().addComponents(input);
}

/* =========================
   ABMELDUNGSSYSTEM
========================= */

function buildAbmeldungPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x6f2dbd)
    .setAuthor({
      name: "Angels of Death • Abmeldungssystem",
      iconURL: getLogoUrl(),
    })
    .setTitle("📋 Abmeldung eintragen")
    .setDescription(
      [
        "Du bist für eine bestimmte Zeit nicht da?",
        "Dann trage deine Abmeldung hier sauber ein.",
        "",
        "```ansi",
        "\u001b[2;35mBenötigte Angaben\u001b[0m",
        "• Von wann",
        "• Bis wann",
        "• Grund",
        "```",
        "",
        "Klicke unten auf **Abmeldung eintragen**, um das Formular zu öffnen.",
      ].join("\n")
    )
    .addFields(
      {
        name: "📝 Formular",
        value: "Trage deine Abmeldung direkt über Discord ein.",
        inline: true,
      },
      {
        name: "📨 Channel",
        value: "Die Abmeldung wird automatisch gepostet.",
        inline: true,
      }
    )
    .setThumbnail(getLogoUrl())
    .setFooter({
      text: "AOD • Motorcycle Club",
      iconURL: getLogoUrl(),
    })
    .setTimestamp();
}

function buildAbmeldungPanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abmeldung_oeffnen")
      .setLabel("Abmeldung eintragen")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Danger)
  );
}

function buildAbmeldungModal() {
  const modal = new ModalBuilder()
    .setCustomId("abmeldung_modal")
    .setTitle("Abmeldung eintragen");

  modal.addComponents(
    makeInput(
      "abmeldung_von",
      "Von wann?",
      "z.B. 01.07.2026 18:00 Uhr",
      TextInputStyle.Short
    ),
    makeInput(
      "abmeldung_bis",
      "Bis wann?",
      "z.B. 03.07.2026 20:00 Uhr",
      TextInputStyle.Short
    ),
    makeInput(
      "abmeldung_grund",
      "Grund",
      "z.B. Privat, Arbeit, Urlaub, Krankheit...",
      TextInputStyle.Paragraph
    )
  );

  return modal;
}

/* =========================
   FIGHT EINTRÄGE SYSTEM
========================= */

function buildFightPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x6f2dbd)
    .setAuthor({
      name: "Angels of Death • Fight-System",
      iconURL: getLogoUrl(),
    })
    .setTitle("🏠 Fight-Einträge")
    .setDescription(
      [
        "Trage hier sauber neue Fights ein.",
        "",
        "🏠 **4H-Regel**",
        "Wird automatisch in den 4H-Regel Channel geschickt.",
        "",
        "🚘 **Streetfight**",
        "Wird automatisch in den Streetfight Channel geschickt.",
        "",
        "📸 Nach dem Formular kannst du optional ein Bild senden.",
      ].join("\n")
    )
    .addFields(
      {
        name: "🏠 4H-Regel",
        value: "Für Base-Raid / 4-Stunden-Regel Einträge.",
        inline: true,
      },
      {
        name: "🚘 Streetfight",
        value: "Für Streetfight-Stand, Forderung und Ort.",
        inline: true,
      }
    )
    .setThumbnail(getLogoUrl())
    .setFooter({
      text: "AOD • Fight-Einträge",
      iconURL: getLogoUrl(),
    })
    .setTimestamp();
}

function buildFightPanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fight_open_4h")
      .setLabel("4H-Regel eintragen")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("fight_open_streetfight")
      .setLabel("Streetfight eintragen")
      .setEmoji("🚘")
      .setStyle(ButtonStyle.Danger)
  );
}

function build4hModal() {
  const modal = new ModalBuilder()
    .setCustomId("fight_modal_4h")
    .setTitle("4H-Regel eintragen");

  modal.addComponents(
    makeInput("fraktion", "Eigene Fraktion", "z.B. LRN", TextInputStyle.Short),
    makeInput("gegner", "Gegnerische Fraktion", "z.B. 069", TextInputStyle.Short),
    makeInput("gewinner", "Wer hat gewonnen?", "z.B. Wir / Gegner", TextInputStyle.Short),
    makeInput("forderung", "Forderung", "z.B. Route / 3 Mio", TextInputStyle.Short),
    makeInput(
      "details",
      "Details",
      "Raus: 14:55\nWieder Rein: 18:55\nStand: 2:1\nOrt: Anwesen\nNotiz: -",
      TextInputStyle.Paragraph
    )
  );

  return modal;
}

function buildStreetfightModal() {
  const modal = new ModalBuilder()
    .setCustomId("fight_modal_streetfight")
    .setTitle("Streetfight eintragen");

  modal.addComponents(
    makeInput("gegner", "Name / Gegner", "z.B. 069", TextInputStyle.Short),
    makeInput("stand", "Stand", "z.B. 1:0", TextInputStyle.Short),
    makeInput("forderung", "Forderung", "z.B. 3 Mio und Lotus entblockt", TextInputStyle.Short),
    makeInput(
      "ortzeit",
      "Ort & Zeit",
      "Ort: Staatsbank\nZeit: 22:10",
      TextInputStyle.Paragraph
    ),
    makeInput(
      "ergebnis",
      "Ergebnis / Notiz",
      "z.B. Gewonnen / Verloren / Notiz",
      TextInputStyle.Paragraph,
      false
    )
  );

  return modal;
}

async function waitForFightImage(interaction) {
  await interaction.editReply(
    [
      "✅ Formular gespeichert.",
      "",
      "📸 Schick jetzt optional ein Bild in diesen Channel.",
      "Schreibe `skip`, wenn kein Bild rein soll.",
      "",
      "⏳ Zeit: 60 Sekunden",
    ].join("\n")
  );

  const filter = (msg) => {
    if (msg.author.id !== interaction.user.id) return false;

    const saysSkip = msg.content.toLowerCase() === "skip";

    const hasImage = msg.attachments.some((att) => {
      const name = att.name || "";
      const type = att.contentType || "";
      return type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(name);
    });

    return saysSkip || hasImage;
  };

  try {
    const collected = await interaction.channel.awaitMessages({
      filter,
      max: 1,
      time: 60000,
      errors: ["time"],
    });

    const msg = collected.first();

    if (msg.content.toLowerCase() === "skip") {
      await msg.delete().catch(() => {});
      return null;
    }

    const image = msg.attachments.find((att) => {
      const name = att.name || "";
      const type = att.contentType || "";
      return type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(name);
    });

    await msg.delete().catch(() => {});

    return image?.url || null;
  } catch {
    return null;
  }
}

/* =========================
   SLASH COMMANDS
========================= */

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("abmeldungspanel")
      .setDescription("Sendet das Abmeldungspanel in diesen Channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    new SlashCommandBuilder()
      .setName("fightpanel")
      .setDescription("Sendet das Fight-Einträge Panel in diesen Channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
}

/* =========================
   BOT READY
========================= */

client.once(Events.ClientReady, async () => {
  console.log(`✅ Eingeloggt als ${client.user.tag}`);

  await registerCommands();

  console.log("✅ Abmeldungssystem bereit");
  console.log("✅ Fight-Einträge System bereit");
});

/* =========================
   INTERACTIONS
========================= */

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "abmeldungspanel") {
        await interaction.reply({
          embeds: [buildAbmeldungPanelEmbed()],
          components: [buildAbmeldungPanelButtons()],
        });

        return;
      }

      if (interaction.commandName === "fightpanel") {
        const entryChannelId = process.env.FIGHT_ENTRY_CHANNEL_ID;

        if (entryChannelId && interaction.channel.id !== entryChannelId) {
          return interaction.reply({
            content: `❌ Bitte nutze den Befehl in <#${entryChannelId}>.`,
            ephemeral: true,
          });
        }

        await interaction.reply({
          embeds: [buildFightPanelEmbed()],
          components: [buildFightPanelButtons()],
        });

        return;
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "abmeldung_oeffnen") {
        return interaction.showModal(buildAbmeldungModal());
      }

      if (interaction.customId === "fight_open_4h") {
        const entryChannelId = process.env.FIGHT_ENTRY_CHANNEL_ID;

        if (entryChannelId && interaction.channel.id !== entryChannelId) {
          return interaction.reply({
            content: `❌ Fight-Einträge bitte nur in <#${entryChannelId}> erstellen.`,
            ephemeral: true,
          });
        }

        return interaction.showModal(build4hModal());
      }

      if (interaction.customId === "fight_open_streetfight") {
        const entryChannelId = process.env.FIGHT_ENTRY_CHANNEL_ID;

        if (entryChannelId && interaction.channel.id !== entryChannelId) {
          return interaction.reply({
            content: `❌ Fight-Einträge bitte nur in <#${entryChannelId}> erstellen.`,
            ephemeral: true,
          });
        }

        return interaction.showModal(buildStreetfightModal());
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "abmeldung_modal") {
        const von = interaction.fields.getTextInputValue("abmeldung_von");
        const bis = interaction.fields.getTextInputValue("abmeldung_bis");
        const grund = interaction.fields.getTextInputValue("abmeldung_grund");

        const channelId = process.env.ABMELDUNG_CHANNEL_ID;

        if (!channelId) {
          return interaction.reply({
            content: "❌ ABMELDUNG_CHANNEL_ID fehlt in der .env.",
            ephemeral: true,
          });
        }

        const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

        if (!channel) {
          return interaction.reply({
            content: "❌ Abmeldungs-Channel wurde nicht gefunden. Prüfe ABMELDUNG_CHANNEL_ID.",
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x6f2dbd)
          .setAuthor({
            name: "Angels of Death • Neue Abmeldung",
            iconURL: getLogoUrl(),
          })
          .setTitle("📌 Abmeldung eingetragen")
          .setDescription(
            [
              `> <@${interaction.user.id}> hat eine neue Abmeldung eingetragen.`,
              "",
              "━━━━━━━━━━━━━━━━━━━━",
            ].join("\n")
          )
          .addFields(
            {
              name: "👤 Person",
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
            {
              name: "📅 Von",
              value: `\`${von}\``,
              inline: true,
            },
            {
              name: "📅 Bis",
              value: `\`${bis}\``,
              inline: true,
            },
            {
              name: "📝 Grund",
              value: `>>> ${grund}`,
              inline: false,
            },
            {
              name: "✅ Status",
              value: "`Abgemeldet`",
              inline: true,
            },
            {
              name: "🕒 Eingetragen",
              value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
              inline: true,
            }
          )
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setImage(getLogoUrl())
          .setFooter({
            text: "AOD • Abmeldungssystem",
            iconURL: getLogoUrl(),
          })
          .setTimestamp();

        await channel.send({ embeds: [embed] });

        return interaction.reply({
          content: "✅ Deine Abmeldung wurde eingetragen.",
          ephemeral: true,
        });
      }

      if (interaction.customId === "fight_modal_4h") {
        await interaction.deferReply({ ephemeral: true });

        const fraktion = interaction.fields.getTextInputValue("fraktion");
        const gegner = interaction.fields.getTextInputValue("gegner");
        const gewinner = interaction.fields.getTextInputValue("gewinner");
        const forderung = interaction.fields.getTextInputValue("forderung");
        const details = interaction.fields.getTextInputValue("details");

        const imageUrl = await waitForFightImage(interaction);

        const targetChannelId = process.env.FIGHT_4H_CHANNEL_ID;

        if (!targetChannelId) {
          return interaction.editReply("❌ FIGHT_4H_CHANNEL_ID fehlt in der .env.");
        }

        const targetChannel = await interaction.guild.channels.fetch(targetChannelId).catch(() => null);

        if (!targetChannel) {
          return interaction.editReply("❌ 4H-Regel Channel wurde nicht gefunden.");
        }

        const embed = new EmbedBuilder()
          .setColor(0x6f2dbd)
          .setAuthor({
            name: "Angels of Death • 4H-Regel",
            iconURL: getLogoUrl(),
          })
          .setTitle("🏠 4H-Regel • Konflikt Eintrag")
          .setDescription("━━━━━━━━━━━━━━━━━━━━")
          .addFields(
            {
              name: "🏴 Eigene Fraktion",
              value: `\`${fraktion}\``,
              inline: true,
            },
            {
              name: "⚔️ Gegner",
              value: `\`${gegner}\``,
              inline: true,
            },
            {
              name: "🏆 Gewinner",
              value: `\`${gewinner}\``,
              inline: true,
            },
            {
              name: "💰 Forderung",
              value: `>>> ${forderung}`,
              inline: false,
            },
            {
              name: "📌 Details",
              value: `>>> ${details}`,
              inline: false,
            },
            {
              name: "👤 Eingetragen von",
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
            {
              name: "🕒 Eingetragen",
              value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
              inline: true,
            }
          )
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: "AOD • 4H-Regel System",
            iconURL: getLogoUrl(),
          })
          .setTimestamp();

        if (imageUrl) embed.setImage(imageUrl);

        await targetChannel.send({ embeds: [embed] });

        return interaction.editReply(`✅ 4H-Regel Eintrag wurde in <#${targetChannelId}> gesendet.`);
      }

      if (interaction.customId === "fight_modal_streetfight") {
        await interaction.deferReply({ ephemeral: true });

        const gegner = interaction.fields.getTextInputValue("gegner");
        const stand = interaction.fields.getTextInputValue("stand");
        const forderung = interaction.fields.getTextInputValue("forderung");
        const ortzeit = interaction.fields.getTextInputValue("ortzeit");
        const ergebnis = interaction.fields.getTextInputValue("ergebnis") || "-";

        const imageUrl = await waitForFightImage(interaction);

        const targetChannelId = process.env.FIGHT_STREETFIGHT_CHANNEL_ID;

        if (!targetChannelId) {
          return interaction.editReply("❌ FIGHT_STREETFIGHT_CHANNEL_ID fehlt in der .env.");
        }

        const targetChannel = await interaction.guild.channels.fetch(targetChannelId).catch(() => null);

        if (!targetChannel) {
          return interaction.editReply("❌ Streetfight Channel wurde nicht gefunden.");
        }

        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setAuthor({
            name: "Angels of Death • Streetfight",
            iconURL: getLogoUrl(),
          })
          .setTitle("🚘 Streetfight • Eintrag")
          .setDescription("━━━━━━━━━━━━━━━━━━━━")
          .addFields(
            {
              name: "👥 Name / Gegner",
              value: `\`${gegner}\``,
              inline: true,
            },
            {
              name: "📊 Stand",
              value: `\`${stand}\``,
              inline: true,
            },
            {
              name: "💰 Forderung",
              value: `>>> ${forderung}`,
              inline: false,
            },
            {
              name: "📍 Ort & Zeit",
              value: `>>> ${ortzeit}`,
              inline: false,
            },
            {
              name: "📝 Ergebnis / Notiz",
              value: `>>> ${ergebnis}`,
              inline: false,
            },
            {
              name: "👤 Eingetragen von",
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
            {
              name: "🕒 Eingetragen",
              value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
              inline: true,
            }
          )
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: "AOD • Streetfight System",
            iconURL: getLogoUrl(),
          })
          .setTimestamp();

        if (imageUrl) embed.setImage(imageUrl);

        await targetChannel.send({ embeds: [embed] });

        return interaction.editReply(`✅ Streetfight Eintrag wurde in <#${targetChannelId}> gesendet.`);
      }
    }
  } catch (error) {
    console.error("Interaction Fehler:", error);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        content: "❌ Es ist ein Fehler passiert. Check die Konsole.",
      });
    }

    return interaction.reply({
      content: "❌ Es ist ein Fehler passiert. Check die Konsole.",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);