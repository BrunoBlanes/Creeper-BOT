'use strict';
var http = require('http');

var githook = require('./functions/githook');
var projects = require('./api/projects');
var issues = require('./api/issues');
var cards = require('./api/cards');
var port = process.env.PORT || 1337;

// Project's "Triage" column id
const project = {
	IOS: 8474386,
	API: 8474435,
	WASM: 8474431,
	ANDROID: 8474424,
	WINDOWS: 8474428,
};

http.createServer(function (req, res) {

	// Only accept on POST requests
	if (req.method == 'POST') {
		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', async () => {

			// Validates webhook secret and reject if invalid
			if (await githook.ValidateSecret(body, req.headers['x-hub-signature'])) {

				// Parse as json
				body = JSON.parse(body);
				let installationId = body['installation']['id'];

				// Handle events related to issues
				if (req.headers['x-github-event'] == 'issues') {
					let reposUrl = body['issue']['repository_url'];
					let labels = body['issue']['labels'];
					let issueUrl = body['issue']['url'];
					let issueId = body['issue']['id'];

					// New issue opened
					if (body['action'] == 'opened') {

						// Assigns label 'Triage' to issue
						logSection('ASSIGN LABEL "TRIAGE" TO NEW ISSUE');
						let response = await issues.AssignLabelsToIssue(['Triage'], issueUrl, installationId);
						console.log(response);

						// Assigns myself to this issue
						logSection('ASSIGN USER "BRUNO BLANES" TO NEW ISSUE');
						response = await issues.AssignUserToIssue('BrunoBlanes', reposUrl, issueUrl, installationId);
						console.log(response);

						for (var i = 0; i < labels.length; i++) {
							logSection('CREATE A PROJECT CARD FOR THIS ISSUE');

							// Assigns this issue to the 'WebAssembly' project
							if (labels[i]['name'] == 'Identity' || labels[i]['name'] == 'WebAssembly') {
								response = await cards.CreateFromIssue(issueId, project.WASM, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'Server' project
							} else if (labels[i]['name'] == 'API' || labels[i]['name'] == 'Database') {
								response = await cards.CreateFromIssue(issueId, project.API, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'Windows' project
							} else if (labels[i]['name'] == 'Windows') {
								response = await cards.CreateFromIssue(issueId, project.WINDOWS, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'Android' project
							} else if (labels[i]['name'] == 'Android') {
								response = await cards.CreateFromIssue(issueId, project.ANDROID, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'iOS' project
							} else if (labels[i]['name'] == 'iOS') {
								response = await cards.CreateFromIssue(issueId, project.IOS, installationId);
								console.log(response);
								break;
							}
						}

					// Label was added to this issue
					} else if (body['action'] == 'labeled') {
						// Found label 'Awaiting Pull Request'
						if (body['label']['name'] == 'Awaiting Pull Request') {
							logSection(`MOVE CARD TO COLUMN "DONE"`);
							let columnName = '';

							try {
								columnName = getColumnName(body['issue']);
							} catch (err) {
								console.log(err);
							}

							var projectName = getAssignedProject(body['issue']['labels']);
							await cards.MoveCardToColumn(columnName, 'Done', projectName, issueUrl, reposUrl, installationId);
						}

					// Handle issue being closed
					} else if (body['action'] == 'closed') {
						response = await issues.RemoveLabel(['Awaiting Pull Request', issueUrl, installationId]);
						console.log(response);
					}

				// Handle project card events
				} else if (req.headers['x-github-event'] == 'project_card') {

					// If card is related to an issue
					if (body['project_card']['content_url']) {
						logSection(`UPDATE AN ISSUE WHO'S CARD WAS MOVED`);
						let issueUrl = body['project_card']['content_url'];
						let columnUrl = body['project_card']['column_url'];
						let labelsUrl = body['repository']['labels_url'].replace('{/name}', '');
						let milestonesUrl = body['repository']['milestones_url'].replace('{/number}', '');

						// Get's the current project's column name
						let columnName = await projects.GetColumnName(columnUrl, installationId);

						// Moved to column 'Triage'
						if (columnName == 'Triage') {
							let response = await issues.ToTriage(issueUrl, labelsUrl, installationId);
							console.log(response);

						// Moved to column 'In progress'
						} else if (columnName == 'In progress') {
							let response = await issues.ToWorking(issueUrl, labelsUrl, installationId);
							console.log(response);

						// Moved to column 'Done'
						} else if (columnName == 'Done') {
							let response = await issues.ToDone(issueUrl, labelsUrl, installationId);
							console.log(response);

						// Moved to a milestone column
						} else {
							let response = await issues.ToMilestone(columnName, milestonesUrl, issueUrl, labelsUrl, installationId);
							console.log(response);
						}
					}

				// Handle pull request events
				} else if (req.headers['x-github-event'] == 'push') {
					const keywords = ['closed', 'closes', 'close', 'fixed', 'fixes', 'fix', 'resolved', 'resolves', 'resolve'];
					let issueUrl = body['repository']['issues_url'].replace('{/number}', '');
					let commits = body['commits'];

					// Loop through every commit in this push
					for (var i = 0; i < commits.length; i++) {
						let commitMessage = commits[i]['message'].toLowerCase();
						let keywordIndexes = [];

						// Loop through all the known keywords
						for (var j = 0; j < keywords.length; j++) {
							let keywordIndex = commitMessage.indexOf(keywords[j]);

							// Found keyword
							while (keywordIndex !== -1) {

								// Just add if array is empty
								if (keywordIndexes.length == 0) {
									keywordIndexes.push(keywordIndex);
								} else {
									for (var k = 0; k < keywordIndexes.length; k++) {

										// Only add if not already added (could happen)
										if (keywordIndexes[k] == keywordIndex) {
											break;
										} else if (k == keywordIndexes.length - 1) {
											keywordIndexes.push(keywordIndex);
										}
									}
								}

								// Keep looking through the commit comment for the same keyword
								keywordIndex = commitMessage.indexOf(keywords[j], keywordIndex + keywords[j].length);
							}
						}

						keywordIndexes.sort(function (a, b) {
							return a - b;
						});

						for (var j = 0; j < keywordIndexes.length; j++) {

							// Keyword is present in commit message
							let message = commitMessage.substring(keywordIndexes[j]);
							let issue = message.match(/#[1-9][0-9]*/g);
							let issueNumber = issue[0].substring(1);

							// Add label 'Awaiting Pull Request' to issues with keywords
							logSection(`ADDING LABEL "AWAITING PULL REQUEST" TO ISSUE #${issueNumber}`);
							let response = await issues.AssignLabelsToIssue(['Awaiting Pull Request'], issueUrl + `/${issueNumber}`, installationId);
							console.log(response);
						}
					}
				}
			}
		});

		res.end();
	} else {
		res.writeHeader(200, { 'Content-Type': 'text/html' });
		res.write('<p>Creeper-Bot is a bot created by Bruno Blanes to automate his personal GitHub account.<p>You can find more about him at <a href="https://github.com/BrunoBlanes/Creeper-Bot/">https://github.com/BrunoBlanes/Creeper-Bot/</a>', 'text/html; charset=utf-8');
		res.end();
	}
}).listen(port);

// Adds a cool section divider to the log
function logSection(title) {
	const maxSize = 115;
	var textSize = title.length + 4;
	var margin = '='.repeat((maxSize - textSize) / 2);
	console.log('\n\n\x1b[36m ' + '='.repeat(maxSize));
	if ((margin.length * 2 + textSize) % 2 == 0) {
		console.log(` ${margin}  ${title}  ${margin}=`);
	} else {
		console.log(` ${margin}  ${title}  ${margin}`);
	}
	console.log(' ' + '='.repeat(maxSize) + '\n\x1b[0m\n');
}

function getAssignedProject(labels) {
	for (var i = 0; i < labels.length; i++) {
		if (labels[i]['name'] == 'Identity' || labels[i]['name'] == 'WebAssembly') {
			return 'WebAssembly';
		} else if (labels[i]['name'] == 'API' || labels[i]['name'] == 'Database') {
			return 'Back-End';
		} else if (labels[i]['name'] == 'Windows') {
			return 'Windows';
		} else if (labels[i]['name'] == 'Android') {
			return 'Android';
		} else if (labels[i]['name'] == 'iOS') {
			return 'iOS';
		}
	}
}

function getColumnName(issue) {
	let labels = issue['labels'];
	for (var i = 0; i < labels.length; i++) {
		if (labels[i]['name'] == 'Triage') {
			return 'Triage';
		} else if (labels[i]['name'] == 'Working') {
			return 'In progress';
		} else if (labels[i]['name'] == 'Complete' || labels[i]['name'] == 'Fixed') {
			return 'Done';
		}
	}

	if (issue['milestone']['title']) {
		return issue['milestone']['title'];
	} else {
		throw new Error('Could not find the proper label indication a column name');
	}
}