const { SlashCommandBuilder } = require('@discordjs/builders');
const { isSameVoiceChannel } = require('../../objects/subscription.js');
const {
    successEmbed,
    errorEmbed,
    loadingEmbed,
} = require('../../objects/embed.js');
const { setData, retrieveData } = require('../../utils/changeData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the queue.'),
    async execute(interaction) {
        let embed = loadingEmbed(
            'Attempting to clear the queue...',
            'Please be patient...'
        );
        await interaction
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
            await interaction
                .editReply({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });

            return;
        }

        const queue = await retrieveData(interaction.guildId, 'queue');
        const queueLength = queue.length;

        if (queueLength == 0) {
            embed = errorEmbed(
                'There is nothing in the queue...',
                'Why would you want to clear the queue when there is nothing in the queue?'
            );
            await interaction
                .editReply({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });

            return;
        }

        const newQueue = [];
        newQueue.push(queue[0]);

        const status = await setData(interaction.guildId, 'queue', newQueue);
        if (status) {
            embed = successEmbed(
                'Success!',
                `${
                    queueLength - 1
                } music have been cleared. The music that is currently playing will not be cleared.`
            );
            await interaction
                .editReply({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });
        } else {
            embed = errorEmbed('Cannot clear the queue...', 'for some reason.');
            await interaction
                .editReply({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });
        }
    },
};
