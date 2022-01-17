const { SlashCommandBuilder } = require('@discordjs/builders');
const { ConnectionStatus, connect } = require('../../objects/subscription.js');
const { queuePlaylist } = require('../../utils/queueURL.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playloopplaylist')
		.setDescription('Plays THE playlist.'),
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
			followUpMessage = await interaction.followUp('Loading the playlist...')
				.catch((err) => {console.error(err);});
		}
		else {
			await interaction.editReply('Loading the playlist...')
				.catch((err) => {console.error(err);});
		}

		wait(100);
		
		const url = process.env.LOOPPLAYLISTURL;

		const metadata = await queuePlaylist(url);

		if (followUp) {
			followUpMessage.edit(`All ${metadata.noOfVideo} videos are queued. ${metadata.noOfRepeated} of them were already in the queue.`)
				.catch((err) => {console.error(err);});
		} else {
			await interaction.editReply(`All ${metadata.noOfVideo} videos are queued. ${metadata.noOfRepeated} of them were already in the queue.`)
					.catch((err) => {console.error(err);});
		}
	},
};