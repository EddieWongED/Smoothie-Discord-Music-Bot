const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    neturalEmbed,
    errorEmbed,
    playingNowEmbed,
    queueEmbed,
} = require('../../objects/embed.js');
const { retrieveData } = require('../../utils/changeData.js');
const cacheData = require('../../../data/cacheData.js');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('For Eddie to test his code. Run this if you dare.'),
    async execute(interaction) {
        if (interaction.member.id != process.env.MYUSERID) {
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

        let embed = neturalEmbed('Hi Eddie', 'This is a test command.');
        await interaction
            .reply({ embeds: [embed.embed], files: embed.files })
            .catch((err) => {
                console.error(err);
            });
    },
};
