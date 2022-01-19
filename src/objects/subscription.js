const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, createAudioResource, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const cacheData = require('../../data/cacheData.js');
const { retrieveData, setData } = require('../utils/changeData.js');

const ConnectionStatus = {
  SUCCESS: 0,
  SUCCESS_ALREADY_JOINED: 1,
  SUCCESS_JOINED_FROM_OTHER_CHANNEL: 2,
  ERROR_NOT_IN_CHANNEL: 3,
  ERROR_UNKNOWN: 4
}

const connect = async (guildId, memberVoiceChannel) => {
  if (!memberVoiceChannel) {
    return ConnectionStatus.ERROR_NOT_IN_CHANNEL;
  }

  var connection = getVoiceConnection(guildId);

  if (connection === undefined) {
    connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    player.on(AudioPlayerStatus.Playing, (obj) => {
      console.log(`Playing: ${obj.resource.metadata.title}`);
      // const channel = client.channels.cache.get()
    });

    player.on(AudioPlayerStatus.Idle, (audio) => {
      audio.resource.retry = 0;
      console.log('The audio player has started idling!');
      
      getNextResource(guildId).then((resource) => {
        player.play(resource);
      });
    });

    player.on('error', error => {
      console.error(`Error: ${error.resource.metadata.title}` );
      if (error.resource.metadata.retry < 3) {
        error.resource.metadata.retry++;
        player.play(error.resource);
      } else {
        getNextResource(guildId).then((resource) => {
          player.play(resource);
        });
      }
    });


    cacheData['player'][guildId] = player;
    connection.subscribe(player);

    return ConnectionStatus.SUCCESS;

  } 
  
  if (memberVoiceChannel.id !== connection.joinConfig.channelId) {
    connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    player.on(AudioPlayerStatus.Playing, (obj) => {
      console.log(`Playing: ${obj.resource.metadata.title}`);
      // const channel = client.channels.cache.get()
    });

    player.on(AudioPlayerStatus.Idle, (audio) => {
      audio.resource.retry = 0;
      console.log('The audio player has started idling!');
      
      getNextResource(guildId).then((resource) => {
        player.play(resource);
      });
    });

    player.on('error', error => {
      console.error(`Error: ${error.resource.metadata.title}` );
      if (error.resource.metadata.retry < 3) {
        error.resource.metadata.retry++;
        player.play(error.resource);
      } else {
        getNextResource(guildId).then((resource) => {
          player.play(resource);
        });
      }
    });

    cacheData['player'][guildId] = player;
    connection.subscribe(player);

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
                              quality: "highestaudio",});

    return resource = createAudioResource(stream, {
      metadata: {
        title: title,
        url: url,
        retry: 0,
      },
    });
}

module.exports = { getNextResource, createResource, ConnectionStatus, connect};