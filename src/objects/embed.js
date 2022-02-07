const ytdl = require('ytdl-core');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { retrieveData } = require('../utils/changeData.js');
const { inlineCode } = require('@discordjs/builders');
const { getFiles } = require('../utils/getFiles.js');

const successEmbed = (title, des) => {
	if (title.length > 256) {
		title = title.substring(0, 253) + '...';
	}

	if (des.length > 4096) {
		des = des.substring(0, 4093) + '...';
	}

	const xxxhdpiIcon = new MessageAttachment(
		'./icon/mipmap-xxxhdpi/smoothie.png'
	);
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
		.setColor('#63E68C')
		.setTitle(`:white_check_mark: ${title}`)
		.setDescription(des)
		.setThumbnail('attachment://smoothie.png')
		.setTimestamp()
		.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png' });
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon],
	};
};

const loadingEmbed = (title, des) => {
	if (title.length > 256) {
		title = title.substring(0, 253) + '...';
	}

	if (des.length > 4096) {
		des = des.substring(0, 4093) + '...';
	}

	const xxxhdpiIcon = new MessageAttachment(
		'./icon/mipmap-xxxhdpi/smoothie.png'
	);
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
		.setColor('#FAA81A')
		.setTitle(`:hourglass: ${title}`)
		.setDescription(des)
		.setThumbnail('attachment://smoothie.png')
		.setTimestamp()
		.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png' });
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon],
	};
};

const errorEmbed = (title, des) => {
	if (title.length > 256) {
		title = title.substring(0, 253) + '...';
	}

	if (des.length > 4096) {
		des = des.substring(0, 4093) + '...';
	}

	const xxxhdpiIcon = new MessageAttachment(
		'./icon/mipmap-xxxhdpi/smoothie.png'
	);
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
		.setColor('#DA5849')
		.setTitle(`:no_entry: ${title}`)
		.setDescription(des)
		.setThumbnail('attachment://smoothie.png')
		.setTimestamp()
		.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png' });
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon],
	};
};

const neturalEmbed = (title, des) => {
	if (title.length > 256) {
		title = title.substring(0, 253) + '...';
	}

	if (des.length > 4096) {
		des = des.substring(0, 4093) + '...';
	}

	const xxxhdpiIcon = new MessageAttachment(
		'./icon/mipmap-xxxhdpi/smoothie.png'
	);
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
		.setColor('#7C5295')
		.setTitle(title)
		.setDescription(des)
		.setThumbnail('attachment://smoothie.png')
		.setTimestamp()
		.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png' });
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon],
	};
};

const playingNowEmbed = async (guildId) => {
	const queue = await retrieveData(guildId, 'queue');
	if (queue.length >= 1) {
		const url = queue[0]['url'];

		var nextTitle = queue[0]['title'];
		if (queue.length > 1) {
			nextTitle = queue[1]['title'];
		}

		const info = await ytdl.getBasicInfo(url);

		if (!info) {
			console.log('cannot fetch info from the url.');

			return;
		}

		var defaultThumbnail = true;

		var thumbnailURL = 'attachment://smoothie.png';
		if (info.videoDetails.thumbnails[0]['url']) {
			thumbnailURL = info.videoDetails.thumbnails[0]['url'];
			defaultThumbnail = false;
		}

		const hour = Math.floor(
			Math.floor(parseInt(info.videoDetails.lengthSeconds) / 60) / 60
		);
		var min =
			Math.floor(parseInt(info.videoDetails.lengthSeconds) / 60) % 60;
		var sec = parseInt(info.videoDetails.lengthSeconds) % 60;
		sec = ('0' + sec).slice(-2);

		var durationString = `${hour}:${min}:${sec}`;
		if (hour == 0) {
			durationString = `${min}:${sec}`;
		} else {
			min = ('0' + min).slice(-2);
			durationString = `${hour}:${min}:${sec}`;
		}

		const hdpiIcon = new MessageAttachment(
			'./icon/mipmap-hdpi/smoothie.png'
		);

		const embed = new MessageEmbed()
			.setColor('#12E9E9')
			.setTitle('Playing Now')
			.setThumbnail(thumbnailURL)
			.setDescription(`[${info.videoDetails.title}](${url})`)
			.addFields(
				{ name: 'Duration', value: durationString, inline: true },
				{ name: '\u200B', value: '\u200B', inline: true },
				{ name: 'Up Coming', value: nextTitle, inline: true }
			)
			.setTimestamp()
			.setFooter({
				text: 'Smoothie',
				iconURL: 'attachment://smoothie.png',
			});

		if (defaultThumbnail) {
			const xxxhdpiIcon = new MessageAttachment(
				'./icon/mipmap-xxxhdpi/smoothie.png'
			);

			return {
				embed: embed,
				files: [xxxhdpiIcon, hdpiIcon],
			};
		} else {
			return {
				embed: embed,
				files: [hdpiIcon],
			};
		}
	}
};

