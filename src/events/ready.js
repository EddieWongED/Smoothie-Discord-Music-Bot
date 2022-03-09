const { getFiles } = require('../utils/getFiles.js');
const { retrieveData } = require('../utils/changeData.js');
const {
	neturalEmbed,
	successEmbed,
	errorEmbed,
} = require('../objects/embed.js');
const { connect, ConnectionStatus } = require('../objects/connection.js');
const { bold } = require('@discordjs/builders');
const fs = require('fs');
const wait = require('util').promisify(setTimeout);

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		client.user.setActivity('$help / slash command', { type: 'PLAYING' });

		var patches = '';
		var update = '';
		try {
			patches = fs.readFileSync('./text/patches.txt', 'utf8').toString();
			update = fs
				.readFileSync('./text/main_update.txt', 'utf8')
				.toString();
		} catch (err) {
			console.error(err);
		}

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
									`Since there was an updated / server regular restart / server crashes, Smoothie has restarted.\nSmoothie will now attempt to rejoin your voice channel again...\n${bold(
										'Update'
									)}:\n${update}\n${bold(
										'Patches'
									)}:\n${patches}`
								);

								const msg = await channel
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
											'Smoothie has restarted...',
											`Since there was an updated / server regular restart / server crashes, Smoothie has restarted.\nSmoothie has successfully rejoined the server!\n${bold(
												'Update'
											)}:\n${update}\n${bold(
												'Patches'
											)}:\n${patches}`
										);
										await msg
											.edit({
												embeds: [embed.embed],
												files: embed.files,
											})
											.catch((err) => {
												console.error(err);
											});

										break;
									default:
										embed = errorEmbed(
											'Smoothie has restarted...',
											`Since there was an updated / server regular restart / server crashes, Smoothie has restarted.\nSmoothie failed to rejoin the server!\n${bold(
												'Update'
											)}:\n${update}\n${bold(
												'Patches'
											)}:\n${patches}`
										);
										await msg
											.edit({
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

				await wait(1000);
			}
		} catch (err) {
			console.error(err);
		}
	},
};
