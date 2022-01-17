const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const { createAudioResource } = require('@discordjs/voice');
const { connect, ConnectionStatus, player } = require('../../objects/subscription.js');
const { queueMusic, QueueVideoStatus } = require('../../utils/queueURL.js');
const wait = require('util').promisify(setTimeout);

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
		await interaction.deferReply()
			.catch((err) => {console.error(err);});
		
		wait(100);

		let followUp = false;
		let followUpMessage = null;

		switch (connect(interaction)) {
		case ConnectionStatus.SUCCESS:
			await interaction.editReply('Smoothie joined the voice channel.')
				.catch((err) => {console.error(err);});
			followUp = true;
			break;
		case ConnectionStatus.SUCCESS_ALREADY_JOINED:
			break;
		case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
			await interaction.editReply('Smoothie joined from another voice channel.')
				.catch((err) => {console.error(err);});
			followUp = true;
			break;
		case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
			await interaction.editReply('You are not in a voice channel dumbass!')
				.catch((err) => {console.error(err);});
			return;
		default:
			await interaction.editReply('Unknown error occurred!')
				.catch((err) => {console.error(err);});
			return;
		}

		wait(100);

		if (followUp) {
			followUpMessage = await interaction.followUp('Loading the music...')
				.catch((err) => {console.error(err);});
		}
		else {
			await interaction.editReply('Loading the music...')
				.catch((err) => {console.error(err);});
		}

		wait(100);
		
		const url = interaction.options.getString('url');

		let msg = "An unexcepted error occurred";

		const status = await queueMusic(url);
		
		switch (status) {
			case QueueVideoStatus.SUCCESS:
				msg = "Queued the music.";
				break;
			case QueueVideoStatus.ERROR_INVALID_URL:
				msg = "Invlid URL!";
				break;
			case QueueVideoStatus.ERROR_ALREADY_EXIST:
				msg = "The music was already in the queue!";
				break;
		};

		if (followUp) {
			followUpMessage.edit(msg)
				.catch((err) => {console.error(err);});
		} else {
			await interaction.editReply(msg)
					.catch((err) => {console.error(err);});
		}
	},
};