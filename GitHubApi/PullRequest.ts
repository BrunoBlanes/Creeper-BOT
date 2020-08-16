import { octokit } from '../Services/Octokit';
import { Repository } from './Repository';
import { Milestone } from './Milestone';
import { Label, Issue } from './Issue';
import { User } from './User';

const header: string =
	'============================= Start of Creeper-bot automation =============================';
const footer: string =
	'============================== End of Creeper-bot automation ==============================';

export class PullRequest {
	/**
	 * List pull requests.
	 * https://docs.github.com/en/rest/reference/pulls#list-pull-requests
	 * @param owner
	 * @param repo
	 */
	public static async ListAsync(owner: string, repo: string, state: 'open' | 'closed' | 'all'): Promise<PullRequest[]> {
		let response = await octokit.request('GET /repos/:owner/:repo/pulls', {
			owner: owner,
			repo: repo,
			state: state
		});

		if (response.status === 200) return response.data as unknown as PullRequest[];
		throw new Error(`Could not retrieve a list of pull requests from repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Create a pull request.
	 * https://docs.github.com/en/rest/reference/pulls#create-a-pull-request
	 * @param owner
	 * @param repo
	 * @param title
	 * @param head
	 * @param base
	 */
	public static async CreateAsync(owner: string, repo: string, title: string, head: string, base: string): Promise<PullRequest> {
		let response = await octokit.request('POST /repos/:owner/:repo/pulls', {
			owner: owner,
			repo: repo,
			title: title,
			head: head,
			base: base
		});

		if (response.status === 201) return response.data as unknown as PullRequest;
		throw new Error(`Could not create a pull request from branch "${head}" into branch "${base}" on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Update a pull request.
	 * https://docs.github.com/en/rest/reference/pulls#update-a-pull-request
	 * @param owner
	 * @param repo
	 * @param title
	 * @param body
	 * @param state
	 * @param base
	 */
	public async UpdateAsync(owner: string, repo: string, title?: string, body?: string, state?: 'open' | 'closed', base?: string): Promise<void> {
		let response = await octokit.request('PATCH /repos/:owner/:repo/pulls/:pull_number', {
			owner: owner,
			repo: repo,
			pull_number: this.id,
			title: title ?? this.title,
			body: body ?? this.body,
			state: state ?? this.state,
			base: base ?? this.base.label
		});

		if (response.status !== 200) throw new Error(`Could not update pull request ${this.id} from repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Add a reference to an issue.
	 * @param owner
	 * @param repo
	 * @param issue
	 */
	public async AddIssueReferenceAsync(owner: string, repo: string, issue: Issue): Promise<void> {
		let index: number = this.body.indexOf(footer);
		let ref: string = `    - This pull request will close #${issue.id} once merged into ${this.head.label}.\n`;

		if (index !== -1) {
			// Add reference to existing Creeper-bot section
			this.body = this.body.addTo(index - 1, ref);
		}

		else {
			// Create Creeper-bot section
			let section: string = '\n\n\n\n```' + `\n${header}\n${ref}\n${footer}\n` + '```\n\n';
			this.body += section;
		}

		await this.UpdateAsync(owner, repo);
	}

	public async RemoveIssueReferenceAsync(owner: string, repo: string, issue: Issue): Promise<void> {
		let index: number = this.body.indexOf(`#${issue.id}`);
		let ref: string = `    - This pull request will close #${issue.id} once merged into ${this.head.label}.\n`;

		if (index !== -1) {
			// Remove issue reference
			let start: number = this.body.indexOf(ref);
			this.body = this.body.remove(start, start + ref.length);
		}

		// No more referenced issues at this pull request
		if (this.body.indexOf('This pull request will close #') === -1) {
			let start: number = this.body.indexOf(header);
			let end: number = this.body.indexOf(footer) + footer.length;
			this.body = this.body.remove(start, end);
		}

		await this.UpdateAsync(owner, repo);
	}
}

export interface RequestedTeam {
	id: number;
	node_id: string;
	url: string;
	html_url: string;
	name: string;
	slug: string;
	description: string;
	privacy: string;
	permission: string;
	members_url: string;
	repositories_url: string;
	parent?: any;
}

export interface Permissions {
	admin: boolean;
	push: boolean;
	pull: boolean;
}

export interface Head {
	label: string;
	ref: string;
	sha: string;
	user: User;
	repo: Repository;
}

export interface Base {
	label: string;
	ref: string;
	sha: string;
	user: User;
	repo: Repository;
}

export interface Self {
	href: string;
}

export interface Html {
	href: string;
}

export interface IssueRef {
	href: string;
}

export interface Comments {
	href: string;
}

export interface ReviewComments {
	href: string;
}

export interface ReviewComment {
	href: string;
}

export interface Commits {
	href: string;
}

export interface Statuses {
	href: string;
}

export interface Links {
	self: Self;
	html: Html;
	issue: IssueRef;
	comments: Comments;
	review_comments: ReviewComments;
	review_comment: ReviewComment;
	commits: Commits;
	statuses: Statuses;
}

export interface PullRequest {
	url: string;
	id: number;
	node_id: string;
	html_url: string;
	diff_url: string;
	patch_url: string;
	issue_url: string;
	commits_url: string;
	review_comments_url: string;
	review_comment_url: string;
	comments_url: string;
	statuses_url: string;
	number: number;
	state: 'open' | 'closed';
	locked: boolean;
	title: string;
	user: User;
	body: string;
	labels: Label[];
	milestone: Milestone;
	active_lock_reason: string;
	created_at: Date;
	updated_at: Date;
	closed_at: Date;
	merged_at: Date;
	merge_commit_sha: string;
	assignee: User;
	assignees: User[];
	requested_reviewers: User[];
	requested_teams: RequestedTeam[];
	head: Head;
	base: Base;
	_links: Links;
	author_association: string;
	draft: boolean;
}