const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');
const { createResource } = require('../objects/subscription.js');
const cacheData = require('../../data/cacheData.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { retrieveData, setData } = require('../utils/changeData.js');
const wait = require('util').promisify(setTimeout);

const QueueVideoStatus = {
	SUCCESS: 0,
	ERROR_INVALID_URL: 1,
	ERROR_ALREADY_EXIST: 2,
	ERROR_UNKNOWN: 3
}

const queueMusic = async (guildId, url) => {
	if (!ytdl.validateURL(url)) {
		return QueueVideoStatus.ERROR_INVALID_URL;
	}

	const videoInfo = await ytdl.getBasicInfo(url, []);
	const title = videoInfo.videoDetails.title;

	const queue = await retrieveData(guildId, 'queue');
	
	if (!queue.some(e => e['url'] === videoInfo.videoDetails.video_url)) {
		queue.push({
			title: title,
			url: videoInfo.videoDetails.video_url
		});

		const status = await setData(guildId, 'queue', queue);
		if (!status) {
			console.log('An error of saving queue to guildData.json occurred.');
			
			return QueueVideoStatus.ERROR_UNKNOWN;
		}

		const player = cacheData['player'][guildId];

		if (queue.length >= 1 && player.state.status == AudioPlayerStatus.Idle) {
			const resource = await createResource(queue[0]['url'], queue[0]['title']);
			if (resource != null) {
				player.play(resource);
			}
		}

		return QueueVideoStatus.SUCCESS;
	} else {
		return QueueVideoStatus.ERROR_ALREADY_EXIST;
	}
}

const queuePlaylist = async (guildId, url) => {
	try {
		const output = await youtubedl(url, {
			flatPlaylist: true,
			dumpSingleJson: true,
			noWarnings: true,
			noCallHome: true,
			noCheckCertificate: true,
			preferFreeFormats: true,
			ignoreErrors: true,
			youtubeSkipDashManifest: true,
			simulate: true,
			skipDownload: true,
			quiet: true,
		})
		
		let noOfVideo = 0;
		let noOfRepeated = 0;

		const queue = await retrieveData(guildId, 'queue');

		for (const video of output['entries']) {
			const videoURL = 'https://www.youtube.com/watch?v=' + video['id'];
			const title = video['title'];

			if (ytdl.validateURL(videoURL)) {
				noOfVideo++;
				if (!queue.some(e => e['url'] === videoURL)) {
					queue.push({
						title: title,
						url: videoURL,
					});
				} else {
					noOfRepeated++;
				}
			} else {
				noOfError++;
			}
		}

		const status = await setData(guildId, 'queue', queue);
		if (!status) {
				console.log('An error of saving queue to guildData.json occurred.');
			
				return QueueVideoStatus.ERROR_UNKNOWN;
		}

		const player = cacheData['player'][guildId];

		if (queue.length >= 1 && player.state.status == AudioPlayerStatus.Idle) {
			const resource = await createResource(queue[0]['url'], queue[0]['title']);
			if (resource != null) {
				player.play(resource);
			}
		}
		
		return {
			noOfVideo: noOfVideo,
			noOfRepeated: noOfRepeated,
		}
	} catch (err) {
		console.error(err);
		return null;
	}


}

module.exports = { queuePlaylist, queueMusic, QueueVideoStatus }