const combination = (arr, min) => {
	const fn = (n, src, got, all) => {
		if (n == 0) {
			if (got.length > 0) {
				all[all.length] = got;
			}

			return;
		}
		for (var j = 0; j < src.length; j++) {
			fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
		}

		return;
	};

	const all = [];
	for (var i = min; i < arr.length; i++) {
		fn(i, arr, [], all);
	}

	all.push(arr);

	return all;
};

module.exports = { combination };
