const {
	getVoiceConnection,
	joinVoiceChannel,
	VoiceConnectionStatus,
} = require('@discordjs/voice');
const { createAudioPlayer } = require('./audioPlayer.js');
const cacheData = require('../../data/cacheData.js');
const { setData } = require('../utils/changeData.js');
const wait = require('util').promisify(setTimeout);

const ConnectionStatus = {
	SUCCESS: 0,
	SUCCESS_ALREADY_JOINED: 1,
	SUCCESS_JOINED_FROM_OTHER_CHANNEL: 2,
	ERROR_NOT_IN_CHANNEL: 3,
	ERROR_UNKNOWN: 4,
};

const startConnecting = async (guildId, memberVoiceChannel) => {
	const connection = joinVoiceChannel({
		channelId: memberVoiceChannel.id,
		guildId: memberVoiceChannel.guild.id,
		adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
	});

	const player = cacheData['player'][guildId];
	connection.subscribe(player);

	const success = await setData(
		guildId,
		'voiceChannelId',
		memberVoiceChannel.id
	);

	if (!success) {
		console.log('Failed to write voiceChannelId.');
	}

	connection.on(VoiceConnectionStatus.Disconnected, async (obj) => {
		console.log('The bot has disconnected.');

		try {
			connection.destroy();
		} catch (err) {
			console.log(err);
		}
	});

	connection.on(VoiceConnectionStatus.Destroyed, async (obj) => {
		console.log('The connection has been destroyed.');

		const success = await setData(guildId, 'voiceChannelId', null);

		if (!success) {
			console.log('Failed to write voiceChannelId.');
		}
	});
};

const connect = async (guildId, memberVoiceChannel) => {
	if (!memberVoiceChannel) {
		return ConnectionStatus.ERROR_NOT_IN_CHANNEL;
	}

	var connection = getVoiceConnection(guildId);

	if (connection === undefined) {
		const player = await createAudioPlayer(guildId);
		cacheData['player'][guildId] = player;

		await wait(2000);

		await startConnecting(guildId, memberVoiceChannel);

		return ConnectionStatus.SUCCESS;
	}

	if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
		try {
			connection.destroy();
		} catch (err) {
			console.log(err);
		}

		await startConnecting(guildId, memberVoiceChannel);

		return ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL;
	}

	if (memberVoiceChannel.id === connection.joinConfig.channelId) {
		return ConnectionStatus.SUCCESS_ALREADY_JOINED;
	}

	return ConnectionStatus.ERROR_UNKNOWN;
};

module.exports = {
	connect,
	ConnectionStatus,
};
