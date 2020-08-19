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
exports.Milestone = void 0;
const Octokit_1 = require("../Services/Octokit");
class Milestone {
    /**
     * List milestones.
     * https://docs.github.com/en/rest/reference/issues#list-milestones
     * @param owner
     * @param repo
     * @param state
     */
    static ListAsync(owner, repo, state = 'open') {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/milestones', {
                owner: owner,
                repo: repo,
                state: state
            });
            if (response.status === 200)
                return response.data;
            throw new Error(`Could not retrieve a list of milestones for repository "${repo}" of owner "${owner}"./n Octokit returned error ${response.status}.`);
        });
    }
}
exports.Milestone = Milestone;
//# sourceMappingURL=Milestone.js.map