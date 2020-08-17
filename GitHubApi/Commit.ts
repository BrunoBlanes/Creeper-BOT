import { User } from './User';
import { Issue } from './Issue';

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

	// TODO: Merge get mention methos into one using tuple
	public GetMentions(): [number, boolean][] {
		let message: string = this.commit.message.toLowerCase();
		let mentions: [number, boolean][];

		// Loop through all the known keywords
		keywords.forEach(keyword => {
			let keywordIndex = message.indexOf(keyword);

			while (keywordIndex !== -1) {

				// Ignore message before the keyword index
				let comment = message.substring(keywordIndex);

				// Regex match the issue number
				let match = comment.match(regex);

				if (match) {
					let issueNumber: number = +match[0].substring(keywordIndex);

					// Add keyword index to array
					mentions.skipDuplicatePush([issueNumber, true]);
				}

				// Keep looking through the commit message for the same keyword
				keywordIndex = message.indexOf(keyword, keywordIndex + keyword.length);
			}
		});

		return mentions;
	}

	public GetUnresolvedMentions(): number[] {
		let resolvedIssues: number[] = this.GetResolvedMentions();
		let resolvedIssuesLength: number = resolvedIssues.length;
		let message: string = this.commit.message.toLowerCase();
		let keywordIndex = message.indexOf('#');
		let issueNumbers: number[];

		while (keywordIndex !== -1) {

			// Ignore message before the keyword index
			let comment = message.substring(keywordIndex);

			// Regex match the issue number
			let match = comment.match(regex);

			if (match) {
				let issueNumber: number = +match[0].substring(keywordIndex);
				resolvedIssues.skipDuplicatePush(issueNumber);

				// If the length is greater then the mention is new
				if (resolvedIssuesLength < resolvedIssues.length) {

					// Add keyword index to array
					issueNumbers.skipDuplicatePush(issueNumber);
				}
			}

			// Keep looking through the commit message
			keywordIndex = message.indexOf('#', keywordIndex + 1);
		}

		if (issueNumbers.length === 0) return null;
		else return issueNumbers;
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