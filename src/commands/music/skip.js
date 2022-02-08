const { SlashCommandBuilder } = require('@discordjs/builders');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const {
	loadingEmbed,
	successEmbed,
	errorEmbed,
} = require('../../objects/embed.js');
const { playNextMusic } = require('../../objects/audioPlayer.js');
const { retrieveData } = require('../../utils/changeData.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the currently-playing song.'),
	description(prefix) {
		return `Skip the currently-playing song.\n
				Usage: \`${prefix}skip\` or \`/skip\``;
	},
	async execute(interaction, args) {
		let embed = loadingEmbed(
			'Attempting to skip the music...',
			'Please be patient...'
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

		if (queue.length != 0) {
			embed = successEmbed(
				'Successfully skipped!',
				"Seems like you don't like the previous song..."
			);

			const success = playNextMusic(interaction.guildId);

			if (!success) {
				embed = errorEmbed(
					'Unable to play next music',
					'For some reason...'
				);
			}

			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		} else {
			embed = errorEmbed(
				'No music no fun..',
				'There is no music in the queue...'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		}
	},
};
