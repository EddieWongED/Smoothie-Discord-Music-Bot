const { SlashCommandBuilder } = require('@discordjs/builders');
const { loadingEmbed, errorEmbed, successEmbed } = require('../../objects/embed.js');
const { retrieveData, setData } = require('../../utils/changeData.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the queue.'),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to shuffle...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		const queue = await retrieveData(interaction.guildId, 'queue');

		let currentIndex = queue.length;
		let randomIndex;

		if (queue.length === 0) {
			embed = errorEmbed('Nothing', 'There is nothing in the queue? What do you want to shuffle?');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			
			return;
		}

		while (currentIndex > 1) {

			randomIndex = Math.floor(Math.random() * currentIndex + 1);
			currentIndex--;

			[queue[currentIndex], queue[randomIndex]] = [queue[randomIndex], queue[currentIndex]];
		}

		const status = await setData(interaction.guildId, 'queue', queue);
		if (!status) {
			console.log('An error of saving queue to guildData.json occurred.');
			
			return;
		}

		embed = successEmbed('Successfully Shuffled!', 'Guess what is the next music?');
		await interaction.editReply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});
	},
};