const { SlashCommandBuilder } = require('@discordjs/builders');
const { neturalEmbed } = require('../../objects/embed.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Reply with Pong!'),
	description(prefix) {
		return `Reply with Pong!\n
				Usage: \`${prefix}ping\` or \`/ping\``;
	},
	async execute(interaction) {
		let embed = neturalEmbed('Pong!', 'Replied with Pong!');
		await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		embed = neturalEmbed('Pong Again!', 'Pong Pong Pong Pong Pong!');
		await interaction.channel
			.send({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});
	},
};
