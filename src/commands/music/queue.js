const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
	loadingEmbed,
	neturalEmbed,
	errorEmbed,
	queueEmbed,
} = require('../../objects/embed.js');
const { retrieveData, setData } = require('../../utils/changeData.js');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const wait = require('util').promisify(setTimeout);
const { editReply } = require('../../handlers/messageHandler.js');
const client = require('../../index.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription("Shows what's next."),
	async execute(interaction, args) {
		let embed = loadingEmbed(
			'Attempting to load the queue...',
			'Please be patient...'
		);

		const mainMessage = await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		if (
			!isSameVoiceChannel(
				interaction.guildId,
				interaction.member.voice.channel
			)
		) {
			embed = errorEmbed(
				'You are not in the same voice channel as Smoothie!',
				'Please join the voice channel before you want to do something!'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		const queue = await retrieveData(interaction.guildId, 'queue');

		if (queue.length === 0) {
			embed = errorEmbed(
				'No music no fun..',
				'There is no music in the queue...'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
			return;
		}

		var page = 1;

		const queueMessageId = await retrieveData(
			interaction.guildId,
			'queueMessageId'
		);

		if (queueMessageId !== null) {
			const message =
				interaction.channel.messages.cache.get(queueMessageId);
			if (message) {
				await message.delete().catch((err) => {
					console.error(err);
				});
				page = 1;
			}
		}

		embed = await queueEmbed(interaction.guildId, 1);

		const tempQueue = await retrieveData(interaction.guildId, 'queue');

		const firstPageButton = new MessageButton()
			.setCustomId('queueFirstPage')
			.setLabel('First Page')
			.setStyle('DANGER')
			.setDisabled(true);

		const prevPageButton = new MessageButton()
			.setCustomId('queuePrevPage')
			.setLabel('Previous Page')
			.setStyle('PRIMARY')
			.setDisabled(true);

		const nextPageButton = new MessageButton()
			.setCustomId('queueNextPage')
			.setLabel('Next Page')
			.setStyle('PRIMARY')
			.setDisabled(Math.ceil(tempQueue.length / 10) === 1);

		const lastPageButton = new MessageButton()
			.setCustomId('queueLastPage')
			.setLabel('Last Page')
			.setStyle('DANGER')
			.setDisabled(Math.ceil(tempQueue.length / 10) === 1);

		const choosePageButton = new MessageButton()
			.setCustomId('queueChoosePage')
			.setLabel('#')
			.setStyle('SUCCESS')
			.setDisabled(Math.ceil(tempQueue.length / 10) === 1);

		const shuffleButton = new MessageButton()
			.setCustomId('shuffleButton')
			.setLabel('Shuffle')
			.setStyle('SECONDARY')
			.setDisabled(false);

		const row = new MessageActionRow().addComponents(
			firstPageButton,
			prevPageButton,
			nextPageButton,
			lastPageButton,
			choosePageButton
		);

		const row2 = new MessageActionRow().addComponents(shuffleButton);

		var message;

		if (args) {
			message = await mainMessage
				.edit({
					embeds: [embed.embed],
					files: embed.files,
					components: [row, row2],
				})
				.catch((err) => {
					console.error(err);
				});
		} else {
			message = await interaction
				.editReply({
					embeds: [embed.embed],
					files: embed.files,
					components: [row, row2],
				})
				.catch((err) => {
					console.error(err);
				});
		}

		const status = setData(
			interaction.guildId,
			'queueMessageId',
			message.id
		);

		if (!status) {
			console.log('Failed to write queueMessageId');
		}

		const filter = (interaction) => {
			return interaction.message.id === message.id;
		};

		const collector = message.channel.createMessageComponentCollector({
			filter,
			time: 120000,
		});

		let clickedChoosePageButton = false;

		collector.on('collect', async (interaction) => {
			const queue = await retrieveData(interaction.guildId, 'queue');
			if (queue.length == 0) {
				const status = interaction.message.delete().catch((err) => {
					console.log(err);
				});

				embed = errorEmbed(
					'There is nothing in the queue',
					'The queue has been cleared for some reason.'
				);
				await interaction.channel
					.send({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.log(err);
					});
				return;
			}

			const maxPage = Math.ceil(queue.length / 10);

			switch (interaction.customId) {
				case 'queueFirstPage':
					page = 1;
					break;
				case 'queuePrevPage':
					page--;
					if (page < 1) {
						page = 1;
					}
					break;
				case 'queueNextPage':
					page++;
					if (page > maxPage) {
						page = maxPage;
					}
					break;
				case 'queueLastPage':
					page = maxPage;
					break;
				case 'queueChoosePage':
					if (!clickedChoosePageButton) {
						clickedChoosePageButton = true;
						embed = neturalEmbed(
							'Please type which page you want to jump to.',
							`Range: 1 - ${maxPage}. You have a minute to respond.`
						);
						const pageNumberMessage = await interaction.channel
							.send({ embeds: [embed.embed], files: embed.files })
							.catch((error) => {
								console.error(error);
							});

						const pageFilter = (filterInteraction) => {
							return (
								interaction.member.id ===
								filterInteraction.member.id
							);
						};

						const pageCollector =
							pageNumberMessage.channel.createMessageCollector({
								pageFilter,
								max: 1,
								time: 60000,
							});

						pageCollector.on('collect', async (memberMessage) => {
							var content = memberMessage.content;
							if (!isNaN(content) && !isNaN(parseInt(content))) {
								content = parseInt(content);
								if (content <= maxPage && content >= 1) {
									page = content;
									embed = await queueEmbed(
										interaction.guildId,
										page
									);

									if (page == 1) {
										firstPageButton.setDisabled(true);
										prevPageButton.setDisabled(true);
										nextPageButton.setDisabled(false);
										lastPageButton.setDisabled(false);
									} else if (page == maxPage) {
										firstPageButton.setDisabled(false);
										prevPageButton.setDisabled(false);
										nextPageButton.setDisabled(true);
										lastPageButton.setDisabled(true);
									} else {
										firstPageButton.setDisabled(false);
										prevPageButton.setDisabled(false);
										nextPageButton.setDisabled(false);
										lastPageButton.setDisabled(false);
									}

									if (maxPage == 1) {
										choosePageButton.setDisabled(true);
									} else {
										choosePageButton.setDisabled(false);
									}

									await message
										.edit({
											embeds: [embed.embed],
											components: [row, row2],
										})
										.catch((err) => {
											console.log(err);
										});

									await pageNumberMessage
										.delete()
										.catch((err) => {
											console.log(err);
										});

									await memberMessage
										.delete()
										.catch((err) => {
											console.log(err);
										});
								} else {
									await memberMessage
										.delete()
										.catch((err) => {
											console.log(err);
										});

									embed = errorEmbed(
										'The integer you typed is not within the range!',
										'Please click the button and try again!'
									);
									await pageNumberMessage
										.edit({
											embeds: [embed.embed],
											files: embed.files,
											ephemeral: true,
										})
										.catch((error) => {
											console.error(error);
										});

									await wait(4000);

									await pageNumberMessage
										.delete()
										.catch((err) => {
											console.log(err);
										});
								}
							} else {
								await memberMessage.delete().catch((err) => {
									console.log(err);
								});

								embed = errorEmbed(
									'The message you typed is not a integer!',
									'Please click the button and try again!'
								);
								await pageNumberMessage
									.edit({
										embeds: [embed.embed],
										files: embed.files,
										ephemeral: true,
									})
									.catch((error) => {
										console.error(error);
									});

								await wait(4000);

								await pageNumberMessage
									.delete()
									.catch((err) => {
										console.log(err);
									});
							}
						});

						pageCollector.on('end', async (collected) => {
							clickedChoosePageButton = false;
						});
					}

					break;
				case 'shuffleButton':
					const command = client.commands.get('shuffle');
					if (command != null) {
						try {
							await command.execute(message, []);
						} catch (err) {
							console.error(err);
						}
					}

					page = 1;

					break;
			}

			if (page == 1) {
				firstPageButton.setDisabled(true);
				prevPageButton.setDisabled(true);
				nextPageButton.setDisabled(false);
				lastPageButton.setDisabled(false);
			} else if (page == maxPage) {
				firstPageButton.setDisabled(false);
				prevPageButton.setDisabled(false);
				nextPageButton.setDisabled(true);
				lastPageButton.setDisabled(true);
			} else {
				firstPageButton.setDisabled(false);
				prevPageButton.setDisabled(false);
				nextPageButton.setDisabled(false);
				lastPageButton.setDisabled(false);
			}

			if (maxPage == 1) {
				choosePageButton.setDisabled(true);
			} else {
				choosePageButton.setDisabled(false);
			}
			embed = await queueEmbed(interaction.guildId, page);
			await interaction
				.update({ embeds: [embed.embed], components: [row, row2] })
				.catch((err) => {
					console.log(err);
				});
		});
	},
};
