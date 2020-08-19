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
exports.Repository = void 0;
const PullRequest_1 = require("./PullRequest");
const Milestone_1 = require("./Milestone");
const Issue_1 = require("./Issue");
class Repository {
    /** Return a list of milestones for the current repo. */
    ListMilestonesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Milestone_1.Milestone.ListAsync(this.owner.login, this.name);
        });
    }
    /**
     * Get an issue.
     * @param issueId The issue id.
     */
    GetIssueAsync(issueId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Issue_1.Issue.GetAsync(this.owner.login, this.name, issueId);
        });
    }
    /**
     * Return a list of pull requests for the current repo.
     * @param state The state at which to filter pull requests by. Defaults to 'open'.
     */
    ListPullRequestsAsync(state = 'open') {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PullRequest_1.PullRequest.ListAsync(this.owner.login, this.name, state);
        });
    }
    /**
     * Create a pull request.
     * @param title The title of the pull request.
     * @param head The name of the branch where your changes are implemented.
     */
    CreatePullRequestAsync(title, head) {
        return __awaiter(this, void 0, void 0, function* () {
            let branchname = head.split('/');
            let base;
            // Pulls from 'development' will be mergen into a 'release/*' branch
            if (branchname.last() === 'development') {
                // TODO: Create release branch if not existing
                // TODO: Get release version
                let releaseVersion;
                base = `release/${releaseVersion}`;
            }
            // Pulls from 'hotfix/*' or 'release/*' will be merged into 'master' branch
            else if (branchname[branchname.length - 2] === 'hotfix'
                || branchname[branchname.length - 2] === 'release') {
                // TODO: Merge this pr to development as well
                base = 'master';
            }
            // Pulls from 'feature/*' will be merged into the 'development' branch
            else if (branchname[branchname.length - 2] === 'feature')
                base = 'development';
            return yield PullRequest_1.PullRequest.CreateAsync(this.owner.login, this.name, title, head, base);
        });
    }
}
exports.Repository = Repository;
//# sourceMappingURL=Repository.js.map