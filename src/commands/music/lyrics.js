const { SlashCommandBuilder } = require('@discordjs/builders');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const {
	loadingEmbed,
	errorEmbed,
	neturalEmbed,
	lyricsEmbed,
} = require('../../objects/embed.js');
const { trimTitle } = require('../../utils/trimTitle.js');
const { combination } = require('../../utils/combination.js');
const cacheData = require('../../../data/cacheData.js');
const { retrieveData } = require('../../utils/changeData.js');
const Genius = require('genius-lyrics');
const Client = new Genius.Client();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lyrics')
		.setDescription(
			'Attempts to find the lyrics of the currently-playing song (may takes some time to load).'
		),
	async execute(interaction) {
		let embed = loadingEmbed(
			'Attempting to find the lyrics...',
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
			const title = queue[0]['title'];
			const newTitle = trimTitle(title);
			const queries = newTitle.split(' ');

			console.log(newTitle);

			let targetSong = null;
			let targetArr = [];

			for (arr of combination(queries, 1).sort(
				(a, b) => b.length - a.length
			)) {
				const searchString = arr.join(' ');
				console.log(searchString);

				try {
					const songs = await Client.songs.search(searchString);
					if (arr.length > targetArr.length) {
						targetSong = songs[0];
						targetArr = arr;
						break;
					}
				} catch (err) {}
			}

			if (targetSong != null) {
				const lyrics = await targetSong.lyrics();

				embed = lyricsEmbed(`Lyrics: ${targetSong.fullTitle}`, lyrics);
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
					'Cannot find any related lyrics!',
					'Please try /description to see if there is any lyrics in the Youtube description!'
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
