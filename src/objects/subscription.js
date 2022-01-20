const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const cacheData = require('../../data/cacheData.js');
const { retrieveData, setData } = require('../utils/changeData.js');
const client = require('../index.js');
const { playingNowEmbed } = require('../objects/embed.js')
const ConnectionStatus = {
  SUCCESS: 0,
  SUCCESS_ALREADY_JOINED: 1,
  SUCCESS_JOINED_FROM_OTHER_CHANNEL: 2,
  ERROR_NOT_IN_CHANNEL: 3,
  ERROR_UNKNOWN: 4
}

const isSameVoiceChannel = (guildId, memberVoiceChannel) => {
    if (memberVoiceChannel) {
      const connection = getVoiceConnection(guildId);
      if (connection) {
        if (memberVoiceChannel.id === connection.joinConfig.channelId)
        {
          return true;
        }
      }
    } 

    return false;
}

const startConnecting = async (guildId, memberVoiceChannel) => {
  const connection = joinVoiceChannel({
      channelId: memberVoiceChannel.id,
      guildId: memberVoiceChannel.guild.id,
      adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  player.on(AudioPlayerStatus.Playing, async (obj) => {
    console.log(`${client.guilds.cache.get(guildId).name} is playing: ${obj.resource.metadata.title}`);
    const channelId = await retrieveData(guildId, 'respondChannelId');
    if (channelId) {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
          const playingNowMessageId = await retrieveData(guildId, 'playingNowMessageId');
          if (playingNowMessageId != null) {
            const message = channel.messages.cache.get(playingNowMessageId);
            if (message) {
              const content = await message.delete();
            } else {
              console.log('Cannot find the message to be deleted.');
            }  
          }

          const embed = await playingNowEmbed(guildId);
          const message = await channel.send({ embeds: [embed.embed], files: embed.files });
          if (message) {
            const status = await setData(guildId, 'playingNowMessageId', message.id);
            if (!status) {
              console.log('Failed to save playingNowMessageId.');
            }
          } else {
            console.log('Cannot send the message properly.');
          }
      } else {
        console.log('Cannot find a proper channel to send the playing now message!');
      }
    } else {
      console.log('Cannot find a proper channel to send the playing now message!');
    }
  });

  player.on(AudioPlayerStatus.Idle, async (audio) => {
    const resource = await getNextResource(guildId);

    if (resource) {
      player.play(resource);
    } else {
      console.log('Unable to find the resource.');
    }
  });

  player.on('error', async (error) => {
    console.error(`Error: ${error.resource.metadata.title} ${error}` );
    const resource = await getNextResource(guildId);

    if (resource) {
      player.play(resource);
    } else {
      console.log('Unable to find the resource.');
    }
  });

  cacheData['player'][guildId] = player;
  connection.subscribe(player);
}

const connect = async (guildId, memberVoiceChannel) => {
  if (!memberVoiceChannel) {
    return ConnectionStatus.ERROR_NOT_IN_CHANNEL;
  }

  var connection = getVoiceConnection(guildId);

  if (connection === undefined) {
    startConnecting(guildId, memberVoiceChannel);

    return ConnectionStatus.SUCCESS;
  } 
  
  if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
    startConnecting(guildId, memberVoiceChannel);

    return ConnectionStatus.SUCCESS_JOINED_FROM_OTHER_CHANNEL;
  }

  if (memberVoiceChannel.id === connection.joinConfig.channelId) {
    
    return ConnectionStatus.SUCCESS_ALREADY_JOINED;
  }

  return ConnectionStatus.ERROR_UNKNOWN;
}

const getNextResource = async (guildId) => {
  
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

    const resource = await createResource(url, title);

    return resource;
  }
}

const createResource = async (url, title) => {
    const stream = ytdl(url, { filter: 'audioonly',
                              quality: "highestaudio",
                              dlChunkSize: 0});

    return resource = createAudioResource(stream, {
      metadata: {
        title: title,
        url: url,
      },
    });
}

module.exports = { getNextResource, createResource, ConnectionStatus, connect, isSameVoiceChannel};