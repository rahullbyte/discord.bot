const { storeUserActivity } = require('./Database.js');

function handleUserActivity(client) {
  const lastStatusUpdate = new Map();

  client.on("presenceUpdate", async (oldPresence, newPresence) => {
    if (!newPresence) return;
    const userId = newPresence.userId || newPresence.user.id;
    const newStatus = newPresence.status;
    const userName = newPresence.user.username;

    const lastUpdate = lastStatusUpdate.get(userId);
    if (lastUpdate && lastUpdate.status === newStatus) {
      return; // Skip if the status hasn't changed
    }

    const timestamp = new Date();
    lastStatusUpdate.set(userId, { status: newStatus, timestamp });

    await storeUserActivity(userId, "Status Update", timestamp, userName, newStatus);
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
      const user = interaction.user;
      const commandTime = new Date();
      const userId = user.id;
      const userName = user.username;
      const commandName = interaction.commandName;
      await storeUserActivity(userId, "Command Used", commandTime, userName, commandName);
    } else if (interaction.isButton()) {
      const user = interaction.user;
      const userId = user.id;
      const userName = user.username;
      const timestamp = new Date();
      let activityType = '';
      let details = '';

      switch (interaction.customId) {
        case 'breakButton':
          activityType = 'Button Used';
          details = 'Break';
          break;
        case 'ResumeButton':
          activityType = 'Button Used';
          details = 'Resume';
          break;
      }

      if (activityType) {
        await storeUserActivity(userId, activityType, timestamp, userName, details);
      }
    }
  });
}

module.exports = handleUserActivity;
