import { Azure, Validator } from './Services/Azure';
import { Issue, Label } from './GitHubApi/Issue';
import { Payload } from './GitHubApi/Webhook';
import { Column } from './GitHubApi/Project';
import * as HttpServer from 'http';

const port = process.env.port || 1337
Azure.SetPrivateSecret();

HttpServer.createServer(function (req, res) {

	// Only accept POST requests
	if (req.method == 'POST') {
		let body: string;
		req.on('data', (chunk: string) => { body += chunk; });
		req.on('end', async () => {

			// Validates webhook secret and reject if invalid
			if (await Validator.ValidateSecretAsync(body, req.rawHeaders['x-hub-signature'])) {

				// Parse as json
				let event: Payload = JSON.parse(body);

				// Event is related to the 'Average CRM' repo
				if (event.repository.name === 'Average CRM') {

					// Handle events related to issues
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issues
					if (req.rawHeaders['x-github-event'] === 'issues') {
						let labelsUrl: string = event.repository.labels_url.replace('{/name}', '');
						let issue: Issue = event.issue;

						// New issue opened event
						if (event.action === 'opened') {

							// Add the label 'Triage'
							if (issue.labels.some(label => label.name === 'Bug')) {
								await issue.AddLabelsAsync(['Triage']);
							} else {

								// If it isn't a bug, add the 'Task' label too
								await issue.AddLabelsAsync(['Task', 'Triage']);
							}

							// Assign myself to this issue
							await issue.AddAssigneesAsync(['BrunoBlanes']);

							// Create a project card
							await issue.CreateProjectCardAsync();

						// New label added event
						} else if (event.action === 'labeled') {

							// Added the 'Awaiting Pull Request' label
							if (event.label.name === 'Awaiting Pull Request') {
								let columnName: Column = await issue.GetCurrentColumnAsync();
								var projectName = getAssignedProject(body['issue']['labels']);
								await cards.MoveCardToColumn(columnName, 'Done', projectName, issueUrl, reposUrl, installationId);
							}

							// Handle issue being closed
						} else if (event.action == 'closed') {
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
					} else if (req.rawHeaders['x-github-event'] == 'project_card') {

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
					} else if (req.rawHeaders['x-github-event'] == 'push') {
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
					} else if (req.rawHeaders['x-github-event'] == 'pull_request') {
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
					} else if (req.rawHeaders['x-github-event'] == 'workflow_run') {

						// Workflow completed
						if (body['action'] == 'completed') {
						}
					}
				}
			}
		});

		res.end();
	} else {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
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