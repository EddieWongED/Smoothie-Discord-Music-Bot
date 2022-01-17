const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const queue = [];

const ConnectionStatus = {
  SUCCESS: 0,
  SUCCESS_ALREADY_JOINED: 1,
  SUCCESS_JOINED_FROM_OTHER_CHANNEL: 2,
  ERROR_NOT_IN_CHANNEL: 3,
  ERROR_UNKNOWN: 4
}

function connect(interaction) {
  const memberVoiceChannel = interaction.member.voice.channel;

  if (!memberVoiceChannel) {
    return ConnectionStatus.ERROR_NOT_IN_CHANNEL;
  }

  var connection = getVoiceConnection(interaction.guild.id);

  if (connection === undefined) {
    connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator
    });

    connection.subscribe(player);
  
    return ConnectionStatus.SUCCESS;

  } 
  
  if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
    connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator
    });

    connection.subscribe(player);
    
    return ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL;
  }

  if (memberVoiceChannel.id === connection.joinConfig.channelId) {
    
    return ConnectionStatus.SUCCESS_ALREADY_JOINED;
  }

  return ConnectionStatus.ERROR_UNKNOWN;
}

function getNextResource() {
  if (queue.length != 0) {
    const first = queue.shift();
    queue.push(first);
    const url = queue[0]['url'];
    const title = queue[0]['title'];
    const stream = ytdl(url, { filter: 'audioonly',
                              quality: "highestaudio",});

    return resource = createAudioResource(stream, {
      metadata: {
        title: title
      }
    });
  }
}

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Pause,
	},
});

player.on(AudioPlayerStatus.Playing, (obj) => {
	console.log(`Playing: ${obj.resource.metadata.title}`);
});

player.on(AudioPlayerStatus.Idle, () => {
	console.log('The audio player has started idling!');
  player.play(getNextResource());
});

player.on('error', error => {
	console.error(`Error: ${error.resource.metadata.title}` );
	player.play(getNextResource());
});

module.exports = { queue, player, getNextResource, ConnectionStatus, connect};