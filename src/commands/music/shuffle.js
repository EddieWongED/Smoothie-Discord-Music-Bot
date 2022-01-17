const { SlashCommandBuilder } = require('@discordjs/builders');
const { queue } = require('../../objects/subscription.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the queue.'),
	async execute(interaction) {
		await interaction.deferReply()
			.catch((err) => {console.error(err);});
		
		wait(100);

		await interaction.editReply('Shuffling...')
			.catch((err) => {console.error(err);});

		wait(100);

		let currentIndex = queue.length;
		let randomIndex;

		while (currentIndex != 1) {

			randomIndex = Math.floor(Math.random() * currentIndex + 1);
			currentIndex--;

			[queue[currentIndex], queue[randomIndex]] = [
				queue[randomIndex], queue[currentIndex]];
		}

		await interaction.editReply('Shuffled...')
			.catch((err) => {console.error(err);});
	},
};