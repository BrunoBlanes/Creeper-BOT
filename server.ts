import { Card, Project, Column, CardEvent } from './GitHubApi/Project';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { PushEvent, Mention, Commit } from './GitHubApi/Push';
import { Issue, IssueEvent } from './GitHubApi/Issue';
import { Milestone } from './GitHubApi/Milestone';
import { Validator } from './Services/Azure';
import { Octokit } from './Services/Octokit';
import { Label } from './GitHubApi/Label';
import '../Extensions/Arrays';

createServer((request: IncomingMessage, response: ServerResponse) => {

	// Only accept POST requests
	if (request.method === 'POST') {
		let body: string = '';
		request.on('data', (chunk: string | Buffer) => { body += chunk.toString(); });

		request.on('end', async () => {

			// Validates webhook secret and reject if invalid
			if (await Validator.ValidateSecretAsync(body, request.headers['x-hub-signature'].toString())) {
				// Handle issue events
				// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issues
				if (request.headers['x-github-event'].toString() === 'issues') {

					// Parse request body as json and set aliases
					let event: IssueEvent = new IssueEvent(JSON.parse(body));
					let issue: Issue = event.issue;

					// Create Octokit client with the current installation id
					await Octokit.SetClientAsync(event.installation.id);

					// Event is related to the 'Average CRM' repo
					if (event.repository.name === 'Average-CRM') {

						// New issue opened event
						if (event.action === 'opened') {

							// Add myself as assignee
							await issue.AddAssigneeAsync('BrunoBlanes');

							// No milestone set
							if (issue.milestone == null) {
								await issue.AddLabelAsync('Triage');
							}
						}

						// New label added event
						else if (event.action === 'labeled') {
							if (await event.repository.GetProjectAsync(event.label.name) != null) {
								await issue.CreateProjectCardAsync();
							}
						}

						// Issue closed event
						else if (event.action === 'closed') {
							let labels: string[] = [];

							// Choose appropriate label if issue was a bug
							if (issue.labels.some(x => x.name === 'Bug')) {
								labels.push('Fixed');
							}

							else {
								labels.push('Complete');
							}

							// Look for the specified label in the array
							let label: Label = issue.labels.find(x => x.name === 'Awaiting Pull Request');

							if (label != null) {
								issue.labels.splice(issue.labels.indexOf(label), 1);
							}

							// Push the remaining labels to the label name array
							issue.labels.forEach(x => { labels.push(x.name); });
							await issue.UpdateAsync(labels);
						}
					}
				}

				// Handle project cards events
				// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#project_card
				if (request.headers['x-github-event'].toString() === 'project_card') {

					// Parse request body as json and set aliases
					let event: CardEvent = new CardEvent(JSON.parse(body));
					let card: Card = event.project_card;

					// Create Octokit client with the current installation id
					await Octokit.SetClientAsync(event.installation.id);

					// Event is related to the 'Average CRM' repo
					if (event.repository.name === 'Average-CRM') {

						// Card is not a note
						if (card.content_url != null) {

							// Card created event
							if (event.action === 'created') {

								// Content is an issue
								if (card.IsContentAnIssue()) {
									let issue: Issue = await event.repository.GetIssueAsync(card.GetContentId());
									let column: Column = await card.GetCurrentColumnAsync();
									let project: Project = await card.GetProjectAsync();
									let milestoneNumber = null;
									let labels: string[] = [];

									// Remove project labels
									for (let project of await event.repository.ListProjectsAsync()) {
										for (let label of issue.labels) {
											if (project.name === label.name) {
												issue.labels.splice(issue.labels.indexOf(label), 1);
												break;
											}
										}
									}

									// Copy non project related labels
									for (let label of issue.labels) {
										labels.push(label.name);
									}

									// Add current project label
									labels.push(project.name);

									// Look for a milestone with the same name as the current column
									for (let milestone of await event.repository.ListMilestonesAsync()) {
										if (milestone.title === column.name) {
											milestoneNumber = milestone.number;
											break;
										}
									}

									await issue.UpdateAsync(labels, milestoneNumber);
								}
							}

							// Card moved event
							if (event.action === 'moved') {

								// Content is an issue
								if (card.IsContentAnIssue()) {
									let issue: Issue = await event.repository.GetIssueAsync(card.GetContentId());
									let columnName: string = (await card.GetCurrentColumnAsync()).name;
									let labels: string[] = [];

									// Moved to 'Triage'
									if (columnName === 'Triage') {
										for (let label of issue.labels) {
											if (label.name !== 'Working'
												&& label.name !== 'Fixed'
												&& label.name !== 'Complete'
												&& label.name !== 'Awaiting Pull Request') {
												labels.push(label.name);
											}
										}

										if (issue.labels.some((label: Label) => label.name === 'Triage') === false) {
											labels.push('Triage');
										}

										await issue.UpdateAsync(labels, -1);
									}

									// Moved to 'In progess'
									else if (columnName === 'In progress') {
										for (let label of issue.labels) {
											if (label.name !== 'Triage'
												&& label.name !== 'Fixed'
												&& label.name !== 'Complete'
												&& label.name !== 'Awaiting Pull Request') {
												labels.push(label.name);
											}
										}

										if (issue.labels.some((label: Label) => label.name === 'Working') === false) {
											labels.push('Working');
										}

										await issue.UpdateAsync(labels);
									}

									// Moved to 'Done'
									else if (columnName === 'Done') {
										for (let label of issue.labels) {
											if (label.name !== 'Triage'
												&& label.name !== 'Fixed'
												&& label.name !== 'Working'
												&& label.name !== 'Complete') {
												labels.push(label.name);
											}
										}

										if (issue.labels.some((label: Label) => label.name === 'Awaiting Pull Request') === false) {
											labels.push('Awaiting Pull Request');
										}

										await issue.UpdateAsync(labels);
									}

									// Moved to a milestone column
									else {
										let milestones: Milestone[] = await event.repository.ListMilestonesAsync();

										for (let label of issue.labels) {
											if (label.name !== 'Triage'
												&& label.name !== 'Fixed'
												&& label.name !== 'Working'
												&& label.name !== 'Complete'
												&& label.name !== 'Awaiting Pull Request') {
												labels.push(label.name);
											}
										}

										// Add milestone to issue
										for (let milestone of milestones) {
											if (milestone.title === columnName) {
												await issue.UpdateAsync(labels, milestone.number);
												break;
											}
										}
									}
								}
							}
						}
					}
				}
			}

			else {
				// GitHub Signature validation failed
				response.writeHead(401, { 'Content-Type': 'text/plain' });
				response.write('Failed GitHub Signature validation.');
				response.end();
			}
		});
	}

	else if (request.method === 'GET') {
		response.writeHead(200, { 'Content-Type': 'text/html' });
		response.write('<p>Creeper-bot is a bot created by Bruno Blanes to automate his personal GitHub account.<p>You can find more about him at <a href="https://github.com/BrunoBlanes/Creeper-bot/">https://github.com/BrunoBlanes/Creeper-bot/</a>.<p>v1.0.0');
		response.end();
	}

	else {
		response.writeHead(401, { 'Content-Type': 'text/plain' });
		response.write('This server only accepts "POST" requests from GitHub.');
		response.end();
	}
}).listen(process.env.port);