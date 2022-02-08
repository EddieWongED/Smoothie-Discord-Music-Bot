const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { connect, ConnectionStatus } = require('../../objects/connection.js');
const { playFirstMusic } = require('../../objects/audioPlayer.js');
const { retrieveData, setData } = require('../../utils/changeData.js');
const {
	loadingEmbed,
	errorEmbed,
	successEmbed,
} = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');
const {
	QueueStatus,
	URLType,
	queuePlaylist,
	queueSingle,
	validURL,
	simplifyURL,
} = require('../../handlers/urlHandler.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play music with the specified Youtube / Spotify URL.')
		.addStringOption((option) =>
			option
				.setName('url')
				.setDescription('The URL of a Youtube / Spotify music video.')
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
	description(prefix) {
		return `Play music with the specified Youtube / Spotify URL \`<url>\`. For \`<play_now>\`, type \`true\` if you want to play the music immediately, else type \`false\`.\n
				Usage: \`${prefix}lyrics <url> <play_now>\` or \`/lyrics <url> <play_now>\``;
	},
	async execute(interaction, args, isPlayLoopPlaylist) {
		var url = null;
		var playNow = null;

		if (args) {
			if (args.length === 2) {
				if (
					!(
						args[1].toLowerCase() === 'true' ||
						args[1].toLowerCase() === 'false'
					)
				) {
					var prefix = await retrieveData(
						interaction.guildId,
						'prefix'
					);
					if (!prefix) {
						prefix = '$';
					}

					let embed = errorEmbed(
						'Wrong value of play_now!',
						'For the second argument (`play_now`), if you want to play the music immediately, type `true`, `false` otherwise. If the URL is a playlist it does not matter. \nThe format should be `' +
							prefix +
							'play <url> <play_now>`'
					);
					await interaction
						.reply({
							embeds: [embed.embed],
							files: embed.files,
						})
						.catch((err) => {
							console.log(err);
						});

					return;
				}

				url = args[0];
				playNow = args[1].toLowerCase() === 'true';
			} else {
				var prefix = await retrieveData(interaction.guildId, 'prefix');
				if (!prefix) {
					prefix = '$';
				}

				let embed = errorEmbed(
					'Not enough / Too much arguments!',
					'For `play` command, you must specify the Youtube / Spotify URL first, and then specify if you want to play the music immediately or not. Type `true` if you want, `false` otherwise.\nThe format should be `' +
						prefix +
						'play <url> <play_now>`'
				);
				await interaction
					.reply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.log(err);
					});

				return;
			}
		} else {
			url = interaction.options.getString('url');
			if (isPlayLoopPlaylist) {
				url = process.env.LOOPPLAYLISTURL;
			}
			playNow = interaction.options.getBoolean('play_now');
		}

		let embed = loadingEmbed(
			'Checking if Smoothie is in your voice channel or not...',
			'Please be patient...'
		);

		const mainMessage = await interaction
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
				await editReply(
					args,
					embed,
					mainMessage ? mainMessage : interaction
				);
				followUp = true;
				break;
			case ConnectionStatus.SUCCESS_ALREADY_JOINED:
				break;
			case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
				embed = successEmbed(
					'Smoothie joined from another voice channel.',
					'Please welcome her! She is a shy girl.'
				);
				await editReply(
					args,
					embed,
					mainMessage ? mainMessage : interaction
				);
				followUp = true;
				break;
			case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
				embed = errorEmbed(
					'You are not in a voice channel!',
					'dumbass.'
				);
				await editReply(
					args,
					embed,
					mainMessage ? mainMessage : interaction
				);
				return;
			default:
				embed = errorEmbed(
					'Unknown error occurred!',
					'A problem that the developer do not know wtf just happened.'
				);
				await editReply(
					args,
					embed,
					mainMessage ? mainMessage : interaction
				);
				return;
		}

		embed = loadingEmbed('Loading the music...', 'Please be patient.');

		if (followUp) {
			followUpMessage = await interaction.channel
				.send({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});
		} else {
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		}

		const valid = await validURL(url);
		let errorStop = false;

		switch (valid) {
			case URLType.INVALIDURL:
				embed = errorEmbed(
					'Invalid URL!',
					'Please check if the provided URL is valid or not.'
				);
				errorStop = true;
				break;
			case URLType.SPOTIFYSINGLE:
			case URLType.YOUTUBESINGLE:
				embed = loadingEmbed(
					'Seems like you have given a single music only...',
					'Attempting to add the music to the queue. Please be patient. Spotify link usually takes longer time.'
				);

				if (followUp) {
					followUpMessage = await interaction.channel
						.send({ embeds: [embed.embed], files: embed.files })
						.catch((err) => {
							console.error(err);
						});
				} else {
					await editReply(
						args,
						embed,
						mainMessage ? mainMessage : interaction
					);
				}

				const queueStatus = await queueSingle(interaction.guildId, url);
				switch (queueStatus) {
					case QueueStatus.SUCCESS:
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
									break;
								}
							}

							embed = errorEmbed(
								'Unknown error occurred!',
								'A problem that the developer do not know wtf just happened.'
							);
							errorStop = true;
						} else {
							embed = successEmbed(
								'Queued the music.',
								'The song was placed at the end of the queue.'
							);
							errorStop = true;
						}
						break;
					case QueueStatus.ERROR_ALREADY_EXIST:
						if (playNow) {
							let queue = await retrieveData(
								interaction.guildId,
								'queue'
							);

							const simplifedURL = await simplifyURL(url);

							const index = queue.findIndex(
								(element) =>
									element['originalURL'] === simplifedURL
							);

							const indexValue = queue[index];
							if (index == 0) {
								embed = errorEmbed(
									'The required music is currently playing!',
									'Did you not noticing that?'
								);
								errorStop = true;
								break;
							}
							if (index != -1) {
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
									break;
								}
							}

							embed = errorEmbed(
								'Unknown error occurred!',
								'A problem that the developer do not know wtf just happened.'
							);
							errorStop = true;
						} else {
							embed = errorEmbed(
								'The music was already in the queue!',
								'Dumbass.'
							);
							errorStop = true;
						}
						break;
					default:
						embed = errorEmbed(
							'Unknown error occurred!',
							'A problem that the developer do not know wtf just happened.'
						);
						errorStop = true;
						break;
				}
				break;
			case URLType.YOUTUBEPLAYLIST:
			case URLType.SPOTIFYPLAYLIST:
				embed = loadingEmbed(
					'Seems like you have given a playlist...',
					'Attempting to add all music to the queue. Please be patient. Spotify playlist usually takes longer time.'
				);

				if (followUp) {
					followUpMessage = await interaction.channel
						.send({
							embeds: [embed.embed],
							files: embed.files,
						})
						.catch((err) => {
							console.error(err);
						});
				} else {
					await editReply(
						args,
						embed,
						mainMessage ? mainMessage : interaction
					);
				}

				const queueSuccessData = await queuePlaylist(
					interaction.guildId,
					url
				);

				if (
					queueSuccessData !== QueueStatus.ERROR_UNKNOWN &&
					queueSuccessData !== QueueStatus.ERROR_INVALID_URL
				) {
					embed = successEmbed(
						`All ${queueSuccessData.noOfMusic} videos are queued.`,
						`${queueSuccessData.noOfRepeated} of them were already in the queue. Enjoy the music.`
					);
					break;
				}

				embed = errorEmbed(
					'Unknown error occurred!',
					'A problem that the developer do not know wtf just happened.'
				);
				errorStop = true;
				break;
		}

		const player = cacheData['player'][interaction.guildId];

		if (
			(player.state.status != AudioPlayerStatus.Playing || playNow) &&
			!errorStop &&
			valid != URLType.YOUTUBEPLAYLIST &&
			valid != URLType.SPOTIFYPLAYLIST
		) {
			const playSuccess = await playFirstMusic(interaction.guildId);
			if (!playSuccess) {
				embed = errorEmbed(
					'Unknown error occurred!',
					'A problem that the developer do not know wtf just happened.'
				);
			}
		}

		if (followUp) {
			followUpMessage
				.edit({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});
		} else {
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);
		}
	},
};
