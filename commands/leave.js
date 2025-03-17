//leave.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'day-off-request',
    description: 'request for leave',
  },

  async run({ interaction }) {
    const modal = new ModalBuilder({
      customId: `WhiteDot-Bot-${interaction.user.id}`,
      title: 'WhiteDot Bot',
    });
    const LeaveDuration = new TextInputBuilder({
        customId: 'LeaveDuration',
        label: 'Enter the type for Duration',
        placeholder: '(Enter 0 for Full or 1 for Half)',
        style: TextInputStyle.Short,
      });

    const LeaveType = new TextInputBuilder({
      customId: 'Leavetype',
      label: 'Enter the type for leave',
      placeholder: '(Enter 0 for Medical or 1 Personal)',
      style: TextInputStyle.Short,
    });
    const LeaveInput = new TextInputBuilder({
        customId: 'Leave',
        label: 'Reason',
        style: TextInputStyle.Paragraph,
      });

    const LeaveActionRow = new ActionRowBuilder().addComponents(LeaveInput);
    const LeaveTypeActionRow = new ActionRowBuilder().addComponents(LeaveType);
    const LeaveDurationActionRow = new ActionRowBuilder().addComponents(LeaveDuration);

    modal.addComponents(LeaveDurationActionRow,LeaveTypeActionRow,LeaveActionRow);

    await interaction.showModal(modal);

    const filter = (interaction) => interaction.customId === `WhiteDot-Bot-${interaction.user.id}`;
    const interactionPromise = interaction.awaitModalSubmit({ filter, time: 300000 });
    try {
      const modalInteraction = await interactionPromise;
      const Reason = modalInteraction.fields.getTextInputValue('Leave');
      const Type = modalInteraction.fields.getTextInputValue('Leavetype');
        var duration;
      
      if (modalInteraction.fields.getTextInputValue('LeaveDuration') === '0') {
        duration = 'Full day';
      } else if (modalInteraction.fields.getTextInputValue('LeaveDuration') === '1') {
        duration = 'half day';
      }

      if(Type=='0'){

        await modalInteraction.reply({
            content: `Request for ${duration} Medical leave is submitted :\nreason: ${Reason}`,
          });

      }
      else{
        await modalInteraction.reply({
            content: `Request for ${duration} Personal leave is submitted :\nreason: ${Reason}`,
          });
      }

    } catch (error) {
      console.error('Modal submission error:', error);
    }
  }
};