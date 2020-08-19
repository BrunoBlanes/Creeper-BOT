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
exports.Card = exports.Column = exports.Project = void 0;
const Octokit_1 = require("../Services/Octokit");
class Project {
    /**
     * Get a project.
     * https://docs.github.com/en/rest/reference/projects#get-a-project
     * @param id
     */
    static GetAsync(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /projects/:project_id', {
                project_id: id,
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status === 200)
                return response.data;
            else if (response.status === 404)
                throw new Error('Projects are disabled for this repository.');
            else if (response.status === 401 || response.status === 410)
                throw new Error('You do not have sufficient privileges to list projects for this repository.');
            throw new Error(`Could not retrieve a list of projects the repository. \n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * List repository projects.
     * https://docs.github.com/en/rest/reference/projects#list-repository-projects
     * @param owner
     * @param repo
     * @param state
     */
    static ListAsync(owner, repo, state = 'open') {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/projects', {
                owner: owner,
                repo: repo,
                state: state,
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status === 200)
                return response.data;
            else if (response.status === 404)
                throw new Error(`Projects are disabled in the repository "${repo}".`);
            else if (response.status === 401 || response.status === 410)
                throw new Error(`You do not have sufficient privileges to list projects for the repository "${repo}".`);
            throw new Error(`Could not retrieve a list of projects for repository "${repo}" of owner "${owner}". \n Octokit returned error ${response.status}.`);
        });
    }
    GetColumnAsync(param) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            if (param && typeof param == 'number') {
                // Get the column at the specified index or the first one if not specified
                response = yield Octokit_1.octokit.request('GET /projects/:project_id/columns', {
                    project_id: this.id,
                    per_page: (_a = param) !== null && _a !== void 0 ? _a : 1,
                    mediaType: {
                        previews: [
                            'inertia'
                        ]
                    }
                });
                if (response.status === 200)
                    return response.data[0];
            }
            else {
                // Get all project columns then returns the one that matches the given name
                response = yield Octokit_1.octokit.request('GET /projects/:project_id/columns', {
                    project_id: this.id,
                    mediaType: {
                        previews: [
                            'inertia'
                        ]
                    }
                });
                if (response.status === 200) {
                    for (let column of response.data) {
                        if (column.name === param) {
                            return column;
                        }
                    }
                }
            }
            // If we've come this far, then something went wrong
            throw new Error(`Could not retrieve a list of columns for project id ${this.id}. \n Octokit returned error ${response.status}.`);
        });
    }
}
exports.Project = Project;
class Column {
    /**
     * List project cards.
     * https://docs.github.com/en/rest/reference/projects#list-project-cards
     * @param state The column state.
     * Defaults to "not_archived" if no value is specified.
     */
    ListCardsAsync(state = 'not_archived') {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /projects/columns/:column_id/cards', {
                column_id: this.id,
                archived_state: state,
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status === 200)
                return response.data;
            throw new Error(`Could no retrieve a list of cards for the column ${this.id}. \n Octokit returned error ${response.status}.`);
        });
    }
}
exports.Column = Column;
class Card {
    /**
     * Move a project card.
     * https://docs.github.com/en/rest/reference/projects#move-a-project-card
     * @param column The column to move this card to.
     */
    MoveAsync(column) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('POST /projects/columns/cards/:card_id/moves', {
                card_id: this.id,
                position: 'bottom',
                column_id: column.id,
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status !== 201)
                throw new Error(`Could not move card ${this.id} to column "${column.name}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Delete a project card.
     * https://docs.github.com/en/rest/reference/projects#delete-a-project-card
     */
    DeleteAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('DELETE /projects/columns/cards/:card_id', {
                card_id: this.id,
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status !== 204)
                throw new Error(`Could not delete project card ${this.id}.\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Get a project column.
     * https://docs.github.com/en/rest/reference/projects#get-a-project-column
     */
    GetColumnAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /projects/columns/:column_id', {
                column_id: this.column_id,
                mediaType: {
                    previews: [
                        'inertia'
                    ]
                }
            });
            if (response.status === 200)
                return response.data;
            throw new Error(`Could not retrieve column information for card ${this.id}.\n Octokit returned error ${response.status}.`);
        });
    }
    /** Get the project where this card is in. */
    GetProjectAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let splitUrl = this.project_url.split('/');
            let projectId = +splitUrl[splitUrl.length - 1];
            return yield Project.GetAsync(projectId);
        });
    }
    /** Check if card content is an issue. */
    IsContentAnIssue() {
        let splitUrl = this.content_url.split('/');
        if (splitUrl[splitUrl.length - 2] === 'Issues')
            return true;
        else
            return false;
    }
    /** Return the associated content id*/
    GetContentId() {
        let splitUrl = this.content_url.split('/');
        return +splitUrl[splitUrl.length - 1];
    }
}
exports.Card = Card;
//# sourceMappingURL=Project.js.map