import { Project, Column, Card } from './Project';
import { Octokit } from '../Services/Octokit';
import { Milestone } from './Milestone';
import { User } from './User';

export class Issue {
	/**
	 * Get an issue.
	 * https://docs.github.com/en/rest/reference/issues#get-an-issue
	 * @param owner
	 * @param repo
	 * @param issue
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
	 * @param owner
	 * @param repo
	 * @param labels
	 */
	public async AddLabelsAsync(owner: string, repo: string, labels: Array<string>): Promise<void> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/issues/:issue_number/labels', {
			owner: owner,
			repo: repo,
			issue_number: this.number,
			labels: labels
		});

		if (response.status === 200) {
			this.labels = response.data;
		}

		else {
			throw new Error(`Could not assign list of labels to issue number ${this.number} of repository "${repo}".\n Octokit returned error ${response.status}.`);
		}
	}

	/**
	 * Add assignees to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
	 * @param owner
	 * @param repo
	 * @param assignees Usernames of people to assign this issue to.
	 * 
	 * NOTE: Only users with push access can add assignees to an issue. Assignees are silently ignored otherwise.
	*/
	public async AddAssigneesAsync(owner: string, repo: string, assignees: Array<string>): Promise<void> {
		if (assignees.length > 10) throw new Error('Maximum assignees allowed is 10.');
		else {
			for (let assignee of assignees) {
				let response = await Octokit.Client.request('GET /repos/:owner/:repo/assignees/:assignee', {
					owner: owner,
					repo: repo,
					assignee: assignee
				});

				if (response.status === 404) {
					assignees.splice(assignees.indexOf(assignee), 1);
					console.warn(`User "${assignee}" does not have permission to be assigned to issue ${this.number} of repository "${repo}".`);
				}

				else if (response.status !== 204) {
					assignees.splice(assignees.indexOf(assignee), 1);
					console.error(`Could not check if user "${assignee}" has permission to be assigned to issue ${this.number} of repository "${repo}".\n Octokit returned error ${response.status}.`);
				}
			}
		}

		if (assignees.length > 0) {
			let response = await Octokit.Client.request('POST /repos/:owner/:repo/issues/:issue_number/assignees', {
				owner: owner,
				repo: repo,
				issue_number: this.number,
				assignees: assignees
			});

			if (response.status === 201) {
				this.assignees = response.data.assignees;
			}

			else {
				throw new Error(`Could not add assignees to issue ${this.number} of repository "${repo}".\n Octokit returned error ${response.status}.`);
			}
		}

		else {
			console.warn(`Assignees list was empty, skipping adding assignees to issue ${this.number}.`);
		}
	}

	/** 
	 *  Returns the project that matches the current project label.
	 * @param owner
	 * @param repo
	 */
	public async GetProjectAsync(owner: string, repo: string): Promise<Project> {
		if (this.project instanceof Project) {
			return this.project;
		}

		let projects: Project[] = await Project.ListAsync(owner, repo);
		let project: Project;

		for (let label of this.labels) {
			if (project = projects.find((p: Project) => p.name === label.name)) {
				this.project = Object.assign(new Project(), project);
				return this.project;
			}
		}

		throw new Error(`Could not find any project label associated with issue ${this.number} on repository "${repo}".`);
	}

	/**
	 * Check if a label with a project name was set
	 * @param owner
	 * @param repo
	 */
	public async IsProjectLabelSetAsync(owner: string, repo: string): Promise<boolean> {
		try {
			if (await this.GetProjectAsync(owner, repo) instanceof Project) {
				return true;
			}
		}

		catch {
			return false;
		}
	}

	/**
	 * Create a project card.
	 * https://docs.github.com/en/rest/reference/projects#create-a-project-card
	 * @param owner
	 * @param repo
	 */
	public async CreateProjectCardAsync(owner: string, repo: string): Promise<void> {
		let project: Project = await this.GetProjectAsync(owner, repo);
		let columnId: number;

		if (this.milestone != null) {
			columnId = (await project.GetColumnAsync(this.milestone.title)).id;
		} else {
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

		if (response.status !== 201) {
			throw new Error(`Could not create card for issue ${this.id}.\n Octokit returned error ${response.status}.`);
		}
	}

	/**
	 * Get the associated project card.
	 * @param owner
	 * @param repo
	 */
	public async GetProjectCardAsync(owner: string, repo: string): Promise<Card> {
		let columnName: string | null | undefined;

		for (let label of this.labels) {
			if (label.name === 'Triage') {
				columnName = 'Triage';
				break;
			}

			else if (label.name === 'Working') {
				columnName = 'In progress';
				break;
			}

			else if (label.name === 'Complete' || label.name === 'Fixed' || label.name === 'Awaiting PR') {
				columnName = 'Done';
				break;
			}
		}

		if (columnName == null) {
			columnName = this.milestone.title;
		}

		let project: Project = await this.GetProjectAsync(owner, repo);
		let column: Column = await project.GetColumnAsync(columnName);
		let cards: Card[] = await column.ListCardsAsync();

		for (let card of cards) {
			if (card.content_url === this.url) {
				return card;
			}
		}

		throw new Error(`Could not locate a card associated with issue ${this.id}.`);
	}

	/**
	 * Update issue labels.
	 * https://docs.github.com/en/rest/reference/issues#update-an-issue
	 * @param owner
	 * @param repo
	 * @param labels An array of label names to replace current labels.
	 * @param milestone The number of the milestone to be added to this issue.
	 * Set to -1 to remove the current milestone. If ommited, it stays unchanged.
	 */
	public async UpdateAsync(owner: string, repo: string, labels: string[], milestone: number = 0): Promise<void> {
		let response = await Octokit.Client.request('PATCH /repos/:owner/:repo/issues/:issue_number', {
			owner: owner,
			repo: repo,
			issue_number: this.number,
			milestone: ((milestone === 0)
				? this.milestone.number
				: ((milestone === -1)
					? null
					: milestone)),
			labels: labels
		});

		if (response.status !== 200) {
			throw new Error(`Could not update labels for issue ${this.number} at "${repo}".\n Octokit returned error ${response.status}.`);
		}
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
	labels?: Label[];
	assignee?: User;
	assignees?: User[];
	milestone?: Milestone;
	locked: boolean;
	active_lock_reason: string;
	comments: number;
	pull_request?: PullRequestLink;
	closed_at: Date;
	created_at: Date;
	updated_at: Date;
	project?: Project;
}

export interface PullRequestLink {
	url: string;
	html_url: string;
	diff_url: string;
	patch_url: string;
}