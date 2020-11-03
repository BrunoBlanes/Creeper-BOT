import { PullRequest } from './PullRequest';
import { Reference } from './Reference';
import { Milestone } from './Milestone';
import { Release } from './Release';
import { Project } from './Project';
import { Issue } from './Issue';
import { User } from './User';
import '../Extensions/Arrays';

export class Repository {
	/** Return a list of milestones for the current repo. */
	public ListMilestonesAsync(): Promise<Milestone[]> {
		return Milestone.ListAsync(this.owner.login, this.name);
	}

	/**
	 * Get an issue.
	 * @param issueId The issue id.
	 */
	public async GetIssueAsync(issueId: number): Promise<Issue> {
		let issue: Issue = await Issue.GetAsync(this.owner.login, this.name, issueId);
		issue.repository = this;
		return issue;
	}

	/**
	 * Return a project by name.
	 * @param name The name of the project.
	 */
	public async GetProjectAsync(name: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<Project> {
		let projects: Project[] = await Project.ListAsync(this.owner.login, this.name, state);
		return projects.find((project: Project) => project.name === name);
	}

	/**
	 * Create a pull request.
	 * @param head The name of the branch where your changes are implemented.
	 * @param base The name of the branch you want the changes pulled into.
	 * @param title The title of the new pull request.
	 * @param body The contents of the pull request.
	 */
	public CreatePullRequestAsync(head: string, base: string, title: string, body: string): Promise<PullRequest> {
		return PullRequest.CreateAsync(this.owner.login, this.name, head, base, title, body);
	}

	/**
	 * List pull resquests.
	 * @param head Filter pulls by head user or head organization and branch name in the format of user:ref-name or organization:ref-name.
	 * @param base Filter pulls by base branch name. Example: gh-pages.
	 */
	public ListPullRequestsAsync(head: string, base: string): Promise<PullRequest[]> {
		return PullRequest.ListAsync(this.owner.login, this.name, head, base);
	}

	/**
	 * Lists the projects in this repository.
	 * @param state Indicates the state of the projects to return.
	 */
	public ListProjectsAsync(state: 'open' | 'closed' | 'all' = 'open'): Promise<Project[]> {
		return Project.ListAsync(this.owner.login, this.name, state);
	}

	/** Gets the latest release in this repository. */
	public async GetLatestReleaseAsync(): Promise<Release> {
		return (await Release.ListAsync(this.owner.login, this.name)).first();
	}

	/** Gets the latest references in this repository. */
	public async GetLatestReferenceAsync(ref?: string): Promise<Reference> {
		return (await Reference.ListAsync(this.owner.login, this.name, ref)).last();
	}

	/**
	 * Create a new reference.
	 * @param ref The name of the fully qualified reference (ie: refs/heads/master). If it doesn't start with 'refs' and have at least two slashes, it will be rejected.
	 * @param sha The SHA1 value for this reference.
	 */
	public CreateReferenceAsync(ref: string, sha: string): Promise<Reference> {
		return Reference.CreateAsync(this.owner.login, this.name, ref, sha);
	}
}

export interface Repository {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	owner: User;
	private: boolean;
	html_url: string;
	description: string;
	fork: boolean;
	url: string;
	archive_url: string;
	assignees_url: string;
	blobs_url: string;
	branches_url: string;
	collaborators_url: string;
	comments_url: string;
	commits_url: string;
	compare_url: string;
	contents_url: string;
	contributors_url: string;
	deployments_url: string;
	downloads_url: string;
	events_url: string;
	forks_url: string;
	git_commits_url: string;
	git_refs_url: string;
	git_tags_url: string;
	git_url: string;
	issue_comment_url: string;
	issue_events_url: string;
	issues_url: string;
	keys_url: string;
	labels_url: string;
	languages_url: string;
	merges_url: string;
	milestones_url: string;
	notifications_url: string;
	pulls_url: string;
	releases_url: string;
	ssh_url: string;
	stargazers_url: string;
	statuses_url: string;
	subscribers_url: string;
	subscription_url: string;
	tags_url: string;
	teams_url: string;
	trees_url: string;
	clone_url: string;
	mirror_url: string;
	hooks_url: string;
	svn_url: string;
	homepage: string;
	language?: any;
	forks_count: number;
	stargazers_count: number;
	watchers_count: number;
	size: number;
	default_branch: string;
	open_issues_count: number;
	is_template: boolean;
	topics: string[];
	has_issues: boolean;
	has_projects: boolean;
	has_wiki: boolean;
	has_pages: boolean;
	has_downloads: boolean;
	archived: boolean;
	disabled: boolean;
	visibility: string;
	pushed_at: Date;
	created_at: Date;
	updated_at: Date;
	permissions: Permissions;
	allow_rebase_merge: boolean;
	template_repository?: any;
	temp_clone_token: string;
	allow_squash_merge: boolean;
	delete_branch_on_merge: boolean;
	allow_merge_commit: boolean;
	subscribers_count: number;
	network_count: number;
	license: License;
	organization: User;
	parent: Repository;
	source: Repository;
}

interface Permissions {
	pull: boolean;
	triage: boolean;
	push: boolean;
	maintain: boolean;
	admin: boolean;
}

interface License {
	key: string;
	name: string;
	spdx_id: string;
	url: string;
	node_id: string;
}