const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const { storeUserActivity } = require('../database/Database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task-of-the-day')
    .setDescription('Start the day by uploading tasks!')
    .addStringOption(option =>
      option.setName('day')
        .setDescription('The Working format')
        .setRequired(true)
        .addChoices(
          { name: 'Half Day', value: 'half_day' },
          { name: 'Full Day', value: 'full_day' }
        )),

  async run({ interaction }) {
    const userId = interaction.user.id;
    const userName = interaction.user.username;
    const Day = interaction.options.getString('day');

    const modal = new ModalBuilder()
      .setCustomId(`WhiteDot-${interaction.user.id}`)
      .setTitle("WhiteDot");

    const firstTaskInput = new TextInputBuilder()
      .setCustomId("1stTaskInput")
      .setLabel("Task 1")
      .setStyle(TextInputStyle.Paragraph);

    const secondTaskInput = new TextInputBuilder()
      .setCustomId("2ndTaskInput")
      .setLabel("Task 2")
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(firstTaskInput);
    const secondActionRow = new ActionRowBuilder().addComponents(secondTaskInput);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);

    const filter = (modalInteraction) => modalInteraction.customId === `WhiteDot-${interaction.user.id}`;
    const interactionPromise = interaction.awaitModalSubmit({
      filter,
      time: 500000,
    });

    try {
      const modalInteraction = await interactionPromise;

      const firstTask = modalInteraction.fields.getTextInputValue("1stTaskInput");
      const secondTask = modalInteraction.fields.getTextInputValue("2ndTaskInput");

      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];

      const thread = await interaction.channel.threads.create({
        name: `Tasks for ${formattedDate}`,
        autoArchiveDuration: 60,
      });

      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Break")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("breakButton")
        )
        .addComponents(
          new ButtonBuilder()
            .setLabel("Resume")
            .setDisabled(true)
            .setStyle(ButtonStyle.Primary)
            .setCustomId("ResumeButton")
        )
        .addComponents(
          new ButtonBuilder()
            .setLabel("Follow Up")
            .setStyle(ButtonStyle.Success)
            .setCustomId("FollowUpButton")
        );

      const replyMessage = await modalInteraction.reply({
        content: `Start Working now, Enjoy the work.`,
        ephemeral: true,
      });

      const send = await thread.send({
        content: `Tasks of the Day (${formattedDate}):\n${firstTask}\n${secondTask}`,
        components: [buttonRow],
      });

      setTimeout(async () => {
        await replyMessage.delete();
      }, 5000);

      const collector = send.createMessageComponentCollector({
        componentType: ComponentType.Button,
      });

      let startTime;
      let breakStartTime;
      let totalBreakTime = 0;
      startTime = new Date();
      let breakButtonClickCount = 0;
      let resumeButtonClickCount = 0;

      // Break and Resume button Conditions
      collector.on("collect", async (interaction) => {
        const currentTime = new Date();
        const totalElapsedTime = currentTime - startTime - totalBreakTime;


        if (interaction.customId === "breakButton") {
          if (breakButtonClickCount < 3) {
            breakButtonClickCount++;
            await interaction.deferUpdate();
            buttonRow.components[0].setDisabled(true);
            buttonRow.components[1].setDisabled(false);
            await send.edit({ components: [buttonRow] });
            breakStartTime = new Date();
          } else {
            await interaction.reply("Break button can only be clicked three times.");
          }
        } else if (interaction.customId === "ResumeButton") {
          if (resumeButtonClickCount < 3) {
            resumeButtonClickCount++;
            await interaction.deferUpdate();
            buttonRow.components[1].setDisabled(true);
            buttonRow.components[0].setDisabled(false);
            await send.edit({ components: [buttonRow] });
            const breakEndTime = new Date();
            const breakDuration = breakEndTime - breakStartTime;
            totalBreakTime += breakDuration;
            if (resumeButtonClickCount == 3) {
              buttonRow.components[0].setDisabled(true);
              await send.edit({ components: [buttonRow] });
            }
          } else {
            await interaction.reply("Resume button can only be clicked three times.");
          }
        } else if (interaction.customId === "FollowUpButton") {
          const endTime = new Date();
          const elapsedTime = endTime - startTime - totalBreakTime;
          const requiredElapsedTime = Day === 'half_day' ? 3 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000;

          if (elapsedTime < requiredElapsedTime) {
            await interaction.reply(`You cannot upload the task before ${Day === 'half_day' ? '4' : '6'} hours from starting your work.`);
          } else {
            const formattedElapsedTime = formatTime(elapsedTime);
            await showFollowUpModal(interaction, formattedElapsedTime);
            await storeUserActivity(userId, 'Follow Up', endTime, userName, formattedElapsedTime);
          }
        } else {
          await interaction.reply("This button is not recognized.");
        }
      });

      collector.on("end", (collected) => {
        console.log(`Collected ${collected.size} interactions.`);
      });

      async function showFollowUpModal(interaction, messageContent) {
        const followUpModal = new ModalBuilder()
          .setCustomId(`FollowUp-${interaction.user.id}`)
          .setTitle('WhiteDot');

        const followupInput = new TextInputBuilder()
          .setCustomId('followup')
          .setLabel('Task completed')
          .setStyle(TextInputStyle.Paragraph);

        const linkFollowupInput = new TextInputBuilder()
          .setCustomId('RefLink')
          .setLabel('Link')
          .setStyle(TextInputStyle.Paragraph);

        const followupActionRow = new ActionRowBuilder().addComponents(followupInput);
        const linkActionRow = new ActionRowBuilder().addComponents(linkFollowupInput);

        followUpModal.addComponents(followupActionRow, linkActionRow);

        await interaction.showModal(followUpModal);

        const followUpFilter = (modalInteraction) => modalInteraction.customId === `FollowUp-${interaction.user.id}`;
        const followUpInteractionPromise = interaction.awaitModalSubmit({
          filter: followUpFilter,
          time: 300000,
        });

        try {
          const followUpModalInteraction = await followUpInteractionPromise;
          const completedTask = followUpModalInteraction.fields.getTextInputValue('followup');
          const referenceLink = followUpModalInteraction.fields.getTextInputValue('RefLink');

          await followUpModalInteraction.reply({
            content: `Enjoy Your Day!\n${completedTask}\n${referenceLink}\nTotal time of Work: ${messageContent}`,
          });
        } catch (error) {
          console.error('Modal submission error:', error);
          await interaction.followUp({
            content: 'There was an error submitting the follow-up. Please try again.',
            ephemeral: true,
          });
        }
      }

      function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}hr:${minutes}min:${seconds}sec`;
      }
    } catch (error) {
      console.error("Modal submission error:", error);
    }
  },
};
