import '../Extensions/Strings';
import '../Extensions/Arrays';
import { User } from './User';

const keywords = [
	'fixed', 'fixes', 'fix',
	'closed', 'closes', 'close',
	'resolved', 'resolves', 'resolve'];
const regex: RegExp = /#[1-9][0-9]*/;

export class Push {

/** Return a list with all the issues mentioned. */
	public GetMentions(): Mention[] {
		let message: string = this.message.toLowerCase();
		let match: RegExpMatchArray = message.match(regex);
		let mentions: Mention[] = [];

		// Issue mention found
		while (match !== null) {
			let resolved: boolean = false;

			for (let keyword of keywords) {

				// Look for a closing keyword in the commit message up until the issue mention
				let keywordIndex: number = message.lookup(keyword, undefined, match.index);

				if (keywordIndex !== -1) {

					// Keyword was used just before issue was mentioned
					if ((keywordIndex + keyword.length) === (match.index - 1)) {
						resolved = true;
						break;
					}
				}
			}

			// Add keyword index to array
			mentions.skipDuplicatePush(new Mention(+match[0].remove(0, 1), resolved));

			// Trim the message to remove the current match
			message = message.substring(match.index + match[0].length);

			// Look for the next match
			match = message.match(regex);
		}

		return mentions;
	}
}

export class Mention {
	constructor(content_id: number, resolved: boolean) {
		this.content_id = content_id;
		this.resolved = resolved;
	}
}

export interface Commit {
	url: string;
	sha: string;
	node_id: string;
	html_url: string;
	comments_url: string;
	commit: CommitData;
	author: User;
	committer: User;
	parents: Parent[];
}

export interface Author {
	name: string;
	email: string;
	date: Date;
}

export interface Committer {
	name: string;
	email: string;
	date: Date;
}

export interface Tree {
	url: string;
	sha: string;
}

export interface Verification {
	verified: boolean;
	reason: string;
	signature?: any;
	payload?: any;
}

export interface CommitData {
	url: string;
	author: Author;
	committer: Committer;
	message: string;
	tree: Tree;
	comment_count: number;
	verification: Verification;
}

export interface Parent {
	url: string;
	sha: string;
}

export interface Push {
	id: string;
	tree_id: string;
	distinct: boolean;
	message: string;
	timestamp: Date;
	url: string;
	author: Author;
	committer: Committer;
	added: any[];
	removed: string[];
	modified: string[];
}

export interface Mention {
	content_id: number;
	resolved: boolean;
}