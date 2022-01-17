const { SlashCommandBuilder } = require('@discordjs/builders');

const wait = require('util').promisify(setTimeout);
const ytdl = require('ytdl-core');
const dotenv = require('dotenv');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('For Eddie to test his code. Run this if you dare.'),
	async execute(interaction) {

		if (interaction.member.id === process.env.MYUSERID) {
			await interaction.reply('Hi Eddie.')
						.catch((err) => {console.error(err);});
		} else {
			await interaction.reply('You think you are good enough to run this command? Idiot.')
						.catch((err) => {console.error(err);});
		}
		
		wait(100);
	},
};