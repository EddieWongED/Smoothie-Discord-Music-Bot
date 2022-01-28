const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Guild = require('./models/guild.js');
const fs = require('fs').promises;
const guildDataKeys = require('./const/guildDataKeys.js');
const configs = require('../configs.json');

dotenv.config();

const connectDB = async () => {
	if (configs.useMongoDB) {
		try {
			const result = await mongoose.connect(process.env.MONGODBURL, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});

			console.log('Connected to database successfully.');

			return true;
		} catch (err) {
			console.error(err);

			return false;
		}
	}
};

const saveDataToDB = async (guildId, data) => {
	if (configs.useMongoDB) {
		try {
			const exist = await findDataFromDB(guildId);

			if (exist != undefined) {
				const result = await Guild.findOneAndReplace(
					{ guildId: guildId },
					{ guildId: guildId, ...data }
				);

				// console.log('Replace data successfully.');

				return true;
			} else {
				const success = await createNewDataToDB(guildId, data);

				if (success) {
					console.log(
						`Create a new document with guildId ${guildId} to database successfully.`
					);

					return true;
				} else {
					console.log(
						`Create a new document with guildId ${guildId} to database unsuccessfully.`
					);

					return false;
				}
			}
		} catch (err) {
			console.error(err);

			return false;
		}
	}
};

const findDataFromDB = async (guildId) => {
	if (configs.useMongoDB) {
		try {
			const result = await Guild.findOne({ guildId: guildId });

			return result;
		} catch (err) {
			console.error(err);

			return undefined;
		}
	}
};

const createNewDataToDB = async (guildId, data) => {
	if (configs.useMongoDB) {
		try {
			const guild = new Guild({ guildId: guildId, ...data });

			const success = await guild.save();

			return true;
		} catch (err) {
			console.error(err);

			return false;
		}
	}
};

const readAllDataFromDB = async () => {
	if (configs.useMongoDB) {
		try {
			const result = await Guild.find();
			console.log('Read all data from the database successfully.');

			return result;
		} catch (err) {
			console.error(err);

			return undefined;
		}
	}
};

const importFromDBToLocalJSON = async () => {
	if (configs.useMongoDB) {
		const guildDataList = await readAllDataFromDB();

		if (guildDataList === undefined) {
			return;
		} else {
			for (guildData of guildDataList) {
				const guildId = guildData.guildId;
				try {
					const stat = await fs.stat(
						`./data/guildData/${guildId}.json`
					);
				} catch (err) {
					try {
						var subDataObject = {};

						for (guildDataKey of guildDataKeys) {
							if (!(guildDataKey in guildData)) {
								if (guildDataKey == 'queue') {
									subDataObject['queue'] = [];
								} else {
									subDataObject[guildDataKey] = null;
								}
							} else {
								subDataObject[guildDataKey] =
									guildData[guildDataKey];
							}
						}

						const write = await fs.writeFile(
							`./data/guildData/${guildId}.json`,
							JSON.stringify(subDataObject, null, 2)
						);
						console.log(
							`/data/guildData/${guildId}.json is created.`
						);
					} catch (err) {
						console.error(err);
						console.log(
							`There is an error when creating /data/guildData/${guildId}.json`
						);
					}
				}
			}

			console.log('All data are imported from the database.');
		}
	}
};

module.exports = {
	connectDB,
	readAllDataFromDB,
	importFromDBToLocalJSON,
	saveDataToDB,
};
