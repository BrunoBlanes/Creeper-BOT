import { Repository } from './Repository';
import { Issue, Label } from './Issue';
import { Card } from './Project';
import { Push } from './Commit';
import { User } from './User';

export class EventPayload {

	constructor(jsonPayload: EventPayload) {
		this.action = jsonPayload.action;
		this.sender = jsonPayload.sender;
		this.repository = Object.assign(new Repository(), jsonPayload.repository);
		this.organization = jsonPayload.organization;
		this.installation = jsonPayload.installation;
		this.issue = Object.assign(new Issue(), jsonPayload.issue);
		this.label = jsonPayload.label;
		this.project_card = Object.assign(new Card(), jsonPayload.project_card);

		if (jsonPayload.commits != null) {
			this.commits = [];
			jsonPayload.commits.forEach(push => {
				this.commits.push(Object.assign(new Push(), push));
			});
		}

		this.pusher = jsonPayload.pusher;
		this.before = jsonPayload.before;
		this.ref = jsonPayload.ref;
	}
}

export interface Installation {
	id: number;
	node_id: string;
}

export interface EventPayload {
	action: string;
	sender: User;
	repository: Repository;
	organization: User;
	installation: Installation;
	issue?: Issue;
	label?: Label;
	project_card?: Card;
	commits?: Push[];
	pusher?: User;
	ref?: string;
	before?: string;
}