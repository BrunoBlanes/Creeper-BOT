import { octokit } from '../Services/Octokit';
import { Project, Column } from './Project';
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
	 * Add labels to an issue
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
	 * Add assignees to an issue
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

	/**
	 * Create a project card
	 * https://docs.github.com/en/rest/reference/projects#create-a-project-card
	 */
	public async CreateProjectCardAsync(): Promise<void> {
		let response = await octokit.request('POST /projects/columns/:column_id/cards', {
			column_id: (await (await this.GetProjectAsync()).GetColumnAsync()).id,
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

	/** Returns the project that matches the current project label */
	public async GetProjectAsync(): Promise<Project> {
		let projects: Project[] = await Project.ListAsync(this.owner(), this.repo(), 'open');
		let project: Project;

		for (let label of this.labels) {
			project = projects.filter(x => x.name == label.name)[0];

			if (project) {
				return project;
			}
		}
	}

	/** Returns the current project column where this issue's card is */
	public async GetCurrentColumnAsync(): Promise<Column> {
		let columnName: string;

		for (let label of this.labels) {
			if (label.name === 'Triage') {
				columnName = 'Triage';
				break;
			} else if (label.name === 'Working') {
				columnName = 'In progress';
				break;
			} else if (label.name === 'Complete' || label.name === 'Fixed') {
				columnName = 'Done';
				break;
			}
		}

		columnName = this.milestone.title;
		return await (await this.GetProjectAsync()).GetColumnAsync(columnName);
	}
}

export class Label {

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
	closed_at: Date;
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