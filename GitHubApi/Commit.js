"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commit = void 0;
const keywords = [
    'fixed', 'fixes', 'fix',
    'closed', 'closes', 'close',
    'resolved', 'resolves', 'resolve'
];
const regex = new RegExp('/#[1-9][0-9]*/');
class Commit {
    /** Check if there is a mention to an issue in the commit message. */
    IsIssueMentioned() {
        return this.commit.message.match(regex) === null ? false : true;
    }
    /** Return a list with all the issues mentioned. */
    GetMentions() {
        let message = this.commit.message.toLowerCase();
        let match = message.match(regex);
        let mentions;
        // Issue mention found
        while (match !== null) {
            let resolved = false;
            for (let keyword of keywords) {
                // Look for a closing keyword in the commit message up until the issue mention
                let keywordIndex = message.indexOf(keyword, undefined, match.index);
                if (keywordIndex !== -1) {
                    // Keyword was used just before issue was mentioned
                    if ((keywordIndex + keyword.length) === match.index - 2) {
                        resolved = true;
                        break;
                    }
                }
            }
            // Add keyword index to array
            mentions.skipDuplicatePush([+match[0], resolved]);
            // Trim the message to remove the current match
            message = message.substring(match.index + match[0].length);
            // Look for the next match
            match = message.match(regex);
        }
        return mentions;
    }
}
exports.Commit = Commit;
//# sourceMappingURL=Commit.js.map