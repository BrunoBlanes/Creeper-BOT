import { Project, Column, Card } from './Project';
import { octokit } from '../Services/Octokit';
import { User } from './User';

export class Issue {
	owner = () => {
		let paths: string[] = this.repository_url.split('/');
		return paths[paths.length - 2];
	};

	repo = () => {
		let paths: string[] = this.repository_url.split('/');
		return paths[paths.length - 1];
	};

	/**
	 * Get an issue.
	 * https://docs.github.com/en/rest/reference/issues#get-an-issue
	 * @param owner
	 * @param repo
	 * @param issue
	 */
	public static async GetAsync(owner: string, repo: string, number: number): Promise<Issue> {
		let response = await octokit.request('GET /repos/:owner/:repo/issues/:issue_number', {
			owner: owner,
			repo: repo,
			issue_number: number
		});

		if (response.status === 200) return response.data as unknown as Issue;
		else if (response.status === 301) throw new Error(`The issue ${number} at repository "${repo}" was permanently moved to "${response.headers.location}".`);
		else if (response.status === 404) throw new Error(`The issue ${number} might have been transfered to or deleted from a repository you do not have read access to.`);
		else if (response.status === 410) throw new Error(`The issue ${number} has been permanently deleted from the repository "${repo}".`);
		throw new Error(`Could not retrieve issue ${number} from repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Add labels to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
	 * @param labels
	 */
	public async AddLabelsAsync(labels: Array<string>): Promise<void> {
		let response = await octokit.request('POST /repos/:owner/:repo/issues/:issue_number/labels', {
			owner: this.owner(),
			repo: this.repo(),
			issue_number: this.number,
			labels: labels
		});

		if (response.status === 200) this.labels = response.data;
		throw new Error(`Could not assign list of labels to issue number ${this.number} of repository "${this.repo()}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Add assignees to an issue.
	 * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
	 * @param assignees Usernames of people to assign this issue to.
	 * 
	 * NOTE: Only users with push access can add assignees to an issue. Assignees are silently ignored otherwise.
	*/
	public async AddAssigneesAsync(assignees: Array<string>): Promise<void> {
		if (assignees.length > 10) throw new Error('Maximum assignees allowed is 10.');
		else {
			assignees.forEach(async (assignee: string) => {
				let response = await octokit.request('GET /repos/:owner/:repo/assignees/:assignee', {
					owner: this.owner(),
					repo: this.repo(),
					assignee: assignee
				});

				if (response.status === 404) {
					assignees.splice(assignees.indexOf(assignee), 1);
					console.warn(`User "${assignee}" does not have permission to be assigned to issue ${this.number} of repository "${this.repo()}".`);
				}

				else if (response.status !== 204) {
					assignees.splice(assignees.indexOf(assignee), 1);
					console.error(`Could not check if user "${assignee}" has permission to be assigned to issue ${this.number} of repository "${this.repo()}".\n Octokit returned error ${response.status}.`);
				}
			});
		}

		if (assignees.length > 0) {
			let response = await octokit.request('POST /repos/:owner/:repo/issues/:issue_number/assignees', {
				owner: this.owner(),
				repo: this.repo(),
				issue_number: this.number,
				assignees: assignees
			});

			if (response.status === 201) this.assignees = response.data.assignees;
			else throw new Error(`Could not add assignees to issue ${this.number} of repository "${this.repo()}".\n Octokit returned error ${response.status}.`);
		} else console.warn(`Assignees list was empty, skipping adding assignees to issue ${this.number}.`);
	}

	/** Returns the project that matches the current project label. */
	public async GetProjectAsync(): Promise<Project> {
		let projects: Project[] = await Project.ListAsync(this.owner(), this.repo());
		let project: Project;

		for (let label of this.labels) {
			if (project = projects.find(x => x.name === label.name)) {
				return project;
			}
		}

		throw new Error(`Could not find any project label associated with issue ${this.number} on repository "${this.repo()}".`);
	}

	/** Check if a label with a project name was set */
	public async IsProjectLabelSetAsync(): Promise<boolean> {
		try { if (await this.GetProjectAsync()) return true; }
		catch { return false; }
	}

	/**
	 * Create a project card.
	 * https://docs.github.com/en/rest/reference/projects#create-a-project-card
	 */
	public async CreateProjectCardAsync(): Promise<void> {
		let columnId: number;

		if (this.milestone)
			columnId = (await (await this.GetProjectAsync()).GetColumnAsync(this.milestone.title)).id;
		else
			columnId = (await (await this.GetProjectAsync()).GetColumnAsync()).id;
		let response = await octokit.request('POST /projects/columns/:column_id/cards', {
			column_id: columnId,
			content_id: this.id,
			content_type: 'Issue',
			mediaType: {
				previews: [
					'inertia'
				]
			}
		});
		if (response.status !== 201) throw new Error(`Could not create card for issue ${this.id}.`);
	}

	public async GetProjectCardAsync(): Promise<Card> {
		let columnName: string;

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

		if (!columnName) {
			columnName = this.milestone.title;
		}

		let project: Project = await this.GetProjectAsync();
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
	 * @param labels An array of label names to replace current labels.
	 * @param milestone The number of the milestone to be added to this issue.
	 * Set to -1 to remove the current milestone. If ommited, it stays unchanged.
	 */
	public async UpdateAsync(labels: string[], milestone: number = 0): Promise<void> {
		let response = await octokit.request('PATCH /repos/:owner/:repo/issues/:issue_number', {
			owner: this.owner(),
			repo: this.repo(),
			issue_number: this.number,
			milestone: milestone === 0 ? this.milestone.number : milestone === -1 ? null : milestone,
			labels: labels
		});

		if (response.status !== 200) throw new Error(`Could not update labels for issue ${this.number} at "${this.repo()}".\n Octokit returned error ${response.status}.`);
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
	pull_request?: PullRequest;
	closed_at: Date;
	created_at: Date;
	updated_at: Date;
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
	creator: User;
	open_issues: number;
	closed_issues: number;
	created_at: Date;
	updated_at: Date;
	closed_at: Date;
	due_on: Date;
}

// TODO: See if this can be moved
export interface PullRequest {
	url: string;
	html_url: string;
	diff_url: string;
	patch_url: string;
}