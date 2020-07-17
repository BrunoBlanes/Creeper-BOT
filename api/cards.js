var httpClient = require(__dirname + '/../functions/httpClient');

module.exports = {
	// Adds the issue to a specific project column
	CreateFromIssue: async function (issueId, project, installationId) {
		try {
			let body = await httpClient.Post(`https://api.github.com/projects/columns/${project}/cards`, installationId, {
				'content_id': issueId,
				'content_type': 'Issue'
			});
			return body;
		} catch (err) {
			return err;
		}
	},

	// Get project column name by column url
	GetColumnName: async function (columnUrl, installationId) {
		try {
			let body = await httpClient.Get(columnUrl, installationId);
			body = JSON.parse(body);
			return body['name'];
		} catch(err) {
			return err;
		}
	},
}