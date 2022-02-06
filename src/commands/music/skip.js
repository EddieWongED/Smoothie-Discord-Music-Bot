const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const { createAudioPlayer } = require('../../objects/audioPlayer.js');
const { getNextAudioResource } = require('../../objects/audioResource.js');
const {
	loadingEmbed,
	successEmbed,
	errorEmbed,
} = require('../../objects/embed.js');
const { retrieveData } = require('../../utils/changeData.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current song because you hate it.'),
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
			const resource = await getNextAudioResource(interaction.guildId);

			if (resource != null) {
				const connection = getVoiceConnection(interaction.guildId);
				if (connection) {
					const newPlayer = await createAudioPlayer(
						interaction.guildId,
						connection
					);
					connection.subscribe(newPlayer);
					newPlayer.play(resource);
				}
			}

			embed = successEmbed(
				'Successfully skipped!',
				"Seems like you don't like the previous song..."
			);
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
