const voice = require('@discordjs/voice');
const { MessageActionRow, MessageButton } = require('discord.js');
const { isSameVoiceChannel } = require('../utils/isSameVoiceChannel.js');
const { getNextAudioResource } = require('./audioResource.js');
const ytdl = require('ytdl-core');
const cacheData = require('../../data/cacheData.js');
const { retrieveData, setData } = require('../utils/changeData.js');
const client = require('../index.js');
const {
	playingNowEmbed,
	errorEmbed,
	neturalEmbed,
	queueEmbed,
} = require('../objects/embed.js');
const wait = require('util').promisify(setTimeout);
const { userMention } = require('@discordjs/builders');

const createAudioPlayer = async (guildId, connection) => {
	const player = voice.createAudioPlayer({
		behaviors: {
			noSubscriber: voice.NoSubscriberBehavior.Pause,
			maxMissedFrames: 50,
		},
	});

	player.on(voice.AudioPlayerStatus.Playing, async (obj) => {
		console.log(
			`${client.guilds.cache.get(guildId).name} is playing: ${
				obj.resource.metadata.title
			}`
		);
		const channelId = await retrieveData(guildId, 'respondChannelId');
		if (channelId) {
			const channel = client.channels.cache.get(channelId);
			if (channel) {
				const playingNowMessageId = await retrieveData(
					guildId,
					'playingNowMessageId'
				);
				if (playingNowMessageId != null) {
					const message =
						channel.messages.cache.get(playingNowMessageId);
					if (message) {
						const content = await message.delete().catch((err) => {
							console.log('Cannot Find the message.');
						});
					} else {
						console.log('Cannot find the message to be deleted.');
					}
				}

				const playNextButton = new MessageButton()
					.setCustomId('playNextButton')
					.setLabel('Next Song')
					.setStyle('SUCCESS')
					.setDisabled(false);

				const descriptionButton = new MessageButton()
					.setCustomId('descriptionButton')
					.setLabel('Description')
					.setStyle('DANGER')
					.setDisabled(false);

				const queueButton = new MessageButton()
					.setCustomId('queueButton')
					.setLabel('Queue')
					.setStyle('PRIMARY')
					.setDisabled(false);

				const row = new MessageActionRow().addComponents(
					playNextButton,
					descriptionButton,
					queueButton
				);

				const info = await ytdl.getBasicInfo(obj.resource.metadata.url);

				if (!info) {
					console.log('cannot fetch info from the url.');

					return;
				}

				const time = parseInt(info.videoDetails.lengthSeconds) * 1000;

				let embed = await playingNowEmbed(guildId);
				if (!embed) {
					return;
				}

				const message = await channel
					.send({
						embeds: [embed.embed],
						files: embed.files,
						components: [row],
					})
					.catch((err) => {
						console.error(err);
					});

				if (message) {
					const status = await setData(
						guildId,
						'playingNowMessageId',
						message.id
					);
					if (!status) {
						console.log('Failed to save playingNowMessageId.');
					}
				} else {
					console.log('Cannot send the message properly.');
				}

				const filter = (interaction) => {
					return interaction.message.id === message.id;
				};

				const collector =
					message.channel.createMessageComponentCollector({
						filter,
						time: time,
					});

				let clickedDescription = false;

				collector.on('collect', async (interaction) => {
					await interaction.deferUpdate();
					if (
						isSameVoiceChannel(
							interaction.guildId,
							interaction.member.voice.channel
						)
					) {
						switch (interaction.customId) {
							case 'playNextButton':
								const resource = await getNextAudioResource(
									guildId
								);

								if (resource) {
									const newPlayer = await createAudioPlayer(
										guildId,
										connection
									);
									connection.subscribe(newPlayer);
									newPlayer.play(resource);
								} else {
									console.log('Unable to find the resource.');
								}

								break;
							case 'descriptionButton':
								if (clickedDescription) {
									break;
								}

								const queue = await retrieveData(
									interaction.guildId,
									'queue'
								);
								if (queue.length >= 1) {
									const videoInfo = await ytdl.getBasicInfo(
										queue[0]['url'],
										[]
									);
									embed = neturalEmbed(
										`Description: ${videoInfo.videoDetails.title}`,
										videoInfo.videoDetails.description
									);
								}

								const descriptionMessage =
									await interaction.channel
										.send({
											embeds: [embed.embed],
											files: embed.files,
										})
										.catch((err) => {
											console.error(err);
										});

								if (descriptionMessage) {
									clickedDescription = true;
								}

								break;
							case 'queueButton':
								const oldQueue = await retrieveData(
									interaction.guildId,
									'queue'
								);

								if (oldQueue.length === 0) {
									embed = errorEmbed(
										'No music no fun..',
										'There is no music in the queue...'
									);
									const errorMessage =
										await interaction.channel
											.send({
												embeds: [embed.embed],
												files: embed.files,
											})
											.catch((err) => {
												console.error(err);
											});

									await wait(4000);

									await errorMessage.delete().catch((err) => {
										console.error(err);
									});

									break;
								}

								var page = 1;

								const queueMessageId = await retrieveData(
									interaction.guildId,
									'queueMessageId'
								);

								if (queueMessageId !== null) {
									const message =
										interaction.channel.messages.cache.get(
											queueMessageId
										);
									if (message) {
										await message.delete().catch((err) => {
											console.error(err);
										});
										page = 1;
									}
								}

								embed = await queueEmbed(
									interaction.guildId,
									1
								);

								const tempQueue = await retrieveData(
									interaction.guildId,
									'queue'
								);

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
									.setDisabled(
										Math.ceil(tempQueue.length / 10) === 1
									);

								const lastPageButton = new MessageButton()
									.setCustomId('queueLastPage')
									.setLabel('Last Page')
									.setStyle('DANGER')
									.setDisabled(
										Math.ceil(tempQueue.length / 10) === 1
									);

								const choosePageButton = new MessageButton()
									.setCustomId('queueChoosePage')
									.setLabel('#')
									.setStyle('SUCCESS')
									.setDisabled(
										Math.ceil(tempQueue.length / 10) === 1
									);

								const row =
									new MessageActionRow().addComponents(
										firstPageButton,
										prevPageButton,
										nextPageButton,
										lastPageButton,
										choosePageButton
									);

								const message = await interaction.channel
									.send({
										embeds: [embed.embed],
										files: embed.files,
										components: [row],
									})
									.catch((err) => {
										console.error(err);
									});

								const status = setData(
									interaction.guildId,
									'queueMessageId',
									message.id
								);

								if (!status) {
									console.log(
										'Failed to write queueMessageId'
									);
								}

								const filter = (interaction) => {
									return (
										interaction.message.id === message.id
									);
								};

								const collector =
									message.channel.createMessageComponentCollector(
										{
											filter,
											time: 120000,
										}
									);

								let clickedChoosePageButton = false;

								collector.on('collect', async (interaction) => {
									const queue = await retrieveData(
										interaction.guildId,
										'queue'
									);
									if (queue.length == 0) {
										const status = interaction.message
											.delete()
											.catch((err) => {
												console.log(err);
											});

										embed = errorEmbed(
											'There is nothing in the queue',
											'The queue has been cleared for some reason.'
										);

										const errorMessage =
											await interaction.channel
												.send({
													embeds: [embed.embed],
													files: embed.files,
												})
												.catch((err) => {
													console.error(err);
												});

										await wait(4000);

										await errorMessage
											.delete()
											.catch((err) => {
												console.error(err);
											});

										return;
									}

									const maxPage = Math.ceil(
										queue.length / 10
									);

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
												const pageNumberMessage =
													await interaction.channel
														.send({
															embeds: [
																embed.embed,
															],
															files: embed.files,
														})
														.catch((error) => {
															console.error(
																error
															);
														});

												const pageFilter = (
													filterInteraction
												) => {
													return (
														interaction.member
															.id ===
														filterInteraction.member
															.id
													);
												};

												const pageCollector =
													pageNumberMessage.channel.createMessageCollector(
														{
															pageFilter,
															max: 1,
															time: 60000,
														}
													);

												pageCollector.on(
													'collect',
													async (memberMessage) => {
														var content =
															memberMessage.content;
														if (
															!isNaN(content) &&
															!isNaN(
																parseInt(
																	content
																)
															)
														) {
															content =
																parseInt(
																	content
																);
															if (
																content <=
																	maxPage &&
																content >= 1
															) {
																page = content;
																embed =
																	await queueEmbed(
																		interaction.guildId,
																		page
																	);

																if (page == 1) {
																	firstPageButton.setDisabled(
																		true
																	);
																	prevPageButton.setDisabled(
																		true
																	);
																	nextPageButton.setDisabled(
																		false
																	);
																	lastPageButton.setDisabled(
																		false
																	);
																} else if (
																	page ==
																	maxPage
																) {
																	firstPageButton.setDisabled(
																		false
																	);
																	prevPageButton.setDisabled(
																		false
																	);
																	nextPageButton.setDisabled(
																		true
																	);
																	lastPageButton.setDisabled(
																		true
																	);
																} else {
																	firstPageButton.setDisabled(
																		false
																	);
																	prevPageButton.setDisabled(
																		false
																	);
																	nextPageButton.setDisabled(
																		false
																	);
																	lastPageButton.setDisabled(
																		false
																	);
																}

																if (
																	maxPage == 1
																) {
																	choosePageButton.setDisabled(
																		true
																	);
																} else {
																	choosePageButton.setDisabled(
																		false
																	);
																}

																await message
																	.edit({
																		embeds: [
																			embed.embed,
																		],
																		components:
																			[
																				row,
																			],
																	})
																	.catch(
																		(
																			err
																		) => {
																			console.log(
																				err
																			);
																		}
																	);

																await pageNumberMessage
																	.delete()
																	.catch(
																		(
																			err
																		) => {
																			console.log(
																				err
																			);
																		}
																	);

																await memberMessage
																	.delete()
																	.catch(
																		(
																			err
																		) => {
																			console.log(
																				err
																			);
																		}
																	);
															} else {
																await memberMessage
																	.delete()
																	.catch(
																		(
																			err
																		) => {
																			console.log(
																				err
																			);
																		}
																	);

																embed =
																	errorEmbed(
																		'The integer you typed is not within the range!',
																		'Please click the button and try again!'
																	);
																await pageNumberMessage
																	.edit({
																		embeds: [
																			embed.embed,
																		],
																		files: embed.files,
																		ephemeral: true,
																	})
																	.catch(
																		(
																			error
																		) => {
																			console.error(
																				error
																			);
																		}
																	);

																await wait(
																	4000
																);

																await pageNumberMessage
																	.delete()
																	.catch(
																		(
																			err
																		) => {
																			console.log(
																				err
																			);
																		}
																	);
															}
														} else {
															await memberMessage
																.delete()
																.catch(
																	(err) => {
																		console.log(
																			err
																		);
																	}
																);

															embed = errorEmbed(
																'The message you typed is not a integer!',
																'Please click the button and try again!'
															);
															await pageNumberMessage
																.edit({
																	embeds: [
																		embed.embed,
																	],
																	files: embed.files,
																	ephemeral: true,
																})
																.catch(
																	(error) => {
																		console.error(
																			error
																		);
																	}
																);

															await wait(4000);

															await pageNumberMessage
																.delete()
																.catch(
																	(err) => {
																		console.log(
																			err
																		);
																	}
																);
														}
													}
												);

												pageCollector.on(
													'end',
													async (collected) => {
														clickedChoosePageButton = false;
													}
												);
											}

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
									embed = await queueEmbed(
										interaction.guildId,
										page
									);
									await interaction
										.update({
											embeds: [embed.embed],
											components: [row],
										})
										.catch((err) => {
											console.log(err);
										});
								});

								break;
						}
					} else {
						embed = errorEmbed(
							'Hey!',
							`${userMention(
								interaction.member.id
							)}, you are not in the same channel as Smoothie! Join the voice channel before clicking the 'Next Song' button!`
						);
						const errorMessage = await interaction.channel
							.send({
								embeds: [embed.embed],
								files: embed.files,
							})
							.catch((err) => {
								console.error(err);
							});

						await wait(4000);

						await errorMessage.delete().catch((err) => {
							console.error(err);
						});
					}
				});
			} else {
				console.log(
					'Cannot find a proper channel to send the playing now message!'
				);
			}
		} else {
			console.log(
				'Cannot find a proper channel to send the playing now message!'
			);
		}
	});

	player.on(voice.AudioPlayerStatus.Idle, async (audio) => {
		const resource = await getNextAudioResource(guildId);

		if (resource) {
			const newPlayer = await createAudioPlayer(guildId, connection);
			connection.subscribe(newPlayer);
			newPlayer.play(resource);
		} else {
			console.log('Unable to find the resource.');
		}
	});

	player.on('error', async (error) => {
		if (error.code === 410) {
			const channelId = await retrieveData(guildId, 'respondChannelId');
			if (channelId) {
				const channel = client.channels.cache.get(channelId);
				if (channel) {
					connection.destroy();
					let embed = errorEmbed(
						'Error 410!',
						'An error occurred! The music has stopped.'
					);
					await channel
						.send({ embeds: [embed.embed], files: embed.files })
						.catch((err) => {
							console.error(err);
						});
				}
			}
			return;
		}

		console.error(
			`Error: ${error.resource.metadata.title} ${error} ${error.code}`
		);
	});

	player.on(voice.AudioPlayerStatus.Paused, (obj) => {
		console.log(
			`${client.guilds.cache.get(guildId).name}'s music has been paused.`
		);
	});

	cacheData['player'][guildId] = player;

	return player;
};

module.exports = { createAudioPlayer };
