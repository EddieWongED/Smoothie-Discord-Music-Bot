const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const guildDataKeys = require('../const/guildDataKeys.js');

const schemaObject = {};

for (guildDataKey of guildDataKeys) {
	const subObj = {};
	const subData = { type: String, required: false };
	for (key of Object.keys(subData)) {
		subObj[key] = subData[key];
		if (guildDataKey === 'guildId' && key === 'required') {
			subObj['required'] = true;
		}
		if (guildDataKey === 'queue' && key === 'type') {
			subObj['type'] = Array;
		}
	}
	schemaObject[guildDataKey] = subObj;
}

const guildSchema = new Schema(schemaObject, { timestamps: true });

const Guild = mongoose.model('Guild', guildSchema);

module.exports = Guild;