const queueEmbed = async (guildId, page) => {
	const queue = await retrieveData(guildId, 'queue');

	if (!queue) {
		return errorEmbed(
			'Error',
			'There was an error when loading your queue.'
		);
	}

	const maxPage = Math.ceil(queue.length / 10);

	if (page > maxPage) {
		page = maxPage;
	}

	if (page < 1) {
		page = 1;
	}

	const titleArr = [];

	if (page != maxPage) {
		for (let i = 0; i < 10; i++) {
			titleArr.push(queue[10 * (page - 1) + i]['title']);
		}
	} else {
		for (let i = (maxPage - 1) * 10; i < queue.length; i++) {
			titleArr.push(queue[i]['title']);
		}
	}

	let des = '';
	for (let i = 0; i < titleArr.length; i++) {
		des = `${des}${(page - 1) * 10 + i + 1}: ${inlineCode(titleArr[i])} \n`;
	}

	if (des.length > 4096) {
		des = des.substring(0, 4093) + '...';
	}

	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');

	const embed = new MessageEmbed()
		.setColor('#5865F2')
		.setTitle(`Queue`)
		.setDescription(des)
		.setTimestamp()
		.setFooter({
			text: `Smoothie - Page: ${page}/${maxPage} - Buttons will be disabled in 2 minutes`,
			iconURL: 'attachment://smoothie.png',
		});
	return {
		embed: embed,
		files: [hdpiIcon],
	};
};

const lyricsEmbed = (title, des) => {
	if (title.length > 256) {
		title = title.substring(0, 253) + '...';
	}

	if (des.length > 4096) {
		des = des.substring(0, 4093) + '...';
	}

	const xxxhdpiIcon = new MessageAttachment(
		'./icon/mipmap-xxxhdpi/smoothie.png'
	);
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
		.setColor('#FFFFFF')
		.setTitle(title)
		.setDescription(des)
		.setThumbnail('attachment://smoothie.png')
		.setTimestamp()
		.setFooter({
			text: 'Smoothie - If the result is wrong, try /description to see if there is any lyrics in the Youtube description!',
			iconURL: 'attachment://smoothie.png',
		});
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon],
	};
};

const helpMainEmbed = async () => {
	try {
		const files = await getFiles('./src/commands');
		const commandDirs = files.filter((file) => file.endsWith('.js'));

		const xxxhdpiIcon = new MessageAttachment(
			'./icon/mipmap-xxxhdpi/smoothie.png'
		);
		const hdpiIcon = new MessageAttachment(
			'./icon/mipmap-hdpi/smoothie.png'
		);

		let embed = new MessageEmbed()
			.setColor('#7289DA')
			.setTitle('Help')
			.setDescription(
				'Want to know more about a specific command? Pick the category of that command!'
			)
			.setThumbnail('attachment://smoothie.png')
			.setTimestamp()
			.setFooter({
				text: 'Smoothie - Dropdown menu will be disabled in 2 minutes',
				iconURL: 'attachment://smoothie.png',
			});

		const cateDict = {};

		for (let commandDir of commandDirs) {
			const cate = commandDir.substring(
				commandDir.indexOf('commands') + 9,
				commandDir.lastIndexOf('\\')
			);
			const command = commandDir.substring(
				commandDir.lastIndexOf('\\') + 1,
				commandDir.lastIndexOf('.js')
			);
			if (!(cate in cateDict)) {
				cateDict[cate] = [command.toLowerCase()];
			} else {
				cateDict[cate].push(command.toLowerCase());
			}
		}

		for (let cate of Object.keys(cateDict)) {
			let text = '';
			for (let command of cateDict[cate]) {
				text = `${text}\`${command}\`\n`;
			}
			embed.addFields({
				name: cate,
				value: text,
				inline: true,
			});
		}

		return {
			embed: embed,
			files: [xxxhdpiIcon, hdpiIcon],
		};
	} catch (err) {
		console.error(err);
		return errorEmbed(
			'Error',
			'There was an error when loading your help embed.'
		);
	}
};

