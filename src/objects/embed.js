const { MessageAttachment, MessageEmbed } = require('discord.js');

const successEmbed = (title, des) => {
	const xxxhdpiIcon = new MessageAttachment('./icon/mipmap-xxxhdpi/smoothie.png');
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
	.setColor('#63E68C')
	.setTitle(`:white_check_mark: ${title}`)
	.setDescription(des)
	.setThumbnail('attachment://smoothie.png')
	.setTimestamp()
	.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png'});
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon]
	}
}

const loadingEmbed = (title, des) => {
	const xxxhdpiIcon = new MessageAttachment('./icon/mipmap-xxxhdpi/smoothie.png');
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
	.setColor('#FAA81A')
	.setTitle(`:hourglass: ${title}`)
	.setDescription(des)
	.setThumbnail('attachment://smoothie.png')
	.setTimestamp()
	.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png'});
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon]
	}
}

const errorEmbed = (title, des) => {
	const xxxhdpiIcon = new MessageAttachment('./icon/mipmap-xxxhdpi/smoothie.png');
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
	.setColor('#DA5849')
	.setTitle(`:no_entry: ${title}`)
	.setDescription(des)
	.setThumbnail('attachment://smoothie.png')
	.setTimestamp()
	.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png'});
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon]
	}
}

const neturalEmbed = (title, des) => {
	const xxxhdpiIcon = new MessageAttachment('./icon/mipmap-xxxhdpi/smoothie.png');
	const hdpiIcon = new MessageAttachment('./icon/mipmap-hdpi/smoothie.png');
	const embed = new MessageEmbed()
	.setColor('#7C5295')
	.setTitle(title)
	.setDescription(des)
	.setThumbnail('attachment://smoothie.png')
	.setTimestamp()
	.setFooter({ text: 'Smoothie', iconURL: 'attachment://smoothie.png'});
	return {
		embed: embed,
		files: [xxxhdpiIcon, hdpiIcon]
	}
}

module.exports = { successEmbed, loadingEmbed, errorEmbed, neturalEmbed }