const { SlashCommandBuilder } = require('@discordjs/builders');
const { queue, player, getNextResource } = require('../../objects/subscription.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current song because you hate it.'),
	async execute(interaction) {
		await interaction.deferReply()
			.catch((err) => {console.error(err);});

		wait(100);

		if (queue.length != 0) {
			await interaction.editReply('Skipping...')
				.catch((err) => {console.error(err);});

			player.play(getNextResource());

			await interaction.editReply('Skipped...')
				.catch((err) => {console.error(err);});
		}
	},
};