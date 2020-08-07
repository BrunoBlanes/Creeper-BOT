import { Repository } from './Repository';
import { Issue, Label } from './Issue';
import { User } from './User';
import { Card } from './Project';

export interface Payload {
	action: string;
	sender: User;
	repository: Repository;
	organization: User;
	installation: any;
	issue?: Issue;
	label?: Label;
	project_card?: Card;
}