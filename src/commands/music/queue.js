const { SlashCommandBuilder } = require('@discordjs/builders');
const { loadingEmbed, neturalEmbed } = require('../../objects/embed.js');
const { retrieveData } = require('../../utils/changeData.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Shows what\'s next.'),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to load the queue...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		const queue = await retrieveData(interaction.guildId, 'queue');

		let des = '```CSS\n';
		for (let i = 0; i < 10; i++) {
			des = `${des}${i + 1}: ${queue[i]['title']} \n`;
		}
		des = des + '```';
		embed = neturalEmbed('Queue', des);

		await interaction.editReply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});
	},
};