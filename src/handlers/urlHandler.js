const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');
const { getTracks } = require('spotify-url-info');
const { retrieveData, setData } = require('../utils/changeData.js');
const { search } = require('play-dl');

const QueueStatus = {
	SUCCESS: 0,
	ERROR_INVALID_URL: 1,
	ERROR_ALREADY_EXIST: 2,
	ERROR_UNKNOWN: 3,
};

const URLType = {
	INVALIDURL: 0,
	YOUTUBESINGLE: 1,
	YOUTUBEPLAYLIST: 2,
	SPOTIFYSINGLE: 3,
	SPOTIFYPLAYLIST: 4,
};

const validURL = async (url) => {
	if (ytdl.validateURL(url)) {
		return URLType.YOUTUBESINGLE;
	}

	try {
		const data = await youtubedl(url, {
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
		});

		if (!data) {
			return URLType.INVALIDURL;
		}

		return URLType.YOUTUBEPLAYLIST;
	} catch (err) {
		try {
			const data = await getTracks(url);

			if (!data) {
				return URLType.INVALIDURL;
			}

			if (data.length === 1) {
				return URLType.SPOTIFYSINGLE;
			} else if (data.length > 1) {
				return URLType.SPOTIFYPLAYLIST;
			}
		} catch (err) {
			return URLType.INVALIDURL;
		}
	}

	return URLType.INVALIDURL;
};

const queueSingle = async (guildId, url) => {
	const urlStatus = await validURL(url);
	switch (urlStatus) {
		case URLType.YOUTUBESINGLE:
			const videoInfo = await ytdl.getBasicInfo(url, []);
			const title = videoInfo.videoDetails.title;
			const simplifedURL = await simplifyURL(url);
			const queue = await retrieveData(guildId, 'queue');

			if (!queue.some((e) => e['url'] === simplifedURL)) {
				const queueObject = {
					title: title,
					url: simplifedURL,
					originalURL: simplifedURL,
				};
				if (queueObject) {
					queue.push(queueObject);
				}

				const status = await setData(guildId, 'queue', queue);
				if (!status) {
					console.log(
						'An error of saving queue to guildData.json occurred.'
					);

					return QueueStatus.ERROR_UNKNOWN;
				}

				return QueueStatus.SUCCESS;
			} else {
				return QueueStatus.ERROR_ALREADY_EXIST;
			}
		case URLType.SPOTIFYSINGLE:
			const tracks = await getTracks(url);
			const track = tracks[0];
			const songName = track.name;
			const artistName = track.artists[0]['name'];
			const originalURL = await simplifyURL(url);

			const searchResult = await search(songName + artistName, {
				limit: 1,
			});

			if (searchResult) {
				if (searchResult[0]) {
					const youtubeURL = searchResult[0].url;

					if (youtubeURL) {
						const videoInfo = await ytdl.getBasicInfo(
							youtubeURL,
							[]
						);
						const title = videoInfo.videoDetails.title;
						const simplifedURL = videoInfo.videoDetails.video_url;

						const queue = await retrieveData(guildId, 'queue');

						if (!queue.some((e) => e['url'] === simplifedURL)) {
							const queueObject = {
								title: title,
								url: simplifedURL,
								originalURL: originalURL,
							};
							if (queueObject) {
								queue.push(queueObject);
							}

							const status = await setData(
								guildId,
								'queue',
								queue
							);
							if (!status) {
								console.log(
									'An error of saving queue to guildData.json occurred.'
								);

								return QueueStatus.ERROR_UNKNOWN;
							}

							return QueueStatus.SUCCESS;
						} else {
							return QueueStatus.ERROR_ALREADY_EXIST;
						}
					}
				}
			}

			return QueueStatus.INVALIDURL;
		case URLType.INVALIDURL:
			return QueueStatus.INVALIDURL;
	}

	return QueueStatus.ERROR_UNKNOWN;
};

const queuePlaylist = async (guildId, url) => {
	const urlStatus = await validURL(url);
	switch (urlStatus) {
		case URLType.YOUTUBEPLAYLIST:
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
				});

				let noOfMusic = 0;
				let noOfRepeated = 0;

				const queue = await retrieveData(guildId, 'queue');
				const videos = output['entries'];

				if (videos) {
					for (let video of videos) {
						const videoURL =
							'https://www.youtube.com/watch?v=' + video['id'];
						const title = video['title'];

						const validURLStatus = await validURL(videoURL);

						if (validURLStatus === URLType.YOUTUBESINGLE) {
							noOfMusic++;
							if (!queue.some((e) => e['url'] === videoURL)) {
								const queueObject = {
									title: title,
									url: videoURL,
									originalURL: videoURL,
								};
								if (queueObject) {
									queue.push(queueObject);
								}
							} else {
								noOfRepeated++;
							}
						}
					}

					const status = await setData(guildId, 'queue', queue);
					if (!status) {
						console.log(
							'An error of saving queue to guildData.json occurred.'
						);

						return QueueStatus.ERROR_UNKNOWN;
					}

					return {
						noOfMusic: noOfMusic,
						noOfRepeated: noOfRepeated,
					};
				}
			} catch (err) {
				console.error(err);

				return QueueStatus.ERROR_UNKNOWN;
			}
			break;
		case URLType.SPOTIFYPLAYLIST:
			const tracks = await getTracks(url);

			let noOfMusic = 0;
			let noOfRepeated = 0;

			const queue = await retrieveData(guildId, 'queue');

			for (let track of tracks) {
				const songName = track.name;
				const artistName = track.artists[0]['name'];
				const originalURL = track.external_urls.spotify;

				const searchResult = await search(songName + artistName, {
					limit: 1,
				});

				if (searchResult) {
					if (searchResult[0]) {
						const youtubeURL = searchResult[0].url;

						if (youtubeURL) {
							const videoInfo = await ytdl.getBasicInfo(
								youtubeURL,
								[]
							);
							const title = videoInfo.videoDetails.title;
							const simplifedURL =
								videoInfo.videoDetails.video_url;

							noOfMusic += 1;

							if (!queue.some((e) => e['url'] === simplifedURL)) {
								const queueObject = {
									title: title,
									url: simplifedURL,
									originalURL: originalURL,
								};
								if (queueObject) {
									queue.push(queueObject);
								}
							} else {
								noOfRepeated += 1;
							}
						}
					}
				}
			}

			const status = await setData(guildId, 'queue', queue);
			if (!status) {
				console.log(
					'An error of saving queue to guildData.json occurred.'
				);

				return QueueStatus.ERROR_UNKNOWN;
			}

			return {
				noOfMusic: noOfMusic,
				noOfRepeated: noOfRepeated,
			};
		case URLType.INVALIDURL:
			return QueueStatus.INVALIDURL;
	}

	return QueueStatus.ERROR_UNKNOWN;
};

const simplifyURL = async (url) => {
	const urlStatus = await validURL(url);
	switch (urlStatus) {
		case URLType.YOUTUBESINGLE:
			try {
				const videoInfo = await ytdl.getBasicInfo(url, []);
				const simplifedURL = videoInfo.videoDetails.video_url;

				return simplifedURL;
			} catch (err) {
				console.error(err);
			}
			break;
		case URLType.SPOTIFYSINGLE:
			try {
				const tracks = await getTracks(url);
				const track = tracks[0];
				const simplifedURL = track.external_urls.spotify;

				return simplifedURL;
			} catch (err) {
				console.error(err);
			}
			break;
	}

	return url;
};

module.exports = {
	validURL,
	queueSingle,
	queuePlaylist,
	simplifyURL,
	QueueStatus,
	URLType,
};
