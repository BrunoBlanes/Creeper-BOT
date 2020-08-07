import { octokit } from '../Services/Octokit';
import { User } from './User';

export class Project {
	/**
	 * List repository projects
	 * https://docs.github.com/en/rest/reference/projects#list-repository-projects
	 * @param owner
	 * @param repo
	 */
	public static async ListAsync(owner: string, repo: string, state?: 'open' | 'closed' | 'all'): Promise<Project[]> {
		let response = await octokit.request('GET /repos/:owner/:repo/projects', {
			owner: owner,
			repo: repo,
			state: state,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200)
			return response.data as unknown as Project[];
		else if (response.status === 404)
			throw new Error(`Projects are disabled in the repository "${repo}".`);
		else if (response.status === 401 || response.status === 410)
			throw new Error(`You do not have sufficient privileges to list projects for the repository "${repo}".`);
		throw new Error(`Could not retrieve a list of projects for repository "${repo}" of owner "${owner}". \n Octokit returned error ${response.status}.`);
	}

	/**
	 * Get the first project column
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 *  @param index The column index. Returns the first column if not specified.
	 */
	public async GetColumnAsync(index?: number): Promise<Column> {
		let response = await octokit.request('GET /projects/:project_id/columns', {
			project_id: this.id,
			per_page: index ?? 1,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200) return response.data[0] as unknown as Column;
		throw new Error(`Could not retrieve a list of columns for project id ${this.id}.`);
	}
}

export class Column {
}

export class Card {
	/**
	 * Move a project card
	 * https://docs.github.com/en/rest/reference/projects#move-a-project-card
	 * @param columnId
	 * @param installationId
	 */
	public async MoveAsync(columnId: number, installationId: string): Promise<void> {
		return await HttpClient.PostAsync(`/projects/columns/cards/${this.id}/moves`, {
			column_id: columnId,
			position: 'bottom'
		}, installationId);
	}
}

export interface Project {
	owner_url: string;
	url: string;
	html_url: string;
	columns_url: string;
	id: number;
	node_id: string;
	name: string;
	body: string;
	number: number;
	state: string;
	creator: User;
	created_at: Date;
	updated_at: Date;
}

export interface Column {
	url: string;
	project_url: string;
	cards_url: string;
	id: number;
	node_id: string;
	name: string;
	created_at: Date;
	updated_at: Date;
}

export interface Card {
	url: string;
	id: number;
	node_id: string;
	note: string;
	creator: User;
	created_at: Date;
	updated_at: Date;
	archived: boolean;
	column_url: string;
	content_url: string;
	project_url: string;
}