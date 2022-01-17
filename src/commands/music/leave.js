const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Let Smoothie leave your voice channel sadly.'),
	async execute(interaction) {
		await interaction.deferReply()
			.catch((err) => {console.error(err);});

		wait(100);

		const connection = getVoiceConnection(interaction.guild.id);

		if (connection === undefined) {
			await interaction.editReply('Smoothie is not in any voice channel!')
				.catch((err) => {console.error(err);});

			return;
		}

		const memberVoiceChannel = interaction.member.voice.channel;

		if (memberVoiceChannel === null) {
			await interaction.editReply('You are not in any voice channel!')
				.catch((err) => {console.error(err);});

			return;
		}
		
		if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
			await interaction.editReply('You are not in the same voice channel as Smoothie!')
				.catch((err) => {console.error(err);});

			return;
		}
		
		connection.destroy();

		await interaction.editReply('Smoothie left the voice channel sadly.')
				.catch((err) => {console.error(err);});
	},
};