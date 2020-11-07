import { PullRequest } from './PullRequest';
import { Repository } from './Repository';
import { Installation } from './Webhook';
import { Commit } from './Push';
import { User } from './User';

export class CheckSuite {
	constructor(jsonPayload: CheckSuite) {
		this.pull_requests = [];
		jsonPayload.pull_requests.forEach((pullRequest: PullRequest) => {
			this.pull_requests.push(Object.assign(new PullRequest(), pullRequest));
		});

		this.head_commit = Object.assign(new Commit(), jsonPayload.head_commit);

		this.id = jsonPayload.id;
		this.node_id = jsonPayload.node_id;
		this.head_branch = jsonPayload.head_branch;
		this.head_sha = jsonPayload.head_sha;
		this.status = jsonPayload.status;
		this.conclusion = jsonPayload.conclusion;
		this.url = jsonPayload.url;
		this.before = jsonPayload.before;
		this.after = jsonPayload.after;
		this.app = jsonPayload.app;
		this.created_at = jsonPayload.created_at;
		this.updated_at = jsonPayload.updated_at;
		this.latest_check_runs_count = jsonPayload.latest_check_runs_count;
		this.check_runs_url = jsonPayload.check_runs_url;
	}
}

export class CheckSuiteEvent {
	constructor(jsonPayload: CheckSuiteEvent) {
		this.repository = Object.assign(new Repository(), jsonPayload.repository);
		this.check_suite = new CheckSuite(jsonPayload.check_suite);
		this.installation = jsonPayload.installation;
		this.action = jsonPayload.action;
		this.sender = jsonPayload.sender;
	}
}

export interface CheckSuiteEvent {
	action: string;
	check_suite: CheckSuite;
	repository: Repository;
	sender: User;
	installation: Installation;
}

export interface CheckSuite {
	id: number;
	node_id: string;
	head_branch: string;
	head_sha: string;
	status: string;
	conclusion: string;
	url: string;
	before: string;
	after: string;
	pull_requests: PullRequest[];
	app: App;
	created_at: Date;
	updated_at: Date;
	latest_check_runs_count: number;
	check_runs_url: string;
	head_commit: Commit;
}

export interface Permissions {
	administration: string;
	checks: string;
	contents: string;
	deployments: string;
	issues: string;
	members: string;
	metadata: string;
	organization_administration: string;
	organization_hooks: string;
	organization_plan: string;
	organization_projects: string;
	organization_user_blocking: string;
	pages: string;
	pull_requests: string;
	repository_hooks: string;
	repository_projects: string;
	statuses: string;
	team_discussions: string;
	vulnerability_alerts: string;
}

export interface App {
	id: number;
	node_id: string;
	owner: User;
	name: string;
	description: string;
	external_url: string;
	html_url: string;
	created_at: Date;
	updated_at: Date;
	permissions: Permissions;
	events: any[];
}