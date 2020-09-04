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
exports.Release = void 0;
const Octokit_1 = require("../Services/Octokit");
class Release {
    /**
     * Create a release.
     * https://docs.github.com/en/rest/reference/repos#create-a-release
     * @param owner
     * @param repo
     * @param name
     * @param draft
     * @param prerelease
     */
    static CreateAsync(owner, repo, name, draft = false, prerelease = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('POST /repos/:owner/:repo/releases', {
                owner: owner,
                repo: repo,
                tag_name: name,
                name: name,
                draft: draft,
                prerelease: prerelease
            });
            if (response.status === 201)
                return response.data;
            throw new Error(`Could create release on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
    /**
     * List releases.
     * https://docs.github.com/en/rest/reference/repos#list-releases
     * @param owner
     * @param repo
     */
    static ListAsync(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield Octokit_1.octokit.request('GET /repos/:owner/:repo/releases', {
                owner: owner,
                repo: repo
            });
            if (response.status === 200)
                return response.data;
            throw new Error(`Could list releases on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
        });
    }
}
exports.Release = Release;
//# sourceMappingURL=Release.js.map