import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Card, Project, Column } from './GitHubApi/Project';
import { PullRequest } from './GitHubApi/PullRequest';
import { Azure, Validator } from './Services/Azure';
import { EventPayload } from './GitHubApi/Webhook';
import { Milestone } from './GitHubApi/Milestone';
import { Issue, Label } from './GitHubApi/Issue';

Azure.SetPrivateSecret();

createServer((request: IncomingMessage, response: ServerResponse) => {

	// Only accept POST requests
	if (request.method === 'POST') {
		let body: string = '';
		request.on('data', (chunk: string | Buffer) => { body += chunk.toString(); });
		request.on('end', async () => {

			// Validates webhook secret and reject if invalid
			if (await Validator.ValidateSecretAsync(body, request.headers['x-hub-signature'].toString())) {

				// Parse as json
				let event: EventPayload = JSON.parse(body);
				let repo: string = event.repository.name;
				let owner: string = event.repository.owner.login;

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
					else if (request.headers['x-github-event'].toString() === 'project_card') {
						let card: Card = event.project_card;

						// Card is not a note
						if (card.content_url) {

							// Card moved event
							if (event.action === 'moved') {

								// Content is an issue
								if (card.IsContentAnIssue()) {
									let getMilestonesTask: Promise<Milestone[]> = event.repository.ListMilestonesAsync();
									let issue: Issue = await event.repository.GetIssueAsync(card.GetContentId());
									let columnName: string = (await card.GetColumnAsync()).name;
									let pullRequest: PullRequest;
									let labels: string[];

									// Look for an open pull request from this user
									for (let pr of await event.repository.ListPullRequestsAsync()) {
										if (pr.user.id === event.sender.id) {
											pullRequest = pr;
											break;
										}
									}

									// Moved to 'Triage'
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

										if (!issue.labels.some(x => x.name === 'Triage')) labels.push('Triage');
										await issue.UpdateAsync(owner, repo, labels, -1);
										if (pullRequest) await pullRequest.RemoveIssueReferenceAsync(owner, repo, issue);
									}

									// Moved to 'In progess'
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

										if (!issue.labels.some(x => x.name === 'Working')) labels.push('Working');
										await issue.UpdateAsync(owner, repo, labels);
										if (pullRequest) await pullRequest.RemoveIssueReferenceAsync(owner, repo, issue);
									}

									// Moved to 'Done'
									else if (columnName === 'Done') {
										issue.labels.forEach(label => {
											if (label.name === 'Triage'
												|| label.name === 'Fixed'
												|| label.name === 'Working'
												|| label.name === 'Complete') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											} else {
												labels.push(label.name);
											}
										});

										if (!issue.labels.some(x => x.name === 'Awaiting PR')) labels.push('Awaiting PR');
										await issue.UpdateAsync(owner, repo, labels);
									}

									// Moved to a milestone column
									else if ((await getMilestonesTask).some(milestone => milestone.title === columnName)) {
										issue.labels.forEach(label => {
											if (label.name === 'Triage'
												|| label.name === 'Fixed'
												|| label.name === 'Working'
												|| label.name === 'Complete'
												|| label.name === 'Awaiting PR') {
												issue.labels.splice(issue.labels.indexOf(label), 1);
											} else {
												labels.push(label.name);
											}
										});

										// Get the task values
										let milestones: Milestone[] = await getMilestonesTask;

										// Add milestone to issue
										for (let milestone of milestones) {
											if (milestone.title === columnName) {
												await issue.UpdateAsync(owner, repo, labels, milestone.id);
												break;
											}
										}

										if (pullRequest) await pullRequest.RemoveIssueReferenceAsync(owner, repo, issue);
									}
								}
							}
						}
					}

					// Handle push events
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#push
					else if (request.headers['x-github-event'].toString() === 'push') {

						// Don't run if this push is not to one of the branches defined below
						if (['hotfix', 'release', 'feature', 'development'].some(branch => event.ref.indexOf(branch) !== -1)) {
							let pullRequest: PullRequest;

							// Look for an open pull request from this user
							for (let pr of await event.repository.ListPullRequestsAsync()) {
								if (pr.user.id === event.pusher.id) {
									pullRequest = pr;
									break;
								}
							}

							// Create a new pull request if none was found for this user
							if (!pullRequest) pullRequest = await event.repository.CreatePullRequestAsync(event.ref);

							for (let commit of event.commits) {

								// There are issues linked in this commit
								if (commit.IsIssueMentioned()) {

									// Move resolved issues' project card to 'Done' column
									commit.GetMentions().forEach(async mention => {
										let issue: Issue = await event.repository.GetIssueAsync(mention[0]);
										let project: Project = await issue.GetProjectAsync(owner, repo);
										let card: Card = await issue.GetProjectCardAsync(owner, repo);
										let column: Column;

										// Issue is resolved
										if (mention[1]) {
											column = await project.GetColumnAsync('Done');

											// Add a reference to this issue in this user's pull request
											if (pullRequest !== null) await pullRequest.AddIssueReferenceAsync(owner, repo, issue);
										}

										// Issue is not resolved
										else column = await project.GetColumnAsync('In progress');

										// Move project card
										card.MoveAsync(column);
									});
								}
							}
						}
					}

					// Handle pull request events
					// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#pull_request
					else if (request.headers['x-github-event'].toString() === 'pull_request') {
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

	else {
		response.writeHead(200, { 'Content-Type': 'text/html' });
		response.write('<p>Creeper-bot is a bot created by Bruno Blanes to automate his personal GitHub account.<p>You can find more about him at <a href="https://github.com/BrunoBlanes/Creeper-bot/">https://github.com/BrunoBlanes/Creeper-bot/</a>.');
		response.end();
	}
}).listen(process.env.port);