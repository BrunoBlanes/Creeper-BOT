import { HttpClient } from '../Services';
import { User } from './User';

export class Project {
	/**
	 * List repository projects
	 * https://docs.github.com/en/rest/reference/projects#list-repository-projects
	 * @param projectsUrl
	 * @param installationId
	 */
	public static async ListAsync(projectsUrl: string, installationId: string): Promise<Array<Project>> {
		return await HttpClient.GetAsync<Array<Project>>(projectsUrl, installationId);
	}

	/**
	 * Get a project by name
	 * @param projectName
	 * @param projectsUrl
	 * @param installationId
	 */
	public static async GetAsync(
		projectName: string,
		projectsUrl: string,
		installationId: string): Promise<Project> {
		let projects: Array<Project> = await this.ListAsync(projectsUrl, installationId);

		// Finds the proper project
		projects.forEach(function (project: Project) { if (project.name == projectName) return project; });
		throw new Error(`Could not find project "${projectName}" at ${projectsUrl}`);
	}

	/**
	 * List project columns
	 * https://docs.github.com/en/rest/reference/projects#list-project-columns
	 * @param installationId
	 */
	public async ListColumnsAsync(installationId: string): Promise<Array<Column>> {
		return await HttpClient.GetAsync<Array<Column>>(`/projects/${this.id}/columns`, installationId);
	}

	public async GetFirstColumnIdAsync(installationId: string): Promise<number> {
		let columns: Array<Column> = await this.ListColumnsAsync(installationId);
		columns.
	}
}

export class Column {
	/**
	 * List project cards
	 * https://docs.github.com/en/rest/reference/projects#list-project-cards
	 * @param installationId
	 */
	public async ListCardsAsync(installationId: string): Promise<Array<Card>> {
		return await HttpClient.GetAsync<Array<Card>>(`/projects/columns/${this.url}/cards`, installationId);
	}

	/**
	 * Create a project card
	 * https://docs.github.com/en/rest/reference/projects#create-a-project-card
	 * @param contentId
	 * @param contentType
	 * @param installationId
	 */
	public async CreateAsync(contentId: number, contentType: string, installationId: string): Promise<void> {
		await HttpClient.PostAsync(`/projects/columns/${this.id}/cards`, {
			'content_id': contentId,
			'content_type': contentType
		}, installationId);
	}
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