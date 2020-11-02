import { Octokit } from '../Services/Octokit';
import { Repository } from './Repository';
import { Installation } from './Webhook';
import { User } from './User';

export class Project {
	/**
	 * Get a project.
	 * https://docs.github.com/en/rest/reference/projects#get-a-project
	 * @param id
	 */
	public static async GetAsync(id: number): Promise<Project> {
		let response = await Octokit.Client.request('GET /projects/:project_id', {
			project_id: id,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200) {
			return Object.assign(new Project(), response.data);
		}

		else if (response.status === 404) {
			throw new Error('Projects are disabled for this repository.');
		}

		else if (response.status === 401 || response.status === 410) {
			throw new Error('You do not have sufficient privileges to list projects for this repository.');
		}

		throw new Error(`Could not retrieve a list of projects the repository. \n Octokit returned error ${response.status}.`);
	}

	/**
	 * List repository projects.
	 * https://docs.github.com/en/rest/reference/projects#list-repository-projects
	 * @param owner
	 * @param repo
	 * @param state Indicates the state of the projects to return.
	 */
	public static async ListAsync(owner: string, repo: string, state: 'open' | 'closed' | 'all'): Promise<Project[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/projects', {
			owner: owner,
			repo: repo,
			state: state,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200) {
			let projects: Project[] = [];

			for (let project of response.data) {
				projects.push(Object.assign(new Project(), project));
			}

			return projects;
		}

		else if (response.status === 404) {
			throw new Error(`Projects are disabled in the repository "${repo}".`);
		}

		else if (response.status === 401 || response.status === 410) {
			throw new Error(`You do not have sufficient privileges to list projects for the repository "${repo}".`);
		}

		throw new Error(`Could not retrieve a list of projects for repository "${repo}" of owner "${owner}". \n Octokit returned error ${response.status}.`);
	}

	/**
	 * Get the specified project column.  Returns the first column if not specified.
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 *  @param index The column index.
	 */
	public async GetColumnAsync(index?: number): Promise<Column>;

	/**
	 * Get the specified project column.
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 *  @param name The column name.
	 */
	public async GetColumnAsync(name: string): Promise<Column>;
	public async GetColumnAsync(param: any): Promise<Column> {
		let response;

		if (param && typeof param == 'number') {
			// Get the column at the specified index or the first one if not specified
			response = await Octokit.Client.request('GET /projects/:project_id/columns', {
				project_id: this.id,
				per_page: param as number ?? 1,
				mediaType: {
					previews: [
						'inertia'
					]
				}
			});

			if (response.status === 200) {
				return response.data[0] as unknown as Column;
			}

		}

		else if (param && typeof param == 'string') {
			// Get all project columns then returns the one that matches the given name
			response = await Octokit.Client.request('GET /projects/:project_id/columns', {
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
						return Object.assign(new Column(), column);
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
	 * List project cards.
	 * https://docs.github.com/en/rest/reference/projects#list-project-cards
	 * @param state The column state.
	 * Defaults to "not_archived" if no value is specified.
	 */
	public async ListCardsAsync(state: 'all' | 'archived' | 'not_archived' = 'not_archived'): Promise<Card[]> {
		let response = await Octokit.Client.request('GET /projects/columns/:column_id/cards', {
			column_id: this.id,
			archived_state: state,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200) {
			let cards: Card[] = [];
			response.data.forEach(card => { cards.push(Object.assign(new Card(), card)); });
			return cards;
		}

		throw new Error(`Could no retrieve a list of cards for the column ${this.id}. \n Octokit returned error ${response.status}.`);
	}
}

export class Card {
	/**
	 * Move a project card.
	 * https://docs.github.com/en/rest/reference/projects#move-a-project-card
	 * @param column The column to move this card to.
	 */
	public async MoveAsync(column: Column): Promise<void> {
		let response = await Octokit.Client.request('POST /projects/columns/cards/:card_id/moves', {
			card_id: this.id,
			position: 'bottom',
			column_id: column.id,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status !== 201) {
			throw new Error(`Could not move card ${this.id} to column "${column.name}".\n Octokit returned error ${response.status}.`);
		}
	}

	/**
	 * Delete a project card.
	 * https://docs.github.com/en/rest/reference/projects#delete-a-project-card
	 */
	public async DeleteAsync(): Promise<void> {
		let response = await Octokit.Client.request('DELETE /projects/columns/cards/:card_id', {
			card_id: this.id,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status !== 204) {
			throw new Error(`Could not delete project card ${this.id}.\n Octokit returned error ${response.status}.`);
		}
	}

	/**
	 * Get a project column.
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 */
	public async GetCurrentColumnAsync(): Promise<Column> {
		let response = await Octokit.Client.request('GET /projects/columns/:column_id', {
			column_id: this.column_id,
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 200) {
			return Object.assign(new Column(), response.data);
		}

		throw new Error(`Could not retrieve column information for card ${this.id}.\n Octokit returned error ${response.status}.`);
	}

	/** Get the project where this card is in. */
	public async GetProjectAsync(): Promise<Project> {
		let splitUrl: string[] = this.project_url.split('/');
		let projectId: number = +splitUrl[splitUrl.length - 1];
		return Project.GetAsync(projectId);
	}

	/** Check if card content is an issue. */
	public IsContentAnIssue(): boolean {
		let splitUrl: string[] = this.content_url.split('/');
		if (splitUrl[splitUrl.length - 2] === 'issues') return true;
		else return false;
	}

	/** Return the associated content id*/
	public GetContentId(): number {
		let splitUrl: string[] = this.content_url.split('/');
		return +splitUrl[splitUrl.length - 1];
	}
}

export class CardEvent {
	constructor(jsonPayload: CardEvent) {
		this.project_card = Object.assign(new Card(), jsonPayload.project_card);
		this.repository = Object.assign(new Repository(), jsonPayload.repository);
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
	project_url: string;
	column_url: string;
	column_id: number;
	id: number;
	node_id: string;
	note: string;
	archived: boolean;
	creator: User;
	created_at: Date;
	updated_at: Date;
	content_url?: string;
}

export interface CardEvent {
	action: string;
	project_card: Card;
	repository: Repository;
	sender: User;
	installation: Installation;
}