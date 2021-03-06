const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const {
	loadingEmbed,
	errorEmbed,
	successEmbed,
} = require('../../objects/embed.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Let Smoothie leave your voice channel sadly.'),
	description(prefix) {
		return `Let Smoothie leave your voice channel sadly.\n
				Usage: \`${prefix}leave\` or \`/leave\``;
	},
	async execute(interaction, args) {
		let embed = loadingEmbed(
			'Attempting to leave your voice channel...',
			'Please be patient...'
		);

		const mainMessage = await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		const connection = getVoiceConnection(interaction.guild.id);

		if (connection === undefined) {
			embed = errorEmbed(
				'Smoothie is not in any voice channel!',
				'She cannot leave you if she is not in any voice channel.'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		const memberVoiceChannel = interaction.member.voice.channel;

		if (memberVoiceChannel === null) {
			embed = errorEmbed(
				'You are not in any voice channel!',
				'You have to be in the same voice channel as her to request her to leave!'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
			embed = errorEmbed(
				'You are not in the same voice channel as Smoothie!',
				'You have to be in the same voice channel as her to request her to leave!'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		try {
			connection.destroy();
			embed = successEmbed(
				'Smoothie left the voice channel sadly.',
				'Please invite her again next time!'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		} catch (err) {
			console.error(err);
			embed = errorEmbed(
				'Unknown error occurred!',
				'A problem that the developer do not know wtf just happened.'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		}
	},
};
