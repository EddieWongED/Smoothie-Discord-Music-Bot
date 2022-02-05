const { SlashCommandBuilder } = require('@discordjs/builders');
const { successEmbed, errorEmbed } = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('forceresume')
		.setDescription(
			'For Eddie to test his code. Resume the player even though there is no one in the voice channel'
		),
	async execute(interaction, args) {
		if (interaction.member.id != process.env.MYUSERID) {
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
