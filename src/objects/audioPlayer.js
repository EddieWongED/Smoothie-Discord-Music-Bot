const voice = require('@discordjs/voice');
const { MessageActionRow, MessageButton } = require('discord.js');
const { isSameVoiceChannel } = require('../utils/isSameVoiceChannel.js');
const { getNextAudioResource } = require('./audioResource.js');
const ytdl = require('ytdl-core');
const cacheData = require('../../data/cacheData.js');
const { retrieveData, setData } = require('../utils/changeData.js');
const client = require('../index.js');
const { playingNowEmbed, errorEmbed } = require('../objects/embed.js');
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

				const row = new MessageActionRow().addComponents(
					playNextButton
				);

				const info = await ytdl.getBasicInfo(obj.resource.metadata.url);

				if (!info) {
					console.log('cannot fetch info from the url.');

					return;
				}

				const time = parseInt(info.videoDetails.lengthSeconds) * 1000;

				let embed = await playingNowEmbed(guildId);
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

				collector.on('collect', async (interaction) => {
					await interaction.deferUpdate();
					if (
						isSameVoiceChannel(
							interaction.guildId,
							interaction.member.voice.channel
						)
					) {
						const resource = await getNextAudioResource(guildId);

						if (resource) {
							const newPlayer = await createAudioPlayer(
								guildId,
								connection
							);
							connection.subscribe(newPlayer);
							newPlayer.play(resource);
							collector.stop();
						} else {
							console.log('Unable to find the resource.');
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
