import { Repository } from './Repository';
import { Issue, Label } from './Issue';
import { Commit } from './Commit';
import { Card } from './Project';
import { User } from './User';

export interface EventPayload {
	action: string;
	sender: User;
	repository: Repository;
	organization: User;
	installation: any;
	issue?: Issue;
	label?: Label;
	project_card?: Card;
	commits?: Commit[];
	pusher?: User;
	ref?: string;
}