import { PullRequest, PullRequestEvent, PullRequestReviewEvent } from './GitHubApi/PullRequest';
import { Card, Project, Column, CardEvent } from './GitHubApi/Project';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { CheckSuiteEvent, CheckSuite } from './GitHubApi/Check';
import { Issue, IssueEvent } from './GitHubApi/Issue';
import { PushEvent, Mention } from './GitHubApi/Push';
import { Repository } from './GitHubApi/Repository';
import { Milestone } from './GitHubApi/Milestone';
import { Validator } from './Services/Azure';
import { Octokit } from './Services/Octokit';
import { Label } from './GitHubApi/Label';
import './Extensions/Arrays';

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
					let jsonPayload: any = JSON.parse(body);
					let event: IssueEvent = new IssueEvent(jsonPayload);
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

							response.writeHead(202);
						}

						// New label added event
						else if (event.action === 'labeled') {
							if (await event.repository.GetProjectAsync(event.label.name) != null) {
								await issue.CreateProjectCardAsync();
							}

							response.writeHead(202);
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
							response.writeHead(202);
						}
					}
				}

				// Handle project cards events
				// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#project_card
				else if (request.headers['x-github-event'].toString() === 'project_card') {

					// Parse request body as json and set aliases
					let jsonPayload: any = JSON.parse(body);
					let event: CardEvent = new CardEvent(jsonPayload);
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
									response.writeHead(202);
								}
							}

							// Card moved event
							else if (event.action === 'moved') {

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

									response.writeHead(202);
								}
							}
						}
					}
				}

				// Handle push events
				// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#push
				else if (request.headers['x-github-event'].toString() === 'push') {
					let jsonPayload: any = JSON.parse(body);

					// Parse request body as json and set aliases
					let event: PushEvent = new PushEvent(jsonPayload);
					let repo: Repository = event.repository;

					// Create Octokit client with the current installation id
					await Octokit.SetClientAsync(event.installation.id);

					// Event is related to the 'Average CRM' repo
					if (event.repository.name === 'Average-CRM') {

						// Ignore commits to the master branch
						if (event.ref.split('/').last() !== 'master') {
							for (let commit of event.commits) {
								let mention: Mention | null = commit.GetMention();

								if (mention != null) {
									let issue: Issue = await repo.GetIssueAsync(mention.content_id);
									let project: Project = await issue.GetProjectAsync();
									let card: Card = await issue.GetProjectCardAsync();
									let column: Column = mention.resolved
										? await project.GetColumnAsync('Done')
										: await project.GetColumnAsync('In progress');

									// Move project card
									await card.MoveAsync(column);
									let pullRequests: PullRequest[] = await repo.ListPullRequestsAsync(`${event.sender.login}:${event.ref}`);

									if (pullRequests.length === 0) {

										// Creates a pull request if one don't aleady exists
										let pullRequest: PullRequest = await repo.CreatePullRequestAsync(
											event.ref,
											issue.title,
											`Resolves #${issue.number}`);

										if (mention.resolved === true) {

											// Request review from me since Creeper-bot is the one opening it
											await pullRequest.RequestReviewAsync('BrunoBlanes');
										}
									}

									else {
										let pullRequest: PullRequest = pullRequests.first();
										let mentions: Mention[] = pullRequest.GetMentions();
										let body: string | null = null;

										// This issue was not mentioned before on this pull request
										if (mentions.some((mention: Mention) => mention.content_id === issue.number) === false) {
											body = pullRequest.body;
											body += ` and resolves #${issue.number}`;
										}

										// All mentions were resolved, convert from draft to final
										if (mentions.some((mention: Mention) => mention.resolved === false) === false) {

											// Request review from me since Creeper-bot is the one opening it
											await pullRequest.RequestReviewAsync('BrunoBlanes');
										}

										await pullRequest.UpdateAsync(body);
									}
								}
							}

							response.writeHead(202);
						}
					}
				}

				// Handle pull request events
				// https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads#pull_request
				else if (request.headers['x-github-event'].toString() === 'pull_request') {
					let jsonPayload: any = JSON.parse(body);

					// Parse request body as json and set aliases
					let event: PullRequestEvent = new PullRequestEvent(jsonPayload);
					let pullRequest: PullRequest = event.pull_request;
					let repo: Repository = event.repository;

					// Create Octokit client with the current installation id
					await Octokit.SetClientAsync(event.installation.id);

					// Event is related to the 'Average CRM' repo
					if (event.repository.name === 'Average-CRM') {

						// Pull request closed event
						if (event.action === 'closed') {

							// Pull request has been merged
							if (pullRequest.merged) {
								for (let commit of await pullRequest.GetCommitsAsync()) {
									let mention: Mention = commit.GetMention();

									if (mention != null) {

										// Move issue to 'Done' column
										let issue: Issue = await repo.GetIssueAsync(mention.content_id);

										// Commits to master reference pull requests
										if (pullRequest.base.ref === 'master') {

											// Close the issue
											await issue.UpdateAsync(undefined, undefined, 'closed');

											// Add nice comment
											await issue.CreateCommentAsync(`Thank you for your contribution! This issue was ${issue.labels.some((label: Label) => label.name === 'Bug') ? 'fixed' : 'resolved'} and will be implemented in the next release.`);
										}
									}
								}

								response.writeHead(202);
							}
						}
					}
				}

				// Handle pull request review events
				// https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads#pull_request_review
				else if (request.headers['x-github-event'].toString() === 'pull_request_review') {
					let jsonPayload: any = JSON.parse(body);

					// Parse request body as json and set aliases
					let event: PullRequestReviewEvent = new PullRequestReviewEvent(jsonPayload);
					let repo: Repository = event.repository;

					// Create Octokit client with the current installation id
					await Octokit.SetClientAsync(event.installation.id);

					// Event is related to the 'Average CRM' repo
					if (event.repository.name === 'Average-CRM') {

						// Handle pull request review approved event
						if (event.action === 'submitted' && event.review.state === 'approved') {

							// Pull request approved by me
							if (event.review.user.login === 'BrunoBlanes') {
								let pullRequest: PullRequest = await repo.GetPullRequestAsync(event.pull_request.number);
								let mention: Mention = pullRequest.GetMentions().first();

								let issue: Issue = await repo.GetIssueAsync(mention.content_id);
								let method: 'merge' | 'squash' | 'rebase';

								// Merges to 'master' must be via squash
								if (pullRequest.base.ref === 'master') {
									method = 'squash';
								}

								// Merges from 'master' are rebased
								else if (pullRequest.head.ref === 'master') {
									method = 'rebase';
								}

								else {
									method = 'merge';
								}

								// Merge pull request
								if (pullRequest.mergeable) {
									await pullRequest.MergeAsync(`${issue.title} (#${pullRequest.number})`, method);
									await repo.DeleteRerenceAsync(`heads/${pullRequest.head.ref}`);
									response.writeHead(202);
								}
							}
						}
					}
				}

				// Handle check suite events
				// https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads#check_suite
				else if (request.headers['x-github-event'].toString() === 'check_suite') {
					let jsonPayload: any = JSON.parse(body);

					// Parse request body as json and set aliases
					let event: CheckSuiteEvent = new CheckSuiteEvent(jsonPayload);
					let checkSuite: CheckSuite = event.check_suite;
					let repo: Repository = event.repository;

					// Create Octokit client with the current installation id
					await Octokit.SetClientAsync(event.installation.id);

					// Event is related to the 'Average CRM' repo
					if (event.repository.name === 'Average-CRM') {

						// All check runs in a check suite have completed.
						if (event.action === 'completed' && checkSuite.conclusion === 'success') {

							if (checkSuite.pull_requests != null) {
								let pullRequest: PullRequest = await repo.GetPullRequestAsync(checkSuite.pull_requests.first().number);
								let mention: Mention = pullRequest.GetMentions().first();

								let issue: Issue = await repo.GetIssueAsync(mention.content_id);
								let method: 'merge' | 'squash' | 'rebase';

								// Merges to 'master' must be via squash
								if (pullRequest.base.ref === 'master') {
									method = 'squash';
								}

								// Merges from 'master' are rebased
								else if (pullRequest.head.ref === 'master') {
									method = 'rebase';
								}

								else {
									method = 'merge';
								}

								// Merge pull request
								if (pullRequest.mergeable) {
									await pullRequest.MergeAsync(`${issue.title} (#${pullRequest.number})`, method);
									await repo.DeleteRerenceAsync(`heads/${pullRequest.head.ref}`);
									response.writeHead(202);
								}
							}
						}
					}
				}

				if (response.statusCode !== 202) {
					response.writeHead(404);
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
		response.write('<p>Creeper-bot is a bot created by Bruno Blanes to automate his personal GitHub account.<p>You can find more about him at <a href="https://github.com/BrunoBlanes/Creeper-bot/">https://github.com/BrunoBlanes/Creeper-bot/</a>.<p>v1.3.0');
		response.end();
	}

	else {
		response.writeHead(401, { 'Content-Type': 'text/plain' });
		response.write('This server only accepts "POST" requests from GitHub.');
		response.end();
	}
}).listen(process.env.port);