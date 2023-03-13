const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { getFiles } = require('./utils/getFiles.js');
const { connectDB, importFromDBToLocalJSON } = require('./mongoDB.js');
const dotenv = require('dotenv');
const configs = require('../configs.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { exit } = require('process');

dotenv.config();

// Deploy Commands
getFiles('./src/commands')
	.then((files) => {
		const commands = [];

		const clientID = process.env.CLIENTID;

		if (!clientID) {
			console.log(
				'Unable to find your CLIENTID! Please check if CLIENTID is in .env file.'
			);
			process.exit();
		}

		const token = process.env.TOKEN;

		if (!token) {
			console.log(
				'Unable to find your TOKEN! Please check if TOKEN is in .env file.'
			);
			process.exit();
		}

		const commandDirs = files.filter((file) => file.endsWith('.js'));
		for (const commandDir of commandDirs) {
			console.log(commandDir);
			const command = require(commandDir);
			commands.push(command.data.toJSON());
		}

		const rest = new REST({ version: '9' }).setToken(token);

		rest.put(Routes.applicationCommands(clientID), {
			body: commands,
		})
			.then(() =>
				console.log(
					'Successfully registered application commands for all servers. The update might takes up to an hour to register across all the server. Use text-based command (default: `$`) if the slash command is not loading.'
				)
			)
			.catch(console.error);
	})
	.catch((e) => console.error(e));

// Setting up intents
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

// Setting up commands
client.commands = new Collection();

getFiles('./src/commands')
	.then((files) => {
		const commandDirs = files.filter((file) => file.endsWith('.js'));
		for (const commandDir of commandDirs) {
			const command = require(commandDir);
			client.commands.set(command.data.name, command);
		}
	})
	.catch((e) => console.error(e));

// Setting up events
getFiles('./src/events')
	.then((files) => {
		const eventDirs = files.filter((file) => file.endsWith('.js'));
		for (const eventDir of eventDirs) {
			const event = require(eventDir);
			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args));
			} else {
				client.on(event.name, (...args) => event.execute(...args));
			}
		}
	})
	.catch((e) => console.error(e));

const token = process.env.TOKEN;

if (!token) {
	console.log(
		'Unable to find your TOKEN! Please check if TOKEN is in .env file.'
	);
	process.exit();
}

// Connect to database
if (configs.useMongoDB) {
	connectDB()
		.then(async (result) => {
			const success = await importFromDBToLocalJSON();
			if (result) {
				client.login(token);
			}
		})
		.catch((err) => {
			console.error(err);
		});
} else {
	client.login(token);
}
module.exports = client;
