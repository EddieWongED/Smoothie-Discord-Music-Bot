const {
	getVoiceConnection,
	joinVoiceChannel,
	createAudioPlayer,
	NoSubscriberBehavior,
	AudioPlayerStatus,
	createAudioResource,
	VoiceConnectionStatus,
} = require('@discordjs/voice');
const { MessageActionRow, MessageButton } = require('discord.js');
const ytdl = require('ytdl-core');
const cacheData = require('../../data/cacheData.js');
const { retrieveData, setData } = require('../utils/changeData.js');
const client = require('../index.js');
const { playingNowEmbed, errorEmbed } = require('../objects/embed.js');
const wait = require('util').promisify(setTimeout);
const { userMention } = require('@discordjs/builders');

const ConnectionStatus = {
	SUCCESS: 0,
	SUCCESS_ALREADY_JOINED: 1,
	SUCCESS_JOINED_FROM_OTHER_CHANNEL: 2,
	ERROR_NOT_IN_CHANNEL: 3,
	ERROR_UNKNOWN: 4,
};

const isSameVoiceChannel = (guildId, memberVoiceChannel) => {
	if (memberVoiceChannel) {
		const connection = getVoiceConnection(guildId);
		if (connection) {
			if (memberVoiceChannel.id === connection.joinConfig.channelId) {
				return true;
			}
		}
	}

	return false;
};

const startConnecting = async (guildId, memberVoiceChannel) => {
	const connection = joinVoiceChannel({
		channelId: memberVoiceChannel.id,
		guildId: memberVoiceChannel.guild.id,
		adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
	});

	connection.on(VoiceConnectionStatus.Disconnected, async (obj) => {
		console.log('The bot has disconnected.');
		connection.destroy();
	});

	connection.on(VoiceConnectionStatus.Destroyed, async (obj) => {
		console.log('The connection has been destroyed.');
		cacheData['player'][guildId] = null;
	});

	const player = createPlayer(guildId, connection);

	connection.subscribe(player);
};

const connect = async (guildId, memberVoiceChannel) => {
	if (!memberVoiceChannel) {
		return ConnectionStatus.ERROR_NOT_IN_CHANNEL;
	}

	var connection = getVoiceConnection(guildId);

	if (connection === undefined) {
		startConnecting(guildId, memberVoiceChannel);

		return ConnectionStatus.SUCCESS;
	}

	if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
		startConnecting(guildId, memberVoiceChannel);

		return ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL;
	}

	if (memberVoiceChannel.id === connection.joinConfig.channelId) {
		return ConnectionStatus.SUCCESS_ALREADY_JOINED;
	}

	return ConnectionStatus.ERROR_UNKNOWN;
};

const getNextResource = async (guildId) => {
	const queue = await retrieveData(guildId, 'queue');

	if (queue.length != 0) {
		const first = queue.shift();
		queue.push(first);
		const url = queue[0]['url'];
		const title = queue[0]['title'];

		const status = await setData(guildId, 'queue', queue);
		if (!status) {
			console.log('An error of saving queue to guildData.json occurred.');

			return null;
		}

		const resource = await createResource(url, title);

		return resource;
	}
};

const createResource = async (url, title) => {
	const stream = ytdl(url, {
		filter: 'audioonly',
		quality: 'lowestaudio',
		dlChunkSize: 0,
	});

	return (resource = createAudioResource(stream, {
		metadata: {
			title: title,
			url: url,
		},
	}));
};

const createPlayer = (guildId, connection) => {
	const player = createAudioPlayer({
		behaviors: {
			noSubscriber: NoSubscriberBehavior.Pause,
			maxMissedFrames: 50,
		},
	});

	player.on(AudioPlayerStatus.Playing, async (obj) => {
		console.log('Playing');
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
				const message = await channel.send({
					embeds: [embed.embed],
					files: embed.files,
					components: [row],
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
						const resource = await getNextResource(guildId);

						if (resource) {
							const newPlayer = createPlayer(guildId, connection);
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

	player.on(AudioPlayerStatus.Idle, async (audio) => {
		console.log('Idling');
		const resource = await getNextResource(guildId);

		if (resource) {
			const newPlayer = createPlayer(guildId, connection);
			connection.subscribe(newPlayer);
			newPlayer.play(resource);
		} else {
			console.log('Unable to find the resource.');
		}
	});

	player.on('error', async (error) => {
		console.log('Erroring');

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

	cacheData['player'][guildId] = player;

	return player;
};

module.exports = {
	getNextResource,
	createResource,
	ConnectionStatus,
	connect,
	isSameVoiceChannel,
	createPlayer,
};
