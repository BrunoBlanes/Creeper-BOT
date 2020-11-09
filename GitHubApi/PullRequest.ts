import { Octokit } from '../Services/Octokit';
import { Repository } from './Repository';
import { Installation } from './Webhook';
import { Mention, Commit } from './Push';
import { Milestone } from './Milestone';
import { Label } from './Label';
import { User } from './User';

import '../Extensions/Strings';
import '../Extensions/Arrays';

const keywords = [
	'fixed', 'fixes', 'fix',
	'closed', 'closes', 'close',
	'resolved', 'resolves', 'resolve'];
const regex: RegExp = /#[1-9][0-9]*/;

export class PullRequest {
	/**
	 * Get a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#get-a-pull-request
	 * @param owner
	 * @param repo
	 * @param number
	 */
	public static async GetAsync(owner: string, repo: string, number: number): Promise<PullRequest> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/pulls/:pull_number', {
			owner: owner,
			repo: repo,
			pull_number: number
		});

		if (response.status === 200) {
			return Object.assign(new PullRequest(), response.data);
		}

		throw new Error(`Could not retrieve pull request number ${number} from repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Create a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#create-a-pull-request
	 * @param owner
	 * @param repo
	 * @param head The name of the branch where your changes are implemented.
	 * @param title The title of the new pull request.
	 * @param body The contents of the pull request.
	 * @param draft Indicates whether the pull request is a draft.
	 */
	public static async CreateAsync(owner: string, repo: string, head: string, title: string, body: string, draft: boolean): Promise<PullRequest> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/pulls', {
			owner: owner,
			repo: repo,
			head: head,
			base: 'refs/heads/master',
			title: title,
			body: body,
			draft: draft
		});

		if (response.status === 201) {
			return Object.assign(new PullRequest(), response.data);
		}

		else if (response.status === 403) {
			throw new Error(`Creeper-bot does not have sufficient privileges to create a pull request at ${repo}.`);
		}

		throw new Error(`Could not create pull request on repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Update a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#update-a-pull-request
	 * @param head The name of the branch where your changes are implemented.
	 * @param title The title of the new pull request.
	 * @param body The contents of the pull request.
	 * @param draft Indicates whether the pull request is a draft.
	 */
	public async UpdateAsync(body: string | null, draft?: boolean): Promise<PullRequest> {
		let response = await Octokit.Client.request('PATCH /repos/:owner/:repo/pulls/:pull_number', {
			owner: this.base.repo.owner.login,
			repo: this.base.repo.name,
			pull_number: this.number,
			body: body != null ? body : this.body,
			draft: draft
		});

		if (response.status === 20) {
			return Object.assign(new PullRequest(), response.data);
		}

		else if (response.status === 403) {
			throw new Error(`Creeper-bot does not have sufficient privileges to update a pull request at ${this.base.repo.name}.`);
		}

		throw new Error(`Could not update pull request ${this.number} on repository "${this.base.repo.name}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * List pull requests
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#list-pull-requests
	 * @param owner
	 * @param repo
	 * @param head Filter pulls by head user or head organization and branch name in the format of user:ref-name or organization:ref-name.
	 * @param base Filter pulls by base branch name. Example: gh-pages.
	 */
	public static async ListAsync(owner: string, repo: string, head?: string, base?: string): Promise<PullRequest[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/pulls', {
			owner: owner,
			repo: repo,
			head: head,
			base: base
		});

		if (response.status === 200) {
			let pullRequests: PullRequest[] = [];

			for (let pullRequest of response.data) {
				pullRequests.push(Object.assign(new PullRequest(), pullRequest));
			}

			return pullRequests;
		}

		throw new Error(`Could not retrieve a list of pull requests from repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Request reviewer for a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#request-reviewers-for-a-pull-request
	 * @param reviewer The user login that will be requested.
	 */
	public RequestReviewAsync(reviewer: string): Promise<PullRequest> {
		return this.RequestReviewersAsync([reviewer]);
	}

	/**
	 * Request reviewers for a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#request-reviewers-for-a-pull-request
	 * @param reviewers An array of user logins that will be requested.
	 */
	public async RequestReviewersAsync(reviewers: string[]): Promise<PullRequest> {
		let response = await Octokit.Client.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
			owner: this.base.repo.owner.login,
			repo: this.base.repo.name,
			reviewers: reviewers
		});

		if (response.status === 201) {
			return Object.assign(new PullRequest(), response.data);
		}

		else if (response.status === 403) {
			throw new Error(`Creeper-bot does not have sufficient privileges to reques reviewers at ${this.base.repo.name}.`);
		}

		throw new Error(`Could not request review for pull request ${this.number}.\n Octokit returned error ${response.status}.`);
	}

	/**
	 * List commits on a pull request
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#list-commits-on-a-pull-request
	 */
	public async GetCommitsAsync(): Promise<Commit[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/pulls/:pull_number/commits', {
			owner: this.base.repo.owner.login,
			repo: this.base.repo.name,
			pull_number: this.number
		})

		if (response.status === 200) {
			let commits: Commit[] = [];

			for (let commit of response.data) {
				commits.push(Object.assign(new Commit(), commit.commit));
			}

			return commits;
		}

		throw new Error(`Could not retrieve the list of commits from pull request ${this.number}.\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Merge a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#merge-a-pull-request
	 * @param title Title for the automatic commit message.
	 * @param message Extra detail to append to automatic commit message.
	 * @param method Merge method to use. Possible values are merge, squash or rebase. Default is merge.
	 */
	public async MergeAsync(title: string, method: 'merge' | 'squash' | 'rebase'): Promise<void> {
		let response = await Octokit.Client.request('PUT /repos/:owner/:repo/pulls/:pull_number/merge', {
			owner: this.base.repo.owner.login,
			repo: this.base.repo.name,
			pull_number: this.number,
			commit_title: title,
			merge_method: method
		});

		if (response.status !== 200) {
			throw new Error(`Could not merge pull request ${this.number}.\n Octokit returned error ${response.status}.`);
		}
	}

	/** Return a list with all the issues mentioned. */
	public GetMentions(): Mention[] {
		let message: string = this.body.toLowerCase().replace('\n', ' ');
		let match: RegExpMatchArray = message.match(regex);
		let mentions: Mention[] = [];

		while (match !== null) {
			let resolved: boolean = false;

			for (let keyword of keywords) {

				// Look for a closing keyword in the commit message up until the issue mention
				let keywordIndex: number = message.lookup(keyword, undefined, match.index);

				if (keywordIndex !== -1) {

					// Keyword was used just before issue was mentioned
					if ((keywordIndex + keyword.length) === (match.index - 1)) {
						resolved = true;
						break;
					}
				}
			}

			// Add keyword index to array
			mentions.skipDuplicatePush(new Mention(+match[0].remove(0, 1), resolved));

			// Trim the message to remove the current match
			message = message.substring(match.index + match[0].length);

			// Look for the next match
			match = message.match(regex);
		}

		return mentions;
	}
}

export class PullRequestEvent {
	constructor(jsonPayload: PullRequestEvent) {
		this.pull_request = Object.assign(new PullRequest(), jsonPayload.pull_request);
		this.repository = Object.assign(new Repository(), jsonPayload.repository);

		this.action = jsonPayload.action;
		this.number = jsonPayload.number;
		this.sender = jsonPayload.sender;
		this.installation = jsonPayload.installation;
	}
}

export interface PullRequestEvent {
	action: string;
	number: number;
	pull_request: PullRequest;
	repository: Repository;
	sender: User;
	installation: Installation;
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
	state: string;
	locked: boolean;
	title: string;
	user: User;
	body: string;
	labels: Label[];
	milestone: Milestone;
	active_lock_reason: string;
	created_at: Date;
	updated_at: Date;
	closed_at?: Date;
	merged_at?: Date;
	merge_commit_sha?: string;
	assignee?: User;
	assignees: User[];
	requested_reviewers: User[];
	requested_teams: Team[];
	head: Head;
	base: Base;
	author_association: string;
	draft: boolean;
	merged: boolean;
	mergeable?: boolean;
	rebaseable?: boolean;
	mergeable_state: string;
	merged_by?: User;
	comments: number;
	review_comments: number;
	maintainer_can_modify: boolean;
	commits: number;
	additions: number;
	deletions: number;
	changed_files: number;
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

export interface Team {
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
}