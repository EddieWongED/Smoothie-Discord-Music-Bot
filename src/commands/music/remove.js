const { SlashCommandBuilder } = require('@discordjs/builders');
const { isSameVoiceChannel } = require('../../utils/isSameVoiceChannel.js');
const {
	successEmbed,
	errorEmbed,
	loadingEmbed,
} = require('../../objects/embed.js');
const { playFirstMusic } = require('../../objects/audioPlayer.js');
const { setData, retrieveData } = require('../../utils/changeData.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove one music given the index.')
		.addIntegerOption((option) =>
			option
				.setName('index')
				.setDescription('The index of the music to be removed.')
				.setRequired(true)
		),
	description(prefix) {
		return `Remove one music given the index.\n
				Usage: \`${prefix}remove <index>\` or \`/remove <index>\``;
	},
	async execute(interaction, args) {
		let index = null;

		if (args) {
			if (args.length === 1) {
				if (isNaN(args[0]) && isNaN(parseInt(args[0]))) {
					let embed = errorEmbed(
						'Wrong value of index!',
						'the index should be a integer!'
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

				index = parseInt(args[0]);
			} else {
				let embed = errorEmbed('Error!', 'Unknown Error.');

				if (args.length > 2) {
					embed = errorEmbed(
						'Too much arguments!',
						'For `remove` command, you should only specify the index of music to be removed.'
					);
				} else {
					embed = errorEmbed(
						'Too few arguments!',
						'For `remove` command, you should only specify the index of music to be removed.'
					);
				}

				await interaction
					.reply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.log(err);
					});

				return;
			}
		} else {
			index = interaction.options.getInteger('index');
		}

		const queue = await retrieveData(interaction.guildId, 'queue');

		if (queue.length === 0) {
			const embed = errorEmbed(
				'No music no fun..',
				'There is no music in the queue that can be removed...'
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

		if (index > queue.length || index < 1) {
			let embed = errorEmbed(
				'Index out of range!',
				`the index should be within 1 to ${queue.length}!`
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

		const musicTitle = queue[index - 1]['title'];
		let embed = loadingEmbed(
			`Attempting to remove the music titled \`${musicTitle}\``,
			'Please be patient...'
		);

		const mainMessage = await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		if (
			!isSameVoiceChannel(
				interaction.guildId,
				interaction.member.voice.channel
			)
		) {
			embed = errorEmbed(
				'You are not in the same voice channel as Smoothie!',
				'Please join the voice channel before you want to do something!'
			);
			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		const removedElement = queue.splice(index - 1, 1);

		const status = await setData(interaction.guildId, 'queue', queue);

		if (status) {
			let successMessage = `${musicTitle} has been removed.`;
			if (index == 1) {
				const success = playFirstMusic(interaction.guildId);
				if (success) {
					successMessage += ` Since this is the first music, the next music will be played immediately.`;
				} else {
					successMessage += ` However, there was an error to skip the removed music.`;
				}
			}

			embed = successEmbed('Success!', successMessage);
		} else {
			embed = errorEmbed(
				'Cannot clear the music...',
				`Cannot clear the music titled ${musicTitle}, for some reason.`
			);
		}

		await editReply(args, embed, mainMessage ? mainMessage : interaction);
	},
};
