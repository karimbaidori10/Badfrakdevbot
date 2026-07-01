require("dotenv").config();

const fs = require("fs");
const path = require("path");
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
} = require("discord.js");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "dienst-state.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      statusMessageId: null,
      users: {},
      history: [],
    };
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveState() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

let state = loadState();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

function unix(ms) {
  return Math.floor(ms / 1000);
}

function typeName(type) {
  if (type === "leader") return "LS ist IC";
  return "Masse ist IC";
}

function typeEmoji(type) {
  if (type === "leader") return "👑";
  return "👥";
}

function getRoleIdsForType(type) {
  const ids = [];

  if (process.env.ROLE_IM_DIENST_ID) {
    ids.push(process.env.ROLE_IM_DIENST_ID);
  }

  if (type === "masse" && process.env.ROLE_MASSE_DIENST_ID) {
    ids.push(process.env.ROLE_MASSE_DIENST_ID);
  }

  if (type === "leader" && process.env.ROLE_LEADERSCHAFT_DIENST_ID) {
    ids.push(process.env.ROLE_LEADERSCHAFT_DIENST_ID);
  }

  return ids.filter(Boolean);
}

function getAllDienstRoleIds() {
  return [
    process.env.ROLE_IM_DIENST_ID,
    process.env.ROLE_MASSE_DIENST_ID,
    process.env.ROLE_LEADERSCHAFT_DIENST_ID,
  ].filter(Boolean);
}

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🟢 Dienstsystem")
    .setDescription(
      [
        "Trage dich hier in den Dienst ein oder wieder aus.",
        "",
        "👥 **Masse ist IC** = als Masse eintragen",
        "👑 **Leaderschaft** = als Leaderschaft eintragen",
        "🔴 **Austragen** =  Austragen",
      ].join("\n")
    )
    .setFooter({ text: "Dienst Panel • Automatisches Logging aktiv" })
    .setTimestamp();
}

function buildPanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("dienst_masse")
      .setLabel("Masse ist IC")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("dienst_leader")
      .setLabel("Leaderschaft ist IC")
      .setEmoji("👑")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("dienst_aus")
      .setLabel("Austragen")
      .setEmoji("🔴")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("dienst_refresh")
      .setLabel("Aktualisieren")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary)
  );
}

function buildStatusEmbed(guild) {
  const users = Object.values(state.users);

  const masse = users.filter((u) => u.type === "masse");
  const leader = users.filter((u) => u.type === "leader");

  const formatList = (list) => {
    if (!list.length) return "Keiner ist IC";

    return list
      .map((u) => {
        return `• <@${u.userId}> seit <t:${unix(u.since)}:t> — <t:${unix(u.since)}:R>`;
      })
      .join("\n");
  };

  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("📋 Aktuell IC")
    .setDescription(`Live-Übersicht für **${guild.name}**`)
    .addFields(
      {
        name: `👥 Masse ist IC — ${masse.length}`,
        value: formatList(masse),
        inline: false,
      },
      {
        name: `👑 Leaderschaft ist IC — ${leader.length}`,
        value: formatList(leader),
        inline: false,
      },
      {
        name: "📊 Gesamt",
        value: `**${users.length}** Person(en) aktuell IC `,
        inline: false,
      }
    )
    .setFooter({ text: "Wird automatisch aktualisiert" })
    .setTimestamp();
}

async function updateStatusMessage(guild) {
  const channelId = process.env.DIENST_STATUS_CHANNEL_ID;
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const embed = buildStatusEmbed(guild);

  let message = null;

  if (state.statusMessageId) {
    message = await channel.messages.fetch(state.statusMessageId).catch(() => null);
  }

  if (message) {
    await message.edit({ embeds: [embed] }).catch(async () => {
      const newMessage = await channel.send({ embeds: [embed] });
      state.statusMessageId = newMessage.id;
      saveState();
    });
    return;
  }

  const newMessage = await channel.send({ embeds: [embed] });
  state.statusMessageId = newMessage.id;
  saveState();
}

