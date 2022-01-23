const fs = require('fs');
const { setData, retrieveData } = require('../utils/changeData.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(
                interaction.commandName
            );

            if (!command) return;

            const status = await setData(
                interaction.guildId,
                'respondChannelId',
                interaction.channelId
            );

            if (!status) {
                console.log('Failed to update respondChannelId');
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            }
        }
    },
};
