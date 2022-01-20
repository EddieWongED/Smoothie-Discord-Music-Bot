const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { loadingEmbed, neturalEmbed, errorEmbed, queueEmbed } = require('../../objects/embed.js');
const { retrieveData, setData } = require('../../utils/changeData.js');
const { isSameVoiceChannel } = require('../../objects/subscription.js');
const { channel } = require('diagnostics_channel');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Shows what\'s next.'),
	async execute(interaction) {
		let embed = loadingEmbed('Attempting to load the queue...', 'Please be patient...');
		await interaction.reply({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {console.error(err);});

		if (!isSameVoiceChannel(interaction.guildId, interaction.member.voice.channel)) {
			embed = errorEmbed('You are not in the same voice channel as Smoothie!', 'Please join the voice channel before you want to do something!');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});
			
			return;
		}
		
		const queue = await retrieveData(interaction.guildId, 'queue');

		if (queue.length === 0) {
			embed = errorEmbed('No music no fun..', 'There is no music in the queue...');
			await interaction.editReply({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {console.error(err);});

			return;
		}

		var page = 1;

		const queueMessageId = await retrieveData(interaction.guildId, 'queueMessageId');

		if (queueMessageId !== null) {
			const message = interaction.channel.messages.cache.get(queueMessageId);
			if (message) {
				await message.delete()
					.catch((err) => {console.error(err)});
				page = 1;
			}
			
		}

		embed = await queueEmbed(interaction.guildId, 1);

		const firstPageButton = new MessageButton()
			.setCustomId('queueFirstPage')
			.setLabel('First Page')
			.setStyle('DANGER')
			.setDisabled(true);

		const prevPageButton = new MessageButton()
			.setCustomId('queuePrevPage')
			.setLabel('Previous Page')
			.setStyle('PRIMARY')
			.setDisabled(true);

		const nextPageButton = 	new MessageButton()
			.setCustomId('queueNextPage')
			.setLabel('Next Page')
			.setStyle('PRIMARY');

		const lastPageButton = 	new MessageButton()
			.setCustomId('queueLastPage')
			.setLabel('Last Page')
			.setStyle('DANGER');

		const row = new MessageActionRow()
		.addComponents(firstPageButton, prevPageButton, nextPageButton, lastPageButton);

		const message = await interaction.editReply({ embeds: [embed.embed], files: embed.files, components: [row] })
			.catch((err) => {console.error(err);});
		
		const status = setData(interaction.guildId, 'queueMessageId', message.id);

		if (!status) {
			console.log('Failed to write queueMessageId');
		}

		const filter = (interaction) => {
			return interaction.message.id === message.id;
		}

		const collector = message.channel.createMessageComponentCollector({ 
			filter, 
			time: 100000
		})

		collector.on('collect', async (interaction) => {
			const queue = await retrieveData(interaction.guildId, 'queue');
			if (queue.length == 0)
			{
				const status = interaction.message.delete();

				embed = await errorEmbed('There is nothing in the queue', 'The queue has been cleared for some reason.');
				interaction.channel.send({ embeds: [embed.embed], files: embed.files })
					.catch((err) => {console.log(err)});
				return;
			}

			const maxPage = Math.ceil(queue.length / 10);

			switch (interaction.customId) {
				case 'queueFirstPage':
					page = 1;
					break;
				case 'queuePrevPage':
					page--;
					if (page < 1) {
						page = 1;
					}
					break;
				case 'queueNextPage':
					page++
					if (page > maxPage) {
						page = maxPage;
					}
					break;
				case 'queueLastPage':
					page = maxPage;
					break;
			}

			if (page == 1) {
				firstPageButton.setDisabled(true);
				prevPageButton.setDisabled(true);
				nextPageButton.setDisabled(false);
				lastPageButton.setDisabled(false);
			} else if (page == maxPage) {
				firstPageButton.setDisabled(false);
				prevPageButton.setDisabled(false);
				nextPageButton.setDisabled(true);
				lastPageButton.setDisabled(true);
			} else {
				firstPageButton.setDisabled(false);
				prevPageButton.setDisabled(false);
				nextPageButton.setDisabled(false);
				lastPageButton.setDisabled(false);
			}

			embed = await queueEmbed(interaction.guildId, page);
			await interaction.update({ embeds: [embed.embed], components: [row] })
				.catch((err) => {console.log(err)});
		});
	},
};