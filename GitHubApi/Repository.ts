import { Milestone } from './Milestone';
import { Project } from './Project';
import { Issue } from './Issue';
import { User } from './User';

export class Repository {
	/** Return a list of milestones for the current repo. */
	public async ListMilestonesAsync(): Promise<Milestone[]> {
		return await Milestone.ListAsync(this.owner.login, this.name);
	}

	/**
	 * Get an issue.
	 * @param issueId The issue id.
	 */
	public async GetIssueAsync(issueId: number): Promise<Issue> {
		return await Issue.GetAsync(this.owner.login, this.name, issueId);
	}

	/**
	 * Return a project by name.
	 * @param name The name of the project.
	 */
	public async GetProjectAsync(name: string): Promise<Project> {
		let projects: Project[] = await Project.ListAsync(this.owner.login, this.name);
		for (let project of projects) {
			if (project.name === name) {
				return Object.assign(new Project(), project);
			}
		}

		return null;
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