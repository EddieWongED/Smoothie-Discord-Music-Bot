const { SlashCommandBuilder } = require('@discordjs/builders');
const { retrieveData, setData } = require('../../utils/changeData.js');
const {
	loadingEmbed,
	errorEmbed,
	neturalEmbed,
} = require('../../objects/embed.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prefix')
		.setDescription('Show / Change the prefix.')
		.addStringOption((option) =>
			option
				.setName('prefix')
				.setDescription(
					'The prefix you want to change to  (max length = 3).'
				)
				.setRequired(false)
		),
	description(prefix) {
		return `Show the prefix.\n
				Usage: \`${prefix}prefix\` or \`/prefix\`\n
				Change the prefix to \`<prefix>\`.\n
				Usage: \`${prefix}prefix <prefix>\` or \`/prefix <prefix>\``;
	},
	async execute(interaction, args) {
		var prefix = null;

		if (args) {
			if (args.length === 1) {
				prefix = args[0];
			} else if (args.length > 1) {
				var guildPrefix = await retrieveData(
					interaction.guildId,
					'prefix'
				);
				if (!guildPrefix) {
					guildPrefix = '$';
				}

				let embed = errorEmbed(
					'Too much arguments!',
					'For `prefix` command, you can either not provide any argument, which will show the prefix of this guild, or provide one argument, which is the prefix you want to change to (max length = 3).\nUsage: `' +
						guildPrefix +
						'prefix` or `' +
						guildPrefix +
						'prefix <prefix>`'
				);
				await interaction
					.reply({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {
						console.log(err);
					});

				return;
			}
		} else {
			prefix = interaction.options.getString('prefix');
		}

		let embed = loadingEmbed(
			'Attempting to change / show prefix...',
			'Please be patient...'
		);

		const mainMessage = await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		if (!prefix) {
			var guildPrefix = await retrieveData(interaction.guildId, 'prefix');
			if (!guildPrefix) {
				guildPrefix = '$';
			}

			embed = neturalEmbed(
				'Prefix',
				`The prefix of this guild is \`${guildPrefix}\`.`
			);

			await editReply(
				args,
				embed,
				mainMessage ? mainMessage : interaction
			);

			return;
		}

		if (prefix.length <= 3) {
			var guildPrefix = await retrieveData(interaction.guildId, 'prefix');
			if (!guildPrefix) {
				guildPrefix = '$';
			}

			if (guildPrefix === prefix) {
				embed = errorEmbed(
					'Nothing changed...',
					`The prefix of this guild is \`${guildPrefix}\` already!`
				);
			} else {
				const status = setData(interaction.guildId, 'prefix', prefix);

				if (status) {
					embed = neturalEmbed(
						'Prefix',
						`The prefix is changed from \`${guildPrefix}\` to \`${prefix}\`.`
					);
				} else {
					embed = errorEmbed(
						'Failed to save prefix',
						'Please try again.'
					);
				}
			}
		} else {
			embed = errorEmbed(
				'Wrong value of prefix!',
				'The maximum length of a prefix is 3!'
			);
		}

		await editReply(args, embed, mainMessage ? mainMessage : interaction);
	},
};
