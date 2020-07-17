const baseUrl = 'https://api.github.com/projects';
var httpClient = require(__dirname + '/../functions/httpClient');

module.exports = {
	// Get project column name by column url
	GetColumnName: async function (columnUrl, installationId) {
		try {
			let body = await httpClient.Get(columnUrl, installationId);
			body = JSON.parse(body);
			return body['name'];
		} catch (err) {
			return err;
		}
	},

	// Get project id by project name
	GetProjectId: async function (projectName, reposUrl, installationId) {
		let projects = JSON.parse(await httpClient.Get(reposUrl + '/projects', installationId));

		// Finds the proper project id
		for (var i = 0; i < projects.length; i++) {
			if (projects[i]['name'] == projectName) {
				return projects[i]['id'];
			}
		}

		throw new Error(`Could not find project ${projectName} at ${reposUrl}`);
	},

	// Get project column id by column name
	GetColumnId: async function (columnName, projectId, installationId) {
		let columns = JSON.parse(await httpClient.Get(baseUrl + `/${projectId}/columns`, installationId));

		// Finds the proper column id
		for (var i = 0; i < columns.length; i++) {
			if (columns[i]['name'] == columnName) {
				return columns[i]['id'];
			}
		}

		throw new Error(`Could not find column ${columnName} in project ${projectName}`);
	},
};