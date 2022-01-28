const { SlashCommandBuilder } = require('@discordjs/builders');
const { connect, ConnectionStatus } = require('../../objects/connection.js');
const {
	loadingEmbed,
	errorEmbed,
	successEmbed,
} = require('../../objects/embed.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Let Smoothie join the voice channel.'),
	async execute(interaction) {
		let embed = loadingEmbed(
			'Attempting to join your voice channel...',
			'Please be patient...'
		);
		await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		const status = await connect(
			interaction.guildId,
			interaction.member.voice.channel
		);

		switch (status) {
			case ConnectionStatus.SUCCESS:
				embed = successEmbed(
					'Smoothie joined the voice channel.',
					'Please welcome her! She is a shy girl.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				break;
			case ConnectionStatus.SUCCESS_ALREADY_JOINED:
				embed = errorEmbed(
					'Smoothie was already in your voice channel.',
					'Did you not notice it?'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				return;
			case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
				embed = successEmbed(
					'Smoothie joined from another voice channel.',
					'Please welcome her! She is a shy girl.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				break;
			case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
				embed = errorEmbed(
					'You are not in a voice channel!',
					'dumbass.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				return;
			default:
				embed = errorEmbed(
					'Unknown error occurred!',
					'A problem that the developer do not know wtf just happened.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				return;
		}
	},
};
