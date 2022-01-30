const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const {
	loadingEmbed,
	errorEmbed,
	neturalEmbed,
} = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');
const { retrieveData } = require('../../utils/changeData.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('description')
		.setDescription(
			'Gets the Youtube description of the currently-playing music.'
		),
	async execute(interaction) {
		let embed = loadingEmbed(
			'Attempting to get description...',
			'Please be patient...'
		);
		await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		if (
			!isSameVoiceChannel(
				interaction.guildId,
				interaction.member.voice.channel
			)
		) {
			embed = errorEmbed(
				'You are not in the same voice channel as Smoothie!',
				'Please join the voice channel before you want to do something!'
			);
			await interaction
				.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});

			return;
		}

		const queue = await retrieveData(interaction.guildId, 'queue');
		const player = cacheData['player'][interaction.guildId];
		if (player.state.status == AudioPlayerStatus.Playing) {
			if (queue.length >= 1) {
				const videoInfo = await ytdl.getBasicInfo(queue[0]['url'], []);
				embed = neturalEmbed(
					`Description: ${videoInfo.videoDetails.title}`,
					videoInfo.videoDetails.description
				);
				await interaction
					.editReply({
						embeds: [embed.embed],
						files: embed.files,
					})
					.catch((err) => {
						console.error(err);
					});
			} else {
				embed = errorEmbed(
					'No music no fun..',
					'There is no music in the queue...'
				);
				await interaction
					.editReply({
						embeds: [embed.embed],
						files: embed.files,
					})
					.catch((err) => {
						console.error(err);
					});

				return;
			}
		} else {
			embed = errorEmbed(
				'Currently there is nothing is playing!',
				'Please play something before trying to find its lyrics!'
			);
			await interaction
				.editReply({
					embeds: [embed.embed],
					files: embed.files,
				})
				.catch((err) => {
					console.error(err);
				});
		}
	},
};
