const fs = require('fs').promises;
const { saveDataToDB } = require('../mongoDB.js');
const guildDataKeys = require('../const/guildDataKeys.js');

const checkGuildDataExist = async (guildId) => {
	try {
		const stat = await fs.stat(`./data/guildData/${guildId}.json`);

		const dataBuffer = await fs.readFile(
			`./data/guildData/${guildId}.json`
		);
		var data;

		try {
			data = JSON.parse(dataBuffer);
		} catch (err) {
			console.log(
				`Error occurs when parsing /data/guildData/${guildId}.json`
			);
			return false;
		}

		const subDataObject = {};
		for (guildDataKey of guildDataKeys) {
			if (!(guildDataKey in data)) {
				if (guildDataKey == 'queue') {
					subDataObject['queue'] = [];
				} else if (guildDataKey == 'guildId') {
					subDataObject['guildId'] = guildId;
				} else if (guildDataKey == 'prefix') {
					subDataObject['prefix'] = '$';
				} else {
					subDataObject[guildDataKey] = null;
				}

				console.log(
					`Added missing key ${guildDataKey} to /data/guildData/${guildId}.json.`
				);
			} else {
				subDataObject[guildDataKey] = data[guildDataKey];
			}
		}

		try {
			const write = await fs.writeFile(
				`./data/guildData/${guildId}.json`,
				JSON.stringify(subDataObject, null, 2)
			);

			const status = await saveDataToDB(guildId, data);
		} catch (err) {
			console.log(err);

			return false;
		}
	} catch (err) {
		console.log(err);
		try {
			const subDataObject = {};
			for (guildDataKey of guildDataKeys) {
				if (guildDataKey == 'queue') {
					subDataObject['queue'] = [];
				} else if (guildDataKey == 'guildId') {
					subDataObject['guildId'] = guildId;
				} else if (guildDataKey == 'prefix') {
					subDataObject['prefix'] = '$';
				} else {
					subDataObject[guildDataKey] = null;
				}
			}

			const write = await fs.writeFile(
				`./data/guildData/${guildId}.json`,
				JSON.stringify(subDataObject, null, 2)
			);
			console.log(`/data/guildData/${guildId}.json is created.`);

			const status = await saveDataToDB(guildId, subDataObject);
		} catch (err) {
			console.log(
				`There is an error when creating /data/guildData/${guildId}.json`
			);
			return false;
		}
	}

	return true;
};

const setData = async (guildId, key, value) => {
	const status = await checkGuildDataExist(guildId);
	if (!status) {
		return false;
	}

	const dataBuffer = await fs.readFile(`./data/guildData/${guildId}.json`);
	var data;

	try {
		data = JSON.parse(dataBuffer);
	} catch (err) {
		console.log(
			`Error occurs when parsing /data/guildData/${guildId}.json`
		);
		return false;
	}

	if (!(key in data)) {
		console.log(`There is no such key in /data/guildData/${guildId}.json!`);
		return false;
	}

	data[key] = value;

	try {
		const write = await fs.writeFile(
			`./data/guildData/${guildId}.json`,
			JSON.stringify(data, null, 2)
		);

		const status = await saveDataToDB(guildId, data);
	} catch (err) {
		console.log(err);

		return false;
	}

	return true;
};

const retrieveData = async (guildId, key) => {
	const status = await checkGuildDataExist(guildId);
	if (!status) {
		return false;
	}

	const dataBuffer = await fs.readFile(`./data/guildData/${guildId}.json`);
	var data;

	try {
		data = JSON.parse(dataBuffer);
	} catch (err) {
		console.log(
			`Error occurs when parsing /data/guildData/${guildId}.json`
		);
		return null;
	}

	if (!(key in data)) {
		console.log(`There is no such key in /data/guildData/${guildId}.json!`);
		return false;
	}

	return data[key];
};

module.exports = { setData, retrieveData, guildDataKeys };
