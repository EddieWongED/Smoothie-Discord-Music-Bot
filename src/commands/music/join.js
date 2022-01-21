const { SlashCommandBuilder } = require('@discordjs/builders');
const { connect, ConnectionStatus } = require('../../objects/subscription.js');
const { loadingEmbed, errorEmbed, successEmbed, neturalEmbed} = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');
const { retrieveData } = require('../../utils/changeData.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { createResource } = require('../../objects/subscription.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Let Smoothie join the voice channel.'),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to join your voice channel...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		const status = await connect(interaction.guildId, interaction.member.voice.channel);

		switch (status) {
		case ConnectionStatus.SUCCESS:
			embed = successEmbed('Smoothie joined the voice channel.', 'Please welcome her! She is a shy girl.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			break;
		case ConnectionStatus.SUCCESS_ALREADY_JOINED:
			embed = errorEmbed('Smoothie was already in your voice channel.', 'Did you not notice it?');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			return;
		case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
			embed = successEmbed('Smoothie joined from another voice channel.', 'Please welcome her! She is a shy girl.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			break;
		case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
			embed = errorEmbed('You are not in a voice channel!', 'dumbass.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			return;
		default:
			embed = errorEmbed('Unknown error occurred!', 'A problem that the developer do not know wtf just happened.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			return;
		}

		await wait(1000);

		const player = cacheData['player'][interaction.guildId];
		const queue = await retrieveData(interaction.guildId, 'queue');

		if (queue.length >= 1 && player.state.status == AudioPlayerStatus.Idle) {
			const resource = await createResource(queue[0]['url'], queue[0]['title']);
			if (resource != null) {
				player.play(resource);
				embed = successEmbed('Music!', 'Seem like you\'ve got something on the queue already! Music time!');
			} else {
				embed = errorEmbed('Unknown error occurred!', 'A problem that the developer do not know wtf just happened.');
			}
		} else {
			embed = neturalEmbed('Seem like you don\'t have anything in the queue yet.', 'Use /play or /playloopplaylist to add music to the queue!');
		}

		await interaction.followUp({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});
	},
};