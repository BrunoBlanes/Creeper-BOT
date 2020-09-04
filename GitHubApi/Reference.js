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
exports.Reference = void 0;
const Octokit_1 = require("../Services/Octokit");
class Reference {
    /**
     * List matching references.
     * https://docs.github.com/en/rest/reference/git#list-matching-references
     * @param owner
     * @param repo
     * @param ref
     */
    static ListAsync(owner, repo, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/git/matching-refs/:ref', {
                owner: owner,
                repo: repo,
                ref: ref
            });
            if (response.status === 200)
                return response.data;
            throw new Error(`Could list git references matching ${ref} on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * Create a reference.
     * https://docs.github.com/en/rest/reference/git#create-a-reference
     * @param owner
     * @param repo
     * @param refName
     * @param sha
     */
    static CreateAsync(owner, repo, refName, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('POST /repos/:owner/:repo/git/refs', {
                owner: owner,
                repo: repo,
                ref: refName,
                sha: sha
            });
            if (response.status === 201)
                return response.data;
            throw new Error(`Could not create git reference ${refName} on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
}
exports.Reference = Reference;
//# sourceMappingURL=Reference.js.map