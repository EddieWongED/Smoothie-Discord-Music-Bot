const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const {
	neturalEmbed,
	errorEmbed,
	playingNowEmbed,
	queueEmbed,
} = require('../../objects/embed.js');
const { retrieveData } = require('../../utils/changeData.js');
const cacheData = require('../../../data/cacheData.js');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');
const { editReply } = require('../../handlers/messageHandler.js');
const { stream, video_basic_info } = require('play-dl');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('For Eddie to test his code.'),
	description(prefix) {
		return `For Eddie to test his code.\n
				Usage: \`${prefix}test\` or \`/test\``;
	},
	async execute(interaction, args) {
		const devUserIdList = process.env.DEVUSERIDS;
		let devUserIds;

		let found = false;

		if (devUserIdList) {
			devUserIds = devUserIdList.split(' ');

			for (let devUserId of devUserIds) {
				if (devUserId === interaction.member.id) {
					found = true;

					break;
				}
			}
		} else {
			console.log(
				'WARNING: Unable to find your DEVUSERIDS! If you want to use dev commands, please add DEVUSERIDS=<your_user_id> in .env file.'
			);
		}

		if (!found) {
			const embed = errorEmbed(
				'You think you are good enough to run this command?',
				'Idiot.'
			);
			await interaction
				.reply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});

			return;
		}

		const testButton = new MessageButton()
			.setCustomId('testButton')
			.setLabel('Test')
			.setStyle('PRIMARY')
			.setDisabled(false);

		const row = new MessageActionRow().addComponents(testButton);

		let embed = neturalEmbed('Hi Eddie', 'This is a test command.');
		const mainMessage = await interaction
			.reply({
				embeds: [embed.embed],
				files: embed.files,
				components: [row],
			})
			.catch((err) => {
				console.error(err);
			});
	},
};
