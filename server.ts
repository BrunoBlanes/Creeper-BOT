import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Card, Project, Column } from './GitHubApi/Project';
import { EventPayload } from './GitHubApi/Webhook';
import { Milestone } from './GitHubApi/Milestone';
import { Issue, Label } from './GitHubApi/Issue';
import { Validator } from './Services/Azure';
import { Octokit } from './Services/Octokit';

createServer((request: IncomingMessage, response: ServerResponse) => {

	// Only accept POST requests
	if (request.method === 'POST') {
		let body: string = '';
		request.on('data', (chunk: string | Buffer) => { body += chunk.toString(); });

		request.on('end', async () => {

			// Validates webhook secret and reject if invalid
			if (await Validator.ValidateSecretAsync(body, request.headers['x-hub-signature'].toString())) {

				// Parse request body as json and set aliases
				let event: EventPayload = new EventPayload(JSON.parse(body));
				let owner: string = event.repository.owner.login;
				let repo: string = event.repository.name;

				// Create Octokit client with the current installation id
				await Octokit.SetClientAsync(event.installation.id);

				// Event is related to the 'Average CRM' repo
				if (repo === 'Average-CRM') {

					// Handle issue events
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issues
					if (request.headers['x-github-event'].toString() === 'issues') {
						let issue: Issue = event.issue;

						// New issue opened event
						if (event.action === 'opened') {

							// Add myself as assignee
							await issue.AddAssigneesAsync(owner, repo, ['BrunoBlanes']);

							// No milestone set
							if (issue.milestone == null) {
								await issue.AddLabelsAsync(owner, repo, ['Triage']);
							}

							// Check if project label added to issue
							if (await issue.IsProjectLabelSetAsync(owner, repo)) {
								await issue.CreateProjectCardAsync(owner, repo);
							}
						}

						// New label added event
						else if (event.action === 'labeled') {
							if (event.label.name === 'Database') {
								await issue.AddLabelsAsync(owner, repo, ['Server']);
							}

							else {
								let project: Project = await event.repository.GetProjectAsync(event.label.name);

								if (project instanceof Project) {
									await issue.CreateProjectCardAsync(owner, repo);
								}
							}
						}

						// New label removed event
						else if (event.action === 'unlabeled') {

							// Project label removed
							if (await issue.IsProjectLabelSetAsync(owner, repo) === false) {
								let labels: string[] = [];
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
							let labels: string[] = [];
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
					else if (request.headers['x-github-event'].toString() === 'project_card') {
						let card: Card = event.project_card;

						// Card is not a note
						if (card.content_url != null) {

							// Card moved event
							if (event.action === 'moved') {

								// Content is an issue
								if (card.IsContentAnIssue()) {
									let issue: Issue = await event.repository.GetIssueAsync(card.GetContentId());
									let columnName: string = (await card.GetColumnAsync()).name;
									let labels: string[] = [];

									// Moved to 'Triage'
									if (columnName === 'Triage') {
										for (let label of issue.labels) {
											if (label.name === 'Working'
												|| label.name === 'Fixed'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting Pull Request') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											}

											else {
												labels.push(label.name);
											}
										}

										if (issue.labels.some((label: Label) => label.name === 'Triage') === false) {
											labels.push('Triage');
										}

										await issue.UpdateAsync(owner, repo, labels, -1);
									}

									// Moved to 'In progess'
									else if (columnName === 'In progress') {
										for (let label of issue.labels) {
											if (label.name === 'Triage'
												|| label.name === 'Fixed'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting Pull Request') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											}

											else {
												labels.push(label.name);
											}
										}

										if (issue.labels.some((label: Label) => label.name === 'Working') === false) {
											labels.push('Working');
										}

										await issue.UpdateAsync(owner, repo, labels);
									}

									// Moved to 'Done'
									else if (columnName === 'Done') {
										for (let label of issue.labels) {
											if (label.name === 'Triage'
												|| label.name === 'Fixed'
												|| label.name === 'Working'
												|| label.name === 'Complete') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											}

											else {
												labels.push(label.name);
											}
										}

										if (issue.labels.some((label: Label) => label.name === 'Awaiting Pull Request') === false) {
											labels.push('Awaiting Pull Request');
										}

										await issue.UpdateAsync(owner, repo, labels);
									}

									// Moved to a milestone column
									else {
										let milestones: Milestone[] = await event.repository.ListMilestonesAsync();

										for (let label of issue.labels) {
											if (label.name === 'Triage'
												|| label.name === 'Fixed'
												|| label.name === 'Working'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting Pull Request') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											}

											else {
												labels.push(label.name);
											}
										}

										// Add milestone to issue
										for (let milestone of milestones) {
											if (milestone.title === columnName) {
												await issue.UpdateAsync(owner, repo, labels, milestone.id);
												break;
											}
										}
									}
								}
							}
						}
					}

					// Handle push events
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#push
					else if (request.headers['x-github-event'].toString() === 'push') {

						for (let commit of event.commits) {

							// Move resolved issues' project card to 'Done' column
							for (let mention of commit.GetMentions()) {
								let issue: Issue = await event.repository.GetIssueAsync(mention.content_id);
								let project: Project = await issue.GetProjectAsync(owner, repo);
								let card: Card = await issue.GetProjectCardAsync(owner, repo);
								let column: Column;

								// Issue is resolved
								if (mention.resolved) {
									column = await project.GetColumnAsync('Done');
								}

								// Issue is not resolved
								else {
									column = await project.GetColumnAsync('In progress');
								}

								// Move project card
								await card.MoveAsync(column);
							}
						}
					}
				}

				response.end();
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