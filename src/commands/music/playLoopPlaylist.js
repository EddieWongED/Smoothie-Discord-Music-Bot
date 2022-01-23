const { SlashCommandBuilder } = require('@discordjs/builders');
const { ConnectionStatus, connect } = require('../../objects/subscription.js');
const { queuePlaylist } = require('../../utils/queueURL.js');
const { retrieveData } = require('../../utils/changeData.js');
const {
    loadingEmbed,
    errorEmbed,
    successEmbed,
} = require('../../objects/embed.js');
const cacheData = require('../../../data/cacheData.js');
const youtubedl = require('youtube-dl-exec');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playloopplaylist')
        .setDescription('Plays THE playlist.'),
    async execute(interaction) {
        let embed = loadingEmbed(
            'Attempting to play music...',
            'Please be patient...'
        );
        await interaction
            .reply({ embeds: [embed.embed], files: embed.files })
            .catch((err) => {
                console.error(err);
            });

        let followUp = false;
        let followUpMessage = null;

        const status = await connect(
            interaction.guildId,
            interaction.member.voice.channel
        );

        switch (status) {
            case ConnectionStatus.SUCCESS:
                embed = successEmbed(
                    'Smoothie joined the voice channel.',
                    'Please welcome her! She is a shy girl.'
                );
                await interaction
                    .editReply({ embeds: [embed.embed], files: embed.files })
                    .catch((err) => {
                        console.error(err);
                    });
                followUp = true;
                break;
            case ConnectionStatus.SUCCESS_ALREADY_JOINED:
                break;
            case ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL:
                embed = successEmbed(
                    'Smoothie joined from another voice channel.',
                    'Please welcome her! She is a shy girl.'
                );
                await interaction
                    .editReply({ embeds: [embed.embed], files: embed.files })
                    .catch((err) => {
                        console.error(err);
                    });
                followUp = true;
                break;
            case ConnectionStatus.ERROR_NOT_IN_CHANNEL:
                embed = errorEmbed(
                    'You are not in a voice channel!',
                    'dumbass.'
                );
                await interaction
                    .editReply({ embeds: [embed.embed], files: embed.files })
                    .catch((err) => {
                        console.error(err);
                    });
                return;
            default:
                embed = errorEmbed(
                    'Unknown error occurred!',
                    'A problem that the developer do not know wtf just happened.'
                );
                await interaction
                    .editReply({ embeds: [embed.embed], files: embed.files })
                    .catch((err) => {
                        console.error(err);
                    });
                return;
        }

        embed = loadingEmbed('Loading the playlist...', 'Please be patient.');

        if (followUp) {
            followUpMessage = await interaction
                .followUp({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });
        } else {
            await interaction
                .editReply({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });
        }

        const url = process.env.LOOPPLAYLISTURL;

        const metadata = await queuePlaylist(interaction.guildId, url);

        if (metadata === null) {
            return;
        }

        embed = successEmbed(
            `All ${metadata.noOfVideo} videos are queued.`,
            `${metadata.noOfRepeated} of them were already in the queue. Enjoy the music.`
        );
        if (followUp) {
            try {
                followUpMessage.edit({
                    embeds: [embed.embed],
                    files: embed.files,
                });
            } catch (err) {
                console.error(err);
                embed = errorEmbed(
                    'Unknown error occurred!',
                    'A problem that the developer do not know wtf just happened.'
                );
                await interaction
                    .editReply({ embeds: [embed.embed], files: embed.files })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        } else {
            await interaction
                .editReply({ embeds: [embed.embed], files: embed.files })
                .catch((err) => {
                    console.error(err);
                });
        }
    },
};
