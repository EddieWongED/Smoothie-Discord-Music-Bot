const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const { retrieveData, setData } = require('../utils/changeData.js');
const client = require('../index.js');
const { neturalEmbed, successEmbed } = require('../objects/embed.js');
const cacheData = require('../../data/cacheData.js');
const { playFirstMusic } = require('../objects/audioPlayer.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(oldState, newState) {
		if (newState.channel) {
			console.log(
				`${client.guilds.cache.get(newState.guild.id).name}: ${
					newState.member.user.username
				} has joined voice channel "${newState.channel.name}".`
			);
		} else {
			console.log(
				`${client.guilds.cache.get(oldState.guild.id).name}: ${
					oldState.member.user.username
				} has left voice channel "${oldState.channel.name}".`
			);
		}

		const guildId = newState.guild.id;
		const connection = getVoiceConnection(guildId);
		if (connection) {
			const voiceChannel = client.channels.cache.get(
				connection.joinConfig.channelId
			);
			if (voiceChannel.members.size === 1) {
				const player = cacheData['player'][guildId];
				if (player) {
					const pause = player.pause();
					if (pause) {
						const channelId = await retrieveData(
							guildId,
							'respondChannelId'
						);
						if (channelId) {
							const channel =
								client.channels.cache.get(channelId);
							if (channel) {
								if (!newState.member.user.bot) {
									let embed = neturalEmbed(
										'No one want to listen to Smoothie anymore...',
										'Therefore, she stop singing. She will resume if someone joins the voice channel.'
									);
									await channel
										.send({
											embeds: [embed.embed],
											files: embed.files,
										})
										.catch((err) => {
											console.error(err);
										});
								}
							}
						}
					}
				}
			} else if (voiceChannel.members.size > 1) {
				const player = cacheData['player'][guildId];
				if (player) {
					if (player.state.status != AudioPlayerStatus.Playing) {
						const unpause = player.unpause();
						if (unpause) {
							const channelId = await retrieveData(
								guildId,
								'respondChannelId'
							);
							if (channelId) {
								const channel =
									client.channels.cache.get(channelId);
								if (channel) {
									if (!newState.member.user.bot) {
										let embed = successEmbed(
											'Welcome back!',
											'Smoothie will continue to sing.'
										);
										await channel
											.send({
												embeds: [embed.embed],
												files: embed.files,
											})
											.catch((err) => {
												console.error(err);
											});
									}
								}
							}
						} else {
							const connection = getVoiceConnection(guildId);
							if (connection) {
								const playSuccess = await playFirstMusic(
									guildId
								);
								if (!playSuccess) {
									console.log(
										'Unable to play the first music.'
									);
								}
							}
						}
					}
				} else {
					const connection = getVoiceConnection(guildId);
					if (connection) {
						const playSuccess = await playFirstMusic(guildId);
						if (!playSuccess) {
							console.log('Unable to play the first music.');
						}
					}
				}
			}
		}
	},
};
