import { Project, Column, Card } from './Project';
import { Octokit } from '../Services/Octokit';
import { Repository } from './Repository';
import { Installation } from './Webhook';
import { Milestone } from './Milestone';
import { Label } from './Label';
import { User } from './User';

export class Issue {
	/**
	 * Get an issue.
	 * https://docs.github.com/en/rest/reference/issues#get-an-issue
	 * @param owner
	 * @param repo
	 * @param number
	 */
	public static async GetAsync(owner: string, repo: string, number: number): Promise<Issue> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/issues/:issue_number', {
			owner: owner,
			repo: repo,
			issue_number: number
		});

		if (response.status === 200) {
			return Object.assign(new Issue(), response.data);
		}

		else if (response.status === 301) {
			throw new Error(`The issue ${number} at repository "${repo}" was permanently moved to "${response.headers.location}".`);
		}

		else if (response.status === 404) {
			throw new Error(`The issue ${number} might have been transfered to or deleted from a repository you do not have read access to.`);
		}

		else if (response.status === 410) {
			throw new Error(`The issue ${number} has been permanently deleted from the repository "${repo}".`);
		}

		throw new Error(`Could not retrieve issue ${number} from repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Add labels to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
	 * @param label The name of the label to add to the issue.
	 */
	public async AddLabelAsync(label: string): Promise<Label[]> {
		return this.AddLabelsAsync([label]);
	}

	/**
	 * Add labels to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
	 * @param labels The name of the labels to add to the issue.
	 */
	public async AddLabelsAsync(labels: Array<string>): Promise<Label[]> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/issues/:issue_number/labels', {
			owner: this.repository.owner.login,
			repo: this.repository.name,
			issue_number: this.number,
			labels: labels
		});

		if (response.status === 200) {
			this.labels = response.data;
			return this.labels;
		}

		console.error(`Could not assign labels to issue number ${this.number} of repository "${this.repository.name}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Add an assignee to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
	 *
	 * NOTE: Only users with push access can add assignees to an issue. Assignees are silently ignored otherwise.
	 * @param assignee Username of the person to assign this issue to.
	*/
	public AddAssigneeAsync(assignee: string): Promise<User[]> {
		return this.AddAssigneesAsync([assignee]);
	}

	/**
	 * Add assignees to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
	 *
	 * NOTE: Only users with push access can add assignees to an issue. Assignees are silently ignored otherwise.
	 * @param assignees Usernames of the people to assign this issue to.
	*/
	public async AddAssigneesAsync(assignees: Array<string>): Promise<User[]> {
		if (assignees.length > 10) {
			throw new Error('Maximum number of assignees allowed is 10.');
		}

		for (let assignee of assignees) {
			let response = await Octokit.Client.request('GET /repos/:owner/:repo/assignees/:assignee', {
				owner: this.repository.owner.login,
				repo: this.repository.name,
				assignee: assignee
			});

			if (response.status === 404) {
				assignees.splice(assignees.indexOf(assignee), 1);
				console.warn(`User "${assignee}" does not have permission to be assigned to issue ${this.number} of repository "${this.repository.name}".`);
			}

			else if (response.status !== 204) {
				assignees.splice(assignees.indexOf(assignee), 1);
				console.error(`Could not check if user "${assignee}" has permission to be assigned to issue ${this.number} of repository "${this.repository.name}".\n Octokit returned error ${response.status}.`);
			}
		}

		if (assignees.length > 0) {
			let response = await Octokit.Client.request('POST /repos/:owner/:repo/issues/:issue_number/assignees', {
				owner: this.repository.owner.login,
				repo: this.repository.name,
				issue_number: this.number,
				assignees: assignees
			});

			if (response.status === 201) {
				this.assignees = response.data.assignees;
				return this.assignees;
			}

			throw new Error(`Could not add assignees to issue ${this.number} of repository "${this.repository.name}".\n Octokit returned error ${response.status}.`);
		}

		return null;
	}

	/** Returns the project that matches the current project label. */
	public async GetProjectAsync(): Promise<Project> {
		for (let label of this.labels) {
			for (let project of await this.repository.ListProjectsAsync()) {
				if (project.name === label.name) {
					return Object.assign(new Project(), project);
				}
			}
		}
	}

	/**
	 * Create a project card.
	 * https://docs.github.com/en/rest/reference/projects#create-a-project-card
	 */
	public async CreateProjectCardAsync(): Promise<Card> {
		let project: Project = await this.GetProjectAsync();
		let columnId: number;

		if (this.milestone != null) {
			columnId = (await project.GetColumnAsync(this.milestone.title)).id;
		}

		else {
			columnId = (await project.GetColumnAsync('Triage')).id;
		}

		let response = await Octokit.Client.request('POST /projects/columns/:column_id/cards', {
			column_id: columnId,
			content_id: this.id,
			content_type: 'Issue',
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});

		if (response.status === 201) {
			return Object.assign(new Card(), response.data);
		}

		throw new Error(`Could not create card for issue ${this.id}.\n Octokit returned error ${response.status}.`);
	}

	/** Get the associated project card. */
	public async GetProjectCardAsync(): Promise<Card> {
		let columnName: string | undefined | null;

		for (let label of this.labels) {
			if (label.name === 'Triage') {
				columnName = 'Triage';
			}

			else if (label.name === 'Working') {
				columnName = 'In progress';
			}

			else if (label.name === 'Complete' || label.name === 'Fixed' || label.name === 'Awaiting Pull Request') {
				columnName = 'Done';
			}
		}

		if (columnName == null) {
			columnName = this.milestone.title;
		}

		let project: Project = await this.GetProjectAsync();
		let column: Column = await project.GetColumnAsync(columnName);

		for (let card of await column.ListCardsAsync()) {
			if (card.content_url === this.url) {
				return card;
			}
		}

		throw new Error(`Could not locate a card associated with issue ${this.id}.`);
	}

	/**
	 * Update issue labels.
	 * https://docs.github.com/en/rest/reference/issues#update-an-issue
	 * @param labels An array of label names to replace current labels.
	 * @param milestone The number of the milestone to associate this issue with or null to remove current.
	 * @param state State of the issue. Either open or closed.
	 */
	public async UpdateAsync(labels?: string[], milestone?: number, state?: 'open' | 'closed'): Promise<Issue> {
		let response = await Octokit.Client.request('PATCH /repos/:owner/:repo/issues/:issue_number', {
			owner: this.repository.owner.login,
			repo: this.repository.name,
			issue_number: this.number,
			milestone: (milestone === undefined)
				? this.milestone?.number
				: milestone,
			labels: labels ?? this.labels.map(function (label: Label) { return label.name; }),
			state: state
		});

		if (response.status === 200) {
			return Object.assign(new Issue(), response.data);
		}

		throw new Error(`Could not update labels for issue ${this.number} at "${this.repository.name}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Create an issue comment.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/issues#create-an-issue-comment
	 * @param body The contents of the comment.
	 */
	public async CreateCommentAsync(body: string): Promise<void> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/issues/:issue_number/comments', {
			owner: this.repository.owner.login,
			repo: this.repository.name,
			issue_number: this.number,
			body: body
		});

		if (response.status !== 201) {
			throw new Error(`Could not create a comment on issue ${this.number} at "${this.repository.name}".\n Octokit returned error ${response.status}.`);
		}
	}
}

export class IssueEvent {
	constructor(jsonPayload: IssueEvent) {
		this.issue = Object.assign(new Issue(), jsonPayload.issue);
		this.milestone = Object.assign(new Milestone(), jsonPayload.milestone);
		this.repository = Object.assign(new Repository(), jsonPayload.repository);
		this.issue.repository = this.repository;

		this.action = jsonPayload.action;
		this.label = jsonPayload.label;
		this.sender = jsonPayload.sender;
		this.installation = jsonPayload.installation;
	}
}

export interface IssueEvent {
	action: string;
	issue: Issue;
	milestone?: Milestone;
	label?: Label;
	repository: Repository;
	sender: User;
	installation: Installation;
}

export interface Issue {
	url: string;
	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	id: number;
	node_id: string;
	number: number;
	title: string;
	user: User;
	labels: Label[];
	state: string;
	locked: boolean;
	active_lock_reason: string;
	assignee?: User;
	assignees: User[];
	milestone?: Milestone;
	comments: number;
	created_at: Date;
	updated_at: Date;
	closed_at?: Date;
	body: string;
	closed_by: User;
	author_association: string;
	repository?: Repository;
}