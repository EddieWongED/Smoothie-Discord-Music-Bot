const { SlashCommandBuilder } = require('@discordjs/builders');
const { connect, ConnectionStatus } = require('../../objects/subscription.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Let Smoothie join the voice channel.'),
	async execute(interaction) {
		await interaction.deferReply()
			.catch((err) => {console.error(err);});
		
		wait(100);

		switch (connect(interaction)) {
		case ConnectionStatus.SUCCESS:
			await interaction.editReply('Smoothie joined the voice channel.')
				.catch((err) => {console.error(err);});
			break;
		case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
			await interaction.editReply('Smoothie joined from another voice channel.')
				.catch((err) => {console.error(err);});
			break;
		case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
			await interaction.editReply('You are not in a voice channel dumbass!')
				.catch((err) => {console.error(err);});
			break;
		default:
			await interaction.editReply('Unknown error occurred!')
				.catch((err) => {console.error(err);});
		}
	},
};