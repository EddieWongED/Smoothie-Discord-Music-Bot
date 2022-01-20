const { SlashCommandBuilder } = require('@discordjs/builders');
const { getNextResource } = require('../../objects/subscription.js');
const { loadingEmbed, successEmbed, errorEmbed } = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');
const { retrieveData, setData } = require('../../utils/changeData.js');
const { isSameVoiceChannel } = require('../../objects/subscription.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current song because you hate it.'),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to skip the music...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		if (!isSameVoiceChannel(interaction.guildId, interaction.member.voice.channel)) {
			embed = errorEmbed('You are not in the same voice channel as Smoothie!', 'Please join the voice channel before you want to do something!');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			
			return;
		}

		const queue = await retrieveData(interaction.guildId, 'queue');

		if (queue.length != 0) {
			
			const resource = await getNextResource(interaction.guildId);
			cacheData['player'][interaction.guildId].play(resource);

			embed = successEmbed('Successfully skipped!', 'Seems like you don\'t like the previous song...');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		} else {
			embed = errorEmbed('No music no fun..', 'There is no music in the queue...');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		}
	},
};