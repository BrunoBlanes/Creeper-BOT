import { Repository } from './Repository';
import { Issue, Label } from './Issue';
import { User } from './User';

export interface Payload {
	action: string;
	sender: User;
	repository: Repository;
	organization: User;
	installation: any;
	issue?: Issue;
	label?: Label;
}