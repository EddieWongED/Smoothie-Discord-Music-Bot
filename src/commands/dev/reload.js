const { SlashCommandBuilder } = require('@discordjs/builders');
const { getFiles } = require('../../utils/getFiles.js');
const fs = require('fs');
const {
	loadingEmbed,
	successEmbed,
	errorEmbed,
} = require('../../objects/embed.js');
const { editReply } = require('../../handlers/messageHandler.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('For Eddie to test his code. Reload all the commands.'),
	description(prefix) {
		return `For Eddie to test his code. Reload all the commands.\n
				Usage: \`${prefix}reload\` or \`/reload\``;
	},
	async execute(interaction, args) {
		const devUserIdList = process.env.DEVUSERIDS;
		let devUserIds;

		let found = false;

		if (devUserIdList) {
			devUserIds = devUserIdList.split(' ');

			for (let devUserId of devUserIds) {
				if (devUserId === interaction.member.id) {
					found = true;

					break;
				}
			}
		} else {
			console.log(
				'WARNING: Unable to find your DEVUSERIDS! If you want to use dev commands, please add DEVUSERIDS=<your_user_id> in .env file.'
			);
		}

		if (!found) {
			const embed = errorEmbed(
				'You think you are good enough to run this command?',
				'Idiot.'
			);
			await interaction
				.reply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});

			return;
		}

		let embed = loadingEmbed(
			'Attempting to reload commands...',
			'Please be patient...'
		);

		const mainMessage = await interaction
			.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		const folderDirs = fs
			.readdirSync('./src')
			.filter((file) => !file.includes('.'));

		let followUp = false;

		for (const folderDir of folderDirs.reverse()) {
			const files = await getFiles(`./src/${folderDir}`);
			const fileDirs = files.filter((file) => file.endsWith('.js'));

			const fileDirsSuccess = [];

			for (const fileDir of fileDirs) {
				try {
					delete require.cache[require.resolve(fileDir)];

					if (folderDir === 'commands') {
						const command = require(fileDir);
						interaction.client.commands.set(
							command.data.name,
							command
						);
					}

					fileDirsSuccess.push(fileDir);
				} catch (err) {
					console.error(err);
				}
			}

			let des = '```CSS\n';

			for (let i = 0; i < fileDirsSuccess.length; i++) {
				des =
					des +
					`${i + 1}: ${fileDirsSuccess[i].substring(
						fileDirsSuccess[i].lastIndexOf('\\src') + 1,
						fileDirsSuccess[i].length
					)}\n`;
			}

			des = des + '```';

			embed = successEmbed(
				`Reload success! ${fileDirsSuccess.length} ${folderDir} files were reloaded.`,
				des
			);

			if (followUp) {
				await interaction.channel
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
				followUp = true;
			}
		}
	},
};
