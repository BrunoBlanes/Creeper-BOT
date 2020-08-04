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
	 * @param reposUrl
	 * @param installationId
	 */
	public static async GetSingleAsync(
		projectName: string,
		reposUrl: string,
		installationId: string): Promise<Project> {
		let projects: Array<Project> = await this.ListAsync(`${reposUrl}/projects`, installationId);

		// Finds the proper project
		projects.forEach(function (project: Project) { if (project.name == projectName) return project; });
		throw new Error(`Could not find project "${projectName}" at ${reposUrl}`);
	}
}

export class Column {
	/**
	 * List project columns
	 * https://docs.github.com/en/rest/reference/projects#list-project-columns
	 * @param columnsUrl
	 * @param installationId
	 */
	public static async ListColumns(columnsUrl: string, installationId: string): Promise<Array<Column>> {
		return await HttpClient.GetAsync<Array<Column>>(columnsUrl, installationId);
	}

	// Get project column id by column name
	public static async GetIdAsync(name: string, id: number, installationId: string): Promise<number> {
		let columns = await this.ListColumns(`/projects/${id}/columns`, installationId);

		// Finds the proper column id
		columns.forEach(function (column: Column) { if (column.name == name) return column.id; });
		throw new Error(`Could not find column "${name}" in project ${id}`);
	}

	/**
	 * Get a project column
	 * https://docs.github.com/en/rest/reference/projects#get-a-project-column
	 * @param installationId
	 */
	public async GetNameAsync(installationId: string): Promise<string> {
		return await (await HttpClient.GetAsync<Column>(this.url, installationId)).name;
	}
}

export class Card {
	/**
	 * List project cards
	 * https://docs.github.com/en/rest/reference/projects#list-project-cards
	 * @param cardsUrl
	 * @param installationId
	 */
	public static async ListAsync(cardsUrl: string, installationId: string): Promise<Array<Card>> {
		return await HttpClient.GetAsync<Array<Card>>(cardsUrl, installationId);
	}

	// Get project card id by column id and issue url
	public static async GetIdAsync(
		columnId: number,
		contentId: string,
		installationId: string): Promise<number> {
		let cards: Array<Card> = await this.ListAsync(`/projects/columns/${columnId}/cards`, installationId);

		// Finds the proper card
		cards.forEach(function (card: Card) { if (card.content_url == contentId) return card.id; });
		throw new Error(`Could not find a card associated with the content at ${contentId}.`);
	}

	/**
	 * Move a project card
	 * https://docs.github.com/en/rest/reference/projects#move-a-project-card
	 * @param currentColumnName
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