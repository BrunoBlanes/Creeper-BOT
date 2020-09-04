"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Azure_1 = require("./Services/Azure");
const HttpServer = __importStar(require("http"));
Azure_1.Azure.SetPrivateSecret();
HttpServer.createServer(function (req, res) {
    // Only accept POST requests
    if (req.method == 'POST') {
        let body;
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => __awaiter(this, void 0, void 0, function* () {
            // Validates webhook secret and reject if invalid
            if (yield Azure_1.Validator.ValidateSecretAsync(body, req.rawHeaders['x-hub-signature'])) {
                // Parse as json
                let event = JSON.parse(body);
                let repo = event.repository.name;
                let owner = event.repository.owner.login;
                // Event is related to the 'Average CRM' repo
                if (repo === 'Average CRM') {
                    // Handle issue events
                    // https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issues
                    if (req.rawHeaders['x-github-event'] === 'issues') {
                        let issue = event.issue;
                        // New issue opened event
                        if (event.action === 'opened') {
                            // Add myself as assignee
                            yield issue.AddAssigneesAsync(owner, repo, ['BrunoBlanes']);
                            // No milestone set
                            if (!issue.milestone) {
                                yield issue.AddLabelsAsync(owner, repo, ['Triage']);
                            }
                            // Check if project label added to issue
                            if (yield issue.IsProjectLabelSetAsync(owner, repo)) {
                                yield issue.CreateProjectCardAsync(owner, repo);
                            }
                        }
                        // New label added event
                        else if (event.action === 'labeled') {
                            // Check if project label added to issue
                            if (yield issue.IsProjectLabelSetAsync(owner, repo)) {
                                yield issue.CreateProjectCardAsync(owner, repo);
                            }
                        }
                        // New label removed event
                        else if (event.action === 'unlabeled') {
                            // Project label removed
                            if ((yield issue.IsProjectLabelSetAsync(owner, repo)) === false) {
                                let labels;
                                labels.push('Triage');
                                issue.labels.forEach(x => { labels.push(x.name); });
                                let card = yield issue.GetProjectCardAsync(owner, repo);
                                yield card.DeleteAsync();
                                yield issue.UpdateAsync(owner, repo, labels, -1);
                            }
                        }
                        // Issue closed event
                        else if (event.action === 'closed') {
                            let label;
                            let labels;
                            if (issue.labels.some(x => x.name === 'Bug'))
                                labels.push('Fixed');
                            else
                                labels.push('Complete');
                            if (label = issue.labels.find(x => x.name === 'Awaiting PR'))
                                issue.labels.splice(issue.labels.indexOf(label), 1);
                            issue.labels.forEach(x => { labels.push(x.name); });
                            yield issue.UpdateAsync(owner, repo, labels);
                        }
                    }
                    // Handle project cards events
                    // https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#project_card
                    else if (req.rawHeaders['x-github-event'] === 'project_card') {
                        let card = event.project_card;
                        // Card is not a note
                        if (card.content_url) {
                            // Card moved event
                            if (event.action === 'moved') {
                                // Content is an issue
                                if (card.IsContentAnIssue()) {
                                    let getMilestonesTask = event.repository.ListMilestonesAsync();
                                    let issue = yield event.repository.GetIssueAsync(card.GetContentId());
                                    let columnName = (yield card.GetColumnAsync()).name;
                                    let pullRequest;
                                    let labels;
                                    // Look for an open pull request from this user
                                    for (let pr of yield event.repository.ListPullRequestsAsync()) {
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
                                            }
                                            else {
                                                labels.push(label.name);
                                            }
                                        });
                                        if (!issue.labels.some(x => x.name === 'Triage'))
                                            labels.push('Triage');
                                        yield issue.UpdateAsync(owner, repo, labels, -1);
                                        if (pullRequest)
                                            yield pullRequest.RemoveIssueReferenceAsync(owner, repo, issue);
                                    }
                                    // Moved to 'In progess'
                                    else if (columnName === 'In progress') {
                                        issue.labels.forEach(label => {
                                            if (label.name === 'Triage'
                                                || label.name === 'Fixed'
                                                || label.name === 'Complete'
                                                || label.name === 'Awaiting PR') {
                                                issue.labels.splice(issue.labels.indexOf(label), 1);
                                            }
                                            else {
                                                labels.push(label.name);
                                            }
                                        });
                                        if (!issue.labels.some(x => x.name === 'Working'))
                                            labels.push('Working');
                                        yield issue.UpdateAsync(owner, repo, labels);
                                        if (pullRequest)
                                            yield pullRequest.RemoveIssueReferenceAsync(owner, repo, issue);
                                    }
                                    // Moved to 'Done'
                                    else if (columnName === 'Done') {
                                        issue.labels.forEach(label => {
                                            if (label.name === 'Triage'
                                                || label.name === 'Fixed'
                                                || label.name === 'Working'
                                                || label.name === 'Complete') {
                                                issue.labels.splice(issue.labels.indexOf(label), 1);
                                            }
                                            else {
                                                labels.push(label.name);
                                            }
                                        });
                                        if (!issue.labels.some(x => x.name === 'Awaiting PR'))
                                            labels.push('Awaiting PR');
                                        yield issue.UpdateAsync(owner, repo, labels);
                                    }
                                    // Moved to a milestone column
                                    else if ((yield getMilestonesTask).some(milestone => milestone.title === columnName)) {
                                        issue.labels.forEach(label => {
                                            if (label.name === 'Triage'
                                                || label.name === 'Fixed'
                                                || label.name === 'Working'
                                                || label.name === 'Complete'
                                                || label.name === 'Awaiting PR') {
                                                issue.labels.splice(issue.labels.indexOf(label), 1);
                                            }
                                            else {
                                                labels.push(label.name);
                                            }
                                        });
                                        // Get the task values
                                        let milestones = yield getMilestonesTask;
                                        // Add milestone to issue
                                        for (let milestone of milestones) {
                                            if (milestone.title === columnName) {
                                                yield issue.UpdateAsync(owner, repo, labels, milestone.id);
                                                break;
                                            }
                                        }
                                        if (pullRequest)
                                            yield pullRequest.RemoveIssueReferenceAsync(owner, repo, issue);
                                    }
                                }
                            }
                        }
                    }
                    // Handle push events
                    // https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#push
                    else if (req.rawHeaders['x-github-event'] == 'push') {
                        // Don't run if this push is not to one of the branches defined below
                        if (['hotfix', 'release', 'feature', 'development'].some(branch => event.ref.indexOf(branch) !== -1)) {
                            let pullRequest;
                            // Look for an open pull request from this user
                            for (let pr of yield event.repository.ListPullRequestsAsync()) {
                                if (pr.user.id === event.pusher.id) {
                                    pullRequest = pr;
                                    break;
                                }
                            }
                            // Create a new pull request if none was found for this user
                            if (!pullRequest)
                                pullRequest = yield event.repository.CreatePullRequestAsync(event.ref);
                            for (let commit of event.commits) {
                                // There are issues linked in this commit
                                if (commit.IsIssueMentioned()) {
                                    // Move resolved issues' project card to 'Done' column
                                    commit.GetMentions().forEach((mention) => __awaiter(this, void 0, void 0, function* () {
                                        let issue = yield event.repository.GetIssueAsync(mention[0]);
                                        let project = yield issue.GetProjectAsync(owner, repo);
                                        let card = yield issue.GetProjectCardAsync(owner, repo);
                                        let column;
                                        // Issue is resolved
                                        if (mention[1]) {
                                            column = yield project.GetColumnAsync('Done');
                                            // Add a reference to this issue in this user's pull request
                                            if (pullRequest !== null)
                                                yield pullRequest.AddIssueReferenceAsync(owner, repo, issue);
                                        }
                                        // Issue is not resolved
                                        else
                                            column = yield project.GetColumnAsync('In progress');
                                        // Move project card
                                        card.MoveAsync(column);
                                    }));
                                }
                            }
                        }
                    }
                    // Handle pull request events
                    // https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#pull_request
                    else if (req.rawHeaders['x-github-event'] === 'pull_request') {
                    }
                }
            }
        }));
        res.end();
    }
    else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write('<p>Creeper-bot is a bot created by Bruno Blanes to automate his personal GitHub account.' +
            '<p>You can find more about him at <a href="https://github.com/BrunoBlanes/Creeper-bot/">https://github.com/BrunoBlanes/Creeper-bot/</a>.', 'text/html; charset=utf-8');
        res.end();
    }
}).listen(process.env.port || 1337);
//# sourceMappingURL=server.js.map