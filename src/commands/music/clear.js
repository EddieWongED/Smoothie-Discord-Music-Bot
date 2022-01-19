const { SlashCommandBuilder } = require('@discordjs/builders');
const { successEmbed, errorEmbed, loadingEmbed } = require('../../objects/embed.js');
const { setData, retrieveData } = require('../../utils/changeData.js');
const cacheData = require('../../../data/cacheData.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clear the queue.'),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to clear the queue...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		const queue = await retrieveData(interaction.guildId, 'queue');

		if (queue.length == 0) {
			embed = errorEmbed('There is nothing in the queue...', 'Why would you want to clear the queue when there is nothing in the queue?');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});

			return;
		}

		const newQueue = [];
		newQueue.push(queue[0]);

		const status = await setData(interaction.guildId, 'queue', newQueue);
		if (status) {
			embed = successEmbed('Success!', 'The queue has been cleared');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		} else {
			embed = errorEmbed('Cannot clear the queue...', 'for some reason.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		}
	},
};