const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const guildSchema = new Schema(
	{
		guildId: {
			type: String,
			required: true,
		},
		respondChannelId: {
			type: String,
		},
		voiceChannelId: {
			type: String,
		},
		playingNowMessageId: {
			type: String,
		},
		queueMessageId: {
			type: String,
		},
		queue: {
			type: Array,
			required: true,
		},
	},
	{ timestamps: true }
);

const Guild = mongoose.model('Guild', guildSchema);

module.exports = Guild;
