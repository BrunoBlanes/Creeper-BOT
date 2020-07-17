var projects = require('./projects');
var httpClient = require(__dirname + '/../functions/httpClient');
const baseUrl = 'https://api.github.com/projects';

module.exports = {
	// Adds the issue to a specific project column
	CreateFromIssue: async function (issueId, project, installationId) {
		try {
			let body = await httpClient.Post(baseUrl + `/columns/${project}/cards`, installationId, {
				'content_id': issueId,
				'content_type': 'Issue'
			});
			return body;
		} catch (err) {
			return err;
		}
	},

	// Get project card id by column id and issue url
	GetProjectCardId: async function (columnId, issueUrl, installationId) {
		let cards = JSON.parse(await httpClient.Get(baseUrl + `/columns/${columnId}/cards`, installationId));

		// Finds the proper card
		for (var k = 0; k < cards.length; k++) {

			// Card matches the issue
			if (cards[k]['content_url'] == issueUrl) {
				return cards[k]['id'];
			}
		}

		throw new Error(`Could not find a card associated with the issue at ${issueUrl}`);
	},

	// Move a card to a specific column
	MoveCardToColumn: async function (currentColumnName, moveToColumnName, projectName, issueUrl, reposUrl, installationId) {
		let projectId = await projects.GetProjectId(projectName, reposUrl, installationId);
		let moveToColumnId = await projects.GetColumnId(moveToColumnName, projectId, installationId);
		let currentColumnId = await projects.GetColumnId(currentColumnName, projectId, installationId);
		let cardId = await this.GetProjectCardId(currentColumnId, issueUrl, installationId);
		try {
			let response = await httpClient.Post(baseUrl + `/columns/cards/${cardId}/moves`, installationId, {
				position: 'top',
				column_id: moveToColumnId
			});
			return response;
		} catch (err) {
			return err;
		}
	},
}