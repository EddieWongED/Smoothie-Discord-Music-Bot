const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { connect, ConnectionStatus } = require('../../objects/connection.js');
const { createAudioPlayer } = require('../../objects/audioPlayer.js');
const { createAudioResource } = require('../../objects/audioResource.js');
const { retrieveData, setData } = require('../../utils/changeData.js');
const { queueMusic, QueueVideoStatus } = require('../../utils/queueURL.js');
const {
	loadingEmbed,
	errorEmbed,
	successEmbed,
} = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');
const { queuePlaylist } = require('../../utils/queueURL.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays music with specified Youtube URL.')
		.addStringOption((option) =>
			option
				.setName('url')
				.setDescription('The URL of a Youtube video.')
				.setRequired(true)
		)
		.addBooleanOption((option) =>
			option
				.setName('play_now')
				.setDescription(
					'Plays the music immediately if the URL is a video. A playlist does no effect.'
				)
				.setRequired(true)
		),
	async execute(interaction) {
		let embed = loadingEmbed(
			'Attempting to play music...',
			'Please be patient...'
		);
		await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		let followUp = false;
		let followUpMessage = null;

		const connectionStatus = await connect(
			interaction.guildId,
			interaction.member.voice.channel
		);

		switch (connectionStatus) {
			case ConnectionStatus.SUCCESS:
				embed = successEmbed(
					'Smoothie joined the voice channel.',
					'Please welcome her! She is a shy girl.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				followUp = true;
				break;
			case ConnectionStatus.SUCCESS_ALREADY_JOINED:
				break;
			case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
				embed = successEmbed(
					'Smoothie joined from another voice channel.',
					'Please welcome her! She is a shy girl.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				followUp = true;
				break;
			case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
				embed = errorEmbed(
					'You are not in a voice channel!',
					'dumbass.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				return;
			default:
				embed = errorEmbed(
					'Unknown error occurred!',
					'A problem that the developer do not know wtf just happened.'
				);
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
				return;
		}

		await wait(1000);

		embed = loadingEmbed('Loading the music...', 'Please be patient.');

		if (followUp) {
			followUpMessage = await interaction
				.followUp({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});
		} else {
			await interaction
				.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});
		}

		const url = interaction.options.getString('url');

		if (!ytdl.validateURL(url)) {
			const metadata = await queuePlaylist(interaction.guildId, url);
			if (metadata != null) {
				embed = successEmbed(
					`All ${metadata.noOfVideo} videos are queued.`,
					`${metadata.noOfRepeated} of them were already in the queue. Enjoy the music.`
				);
			} else {
				embed = errorEmbed(
					'Invalid URL!',
					'Please check if the provided URL is valid or not.'
				);
			}
			if (followUp) {
				followUpMessage
					.edit({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
			} else {
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
			}
		} else {
			const playNow = interaction.options.getBoolean('play_now');

			const status = await queueMusic(interaction.guildId, url);

			switch (status) {
				case QueueVideoStatus.SUCCESS:
					if (playNow) {
						const queue = await retrieveData(
							interaction.guildId,
							'queue'
						);
						if (queue.length >= 1) {
							[queue[0], queue[queue.length - 1]] = [
								queue[queue.length - 1],
								queue[0],
							];
							const saveStatus = await setData(
								interaction.guildId,
								'queue',
								queue
							);
							if (saveStatus) {
								embed = successEmbed(
									'Playing the music now.',
									'Enjoy the music.'
								);
							} else {
								embed = errorEmbed(
									'Unknown error occurred!',
									'A problem that the developer do not know wtf just happened.'
								);
							}
						} else {
							embed = errorEmbed(
								'Unknown error occurred!',
								'A problem that the developer do not know wtf just happened.'
							);
						}
					} else {
						embed = successEmbed(
							'Queued the music.',
							'The song was placed at the end of the queue.'
						);
					}
					break;
				case QueueVideoStatus.ERROR_INVALID_URL:
					embed = errorEmbed(
						'Invalid URL!',
						'Please check if the provided URL is valid or not.'
					);
					break;
				case QueueVideoStatus.ERROR_ALREADY_EXIST:
					if (playNow) {
						let queue = await retrieveData(
							interaction.guildId,
							'queue'
						);
						const videoInfo = await ytdl.getBasicInfo(url, []);

						const index = queue.findIndex(
							(element) =>
								element['url'] ===
								videoInfo.videoDetails.video_url
						);
						const indexValue = queue[index];
						if (index == 0) {
							embed = errorEmbed(
								'The required music is currently playing!',
								'Did you not noticing that?'
							);
						} else if (index != -1) {
							const firstItem = queue.shift();
							queue.push(firstItem);
							queue = queue.filter(
								(element) => element !== indexValue
							);
							queue.unshift(indexValue);

							const saveStatus = await setData(
								interaction.guildId,
								'queue',
								queue
							);
							if (saveStatus) {
								embed = successEmbed(
									'Moved the required music to the front!',
									`Since the music was already in the queue, Smoothie moved the required music from ${
										index + 1
									} to the front.`
								);
							} else {
								embed = errorEmbed(
									'Unknown error occurred!',
									'A problem that the developer do not know wtf just happened.'
								);
							}
						} else {
							embed = errorEmbed(
								'Unknown error occurred!',
								'A problem that the developer do not know wtf just happened.'
							);
						}
					} else {
						embed = errorEmbed(
							'The music was already in the queue!',
							'Dumbass.'
						);
					}
					break;
			}

			const player = cacheData['player'][interaction.guildId];
			const queue = await retrieveData(interaction.guildId, 'queue');

			if (player) {
				if (
					queue.length >= 1 &&
					(player.state.status == AudioPlayerStatus.Idle || playNow)
				) {
					const resource = await createAudioResource(
						interaction.guildId,
						queue[0]['url'],
						queue[0]['title']
					);
					if (resource != null) {
						const connection = getVoiceConnection(
							interaction.guildId
						);
						if (connection) {
							const newPlayer = await createAudioPlayer(
								interaction.guildId,
								connection
							);
							connection.subscribe(newPlayer);
							newPlayer.play(resource);
						}
					}
				}
			} else {
				embed = errorEmbed(
					'Unknown error occurred!',
					'A problem that the developer do not know wtf just happened.'
				);
			}

			if (followUp) {
				followUpMessage
					.edit({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
			} else {
				await interaction
					.editReply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.error(err);
					});
			}
		}
	},
};
