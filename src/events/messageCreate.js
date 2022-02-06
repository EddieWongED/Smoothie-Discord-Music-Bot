const fs = require('fs');
const { setData, retrieveData } = require('../utils/changeData.js');
const { errorEmbed } = require('../objects/embed.js');

module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message) {
		if (message.author.bot) {
			return;
		}

		const prefix = await retrieveData(message.guildId, 'prefix');
		if (!prefix) {
			return;
		}

		if (!message.content.startsWith(prefix)) {
			return;
		}

		const commands = message.client.commands;
		let found = false;

		for (command of commands) {
			const splitMessage = message.content
				.replace(/  +/g, ' ')
				.split(' ');
			let args = [];
			if (splitMessage.length > 1) {
				args = splitMessage.slice(1);
			}
			if (splitMessage[0].toLowerCase() === prefix + command[0]) {
				found = true;

				const status = await setData(
					message.guildId,
					'respondChannelId',
					message.channelId
				);

				if (!status) {
					console.log('Failed to update respondChannelId');
				}

				try {
					await command[1].execute(message, args);
				} catch (error) {
					console.error(error);
					const embed = errorEmbed(
						'There was an error while executing this command!',
						'Something went wrong...'
					);
					await message.reply({
						embeds: [embed.embed],
						files: embed.files,
					});
				}
			}
		}

		if (!found) {
			const embed = errorEmbed(
				'Cannot find the command!',
				'Is there a typo?'
			);
			await message.reply({
				embeds: [embed.embed],
				files: embed.files,
			});
		}
	},
};
