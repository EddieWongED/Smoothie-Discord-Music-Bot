const filterWords = require('../const/filterWords.js');

const trimTitle = (title) => {
	let newTitle = title;
	newTitle = newTitle
		.toLowerCase()
		.replace(
			/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g,
			' '
		);

	filterWords.forEach((filterWord) => {
		newTitle = newTitle.replaceAll(filterWord, ' ');
	});

	newTitle = newTitle.replace(/  +/g, ' ');
	return newTitle;
};

module.exports = { trimTitle };