async function sendLog(guild, user, action, type = null) {
  const channelId = process.env.DIENST_LOG_CHANNEL_ID;
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const color =
    action === "eintragen" ? 0x2ecc71 :
    action === "wechsel" ? 0xf1c40f :
    0xe74c3c;

  const title =
    action === "eintragen" ? "🟢 IC eingetragen" :
    action === "wechsel" ? "🟡 IC-Art gewechselt" :
    "🔴 IC ausgetragen";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(
      { name: "Person", value: `<@${user.id}>`, inline: true },
      { name: "User ID", value: user.id, inline: true },
      {
        name: "Bereich",
        value: type ? `${typeEmoji(type)} ${typeName(type)}` : "Ausgetragen",
        inline: true,
      }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

async function eintragen(interaction, type) {
  const member = interaction.member;
  const userId = member.id;

  if (
    type === "leader" &&
    process.env.LEADERSCHAFT_BASE_ROLE_ID &&
    !member.roles.cache.has(process.env.LEADERSCHAFT_BASE_ROLE_ID)
  ) {
    return interaction.editReply({
      content: "❌ Du hast keine Berechtigung, dich als **Leaderschaft** einzutragen.",
    });
  }

  const old = state.users[userId];
  const action = old ? "wechsel" : "eintragen";

  const allDienstRoles = getAllDienstRoleIds();
  const newRoles = getRoleIdsForType(type);

  await member.roles.remove(allDienstRoles).catch(() => {});
  await member.roles.add(newRoles).catch((err) => {
    console.error("Rollen konnten nicht gegeben werden:", err);
  });

  state.users[userId] = {
    userId,
    tag: interaction.user.tag,
    type,
    since: Date.now(),
  };

  state.history.unshift({
    userId,
    tag: interaction.user.tag,
    action,
    type,
    time: Date.now(),
  });

  state.history = state.history.slice(0, 500);
  saveState();

  await updateStatusMessage(interaction.guild);
  await sendLog(interaction.guild, interaction.user, action, type);

  return interaction.editReply({
    content: `✅ Du bist jetzt als **${typeName(type)}** IC eingetragen.`,
  });
}

async function austragen(interaction) {
  const member = interaction.member;
  const userId = member.id;

  if (!state.users[userId]) {
    return interaction.editReply({
      content: "⚠️ Du bist aktuell nicht IC eingetragen.",
    });
  }

  const oldType = state.users[userId].type;

  await member.roles.remove(getAllDienstRoleIds()).catch((err) => {
    console.error("Rollen konnten nicht entfernt werden:", err);
  });

  delete state.users[userId];

  state.history.unshift({
    userId,
    tag: interaction.user.tag,
    action: "austragen",
    type: oldType,
    time: Date.now(),
  });

  state.history = state.history.slice(0, 500);
  saveState();

  await updateStatusMessage(interaction.guild);
  await sendLog(interaction.guild, interaction.user, "austragen", oldType);

  return interaction.editReply({
    content: "🔴 Du wurdest IC ausgetragen.",
  });
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("dienstpanel")
      .setDescription("Sendet das Dienst-Panel in diesen Channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    new SlashCommandBuilder()
      .setName("dienststatus")
      .setDescription("Aktualisiert die Dienst-Anzeige")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Eingeloggt als ${client.user.tag}`);

  await registerCommands();

  const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
  if (guild) {
    await updateStatusMessage(guild);
  }

  console.log("✅ Dienstsystem bereit");
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "dienstpanel") {
      const msg = await interaction.reply({
        embeds: [buildPanelEmbed()],
        components: [buildPanelButtons()],
        fetchReply: true,
      });

      return;
    }

    if (interaction.commandName === "dienststatus") {
      await interaction.deferReply({ ephemeral: true });
      await updateStatusMessage(interaction.guild);

      return interaction.editReply({
        content: "✅ Dienst-Status wurde aktualisiert.",
      });
    }
  }

  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("dienst_")) return;

  await interaction.deferReply({ ephemeral: true });

  if (interaction.customId === "dienst_masse") {
    return eintragen(interaction, "masse");
  }

  if (interaction.customId === "dienst_leader") {
    return eintragen(interaction, "leader");
  }

  if (interaction.customId === "dienst_aus") {
    return austragen(interaction);
  }

  if (interaction.customId === "dienst_refresh") {
    await updateStatusMessage(interaction.guild);

    return interaction.editReply({
      content: "🔄 Dienst-Anzeige wurde aktualisiert.",
    });
  }
});

client.login(process.env.TOKEN);
