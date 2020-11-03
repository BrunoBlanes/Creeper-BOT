import '../Extensions/Strings';
import '../Extensions/Arrays';

import { Repository } from './Repository';
import { Installation } from './Webhook';
import { User } from './User';

const keywords = [
	'fixed', 'fixes', 'fix',
	'closed', 'closes', 'close',
	'resolved', 'resolves', 'resolve'];
const regex: RegExp = /#[1-9][0-9]*/;

export class Commit {

/** Return a list with all the issues mentioned. */
	public GetMention(): Mention | null {
		let message: string = this.message.toLowerCase().replace('\n', ' ');
		let match: RegExpMatchArray = message.match(regex);

		// Issue mention found
		while (match !== null) {

			for (let keyword of keywords) {

				// Look for the first closing keyword in the commit message
				let keywordIndex: number = message.lookup(keyword, undefined, match.index);

				// Keyword found
				if (keywordIndex !== -1) {

					// Keyword was used just before issue was mentioned
					if ((keywordIndex + keyword.length) === (match.index - 1)) {

						// Return a closed issue mention
						return new Mention(+match[0].remove(0, 1), true);
					}
				}
			}

			// Return an open issue mention
			return new Mention(+match[0].remove(0, 1), false);
		}

		return null;
	}
}

export class Mention {
	content_id: number;
	resolved: boolean;

	constructor(content_id: number, resolved: boolean) {
		this.content_id = content_id;
		this.resolved = resolved;
	}
}

export class PushEvent {
	constructor(jsonPayload?: PushEvent) {
		this.head_commit = Object.assign(new Commit(), jsonPayload.head_commit);
		this.repository = Object.assign(new Repository(), jsonPayload.repository);
		this.commits = [];

		for (let commit of jsonPayload.commits) {
			this.commits.push(Object.assign(new Commit(), commit));
		}

		this.ref = jsonPayload.ref;
		this.before = jsonPayload.before;
		this.after = jsonPayload.after;
		this.created = jsonPayload.created;
		this.deleted = jsonPayload.deleted;
		this.forced = jsonPayload.forced;
		this.base_ref = jsonPayload.base_ref;
		this.compare = jsonPayload.compare;
		this.pusher = jsonPayload.pusher;
		this.sender = jsonPayload.sender;
		this.installation = jsonPayload.installation;
	}
}

export interface PushEvent {
	ref: string;
	before: string;
	after: string;
	created: boolean;
	deleted: boolean;
	forced: boolean;
	base_ref?: any;
	compare: string;
	commits: Commit[];
	head_commit?: Commit;
	repository: Repository;
	pusher: Author;
	sender: User;
	installation: Installation;
}

export interface Commit {
	id: string;
	tree_id: string;
	distinct: boolean;
	message: string;
	timestamp: Date;
	url: string;
	author: Author;
	committer: Author;
	added: string[];
	removed: string[];
	modified: string[];
}

export interface Author {
	name: string;
	email: string;
	date?: Date;
}