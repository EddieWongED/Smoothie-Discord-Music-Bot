const { SlashCommandBuilder } = require('@discordjs/builders');
const { successEmbed, errorEmbed } = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('forceresume')
		.setDescription(
			'For Eddie to test his code. Resume the audio player even when there is no one in the voice channel.'
		),
	description(prefix) {
		return `For Eddie to test his code. Resume the audio player even when there is no one in the voice channel.\n
				Usage: \`${prefix}forceresume\` or \`/forceresume\``;
	},
	async execute(interaction, args) {
		const devUserIdList = process.env.DEVUSERIDS;
		let devUserIds;

		let found = false;

		if (devUserIdList) {
			devUserIds = devUserIdList.split(' ');

			for (let devUserId of devUserIds) {
				if (devUserId === interaction.member.id) {
					found = true;

					break;
				}
			}
		} else {
			console.log(
				'WARNING: Unable to find your DEVUSERIDS! If you want to use dev commands, please add DEVUSERIDS=<your_user_id> in .env file.'
			);
		}

		if (!found) {
			const embed = errorEmbed(
				'You think you are good enough to run this command?',
				'Idiot.'
			);
			await interaction
				.reply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});

			return;
		}

		const player = cacheData['player'][interaction.guildId];
		var embed;

		if (player) {
			const unpaused = player.unpause();
			if (unpaused) {
				embed = successEmbed(
					'Success!',
					'Resume the music successfully.'
				);
			} else {
				embed = errorEmbed(
					'Failed!',
					'Resume the music unsuccessfully.'
				);
			}
		} else {
			embed = errorEmbed(
				'Failed!',
				'There is nothing playing at the moment!'
			);
		}

		await interaction
			.reply({
				embeds: [embed.embed],
				files: embed.files,
			})
			.catch((err) => {
				console.error(err);
			});
	},
};
