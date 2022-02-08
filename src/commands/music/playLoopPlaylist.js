const { SlashCommandBuilder } = require('@discordjs/builders');
const { errorEmbed } = require('../../objects/embed.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playloopplaylist')
		.setDescription(
			'Play the playlist that is specified in environment variable.'
		),
	description(prefix) {
		return `Play the playlist that is specified in environment variable. The purpose of this command is to avoid copying and pasting the playlist URL where you and your friends save your favourite music on. Only work on guilds that are specified in environment variable to avoid people from other guild accessing your playlist.\n
				Usage: \`${prefix}playloopplaylist\` or \`/playloopplaylist\``;
	},
	async execute(interaction, args) {
		const guildList = process.env.LOOPPLAYLISTGUILDIDS;

		let guildIds;

		let found = false;

		if (guildList) {
			guildIds = guildList.split(' ');

			for (let guildId of guildIds) {
				if (guildId === interaction.guildId) {
					found = true;

					break;
				}
			}
		} else {
			console.log(
				'WARNING: Unable to find your LOOPPLAYLISTGUILDIDS! If you want to use /playloopplaylist in your guild, please add LOOPPLAYLISTGUILDIDS=<your_guild_id> in .env file.'
			);
		}

		if (!found) {
			const embed = errorEmbed(
				'You cannot use this command in this guild!',
				'This command is just for specfic guilds.'
			);
			await interaction
				.reply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});

			return;
		}

		const playCommand = interaction.client.commands.get('play');
		try {
			const loopPlaylistURL = process.env.LOOPPLAYLISTURL;

			if (!loopPlaylistURL) {
				console.log(
					'WARNING: Unable to find your LOOPPLAYLISTURL! If you want to use /playloopplaylist in your guild, please add LOOPPLAYLISTURL=<youtube/spotify_playlist_url> in .env file.'
				);
			}

			await playCommand.execute(
				interaction,
				args ? [loopPlaylistURL, 'false'] : args,
				true
			);
		} catch (error) {
			console.error(error);
			const embed = errorEmbed(
				'There was an error while executing this command!',
				'Something went wrong...'
			);
			await interaction.channel
				.send({
					embeds: [embed.embed],
					files: embed.files,
				})
				.catch((err) => {
					console.error(err);
				});
		}
	},
};
