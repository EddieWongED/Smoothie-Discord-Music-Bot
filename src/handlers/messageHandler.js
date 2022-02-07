const editReply = async (args, embed, obj, components) => {
	if (args) {
		let message;
		if (!components) {
			message = await obj
				.edit({ embeds: [embed.embed], files: embed.files })
				.catch((err) => {
					console.error(err);
				});
		} else {
			message = await obj
				.edit({
					embeds: [embed.embed],
					files: embed.files,
					components: components,
				})
				.catch((err) => {
					console.error(err);
				});
		}

		return message;
	} else {
		let message;

		if (!components) {
			message = await obj
				.editReply({
					embeds: [embed.embed],
					files: embed.files,
				})
				.catch((err) => {
					console.error(err);
				});
		} else {
			message = await obj
				.editReply({
					embeds: [embed.embed],
					files: embed.files,
					components: components,
				})
				.catch((err) => {
					console.error(err);
				});
		}

		return message;
	}
};

module.exports = { editReply };
