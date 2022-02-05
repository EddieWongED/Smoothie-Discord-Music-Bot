const { SlashCommandBuilder } = require('@discordjs/builders');
const { errorEmbed } = require('../../objects/embed.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playloopplaylist')
		.setDescription('Plays THE playlist.'),
	async execute(interaction, args) {
		const playCommand = interaction.client.commands.get('play');
		try {
			await playCommand.execute(
				interaction,
				args ? [process.env.LOOPPLAYLISTURL, 'false'] : args,
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
