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
const Reference_1 = require("./Reference");
const Release_1 = require("./Release");
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
     * Return a list of references for the current repo.
     * @param ref A matching reference name.
     */
    ListReferencesAsync(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Reference_1.Reference.ListAsync(this.owner.login, this.name, ref);
        });
    }
    /**
     * Create a new reference at this repo.
     * @param refName String of the name of the fully qualified reference (ie: refs/heads/master). If it doesn�t start with �refs� and have at least two slashes, it will be rejected.
     * @param sha String of the SHA1 value to set this reference to.
     */
    CreateReferenceAsync(refName, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Reference_1.Reference.CreateAsync(this.owner.login, this.name, refName, sha);
        });
    }
    /**
     * Create a new release on this repo.
     * @param name The name of the release.
     */
    CreateReleaseAsync(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Release_1.Release.CreateAsync(this.owner.login, this.name, name);
        });
    }
    /** Return a list of releases for the current repo. */
    ListReleasesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Release_1.Release.ListAsync(this.owner.login, this.name);
        });
    }
    /**
     * Create a pull request.
     * @param head The name of the branch where your changes are implemented.
     */
    CreatePullRequestAsync(head) {
        return __awaiter(this, void 0, void 0, function* () {
            let branchname = head.split('/');
            // Pulls from 'hotfix/*' or 'release/*' will be merged into 'master' branch
            if (branchname[branchname.length - 2] === 'hotfix' || branchname[branchname.length - 2] === 'release') {
                yield PullRequest_1.PullRequest.CreateAsync(this.owner.login, this.name, `Merge branch "${branchname[branchname.length - 2]}/${branchname.last()}" into "development"`, head, 'development');
                return yield PullRequest_1.PullRequest.CreateAsync(this.owner.login, this.name, `Merge branch "${branchname[branchname.length - 2]}/${branchname.last()}" into "master"`, head, 'master');
            }
            // Pulls from 'feature/*' will be merged into the 'development' branch
            else if (branchname[branchname.length - 2] === 'feature') {
                return yield PullRequest_1.PullRequest.CreateAsync(this.owner.login, this.name, `Merge branch "feature/${branchname.last()}" into "development"`, head, 'development');
            }
            else
                return null;
        });
    }
}
exports.Repository = Repository;
//# sourceMappingURL=Repository.js.map