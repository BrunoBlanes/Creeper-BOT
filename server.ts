import { Azure, Validator } from './Services';
import * as HttpServer from 'http';

const port = process.env.port || 1337

Azure.SetPrivateSecret();

HttpServer.createServer(function (req, res) {
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
					let labelsUrl = body['repository']['labels_url'].replace('{/name}', '');
					let reposUrl = body['issue']['repository_url'];
					let labels = body['issue']['labels'];
					let issueUrl = body['issue']['url'];
					let issueId = body['issue']['id'];

					// New issue opened
					if (body['action'] == 'opened') {

						// Assigns label 'Triage' to issue
						logSection('ASSIGN LABEL "TRIAGE" TO NEW ISSUE');
						let response;

						// Look for label 'Bug'
						for (var i = 0; i < labels.length; i++) {
							if (labels[i]['name'] == 'Bug') {

								// If it is a bug just add if to triage
								response = await issues.AssignLabelsToIssue(['Triage'], issueUrl, installationId);
								break;
							} else if (i == labels.length - 1) {

								// If not a bug add it as a task for triage
								response = await issues.AssignLabelsToIssue(['Task', 'Triage'], issueUrl, installationId);
							}
						}

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
								// Try get the column name by the label
								columnName = getColumnName(body['issue']);
								var projectName = getAssignedProject(body['issue']['labels']);
								await cards.MoveCardToColumn(columnName, 'Done', projectName, issueUrl, reposUrl, installationId);
							} catch (err) {
								console.log(err);
							}
						}

						// Handle issue being closed
					} else if (body['action'] == 'closed') {
						let response;

						for (var i = 0; i < labels.length; i++) {
							if (labels[i]['name'] == 'Bug') {

								// Adds 'Fixed' label if this was a bug
								response = await issues.UpdateLabels(['Fixed'], ['Awaiting Pull Request'], issueUrl, labelsUrl, installationId);
								break;
							} else if (i == labels.length - 1) {

								// Adds the 'Complete' label otherwise
								response = await issues.UpdateLabels(['Complete'], ['Awaiting Pull Request'], issueUrl, labelsUrl, installationId);
							}
						}

						console.log(response);
					}

					// Handle project card events
				} else if (req.headers['x-github-event'] == 'project_card') {

					// Only if card is based on an issue
					if (body['project_card']['content_url']) {

						// Handle card moved events
						if (body['action'] == 'moved') {
							logSection(`UPDATE AN ISSUE WHO'S CARD WAS MOVED`);
							let issueUrl = body['project_card']['content_url'];
							let columnUrl = body['project_card']['column_url'];
							let labelsUrl = body['repository']['labels_url'].replace('{/name}', '');
							let milestonesUrl = body['repository']['milestones_url'].replace('{/number}', '');

							// Get the current card's column name
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
								let response = await issues.ToDone(issueUrl, installationId);
								console.log(response);

								// Moved to a milestone column
							} else {
								let response = await issues.ToMilestone(columnName, milestonesUrl, issueUrl, installationId);
								console.log(response);
							}
						}
					}

					// Handle push events
				} else if (req.headers['x-github-event'] == 'push') {
					let pushCommits = body['commits'];
					let issueUrl = body['repository']['issues_url'].replace('{/number}', '');
					let labelsUrl = body['repository']['labels_url'].replace('{/name}', '');
					var issueNumbers = await commits.GetIssueNumbersFromCommits(pushCommits);

					// Add label 'Awaiting Pull Request' to issues
					for (var i = 0; i < issueNumbers.length; i++) {
						logSection(`ADDING LABEL "AWAITING PULL REQUEST" TO ISSUE #${issueNumbers[i]}`);
						let response = await issues.UpdateLabels(['Awaiting Pull Request'], ['Working'], issueUrl + `/${issueNumbers[i]}`, labelsUrl, installationId);
						console.log(response);
					}

					// Handle pull request events
				} else if (req.headers['x-github-event'] == 'pull_request') {
					let prUrl = body['pull_request']['url'];
					let prBody = body['pull_request']['body'];
					let commitsUrl = body['pull_request']['commits_url'];
					let prCommits = await commits.GetCommits(commitsUrl, installationId);

					// Get all the issue numbers from this pr
					let prIssues = await pullrequest.GetIssueNumbersFromPRCommits(prCommits, installationId);

					// New pull request created
					if (body['action'] == 'opened') {

						// Get all the commits from this pr
						logSection('LINKING ISSUES TO PULL REQUEST');

						// issues found
						if (prIssues) {
							prBody = generateBody(prBody, prIssues);

							// Updates the pr body to close found issues
							let response = await httpClient.Patch(prUrl, installationId, {
								body: prBody
							});
							console.log(response);
						}

						// Open pull request updated
					} else if (body['action'] == 'synchronize') {

						// Get all the commits from this pr
						logSection('LINKING ISSUES TO EXISTING PULL REQUEST');
						prBody = prBody.substring(0, prBody.indexOf('Creeper-bot:') - 1);

						// issues found
						if (prIssues) {
							prBody = generateBody(prBody, prIssues);

							// Updates the pr body to close found issues
							let response = await httpClient.Patch(prUrl, installationId, {
								body: prBody
							});
							console.log(response);
						}
					}

					// Handle workflow events
				} else if (req.headers['x-github-event'] == 'workflow_run') {

					// Workflow completed
					if (body['action'] == 'completed') {
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

function generateBody(prBody, prIssues) {
	prBody += '\n\n\n\n**Creeper-bot:** This PR will';
	if (prIssues.length == 1) {
		prBody += ` close #${prIssues[i]}.`;
	} else {

		// Loop through all issues numbers in this pr
		for (var i = 0; i < prIssues.length; i++) {
			if (i == prIssues.length - 1) {
				prBody = prBody.slice(0, -1);
				prBody += ` and will close #${prIssues[i]}.`;
			} else {
				prBody += ` close #${prIssues[i]},`;
			}
		}
	}

	return prBody;
}



module.exports = {
	// Updates an issue who's project card was moved back to 'Triage'
	ToTriage: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Working', 'Complete', 'Fixed'], ['Triage'], issueUrl, labelsUrl, installationId);
			let body = await updateIssue(issueUrl, null, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates an issue who's project card was moved back to 'In progress'
	ToWorking: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Triage', 'Fixed', 'Complete'], ['Working'], issueUrl, labelsUrl, installationId);
			let body = updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates an issue who's project card was moved to 'Done'
	ToDone: async function (issueUrl, installationId) {
		try {
			let labels = await removeLabels(['Triage', 'Working'], issueUrl, installationId);
			let body = updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	//Updates an issue who's project card was moved to a milestone column
	ToMilestone: async function (columnName, milestonesUrl, issueUrl, installationId) {
		try {
			let milestoneNumber = await getMilestoneNumber(columnName, milestonesUrl, installationId);
			let labels = await removeLabels(['Triage', 'Complete', 'Fixed', 'Working'], issueUrl, installationId);
			let body = await updateIssue(issueUrl, milestoneNumber, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates the labels of an issue
	UpdateLabels: async function (addLabels, removeLabels, issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(removeLabels, addLabels, issueUrl, labelsUrl, installationId);
			let body = await updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	}
};