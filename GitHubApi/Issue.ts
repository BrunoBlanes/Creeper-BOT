import { HttpClient } from '../Services';
import { User } from './User';

export class Issue {
	/**
	 * List repository issues
	 * https://docs.github.com/en/rest/reference/issues#list-repository-issues
	 * @param url
	 * @param installationId
	 */
	public static async ListAsync(url: string, installationId: string): Promise<Array<Issue>> {
		return await HttpClient.GetAsync<Array<Issue>>(url, installationId);
	}

	/**
	 * Add assignees to an issue
	 * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
	 * @param userNames
	 * @param installationId
	*/
	public async AssignUsersAsync(userNames: Array<string>, installationId: string): Promise<void> {
		await HttpClient.PostAsync(`${this.url}/assignees`, { 'assignees': userNames }, installationId);
	}

	/**
	 * Update an issue
	 * https://docs.github.com/en/rest/reference/issues#update-an-issue
	 * @param labelNames
	 * @param milestoneId
	 * @param installationId
	 */
	public async UpdateAsync(
		labelNames: Array<string>,
		milestoneId: number,
		installationId: string): Promise<void> {
		await HttpClient.PatchAsync(this.url, {
			'milestone': milestoneId,
			'labels': labelNames
		}, installationId);
	}

	/**
	 * List labels for an issue
	 * https://docs.github.com/en/rest/reference/issues#list-labels-for-an-issue
	 * @param installationId
	 */
	public async ListLabelsAsync(installationId: string): Promise<Array<Label>> {
		return await HttpClient.GetAsync<Array<Label>>(`${this.url}/labels`, installationId);
	}

	/**
	 * Add labels to an issue
	 * https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
	 * @param labelNames
	 * @param installationId
	 */
	public async AddLabelsAsync(labelNames: Array<string>, installationId: string): Promise<void> {
		await HttpClient.PostAsync(`${this.url}/labels`, { 'labels': labelNames }, installationId);
	}

	/**
	 * Set labels for an issue
	 * https://docs.github.com/en/rest/reference/issues#set-labels-for-an-issue
	 * @param labelNames
	 * @param installationId
	 */
	public async SetLabelsAsync(labelNames: Array<string>, installationId: string): Promise<void> {
		await HttpClient.PutAsync(`${this.url}/labels`, { 'labels': labelNames }, installationId);
	}

	/**
	 * Remove a label from an issue
	 * https://docs.github.com/en/rest/reference/issues#remove-a-label-from-an-issue
	 * @param labelName
	 * @param installationId
	 */
	public async RemoveLabelAsync(labelName: string, installationId: string): Promise<void> {
		await HttpClient.DeleteAsync(`${this.url}/labels/${labelName}`, installationId);
	}

	/**
	 * Remove all labels from an issue
	 * https://docs.github.com/en/rest/reference/issues#remove-all-labels-from-an-issue
	 * @param installationId
	 */
	public async RemoveAllLabelsAsync(installationId: string): Promise<void> {
		await HttpClient.DeleteAsync(`${this.url}/labels`, installationId);
	}

	/**
	 * Create a project card
	 * https://docs.github.com/en/rest/reference/projects#create-a-project-card
	 * @param issueId
	 * @param projectName
	 * @param installationId
	 */
	public async CreateProjectCardAsync(projectName: string, installationId: string): Promise<void> {
		return await HttpClient.PostAsync(`/projects/columns/${projectName}/cards`, {
			'content_id': this.id,
			'content_type': 'Issue'
		}, installationId);
	}
}

export class Label {
	/**
	 * Get a label
	 * https://docs.github.com/en/rest/reference/issues#get-a-label
	 * @param label
	 * @param labelsUrl
	 * @param installationId
	 */
	public static async GetSingleAsync(
		labelName: string,
		labelsUrl: string,
		installationId: string): Promise<Label> {
		return await HttpClient.GetAsync<Label>(`${labelsUrl}/${labelName}`, installationId);
	}
}

export interface Label {
	id: number;
	node_id: string;
	url: string;
	name: string;
	description: string;
	color: string;
	default: boolean;
}

export interface Issue {
	id: number;
	node_id: string;
	url: string;
	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	number: number;
	state: string;
	title: string;
	body: string;
	user: User;
	labels: Label[];
	assignee: User;
	assignees: User[];
	milestone: Milestone;
	locked: boolean;
	active_lock_reason: string;
	comments: number;
	pull_request: PullRequest;
	closed_at?: any;
	created_at: Date;
	updated_at: Date;
}

export interface Creator {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}

export interface Milestone {
	url: string;
	html_url: string;
	labels_url: string;
	id: number;
	node_id: string;
	number: number;
	state: string;
	title: string;
	description: string;
	creator: Creator;
	open_issues: number;
	closed_issues: number;
	created_at: Date;
	updated_at: Date;
	closed_at: Date;
	due_on: Date;
}

export interface PullRequest {
	url: string;
	html_url: string;
	diff_url: string;
	patch_url: string;
}