const helpCateEmbed = async (targetCate) => {
	try {
		const files = await getFiles('./src/commands');
		const commandDirs = files.filter((file) => file.endsWith('.js'));

		const xxxhdpiIcon = new MessageAttachment(
			'./icon/mipmap-xxxhdpi/smoothie.png'
		);
		const hdpiIcon = new MessageAttachment(
			'./icon/mipmap-hdpi/smoothie.png'
		);

		const cateDict = {};

		for (let commandDir of commandDirs) {
			const cate = commandDir.substring(
				commandDir.indexOf('commands') + 9,
				commandDir.lastIndexOf('\\')
			);
			const command = commandDir.substring(
				commandDir.lastIndexOf('\\') + 1,
				commandDir.lastIndexOf('.js')
			);
			if (!(cate in cateDict)) {
				cateDict[cate] = [command.toLowerCase()];
			} else {
				cateDict[cate].push(command.toLowerCase());
			}
		}

		if (targetCate in cateDict) {
			let des =
				'Which command you want to know more about?\n Available commands:\n';

			for (let command of cateDict[targetCate]) {
				des = `${des}\`${command}\`\n`;
			}

			const embed = new MessageEmbed()
				.setColor('#7289DA')
				.setTitle(targetCate)
				.setDescription(des)
				.setThumbnail('attachment://smoothie.png')
				.setTimestamp()
				.setFooter({
					text: 'Smoothie - Dropdown menu will be disabled in 2 minutes',
					iconURL: 'attachment://smoothie.png',
				});

			return {
				embed: embed,
				files: [xxxhdpiIcon, hdpiIcon],
			};
		} else {
			return errorEmbed('Error', 'There is no such category!');
		}
	} catch (err) {
		console.error(err);
		return errorEmbed(
			'Error',
			'There was an error when loading your help embed.'
		);
	}
};

const helpCommandEmbed = async (guildId, command) => {
	try {
		const files = await getFiles('./src/commands');
		const commandDirs = files.filter((file) => file.endsWith('.js'));

		const xxxhdpiIcon = new MessageAttachment(
			'./icon/mipmap-xxxhdpi/smoothie.png'
		);
		const hdpiIcon = new MessageAttachment(
			'./icon/mipmap-hdpi/smoothie.png'
		);

		for (let commandDir of commandDirs) {
			if (commandDir.toLowerCase().endsWith(command + '.js')) {
				const object = require(commandDir);
				let prefix = await retrieveData(guildId, 'prefix');
				if (!prefix) {
					prefix = '$';
				}

				let des;

				try {
					des = object.description(prefix);
				} catch (err) {
					console.error(err);
				}

				if (!des) {
					des = 'There is no description of this command.';
				}

				const embed = new MessageEmbed()
					.setColor('#7289DA')
					.setTitle(command)
					.setDescription(des)
					.setThumbnail('attachment://smoothie.png')
					.setTimestamp()
					.setFooter({
						text: 'Smoothie',
						iconURL: 'attachment://smoothie.png',
					});

				return {
					embed: embed,
					files: [xxxhdpiIcon, hdpiIcon],
				};
			}
		}

		return errorEmbed('Error', 'There is no such command!');
	} catch (err) {
		console.error(err);
		return errorEmbed(
			'Error',
			'There was an error when loading your help embed.'
		);
	}
};

module.exports = {
	successEmbed,
	loadingEmbed,
	errorEmbed,
	neturalEmbed,
	playingNowEmbed,
	queueEmbed,
	lyricsEmbed,
	helpMainEmbed,
	helpCateEmbed,
	helpCommandEmbed,
};
