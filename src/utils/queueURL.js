const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');
const { queue, player } = require('../objects/subscription.js');
const { getNextResource } = require('../objects/subscription.js');

const QueueVideoStatus = {
	SUCCESS: 0,
	ERROR_INVALID_URL: 1,
	ERROR_ALREADY_EXIST: 2
}

const queueMusic = async (url) => {
	const videoInfo = await ytdl.getBasicInfo(url, []);
	const title = videoInfo.videoDetails.title;

	if (!ytdl.validateURL(url)) {
		return QueueVideoStatus.ERROR_INVALID_URL;
	}

	if (!queue.some(e => e['url'] === url)) {
		queue.push({
			title: title,
			url: url
		});

		if (queue.length === 1) {
			player.play(getNextResource());
		}

		return QueueVideoStatus.SUCCESS;
	} else {
		return QueueVideoStatus.ERROR_ALREADY_EXIST;
	}
}

const queuePlaylist = async (url) => {
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

				if (queue.length === 1) {
					player.play(getNextResource());
				}
			} else {
				noOfRepeated++;
			}
		} else {
			noOfError++;
		}
	}

	return {
		noOfVideo: noOfVideo,
		noOfRepeated: noOfRepeated,
	}
}

module.exports = { queuePlaylist, queueMusic, QueueVideoStatus }