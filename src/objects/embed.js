const ytdl = require('ytdl-core');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { retrieveData } = require('../utils/changeData.js');
const { inlineCode } = require('@discordjs/builders');

const successEmbed = (title, des) => {
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

module.exports = {
	successEmbed,
	loadingEmbed,
	errorEmbed,
	neturalEmbed,
	playingNowEmbed,
	queueEmbed,
	lyricsEmbed,
};
