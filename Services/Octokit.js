"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.octokit = void 0;
const auth_app_1 = require("@octokit/auth-app");
const core_1 = require("@octokit/core");
const Azure_1 = require("./Azure");
exports.octokit = new core_1.Octokit({
    authStrategy: auth_app_1.createAppAuth,
    auth: {
        id: 72569,
        privateKey: Azure_1.Azure.PrivateKey
    },
    previews: [
        'machine-man'
    ],
    userAgent: 'Creeper-Bot',
    timeZone: 'America/Sao_Paulo'
});
//# sourceMappingURL=Octokit.js.map