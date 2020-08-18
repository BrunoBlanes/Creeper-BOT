import { User } from './User';

const keywords = [
	'fixed', 'fixes', 'fix',
	'closed', 'closes', 'close',
	'resolved', 'resolves', 'resolve'];
const regex = new RegExp('/#[1-9][0-9]*/');

export class Commit {
	/** Check if there is a mention to an issue in the commit message. */
	public IsIssueMentioned(): boolean {
		return this.commit.message.match(regex) === null ? false : true;
	}

	/** Return a list with all the issues mentioned. */
	public GetMentions(): [number, boolean][] {
		let message: string = this.commit.message.toLowerCase();
		let match: RegExpMatchArray = message.match(regex);
		let mentions: [number, boolean][];

		// Issue mention found
		while (match !== null) {
			let resolved: boolean = false;

			for (let keyword of keywords) {

				// Look for a closing keyword in the commit message up until the issue mention
				let keywordIndex: number = message.indexOf(keyword, undefined, match.index);

				if (keywordIndex !== -1) {

					// Keyword was used just before issue was mentioned
					if ((keywordIndex + keyword.length) === match.index - 2) {
						resolved = true;
						break;
					}
				}
			}

			// Add keyword index to array
			mentions.skipDuplicatePush([+match[0], resolved]);

			// Trim the message to remove the current match
			message = message.substring(match.index + match[0].length);

			// Look for the next match
			match = message.match(regex);
		}

		return mentions;
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