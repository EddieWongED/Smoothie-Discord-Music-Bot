const { SlashCommandBuilder } = require('@discordjs/builders');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const {
	loadingEmbed,
	errorEmbed,
	lyricsEmbed,
} = require('../../objects/embed.js');
const { trimTitle } = require('../../utils/trimTitle.js');
const { combination } = require('../../utils/combination.js');
const cacheData = require('../../../data/cacheData.js');
const { retrieveData } = require('../../utils/changeData.js');
const Genius = require('genius-lyrics');
const Client = new Genius.Client();
const { editReply } = require('../../utils/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lyrics')
		.setDescription(
			'Attempts to find the lyrics of the currently-playing song (may takes some time to load).'
		),
	async execute(interaction, args) {
		let embed = loadingEmbed(
			'Attempting to find the lyrics...',
			'Please be patient... This may take a few minutes. Check /description first if you are impatient.'
		);

		const mainMessage = await interaction
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
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		const queue = await retrieveData(interaction.guildId, 'queue');
		const player = cacheData['player'][interaction.guildId];
		if (player.state.status == AudioPlayerStatus.Playing) {
			const title = queue[0]['title'];
			const newTitle = trimTitle(title);
			const queries = newTitle.split(' ');

			let targetSong = null;
			let targetArr = [];

			for (arr of combination(queries, 1).sort(
				(a, b) => b.length - a.length
			)) {
				const searchString = arr.join(' ');

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
				await editReply(
					args,
					embed,
					mainMessage ? mainMessage : interaction
				);
			} else {
				embed = errorEmbed(
					'Cannot find any related lyrics!',
					'Please try /description to see if there is any lyrics in the Youtube description!'
				);
				await editReply(
					args,
					embed,
					mainMessage ? mainMessage : interaction
				);
			}
		} else {
			embed = errorEmbed(
				'Currently there is nothing is playing!',
				'Please play something before trying to find its lyrics!'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		}
	},
};
