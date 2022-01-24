const { SlashCommandBuilder } = require('@discordjs/builders');
const {
	successEmbed,
	errorEmbed,
	playingNowEmbed,
	queueEmbed,
} = require('../../objects/embed.js');
const { retrieveData } = require('../../utils/changeData.js');
const cacheData = require('../../../data/cacheData.js');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('forceresume')
		.setDescription(
			'For Eddie to test his code. Resume the player even though there is no one in the voice channel'
		),
	async execute(interaction) {
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
		if (player) {
			const unpaused = player.unpause();
			if (unpaused) {
				const embed = successEmbed(
					'Success!',
					'Resume the music successfully.'
				);
				await interaction
					.reply({
						embeds: [embed.embed],
						files: embed.files,
					})
					.catch((err) => {
						console.error(err);
					});
			} else {
				const embed = errorEmbed(
					'Failed!',
					'Resume the music unsuccessfully.'
				);
				await interaction
					.reply({
						embeds: [embed.embed],
						files: embed.files,
					})
					.catch((err) => {
						console.error(err);
					});
			}
		} else {
			const embed = errorEmbed(
				'Failed!',
				'There is nothing playing at the moment!'
			);
			await interaction
				.reply({
					embeds: [embed.embed],
					files: embed.files,
				})
				.catch((err) => {
					console.error(err);
				});
		}
	},
};
