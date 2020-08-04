import { HttpClient } from '../Services';
import { User } from './User';

const keywords = ['closed', 'closes', 'close', 'fixed', 'fixes', 'fix', 'resolved', 'resolves', 'resolve'];

export class Commit {
	/**
	 * List commits
	 * https://docs.github.com/en/rest/reference/repos#list-commits
	 * @param url
	 * @param installationId
	 */
	public static async ListAsync(url: string, installationId: string): Promise<Array<Commit>> {
		return await HttpClient.GetAsync<Array<Commit>>(url, installationId);
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

module.exports = {
	GetIssueNumbersFromCommits: async function (commits) {
		let issueNumbers = [];

		// Loop through every commit in this push
		for (var i = 0; i < commits.length; i++) {
			let commitMessage = commits[i]['message'].toLowerCase();
			let keywordIndexes = [];

			// Loop through all the known keywords
			for (var j = 0; j < keywords.length; j++) {
				let keywordIndex = commitMessage.indexOf(keywords[j]);

				// Found keyword
				while (keywordIndex !== -1) {

					// Add keyword index to array
					pushToArray(keywordIndex, keywordIndexes);

					// Keep looking through the commit comment for the same keyword
					keywordIndex = commitMessage.indexOf(keywords[j], keywordIndex + keywords[j].length);
				}
			}

			// Sorts the index array as crescent
			keywordIndexes.sort(function (a, b) {
				return a - b;
			});

			// Loop through all the saved indexes
			for (var j = 0; j < keywordIndexes.length; j++) {

				// Ignore message before the keyword index
				let message = commitMessage.substring(keywordIndexes[j]);

				// Regex match the issue number
				let issue = message.match(/#[1-9][0-9]*/);

				if (issue) {
					let issueNumber = issue[0].substring(1);

					// Add keyword index to array
					pushToArray(issueNumber, issueNumbers);
				}
			}
		}

		return issueNumbers;
	},
};

function pushToArray(item, array) {
	// Add item to array when empty
	if (array.length == 0) {
		array.push(item);
	} else {
		for (var k = 0; k < array.length; k++) {

			// Don't add if already added before
			if (array[k] == item) {
				break;
			} else if (k == array.length - 1) {
				array.push(item);
			}
		}
	}
}