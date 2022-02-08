const voice = require('@discordjs/voice');
const { stream } = require('play-dl');
const { retrieveData, setData } = require('../utils/changeData.js');

const getNextAudioResource = async (guildId) => {
	const queue = await retrieveData(guildId, 'queue');

	if (queue.length != 0) {
		const first = queue.shift();
		queue.push(first);
		const url = queue[0]['url'];
		const title = queue[0]['title'];

		const status = await setData(guildId, 'queue', queue);
		if (!status) {
			console.log('An error of saving queue to guildData.json occurred.');

			return null;
		}

		const resource = await createAudioResource(guildId, url, title);
		return resource;
	}

	return null;
};

const getFirstAudioResource = async (guildId) => {
	const queue = await retrieveData(guildId, 'queue');

	if (queue.length != 0) {
		const url = queue[0]['url'];
		const title = queue[0]['title'];

		const resource = await createAudioResource(guildId, url, title);

		return resource;
	}

	return null;
};

const createAudioResource = async (guildId, url, title) => {
	try {
		const playStream = await stream(url);
		return (resource = voice.createAudioResource(playStream.stream, {
			inputType: playStream.type,
			metadata: {
				title: title,
				url: url,
			},
		}));
	} catch (err) {
		return getNextAudioResource(guildId);
	}
};

module.exports = {
	getNextAudioResource,
	getFirstAudioResource,
	createAudioResource,
};
