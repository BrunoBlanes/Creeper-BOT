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
	 * Get the specified project column
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 *  @param index The column index. Returns the first column if not specified.
	 */
	public async GetColumnAsync(index?: number): Promise<Column>;

	/**
	 * Get the specified project column
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 *  @param name The column name.
	 */
	public async GetColumnAsync(name: string): Promise<Column>;
	public async GetColumnAsync(param: any): Promise<Column> {
		let response;

		if (param && typeof param == 'number') {
			// Get the column at the specified index or the first one if not specified
			response = await octokit.request('GET /projects/:project_id/columns', {
				project_id: this.id,
				per_page: param as number ?? 1,
				mediaType: {
					previews: [
						'inertia'
					]
				}
			});

			if (response.status === 200) return response.data[0] as unknown as Column;
		} else {
			// Get all project columns then returns the one that matches the given name
			response = await octokit.request('GET /projects/:project_id/columns', {
				project_id: this.id,
				mediaType: {
					previews: [
						'inertia'
					]
				}
			});

			if (response.status === 200) {
				for (let column of response.data) {
					if (column.name === param as string) {
						return column as unknown as Column;
					}
				}
			}
		}

		// If we've come this far, then something went wrong
		throw new Error(`Could not retrieve a list of columns for project id ${this.id}. \n Octokit returned error ${response.status}.`);
	}
}

export class Column {
	/**
	 * List project cards
	 * https://docs.github.com/en/rest/reference/projects#list-project-cards
	 * @param state The column state.
	 * Defaults to "not_archived" if no value is specified.
	 */
	public async ListCardsAsync(state?: 'all' | 'archived' | 'not_archived'): Promise<Card[]> {
		let response = await octokit.request('GET /projects/columns/:column_id/cards', {
			column_id: this.id,
			archived_state: state ?? 'not_archived',
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200) return response.data as unknown as Card[];
		throw new Error(`Could no retrieve a list of cards for the column ${this.id}. \n Octokit returned error ${response.status}.`);
	}
}

export class Card {
	/**
	 * Move a project card
	 * https://docs.github.com/en/rest/reference/projects#move-a-project-card
	 * @param column
	 */
	public async MoveAsync(column: Column): Promise<void> {
		let response = await octokit.request('POST /projects/columns/cards/:card_id/moves', {
			card_id: this.id,
			position: 'bottom',
			column_id: column.id,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status !== 201) throw new Error(`Could not move card ${this.id} to column "${column.name}".\n Octokit returned error ${response.status}.`);
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