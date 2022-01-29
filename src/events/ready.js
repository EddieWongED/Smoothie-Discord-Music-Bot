const { getFiles } = require('../utils/getFiles.js');
const { retrieveData } = require('../utils/changeData.js');
const { getVoiceConnection } = require('@discordjs/voice');
const client = require('../index.js');
const {
	neturalEmbed,
	successEmbed,
	errorEmbed,
} = require('../objects/embed.js');
const { connect, ConnectionStatus } = require('../objects/connection.js');
const { createAudioPlayer } = require('../objects/audioPlayer.js');
const cacheData = require('../../data/cacheData.js');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		try {
			const commandDirs = await getFiles('./data/guildData');
			const filterDirs = commandDirs.filter((file) =>
				file.endsWith('.json')
			);
			for (filterDir of filterDirs) {
				const json = require(filterDir);
				const guildId = json.guildId;
				const voiceChannelId = await retrieveData(
					guildId,
					'voiceChannelId'
				);
				if (voiceChannelId) {
					const voiceChannel =
						client.channels.cache.get(voiceChannelId);
					if (voiceChannel) {
						const channelId = await retrieveData(
							guildId,
							'respondChannelId'
						);
						if (channelId) {
							const channel =
								client.channels.cache.get(channelId);
							if (channel) {
								let embed = neturalEmbed(
									'Smoothie has restarted...',
									'Since there was an updated / server regular restart (every 24 hours) / server crashes, Smoothie has restarted. Smoothie will now attempt to rejoin your voice channel again...'
								);

								await channel
									.send({
										embeds: [embed.embed],
										files: embed.files,
									})
									.catch((err) => {
										console.error(err);
									});

								const status = await connect(
									guildId,
									voiceChannel
								);

								switch (status) {
									case ConnectionStatus.SUCCESS:
										embed = successEmbed(
											'Smoothie rejoined the voice channel.',
											'Please welcome her again!'
										);
										await channel
											.send({
												embeds: [embed.embed],
												files: embed.files,
											})
											.catch((err) => {
												console.error(err);
											});
										const connection =
											getVoiceConnection(guildId);

										const player = await createAudioPlayer(
											guildId,
											connection
										);
										cacheData['player'][guildId] = player;
										connection.subscribe(player);
										break;
									default:
										embed = errorEmbed(
											'Failed to rejoin the voice channel!',
											'Please try to manually let she to join your voice channel.'
										);
										await channel
											.send({
												embeds: [embed.embed],
												files: embed.files,
											})
											.catch((err) => {
												console.error(err);
											});
										return;
								}
							}
						}
					}
				}
			}
		} catch (err) {
			console.error(err);
		}
	},
};
