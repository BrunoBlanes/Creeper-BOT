"use strict";
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
exports.Issue = void 0;
const Project_1 = require("./Project");
const Octokit_1 = require("../Services/Octokit");
class Issue {
    /**
     * Get an issue.
     * https://docs.github.com/en/rest/reference/issues#get-an-issue
     * @param owner
     * @param repo
     * @param issue
     */
    static GetAsync(owner, repo, number) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/issues/:issue_number', {
                owner: owner,
                repo: repo,
                issue_number: number
            });
            if (response.status === 200)
                return response.data;
            else if (response.status === 301)
                throw new Error(`The issue ${number} at repository "${repo}" was permanently moved to "${response.headers.location}".`);
            else if (response.status === 404)
                throw new Error(`The issue ${number} might have been transfered to or deleted from a repository you do not have read access to.`);
            else if (response.status === 410)
                throw new Error(`The issue ${number} has been permanently deleted from the repository "${repo}".`);
            throw new Error(`Could not retrieve issue ${number} from repository "${repo}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Add labels to an issue.
     * https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
     * @param owner
     * @param repo
     * @param labels
     */
    AddLabelsAsync(owner, repo, labels) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('POST /repos/:owner/:repo/issues/:issue_number/labels', {
                owner: owner,
                repo: repo,
                issue_number: this.number,
                labels: labels
            });
            if (response.status === 200)
                this.labels = response.data;
            throw new Error(`Could not assign list of labels to issue number ${this.number} of repository "${repo}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Add assignees to an issue.
     * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
     * @param owner
     * @param repo
     * @param assignees Usernames of people to assign this issue to.
     *
     * NOTE: Only users with push access can add assignees to an issue. Assignees are silently ignored otherwise.
    */
    AddAssigneesAsync(owner, repo, assignees) {
        return __awaiter(this, void 0, void 0, function* () {
            if (assignees.length > 10)
                throw new Error('Maximum assignees allowed is 10.');
            else {
                assignees.forEach((assignee) => __awaiter(this, void 0, void 0, function* () {
                    let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/assignees/:assignee', {
                        owner: owner,
                        repo: repo,
                        assignee: assignee
                    });
                    if (response.status === 404) {
                        assignees.splice(assignees.indexOf(assignee), 1);
                        console.warn(`User "${assignee}" does not have permission to be assigned to issue ${this.number} of repository "${repo}".`);
                    }
                    else if (response.status !== 204) {
                        assignees.splice(assignees.indexOf(assignee), 1);
                        console.error(`Could not check if user "${assignee}" has permission to be assigned to issue ${this.number} of repository "${repo}".\n Octokit returned error ${response.status}.`);
                    }
                }));
            }
            if (assignees.length > 0) {
                let response = yield Octokit_1.octokit.request('POST /repos/:owner/:repo/issues/:issue_number/assignees', {
                    owner: owner,
                    repo: repo,
                    issue_number: this.number,
                    assignees: assignees
                });
                if (response.status === 201)
                    this.assignees = response.data.assignees;
                else
                    throw new Error(`Could not add assignees to issue ${this.number} of repository "${repo}".\n Octokit returned error ${response.status}.`);
            }
            else
                console.warn(`Assignees list was empty, skipping adding assignees to issue ${this.number}.`);
        });
    }
    /**
     *  Returns the project that matches the current project label.
     * @param owner
     * @param repo
     */
    GetProjectAsync(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.project)
                return this.project;
            let projects = yield Project_1.Project.ListAsync(owner, repo);
            let project;
            for (let label of this.labels) {
                if (project = projects.find(x => x.name === label.name)) {
                    this.project = project;
                    return this.project;
                }
            }
            throw new Error(`Could not find any project label associated with issue ${this.number} on repository "${repo}".`);
        });
    }
    /**
     * Check if a label with a project name was set
     * @param owner
     * @param repo
     */
    IsProjectLabelSetAsync(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (yield this.GetProjectAsync(owner, repo))
                    return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /**
     * Create a project card.
     * https://docs.github.com/en/rest/reference/projects#create-a-project-card
     * @param owner
     * @param repo
     */
    CreateProjectCardAsync(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            let columnId;
            if (this.milestone)
                columnId = (yield (yield this.GetProjectAsync(owner, repo)).GetColumnAsync(this.milestone.title)).id;
            else
                columnId = (yield (yield this.GetProjectAsync(owner, repo)).GetColumnAsync()).id;
            let response = yield Octokit_1.octokit.request('POST /projects/columns/:column_id/cards', {
                column_id: columnId,
                content_id: this.id,
                content_type: 'Issue',
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status !== 201)
                throw new Error(`Could not create card for issue ${this.id}.\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Get the associated project card.
     * @param owner
     * @param repo
     */
    GetProjectCardAsync(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            let columnName;
            for (let label of this.labels) {
                if (label.name === 'Triage') {
                    columnName = 'Triage';
                    break;
                }
                else if (label.name === 'Working') {
                    columnName = 'In progress';
                    break;
                }
                else if (label.name === 'Complete' || label.name === 'Fixed' || label.name === 'Awaiting PR') {
                    columnName = 'Done';
                    break;
                }
            }
            if (!columnName) {
                columnName = this.milestone.title;
            }
            let project = yield this.GetProjectAsync(owner, repo);
            let column = yield project.GetColumnAsync(columnName);
            let cards = yield column.ListCardsAsync();
            for (let card of cards) {
                if (card.content_url === this.url) {
                    return card;
                }
            }
            throw new Error(`Could not locate a card associated with issue ${this.id}.`);
        });
    }
    /**
     * Update issue labels.
     * https://docs.github.com/en/rest/reference/issues#update-an-issue
     * @param owner
     * @param repo
     * @param labels An array of label names to replace current labels.
     * @param milestone The number of the milestone to be added to this issue.
     * Set to -1 to remove the current milestone. If ommited, it stays unchanged.
     */
    UpdateAsync(owner, repo, labels, milestone = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('PATCH /repos/:owner/:repo/issues/:issue_number', {
                owner: owner,
                repo: repo,
                issue_number: this.number,
                milestone: milestone === 0 ? this.milestone.number : milestone === -1 ? null : milestone,
                labels: labels
            });
            if (response.status !== 200)
                throw new Error(`Could not update labels for issue ${this.number} at "${repo}".\n Octokit returned error ${response.status}.`);
        });
    }
}
exports.Issue = Issue;
//# sourceMappingURL=Issue.js.map