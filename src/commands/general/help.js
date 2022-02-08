const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
	loadingEmbed,
	helpMainEmbed,
	helpCateEmbed,
	helpCommandEmbed,
} = require('../../objects/embed.js');
const { editReply } = require('../../handlers/messageHandler.js');
const { getFiles } = require('../../utils/getFiles.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Show all the commands available and its description.'),
	description(prefix) {
		return `Show all the commands available and its description.\n
				Usage: \`${prefix}help\` or \`/help\``;
	},
	async execute(interaction, args) {
		let embed = loadingEmbed(
			'Attempting to load the help message...',
			'Please be patient...'
		);

		const mainMessage = await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		embed = await helpMainEmbed();

		const selectMenu = new MessageSelectMenu()
			.setCustomId('selectCategory')
			.setPlaceholder('Pick a Category!')
			.setMinValues(1)
			.setMaxValues(1);

		const files = await getFiles('./src/commands');
		const commandDirs = files.filter((file) => file.endsWith('.js'));

		const cateDict = {};

		for (let commandDir of commandDirs) {
			commandDir = commandDir.replaceAll('\\', '/');
			const cate = commandDir.substring(
				commandDir.indexOf('commands') + 9,
				commandDir.lastIndexOf('/')
			);
			const command = commandDir.substring(
				commandDir.lastIndexOf('/') + 1,
				commandDir.lastIndexOf('.js')
			);
			if (!(cate in cateDict)) {
				cateDict[cate] = [command.toLowerCase()];
			} else {
				cateDict[cate].push(command.toLowerCase());
			}
		}

		for (let cate of Object.keys(cateDict)) {
			selectMenu.addOptions({
				label: cate,
				value: cate,
			});
		}

		const row = new MessageActionRow().addComponents(selectMenu);

		const message = await editReply(
			args,
			embed,
			mainMessage ? mainMessage : interaction,
			[row]
		);

		const filter = (interaction) => {
			return interaction.message.id === message.id;
		};

		const collector = message.channel.createMessageComponentCollector({
			filter,
			time: 120000,
			max: 1,
		});

		collector.on('collect', async (interaction) => {
			switch (interaction.customId) {
				case 'selectCategory':
					embed = await helpCateEmbed(interaction.values[0]);

					const commandSelectMenu = new MessageSelectMenu()
						.setCustomId('selectCommand')
						.setPlaceholder('Pick a Command!')
						.setMinValues(1)
						.setMaxValues(1);

					for (let command of cateDict[interaction.values[0]]) {
						commandSelectMenu.addOptions({
							label: command,
							value: command,
						});
					}

					const commandRow = new MessageActionRow().addComponents(
						commandSelectMenu
					);

					const commandfilter = (interaction) => {
						return interaction.message.id === message.id;
					};

					const commandCollector =
						message.channel.createMessageComponentCollector({
							commandfilter,
							time: 120000,
							max: 1,
						});

					commandCollector.on('collect', async (interaction) => {
						switch (interaction.customId) {
							case 'selectCommand':
								embed = await helpCommandEmbed(
									interaction.guildId,
									interaction.values[0]
								);

								await interaction.deferUpdate().catch((err) => {
									console.error(err);
								});
								await message
									.edit({
										embeds: [embed.embed],
										components: [],
									})
									.catch((err) => {
										console.log(err);
									});
								break;
						}
					});

					await interaction.deferUpdate().catch((err) => {
						console.error(err);
					});
					await message
						.edit({
							embeds: [embed.embed],
							components: [commandRow],
						})
						.catch((err) => {
							console.log(err);
						});
					break;
			}
		});
	},
};
