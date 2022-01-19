const { Client, Collection, Intents } = require('discord.js');
const { getFiles } = require('./utils/getFiles.js');
const dotenv = require('dotenv');

dotenv.config();

// Setting up intents
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Setting up commands
client.commands = new Collection();

getFiles('./src/commands')
	.then((files) => {
		const commandDirs = files.filter(file => file.endsWith('.js'));
		for (const commandDir of commandDirs) {
			const command = require(commandDir);
			client.commands.set(command.data.name, command);
		}
	})
	.catch(e => console.error(e));

// Setting up events
getFiles('./src/events')
	.then((files) => {
		const eventDirs = files.filter(file => file.endsWith('.js'));
		for (const eventDir of eventDirs) {
			const event = require(eventDir);
			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args));
			}
			else {
				client.on(event.name, (...args) => event.execute(...args));
			}
		}
	})
	.catch(e => console.error(e));

client.login(process.env.TOKEN);

module.exports = client;