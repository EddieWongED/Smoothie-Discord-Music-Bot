const { getVoiceConnection } = require('@discordjs/voice');

const isSameVoiceChannel = (guildId, memberVoiceChannel) => {
	if (memberVoiceChannel) {
		const connection = getVoiceConnection(guildId);
		if (connection) {
			if (memberVoiceChannel.id === connection.joinConfig.channelId) {
				return true;
			}
		}
	}

	return false;
};

module.exports = { isSameVoiceChannel };
