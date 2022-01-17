const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { queue } = require('../../objects/subscription.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Shows what\'s next.'),
	async execute(interaction) {
		await interaction.deferReply()
			.catch((err) => {console.error(err);});

		wait(100);

		let des = '```CSS\n';
		for (let i = 0; i < 10; i++) {
			des = `${des}${i + 1}: ${queue[i]['title']} \n`;
		}
		des = des + '```';
		const queueEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Queue')
			.setDescription(des)
			.setFooter({ text: 'Smoothie' });

		const channel = await interaction.editReply({ embeds: [queueEmbed] })
			.catch((err) => {console.error(err);});
	},
};