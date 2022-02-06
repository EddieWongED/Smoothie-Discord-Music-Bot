const editReply = async (args, embed, obj) => {
	if (args) {
		const message = await obj
			.edit({ embeds: [embed.embed], files: embed.files })
			.catch((err) => {
				console.error(err);
			});

		return message;
	} else {
		const message = await obj
			.editReply({
				embeds: [embed.embed],
				files: embed.files,
			})
			.catch((err) => {
				console.error(err);
			});

		return message;
	}
};

module.exports = { editReply };
