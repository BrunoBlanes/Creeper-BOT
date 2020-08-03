import HttpClient from '../functions/GitHubApi';

export default class Card {

	// Adds the issue to a specific project column
	public static async CreateFromIssueAsync(issueId: number, project: string, installationId: string): Promise<any> {
		try {
			let body = await HttpClient.PostAsync(`/projects/columns/${project}/cards`, {
				'content_id': issueId,
				'content_type': 'Issue'
			}, installationId);
			body = JSON.parse(body);
			return body;
		} catch (err) {
			return err;
		}
	}

	// Get project column name by column url
	public static  async GetColumnNameAsync(columnUrl: string, installationId: string): Promise<string> {
		try {
			let body = await HttpClient.GetAsync(columnUrl, installationId);
			body = JSON.parse(body);
			return body['name'];
		} catch (err) {
			return err;
		}
	}
}