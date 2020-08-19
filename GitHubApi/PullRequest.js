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
exports.PullRequest = void 0;
const Octokit_1 = require("../Services/Octokit");
const header = '============================= Start of Creeper-bot automation =============================';
const footer = '============================== End of Creeper-bot automation ==============================';
class PullRequest {
    /**
     * List pull requests.
     * https://docs.github.com/en/rest/reference/pulls#list-pull-requests
     * @param owner
     * @param repo
     */
    static ListAsync(owner, repo, state) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/pulls', {
                owner: owner,
                repo: repo,
                state: state
            });
            if (response.status === 200)
                return response.data;
            throw new Error(`Could not retrieve a list of pull requests from repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Create a pull request.
     * https://docs.github.com/en/rest/reference/pulls#create-a-pull-request
     * @param owner
     * @param repo
     * @param title
     * @param head
     * @param base
     */
    static CreateAsync(owner, repo, title, head, base) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('POST /repos/:owner/:repo/pulls', {
                owner: owner,
                repo: repo,
                title: title,
                head: head,
                base: base
            });
            if (response.status === 201)
                return response.data;
            throw new Error(`Could not create a pull request from branch "${head}" into branch "${base}" on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Update a pull request.
     * https://docs.github.com/en/rest/reference/pulls#update-a-pull-request
     * @param owner
     * @param repo
     * @param title
     * @param body
     * @param state
     * @param base
     */
    UpdateAsync(owner, repo, title, body, state, base) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('PATCH /repos/:owner/:repo/pulls/:pull_number', {
                owner: owner,
                repo: repo,
                pull_number: this.id,
                title: title !== null && title !== void 0 ? title : this.title,
                body: body !== null && body !== void 0 ? body : this.body,
                state: state !== null && state !== void 0 ? state : this.state,
                base: base !== null && base !== void 0 ? base : this.base.label
            });
            if (response.status !== 200)
                throw new Error(`Could not update pull request ${this.id} from repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Add a reference to an issue.
     * @param owner
     * @param repo
     * @param issue
     */
    AddIssueReferenceAsync(owner, repo, issue) {
        return __awaiter(this, void 0, void 0, function* () {
            let ref = `    - This pull request will close #${issue.id} once merged into ${this.head.label}.\n`;
            let index = this.body.indexOf(footer);
            if (index !== -1) {
                // Add reference to existing Creeper-bot section
                this.body = this.body.addTo(index - 1, ref);
            }
            else {
                // Create Creeper-bot section
                let section = `\n\n\n\n${header}\n${ref}\n${footer}\n\n`;
                this.body += section;
            }
            yield this.UpdateAsync(owner, repo);
        });
    }
    /**
     * Remove a reference to an issue.
     * @param owner
     * @param repo
     * @param issue
     */
    RemoveIssueReferenceAsync(owner, repo, issue) {
        return __awaiter(this, void 0, void 0, function* () {
            let ref = `    - This pull request will close #${issue.id} once merged into ${this.head.label}.\n`;
            let index = this.body.indexOf(`#${issue.id}`);
            if (index !== -1) {
                // Remove issue reference
                let start = this.body.indexOf(ref);
                this.body = this.body.remove(start, start + ref.length);
                // No more referenced issues at this pull request
                if (this.body.indexOf('This pull request will close #') === -1) {
                    let start = this.body.indexOf(header);
                    let end = this.body.indexOf(footer) + footer.length;
                    this.body = this.body.remove(start, end);
                }
            }
            yield this.UpdateAsync(owner, repo);
        });
    }
}
exports.PullRequest = PullRequest;
//# sourceMappingURL=PullRequest.js.map