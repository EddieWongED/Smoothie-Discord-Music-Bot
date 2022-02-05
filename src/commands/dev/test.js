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
const { editReply } = require('../../utils/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('For Eddie to test his code. Run this if you dare.'),
	async execute(interaction, args) {
		if (interaction.member.id != process.env.MYUSERID) {
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

		const filter = (interaction) => {
			return interaction.message.id === mainMessage.id;
		};

		const collector = mainMessage.channel.createMessageComponentCollector({
			filter,
			time: 120000,
		});

		collector.on('collect', async (obj) => {
			switch (obj.customId) {
				case 'testButton':
					const command = interaction.client.commands.get('queue');

					try {
						await command.execute(interaction, []);
					} catch (error) {
						console.error(error);
						const embed = errorEmbed(
							'There was an error while executing this command!',
							'Something went wrong...'
						);
						await editReply(
							args,
							embed,
							mainMessage ? mainMessage : interaction
						);
					}
					break;
			}
		});
	},
};
