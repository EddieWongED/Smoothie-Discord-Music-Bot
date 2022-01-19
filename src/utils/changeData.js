const fs = require('fs').promises;

const subData = ['respondChannelId', 'playingNowMessageId', 'queueNessageId', 'queue'];

const checkGuildDataExist = async (guildId) => {
	try {
		const stat = await fs.stat('./data/guildData.json');
	} catch (err) {
		try {
			const write = await fs.writeFile('./data/guildData.json', JSON.stringify({}, null, 2));
			console.log('guildData.json is created.')
		} catch (err) {
			console.log('There is an error when creating guildData.json');
			return false;
		}
	}

	const dataBuffer = await fs.readFile('./data/guildData.json');
	const data = JSON.parse(dataBuffer);

	if (!(guildId in data)) {
		const subDataObject = {};
		for (subDatum of subData) {
			if (subDatum == 'queue') {
				subDataObject['queue'] = [];
			} else {
				subDataObject[subDatum] = null;
			}
		}
		data[guildId] = subDataObject;
	}

	try {
		const write = await fs.writeFile('./data/guildData.json', JSON.stringify(data, null, 2));
	} catch (err) {
		console.log(err);

		return false;
	}

	return true;
}

const setData = async (guildId, key, value) => {

	const status = await checkGuildDataExist(guildId);
	if (!status) {
		return false;
	}

	const dataBuffer = await fs.readFile('./data/guildData.json');
	const data = JSON.parse(dataBuffer);

	if (!(key in data[guildId])) {
		console.log('hihihihihihi');
		return false;
	}

	data[guildId][key] = value;

	try {
		const write = await fs.writeFile('./data/guildData.json', JSON.stringify(data, null, 2));
	} catch (err) {
		console.log(err);

		return false;
	}

	return true;
}

const retrieveData = async (guildId, key) => {

	const status = await checkGuildDataExist(guildId);
	if (!status) {
		return false;
	}

	const dataBuffer = await fs.readFile('./data/guildData.json');
	const data = JSON.parse(dataBuffer);

	if (!(key in data[guildId])) {
		return null;
	}

	return data[guildId][key];
}

module.exports = { setData, retrieveData }