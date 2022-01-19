const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { getFiles } = require('./utils/getFiles.js');
const dotenv = require('dotenv');

dotenv.config();

getFiles('./src/commands')
	.then((files) => {
		const commands = [];

		const commandDirs = files.filter(file => file.endsWith('.js'));
		for (const commandDir of commandDirs) {
			console.log(commandDir);
			const command = require(commandDir);
			commands.push(command.data.toJSON());
		}

		const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

		rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.TESTGUILDID), { body: commands })
			.then(() => console.log('Successfully registered application commands.'))
			.catch(console.error);
	})
	.catch(e => console.error(e));