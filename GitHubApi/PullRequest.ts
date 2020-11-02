import { Octokit } from '../Services/Octokit';
import { Repository } from './Repository';
import { Milestone } from './Milestone';
import { Label } from './Label';
import { User } from './User';

export class PullRequest {
	/**
	 * Create a pull request.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#create-a-pull-request
	 * @param owner
	 * @param repo
	 * @param head The name of the branch where your changes are implemented.
	 * @param base The name of the branch you want the changes pulled into.
	 * @param title The title of the new pull request.
	 * @param body The contents of the pull request.
	 */
	public static async CreateAsync(owner: string, repo: string, head: string, base: string, title: string, body: string): Promise<void> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/pulls', {
			owner: owner,
			repo: repo,
			head: head,
			base: base,
			title: title,
			body: body
		});

		if (response.status === 403) {
			throw new Error(`Creeper-bot does not have sufficient privileges to create a pull request at ${repo}.`);
		}

		throw new Error(`Could not create pull request on repository "${repo}".\n Octokit returned error ${response.status}.`);
	}
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
	closed_at: Date;
	merged_at: Date;
	merge_commit_sha: string;
	assignee: User;
	assignees: User[];
	requested_reviewers: User[];
	requested_teams: Team[];
	head: Head;
	base: Base;
	author_association: string;
	draft: boolean;
	merged: boolean;
	mergeable: boolean;
	rebaseable: boolean;
	mergeable_state: string;
	merged_by: User;
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