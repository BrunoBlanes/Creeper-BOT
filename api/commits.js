var httpClient = require(__dirname + '/../functions/httpClient');

const keywords = ['closed', 'closes', 'close', 'fixed', 'fixes', 'fix', 'resolved', 'resolves', 'resolve'];

module.exports = {
	// Returns an array of commits from the url
	GetCommits: async function (commitsUrl, installationId) {
		body = JSON.parse(await httpClient.Get(commitsUrl, installationId));
		return body;
	},

	GetIssueNumbersFromCommits: async function (commits) {
		let issueNumbers = [];

		// Loop through every commit in this push
		for (var i = 0; i < commits.length; i++) {
			let commitMessage = commits[i]['commit']['message'].toLowerCase();
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
				let issueNumber = issue[0].substring(1);

				// Add keyword index to array
				pushToArray(issueNumber, issueNumbers);
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