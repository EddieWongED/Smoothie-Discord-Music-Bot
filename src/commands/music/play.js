const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const { createAudioResource } = require('@discordjs/voice');
const { connect, ConnectionStatus } = require('../../objects/subscription.js');

const { queueMusic, QueueVideoStatus } = require('../../utils/queueURL.js');
const { loadingEmbed, errorEmbed, successEmbed } = require('../../objects/embed.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays music with specified Youtube URL.')
		.addStringOption(option =>
			option.setName('url')
				.setDescription('The URL of a Youtube video.')
				.setRequired(true),
		)
		.addBooleanOption(option =>
			option.setName('play_now')
				.setDescription('Plays the music immediately if the URL is a video. A playlist does no effect.')
				.setRequired(true)),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to play music...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		let followUp = false;
		let followUpMessage = null;

		const connectionStatus = await connect(interaction.guildId, interaction.member.voice.channel);

		switch (connectionStatus) {
		case ConnectionStatus.SUCCESS:
			embed = successEmbed('Smoothie joined the voice channel.', 'Please welcome her! She is a shy girl.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			followUp = true;
			break;
		case ConnectionStatus.SUCCESS_ALREADY_JOINED:
			break;
		case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
			embed = successEmbed('Smoothie joined from another voice channel.', 'Please welcome her! She is a shy girl.');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			followUp = true;
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

		embed = loadingEmbed('Loading the music...', 'Please be patient.');

		if (followUp) {
			followUpMessage = await interaction.followUp({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		}
		else {
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		}
		
		const url = interaction.options.getString('url');

		const status = await queueMusic(interaction.guildId, url);
		
		switch (status) {
			case QueueVideoStatus.SUCCESS:
				embed = successEmbed('Queued the music.', 'Enjoy the music.');
				break;
			case QueueVideoStatus.ERROR_INVALID_URL:
				embed = errorEmbed('Invalid URL!', 'Please check if the provided URL is valid or not.');
				break;
			case QueueVideoStatus.ERROR_ALREADY_EXIST:
				embed = errorEmbed('The music was already in the queue!', 'Dumbass.');
				break;
		};

		if (followUp) {
			followUpMessage.edit({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
		} else {
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {console.error(err);});
		}
	},
};