import { HttpClient } from '../Services';

export default class Project {

	public static async GetIdAsync(name: string, reposUrl: string, installationId: string): Promise<number> {
		let projects: Array<any> = await HttpClient.GetAsync(`${reposUrl}/projects`, installationId);

		// Finds the proper project id
		projects.forEach(function (project) { if (project['name'] == name) return project['id']; });
		throw new Error(`Could not find project ${name} at ${reposUrl}`);
	}

	static Columns = class Column {

		// Get project column name by column url
		public static async GetNameAsync(url: string, installationId: string): Promise<string> {
			let body = await HttpClient.GetAsync(url, installationId);
			return body['name'];
		}

		// Get project column id by column name
		public static async GetIdAsync(name: string, id: number, installationId: string): Promise<number> {
			let columns = await httpClient.Get(`/projects/${id}/columns`, installationId);

			// Finds the proper column id
			columns.forEach(function (column) { if (column['name'] == name) return column['id']; });
			throw new Error(`Could not find column ${name} in project ${id}`);
		}

		static Cards = class Card {

			// Adds the issue to a specific project column
			public static async CreateAsync(issueId: number, project: string, installationId: string): Promise<any> {
				try {
					return await HttpClient.PostAsync(`/projects/columns/${project}/cards`, {
						'content_id': issueId,
						'content_type': 'Issue'
					}, installationId);
				} catch (err) {
					return err;
				}
			}

			// Get project card id by column id and issue url
			public static async GetIdAsync(columnId: number, issueUrl: string, installationId: string): Promise<number> {
				let cards: Array<any> = await HttpClient.GetAsync(`/projects/columns/${columnId}/cards`, installationId);

				// Finds the proper card
				cards.forEach(function (card) { if (card['content_url'] == issueUrl) return card['id']; });
				throw new Error(`Could not find a card associated with the issue at ${issueUrl}.`);
			}

			// Move a card to a specific column
			public static async MoveAsync(currentColumnName: string,
				moveToColumnName: string,
				projectName: string,
				issueUrl: string,
				reposUrl: string,
				installationId: string): Promise<any> {
				let projectId = await Project.GetIdAsync(projectName, reposUrl, installationId);
				let moveToColumnId = await Column.GetIdAsync(moveToColumnName, projectId, installationId);
				let currentColumnId = await Column.GetIdAsync(currentColumnName, projectId, installationId);
				let cardId = await this.GetIdAsync(currentColumnId, issueUrl, installationId);
				return await HttpClient.PostAsync(`/projects/columns/cards/${cardId}/moves`, {
					column_id: moveToColumnId,
					position: 'top'
				}, installationId);
			}
		}
	}
}