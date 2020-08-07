import { User } from './User';
import { Issue } from './Issue';
import { Repository } from './Repository';


export interface Payload {
	action: string;
	sender: User;
	repository: Repository;
	organization: User;
	installation: any;
	issue?: Issue;
}