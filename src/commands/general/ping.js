const { SlashCommandBuilder } = require('@discordjs/builders');

const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!')
			.catch((err) => {console.error(err);});

		await wait(100);

		await interaction.followUp('Pong Again!')
			.catch((err) => {console.error(err);});
	},
};