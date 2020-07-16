'use strict';
var http = require('http');

var githook = require('./scripts/githook');
var issues = require('./scripts/issues');
var cards = require('./scripts/cards');
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
								response = await cards.FromIssue(issueId, project.WASM, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'Server' project
							} else if (labels[i]['name'] == 'API' || labels[i]['name'] == 'Database') {
								response = await cards.FromIssue(issueId, project.API, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'Windows' project
							} else if (labels[i]['name'] == 'Windows') {
								response = await cards.FromIssue(issueId, project.WINDOWS, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'Android' project
							} else if (labels[i]['name'] == 'Android') {
								response = await cards.FromIssue(issueId, project.ANDROID, installationId);
								console.log(response);
								break;

								// Assigns this issue to the 'iOS' project
							} else if (labels[i]['name'] == 'iOS') {
								response = await cards.FromIssue(issueId, project.IOS, installationId);
								console.log(response);
								break;
							}
						}
					}

				// Handle project card events
				} else if (req.headers['x-github-event'] == 'project_card') {

					// If card is related to an issue
					if (body['project_card']['content_url']) {
						let issueUrl = body['project_card']['content_url'];
						let columnUrl = body['project_card']['column_url'];
						let labelsUrl = body['repository']['labels_url'].replace('{/name}', '');
						let milestonesUrl = body['repository']['milestones_url'].replace('{/number}', '');

						// Updates the issue based on the current project column
						logSection(`UPDATE AN ISSUE WHO'S CARD WAS MOVED`);
						let columnName = await cards.GetColumnName(columnUrl, installationId);

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
						} else {

							// Moved to a milestone column
							let response = await issues.ToMilestone(columnName, milestonesUrl, issueUrl, labelsUrl, installationId);
							console.log(response);
						}
					}
				}
			}
		});

		res.end('ok');
	} else {
		res.end('Creeper Bot is a bot created by Bruno Blanes to automate his personal GitHub account.\nYou can find more about him at https://github.com/BrunoBlanes/Creeper-Bot/');
	}
}).listen(port);

// Adds a cool section divider to the log
function logSection(title) {
	const maxSize = 115;
	var textSize = title.length + 4;
	var margin = '='.repeat((maxSize - textSize) / 2);
	console.log('\x1b[36m\n\n ' + '='.repeat(maxSize) + '\n');
	if ((margin.length * 2 + textSize) % 2 == 0) {
		console.log(` ${margin}  ${title}  ${margin}=\n`);
	} else {
		console.log(` ${margin}  ${title}  ${margin}\n`);
	}
	console.log(' ' + '='.repeat(maxSize) + '\n\x1b[0m\n');
}