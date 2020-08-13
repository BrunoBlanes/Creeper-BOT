import { Azure, Validator } from './Services/Azure';
import { Milestone } from './GitHubApi/Milestone';
import { Issue, Label } from './GitHubApi/Issue';
import { Payload } from './GitHubApi/Webhook';
import { Card } from './GitHubApi/Project';
import * as HttpServer from 'http';

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
				let repo: string = event.repository.name;
				let owner: string = event.repository.owner.login;

				// Event is related to the 'Average CRM' repo
				if (repo === 'Average CRM') {

					// Handle issue events
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issues
					if (req.rawHeaders['x-github-event'] === 'issues') {
						let issue: Issue = event.issue;

						// New issue opened event
						if (event.action === 'opened') {

							// Add myself as assignee
							await issue.AddAssigneesAsync(owner, repo, ['BrunoBlanes']);

							// No milestone set
							if (!issue.milestone) {
								await issue.AddLabelsAsync(owner, repo, ['Triage']);
							}

							// Check if project label added to issue
							if (await issue.IsProjectLabelSetAsync(owner, repo)) {
								await issue.CreateProjectCardAsync(owner, repo);
							}
						}

						// New label added event
						else if (event.action === 'labeled') {

							// Check if project label added to issue
							if (await issue.IsProjectLabelSetAsync(owner, repo)) {
								await issue.CreateProjectCardAsync(owner, repo);
							}
						}

						// New label removed event
						else if (event.action === 'unlabeled') {

							// Project label removed
							if (await issue.IsProjectLabelSetAsync(owner, repo) === false) {
								let labels: string[];
								labels.push('Triage');
								issue.labels.forEach(x => { labels.push(x.name); });
								let card: Card = await issue.GetProjectCardAsync(owner, repo);
								await card.DeleteAsync();
								await issue.UpdateAsync(owner, repo, labels, -1);
							}
						}

						// Issue closed event
						else if (event.action === 'closed') {
							let label: Label;
							let labels: string[];
							if (issue.labels.some(x => x.name === 'Bug')) labels.push('Fixed');
							else labels.push('Complete');
							if (label = issue.labels.find(x => x.name === 'Awaiting PR'))
								issue.labels.splice(issue.labels.indexOf(label), 1);
							issue.labels.forEach(x => { labels.push(x.name); });
							await issue.UpdateAsync(owner, repo, labels);
						}
					}

					// Handle project cards events
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#project_card
					else if (req.rawHeaders['x-github-event'] === 'project_card') {
						let card: Card = event.project_card;

						// Card is not a note
						if (card.content_url) {

							// Card moved event
							if (event.action === 'moved') {

								// Content is an issue
								if (card.IsContentAnIssue()) {
									let labels: string[];
									let issue: Issue = await event.repository.GetIssueAsync(card.GetContentId());
									let columnName: string = (await card.GetColumnAsync()).name;

									if (columnName === 'Triage') {
										issue.labels.forEach(label => {
											if (label.name === 'Working'
												|| label.name === 'Fixed'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting PR') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											} else {
												labels.push(label.name);
											}
										});

										if (!issue.labels.some(x => x.name === 'Triage'))
											labels.push('Triage');
										await issue.UpdateAsync(owner, repo, labels, -1);

										// TODO: Remove PR association
									}

									else if (columnName === 'In progress') {
										issue.labels.forEach(label => {
											if (label.name === 'Triage'
												|| label.name === 'Fixed'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting PR') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											} else {
												labels.push(label.name);
											}
										});

										if (!issue.labels.some(x => x.name === 'Working'))
											labels.push('Working');
										await issue.UpdateAsync(owner, repo, labels);

										// TODO: Remove PR association
									}

									else if (columnName === 'Done') {
										issue.labels.forEach(label => {
											if (label.name === 'Triage'
												|| label.name === 'Working'
												|| label.name === 'Fixed'
												|| label.name === 'Complete') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											} else {
												labels.push(label.name);
											}
										});

										if (!issue.labels.some(x => x.name === 'Awaiting PR'))
											labels.push('Awaiting PR');
										await issue.UpdateAsync(owner, repo, labels);
									}

									else {
										issue.labels.forEach(label => {
											if (label.name === 'Triage'
												|| label.name === 'Working'
												|| label.name === 'Fixed'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting PR') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											} else {
												labels.push(label.name);
											}
										});

										let milestones: Milestone[] = await event.repository.ListMilestonesAsync();

										for (let milestone of milestones) {
											if (milestone.title === columnName) {
												await issue.UpdateAsync(owner, repo, labels, milestone.id);
												break;
											}

											else if (milestones.indexOf(milestone) === milestones.length - 1) {
												await issue.UpdateAsync(owner, repo, labels, -1);
											}
										}

										// TODO: Remove PR association
									}
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
}).listen(process.env.port || 1337);